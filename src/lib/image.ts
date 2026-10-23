import type { PhotoMeta, PhotoRecord } from '@/types'
import { uid } from './id'

const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024
const MAX_DIMENSION = 1400

export interface PreparedImage {
  blob: Blob
  mimeType: string
  width: number
  height: number
  size: number
  originalName: string
  originalSize: number
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Format foto tidak dapat dibaca browser ini.'))
    }
    image.src = url
  })
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Pilih berkas foto dengan format gambar.')
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error('Foto terlalu besar. Maksimum 25 MB sebelum dikompres.')
  }

  const image = await loadImage(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Browser tidak mendukung pemrosesan foto.')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result)
        else reject(new Error('Foto gagal dikompres. Coba foto lain.'))
      },
      'image/jpeg',
      0.8,
    )
  })

  return {
    blob,
    mimeType: 'image/jpeg',
    width,
    height,
    size: blob.size,
    originalName: file.name,
    originalSize: file.size,
  }
}

export async function createPhotoRecord(prepared: PreparedImage): Promise<PhotoRecord> {
  const record: PhotoRecord = {
    id: uid('img'),
    blob: prepared.blob,
    mimeType: prepared.mimeType,
    width: prepared.width,
    height: prepared.height,
    size: prepared.size,
    createdAt: new Date().toISOString(),
  }
  const { savePhoto } = await import('./db')
  await savePhoto(record)
  return record
}

export function photoMetaFromRecord(record: PhotoRecord, originalName?: string): PhotoMeta {
  return {
    mimeType: record.mimeType,
    size: record.size,
    width: record.width,
    height: record.height,
    originalName,
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Foto gagal dibaca untuk ekspor.'))
    reader.readAsDataURL(blob)
  })
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}

/** Generates a soft demo receipt so the first-run experience shows real photo storage. */
export async function createDemoReceipt(options: {
  amount: number
  target: string
  dateLabel: string
  variant: number
}): Promise<{ blob: Blob; width: number; height: number }> {
  const width = 900
  const height = 640
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas tidak tersedia.')

  const palettes = [
    ['#F3F1E4', '#5F8563', '#2F4132'],
    ['#FBF1D9', '#B88A3D', '#3C4D3B'],
    ['#EAF3E5', '#5B9563', '#285037'],
  ]
  const [background = '#F3F1E4', accent = '#5F8563', ink = '#2F4132'] =
    palettes[options.variant % palettes.length] ?? []

  context.fillStyle = background
  context.fillRect(0, 0, width, height)

  context.fillStyle = 'rgba(255,255,255,0.45)'
  context.beginPath()
  context.arc(90, 80, 160, 0, Math.PI * 2)
  context.fill()
  context.beginPath()
  context.arc(860, 620, 220, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#FFFFFF'
  context.shadowColor = 'rgba(47,65,50,0.12)'
  context.shadowBlur = 34
  context.shadowOffsetY = 16
  roundRect(context, 110, 70, 680, 500, 32)
  context.fill()
  context.shadowColor = 'transparent'
  context.shadowBlur = 0
  context.shadowOffsetY = 0

  context.fillStyle = accent
  context.beginPath()
  context.arc(175, 150, 30, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#FFFFFF'
  context.font = '700 26px sans-serif'
  context.textAlign = 'center'
  context.fillText('T', 175, 160)

  context.textAlign = 'left'
  context.fillStyle = ink
  context.font = '800 25px sans-serif'
  context.fillText('TABUNGIN', 220, 145)
  context.fillStyle = '#7F8D7B'
  context.font = '500 15px sans-serif'
  context.fillText('BUKTI SETORAN · CELENGAN IMPIANMU', 220, 172)

  context.strokeStyle = '#E7E3D3'
  context.lineWidth = 2
  context.beginPath()
  context.setLineDash([8, 8])
  context.moveTo(155, 215)
  context.lineTo(745, 215)
  context.stroke()
  context.setLineDash([])

  context.fillStyle = '#7F8D7B'
  context.font = '600 17px sans-serif'
  context.fillText('NOMINAL SETORAN', 155, 270)
  context.fillStyle = ink
  context.font = '800 54px sans-serif'
  context.fillText(
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(options.amount),
    155,
    330,
  )

  context.fillStyle = '#7F8D7B'
  context.font = '600 17px sans-serif'
  context.fillText('TUJUAN', 155, 390)
  context.fillStyle = ink
  context.font = '700 24px sans-serif'
  context.fillText(options.target, 155, 422)

  context.fillStyle = '#7F8D7B'
  context.font = '600 17px sans-serif'
  context.fillText('TANGGAL', 155, 472)
  context.fillStyle = ink
  context.font = '700 22px sans-serif'
  context.fillText(options.dateLabel, 155, 502)

  context.fillStyle = accent
  context.font = '600 15px sans-serif'
  context.fillText('Contoh data demo — bisa dihapus kapan saja', 155, 540)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Gagal membuat foto demo.'))),
      'image/jpeg',
      0.82,
    )
  })
  return { blob, width, height }
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
}
