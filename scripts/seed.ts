import 'dotenv/config'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const seedPath = resolve(rootDir, 'supabase/seed.sql')

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL. Set it in .env before seeding.')
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 })

try {
  console.log('⏳ Seed de la base de données...')
  await sql.file(seedPath)
  console.log('✅ Seed appliqué avec succès !')
} finally {
  await sql.end({ timeout: 1 })
}
