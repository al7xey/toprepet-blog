import { CategoriesManager } from '@/components/admin/categories-manager'
import { requireAdmin } from '@/lib/auth'
import { categories } from '@/lib/data-server'
export default async function CategoriesPage() { await requireAdmin(); const all = await categories(); return <main><h1 className="text-4xl font-extrabold">Рубрики</h1><p className="mt-2 text-[#687482]">Ветка → подветка → тема. Вложенность можно расширять.</p><CategoriesManager categories={all}/></main> }
