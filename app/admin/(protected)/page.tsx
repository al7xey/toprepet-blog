import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { displayDate, displayViews } from '@/lib/data'

export default async function AdminHome() {
  const { supabase } = await requireAdmin()
  const [{ count: total }, { count: published }, { count: drafts }, { data: views }, { data: recent }] = await Promise.all([
    supabase.from('articles').select('id', { count: 'exact', head: true }),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('articles').select('view_count'),
    supabase.from('articles').select('id,title,status,updated_at').order('updated_at', { ascending: false }).limit(5),
  ])
  const stats = [{ label: 'Всего статей', value: total || 0 }, { label: 'Опубликовано', value: published || 0 }, { label: 'Черновики', value: drafts || 0 }, { label: 'Просмотры', value: displayViews((views || []).reduce((sum, item) => sum + Number(item.view_count), 0)) }]
  return <main><div className="admin-page-heading"><div><p className="eyebrow">Редакция</p><h1>Обзор</h1></div><Link href="/admin/articles/new" className="button-primary">Новая статья</Link></div><section className="admin-stats" aria-label="Статистика">{stats.map(stat => <div className="paper p-5" key={stat.label}><span className="text-sm text-[#697383]">{stat.label}</span><strong className="mt-2 block text-2xl">{stat.value}</strong></div>)}</section><section className="mt-10"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Последние статьи</h2><Link className="text-link" href="/admin/articles">Все статьи →</Link></div><div className="divide-y divide-[#eee5de] border-y border-[#eee5de]">{(recent || []).map(item => <Link className="flex items-center justify-between gap-4 py-4" href={`/admin/articles/${item.id}`} key={item.id}><span className="font-semibold">{item.title}</span><span className="text-xs text-[#697383]">{item.status === 'published' ? 'Опубликована' : 'Черновик'} · {displayDate(item.updated_at)}</span></Link>)}</div></section></main>
}
