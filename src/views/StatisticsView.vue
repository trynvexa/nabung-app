<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChartPie,
  CheckCircle2,
  PiggyBank,
  Plus,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from '@lucide/vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import {
  categorySpending,
  comparePercent,
  monthlySeries,
  savingsRate,
  targetProgress,
} from '@/lib/calc'
import { findCategory } from '@/lib/categories'
import { formatDateShort, formatMonth, monthKey } from '@/lib/date'
import { formatCurrency, formatPercent } from '@/lib/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import TargetIcon from '@/components/ui/TargetIcon.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import CashflowBarChart from '@/components/charts/CashflowBarChart.vue'
import ExpenseDonutChart from '@/components/charts/ExpenseDonutChart.vue'
import SavingsLineChart from '@/components/charts/SavingsLineChart.vue'

type PeriodOption = 3 | 6 | 12

interface CategoryRow {
  category: string
  amount: number
  color: string
  share: number
  previous: number
  delta: number | null
}

const appStore = useAppStore()
const ui = useUiStore()

const hideAmounts = computed(() => appStore.data.settings.hideAmounts)
const currentMonth = appStore.currentMonth
const previousMonth = appStore.previousMonth

const period = ref<PeriodOption>(6)
const periodOptions: Array<{ value: PeriodOption; label: string }> = [
  { value: 3, label: '3 bulan' },
  { value: 6, label: '6 bulan' },
  { value: 12, label: '12 bulan' },
]

function money(value: number): string {
  return hideAmounts.value ? 'Rp••••••' : formatCurrency(value)
}

const points = computed(() => monthlySeries(appStore.data, period.value))
const labels = computed(() => points.value.map((point) => point.label))
const periodIncome = computed(() => points.value.reduce((total, point) => total + point.income, 0))
const periodExpense = computed(() => points.value.reduce((total, point) => total + point.expense, 0))
const periodDeposits = computed(() => points.value.reduce((total, point) => total + point.deposits, 0))
const averageMonthly = computed(() => periodDeposits.value / period.value)
const averageIncome = computed(() => periodIncome.value / period.value)
const periodDepositCount = computed(() =>
  appStore.data.deposits.filter((deposit) => {
    const key = monthKey(deposit.date)
    const first = points.value[0]?.key
    return first ? key >= first && key <= currentMonth : false
  }).length,
)

const cumulativeSavings = computed(() =>
  points.value.map((point) =>
    appStore.data.deposits
      .filter((deposit) => monthKey(deposit.date) <= point.key)
      .reduce((total, deposit) => total + deposit.amount, 0),
  ),
)
const currentSavingsRate = computed(() => savingsRate(appStore.data, currentMonth))

const expenseDelta = computed(() =>
  comparePercent(appStore.thisMonthSummary.expense, appStore.previousMonthSummary.expense),
)
const incomeDelta = computed(() =>
  comparePercent(appStore.thisMonthSummary.income, appStore.previousMonthSummary.income),
)
const depositDelta = computed(() =>
  comparePercent(
    appStore.thisMonthSummary.depositTotal,
    appStore.previousMonthSummary.depositTotal,
  ),
)

const comparisonRows = computed(() => {
  const max = Math.max(
    appStore.thisMonthSummary.income,
    appStore.previousMonthSummary.income,
    appStore.thisMonthSummary.expense,
    appStore.previousMonthSummary.expense,
    appStore.thisMonthSummary.depositTotal,
    appStore.previousMonthSummary.depositTotal,
    1,
  )
  return [
    {
      id: 'income',
      label: 'Pemasukan',
      current: appStore.thisMonthSummary.income,
      previous: appStore.previousMonthSummary.income,
      delta: incomeDelta.value,
      goodWhenUp: true,
    },
    {
      id: 'expense',
      label: 'Pengeluaran',
      current: appStore.thisMonthSummary.expense,
      previous: appStore.previousMonthSummary.expense,
      delta: expenseDelta.value,
      goodWhenUp: false,
    },
    {
      id: 'deposit',
      label: 'Tabungan',
      current: appStore.thisMonthSummary.depositTotal,
      previous: appStore.previousMonthSummary.depositTotal,
      delta: depositDelta.value,
      goodWhenUp: true,
    },
  ].map((row) => ({
    ...row,
    currentWidth: Math.max((row.current / max) * 100, row.current > 0 ? 4 : 0),
    previousWidth: Math.max((row.previous / max) * 100, row.previous > 0 ? 4 : 0),
  }))
})

