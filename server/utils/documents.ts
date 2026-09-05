import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { createError, type H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'
import { projectsTable } from '~/db/schema/projects'
import { tasksTable } from '~/db/schema/tasks'
import { getDocumentValidationError, sanitizeDocumentFilename, sanitizeDocumentPathSegment } from '~~/server/lib/documents-upload'
import { translateSupabaseError } from '~/lib/utils'

const DOCUMENT_SIGNED_URL_TTL_SECONDS = 60 * 60

type DocumentWithPath = {
  filepath: string | null
}

const isExternalUrl = (filepath: string | null) => Boolean(filepath && /^https?:\/\//.test(filepath))

const isManagedStoragePath = (filepath: string | null) => Boolean(
  filepath
  && !filepath.startsWith('/')
  && !isExternalUrl(filepath)
)

const getStorageBucket = (event: H3Event) => useRuntimeConfig(event).documentsBucket

const getReadableStorageClient = async (event: H3Event) => {
  try {
    return serverSupabaseServiceRole(event)
  } catch {
    return await serverSupabaseClient(event)
  }
}

const getPrivilegedStorageClient = (event: H3Event) => {
  try {
    return serverSupabaseServiceRole(event)
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Le storage documents requiert SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_KEY côté serveur'
    })
  }
}

export const assertValidDocumentFile = (file: File) => {
  const errorMessage = getDocumentValidationError(file)
  if (errorMessage) {
    throw createError({
      statusCode: 400,
      statusMessage: errorMessage
    })
  }
}

const DOCUMENT_TYPE_FOLDERS: Record<string, string> = {
  quote: 'devis',
  invoice: 'factures',
  commercial_proposal: 'propositions-commerciales',
  client: 'clients',
  project: 'projets',
  task: 'taches',
  resource: 'ressources'
}

const getClientStorageSegment = async (entityType: string, entityId: number) => {
  if (entityType === 'client') {
    const [client] = await db
      .select({ name: clientsTable.name })
      .from(clientsTable)
      .where(eq(clientsTable.id, entityId))

    return client?.name
  }

  if (entityType === 'project') {
    const [project] = await db
      .select({ clientName: clientsTable.name })
      .from(projectsTable)
      .innerJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
      .where(eq(projectsTable.id, entityId))

    return project?.clientName
  }

  if (entityType === 'task') {
    const [task] = await db
      .select({ clientName: clientsTable.name })
      .from(tasksTable)
      .innerJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
      .innerJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
      .where(eq(tasksTable.id, entityId))

    return task?.clientName
  }

  return null
}

export const buildDocumentStoragePath = async (
  entityType: string,
  entityId: number,
  filename: string,
  documentType?: string
) => {
  const clientName = await getClientStorageSegment(entityType, entityId)

  if (!clientName) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Impossible de déterminer le client lié au document'
    })
  }

  const clientSegment = sanitizeDocumentPathSegment(clientName)
  const effectiveType = documentType || entityType
  const typeSegment = DOCUMENT_TYPE_FOLDERS[effectiveType] || sanitizeDocumentPathSegment(effectiveType)

  return `${clientSegment}/${typeSegment}/${sanitizeDocumentFilename(filename, randomUUID())}`
}

export const uploadDocumentFile = async (
  event: H3Event,
  filepath: string,
  file: File
) => {
  const client = getPrivilegedStorageClient(event)
  const bucket = getStorageBucket(event)
  const fileBuffer = new Uint8Array(await file.arrayBuffer())

  const { error } = await client.storage
    .from(bucket)
    .upload(filepath, fileBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Impossible de téléverser le document: ${translateSupabaseError(error.message) ?? error.message}`
    })
  }
}

export const deleteStoredDocumentFile = async (
  event: H3Event,
  filepath: string | null
) => {
  if (!filepath || !isManagedStoragePath(filepath)) {
    return
  }

  const client = getPrivilegedStorageClient(event)
  const bucket = getStorageBucket(event)
  const { error } = await client.storage.from(bucket).remove([filepath])

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Impossible de supprimer le fichier stocké: ${translateSupabaseError(error.message) ?? error.message}`
    })
  }
}

export const deleteUploadedDocumentIfExists = async (
  event: H3Event,
  filepath: string | null
) => {
  try {
    await deleteStoredDocumentFile(event, filepath)
  } catch {
    // Best effort cleanup after a database failure.
  }
}

const resolveDocumentDownloadUrl = async (
  event: H3Event,
  filepath: string | null
) => {
  if (isExternalUrl(filepath)) {
    return filepath
  }

  if (!filepath || !isManagedStoragePath(filepath)) {
    return null
  }

  const client = await getReadableStorageClient(event)
  const bucket = getStorageBucket(event)
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(filepath, DOCUMENT_SIGNED_URL_TTL_SECONDS)

  if (error) {
    console.error(`[documents] Impossible de générer le lien de téléchargement pour "${filepath}": ${error.message}`)
    return null
  }

  return data.signedUrl
}

export const withDocumentDownloadUrl = async <T extends DocumentWithPath>(
  event: H3Event,
  document: T
) => ({
  ...document,
  downloadUrl: await resolveDocumentDownloadUrl(event, document.filepath)
})

export const withDocumentsDownloadUrls = async <T extends DocumentWithPath>(
  event: H3Event,
  documents: T[]
) => Promise.all(documents.map(document => withDocumentDownloadUrl(event, document)))

type TypedDocumentWithOptionalPath = {
  type: string
  filepath: string | null
}

export const withOptionalDocumentDownloadUrls = async <T extends TypedDocumentWithOptionalPath>(
  event: H3Event,
  items: T[]
) => Promise.all(items.map(async (item) => {
  if (item.type !== 'document' || !item.filepath) {
    return { ...item, downloadUrl: null }
  }

  return withDocumentDownloadUrl(event, { ...item, filepath: item.filepath })
}))
