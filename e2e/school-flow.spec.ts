import { test, expect } from '@playwright/test'

/**
 * Flow école : dashboard → file de tickets → ouverture d'un ticket →
 * navigation entre onglets (État / Déclaration / Messages / Check aile) →
 * acknowledge ("Message vu") si le ticket est encore `pending`.
 *
 * Le test s'adapte aux données réelles du compte démo : on saute proprement
 * si aucun ticket n'est présent dans la file.
 */
test.describe('École — flow ticket', () => {
  test('dashboard affiche la file de tickets', async ({ page }) => {
    await page.goto('/school')

    await expect(page.getByRole('heading', { name: /bonjour/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /file de tickets/i })).toBeVisible()
  })

  test('ouvre un ticket et navigue dans les onglets', async ({ page }) => {
    await page.goto('/school')

    // Premier ticket de la file (TicketCard est un Link href=/school/ticket/{id})
    const firstTicketLink = page.locator('a[href^="/school/ticket/"]').first()
    if ((await firstTicketLink.count()) === 0) {
      test.skip(true, 'Aucun ticket dans la file école de démo.')
    }

    await firstTicketLink.click()
    await page.waitForURL(/\/school\/ticket\/[^/]+$/, { timeout: 10_000 })

    const tablist = page.getByRole('tablist', { name: /sections du ticket/i })
    await expect(tablist).toBeVisible()

    const stateTab       = page.getByRole('tab', { name: /état/i })
    const declarationTab = page.getByRole('tab', { name: /déclaration/i })
    const messagesTab    = page.getByRole('tab', { name: /messages/i })
    const checkTab       = page.getByRole('tab', { name: /check aile/i })

    await expect(stateTab).toHaveAttribute('aria-selected', 'true')

    await declarationTab.click()
    await expect(declarationTab).toHaveAttribute('aria-selected', 'true')

    await messagesTab.click()
    await expect(messagesTab).toHaveAttribute('aria-selected', 'true')

    await checkTab.click()
    await expect(checkTab).toHaveAttribute('aria-selected', 'true')

    await stateTab.click()
    await expect(stateTab).toHaveAttribute('aria-selected', 'true')
  })

  test('acknowledge un ticket pending', async ({ page }) => {
    await page.goto('/school')

    // Filtre "À traiter" est sélectionné par défaut côté SchoolTicketQueue —
    // on prend le premier ticket de la file, qui devrait être pending.
    const firstTicketLink = page.locator('a[href^="/school/ticket/"]').first()
    if ((await firstTicketLink.count()) === 0) {
      test.skip(true, 'Aucun ticket pending sur le compte école.')
    }

    await firstTicketLink.click()
    await page.waitForURL(/\/school\/ticket\/[^/]+$/)

    // Le bouton "Message vu" n'est rendu que si l'étape `ack` est active
    // (status=pending). On saute si déjà acquitté.
    const ackBtn = page.getByRole('button', { name: /message vu/i })
    if ((await ackBtn.count()) === 0) {
      test.skip(true, 'Ticket déjà acquitté — étape ack indisponible.')
    }

    await ackBtn.first().click()

    // Après acknowledge, le statut bascule vers `school_acknowledged` :
    // le bouton "Message vu" disparaît ou l'étape `wing` s'active.
    await expect
      .poll(async () => await ackBtn.count(), { timeout: 10_000 })
      .toBe(0)
  })
})
