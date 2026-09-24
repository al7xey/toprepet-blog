import { notFound } from 'next/navigation'
import { ArticleForm } from '@/components/admin/article-form'
import { requireAdmin } from '@/lib/auth'
import { categories } from '@/lib/data-server'
import type { ArticleCardData, ArticleDetail } from '@/lib/types'

export const instant = false
const EDIT_FIELDS = 'id,title,slug,excerpt,content_json,content_html,toc_json,cover_image_url,cover_image_alt,status,category_id,author_name,seo_title,seo_description,published_at,modified_at,created_at,updated_at,view_count,reading_time_minutes'
const OPTION_FIELDS = 'id,title,slug,excerpt,cover_image_url,cover_image_alt,category_id,author_name,published_at,modified_at,view_count,reading_time_minutes'
export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireAdmin()
  const [{ data }, rubrics, { data: published }, { data: recommendations }] = await Promise.all([
    supabase.from('articles').select(EDIT_FIELDS).eq('id', id).maybeSingle(),
    categories(),
    supabase.from('articles').select(OPTION_FIELDS).eq('status', 'published').neq('id', id).order('published_at', { ascending: false }).limit(100),
    supabase.from('article_recommendations').select('recommended_article_id,sort_order').eq('article_id', id).order('sort_order'),
  ])
  if (!data) notFound()
  return <ArticleForm article={data as ArticleDetail} categories={rubrics} publishedArticles={(published || []) as ArticleCardData[]} recommendationIds={(recommendations || []).map(item => item.recommended_article_id)}/>
}