function deltaText(delta: number | null): string {
  if (delta === null) return 'Baru bulan ini'
  if (delta === 0) return 'Sama dengan bulan lalu'
  return `${delta > 0 ? '+' : ''}${formatPercent(delta, 1)} vs bulan lalu`
}

function deltaTone(delta: number | null, goodWhenUp: boolean): string {
  if (delta === null || delta === 0) return 'tag-primary'
  const positive = delta > 0
  return positive === goodWhenUp ? 'tag-success' : 'tag-danger'
}

const currentCategoryItems = computed(() => categorySpending(appStore.data, currentMonth))
const previousCategoryItems = computed(() => categorySpending(appStore.data, previousMonth))
const currentExpenseTotal = computed(() =>
  currentCategoryItems.value.reduce((total, item) => total + item.amount, 0),
)
const categoryRows = computed<CategoryRow[]>(() => {
  const previousMap = new Map(
    previousCategoryItems.value.map((item) => [item.category, item.amount]),
  )
  return currentCategoryItems.value.map((item) => {
    const previous = previousMap.get(item.category) ?? 0
    return {
      category: item.category,
      amount: item.amount,
      color: item.color,
      share:
        currentExpenseTotal.value > 0 ? (item.amount / currentExpenseTotal.value) * 100 : 0,
      previous,
      delta: comparePercent(item.amount, previous),
    }
  })
})
const topCategory = computed(() => categoryRows.value[0])

function categoryDeltaTone(delta: number | null): string {
  if (delta === null || delta === 0) return 'tag-primary'
  return delta > 0 ? 'tag-danger' : 'tag-success'
}

const targetList = computed(() =>
  [...appStore.targetCards].sort((a, b) => {
    if (a.progress.isComplete !== b.progress.isComplete) return a.progress.isComplete ? 1 : -1
    const rank = { high: 0, medium: 1, low: 2 }
    return rank[a.target.priority] - rank[b.target.priority]
  }),
)
const completedTargets = computed(
  () => appStore.targetCards.filter((card) => card.progress.isComplete).length,
)
const emergencyCard = computed(() =>
  appStore.targetCards.find((card) => card.target.isEmergencyFund),
)

const insightText = computed(() => {
  if (appStore.thisMonthSummary.income <= 0) {
    return 'Belum ada pemasukan tercatat bulan ini. Tambahkan pemasukan agar rasio menabung bisa dihitung dengan tepat.'
  }
  if (currentSavingsRate.value >= 20) {
    return `Kamu menyisihkan ${formatPercent(currentSavingsRate.value, 1)} dari pemasukan bulan ini. Pertahankan ritme ini agar target lebih cepat tercapai.`
  }
  if (currentSavingsRate.value > 0) {
    return `Rasio menabung bulan ini ${formatPercent(currentSavingsRate.value, 1)}. Menambah sedikit lagi secara rutin akan membuat perbedaan besar dalam jangka panjang.`
  }
  return 'Pemasukan bulan ini belum diikuti setoran tabungan. Mulai dari nominal kecil agar kebiasaan tetap berjalan.'
})

function targetEstimateLabel(card: (typeof appStore.targetCards)[number]): string {
  if (card.progress.isComplete) return 'Target tercapai'
  if (!card.estimate) return 'Belum ada perkiraan'
  return `Perkiraan selesai ${formatDateShort(card.estimate)}`
}

function targetSaved(card: (typeof appStore.targetCards)[number]): number {
  return targetProgress(card.target, appStore.data.deposits).saved
}
</script>

