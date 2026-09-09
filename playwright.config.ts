import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* `nuxt dev` compile à la volée (pas de build) - sous plusieurs workers en parallèle, une
   * première navigation vers une route peut dépasser le timeout par défaut de 5s d'un expect()
   * (observé jusqu'à ~16s sur le rendu du détail projet), sans que ce soit un bug applicatif. */
  expect: {
    timeout: 10_000
  },
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'http://localhost:3100',

    /* Collect trace on the first failure, even without a retry. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',

    /* Session générée par globalSetup pour un user déjà connecté. Les tests non-authentifiés
     * (voir e2e/auth.spec.ts) l'écrasent explicitement avec `test.use({ storageState: ... })`. */
    storageState: 'playwright/.auth/user.json'
  },

  /* Configure projects for major browsers */
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

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
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
