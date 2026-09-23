import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { authorizeMutation, errorJson } from '@/lib/admin-api'
import { isUuid } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const form = await request.formData()
  const file = form.get('file')
  const articleId = String(form.get('article_id') || '')
  const alt = String(form.get('alt') || '').trim()
  const cover = form.get('cover') === 'true'
  if (!(file instanceof File) || file.type !== 'image/webp' || file.size > 450 * 1024 || file.size === 0) return errorJson('Нужен оптимизированный WebP до 450 КБ')
  if (!isUuid(articleId) || !alt) return errorJson('Укажите статью и описание изображения')
  const db = auth.session!.supabase
  const { data: article } = await db.from('articles').select('id').eq('id', articleId).maybeSingle()
  if (!article) return errorJson('Статья не найдена', 404)
  const bytes = Buffer.from(await file.arrayBuffer())
  let info
  try { info = await sharp(bytes).metadata() } catch { return errorJson('Повреждённое изображение') }
  if (info.format !== 'webp' || !info.width || !info.height || info.width > 1600 || info.height > (cover ? 900 : 1600)) return errorJson('Размер изображения превышает лимит')
  const path = `articles/${articleId}/${cover ? `cover-${crypto.randomUUID()}` : crypto.randomUUID()}.webp`
  const { error: uploadError } = await db.storage.from('article-images').upload(path, bytes, { contentType: 'image/webp', upsert: false })
  if (uploadError) return errorJson(uploadError.message)
  const url = db.storage.from('article-images').getPublicUrl(path).data.publicUrl
  const { data, error } = await db.from('media').insert({ article_id: articleId, storage_path: path, public_url: url, alt, caption: String(form.get('caption') || '') || null, width: info.width, height: info.height, file_size: file.size, mime_type: 'image/webp' }).select('id').single()
  if (error) { await db.storage.from('article-images').remove([path]); return errorJson(error.message) }
  return NextResponse.json({ id: data.id, url, width: info.width, height: info.height })
}

export async function DELETE(request: NextRequest) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const { article_id, url } = await request.json()
  const db = auth.session!.supabase
  const { data } = await db.from('media').select('id,storage_path').eq('article_id', String(article_id)).eq('public_url', String(url)).maybeSingle()
  if (!data) return errorJson('Изображение не найдено', 404)
  const { error: storageError } = await db.storage.from('article-images').remove([data.storage_path])
  if (storageError) return errorJson(storageError.message)
  const { error } = await db.from('media').delete().eq('id', data.id)
  if (error) return errorJson(error.message)
  return NextResponse.json({ ok: true })
}
