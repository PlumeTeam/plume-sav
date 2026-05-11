import { test as setup } from '@playwright/test'
import path from 'node:path'
import { loginAs } from './helpers/login'

const PASSWORD = 'PlumeSAV2026!'

const ACCOUNTS: Record<'client' | 'school' | 'workshop', string> = {
  client:   'jbchandelier+client@gmail.com',
  school:   'jbchandelier+ecole@gmail.com',
  workshop: 'jbchandelier+atelier@gmail.com',
}

const authFile = (role: keyof typeof ACCOUNTS) =>
  path.join('.auth', `${role}.json`)

setup('authenticate client', async ({ page }) => {
  await loginAs(page, ACCOUNTS.client, PASSWORD)
  await page.context().storageState({ path: authFile('client') })
})

setup('authenticate school', async ({ page }) => {
  await loginAs(page, ACCOUNTS.school, PASSWORD)
  await page.context().storageState({ path: authFile('school') })
})

setup('authenticate workshop', async ({ page }) => {
  await loginAs(page, ACCOUNTS.workshop, PASSWORD)
  await page.context().storageState({ path: authFile('workshop') })
})
