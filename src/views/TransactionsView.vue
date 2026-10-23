<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  LoaderCircle,
  Pencil,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  Trash2,
  Wallet,
} from '@lucide/vue'
import type { FinanceTransaction, TransactionType } from '@/types'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { ALL_CATEGORIES, categoriesFor, findCategory } from '@/lib/categories'
import { addDays, formatDateLong, formatWeekday, toDateKey, todayKey } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'

type TypeFilter = 'all' | TransactionType
type PeriodFilter = 'all' | 'this-month' | 'last-month' | '90-days' | 'custom'

const appStore = useAppStore()
const ui = useUiStore()

const typeFilterOptions: Array<{ value: TypeFilter; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'income', label: 'Masuk' },
  { value: 'expense', label: 'Keluar' },
]

const search = ref('')
const typeFilter = ref<TypeFilter>('all')
const categoryFilter = ref('')
const walletFilter = ref('')
const period = ref<PeriodFilter>('all')
const fromDate = ref('')
const toDate = ref('')
const visibleCount = ref(20)

const hideAmounts = computed(() => appStore.data.settings.hideAmounts)

const availableCategories = computed(() => {
  const names = new Set(ALL_CATEGORIES.map((category) => category.name))
  appStore.data.transactions.forEach((transaction) => names.add(transaction.category))
  return [...names]
})

const filteredTransactions = computed(() => {
  const term = search.value.trim().toLowerCase()
  const today = todayKey()
  let from = ''
  let to = ''
  if (period.value === 'this-month') {
    from = `${today.slice(0, 7)}-01`
    to = today
  } else if (period.value === 'last-month') {
    const now = new Date()
    from = toDateKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    to = toDateKey(new Date(now.getFullYear(), now.getMonth(), 0))
  } else if (period.value === '90-days') {
    from = toDateKey(addDays(new Date(), -90))
    to = today
  } else if (period.value === 'custom') {
    from = fromDate.value
    to = toDate.value
  }

  return appStore.data.transactions
    .filter((transaction) => {
      if (typeFilter.value !== 'all' && transaction.type !== typeFilter.value) return false
      if (categoryFilter.value && transaction.category !== categoryFilter.value) return false
      if (walletFilter.value && transaction.walletId !== walletFilter.value) return false
      if (from && transaction.date < from) return false
      if (to && transaction.date > to) return false
      if (!term) return true
      const walletName = appStore.walletName(transaction.walletId)
      return `${transaction.note} ${transaction.category} ${walletName} ${transaction.amount}`
        .toLowerCase()
        .includes(term)
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
})

const displayedTransactions = computed(() => filteredTransactions.value.slice(0, visibleCount.value))
const hasMore = computed(() => filteredTransactions.value.length > visibleCount.value)
const filteredIncome = computed(() =>
  filteredTransactions.value
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0),
)
const filteredExpense = computed(() =>
  filteredTransactions.value
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0),
)
const activeFilterCount = computed(
  () =>
    [search.value.trim(), typeFilter.value !== 'all', categoryFilter.value, walletFilter.value, period.value !== 'all'].filter(Boolean).length,
)

watch([search, typeFilter, categoryFilter, walletFilter, period, fromDate, toDate], () => {
  visibleCount.value = 20
})

const formOpen = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const formError = ref('')
const form = reactive({
  type: 'expense' as TransactionType,
  amount: 0,
  category: 'Makanan',
  date: todayKey(),
  walletId: '',
  note: '',
})
const errors = reactive({ amount: '', category: '', date: '', wallet: '' })

const currentCategories = computed(() => categoriesFor(form.type))
const editingTransaction = computed(() =>
  editingId.value ? appStore.data.transactions.find((item) => item.id === editingId.value) : undefined,
)

function money(value: number): string {
  return hideAmounts.value ? 'Rp••••••' : formatCurrency(value)
}

function resetFilters(): void {
  search.value = ''
  typeFilter.value = 'all'
  categoryFilter.value = ''
  walletFilter.value = ''
  period.value = 'all'
  fromDate.value = ''
  toDate.value = ''
}

function setFormType(type: TransactionType): void {
  form.type = type
  if (!categoriesFor(type).some((category) => category.name === form.category)) {
    form.category = categoriesFor(type)[0]?.name ?? 'Lainnya'
  }
  errors.category = ''
}

