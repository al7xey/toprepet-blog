import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { displayViews } from '@/lib/data'
import type { Article } from '@/lib/types'

export default async function Dashboard() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('articles').select('*').order('updated_at', { ascending: false })
  const articles = (data || []) as Article[]
  const published = articles.filter(a => a.status === 'published').length
  const views = articles.reduce((sum, a) => sum + Number(a.view_count), 0)
  return <main><div className="admin-page-heading"><div><h1>Обзор</h1></div><Link href="/admin/articles/new" className="button-primary">Новая статья</Link></div><div className="admin-stats">{[['Всего статей', articles.length], ['Опубликовано', published], ['Черновики', articles.length-published], ['Просмотры', displayViews(views)]].map(([label,value]) => <div key={label} className="paper p-6"><p className="text-sm text-[#697383]">{label}</p><strong className="mt-4 block text-3xl font-extrabold">{value}</strong></div>)}</div><section className="mt-12"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Последние статьи</h2><Link href="/admin/articles" className="text-link">Все статьи →</Link></div><div className="paper mt-5 divide-y divide-[#eee5de] overflow-hidden">{articles.slice(0,5).map(a => <Link key={a.id} href={`/admin/articles/${a.id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-[#fff8f4]"><span className="font-semibold">{a.title}</span><span className="text-xs text-[#697383]">{a.status === 'published' ? 'Опубликована' : 'Черновик'}</span></Link>)}{!articles.length && <div className="p-7"><p className="text-[#697383]">Пока нет статей.</p><Link href="/admin/articles/new" className="text-link mt-4">Создать статью →</Link></div>}</div></section></main>
}
