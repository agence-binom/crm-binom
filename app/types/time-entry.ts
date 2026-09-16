export type TimeEntry = {
  id: number
  taskId: number | null
  projectId: number | null
  userId: number | null
  notes: string | null
  duration: number
  createdBy: number | null
  updatedBy: number | null
  createdAt: string
  updatedAt: string
}
