import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  /* `nuxt dev` compile à la volée (pas de build) - sous plusieurs workers en parallèle, une
   * première navigation vers une route peut dépasser le timeout par défaut de 5s d'un expect()
   * (observé jusqu'à ~16s sur le rendu du détail projet), sans que ce soit un bug applicatif. */
  expect: {
    timeout: 10_000
  },
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    /* Session générée par globalSetup pour un user déjà connecté. Les tests non-authentifiés
     * (voir e2e/auth.spec.ts) l'écrasent explicitement avec `test.use({ storageState: ... })`. */
    storageState: 'playwright/.auth/user.json'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],

  webServer: {
    // Port dédié pour ne pas entrer en conflit avec un autre projet Nuxt sur :3000.
    command: 'npm run dev -- --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    // Better Auth valide l'en-tête Origin des requêtes state-changing (ex. sign-out) contre le
    // baseURL dérivé de NUXT_PUBLIC_SITE_URL (server/lib/better-auth.ts) : si .env pointe vers
    // :3000 (port du dev serveur classique) alors que ce serveur e2e tourne sur :3100, ces
    // requêtes échouent en 403 "Invalid origin" - on force donc la valeur ici plutôt que de
    // dépendre du .env local de chaque dev.
    env: { NUXT_PUBLIC_SITE_URL: 'http://localhost:3100' }
  }
})
