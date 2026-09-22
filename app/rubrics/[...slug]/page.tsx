import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { ArticleCard } from '@/components/article-card'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { resolveCategory, rubricHref } from '@/lib/data'
import { categories, publishedArticles } from '@/lib/data-server'
import { siteUrl } from '@/lib/config'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string[] }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = resolveCategory(slug, await categories())
  if (!category) return { title: 'Рубрика не найдена', robots: { index: false } }
  const url = siteUrl(`/rubrics/${slug.join('/')}`)
  const description = category.description || `Статьи рубрики «${category.name}» в блоге TopRepet.`
  return { title: `${category.name} — Блог TopRepet`, description, alternates: { canonical: url }, openGraph: { title: `${category.name} — Блог TopRepet`, description, url } }
}

export default async function RubricPage({ params }: Props) {
  const { slug } = await params
  const [all, articles] = await Promise.all([categories(), publishedArticles()])
  const category = resolveCategory(slug, all)
  if (!category) notFound()
  const children = all.filter(c => c.parent_id === category.id)
  const shown = articles.filter(a => a.category_id === category.id)
  return <main className="page-shell py-12 sm:py-18"><Breadcrumbs category={category} categories={all}/><header className="max-w-[760px] border-b border-[#eee5de] pb-11"><span className="eyebrow">Направление</span><h1 className="mt-4 text-5xl font-extrabold leading-[1.12] tracking-[-.06em] sm:text-7xl">{category.name}</h1>{category.description && <p className="mt-6 text-lg leading-8 text-[#697383]">{category.description}</p>}</header>
    {children.length > 0 && <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Следующий шаг</p><h2>Темы направления</h2></div></div><div className="rubric-grid">{children.map((child, index) => <Link key={child.id} href={rubricHref(child, all)} className="rubric-card"><span className="rubric-card-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{child.name}</h3><p>{child.description || 'Статьи и разборы по теме'}</p></div><ArrowRight className="rubric-card-arrow" size={20}/></Link>)}</div></section>}
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Материалы</p><h2>Статьи по теме</h2></div></div>{shown.length ? <div className="article-grid">{shown.map(a => <ArticleCard key={a.id} article={a} categories={all}/>)}</div> : <div className="empty-state"><h3>Пока нет опубликованных статей</h3><p>Посмотрите вложенные темы или вернитесь к другим направлениям.</p><Link href="/" className="text-link">Все направления <ArrowRight size={17}/></Link></div>}</section>
  </main>
}
