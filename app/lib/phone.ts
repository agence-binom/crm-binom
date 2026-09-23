// Format de stockage : sans aucun séparateur. Numéro français en national sur 10 chiffres
// (0612345678), numéro étranger en international (+4412345678). Un +33/0033 saisi est ramené au
// format national pour qu'un même numéro français ne coexiste pas sous deux formes en base.
const frenchPhonePattern = /^0[1-9]\d{8}$/
const internationalPhonePattern = /^\+[1-9]\d{6,14}$/

export function normalizePhone(value: string) {
  let phone = value.replace(/[\s.\-()/]/g, '')

  if (phone.startsWith('00')) phone = `+${phone.slice(2)}`
  if (/^\+33[1-9]\d{8}$/.test(phone)) phone = `0${phone.slice(3)}`

  return phone
}

export function isValidPhone(value: string) {
  return frenchPhonePattern.test(value) || internationalPhonePattern.test(value)
}

// Indicatifs ITU à 1 et 2 chiffres ; tout autre indicatif en compte 3. Évite d'embarquer une
// librairie de métadonnées téléphoniques juste pour isoler l'indicatif à l'affichage.
const oneDigitCountryCode = /^[17]/
const twoDigitCountryCode = /^(2[07]|3[0-469]|4[0-9]|5[1-8]|6[0-6]|8[1246]|9[0-58])/

const groupByPairs = (digits: string) => {
  const leadLength = digits.length % 2 === 0 ? 2 : 3
  const lead = digits.slice(0, leadLength)
  const pairs = digits.slice(leadLength).match(/\d{2}/g) ?? []

  return [lead, ...pairs].join(' ')
}

// Affichage uniquement : le stockage reste sans espace. Une valeur historique non conforme est
// rendue telle quelle plutôt que tronquée ou masquée.
export function formatPhone(value: string) {
  const phone = normalizePhone(value)

  if (frenchPhonePattern.test(phone)) return phone.match(/\d{2}/g)!.join(' ')
  if (!internationalPhonePattern.test(phone)) return value

  const digits = phone.slice(1)
  const countryCodeLength = oneDigitCountryCode.test(digits) ? 1 : twoDigitCountryCode.test(digits) ? 2 : 3

  return `+${digits.slice(0, countryCodeLength)} ${groupByPairs(digits.slice(countryCodeLength))}`
}

export function getPhoneHref(value: string) {
  return `tel:${normalizePhone(value)}`
}
