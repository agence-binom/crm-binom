import { randomUUID } from 'node:crypto'
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { eq } from 'drizzle-orm'
import { createError, type H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import { db } from '~/db'
import { clientsTable } from '~/db/schema/clients'
import { projectsTable } from '~/db/schema/projects'
import { tasksTable } from '~/db/schema/tasks'
import { getDocumentValidationError, sanitizeDocumentFilename, sanitizeDocumentPathSegment } from '~~/server/lib/documents-upload'
import { translateStorageError } from '~/lib/utils'

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

let cachedStorageClient: S3Client | undefined

const getStorageClient = (event: H3Event) => {
  if (cachedStorageClient) {
    return cachedStorageClient
  }

  const { s3Endpoint, s3Region, s3AccessKeyId, s3SecretAccessKey } = useRuntimeConfig(event)

  if (!s3Endpoint || !s3AccessKeyId || !s3SecretAccessKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Le storage documents requiert NUXT_S3_ENDPOINT, NUXT_S3_ACCESS_KEY_ID et NUXT_S3_SECRET_ACCESS_KEY côté serveur'
    })
  }

  cachedStorageClient = new S3Client({
    endpoint: s3Endpoint,
    region: s3Region || 'garage',
    forcePathStyle: true,
    credentials: {
      accessKeyId: s3AccessKeyId,
      secretAccessKey: s3SecretAccessKey
    }
  })

  return cachedStorageClient
}

const formatStorageErrorMessage = (error: unknown) =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error)

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
  resource: 'ressources',
  deliverable: 'livrables'
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
  const client = getStorageClient(event)
  const bucket = getStorageBucket(event)
  const fileBuffer = new Uint8Array(await file.arrayBuffer())

  try {
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: filepath,
      Body: fileBuffer,
      ContentType: file.type,
      CacheControl: '3600'
    }))
  } catch (error) {
    const message = formatStorageErrorMessage(error)
    throw createError({
      statusCode: 500,
      statusMessage: `Impossible de téléverser le document: ${translateStorageError(message) ?? message}`
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

  const client = getStorageClient(event)
  const bucket = getStorageBucket(event)

  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: filepath }))
  } catch (error) {
    const message = formatStorageErrorMessage(error)
    throw createError({
      statusCode: 500,
      statusMessage: `Impossible de supprimer le fichier stocké: ${translateStorageError(message) ?? message}`
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

  const client = getStorageClient(event)
  const bucket = getStorageBucket(event)

  try {
    return await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: filepath }),
      { expiresIn: DOCUMENT_SIGNED_URL_TTL_SECONDS }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[documents] Impossible de générer le lien de téléchargement pour "${filepath}": ${message}`)
    return null
  }
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
