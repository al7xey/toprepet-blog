import { NextRequest, NextResponse } from 'next/server'
import { authorizeMutation, errorJson } from '@/lib/admin-api'
import { articlePlainText, imageMetadata, renderContent, suggestedExcerpt } from '@/lib/content'
import { readingTimeMinutes } from '@/lib/data'
import { revalidateEditorialContent } from '@/lib/revalidate'
import { isUuid } from '@/lib/validation'

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const { id } = await params
  if (!isUuid(id)) return errorJson('Некорректный идентификатор статьи')
  const body = await request.json()
  const title = String(body.title || '').trim(), slug = String(body.slug || '').trim(), categoryId = String(body.category_id || '')
  const excerptInput = String(body.excerpt || '').trim(), seoTitle = String(body.seo_title || '').trim(), seoDescription = String(body.seo_description || '').trim()
  if (!title || title.length > 200 || !slugPattern.test(slug) || slug.length > 180 || !isUuid(categoryId)) return errorJson('Укажите заголовок, корректный адрес и рубрику')
  if (excerptInput.length > 400 || seoTitle.length > 200 || seoDescription.length > 400) return errorJson('Проверьте ограничения длины полей')
  if (body.cover_image_url && !String(body.cover_image_alt || '').trim()) return errorJson('Добавьте alt для обложки')
  let content
  try { content = renderContent(body.content_json) } catch (error) { return errorJson(error instanceof Error ? error.message : 'Некорректный текст статьи') }
  const images = imageMetadata(body.content_json)
  if (images.some(image => !image.alt)) return errorJson('Укажите alt для каждого изображения')
  const status = body.status === 'published' ? 'published' : 'draft'
  const excerpt = excerptInput || suggestedExcerpt(body.content_json)
  if (status === 'published' && !articlePlainText(body.content_json)) return errorJson('Добавьте текст статьи перед публикацией')
  const db = auth.session!.supabase
  const [{ data: previous }, { data: children }] = await Promise.all([
    db.from('articles').select('slug').eq('id', id).maybeSingle(),
    db.from('categories').select('id').eq('parent_id', categoryId).limit(1),
  ])
  if (!previous) return errorJson('Статья не найдена', 404)
  if (children?.length) return errorJson('Статью можно поместить только в конечную тему')
  const mediaIds = [...new Set(images.map(image => image.id))]
  const coverUrl = body.cover_image_url ? String(body.cover_image_url) : null
  if (coverUrl) {
    const { data: cover } = await db.from('media').select('id').eq('article_id', id).eq('public_url', coverUrl).maybeSingle()
    if (!cover) return errorJson('Обложка должна быть загружена через медиатеку статьи')
  }
  if (mediaIds.length) {
    const { data: owned } = await db.from('media').select('id').eq('article_id', id).in('id', mediaIds)
    if ((owned || []).length !== mediaIds.length) return errorJson('Одно из изображений не принадлежит статье')
  }
  const { error } = await db.from('articles').update({ title, slug, excerpt, content_json: body.content_json, content_html: content.html, toc_json: content.headings, reading_time_minutes: readingTimeMinutes(body.content_json), category_id: categoryId, cover_image_url: coverUrl, cover_image_alt: coverUrl ? String(body.cover_image_alt).trim() : null, seo_title: seoTitle || null, seo_description: seoDescription || null, status }).eq('id', id)
  if (error) return errorJson(error.code === '23505' || error.message.includes('reserved') ? 'Такой адрес статьи уже занят или зарезервирован' : error.message)
  await db.from('media').update({ status: 'temporary' }).eq('article_id', id)
  const attachedIds = [...mediaIds]
  if (coverUrl) {
    const { data: cover } = await db.from('media').select('id').eq('article_id', id).eq('public_url', coverUrl).maybeSingle()
    if (cover) attachedIds.push(cover.id)
  }
  if (attachedIds.length) await db.from('media').update({ status: 'attached' }).eq('article_id', id).in('id', [...new Set(attachedIds)])
  for (const image of images) await db.from('media').update({ alt: image.alt, caption: image.caption }).eq('id', image.id).eq('article_id', id)
  if (coverUrl) await db.from('media').update({ alt: String(body.cover_image_alt).trim() }).eq('article_id', id).eq('public_url', coverUrl)
  revalidateEditorialContent([previous.slug, slug])
  return NextResponse.json({ id, slugChanged: previous.slug !== slug, oldSlug: previous.slug })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const { id } = await params
  if (!isUuid(id)) return errorJson('Некорректный идентификатор статьи')
  const db = auth.session!.supabase
  const [{ data: article }, { data: media, error: mediaReadError }] = await Promise.all([db.from('articles').select('slug').eq('id', id).maybeSingle(), db.from('media').select('storage_path').eq('article_id', id)])
  if (mediaReadError) return errorJson(mediaReadError.message, 500)
  if (media?.length) { const { error } = await db.storage.from('article-images').remove(media.map(item => item.storage_path)); if (error) return errorJson(error.message, 500) }
  await db.from('media').delete().eq('article_id', id)
  const { error } = await db.from('articles').delete().eq('id', id)
  if (error) return errorJson(error.message)
  revalidateEditorialContent(article ? [article.slug] : [])
  return NextResponse.json({ ok: true })
}
