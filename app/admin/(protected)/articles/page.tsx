import Link from 'next/link'
import { ArticleTable } from '@/components/admin/article-table'
import { requireAdmin } from '@/lib/auth'
import { categories } from '@/lib/data-server'
import type { ArticleAdminListData } from '@/lib/types'

export const instant = false
type Props = { searchParams: Promise<{ q?: string; status?: string; sort?: string }> }
export default async function AdminArticles({ searchParams }: Props) {
  const query = await searchParams
  const { supabase } = await requireAdmin()
  let request = supabase.from('articles').select('id,title,slug,status,category_id,published_at,modified_at,updated_at,created_at,view_count').limit(100)
  if (query.q?.trim()) request = request.ilike('title', `%${query.q.trim().slice(0, 100)}%`)
  if (query.status === 'draft' || query.status === 'published') request = request.eq('status', query.status)
  request = query.sort === 'old' ? request.order('created_at') : query.sort === 'popular' ? request.order('view_count', { ascending: false }) : request.order('created_at', { ascending: false })
  const [{ data }, rubrics] = await Promise.all([request, categories()])
  return <main><div className="admin-page-heading"><h1>Статьи</h1><Link href="/admin/articles/new" className="button-primary">Новая статья</Link></div><ArticleTable articles={(data || []) as ArticleAdminListData[]} categories={rubrics}/></main>
}
