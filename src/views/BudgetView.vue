<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  WalletCards,
} from '@lucide/vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { EXPENSE_CATEGORIES, findCategory } from '@/lib/categories'
import { budgetStatuses, categorySpending } from '@/lib/calc'
import { addMonths, formatMonth, monthKey } from '@/lib/date'
import { formatCurrency, formatPercent } from '@/lib/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const appStore = useAppStore()
const ui = useUiStore()

const selectedMonth = ref(monthKey())
const hideAmounts = computed(() => appStore.data.settings.hideAmounts)
const monthLabel = computed(() => formatMonth(`${selectedMonth.value}-01`))
const currentMonth = monthKey()

const statuses = computed(() => budgetStatuses(appStore.data, selectedMonth.value))
const orderedStatuses = computed(() =>
  [...statuses.value].sort((a, b) => {
    if (a.state !== b.state) return a.state === 'over' ? -1 : b.state === 'over' ? 1 : a.state === 'near' ? -1 : 1
    return b.percent - a.percent
  }),
)
const spending = computed(() => categorySpending(appStore.data, selectedMonth.value))
const budgetedCategories = computed(() => new Set(appStore.data.budgets.map((budget) => budget.category)))
const unbudgetedSpending = computed(() =>
  spending.value.filter((entry) => !budgetedCategories.value.has(entry.category)),
)
const totalBudget = computed(() => statuses.value.reduce((total, entry) => total + entry.budget.monthlyLimit, 0))
const totalSpent = computed(() => statuses.value.reduce((total, entry) => total + entry.spent, 0))
const totalRemaining = computed(() => totalBudget.value - totalSpent.value)
const totalPercent = computed(() =>
  totalBudget.value > 0 ? Math.min((totalSpent.value / totalBudget.value) * 100, 100) : 0,
)
const alertCount = computed(
  () => statuses.value.filter((entry) => entry.state === 'near' || entry.state === 'over').length,
)

watch(selectedMonth, () => {
  if (!selectedMonth.value) selectedMonth.value = currentMonth
})

function money(value: number): string {
  return hideAmounts.value ? 'Rp••••••' : formatCurrency(value)
}

function shiftMonth(offset: number): void {
  selectedMonth.value = monthKey(addMonths(new Date(`${selectedMonth.value}-01T12:00:00`), offset))
}

const formOpen = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const formError = ref('')
const form = reactive({ category: 'Makanan', monthlyLimit: 0 })
const errors = reactive({ category: '', monthlyLimit: '' })

const availableCategories = computed(() =>
  EXPENSE_CATEGORIES.filter((category) => {
    if (editingId.value) {
      const editingBudget = appStore.data.budgets.find((budget) => budget.id === editingId.value)
      return category.name === editingBudget?.category
    }
    return !appStore.data.budgets.some((budget) => budget.category === category.name)
  }),
)

function openAdd(): void {
  editingId.value = null
  form.category = availableCategories.value[0]?.name ?? 'Makanan'
  form.monthlyLimit = 0
  errors.category = ''
  errors.monthlyLimit = ''
  formError.value = ''
  formOpen.value = true
}

function openEdit(id: string): void {
  const budget = appStore.data.budgets.find((item) => item.id === id)
  if (!budget) return
  editingId.value = id
  form.category = budget.category
  form.monthlyLimit = budget.monthlyLimit
  errors.category = ''
  errors.monthlyLimit = ''
  formError.value = ''
  formOpen.value = true
}

function saveBudget(): void {
  if (saving.value) return
  errors.category = form.category ? '' : 'Pilih kategori pengeluaran.'
  errors.monthlyLimit = form.monthlyLimit > 0 ? '' : 'Batas anggaran harus lebih dari 0.'
  if (errors.category || errors.monthlyLimit) return
  saving.value = true
  try {
    const result = editingId.value
      ? appStore.updateBudget(editingId.value, form.monthlyLimit)
      : appStore.addBudget({ category: form.category, monthlyLimit: form.monthlyLimit })
    if (!result.ok) {
      formError.value = result.message ?? 'Anggaran gagal disimpan.'
      return
    }
    ui.notify(
      editingId.value ? 'Batas anggaran berhasil diperbarui.' : 'Anggaran kategori baru sudah dibuat.',
      { title: editingId.value ? 'Anggaran diperbarui' : 'Anggaran dibuat' },
    )
    formOpen.value = false
  } finally {
    saving.value = false
  }
}

