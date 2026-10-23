import type { CategoryDefinition, TransactionType } from '@/types'

export const INCOME_CATEGORIES: CategoryDefinition[] = [
  { name: 'Uang saku', type: 'income', icon: 'WalletCards', color: '#5F8563' },
  { name: 'Freelance', type: 'income', icon: 'Laptop', color: '#7C9450' },
  { name: 'Hadiah', type: 'income', icon: 'Gift', color: '#C09236' },
  { name: 'Gaji', type: 'income', icon: 'BriefcaseBusiness', color: '#4F8A7B' },
  { name: 'Investasi', type: 'income', icon: 'TrendingUp', color: '#3F7A5A' },
  { name: 'Lainnya', type: 'income', icon: 'CircleEllipsis', color: '#8A957F' },
]

export const EXPENSE_CATEGORIES: CategoryDefinition[] = [
  { name: 'Makanan', type: 'expense', icon: 'UtensilsCrossed', color: '#D08A45' },
  { name: 'Transportasi', type: 'expense', icon: 'BusFront', color: '#588B7A' },
  { name: 'Belanja', type: 'expense', icon: 'ShoppingBag', color: '#C98273' },
  { name: 'Pendidikan', type: 'expense', icon: 'GraduationCap', color: '#8C9A4B' },
  { name: 'Hiburan', type: 'expense', icon: 'Gamepad2', color: '#C79B3B' },
  { name: 'Kesehatan', type: 'expense', icon: 'HeartPulse', color: '#C96F63' },
  { name: 'Tagihan', type: 'expense', icon: 'ReceiptText', color: '#9A7650' },
  { name: 'Lainnya', type: 'expense', icon: 'CircleEllipsis', color: '#8A957F' },
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
      color: '#8A957F',
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

export const TARGET_COLORS = ['#5F8563', '#C09236', '#C98273', '#588B7A', '#8C9A4B', '#9A7650', '#3F7A5A']

export const WALLET_KIND_LABEL: Record<string, string> = {
  cash: 'Tunai',
  bank: 'Rekening bank',
  ewallet: 'Dompet digital',
}
