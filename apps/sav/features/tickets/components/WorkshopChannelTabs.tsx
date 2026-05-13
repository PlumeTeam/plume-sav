'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addChannelMessageAction } from '@/features/tickets/actions'
import { formatDateTime } from '../utils'
import type { MessageChannel, MessageSenderRole, TicketMessage } from '../types'

interface ChannelDef {
  id:          MessageChannel
  label:       string
  emoji:       string
  description: string
}

// Onglets côté atelier — libellés à la première personne (point de vue
// atelier). 4 canaux : Client, École, Groupe, Plume.
//
// Note : Plume HQ reçoit aussi le canal Groupe en lecture silencieuse pour
// la supervision, mais ce détail n'est pas exposé dans l'UI atelier — la
// description doit rester centrée sur les acteurs visibles côté technicien.
// Le canal 'school_client' (école↔client) n'est plus surfacé ici : il n'a
// pas d'intérêt opérationnel pour l'atelier.
const CHANNELS: ChannelDef[] = [
  {
    id:          'client_workshop',
    label:       'Client',
    emoji:       '👤',
    description: 'Discussion directe avec le client. L\'école ne voit pas.',
  },
  {
    id:          'workshop_school',
    label:       'École',
    emoji:       '🏫',
    description: 'Échange technique avec l\'école qui a escaladé. Le client ne voit pas.',
  },
  {
    id:          'group',
    label:       'Groupe',
    emoji:       '👥',
    description: 'Discussion visible par le client, l\'école et l\'atelier.',
  },
  {
    id:          'workshop_plume',
    label:       'Plume',
    emoji:       '🦅',
    description: 'Canal privé avec Plume HQ. Ni le client ni l\'école ne voient.',
  },
]

const ROLE_LABELS: Record<MessageSenderRole, string> = {
  client:      'Client',
  school:      'École',
  workshop:    'Atelier',
  plume_admin: 'Plume HQ',
}

interface Props {
  ticketId: string
  /** Tous les messages du ticket — on filtre par canal côté client. */
  messages: TicketMessage[]
  /** Storage bucket pour les pièces jointes (par défaut 'tickets'). */
  bucket?:  string
  /** Id du user courant — utilisé pour préfixer le storage path. */
  currentUserId: string
}

type Attachment = {
  /** Storage path final (après upload). */
  path: string
  /** Aperçu local en data URL pour preview avant publish. */
  previewUrl: string
}

