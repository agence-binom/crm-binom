import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is required to run production migrations.')
  process.exit(1)
}

const client = postgres(connectionString, { max: 1 })
const db = drizzle(client)

try {
  console.log('Applying database migrations...')
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Database migrations applied.')
} catch (error) {
  console.error('Production migration failed:', error)
  process.exitCode = 1
} finally {
  await client.end()
}

if (process.exitCode) {
  process.exit(process.exitCode)
}
