import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendClientStepUpdateEmail, type ClientStepEmail, type TicketEmailContext } from '../email'
import type { RequestStatus, TicketStatus, TicketUpdate } from '../types'
import { getPartnerSchoolById } from '../queries'
import { requestStatusToSavStatus } from './_helpers'

// ============================================================
// Pipeline d'étapes SAV (migration 20260509000000)
// ============================================================
//
// Chaque transition est :
//  - séquentielle (refus si le statut actuel n'est pas dans la whitelist),
//  - write-once (le timestamp se remplit côté DB en even of duplicate clicks),
//  - notifiée au client par email (best-effort).
//
// Les boutons UI s'appuient sur des Server Actions dédiées plutôt qu'un seul
// `updateStatusAction` générique : ça permet d'écrire le timestamp correspondant
// et de cibler la bonne copie email sans couplage côté client.

export interface AdvanceArgs {
  ticketId:        string
  /** Statuts à partir desquels la transition est autorisée. */
  from:            RequestStatus[]
  /** Statut cible. */
  to:              RequestStatus
  /** Colonne timestamp à renseigner avec NOW(). */
  timestampColumn?: keyof TicketUpdate
  /** ID de copie email envoyé au client à la transition. null = pas d'email. */
  emailStep:       ClientStepEmail | null
  /** Champs additionnels à patcher (ex: assignations). */
  patch?:          Partial<TicketUpdate>
  /** Note optionnelle à enregistrer dans ticket_status_history. */
  historyNote?:    string
}

export async function advanceTicketStep(args: AdvanceArgs) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const { ticketId, from, to, timestampColumn, emailStep, patch, historyNote } = args

  // Lit le status courant + les infos client/école pour l'email.
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

  // Garde-fou séquentiel : si le statut courant n'est pas dans la whitelist
  // ET qu'on n'est pas déjà au statut cible (idempotence), on refuse.
  if (!from.includes(current.status) && current.status !== to) {
    return {
      error: {
        _form: [
          `Étape impossible depuis le statut actuel (« ${current.status} »). ` +
          `Rafraîchissez la page pour voir l'état à jour.`,
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
    return { error: { _form: [`Erreur lors de la mise à jour (${updateError.message})`] } }
  }

  // Audit trail (best-effort)
  const { error: histError } = await supabase.from('ticket_status_history').insert({
    ticket_id:  ticketId,
    old_status: requestStatusToSavStatus(current.status),
    new_status: requestStatusToSavStatus(to),
    changed_by: user.id,
    note:       historyNote ?? null,
  })
  if (histError) console.warn('ticket_status_history insert failed:', histError.message)

  // Notification client (best-effort — n'interrompt jamais la transition)
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
