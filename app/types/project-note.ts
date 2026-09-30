// Document ProseMirror/TipTap tel que sérialisé par editor.getJSON() - structure laissée ouverte,
// seul l'éditeur l'interprète.
export type ProjectNoteContent = {
  type: 'doc'
  content?: Record<string, unknown>[]
}

export type ProjectNote = {
  id: number
  projectId: number
  title: string | null
  content: ProjectNoteContent | null
  contentText: string | null
  createdBy: number | null
  updatedBy: number | null
  createdAt: string
  updatedAt: string
}

// Ligne de liste : pas de content, trop lourd pour afficher des dizaines de notes.
export type ProjectNoteSummary = Omit<ProjectNote, 'content' | 'contentText'> & {
  displayTitle: string
  excerpt: string | null
  authorName: string | null
}
