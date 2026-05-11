import { test, expect, type BrowserContext } from '@playwright/test'
import path from 'node:path'

const CLIENT_STATE = path.join(__dirname, '..', '.auth', 'client.json')
const SCHOOL_STATE = path.join(__dirname, '..', '.auth', 'school.json')

/**
 * Trouve l'id du premier ticket disponible pour le rôle courant en se basant
 * sur les liens présents sur le dashboard. On utilise le pathname pour rester
 * indépendant du baseURL Playwright.
 */
async function findFirstTicketId(context: BrowserContext, dashboardPath: string, basePath: string) {
  const page = await context.newPage()
  await page.goto(dashboardPath)

  if (dashboardPath.startsWith('/school')) {
    // Onglet "Tous" pour couvrir aussi les tickets déjà traités.
    const allTab = page.getByRole('tab', { name: /^tous/i })
    if (await allTab.count()) await allTab.click()
  }

  const link = page.locator(`a[href*="${basePath}/ticket/"]`).first()
  await link.waitFor({ state: 'attached', timeout: 15_000 })
  const href = await link.getAttribute('href')
  await page.close()
  if (!href) throw new Error('Aucun ticket trouvé pour ' + dashboardPath)

  // href = "/client/ticket/<uuid>" — on isole le segment uuid.
  const match = href.match(/\/ticket\/([^/?#]+)/)
  if (!match?.[1]) throw new Error('Impossible de parser ' + href)
  return match[1]
}

test('messagerie client ↔ école : aller-retour', async ({ browser }) => {
  // ── 1. Côté client : récupérer un ticketId puis envoyer un message ─────
  const clientCtx = await browser.newContext({ storageState: CLIENT_STATE })
  const ticketId = await findFirstTicketId(clientCtx, '/client', '/client')

  const clientPage = await clientCtx.newPage()
  await clientPage.goto(`/client/ticket/${ticketId}`)

  // Ouvrir l'onglet Messages.
  await clientPage.getByRole('tab', { name: /messages/i }).click()

  const stamp = Date.now()
  const clientMsg = `Message client e2e ${stamp}`
  const clientComposer = clientPage.getByPlaceholder(/écrire un message/i)
  await clientComposer.fill(clientMsg)
  await clientPage.getByRole('button', { name: /envoyer le message/i }).click()
  await expect(clientPage.getByText(clientMsg)).toBeVisible({ timeout: 15_000 })

  await clientCtx.close()

  // ── 2. Côté école : ouvrir le même ticket, voir le message + répondre ──
  const schoolCtx = await browser.newContext({ storageState: SCHOOL_STATE })
  const schoolPage = await schoolCtx.newPage()
  await schoolPage.goto(`/school/ticket/${ticketId}`)

  await schoolPage.getByRole('tab', { name: /messages/i }).click()

  // Le message client doit être visible (canal "Avec le client" par défaut).
  await expect(schoolPage.getByText(clientMsg)).toBeVisible({ timeout: 15_000 })

  const schoolMsg = `Réponse école e2e ${stamp}`
  const schoolComposer = schoolPage.getByPlaceholder(/question, mise à jour|précision/i).first()
  await schoolComposer.fill(schoolMsg)
  await schoolPage.getByRole('button', { name: /^envoyer au client$/i }).click()
  await expect(schoolPage.getByText(schoolMsg)).toBeVisible({ timeout: 15_000 })

  await schoolCtx.close()

  // ── 3. Côté client : vérifier que la réponse école est bien visible ────
  const clientCtx2 = await browser.newContext({ storageState: CLIENT_STATE })
  const clientPage2 = await clientCtx2.newPage()
  await clientPage2.goto(`/client/ticket/${ticketId}`)
  await clientPage2.getByRole('tab', { name: /messages/i }).click()

  await expect(clientPage2.getByText(schoolMsg)).toBeVisible({ timeout: 15_000 })

  await clientCtx2.close()
})
