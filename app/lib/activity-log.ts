import type { ActivityAction, ActivityEntityType } from '~/validation/activity-log'

// Labels/couleurs d'affichage pour le journal d'activité (app/pages/agence/journal.vue) - même
// convention que billingDocumentTypeLabels dans app/lib/documents.ts.
export const activityEntityLabels: Record<ActivityEntityType, string> = {
  client: 'Client',
  contact: 'Contact',
  project: 'Projet',
  task: 'Tâche',
  resource: 'Ressource',
  document: 'Document',
  billing_document: 'Document de facturation',
  deliverable: 'Livrable',
  task_attachment: 'Pièce jointe',
  user: 'Utilisateur'
}

export const activityActionLabels: Record<ActivityAction, string> = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression'
}

export const activityActionColors: Record<ActivityAction, 'success' | 'info' | 'error'> = {
  create: 'success',
  update: 'info',
  delete: 'error'
}