async function deleteBudget(id: string): Promise<void> {
  const budget = appStore.data.budgets.find((item) => item.id === id)
  if (!budget) return
  const confirmed = await ui.askConfirm({
    title: `Hapus anggaran ${budget.category}?`,
    message: 'Anggaran akan dihapus. Transaksi dan laporan keuangan tidak terpengaruh.',
    confirmLabel: 'Hapus anggaran',
  })
  if (!confirmed) return
  if (appStore.deleteBudget(id)) {
    ui.notify('Anggaran berhasil dihapus.', { title: 'Anggaran dihapus' })
  }
}

function stateLabel(state: 'safe' | 'near' | 'over'): string {
  if (state === 'over') return 'Melebihi batas'
  if (state === 'near') return 'Mendekati batas'
  return 'Aman'
}

function stateClass(state: 'safe' | 'near' | 'over'): string {
  if (state === 'over') return 'tag-danger'
  if (state === 'near') return 'tag-warning'
  return 'tag-success'
}

function toneFor(state: 'safe' | 'near' | 'over'): 'success' | 'warning' | 'danger' {
  if (state === 'over') return 'danger'
  if (state === 'near') return 'warning'
  return 'success'
}

const expenseTotalAll = computed(() =>
  spending.value.reduce((total, entry) => total + entry.amount, 0),
)
const unbudgetedTotal = computed(() =>
  unbudgetedSpending.value.reduce((total, entry) => total + entry.amount, 0),
)
</script>

