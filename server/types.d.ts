import type { InferSelectModel } from 'drizzle-orm'
import type { contactsTable } from '~/db/schema/contacts'
import type { clientsTable } from '~/db/schema/clients'
import type { usersTable } from '~/db/schema/users'

declare module 'h3' {
  interface H3EventContext {
    // Résolus une seule fois par ../middleware/01-auth.ts, pour que chaque route /api/*
    // n'ait pas à reproduire elle-même la vérification d'autorisation (voir issue #101).
    appUser?: InferSelectModel<typeof usersTable>
    portalContact?: InferSelectModel<typeof contactsTable>
    portalClient?: InferSelectModel<typeof clientsTable>
  }
}

export {}
