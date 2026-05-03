import { getClientWings, getPartnerSchools } from '@/features/tickets/queries'
import { TicketWizard } from '@/features/tickets/components/wizard/TicketWizard'

export const dynamic = 'force-dynamic'

export default async function NewTicketPage() {
  const [wings, schools] = await Promise.all([getClientWings(), getPartnerSchools()])
  return <TicketWizard wings={wings} schools={schools} />
}
