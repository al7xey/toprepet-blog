import Link from 'next/link'
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react'
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
    <section className="page-shell hero-section">
      <div className="hero-copy">
        <p className="eyebrow">Блог TopRepet <span aria-hidden="true">/</span> Учёба без лишнего</p>
        <h1>Знания, которые <span>ведут к цели.</span></h1>
        <p className="hero-lead">Коротко и понятно разбираем школьные темы, подготовку к экзаменам и способы учиться увереннее.</p>
        <div className="hero-actions"><a href={MAIN_URL} className="button-primary">Найти репетитора <ArrowRight size={18}/></a><a href="#articles" className="text-link">Читать статьи <ArrowRight size={17}/></a></div>
      </div>
      <div className="hero-mark" aria-hidden="true"><span className="hero-mark-top">TOP</span><span className="hero-mark-letter">t</span><span className="hero-mark-bottom">REPET</span></div>
    </section>
    <section className="page-shell section-block" aria-labelledby="directions-title">
      <div className="section-heading"><div><p className="eyebrow">Навигация</p><h2 id="directions-title">Основные направления</h2></div><p>Выберите тему и двигайтесь от простого к сложному.</p></div>
      {roots.length ? <div className="rubric-grid">{roots.map((category, index) => <Link key={category.id} href={rubricHref(category, rubrics)} className="rubric-card"><span className="rubric-card-number">{String(index + 1).padStart(2, '0')}</span><div><BookOpen size={23} strokeWidth={1.7}/><h3>{category.name}</h3><p>{category.description || 'Разборы и полезные материалы по теме.'}</p></div><ArrowRight className="rubric-card-arrow" size={20}/></Link>)}</div> : <div className="empty-state"><GraduationCap size={27}/><h3>Скоро здесь появятся направления</h3><p>Готовим полезные материалы для учеников и родителей.</p></div>}
    </section>
    <section id="articles" className="page-shell section-block" aria-labelledby="articles-title">
      <div className="section-heading"><div><p className="eyebrow">Новые материалы</p><h2 id="articles-title">Свежие статьи</h2></div><p>Практичные объяснения, к которым удобно возвращаться.</p></div>
      {articles.length ? <div className="article-grid">{articles.slice(0, 6).map(article => <ArticleCard key={article.id} article={article} categories={rubrics}/>)}</div> : <div className="empty-state"><BookOpen size={27}/><h3>Статьи скоро появятся</h3><p>Мы готовим первые материалы. Пока можно выбрать преподавателя под свою цель.</p><a className="text-link" href={MAIN_URL}>Перейти к преподавателям <ArrowRight size={17}/></a></div>}
    </section>
    {popular.length > 0 && <section className="page-shell section-block" aria-labelledby="popular-title"><div className="section-heading"><div><p className="eyebrow">Выбор читателей</p><h2 id="popular-title">Популярное</h2></div></div><div className="article-grid">{popular.map(article => <ArticleCard key={article.id} article={article} categories={rubrics}/>)}</div></section>}
  </main>
}