<template>
  <div>
    <PageHeader
      title="Anggaran"
      subtitle="Tetapkan batas pengeluaran per kategori dan dapatkan peringatan sebelum terlalu jauh."
      eyebrow="Kendali pengeluaran"
    >
      <template #actions>
        <button type="button" class="btn btn-primary" @click="openAdd">
          <Plus :size="17" :stroke-width="2.5" />
          Tambah Anggaran
        </button>
      </template>
    </PageHeader>

    <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
        <button type="button" class="icon-btn icon-btn-sm border-transparent" aria-label="Bulan sebelumnya" @click="shiftMonth(-1)">
          <ChevronLeft :size="16" />
        </button>
        <span class="min-w-[132px] px-2 text-center text-xs font-extrabold text-ink">{{ monthLabel }}</span>
        <button
          type="button"
          class="icon-btn icon-btn-sm border-transparent"
          aria-label="Bulan berikutnya"
          :disabled="selectedMonth >= currentMonth"
          @click="shiftMonth(1)"
        >
          <ChevronRight :size="16" />
        </button>
      </div>
      <div class="flex items-center gap-2 text-[11px] font-semibold text-muted">
        <span class="size-2 rounded-full bg-success" /> Aman
        <span class="ml-2 size-2 rounded-full bg-warning" /> ≥ 80%
        <span class="ml-2 size-2 rounded-full bg-danger" /> Melebihi
      </div>
    </div>

    <div class="mt-3 grid gap-4 sm:grid-cols-3">
      <section class="card animate-rise p-5" style="--delay: 50ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Total anggaran</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <WalletCards :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="totalBudget" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">{{ statuses.length }} kategori diatur</p>
      </section>
      <section class="card animate-rise p-5" style="--delay: 90ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Terpakai</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-warning-soft text-warning">
            <AlertTriangle :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="totalSpent" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">{{ formatPercent(totalPercent) }} dari total anggaran</p>
      </section>
      <section class="card animate-rise p-5" style="--delay: 130ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Sisa anggaran</span>
          <span
            class="flex size-8 items-center justify-center rounded-lg"
            :class="totalRemaining >= 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'"
          >
            <CheckCircle2 :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight" :class="totalRemaining >= 0 ? 'text-ink' : 'text-danger'">
          {{ totalRemaining >= 0 ? '' : '−' }}{{ money(Math.abs(totalRemaining)) }}
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">
          {{ alertCount }} kategori perlu perhatian
        </p>
      </section>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <section class="card animate-rise overflow-hidden" style="--delay: 170ms">
        <div class="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 class="text-base font-extrabold text-ink">Anggaran per kategori</h2>
            <p class="mt-0.5 text-xs text-muted">Anggaran berlaku setiap bulan, dapat diubah kapan saja.</p>
          </div>
          <div class="hidden items-center gap-2 sm:flex">
            <span class="text-[10px] font-bold text-muted">Total</span>
            <span class="text-[10px] font-extrabold text-ink">{{ formatPercent(totalPercent) }}</span>
          </div>
        </div>

        <div v-if="orderedStatuses.length" class="divide-y divide-line">
          <div
            v-for="entry in orderedStatuses"
            :key="entry.budget.id"
            class="group px-5 py-4 transition-colors hover:bg-surface-2 sm:px-6"
          >
            <div class="flex items-start gap-3">
              <CategoryIcon
                :name="findCategory(entry.budget.category).icon"
                :color="findCategory(entry.budget.category).color"
                :size="17"
                box-size="sm"
              />
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="text-xs font-extrabold text-ink">{{ entry.budget.category }}</p>
                      <span class="chip px-1.5 py-0.5 text-[9px]" :class="stateClass(entry.state)">
                        {{ stateLabel(entry.state) }}
                      </span>
                    </div>
                    <p class="mt-1 text-[10px] font-semibold text-muted">
                      {{ money(entry.spent) }} dari {{ money(entry.budget.monthlyLimit) }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p
                      class="text-xs font-extrabold"
                      :class="entry.state === 'over' ? 'text-danger' : entry.state === 'near' ? 'text-warning' : 'text-ink-soft'"
                    >
                      {{ formatPercent(entry.percent) }}
                    </p>
                    <p class="mt-0.5 text-[10px] font-semibold text-muted">
                      {{ entry.remaining >= 0 ? `${money(entry.remaining)} tersisa` : `${money(Math.abs(entry.remaining))} lebih` }}
                    </p>
                  </div>
                </div>
                <ProgressBar
                  class="mt-2.5"
                  :value="entry.percent"
                  :tone="toneFor(entry.state)"
                  height="sm"
                  :aria-label="`Anggaran ${entry.budget.category}`"
                />
                <div class="mt-2 flex items-center justify-between">
                  <p v-if="entry.state === 'over'" class="flex items-center gap-1 text-[10px] font-bold text-danger">
                    <AlertTriangle :size="11" />
                    Pengeluaran melebihi anggaran bulan ini.
                  </p>
                  <p v-else-if="entry.state === 'near'" class="text-[10px] font-bold text-warning">
                    Hampir mencapai batas. Kurangi pengeluaran kategori ini.
                  </p>
                  <p v-else class="text-[10px] font-semibold text-muted">Pengeluaran masih terkendali.</p>
                  <div class="flex gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button type="button" class="icon-btn icon-btn-sm border-transparent bg-transparent" aria-label="Edit anggaran" @click="openEdit(entry.budget.id)">
                      <Pencil :size="12" />
                    </button>
                    <button type="button" class="icon-btn icon-btn-sm border-transparent bg-transparent hover:text-danger" aria-label="Hapus anggaran" @click="deleteBudget(entry.budget.id)">
                      <Trash2 :size="12" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <EmptyState
          v-else
          :icon="WalletCards"
          title="Belum ada anggaran"
          description="Tetapkan batas pengeluaran per kategori agar kamu tahu kapan harus berhenti."
        >
          <button type="button" class="btn btn-primary btn-sm" @click="openAdd">
            <Plus :size="14" />
            Buat anggaran pertama
          </button>
        </EmptyState>
      </section>

      <div class="space-y-4">
        <section class="card animate-rise p-5 sm:p-6" style="--delay: 210ms">
          <h2 class="text-sm font-extrabold text-ink">Ringkasan pengeluaran</h2>
          <p class="mt-1 text-[11px] text-muted">{{ monthLabel }}</p>
          <div class="mt-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-semibold text-muted">Seluruh pengeluaran</span>
              <span class="text-xs font-extrabold text-ink">{{ money(expenseTotalAll) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-semibold text-muted">Tercakup anggaran</span>
              <span class="text-xs font-extrabold text-ink">{{ money(totalSpent) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-semibold text-muted">Tanpa anggaran</span>
              <span class="text-xs font-extrabold text-warning">{{ money(unbudgetedTotal) }}</span>
            </div>
          </div>
          <div class="mt-4 border-t border-line pt-3">
            <p class="text-[10px] font-bold uppercase tracking-wide text-muted">Kategori tanpa anggaran</p>
            <div v-if="unbudgetedSpending.length" class="mt-2 space-y-2">
              <div
                v-for="entry in unbudgetedSpending.slice(0, 4)"
                :key="entry.category"
                class="flex items-center justify-between gap-2"
              >
                <span class="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-ink-soft">
                  <CategoryIcon :name="findCategory(entry.category).icon" :color="findCategory(entry.category).color" :boxed="false" :size="13" />
                  <span class="truncate">{{ entry.category }}</span>
                </span>
                <span class="shrink-0 text-[10px] font-bold text-muted">{{ money(entry.amount) }}</span>
              </div>
            </div>
            <p v-else class="mt-2 text-[11px] text-muted">Semua pengeluaran bulan ini sudah tercakup anggaran.</p>
          </div>
        </section>

        <section class="animate-rise rounded-2xl border border-primary/15 bg-primary-soft/50 p-5" style="--delay: 250ms">
          <div class="flex items-start gap-3">
            <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-primary">
              <WalletCards :size="17" />
            </span>
            <div>
              <p class="text-xs font-extrabold text-ink">Anggaran itu rambu, bukan larangan.</p>
              <p class="mt-1 text-[11px] leading-relaxed text-muted">
                Saat pengeluaran mencapai 80%, indikator berubah kuning. Jika melewati 100%, periksa
                kembali prioritas atau sesuaikan batas yang lebih realistis bulan depan.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <BaseModal
      :open="formOpen"
      :title="editingId ? 'Edit anggaran' : 'Tambah anggaran'"
      :subtitle="editingId ? 'Ubah batas bulanan untuk kategori ini.' : 'Pilih kategori pengeluaran dan tentukan batas bulanannya.'"
      size="sm"
      :persistent="saving"
      @close="formOpen = false"
    >
      <div class="space-y-4 pt-1">
        <div>
          <label for="budget-category" class="label">Kategori</label>
          <select
            id="budget-category"
            v-model="form.category"
            class="select"
            :disabled="!!editingId"
            :class="errors.category ? 'border-danger' : ''"
            @change="errors.category = ''"
          >
            <option v-for="category in availableCategories" :key="category.name" :value="category.name">
              {{ category.name }}
            </option>
          </select>
          <p v-if="errors.category" class="field-error">{{ errors.category }}</p>
          <p v-if="!availableCategories.length" class="field-hint">Semua kategori pengeluaran sudah punya anggaran.</p>
        </div>
        <div>
          <label for="budget-limit" class="label">Batas per bulan</label>
          <CurrencyInput id="budget-limit" v-model="form.monthlyLimit" :invalid="!!errors.monthlyLimit" />
          <p v-if="errors.monthlyLimit" class="field-error">{{ errors.monthlyLimit }}</p>
          <p v-else class="field-hint">Anggaran ini berlaku setiap bulan, berdasarkan transaksi pengeluaran kategori terkait.</p>
        </div>
        <div v-if="formError" class="rounded-xl bg-danger-soft p-3 text-xs font-semibold text-danger">{{ formError }}</div>
      </div>
      <template #footer>
        <button type="button" class="btn btn-secondary" :disabled="saving" @click="formOpen = false">Batal</button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="saving || !availableCategories.length"
          @click="saveBudget"
        >
          <LoaderCircle v-if="saving" :size="16" class="animate-spin" />
          <Plus v-else :size="16" />
          {{ editingId ? 'Simpan Perubahan' : 'Tambah Anggaran' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>
