import { z } from 'zod'
import { isValidPhone, normalizePhone } from '../lib/phone'

export const phoneSchema = z.preprocess(
  value => (typeof value === 'string' ? normalizePhone(value) : value),
  z.string()
    .refine(
      value => value === '' || isValidPhone(value),
      'Format attendu : 0612345678 (France) ou +4412345678 (étranger)'
    )
    .optional()
)
