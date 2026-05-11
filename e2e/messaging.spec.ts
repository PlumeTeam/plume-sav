import { test, expect } from '@playwright/test'

/**
 * Messagerie école : on ouvre un ticket, on passe sur l'onglet "État",
 * on déplie le composer "Communiquer avec le client", on envoie un
 * message, puis on vérifie la confirmation de succès.
 *
 * Côté DB, le message est ajouté via `addRoleMessageAction` avec
 * visibility=all et sender_role=school.
 */
test.describe('École — messagerie', () => {
  test('liste des conversations accessibles', async ({ page }) => {
    await page.goto('/school/messages')
    await expect(page.getByRole('heading', { name: /messagerie/i })).toBeVisible()
  })

  test('envoie un message au client depuis un ticket', async ({ page }) => {
    await page.goto('/school')

    const firstTicketLink = page.locator('a[href^="/school/ticket/"]').first()
    if ((await firstTicketLink.count()) === 0) {
      test.skip(true, 'Aucun ticket dans la file école — messagerie non testable.')
    }

    await firstTicketLink.click()
    await page.waitForURL(/\/school\/ticket\/[^/]+$/)

    // L'onglet "État" héberge le bouton "Communiquer avec le client".
    await page.getByRole('tab', { name: /état/i }).click()

    const clientCard = page.getByRole('button', { name: /communiquer avec le client/i })
    if ((await clientCard.count()) === 0) {
      test.skip(true, 'Carte "Communiquer avec le client" indisponible (état du ticket ?)')
    }
    await clientCard.first().click()

    const composer = page.locator('textarea').first()
    await expect(composer).toBeVisible()

    const message = `Test E2E messagerie — ${new Date().toISOString()}`
    await composer.fill(message)

    await page.getByRole('button', { name: /envoyer au client/i }).click()

    // Confirmation visuelle injectée par le composer ("✓ Message envoyé.").
    await expect(page.getByText(/message envoyé/i)).toBeVisible({ timeout: 10_000 })
  })
})
