import { test, expect } from '@playwright/test'
import path from 'node:path'

const STATE_PATH = path.join(__dirname, '..', '.auth', 'school.json')

test.use({ storageState: STATE_PATH })

test('école traite un ticket : ack → réception → check', async ({ page }) => {
  // ── 1. Dashboard école ─────────────────────────────────────────────────
  await page.goto('/school')
  await expect(page.getByRole('heading', { name: /bonjour/i })).toBeVisible()

  // L'onglet "À traiter" est sélectionné par défaut — on essaie d'y trouver
  // un ticket. Sinon on retombe sur "Tous" pour piloter un ticket existant.
  let firstTicket = page.locator('a[href*="/school/ticket/"]').first()
  if (!(await firstTicket.count())) {
    await page.getByRole('tab', { name: /tous/i }).click()
    firstTicket = page.locator('a[href*="/school/ticket/"]').first()
  }

  if (!(await firstTicket.count())) {
    test.skip(true, 'Aucun ticket disponible pour ce compte école — seed DB nécessaire')
    return
  }

  await firstTicket.click()
  await page.waitForURL(/\/school\/ticket\/[^/]+$/, { timeout: 15_000 })

  // ── 2. Onglet État : étapes séquentielles ──────────────────────────────
  await expect(page.getByRole('tab', { name: /État/i })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('heading', { name: 'Étapes' })).toBeVisible()

  // Étape "Message vu" — bouton actif si statut = pending. Best-effort.
  const ackBtn = page.getByRole('button', { name: /^Message vu$/ })
  if (await ackBtn.count()) {
    await ackBtn.click()
    // Le statut change → la carte affiche un timestamp "Validé le …".
    await expect(page.getByText(/validé le /i).first()).toBeVisible({ timeout: 15_000 })
  }

  // ── 3. Onglet Messages : voir le message client + en envoyer un ────────
  await page.getByRole('tab', { name: /messages/i }).click()
  await expect(page.getByRole('heading', { name: /avec le client/i })).toBeVisible()

  // Le composer du canal "client" attend un placeholder spécifique.
  const composer = page.getByPlaceholder(/question, mise à jour|précision/i).first()
  await expect(composer).toBeVisible()
  const stamp = Date.now()
  await composer.fill(`Réponse école automatisée — test e2e ${stamp}`)
  await page.getByRole('button', { name: /^envoyer au client$/i }).click()
  await expect(page.getByText(`Réponse école automatisée — test e2e ${stamp}`)).toBeVisible({
    timeout: 15_000,
  })

  // ── 4. Retour État → cliquer "Aile reçue" (scan demo) ──────────────────
  await page.getByRole('tab', { name: /État/i }).click()
  const wingBtn = page.getByRole('button', { name: /^Aile reçue$/ })
  if (await wingBtn.count()) {
    await wingBtn.click()
    // Modal de scan → mode démo.
    await page.getByRole('button', { name: /test sans flashcode/i }).click()
    await expect(page.getByText(/validé le /i).nth(1)).toBeVisible({ timeout: 15_000 })
  }

  // ── 5. Lancer le check de l'aile via Onglet Check ──────────────────────
  await page.getByRole('tab', { name: /check aile/i }).click()

  // Card "Checker l'aile" — c'est un Link (role=link) vers .../check.
  const startCheck = page.getByRole('link', { name: /checker l'aile/i }).first()
  if (await startCheck.count()) {
    await startCheck.click()
    await page.waitForURL(/\/school\/ticket\/[^/]+\/check$/, { timeout: 15_000 })

    // SchoolCheckGate ouvre ScanGateModal — mode démo.
    const demoScan = page.getByRole('button', { name: /test sans flashcode/i })
    await demoScan.click()

    // SchoolCheckBriefing → "J'ai compris, je commence le check →"
    await page
      .getByRole('button', { name: /j'ai compris.+commence/i })
      .click()

    // CheckWizard — minimal happy path. Chaque écran a son "Continuer".
    await expect(page.getByRole('heading', { name: /qui effectue le contrôle/i })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByLabel(/nom et prénom/i).fill('Test E2E Inspecteur')
    await page.getByRole('button', { name: /commencer le check/i }).click()

    // visual_general — répondre "Non" aux dommages visibles
    await expect(page.getByRole('heading', { name: /inspection visuelle générale/i })).toBeVisible()
    await page.getByRole('button', { name: 'Non', exact: true }).first().click()
    await page.getByRole('button', { name: 'Continuer' }).click()

    // fabric — État du tissu = Bon, Déchirures = Non
    await expect(page.getByRole('heading', { name: /^Tissu$/i })).toBeVisible()
    await page.getByRole('button', { name: 'Bon', exact: true }).first().click()
    await page.getByRole('button', { name: 'Non', exact: true }).first().click()
    await page.getByRole('button', { name: 'Continuer' }).click()

    // seams_structure — Coutures Non, Suspentes Bon, Maillons Non, Élévateurs Bon
    await expect(page.getByRole('heading', { name: /coutures et structure/i })).toBeVisible()
    const nonBtns = page.getByRole('button', { name: 'Non', exact: true })
    const bonBtns = page.getByRole('button', { name: 'Bon', exact: true })
    await nonBtns.nth(0).click() // Coutures ouvertes ?
    await bonBtns.nth(0).click() // Suspentes
    await nonBtns.nth(1).click() // Maillons inversés ?
    await bonBtns.nth(1).click() // Élévateurs
    await page.getByRole('button', { name: 'Continuer' }).click()

    // inflation — skip
    await expect(page.getByRole('heading', { name: /pu gonfler/i })).toBeVisible()
    await page.getByRole('button', { name: /passer cette phase/i }).click()

    // flight — skip
    await expect(page.getByRole('heading', { name: /test en vol/i })).toBeVisible()
    await page.getByRole('button', { name: /passer cette phase/i }).click()

    // review — submit
    await expect(page.getByRole('heading', { name: /synthèse/i })).toBeVisible()
    await page.getByRole('button', { name: /valider le check/i }).click()

    // Retour ticket — le badge ✓ doit apparaître sur l'onglet Check
    await page.waitForURL(/\/school\/ticket\/[^/]+$/, { timeout: 20_000 })
    await expect(
      page.getByRole('tab', { name: /check aile/i }).getByLabel(/check validé/i)
    ).toBeVisible({ timeout: 15_000 })
  }
})
