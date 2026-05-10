'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRoles } from '@/features/auth/queries'
import { PARTNER_WORKSHOPS } from '../constants'
import { getPartnerSchoolById } from '../queries'
import type {
  ClientShippingAddress,
  MessageSenderRole,
  ProblemCategory,
  RequestStatus,
  SchoolResolution,
  ServiceType,
  ShipmentLeg,
  TicketStatus,
  TicketUpdate,
  WizardProblemCategory,
} from '../types'
import {
  adminCloseTicketSchema,
  adminReassignSchoolSchema,
  adminRemindSchoolSchema,
  assignWorkshopSchema,
} from '../schemas'
import { sendClientStepUpdateEmail, type ClientStepEmail, type TicketEmailContext } from '../email'
import { requestStatusToSavStatus } from './_helpers'

export async function assignWorkshopForCommunicationAction(formData: FormData) {
  const parsed = assignWorkshopSchema.safeParse({
    ticketId:      formData.get('ticketId'),
    workshopId:    formData.get('workshopId'),
    workshopLabel: formData.get('workshopLabel'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ['Non authentifié'] } }

  const { ticketId, workshopId, workshopLabel } = parsed.data

  // Garde-fou : workshopId doit être dans PARTNER_WORKSHOPS (anti-forge).
  if (!PARTNER_WORKSHOPS.some((w) => w.id === workshopId)) {
    return { error: { _form: ["Atelier inconnu — choisissez un atelier du réseau partenaire"] } }
  }

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('service_requests')
    .update({
      assigned_workshop_id:    workshopId,
      assigned_workshop_label: workshopLabel,
      workshop_assigned_at:    now,
      workshop_assigned_by:    user.id,
    })
    .eq('id', ticketId)

  if (error) return { error: { _form: [`Erreur lors de l'assignation (${error.message})`] } }

  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  return { success: true }
}

// ============================================================
// Actions admin Plume HQ (T2) — toutes refusent si rôle ≠ plume_admin
// ============================================================

async function ensurePlumeAdmin(): Promise<{ ok: true; userId: string } | { ok: false; error: { _form: string[] } }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: { _form: ['Non authentifié'] } }
  const roles = await getCurrentUserRoles()
  if (!roles.includes('plume_admin')) {
    return { ok: false, error: { _form: ['Action réservée à Plume HQ'] } }
  }
  return { ok: true, userId: user.id }
}

/**
 * Réassigne un ticket à une autre école. Met à jour `school_id` (école qui
 * traite désormais) ET `referent_school_id` (nouvelle école référente). La
 * raison est postée comme message interne `plume_only` pour la traçabilité.
 */
