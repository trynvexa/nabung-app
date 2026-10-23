export type ThemeMode = 'light' | 'dark' | 'system'
export type TransactionType = 'income' | 'expense'
export type TargetPriority = 'low' | 'medium' | 'high'
export type WalletKind = 'cash' | 'bank' | 'ewallet'
export type BillFrequency = 'monthly' | 'once'
export type ChallengeKind = '7-day' | '30-day' | 'weekly'

export interface Wallet {
  id: string
  name: string
  kind: WalletKind
  initialBalance: number
  color: string
  createdAt: string
}

export interface FinanceTransaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  date: string
  note: string
  walletId: string
  billId?: string
  createdAt: string
}

export interface SavingsTarget {
  id: string
  name: string
  targetAmount: number
  deadline?: string
  description: string
  icon: string
  priority: TargetPriority
  isEmergencyFund: boolean
  createdAt: string
  completedAt?: string
}

export interface PhotoMeta {
  mimeType: string
  size: number
  width: number
  height: number
  originalName?: string
}

export interface Deposit {
  id: string
  amount: number
  targetId?: string
  walletId: string
  date: string
  note: string
  photoId?: string
  photoMeta?: PhotoMeta
  createdAt: string
}

export interface Budget {
  id: string
  category: string
  monthlyLimit: number
  createdAt: string
}

export interface Bill {
  id: string
  name: string
  amount: number
  category: string
  walletId: string
  dueDay: number
  frequency: BillFrequency
  dueDate?: string
  active: boolean
  notes: string
  lastPaidAt?: string
  createdAt: string
}

export interface Challenge {
  id: string
  kind: ChallengeKind
  title: string
  targetAmount: number
  startDate: string
  active: boolean
  createdAt: string
}

export interface Transfer {
  id: string
  fromWalletId: string
  toWalletId: string
  amount: number
  date: string
  note: string
  createdAt: string
}

export interface AppSettings {
  theme: ThemeMode
  hideAmounts: boolean
  profileName: string
}

export interface AppData {
  version: number
  wallets: Wallet[]
  transactions: FinanceTransaction[]
  deposits: Deposit[]
  targets: SavingsTarget[]
  budgets: Budget[]
  bills: Bill[]
  challenges: Challenge[]
  transfers: Transfer[]
  settings: AppSettings
}

export interface PhotoRecord {
  id: string
  blob: Blob
  mimeType: string
  width: number
  height: number
  size: number
  createdAt: string
}

export interface BackupPhoto {
  meta: PhotoMeta
  dataUrl: string
}

export interface BackupFile {
  app: 'savezy'
  version: number
  exportedAt: string
  data: AppData
  photos: Record<string, BackupPhoto>
}

export interface CategoryDefinition {
  name: string
  type: TransactionType
  icon: string
  color: string
}

export interface ActionResult {
  ok: boolean
  message?: string
}
