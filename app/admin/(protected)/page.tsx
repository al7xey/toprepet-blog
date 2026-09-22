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
  return <main><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-4xl font-extrabold">Обзор</h1><p className="mt-2 text-[#687482]">Как идут дела в блоге</p></div><Link href="/admin/articles/new" className="button-primary">Новая статья</Link></div><div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Всего статей', articles.length], ['Опубликовано', published], ['Черновики', articles.length-published], ['Просмотры', displayViews(views)]].map(([label,value]) => <div key={label} className="paper p-6"><p className="text-sm text-[#687482]">{label}</p><strong className="mt-3 block text-3xl">{value}</strong></div>)}</div><section className="mt-12"><h2 className="mb-5 text-2xl font-bold">Последние статьи</h2><div className="paper divide-y divide-[#eee7de] overflow-hidden">{articles.slice(0,5).map(a => <Link key={a.id} href={`/admin/articles/${a.id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-[#fffaf6]"><span className="font-semibold">{a.title}</span><span className="text-sm text-[#687482]">{a.status === 'published' ? 'Опубликована' : 'Черновик'}</span></Link>)}{!articles.length && <p className="p-6 text-[#687482]">Создайте первую статью.</p>}</div></section></main>
}
