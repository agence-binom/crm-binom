import 'dotenv/config'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Prépare le Garage de compose.dev.yml pour l'app : rôle du nœud, bucket documents, clé d'accès.
// Idempotent, rejoué à chaque `npm run db:up`. Garage n'a rien de tout ça au premier démarrage, et
// la clé est générée par Garage lui-même : elle ne peut donc pas être écrite d'avance dans
// .env.example, d'où la mise à jour de .env à la fin.

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const composeFile = resolve(rootDir, 'compose.dev.yml')
const envPath = resolve(rootDir, '.env')

const KEY_NAME = 'crm-binom-dev'
const DEFAULT_BUCKET = 'documents'
const LOCAL_ENDPOINT = 'http://localhost:3900'

const isPlaceholder = (value: string | undefined) => !value || value.startsWith('<')

const garage = (...args: string[]) => execFileSync(
  'docker',
  ['compose', '-f', composeFile, 'exec', '-T', 'garage', '/garage', ...args],
  // stderr ignoré : Garage y écrit ses logs de connexion à chaque commande.
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
)

const garageSucceeds = (...args: string[]) => {
  try {
    garage(...args)
    return true
  } catch {
    return false
  }
}

const ensureLayout = () => {
  if (!/Current cluster layout version: 0\b/.test(garage('layout', 'show'))) return

  const nodeId = garage('node', 'id', '-q').trim().split('@')[0]!
  garage('layout', 'assign', '-z', 'dev', '-c', '1G', nodeId)
  garage('layout', 'apply', '--version', '1')
  console.log('✅ Nœud Garage configuré')
}

const ensureBucket = (bucket: string) => {
  if (garageSucceeds('bucket', 'info', bucket)) return

  garage('bucket', 'create', bucket)
  console.log(`✅ Bucket "${bucket}" créé`)
}

const ensureKey = (bucket: string) => {
  if (!garageSucceeds('key', 'info', KEY_NAME)) {
    garage('key', 'create', KEY_NAME)
    console.log(`✅ Clé d'accès "${KEY_NAME}" créée`)
  }
  garage('bucket', 'allow', '--read', '--write', '--owner', bucket, '--key', KEY_NAME)

  const info = garage('key', 'info', KEY_NAME, '--show-secret')
  const accessKeyId = info.match(/Key ID:\s+(\S+)/)?.[1]
  const secretAccessKey = info.match(/Secret key:\s+(\S+)/)?.[1]
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(`Impossible de lire la clé "${KEY_NAME}" dans la sortie de \`garage key info\``)
  }

  return { accessKeyId, secretAccessKey }
}

// Ne remplace que les valeurs vides ou laissées au modèle : une valeur réelle différente peut
// pointer volontairement vers un autre stockage (bucket distant), on se contente de le signaler.
// Exception : les clés listées dans `alwaysReplace`, qui n'ont de sens que pour le Garage local.
const updateEnvFile = (values: Record<string, string>, alwaysReplace: string[] = []) => {
  if (!existsSync(envPath)) {
    console.warn('⚠️  Pas de fichier .env : copiez .env.example puis relancez `npm run db:up` pour y écrire la clé Garage.')
    return
  }

  const updated: string[] = []
  const kept: string[] = []
  const lines = readFileSync(envPath, 'utf8').split('\n').map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    const key = match?.[1]
    if (!key || !(key in values)) return line

    const current = match[2]
    if (current === values[key]) return line
    if (!isPlaceholder(current) && !alwaysReplace.includes(key)) {
      kept.push(key)
      return line
    }

    updated.push(key)
    return `${key}=${values[key]}`
  })

  writeFileSync(envPath, lines.join('\n'))
  if (updated.length) console.log(`✅ .env mis à jour : ${updated.join(', ')}`)
  if (kept.length) console.warn(`⚠️  .env non modifié pour ${kept.join(', ')} (valeur déjà renseignée, différente du Garage local)`)
}

const bucket = isPlaceholder(process.env.NUXT_DOCUMENTS_BUCKET) ? DEFAULT_BUCKET : process.env.NUXT_DOCUMENTS_BUCKET!

ensureLayout()
ensureBucket(bucket)
const { accessKeyId, secretAccessKey } = ensureKey(bucket)
// Tant que .env pointe vers le Garage local, ses clés S3 ne peuvent être que celles de ce Garage :
// après une suppression du volume, Garage en génère de nouvelles et les anciennes ne marchent plus.
const endpoint = process.env.NUXT_S3_ENDPOINT
const targetsLocalGarage = isPlaceholder(endpoint) || endpoint === LOCAL_ENDPOINT
updateEnvFile({
  NUXT_S3_ENDPOINT: LOCAL_ENDPOINT,
  NUXT_S3_ACCESS_KEY_ID: accessKeyId,
  NUXT_S3_SECRET_ACCESS_KEY: secretAccessKey,
  NUXT_DOCUMENTS_BUCKET: bucket
}, targetsLocalGarage ? ['NUXT_S3_ACCESS_KEY_ID', 'NUXT_S3_SECRET_ACCESS_KEY'] : [])
console.log(`✅ Storage local prêt : ${LOCAL_ENDPOINT}, bucket "${bucket}"`)
