import { serverSupabase } from './supabase'
import type { Article, Category } from './types'

export async function categories(): Promise<Category[]> {
  const db = await serverSupabase()
  if (!db) return []
  const { data } = await db.from('categories').select('*').order('sort_order').order('name')
  return (data || []) as Category[]
}

export async function publishedArticles(): Promise<Article[]> {
  const db = await serverSupabase()
  if (!db) return []
  const { data } = await db.from('articles').select('*').eq('status', 'published').order('published_at', { ascending: false })
  return (data || []) as Article[]
}

export async function publishedArticle(slug: string): Promise<Article | null> {
  const db = await serverSupabase()
  if (!db) return null
  const { data } = await db.from('articles').select('*').eq('slug', slug).eq('status', 'published').maybeSingle()
  return data as Article | null
}
