'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { browserSupabase } from '@/lib/supabase-browser'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    const form = new FormData(event.currentTarget)
    const db = browserSupabase()
    if (!db) { setError('Supabase пока не настроен'); setBusy(false); return }
    const { error } = await db.auth.signInWithPassword({ email: String(form.get('email')), password: String(form.get('password')) })
    if (error) { setError('Не удалось войти. Проверьте данные и доступ.'); setBusy(false); return }
    const access = await fetch('/api/admin/session', { cache: 'no-store' })
    if (!access.ok || !(await access.json()).authorized) { await db.auth.signOut(); setError('Этот email не имеет доступа к редакции.'); setBusy(false); return }
    router.push('/admin'); router.refresh()
  }
  return <form onSubmit={login} className="mt-8 space-y-5"><div><label htmlFor="email" className="label">Email</label><input id="email" name="email" type="email" required autoComplete="username" className="field"/></div><div><label htmlFor="password" className="label">Пароль</label><input id="password" name="password" type="text" required autoComplete="current-password" className="field password-field-visible"/></div>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button type="submit" disabled={busy} className="button-primary w-full">{busy ? 'Входим…' : 'Войти'}</button></form>
}
