import 'dotenv/config'
import type { FullConfig } from '@playwright/test'
import { createSessionStorageState } from './helpers/supabase-session'

const STORAGE_STATE_PATH = 'playwright/.auth/user.json'
const TEST_USER_EMAIL = process.env.PLAYWRIGHT_TEST_USER_EMAIL ?? 'admin@crmbinom.test'
const TEST_USER_PASSWORD = process.env.PLAYWRIGHT_TEST_USER_PASSWORD ?? 'password123'

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL as string | undefined ?? 'http://localhost:3000'

  const storageState = await createSessionStorageState(TEST_USER_EMAIL, TEST_USER_PASSWORD, baseURL)

  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  await fs.mkdir(path.dirname(STORAGE_STATE_PATH), { recursive: true })
  await fs.writeFile(STORAGE_STATE_PATH, JSON.stringify(storageState))
}
