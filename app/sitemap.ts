import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/config'
import { rubricHref } from '@/lib/data'
import { categories, publishedCategoryIds, sitemapArticles } from '@/lib/data-server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rubrics, articles, publicIds] = await Promise.all([categories(), sitemapArticles(), publishedCategoryIds()])
  const publicRubrics = rubrics.filter(category => publicIds.has(category.id))
  return [{ url: siteUrl('/'), changeFrequency: 'weekly', priority: 1 }, ...publicRubrics.map(c => ({ url: siteUrl(rubricHref(c, rubrics)), lastModified: c.updated_at, changeFrequency: 'monthly' as const, priority: .7 })), ...articles.map(a => ({ url: siteUrl(`/articles/${a.slug}`), lastModified: a.modified_at || a.published_at || a.updated_at, changeFrequency: 'monthly' as const, priority: .8 }))]
}
