import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { LogoutButton } from '@/components/admin/logout-button'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return <div className="page-shell admin-shell"><aside className="admin-sidebar"><p className="eyebrow">Редакция TopRepet</p><nav aria-label="Навигация редакции" className="admin-nav"><Link href="/admin">Обзор</Link><Link href="/admin/articles">Статьи</Link><Link href="/admin/categories">Рубрики</Link></nav><div className="admin-sidebar-bottom"><LogoutButton/></div></aside><div className="admin-content">{children}</div></div>
}
