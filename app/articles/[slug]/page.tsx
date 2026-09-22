import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArticleCard } from '@/components/article-card'
import { ArticleInteractions } from '@/components/article-interactions'
import { ArticleToc } from '@/components/article-toc'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { siteUrl, MAIN_URL } from '@/lib/config'
import { headingsFromHtml, sanitizeHtml } from '@/lib/content'
import { displayDate, displayViews, relatedArticles, rubricHref, categoryPath } from '@/lib/data'
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
  const schemas = [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: article.title, description: article.excerpt, image: article.cover_image_url || undefined, datePublished: article.published_at, dateModified: article.modified_at || article.published_at, author: { '@type': 'Organization', name: 'Редакция TopRepet', url: MAIN_URL }, publisher: { '@type': 'Organization', name: 'TopRepet', url: MAIN_URL }, mainEntityOfPage: url }, { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: breadcrumbs }]
  return <main className="page-shell py-12 sm:py-16"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas).replace(/</g, '\\u003c') }}/><Breadcrumbs category={category} categories={all} articleTitle={article.title}/><article><header className="mx-auto max-w-[800px]">{category && <a href={rubricHref(category, all)} className="eyebrow hover:underline">{category.name}</a>}<h1 className="mt-5 text-4xl font-extrabold leading-[1.15] tracking-[-.055em] sm:text-6xl">{article.title}</h1><p className="mt-6 text-lg leading-8 text-[#697383] sm:text-xl">{article.excerpt}</p><div className="mt-9 flex flex-wrap items-center justify-between gap-5 border-y border-[#eee5de] py-5"><div className="text-sm leading-6 text-[#697383]"><strong className="block text-[#202838]">{article.author_name}</strong><time dateTime={article.published_at || undefined}>Опубликовано {displayDate(article.published_at)}</time>{article.modified_at && <><span> · </span><time dateTime={article.modified_at}>Обновлено {displayDate(article.modified_at)}</time></>}<span className="block">{displayViews(article.view_count)}</span></div><ArticleInteractions id={article.id} title={article.title} url={url}/></div></header>
    {article.cover_image_url && <figure className="mx-auto my-10 max-w-[960px]"><Image src={article.cover_image_url} alt={article.cover_image_alt || article.title} width={1600} height={900} unoptimized className="h-auto w-full rounded-[22px]"/></figure>}
    <div className="mx-auto grid max-w-[1080px] gap-12 lg:grid-cols-[minmax(0,800px)_220px]"><div className="min-w-0"><ArticleToc headings={headings}/><section aria-label="Текст статьи" className="article-body" dangerouslySetInnerHTML={{ __html: html }}/></div><div className="hidden lg:block"><ArticleToc headings={headings}/></div></div></article>
    {related.length > 0 && <section className="section-block mt-15 border-t border-[#f0e3dc]"><h2 className="section-title">Читайте также</h2><div className="article-grid">{related.map(a => <ArticleCard key={a.id} article={a} categories={all}/>)}</div></section>}
  </main>
}