function openAdd(type: TransactionType = 'expense'): void {
  editingId.value = null
  form.type = type
  form.amount = 0
  form.category = categoriesFor(type)[0]?.name ?? 'Lainnya'
  form.date = todayKey()
  form.walletId = appStore.data.wallets[0]?.id ?? ''
  form.note = ''
  Object.assign(errors, { amount: '', category: '', date: '', wallet: '' })
  formError.value = ''
  formOpen.value = true
}

function openEdit(transaction: FinanceTransaction): void {
  editingId.value = transaction.id
  form.type = transaction.type
  form.amount = transaction.amount
  form.category = transaction.category
  form.date = transaction.date
  form.walletId = transaction.walletId
  form.note = transaction.note
  Object.assign(errors, { amount: '', category: '', date: '', wallet: '' })
  formError.value = ''
  formOpen.value = true
}

function validate(): boolean {
  errors.amount = form.amount > 0 ? '' : 'Nominal transaksi harus lebih dari 0.'
  errors.category = form.category ? '' : 'Pilih kategori transaksi.'
  errors.wallet = appStore.data.wallets.some((wallet) => wallet.id === form.walletId)
    ? ''
    : 'Pilih dompet yang valid.'
  errors.date = !form.date
    ? 'Tanggal transaksi wajib diisi.'
    : form.date > todayKey()
      ? 'Tanggal tidak boleh di masa depan.'
      : ''
  return !Object.values(errors).some(Boolean)
}

function save(): void {
  if (saving.value || !validate()) return
  saving.value = true
  try {
    const payload = {
      type: form.type,
      amount: form.amount,
      category: form.category,
      date: form.date,
      walletId: form.walletId,
      note: form.note.trim(),
    }
    if (editingId.value) {
      appStore.updateTransaction(editingId.value, payload)
      ui.notify('Transaksi berhasil diperbarui.', { title: 'Transaksi diperbarui' })
    } else {
      appStore.addTransaction(payload)
      ui.notify(
        form.type === 'income'
          ? 'Pemasukan baru sudah dicatat.'
          : 'Pengeluaran baru sudah dicatat.',
        { title: 'Transaksi tersimpan' },
      )
    }
    formOpen.value = false
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Transaksi gagal disimpan.'
  } finally {
    saving.value = false
  }
}

