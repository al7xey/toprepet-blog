import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { displayDate } from '@/lib/data'

export const instant = false
export default async function AdminHome() {
  const { supabase } = await requireAdmin()
  const [{ count: total }, { count: published }, { count: drafts }, { data: totalViews }, { data: recent }] = await Promise.all([
    supabase.from('articles').select('id', { count: 'exact', head: true }),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.rpc('blog_admin_total_views'),
    supabase.from('articles').select('id,title,status,updated_at').order('updated_at', { ascending: false }).limit(5),
  ])
  const stats = [{ label: 'Всего статей', value: total || 0 }, { label: 'Опубликовано', value: published || 0 }, { label: 'Черновики', value: drafts || 0 }, { label: 'Просмотры', value: new Intl.NumberFormat('ru-RU').format(Number(totalViews || 0)) }]
  return <main><div className="admin-page-heading"><div><p className="eyebrow">Редакция</p><h1>Обзор</h1></div><Link href="/admin/articles/new" className="button-primary">Новая статья</Link></div><section className="admin-stats" aria-label="Статистика">{stats.map(stat => <div className="paper admin-stat" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></div>)}</section><section className="admin-recent"><div className="admin-recent-heading"><h2>Последние статьи</h2><Link className="text-link" href="/admin/articles">Все статьи</Link></div><div className="admin-recent-list">{(recent || []).map(item => <Link className="admin-recent-row" href={`/admin/articles/${item.id}`} key={item.id}><span className="font-semibold">{item.title}</span><span>{item.status === 'published' ? 'Опубликована' : 'Черновик'} · {displayDate(item.updated_at)}</span></Link>)}</div></section></main>
}
