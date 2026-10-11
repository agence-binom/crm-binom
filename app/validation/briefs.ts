import { z } from 'zod'
import {
  briefAnswerStatuses,
  defaultBriefExpiresInDays,
  maxBriefExpiresInDays
} from '../constants/briefs'

export const briefIdSchema = z.object({
  id: z.coerce.number().int('L\'ID doit être un entier').positive('L\'ID doit être positif')
})

// 32 octets en base64url = 43 caractères. La borne haute laisse de la marge sans accepter
// n'importe quoi dans une URL qui finit en clause WHERE.
export const briefTokenSchema = z.object({
  token: z.string().regex(/^[\w-]{32,64}$/, 'Lien invalide')
})

export const briefCreateSchema = z.object({
  contactId: z.number().int().positive().nullable().optional(),
  // Absent = le projet sera créé à la réception du brief.
  projectId: z.number().int().positive().nullable().optional(),
  expiresInDays: z.number().int().min(1).max(maxBriefExpiresInDays).default(defaultBriefExpiresInDays)
})

export const briefRegenerateSchema = briefCreateSchema.pick({ expiresInDays: true })

const briefAnswerValueSchema = z.union([
  z.string().max(10_000),
  z.number(),
  z.boolean(),
  z.array(z.string().max(1_000)).max(100),
  z.null()
])

// Le site envoie le libellé et la section de chaque question : le CRM peut ainsi afficher une
// question qu'il ne connaît pas encore (formulaire qui évolue) sans aucune mise à jour de code.
export const briefAnswerSchema = z.object({
  id: z.string().min(1).max(100),
  section: z.string().max(200).nullable().optional(),
  label: z.string().min(1).max(500),
  status: z.enum(briefAnswerStatuses),
  value: briefAnswerValueSchema.optional()
})

export const briefSubmissionSchema = z.object({
  formVersion: z.string().min(1).max(50),
  answers: z.array(briefAnswerSchema).max(200)
}).refine(
  data => new Set(data.answers.map(answer => answer.id)).size === data.answers.length,
  { message: 'Chaque question ne peut apparaître qu\'une fois', path: ['answers'] }
)

export const briefAttachSchema = z.object({
  projectId: z.number().int().positive()
})

export type BriefCreate = z.infer<typeof briefCreateSchema>
export type BriefAnswer = z.infer<typeof briefAnswerSchema>
export type BriefAnswerValue = z.infer<typeof briefAnswerValueSchema>
export type BriefSubmission = z.infer<typeof briefSubmissionSchema>
