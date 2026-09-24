'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { transliterate } from 'transliteration'
import type { Category } from '@/lib/types'
import { categoryBranchIds, categoryPath } from '@/lib/data'

const makeSlug = (value: string) => transliterate(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [parent, setParent] = useState('')
  const [description, setDescription] = useState('')
  const [order, setOrder] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const label = (category: Category) => categoryPath(category, categories).map(item => item.name).join(' / ')
  const excludedParents = selected ? categoryBranchIds(selected.id, categories) : new Set<string>()
  const depth = (category: Category) => categoryPath(category, categories).length

  function reset() {
    setSelected(null); setName(''); setSlug(''); setSlugTouched(false)
    setParent(''); setDescription(''); setOrder(0); setMessage('')
  }

  function edit(category: Category) {
    setSelected(category); setName(category.name); setSlug(category.slug)
    setSlugTouched(true); setParent(category.parent_id || '')
    setDescription(category.description || ''); setOrder(category.sort_order); setMessage('')
    document.getElementById('category-name')?.focus()
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('')
    try {
      const response = await fetch(selected ? `/api/admin/categories/${selected.id}` : '/api/admin/categories', {
        method: selected ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, parent_id: parent || null, description, sort_order: order }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Не удалось сохранить рубрику')
      reset(); router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось сохранить рубрику')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!selected || !confirm('Удалить рубрику?')) return
    setBusy(true); setMessage('')
    try {
      const response = await fetch(`/api/admin/categories/${selected.id}`, { method: 'DELETE' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Не удалось удалить рубрику')
      reset(); router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось удалить рубрику')
    } finally {
      setBusy(false)
    }
  }

  return <div className="mt-7 grid max-w-[950px] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <form onSubmit={save} className="paper h-fit space-y-5 p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{selected ? 'Изменить рубрику' : 'Новая рубрика'}</h2>
        {selected && <button type="button" className="text-link" onClick={reset}>Отмена</button>}
      </div>
      <div><label htmlFor="category-name" className="label">Название</label><input id="category-name" className="field" required maxLength={120} value={name} placeholder="Например, Информатика" onChange={event => { setName(event.target.value); if (!slugTouched) setSlug(makeSlug(event.target.value)) }}/></div>
      <div><label htmlFor="category-parent" className="label">Куда добавить</label><select id="category-parent" className="field" value={parent} onChange={event => setParent(event.target.value)}><option value="">Новый раздел</option>{categories.filter(category => !excludedParents.has(category.id) && depth(category) < 3).map(category => <option key={category.id} value={category.id}>Внутрь: {label(category)}</option>)}</select><p className="mt-2 text-xs text-[#697383]">Три уровня: ветка, подветка и тема. Статьи добавляются в тему.</p></div>
      <details className="border-t border-[#eee5de] pt-4"><summary className="cursor-pointer text-sm font-semibold">Описание и адрес</summary><div className="mt-4 space-y-4"><div><label htmlFor="category-description" className="label">Описание</label><textarea id="category-description" className="field" rows={3} maxLength={600} value={description} onChange={event => setDescription(event.target.value)}/></div><div><label htmlFor="category-slug" className="label">Адрес</label><input id="category-slug" className="field" required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={event => { setSlugTouched(true); setSlug(event.target.value) }}/></div><div><label htmlFor="category-order" className="label">Порядок</label><input id="category-order" type="number" className="field" value={order} onChange={event => setOrder(Number(event.target.value))}/></div></div></details>
      {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
      <div className="flex flex-wrap items-center gap-4"><button className="button-primary" type="submit" disabled={busy}>{busy ? 'Сохраняем…' : selected ? 'Сохранить' : 'Добавить рубрику'}</button>{selected && <button className="text-sm text-red-700 underline" type="button" disabled={busy} onClick={remove}>Удалить</button>}</div>
    </form>
    <section aria-label="Созданные рубрики"><h2 className="mb-4 text-xl font-bold">Созданные рубрики</h2><div className="divide-y divide-[#eee5de] border-y border-[#eee5de]">{categories.map(category => <button type="button" key={category.id} className="flex w-full items-center justify-between gap-4 py-4 text-left hover:text-[#d9551d]" onClick={() => edit(category)}><span className="font-semibold">{label(category)}</span><span className="shrink-0 text-sm text-[#697383]">Изменить</span></button>)}{!categories.length && <p className="py-5 text-[#697383]">Рубрик пока нет.</p>}</div></section>
  </div>
}
