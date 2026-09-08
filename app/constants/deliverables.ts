export const deliverableTypes = [
  'document',
  'link',
  'text'
] as const

export type DeliverableType = typeof deliverableTypes[number]
