import { NextRequest, NextResponse } from 'next/server'
import { transliterate } from 'transliteration'
import { authorizeMutation, errorJson } from '@/lib/admin-api'
import { articlePlainText, imageMetadata, renderContent, suggestedExcerpt } from '@/lib/content'
import { isUuid } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const body = await request.json()
  const title = String(body.title || '').trim()
  const slug = String(body.slug || transliterate(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim()
  const categoryId = String(body.category_id || '')
  if (!title || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || !isUuid(categoryId)) return errorJson('Проверьте заголовок, адрес и рубрику')
  if (body.cover_image_url) return errorJson('Сначала сохраните статью, затем загрузите обложку')
  let content
  try { content = renderContent(body.content_json) } catch { return errorJson('Некорректный текст статьи') }
  if (imageMetadata(body.content_json).some(image => !image.alt)) return errorJson('Укажите alt для каждого изображения')
  const status = body.status === 'published' ? 'published' : 'draft'
  const excerpt = String(body.excerpt || '').trim() || suggestedExcerpt(body.content_json)
  if (status === 'published' && !articlePlainText(body.content_json)) return errorJson('Добавьте текст статьи перед публикацией')
  const db = auth.session!.supabase
  const { data, error } = await db.from('articles').insert({ title, slug, excerpt, content_json: body.content_json, content_html: content.html, category_id: categoryId, cover_image_url: body.cover_image_url || null, cover_image_alt: body.cover_image_alt || null, author_name: 'Редакция TopRepet', seo_title: body.seo_title || null, seo_description: body.seo_description || null, status, is_featured: Boolean(body.is_featured) }).select('id').single()
  if (error) return errorJson(error.code === '23505' ? 'Такой адрес статьи уже занят' : error.message)
  return NextResponse.json({ id: data.id })
}
