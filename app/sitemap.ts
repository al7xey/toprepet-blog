import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/config'
import { rubricHref } from '@/lib/data'
import { categories, publishedArticles } from '@/lib/data-server'

export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rubrics, articles] = await Promise.all([categories(), publishedArticles()])
  return [{ url: siteUrl('/'), changeFrequency: 'weekly', priority: 1 }, ...rubrics.map(c => ({ url: siteUrl(rubricHref(c, rubrics)), lastModified: c.updated_at, changeFrequency: 'monthly' as const, priority: .7 })), ...articles.map(a => ({ url: siteUrl(`/articles/${a.slug}`), lastModified: a.modified_at || a.published_at || a.updated_at, changeFrequency: 'monthly' as const, priority: .8 }))]
}
