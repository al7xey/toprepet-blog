import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleCard } from '@/components/article-card'
import { ArticleInteractions } from '@/components/article-interactions'
import { ArticleToc } from '@/components/article-toc'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { siteUrl, MAIN_URL } from '@/lib/config'
import { headingsFromHtml, sanitizeHtml } from '@/lib/content'
import { displayDate, displayReadingTime, readingTimeMinutes, displayViews, relatedArticles, rubricHref, categoryPath } from '@/lib/data'
import { categories, publishedArticle, publishedArticles } from '@/lib/data-server'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await publishedArticle(slug)
  if (!article) return { title: 'Статья не найдена', robots: { index: false } }
  const title = article.seo_title || `${article.title} — Блог TopRepet`
  const description = article.seo_description || article.excerpt
  const url = siteUrl(`/articles/${article.slug}`)
  const images = [{ url: article.cover_image_url || siteUrl('/opengraph-image'), alt: article.cover_image_alt || article.title }]
  return { title, description, alternates: { canonical: url }, openGraph: { type: 'article', title, description, url, images, publishedTime: article.published_at || undefined, modifiedTime: article.modified_at || undefined }, twitter: { card: 'summary_large_image', title, description, images: images.map(i => i.url) } }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const [article, all, others] = await Promise.all([publishedArticle(slug), categories(), publishedArticles()])
  if (!article) notFound()
  const category = all.find(c => c.id === article.category_id)
  const related = relatedArticles(article, others, all)
  const url = siteUrl(`/articles/${article.slug}`)
  const html = sanitizeHtml(article.content_html)
  const headings = headingsFromHtml(html)
  const breadcrumbs = [{ '@type': 'ListItem', position: 1, name: 'Блог', item: siteUrl('/') }, ...(category ? categoryPath(category, all).map((c,i) => ({ '@type': 'ListItem', position: i + 2, name: c.name, item: siteUrl(rubricHref(c, all)) })) : []), { '@type': 'ListItem', position: category ? categoryPath(category, all).length + 2 : 2, name: article.title, item: url }]
  const schemas = [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: article.title, description: article.excerpt, image: article.cover_image_url || siteUrl('/opengraph-image'), datePublished: article.published_at, dateModified: article.modified_at || article.published_at, timeRequired: `PT${readingTimeMinutes(article.content_json)}M`, author: { '@type': 'Organization', name: article.author_name, url: MAIN_URL }, publisher: { '@type': 'Organization', name: 'TopRepet', url: MAIN_URL }, mainEntityOfPage: url }, { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: breadcrumbs }]
  return <main className="page-shell article-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas).replace(/</g, '\\u003c') }}/><Breadcrumbs category={category} categories={all} articleTitle={article.title}/><article><header className="article-header">{category && <Link href={rubricHref(category, all)} className="article-category">{category.name}</Link>}<h1>{article.title}</h1><p className="article-lead">{article.excerpt}</p><div className="article-details"><div className="article-details-text"><strong>{article.author_name}</strong><time dateTime={article.published_at || undefined}>Опубликовано {displayDate(article.published_at)}</time>{article.modified_at && <time dateTime={article.modified_at}>Обновлено {displayDate(article.modified_at)}</time>}<span>{displayViews(article.view_count)} · {displayReadingTime(article.content_json)}</span></div><ArticleInteractions id={article.id} title={article.title} url={url}/></div></header>
    {article.cover_image_url && <figure className="article-cover"><Image src={article.cover_image_url} alt={article.cover_image_alt || article.title} width={1600} height={900} unoptimized/></figure>}
    <div className="article-content-layout"><div className="min-w-0"><ArticleToc headings={headings} variant="mobile"/><section aria-label="Текст статьи" className="article-body" dangerouslySetInnerHTML={{ __html: html }}/></div><ArticleToc headings={headings} variant="desktop"/></div></article>
    {related.length > 0 && <section className="section-block related-section"><h2 className="section-title">Читайте также</h2><div className="article-list">{related.map(a => <ArticleCard key={a.id} article={a} categories={all}/>)}</div></section>}
  </main>
}
