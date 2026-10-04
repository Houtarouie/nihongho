import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv } from './config'

export function createClient() {
  const { url, key, isConfigured } = getSupabaseEnv()
  if (!isConfigured || !url || !key) {
    return createBrowserClient('https://placeholder-project.supabase.co', 'placeholder-anon-key-0000000000')
  }
  return createBrowserClient(url, key)
}
