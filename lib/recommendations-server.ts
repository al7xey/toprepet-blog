import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeRecommendationIds } from './recommendations'

export async function syncRecommendations(db: SupabaseClient, articleId: string, values: unknown) {
  const ids = normalizeRecommendationIds(articleId, values)
  if (ids.length) {
    const { data, error } = await db.from('articles').select('id').in('id', ids).eq('status', 'published')
    if (error) throw new Error(error.message)
    if ((data || []).length !== ids.length) throw new Error('Для рекомендаций доступны только опубликованные статьи')
  }
  const { error: deleteError } = await db.from('article_recommendations').delete().eq('article_id', articleId)
  if (deleteError) throw new Error(deleteError.message)
  if (!ids.length) return
  const { error } = await db.from('article_recommendations').insert(ids.map((recommended_article_id, sort_order) => ({ article_id: articleId, recommended_article_id, sort_order })))
  if (error) throw new Error(error.message)
}
