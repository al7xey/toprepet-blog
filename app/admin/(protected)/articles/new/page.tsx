import { ArticleForm } from '@/components/admin/article-form'
import { requireAdmin } from '@/lib/auth'
import { categories } from '@/lib/data-server'
export const instant = false
export default async function NewArticle() { await requireAdmin(); return <ArticleForm categories={await categories()}/> }
