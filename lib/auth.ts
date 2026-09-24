import { redirect } from 'next/navigation'
import { cache } from 'react'
import { serverSupabase } from './supabase'

export const adminSession = cache(async function adminSession() {
  const supabase = await serverSupabase()
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  const allowed = (process.env.ADMIN_EMAIL || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean)
  if (!user?.email || !allowed.includes(user.email.toLowerCase())) return null
  return { supabase, user }
})

export async function requireAdmin() {
  const session = await adminSession()
  if (!session) redirect('/admin/login')
  return session
}
