import { notFound } from 'next/navigation'
import { ArticleForm } from '@/components/admin/article-form'
import { requireAdmin } from '@/lib/auth'
import { categories } from '@/lib/data-server'
import type { Article } from '@/lib/types'
export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const { supabase } = await requireAdmin(); const [{ data }, rubrics] = await Promise.all([supabase.from('articles').select('*').eq('id', id).maybeSingle(), categories()]); if (!data) notFound(); return <ArticleForm article={data as Article} categories={rubrics}/> }
