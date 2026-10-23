<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  ReceiptText,
  Repeat2,
  Trash2,
  Wallet,
} from '@lucide/vue'
import type { Bill, BillFrequency } from '@/types'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { EXPENSE_CATEGORIES, findCategory } from '@/lib/categories'
import { nextBillDue } from '@/lib/calc'
import {
  daysBetween,
  formatDateLong,
  formatDateShort,
  formatMonth,
  monthKey,
  todayKey,
} from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

type BillFilter = 'all' | 'due' | 'monthly' | 'once'

interface BillRow {
  bill: Bill
  due: Date | null
  days: number | null
  paidThisMonth: boolean
}

const appStore = useAppStore()
const ui = useUiStore()

const hideAmounts = computed(() => appStore.data.settings.hideAmounts)
const currentMonth = monthKey()
const filter = ref<BillFilter>('all')

const rows = computed<BillRow[]>(() =>
  appStore.data.bills.map((bill) => {
    const due = nextBillDue(bill)
    return {
      bill,
      due,
      days: due ? daysBetween(todayKey(), due) : null,
      paidThisMonth: Boolean(bill.lastPaidAt && monthKey(bill.lastPaidAt) === currentMonth),
    }
  }),
)

const orderedRows = computed(() =>
  [...rows.value].sort((a, b) => {
    const aInactive = !a.bill.active
    const bInactive = !b.bill.active
    if (aInactive !== bInactive) return aInactive ? 1 : -1
    if (a.days !== null && b.days !== null && a.days !== b.days) return a.days - b.days
    if (a.days !== null) return -1
    if (b.days !== null) return 1
    return a.bill.name.localeCompare(b.bill.name, 'id')
  }),
)

const filteredRows = computed(() => {
  if (filter.value === 'due') {
    return orderedRows.value.filter(
      (row) => row.bill.active && row.days !== null && row.days <= 14,
    )
  }
  if (filter.value === 'monthly') {
    return orderedRows.value.filter((row) => row.bill.frequency === 'monthly')
  }
  if (filter.value === 'once') {
    return orderedRows.value.filter((row) => row.bill.frequency === 'once')
  }
  return orderedRows.value
})

const activeBills = computed(() => rows.value.filter((row) => row.bill.active))
const monthlyCommitment = computed(() =>
  activeBills.value
    .filter((row) => row.bill.frequency === 'monthly')
    .reduce((total, row) => total + row.bill.amount, 0),
)
const dueSoon = computed(() =>
  activeBills.value
    .filter((row) => row.days !== null && row.days >= 0 && row.days <= 14)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0)),
)
const overdue = computed(() =>
  activeBills.value
    .filter((row) => row.days !== null && row.days < 0)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0)),
)
const paidThisMonth = computed(() => {
  const ids = new Set(appStore.data.bills.map((bill) => bill.id))
  return appStore.data.transactions
    .filter(
      (transaction) =>
        transaction.billId &&
        ids.has(transaction.billId) &&
        transaction.type === 'expense' &&
        monthKey(transaction.date) === currentMonth,
    )
    .reduce((total, transaction) => total + transaction.amount, 0)
})

const filterOptions: Array<{ value: BillFilter; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'due', label: 'Jatuh tempo' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'once', label: 'Sekali bayar' },
]

function money(value: number): string {
  return hideAmounts.value ? 'Rp••••••' : formatCurrency(value)
}

function dueLabel(row: BillRow): string {
  if (!row.bill.active) return row.bill.frequency === 'once' ? 'Sudah dibayar / nonaktif' : 'Dihentikan'
  if (row.days === null) return 'Tidak dijadwalkan'
  if (row.days < 0) return `Terlambat ${Math.abs(row.days)} hari`
  if (row.days === 0) return 'Jatuh tempo hari ini'
  if (row.days === 1) return 'Jatuh tempo besok'
  return `${row.days} hari lagi`
}

function dueTone(row: BillRow): string {
  if (!row.bill.active) return 'tag-primary'
  if (row.days === null) return 'tag-primary'
  if (row.days < 0) return 'tag-danger'
  if (row.days <= 3) return 'tag-warning'
  return 'tag-success'
}

