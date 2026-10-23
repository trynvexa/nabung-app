<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  ChevronRight,
  Eye,
  EyeOff,
  Flame,
  PiggyBank,
  Plus,
  ReceiptText,
  ShieldCheck,
  Target as TargetIconLucide,
  TrendingDown,
  TrendingUp,
  Wallet,
  WalletCards,
} from '@lucide/vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { comparePercent } from '@/lib/calc'
import { daysBetween, formatDateLong, formatMonth, greetingForNow, parseDate, todayKey } from '@/lib/date'
import { formatCurrency, formatPercent } from '@/lib/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import TargetIcon from '@/components/ui/TargetIcon.vue'
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import PhotoThumb from '@/components/ui/PhotoThumb.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import CashflowBarChart from '@/components/charts/CashflowBarChart.vue'
import DepositDetailModal from '@/components/deposits/DepositDetailModal.vue'
import SavingsCat from '@/components/brand/SavingsCat.vue'
import { findCategory } from '@/lib/categories'

const appStore = useAppStore()
const ui = useUiStore()

const firstName = computed(() => appStore.data.settings.profileName.trim().split(/\s+/)[0] || 'Sahabat')
const hideAmounts = computed(() => appStore.data.settings.hideAmounts)

const monthDepositDelta = computed(() =>
  comparePercent(appStore.thisMonthSummary.depositTotal, appStore.previousMonthSummary.depositTotal),
)
const incomeDelta = computed(() =>
  comparePercent(appStore.thisMonthSummary.income, appStore.previousMonthSummary.income),
)
const expenseDelta = computed(() =>
  comparePercent(appStore.thisMonthSummary.expense, appStore.previousMonthSummary.expense),
)

const weeklyDeposits = computed(() => {
  const buckets = [0, 0, 0, 0]
  for (const deposit of appStore.data.deposits) {
    const date = parseDate(deposit.date)
    if (
      date.getMonth() !== new Date().getMonth() ||
      date.getFullYear() !== new Date().getFullYear()
    ) {
      continue
    }
    const index = Math.min(Math.floor((date.getDate() - 1) / 7), 3)
    buckets[index] = (buckets[index] ?? 0) + deposit.amount
  }
  return buckets
})
const weeklyMax = computed(() => Math.max(...weeklyDeposits.value, 1))
const weekBars = computed(() =>
  weeklyDeposits.value.map((value, index) => ({
    value,
    label: `M${index + 1}`,
    height: Math.max(8, Math.round((value / weeklyMax.value) * 100)),
  })),
)

const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 }
const dashboardTargets = computed(() =>
  [...appStore.targetCards]
    .sort((a, b) => {
      if (a.progress.isComplete !== b.progress.isComplete) return a.progress.isComplete ? 1 : -1
      if (a.target.isEmergencyFund !== b.target.isEmergencyFund)
        return a.target.isEmergencyFund ? -1 : 1
      return (priorityRank[a.target.priority] ?? 1) - (priorityRank[b.target.priority] ?? 1)
    })
    .slice(0, 3),
)

const budgetPreview = computed(() =>
  [...appStore.currentBudgetStatuses].sort((a, b) => b.percent - a.percent).slice(0, 3),
)
const totalBudget = computed(() =>
  appStore.currentBudgetStatuses.reduce((total, entry) => total + entry.budget.monthlyLimit, 0),
)
const totalBudgetSpent = computed(() =>
  appStore.currentBudgetStatuses.reduce((total, entry) => total + entry.spent, 0),
)
const budgetPercent = computed(() =>
  totalBudget.value > 0 ? Math.min((totalBudgetSpent.value / totalBudget.value) * 100, 100) : 0,
)

const reminders = computed(() => {
  const bills = appStore.upcomingBillReminders.slice(0, 2).map((entry) => ({
    key: `bill-${entry.bill.id}`,
    type: 'bill' as const,
    id: entry.bill.id,
    title: entry.bill.name,
    amount: entry.bill.amount,
    days: entry.days,
  }))
  const targets = appStore.upcomingTargetReminders.slice(0, 1).map((entry) => ({
    key: `target-${entry.target.id}`,
    type: 'target' as const,
    id: entry.target.id,
    title: entry.target.name,
    amount: entry.target.targetAmount,
    days: entry.days,
  }))
  return [...bills, ...targets].sort((a, b) => a.days - b.days)
})

