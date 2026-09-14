import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { magicLink } from 'better-auth/plugins'
import { and, eq, sql } from 'drizzle-orm'
// Imports relatifs (pas les alias ~/#imports) : ce fichier doit pouvoir être importé aussi bien
// depuis le serveur Nitro que depuis scripts/seed.ts (exécuté via tsx, hors du build Nuxt, où ces
// alias n'existent pas).
import { db } from '../../app/db'
import { authAccountTable, authSessionTable, authUserTable, authVerificationTable } from '../../app/db/schema/auth'
import { usersTable } from '../../app/db/schema/users'
import { contactsTable } from '../../app/db/schema/contacts'
import { normalizeEmailAddress } from './auth-users'
import { sendMagicLinkEmail } from './mail'

// Requêtes directes plutôt que d'importer server/utils/auth.ts et server/utils/client-portal.ts
// (qui importent eux-mêmes `auth` depuis ce fichier pour vérifier une session) - ça évite une
// dépendance circulaire entre ce fichier et les utils qui consomment l'instance Better Auth.
const isKnownAuthorizedEmail = async (email: string) => {
  const normalizedEmail = normalizeEmailAddress(email)

  const [appUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(sql`lower(${usersTable.email}) = ${normalizedEmail}`)
    .limit(1)
  if (appUser) return true

  const [portalContact] = await db
    .select({ id: contactsTable.id })
    .from(contactsTable)
    .where(and(
      eq(contactsTable.portalStatus, 'active'),
      eq(contactsTable.archived, false),
      sql`lower(${contactsTable.email}) = ${normalizedEmail}`
    ))
    .limit(1)

  return Boolean(portalContact)
}

// Deux populations distinctes se connectent avec le même flux magic-link (staff `public.users` et
// contacts portail `public.contacts`) - le sendMagicLink ci-dessous est le seul point qui décide
// si un email a le droit de recevoir un lien. Defense in depth : Supabase bloquait déjà les emails
// inconnus au niveau de l'envoi réel (shouldCreateUser: false), pas seulement côté client
// (authorize-email.post.ts) - on reproduit cette garantie ici plutôt que de faire confiance au seul
// check client.
export const auth = betterAuth({
  baseURL: process.env.NUXT_PUBLIC_SITE_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: authUserTable,
      session: authSessionTable,
      account: authAccountTable,
      verification: authVerificationTable
    }
  }),
  // Jamais exposé dans l'UI réelle (magic-link uniquement, voir app/pages/login.vue) - sert
  // uniquement de raccourci pour créer/authentifier les comptes de test (scripts/seed.ts,
  // e2e/helpers/better-auth-session.ts) sans dépendre du magic-link en local/CI. Même principe que
  // le mot de passe Supabase de test qu'on avait avant, désactivé en production par prudence même
  // si rien ne l'expose côté UI.
  emailAndPassword: {
    enabled: process.env.NODE_ENV !== 'production'
  },
  plugins: [
    magicLink({
      disableSignUp: true, // jamais d'auto-inscription - équivalent exact de shouldCreateUser: false
      expiresIn: 60 * 60, // aligné sur le comportement OTP Supabase actuel
      sendMagicLink: async ({ email, url }) => {
        if (!(await isKnownAuthorizedEmail(email))) return // réponse générique renvoyée quand même côté client, pas de fuite d'existence

        await sendMagicLinkEmail(email, url)
      }
    })
  ]
})
