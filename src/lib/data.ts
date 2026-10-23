import type {
  AppData,
  AppSettings,
  Bill,
  Budget,
  Challenge,
  Deposit,
  FinanceTransaction,
  SavingsTarget,
  Transfer,
  Wallet,
} from '@/types'
import { createEmptyData } from './seed'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function safePositive(value: unknown): number {
  const number = safeNumber(value, 0)
  return number > 0 ? number : 0
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (!item.id || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function normalizeSettings(raw: unknown): AppSettings {
  const source = isObject(raw) ? raw : {}
  const theme = source.theme
  return {
    theme: theme === 'dark' || theme === 'system' ? theme : 'light',
    hideAmounts: source.hideAmounts === true,
    profileName: safeString(source.profileName, 'Sahabat Tabungin').slice(0, 60) || 'Sahabat Tabungin',
  }
}

const LEGACY_WALLET_COLORS: Record<string, string> = {
  '#5278f6': '#5F8563',
  '#7c6cf0': '#C09236',
  '#24ad7a': '#588B7A',
  '#f59e0b': '#D08A45',
  '#ef6b7a': '#C98273',
  '#0ea5a5': '#4F8A7B',
}

function normalizeWalletColor(value: unknown): string {
  const color = safeString(value)
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return '#5F8563'
  return LEGACY_WALLET_COLORS[color.toLowerCase()] ?? color
}

function normalizeWallets(raw: unknown): Wallet[] {
  return uniqueById(
    safeArray(raw)
      .filter(isObject)
      .map((item) => ({
        id: safeString(item.id),
        name: safeString(item.name, 'Dompet').slice(0, 60) || 'Dompet',
        kind:
          item.kind === 'bank' || item.kind === 'ewallet'
            ? (item.kind as Wallet['kind'])
            : ('cash' as const),
        initialBalance: safeNumber(item.initialBalance),
        color: normalizeWalletColor(item.color),
        createdAt: safeString(item.createdAt, new Date().toISOString()),
      })),
  )
}

function normalizeTransactions(raw: unknown): FinanceTransaction[] {
  return uniqueById(
    safeArray(raw)
      .filter(isObject)
      .filter((item) => item.type === 'income' || item.type === 'expense')
      .map((item) => ({
        id: safeString(item.id),
        type: item.type as FinanceTransaction['type'],
        amount: safePositive(item.amount),
        category: safeString(item.category, 'Lainnya'),
        date: safeString(item.date).slice(0, 10),
        note: safeString(item.note).slice(0, 500),
        walletId: safeString(item.walletId),
        billId: safeString(item.billId) || undefined,
        createdAt: safeString(item.createdAt, new Date().toISOString()),
      }))
      .filter((item) => item.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(item.date)),
  )
}

function normalizeDeposits(raw: unknown): Deposit[] {
  return uniqueById(
    safeArray(raw)
      .filter(isObject)
      .map((item) => {
        const photoMeta = isObject(item.photoMeta)
          ? {
              mimeType: safeString(item.photoMeta.mimeType, 'image/jpeg'),
              size: safeNumber(item.photoMeta.size),
              width: safeNumber(item.photoMeta.width),
              height: safeNumber(item.photoMeta.height),
              originalName: safeString(item.photoMeta.originalName) || undefined,
            }
          : undefined
        return {
          id: safeString(item.id),
          amount: safePositive(item.amount),
          targetId: safeString(item.targetId) || undefined,
          walletId: safeString(item.walletId),
          date: safeString(item.date, new Date().toISOString()),
          note: safeString(item.note).slice(0, 500),
          photoId: safeString(item.photoId) || undefined,
          photoMeta,
          createdAt: safeString(item.createdAt, new Date().toISOString()),
        }
      })
      .filter((item) => item.amount > 0),
  )
}

function normalizeTargets(raw: unknown): SavingsTarget[] {
  return uniqueById(
    safeArray(raw)
      .filter(isObject)
      .map((item) => ({
        id: safeString(item.id),
        name: safeString(item.name, 'Target').slice(0, 80) || 'Target',
        targetAmount: safePositive(item.targetAmount),
        deadline: safeString(item.deadline).slice(0, 10) || undefined,
        description: safeString(item.description).slice(0, 500),
        icon: safeString(item.icon, 'Target'),
        priority:
          item.priority === 'high' || item.priority === 'low'
            ? (item.priority as SavingsTarget['priority'])
            : ('medium' as const),
        isEmergencyFund: item.isEmergencyFund === true,
        createdAt: safeString(item.createdAt, new Date().toISOString()),
        completedAt: safeString(item.completedAt) || undefined,
      }))
      .filter((item) => item.targetAmount > 0),
  )
}

function normalizeBudgets(raw: unknown): Budget[] {
  const seen = new Set<string>()
  return uniqueById(
    safeArray(raw)
      .filter(isObject)
      .map((item) => ({
        id: safeString(item.id),
        category: safeString(item.category),
        monthlyLimit: safePositive(item.monthlyLimit),
        createdAt: safeString(item.createdAt, new Date().toISOString()),
      }))
      .filter((item) => {
        if (!item.category || item.monthlyLimit <= 0 || seen.has(item.category)) return false
        seen.add(item.category)
        return true
      }),
  )
}

function normalizeBills(raw: unknown): Bill[] {
  return uniqueById(
    safeArray(raw)
      .filter(isObject)
      .map((item) => ({
        id: safeString(item.id),
        name: safeString(item.name, 'Tagihan').slice(0, 80) || 'Tagihan',
        amount: safePositive(item.amount),
        category: safeString(item.category, 'Tagihan'),
        walletId: safeString(item.walletId),
        dueDay: Math.min(Math.max(Math.round(safeNumber(item.dueDay, 1)), 1), 31),
        frequency: item.frequency === 'once' ? ('once' as const) : ('monthly' as const),
        dueDate: safeString(item.dueDate).slice(0, 10) || undefined,
        active: item.active !== false,
        notes: safeString(item.notes).slice(0, 300),
        lastPaidAt: safeString(item.lastPaidAt).slice(0, 10) || undefined,
        createdAt: safeString(item.createdAt, new Date().toISOString()),
      }))
      .filter((item) => item.amount > 0),
  )
}

function normalizeChallenges(raw: unknown): Challenge[] {
  return uniqueById(
    safeArray(raw)
      .filter(isObject)
      .map((item) => ({
        id: safeString(item.id),
        kind:
          item.kind === '30-day' || item.kind === 'weekly'
            ? (item.kind as Challenge['kind'])
            : ('7-day' as const),
        title: safeString(item.title, 'Tantangan Menabung').slice(0, 80) || 'Tantangan Menabung',
        targetAmount: safePositive(item.targetAmount),
        startDate: safeString(item.startDate).slice(0, 10),
        active: item.active !== false,
        createdAt: safeString(item.createdAt, new Date().toISOString()),
      }))
      .filter((item) => item.targetAmount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(item.startDate)),
  )
}

function normalizeTransfers(raw: unknown): Transfer[] {
  return uniqueById(
    safeArray(raw)
      .filter(isObject)
      .map((item) => ({
        id: safeString(item.id),
        fromWalletId: safeString(item.fromWalletId),
        toWalletId: safeString(item.toWalletId),
        amount: safePositive(item.amount),
        date: safeString(item.date).slice(0, 10),
        note: safeString(item.note).slice(0, 300),
        createdAt: safeString(item.createdAt, new Date().toISOString()),
      }))
      .filter((item) => item.amount > 0 && item.fromWalletId !== item.toWalletId),
  )
}

/** Accepts untrusted JSON and produces a structurally safe AppData object. */
export function normalizeAppData(raw: unknown): AppData | null {
  if (!isObject(raw)) return null
  const hasKnownData =
    Array.isArray(raw.wallets) ||
    Array.isArray(raw.transactions) ||
    Array.isArray(raw.deposits) ||
    Array.isArray(raw.targets)
  if (!hasKnownData) return null

  const base = createEmptyData()
  const wallets = normalizeWallets(raw.wallets)
  return {
    version: 1,
    wallets: wallets.length > 0 ? wallets : base.wallets,
    transactions: normalizeTransactions(raw.transactions),
    deposits: normalizeDeposits(raw.deposits),
    targets: normalizeTargets(raw.targets),
    budgets: normalizeBudgets(raw.budgets),
    bills: normalizeBills(raw.bills),
    challenges: normalizeChallenges(raw.challenges),
    transfers: normalizeTransfers(raw.transfers),
    settings: normalizeSettings(raw.settings),
  }
}

export function sanitizeImportedData(raw: unknown): { data: AppData; photoIds: string[] } | null {
  if (!isObject(raw) || (raw.app !== 'tabungin' && raw.app !== 'savezy') || !isObject(raw.data)) {
    return null
  }
  const data = normalizeAppData(raw.data)
  if (!data) return null
  const photoIds = [...new Set(data.deposits.map((deposit) => deposit.photoId).filter(Boolean))]
  return { data, photoIds: photoIds as string[] }
}
