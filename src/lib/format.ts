const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number): string {
  const safe = Number.isFinite(value) ? Math.round(value) : 0
  return idrFormatter.format(safe).replace(/\u00a0/g, '\u00a0')
}

export function formatNumber(value: number): string {
  const safe = Number.isFinite(value) ? Math.round(value) : 0
  return numberFormatter.format(safe)
}

export function formatCompactCurrency(value: number): string {
  const absolute = Math.abs(value)
  if (absolute >= 1_000_000_000) {
    return `Rp${trimDecimal(value / 1_000_000_000)} M`
  }
  if (absolute >= 1_000_000) {
    return `Rp${trimDecimal(value / 1_000_000)} jt`
  }
  if (absolute >= 1_000) {
    return `Rp${trimDecimal(value / 1_000)} rb`
  }
  return `Rp${formatNumber(value)}`
}

function trimDecimal(value: number): string {
  return value.toLocaleString('id-ID', { maximumFractionDigits: value >= 10 ? 0 : 1 })
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function parseCurrencyInput(value: string): number {
  const digits = value.replace(/[^\d]/g, '')
  return digits ? Number.parseInt(digits, 10) : 0
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toLocaleString('id-ID', { maximumFractionDigits: fractionDigits })}%`
}

export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'S'
  )
}
