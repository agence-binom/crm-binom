import 'dotenv/config'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const seedPath = resolve(rootDir, 'supabase/seed.sql')

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL. Set it in .env before seeding.')
}

const seedHostname = new URL(process.env.DATABASE_URL).hostname
const isLocalHost = seedHostname === 'localhost' || seedHostname === '127.0.0.1'

if (!isLocalHost && !process.argv.includes('--force')) {
  throw new Error(
    `DATABASE_URL pointe vers "${seedHostname}", pas vers une base locale. `
    + 'Ce seed insère un compte admin avec un mot de passe faible et connu (voir supabase/seed.sql) : '
    + 'ne jamais le rejouer sur staging/prod. Si c\'est volontaire, relancez avec --force.'
  )
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 })

// Comptes de test utilisables pour se connecter en local (mot de passe uniquement, jamais exposé
// dans l'UI réelle - voir emailAndPassword dans server/lib/better-auth.ts). Créés via l'API Better
// Auth plutôt qu'en SQL brut : seule façon fiable d'obtenir un hash de mot de passe compatible
// avec la vérification faite par Better Auth au login.
const TEST_ACCOUNTS = [
  { email: 'admin@crmbinom.test', name: 'Alice Admin' },
  { email: 'employee@crmbinom.test', name: 'Eric Employé' },
  { email: 'client@crmbinom.test', name: 'Camille Client' },
  { email: 'jean.dupont@atelier-dupont.fr', name: 'Jean Dupont' },
  { email: 'marie.petit@atelier-dupont.fr', name: 'Marie Petit' }
]
const TEST_ACCOUNT_PASSWORD = 'password123'

try {
  console.log('⏳ Seed de la base de données...')
  await sql.file(seedPath)

  console.log('⏳ Création des comptes de connexion de test...')
  // better-auth.ts importe app/db (une connexion postgres.js distincte de `sql` ci-dessus) - à
  // fermer explicitement nous-mêmes sous peine de laisser le process tourner indéfiniment après
  // la fin du script (la connexion ouverte maintient l'event loop active).
  const { auth } = await import('../server/lib/better-auth')
  const { client: authDbClient } = await import('../app/db')

  try {
    for (const account of TEST_ACCOUNTS) {
      await auth.api.signUpEmail({ body: { ...account, password: TEST_ACCOUNT_PASSWORD } })
    }
  } finally {
    await authDbClient.end({ timeout: 1 })
  }

  console.log('✅ Seed appliqué avec succès !')
} finally {
  await sql.end({ timeout: 1 })
}