export function WorkshopChannelTabs({
  ticketId,
  messages,
  bucket = 'tickets',
  currentUserId,
}: Props) {
  const [activeId, setActiveId] = useState<MessageChannel>(CHANNELS[0]!.id)

  const counts = useMemo(() => {
    const map = new Map<MessageChannel, number>()
    for (const c of CHANNELS) map.set(c.id, 0)
    for (const m of messages) {
      if (m.channel) {
        map.set(m.channel as MessageChannel, (map.get(m.channel as MessageChannel) ?? 0) + 1)
      }
    }
    return map
  }, [messages])

  const visible = useMemo(
    () => messages
      .filter((m) => m.channel === activeId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages, activeId],
  )

  const active = CHANNELS.find((c) => c.id === activeId) ?? CHANNELS[0]!

  return (
    <div className="space-y-3">
      {/* Sélecteur d'onglets — scroll horizontal sur mobile */}
      <div
        role="tablist"
        aria-label="Canaux de discussion"
        className="-mx-1 flex gap-1.5 overflow-x-auto rounded-2xl bg-white p-1 ring-1 ring-brand-stone scrollbar-thin"
      >
        {CHANNELS.map((c) => {
          const isActive = c.id === activeId
          const count = counts.get(c.id) ?? 0
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(c.id)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 ${
                isActive
                  ? 'bg-brand-gold text-brand-ink shadow-sm'
                  : 'text-slate-500 hover:bg-brand-cream/50 hover:text-brand-ink'
              }`}
            >
              <span aria-hidden>{c.emoji}</span>
              <span className="whitespace-nowrap">{c.label}</span>
              {count > 0 && (
                <span
                  className={`ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                    isActive ? 'bg-brand-ink/15 text-brand-ink' : 'bg-brand-cream text-brand-ink'
                  }`}
                  aria-label={`${count} message${count > 1 ? 's' : ''}`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-slate-500">{active.description}</p>

      <section className="card p-5">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <span aria-hidden>{active.emoji}</span>
          <span>{active.label}</span>
        </h2>
        <ChannelThread
          messages={visible}
          bucket={bucket}
          emptyText="Aucun message dans ce canal. Soyez le premier à écrire."
        />
      </section>

      <ChannelComposer
        key={active.id}
        ticketId={ticketId}
        channel={active.id}
        bucket={bucket}
        currentUserId={currentUserId}
      />
    </div>
  )
}

// ------------------------------------------------------------
// Thread
// ------------------------------------------------------------
function ChannelThread({
  messages,
  bucket,
  emptyText,
}: {
  messages: TicketMessage[]
  bucket:   string
  emptyText: string
}) {
  if (messages.length === 0) {
    return <p className="rounded-xl bg-brand-cream/60 p-3 text-sm text-slate-500">{emptyText}</p>
  }
  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <ChannelMessageBubble key={m.id} message={m} bucket={bucket} />
      ))}
    </div>
  )
}

function ChannelMessageBubble({ message, bucket }: { message: TicketMessage; bucket: string }) {
  const isWorkshop = message.sender_role === 'workshop'
  const showText   = message.content && message.content !== '(photo)'
  const photos     = message.attachment_paths ?? []
  return (
    <div className={`flex ${isWorkshop ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isWorkshop
            ? 'bg-brand-gold text-white rounded-br-sm'
            : 'bg-brand-cream text-brand-ink ring-1 ring-brand-stone rounded-bl-sm'
        }`}
      >
        {!isWorkshop && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {ROLE_LABELS[message.sender_role] ?? message.sender_role}
          </p>
        )}
        {photos.length > 0 && (
          <div className={`mb-2 grid gap-1.5 ${photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {photos.map((p) => (
              <AttachmentPreview key={p} path={p} bucket={bucket} />
            ))}
          </div>
        )}
        {showText && (
          <p className="whitespace-pre-line text-sm leading-relaxed">{message.content}</p>
        )}
        <p className={`mt-1 text-right text-[11px] ${isWorkshop ? 'text-white/70' : 'opacity-60'}`}>
          {formatDateTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}

function AttachmentPreview({ path, bucket }: { path: string; bucket: string }) {
  const supabase = createClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  const url = data?.publicUrl ?? ''
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-xl ring-1 ring-black/10"
    >
      <img
        src={url}
        alt="Pièce jointe"
        className="h-32 w-full object-cover"
        loading="lazy"
      />
    </a>
  )
}

// ------------------------------------------------------------
// Composer (texte + photos)
// ------------------------------------------------------------
function ChannelComposer({
  ticketId,
  channel,
  bucket,
  currentUserId,
}: {
  ticketId:      string
  channel:       MessageChannel
  bucket:        string
  currentUserId: string
}) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function compressAndUpload(file: File): Promise<Attachment | null> {
    // Compression cliente (règle 4 — max 1600px, qualité ~0.8)
    let finalFile: File = file
    try {
      const mod = (await import('browser-image-compression')).default
      const compressed = await mod(file, {
        maxSizeMB:        1.2,
        maxWidthOrHeight: 1600,
        useWebWorker:     true,
        initialQuality:   0.8,
      })
      const blob = compressed as Blob & { name?: string }
      finalFile = blob instanceof File
        ? blob
        : new File([blob], file.name, { type: blob.type || 'image/jpeg' })
    } catch (err) {
      console.warn('[ChannelComposer] compression failed, uploading original:', err)
    }

    const rawExt = finalFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const ext = /^[a-z0-9]+$/.test(rawExt) ? rawExt : 'jpg'
    const path = `${currentUserId}/messages/${ticketId}/${channel}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const supabase = createClient()
    const { error } = await supabase.storage.from(bucket).upload(path, finalFile, {
      upsert:       false,
      contentType:  finalFile.type || `image/${ext}`,
      cacheControl: '3600',
    })
    if (error) {
      console.error('[ChannelComposer] upload error:', error.message)
      return null
    }

    const previewUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve('')
      reader.readAsDataURL(finalFile)
    })

    return { path, previewUrl }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setIsUploading(true)
    setFeedback(null)
    try {
      const remaining = 8 - attachments.length
      const toProcess = Array.from(files).slice(0, Math.max(0, remaining))
      const results = await Promise.all(toProcess.map(compressAndUpload))
      const ok = results.filter((r): r is Attachment => r !== null)
      if (ok.length === 0 && toProcess.length > 0) {
        setFeedback({ type: 'error', msg: "Impossible d'uploader la photo. Réessayez." })
      }
      setAttachments((prev) => [...prev, ...ok])
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removeAttachment(path: string) {
    setAttachments((prev) => prev.filter((a) => a.path !== path))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed && attachments.length === 0) return

    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      fd.set('channel',  channel)
      fd.set('content',  trimmed)
      for (const a of attachments) fd.append('attachmentPaths', a.path)

      const r = await addChannelMessageAction(fd)
      if (r?.error) {
        const err = r.error as Record<string, string[] | undefined>
        const msg = err._form?.[0] ?? err.content?.[0] ?? err.attachmentPaths?.[0] ?? "Erreur lors de l'envoi."
        setFeedback({ type: 'error', msg })
      } else {
        setContent('')
        setAttachments([])
        setFeedback({ type: 'ok', msg: '✓ Message envoyé.' })
        setTimeout(() => setFeedback(null), 2000)
      }
    })
  }

  const canSend = (!!content.trim() || attachments.length > 0) && !isPending && !isUploading

  return (
    <form onSubmit={handleSubmit} className="card space-y-3 p-5">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={5000}
        placeholder="Écrivez votre message…"
        className="field-input resize-none"
      />

      {attachments.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {attachments.map((a) => (
            <div key={a.path} className="relative overflow-hidden rounded-xl ring-1 ring-brand-stone">
              <img src={a.previewUrl} alt="" className="h-20 w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAttachment(a.path)}
                aria-label="Supprimer la photo"
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-cream px-3 py-2 text-sm font-medium text-brand-ink ring-1 ring-brand-stone hover:bg-brand-cream/70">
          <span aria-hidden>📎</span>
          <span>{isUploading ? 'Upload…' : 'Ajouter des photos'}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={isUploading || attachments.length >= 8}
          />
        </label>
        <p className="text-[11px] text-slate-500">
          {attachments.length}/8 photo{attachments.length > 1 ? 's' : ''}
        </p>
      </div>

      {feedback && (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {feedback.msg}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSend}
        className="btn-primary w-full sm:w-auto"
      >
        {isPending ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  )
}
