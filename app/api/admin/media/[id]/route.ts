import { NextRequest, NextResponse } from 'next/server'
import { authorizeMutation, errorJson } from '@/lib/admin-api'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const { id } = await params
  const db = auth.session!.supabase
  const { data } = await db.from('media').select('storage_path').eq('id', id).eq('status', 'temporary').maybeSingle()
  if (!data) return errorJson('Изображение не найдено', 404)
  const { error: storageError } = await db.storage.from('article-images').remove([data.storage_path])
  if (storageError) return errorJson(storageError.message)
  const { error } = await db.from('media').delete().eq('id', id)
  if (error) return errorJson(error.message)
  return NextResponse.json({ ok: true })
}
