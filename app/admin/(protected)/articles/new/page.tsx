import { ArticleForm } from '@/components/admin/article-form'
import { categories } from '@/lib/data-server'
import { requireAdmin } from '@/lib/auth'
import type { ArticleCardData } from '@/lib/types'
export const instant = false
const OPTION_FIELDS = 'id,title,slug,excerpt,cover_image_url,cover_image_alt,category_id,author_name,published_at,modified_at,view_count,reading_time_minutes'
export default async function NewArticle() {
  const { supabase } = await requireAdmin()
  const [rubrics, { data }] = await Promise.all([categories(), supabase.from('articles').select(OPTION_FIELDS).eq('status', 'published').order('published_at', { ascending: false }).limit(100)])
  return <ArticleForm categories={rubrics} publishedArticles={(data || []) as ArticleCardData[]}/>
}
