export function isEmailOrPhone(value: string): boolean {
  const normalized = value.trim()
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return true
  return /^\+?\d{8,15}$/.test(normalized.replace(/[\s-]/g, ''))
}
