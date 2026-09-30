type EditorNode = {
  type?: unknown
  text?: unknown
  content?: unknown
}

const EXCERPT_MAX_LENGTH = 160
const UNTITLED_NOTE_LABEL = 'Sans titre'

const isEditorNode = (value: unknown): value is EditorNode => typeof value === 'object' && value !== null

const isInlineNode = (node: EditorNode) => node.type === 'text' || node.type === 'hardBreak'

// Un bloc de texte (paragraphe, titre...) concatène ses nœuds inline ; un conteneur (doc, liste,
// citation...) sépare ses blocs enfants par un retour à la ligne. C'est ce qui garantit que la
// première ligne de contentText correspond bien au premier bloc affiché dans l'éditeur.
const editorNodeToText = (node: EditorNode): string => {
  if (node.type === 'text') return typeof node.text === 'string' ? node.text : ''
  if (node.type === 'hardBreak') return '\n'

  const children = Array.isArray(node.content) ? node.content.filter(isEditorNode) : []
  if (children.some(isInlineNode)) return children.map(editorNodeToText).join('')

  return children.map(editorNodeToText).filter(Boolean).join('\n')
}

export const extractProjectNoteText = (content: unknown) => {
  if (!isEditorNode(content)) return null
  return editorNodeToText(content).trim() || null
}

const getNonEmptyLines = (contentText: string | null) => (contentText ?? '')
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean)

export const getProjectNoteDisplayTitle = (note: { title: string | null, contentText: string | null }) => (
  note.title?.trim() || getNonEmptyLines(note.contentText)[0] || UNTITLED_NOTE_LABEL
)

const normalizeSearchText = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

// L'extrait est tronqué côté serveur : ce filtre ne voit pas la fin des notes longues. Suffisant
// pour retrouver une note parmi une dizaine ; au-delà, passer par le paramètre ?q= de l'API.
export const filterProjectNotes = <T extends { displayTitle: string, excerpt: string | null, authorName: string | null }>(notes: T[], query: string) => {
  const needle = normalizeSearchText(query.trim())
  if (!needle) return notes

  return notes.filter(note => normalizeSearchText([note.displayTitle, note.excerpt, note.authorName].filter(Boolean).join(' ')).includes(needle))
}

// Sans titre explicite, la première ligne sert déjà de titre : on ne la répète pas dans l'aperçu.
export const getProjectNoteExcerpt = (note: { title: string | null, contentText: string | null }) => {
  const lines = getNonEmptyLines(note.contentText)
  const excerpt = (note.title?.trim() ? lines : lines.slice(1)).join(' ')
  if (!excerpt) return null

  return excerpt.length > EXCERPT_MAX_LENGTH ? `${excerpt.slice(0, EXCERPT_MAX_LENGTH).trimEnd()}…` : excerpt
}
