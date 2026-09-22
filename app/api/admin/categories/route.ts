import { NextRequest, NextResponse } from 'next/server'
import { transliterate } from 'transliteration'
import { authorizeMutation, errorJson } from '@/lib/admin-api'

export async function POST(request: NextRequest) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const body = await request.json()
  const name = String(body.name || '').trim()
  const slug = String(body.slug || transliterate(name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')).trim()
  if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return errorJson('Укажите название и корректный адрес')
  const { data, error } = await auth.session!.supabase.from('categories').insert({ name, slug, parent_id: body.parent_id || null, description: body.description || null, sort_order: Number(body.sort_order) || 0 }).select('id').single()
  if (error) return errorJson(error.code === '23505' ? 'Такой адрес уже есть на этом уровне' : error.message)
  return NextResponse.json({ id: data.id })
}
