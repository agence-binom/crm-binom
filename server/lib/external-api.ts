import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

// En dessous, un secret se devine trop facilement : on préfère refuser de servir la route
// (503) plutôt que de l'ouvrir avec un secret faible oublié dans une config.
export const EXTERNAL_API_SECRET_MIN_LENGTH = 32

export const isExternalApiSecretConfigured = (secret: string | null | undefined): secret is string => (
  typeof secret === 'string' && secret.length >= EXTERNAL_API_SECRET_MIN_LENGTH
)

export const extractBearerToken = (authorizationHeader: string | null | undefined) => {
  const match = authorizationHeader?.match(/^Bearer\s+(\S+)\s*$/i)
  return match?.[1] ?? null
}

// Les deux valeurs sont hachées avant comparaison : timingSafeEqual exige des longueurs égales,
// et comparer les longueurs en clair révélerait celle du secret.
export const isValidExternalApiSecret = (provided: string | null | undefined, expected: string | null | undefined) => {
  if (!provided || !isExternalApiSecretConfigured(expected)) return false

  const providedDigest = createHash('sha256').update(provided).digest()
  const expectedDigest = createHash('sha256').update(expected).digest()
  return timingSafeEqual(providedDigest, expectedDigest)
}

export const generateBriefToken = () => randomBytes(32).toString('base64url')

export const buildBriefUrl = (briefSiteUrl: string, token: string) => (
  `${briefSiteUrl.replace(/\/+$/, '')}/brief/${token}`
)
