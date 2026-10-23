<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flag,
  LoaderCircle,
  Pencil,
  Plus,
  ShieldCheck,
  Target as TargetIconLucide,
  Trash2,
  TrendingUp,
  Wallet,
} from '@lucide/vue'
import type { TargetPriority } from '@/types'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { formatCurrency, formatPercent } from '@/lib/format'
import { formatDateLong, daysBetween, todayKey } from '@/lib/date'
import { TARGET_COLORS, TARGET_ICONS } from '@/lib/categories'
import PageHeader from '@/components/ui/PageHeader.vue'
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import TargetIcon from '@/components/ui/TargetIcon.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import PhotoThumb from '@/components/ui/PhotoThumb.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ConfettiBurst from '@/components/ui/ConfettiBurst.vue'
import DepositDetailModal from '@/components/deposits/DepositDetailModal.vue'

const appStore = useAppStore()
const ui = useUiStore()

const hideAmounts = computed(() => appStore.data.settings.hideAmounts)
const totalTarget = computed(() =>
  appStore.data.targets.reduce((total, target) => total + target.targetAmount, 0),
)
const completedCount = computed(
  () => appStore.targetCards.filter((entry) => entry.progress.isComplete).length,
)
const emergencyTargets = computed(() => appStore.targetCards.filter((entry) => entry.target.isEmergencyFund))
const regularTargets = computed(() =>
  [...appStore.targetCards]
    .filter((entry) => !entry.target.isEmergencyFund)
    .sort((a, b) => {
      if (a.progress.isComplete !== b.progress.isComplete) return a.progress.isComplete ? 1 : -1
      const rank: Record<TargetPriority, number> = { high: 0, medium: 1, low: 2 }
      return rank[a.target.priority] - rank[b.target.priority]
    }),
)

const formOpen = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const formError = ref('')
const form = reactive({
  name: '',
  targetAmount: 0,
  deadline: '',
  description: '',
  icon: 'Target',
  priority: 'medium' as TargetPriority,
  isEmergencyFund: false,
})
const errors = reactive({ name: '', targetAmount: '', deadline: '' })

const selectedTargetId = ref<string>()
const detailOpen = ref(false)
const selectedDepositId = ref<string>()
const depositDetailOpen = ref(false)

