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

try {
  console.log('⏳ Seed de la base de données...')
  await sql.file(seedPath)
  console.log('✅ Seed appliqué avec succès !')
} finally {
  await sql.end({ timeout: 1 })
}
