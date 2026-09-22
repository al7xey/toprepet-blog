'use client'
import imageCompression from 'browser-image-compression'

const accepted = ['image/jpeg', 'image/png', 'image/webp']
export async function compressImage(file: File, cover = false) {
  if (!accepted.includes(file.type)) throw new Error('Поддерживаются JPG, PNG и WebP')
  if (file.size > 10 * 1024 * 1024) throw new Error('Исходный файл больше 10 МБ')
  let compressed = await imageCompression(file, { maxWidthOrHeight: 1600, maxSizeMB: .43, initialQuality: .82, fileType: 'image/webp', useWebWorker: true, preserveExif: false })
  const bitmap = await createImageBitmap(compressed)
  let width = bitmap.width, height = bitmap.height
  if (cover && height > 900) {
    const scale = 900 / height
    width = Math.round(width * scale); height = 900
  }
  if (compressed.size > 450 * 1024 || (cover && bitmap.height > 900)) {
    const canvas = document.createElement('canvas')
    for (let i = 0; i < 5; i++) {
      canvas.width = width; canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Не удалось обработать изображение')
      context.drawImage(bitmap, 0, 0, width, height)
      const quality = Math.max(.62, .8 - i * .05)
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Не удалось сжать изображение')), 'image/webp', quality))
      compressed = new File([blob], 'image.webp', { type: 'image/webp' })
      if (compressed.size <= 450 * 1024) break
      width = Math.round(width * .88); height = Math.round(height * .88)
    }
  }
  bitmap.close()
  if (compressed.size > 450 * 1024) throw new Error('Изображение слишком большое после сжатия')
  const finalBitmap = await createImageBitmap(compressed)
  const result = { file: new File([compressed], 'image.webp', { type: 'image/webp' }), width: finalBitmap.width, height: finalBitmap.height }
  finalBitmap.close()
  return result
}