function dueDateText(row: BillRow): string {
  if (row.due) return formatDateLong(row.due)
  if (row.bill.frequency === 'once' && row.bill.dueDate) return formatDateLong(row.bill.dueDate)
  return 'Tanpa jadwal'
}

function scheduleText(bill: Bill): string {
  return bill.frequency === 'monthly'
    ? `Setiap tanggal ${bill.dueDay}`
    : bill.dueDate
      ? `Sekali pada ${formatDateShort(bill.dueDate)}`
      : 'Sekali bayar'
}

async function toggleActive(row: BillRow): Promise<void> {
  const next = !row.bill.active
  appStore.updateBill(row.bill.id, { active: next })
  ui.notify(
    next
      ? `${row.bill.name} kembali masuk daftar pengingat.`
      : `${row.bill.name} tidak akan muncul di pengingat.`,
    { title: next ? 'Tagihan diaktifkan' : 'Tagihan dihentikan', variant: 'info' },
  )
}

async function payBill(row: BillRow): Promise<void> {
  if (!row.bill.active) {
    ui.notify('Aktifkan kembali tagihan ini sebelum menandainya lunas.', { variant: 'warning' })
    return
  }
  const confirmed = await ui.askConfirm({
    title: `Tandai ${row.bill.name} lunas?`,
    message: `${money(row.bill.amount)} akan dicatat sebagai pengeluaran dari ${appStore.walletName(row.bill.walletId)} pada hari ini. Tindakan ini juga memperbarui saldo dompet.`,
    confirmLabel: 'Tandai lunas',
    cancelLabel: 'Batal',
    tone: 'primary',
  })
  if (!confirmed) return
  const result = appStore.markBillPaid(row.bill.id)
  if (result.ok) {
    ui.notify(result.message ?? 'Tagihan ditandai lunas dan pengeluaran dicatat.', {
      title: 'Pembayaran tercatat',
    })
  } else {
    ui.notify(result.message ?? 'Tagihan gagal diproses.', { variant: 'error' })
  }
}

async function removeBill(row: BillRow): Promise<void> {
  const confirmed = await ui.askConfirm({
    title: `Hapus tagihan ${row.bill.name}?`,
    message:
      'Pengingat tagihan akan dihapus. Transaksi pembayaran yang pernah tercatat tetap tersimpan di riwayat keuangan.',
    confirmLabel: 'Hapus tagihan',
  })
  if (!confirmed) return
  if (appStore.deleteBill(row.bill.id)) {
    ui.notify('Tagihan berhasil dihapus dari daftar pengingat.', { title: 'Tagihan dihapus' })
  }
}

const formOpen = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const formError = ref('')
const form = reactive({
  name: '',
  amount: 0,
  category: 'Tagihan',
  walletId: '',
  frequency: 'monthly' as BillFrequency,
  dueDay: 1,
  dueDate: todayKey(),
  notes: '',
  active: true,
})
const errors = reactive({
  name: '',
  amount: '',
  category: '',
  walletId: '',
  dueDay: '',
  dueDate: '',
})

const wallets = computed(() => appStore.data.wallets)
const expenseCategories = EXPENSE_CATEGORIES

function resetForm(): void {
  form.name = ''
  form.amount = 0
  form.category = 'Tagihan'
  form.walletId = wallets.value[0]?.id ?? ''
  form.frequency = 'monthly'
  form.dueDay = Math.max(1, new Date().getDate())
  form.dueDate = todayKey()
  form.notes = ''
  form.active = true
  errors.name = ''
  errors.amount = ''
  errors.category = ''
  errors.walletId = ''
  errors.dueDay = ''
  errors.dueDate = ''
  formError.value = ''
}

function openAdd(): void {
  editingId.value = null
  resetForm()
  formOpen.value = true
}

function openEdit(bill: Bill): void {
  editingId.value = bill.id
  form.name = bill.name
  form.amount = bill.amount
  form.category = bill.category
  form.walletId = bill.walletId
  form.frequency = bill.frequency
  form.dueDay = bill.dueDay
  form.dueDate = bill.dueDate ?? todayKey()
  form.notes = bill.notes
  form.active = bill.active
  errors.name = ''
  errors.amount = ''
  errors.category = ''
  errors.walletId = ''
  errors.dueDay = ''
  errors.dueDate = ''
  formError.value = ''
  formOpen.value = true
}

