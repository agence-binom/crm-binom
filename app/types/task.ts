export type Task = {
  id: number
  projectId: number | null
  assignedTo: number | null
  title: string
  notes: string | null
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
  updatedAt: string
}
