import { CategoriesManager } from '@/components/admin/categories-manager'
import { requireAdmin } from '@/lib/auth'
import { categories } from '@/lib/data-server'
export default async function CategoriesPage() { await requireAdmin(); const all = await categories(); return <main><div className="admin-page-heading"><div><p className="eyebrow">Структура блога</p><h1>Рубрики</h1><p>Организуйте материалы от направления к теме.</p></div></div><CategoriesManager categories={all}/></main> }
