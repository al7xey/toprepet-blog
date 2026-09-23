import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleCard } from '@/components/article-card'
import { Pagination } from '@/components/pagination'
import { rubricHref } from '@/lib/data'
import { articleCards, categories, publishedCategoryIds } from '@/lib/data-server'
import { MAIN_URL, siteUrl } from '@/lib/config'

const PAGE_SIZE = 8
export const instant = false
type Props = { searchParams: Promise<{ page?: string; mode?: string }> }
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = await searchParams
  const page = Math.max(1, Number(query.page) || 1)
  const mode = query.mode === 'popular' ? 'popular' : 'fresh'
  const canonical = mode === 'fresh' ? siteUrl(page === 1 ? '/' : `/?page=${page}`) : siteUrl(`/?mode=popular${page > 1 ? `&page=${page}` : ''}`)
  return { alternates: { canonical }, robots: page > 1 ? { index: true, follow: true } : undefined }
}

export default async function Home({ searchParams }: Props) {
  const query = await searchParams
  const page = Math.max(1, Number(query.page) || 1)
  const mode = query.mode === 'popular' ? 'popular' : 'fresh'
  const [rubrics, publicIds, result] = await Promise.all([categories(), publishedCategoryIds(), articleCards(page, PAGE_SIZE, mode)])
  const roots = rubrics.filter(category => !category.parent_id && publicIds.has(category.id))
  const jsonLd = [{ '@context': 'https://schema.org', '@type': 'Organization', name: 'TopRepet', url: MAIN_URL }, { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Блог TopRepet', url: siteUrl('/'), publisher: { '@type': 'Organization', name: 'TopRepet', url: MAIN_URL } }]
  const href = (next: number) => mode === 'fresh' ? (next === 1 ? '/' : `/?page=${next}`) : `/?mode=popular${next > 1 ? `&page=${next}` : ''}`
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}/>
    <section className="page-shell blog-intro"><h1>Блог TopRepet</h1><p>Понятные разборы школьных тем и материалы для подготовки к ОГЭ и ЕГЭ.</p></section>
    {roots.length > 0 && <nav className="page-shell rubric-nav" aria-label="Направления блога"><span>Направления</span><div className="rubric-links">{roots.map(category => <Link key={category.id} href={rubricHref(category, rubrics)}>{category.name} <span aria-hidden="true">↗</span></Link>)}</div></nav>}
    <section className="page-shell section-block" aria-labelledby="articles-title">
      <div className="feed-heading"><h2 id="articles-title" className="section-title">{mode === 'popular' ? 'Популярное' : 'Свежее'}</h2><nav aria-label="Сортировка статей"><Link aria-current={mode === 'fresh' ? 'page' : undefined} href="/">Свежее</Link><Link aria-current={mode === 'popular' ? 'page' : undefined} href="/?mode=popular">Популярное</Link></nav></div>
      {result.items.length ? <div className="article-list">{result.items.map(article => <ArticleCard key={article.id} article={article} categories={rubrics}/>)}</div> : <p className="empty-message">Пока нет опубликованных статей.</p>}
      <Pagination page={result.page} pageCount={result.pageCount} href={href}/>
    </section>
  </main>
}
