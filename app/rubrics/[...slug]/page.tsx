import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleCard } from '@/components/article-card'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Pagination } from '@/components/pagination'
import { categoryBranchIds, categoryPath, resolveCategory, rubricHref } from '@/lib/data'
import { articleCards, categories, publishedCategoryIds } from '@/lib/data-server'
import { siteUrl } from '@/lib/config'

const PAGE_SIZE = 8
export const instant = false
type Props = { params: Promise<{ slug: string[] }>; searchParams: Promise<{ page?: string }> }
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, query, all, publicIds] = await Promise.all([params, searchParams, categories(), publishedCategoryIds()])
  const category = resolveCategory(slug, all)
  if (!category || !publicIds.has(category.id)) return { title: 'Рубрика не найдена', robots: { index: false } }
  const page = Math.max(1, Number(query.page) || 1)
  const base = `/rubrics/${slug.join('/')}`
  const url = siteUrl(page === 1 ? base : `${base}?page=${page}`)
  const description = category.description || `Статьи рубрики «${category.name}» в блоге TopRepet.`
  const title = `${category.name} — Блог TopRepet`
  return { title, description, alternates: { canonical: url }, openGraph: { type: 'website', title, description, url, images: [{ url: siteUrl('/opengraph-image'), alt: 'Блог TopRepet' }] }, twitter: { card: 'summary_large_image', title, description, images: [siteUrl('/opengraph-image')] } }
}

export default async function RubricPage({ params, searchParams }: Props) {
  const [{ slug }, query, all, publicIds] = await Promise.all([params, searchParams, categories(), publishedCategoryIds()])
  const category = resolveCategory(slug, all)
  if (!category || !publicIds.has(category.id)) notFound()
  const page = Math.max(1, Number(query.page) || 1)
  const branchIds = [...categoryBranchIds(category.id, all)]
  const result = await articleCards(page, PAGE_SIZE, 'fresh', branchIds)
  if (page > result.pageCount && result.total > 0) notFound()
  const children = all.filter(item => item.parent_id === category.id && publicIds.has(item.id))
  const path = categoryPath(category, all)
  const base = `/rubrics/${slug.join('/')}`
  const breadcrumbSchema = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Блог', item: siteUrl('/') }, ...path.map((item, index) => ({ '@type': 'ListItem', position: index + 2, name: item.name, item: siteUrl(rubricHref(item, all)) }))] }
  return <main className="page-shell rubric-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c') }}/><Breadcrumbs category={category} categories={all}/><header className="rubric-heading"><h1>{category.name}</h1>{category.description && <p>{category.description}</p>}</header>
    {children.length > 0 && <nav className="rubric-nav rubric-children" aria-label="Разделы рубрики"><span>Разделы</span><div className="rubric-links">{children.map(child => <Link key={child.id} href={rubricHref(child, all)}>{child.name}</Link>)}</div></nav>}
    <section className="section-block"><h2 className="section-title">Статьи</h2><div className="article-list">{result.items.map(article => <ArticleCard key={article.id} article={article} categories={all}/>)}</div><Pagination page={result.page} pageCount={result.pageCount} href={next => next === 1 ? base : `${base}?page=${next}`}/></section>
  </main>
}
