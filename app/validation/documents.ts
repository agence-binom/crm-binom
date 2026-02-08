import { z } from 'zod'

export const documentCreateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  filename: z.string().min(1, 'Le nom du fichier est requis').max(255, 'Le nom du fichier est trop long'),
  filepath: z.string().min(1, 'Le chemin est requis').max(500, 'Le chemin est trop long'),
  mimetype: z.string().min(1, 'Le type MIME est requis').max(100, 'Le type MIME est trop long'),
  size: z.number().int('La taille doit être un entier').positive('La taille doit être positive'),
  entityType: z.enum(['quote', 'invoice', 'project', 'client', 'task'], {
    message: 'Le type d\'entité doit être "quote", "invoice", "project", "client" ou "task"'
  }),
  entityId: z.number().int('L\'ID entité doit être un entier').positive('L\'ID entité doit être positif'),
  description: z.string().optional().or(z.literal(''))
})

export const documentUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom ne peut pas être vide').max(255, 'Le nom est trop long').optional(),
  filename: z.string().min(1, 'Le nom du fichier ne peut pas être vide').max(255, 'Le nom du fichier est trop long').optional(),
  filepath: z.string().min(1, 'Le chemin ne peut pas être vide').max(500, 'Le chemin est trop long').optional(),
  mimetype: z.string().min(1, 'Le type MIME ne peut pas être vide').max(100, 'Le type MIME est trop long').optional(),
  size: z.number().int('La taille doit être un entier').positive('La taille doit être positive').optional(),
  entityType: z.enum(['quote', 'invoice', 'project', 'client', 'task'], {
    message: 'Le type d\'entité doit être "quote", "invoice", "project", "client" ou "task"'
  }).optional(),
  entityId: z.number().int('L\'ID entité doit être un entier').positive('L\'ID entité doit être positif').optional(),
  description: z.string().optional().or(z.literal(''))
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Au moins un champ doit être fourni' }
)

export const documentIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export type DocumentCreate = z.infer<typeof documentCreateSchema>
export type DocumentUpdate = z.infer<typeof documentUpdateSchema>
export type DocumentId = z.infer<typeof documentIdSchema>
