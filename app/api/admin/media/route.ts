import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import type { SupabaseClient } from '@supabase/supabase-js'
import { authorizeMutation, errorJson } from '@/lib/admin-api'
import { isUuid } from '@/lib/validation'

async function cleanupTemporary(db: SupabaseClient) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data } = await db.from('media').select('id,storage_path').eq('status', 'temporary').lt('created_at', cutoff).limit(100)
  if (!data?.length) return
  const paths = data.map(item => item.storage_path)
  const { error } = await db.storage.from('article-images').remove(paths)
  if (!error) await db.from('media').delete().in('id', data.map(item => item.id)).eq('status', 'temporary')
}

export async function GET(request: NextRequest) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const articleId = request.nextUrl.searchParams.get('article_id') || ''
  if (!isUuid(articleId)) return errorJson('Некорректная статья')
  const { data, error } = await auth.session!.supabase.from('media').select('id,public_url,alt,caption,width,height,status,created_at').eq('article_id', articleId).order('created_at', { ascending: false })
  if (error) return errorJson(error.message, 500)
  return NextResponse.json({ items: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const form = await request.formData()
  const file = form.get('file')
  const articleId = String(form.get('article_id') || '')
  const alt = String(form.get('alt') || '').trim()
  const caption = String(form.get('caption') || '').trim()
  const cover = form.get('cover') === 'true'
  if (!(file instanceof File) || file.type !== 'image/webp' || file.size > 450 * 1024 || file.size === 0) return errorJson('Нужен оптимизированный WebP до 450 КБ')
  if (!isUuid(articleId) || !alt || alt.length > 300 || caption.length > 400) return errorJson('Укажите статью и короткое описание изображения')
  const db = auth.session!.supabase
  await cleanupTemporary(db)
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
  const { data, error } = await db.from('media').insert({ article_id: articleId, storage_path: path, public_url: url, alt, caption: caption || null, width: info.width, height: info.height, file_size: file.size, mime_type: 'image/webp', status: 'temporary' }).select('id').single()
  if (error) { await db.storage.from('article-images').remove([path]); return errorJson(error.message) }
  return NextResponse.json({ id: data.id, url, width: info.width, height: info.height, alt, caption: caption || null })
}

export async function DELETE(request: NextRequest) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const { article_id, url } = await request.json()
  const db = auth.session!.supabase
  const { data } = await db.from('media').select('id,storage_path').eq('article_id', String(article_id)).eq('public_url', String(url)).eq('status', 'temporary').maybeSingle()
  if (!data) return errorJson('Изображение не найдено', 404)
  const { error: storageError } = await db.storage.from('article-images').remove([data.storage_path])
  if (storageError) return errorJson(storageError.message)
  const { error } = await db.from('media').delete().eq('id', data.id)
  if (error) return errorJson(error.message)
  return NextResponse.json({ ok: true })
}
