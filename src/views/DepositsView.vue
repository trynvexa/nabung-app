<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ArrowUpDown,
  CalendarDays,
  Camera,
  ChevronDown,
  Image as ImageIcon,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Wallet,
} from '@lucide/vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { addDays, formatDateLong, formatTime, formatWeekday, toDateKey, todayKey } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import PhotoThumb from '@/components/ui/PhotoThumb.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import DepositDetailModal from '@/components/deposits/DepositDetailModal.vue'

type PeriodOption = 'all' | 'this-month' | 'last-month' | '30-days' | '90-days' | 'custom'
type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest'

const appStore = useAppStore()
const ui = useUiStore()

const search = ref('')
const targetFilter = ref('')
const period = ref<PeriodOption>('all')
const fromDate = ref('')
const toDate = ref('')
const sortBy = ref<SortOption>('newest')
const visibleCount = ref(12)
const selectedDepositId = ref<string>()
const detailOpen = ref(false)

const hideAmounts = computed(() => appStore.data.settings.hideAmounts)
const thisMonthTotal = computed(() => appStore.thisMonthSummary.depositTotal)
const proofCount = computed(() => appStore.data.deposits.filter((item) => item.photoId).length)
const proofPercent = computed(() =>
  appStore.data.deposits.length > 0
    ? Math.round((proofCount.value / appStore.data.deposits.length) * 100)
    : 0,
)

const filteredDeposits = computed(() => {
  const term = search.value.trim().toLowerCase()
  const today = todayKey()
  let from = ''
  let to = ''
  if (period.value === 'this-month') {
    from = `${today.slice(0, 7)}-01`
    to = today
  } else if (period.value === 'last-month') {
    const firstThisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const lastMonth = new Date(firstThisMonth.getFullYear(), firstThisMonth.getMonth() - 1, 1)
    const lastDay = new Date(firstThisMonth.getFullYear(), firstThisMonth.getMonth(), 0)
    from = toDateKey(lastMonth)
    to = toDateKey(lastDay)
  } else if (period.value === '30-days') {
    from = toDateKey(addDays(new Date(), -30))
    to = today
  } else if (period.value === '90-days') {
    from = toDateKey(addDays(new Date(), -90))
    to = today
  } else if (period.value === 'custom') {
    from = fromDate.value
    to = toDate.value
  }

  return appStore.data.deposits
    .filter((deposit) => {
      const dateKey = toDateKey(deposit.date)
      if (from && dateKey < from) return false
      if (to && dateKey > to) return false
      if (targetFilter.value === 'none' && deposit.targetId) return false
      if (targetFilter.value && targetFilter.value !== 'none' && deposit.targetId !== targetFilter.value)
        return false
      if (!term) return true
      const haystack = `${deposit.note} ${appStore.targetName(deposit.targetId)} ${deposit.amount}`.toLowerCase()
      return haystack.includes(term)
    })
    .sort((a, b) => {
      if (sortBy.value === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortBy.value === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sortBy.value === 'highest') return b.amount - a.amount
      return a.amount - b.amount
    })
})

const displayedDeposits = computed(() => filteredDeposits.value.slice(0, visibleCount.value))
const hasMore = computed(() => filteredDeposits.value.length > visibleCount.value)
const groupedDeposits = computed(() => {
  if (sortBy.value === 'highest' || sortBy.value === 'lowest') {
    return [{ key: 'all', label: 'Semua setoran', total: filteredDeposits.value.reduce((sum, d) => sum + d.amount, 0), deposits: displayedDeposits.value }]
  }
  const groups: Array<{ key: string; label: string; total: number; deposits: typeof displayedDeposits.value }> = []
  for (const deposit of displayedDeposits.value) {
    const key = toDateKey(deposit.date)
    const existing = groups.find((group) => group.key === key)
    if (existing) {
      existing.deposits.push(deposit)
      existing.total += deposit.amount
    } else {
      groups.push({
        key,
        label:
          key === todayKey()
            ? 'Hari ini'
            : key === toDateKey(addDays(new Date(), -1))
              ? 'Kemarin'
              : `${formatWeekday(deposit.date)}, ${formatDateLong(deposit.date)}`,
        total: deposit.amount,
        deposits: [deposit],
      })
    }
  }
  return groups
})

const activeFilterCount = computed(() => {
  let count = 0
  if (search.value.trim()) count += 1
  if (targetFilter.value) count += 1
  if (period.value !== 'all') count += 1
  if (fromDate.value || toDate.value) count += 1
  return count
})

watch([search, targetFilter, period, fromDate, toDate, sortBy], () => {
  visibleCount.value = 12
})

function money(value: number): string {
  return hideAmounts.value ? 'Rp••••••' : formatCurrency(value)
}

function resetFilters(): void {
  search.value = ''
  targetFilter.value = ''
  period.value = 'all'
  fromDate.value = ''
  toDate.value = ''
  sortBy.value = 'newest'
  visibleCount.value = 12
}

function openDetail(id: string): void {
  selectedDepositId.value = id
  detailOpen.value = true
}

