'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Minus, Undo2, Redo2, Link2, ImagePlus, Trash2 } from 'lucide-react'
import { useState } from 'react'

const BlogImage = Image.extend({
  addAttributes() { return { ...this.parent?.(), caption: { default: null }, mediaId: { default: null } } },
})

export function RichEditor({ initial, onChange, onUpload, onDeleteImage }: { initial: Record<string, unknown>; onChange: (json: Record<string, unknown>) => void; onUpload: (file: File, alt: string, caption: string) => Promise<{ id: string; url: string }>; onDeleteImage: (id: string) => Promise<void> }) {
  const [showUpload, setShowUpload] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [alt, setAlt] = useState('')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const editor = useEditor({ extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), BlogImage], content: initial, immediatelyRender: false, editorProps: { attributes: { class: 'article-body ProseMirror px-5 py-6 sm:px-8' } }, onUpdate: ({ editor }) => onChange(editor.getJSON() as Record<string, unknown>) })
  if (!editor) return <div className="paper p-8">Загружается редактор…</div>
  const imageSelected = editor.isActive('image')
  const image = imageSelected ? editor.getAttributes('image') : null
  const tool = (label: string, icon: React.ReactNode, action: () => void, active = false, disabled = false) => <button key={label} type="button" title={label} aria-label={label} data-active={active} disabled={disabled} onClick={action}>{icon}</button>
  const toggleBoldItalic = () => { const chain = editor.chain().focus(); if (editor.isActive('bold') && editor.isActive('italic')) chain.unsetBold().unsetItalic(); else chain.setBold().setItalic(); chain.run() }
  const editLink = () => { const href = prompt('URL ссылки (https://)', editor.getAttributes('link').href || ''); if (href === null) return; if (!href.trim()) editor.chain().focus().unsetLink().run(); else editor.chain().focus().setLink({ href: href.trim() }).run() }
  async function upload(event: React.FormEvent) {
    event.preventDefault(); if (!file || !alt.trim()) return
    setBusy(true); setError('')
    try { const media = await onUpload(file, alt.trim(), caption.trim()); editor?.chain().focus().insertContent({ type: 'image', attrs: { src: media.url, alt: alt.trim(), caption: caption.trim(), mediaId: media.id } }).run(); setShowUpload(false); setFile(null); setAlt(''); setCaption('') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось загрузить изображение') } finally { setBusy(false) }
  }
  return <div className="paper overflow-hidden"><div className="editor-toolbar" role="toolbar" aria-label="Форматирование статьи">
    {tool('Абзац', <span className="px-1 text-sm font-bold">P</span>, () => editor.chain().focus().setParagraph().run(), editor.isActive('paragraph'))}
    {tool('Заголовок H2', <span className="px-1 text-sm font-bold">H2</span>, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
    {tool('Заголовок H3', <span className="px-1 text-sm font-bold">H3</span>, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
    {tool('Жирный', <Bold size={18}/>, () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
    {tool('Курсив', <Italic size={18}/>, () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
    {tool('Жирный курсив', <span className="px-1 text-sm font-bold italic">BI</span>, toggleBoldItalic, editor.isActive('bold') && editor.isActive('italic'))}
    {tool('Зачёркнутый', <Strikethrough size={18}/>, () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
    {tool('Ссылка', <Link2 size={18}/>, editLink, editor.isActive('link'))}
    {tool('Маркированный список', <List size={18}/>, () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
    {tool('Нумерованный список', <ListOrdered size={18}/>, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
    {tool('Цитата', <Quote size={18}/>, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
    {tool('Разделитель', <Minus size={18}/>, () => editor.chain().focus().setHorizontalRule().run())}
    {tool('Отменить', <Undo2 size={18}/>, () => editor.chain().focus().undo().run(), false, !editor.can().undo())}
    {tool('Повторить', <Redo2 size={18}/>, () => editor.chain().focus().redo().run(), false, !editor.can().redo())}
    {tool('Добавить изображение', <ImagePlus size={18}/>, () => setShowUpload(value => !value))}
  </div><EditorContent editor={editor}/>
    {showUpload && <form onSubmit={upload} className="grid gap-3 border-t border-[#eee7de] bg-[#fffaf6] p-5 sm:grid-cols-2"><div><label className="label" htmlFor="inline-image">Изображение</label><input id="inline-image" type="file" accept="image/jpeg,image/png,image/webp" required onChange={e=>setFile(e.target.files?.[0] || null)}/></div><div><label className="label" htmlFor="inline-alt">Alt — что изображено</label><input id="inline-alt" className="field" required value={alt} onChange={e=>setAlt(e.target.value)}/></div><div><label className="label" htmlFor="inline-caption">Подпись (необязательно)</label><input id="inline-caption" className="field" value={caption} onChange={e=>setCaption(e.target.value)}/></div><button disabled={busy} className="button-primary self-end" type="submit">{busy ? 'Загрузка…' : 'Вставить'}</button>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</form>}
    {imageSelected && <div className="grid gap-3 border-t border-[#eee7de] bg-[#fffaf6] p-5 sm:grid-cols-2"><div><label className="label" htmlFor="selected-alt">Alt изображения</label><input id="selected-alt" className="field" value={image?.alt || ''} onChange={e=>editor.commands.updateAttributes('image', { alt: e.target.value })}/></div><div><label className="label" htmlFor="selected-caption">Подпись</label><input id="selected-caption" className="field" value={image?.caption || ''} onChange={e=>editor.commands.updateAttributes('image', { caption: e.target.value })}/></div><button type="button" className="button-outline w-fit text-red-700" onClick={async()=>{ if (image?.mediaId) await onDeleteImage(image.mediaId); editor.chain().focus().deleteSelection().run() }}><Trash2 size={16}/> Удалить изображение</button></div>}
  </div>
}
