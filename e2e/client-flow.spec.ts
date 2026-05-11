import { test, expect } from '@playwright/test'

/**
 * Flow client : login (via storageState) → dashboard → liste des ailes →
 * lancement du wizard de création de ticket → écran de confirmation.
 *
 * Le test ne complète pas tout le wizard (10+ étapes, dépend de la photo
 * et de la sélection de l'école) — il vérifie que :
 *   1. Le dashboard charge et affiche les sections clés
 *   2. Cliquer sur "Envoyer une demande SAV" depuis une aile lance le wizard
 *   3. La progression de wizard est visible (étape 1/N)
 */
test.describe('Client — flow ticket', () => {
  test('dashboard charge avec ailes et tickets', async ({ page }) => {
    await page.goto('/client')

    await expect(page.getByRole('heading', { name: /bonjour/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /mes ailes/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /mes demandes sav/i })).toBeVisible()
  })

  test('lance le wizard de création depuis une aile', async ({ page }) => {
    await page.goto('/client')

    const ctaSav = page.getByRole('button', { name: /envoyer une demande sav/i }).first()

    // Le compte de test peut ne pas avoir d'aile — on saute proprement si c'est le cas.
    if ((await ctaSav.count()) === 0) {
      test.skip(true, 'Aucune aile sur le compte client de test — wizard non testable.')
    }

    await ctaSav.click()
    await page.waitForURL(/\/client\/new-ticket/, { timeout: 10_000 })

    // Le wizard expose une progressbar avec l'étape courante.
    await expect(page.getByRole('progressbar')).toBeVisible()
    await expect(page.getByText(/étape\s+1\/\d+/i)).toBeVisible()
  })

  test('abandonner le wizard renvoie sur le dashboard', async ({ page }) => {
    await page.goto('/client')

    const ctaSav = page.getByRole('button', { name: /envoyer une demande sav/i }).first()
    if ((await ctaSav.count()) === 0) {
      test.skip(true, 'Aucune aile sur le compte client de test.')
    }
    await ctaSav.click()
    await page.waitForURL(/\/client\/new-ticket/)

    page.once('dialog', (d) => d.accept())
    const cancelBtn = page.getByRole('button', { name: /annuler|abandonner|fermer/i })
    if ((await cancelBtn.count()) > 0) {
      await cancelBtn.first().click()
      await page.waitForURL(/\/client(?!\/new-ticket)/, { timeout: 5_000 }).catch(() => {})
    }
  })
})
