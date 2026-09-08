import { Resend } from 'resend'

// Un seul point d'envoi mail pour toute l'app (magic-link, futur renvoi d'invitation portail) —
// pas deux mécanismes différents comme avant (Supabase Auth gérait ça en interne, invisible ici).
// process.env directement (pas useRuntimeConfig) : ce fichier est aussi importé par
// scripts/seed.ts via tsx, hors du build Nuxt.
const MAIL_FROM = 'Agence binōm <contact@agence-binom.fr>'

let resendClient: Resend | null = null

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY est requis pour envoyer des emails')
  }

  resendClient ??= new Resend(apiKey)
  return resendClient
}

export const sendMagicLinkEmail = async (email: string, url: string) => {
  const { error } = await getResendClient().emails.send({
    from: MAIL_FROM,
    to: email,
    subject: 'Votre lien de connexion binōm',
    text: `Cliquez sur ce lien pour vous connecter : ${url}\n\nCe lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`
  })

  if (error) {
    throw new Error(`Impossible d'envoyer l'email de connexion: ${error.message}`)
  }
}
