import Link from 'next/link'
import { ArrowRight, BookOpen, GraduationCap, Sparkles } from 'lucide-react'
import { ArticleCard } from '@/components/article-card'
import { rubricHref } from '@/lib/data'
import { categories, publishedArticles } from '@/lib/data-server'
import { MAIN_URL, siteUrl } from '@/lib/config'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [rubrics, articles] = await Promise.all([categories(), publishedArticles()])
  const roots = rubrics.filter(c => !c.parent_id)
  const popular = [...articles].sort((a,b) => b.view_count - a.view_count).slice(0,3)
  const jsonLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Блог TopRepet', url: siteUrl('/'), publisher: { '@type': 'Organization', name: 'TopRepet', url: MAIN_URL } }
  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}/>
    <section className="mx-auto max-w-7xl px-5 pb-14 pt-16 sm:px-8 sm:pt-24"><div className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full bg-[#fff0e5] px-4 py-2 text-sm font-bold text-[#d95822]"><Sparkles size={16}/> Учиться с интересом</span><h1 className="mt-7 text-5xl font-extrabold leading-tight tracking-tight sm:text-7xl">Блог <span className="text-[#ed6933]">TopRepet</span></h1><p className="mt-6 text-lg leading-8 text-[#596675] sm:text-xl">Понятные разборы школьных тем, советы по подготовке к экзаменам и идеи, которые помогают двигаться к своей цели.</p><a href={MAIN_URL} className="button-primary mt-8">Найти репетитора <ArrowRight size={18}/></a></div></section>
    <section className="bg-white py-16"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="mb-8 flex items-center gap-3"><GraduationCap className="text-[#ec6832]"/><h2 className="text-3xl font-extrabold">Основные направления</h2></div>{roots.length ? <div className="grid gap-5 md:grid-cols-3">{roots.map(c => <Link key={c.id} href={rubricHref(c,rubrics)} className="paper group p-7 hover:border-[#f46b32]"><BookOpen className="text-[#ed6933]"/><h3 className="mt-5 text-2xl font-bold group-hover:text-[#df5b27]">{c.name}</h3><p className="mt-2 text-[#6d7985]">{c.description || 'Материалы и разборы по теме'}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#df5b27]">Смотреть статьи <ArrowRight size={16}/></span></Link>)}</div> : <p className="text-[#6d7985]">Направления появятся здесь после настройки Supabase и публикации материалов.</p>}</div></section>
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8"><h2 className="mb-8 text-3xl font-extrabold">Свежие статьи</h2>{articles.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{articles.slice(0,6).map(a => <ArticleCard key={a.id} article={a} categories={rubrics}/>)}</div> : <p className="paper p-8 text-[#6d7985]">Пока нет опубликованных статей. Первый материал скоро появится.</p>}</section>
    {popular.length > 0 && <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8"><h2 className="mb-8 text-3xl font-extrabold">Популярное</h2><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{popular.map(a => <ArticleCard key={a.id} article={a} categories={rubrics}/>)}</div></section>}
  </main>
}
