import { cacheLife, cacheTag } from 'next/cache'
import { publicSupabase } from './supabase'
import type { ArticleCardData, ArticleDetail, ArticleSitemapData, Category, Paginated } from './types'
import { readingTimeMinutes, slugRedirectTarget } from './data'
import { headingsFromHtml } from './content'

const CATEGORY_FIELDS = 'id,name,slug,parent_id,description,sort_order,created_at,updated_at'
const CARD_FIELDS = 'id,title,slug,excerpt,cover_image_url,cover_image_alt,category_id,author_name,published_at,modified_at,view_count,reading_time_minutes'
const DETAIL_FIELDS = `${CARD_FIELDS},content_json,content_html,toc_json,seo_title,seo_description,status,created_at,updated_at`

function pageResult<T>(items: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) }
}

export async function categories(): Promise<Category[]> {
  'use cache'
  cacheLife('minutes')
  cacheTag('categories')
  const db = publicSupabase()
  if (!db) return []
  const { data, error } = await db.from('categories').select(CATEGORY_FIELDS).order('sort_order').order('name')
  if (error) throw new Error(`Не удалось загрузить рубрики: ${error.message}`)
  return (data || []) as Category[]
}

export async function articleCards(page = 1, pageSize = 8, mode: 'fresh' | 'popular' = 'fresh', categoryIds?: string[]): Promise<Paginated<ArticleCardData>> {
  'use cache'
  cacheLife('minutes')
  cacheTag('articles')
  const safePage = Math.max(1, page)
  const safeSize = Math.min(24, Math.max(1, pageSize))
  const db = publicSupabase()
  if (!db) return pageResult([], 0, safePage, safeSize)
  let query = db.from('articles').select(CARD_FIELDS, { count: 'exact' }).eq('status', 'published')
  if (categoryIds?.length) query = query.in('category_id', categoryIds)
  query = mode === 'popular'
    ? query.order('view_count', { ascending: false }).order('published_at', { ascending: false })
    : query.order('published_at', { ascending: false })
  const from = (safePage - 1) * safeSize
  const { data, count, error } = await query.range(from, from + safeSize - 1)
  if (error?.message.includes('reading_time_minutes')) {
    let fallback = db.from('articles').select(CARD_FIELDS.replace(',reading_time_minutes', ''), { count: 'exact' }).eq('status', 'published')
    if (categoryIds?.length) fallback = fallback.in('category_id', categoryIds)
    fallback = mode === 'popular' ? fallback.order('view_count', { ascending: false }).order('published_at', { ascending: false }) : fallback.order('published_at', { ascending: false })
    const result = await fallback.range(from, from + safeSize - 1)
    if (!result.error) return pageResult(((result.data || []) as unknown as Omit<ArticleCardData, 'reading_time_minutes'>[]).map(item => ({ ...item, reading_time_minutes: 1 })), result.count || 0, safePage, safeSize)
  }
  if (error) throw new Error(`Не удалось загрузить статьи: ${error.message}`)
  return pageResult((data || []) as ArticleCardData[], count || 0, safePage, safeSize)
}

export async function publishedArticle(slug: string): Promise<ArticleDetail | null> {
  'use cache'
  cacheLife('minutes')
  cacheTag('articles', `article:${slug}`)
  const db = publicSupabase()
  if (!db) return null
  const { data, error } = await db.from('articles').select(DETAIL_FIELDS).eq('slug', slug).eq('status', 'published').maybeSingle()
  if (error?.message.includes('reading_time_minutes') || error?.message.includes('toc_json')) {
    const legacyFields = DETAIL_FIELDS.replace(',toc_json', '').replace(',reading_time_minutes', '')
    const legacy = await db.from('articles').select(legacyFields).eq('slug', slug).eq('status', 'published').maybeSingle()
    if (!legacy.error && legacy.data) {
      const value = legacy.data as unknown as Omit<ArticleDetail, 'reading_time_minutes' | 'toc_json'>
      return { ...value, reading_time_minutes: readingTimeMinutes(value.content_json), toc_json: headingsFromHtml(value.content_html) }
    }
    if (!legacy.error) return null
  }
  if (error) throw new Error(`Не удалось загрузить статью: ${error.message}`)
  return data as ArticleDetail | null
}

export async function relatedArticleCards(currentId: string, categoryIds: string[], limit = 3, excludeIds: string[] = []): Promise<ArticleCardData[]> {
  'use cache'
  cacheLife('minutes')
  cacheTag('articles')
  const db = publicSupabase()
  if (!db || !categoryIds.length) return []
  let query = db.from('articles').select(CARD_FIELDS).eq('status', 'published').in('category_id', categoryIds).neq('id', currentId)
  if (excludeIds.length) query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  const { data, error } = await query.order('published_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`Не удалось загрузить связанные статьи: ${error.message}`)
  return (data || []) as ArticleCardData[]
}

export async function manualRecommendationCards(articleId: string): Promise<ArticleCardData[]> {
  'use cache'
  cacheLife('minutes')
  cacheTag('articles')
  const db = publicSupabase()
  if (!db) return []
  const { data: rows, error } = await db.from('article_recommendations').select('recommended_article_id,sort_order').eq('article_id', articleId).order('sort_order')
  if (error || !rows?.length) return []
  const ids = rows.map(row => row.recommended_article_id)
  const { data, error: articlesError } = await db.from('articles').select(CARD_FIELDS).eq('status', 'published').in('id', ids)
  if (articlesError) throw new Error(`Не удалось загрузить рекомендации: ${articlesError.message}`)
  const byId = new Map(((data || []) as ArticleCardData[]).map(article => [article.id, article]))
  return ids.map(id => byId.get(id)).filter((article): article is ArticleCardData => Boolean(article))
}

export async function sitemapArticles(): Promise<ArticleSitemapData[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('articles', 'sitemap')
  const db = publicSupabase()
  if (!db) return []
  const { data, error } = await db.from('articles').select('slug,published_at,modified_at,updated_at').eq('status', 'published').order('published_at', { ascending: false })
  if (error) throw new Error(`Не удалось собрать sitemap: ${error.message}`)
  return (data || []) as ArticleSitemapData[]
}

export async function articleSlugRedirect(slug: string): Promise<string | null> {
  'use cache'
  cacheLife('hours')
  cacheTag('article-redirects')
  const db = publicSupabase()
  if (!db) return null
  const { data, error } = await db.from('article_slug_redirects').select('articles!inner(slug,status)').eq('old_slug', slug).eq('articles.status', 'published').maybeSingle()
  if (error) return null
  return slugRedirectTarget(data)
}

export async function publishedCategoryIds(): Promise<Set<string>> {
  'use cache'
  cacheLife('minutes')
  cacheTag('articles', 'categories')
  const db = publicSupabase()
  if (!db) return new Set()
  const { data, error } = await db.rpc('published_category_ids')
  if (!error) return new Set((data || []).map((row: { id: string }) => row.id))
  // Transitional fallback while the new migration is still pending.
  const [all, first] = await Promise.all([categories(), articleCards(1, 24, 'fresh')])
  const publicIds = new Set<string>()
  for (const article of first.items) {
    let current = all.find(category => category.id === article.category_id)
    while (current && !publicIds.has(current.id)) { publicIds.add(current.id); current = current.parent_id ? all.find(category => category.id === current!.parent_id) : undefined }
  }
  return publicIds
}
