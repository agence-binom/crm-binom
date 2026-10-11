import { createError } from 'h3'

// Codes stables exposés au site public dans `data.code` (docs/brief-api-contract.md) : le site
// choisit sa page d'erreur sur ce code, jamais sur le libellé, qui peut changer.
const briefLinkErrors = {
  not_found: { statusCode: 404, statusMessage: 'Lien de brief introuvable', code: 'brief_not_found' },
  expired: { statusCode: 410, statusMessage: 'Lien de brief expiré', code: 'brief_expired' },
  completed: { statusCode: 409, statusMessage: 'Brief déjà envoyé', code: 'brief_already_completed' }
} as const

export const briefLinkError = (reason: keyof typeof briefLinkErrors) => {
  const { statusCode, statusMessage, code } = briefLinkErrors[reason]
  return createError({ statusCode, statusMessage, data: { code } })
}
