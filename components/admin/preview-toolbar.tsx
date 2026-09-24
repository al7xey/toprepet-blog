'use client'

import Link from 'next/link'
import { useState } from 'react'
import { siteUrl } from '@/lib/config'
import type { ArticleDetail } from '@/lib/types'

export function PreviewToolbar({ article }: { article: ArticleDetail }) {
  const [published, setPublished] = useState(article.status === 'published')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Предпросмотр сохранённой версии')
  const editUrl = `/admin/articles/${article.id}`
  async function publish() {
    setBusy(true); setMessage('Публикуем…')
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...article, status: 'published' }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Не удалось опубликовать статью')
      setPublished(true); setMessage('Статья опубликована')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Ошибка публикации') }
    finally { setBusy(false) }
  }
  return <div className="preview-toolbar" role="region" aria-label="Действия предпросмотра">
    <Link href={editUrl}>Вернуться к редактированию</Link>
    <span aria-live="polite">{message}</span>
    <div>
      <Link className="button-outline" href={editUrl}>Сохранить</Link>
      <button type="button" className="button-primary" disabled={busy} onClick={publish}>{busy ? 'Публикуем…' : published ? 'Обновить публикацию' : 'Опубликовать'}</button>
      {published && <a className="button-outline" href={siteUrl(`/articles/${article.slug}`)} target="_blank" rel="noopener noreferrer">Открыть статью</a>}
    </div>
  </div>
}
