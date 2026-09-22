import Link from 'next/link'
import { ArticleTable } from '@/components/admin/article-table'
import { requireAdmin } from '@/lib/auth'
import { categories } from '@/lib/data-server'
import type { Article } from '@/lib/types'

export default async function AdminArticles() {
  const { supabase } = await requireAdmin()
  const [{ data }, rubrics] = await Promise.all([supabase.from('articles').select('*'), categories()])
  return <main><div className="admin-page-heading"><div><p className="eyebrow">Контент</p><h1>Статьи</h1><p>Черновики, опубликованные материалы и их результаты.</p></div><Link href="/admin/articles/new" className="button-primary">Новая статья</Link></div><ArticleTable articles={(data || []) as Article[]} categories={rubrics}/></main>
}
