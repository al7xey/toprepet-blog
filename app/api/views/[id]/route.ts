import { NextRequest, NextResponse } from 'next/server'
import { adminSession } from '@/lib/auth'
import { serviceSupabase } from '@/lib/supabase'
import { isUuid } from '@/lib/validation'

const bot = /bot|crawler|spider|slurp|preview|fetch|facebookexternalhit|telegram|whatsapp|vkshare|headless|lighthouse/i
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  if (bot.test(request.headers.get('user-agent') || '')) return new NextResponse(null, { status: 204 })
  if (await adminSession()) return new NextResponse(null, { status: 204 })
  const db = serviceSupabase()
  if (!db) return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 })
  const { data, error } = await db.rpc('increment_article_views', { target_id: id })
  if (error) return NextResponse.json({ error: 'Could not count view' }, { status: 500 })
  if (data === null) return NextResponse.json({ error: 'Article not found' }, { status: 404 })
  return NextResponse.json({ view_count: Number(data) }, { headers: { 'Cache-Control': 'no-store' } })
}
