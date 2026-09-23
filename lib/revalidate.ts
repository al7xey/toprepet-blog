import { revalidatePath, revalidateTag } from 'next/cache'

export function revalidateEditorialContent(slugs: string[] = []) {
  revalidateTag('articles', { expire: 0 })
  revalidateTag('categories', { expire: 0 })
  revalidateTag('article-redirects', { expire: 0 })
  revalidateTag('sitemap', { expire: 0 })
  revalidatePath('/')
  revalidatePath('/rubrics/[...slug]', 'page')
  revalidatePath('/sitemap.xml')
  for (const slug of slugs.filter(Boolean)) revalidatePath(`/articles/${slug}`)
}
