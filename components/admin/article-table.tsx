'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Article, Category } from '@/lib/types'
import { displayDate, displayViews } from '@/lib/data'

export function ArticleTable({ articles, categories }: { articles: Article[]; categories: Category[] }) {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('new')
  const rows = useMemo(() => articles.filter(a => filter === 'all' || a.status === filter).sort((a,b) => sort === 'popular' ? b.view_count-a.view_count : sort === 'old' ? new Date(a.created_at).getTime()-new Date(b.created_at).getTime() : new Date(b.created_at).getTime()-new Date(a.created_at).getTime()), [articles, filter, sort])
  return <><div className="my-7 flex flex-wrap gap-3"><label className="text-sm font-semibold">Статус <select className="field mt-1" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Все</option><option value="draft">Черновики</option><option value="published">Опубликованные</option></select></label><label className="text-sm font-semibold">Сортировка <select className="field mt-1" value={sort} onChange={e=>setSort(e.target.value)}><option value="new">Новые</option><option value="old">Старые</option><option value="popular">Популярные</option></select></label></div><div className="paper overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-[#fff8f1] text-[#687482]"><tr>{['Название','Рубрика','Статус','Просмотры','Опубликовано','Обновлено','Действия'].map(x=><th key={x} className="p-4 font-bold">{x}</th>)}</tr></thead><tbody className="divide-y divide-[#eee7de]">{rows.map(a=><tr key={a.id}><td className="p-4 font-semibold">{a.title}</td><td className="p-4">{categories.find(c=>c.id===a.category_id)?.name || '—'}</td><td className="p-4">{a.status === 'published' ? 'Опубликована' : 'Черновик'}</td><td className="p-4">{displayViews(a.view_count)}</td><td className="p-4">{displayDate(a.published_at) || '—'}</td><td className="p-4">{displayDate(a.updated_at)}</td><td className="p-4"><Link className="font-bold text-[#df5b27]" href={`/admin/articles/${a.id}`}>Открыть</Link></td></tr>)}</tbody></table>{!rows.length && <p className="p-6 text-[#687482]">Статей пока нет.</p>}</div></>
}
