'use client'

interface SchoolCheckBriefingProps {
  onContinue: () => void
  onCancel:   () => void
}

/**
 * Page d'information affichée APRÈS le scan flashcode et AVANT le wizard de
 * check terrain. Rappelle à l'école son rôle de filtre N1 — pas d'expertise.
 *
 * Ton volontairement informatif, pas accusatoire ni juridique : l'objectif
 * est de positionner l'école comme partenaire qui aide Plume à protéger les
 * ateliers, pas comme un acteur qui s'engage techniquement.
 *
 * Trigger : SchoolCheckGate, après onScanSuccess.
 */
export function SchoolCheckBriefing({ onContinue, onCancel }: SchoolCheckBriefingProps) {
  return (
    <div className="rounded-card border-2 border-brand-stone bg-white p-5 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">
        Avant de commencer
      </p>
      <h2 className="mt-1 text-xl font-bold text-brand-ink sm:text-2xl">
        Votre rôle : filtrer, pas expertiser
      </h2>

      <p className="mt-4 text-sm leading-relaxed text-brand-ink">
        Le check terrain a un objectif simple : <strong>résoudre sur place ce qui
        peut l&apos;être</strong>, pour éviter d&apos;envoyer en atelier partenaire des
        cas qui n&apos;en ont pas besoin. Vous n&apos;êtes <strong>pas attendus comme
        experts techniques</strong> — Plume connaît les limites de ce qui est
        raisonnable de demander à une école.
      </p>

      {/* ── Ce que l'école peut gérer directement ──────────────────────── */}
      <div className="mt-5 rounded-2xl border-l-4 border-emerald-500 bg-emerald-50/60 p-4">
        <p className="text-sm font-semibold text-emerald-900">
          ✅ Vous pouvez gérer directement
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-emerald-900/90">
          <li>
            • Une <strong>déchirure simple en ripstop</strong> — à <strong>plus de
            3 cm</strong> d&apos;une couture, sur <strong>moins de 10 cm</strong> de
            long, sans tension structurelle.
          </li>
          <li>
            • Une <strong>observation de comportement</strong> (aile qui ne vole pas
            droit, fragilité au gonflage, sensation inhabituelle) — vous décrivez
            ce que le client a ressenti, vous validez à l&apos;essai au sol si
            possible.
          </li>
          <li>
            • Un <strong>détail visuel évident et bénin</strong> : fil de couture qui
            se balade, petit accroc superficiel, élastique de freinage à remettre
            en place.
          </li>
        </ul>
      </div>

      {/* ── Ce qui doit être escaladé ──────────────────────────────────── */}
      <div className="mt-4 rounded-2xl border-l-4 border-amber-500 bg-amber-50/60 p-4">
        <p className="text-sm font-semibold text-amber-900">
          ⚠️ Au moindre doute, escaladez vers l&apos;atelier partenaire
        </p>
        <p className="mt-2 text-sm text-amber-900/90">
          Déchirure proche d&apos;une couture, longue, ou sur une zone structurelle.
          Suspente abîmée ou cassée. Élévateur usé. Maillon douteux. Porosité.
          Aile ayant pris l&apos;eau salée ou subi un crash. Toute incertitude sur
          la navigabilité.
        </p>
        <p className="mt-2 text-sm font-semibold text-amber-900">
          Vous ne vous engagez pas — c&apos;est la philosophie même du filtre.
        </p>
      </div>

      {/* ── Bouton d'engagement ────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
        <button
          type="button"
          onClick={onContinue}
          className="flex-1 rounded-xl bg-brand-gold px-5 py-3 text-sm font-semibold text-white shadow-plume transition-all hover:brightness-105 active:scale-[0.99] sm:flex-initial"
        >
          J&apos;ai compris, je commence le check →
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border-2 border-brand-stone bg-white px-5 py-3 text-sm font-medium text-brand-ink hover:bg-brand-cream"
        >
          Retour au ticket
        </button>
      </div>

      <p className="mt-4 text-center text-[11px] text-slate-500">
        Cette information est rappelée au début de chaque check pour protéger
        l&apos;école, le client, et les ateliers partenaires.
      </p>
    </div>
  )
}