function editDeposit(id: string): void {
  detailOpen.value = false
  ui.openDeposit({ editId: id })
}

async function deleteDeposit(id: string): Promise<void> {
  const deposit = appStore.data.deposits.find((item) => item.id === id)
  if (!deposit) return
  const confirmed = await ui.askConfirm({
    title: 'Hapus setoran ini?',
    message: `${money(deposit.amount)} dari ${formatDateLong(deposit.date)} akan dihapus${deposit.photoId ? ' beserta foto buktinya' : ''}. Total tabungan dan progres target ikut diperbarui.`,
    confirmLabel: 'Hapus setoran',
  })
  if (!confirmed) return
  if (appStore.deleteDeposit(id)) {
    detailOpen.value = false
    ui.notify('Setoran dan bukti fotonya berhasil dihapus.', { title: 'Setoran dihapus' })
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Setoran Tabungan"
      subtitle="Setiap setoran punya cerita dan buktinya. Simpan dokumentasi pribadimu di sini."
      eyebrow="Menabung berbukti"
    >
      <template #actions>
        <button type="button" class="btn btn-primary" @click="ui.openDeposit()">
          <Plus :size="17" :stroke-width="2.5" />
          Mulai Menabung
        </button>
      </template>
    </PageHeader>

    <div class="mt-6 grid gap-4 sm:grid-cols-3">
      <section class="card animate-rise p-5" style="--delay: 50ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Total tabungan</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Wallet :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="appStore.totalSaved" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">Dari seluruh setoran tercatat</p>
      </section>
      <section class="card animate-rise p-5" style="--delay: 90ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Bulan ini</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-lavender-soft text-lavender">
            <CalendarDays :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="thisMonthTotal" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">
          {{ appStore.depositsThisMonth }} setoran di {{ new Date().toLocaleDateString('id-ID', { month: 'long' }) }}
        </p>
      </section>
      <section class="card animate-rise p-5" style="--delay: 130ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Kelengkapan bukti</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-success-soft text-success">
            <Camera :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-ink">{{ proofPercent }}%</p>
        <p class="mt-1 text-[11px] font-semibold text-muted">
          {{ proofCount }} dari {{ appStore.data.deposits.length }} setoran memiliki foto
        </p>
      </section>
    </div>

    <section class="card animate-rise mt-4 p-4 sm:p-5" style="--delay: 170ms">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end">
        <div class="relative flex-1">
          <label for="deposit-search" class="label">Cari setoran</label>
          <Search :size="15" class="pointer-events-none absolute bottom-3.5 left-3.5 text-muted" />
          <input
            id="deposit-search"
            v-model="search"
            type="search"
            class="input pl-9"
            placeholder="Cari catatan, target, atau nominal…"
          />
        </div>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:w-auto">
          <div>
            <label for="deposit-filter-target" class="label">Target</label>
            <select id="deposit-filter-target" v-model="targetFilter" class="select min-w-0">
              <option value="">Semua target</option>
              <option v-for="target in appStore.data.targets" :key="target.id" :value="target.id">
                {{ target.name }}
              </option>
              <option value="none">Tabungan umum</option>
            </select>
          </div>
          <div>
            <label for="deposit-filter-period" class="label">Periode</label>
            <select id="deposit-filter-period" v-model="period" class="select min-w-0">
              <option value="all">Semua waktu</option>
              <option value="this-month">Bulan ini</option>
              <option value="last-month">Bulan lalu</option>
              <option value="30-days">30 hari terakhir</option>
              <option value="90-days">90 hari terakhir</option>
              <option value="custom">Rentang kustom</option>
            </select>
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label for="deposit-sort" class="label">Urutkan</label>
            <select id="deposit-sort" v-model="sortBy" class="select min-w-0">
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="highest">Nominal terbesar</option>
              <option value="lowest">Nominal terkecil</option>
            </select>
          </div>
        </div>
        <button
          v-if="activeFilterCount"
          type="button"
          class="btn btn-secondary shrink-0"
          @click="resetFilters"
        >
          <RotateCcw :size="14" />
          Reset
        </button>
      </div>

      <div v-if="period === 'custom'" class="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <label for="deposit-from" class="label">Dari tanggal</label>
          <input id="deposit-from" v-model="fromDate" type="date" class="input" />
        </div>
        <div>
          <label for="deposit-to" class="label">Sampai tanggal</label>
          <input id="deposit-to" v-model="toDate" type="date" class="input" />
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <p class="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
          <ArrowUpDown :size="13" />
          {{ filteredDeposits.length }} setoran ditemukan
        </p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="preset in [
              { label: 'Semua', value: 'all' },
              { label: 'Bulan ini', value: 'this-month' },
              { label: '30 hari', value: '30-days' },
              { label: '90 hari', value: '90-days' },
            ]"
            :key="preset.value"
            type="button"
            class="rounded-lg px-2.5 py-1 text-[10px] font-bold transition-colors"
            :class="period === preset.value ? 'bg-primary text-white dark:text-[#172117]' : 'bg-surface-3 text-muted hover:text-ink'"
            @click="period = preset.value as PeriodOption"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>
    </section>

    <section class="card animate-rise mt-4 overflow-hidden" style="--delay: 210ms">
      <div class="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
        <div>
          <h2 class="text-base font-extrabold text-ink">Riwayat setoran</h2>
          <p class="mt-0.5 text-xs text-muted">Urutan berdasarkan {{ sortBy === 'highest' || sortBy === 'lowest' ? 'nominal' : 'tanggal' }}.</p>
        </div>
        <span class="chip">{{ displayedDeposits.length }}/{{ filteredDeposits.length }}</span>
      </div>

      <div v-if="groupedDeposits.length" class="divide-y divide-line">
        <div v-for="group in groupedDeposits" :key="group.key">
          <div class="flex items-center justify-between bg-surface-2/60 px-4 py-2.5 sm:px-6">
            <p class="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted">{{ group.label }}</p>
            <p class="text-[10px] font-bold text-muted">Total {{ money(group.total) }}</p>
          </div>
          <div class="divide-y divide-line">
            <div
              v-for="deposit in group.deposits"
              :key="deposit.id"
              class="group flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 sm:gap-4 sm:px-6"
              role="button"
              tabindex="0"
              @click="openDetail(deposit.id)"
              @keydown.enter="openDetail(deposit.id)"
            >
              <button
                type="button"
                class="size-14 shrink-0 overflow-hidden rounded-xl border border-line sm:size-16"
                :aria-label="`Lihat bukti setoran ${money(deposit.amount)}`"
                @click.stop="openDetail(deposit.id)"
              >
                <PhotoThumb :photo-id="deposit.photoId" alt="Bukti setoran" />
              </button>
              <div class="min-w-0 flex-1 pt-0.5">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-[15px] font-extrabold tracking-tight text-ink">{{ money(deposit.amount) }}</p>
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                    :class="deposit.photoId ? 'tag-success' : 'tag-warning'"
                  >
                    {{ deposit.photoId ? 'Bukti tersimpan' : 'Tanpa foto' }}
                  </span>
                </div>
                <p class="mt-0.5 text-[11px] font-bold text-muted">
                  {{ deposit.targetId ? appStore.targetName(deposit.targetId) : 'Tabungan umum' }}
                  <span class="font-medium">· {{ formatTime(deposit.date) }}</span>
                </p>
                <p v-if="deposit.note" class="mt-1 line-clamp-1 text-[11px] text-muted">
                  {{ deposit.note }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <button
                  type="button"
                  class="icon-btn icon-btn-sm"
                  aria-label="Edit setoran"
                  @click.stop="editDeposit(deposit.id)"
                >
                  <Pencil :size="13" />
                </button>
                <button
                  type="button"
                  class="icon-btn icon-btn-sm hover:border-danger/30 hover:bg-danger-soft hover:text-danger"
                  aria-label="Hapus setoran"
                  @click.stop="deleteDeposit(deposit.id)"
                >
                  <Trash2 :size="13" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EmptyState
        v-else
        :icon="filteredDeposits.length === 0 && appStore.data.deposits.length > 0 ? Search : Camera"
        :title="appStore.data.deposits.length > 0 ? 'Tidak ada setoran yang cocok' : 'Belum ada setoran'"
        :description="
          appStore.data.deposits.length > 0
            ? 'Coba ubah kata kunci, target, atau rentang tanggal.'
            : 'Mulai dengan setoran pertamamu dan simpan foto sebagai dokumentasi pribadi.'
        "
      >
        <button
          v-if="appStore.data.deposits.length > 0"
          type="button"
          class="btn btn-secondary btn-sm"
          @click="resetFilters"
        >
          <RotateCcw :size="14" />
          Reset filter
        </button>
        <button v-else type="button" class="btn btn-primary btn-sm" @click="ui.openDeposit()">
          <Camera :size="14" />
          Mulai Menabung
        </button>
      </EmptyState>

      <div v-if="hasMore" class="border-t border-line p-4 text-center">
        <button type="button" class="btn btn-secondary btn-sm" @click="visibleCount += 12">
          Muat lebih banyak
          <ChevronDown :size="14" />
        </button>
      </div>
    </section>

    <div class="mt-4 flex items-start gap-2.5 rounded-2xl border border-line bg-surface-2 p-4 text-[11px] leading-relaxed text-muted">
      <ImageIcon :size="16" class="mt-0.5 shrink-0 text-primary" />
      <p>
        Foto bukti merupakan dokumentasi pribadi dan bukan verifikasi otomatis. Semua foto disimpan
        lokal di browser perangkat ini, tidak diunggah ke server dan tidak tersinkron ke perangkat lain.
      </p>
    </div>

    <DepositDetailModal
      :open="detailOpen"
      :deposit-id="selectedDepositId"
      @close="detailOpen = false"
      @edit="editDeposit"
      @delete="deleteDeposit"
    />
  </div>
</template>
