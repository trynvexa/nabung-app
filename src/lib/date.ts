const DAY_MS = 86_400_000

const longDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const shortDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const monthFormatter = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
})

const monthShortFormatter = new Intl.DateTimeFormat('id-ID', {
  month: 'short',
})

const weekdayFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long' })

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
})

const numericDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
})

/** Local calendar date, formatted as YYYY-MM-DD. Never use toISOString() for this. */
export function toDateKey(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function monthKey(value: Date | string = new Date()): string {
  return toDateKey(value).slice(0, 7)
}

export function parseDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year = 1970, month = 1, day = 1] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(value)
}

export function startOfMonth(value: Date | string = new Date()): Date {
  const date = value instanceof Date ? new Date(value) : parseDate(value)
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(value: Date | string = new Date()): Date {
  const date = value instanceof Date ? new Date(value) : parseDate(value)
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function addDays(value: Date | string, days: number): Date {
  const date = value instanceof Date ? new Date(value) : parseDate(value)
  date.setDate(date.getDate() + days)
  return date
}

export function addMonths(value: Date | string, months: number): Date {
  const date = value instanceof Date ? new Date(value) : parseDate(value)
  const day = date.getDate()
  date.setDate(1)
  date.setMonth(date.getMonth() + months)
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(day, lastDay))
  return date
}

export function daysBetween(from: Date | string, to: Date | string): number {
  const start = startOfDay(from).getTime()
  const end = startOfDay(to).getTime()
  return Math.round((end - start) / DAY_MS)
}

export function startOfDay(value: Date | string): Date {
  const date = value instanceof Date ? new Date(value) : parseDate(value)
  date.setHours(0, 0, 0, 0)
  return date
}

export function formatDateLong(value: Date | string): string {
  const date = value instanceof Date ? value : parseDate(value)
  return Number.isNaN(date.getTime()) ? '—' : longDateFormatter.format(date)
}

export function formatDateShort(value: Date | string): string {
  const date = value instanceof Date ? value : parseDate(value)
  return Number.isNaN(date.getTime()) ? '—' : shortDateFormatter.format(date)
}

export function formatMonth(value: Date | string): string {
  const date = value instanceof Date ? value : parseDate(value)
  return Number.isNaN(date.getTime()) ? '—' : monthFormatter.format(date)
}

export function formatMonthShort(value: Date | string): string {
  const date = value instanceof Date ? value : parseDate(value)
  return Number.isNaN(date.getTime()) ? '—' : monthShortFormatter.format(date)
}

export function formatWeekday(value: Date | string): string {
  const date = value instanceof Date ? value : parseDate(value)
  return Number.isNaN(date.getTime()) ? '—' : weekdayFormatter.format(date)
}

export function formatTime(value: Date | string): string {
  const date = value instanceof Date ? value : parseDate(value)
  return Number.isNaN(date.getTime()) ? '—' : timeFormatter.format(date)
}

export function formatDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : parseDate(value)
  return `${formatDateShort(date)} · ${formatTime(date)}`
}

export function formatNumericDate(value: Date | string): string {
  const date = value instanceof Date ? value : parseDate(value)
  return Number.isNaN(date.getTime()) ? '—' : numericDateFormatter.format(date)
}

/** A display-friendly relative label for recent deposit timestamps. */
export function formatRelative(value: Date | string): string {
  const date = value instanceof Date ? value : parseDate(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diff = daysBetween(date, new Date())
  if (diff === 0) return `Hari ini · ${formatTime(date)}`
  if (diff === 1) return `Kemarin · ${formatTime(date)}`
  if (diff > 1 && diff < 7) return `${diff} hari lalu`
  return formatDateShort(date)
}

export function greetingForNow(): string {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

export function eachDayOfMonth(month: Date): Date[] {
  const days: Date[] = []
  const cursor = startOfMonth(month)
  while (cursor.getMonth() === month.getMonth()) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export function monthRangeBack(count: number, from: Date = new Date()): string[] {
  const keys: string[] = []
  for (let index = count - 1; index >= 0; index -= 1) {
    keys.push(monthKey(addMonths(startOfMonth(from), -index)))
  }
  return keys
}

export function nextMonthlyDue(day: number, lastPaidAt?: string): Date {
  const now = new Date()
  const safeDay = Math.min(Math.max(day, 1), 31)
  const dueThisMonth = new Date(now.getFullYear(), now.getMonth(), safeDay)
  if (lastPaidAt && monthKey(lastPaidAt) === monthKey(now)) {
    return new Date(now.getFullYear(), now.getMonth() + 1, safeDay)
  }
  if (daysBetween(dueThisMonth, now) > 0) {
    return new Date(now.getFullYear(), now.getMonth() + 1, safeDay)
  }
  return dueThisMonth
}
