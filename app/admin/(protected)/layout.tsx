import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { AdminHeader } from '@/components/admin/admin-header'
export const instant = false
export const metadata: Metadata = { robots: { index: false, follow: false } }
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return <><AdminHeader/><div className="page-shell admin-shell">{children}</div></>
}
