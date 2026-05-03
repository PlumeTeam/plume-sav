'use client'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        padding: '1rem',
        background: '#FAF6F0',
        color: '#0f0f1d',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        textAlign: 'center',
      }}>
        <div aria-hidden style={{ fontSize: '3rem' }}>🪂</div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Erreur critique</h1>
          <p style={{ marginTop: '0.5rem', maxWidth: '28rem', color: '#475569', fontSize: '0.875rem' }}>
            L&apos;application n&apos;a pas pu démarrer. Réessayez ou contactez{' '}
            <a href="mailto:sav@plumeparagliders.com" style={{ color: '#FF7A59', fontWeight: 600 }}>
              sav@plumeparagliders.com
            </a>.
          </p>
          {process.env.NODE_ENV !== 'production' && (
            <pre style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              background: '#fff',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              textAlign: 'left',
              maxWidth: '32rem',
              overflowX: 'auto',
            }}>
              {error.message}
            </pre>
          )}
        </div>
        <button
          onClick={reset}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#FF7A59',
            color: '#fff',
            border: 'none',
            borderRadius: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  )
}
