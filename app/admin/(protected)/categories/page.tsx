import { CategoriesManager } from '@/components/admin/categories-manager'
import { requireAdmin } from '@/lib/auth'
import { categories } from '@/lib/data-server'
export const instant = false
export default async function CategoriesPage() { await requireAdmin(); const all = await categories(); return <main><div className="admin-page-heading"><h1>Рубрики</h1></div><CategoriesManager categories={all}/></main> }
