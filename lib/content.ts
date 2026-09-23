import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
import { transliterate } from 'transliteration'

type Node = { type?: string; text?: string; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[]; content?: Node[] }
export type Heading = { id: string; level: 2 | 3; text: string }
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const safeUrl = (value: unknown) => { try { const url = new URL(String(value)); return ['http:', 'https:'].includes(url.protocol) ? url.href : '' } catch { return '' } }
const imageUrl = (value: unknown) => { const url = safeUrl(value); const host = process.env.NEXT_PUBLIC_SUPABASE_URL; return host && url.startsWith(`${host}/storage/v1/object/public/article-images/`) ? url : '' }
const slug = (text: string) => transliterate(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section'
const textOf = (node: Node): string => node.text || (node.content || []).map(textOf).join('')

export function renderContent(value: unknown): { html: string; headings: Heading[] } {
  const root = value as Node
  if (!root || root.type !== 'doc' || !Array.isArray(root.content)) throw new Error('Некорректная структура статьи')
  const headings: Heading[] = []
  const used = new Map<string, number>()
  let nodes = 0
  const render = (node: Node, depth = 0): string => {
    if (++nodes > 10000 || depth > 32) throw new Error('Статья слишком большая')
    const inner = () => (node.content || []).map(child => render(child, depth + 1)).join('')
    switch (node.type) {
      case 'doc': return inner()
      case 'text': {
        let html = escape(node.text || '')
        for (const mark of node.marks || []) {
          if (mark.type === 'bold') html = `<strong>${html}</strong>`
          if (mark.type === 'italic') html = `<em>${html}</em>`
          if (mark.type === 'strike') html = `<s>${html}</s>`
          if (mark.type === 'link') { const href = safeUrl(mark.attrs?.href); if (href) html = `<a href="${escape(href)}" rel="noopener noreferrer">${html}</a>` }
        }
        return html
      }
      case 'paragraph': return `<p>${inner() || '<br>'}</p>`
      case 'heading': {
        const level = Number(node.attrs?.level)
        if (level !== 2 && level !== 3) return `<p>${inner()}</p>`
        const title = textOf(node)
        const base = slug(title)
        const count = used.get(base) || 0
        used.set(base, count + 1)
        const id = count ? `${base}-${count + 1}` : base
        headings.push({ id, level, text: title })
        return `<h${level} id="${escape(id)}">${inner()}</h${level}>`
      }
      case 'bulletList': return `<ul>${inner()}</ul>`
      case 'orderedList': return `<ol>${inner()}</ol>`
      case 'listItem': return `<li>${inner()}</li>`
      case 'blockquote': return `<blockquote>${inner()}</blockquote>`
      case 'horizontalRule': return '<hr>'
      case 'hardBreak': return '<br>'
      case 'image': {
        const src = imageUrl(node.attrs?.src)
        const alt = String(node.attrs?.alt || '').trim()
        if (!src || !alt) throw new Error('У изображения должны быть адрес и alt')
        const caption = String(node.attrs?.caption || '').trim()
        return `<figure><img src="${escape(src)}" alt="${escape(alt)}" loading="lazy">${caption ? `<figcaption>${escape(caption)}</figcaption>` : ''}</figure>`
      }
      default: return ''
    }
  }
  const html = render(root)
  return { html: sanitizeHtml(html), headings }
}

export function sanitizeHtml(html: string) {
  const window = new JSDOM('').window
  const clean = DOMPurify(window as unknown as Parameters<typeof DOMPurify>[0]).sanitize(html, {
    ALLOWED_TAGS: ['p','br','strong','em','s','a','h2','h3','ul','ol','li','blockquote','hr','figure','img','figcaption'],
    ALLOWED_ATTR: ['href','rel','id','src','alt','loading'],
  })
  window.close()
  return clean
}

export function headingsFromHtml(html: string): Heading[] {
  const window = new JSDOM(html).window
  const headings = [...window.document.querySelectorAll('h2[id], h3[id]')].map(node => ({ id: node.id, level: node.tagName === 'H2' ? 2 as const : 3 as const, text: node.textContent || '' }))
  window.close()
  return headings
}

export function imageMetadata(value: unknown) {
  const images: { id: string; alt: string; caption: string | null }[] = []
  const visit = (node: Node) => {
    const mediaId = String(node.attrs?.mediaId || '')
    if (node.type === 'image' && isUuid(mediaId)) images.push({ id: mediaId, alt: String(node.attrs?.alt || '').trim(), caption: String(node.attrs?.caption || '').trim() || null })
    for (const child of node.content || []) visit(child)
  }
  visit(value as Node)
  return images
}
