import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendClientStepUpdateEmail, type ClientStepEmail, type TicketEmailContext } from '../email'
import type { RequestStatus, TicketStatus, TicketUpdate } from '../types'
import { getPartnerSchoolById } from '../queries'
import { requestStatusToSavStatus } from './_helpers'

// ============================================================
// Pipeline d'Ã©tapes SAV (migration 20260509000000)
// ============================================================
//
// Chaque transition est :
//  - sÃ©quentielle (refus si le statut actuel n'est pas dans la whitelist),
//  - write-once (le timestamp se remplit cÃ´tÃ© DB en even of duplicate clicks),
//  - notifiÃ©e au client par email (best-effort).
//
// Les boutons UI s'appuient sur des Server Actions dÃ©diÃ©es plutÃ´t qu'un seul
// `updateStatusAction` gÃ©nÃ©rique : Ã§a permet d'Ã©crire le timestamp correspondant
// et de cibler la bonne copie email sans couplage cÃ´tÃ© client.

export interface AdvanceArgs {
  ticketId:        string
  /** Statuts Ã  partir desquels la transition est autorisÃ©e. */
  from:            RequestStatus[]
  /** Statut cible. */
  to:              RequestStatus
  /** Colonne timestamp Ã  renseigner avec NOW(). */
  timestampColumn?: keyof TicketUpdate
  /** ID de copie email envoyÃ© au client Ã  la transition. null = pas d'email. */
  emailStep:       ClientStepEmail | null
  /** Champs additionnels Ã  patcher (ex: assignations). */
  patch?:          Partial<TicketUpdate>
  /** Note optionnelle Ã  enregistrer dans ticket_status_history. */
  historyNote?:    string
}

export async function advanceTicketStep(args: AdvanceArgs) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifiÃ©'] } }

  const { ticketId, from, to, timestampColumn, emailStep, patch, historyNote } = args

  // Lit le status courant + les infos client/Ã©cole pour l'email.
  const { data: current, error: fetchError } = await supabase
    .from('service_requests')
    .select('id, status, first_name, last_name, email, ticket_number, referent_school_id')
    .eq('id', ticketId)
    .single()
    .returns<{
      id:                  string
      status:              RequestStatus
      first_name:          string | null
      last_name:           string | null
      email:               string | null
      ticket_number:       string | null
      referent_school_id:  string | null
    }>()

  if (fetchError || !current) {
    return { error: { _form: ['Demande introuvable'] } }
  }

  // Garde-fou sÃ©quentiel : si le statut courant n'est pas dans la whitelist
  // ET qu'on n'est pas dÃ©jÃ  au statut cible (idempotence), on refuse.
  if (!from.includes(current.status) && current.status !== to) {
    return {
      error: {
        _form: [
          `Ã‰tape impossible depuis le statut actuel (Â« ${current.status} Â»). ` +
          `RafraÃ®chissez la page pour voir l'Ã©tat Ã  jour.`,
        ],
      },
    }
  }

  const now = new Date().toISOString()
  const update: Partial<TicketUpdate> = {
    ...(patch ?? {}),
    status: to,
  }
  if (timestampColumn) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(update as any)[timestampColumn] = now
  }

  const { error: updateError } = await supabase
    .from('service_requests')
    .update(update)
    .eq('id', ticketId)

  if (updateError) {
    return { error: { _form: [`Erreur lors de la mise Ã  jour (${updateError.message})`] } }
  }

  // Audit trail (best-effort)
  const { error: histError } = await supabase.from('ticket_status_history').insert({
    ticket_id:  ticketId,
    old_status: requestStatusToSavStatus(current.status),
    new_status: requestStatusToSavStatus(to),
    changed_by: user.id,
    note:       historyNote ?? null,
  })
  if (histError) console.error('[SAV] ticket_status_history insert failed:', histError.message)

  // Notification client (best-effort â€” n'interrompt jamais la transition)
  if (emailStep && current.email) {
    try {
      const schoolDetail = current.referent_school_id
        ? await getPartnerSchoolById(current.referent_school_id)
        : null
      const ref = current.ticket_number ?? `#${current.id.slice(0, 8).toUpperCase()}`
      const r = await sendClientStepUpdateEmail(supabase, emailStep, {
        ticketId:    current.id,
        ticketRef:   ref,
        clientFirst: current.first_name ?? 'Pilote',
        clientEmail: current.email,
        schoolName:  schoolDetail?.name ?? null,
      })
      if (!r.ok) console.warn(`[advanceTicketStep] step email "${emailStep}" skipped:`, r.error)
    } catch (e) {
      console.warn(`[advanceTicketStep] step email "${emailStep}" threw:`, e)
    }
  }

  // Revalidation des pages susceptibles d'afficher ce ticket.
  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  revalidatePath('/client')
  revalidatePath('/school')
  revalidatePath('/workshop')
  revalidatePath('/plume')

  return { success: true as const, previousStatus: current.status }
}

