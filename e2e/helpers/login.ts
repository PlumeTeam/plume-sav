import { expect, type Page } from '@playwright/test'

/**
 * Login via le formulaire UI. Le formulaire est protégé par Cloudflare
 * Turnstile : le bouton "Se connecter" reste désactivé tant que le widget
 * n'a pas produit un token. On attend jusqu'à 25s qu'il se résolve.
 *
 * NB : en headless strict, Turnstile peut refuser de se résoudre — exécuter
 * `pnpm test:e2e:headed` dans ce cas. La prod Vercel a un site key
 * "managed" qui passe généralement sur Chromium Playwright.
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: /bienvenue/i })).toBeVisible()

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe').fill(password)

  const submit = page.getByRole('button', { name: /se connecter|connexion/i })

  // Attendre que Turnstile débloque le bouton (token capté).
  await expect(submit).toBeEnabled({ timeout: 25_000 })

  await submit.click()

  // Après login, l'action redirige vers /select-dashboard puis chaque dashboard.
  // On attend une URL qui n'est plus /login.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 20_000,
  })
}
