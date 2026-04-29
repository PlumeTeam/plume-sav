import { getClientWings } from '@/features/tickets/queries'
import { TicketWizard } from '@/features/tickets/components/wizard/TicketWizard'

export default async function NewTicketPage() {
  const wings = await getClientWings()
  return <TicketWizard wings={wings} />
}
