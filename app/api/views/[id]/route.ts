import { NextRequest, NextResponse } from 'next/server'
import { adminSession } from '@/lib/auth'
import { serviceSupabase } from '@/lib/supabase'

const bot = /bot|crawler|spider|slurp|preview|fetch|facebookexternalhit|telegram|whatsapp|vkshare|headless/i
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  if (bot.test(request.headers.get('user-agent') || '')) return new NextResponse(null, { status: 204 })
  if (await adminSession()) return new NextResponse(null, { status: 204 })
  const cookieName = `blog-view-${id}`
  if (request.cookies.has(cookieName)) return new NextResponse(null, { status: 204 })
  const db = serviceSupabase()
  if (!db) return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 })
  const { error } = await db.rpc('increment_article_views', { target_id: id })
  if (error) return NextResponse.json({ error: 'Could not count view' }, { status: 500 })
  const response = new NextResponse(null, { status: 204 })
  response.cookies.set(cookieName, '1', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 1800 })
  return response
}
