import { test as setup, expect } from '@playwright/test'
import { loginAs } from './helpers/login'
import path from 'node:path'

const AUTH_DIR = path.join(__dirname, '..', '.auth')

const ACCOUNTS = [
  {
    role:     'client',
    email:    'jbchandelier+client@gmail.com',
    password: 'PlumeSAV2026!',
    statePath: path.join(AUTH_DIR, 'client.json'),
    // Après login, le client landing est /client (via /select-dashboard).
    expectUrlMatch: /\/client(?!-)/,
  },
  {
    role:     'school',
    email:    'jbchandelier+ecole@gmail.com',
    password: 'PlumeSAV2026!',
    statePath: path.join(AUTH_DIR, 'school.json'),
    expectUrlMatch: /\/school/,
  },
  {
    role:     'workshop',
    email:    'jbchandelier+atelier@gmail.com',
    password: 'PlumeSAV2026!',
    statePath: path.join(AUTH_DIR, 'workshop.json'),
    expectUrlMatch: /\/workshop/,
  },
] as const

for (const acc of ACCOUNTS) {
  setup(`authenticate as ${acc.role}`, async ({ page }) => {
    await loginAs(page, acc.email, acc.password)

    // S'il a atterri sur /select-dashboard (multi-rôles), on suit le bon lien.
    if (page.url().includes('/select-dashboard')) {
      const link = page.getByRole('link', { name: new RegExp(acc.role, 'i') })
      if (await link.count()) {
        await link.first().click()
      }
    }

    await page.waitForURL(acc.expectUrlMatch, { timeout: 20_000 })
    await expect(page).toHaveURL(acc.expectUrlMatch)

    await page.context().storageState({ path: acc.statePath })
  })
}
