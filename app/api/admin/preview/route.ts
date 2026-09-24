import { NextRequest, NextResponse } from 'next/server'
import { authorizeMutation, errorJson } from '@/lib/admin-api'
import { renderContent, suggestedExcerpt } from '@/lib/content'
import { readingTimeMinutes } from '@/lib/data'

export async function POST(request: NextRequest) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const body = await request.json()
  let rendered
  try { rendered = renderContent(body.content_json) } catch (error) { return errorJson(error instanceof Error ? error.message : 'Некорректный текст статьи') }
  const now = new Date().toISOString()
  const payload = {
    id: body.id || crypto.randomUUID(), title: String(body.title || 'Без названия').trim().slice(0, 200), slug: String(body.slug || 'preview'),
    excerpt: String(body.excerpt || '').trim().slice(0, 400) || suggestedExcerpt(body.content_json), content_json: body.content_json,
    content_html: rendered.html, toc_json: rendered.headings, cover_image_url: body.cover_image_url || null, cover_image_alt: body.cover_image_alt || null,
    status: body.status === 'published' ? 'published' : 'draft', category_id: body.category_id || '', author_name: 'Редакция TopRepet', seo_title: body.seo_title || null, seo_description: body.seo_description || null,
    published_at: body.published_at || null, modified_at: body.modified_at || null, created_at: now, updated_at: now, view_count: Number(body.view_count) || 0,
    reading_time_minutes: readingTimeMinutes(body.content_json),
  }
  const db = auth.session!.supabase
  await db.from('article_previews').delete().lt('expires_at', now)
  const { data, error } = await db.from('article_previews').insert({ article_id: body.id || null, payload }).select('id').single()
  if (error) return errorJson(error.message, 500)
  return NextResponse.json({ url: `/admin/preview/${data.id}` })
}
