import type { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3, BookOpen, Clock3, Layers3 } from 'lucide-react'
import { ArticleCard } from '@/components/article-card'
import { Pagination } from '@/components/pagination'
import { rubricHref } from '@/lib/data'
import { articleCards, categories, publishedCategoryIds } from '@/lib/data-server'
import { MAIN_URL, siteUrl } from '@/lib/config'

const PAGE_SIZE = 8
const POPULAR_SIZE = 4
export const instant = false
type Props = { searchParams: Promise<{ page?: string }> }
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = await searchParams
  const page = Math.max(1, Number(query.page) || 1)
  const canonical = siteUrl(page === 1 ? '/' : `/?page=${page}`)
  return { alternates: { canonical }, robots: page > 1 ? { index: true, follow: true } : undefined }
}

export default async function Home({ searchParams }: Props) {
  const query = await searchParams
  const page = Math.max(1, Number(query.page) || 1)
  const [rubrics, publicIds, fresh, popular] = await Promise.all([
    categories(),
    publishedCategoryIds(),
    articleCards(page, PAGE_SIZE, 'fresh'),
    articleCards(1, POPULAR_SIZE, 'popular'),
  ])
  const roots = rubrics.filter(category => !category.parent_id && publicIds.has(category.id))
  const jsonLd = [{ '@context': 'https://schema.org', '@type': 'Organization', name: 'TopRepet', url: MAIN_URL }, { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Блог TopRepet', url: siteUrl('/'), publisher: { '@type': 'Organization', name: 'TopRepet', url: MAIN_URL } }]
  const href = (next: number) => next === 1 ? '/' : `/?page=${next}`
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}/>
    <section className="page-shell blog-intro">
      <p className="section-label">Блог TopRepet</p>
      <h1>Учёба без лишней сложности</h1>
      <p>Понятные разборы школьных тем и материалы для подготовки к ОГЭ и ЕГЭ.</p>
      <div className="intro-actions"><Link className="button-primary" href="/#fresh">Читать материалы</Link><Link className="button-outline" href="/#directions">Выбрать направление</Link></div>
    </section>

    <section id="directions" className="page-shell section-block directions-section" aria-labelledby="directions-title">
      <div className="section-heading-simple"><div><p className="section-label">Рубрики</p><h2 id="directions-title" className="section-title">Направления</h2></div><Layers3 aria-hidden="true"/></div>
      {roots.length > 0 ? <nav className="direction-grid" aria-label="Направления блога">{roots.map(category => <Link key={category.id} href={rubricHref(category, rubrics)} className="direction-card"><span>{category.name}</span><small>{category.description || 'Материалы и полезные разборы'}</small></Link>)}</nav> : <div className="empty-state"><BookOpen aria-hidden="true"/><div><strong>Рубрики скоро появятся</strong><p>Мы готовим первые направления и материалы.</p></div></div>}
    </section>

    <div className="page-shell home-feed-grid">
      <section id="fresh" className="section-block home-feed-main" aria-labelledby="fresh-title">
        <div className="section-heading-simple"><div><p className="section-label">Новые публикации</p><h2 id="fresh-title" className="section-title">Свежее</h2></div><Clock3 aria-hidden="true"/></div>
        {fresh.items.length ? <div className="article-list">{fresh.items.map(article => <ArticleCard key={article.id} article={article} categories={rubrics}/>)}</div> : <div className="empty-state"><BookOpen aria-hidden="true"/><div><strong>Пока нет опубликованных статей</strong><p>Новые материалы появятся в этом разделе.</p></div></div>}
        <Pagination page={fresh.page} pageCount={fresh.pageCount} href={href}/>
      </section>

      <aside id="popular" className="section-block popular-section" aria-labelledby="popular-title">
        <div className="section-heading-simple"><div><p className="section-label">Читают чаще всего</p><h2 id="popular-title" className="section-title">Популярное</h2></div><BarChart3 aria-hidden="true"/></div>
        {popular.items.length ? <ol className="popular-list">{popular.items.map((article, index) => <li key={article.id}><span>{String(index + 1).padStart(2, '0')}</span><Link href={`/articles/${article.slug}`}>{article.title}</Link></li>)}</ol> : <div className="empty-state empty-state-compact"><BarChart3 aria-hidden="true"/><div><strong>Здесь появятся популярные статьи</strong><p>Рейтинг сформируется по просмотрам.</p></div></div>}
      </aside>
    </div>

    <section className="page-shell blog-cta">
      <div><p className="section-label">TopRepet</p><h2>Нужна помощь с учёбой?</h2><p>Подберите репетитора под свою цель на основном сайте.</p></div>
      <a className="button-primary" href={MAIN_URL}>Выбрать репетитора</a>
    </section>
  </main>
}