const streakDays = computed(() => {
  const today = new Date()
  return Array.from({ length: 7 }, (_, index) => {
    const offset = 6 - index
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const hasDeposit = appStore.data.deposits.some(
      (deposit) => deposit.date.slice(0, 10) === key,
    )
    return {
      key,
      label: ['S', 'S', 'R', 'K', 'J', 'S', 'M'][date.getDay()] ?? '',
      active: hasDeposit,
      today: offset === 0,
    }
  })
})

const depositDetailOpen = ref(false)
const selectedDepositId = ref<string>()

function money(value: number): string {
  return hideAmounts.value ? 'Rp••••••' : formatCurrency(value)
}

function depositDeltaLabel(delta: number | null): string {
  if (delta === null) return 'Baru mulai bulan ini'
  if (delta === 0) return 'Sama dengan bulan lalu'
  return `${delta > 0 ? '+' : ''}${formatPercent(delta, 1)} vs bulan lalu`
}

function dueLabel(days: number): string {
  if (days < 0) return `Terlambat ${Math.abs(days)} hari`
  if (days === 0) return 'Jatuh tempo hari ini'
  if (days === 1) return 'Besok'
  return `${days} hari lagi`
}

function dueTone(days: number): string {
  if (days <= 1) return 'tag-danger'
  if (days <= 5) return 'tag-warning'
  return 'tag-primary'
}

function targetDeadlineLabel(deadline?: string): string {
  if (!deadline) return 'Tanpa tenggat'
  const days = daysBetween(todayKey(), deadline)
  if (days < 0) return 'Tenggat terlewat'
  if (days === 0) return 'Tenggat hari ini'
  return `${formatDateLong(deadline)} · ${days} hari lagi`
}

function openDepositDetails(id: string): void {
  selectedDepositId.value = id
  depositDetailOpen.value = true
}

function editDeposit(id: string): void {
  depositDetailOpen.value = false
  ui.openDeposit({ editId: id })
}

async function deleteDeposit(id: string): Promise<void> {
  const confirmed = await ui.askConfirm({
    title: 'Hapus setoran ini?',
    message:
      'Nominal, catatan, dan foto bukti akan dihapus. Total tabungan serta progres target akan diperbarui.',
    confirmLabel: 'Hapus setoran',
  })
  if (!confirmed) return
  if (appStore.deleteDeposit(id)) {
    depositDetailOpen.value = false
    ui.notify('Setoran dan bukti fotonya berhasil dihapus.', { title: 'Setoran dihapus' })
  }
}

async function markReminderPaid(billId: string): Promise<void> {
  const bill = appStore.data.bills.find((item) => item.id === billId)
  if (!bill) return
  const confirmed = await ui.askConfirm({
    title: `Tandai ${bill.name} lunas?`,
    message: `${money(bill.amount)} akan dicatat sebagai pengeluaran dari ${appStore.walletName(bill.walletId)}.`,
    confirmLabel: 'Tandai lunas',
    tone: 'primary',
  })
  if (!confirmed) return
  const result = appStore.markBillPaid(billId)
  if (result.ok) ui.notify(result.message ?? 'Tagihan ditandai lunas.', { title: 'Tagihan dibayar' })
  else ui.notify(result.message ?? 'Tagihan gagal diproses.', { variant: 'error' })
}
</script>

