import { z } from 'zod'

export const resourceAcceptedMimeTypes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
] as const

export const resourceMaxSizeBytes = 10 * 1024 * 1024
export const resourceFileInputAccept = resourceAcceptedMimeTypes.join(',')

// A resource link is rendered as a clickable href straight from the database (ResourcesCard, both
// in the admin app and the client portal) - restricting to http/https at the schema level is what
// stops a `javascript:`/`data:` URL from ever being persisted and later executed on click.
const isHttpUrl = (value: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

const resourceUrlSchema = z.url('Le lien doit être une URL valide')
  .max(2048, 'Le lien est trop long')
  .refine(isHttpUrl, 'Le lien doit utiliser le protocole http ou https')

const resourceNameSchema = z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long')
const resourceProjectIdSchema = z.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif')

const resourceLinkCreateSchema = z.object({
  type: z.literal('link'),
  projectId: resourceProjectIdSchema,
  name: resourceNameSchema,
  description: z.string().optional().or(z.literal('')),
  url: resourceUrlSchema
})

const resourceTextCreateSchema = z.object({
  type: z.literal('text'),
  projectId: resourceProjectIdSchema,
  name: resourceNameSchema,
  description: z.string().optional().or(z.literal('')),
  content: z.string().min(1, 'Le contenu est requis')
})

export const resourceCreateSchema = z.discriminatedUnion('type', [
  resourceLinkCreateSchema,
  resourceTextCreateSchema
])

export const resourceUploadMetadataSchema = z.object({
  projectId: z.coerce.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif'),
  name: z.string().trim().max(255, 'Le nom est trop long').optional().or(z.literal('')),
  description: z.string().trim().max(1000, 'La description est trop longue').optional().or(z.literal(''))
})

// Schémas des modals de ressource (agence et portail), qui portent les trois types dans un seul
// formulaire alors que le serveur expose deux routes distinctes.
//
// `resourceCreateSchema` n'a pas de branche 'document' : un document se crée uniquement via la
// route multipart /upload, jamais par POST JSON - d'où la réutilisation ici du schéma de cette
// route pour la branche manquante, plutôt qu'une recopie qui dériverait.
//
// Cette branche reste laxiste sur `name` à la création : il peut être vide quand plusieurs
// fichiers sont sélectionnés (chaque ressource est alors nommée d'après son fichier). La présence
// du fichier lui-même est une contrainte sur un File[], que les modals vérifient séparément.
const resourceDocumentFormSchema = resourceUploadMetadataSchema.extend({
  type: z.literal('document')
})

export const resourceCreateFormSchema = z.discriminatedUnion('type', [
  resourceDocumentFormSchema,
  resourceLinkCreateSchema,
  resourceTextCreateSchema
])

// L'édition ne peut pas réutiliser `resourceUpdateSchema` : le formulaire porte toujours `url` et
// `content` quel que soit le type de la ressource, et resourceUpdateSchema valide celui des deux
// qui est présent - le champ masqué par le type courant (ex: `url: ''` en éditant une note)
// échouerait alors qu'il n'est jamais soumis. Discriminer sur `type` ne valide que le champ utile.
export const resourceEditFormSchema = z.discriminatedUnion('type', [
  resourceDocumentFormSchema.omit({ projectId: true }).extend({ name: resourceNameSchema }),
  resourceLinkCreateSchema.omit({ projectId: true }),
  resourceTextCreateSchema.omit({ projectId: true })
])

export const resourceUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long').optional(),
  description: z.string().optional().or(z.literal('')),
  url: resourceUrlSchema.optional(),
  content: z.string().min(1, 'Le contenu ne peut pas être vide').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être fourni'
})

export const resourceIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export const resourceListQuerySchema = z.object({
  projectId: z.coerce.number().int('L\'ID projet doit être un entier').positive('L\'ID projet doit être positif').optional()
})

export type ResourceCreate = z.infer<typeof resourceCreateSchema>
export type ResourceUpdate = z.infer<typeof resourceUpdateSchema>
export type ResourceId = z.infer<typeof resourceIdSchema>
export type ResourceUploadMetadata = z.infer<typeof resourceUploadMetadataSchema>