export async function adminReassignSchoolAction(formData: FormData) {
  const parsed = adminReassignSchoolSchema.safeParse({
    ticketId: formData.get('ticketId'),
    schoolId: formData.get('schoolId'),
    reason:   formData.get('reason'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const auth = await ensurePlumeAdmin()
  if (!auth.ok) return { error: auth.error }

  const { ticketId, schoolId, reason } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from('service_requests')
    .update({
      school_id:          schoolId,
      referent_school_id: schoolId,
    })
    .eq('id', ticketId)

  if (error) return { error: { _form: [`Erreur réassignation (${error.message})`] } }

  // Trace en interne pour Plume — pas visible côté client/école/atelier.
  await supabase.from('ticket_messages').insert({
    ticket_id:        ticketId,
    sender_id:        auth.userId,
    sender_role:      'plume_admin' as MessageSenderRole,
    content:          `[Réassignation] Ticket transféré à une autre école.\nMotif : ${reason}`,
    is_internal:      true,
    visibility_level: 'plume_only',
  })

  revalidatePath('/plume')
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  return { success: true }
}

/**
 * Clôture manuelle d'un ticket par Plume HQ (status → completed). Note
 * obligatoire pour la traçabilité, postée en interne `plume_only`.
 */
export async function adminCloseTicketAction(formData: FormData) {
  const parsed = adminCloseTicketSchema.safeParse({
    ticketId: formData.get('ticketId'),
    note:     formData.get('note'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const auth = await ensurePlumeAdmin()
  if (!auth.ok) return { error: auth.error }

  const { ticketId, note } = parsed.data
  const supabase = await createClient()

  const { data: current } = await supabase
    .from('service_requests')
    .select('status')
    .eq('id', ticketId)
    .single()
    .returns<{ status: RequestStatus }>()

  const { error } = await supabase
    .from('service_requests')
    .update({
      status:          'completed' as RequestStatus,
      sav_status:      'closed' as TicketStatus,
      completion_date: new Date().toISOString(),
    })
    .eq('id', ticketId)

  if (error) return { error: { _form: [`Erreur clôture (${error.message})`] } }

  await supabase.from('ticket_messages').insert({
    ticket_id:        ticketId,
    sender_id:        auth.userId,
    sender_role:      'plume_admin' as MessageSenderRole,
    content:          `[Clôture admin] ${note}`,
    is_internal:      true,
    visibility_level: 'plume_only',
  })

  // Audit trail — best-effort (la table peut ne pas exister sur certains envs).
  if (current?.status) {
    const { error: histError } = await supabase.from('ticket_status_history').insert({
      ticket_id:  ticketId,
      old_status: requestStatusToSavStatus(current.status),
      new_status: 'closed' as TicketStatus,
      changed_by: auth.userId,
      note:       `Clôture admin : ${note}`,
    })
    if (histError) console.warn('ticket_status_history insert failed:', histError.message)
  }

  revalidatePath('/plume')
  revalidatePath(`/client/ticket/${ticketId}`)
  revalidatePath(`/school/ticket/${ticketId}`)
  revalidatePath(`/workshop/ticket/${ticketId}`)
  return { success: true }
}

/**
 * Relance email de l'école : envoie une notification "rappel" via Resend
 * (réutilise `send-email-resend` Edge Function comme les autres emails SAV).
 * Best-effort — log un warning si l'école n'a pas d'email connu.
 */
export async function adminRemindSchoolAction(formData: FormData) {
  const parsed = adminRemindSchoolSchema.safeParse({
    ticketId: formData.get('ticketId'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const auth = await ensurePlumeAdmin()
  if (!auth.ok) return { error: auth.error }

  const { ticketId } = parsed.data
  const supabase = await createClient()

  const { data: ticket } = await supabase
    .from('service_requests')
    .select('school_id, ticket_number, first_name, last_name, product_brand, product_model, created_at')
    .eq('id', ticketId)
    .single()
    .returns<{
      school_id:      string | null
      ticket_number:  string | null
      first_name:     string | null
      last_name:      string | null
      product_brand:  string | null
      product_model:  string | null
      created_at:     string
    }>()

  if (!ticket) return { error: { _form: ['Ticket introuvable'] } }
  if (!ticket.school_id) {
    return { error: { _form: ["Aucune école assignée à ce ticket"] } }
  }

  const school = await getPartnerSchoolById(ticket.school_id)
  if (!school?.email) {
    return { error: { _form: ["L'école n'a pas d'email enregistré dans partner_schools"] } }
  }

  const ticketRef = ticket.ticket_number ?? `#${ticketId.slice(0, 8).toUpperCase()}`
  const fullName  = `${ticket.first_name ?? ''} ${ticket.last_name ?? ''}`.trim() || 'le client'
  const wing      = `${ticket.product_brand ?? ''} ${ticket.product_model ?? ''}`.trim() || 'l\'aile'
  const daysOpen  = Math.max(0, Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 86_400_000))

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <p style="font-size:12px;color:#9333ea;letter-spacing:.08em;text-transform:uppercase;margin:0">Plume HQ — relance</p>
      <h1 style="font-size:20px;color:#0f172a;margin:8px 0 16px">Ticket SAV ${ticketRef} en attente</h1>
      <p style="color:#334155;line-height:1.55">Bonjour,</p>
      <p style="color:#334155;line-height:1.55">
        Le ticket SAV de ${fullName} pour ${wing} a été ouvert il y a <strong>${daysOpen} jour${daysOpen > 1 ? 's' : ''}</strong>
        et n'a pas encore été pris en charge par votre école.
      </p>
      <p style="color:#334155;line-height:1.55">
        Merci de prendre quelques minutes pour le traiter dans votre espace École :
      </p>
      <p style="margin:24px 0">
        <a href="https://sav.plumeparagliders.com/school/ticket/${ticketId}"
           style="background:#f59e0b;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">
          Ouvrir le ticket ${ticketRef}
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:32px">— L'équipe Plume</p>
    </div>
  `

  try {
    const { error } = await supabase.functions.invoke('send-email-resend', {
      body: {
        to:         school.email,
        subject:    `Plume SAV — Relance ticket ${ticketRef} en attente depuis ${daysOpen} j`,
        html,
        email_type: 'sav_notification',
      },
    })
    if (error) return { error: { _form: [`Erreur envoi email (${error.message})`] } }
  } catch (e) {
    return { error: { _form: [`Erreur envoi email (${e instanceof Error ? e.message : String(e)})`] } }
  }

  // Trace de la relance — visible Plume uniquement.
  await supabase.from('ticket_messages').insert({
    ticket_id:        ticketId,
    sender_id:        auth.userId,
    sender_role:      'plume_admin' as MessageSenderRole,
    content:          `[Relance école] Email envoyé à ${school.email} (ticket ouvert depuis ${daysOpen} j).`,
    is_internal:      true,
    visibility_level: 'plume_only',
  })

  revalidatePath('/plume')
  return { success: true }
}

