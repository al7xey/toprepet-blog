import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { LogoutButton } from '@/components/admin/logout-button'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8"><nav aria-label="Навигация редакции" className="mb-10 flex flex-wrap items-center gap-5 border-b border-[#e8dfd5] pb-5 text-sm font-bold"><Link href="/admin" className="hover:text-[#df5b27]">Обзор</Link><Link href="/admin/articles" className="hover:text-[#df5b27]">Статьи</Link><Link href="/admin/categories" className="hover:text-[#df5b27]">Рубрики</Link><span className="ml-auto"><LogoutButton/></span></nav>{children}</div>
}
