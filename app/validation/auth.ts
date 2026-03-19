import { z } from 'zod'

export const authSignInSchema = z.object({
  email: z.email('Veuillez saisir une adresse email valide.')
    .min(1, 'L’adresse email est requise.')
})

export type AuthSignIn = z.infer<typeof authSignInSchema>
