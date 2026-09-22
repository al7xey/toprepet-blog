import Link from 'next/link'
import { ArticleTable } from '@/components/admin/article-table'
import { requireAdmin } from '@/lib/auth'
import { categories } from '@/lib/data-server'
import type { Article } from '@/lib/types'

export default async function AdminArticles() {
  const { supabase } = await requireAdmin()
  const [{ data }, rubrics] = await Promise.all([supabase.from('articles').select('*'), categories()])
  return <main><div className="flex items-center justify-between gap-4"><h1 className="text-4xl font-extrabold">Статьи</h1><Link href="/admin/articles/new" className="button-primary">Новая статья</Link></div><ArticleTable articles={(data || []) as Article[]} categories={rubrics}/></main>
}