async function remove(transaction: FinanceTransaction): Promise<void> {
  const confirmed = await ui.askConfirm({
    title: 'Hapus transaksi ini?',
    message: `${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${money(transaction.amount)} (${transaction.category}) akan dihapus. Saldo dompet dan laporan keuangan akan diperbarui.`,
    confirmLabel: 'Hapus transaksi',
  })
  if (!confirmed) return
  if (appStore.deleteTransaction(transaction.id)) {
    ui.notify('Transaksi berhasil dihapus.', { title: 'Transaksi dihapus' })
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Transaksi"
      subtitle="Pisahkan uang masuk dan keluar dari alokasi tabungan agar laporan tetap akurat."
      eyebrow="Keuangan harian"
    >
      <template #actions>
        <button type="button" class="btn btn-secondary" @click="openAdd('income')">
          <ArrowDownLeft :size="16" />
          Pemasukan
        </button>
        <button type="button" class="btn btn-primary" @click="openAdd('expense')">
          <Plus :size="17" :stroke-width="2.5" />
          Tambah Transaksi
        </button>
      </template>
    </PageHeader>

    <div class="mt-6 grid gap-4 sm:grid-cols-3">
      <section class="card animate-rise p-5" style="--delay: 50ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Pemasukan bulan ini</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-success-soft text-success">
            <ArrowDownLeft :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-success">
          <AnimatedNumber :value="appStore.thisMonthSummary.income" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">Uang masuk yang tercatat</p>
      </section>
      <section class="card animate-rise p-5" style="--delay: 90ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Pengeluaran bulan ini</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-danger-soft text-danger">
            <ArrowUpRight :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-danger">
          <AnimatedNumber :value="appStore.thisMonthSummary.expense" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">Belanja dan pengeluaran rutin</p>
      </section>
      <section class="card animate-rise p-5" style="--delay: 130ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Arus kas bersih</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Wallet :size="15" />
          </span>
        </div>
        <p
          class="mt-3 text-[24px] font-extrabold tracking-tight"
          :class="appStore.thisMonthSummary.balance >= 0 ? 'text-ink' : 'text-danger'"
        >
          <AnimatedNumber :value="appStore.thisMonthSummary.balance" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">
          Pemasukan dikurangi pengeluaran bulan ini
        </p>
      </section>
    </div>

    <section class="card animate-rise mt-4 p-4 sm:p-5" style="--delay: 170ms">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-end">
        <div class="relative min-w-0 flex-1">
          <label for="transaction-search" class="label">Cari transaksi</label>
          <Search :size="15" class="pointer-events-none absolute bottom-3.5 left-3.5 text-muted" />
          <input
            id="transaction-search"
            v-model="search"
            type="search"
            class="input pl-9"
            placeholder="Cari catatan, kategori, dompet, atau nominal…"
          />
        </div>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-auto">
          <div>
            <label for="transaction-category" class="label">Kategori</label>
            <select id="transaction-category" v-model="categoryFilter" class="select min-w-0">
              <option value="">Semua</option>
              <option v-for="category in availableCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          <div>
            <label for="transaction-wallet" class="label">Dompet</label>
            <select id="transaction-wallet" v-model="walletFilter" class="select min-w-0">
              <option value="">Semua</option>
              <option v-for="wallet in appStore.data.wallets" :key="wallet.id" :value="wallet.id">
                {{ wallet.name }}
              </option>
            </select>
          </div>
          <div>
            <label for="transaction-period" class="label">Periode</label>
            <select id="transaction-period" v-model="period" class="select min-w-0">
              <option value="all">Semua waktu</option>
              <option value="this-month">Bulan ini</option>
              <option value="last-month">Bulan lalu</option>
              <option value="90-days">90 hari terakhir</option>
              <option value="custom">Kustom</option>
            </select>
          </div>
          <div>
            <span class="label">Jenis</span>
            <div class="flex rounded-xl border border-line bg-surface-2 p-1">
              <button
                v-for="option in typeFilterOptions"
                :key="option.value"
                type="button"
                class="flex-1 rounded-lg px-1.5 py-1.5 text-[10px] font-bold transition-colors"
                :class="typeFilter === option.value ? 'bg-surface text-ink shadow-sm' : 'text-muted'"
                @click="typeFilter = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>
        <button v-if="activeFilterCount" type="button" class="btn btn-secondary shrink-0" @click="resetFilters">
          <RotateCcw :size="14" />
          Reset
        </button>
      </div>

      <div v-if="period === 'custom'" class="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <label for="transaction-from" class="label">Dari tanggal</label>
          <input id="transaction-from" v-model="fromDate" type="date" class="input" />
        </div>
        <div>
          <label for="transaction-to" class="label">Sampai tanggal</label>
          <input id="transaction-to" v-model="toDate" type="date" class="input" />
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-[11px] font-semibold text-muted">
        <span>{{ filteredTransactions.length }} transaksi</span>
        <span class="flex items-center gap-1 text-success">
          <ArrowDownLeft :size="12" />
          {{ money(filteredIncome) }}
        </span>
        <span class="flex items-center gap-1 text-danger">
          <ArrowUpRight :size="12" />
          {{ money(filteredExpense) }}
        </span>
      </div>
    </section>

    <section class="card animate-rise mt-4 overflow-hidden" style="--delay: 210ms">
      <div class="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
        <div>
          <h2 class="text-base font-extrabold text-ink">Daftar transaksi</h2>
          <p class="mt-0.5 text-xs text-muted">Transaksi tidak memengaruhi progres target secara langsung.</p>
        </div>
        <span class="chip">{{ displayedTransactions.length }}</span>
      </div>

      <div v-if="displayedTransactions.length" class="hidden overflow-x-auto md:block">
        <table class="w-full min-w-[720px] text-left">
          <thead>
            <tr class="border-b border-line bg-surface-2/60 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">
              <th class="px-6 py-3 font-extrabold">Transaksi</th>
              <th class="px-4 py-3 font-extrabold">Dompet</th>
              <th class="px-4 py-3 font-extrabold">Tanggal</th>
              <th class="px-4 py-3 text-right font-extrabold">Nominal</th>
              <th class="px-6 py-3 text-right font-extrabold">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr
              v-for="transaction in displayedTransactions"
              :key="transaction.id"
              class="group transition-colors hover:bg-surface-2"
            >
              <td class="px-6 py-3.5">
                <div class="flex items-center gap-3">
                  <CategoryIcon
                    :name="findCategory(transaction.category).icon"
                    :color="transaction.type === 'income' ? '#24AD7A' : findCategory(transaction.category).color"
                    :size="16"
                    box-size="sm"
                  />
                  <div class="min-w-0">
                    <p class="text-xs font-extrabold text-ink">{{ transaction.category }}</p>
                    <p class="mt-0.5 max-w-[260px] truncate text-[10px] text-muted">
                      {{ transaction.note || (transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran') }}
                      <span v-if="transaction.billId" class="ml-1 text-primary">· Pembayaran tagihan</span>
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3.5 text-[11px] font-semibold text-muted">{{ appStore.walletName(transaction.walletId) }}</td>
              <td class="px-4 py-3.5">
                <p class="text-[11px] font-semibold text-ink-soft">{{ formatDateLong(transaction.date) }}</p>
                <p class="mt-0.5 text-[10px] text-muted">{{ formatWeekday(transaction.date) }}</p>
              </td>
              <td class="px-4 py-3.5 text-right">
                <span
                  class="text-xs font-extrabold"
                  :class="transaction.type === 'income' ? 'text-success' : 'text-ink'"
                >
                  {{ transaction.type === 'income' ? '+' : '−' }}{{ money(transaction.amount) }}
                </span>
              </td>
              <td class="px-6 py-3.5">
                <div class="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <button type="button" class="icon-btn icon-btn-sm" aria-label="Edit transaksi" @click="openEdit(transaction)">
                    <Pencil :size="13" />
                  </button>
                  <button
                    type="button"
                    class="icon-btn icon-btn-sm hover:border-danger/30 hover:bg-danger-soft hover:text-danger"
                    aria-label="Hapus transaksi"
                    @click="remove(transaction)"
                  >
                    <Trash2 :size="13" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="displayedTransactions.length" class="divide-y divide-line md:hidden">
        <div
          v-for="transaction in displayedTransactions"
          :key="transaction.id"
          class="flex items-start gap-3 p-4"
        >
          <CategoryIcon
            :name="findCategory(transaction.category).icon"
            :color="transaction.type === 'income' ? '#24AD7A' : findCategory(transaction.category).color"
            :size="16"
            box-size="sm"
          />
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-xs font-extrabold text-ink">{{ transaction.category }}</p>
                <p class="mt-1 truncate text-[10px] text-muted">{{ appStore.walletName(transaction.walletId) }} · {{ formatDateLong(transaction.date) }}</p>
              </div>
              <p
                class="shrink-0 text-xs font-extrabold"
                :class="transaction.type === 'income' ? 'text-success' : 'text-ink'"
              >
                {{ transaction.type === 'income' ? '+' : '−' }}{{ money(transaction.amount) }}
              </p>
            </div>
            <p v-if="transaction.note" class="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted">{{ transaction.note }}</p>
            <div class="mt-2 flex justify-end gap-1.5">
              <button type="button" class="btn btn-secondary btn-sm py-1" @click="openEdit(transaction)">
                <Pencil :size="12" /> Edit
              </button>
              <button type="button" class="btn btn-danger btn-sm py-1" @click="remove(transaction)">
                <Trash2 :size="12" /> Hapus
              </button>
            </div>
          </div>
        </div>
      </div>

      <EmptyState
        v-if="!displayedTransactions.length"
        :icon="appStore.data.transactions.length > 0 ? Search : ReceiptText"
        :title="appStore.data.transactions.length > 0 ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi'"
        :description="
          appStore.data.transactions.length > 0
            ? 'Ubah kata kunci atau filter untuk menemukan transaksi lain.'
            : 'Catat pemasukan dan pengeluaran pertamamu agar arus kas mulai terlihat.'
        "
      >
        <button v-if="activeFilterCount" type="button" class="btn btn-secondary btn-sm" @click="resetFilters">
          <RotateCcw :size="14" />
          Reset filter
        </button>
        <button v-else type="button" class="btn btn-primary btn-sm" @click="openAdd('expense')">
          <Plus :size="14" />
          Tambah transaksi
        </button>
      </EmptyState>

      <div v-if="hasMore" class="border-t border-line p-4 text-center">
        <button type="button" class="btn btn-secondary btn-sm" @click="visibleCount += 20">
          Muat lebih banyak
          <ChevronDown :size="14" />
        </button>
      </div>
    </section>

    <div class="mt-4 flex items-start gap-2.5 rounded-2xl border border-line bg-surface-2 p-4 text-[11px] leading-relaxed text-muted">
      <ReceiptText :size="16" class="mt-0.5 shrink-0 text-primary" />
      <p>
        Pemasukan dan pengeluaran adalah arus kas. Setoran tabungan adalah alokasi dari saldo yang
        tersedia, jadi tidak dihitung sebagai pengeluaran baru atau pemasukan tambahan.
      </p>
    </div>

    <BaseModal
      :open="formOpen"
      :title="editingId ? 'Edit transaksi' : 'Tambah transaksi'"
      :subtitle="editingId ? 'Perubahan akan langsung memperbarui saldo dan laporan.' : 'Catat uang masuk atau keluar beserta kategori dan dompetnya.'"
      size="md"
      :persistent="saving"
      @close="formOpen = false"
    >
      <div class="space-y-4 pt-1">
        <div class="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface-2 p-1">
          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-extrabold transition-all"
            :class="form.type === 'income' ? 'bg-success text-white shadow-sm' : 'text-muted hover:text-ink'"
            @click="setFormType('income')"
          >
            <ArrowDownLeft :size="15" />
            Pemasukan
          </button>
          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-extrabold transition-all"
            :class="form.type === 'expense' ? 'bg-danger text-white shadow-sm' : 'text-muted hover:text-ink'"
            @click="setFormType('expense')"
          >
            <ArrowUpRight :size="15" />
            Pengeluaran
          </button>
        </div>

        <div>
          <label for="tx-amount" class="label">Nominal</label>
          <CurrencyInput id="tx-amount" v-model="form.amount" large :invalid="!!errors.amount" />
          <p v-if="errors.amount" class="field-error">{{ errors.amount }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="tx-category" class="label">Kategori</label>
            <select
              id="tx-category"
              v-model="form.category"
              class="select"
              :class="errors.category ? 'border-danger' : ''"
              @change="errors.category = ''"
            >
              <option v-for="category in currentCategories" :key="category.name" :value="category.name">
                {{ category.name }}
              </option>
            </select>
            <p v-if="errors.category" class="field-error">{{ errors.category }}</p>
          </div>
          <div>
            <label for="tx-date" class="label">Tanggal</label>
            <input
              id="tx-date"
              v-model="form.date"
              type="date"
              class="input"
              :max="todayKey()"
              :class="errors.date ? 'border-danger' : ''"
              @change="errors.date = ''"
            />
            <p v-if="errors.date" class="field-error">{{ errors.date }}</p>
          </div>
        </div>

        <div>
          <label for="tx-wallet" class="label">Dompet / sumber dana</label>
          <select
            id="tx-wallet"
            v-model="form.walletId"
            class="select"
            :class="errors.wallet ? 'border-danger' : ''"
            @change="errors.wallet = ''"
          >
            <option disabled value="">Pilih dompet</option>
            <option v-for="entry in appStore.walletsWithBalance" :key="entry.wallet.id" :value="entry.wallet.id">
              {{ entry.wallet.name }} · {{ money(entry.balance) }}
            </option>
          </select>
          <p v-if="errors.wallet" class="field-error">{{ errors.wallet }}</p>
        </div>

        <div>
          <label for="tx-note" class="label">Catatan <span class="font-medium text-muted">(opsional)</span></label>
          <textarea
            id="tx-note"
            v-model="form.note"
            class="textarea"
            maxlength="500"
            placeholder="Misalnya: makan siang bersama tim"
          />
        </div>

        <div v-if="editingTransaction?.billId" class="flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-[11px] leading-relaxed text-warning">
          <CalendarDays :size="15" class="mt-0.5 shrink-0" />
          Transaksi ini terhubung ke tagihan. Mengubah nominal atau menghapusnya dapat membuat status tagihan tidak sinkron.
        </div>
        <div v-if="formError" class="rounded-xl bg-danger-soft p-3 text-xs font-semibold text-danger">{{ formError }}</div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-secondary" :disabled="saving" @click="formOpen = false">Batal</button>
        <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
          <LoaderCircle v-if="saving" :size="16" class="animate-spin" />
          <Plus v-else :size="16" />
          {{ editingId ? 'Simpan Perubahan' : 'Simpan Transaksi' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>
