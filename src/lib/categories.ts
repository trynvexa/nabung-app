import type { CategoryDefinition, TransactionType } from '@/types'

export const INCOME_CATEGORIES: CategoryDefinition[] = [
  { name: 'Uang saku', type: 'income', icon: 'WalletCards', color: '#5278F6' },
  { name: 'Freelance', type: 'income', icon: 'Laptop', color: '#7C6CF0' },
  { name: 'Hadiah', type: 'income', icon: 'Gift', color: '#24AD7A' },
  { name: 'Gaji', type: 'income', icon: 'BriefcaseBusiness', color: '#0EA5A5' },
  { name: 'Investasi', type: 'income', icon: 'TrendingUp', color: '#34A853' },
  { name: 'Lainnya', type: 'income', icon: 'CircleEllipsis', color: '#8290A8' },
]

export const EXPENSE_CATEGORIES: CategoryDefinition[] = [
  { name: 'Makanan', type: 'expense', icon: 'UtensilsCrossed', color: '#F59E0B' },
  { name: 'Transportasi', type: 'expense', icon: 'BusFront', color: '#5278F6' },
  { name: 'Belanja', type: 'expense', icon: 'ShoppingBag', color: '#EC4899' },
  { name: 'Pendidikan', type: 'expense', icon: 'GraduationCap', color: '#8B5CF6' },
  { name: 'Hiburan', type: 'expense', icon: 'Gamepad2', color: '#F97316' },
  { name: 'Kesehatan', type: 'expense', icon: 'HeartPulse', color: '#EF6B7A' },
  { name: 'Tagihan', type: 'expense', icon: 'ReceiptText', color: '#6366F1' },
  { name: 'Lainnya', type: 'expense', icon: 'CircleEllipsis', color: '#94A3B8' },
]

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

export function categoriesFor(type: TransactionType): CategoryDefinition[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

export function findCategory(name: string): CategoryDefinition {
  return (
    ALL_CATEGORIES.find((category) => category.name === name) ?? {
      name,
      type: 'expense',
      icon: 'CircleEllipsis',
      color: '#94A3B8',
    }
  )
}

export const TARGET_ICONS = [
  { name: 'Target', label: 'Target' },
  { name: 'PiggyBank', label: 'Celengan' },
  { name: 'ShieldCheck', label: 'Dana darurat' },
  { name: 'Plane', label: 'Liburan' },
  { name: 'House', label: 'Rumah' },
  { name: 'Car', label: 'Kendaraan' },
  { name: 'Laptop', label: 'Gadget' },
  { name: 'GraduationCap', label: 'Pendidikan' },
  { name: 'Gift', label: 'Hadiah' },
  { name: 'Sparkles', label: 'Impian' },
] as const

export const TARGET_COLORS = ['#5278F6', '#7C6CF0', '#A99AFB', '#24AD7A', '#F59E0B', '#EF6B7A', '#0EA5A5']

export const WALLET_KIND_LABEL: Record<string, string> = {
  cash: 'Tunai',
  bank: 'Rekening bank',
  ewallet: 'Dompet digital',
}
