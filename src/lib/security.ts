/**
 * Tabungin Security Suite
 * - XSS & Input Sanitization
 * - Brute-Force Rate Limiting
 * - Binary Magic-Byte File Validation
 * - Prototype-Pollution Resistant JSON Parsing
 * - SHA-256 PIN Security
 */

/**
 * Strips HTML tags, script execution vectors, and dangerous characters from user input.
 */
export function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

/**
 * In-memory & localStorage-backed Brute-force Rate Limiter
 */
interface RateLimitRecord {
  attempts: number
  lockUntil: number
}

const RATE_LIMIT_PREFIX = 'tabungin_sec_rl_'
const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MS = 30 * 1000 // 30 seconds lock

export function getRemainingLockTime(key: string): number {
  try {
    const raw = localStorage.getItem(`${RATE_LIMIT_PREFIX}${key}`)
    if (!raw) return 0
    const record: RateLimitRecord = JSON.parse(raw)
    const remaining = record.lockUntil - Date.now()
    if (remaining <= 0) {
      if (record.lockUntil > 0) {
        localStorage.removeItem(`${RATE_LIMIT_PREFIX}${key}`)
      }
      return 0
    }
    return Math.ceil(remaining / 1000)
  } catch {
    return 0
  }
}

export function recordFailedAttempt(key: string): { locked: boolean; remainingSec: number } {
  try {
    const storageKey = `${RATE_LIMIT_PREFIX}${key}`
    const raw = localStorage.getItem(storageKey)
    const now = Date.now()
    const record: RateLimitRecord = raw ? JSON.parse(raw) : { attempts: 0, lockUntil: 0 }

    record.attempts += 1
    if (record.attempts >= MAX_FAILED_ATTEMPTS) {
      record.lockUntil = now + LOCK_DURATION_MS
      record.attempts = 0
      localStorage.setItem(storageKey, JSON.stringify(record))
      return { locked: true, remainingSec: Math.ceil(LOCK_DURATION_MS / 1000) }
    }

    localStorage.setItem(storageKey, JSON.stringify(record))
    return { locked: false, remainingSec: 0 }
  } catch {
    return { locked: false, remainingSec: 0 }
  }
}

export function resetRateLimit(key: string): void {
  try {
    localStorage.removeItem(`${RATE_LIMIT_PREFIX}${key}`)
  } catch {
    // Ignore storage errors
  }
}

/**
 * Validates file binary header (Magic Bytes) to verify real image type.
 * Blocks executable files, scripts, or malicious content masquerading as images.
 */
export async function validateImageFile(file: File): Promise<{ ok: boolean; error?: string }> {
  // 1. Size check
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: 'Ukuran foto maksimal 10 MB demi keamanan.' }
  }

  // 2. MIME type whitelist check
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedMime.includes(file.type)) {
    return { ok: false, error: 'Format berkas tidak diizinkan. Hanya JPEG, PNG, dan WebP.' }
  }

  // 3. Magic bytes binary check
  try {
    const slice = file.slice(0, 16)
    const buffer = await slice.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // JPEG: FF D8 FF
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a

    // WebP: RIFF....WEBP
    const isWebP =
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50

    if (!isJpeg && !isPng && !isWebP) {
      return { ok: false, error: 'Integritas berkas gagal diverifikasi (magic bytes tidak sesuai).' }
    }

    return { ok: true }
  } catch {
    return { ok: false, error: 'Gagal memvalidasi keamanan berkas.' }
  }
}

/**
 * SHA-256 PIN hashing using browser Web Crypto API
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`tabungin_pin_salt_${pin}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPin(pin: string, hashed: string): Promise<boolean> {
  const computed = await hashPin(pin)
  return computed === hashed
}

/**
 * Safe JSON parser with prototype-pollution prevention
 */
export function safeJsonParse<T = unknown>(json: string): T | null {
  try {
    return JSON.parse(json, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined
      }
      return value
    }) as T
  } catch {
    return null
  }
}
