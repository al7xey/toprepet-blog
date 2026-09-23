import { NextRequest, NextResponse } from 'next/server'
import { authorizeMutation, errorJson } from '@/lib/admin-api'
import { revalidateEditorialContent } from '@/lib/revalidate'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const { id } = await params
  const body = await request.json()
  const name = String(body.name || '').trim()
  const slug = String(body.slug || '').trim()
  if (!name || name.length > 120 || slug.length > 120 || String(body.description || '').length > 600 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || body.parent_id === id) return errorJson('Проверьте название, адрес, описание и родительскую рубрику')
  const db = auth.session!.supabase
  if (body.parent_id) {
    const { data: all } = await db.from('categories').select('id,parent_id')
    let parent = body.parent_id
    const seen = new Set([id])
    let depth = 1
    while (parent) { depth++; if (seen.has(parent)) return errorJson('Рубрика не может быть собственным потомком'); seen.add(parent); parent = all?.find(c => c.id === parent)?.parent_id || null }
    if (depth > 3) return errorJson('В админке доступно не более трёх уровней рубрик')
  }
  const { error } = await db.from('categories').update({ name, slug, parent_id: body.parent_id || null, description: body.description || null, sort_order: Number(body.sort_order) || 0 }).eq('id', id)
  if (error) return errorJson(error.code === '23505' ? 'Такой адрес уже есть на этом уровне' : error.message.includes('locked') ? 'Нельзя менять адрес или родителя рубрики с опубликованными статьями' : error.message.includes('cannot have children') ? 'Нельзя переместить рубрику сюда: в теме уже есть статьи' : error.message)
  revalidateEditorialContent()
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const { id } = await params
  const { error } = await auth.session!.supabase.from('categories').delete().eq('id', id)
  if (error) return errorJson('Сначала переместите дочерние рубрики и статьи')
  revalidateEditorialContent()
  return NextResponse.json({ ok: true })
}
