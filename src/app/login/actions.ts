'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(url && key && url.startsWith('http'))
}

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  // Built-in accounts or unconfigured Supabase fallback
  if (
    !isSupabaseConfigured() ||
    email === 'kenji@nihongo.app' ||
    email === 'sakura@nihongo.app'
  ) {
    return { fallback: true }
  }

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.toLowerCase().includes('fetch failed')) {
        return { fallback: true }
      }
      return { error: error.message }
    }
  } catch {
    return { fallback: true }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const username = (formData.get('username') as string)?.trim()

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  if (!isSupabaseConfigured()) {
    return { fallback: true }
  }

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (error) {
      if (error.message.toLowerCase().includes('fetch failed')) {
        return { fallback: true }
      }
      return { error: error.message }
    }
  } catch {
    return { fallback: true }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
  }
  redirect('/login')
}
