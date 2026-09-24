import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleView } from '@/components/article-view'
import { PreviewToolbar } from '@/components/admin/preview-toolbar'
import { requireAdmin } from '@/lib/auth'
import type { ArticleDetail, Category } from '@/lib/types'
export const metadata: Metadata = { robots: { index: false, follow: false } }
export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireAdmin()
  const [{ data }, { data: categories }] = await Promise.all([
    supabase.from('article_previews').select('payload,expires_at').eq('id', id).gt('expires_at', new Date().toISOString()).maybeSingle(),
    supabase.from('categories').select('id,name,slug,parent_id,description,sort_order,created_at,updated_at').order('sort_order').order('name'),
  ])
  if (!data) notFound()
  const article = data.payload as ArticleDetail
  return <><PreviewToolbar article={article}/><ArticleView article={article} categories={(categories || []) as Category[]} preview/></>
}
