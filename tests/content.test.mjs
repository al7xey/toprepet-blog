import test from 'node:test'
import assert from 'node:assert/strict'
import { renderContent, sanitizeHtml, headingsFromHtml, articlePlainText, suggestedExcerpt } from '../lib/content.ts'
import { categoryBranchIds, categoryPath, readingTimeMinutes, resolveCategory, relatedArticles } from '../lib/data.ts'

test('article HTML has stable H2/H3 anchors and safe text', () => {
  const { html, headings } = renderContent({ type: 'doc', content: [
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
})

test('raw scripts and unsafe links never survive', () => {
  assert.ok(!sanitizeHtml('<script>alert(1)</script><p onclick="x()">Text</p>').includes('<script'))
  const { html } = renderContent({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }] })
  assert.ok(!html.includes('href='))
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