function saveBill(): void {
  if (saving.value) return
  errors.name = form.name.trim().length >= 2 ? '' : 'Nama tagihan minimal 2 karakter.'
  errors.amount = form.amount > 0 ? '' : 'Nominal tagihan harus lebih dari 0.'
  errors.category = form.category ? '' : 'Pilih kategori tagihan.'
  errors.walletId = wallets.value.some((wallet) => wallet.id === form.walletId)
    ? ''
    : 'Pilih dompet pembayaran yang valid.'
  errors.dueDay =
    form.frequency === 'monthly' && (form.dueDay < 1 || form.dueDay > 31)
      ? 'Tanggal jatuh tempo harus 1–31.'
      : ''
  errors.dueDate =
    form.frequency === 'once' && !form.dueDate ? 'Pilih tanggal pembayaran.' : ''
  if (
    errors.name ||
    errors.amount ||
    errors.category ||
    errors.walletId ||
    errors.dueDay ||
    errors.dueDate
  ) {
    return
  }

  const payload = {
    name: form.name.trim(),
    amount: form.amount,
    category: form.category,
    walletId: form.walletId,
    frequency: form.frequency,
    dueDay: form.dueDay,
    dueDate: form.frequency === 'once' ? form.dueDate : undefined,
    notes: form.notes.trim(),
    active: form.active,
  }

  saving.value = true
  try {
    if (editingId.value) {
      appStore.updateBill(editingId.value, payload)
      ui.notify('Detail tagihan berhasil diperbarui.', { title: 'Tagihan diperbarui' })
    } else {
      appStore.addBill(payload)
      ui.notify('Tagihan baru sudah masuk daftar pengingat.', { title: 'Tagihan dibuat' })
    }
    formOpen.value = false
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Tagihan gagal disimpan.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Tagihan"
      subtitle="Kelola tagihan rutin dan sekali bayar, lihat jatuh tempo terdekat, dan catat pembayaran tanpa lupa."
      eyebrow="Rutinitas keuangan"
    >
      <template #actions>
        <button type="button" class="btn btn-primary" @click="openAdd">
          <Plus :size="17" :stroke-width="2.5" />
          Tambah Tagihan
        </button>
      </template>
    </PageHeader>

    <div class="mt-6 grid gap-4 sm:grid-cols-3">
      <section class="card animate-rise p-5" style="--delay: 50ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Komitmen bulanan</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Repeat2 :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="monthlyCommitment" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">
          {{ activeBills.filter((row) => row.bill.frequency === 'monthly').length }} tagihan rutin aktif
        </p>
      </section>

      <section class="card animate-rise p-5" style="--delay: 90ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Jatuh tempo 14 hari</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-warning-soft text-warning">
            <CalendarClock :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-ink">
          {{ dueSoon.length }}
          <span class="text-sm font-bold text-muted">tagihan</span>
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">
          {{ dueSoon.length ? dueDateText(dueSoon[0]!) : 'Tidak ada yang mendesak' }}
        </p>
      </section>

      <section class="card animate-rise p-5" style="--delay: 130ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Dibayar bulan ini</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-success-soft text-success">
            <CheckCircle2 :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="paidThisMonth" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">
          {{ formatMonth(new Date()) }}
          <span v-if="overdue.length" class="text-danger"> · {{ overdue.length }} terlambat</span>
        </p>
      </section>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-[1.65fr_1fr]">
      <section class="card animate-rise overflow-hidden" style="--delay: 170ms">
        <div class="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 class="text-base font-extrabold text-ink">Daftar tagihan</h2>
            <p class="mt-0.5 text-xs text-muted">Pembayaran akan tercatat sebagai pengeluaran dompet.</p>
          </div>
          <div class="hide-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1">
            <button
              v-for="option in filterOptions"
              :key="option.value"
              type="button"
              class="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors"
              :class="filter === option.value ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-ink'"
              @click="filter = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div v-if="filteredRows.length" class="divide-y divide-line">
          <article
            v-for="row in filteredRows"
            :key="row.bill.id"
            class="group px-5 py-4 transition-colors hover:bg-surface-2 sm:px-6"
            :class="{ 'opacity-70': !row.bill.active }"
          >
            <div class="flex items-start gap-3">
              <CategoryIcon
                :name="findCategory(row.bill.category).icon"
                :color="findCategory(row.bill.category).color"
                :size="17"
                box-size="sm"
              />
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="truncate text-sm font-extrabold text-ink">{{ row.bill.name }}</h3>
                      <span class="chip px-1.5 py-0.5 text-[9px]" :class="dueTone(row)">
                        {{ dueLabel(row) }}
                      </span>
                      <span v-if="row.paidThisMonth" class="tag-success chip px-1.5 py-0.5 text-[9px]">
                        Lunas bulan ini
                      </span>
                    </div>
                    <p class="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-semibold text-muted">
                      <span class="inline-flex items-center gap-1">
                        <CalendarDays :size="11" />
                        {{ dueDateText(row) }}
                      </span>
                      <span class="inline-flex items-center gap-1">
                        <Repeat2 :size="11" />
                        {{ scheduleText(row.bill) }}
                      </span>
                      <span class="inline-flex items-center gap-1">
                        <Wallet :size="11" />
                        {{ appStore.walletName(row.bill.walletId) }}
                      </span>
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-extrabold tracking-tight text-ink">{{ money(row.bill.amount) }}</p>
                    <p class="mt-0.5 text-[10px] font-semibold text-muted">
                      {{ row.bill.frequency === 'monthly' ? 'per bulan' : 'sekali bayar' }}
                    </p>
                  </div>
                </div>

                <p v-if="row.bill.notes" class="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted">
                  {{ row.bill.notes }}
                </p>

                <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <button
                    v-if="row.bill.active"
                    type="button"
                    class="btn btn-soft btn-sm"
                    :disabled="row.bill.frequency === 'monthly' && row.paidThisMonth"
                    @click="payBill(row)"
                  >
                    <CalendarCheck2 :size="13" />
                    {{ row.bill.frequency === 'monthly' && row.paidThisMonth ? 'Sudah dibayar' : 'Tandai lunas' }}
                  </button>
                  <span v-else class="text-[10px] font-bold text-muted">
                    {{ row.bill.frequency === 'once' ? 'Tagihan sekali bayar selesai' : 'Pengingat dihentikan' }}
                  </span>

                  <div class="flex items-center gap-0.5">
                    <button
                      type="button"
                      class="icon-btn icon-btn-sm border-transparent bg-transparent"
                      :aria-label="row.bill.active ? `Hentikan ${row.bill.name}` : `Aktifkan ${row.bill.name}`"
                      :title="row.bill.active ? 'Hentikan pengingat' : 'Aktifkan pengingat'"
                      @click="toggleActive(row)"
                    >
                      <Power :size="12" :class="row.bill.active ? 'text-success' : 'text-muted'" />
                    </button>
                    <button
                      type="button"
                      class="icon-btn icon-btn-sm border-transparent bg-transparent"
                      aria-label="Edit tagihan"
                      title="Edit tagihan"
                      @click="openEdit(row.bill)"
                    >
                      <Pencil :size="12" />
                    </button>
                    <button
                      type="button"
                      class="icon-btn icon-btn-sm border-transparent bg-transparent hover:text-danger"
                      aria-label="Hapus tagihan"
                      title="Hapus tagihan"
                      @click="removeBill(row)"
                    >
                      <Trash2 :size="12" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <EmptyState
          v-else
          :icon="CalendarClock"
          :title="filter === 'all' ? 'Belum ada tagihan' : 'Tidak ada tagihan pada filter ini'"
          :description="
            filter === 'all'
              ? 'Tambahkan tagihan rutin agar Savezy mengingatkanmu sebelum jatuh tempo.'
              : 'Coba pilih filter lain atau tambahkan tagihan baru.'
          "
        >
          <button type="button" class="btn btn-primary btn-sm" @click="openAdd">
            <Plus :size="14" />
            Tambah tagihan
          </button>
        </EmptyState>
      </section>

      <div class="space-y-4">
        <section class="card animate-rise p-5 sm:p-6" style="--delay: 210ms">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-ink">Pengingat terdekat</h2>
              <p class="mt-1 text-[11px] text-muted">Tagihan aktif dalam 14 hari ke depan.</p>
            </div>
            <span class="flex size-8 items-center justify-center rounded-lg bg-warning-soft text-warning">
              <Clock3 :size="15" />
            </span>
          </div>

          <div v-if="dueSoon.length" class="mt-4 space-y-2.5">
            <div
              v-for="row in dueSoon.slice(0, 5)"
              :key="row.bill.id"
              class="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5"
            >
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-lg"
                :class="row.days !== null && row.days <= 3 ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-primary'"
              >
                <ReceiptText :size="14" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-[11px] font-extrabold text-ink">{{ row.bill.name }}</p>
                <p class="mt-0.5 text-[10px] font-semibold text-muted">{{ dueLabel(row) }}</p>
              </div>
              <span class="shrink-0 text-[10px] font-extrabold text-ink-soft">{{ money(row.bill.amount) }}</span>
            </div>
          </div>
          <div v-else class="mt-4 rounded-xl border border-dashed border-line-strong bg-surface-2 px-4 py-6 text-center">
            <CheckCircle2 :size="22" class="mx-auto text-success" />
            <p class="mt-2 text-xs font-bold text-ink">Tidak ada tagihan mendesak</p>
            <p class="mt-1 text-[10px] leading-relaxed text-muted">Semua tagihan terdekat sudah terkendali.</p>
          </div>
        </section>

        <section
          v-if="overdue.length"
          class="animate-rise rounded-2xl border border-danger/20 bg-danger-soft/60 p-5"
          style="--delay: 250ms"
        >
          <div class="flex items-start gap-3">
            <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-danger">
              <AlertTriangle :size="17" />
            </span>
            <div>
              <p class="text-xs font-extrabold text-ink">{{ overdue.length }} tagihan melewati jatuh tempo</p>
              <p class="mt-1 text-[11px] leading-relaxed text-ink-soft/80">
                {{ overdue.map((row) => row.bill.name).join(', ') }}. Tandai lunas setelah pembayaran dilakukan
                agar pengeluaran dan saldo dompet tetap akurat.
              </p>
            </div>
          </div>
        </section>

        <section class="animate-rise rounded-2xl border border-primary/15 bg-primary-soft/50 p-5" style="--delay: 290ms">
          <div class="flex items-start gap-3">
            <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-primary">
              <ReceiptText :size="17" />
            </span>
            <div>
              <p class="text-xs font-extrabold text-ink">Bayar sekali, tercatat sekali.</p>
              <p class="mt-1 text-[11px] leading-relaxed text-muted">
                Menandai tagihan lunas membuat satu transaksi pengeluaran. Tagihan bulanan akan kembali muncul
                pada periode berikutnya, sedangkan tagihan sekali bayar otomatis dinonaktifkan.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <BaseModal
      :open="formOpen"
      :title="editingId ? 'Edit tagihan' : 'Tambah tagihan'"
      :subtitle="
        editingId
          ? 'Perbarui nominal, jadwal, atau dompet pembayaran tagihan ini.'
          : 'Catat tagihan agar pengingat dan komitmen bulanan terlihat jelas.'
      "
      size="md"
      :persistent="saving"
      @close="formOpen = false"
    >
      <div class="space-y-4 pt-1">
        <div>
          <label for="bill-name" class="label">Nama tagihan</label>
          <input
            id="bill-name"
            v-model="form.name"
            type="text"
            class="input"
            :class="errors.name ? 'border-danger' : ''"
            placeholder="Contoh: Internet rumah"
            maxlength="80"
            @input="errors.name = ''"
          />
          <p v-if="errors.name" class="field-error">{{ errors.name }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="bill-amount" class="label">Nominal</label>
            <CurrencyInput id="bill-amount" v-model="form.amount" :invalid="!!errors.amount" />
            <p v-if="errors.amount" class="field-error">{{ errors.amount }}</p>
          </div>
          <div>
            <label for="bill-category" class="label">Kategori</label>
            <select
              id="bill-category"
              v-model="form.category"
              class="select"
              :class="errors.category ? 'border-danger' : ''"
              @change="errors.category = ''"
            >
              <option v-for="category in expenseCategories" :key="category.name" :value="category.name">
                {{ category.name }}
              </option>
            </select>
            <p v-if="errors.category" class="field-error">{{ errors.category }}</p>
          </div>
        </div>

        <div>
          <label for="bill-wallet" class="label">Dompet pembayaran</label>
          <select
            id="bill-wallet"
            v-model="form.walletId"
            class="select"
            :class="errors.walletId ? 'border-danger' : ''"
            @change="errors.walletId = ''"
          >
            <option v-for="wallet in wallets" :key="wallet.id" :value="wallet.id">
              {{ wallet.name }} · {{ money(appStore.walletsWithBalance.find((entry) => entry.wallet.id === wallet.id)?.balance ?? 0) }}
            </option>
          </select>
          <p v-if="errors.walletId" class="field-error">{{ errors.walletId }}</p>
        </div>

        <div>
          <span class="label">Jenis jadwal</span>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="rounded-xl border p-3 text-left transition-colors"
              :class="form.frequency === 'monthly' ? 'border-primary bg-primary-soft/60' : 'border-line bg-surface-2'"
              @click="form.frequency = 'monthly'"
            >
              <span class="flex items-center gap-2 text-xs font-extrabold text-ink">
                <Repeat2 :size="14" :class="form.frequency === 'monthly' ? 'text-primary' : 'text-muted'" />
                Bulanan
              </span>
              <span class="mt-1 block text-[10px] leading-relaxed text-muted">Berulang setiap tanggal tertentu.</span>
            </button>
            <button
              type="button"
              class="rounded-xl border p-3 text-left transition-colors"
              :class="form.frequency === 'once' ? 'border-primary bg-primary-soft/60' : 'border-line bg-surface-2'"
              @click="form.frequency = 'once'"
            >
              <span class="flex items-center gap-2 text-xs font-extrabold text-ink">
                <CalendarDays :size="14" :class="form.frequency === 'once' ? 'text-primary' : 'text-muted'" />
                Sekali bayar
              </span>
              <span class="mt-1 block text-[10px] leading-relaxed text-muted">Satu tanggal, lalu nonaktif.</span>
            </button>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div v-if="form.frequency === 'monthly'">
            <label for="bill-due-day" class="label">Tanggal jatuh tempo</label>
            <input
              id="bill-due-day"
              v-model.number="form.dueDay"
              type="number"
              min="1"
              max="31"
              class="input"
              :class="errors.dueDay ? 'border-danger' : ''"
              @input="errors.dueDay = ''"
            />
            <p v-if="errors.dueDay" class="field-error">{{ errors.dueDay }}</p>
            <p v-else class="field-hint">Tanggal 29–31 akan menyesuaikan bulan yang lebih pendek.</p>
          </div>
          <div v-else>
            <label for="bill-due-date" class="label">Tanggal pembayaran</label>
            <input
              id="bill-due-date"
              v-model="form.dueDate"
              type="date"
              class="input"
              :class="errors.dueDate ? 'border-danger' : ''"
              @input="errors.dueDate = ''"
            />
            <p v-if="errors.dueDate" class="field-error">{{ errors.dueDate }}</p>
          </div>
          <div>
            <label for="bill-notes" class="label">Catatan <span class="font-medium text-muted">(opsional)</span></label>
            <input
              id="bill-notes"
              v-model="form.notes"
              type="text"
              class="input"
              placeholder="Contoh: bayar otomatis dari BCA"
              maxlength="300"
            />
          </div>
        </div>

        <label class="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-3.5 py-3">
          <span>
            <span class="block text-xs font-bold text-ink">Aktifkan pengingat</span>
            <span class="mt-0.5 block text-[10px] text-muted">Munculkan tagihan ini di pengingat dan ringkasan.</span>
          </span>
          <input v-model="form.active" type="checkbox" class="size-4 accent-[var(--primary)]" />
        </label>

        <div v-if="formError" class="rounded-xl bg-danger-soft p-3 text-xs font-semibold text-danger">
          {{ formError }}
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-secondary" :disabled="saving" @click="formOpen = false">Batal</button>
        <button type="button" class="btn btn-primary" :disabled="saving" @click="saveBill">
          <LoaderCircle v-if="saving" :size="16" class="animate-spin" />
          <Plus v-else :size="16" />
          {{ editingId ? 'Simpan Perubahan' : 'Tambah Tagihan' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>
