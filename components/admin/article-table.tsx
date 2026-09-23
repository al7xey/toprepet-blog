'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Article, Category } from '@/lib/types'
import { displayDate, displayViews } from '@/lib/data'

export function ArticleTable({ articles, categories }: { articles: Article[]; categories: Category[] }) {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('new')
  const categoryNames = useMemo(() => new Map(categories.map(category => [category.id, category.name])), [categories])
  const rows = useMemo(() => articles
    .filter(article => filter === 'all' || article.status === filter)
    .sort((a, b) => sort === 'popular'
      ? b.view_count - a.view_count
      : sort === 'old'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [articles, filter, sort])

  return <>
    <div className="my-6 flex flex-wrap gap-3">
      <label className="text-sm font-semibold">Показать
        <select className="field mt-1" value={filter} onChange={event => setFilter(event.target.value)}>
          <option value="all">Все статьи</option>
          <option value="draft">Черновики</option>
          <option value="published">Опубликованные</option>
        </select>
      </label>
      <label className="text-sm font-semibold">Порядок
        <select className="field mt-1" value={sort} onChange={event => setSort(event.target.value)}>
          <option value="new">Сначала новые</option>
          <option value="old">Сначала старые</option>
          <option value="popular">По просмотрам</option>
        </select>
      </label>
    </div>
    <div className="space-y-3">
      {rows.map(article => <article key={article.id} className="paper flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={article.status === 'published' ? 'rounded-full bg-[#eaf5ea] px-2.5 py-1 font-bold text-[#286038]' : 'rounded-full bg-[#f5f1ec] px-2.5 py-1 font-bold text-[#636b73]'}>{article.status === 'published' ? 'Опубликована' : 'Черновик'}</span>
            <span className="text-[#697383]">{categoryNames.get(article.category_id) || 'Без рубрики'}</span>
          </div>
          <h2 className="break-words text-lg font-bold leading-snug">{article.title}</h2>
          <p className="mt-2 text-xs text-[#697383]">{article.status === 'published' ? 'Опубликовано ' + (displayDate(article.published_at) || '—') : 'Изменено ' + (displayDate(article.updated_at) || '—')} · {displayViews(article.view_count)}</p>
        </div>
        <Link className="text-link shrink-0" href={`/admin/articles/${article.id}`}>Редактировать →</Link>
      </article>)}
      {!rows.length && <div className="paper p-6"><p className="font-bold">Статей пока нет</p><p className="mt-1 text-sm text-[#697383]">Выберите другой фильтр или создайте первую статью.</p><Link href="/admin/articles/new" className="text-link mt-4">Новая статья →</Link></div>}
    </div>
  </>
}
