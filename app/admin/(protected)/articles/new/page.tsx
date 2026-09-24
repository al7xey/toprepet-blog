import { ArticleForm } from '@/components/admin/article-form'
import { categories } from '@/lib/data-server'
export const instant = false
export default async function NewArticle() { return <ArticleForm categories={await categories()}/> }
