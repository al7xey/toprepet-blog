'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { transliterate } from 'transliteration'
import type { Category } from '@/lib/types'
import { categoryPath } from '@/lib/data'

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [parent, setParent] = useState('')
  const [description, setDescription] = useState('')
  const [order, setOrder] = useState(0)
  const [message, setMessage] = useState('')
  const reset = () => { setSelected(null); setName(''); setSlug(''); setParent(''); setDescription(''); setOrder(0); setMessage('') }
  const edit = (item: Category) => { setSelected(item); setName(item.name); setSlug(item.slug); setParent(item.parent_id || ''); setDescription(item.description || ''); setOrder(item.sort_order); setMessage('') }
  async function save(event: React.FormEvent) { event.preventDefault(); setMessage(''); const response = await fetch(selected ? `/api/admin/categories/${selected.id}` : '/api/admin/categories', { method: selected ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, slug, parent_id: parent || null, description, sort_order: order }) }); const body = await response.json(); if (!response.ok) return setMessage(body.error || 'Не удалось сохранить'); reset(); router.refresh() }
  async function remove() { if (!selected || !confirm('Удалить рубрику?')) return; const response = await fetch(`/api/admin/categories/${selected.id}`, { method: 'DELETE' }); const body = await response.json(); if (!response.ok) return setMessage(body.error); reset(); router.refresh() }
  return <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]"><div className="paper divide-y divide-[#eee7de] overflow-hidden">{categories.map(c => <button type="button" key={c.id} className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-[#fff8f1]" onClick={()=>edit(c)}><span><strong className="block">{categoryPath(c,categories).map(x=>x.name).join(' → ')}</strong><small className="text-[#687482]">{c.description || 'Описание не добавлено'}</small></span><span className="text-sm text-[#df5b27]">Изменить</span></button>)}{!categories.length && <p className="p-6 text-[#687482]">Создайте первую ветку.</p>}</div><form onSubmit={save} className="paper h-fit space-y-4 p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{selected ? 'Изменить рубрику' : 'Новая рубрика'}</h2>{selected && <button type="button" className="text-sm text-[#df5b27]" onClick={reset}>Создать новую</button>}</div><div><label htmlFor="category-name" className="label">Название</label><input id="category-name" className="field" required value={name} onChange={e=>{setName(e.target.value); if(!selected) setSlug(transliterate(e.target.value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''))}}/></div><div><label htmlFor="category-slug" className="label">Адрес (slug)</label><input id="category-slug" className="field" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={e=>setSlug(e.target.value)}/></div><div><label htmlFor="category-parent" className="label">Родительская рубрика</label><select id="category-parent" className="field" value={parent} onChange={e=>setParent(e.target.value)}><option value="">Нет — ветка</option>{categories.filter(c=>c.id!==selected?.id).map(c=><option key={c.id} value={c.id}>{categoryPath(c,categories).map(x=>x.name).join(' → ')}</option>)}</select></div><div><label htmlFor="category-description" className="label">Описание</label><textarea id="category-description" className="field" rows={3} value={description} onChange={e=>setDescription(e.target.value)}/></div><div><label htmlFor="category-order" className="label">Порядок</label><input id="category-order" type="number" className="field" value={order} onChange={e=>setOrder(Number(e.target.value))}/></div>{message && <p role="alert" className="text-sm text-red-700">{message}</p>}<div className="flex flex-wrap gap-3"><button className="button-primary" type="submit">Сохранить</button>{selected && <button className="button-outline text-red-700" type="button" onClick={remove}>Удалить</button>}</div></form></div>
}
