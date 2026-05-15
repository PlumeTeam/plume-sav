'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from './schemas'

export type LoginFormState = {
  error: {
    email?: string[]
    password?: string[]
    _form?: string[]
  } | null
}

export async function loginAction(
  _prev: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const captchaToken = (formData.get('captchaToken') as string) || undefined

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { captchaToken },
  })

  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath('/', 'layout')
  redirect('/select-dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
