'use client'
import { useEffect, useState } from 'react'
import { Share2 } from 'lucide-react'

export function ArticleInteractions({ id, title, url }: { id: string; title: string; url: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    try {
      const key = `blog-view-${id}`
      const previous = Number(localStorage.getItem(key) || 0)
      if (Date.now() - previous < 30 * 60 * 1000) return
      fetch(`/api/views/${id}`, { method: 'POST' }).then(response => { if (response.ok) localStorage.setItem(key, String(Date.now())) }).catch(() => {})
    } catch { /* Storage can be unavailable in private browsing. */ }
  }, [id])
  async function share() {
    if (navigator.share) { try { await navigator.share({ title, url }); return } catch { return } }
    setOpen(value => !value)
  }
  const encoded = encodeURIComponent(url)
  return <div className="relative"><button type="button" className="button-outline" onClick={share}><Share2 size={17}/> Поделиться</button>{open && <div className="paper absolute right-0 top-full z-10 mt-2 flex w-52 flex-col gap-1 p-2 text-sm shadow-lg"><button type="button" className="rounded-lg px-3 py-2 text-left hover:bg-[#fff1e7]" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true) }}>{copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}</button><a className="rounded-lg px-3 py-2 hover:bg-[#fff1e7]" href={`https://t.me/share/url?url=${encoded}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer">Telegram</a><a className="rounded-lg px-3 py-2 hover:bg-[#fff1e7]" href={`https://vk.com/share.php?url=${encoded}`} target="_blank" rel="noopener noreferrer">VK</a><a className="rounded-lg px-3 py-2 hover:bg-[#fff1e7]" href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></div>}</div>
}
