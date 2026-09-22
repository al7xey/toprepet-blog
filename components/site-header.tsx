import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { MAIN_URL } from '@/lib/config'

export function SiteHeader() {
  return <header className="sticky top-0 z-30 border-b border-[#eee5de] bg-[#fbf8f4]/95 backdrop-blur-md">
    <div className="page-shell flex min-h-18 items-center justify-between gap-3 py-3">
      <Link href="/" className="flex items-center gap-2.5 text-[1.13rem] font-extrabold tracking-[-.045em]"><span className="flex size-9 items-center justify-center rounded-[11px] bg-[#f26a2e] text-[1.5rem] leading-none text-white">t</span>toprepet<span className="ml-1 hidden border-l border-[#d8d0c9] pl-3 text-sm font-semibold tracking-normal text-[#79818b] sm:inline">блог</span></Link>
      <nav aria-label="Основная навигация" className="flex items-center gap-5 text-[.82rem] font-bold sm:gap-8">
        <Link href="/" className="hover:text-[#d9551d]">Статьи</Link>
        <a href={MAIN_URL} className="inline-flex items-center gap-1 hover:text-[#d9551d]">Найти репетитора <ArrowUpRight size={15}/></a>
      </nav>
    </div>
  </header>
}
