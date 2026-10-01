/**
 * Safe, sanitized Supabase environment configuration.
 * Strips accidental surrounding quotes and trailing slashes.
 */
export function getSupabaseEnv() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  const url = rawUrl.replace(/['"]/g, '').replace(/\/+$/, '').trim()
  const key = rawKey.replace(/['"]/g, '').trim()

  const isDashboardUrl = url.includes('supabase.com/dashboard')
  const isPlaceholder = url.includes('your-project-url') || key.includes('your-anon-key')

  const isConfigured = Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    !isDashboardUrl &&
    !isPlaceholder
  )

  return {
    url,
    key,
    isConfigured,
    isDashboardUrl,
    isPlaceholder,
  }
}
