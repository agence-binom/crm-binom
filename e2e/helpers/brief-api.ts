// Valeurs de test uniquement : injectées dans le serveur e2e par playwright.config.ts (webServer.env),
// ce qui évite d'avoir à déclarer un secret de plus dans la CI.
export const E2E_BRIEF_API_SECRET = 'e2e-brief-api-secret-0123456789abcdef'
export const E2E_BRIEF_SITE_URL = 'https://site-public.e2e.test'

export const briefApiHeaders = (secret = E2E_BRIEF_API_SECRET) => ({ authorization: `Bearer ${secret}` })
