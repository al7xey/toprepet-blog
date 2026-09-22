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
  return <main className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><Breadcrumbs category={category} categories={all}/><header className="max-w-3xl"><span className="text-sm font-bold uppercase tracking-widest text-[#e1642c]">Рубрика</span><h1 className="mt-3 text-4xl font-extrabold sm:text-6xl">{category.name}</h1>{category.description && <p className="mt-5 text-lg leading-8 text-[#617080]">{category.description}</p>}</header>
    {children.length > 0 && <section className="mt-16"><h2 className="mb-6 text-2xl font-extrabold">Изучить дальше</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children.map(child => <Link key={child.id} href={rubricHref(child, all)} className="paper group flex min-h-36 flex-col justify-between p-6"><span className="text-xl font-bold group-hover:text-[#e1642c]">{child.name}</span><span className="mt-5 inline-flex items-center gap-2 text-sm text-[#df5b27]">Перейти <ArrowRight size={16}/></span></Link>)}</div></section>}
    <section className="mt-16"><h2 className="mb-6 text-2xl font-extrabold">Статьи</h2>{shown.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{shown.map(a => <ArticleCard key={a.id} article={a} categories={all}/>)}</div> : <p className="paper p-7 text-[#6d7985]">В этой рубрике пока нет опубликованных статей. Посмотрите вложенные темы.</p>}</section>
  </main>
}
