export type TimeEntry = {
  id: number
  taskId: number | null
  userId: number | null
  notes: string | null
  duration: number | null
  createdAt: string
  updatedAt: string
}
