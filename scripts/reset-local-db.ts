import 'dotenv/config'
import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL. Set it in .env before resetting the database.')
}

const hostname = new URL(process.env.DATABASE_URL).hostname
const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1'

if (!isLocalHost && !process.argv.includes('--force')) {
  throw new Error(
    `DATABASE_URL pointe vers "${hostname}", pas vers une base locale. `
    + 'Ce script supprime la totalité du schéma public : ne jamais le lancer sur staging/prod. '
    + 'Si c\'est volontaire, relancez avec --force.'
  )
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 })

try {
  console.log('⏳ Réinitialisation du schéma local...')

  // Un `drop database` est impossible ici : les scripts d'init de l'image supabase/postgres
  // ciblent la base `postgres` en dur, la recréer la laisserait sans rôles ni extensions. On
  // repart donc des schémas. `drizzle` porte la table __drizzle_migrations : sans ce drop,
  // db:migrate considérerait le schéma déjà à jour et ne rejouerait rien.
  await sql.unsafe(`
    drop schema if exists public cascade;
    create schema public;
    drop schema if exists drizzle cascade;
  `)

  console.log('✅ Schéma réinitialisé. Enchaîner avec db:migrate puis db:seed.')
} finally {
  await sql.end({ timeout: 1 })
}
