export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.toprepet.ru').replace(/\/$/, '')
export const MAIN_URL = 'https://toprepet.ru/'
export const siteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return null
  return { url, key }
}