const selectedEntry = computed(() =>
  selectedTargetId.value
    ? appStore.targetCards.find((entry) => entry.target.id === selectedTargetId.value)
    : undefined,
)
const linkedDeposits = computed(() => {
  if (!selectedEntry.value) return []
  return appStore.data.deposits
    .filter((deposit) => deposit.targetId === selectedEntry.value?.target.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const priorityOptions: TargetPriority[] = ['low', 'medium', 'high']

const priorityLabel: Record<TargetPriority, string> = {
  low: 'Prioritas rendah',
  medium: 'Prioritas sedang',
  high: 'Prioritas tinggi',
}
const priorityClass: Record<TargetPriority, string> = {
  low: 'text-muted bg-surface-3',
  medium: 'text-primary bg-primary-soft',
  high: 'text-danger bg-danger-soft',
}

function money(value: number): string {
  return hideAmounts.value ? 'Rp••••••' : formatCurrency(value)
}

function targetColor(index: number): string {
  return TARGET_COLORS[index % TARGET_COLORS.length] ?? '#5278F6'
}

function deadlineLabel(deadline?: string): string {
  if (!deadline) return 'Tanpa tenggat waktu'
  const days = daysBetween(todayKey(), deadline)
  if (days < 0) return `Tenggat terlewat ${Math.abs(days)} hari`
  if (days === 0) return 'Tenggat hari ini'
  return `${formatDateLong(deadline)} · ${days} hari lagi`
}

function estimateLabel(date: Date | null, isComplete: boolean): string {
  if (isComplete) return 'Target sudah tercapai'
  if (!date) return 'Butuh setoran rutin untuk estimasi'
  return `Perkiraan tercapai ${formatDateLong(date)}`
}

function openAdd(): void {
  editingId.value = null
  Object.assign(form, {
    name: '',
    targetAmount: 0,
    deadline: '',
    description: '',
    icon: 'Target',
    priority: 'medium',
    isEmergencyFund: false,
  })
  errors.name = ''
  errors.targetAmount = ''
  errors.deadline = ''
  formError.value = ''
  formOpen.value = true
}

function openEdit(id: string): void {
  const target = appStore.data.targets.find((item) => item.id === id)
  if (!target) return
  editingId.value = id
  Object.assign(form, {
    name: target.name,
    targetAmount: target.targetAmount,
    deadline: target.deadline ?? '',
    description: target.description,
    icon: target.icon,
    priority: target.priority,
    isEmergencyFund: target.isEmergencyFund,
  })
  errors.name = ''
  errors.targetAmount = ''
  errors.deadline = ''
  formError.value = ''
  detailOpen.value = false
  formOpen.value = true
}

function validate(): boolean {
  errors.name = form.name.trim() ? '' : 'Nama target wajib diisi.'
  errors.targetAmount = form.targetAmount > 0 ? '' : 'Nominal target harus lebih dari 0.'
  if (!form.deadline) errors.deadline = ''
  else if (!editingId.value && form.deadline < todayKey()) {
    errors.deadline = 'Tenggat tidak boleh di masa lalu.'
  } else errors.deadline = ''
  if (errors.name || errors.targetAmount || errors.deadline) return false
  if (form.name.trim().length > 80) {
    formError.value = 'Nama target maksimal 80 karakter.'
    return false
  }
  return true
}

function saveTarget(): void {
  if (saving.value || !validate()) return
  saving.value = true
  formError.value = ''
  try {
    const payload = {
      name: form.name.trim(),
      targetAmount: form.targetAmount,
      deadline: form.deadline || undefined,
      description: form.description.trim(),
      icon: form.icon,
      priority: form.priority,
      isEmergencyFund: form.isEmergencyFund,
    }
    if (editingId.value) {
      appStore.updateTarget(editingId.value, payload)
      ui.notify('Target tabungan berhasil diperbarui.', { title: 'Target diperbarui' })
    } else {
      appStore.addTarget(payload)
      ui.notify('Target baru sudah dibuat. Saatnya mulai menabung.', { title: 'Target dibuat' })
    }
    formOpen.value = false
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Target gagal disimpan.'
  } finally {
    saving.value = false
  }
}

async function deleteTarget(id: string): Promise<void> {
  const target = appStore.data.targets.find((item) => item.id === id)
  if (!target) return
  const linkedCount = appStore.data.deposits.filter((deposit) => deposit.targetId === id).length
  const confirmed = await ui.askConfirm({
    title: `Hapus target “${target.name}”?`,
    message:
      linkedCount > 0
        ? `${linkedCount} setoran terkait tidak akan dihapus, tetapi akan dialihkan menjadi tabungan umum. Tindakan ini tidak bisa dibatalkan.`
        : 'Target akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.',
    confirmLabel: 'Hapus target',
  })
  if (!confirmed) return
  if (appStore.deleteTarget(id)) {
    detailOpen.value = false
    ui.notify('Target berhasil dihapus. Setoran terkait tetap tersimpan.', { title: 'Target dihapus' })
  }
}

function openDetail(id: string): void {
  selectedTargetId.value = id
  detailOpen.value = true
}

function openDepositForTarget(id: string): void {
  detailOpen.value = false
  ui.openDeposit({ targetId: id })
}

function openLinkedDeposit(id: string): void {
  selectedDepositId.value = id
  depositDetailOpen.value = true
}

function editLinkedDeposit(id: string): void {
  depositDetailOpen.value = false
  detailOpen.value = false
  ui.openDeposit({ editId: id })
}

async function deleteLinkedDeposit(id: string): Promise<void> {
  const confirmed = await ui.askConfirm({
    title: 'Hapus setoran ini?',
    message: 'Nominal dan bukti foto akan dihapus, lalu progres target diperbarui.',
    confirmLabel: 'Hapus setoran',
  })
  if (!confirmed) return
  if (appStore.deleteDeposit(id)) {
    depositDetailOpen.value = false
    ui.notify('Setoran berhasil dihapus.', { title: 'Setoran dihapus' })
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Target Tabungan"
      subtitle="Tentukan tujuan, pecah jadi langkah kecil, lalu rayakan setiap kemajuannya."
      eyebrow="Rencana menabung"
    >
      <template #actions>
        <button type="button" class="btn btn-primary" @click="openAdd">
          <Plus :size="17" :stroke-width="2.5" />
          Buat Target
        </button>
      </template>
    </PageHeader>

    <div class="mt-6 grid gap-4 sm:grid-cols-3">
      <section class="card animate-rise p-5" style="--delay: 50ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Total target</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <TargetIconLucide :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="totalTarget" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">{{ appStore.data.targets.length }} target aktif</p>
      </section>
      <section class="card animate-rise p-5" style="--delay: 90ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Sudah terkumpul</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-success-soft text-success">
            <Wallet :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="appStore.targetCommitment.saved" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">
          {{ formatPercent(appStore.targetCommitment.percent) }} dari seluruh target
        </p>
      </section>
      <section class="card animate-rise p-5" style="--delay: 130ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Target tercapai</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-lavender-soft text-lavender">
            <CheckCircle2 :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-ink">{{ completedCount }}</p>
        <p class="mt-1 text-[11px] font-semibold text-muted">Terus jaga momentum menabungmu</p>
      </section>
    </div>

    <div v-if="emergencyTargets.length" class="mt-4 space-y-4">
      <section
        v-for="entry in emergencyTargets"
        :key="entry.target.id"
        class="animate-rise overflow-hidden rounded-2xl border border-success/20 bg-gradient-to-br from-success-soft/80 to-surface p-5 sm:p-6"
        style="--delay: 170ms"
      >
        <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div class="flex items-start gap-3.5">
            <span class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-success/12 text-success">
              <ShieldCheck :size="24" />
            </span>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <p class="text-[10px] font-extrabold uppercase tracking-[0.12em] text-success">Dana darurat</p>
                <span v-if="entry.progress.isComplete" class="chip tag-success">Tercapai</span>
              </div>
              <h2 class="mt-1 text-lg font-extrabold text-ink">{{ entry.target.name }}</h2>
              <p class="mt-1 max-w-md text-xs leading-relaxed text-muted">
                {{ entry.target.description || 'Jaring pengaman untuk kebutuhan tak terduga.' }}
              </p>
            </div>
          </div>
          <div class="w-full md:max-w-sm">
            <div class="flex items-end justify-between">
              <p class="text-xl font-extrabold text-ink">{{ money(entry.progress.saved) }}</p>
              <p class="text-xs font-semibold text-muted">dari {{ money(entry.target.targetAmount) }}</p>
            </div>
            <ProgressBar
              class="mt-2"
              :value="entry.progress.percent"
              :tone="entry.progress.isComplete ? 'success' : 'primary'"
              height="md"
              :aria-label="`Progres ${entry.target.name}`"
            />
            <div class="mt-2 flex items-center justify-between">
              <span class="text-[10px] font-bold text-success">{{ formatPercent(entry.progress.percent) }} siap</span>
              <button type="button" class="text-[11px] font-extrabold text-primary" @click="openDetail(entry.target.id)">
                Lihat detail
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="mt-4 flex items-center justify-between">
      <h2 class="text-sm font-extrabold text-ink">Target lainnya</h2>
      <span class="text-[11px] font-semibold text-muted">{{ regularTargets.length }} target</span>
    </div>

    <div v-if="regularTargets.length" class="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="(entry, index) in regularTargets"
        :key="entry.target.id"
        class="card animate-rise group relative flex flex-col overflow-hidden p-5"
        :style="{ '--delay': `${190 + index * 40}ms` }"
      >
        <div class="flex items-start justify-between gap-2">
          <TargetIcon
            :name="entry.target.icon"
            :color="entry.progress.isComplete ? '#24AD7A' : targetColor(index)"
            box-size="lg"
            :size="23"
          />
          <div class="flex items-center gap-1.5">
            <span class="chip" :class="priorityClass[entry.target.priority]">
              {{ priorityLabel[entry.target.priority] }}
            </span>
            <div class="flex items-center opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <button
                type="button"
                class="icon-btn icon-btn-sm border-transparent bg-transparent"
                aria-label="Edit target"
                @click="openEdit(entry.target.id)"
              >
                <Pencil :size="13" />
              </button>
              <button
                type="button"
                class="icon-btn icon-btn-sm border-transparent bg-transparent hover:text-danger"
                aria-label="Hapus target"
                @click="deleteTarget(entry.target.id)"
              >
                <Trash2 :size="13" />
              </button>
            </div>
          </div>
        </div>

        <button type="button" class="mt-4 flex-1 text-left" @click="openDetail(entry.target.id)">
          <div class="flex items-center gap-2">
            <h3 class="text-base font-extrabold text-ink transition-colors group-hover:text-primary">
              {{ entry.target.name }}
            </h3>
            <CheckCircle2 v-if="entry.progress.isComplete" :size="16" class="shrink-0 text-success" />
          </div>
          <p class="mt-1 line-clamp-2 min-h-[32px] text-[11px] leading-relaxed text-muted">
            {{ entry.target.description || 'Tanpa deskripsi.' }}
          </p>

          <div class="mt-4 flex items-end justify-between">
            <p class="text-[20px] font-extrabold tracking-tight text-ink">{{ money(entry.progress.saved) }}</p>
            <p class="text-[11px] font-bold text-muted">/ {{ money(entry.target.targetAmount) }}</p>
          </div>
          <ProgressBar
            class="mt-2"
            :value="entry.progress.percent"
            :tone="entry.progress.isComplete ? 'success' : 'primary'"
            height="sm"
            :aria-label="`Progres ${entry.target.name}`"
          />
          <div class="mt-2 flex items-center justify-between text-[10px] font-semibold">
            <span :class="entry.progress.isComplete ? 'text-success' : 'text-primary'">
              {{ formatPercent(entry.progress.percent) }} tercapai
            </span>
            <span class="text-muted">Sisa {{ money(entry.progress.remaining) }}</span>
          </div>

          <div class="mt-4 space-y-1.5 border-t border-line pt-3">
            <p class="flex items-center gap-1.5 text-[10px] font-semibold text-muted">
              <CalendarDays :size="12" :class="entry.target.deadline ? 'text-lavender' : ''" />
              {{ deadlineLabel(entry.target.deadline) }}
            </p>
            <p class="flex items-center gap-1.5 text-[10px] font-semibold text-muted">
              <TrendingUp :size="12" class="text-success" />
              {{ estimateLabel(entry.estimate, entry.progress.isComplete) }}
            </p>
          </div>
        </button>

        <div class="mt-4 flex items-center justify-between border-t border-line pt-3">
          <button
            type="button"
            class="flex items-center gap-1 text-[11px] font-extrabold text-primary transition-opacity hover:opacity-75"
            @click="openDepositForTarget(entry.target.id)"
          >
            <Plus :size="13" />
            Catat setoran
          </button>
          <button
            type="button"
            class="flex items-center gap-1 text-[11px] font-bold text-muted transition-colors hover:text-ink"
            @click="openDetail(entry.target.id)"
          >
            Detail
            <ArrowRight :size="13" />
          </button>
        </div>
      </article>
    </div>

    <div v-else-if="!emergencyTargets.length" class="card mt-3">
      <EmptyState
        :icon="TargetIconLucide"
        title="Belum ada target tabungan"
        description="Target membuat menabung lebih terarah. Mulai dari impian kecil yang paling kamu inginkan."
      >
        <button type="button" class="btn btn-primary btn-sm" @click="openAdd">
          <Plus :size="14" />
          Buat target pertama
        </button>
      </EmptyState>
    </div>
    <div v-else class="card mt-3">
      <EmptyState
        compact
        :icon="TargetIconLucide"
        title="Tambah target lainnya"
        description="Kamu sudah punya dana darurat. Buat target untuk impian berikutnya."
      >
        <button type="button" class="btn btn-soft btn-sm" @click="openAdd">
          <Plus :size="14" />
          Buat target
        </button>
      </EmptyState>
    </div>

    <BaseModal
      :open="formOpen"
      :title="editingId ? 'Edit target tabungan' : 'Buat target baru'"
      :subtitle="editingId ? 'Perbarui detail target. Progres dihitung dari setoran terkait.' : 'Tentukan tujuan dan nominal yang realistis, lalu mulai menabung.'"
      size="lg"
      :persistent="saving"
      @close="formOpen = false"
    >
      <div class="space-y-4 pt-1">
        <div>
          <label for="target-name" class="label">Nama target</label>
          <input
            id="target-name"
            v-model="form.name"
            type="text"
            class="input"
            maxlength="80"
            placeholder="Misalnya: Liburan ke Bali"
            :class="errors.name ? 'border-danger' : ''"
          />
          <p v-if="errors.name" class="field-error">{{ errors.name }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="target-amount" class="label">Nominal target</label>
            <CurrencyInput id="target-amount" v-model="form.targetAmount" :invalid="!!errors.targetAmount" />
            <p v-if="errors.targetAmount" class="field-error">{{ errors.targetAmount }}</p>
          </div>
          <div>
            <label for="target-deadline" class="label">Tenggat waktu <span class="font-medium text-muted">(opsional)</span></label>
            <input
              id="target-deadline"
              v-model="form.deadline"
              type="date"
              class="input"
              :min="todayKey()"
              :class="errors.deadline ? 'border-danger' : ''"
            />
            <p v-if="errors.deadline" class="field-error">{{ errors.deadline }}</p>
          </div>
        </div>

        <div>
          <label for="target-description" class="label">Deskripsi <span class="font-medium text-muted">(opsional)</span></label>
          <textarea
            id="target-description"
            v-model="form.description"
            class="textarea"
            maxlength="500"
            placeholder="Ceritakan alasan target ini penting untukmu."
          />
        </div>

        <div>
          <span class="label">Ikon target</span>
          <div class="grid grid-cols-5 gap-2 sm:grid-cols-10">
            <button
              v-for="icon in TARGET_ICONS"
              :key="icon.name"
              type="button"
              class="flex aspect-square items-center justify-center rounded-xl border transition-all"
              :class="
                form.icon === icon.name
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink'
              "
              :aria-label="`Pilih ikon ${icon.label}`"
              :aria-pressed="form.icon === icon.name"
              :title="icon.label"
              @click="form.icon = icon.name"
            >
              <TargetIcon :name="icon.name" :boxed="false" :size="19" color="currentColor" />
            </button>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <span class="label">Prioritas</span>
            <div class="flex gap-1.5">
              <button
                v-for="priority in priorityOptions"
                :key="priority"
                type="button"
                class="flex-1 rounded-xl border px-2 py-2 text-[11px] font-bold capitalize transition-colors"
                :class="
                  form.priority === priority
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-line bg-surface-2 text-muted hover:text-ink'
                "
                @click="form.priority = priority"
              >
                {{ priority === 'low' ? 'Rendah' : priority === 'medium' ? 'Sedang' : 'Tinggi' }}
              </button>
            </div>
          </div>
          <div class="flex flex-col justify-end">
            <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
              <span class="flex size-9 items-center justify-center rounded-lg bg-success-soft text-success">
                <ShieldCheck :size="17" />
              </span>
              <span class="flex-1">
                <span class="block text-xs font-extrabold text-ink">Jadikan dana darurat</span>
                <span class="mt-0.5 block text-[10px] text-muted">Tampil khusus di halaman target.</span>
              </span>
              <input v-model="form.isEmergencyFund" type="checkbox" class="size-4 rounded accent-[var(--primary)]" />
            </label>
          </div>
        </div>

        <div v-if="formError" class="rounded-xl bg-danger-soft p-3 text-xs font-semibold text-danger">{{ formError }}</div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-secondary" :disabled="saving" @click="formOpen = false">
          Batal
        </button>
        <button type="button" class="btn btn-primary" :disabled="saving" @click="saveTarget">
          <LoaderCircle v-if="saving" :size="16" class="animate-spin" />
          <CheckCircle2 v-else :size="16" />
          {{ editingId ? 'Simpan Perubahan' : 'Buat Target' }}
        </button>
      </template>
    </BaseModal>

    <BaseModal
      :open="detailOpen"
      :title="selectedEntry?.target.name ?? 'Detail target'"
      subtitle="Progres, tenggat, dan setoran yang terkait."
      size="lg"
      @close="detailOpen = false"
    >
      <div v-if="selectedEntry" class="relative space-y-4 pt-1">
        <ConfettiBurst v-if="selectedEntry.progress.isComplete" :count="20" />
        <div class="flex flex-col gap-4 rounded-2xl bg-surface-2 p-4 sm:flex-row sm:items-center">
          <TargetIcon
            :name="selectedEntry.target.icon"
            :color="selectedEntry.progress.isComplete ? '#24AD7A' : '#5278F6'"
            box-size="lg"
            :size="24"
          />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="chip" :class="priorityClass[selectedEntry.target.priority]">
                {{ priorityLabel[selectedEntry.target.priority] }}
              </span>
              <span v-if="selectedEntry.target.isEmergencyFund" class="chip tag-success">Dana darurat</span>
              <span v-if="selectedEntry.progress.isComplete" class="chip tag-success">Tercapai</span>
            </div>
            <p class="mt-2 text-[26px] font-extrabold tracking-tight text-ink">
              {{ money(selectedEntry.progress.saved) }}
              <span class="text-sm font-semibold text-muted">/ {{ money(selectedEntry.target.targetAmount) }}</span>
            </p>
            <ProgressBar
              class="mt-2"
              :value="selectedEntry.progress.percent"
              :tone="selectedEntry.progress.isComplete ? 'success' : 'primary'"
              height="md"
              :aria-label="`Progres ${selectedEntry.target.name}`"
            />
            <div class="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-muted">
              <span>{{ formatPercent(selectedEntry.progress.percent) }} tercapai</span>
              <span>Sisa {{ money(selectedEntry.progress.remaining) }}</span>
            </div>
          </div>
        </div>

        <div v-if="selectedEntry.target.description" class="rounded-xl border border-line p-3.5">
          <p class="text-[11px] font-bold text-muted">Tentang target</p>
          <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">{{ selectedEntry.target.description }}</p>
        </div>

        <div class="grid gap-2 sm:grid-cols-3">
          <div class="rounded-xl border border-line p-3">
            <div class="flex items-center gap-1.5 text-[10px] font-bold text-muted">
              <CalendarDays :size="12" />
              Tenggat
            </div>
            <p class="mt-1 text-xs font-bold text-ink">{{ deadlineLabel(selectedEntry.target.deadline) }}</p>
          </div>
          <div class="rounded-xl border border-line p-3">
            <div class="flex items-center gap-1.5 text-[10px] font-bold text-muted">
              <Clock3 :size="12" />
              Estimasi
            </div>
            <p class="mt-1 text-xs font-bold text-ink">
              {{ estimateLabel(selectedEntry.estimate, selectedEntry.progress.isComplete) }}
            </p>
          </div>
          <div class="rounded-xl border border-line p-3">
            <div class="flex items-center gap-1.5 text-[10px] font-bold text-muted">
              <Flag :size="12" />
              Setoran terkait
            </div>
            <p class="mt-1 text-xs font-bold text-ink">{{ linkedDeposits.length }} setoran</p>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <p class="text-xs font-extrabold text-ink">Setoran untuk target ini</p>
            <button
              type="button"
              class="flex items-center gap-1 text-[11px] font-extrabold text-primary"
              @click="openDepositForTarget(selectedEntry.target.id)"
            >
              <Plus :size="12" />
              Tambah
            </button>
          </div>
          <div v-if="linkedDeposits.length" class="mt-2 max-h-64 space-y-1.5 overflow-y-auto pr-1">
            <button
              v-for="deposit in linkedDeposits"
              :key="deposit.id"
              type="button"
              class="flex w-full items-center gap-3 rounded-xl border border-line p-2.5 text-left transition-colors hover:bg-surface-2"
              @click="openLinkedDeposit(deposit.id)"
            >
              <div class="size-10 shrink-0 overflow-hidden rounded-lg border border-line">
                <PhotoThumb :photo-id="deposit.photoId" alt="Bukti setoran" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-extrabold text-ink">{{ money(deposit.amount) }}</p>
                <p class="mt-0.5 truncate text-[10px] text-muted">
                  {{ formatDateLong(deposit.date) }}{{ deposit.note ? ` · ${deposit.note}` : '' }}
                </p>
              </div>
              <ArrowRight :size="14" class="shrink-0 text-muted" />
            </button>
          </div>
          <p v-else class="mt-2 rounded-xl border border-dashed border-line bg-surface-2 p-4 text-center text-[11px] text-muted">
            Belum ada setoran untuk target ini. Mulai catat setoran pertamamu.
          </p>
        </div>
      </div>

      <template #footer>
        <button
          v-if="selectedEntry"
          type="button"
          class="btn btn-danger sm:mr-auto"
          @click="deleteTarget(selectedEntry.target.id)"
        >
          <Trash2 :size="15" />
          Hapus
        </button>
        <button type="button" class="btn btn-secondary" @click="detailOpen = false">Tutup</button>
        <button
          v-if="selectedEntry"
          type="button"
          class="btn btn-soft"
          @click="openDepositForTarget(selectedEntry.target.id)"
        >
          <Plus :size="15" />
          Catat Setoran
        </button>
        <button
          v-if="selectedEntry"
          type="button"
          class="btn btn-primary"
          @click="openEdit(selectedEntry.target.id)"
        >
          <Pencil :size="15" />
          Edit
        </button>
      </template>
    </BaseModal>

    <DepositDetailModal
      :open="depositDetailOpen"
      :deposit-id="selectedDepositId"
      @close="depositDetailOpen = false"
      @edit="editLinkedDeposit"
      @delete="deleteLinkedDeposit"
    />
  </div>
</template>
