'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseEnv } from '@/lib/supabase/config'

function validateConfig() {
  const env = getSupabaseEnv()
  if (env.isDashboardUrl) {
    return {
      valid: false,
      error:
        'Invalid NEXT_PUBLIC_SUPABASE_URL: The Supabase Dashboard URL was entered instead of your Project API URL. Please set NEXT_PUBLIC_SUPABASE_URL to https://<project-id>.supabase.co.',
    }
  }
  if (!env.isConfigured) {
    return {
      valid: false,
      error:
        'Authentication service is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    }
  }
  return { valid: true, error: null }
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const cause = (err as { cause?: { message?: string; code?: string } }).cause
    const causeMsg = cause?.message || cause?.code
    if (causeMsg) return `${err.message} (${causeMsg})`
    return err.message
  }
  return 'An unexpected authentication error occurred.'
}

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const configCheck = validateConfig()
  if (!configCheck.valid) {
    return { error: configCheck.error }
  }

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }
  } catch (err) {
    return { error: extractErrorMessage(err) }
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

  const configCheck = validateConfig()
  if (!configCheck.valid) {
    return { error: configCheck.error }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    if (data.user && !data.session) {
      return {
        error:
          'Account created, but email confirmation is required. Please turn off "Confirm email" in Supabase Authentication -> Providers -> Email to log in immediately.',
      }
    }
  } catch (err) {
    return { error: extractErrorMessage(err) }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const { isConfigured } = getSupabaseEnv()
  if (isConfigured) {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
  }
  redirect('/login')
}
