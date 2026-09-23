import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { supabaseConfig } from './config'

export function publicSupabase() {
  const config = supabaseConfig()
  if (!config) return null
  return createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}

export async function serverSupabase() {
  const config = supabaseConfig()
  if (!config) return null
  const store = await cookies()
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (items) => {
        try { items.forEach(({ name, value, options }) => store.set(name, value, options)) }
        catch { /* Server Components cannot write cookies. Proxy refreshes them. */ }
      },
    },
  })
}

export function serviceSupabase() {
  const config = supabaseConfig()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!config || !key) return null
  return createClient(config.url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
