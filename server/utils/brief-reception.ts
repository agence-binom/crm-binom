import { eq } from 'drizzle-orm'
import { projectBriefsTable } from '~/db/schema/project-briefs'
import { projectsTable } from '~/db/schema/projects'
import type { BriefBudgetRange, BriefProjectType } from '~/constants/briefs'
import { buildProjectFieldsFromBrief, getEmptyProjectFieldsFromBrief } from '~/lib/brief-project'
import { presaleProjectStatus } from '~/lib/projects'
import type { BriefRow, Transaction } from './briefs'

const toProjectValues = (fields: { description?: string | null, url?: string | null, endDate?: string | null, notes?: string | null }) => ({
  ...(fields.description !== undefined ? { description: fields.description } : {}),
  ...(fields.url !== undefined ? { url: fields.url?.slice(0, 255) ?? null } : {}),
  ...(fields.endDate !== undefined ? { endDate: fields.endDate ? new Date(fields.endDate) : null } : {}),
  ...(fields.notes !== undefined ? { notes: fields.notes } : {})
})

// Appelé dans la transaction qui marque le brief complété : si la création ou la mise à jour du projet
// échoue, la soumission entière est annulée et le site peut la renvoyer - jamais de brief complété
// sans son projet.
export const attachCompletedBriefToProject = async (tx: Transaction, brief: BriefRow) => {
  const fields = buildProjectFieldsFromBrief({
    summary: brief.summary,
    projectType: brief.projectType as BriefProjectType | null,
    budgetRange: brief.budgetRange as BriefBudgetRange | null,
    deadline: brief.deadline,
    domain: brief.domain
  })

  if (brief.target === 'existing_project' && brief.projectId) {
    // FOR UPDATE : sans verrou, une saisie du staff entre cette lecture et l'écriture ci-dessous
    // serait écrasée par la réponse du prospect, alors que seuls les champs vides doivent l'être.
    const [project] = await tx
      .select({ description: projectsTable.description, url: projectsTable.url, endDate: projectsTable.endDate, notes: projectsTable.notes })
      .from(projectsTable)
      .where(eq(projectsTable.id, brief.projectId))
      .for('update')

    if (project) {
      const { updates, appliedFields } = getEmptyProjectFieldsFromBrief(project, fields)
      if (appliedFields.length > 0) {
        await tx.update(projectsTable)
          .set({ ...toProjectValues(updates), updatedAt: new Date() })
          .where(eq(projectsTable.id, brief.projectId))
      }
      await tx.update(projectBriefsTable).set({ appliedFields }).where(eq(projectBriefsTable.id, brief.id))
      return { projectId: brief.projectId, created: false }
    }
  }

  const [project] = await tx.insert(projectsTable).values({
    clientId: brief.clientId,
    name: fields.name,
    ...toProjectValues(fields),
    status: presaleProjectStatus,
    createdBy: brief.createdBy
  }).returning({ id: projectsTable.id })

  await tx.update(projectBriefsTable)
    .set({ projectId: project!.id, target: 'new_project' })
    .where(eq(projectBriefsTable.id, brief.id))

  return { projectId: project!.id, created: true }
}
