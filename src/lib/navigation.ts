import type { Component } from 'vue'
import {
  CalendarClock,
  ChartPie,
  Flame,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Settings,
  Target,
  Wallet,
  WalletCards,
} from '@lucide/vue'

export interface NavItem {
  to: string
  label: string
  icon: Component
  description?: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Ringkasan',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Menabung',
    items: [
      { to: '/setoran', label: 'Setoran Tabungan', icon: PiggyBank },
      { to: '/target', label: 'Target', icon: Target },
      { to: '/tantangan', label: 'Tantangan', icon: Flame },
    ],
  },
  {
    label: 'Keuangan',
    items: [
      { to: '/transaksi', label: 'Transaksi', icon: ReceiptText },
      { to: '/dompet', label: 'Dompet', icon: Wallet },
      { to: '/anggaran', label: 'Anggaran', icon: WalletCards },
      { to: '/tagihan', label: 'Tagihan', icon: CalendarClock },
    ],
  },
  {
    label: 'Analisis',
    items: [{ to: '/statistik', label: 'Statistik', icon: ChartPie }],
  },
]

export const settingsNav: NavItem = {
  to: '/pengaturan',
  label: 'Pengaturan',
  icon: Settings,
}

export const mobilePrimaryNav: NavItem[] = [
  { to: '/', label: 'Beranda', icon: LayoutDashboard },
  { to: '/transaksi', label: 'Transaksi', icon: ReceiptText },
  { to: '/target', label: 'Target', icon: Target },
]

export function pageTitleFor(path: string): string {
  for (const group of navGroups) {
    const found = group.items.find((item) => item.to === path)
    if (found) return found.label
  }
  if (path === settingsNav.to) return settingsNav.label
  return 'Savezy'
}
