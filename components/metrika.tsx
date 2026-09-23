'use client'
import Script from 'next/script'
import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function RouteHits({ id }: { id: number }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initial = useRef(true)
  const previous = useRef('')
  useEffect(() => {
    const query = searchParams.toString()
    const current = `${location.origin}${pathname}${query ? `?${query}` : ''}`
    if (initial.current) { initial.current = false; previous.current = current; return }
    if (current === previous.current) return
    if (pathname.startsWith('/admin') || pathname.includes('/preview/')) return
    const tracker = (window as typeof window & { ym?: (id: number, action: string, url: string, options?: { referer?: string }) => void }).ym
    tracker?.(id, 'hit', current, { referer: previous.current || document.referrer })
    previous.current = current
  }, [id, pathname, searchParams])
  return null
}

export function Metrika() {
  const pathname = usePathname()
  const rawId = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID
  const id = Number(rawId)
  if (!rawId || !Number.isFinite(id) || pathname.startsWith('/admin') || pathname.includes('/preview/')) return null
  return <><Script id="yandex-metrika" strategy="afterInteractive">{`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');ym(${JSON.stringify(id)},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true});`}</Script><RouteHits id={id}/></>
}