<template>
  <div>
    <PageHeader
      title="Statistik"
      subtitle="Lihat pola pemasukan, pengeluaran, dan tabungan dari waktu ke waktu. Angka yang jujur membantu keputusan yang lebih baik."
      eyebrow="Analisis keuangan"
    >
      <template #actions>
        <button type="button" class="btn btn-secondary" @click="ui.openDeposit()">
          <Plus :size="16" />
          Catat Setoran
        </button>
        <RouterLink to="/target" class="btn btn-primary">
          <Target :size="16" />
          Lihat Target
        </RouterLink>
      </template>
    </PageHeader>

    <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
        <button
          v-for="option in periodOptions"
          :key="option.value"
          type="button"
          class="rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors"
          :class="period === option.value ? 'bg-primary-soft text-primary' : 'text-muted hover:text-ink'"
          @click="period = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <p class="text-[11px] font-semibold text-muted">
        Menampilkan {{ points.length }} bulan terakhir · {{ periodDepositCount }} setoran
      </p>
    </div>

    <div class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <section class="card animate-rise p-5" style="--delay: 40ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Total pemasukan</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-success-soft text-success">
            <ArrowDownRight :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[22px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="periodIncome" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[10px] font-semibold text-muted">
          Rata-rata {{ money(averageIncome) }} per bulan
        </p>
      </section>

      <section class="card animate-rise p-5" style="--delay: 80ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Total pengeluaran</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-danger-soft text-danger">
            <ArrowUpRight :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[22px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="periodExpense" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[10px] font-semibold text-muted">
          {{ periodIncome > 0 ? formatPercent((periodExpense / periodIncome) * 100, 1) : '—' }} dari pemasukan
        </p>
      </section>

      <section class="card animate-rise p-5" style="--delay: 120ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Total tabungan</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <PiggyBank :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[22px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="periodDeposits" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[10px] font-semibold text-muted">
          Dari setoran tabungan, bukan pengeluaran
        </p>
      </section>

      <section class="card animate-rise p-5" style="--delay: 160ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Rata-rata menabung</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-lavender-soft text-lavender">
            <TrendingUp :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[22px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="averageMonthly" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[10px] font-semibold text-muted">per bulan dalam periode ini</p>
      </section>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <section class="card animate-rise p-5 sm:p-6" style="--delay: 200ms">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-base font-extrabold text-ink">Arus kas</h2>
            <p class="mt-1 text-xs text-muted">Pemasukan dan pengeluaran {{ period }} bulan terakhir.</p>
          </div>
          <div class="flex items-center gap-3 text-[10px] font-bold text-muted">
            <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-primary" /> Pemasukan</span>
            <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-lavender" /> Pengeluaran</span>
          </div>
        </div>
        <div v-if="appStore.data.transactions.length" class="mt-4">
          <CashflowBarChart :points="points" />
        </div>
        <EmptyState
          v-else
          compact
          :icon="ReceiptText"
          title="Belum ada arus kas"
          description="Tambahkan transaksi pemasukan atau pengeluaran untuk mulai melihat pola keuanganmu."
        />
      </section>

      <section class="card animate-rise p-5 sm:p-6" style="--delay: 240ms">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-extrabold text-ink">Bulan ini vs lalu</h2>
            <p class="mt-1 text-xs text-muted">
              {{ formatMonth(`${currentMonth}-01`) }} dibandingkan {{ formatMonth(`${previousMonth}-01`) }}.
            </p>
          </div>
          <span class="flex size-9 items-center justify-center rounded-xl bg-surface-2 text-muted">
            <TrendingUp :size="16" />
          </span>
        </div>

        <div class="mt-4 space-y-4">
          <div v-for="row in comparisonRows" :key="row.id">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs font-extrabold text-ink">{{ row.label }}</p>
                <p class="mt-0.5 text-[10px] font-semibold text-muted">{{ money(row.current) }}</p>
              </div>
              <span class="chip px-1.5 py-0.5 text-[9px]" :class="deltaTone(row.delta, row.goodWhenUp)">
                <TrendingUp v-if="row.delta !== null && row.delta > 0" :size="9" />
                <TrendingDown v-else-if="row.delta !== null && row.delta < 0" :size="9" />
                {{ deltaText(row.delta) }}
              </span>
            </div>
            <div class="mt-2 space-y-1.5">
              <div class="flex items-center gap-2">
                <span class="w-[52px] shrink-0 text-[9px] font-bold text-muted">Sekarang</span>
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div
                    class="h-full rounded-full bg-primary transition-[width] duration-700"
                    :style="{ width: `${row.currentWidth}%` }"
                  />
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-[52px] shrink-0 text-[9px] font-semibold text-muted">Lalu</span>
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div
                    class="h-full rounded-full bg-line-strong transition-[width] duration-700"
                    :style="{ width: `${row.previousWidth}%` }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between border-t border-line pt-3">
          <span class="flex items-center gap-1.5 text-[10px] font-bold text-muted">
            <Sparkles :size="12" class="text-lavender" />
            Rasio menabung bulan ini
          </span>
          <span class="text-xs font-extrabold text-primary">{{ formatPercent(currentSavingsRate, 1) }}</span>
        </div>
      </section>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
      <section class="card animate-rise p-5 sm:p-6" style="--delay: 280ms">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-extrabold text-ink">Posisi tabungan</h2>
            <p class="mt-1 text-xs text-muted">Akumulasi seluruh setoran hingga akhir setiap bulan.</p>
          </div>
          <span class="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <PiggyBank :size="16" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="appStore.totalSaved" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[10px] font-semibold text-muted">Total tabungan yang tersimpan saat ini</p>
        <div v-if="appStore.data.deposits.length" class="mt-4">
          <SavingsLineChart :labels="labels" :values="cumulativeSavings" />
        </div>
        <EmptyState
          v-else
          compact
          :icon="PiggyBank"
          title="Belum ada tabungan"
          description="Setoran pertamamu akan mulai membentuk grafik pertumbuhan di sini."
        />
      </section>

      <section class="card animate-rise p-5 sm:p-6" style="--delay: 320ms">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-extrabold text-ink">Pengeluaran per kategori</h2>
            <p class="mt-1 text-xs text-muted">{{ formatMonth(`${currentMonth}-01`) }} · dibandingkan bulan lalu.</p>
          </div>
          <span class="flex size-9 items-center justify-center rounded-xl bg-warning-soft text-warning">
            <ChartPie :size="16" />
          </span>
        </div>

        <div v-if="categoryRows.length" class="mt-4 grid gap-5 sm:grid-cols-[0.85fr_1.15fr] sm:items-center">
          <div class="relative">
            <ExpenseDonutChart :items="currentCategoryItems" />
            <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-[10px] font-bold text-muted">Total</span>
              <span class="mt-0.5 text-sm font-extrabold text-ink">{{ money(currentExpenseTotal) }}</span>
            </div>
          </div>
          <div class="space-y-3">
            <div v-for="entry in categoryRows" :key="entry.category">
              <div class="flex items-center gap-2">
                <CategoryIcon
                  :name="findCategory(entry.category).icon"
                  :color="entry.color"
                  :size="12"
                  box-size="sm"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <p class="truncate text-[11px] font-bold text-ink">{{ entry.category }}</p>
                    <span class="shrink-0 text-[10px] font-extrabold text-ink">{{ money(entry.amount) }}</span>
                  </div>
                  <div class="mt-1 flex items-center justify-between gap-2">
                    <span class="text-[9px] font-semibold text-muted">{{ formatPercent(entry.share, 1) }} bulan ini</span>
                    <span class="chip px-1 py-0 text-[8px]" :class="categoryDeltaTone(entry.delta)">
                      {{ entry.delta === null ? 'baru' : entry.delta === 0 ? 'sama' : `${entry.delta > 0 ? '+' : ''}${formatPercent(entry.delta, 0)}` }}
                    </span>
                  </div>
                </div>
              </div>
              <ProgressBar
                class="mt-1.5"
                :value="entry.share"
                :color="entry.color"
                height="xs"
                :aria-label="`Porsi pengeluaran ${entry.category}`"
              />
            </div>
          </div>
        </div>

        <EmptyState
          v-else
          compact
          :icon="ReceiptText"
          title="Belum ada pengeluaran bulan ini"
          description="Kategori pengeluaran akan muncul setelah ada transaksi pengeluaran."
        />
      </section>
    </div>

    <div class="mt-4 grid items-start gap-4 lg:grid-cols-[1.45fr_1fr]">
      <section class="card animate-rise overflow-hidden" style="--delay: 360ms">
        <div class="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 class="text-base font-extrabold text-ink">Ringkasan target</h2>
            <p class="mt-1 text-xs text-muted">
              {{ completedTargets }} dari {{ appStore.data.targets.length }} target sudah tercapai.
            </p>
          </div>
          <RouterLink to="/target" class="btn btn-secondary btn-sm">
            Kelola
            <ArrowRight :size="13" />
          </RouterLink>
        </div>

        <div v-if="targetList.length" class="divide-y divide-line">
          <div
            v-for="card in targetList"
            :key="card.target.id"
            class="flex items-start gap-3 px-5 py-4 sm:px-6"
          >
            <TargetIcon
              :name="card.target.icon"
              :color="card.progress.isComplete ? '#24AD7A' : '#5278F6'"
              :size="16"
              box-size="sm"
            />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div class="flex items-center gap-2">
                    <p class="text-xs font-extrabold text-ink">{{ card.target.name }}</p>
                    <ShieldCheck v-if="card.target.isEmergencyFund" :size="12" class="text-success" />
                    <span v-if="card.progress.isComplete" class="chip tag-success px-1.5 py-0 text-[8px]">
                      <CheckCircle2 :size="8" />
                      Tercapai
                    </span>
                  </div>
                  <p class="mt-1 text-[10px] font-semibold text-muted">{{ targetEstimateLabel(card) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-xs font-extrabold text-ink">{{ formatPercent(card.progress.percent) }}</p>
                  <p class="mt-0.5 text-[9px] font-semibold text-muted">
                    {{ money(targetSaved(card)) }} / {{ money(card.target.targetAmount) }}
                  </p>
                </div>
              </div>
              <ProgressBar
                class="mt-2"
                :value="card.progress.percent"
                :tone="card.progress.isComplete ? 'success' : card.target.priority === 'high' ? 'warning' : 'primary'"
                height="xs"
                :aria-label="`Progres target ${card.target.name}`"
              />
            </div>
          </div>
        </div>

        <EmptyState
          v-else
          compact
          :icon="Target"
          title="Belum ada target"
          description="Buat target tabungan untuk melihat ringkasan dan perkiraan waktunya di sini."
        />
      </section>

      <div class="space-y-4">
        <section class="card animate-rise p-5 sm:p-6" style="--delay: 400ms">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-ink">Progres semua target</h2>
              <p class="mt-1 text-[11px] text-muted">Dana yang sudah dialokasikan untuk target.</p>
            </div>
            <span class="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Target :size="16" />
            </span>
          </div>
          <p class="mt-4 text-[26px] font-extrabold tracking-tight text-ink">
            <AnimatedNumber :value="appStore.targetCommitment.saved" :hide="hideAmounts" />
          </p>
          <p class="mt-1 text-[11px] font-semibold text-muted">
            dari {{ money(appStore.targetCommitment.target) }} total komitmen target
          </p>
          <ProgressBar
            class="mt-3"
            :value="appStore.targetCommitment.percent"
            tone="primary"
            aria-label="Progres seluruh target"
          />
          <div class="mt-2 flex items-center justify-between text-[10px] font-bold">
            <span class="text-muted">{{ formatPercent(appStore.targetCommitment.percent) }}</span>
            <span class="text-primary">{{ formatPercent(100 - appStore.targetCommitment.percent) }} lagi</span>
          </div>
        </section>

        <section
          v-if="emergencyCard"
          class="animate-rise rounded-2xl border border-success/20 bg-success-soft/50 p-5"
          style="--delay: 440ms"
        >
          <div class="flex items-start justify-between gap-3">
            <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-success">
              <ShieldCheck :size="17" />
            </span>
            <span class="text-xs font-extrabold text-success">{{ formatPercent(emergencyCard.progress.percent) }}</span>
          </div>
          <p class="mt-3 text-xs font-extrabold text-ink">Dana darurat</p>
          <p class="mt-1 text-[11px] leading-relaxed text-muted">
            {{ money(emergencyCard.progress.saved) }} dari {{ money(emergencyCard.target.targetAmount) }}.
            Jaring pengaman ini membantu saat ada kebutuhan tak terduga.
          </p>
          <ProgressBar
            class="mt-3"
            :value="emergencyCard.progress.percent"
            tone="success"
            height="xs"
            aria-label="Progres dana darurat"
          />
        </section>

        <section class="animate-rise rounded-2xl border border-lavender/25 bg-lavender-soft/50 p-5" style="--delay: 480ms">
          <div class="flex items-start gap-3">
            <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-lavender">
              <Sparkles :size="16" />
            </span>
            <div>
              <p class="text-xs font-extrabold text-ink">Catatan untukmu</p>
              <p class="mt-1 text-[11px] leading-relaxed text-muted">{{ insightText }}</p>
              <p v-if="topCategory" class="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-ink-soft">
                <Wallet :size="11" />
                Kategori terbesar: {{ topCategory.category }} ({{ money(topCategory.amount) }})
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
