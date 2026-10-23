export function uid(prefix = ''): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return prefix ? `${prefix}_${random}` : random
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
