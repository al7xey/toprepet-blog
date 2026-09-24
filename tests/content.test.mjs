import test from 'node:test'
import assert from 'node:assert/strict'
import { renderContent, sanitizeHtml, headingsFromHtml, articlePlainText, suggestedExcerpt } from '../lib/content.ts'
import { categoryBranchIds, categoryPath, displayDate, readingTimeMinutes, resolveCategory, relatedArticles, slugRedirectTarget } from '../lib/data.ts'
import { mergeRecommendations, normalizeRecommendationIds } from '../lib/recommendations.ts'

test('article HTML has stable H2/H3 anchors and safe text', () => {
  const { html, headings } = renderContent({ type: 'doc', content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Внутренний H1' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Тема & практика' }] },
    { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Типичные ошибки' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Тема & практика' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '<script>alert(1)</script>' }] },
  ] })
  assert.equal(headings.length, 3)
  assert.equal(headings[2].id, `${headings[0].id}-2`)
  assert.deepEqual(headingsFromHtml(html), headings)
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes('<h1 id="vnutrenniy-h1">'))
})

test('raw scripts and unsafe links never survive', () => {
  assert.ok(!sanitizeHtml('<script>alert(1)</script><p onclick="x()">Text</p>').includes('<script'))
  const { html } = renderContent({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }] })
  assert.ok(!html.includes('href='))
})

test('tables survive rendering while unsafe table attributes are removed', () => {
  const { html } = renderContent({ type: 'doc', content: [{ type: 'table', content: [
    { type: 'tableRow', content: [{ type: 'tableHeader', attrs: { colspan: 2 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Заголовок' }] }] }] },
    { type: 'tableRow', content: [{ type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'А' }] }] }, { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Б' }] }] }] },
  ] }] })
  assert.match(html, /<div class="article-table-scroll"><table><thead>/)
  assert.match(html, /<th colspan="2" scope="col">/)
  const cleaned = sanitizeHtml('<table onclick="bad()"><tbody><tr><td colspan="2" style="color:red">Да</td></tr></tbody></table><script>bad()</script>')
  assert.match(cleaned, /<td colspan="2">Да<\/td>/)
  assert.ok(!cleaned.includes('onclick'))
  assert.ok(!cleaned.includes('style='))
  assert.ok(!cleaned.includes('<script'))
})

test('manual recommendations keep order and fallback never duplicates', () => {
  const article = id => ({ id })
  assert.deepEqual(normalizeRecommendationIds('current', ['a', 'a', 'current', 'b', 'c', 'd']), ['a', 'b', 'c'])
  assert.deepEqual(mergeRecommendations('current', [article('b'), article('a')], [article('a'), article('current'), article('c'), article('d')]).map(item => item.id), ['b', 'a', 'c'])
})

test('an excerpt can be suggested from formatted article text', () => {
  const doc = { type: 'doc', content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Подготовка ' }, { type: 'text', text: 'к ОГЭ', marks: [{ type: 'bold' }] }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Начните с простых заданий и постепенно переходите к сложным.' }] },
  ] }
  assert.equal(articlePlainText(doc), 'Подготовка к ОГЭ Начните с простых заданий и постепенно переходите к сложным.')
  assert.equal(suggestedExcerpt(doc, 32), 'Подготовка к ОГЭ Начните с…')
  assert.equal(articlePlainText({ type: 'doc', content: [{ type: 'paragraph' }] }), '')
})

test('nested rubric resolves only along the complete parent path', () => {
  const all = [
    { id: 'a', slug: 'ege', parent_id: null },
    { id: 'b', slug: 'informatika', parent_id: 'a' },
    { id: 'c', slug: 'zadanie-12', parent_id: 'b' },
  ]
  assert.equal(resolveCategory(['ege', 'informatika', 'zadanie-12'], all)?.id, 'c')
  assert.equal(resolveCategory(['informatika', 'zadanie-12'], all), null)
  assert.deepEqual(categoryPath(all[2], all).map(item => item.slug), ['ege', 'informatika', 'zadanie-12'])
  assert.deepEqual([...categoryBranchIds('a', all)], ['a', 'b', 'c'])
})

test('related articles prefer same topic then parent', () => {
  const cats = [{ id: 'root', parent_id: null }, { id: 'topic', parent_id: 'root' }, { id: 'sibling', parent_id: 'root' }, { id: 'other', parent_id: null }]
  const current = { id: 'current', category_id: 'topic' }
  const all = [current, { id: 'other', category_id: 'other' }, { id: 'parent', category_id: 'root' }, { id: 'sibling', category_id: 'sibling' }, { id: 'same', category_id: 'topic' }]
  assert.deepEqual(relatedArticles(current, all, cats).map(article => article.id), ['same', 'parent', 'sibling'])
})

test('reading time uses the Tiptap text and never returns zero', () => {
  assert.equal(readingTimeMinutes({ type: 'doc', content: [] }), 1)
  const words = Array.from({ length: 181 }, (_, index) => `слово${index}`).join(' ')
  assert.equal(readingTimeMinutes({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: words }] }] }), 2)
})

test('unsupported editor nodes are rejected instead of silently disappearing', () => {
  assert.throws(() => renderContent({ type: 'doc', content: [{ type: 'codeBlock', content: [{ type: 'text', text: 'unsafe' }] }] }), /Unsupported node/)
})

test('images keep accessible metadata and intrinsic dimensions', () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  const { html } = renderContent({ type: 'doc', content: [{ type: 'image', attrs: { src: 'https://example.supabase.co/storage/v1/object/public/article-images/articles/a/image.webp', alt: 'Схема', caption: 'Подпись', mediaId: '123e4567-e89b-42d3-a456-426614174000', width: 1200, height: 800, displaySize: 'wide', alignment: 'right' } }] })
  assert.match(html, /width="1200" height="800" loading="lazy" decoding="async"/)
  assert.match(html, /<figcaption>Подпись<\/figcaption>/)
  assert.match(html, /class="article-image article-image--wide article-image--right"/)
})

test('slug redirect lookup accepts Supabase object and array joins', () => {
  assert.equal(slugRedirectTarget({ articles: { slug: 'new-address' } }), 'new-address')
  assert.equal(slugRedirectTarget({ articles: [{ slug: 'new-address' }] }), 'new-address')
  assert.equal(slugRedirectTarget(null), null)
})

test('editorial dates use the stable Russian display format', () => {
  assert.equal(displayDate('2026-09-25T10:00:00.000Z'), '25 сентября 2026 г.')
  assert.equal(displayDate(null), '')
})
