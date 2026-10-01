import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv } from './config'

export function createClient() {
  const { url, key } = getSupabaseEnv()
  return createBrowserClient(url, key)
}
