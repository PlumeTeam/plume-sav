// SAV — notifications email (via Supabase Edge Function `send-email-resend`).
//
// Two notifications fire after a successful ticket creation:
//  1. To the client — "demande enregistrée" confirmation
//  2. To the partner school — "nouveau ticket" alert
//
// Both are best-effort: the calling action wraps them in Promise.allSettled
// so an outage on Resend / the edge function never blocks ticket creation.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@plume/db'

const APP_URL    = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://plume-sav.vercel.app').replace(/\/$/, '')
const PLUME_NAVY  = '#1a1a2e'
const PLUME_CORAL = '#E85D26'
const PLUME_CREAM = '#FAF6F0'
const PLUME_INK   = '#0f0f1d'

export type EmailDeliveryMethod = 'in_person' | 'postal'

export interface TicketEmailContext {
  ticketId:        string
  ticketRef:       string
  client: {
    firstName:     string
    lastName:      string
    email:         string
  }
  school: {
    name:          string
    email:         string | null
    city?:         string | null
  }
  wing: {
    brand:         string
    model:         string
    size:          string
    color:         string
    serial:        string
  }
  problemLabel:    string
  description:     string  // already-rich description (with [Catégorie] prefix etc.)
  urgency:         'normal' | 'urgent'
  deliveryMethod:  EmailDeliveryMethod
  /** Optional personalised message from the client (already trimmed). */
  clientMessage?:  string
}

// ─── HTML helpers ──────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Preserves newlines for description blocks where the user's free text matters.
function escapeBlock(s: string): string {
  return escapeHtml(s).replace(/\r?\n/g, '<br/>')
}

function deliveryLabel(method: EmailDeliveryMethod, schoolName: string): string {
  return method === 'in_person'
    ? `Le client va déposer son aile en main propre à ${schoolName}.`
    : `Le client envoie son aile par la poste à ${schoolName}.`
}

function urgencyLabel(u: 'normal' | 'urgent'): string {
  return u === 'urgent' ? '🚨 Urgent' : '⏳ Normal'
}

// ─── Templates ─────────────────────────────────────────────────────────────

