import { test, expect } from '@playwright/test'
import path from 'node:path'

const STATE_PATH = path.join(__dirname, '..', '.auth', 'client.json')

test.use({ storageState: STATE_PATH })

test('client crée une demande SAV via le wizard', async ({ page }) => {
  // ── 1. Page d'accueil client : hero + ailes visibles ───────────────────
  await page.goto('/client')

  await expect(page.getByRole('heading', { name: /bonjour/i })).toBeVisible()

  // L'onglet "Mes ailes" doit afficher au moins une carte d'aile.
  // Si le compte n'a aucune aile, le test s'arrête net — il faut un compte
  // de test correctement seedé en DB.
  const wingsHeading = page.getByRole('heading', { name: /mes ailes/i })
  await expect(wingsHeading).toBeVisible()

  const newRequestButton = page.getByRole('button', { name: /envoyer une demande sav/i }).first()
  await expect(newRequestButton).toBeVisible({ timeout: 15_000 })

  // ── 2. Lancer le wizard depuis une aile ─────────────────────────────────
  await newRequestButton.click()
  await page.waitForURL(/\/client\/new-ticket/, { timeout: 15_000 })

  // ── 3. StepWingInfo : l'aile est pré-sélectionnée par WingCard ─────────
  await expect(page.getByRole('heading', { name: /quelle aile/i })).toBeVisible()
  await page.getByRole('button', { name: 'Continuer' }).click()

  // ── 4. StepWingHistory : tout est optionnel → on passe ─────────────────
  await expect(page.getByRole('heading', { name: /historique de l'aile/i })).toBeVisible()
  await page.getByRole('button', { name: 'Continuer' }).click()

  // ── 5. StepProblemCategory : choisir "Déchirure" ───────────────────────
  await expect(page.getByRole('heading', { name: /quel type de problème/i })).toBeVisible()
  await page.getByRole('button', { name: /déchirure/i }).click()
  await page.getByRole('button', { name: 'Continuer' }).click()

  // ── 6. StepDescription : >= 10 caractères ──────────────────────────────
  await expect(page.getByRole('heading', { name: /décrivez précisément/i })).toBeVisible()
  await page.locator('textarea').fill(
    'Déchirure de 8 cm sur le bord de fuite, repérée au pliage après vol — test e2e Playwright.'
  )
  await page.getByRole('button', { name: 'Continuer' }).click()

  // ── 7. StepUrgency : Normal pré-sélectionné ────────────────────────────
  await expect(page.getByRole('heading', { name: /c'est urgent/i })).toBeVisible()
  await page.getByRole('button', { name: 'Continuer' }).click()

  // ── 8. StepPhotos : on passe ───────────────────────────────────────────
  await expect(page.getByRole('heading', { name: /ajoutez une photo/i })).toBeVisible()
  await page.getByRole('button', { name: /passer cette étape/i }).click()

  // ── 9. StepSchool : référente pré-sélectionnée ─────────────────────────
  await expect(page.getByRole('heading', { name: /envoi à votre école/i })).toBeVisible()
  await page.getByRole('button', { name: /^envoyer à /i }).click()

  // ── 10. StepDelivery : remise en main propre ───────────────────────────
  await expect(page.getByRole('heading', { name: /comment transmettez-vous/i })).toBeVisible()
  await page.getByRole('button', { name: /j'emmène mon aile/i }).click()
  await page.getByRole('button', { name: 'Continuer' }).click()

  // ── 11. StepMessage : message par défaut ───────────────────────────────
  await expect(page.getByRole('heading', { name: /message à l'école/i })).toBeVisible()
  await page.getByRole('button', { name: 'Continuer' }).click()

  // ── 12. StepReview : récap + soumettre ─────────────────────────────────
  await expect(page.getByRole('heading', { name: /tout est prêt/i })).toBeVisible()
  await page.getByRole('button', { name: /^envoyer/i }).click()

  // ── 13. Confirmation : "Votre école a été prévenue" ────────────────────
  await page.waitForURL(/\/client\/ticket-created\//, { timeout: 30_000 })
  await expect(
    page.getByRole('heading', { name: /votre école a été prévenue/i })
  ).toBeVisible({ timeout: 15_000 })

  // Coordonnées école (au moins l'un des deux : téléphone OU email).
  const contactSection = page.getByRole('heading', { name: /contacter votre école/i })
  await expect(contactSection).toBeVisible()
})
