import { PlumeLogo } from '@/app/_components/PlumeLogo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      {/* Top decorative band — Plume gradient */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-navy via-brand-navy/90 to-white"
      />

      <header className="relative z-10 flex items-center justify-center pt-10 pb-8">
        <PlumeLogo size="lg" variant="light" withWordmark />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-md flex-1 px-4 pb-10">
        <div className="card animate-slide-up p-6 sm:p-8">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Plume Paragliders &middot; Service après-vente
        </p>
      </main>
    </div>
  )
}
