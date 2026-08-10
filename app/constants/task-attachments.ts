export const taskAttachmentTypes = [
  'document',
  'link'
] as const

export type TaskAttachmentType = typeof taskAttachmentTypes[number]
