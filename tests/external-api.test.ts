import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildBriefUrl,
  extractBearerToken,
  generateBriefToken,
  isExternalApiSecretConfigured,
  isValidExternalApiSecret
} from '../server/lib/external-api'

const secret = 'un-secret-partage-suffisamment-long-0123456789'

test('isValidExternalApiSecret accepte uniquement le secret exact', () => {
  assert.equal(isValidExternalApiSecret(secret, secret), true)
  assert.equal(isValidExternalApiSecret(`${secret}x`, secret), false)
  assert.equal(isValidExternalApiSecret(secret.slice(0, -1), secret), false)
  assert.equal(isValidExternalApiSecret('court', secret), false)
})

test('isValidExternalApiSecret refuse tout quand le secret est absent ou trop court côté CRM', () => {
  assert.equal(isValidExternalApiSecret(null, secret), false)
  assert.equal(isValidExternalApiSecret('', secret), false)
  assert.equal(isValidExternalApiSecret('', ''), false)
  assert.equal(isValidExternalApiSecret('trop-court', 'trop-court'), false)
  assert.equal(isValidExternalApiSecret(secret, undefined), false)
})

test('isExternalApiSecretConfigured exige au moins 32 caractères', () => {
  assert.equal(isExternalApiSecretConfigured('a'.repeat(32)), true)
  assert.equal(isExternalApiSecretConfigured('a'.repeat(31)), false)
  assert.equal(isExternalApiSecretConfigured(undefined), false)
})

test('extractBearerToken lit l’en-tête Authorization', () => {
  assert.equal(extractBearerToken(`Bearer ${secret}`), secret)
  assert.equal(extractBearerToken(`bearer ${secret}`), secret)
  assert.equal(extractBearerToken(secret), null)
  assert.equal(extractBearerToken('Basic abc'), null)
  assert.equal(extractBearerToken(undefined), null)
})

test('generateBriefToken produit des jetons base64url de 43 caractères, tous différents', () => {
  const tokens = new Set(Array.from({ length: 200 }, generateBriefToken))
  assert.equal(tokens.size, 200)
  for (const token of tokens) assert.match(token, /^[\w-]{43}$/)
})

test('buildBriefUrl construit le lien public sans double slash', () => {
  assert.equal(buildBriefUrl('https://agence-binom.fr/', 'abc'), 'https://agence-binom.fr/brief/abc')
  assert.equal(buildBriefUrl('https://agence-binom.fr', 'abc'), 'https://agence-binom.fr/brief/abc')
})
