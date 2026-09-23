import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { ArticleCard } from '@/components/article-card'
import { rubricHref } from '@/lib/data'
import { categories, publishedArticles } from '@/lib/data-server'
import { MAIN_URL, siteUrl } from '@/lib/config'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [rubrics, articles] = await Promise.all([categories(), publishedArticles()])
  const roots = rubrics.filter(category => !category.parent_id)
  const popular = [...articles].sort((a, b) => b.view_count - a.view_count).slice(0, 3)
  const jsonLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Блог TopRepet', url: siteUrl('/'), publisher: { '@type': 'Organization', name: 'TopRepet', url: MAIN_URL } }

  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}/>
    <section className="page-shell blog-intro">
      <h1>Блог TopRepet</h1>
      <p>Понятные разборы школьных тем и материалы для подготовки к ОГЭ и ЕГЭ.</p>
    </section>

    <section className="page-shell section-block" aria-labelledby="directions-title">
      <h2 id="directions-title" className="section-title">Основные направления</h2>
      {roots.length ? <div className="rubric-grid">{roots.map(category => <Link key={category.id} href={rubricHref(category, rubrics)} className="rubric-card"><BookOpen size={24}/><h3>{category.name}</h3><p>{category.description || 'Материалы и разборы по теме'}</p><ArrowRight className="rubric-card-arrow" size={20}/></Link>)}</div> : <p className="empty-message">Направления появятся после публикации материалов.</p>}
    </section>

    <section className="page-shell section-block" aria-labelledby="articles-title">
      <h2 id="articles-title" className="section-title">Свежее</h2>
      {articles.length ? <div className="article-grid">{articles.slice(0, 6).map(article => <ArticleCard key={article.id} article={article} categories={rubrics}/>)}</div> : <p className="empty-message">Пока нет опубликованных статей.</p>}
    </section>

    {popular.length > 0 && <section className="page-shell section-block" aria-labelledby="popular-title"><h2 id="popular-title" className="section-title">Популярное</h2><div className="article-grid">{popular.map(article => <ArticleCard key={article.id} article={article} categories={rubrics}/>)}</div></section>}
  </main>
}
