import type { AppData, BackupFile, BackupPhoto, PhotoRecord } from '@/types'
import { loadPhoto, savePhoto } from './db'
import { blobToDataUrl, dataUrlToBlob } from './image'
import { uid } from './id'
import { findCategory } from './categories'
import { formatDateShort } from './date'

export async function buildBackup(data: AppData): Promise<BackupFile> {
  const photos: Record<string, BackupPhoto> = {}
  const photoIds = [...new Set(data.deposits.map((deposit) => deposit.photoId).filter(Boolean))]
  for (const photoId of photoIds) {
    if (!photoId) continue
    const record = await loadPhoto(photoId)
    if (!record) continue
    try {
      photos[photoId] = {
        meta: {
          mimeType: record.mimeType,
          size: record.size,
          width: record.width,
          height: record.height,
        },
        dataUrl: await blobToDataUrl(record.blob),
      }
    } catch {
      // A single unreadable photo must not block the rest of the backup.
    }
  }
  return {
    app: 'tabungin',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
    photos,
  }
}

export async function restoreBackupPhotos(
  rawPhotos: unknown,
  validPhotoIds: string[],
): Promise<number> {
  if (typeof rawPhotos !== 'object' || rawPhotos === null) return 0
  const source = rawPhotos as Record<string, unknown>
  let restored = 0
  for (const photoId of validPhotoIds) {
    const entry = source[photoId]
    if (typeof entry !== 'object' || entry === null) continue
    const candidate = entry as Partial<BackupPhoto>
    if (typeof candidate.dataUrl !== 'string' || !candidate.dataUrl.startsWith('data:image/')) continue
    try {
      const blob = await dataUrlToBlob(candidate.dataUrl)
      if (blob.size > 8 * 1024 * 1024) continue
      const record: PhotoRecord = {
        id: photoId,
        blob,
        mimeType: candidate.meta?.mimeType ?? blob.type ?? 'image/jpeg',
        width: candidate.meta?.width ?? 0,
        height: candidate.meta?.height ?? 0,
        size: blob.size,
        createdAt: new Date().toISOString(),
      }
      await savePhoto(record)
      restored += 1
    } catch {
      // Skip corrupt photos, import the rest of the data.
    }
  }
  return restored
}

export async function storeImportedPhotoFile(file: File): Promise<PhotoRecord> {
  const { prepareImage, createPhotoRecord } = await import('./image')
  const prepared = await prepareImage(file)
  return createPhotoRecord(prepared)
}

export function transactionsToCsv(data: AppData): string {
  const walletMap = new Map(data.wallets.map((wallet) => [wallet.id, wallet.name]))
  const header = ['Tanggal', 'Jenis', 'Kategori', 'Nominal', 'Dompet', 'Catatan']
  const rows = [...data.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((transaction) => [
      transaction.date,
      transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      transaction.category,
      String(transaction.amount),
      walletMap.get(transaction.walletId) ?? 'Dompet terhapus',
      transaction.note,
    ])
  return `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`
}

export function depositsToCsv(data: AppData): string {
  const targetMap = new Map(data.targets.map((target) => [target.id, target.name]))
  const walletMap = new Map(data.wallets.map((wallet) => [wallet.id, wallet.name]))
  const header = ['Tanggal', 'Nominal', 'Target', 'Dompet', 'Catatan', 'Status Bukti']
  const rows = [...data.deposits]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((deposit) => [
      formatDateShort(deposit.date),
      String(deposit.amount),
      deposit.targetId ? (targetMap.get(deposit.targetId) ?? 'Tabungan umum') : 'Tabungan umum',
      walletMap.get(deposit.walletId) ?? 'Dompet terhapus',
      deposit.note,
      deposit.photoId ? 'Foto tersimpan' : 'Tanpa foto',
    ])
  return `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`
}

function csvCell(value: string): string {
  const safe = value.replace(/"/g, '""')
  return `"${safe}"`
}

export function downloadFile(filename: string, content: BlobPart, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function backupFilename(): string {
  return `tabungin-backup-${new Date().toISOString().slice(0, 10)}.json`
}

export function csvFilename(prefix: string): string {
  return `tabungin-${prefix}-${new Date().toISOString().slice(0, 10)}.csv`
}

/** A photo imported from an untrusted backup still receives a fresh id if needed. */
export function freshPhotoId(): string {
  return uid('img')
}

export function categoryLabel(category: string): string {
  return findCategory(category).name
}
