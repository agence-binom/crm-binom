export const resourceTypes = [
  'document',
  'link',
  'text'
] as const

export type ResourceType = typeof resourceTypes[number]
