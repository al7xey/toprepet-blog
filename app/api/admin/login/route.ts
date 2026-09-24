import { NextResponse } from 'next/server'
import { serverSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const form = await request.formData()
  const email = String(form.get('email') || '').trim().toLowerCase()
  const password = String(form.get('password') || '')
  const allowed = (process.env.ADMIN_EMAIL || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean)
  if (!email || !password || !allowed.includes(email)) return NextResponse.redirect(new URL('/admin/login?error=access', request.url), 303)

  const db = await serverSupabase()
  if (!db) return NextResponse.redirect(new URL('/admin/login?error=config', request.url), 303)
  const { error } = await db.auth.signInWithPassword({ email, password })
  if (error) return NextResponse.redirect(new URL('/admin/login?error=invalid', request.url), 303)
  return NextResponse.redirect(new URL('/admin', request.url), 303)
}
