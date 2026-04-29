import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@plume/db'

// createServerClient<Database> has a type-param mapping bug in @supabase/ssr@0.5.x +
// supabase-js@2.100+: the third generic arg maps to SupabaseClient's SchemaName param
// (not Schema), making Schema resolve to never. Calling without generics and casting to
// SupabaseClient<Database> (1 arg) lets TypeScript compute all defaults correctly.
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — silently ignore (cookie set fails outside actions/middleware)
          }
        },
      },
    }
  )

  return client as unknown as SupabaseClient<Database>
}
