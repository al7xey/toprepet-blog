import { NextRequest, NextResponse } from 'next/server'
import { authorizeMutation, errorJson } from '@/lib/admin-api'
import { imageMetadata, renderContent } from '@/lib/content'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const { id } = await params
  const body = await request.json()
  const title = String(body.title || '').trim()
  const slug = String(body.slug || '').trim()
  if (!title || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return errorJson('Укажите заголовок и корректный адрес')
  if (body.cover_image_url && !String(body.cover_image_alt || '').trim()) return errorJson('Добавьте alt для обложки')
  let content
  try { content = renderContent(body.content_json) } catch { return errorJson('Некорректный текст статьи') }
  const images = imageMetadata(body.content_json)
  if (images.some(image => !image.alt)) return errorJson('Укажите alt для каждого изображения')
  const status = body.status === 'published' ? 'published' : 'draft'
  if (status === 'published' && (!String(body.excerpt || '').trim() || !content.html.trim())) return errorJson('Для публикации нужны анонс и текст')
  const { error } = await auth.session!.supabase.from('articles').update({ title, slug, excerpt: String(body.excerpt || '').trim(), content_json: body.content_json, content_html: content.html, category_id: body.category_id, cover_image_url: body.cover_image_url || null, cover_image_alt: body.cover_image_alt || null, seo_title: body.seo_title || null, seo_description: body.seo_description || null, status, is_featured: Boolean(body.is_featured) }).eq('id', id)
  if (error) return errorJson(error.code === '23505' ? 'Такой адрес статьи уже занят' : error.message)
  for (const image of images) {
    const { error: mediaError } = await auth.session!.supabase.from('media').update({ alt: image.alt, caption: image.caption }).eq('id', image.id).eq('article_id', id)
    if (mediaError) return errorJson(mediaError.message)
  }
  if (body.cover_image_url) await auth.session!.supabase.from('media').update({ alt: String(body.cover_image_alt).trim() }).eq('article_id', id).eq('public_url', body.cover_image_url)
  return NextResponse.json({ id })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const { id } = await params
  const db = auth.session!.supabase
  const { data: media } = await db.from('media').select('storage_path').eq('article_id', id)
  if (media?.length) await db.storage.from('article-images').remove(media.map(m => m.storage_path))
  await db.from('media').delete().eq('article_id', id)
  const { error } = await db.from('articles').delete().eq('id', id)
  if (error) return errorJson(error.message)
  return NextResponse.json({ ok: true })
}
