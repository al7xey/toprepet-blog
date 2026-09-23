import { NextRequest, NextResponse } from 'next/server'
import { transliterate } from 'transliteration'
import { authorizeMutation, errorJson } from '@/lib/admin-api'
import { revalidateEditorialContent } from '@/lib/revalidate'

export async function POST(request: NextRequest) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const body = await request.json()
  const name = String(body.name || '').trim()
  const slug = String(body.slug || transliterate(name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')).trim()
  if (!name || name.length > 120 || slug.length > 120 || String(body.description || '').length > 600 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return errorJson('Проверьте название, адрес и описание')
  const db = auth.session!.supabase
  if (body.parent_id) {
    const { data: all } = await db.from('categories').select('id,parent_id')
    let depth = 1, cursor: string | null = String(body.parent_id)
    while (cursor) { depth++; cursor = all?.find(item => item.id === cursor)?.parent_id || null }
    if (depth > 3) return errorJson('В админке доступно не более трёх уровней рубрик')
  }
  const { data, error } = await db.from('categories').insert({ name, slug, parent_id: body.parent_id || null, description: String(body.description || '').trim() || null, sort_order: Number(body.sort_order) || 0 }).select('id').single()
  if (error) return errorJson(error.code === '23505' ? 'Такой адрес уже есть на этом уровне' : error.message.includes('cannot have children') ? 'Нельзя добавить подрубрику: в этой теме уже есть статьи' : error.message)
  revalidateEditorialContent()
  return NextResponse.json({ id: data.id })
}
