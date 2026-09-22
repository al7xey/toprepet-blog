import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { MAIN_URL } from '@/lib/config'

export function SiteHeader() {
  return <header className="border-b border-[#eee7de] bg-[#faf7f2]/95">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
      <Link href="/" className="flex items-center gap-3 text-xl font-extrabold tracking-tight"><span className="flex size-10 items-center justify-center rounded-xl bg-[#f46b32] text-2xl text-white">t</span>TopRepet <span className="hidden font-normal text-[#7b8791] sm:inline">/ блог</span></Link>
      <nav aria-label="Основная навигация" className="flex items-center gap-4 text-sm font-semibold sm:gap-8">
        <Link href="/" className="hover:text-[#e65f29]">Главная</Link>
        <a href={MAIN_URL} className="inline-flex items-center gap-1 text-[#d95822] hover:underline">Занятия <ArrowUpRight size={16}/></a>
      </nav>
    </div>
  </header>
}