function clientConfirmationHTML(ctx: TicketEmailContext): string {
  const ticketUrl = `${APP_URL}/client/ticket/${ctx.ticketId}`
  const nextStep = ctx.deliveryMethod === 'in_person'
    ? `Contactez ${escapeHtml(ctx.school.name)} pour convenir d'un rendez-vous et déposer votre aile.`
    : `${escapeHtml(ctx.school.name)} vous contactera une fois l'aile reçue et analysée.`

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${PLUME_CREAM};font-family:Helvetica,Arial,sans-serif;color:${PLUME_INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PLUME_CREAM};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:${PLUME_NAVY};padding:28px 32px;color:#fff;">
          <p style="margin:0;font-size:11px;letter-spacing:1.5px;color:${PLUME_CORAL};text-transform:uppercase;">Plume Paragliders</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;">Votre demande SAV est enregistrée</h1>
        </td></tr>

        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 16px;font-size:15px;">Bonjour ${escapeHtml(ctx.client.firstName)},</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.5;">Votre demande SAV a bien été enregistrée. Voici le récapitulatif&nbsp;:</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PLUME_CREAM};border-radius:12px;">
            <tr><td style="padding:16px 18px;">
              ${recapRow('Référence', `<span style="font-family:Menlo,Monaco,monospace;">${escapeHtml(ctx.ticketRef)}</span>`)}
              ${recapRow('Aile', escapeHtml(`${ctx.wing.brand} ${ctx.wing.model} — Taille ${ctx.wing.size} — ${ctx.wing.color}`))}
              ${recapRow('Type de problème', escapeHtml(ctx.problemLabel))}
              ${recapRow('École destinataire', escapeHtml(ctx.school.name) + (ctx.school.city ? ` <span style="color:#64748b;">(${escapeHtml(ctx.school.city)})</span>` : ''))}
              ${recapRow('Mode de livraison', ctx.deliveryMethod === 'in_person' ? '🤝 Remise en main propre' : '📦 Envoi postal', true)}
            </td></tr>
          </table>

          <p style="margin:24px 0 20px;font-size:15px;line-height:1.5;">${nextStep}</p>

          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background:${PLUME_CORAL};border-radius:10px;">
              <a href="${ticketUrl}" style="display:inline-block;padding:12px 24px;color:#fff;text-decoration:none;font-weight:600;font-size:14px;">Voir mon ticket →</a>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;color:#64748b;">
            Vous pouvez à tout moment retrouver ce ticket dans votre espace SAV&nbsp;:
            <a href="${APP_URL}/client" style="color:${PLUME_CORAL};">${APP_URL}/client</a>
          </p>
        </td></tr>

        <tr><td style="padding:18px 32px;background:${PLUME_CREAM};border-top:1px solid #E9E4DC;">
          <p style="margin:0;font-size:12px;color:#64748b;">
            Plume Paragliders — SAV<br/>
            <a href="mailto:sav@plumeparagliders.com" style="color:#64748b;">sav@plumeparagliders.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function schoolNotificationHTML(ctx: TicketEmailContext): string {
  const schoolUrl = `${APP_URL}/school/ticket/${ctx.ticketId}`
  const fullName  = `${ctx.client.firstName} ${ctx.client.lastName}`.trim()
  const isUrgent  = ctx.urgency === 'urgent'

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${PLUME_CREAM};font-family:Helvetica,Arial,sans-serif;color:${PLUME_INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PLUME_CREAM};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background:#fff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:${PLUME_NAVY};padding:28px 32px;color:#fff;">
          <p style="margin:0;font-size:11px;letter-spacing:1.5px;color:${PLUME_CORAL};text-transform:uppercase;">Plume SAV — École</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;">Nouveau ticket SAV</h1>
          ${isUrgent
            ? `<p style="margin:8px 0 0;display:inline-block;background:#dc2626;color:#fff;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;">🚨 Marqué urgent</p>`
            : ''}
        </td></tr>

        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 16px;font-size:15px;">Bonjour,</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.5;">
            Un nouveau ticket SAV vient d'être créé par <strong>${escapeHtml(fullName)}</strong>
            (<a href="mailto:${escapeHtml(ctx.client.email)}" style="color:${PLUME_CORAL};">${escapeHtml(ctx.client.email)}</a>).
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PLUME_CREAM};border-radius:12px;">
            <tr><td style="padding:16px 18px;">
              ${recapRow('Référence', `<span style="font-family:Menlo,Monaco,monospace;">${escapeHtml(ctx.ticketRef)}</span>`)}
              ${recapRow('Aile', escapeHtml(`${ctx.wing.brand} ${ctx.wing.model} — Taille ${ctx.wing.size} — ${ctx.wing.color}`))}
              ${recapRow('Numéro de série', `<span style="font-family:Menlo,Monaco,monospace;">${escapeHtml(ctx.wing.serial)}</span>`)}
              ${recapRow('Type de problème', escapeHtml(ctx.problemLabel))}
              ${recapRow('Urgence', urgencyLabel(ctx.urgency), true)}
            </td></tr>
          </table>

          ${ctx.clientMessage ? `
          <p style="margin:22px 0 8px;font-size:11px;letter-spacing:0.5px;color:${PLUME_CORAL};text-transform:uppercase;">Message du client</p>
          <div style="padding:14px 16px;background:${PLUME_CREAM};border-left:3px solid ${PLUME_CORAL};border-radius:10px;font-size:14px;line-height:1.5;font-style:italic;color:${PLUME_INK};">
            ${escapeBlock(ctx.clientMessage)}
          </div>
          ` : ''}

          <p style="margin:22px 0 8px;font-size:11px;letter-spacing:0.5px;color:#64748b;text-transform:uppercase;">Description complète</p>
          <div style="padding:14px 16px;background:#fff;border:1px solid #E9E4DC;border-radius:10px;font-size:14px;line-height:1.5;">
            ${escapeBlock(ctx.description)}
          </div>

          <div style="margin:22px 0 0;padding:14px 16px;border-radius:10px;background:${ctx.deliveryMethod === 'postal' ? '#FEF3C7' : '#D1FAE5'};">
            <p style="margin:0;font-size:14px;font-weight:600;color:${ctx.deliveryMethod === 'postal' ? '#78350F' : '#065F46'};">
              ${ctx.deliveryMethod === 'postal' ? '📦 Envoi postal' : '🤝 Remise en main propre'}
            </p>
            <p style="margin:6px 0 0;font-size:13px;color:${ctx.deliveryMethod === 'postal' ? '#78350F' : '#065F46'};">
              ${ctx.deliveryMethod === 'postal'
                ? "Le client envoie son aile par la poste. Le numéro de suivi vous parviendra via la messagerie du ticket."
                : "Le client va vous contacter pour prendre rendez-vous et déposer son aile."}
            </p>
          </div>

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
            <tr><td style="background:${PLUME_CORAL};border-radius:10px;">
              <a href="${schoolUrl}" style="display:inline-block;padding:12px 24px;color:#fff;text-decoration:none;font-weight:600;font-size:14px;">Ouvrir le ticket →</a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:18px 32px;background:${PLUME_CREAM};border-top:1px solid #E9E4DC;">
          <p style="margin:0;font-size:12px;color:#64748b;">
            Plume Paragliders — SAV<br/>
            <a href="mailto:sav@plumeparagliders.com" style="color:#64748b;">sav@plumeparagliders.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function recapRow(label: string, value: string, isLast = false): string {
  return `
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.5px;color:#64748b;text-transform:uppercase;">${label}</p>
    <p style="margin:0${isLast ? '' : ' 0 14px'};font-size:14px;color:${PLUME_INK};">${value}</p>
  `
}

// ─── Senders ───────────────────────────────────────────────────────────────

type SendResult = { ok: true } | { ok: false; error: string }

export async function sendClientConfirmationEmail(
  supabase: SupabaseClient<Database>,
  ctx: TicketEmailContext,
): Promise<SendResult> {
  if (!ctx.client.email) return { ok: false, error: 'no client email' }
  try {
    const { error } = await supabase.functions.invoke('send-email-resend', {
      body: {
        to:         ctx.client.email,
        subject:    `Plume SAV — Votre demande ${ctx.ticketRef} a bien été créée`,
        html:       clientConfirmationHTML(ctx),
        email_type: 'sav_notification',
      },
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function sendSchoolNotificationEmail(
  supabase: SupabaseClient<Database>,
  ctx: TicketEmailContext,
): Promise<SendResult> {
  if (!ctx.school.email) return { ok: false, error: 'no school email' }
  const fullName = `${ctx.client.firstName} ${ctx.client.lastName}`.trim()
  try {
    const { error } = await supabase.functions.invoke('send-email-resend', {
      body: {
        to:         ctx.school.email,
        subject:    `Plume SAV — Nouveau ticket ${ctx.ticketRef} de ${fullName}`,
        html:       schoolNotificationHTML(ctx),
        email_type: 'sav_notification',
      },
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
// Keep delivery_method label in one place even if used elsewhere later.
export { deliveryLabel as describeDeliveryMethod }
