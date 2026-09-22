import Link from 'next/link'
import Image from 'next/image'
import { BookOpen } from 'lucide-react'
import type { Article, Category } from '@/lib/types'
import { displayDate, displayViews, rubricHref } from '@/lib/data'

export function ArticleCard({ article, categories }: { article: Article; categories: Category[] }) {
  const category = categories.find(c => c.id === article.category_id)
  return <article className="article-card">
    <Link href={`/articles/${article.slug}`} aria-label={`Читать: ${article.title}`} className={`article-card-media ${article.cover_image_url ? '' : 'article-card-placeholder'}`}>{article.cover_image_url ? <Image src={article.cover_image_url} alt={article.cover_image_alt || ''} width={960} height={540} unoptimized/> : <BookOpen size={40} strokeWidth={1.4}/>}</Link>
    <div className="article-card-body">
      {category && <Link href={rubricHref(category, categories)} className="article-card-category">{category.name}</Link>}
      <h3><Link href={`/articles/${article.slug}`}>{article.title}</Link></h3>
      <p className="line-clamp-3">{article.excerpt}</p>
      <div className="article-card-meta"><span>{displayDate(article.published_at)}</span><span aria-hidden="true">·</span><span>{displayViews(article.view_count)}</span></div>
    </div>
  </article>
}
