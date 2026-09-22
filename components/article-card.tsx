import Link from 'next/link'
import Image from 'next/image'
import type { Article, Category } from '@/lib/types'
import { displayDate, displayViews, rubricHref } from '@/lib/data'

export function ArticleCard({ article, categories }: { article: Article; categories: Category[] }) {
  const category = categories.find(c => c.id === article.category_id)
  return <article className="paper overflow-hidden transition-shadow hover:shadow-lg">
    {article.cover_image_url && <Link href={`/articles/${article.slug}`} aria-label={`Читать: ${article.title}`} className="block overflow-hidden"><Image src={article.cover_image_url} alt={article.cover_image_alt || ''} width={960} height={540} unoptimized className="aspect-video w-full object-cover" /></Link>}
    <div className="p-6">
      {category && <Link href={rubricHref(category, categories)} className="text-xs font-bold uppercase tracking-wider text-[#df5b27]">{category.name}</Link>}
      <h3 className="mt-2 text-xl font-extrabold leading-snug"><Link href={`/articles/${article.slug}`} className="hover:text-[#df5b27]">{article.title}</Link></h3>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#586575]">{article.excerpt}</p>
      <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#78838e]"><span>{displayDate(article.published_at)}</span><span>{displayViews(article.view_count)}</span></div>
    </div>
  </article>
}
