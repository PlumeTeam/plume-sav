import {
  getClientWings,
  getPartnerSchoolById,
  getPartnerSchools,
  getPartnerWorkshops,
  getPlumeSettings,
} from '@/features/tickets/queries'
import { TicketWizard } from '@/features/tickets/components/wizard/TicketWizard'

export const dynamic = 'force-dynamic'

export default async function NewTicketPage() {
  const [wings, baseSchools, workshops, policy] = await Promise.all([
    getClientWings(),
    getPartnerSchools(),
    getPartnerWorkshops(),
    getPlumeSettings(),
  ])

  // Ensure every wing's referent school is in the picker list. getPartnerSchools()
  // filters by is_affiliated/active first, so a referent school that's neither
  // (e.g. test schools, or a partner that lost its flag) would be missing —
  // StepSchool.find(referentSchoolId) returns null and the wizard drops the
  // client on the map instead of pre-selecting "their" school. We fetch the
  // missing ones individually; null returns are skipped silently.
  const knownIds = new Set(baseSchools.map((s) => s.id))
  const missingReferentIds = Array.from(
    new Set(
      wings
        .map((w) => w.partner_school_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0 && !knownIds.has(id))
    )
  )
  const extras = missingReferentIds.length > 0
    ? (await Promise.all(missingReferentIds.map((id) => getPartnerSchoolById(id)))).filter(
        (s): s is NonNullable<typeof s> => s !== null
      )
    : []
  const schools = [...baseSchools, ...extras]

  return <TicketWizard wings={wings} schools={schools} workshops={workshops} policy={policy} />
}
