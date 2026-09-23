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

export function categoryBranchIds(categoryId: string, all: Category[]) {
  const ids = new Set([categoryId])
  let changed = true
  while (changed) {
    changed = false
    for (const category of all) {
      if (category.parent_id && ids.has(category.parent_id) && !ids.has(category.id)) {
        ids.add(category.id)
        changed = true
      }
    }
  }
  return ids
}

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
  const sameTopic = all.filter(article => article.id !== current.id && article.category_id === current.category_id)
  if (!parent) return sameTopic.slice(0, 3)
  const parentCategory = all.filter(article => {
    if (article.id === current.id || article.category_id === current.category_id) return false
    const category = cats.find(item => item.id === article.category_id)
    return article.category_id === parent || category?.parent_id === parent
  })
  return [...sameTopic, ...parentCategory].slice(0, 3)
}

function articleText(value: unknown): string {
  if (Array.isArray(value)) return value.map(articleText).join(' ')
  if (!value || typeof value !== 'object') return ''
  const node = value as { text?: unknown; content?: unknown }
  return [typeof node.text === 'string' ? node.text : '', articleText(node.content)].join(' ')
}

export function readingTimeMinutes(content: unknown) {
  const words = articleText(content).match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu)?.length || 0
  return Math.max(1, Math.ceil(words / 180))
}

export const displayReadingTime = (content: unknown) => `${readingTimeMinutes(content)} мин чтения`

export const displayDate = (date: string | null) => date ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' }).format(new Date(date)) : ''
export const displayViews = (count: number) => `${new Intl.NumberFormat('ru-RU').format(count)} ${new Intl.PluralRules('ru-RU').select(count) === 'one' ? 'просмотр' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'просмотра' : 'просмотров'}`
