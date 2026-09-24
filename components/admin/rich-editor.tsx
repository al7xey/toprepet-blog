'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import { Bold, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Quote, Strikethrough, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'

const ArticleImage = TiptapImage.extend({
  addAttributes() {
    return { ...this.parent?.(), caption: { default: null }, mediaId: { default: null }, width: { default: null }, height: { default: null } }
  },
})

type Uploaded = { id: string; url: string; width: number; height: number }
type Props = {
  initial: Record<string, unknown>
  articleId?: string
  onChange: (json: Record<string, unknown>) => void
  onUpload: (file: File, alt: string, caption: string) => Promise<Uploaded>
  onDeleteImage: (id: string) => Promise<void>
}

export function RichEditor({ initial, onChange, onUpload, onDeleteImage }: Props) {
  const [showImageForm, setShowImageForm] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [alt, setAlt] = useState('')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const chooseImage = useCallback((image: File) => { setFile(image); setShowImageForm(true); setError('') }, [])

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, code: false, codeBlock: false }), ArticleImage.configure({ inline: false, allowBase64: false })],
    content: initial,
    immediatelyRender: true,
    autofocus: false,
    editorProps: {
      attributes: { class: 'article-body simple-editor-content', role: 'textbox', 'aria-label': 'Текст статьи' },
      handleDrop: (_view, event) => { const image = [...(event.dataTransfer?.files || [])].find(item => item.type.startsWith('image/')); if (!image) return false; event.preventDefault(); chooseImage(image); return true },
      handlePaste: (_view, event) => { const image = [...(event.clipboardData?.files || [])].find(item => item.type.startsWith('image/')); if (!image) return false; event.preventDefault(); chooseImage(image); return true },
    },
    onUpdate: ({ editor: current }) => onChange(current.getJSON() as Record<string, unknown>),
  })

  if (!editor) return <div className="paper simple-editor-loading">Подготавливаем редактор…</div>
  const selectedImage = editor.isActive('image') ? editor.getAttributes('image') : null
  const block = editor.isActive('heading', { level: 2 }) ? 'h2' : editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'
  const command = (label: string, run: () => void, active = false, disabled = false, icon?: React.ReactNode) => <button type="button" aria-label={label} title={label} data-active={active} disabled={disabled} onClick={run}>{icon || label}</button>
  const editLink = () => { const value = window.prompt('Адрес ссылки', editor.getAttributes('link').href || ''); if (value === null) return; if (!value.trim()) editor.chain().focus().unsetLink().run(); else editor.chain().focus().setLink({ href: value.trim() }).run() }

  async function uploadImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!file || !alt.trim()) return
    setBusy(true); setError('')
    try {
      const image = await onUpload(file, alt.trim(), caption.trim())
      editor.chain().focus().setImage({ src: image.url, alt: alt.trim(), title: caption.trim() || null }).updateAttributes('image', { mediaId: image.id, caption: caption.trim() || null, width: image.width, height: image.height }).run()
      setFile(null); setAlt(''); setCaption(''); setShowImageForm(false)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось загрузить изображение') }
    finally { setBusy(false) }
  }

  return <div className="paper simple-editor">
    <div className="simple-editor-toolbar" role="toolbar" aria-label="Форматирование статьи">
      <select aria-label="Стиль текста" value={block} onChange={event => { if (event.target.value === 'h2') editor.chain().focus().setHeading({ level: 2 }).run(); else if (event.target.value === 'h3') editor.chain().focus().setHeading({ level: 3 }).run(); else editor.chain().focus().setParagraph().run() }}><option value="p">Текст</option><option value="h2">Заголовок H2</option><option value="h3">Заголовок H3</option></select>
      {command('Жирный', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), false, <Bold size={18}/>)}
      {command('Курсив', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), false, <Italic size={18}/>)}
      {command('Зачёркнутый', () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'), false, <Strikethrough size={18}/>)}
      {command('Ссылка', editLink, editor.isActive('link'), false, <Link2 size={18}/>)}
      {command('Список', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'), false, <List size={18}/>)}
      {command('Нумерованный список', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), false, <ListOrdered size={18}/>)}
      {command('Цитата', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'), false, <Quote size={18}/>)}
      {command('Разделитель', () => editor.chain().focus().setHorizontalRule().run(), false, false, <Minus size={18}/>)}
      {command('Изображение', () => setShowImageForm(value => !value), showImageForm, false, <ImagePlus size={18}/>)}
      {command('Отменить', () => editor.chain().focus().undo().run(), false, !editor.can().undo())}
      {command('Повторить', () => editor.chain().focus().redo().run(), false, !editor.can().redo())}
    </div>
    <div className="simple-editor-area" onClick={() => editor.chain().focus().run()}><EditorContent editor={editor}/></div>
    {showImageForm && <form className="simple-editor-image-form" onSubmit={uploadImage}>
      <div><label className="label" htmlFor="editor-image-file">Изображение</label><input id="editor-image-file" type="file" accept="image/jpeg,image/png,image/webp" required onChange={event => setFile(event.target.files?.[0] || null)}/></div>
      <div><label className="label" htmlFor="editor-image-alt">Что изображено</label><input id="editor-image-alt" className="field" value={alt} required maxLength={300} onChange={event => setAlt(event.target.value)}/></div>
      <div><label className="label" htmlFor="editor-image-caption">Подпись</label><input id="editor-image-caption" className="field" value={caption} maxLength={400} onChange={event => setCaption(event.target.value)}/></div>
      <button type="submit" className="button-primary" disabled={busy}>{busy ? 'Загружаем…' : 'Добавить изображение'}</button>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </form>}
    {selectedImage && <div className="simple-editor-image-settings">
      <div><label className="label" htmlFor="editor-selected-alt">Alt изображения</label><input id="editor-selected-alt" className="field" value={selectedImage.alt || ''} onChange={event => editor.commands.updateAttributes('image', { alt: event.target.value })}/></div>
      <div><label className="label" htmlFor="editor-selected-caption">Подпись</label><input id="editor-selected-caption" className="field" value={selectedImage.caption || ''} onChange={event => editor.commands.updateAttributes('image', { caption: event.target.value, title: event.target.value || null })}/></div>
      <button type="button" className="button-outline text-red-700" onClick={async () => { if (selectedImage.mediaId) await onDeleteImage(selectedImage.mediaId); editor.chain().focus().deleteSelection().run() }}><Trash2 size={17}/>Удалить изображение</button>
    </div>}
  </div>
}
