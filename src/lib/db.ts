import type { AppData, PhotoRecord } from '@/types'

const DB_NAME = 'savezy-db'
const DB_VERSION = 1
const KV_STORE = 'kv'
const PHOTO_STORE = 'photos'
const DATA_KEY = 'app-data'
const LOCAL_KEY = 'savezy:data-backup'

let dbPromise: Promise<IDBDatabase> | null = null

export function indexedDbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null
  } catch {
    return false
  }
}

function openDatabase(): Promise<IDBDatabase> {
  if (!indexedDbAvailable()) {
    return Promise.reject(new Error('IndexedDB tidak tersedia pada browser ini.'))
  }
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(KV_STORE)) {
        database.createObjectStore(KV_STORE)
      }
      if (!database.objectStoreNames.contains(PHOTO_STORE)) {
        database.createObjectStore(PHOTO_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      dbPromise = null
      reject(request.error ?? new Error('Gagal membuka penyimpanan lokal.'))
    }
    request.onblocked = () => {
      dbPromise = null
      reject(new Error('Penyimpanan lokal sedang dipakai tab lain.'))
    }
  })
  return dbPromise
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Operasi penyimpanan gagal.'))
  })
}

export async function loadAppData(): Promise<AppData | null> {
  try {
    const database = await openDatabase()
    const transaction = database.transaction(KV_STORE, 'readonly')
    const store = transaction.objectStore(KV_STORE)
    const result = await requestToPromise(store.get(DATA_KEY))
    if (result) return result as AppData
  } catch {
    // Fall through to the localStorage mirror.
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw) as AppData
  } catch {
    // Ignore corrupt fallback data.
  }
  return null
}

/** Synchronous safety net so a refresh right after an action does not lose metadata. */
export function mirrorAppData(data: AppData): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
  } catch {
    // IndexedDB remains the primary store.
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  let primaryError: unknown = null
  try {
    const database = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(KV_STORE, 'readwrite')
      transaction.objectStore(KV_STORE).put(data, DATA_KEY)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('Gagal menyimpan data.'))
      transaction.onabort = () => reject(transaction.error ?? new Error('Penyimpanan dibatalkan.'))
    })
  } catch (error) {
    primaryError = error
  }
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
  } catch {
    if (primaryError) throw primaryError
  }
}

export async function savePhoto(record: PhotoRecord): Promise<void> {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(PHOTO_STORE, 'readwrite')
    transaction.objectStore(PHOTO_STORE).put(record)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Foto gagal disimpan.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Penyimpanan foto dibatalkan.'))
  })
}

export async function loadPhoto(id: string): Promise<PhotoRecord | null> {
  try {
    const database = await openDatabase()
    const transaction = database.transaction(PHOTO_STORE, 'readonly')
    const result = await requestToPromise(transaction.objectStore(PHOTO_STORE).get(id))
    return (result as PhotoRecord | undefined) ?? null
  } catch {
    return null
  }
}

export async function deletePhoto(id: string): Promise<void> {
  try {
    const database = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(PHOTO_STORE, 'readwrite')
      transaction.objectStore(PHOTO_STORE).delete(id)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('Foto gagal dihapus.'))
    })
  } catch {
    // The metadata removal still proceeds; an orphaned photo is harmless.
  }
}

export async function getAllPhotos(): Promise<PhotoRecord[]> {
  try {
    const database = await openDatabase()
    const transaction = database.transaction(PHOTO_STORE, 'readonly')
    const result = await requestToPromise(transaction.objectStore(PHOTO_STORE).getAll())
    return (result as PhotoRecord[]) ?? []
  } catch {
    return []
  }
}

export async function clearPhotos(): Promise<void> {
  try {
    const database = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(PHOTO_STORE, 'readwrite')
      transaction.objectStore(PHOTO_STORE).clear()
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('Foto gagal dihapus.'))
    })
  } catch {
    // Non-fatal: data reset can continue.
  }
}

export async function clearLocalAppData(): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_KEY)
  } catch {
    // Ignore storage access failure.
  }
  try {
    const database = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(KV_STORE, 'readwrite')
      transaction.objectStore(KV_STORE).delete(DATA_KEY)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('Data gagal dihapus.'))
    })
  } catch {
    // Fallback storage was already cleared.
  }
}

export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (!navigator.storage?.estimate) return null
    const estimate = await navigator.storage.estimate()
    return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 }
  } catch {
    return null
  }
}