<template>
  <div>
    <PageHeader
      :title="`${greetingForNow()}, ${firstName}`"
      subtitle="Ini ringkasan keuanganmu hari ini. Kecil-kecil konsisten, lama-lama jadi besar."
    >
      <template #actions>
        <RouterLink to="/statistik" class="btn btn-secondary">
          <TrendingUp :size="16" />
          Lihat laporan
        </RouterLink>
        <button type="button" class="btn btn-primary" @click="ui.openDeposit()">
          <Plus :size="17" :stroke-width="2.5" />
          Mulai Menabung
        </button>
      </template>
    </PageHeader>

    <div class="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <section
        class="animate-rise hero-surface relative overflow-hidden rounded-[26px] p-6 text-white shadow-[0_26px_60px_-32px_rgba(47,80,55,0.7)] sm:p-7"
        style="--delay: 60ms"
        aria-label="Ringkasan total tabungan"
      >
        <div class="pointer-events-none absolute -right-12 -top-16 size-64 rounded-full border border-white/10" />
        <div class="pointer-events-none absolute -right-2 top-2 size-40 rounded-full border border-white/10" />
        <svg
          class="pointer-events-none absolute -left-8 bottom-0 h-48 w-48 text-white/10"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden="true"
        >
          <path d="M14 196C52 142 77 93 95 30" stroke="currentColor" stroke-width="2" />
          <path d="M58 146c-36-6-56-28-59-65 36 6 56 28 59 65ZM88 91c-32-13-44-38-38-72 32 13 44 38 38 72Z" fill="currentColor" />
        </svg>
        <SavingsCat
          class="pointer-events-none absolute -bottom-2 -right-7 hidden w-[255px] sm:block"
        />

        <div class="relative z-10 sm:max-w-[calc(100%-205px)]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold backdrop-blur-sm">
              <PiggyBank :size="13" />
              Total tabungan
            </span>
            <button
              type="button"
              class="flex size-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              :aria-label="hideAmounts ? 'Tampilkan nominal' : 'Sembunyikan nominal'"
              @click="appStore.updateSettings({ hideAmounts: !hideAmounts })"
            >
              <EyeOff v-if="hideAmounts" :size="15" />
              <Eye v-else :size="15" />
            </button>
          </div>

          <p class="mt-4 text-[38px] font-black leading-none tracking-[-0.05em] sm:text-[46px]">
            <AnimatedNumber :value="appStore.totalSaved" :hide="hideAmounts" />
          </p>
          <p class="mt-2.5 max-w-md text-[13px] leading-relaxed text-white/70">
            Tersimpan dari {{ appStore.data.deposits.length }} setoran.
            <span class="text-white/90">{{ money(appStore.totalWallet) }}</span> masih tersedia di dompet.
          </p>

          <div class="mt-5 max-w-md">
            <div class="mb-2 flex items-center justify-between text-[11px] font-semibold text-white/70">
              <span>
                Progres semua target
                <span class="ml-1 text-white/95">{{ formatPercent(appStore.targetCommitment.percent) }}</span>
              </span>
              <span>{{ money(appStore.targetCommitment.saved) }} / {{ money(appStore.targetCommitment.target) }}</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-white/15">
              <div
                class="h-full rounded-full bg-[#F2CC74] transition-[width] duration-[900ms] ease-out"
                :style="{ width: `${appStore.targetCommitment.percent}%` }"
              />
            </div>
          </div>

          <div class="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-[13px] bg-[#FFFDF7] px-4 py-2.5 text-sm font-black text-[#3F6047] shadow-sm transition-transform hover:-translate-y-0.5"
              @click="ui.openDeposit()"
            >
              <Plus :size="16" :stroke-width="2.6" />
              Catat setoran
            </button>
            <RouterLink
              to="/target"
              class="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
            >
              Kelola target
              <ArrowRight :size="15" />
            </RouterLink>
          </div>
        </div>
      </section>

      <section
        class="card animate-rise flex flex-col p-5 sm:p-6"
        style="--delay: 130ms"
        aria-label="Tabungan bulan ini"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="eyebrow">Tabungan bulan ini</p>
            <p class="mt-1 text-[11px] font-semibold text-muted">{{ formatMonth(new Date()) }}</p>
          </div>
          <span class="flex size-9 items-center justify-center rounded-xl bg-lavender-soft text-lavender">
            <CalendarDays :size="17" />
          </span>
        </div>
        <p class="mt-4 text-[30px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="appStore.thisMonthSummary.depositTotal" :hide="hideAmounts" />
        </p>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
            :class="
              monthDepositDelta === null
                ? 'tag-primary'
                : monthDepositDelta >= 0
                  ? 'tag-success'
                  : 'tag-danger'
            "
          >
            <TrendingUp v-if="monthDepositDelta !== null && monthDepositDelta >= 0" :size="11" />
            <TrendingDown v-else-if="monthDepositDelta !== null" :size="11" />
            {{ depositDeltaLabel(monthDepositDelta) }}
          </span>
          <span class="text-[11px] font-semibold text-muted">{{ appStore.depositsThisMonth }} setoran</span>
        </div>

        <div class="mt-5 flex h-[74px] items-end gap-2">
          <div v-for="week in weekBars" :key="week.label" class="flex flex-1 flex-col items-center gap-1.5">
            <div class="flex h-[56px] w-full items-end justify-center">
              <div
                class="w-full max-w-7 rounded-t-md transition-all duration-700"
                :style="{
                  height: `${week.height}%`,
                  backgroundColor: week.value > 0 ? 'var(--primary)' : 'var(--surface-3)',
                  opacity: week.value > 0 ? 0.85 : 1,
                }"
                :title="`${week.label}: ${money(week.value)}`"
              />
            </div>
            <span class="text-[9px] font-bold uppercase tracking-wide text-muted">{{ week.label }}</span>
          </div>
        </div>

        <div class="mt-auto flex items-center justify-between border-t border-line pt-3">
          <span class="flex items-center gap-1.5 text-[11px] font-bold text-muted">
            <Flame :size="14" class="text-warning" />
            Streak {{ appStore.streak }} hari
          </span>
          <RouterLink
            to="/setoran"
            class="flex items-center gap-1 text-[11px] font-extrabold text-primary transition-opacity hover:opacity-75"
          >
            Riwayat setoran
            <ChevronRight :size="13" />
          </RouterLink>
        </div>
      </section>
    </div>

    <div class="mt-4 grid gap-4 sm:grid-cols-3">
      <section class="card animate-rise p-5" style="--delay: 190ms">
        <div class="flex items-center justify-between">
          <span class="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Wallet :size="17" />
          </span>
          <span class="text-[10px] font-bold uppercase tracking-wide text-muted">
            {{ appStore.data.wallets.length }} dompet
          </span>
        </div>
        <p class="mt-4 text-xs font-bold text-muted">Saldo tersedia</p>
        <p class="mt-1 text-[23px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="appStore.totalWallet" :hide="hideAmounts" />
        </p>
        <p class="mt-2 text-[11px] font-semibold text-muted">
          Arus kas bulan ini
          <span :class="appStore.thisMonthSummary.balance >= 0 ? 'text-success' : 'text-danger'">
            {{ money(appStore.thisMonthSummary.balance) }}
          </span>
        </p>
      </section>

      <section class="card animate-rise p-5" style="--delay: 240ms">
        <div class="flex items-center justify-between">
          <span class="flex size-9 items-center justify-center rounded-xl bg-success-soft text-success">
            <ArrowDownRight :size="17" />
          </span>
          <span
            v-if="incomeDelta !== null"
            class="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-[10px] font-bold text-success"
          >
            <TrendingUp :size="11" />
            {{ incomeDelta >= 0 ? '+' : '' }}{{ formatPercent(incomeDelta, 1) }}
          </span>
        </div>
        <p class="mt-4 text-xs font-bold text-muted">Pemasukan bulan ini</p>
        <p class="mt-1 text-[23px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="appStore.thisMonthSummary.income" :hide="hideAmounts" />
        </p>
        <p class="mt-2 text-[11px] font-semibold text-muted">
          Dari {{ appStore.currentCategorySpending.length ? 'transaksi tercatat' : 'belum ada transaksi' }}
        </p>
      </section>

      <section class="card animate-rise p-5" style="--delay: 290ms">
        <div class="flex items-center justify-between">
          <span class="flex size-9 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <ArrowUpRight :size="17" />
          </span>
          <span
            v-if="expenseDelta !== null"
            class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
            :class="expenseDelta > 0 ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success'"
          >
            <TrendingUp :size="11" />
            {{ expenseDelta >= 0 ? '+' : '' }}{{ formatPercent(expenseDelta, 1) }}
          </span>
        </div>
        <p class="mt-4 text-xs font-bold text-muted">Pengeluaran bulan ini</p>
        <p class="mt-1 text-[23px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="appStore.thisMonthSummary.expense" :hide="hideAmounts" />
        </p>
        <p class="mt-2 text-[11px] font-semibold text-muted">
          {{ appStore.currentBudgetStatuses.filter((item) => item.state !== 'safe').length }} kategori anggaran perlu perhatian
        </p>
      </section>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
      <section class="card animate-rise p-5 sm:p-6" style="--delay: 340ms">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-base font-extrabold text-ink">Arus kas</h2>
            <p class="mt-1 text-xs text-muted">Pemasukan dan pengeluaran 6 bulan terakhir.</p>
          </div>
          <div class="flex items-center gap-3 text-[10px] font-bold text-muted">
            <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-primary" /> Pemasukan</span>
            <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-lavender" /> Pengeluaran</span>
          </div>
        </div>
        <div v-if="appStore.data.transactions.length" class="mt-4">
          <CashflowBarChart :points="appStore.monthlyPoints" />
        </div>
        <EmptyState
          v-else
          compact
          title="Belum ada arus kas"
          description="Tambahkan pemasukan atau pengeluaran pertamamu untuk melihat grafik."
          :icon="ReceiptText"
        >
          <RouterLink to="/transaksi" class="btn btn-soft btn-sm">Tambah transaksi</RouterLink>
        </EmptyState>
      </section>

      <section class="card animate-rise flex flex-col p-5 sm:p-6" style="--delay: 390ms">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-extrabold text-ink">Target tabungan</h2>
            <p class="mt-1 text-xs text-muted">Langkah kecil menuju tujuan besar.</p>
          </div>
          <RouterLink to="/target" class="flex items-center gap-1 text-[11px] font-extrabold text-primary">
            Semua
            <ArrowUpRight :size="13" />
          </RouterLink>
        </div>

        <div v-if="dashboardTargets.length" class="mt-4 space-y-4">
          <RouterLink
            v-for="entry in dashboardTargets"
            :key="entry.target.id"
            to="/target"
            class="group block"
          >
            <div class="flex items-center gap-2.5">
              <TargetIcon :name="entry.target.icon" :color="entry.progress.isComplete ? '#5B9563' : '#5F8563'" box-size="sm" :size="17" />
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="truncate text-xs font-extrabold text-ink transition-colors group-hover:text-primary">
                    {{ entry.target.name }}
                  </p>
                  <span class="shrink-0 text-[11px] font-extrabold text-ink-soft">
                    {{ formatPercent(entry.progress.percent) }}
                  </span>
                </div>
                <div class="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-muted">
                  <span>{{ money(entry.progress.saved) }} / {{ money(entry.target.targetAmount) }}</span>
                  <span v-if="entry.progress.isComplete" class="text-success">Tercapai</span>
                  <span v-else>{{ targetDeadlineLabel(entry.target.deadline).split('·')[0]?.trim() }}</span>
                </div>
                <ProgressBar
                  class="mt-1.5"
                  :value="entry.progress.percent"
                  :tone="entry.progress.isComplete ? 'success' : 'primary'"
                  height="xs"
                  :aria-label="`Progres ${entry.target.name}`"
                />
              </div>
            </div>
          </RouterLink>
        </div>
        <EmptyState
          v-else
          compact
          title="Belum punya target"
          description="Tentukan tujuan menabung agar progresmu lebih terarah."
          :icon="TargetIconLucide"
        >
          <RouterLink to="/target" class="btn btn-soft btn-sm">Buat target</RouterLink>
        </EmptyState>

        <div class="mt-auto flex items-center justify-between border-t border-line pt-3">
          <span class="flex items-center gap-1.5 text-[11px] font-bold text-muted">
            <ShieldCheck :size="14" class="text-success" />
            {{ appStore.targetCards.filter((item) => item.progress.isComplete).length }} target tercapai
          </span>
          <RouterLink to="/target" class="text-[11px] font-extrabold text-primary">Kelola</RouterLink>
        </div>
      </section>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
      <section class="card animate-rise p-5 sm:p-6" style="--delay: 430ms">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-extrabold text-ink">Setoran terbaru</h2>
            <p class="mt-1 text-xs text-muted">Bukti tabungan yang baru kamu simpan.</p>
          </div>
          <RouterLink
            to="/setoran"
            class="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-extrabold text-primary transition-colors hover:bg-primary-soft"
          >
            Lihat semua
            <ArrowUpRight :size="13" />
          </RouterLink>
        </div>

        <div v-if="appStore.recentDeposits.length" class="mt-4 divide-y divide-line">
          <button
            v-for="deposit in appStore.recentDeposits"
            :key="deposit.id"
            type="button"
            class="group flex w-full items-center gap-3 py-3 text-left first:pt-0 last:pb-0"
            @click="openDepositDetails(deposit.id)"
          >
            <div class="size-12 shrink-0 overflow-hidden rounded-xl border border-line">
              <PhotoThumb :photo-id="deposit.photoId" alt="Bukti setoran" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="text-sm font-extrabold text-ink">{{ money(deposit.amount) }}</p>
                <span
                  class="hidden items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold sm:inline-flex"
                  :class="deposit.photoId ? 'tag-success' : 'tag-warning'"
                >
                  {{ deposit.photoId ? 'Berbukti' : 'Tanpa foto' }}
                </span>
              </div>
              <p class="mt-0.5 truncate text-[11px] font-semibold text-muted">
                {{ appStore.targetName(deposit.targetId) }} · {{ formatDateLong(deposit.date) }}
              </p>
            </div>
            <ChevronRight :size="16" class="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
        <EmptyState
          v-else
          compact
          title="Belum ada setoran"
          description="Mulai kebiasaan menabung dengan mencatat setoran pertamamu."
        >
          <button type="button" class="btn btn-primary btn-sm" @click="ui.openDeposit()">
            <Plus :size="14" /> Mulai menabung
          </button>
        </EmptyState>
      </section>

      <div class="space-y-4">
        <section class="card animate-rise p-5 sm:p-6" style="--delay: 470ms">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-base font-extrabold text-ink">Anggaran bulan ini</h2>
              <p class="mt-1 text-xs text-muted">Kendali pengeluaran per kategori.</p>
            </div>
            <RouterLink to="/anggaran" class="text-[11px] font-extrabold text-primary">Atur</RouterLink>
          </div>

          <div v-if="budgetPreview.length" class="mt-4">
            <div class="flex items-center justify-between text-[11px] font-semibold text-muted">
              <span>{{ money(totalBudgetSpent) }} terpakai</span>
              <span>dari {{ money(totalBudget) }}</span>
            </div>
            <ProgressBar
              class="mt-2"
              :value="budgetPercent"
              :tone="budgetPercent >= 100 ? 'danger' : budgetPercent >= 80 ? 'warning' : 'success'"
              height="sm"
              aria-label="Total penggunaan anggaran"
            />
            <div class="mt-4 space-y-3">
              <RouterLink
                v-for="entry in budgetPreview"
                :key="entry.budget.id"
                to="/anggaran"
                class="flex items-center gap-2.5"
              >
                <CategoryIcon :name="findCategory(entry.budget.category).icon" :color="findCategory(entry.budget.category).color" box-size="sm" :size="14" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <span class="truncate text-[11px] font-bold text-ink">{{ entry.budget.category }}</span>
                    <span
                      class="text-[10px] font-extrabold"
                      :class="entry.state === 'over' ? 'text-danger' : entry.state === 'near' ? 'text-warning' : 'text-muted'"
                    >
                      {{ formatPercent(entry.percent) }}
                    </span>
                  </div>
                  <ProgressBar
                    class="mt-1"
                    :value="entry.percent"
                    :tone="entry.state === 'over' ? 'danger' : entry.state === 'near' ? 'warning' : 'success'"
                    height="xs"
                    :aria-label="`Anggaran ${entry.budget.category}`"
                  />
                </div>
              </RouterLink>
            </div>
          </div>
          <EmptyState
            v-else
            compact
            title="Anggaran belum diatur"
            description="Tetapkan batas pengeluaran agar bulan ini lebih terkendali."
            :icon="WalletCards"
          >
            <RouterLink to="/anggaran" class="btn btn-soft btn-sm">Buat anggaran</RouterLink>
          </EmptyState>
        </section>

        <section class="card animate-rise p-5 sm:p-6" style="--delay: 510ms">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="flex items-center gap-2 text-base font-extrabold text-ink">
                Pengingat
                <span
                  v-if="reminders.length"
                  class="flex size-5 items-center justify-center rounded-full bg-primary-soft text-[10px] font-extrabold text-primary"
                >
                  {{ reminders.length }}
                </span>
              </h2>
              <p class="mt-1 text-xs text-muted">Tagihan dan tenggat terdekat.</p>
            </div>
            <span class="flex size-9 items-center justify-center rounded-xl bg-warning-soft text-warning">
              <BellRing :size="16" />
            </span>
          </div>

          <div v-if="reminders.length" class="mt-4 space-y-2.5">
            <div
              v-for="reminder in reminders"
              :key="reminder.key"
              class="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 p-2.5"
            >
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-lg"
                :class="reminder.type === 'bill' ? 'bg-primary-soft text-primary' : 'bg-lavender-soft text-lavender'"
              >
                <ReceiptText v-if="reminder.type === 'bill'" :size="14" />
                <TargetIconLucide v-else :size="14" />
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="truncate text-[11px] font-extrabold text-ink">{{ reminder.title }}</p>
                  <span class="chip shrink-0 px-1.5 py-0.5 text-[9px]" :class="dueTone(reminder.days)">
                    {{ dueLabel(reminder.days) }}
                  </span>
                </div>
                <div class="mt-0.5 flex items-center justify-between gap-2">
                  <p class="text-[10px] font-semibold text-muted">
                    {{ reminder.type === 'bill' ? money(reminder.amount) : 'Target menabung' }}
                  </p>
                  <button
                    v-if="reminder.type === 'bill'"
                    type="button"
                    class="text-[9px] font-extrabold text-primary hover:underline"
                    @click="markReminderPaid(reminder.id)"
                  >
                    Tandai lunas
                  </button>
                </div>
              </div>
            </div>
            <RouterLink to="/tagihan" class="flex items-center justify-center gap-1 pt-1 text-[10px] font-bold text-muted hover:text-ink">
              Kelola tagihan
              <ChevronRight :size="12" />
            </RouterLink>
          </div>
          <div v-else class="mt-4 flex items-center gap-3 rounded-xl bg-success-soft/60 p-3">
            <ShieldCheck :size="20" class="text-success" />
            <div>
              <p class="text-[11px] font-extrabold text-ink">Tidak ada yang mendesak</p>
              <p class="mt-0.5 text-[10px] text-muted">Tagihan dan target aman untuk saat ini.</p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <section
      class="animate-rise mt-4 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
      style="--delay: 550ms"
    >
      <div class="flex items-center gap-3.5">
        <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-warning-soft text-warning">
          <Flame :size="21" />
        </span>
        <div>
          <p class="text-sm font-extrabold text-ink">
            Streak {{ appStore.streak }} hari
            <span class="font-semibold text-muted">· rekor {{ appStore.bestStreak }} hari</span>
          </p>
          <p class="mt-0.5 text-[11px] text-muted">
            7 hari terakhir aktivitas menabungmu.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5">
          <span
            v-for="day in streakDays"
            :key="day.key"
            class="flex size-7 items-center justify-center rounded-lg text-[9px] font-extrabold"
            :class="
              day.active
                ? 'bg-success text-white dark:text-[#172117]'
                : day.today
                  ? 'border border-primary/40 bg-primary-soft text-primary'
                  : 'bg-surface-2 text-muted'
            "
            :title="day.key"
          >
            {{ day.active ? '✓' : day.label }}
          </span>
        </div>
        <RouterLink to="/tantangan" class="btn btn-secondary btn-sm">
          Lihat tantangan
          <ArrowRight :size="13" />
        </RouterLink>
      </div>
    </section>

    <DepositDetailModal
      :open="depositDetailOpen"
      :deposit-id="selectedDepositId"
      @close="depositDetailOpen = false"
      @edit="editDeposit"
      @delete="deleteDeposit"
    />
  </div>
</template>
