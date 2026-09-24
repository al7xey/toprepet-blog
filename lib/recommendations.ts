import type { ArticleCardData } from './types'

export function normalizeRecommendationIds(currentId: string, values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return [...new Set(values.map(String).filter(id => id && id !== currentId))].slice(0, 3)
}

export function mergeRecommendations(currentId: string, manual: ArticleCardData[], fallback: ArticleCardData[]): ArticleCardData[] {
  const seen = new Set([currentId])
  return [...manual, ...fallback].filter(article => {
    if (seen.has(article.id)) return false
    seen.add(article.id)
    return true
  }).slice(0, 3)
}
