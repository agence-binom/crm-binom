import assert from 'node:assert/strict'
import test from 'node:test'
import { formatPhone, normalizePhone } from '../app/lib/phone'
import { phoneSchema } from '../app/validation/phone'
import { contactCreateSchema } from '../app/validation/contacts'

test('normalizePhone retire espaces, points, tirets et parenthèses', () => {
  assert.equal(normalizePhone('06 12 34 56 78'), '0612345678')
  assert.equal(normalizePhone('06.12.34.56.78'), '0612345678')
  assert.equal(normalizePhone('+44 (20) 7946-0958'), '+442079460958')
})

test('normalizePhone ramène un numéro français international au format national', () => {
  assert.equal(normalizePhone('+33 6 12 34 56 78'), '0612345678')
  assert.equal(normalizePhone('0033612345678'), '0612345678')
})

test('normalizePhone convertit le préfixe 00 étranger en +', () => {
  assert.equal(normalizePhone('0041 22 123 45 67'), '+41221234567')
})

test('phoneSchema accepte un numéro français, étranger ou vide', () => {
  assert.equal(phoneSchema.parse('0612345678'), '0612345678')
  assert.equal(phoneSchema.parse('+41221234567'), '+41221234567')
  assert.equal(phoneSchema.parse(''), '')
  assert.equal(phoneSchema.parse(undefined), undefined)
})

test('phoneSchema refuse un format invalide', () => {
  for (const value of ['061234567', '06123456789', '6123456789', '+0612345', 'abc']) {
    assert.equal(phoneSchema.safeParse(value).success, false, value)
  }
})

test('contactCreateSchema stocke téléphone et mobile sans espace', () => {
  const result = contactCreateSchema.parse({
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '01 23 45 67 89',
    mobile: '+32 470 12 34 56'
  })

  assert.equal(result.phone, '0123456789')
  assert.equal(result.mobile, '+32470123456')
})

test('formatPhone affiche un numéro français par paires', () => {
  assert.equal(formatPhone('0612345678'), '06 12 34 56 78')
})

test('formatPhone isole l\'indicatif puis groupe par paires', () => {
  assert.equal(formatPhone('+442079460958'), '+44 20 79 46 09 58')
  assert.equal(formatPhone('+41221234567'), '+41 221 23 45 67')
  assert.equal(formatPhone('+12125551234'), '+1 21 25 55 12 34')
  assert.equal(formatPhone('+352621123456'), '+352 621 12 34 56')
})

test('formatPhone rend telle quelle une valeur historique non conforme', () => {
  assert.equal(formatPhone('01 23 45 67 89 poste 12'), '01 23 45 67 89 poste 12')
})
