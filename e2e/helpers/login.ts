import { expect, type Page } from '@playwright/test'

/**
 * Connecte un utilisateur via le formulaire `/login`.
 *
 * Le formulaire utilise Cloudflare Turnstile (captcha). On attend que le
 * widget injecte un `captchaToken` dans le champ caché — Turnstile passe
 * automatiquement la plupart du temps en headless. Si le test échoue ici,
 * lancer en headed (`--headed`) pour résoudre le challenge à la main.
 *
 * Après submit, on vérifie la redirection hors de `/login` (le serveur peut
 * aller sur `/select-dashboard` ou directement sur le dashboard du rôle).
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login')

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe').fill(password)

  // Attend que Turnstile remplisse le token caché (le bouton submit reste
  // désactivé tant que `captchaToken` est vide — cf. LoginForm.tsx).
  await expect
    .poll(
      async () => await page.locator('input[name="captchaToken"]').inputValue(),
      { timeout: 20_000, message: 'Cloudflare Turnstile n\'a pas produit de token' },
    )
    .not.toBe('')

  const submit = page.getByRole('button', { name: /se connecter/i })
  await expect(submit).toBeEnabled({ timeout: 5_000 })
  await submit.click()

  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 20_000,
  })
}
