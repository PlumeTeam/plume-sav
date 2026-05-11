import { defineConfig, devices } from '@playwright/test'

/**
 * Tests E2E Plume SAV — cible la prod Vercel.
 *
 * Auth :
 *   - `auth.setup.ts` ouvre le formulaire de login et sauvegarde le
 *     `storageState` de chaque rôle dans `.auth/<role>.json`.
 *   - Les specs réutilisent ces états via les projects `client`, `school`,
 *     `workshop` — pas besoin de relogin entre tests.
 *
 * Captcha :
 *   - Le formulaire de login utilise Cloudflare Turnstile. En général il
 *     auto-passe en headless ; sinon, faire tourner les tests en local
 *     avec `PWDEBUG=1` pour résoudre manuellement la 1ère fois.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://plume-sav.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'client',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/client.json',
      },
      dependencies: ['setup'],
      testMatch: /client-flow\.spec\.ts/,
    },
    {
      name: 'school',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/school.json',
      },
      dependencies: ['setup'],
      testMatch: /(school-flow|messaging)\.spec\.ts/,
    },
  ],
})
