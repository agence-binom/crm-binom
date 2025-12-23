import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!

async function main() {
  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)

  console.log('⏳ Application des migrations...')
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('✅ Migrations appliquées avec succès !')

  await client.end()
}

main().catch((err) => {
  console.error('❌ Échec de la migration :', err)
  process.exit(1)
})
