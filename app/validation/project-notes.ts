import { z } from 'zod'

export const projectNoteContentMaxBytes = 1024 * 1024
// Compté en niveaux JSON bruts : chaque niveau de liste imbriquée en coûte 4 (liste, tableau,
// item, tableau), plus ~7 pour un lien en fond d'item. 200 laisse passer un plan d'une
// quarantaine de niveaux tout en bornant la récursion de extractProjectNoteText.
const PROJECT_NOTE_CONTENT_MAX_DEPTH = 200

// Parcours itératif : c'est justement la profondeur qu'on vérifie ici, une récursion sur un
// document malveillant ferait sauter la pile avant d'avoir pu le refuser.
const getJsonDepth = (value: unknown) => {
  let maxDepth = 0
  const stack: Array<[unknown, number]> = [[value, 1]]

  while (stack.length > 0) {
    const [current, depth] = stack.pop()!
    if (typeof current !== 'object' || current === null) continue

    maxDepth = Math.max(maxDepth, depth)
    if (maxDepth > PROJECT_NOTE_CONTENT_MAX_DEPTH) return maxDepth

    for (const child of Object.values(current)) stack.push([child, depth + 1])
  }

  return maxDepth
}

const projectNoteContentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(z.record(z.string(), z.unknown())).optional()
})
  .refine(content => getJsonDepth(content) <= PROJECT_NOTE_CONTENT_MAX_DEPTH, 'Le contenu de la note est trop imbriqué')
  .refine(content => new TextEncoder().encode(JSON.stringify(content)).length <= projectNoteContentMaxBytes, 'La note est trop volumineuse (1 Mo maximum)')

const projectNoteTitleSchema = z.string()
  .trim()
  .max(255, 'Le titre est trop long')
  .nullable()
  .transform(title => title || null)

// contentText n'est volontairement pas accepté : il est recalculé côté serveur depuis content,
// pour qu'un client ne puisse pas désynchroniser l'aperçu/la recherche du contenu réel.
export const projectNoteCreateSchema = z.object({
  title: projectNoteTitleSchema.optional(),
  content: projectNoteContentSchema.nullable().optional()
})

export const projectNoteUpdateSchema = z.object({
  // Valeur de updatedAt connue du client : le PATCH est refusé en 409 si la note a changé depuis.
  // Format UTC (suffixe Z) uniquement, celui que produit la sérialisation JSON d'une Date.
  updatedAt: z.iso.datetime('La date de dernière modification est invalide'),
  title: projectNoteTitleSchema.optional(),
  content: projectNoteContentSchema.nullable().optional()
}).refine(data => data.title !== undefined || data.content !== undefined, {
  message: 'Au moins un champ doit être fourni'
})

export const projectNoteIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

export const projectNoteListQuerySchema = z.object({
  q: z.string().trim().max(255, 'La recherche est trop longue').optional().transform(q => q || undefined)
})

export type ProjectNoteCreate = z.infer<typeof projectNoteCreateSchema>
export type ProjectNoteUpdate = z.infer<typeof projectNoteUpdateSchema>
export type ProjectNoteId = z.infer<typeof projectNoteIdSchema>
export type ProjectNoteListQuery = z.infer<typeof projectNoteListQuerySchema>
