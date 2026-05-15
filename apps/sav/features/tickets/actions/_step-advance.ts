import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendClientStepUpdateEmail, type ClientStepEmail, type TicketEmailContext } from '../email'
import type { RequestStatus, TicketStatus, TicketUpdate } from '../types'
import { getPartnerSchoolById } from '../queries'
import { requestStatusToSavStatus } from './_helpers'
import {
  notifyClientOnEscalatedToWorkshop,
  notifyClientOnWingReceivedSchool,
  notifyClientOnWingReturned,
} from '@/features/notifications/sav-events'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mapping emailStep → helper de notif in-app. Seules les transitions
// "intéressantes pour le client" déclenchent une notif. Les étapes purement
// internes (school_acknowledged…) restent silencieuses pour ne pas spammer.
const NOTIFY_CLIENT_BY_STEP: Partial<Record<
  ClientStepEmail,
  (supabase: SupabaseClient, ticketId: string) => Promise<void>
>> = {
  wing_received_school:   notifyClientOnWingReceivedSchool,
  escalated_to_workshop:  notifyClientOnEscalatedToWorkshop,
  wing_returned:          notifyClientOnWingReturned,
  // Les autres étapes (school_checking, school_resolved, workshop_diagnosing…)
  // restent silencieuses faute de helper dédié. À étendre quand nécessaire.
}

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

// Colonnes timestamp persistant l'horodatage de chaque transition (toutes
// typées `string | null` côté DB). Restreint au sous-ensemble réellement
// utilisé pour que `update[timestampColumn] = now` reste type-safe sans cast.
type TimestampColumn =
  | 'school_acknowledged_at'
  | 'wing_received_school_at'
  | 'escalated_to_workshop_at'
  | 'wing_received_workshop_at'
  | 'workshop_diagnosis_at'
  | 'workshop_repair_done_at'
  | 'wing_returned_at'
  | 'pre_check_started_at'

export interface AdvanceArgs {
  ticketId:        string
  /** Statuts Ã  partir desquels la transition est autorisÃ©e. */
  from:            RequestStatus[]
  /** Statut cible. */
  to:              RequestStatus
  /** Colonne timestamp Ã  renseigner avec NOW(). */
  timestampColumn?: TimestampColumn
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
    .select('id, status, first_name, last_name, email, referent_school_id')
    .eq('id', ticketId)
    .single()
    .returns<{
      id:                  string
      status:              RequestStatus
      first_name:          string | null
      last_name:           string | null
      email:               string | null
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
    update[timestampColumn] = now
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
      const ref = `#${current.id.slice(0, 8).toUpperCase()}`
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

  // Notification in-app pour le client (best-effort, parallèle à l'email).
  // Mapping emailStep → helper ; les étapes sans helper restent silencieuses.
  if (emailStep) {
    const notifier = NOTIFY_CLIENT_BY_STEP[emailStep]
    if (notifier) {
      try {
        await notifier(supabase, ticketId)
      } catch (e) {
        console.warn(`[advanceTicketStep] in-app notif "${emailStep}" threw:`, e)
      }
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
  // Layout-level : badge NotificationsNavButton doit recompter après la
  // transition (+1 unread côté client si une notif a été créée).
  revalidatePath('/client', 'layout')

  return { success: true as const, previousStatus: current.status }
}




