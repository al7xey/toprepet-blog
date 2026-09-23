'use client'
import { useEffect, useRef, useState } from 'react'
import { Share2 } from 'lucide-react'
import { displayViews } from '@/lib/data'
import { siteUrl } from '@/lib/config'

export function ArticleInteractions({ id, title, url, initialViews }: { id: string; title: string; url: string; initialViews: number }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [views, setViews] = useState(initialViews)
  const counted = useRef(false)
  const canonical = url.startsWith('http') ? url : siteUrl(url)
  useEffect(() => {
    if (counted.current) return
    counted.current = true
    fetch(`/api/views/${id}`, { method: 'POST' }).then(async response => {
      if (response.ok && response.status !== 204) {
        const body = await response.json()
        if (typeof body.view_count === 'number') setViews(body.view_count)
      }
    }).catch(() => {})
  }, [id])
  async function share() {
    if (navigator.share) { try { await navigator.share({ title, url: canonical }); return } catch { return } }
    setOpen(value => !value)
  }
  const encoded = encodeURIComponent(canonical)
  return <div className="article-actions"><span aria-live="polite">{displayViews(views)}</span><div className="relative"><button type="button" className="button-outline" onClick={share}><Share2 size={17}/> Поделиться</button>{open && <div className="paper share-menu"><button type="button" onClick={async () => { await navigator.clipboard.writeText(canonical); setCopied(true) }}>{copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}</button><a href={`https://t.me/share/url?url=${encoded}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer">Telegram</a><a href={`https://vk.com/share.php?url=${encoded}`} target="_blank" rel="noopener noreferrer">VK</a><a href={`https://wa.me/?text=${encodeURIComponent(`${title} ${canonical}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></div>}</div></div>
}
