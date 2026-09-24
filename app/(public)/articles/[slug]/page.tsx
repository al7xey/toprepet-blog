import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { ArticleView } from '@/components/article-view'
import { siteUrl, MAIN_URL } from '@/lib/config'
import { categoryPath } from '@/lib/data'
import { articleSlugRedirect, categories, manualRecommendationCards, publishedArticle, relatedArticleCards } from '@/lib/data-server'
import { mergeRecommendations } from '@/lib/recommendations'

export const instant = false
type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await publishedArticle(slug)
  if (!article) return { title: 'Статья не найдена', robots: { index: false } }
  const title = article.seo_title || `${article.title} — Блог TopRepet`
  const description = article.seo_description || article.excerpt
  const url = siteUrl(`/articles/${article.slug}`)
  const images = [{ url: article.cover_image_url || siteUrl('/opengraph-image'), alt: article.cover_image_alt || article.title }]
  return { title, description, alternates: { canonical: url }, openGraph: { type: 'article', title, description, url, images, publishedTime: article.published_at || undefined, modifiedTime: article.modified_at || undefined }, twitter: { card: 'summary_large_image', title, description, images: images.map(image => image.url) } }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await publishedArticle(slug)
  if (!article) {
    const redirectSlug = await articleSlugRedirect(slug)
    if (redirectSlug) permanentRedirect(`/articles/${redirectSlug}`)
    notFound()
  }
  const all = await categories()
  const category = all.find(item => item.id === article.category_id)
  const manual = await manualRecommendationCards(article.id)
  const primary = await relatedArticleCards(article.id, [article.category_id], 3, manual.map(item => item.id))
  const fallbackIds = category?.parent_id ? all.filter(item => item.parent_id === category.parent_id || item.id === category.parent_id).map(item => item.id).filter(id => id !== article.category_id) : []
  const chosen = [...manual, ...primary]
  const fallback = chosen.length < 3 ? await relatedArticleCards(article.id, fallbackIds, 3 - chosen.length, chosen.map(item => item.id)) : []
  const selected = [...chosen, ...fallback]
  const broadFallback = selected.length < 3 ? await relatedArticleCards(article.id, all.map(item => item.id), 3 - selected.length, selected.map(item => item.id)) : []
  const related = mergeRecommendations(article.id, manual, [...primary, ...fallback, ...broadFallback])
  const url = siteUrl(`/articles/${article.slug}`)
  const paths = category ? categoryPath(category, all) : []
  const breadcrumbs = [{ '@type': 'ListItem', position: 1, name: 'Блог', item: siteUrl('/') }, ...paths.map((item, index) => ({ '@type': 'ListItem', position: index + 2, name: item.name, item: siteUrl(`/rubrics/${paths.slice(0, index + 1).map(part => part.slug).join('/')}`) })), { '@type': 'ListItem', position: paths.length + 2, name: article.title, item: url }]
  const schemas = [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: article.title, description: article.excerpt, image: article.cover_image_url || siteUrl('/opengraph-image'), datePublished: article.published_at, dateModified: article.modified_at || article.published_at, timeRequired: `PT${article.reading_time_minutes}M`, author: { '@type': 'Organization', name: article.author_name, url: MAIN_URL }, publisher: { '@type': 'Organization', name: 'TopRepet', url: MAIN_URL, logo: { '@type': 'ImageObject', url: siteUrl('/logo.svg') } }, mainEntityOfPage: url }, { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: breadcrumbs }]
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas).replace(/</g, '\\u003c') }}/><ArticleView article={article} categories={all} related={related}/></>
}
