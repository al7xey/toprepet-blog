import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/config'
import { categoryBranchIds, rubricHref } from '@/lib/data'
import { categories, publishedArticles } from '@/lib/data-server'

export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rubrics, articles] = await Promise.all([categories(), publishedArticles()])
  const publicRubrics = rubrics.filter(category => {
    const branch = categoryBranchIds(category.id, rubrics)
    return articles.some(article => branch.has(article.category_id))
  })
  return [{ url: siteUrl('/'), changeFrequency: 'weekly', priority: 1 }, ...publicRubrics.map(c => ({ url: siteUrl(rubricHref(c, rubrics)), lastModified: c.updated_at, changeFrequency: 'monthly' as const, priority: .7 })), ...articles.map(a => ({ url: siteUrl(`/articles/${a.slug}`), lastModified: a.modified_at || a.published_at || a.updated_at, changeFrequency: 'monthly' as const, priority: .8 }))]
}
