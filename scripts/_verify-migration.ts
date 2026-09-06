import 'dotenv/config'
import postgres from 'postgres'

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })

  const documents = await sql`SELECT count(*) FROM documents`
  const billingDocuments = await sql`SELECT id, "projectId", "documentType", "subtype", "status", "documentId" FROM billing_documents ORDER BY id`
  const columns = await sql`SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'documents' ORDER BY ordinal_position`

  console.log('documents count:', documents[0].count)
  console.log('documents columns:', columns)
  console.log('billing_documents rows:', billingDocuments)

  await sql.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
