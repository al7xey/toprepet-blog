import { NextRequest, NextResponse } from 'next/server'
import { transliterate } from 'transliteration'
import { authorizeMutation, errorJson } from '@/lib/admin-api'
import { articlePlainText, renderContent, suggestedExcerpt } from '@/lib/content'
import { readingTimeMinutes } from '@/lib/data'
import { revalidateEditorialContent } from '@/lib/revalidate'
import { isUuid } from '@/lib/validation'
import { syncRecommendations } from '@/lib/recommendations-server'

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/
export async function POST(request: NextRequest) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const body = await request.json()
  const title = String(body.title || '').trim()
  const slug = String(body.slug || transliterate(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim()
  const categoryId = String(body.category_id || '')
  if (!title || title.length > 200 || !slugPattern.test(slug) || slug.length > 180 || !isUuid(categoryId)) return errorJson('Проверьте заголовок, адрес и рубрику')
  const db = auth.session!.supabase
  const { data: category } = await db.from('categories').select('id').eq('id', categoryId).maybeSingle()
  if (!category) return errorJson('Рубрика не найдена')
  const { data: children } = await db.from('categories').select('id').eq('parent_id', categoryId).limit(1)
  if (children?.length) return errorJson('Статью можно поместить только в конечную тему')
  const minimal = body.minimal === true
  const document = minimal ? { type: 'doc', content: [{ type: 'paragraph' }] } : body.content_json
  let content
  try { content = renderContent(document) } catch { return errorJson('Некорректный текст статьи') }
  const status = minimal ? 'draft' : body.status === 'published' ? 'published' : 'draft'
  const excerpt = String(body.excerpt || '').trim() || suggestedExcerpt(document)
  if (excerpt.length > 400) return errorJson('Краткое описание длиннее 400 символов')
  if (status === 'published' && !articlePlainText(document)) return errorJson('Добавьте текст статьи перед публикацией')
  const { data, error } = await db.from('articles').insert({ title, slug, excerpt, content_json: document, content_html: content.html, toc_json: content.headings, reading_time_minutes: readingTimeMinutes(document), category_id: categoryId, cover_image_url: null, cover_image_alt: null, author_name: 'Редакция TopRepet', seo_title: body.seo_title || null, seo_description: body.seo_description || null, status }).select('id').single()
  if (error) return errorJson(error.code === '23505' ? 'Такой адрес статьи уже занят или зарезервирован' : error.message)
  try { await syncRecommendations(db, data.id, body.recommendation_ids) } catch (cause) { return errorJson(cause instanceof Error ? cause.message : 'Не удалось сохранить рекомендации') }
  revalidateEditorialContent([slug])
  return NextResponse.json({ id: data.id })
}
