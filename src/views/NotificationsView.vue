<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Bell,
  CalendarClock,
  PiggyBank,
  ReceiptText,
  Sparkles,
  Target,
  WalletCards,
} from '@lucide/vue'
import { useAppStore } from '@/stores/app'
import { formatCurrency, formatPercent } from '@/lib/format'
import { formatRelative } from '@/lib/date'
import PageHeader from '@/components/ui/PageHeader.vue'
import SavingsCat from '@/components/brand/SavingsCat.vue'

interface Notice {
  id: string
  title: string
  message: string
  time: string
  to: string
  icon: Component
  tone: string
}

const appStore = useAppStore()

const notices = computed<Notice[]>(() => {
  const items: Notice[] = []
  const money = (value: number) => formatCurrency(value)

  const deadline = appStore.upcomingTargetReminders[0]
  if (deadline) {
    items.push({
      id: `target-deadline-${deadline.target.id}`,
      title: 'Target hampir tiba',
      message: `${deadline.target.name} tinggal ${deadline.days} hari lagi. Yuk, tambah tabungannya!`,
      time: deadline.days === 0 ? 'Hari ini' : `${deadline.days} hari lagi`,
      to: '/target',
      icon: CalendarClock,
      tone: 'bg-[#f7ecdc] text-[#a57632]',
    })
  }

  const closeTarget = [...appStore.targetCards]
    .filter((entry) => !entry.progress.isComplete && entry.progress.percent >= 50)
    .sort((a, b) => b.progress.percent - a.progress.percent)[0]
  if (closeTarget && closeTarget.target.id !== deadline?.target.id) {
    items.push({
      id: `target-progress-${closeTarget.target.id}`,
      title: 'Sedikit lagi tercapai!',
      message: `${closeTarget.target.name} sudah ${formatPercent(closeTarget.progress.percent)} dari targetmu. Pertahankan!`,
      time: 'Baru saja',
      to: '/target',
      icon: Target,
      tone: 'bg-[#e9f1e4] text-[#557c5b]',
    })
  }

  const bill = appStore.upcomingBillReminders[0]
  if (bill) {
    items.push({
      id: `bill-${bill.bill.id}`,
      title: 'Pengingat tagihan',
      message: `${bill.bill.name} sebesar ${money(bill.bill.amount)} akan jatuh tempo dalam ${Math.max(bill.days, 0)} hari.`,
      time: bill.days <= 0 ? 'Hari ini' : `${bill.days} hari lagi`,
      to: '/tagihan',
      icon: CalendarClock,
      tone: 'bg-[#fbeae5] text-[#ad6251]',
    })
  }

  const latestDeposit = appStore.recentDeposits[0]
  if (latestDeposit) {
    items.push({
      id: `deposit-${latestDeposit.id}`,
      title: 'Tabungan berhasil',
      message: `${money(latestDeposit.amount)} masuk ke ${appStore.targetName(latestDeposit.targetId)}.`,
      time: formatRelative(latestDeposit.date),
      to: '/setoran',
      icon: PiggyBank,
      tone: 'bg-[#e7f3e5] text-[#427b48]',
    })
  }

  const budget = appStore.currentBudgetStatuses
    .filter((entry) => entry.state !== 'safe')
    .sort((a, b) => b.percent - a.percent)[0]
  if (budget) {
    items.push({
      id: `budget-${budget.budget.id}`,
      title: budget.state === 'over' ? 'Anggaran terlampaui' : 'Anggaran hampir habis',
      message: `${budget.budget.category} sudah terpakai ${money(budget.spent)} dari ${money(budget.budget.monthlyLimit)}.`,
      time: 'Bulan ini',
      to: '/anggaran',
      icon: WalletCards,
      tone: 'bg-[#fbf1d9] text-[#9b742c]',
    })
  }

  const latestExpense = [...appStore.data.transactions]
    .filter((transaction) => transaction.type === 'expense')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  if (latestExpense) {
    items.push({
      id: `expense-${latestExpense.id}`,
      title: 'Pengeluaran terbaru',
      message: `${latestExpense.category} sebesar ${money(latestExpense.amount)} tercatat di riwayatmu.`,
      time: formatRelative(latestExpense.date),
      to: '/transaksi',
      icon: ReceiptText,
      tone: 'bg-[#eef0eb] text-[#687663]',
    })
  }

  return items.slice(0, 6)
})
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <PageHeader
      class="hidden lg:flex"
      title="Notifikasi"
      subtitle="Pengingat target, tagihan, dan kabar terbaru dari perjalanan menabungmu."
      eyebrow="Pusat kabar"
    >
      <template #actions>
        <span class="chip bg-surface-2 text-muted">
          <Bell :size="13" />
          {{ notices.length }} pengingat
        </span>
      </template>
    </PageHeader>

    <div class="relative mb-4 overflow-hidden rounded-[24px] border border-line bg-surface/90 px-4 py-4 shadow-card lg:mt-6">
      <div class="absolute -right-6 -top-8 size-28 rounded-full bg-[#edf4df]" />
      <div class="relative flex items-center gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#e9f1e4] text-[#557c5b]">
          <Bell :size="19" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-[12px] font-extrabold text-ink">Kabar untukmu</p>
          <p class="mt-0.5 text-[9px] font-semibold leading-relaxed text-muted">
            Semua pengingat dibuat dari data yang tersimpan di perangkat ini.
          </p>
        </div>
      </div>
    </div>

    <div v-if="notices.length" class="space-y-2.5">
      <RouterLink
        v-for="notice in notices"
        :key="notice.id"
        :to="notice.to"
        class="group flex items-start gap-3 rounded-[20px] border border-line bg-surface/95 px-3.5 py-3.5 shadow-[0_10px_24px_-24px_rgba(47,73,52,0.55)] transition-colors hover:bg-surface-2/50"
      >
        <span class="flex size-10 shrink-0 items-center justify-center rounded-[14px]" :class="notice.tone">
          <component :is="notice.icon" :size="17" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="flex items-start justify-between gap-2">
            <span class="text-[12px] font-extrabold leading-snug text-ink">{{ notice.title }}</span>
            <span class="shrink-0 pt-0.5 text-[8px] font-semibold text-muted">{{ notice.time }}</span>
          </span>
          <span class="mt-1 block text-[9px] font-semibold leading-relaxed text-muted">{{ notice.message }}</span>
        </span>
      </RouterLink>
    </div>

    <div v-else class="relative overflow-hidden rounded-[24px] border border-line bg-surface px-6 py-10 text-center shadow-card">
      <div class="relative mx-auto mb-2 h-[150px] w-[200px]">
        <span class="absolute left-1/2 top-1/2 size-[140px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#edf4df]" />
        <SavingsCat class="relative z-10 mx-auto w-[180px]" />
        <Sparkles :size="18" class="absolute right-4 top-3 text-[#d2b66c]" />
      </div>
      <h2 class="text-[15px] font-extrabold text-ink">Belum ada notifikasi baru</h2>
      <p class="mx-auto mt-1 max-w-xs text-[10px] font-semibold leading-relaxed text-muted">
        Setiap setoran dan target baru akan menampilkan kabar seru di sini.
      </p>
    </div>
  </div>
</template>
