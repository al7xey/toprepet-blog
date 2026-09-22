import type { Article, Category } from './types'

export function categoryPath(category: Category, all: Category[]): Category[] {
  const path = [category]
  const seen = new Set([category.id])
  while (path[0].parent_id) {
    const parent = all.find(c => c.id === path[0].parent_id)
    if (!parent || seen.has(parent.id)) break
    path.unshift(parent)
    seen.add(parent.id)
  }
  return path
}

export const rubricHref = (category: Category, all: Category[]) => `/rubrics/${categoryPath(category, all).map(c => c.slug).join('/')}`

export function resolveCategory(slugs: string[], all: Category[]): Category | null {
  let parent: string | null = null
  let found: Category | undefined
  for (const slug of slugs) {
    found = all.find(c => c.slug === slug && c.parent_id === parent)
    if (!found) return null
    parent = found.id
  }
  return found || null
}

export function relatedArticles(current: Article, all: Article[], cats: Category[]) {
  const parent = cats.find(c => c.id === current.category_id)?.parent_id
  return all.filter(a => a.id !== current.id).sort((a, b) => {
    const rank = (item: Article) => item.category_id === current.category_id ? 0 : item.category_id === parent ? 1 : parent && cats.find(c => c.id === item.category_id)?.parent_id === parent ? 2 : 3
    return rank(a) - rank(b)
  }).slice(0, 3)
}

export const displayDate = (date: string | null) => date ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' }).format(new Date(date)) : ''
export const displayViews = (count: number) => `${new Intl.NumberFormat('ru-RU').format(count)} ${new Intl.PluralRules('ru-RU').select(count) === 'one' ? 'просмотр' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'просмотра' : 'просмотров'}`
