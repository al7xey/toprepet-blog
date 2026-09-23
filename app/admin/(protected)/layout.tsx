import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { LogoutButton } from '@/components/admin/logout-button'
export const instant = false
export const metadata: Metadata = { robots: { index: false, follow: false } }
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return <div className="page-shell admin-shell"><nav aria-label="Навигация редакции" className="admin-nav"><Link href="/admin">Обзор</Link><Link href="/admin/articles">Статьи</Link><Link href="/admin/categories">Рубрики</Link><span className="admin-logout"><LogoutButton/></span></nav>{children}</div>
}
