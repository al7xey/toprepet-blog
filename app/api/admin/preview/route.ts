import { NextRequest, NextResponse } from 'next/server'
import { authorizeMutation, errorJson } from '@/lib/admin-api'
import { renderContent } from '@/lib/content'

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export async function POST(request: NextRequest) {
  const auth = await authorizeMutation(request)
  if ('error' in auth) return auth.error
  const body = await request.json()
  let html
  try { html = renderContent(body.content_json).html } catch { return errorJson('Некорректный текст статьи') }
  const title = escape(String(body.title || 'Без названия'))
  const excerpt = escape(String(body.excerpt || ''))
  const page = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Предпросмотр — ${title}</title><style>body{margin:0;background:#faf7f2;color:#182331;font-family:Arial,sans-serif}main{max-width:800px;margin:0 auto;padding:40px 20px 100px}h1{font-size:clamp(2.5rem,6vw,4rem);line-height:1.1}p.lead{font-size:1.25rem;color:#586575;line-height:1.65}.banner{padding:14px 18px;border-radius:12px;background:#fff0e5;color:#b54b1c}.article-body{font-size:1.125rem;line-height:1.85;overflow-wrap:anywhere}.article-body h2{font-size:1.75rem;margin-top:2em}.article-body h3{font-size:1.35rem;margin-top:1.7em}.article-body a{color:#d95822}.article-body img{max-width:100%;height:auto;border-radius:18px}.article-body figcaption{text-align:center;color:#687482;font-size:.85rem}.article-body blockquote{border-left:4px solid #f46b32;padding-left:1em}.article-body li{margin:.4em 0}</style></head><body><main><div class="banner">Предпросмотр · изменения ещё не опубликованы</div><h1>${title}</h1><p class="lead">${excerpt}</p><div class="article-body">${html}</div></main></body></html>`
  return new NextResponse(page, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } })
}
