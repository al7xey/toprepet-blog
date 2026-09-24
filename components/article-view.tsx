import Image from 'next/image'
import Link from 'next/link'
import { ArticleCard } from './article-card'
import { ArticleInteractions } from './article-interactions'
import { ArticleToc } from './article-toc'
import { Breadcrumbs } from './breadcrumbs'
import { displayDate, displayReadingTime, rubricHref } from '@/lib/data'
import type { ArticleCardData, ArticleDetail, Category } from '@/lib/types'

export function ArticleView({ article, categories, related = [], preview = false }: { article: ArticleDetail; categories: Category[]; related?: ArticleCardData[]; preview?: boolean }) {
  const category = categories.find(item => item.id === article.category_id)
  return <main className="page-shell article-page">
    {preview && <div className="preview-banner">Предпросмотр · изменения ещё не опубликованы</div>}
    <div className="article-shell">
    <Breadcrumbs category={category} categories={categories} articleTitle={article.title}/>
    <article>
      <header className="article-header">
        {category && <Link href={rubricHref(category, categories)} className="article-category">{category.name}</Link>}
        <h1>{article.title}</h1>{article.excerpt && <p className="article-lead">{article.excerpt}</p>}
        <div className="article-details"><div className="article-details-text"><strong>{article.author_name}</strong>{article.published_at && <time dateTime={article.published_at}>Опубликовано {displayDate(article.published_at)}</time>}{article.modified_at && <time dateTime={article.modified_at}>Обновлено {displayDate(article.modified_at)}</time>}<span>{displayReadingTime(article.reading_time_minutes)}</span></div>{!preview && <ArticleInteractions id={article.id} title={article.title} url={`/articles/${article.slug}`} initialViews={article.view_count}/>}</div>
      </header>
      {article.cover_image_url && <figure className="article-cover"><Image src={article.cover_image_url} alt={article.cover_image_alt || article.title} width={1600} height={900} sizes="(max-width: 960px) 100vw, 900px" priority/></figure>}
      <div className="article-content-layout"><div className="min-w-0"><ArticleToc headings={article.toc_json} variant="mobile"/><section aria-label="Текст статьи" className="article-body" dangerouslySetInnerHTML={{ __html: article.content_html }}/></div><ArticleToc headings={article.toc_json} variant="desktop"/></div>
    </article>
    {related.length > 0 && <section className="section-block related-section"><h2 className="section-title">Читайте также</h2><div className="article-list">{related.map(item => <ArticleCard key={item.id} article={item} categories={categories}/>)}</div></section>}
    </div>
  </main>
}
