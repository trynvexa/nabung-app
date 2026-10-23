<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRight,
  Camera,
  Check,
  ImagePlus,
  Info,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from '@lucide/vue'
import type { Deposit, PhotoMeta, SavingsTarget } from '@/types'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { loadPhoto, deletePhoto } from '@/lib/db'
import { createPhotoRecord, prepareImage } from '@/lib/image'
import type { PreparedImage } from '@/lib/image'
import { formatBytes, formatCurrency } from '@/lib/format'
import { formatDateLong, todayKey, toDateKey } from '@/lib/date'
import BaseModal from '@/components/ui/BaseModal.vue'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import PhotoThumb from '@/components/ui/PhotoThumb.vue'
import PhotoLightbox from '@/components/ui/PhotoLightbox.vue'
import ConfettiBurst from '@/components/ui/ConfettiBurst.vue'
import TargetIcon from '@/components/ui/TargetIcon.vue'
import SavingsCat from '@/components/brand/SavingsCat.vue'

const appStore = useAppStore()
const ui = useUiStore()

const form = reactive({
  amount: 0,
  targetId: '',
  walletId: '',
  date: todayKey(),
  note: '',
})
const errors = reactive({
  amount: '',
  target: '',
  wallet: '',
  date: '',
  photo: '',
})
const mode = ref<'form' | 'success'>('form')
const saving = ref(false)
const processingPhoto = ref(false)
const stagedImage = ref<PreparedImage | null>(null)
const previewUrl = ref('')
const existingPhotoId = ref<string | undefined>(undefined)
const removeExistingPhoto = ref(false)
const savedDeposit = ref<Deposit | null>(null)
const completedTarget = ref<SavingsTarget | null>(null)
const lightboxOpen = ref(false)
const initialSnapshot = ref('')
const cameraInput = ref<HTMLInputElement | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)
let previewIsLocal = false

const editing = computed(() =>
  ui.depositEditId ? appStore.data.deposits.find((item) => item.id === ui.depositEditId) : undefined,
)
const modalTitle = computed(() => {
  if (mode.value === 'success') return 'Setoran berhasil dicatat'
  return editing.value ? 'Edit setoran' : 'Tambah Tabungan'
})
const modalSubtitle = computed(() => {
  if (mode.value === 'success') return 'Bukti dan nominal sudah tersimpan di perangkat ini.'
  return editing.value
    ? 'Perbarui nominal, target, atau catatan setoran. Ringkasan akan ikut menyesuaikan.'
    : 'Catat tabunganmu dan simpan bukti foto sebagai dokumentasi pribadi.'
})

const previewPhotoId = computed(() => {
  if (stagedImage.value) return undefined
  if (removeExistingPhoto.value) return undefined
  return existingPhotoId.value
})

const showPhoto = computed(() => Boolean(previewUrl.value || previewPhotoId.value))
const photoMetaLabel = computed(() => {
  if (stagedImage.value) {
    return `${formatBytes(stagedImage.value.size)} · ${stagedImage.value.width}×${stagedImage.value.height}px · JPEG terkompresi`
  }
  const meta = editing.value?.photoMeta
  if (meta) {
    return `${formatBytes(meta.size)} · ${meta.width}×${meta.height}px`
  }
  return 'Foto tersimpan di perangkat'
})

const selectedTarget = computed(() =>
  appStore.data.targets.find((target) => target.id === form.targetId),
)
const targetHint = computed(() => {
  const target = selectedTarget.value
  if (!target) return 'Tanpa target, setoran tetap masuk ke total tabunganmu.'
  const saved = appStore.data.deposits
    .filter((deposit) => deposit.targetId === target.id && deposit.id !== editing.value?.id)
    .reduce((total, deposit) => total + deposit.amount, 0)
  const remaining = Math.max(target.targetAmount - saved, 0)
  return `Terkumpul ${formatCurrency(saved)} · sisa ${formatCurrency(remaining)}`
})
const selectedWallet = computed(() =>
  appStore.walletsWithBalance.find((entry) => entry.wallet.id === form.walletId),
)
const maxDate = todayKey()

function currentSnapshot(): string {
  return JSON.stringify({
    amount: form.amount,
    targetId: form.targetId,
    walletId: form.walletId,
    date: form.date,
    note: form.note.trim(),
    photo: stagedImage.value ? 'new' : removeExistingPhoto.value ? 'none' : existingPhotoId.value,
  })
}

function isDirty(): boolean {
  if (mode.value !== 'form') return false
  return currentSnapshot() !== initialSnapshot.value
}

function cleanupPreview(): void {
  if (previewIsLocal && previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = ''
  previewIsLocal = false
}

function resetFormState(): void {
  cleanupPreview()
  stagedImage.value = null
  existingPhotoId.value = undefined
  removeExistingPhoto.value = false
  savedDeposit.value = null
  completedTarget.value = null
  lightboxOpen.value = false
  mode.value = 'form'
  saving.value = false
  processingPhoto.value = false
  form.amount = 0
  form.note = ''
  form.targetId = ''
  form.walletId = ''
  form.date = todayKey()
  for (const key of Object.keys(errors) as Array<keyof typeof errors>) errors[key] = ''
  initialSnapshot.value = ''
}

function clearErrors(): void {
  for (const key of Object.keys(errors) as Array<keyof typeof errors>) errors[key] = ''
}

async function loadExistingPhoto(photoId: string): Promise<void> {
  cleanupPreview()
  const record = await loadPhoto(photoId)
  if (!record) return
  previewUrl.value = URL.createObjectURL(record.blob)
  previewIsLocal = true
}

async function initialize(): Promise<void> {
  resetFormState()
  const deposit = editing.value
  if (deposit) {
    form.amount = deposit.amount
    form.targetId = deposit.targetId ?? ''
    form.walletId = deposit.walletId
    form.date = toDateKey(deposit.date)
    form.note = deposit.note
    existingPhotoId.value = deposit.photoId
    if (deposit.photoId) await loadExistingPhoto(deposit.photoId)
  } else {
    form.walletId = appStore.data.wallets[0]?.id ?? ''
    form.targetId = ui.depositTargetId ?? ''
  }
  initialSnapshot.value = currentSnapshot()
}

watch(
  () => ui.depositOpen,
  (open) => {
    if (open) void initialize()
    else resetFormState()
  },
)

onBeforeUnmount(() => cleanupPreview())

function triggerCamera(): void {
  cameraInput.value?.click()
}

function triggerGallery(): void {
  galleryInput.value?.click()
}

async function handleFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  errors.photo = ''
  processingPhoto.value = true
  try {
    const prepared = await prepareImage(file)
    cleanupPreview()
    stagedImage.value = prepared
    removeExistingPhoto.value = false
    previewUrl.value = URL.createObjectURL(prepared.blob)
    previewIsLocal = true
  } catch (error) {
    errors.photo =
      error instanceof Error ? error.message : 'Foto tidak dapat diproses. Coba foto lain.'
  } finally {
    processingPhoto.value = false
  }
}

async function removePhoto(): Promise<void> {
  // Replacing a saved photo then deleting the replacement restores the saved one first.
  if (stagedImage.value && existingPhotoId.value && !removeExistingPhoto.value) {
    stagedImage.value = null
    cleanupPreview()
    await loadExistingPhoto(existingPhotoId.value)
    errors.photo = ''
    return
  }
  if (existingPhotoId.value && !removeExistingPhoto.value) {
    const confirmed = await ui.askConfirm({
      title: 'Hapus bukti foto?',
      message:
        'Foto akan dihapus dari perangkat setelah setoran disimpan. Nominal dan catatan setoran tetap dipertahankan.',
      confirmLabel: 'Hapus foto',
    })
    if (!confirmed) return
    removeExistingPhoto.value = true
  }
  cleanupPreview()
  stagedImage.value = null
  errors.photo = ''
}

function validate(): boolean {
  clearErrors()
  if (!Number.isFinite(form.amount) || form.amount <= 0) {
    errors.amount = 'Masukkan nominal setoran lebih dari 0.'
  } else if (form.amount > 1_000_000_000_000) {
    errors.amount = 'Nominal terlalu besar. Periksa kembali angka setoran.'
  }
  if (!form.walletId) errors.wallet = 'Pilih dompet sumber dana.'
  if (!form.date) errors.date = 'Tanggal setoran wajib diisi.'
  else if (form.date > maxDate) errors.date = 'Tanggal setoran tidak boleh di masa depan.'
  if (form.targetId && !appStore.data.targets.some((target) => target.id === form.targetId)) {
    errors.target = 'Target yang dipilih tidak ditemukan.'
  }
  if (!editing.value && !stagedImage.value) {
    errors.photo = 'Tambahkan satu foto bukti tabungan sebelum menyimpan.'
  }
  return !Object.values(errors).some(Boolean)
}

function composeDate(): string {
  if (!editing.value) return new Date().toISOString()
  const originalDateKey = toDateKey(editing.value.date)
  if (form.date === originalDateKey) return editing.value.date
  if (form.date === todayKey()) return new Date().toISOString()
  const [year = 1970, month = 1, day = 1] = form.date.split('-').map(Number)
  const now = new Date()
  return new Date(year, month - 1, day, now.getHours(), now.getMinutes()).toISOString()
}

async function submit(): Promise<void> {
  if (saving.value) return
  if (!validate()) return
  saving.value = true
  let newPhotoRecordId: string | undefined
  let finalPhotoId = removeExistingPhoto.value ? undefined : existingPhotoId.value
  let finalPhotoMeta: PhotoMeta | undefined = removeExistingPhoto.value
    ? undefined
    : editing.value?.photoMeta
  try {
    if (stagedImage.value) {
      const record = await createPhotoRecord(stagedImage.value)
      newPhotoRecordId = record.id
      finalPhotoId = record.id
      finalPhotoMeta = {
        mimeType: record.mimeType,
        size: record.size,
        width: record.width,
        height: record.height,
        originalName: stagedImage.value.originalName,
      }
    }
    const payload = {
      amount: form.amount,
      targetId: form.targetId || undefined,
      walletId: form.walletId,
      date: composeDate(),
      note: form.note.trim(),
      photoId: finalPhotoId,
      photoMeta: finalPhotoMeta,
    }
    const result = editing.value
      ? appStore.updateDeposit(editing.value.id, payload)
      : appStore.addDeposit(payload)
    if (existingPhotoId.value && existingPhotoId.value !== finalPhotoId) {
      await deletePhoto(existingPhotoId.value)
    }
    await appStore.flush()
    savedDeposit.value = result.deposit
    completedTarget.value = result.completedTarget ?? null
    mode.value = 'success'
    ui.notify('Setoran berhasil dicatat dan bukti tersimpan di perangkat.', {
      title: editing.value ? 'Setoran diperbarui' : 'Setoran tersimpan',
    })
  } catch (error) {
    if (newPhotoRecordId) await deletePhoto(newPhotoRecordId)
    const message = error instanceof Error ? error.message : 'Setoran gagal disimpan.'
    const quotaMessage = /quota|storage|penyimpanan/i.test(message)
      ? ' Penyimpanan browser mungkin penuh. Hapus beberapa bukti foto lama lalu coba lagi.'
      : ''
    errors.photo = `${message}${quotaMessage}`
    ui.notify(`${message}${quotaMessage}`, { variant: 'error', title: 'Gagal menyimpan' })
  } finally {
    saving.value = false
  }
}

async function requestClose(): Promise<void> {
  if (saving.value) return
  if (mode.value === 'success') {
    ui.closeDeposit()
    return
  }
  if (isDirty()) {
    const confirmed = await ui.askConfirm({
      title: editing.value ? 'Batalkan perubahan?' : 'Batalkan setoran?',
      message: 'Data yang belum disimpan akan hilang. Foto yang baru dipilih tidak akan tersimpan.',
      confirmLabel: 'Ya, batalkan',
      cancelLabel: 'Lanjut mengisi',
    })
    if (!confirmed) return
  }
  ui.closeDeposit()
}

function quickAmount(value: number): void {
  form.amount = value
  errors.amount = ''
}
</script>

<template>
  <BaseModal
    :open="ui.depositOpen"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    size="lg"
    :persistent="saving"
    @close="requestClose"
  >
    <ConfettiBurst v-if="mode === 'success' && completedTarget" />
    <div v-if="mode === 'form'" class="space-y-5 pt-1">
      <div class="relative flex h-[112px] items-center overflow-hidden rounded-[20px] bg-[#edf4e1] px-4 lg:hidden">
        <div class="relative z-10 max-w-[58%]">
          <p class="text-[13px] font-black leading-snug text-[#3f6047]">Yuk, mulai menabung!</p>
          <p class="mt-1 text-[9px] font-semibold leading-relaxed text-[#71806d]">
            Sedikit demi sedikit, impianmu semakin dekat.
          </p>
        </div>
        <SavingsCat class="absolute -bottom-7 -right-3 w-[126px]" />
        <span class="absolute right-[28%] top-3 size-1.5 rounded-full bg-[#ddbd70]" />
      </div>

      <div class="rounded-2xl border border-primary/15 bg-primary-soft/45 p-4 sm:p-5">
        <div class="flex items-start justify-between gap-3">
          <label for="deposit-amount" class="label text-ink">Jumlah setoran</label>
          <button
            type="button"
            class="flex items-center gap-1 text-[11px] font-bold text-primary transition-opacity hover:opacity-75"
            @click="form.targetId ? quickAmount(20000) : quickAmount(50000)"
          >
            <Info :size="12" />
            Contoh: {{ formatCurrency(20000) }}
          </button>
        </div>
        <CurrencyInput id="deposit-amount" v-model="form.amount" large :invalid="!!errors.amount" />
        <p v-if="errors.amount" class="field-error">{{ errors.amount }}</p>
        <div class="mt-3 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-1.5">
          <button
            v-for="value in [10000, 25000, 50000, 100000, 250000, 500000]"
            :key="value"
            type="button"
            class="rounded-lg border py-2 text-[10px] font-bold transition-colors sm:px-2.5 sm:py-1.5 sm:text-[11px]"
            :class="
              form.amount === value
                ? 'border-primary/30 bg-primary-soft text-primary'
                : 'border-line bg-surface text-ink-soft hover:border-primary/30 hover:text-primary'
            "
            @click="quickAmount(value)"
          >
            {{ value >= 1000 ? `${value / 1000}rb` : value }}
          </button>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="deposit-target" class="label">Target tabungan <span class="font-medium text-muted">(opsional)</span></label>
          <div class="relative">
            <select id="deposit-target" v-model="form.targetId" class="select" @change="errors.target = ''">
              <option value="">Tabungan umum</option>
              <option v-for="target in appStore.data.targets" :key="target.id" :value="target.id">
                {{ target.name }}
              </option>
            </select>
          </div>
          <p class="field-hint">{{ targetHint }}</p>
          <p v-if="errors.target" class="field-error">{{ errors.target }}</p>
        </div>
        <div>
          <label for="deposit-wallet" class="label">Dompet sumber dana</label>
          <select
            id="deposit-wallet"
            v-model="form.walletId"
            class="select"
            :class="errors.wallet ? 'border-danger' : ''"
            @change="errors.wallet = ''"
          >
            <option disabled value="">Pilih dompet</option>
            <option v-for="entry in appStore.walletsWithBalance" :key="entry.wallet.id" :value="entry.wallet.id">
              {{ entry.wallet.name }} · {{ formatCurrency(entry.balance) }}
            </option>
          </select>
          <p v-if="errors.wallet" class="field-error">{{ errors.wallet }}</p>
          <p v-else-if="selectedWallet" class="field-hint">
            Saldo dompet ini {{ formatCurrency(selectedWallet.balance) }}.
          </p>
        </div>
      </div>

      <div>
        <label for="deposit-date" class="label">Tanggal setoran</label>
        <input
          id="deposit-date"
          v-model="form.date"
          type="date"
          class="input"
          :max="maxDate"
          :class="errors.date ? 'border-danger' : ''"
          @change="errors.date = ''"
        />
        <p v-if="errors.date" class="field-error">{{ errors.date }}</p>
      </div>

      <div>
        <span class="label">Bukti foto</span>
        <input
          ref="cameraInput"
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden"
          @change="handleFile"
        />
        <input
          ref="galleryInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFile"
        />

        <div
          v-if="showPhoto"
          class="overflow-hidden rounded-2xl border border-line bg-surface-2"
        >
          <div class="relative aspect-[16/10] w-full overflow-hidden bg-surface-3">
            <img
              v-if="previewUrl"
              :src="previewUrl"
              alt="Pratinjau foto bukti setoran"
              class="h-full w-full object-cover"
            />
            <PhotoThumb v-else :photo-id="previewPhotoId" alt="Bukti setoran tersimpan" />
            <div class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
              <p class="text-[11px] font-semibold text-white/90">
                {{ stagedImage ? 'Foto baru siap disimpan' : 'Bukti tersimpan' }}
              </p>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  class="flex size-8 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
                  aria-label="Ganti foto dengan foto dari galeri"
                  @click="triggerGallery"
                >
                  <RefreshCw :size="14" />
                </button>
                <button
                  type="button"
                  class="flex size-8 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur transition-colors hover:bg-danger"
                  aria-label="Hapus foto bukti"
                  @click="removePhoto"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
            <div v-if="processingPhoto" class="absolute inset-0 flex items-center justify-center bg-black/45">
              <LoaderCircle :size="26" class="animate-spin text-white" />
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5">
            <p class="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
              <Check :size="13" class="text-success" />
              {{ photoMetaLabel }}
            </p>
            <button type="button" class="text-[11px] font-bold text-primary" @click="triggerCamera">
              Ambil ulang
            </button>
          </div>
        </div>

        <div
          v-else
          class="rounded-2xl border border-dashed border-line-strong bg-surface-2 p-5 text-center transition-colors hover:border-primary/40"
        >
          <div class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <ImagePlus :size="22" />
          </div>
          <p class="mt-3 text-sm font-extrabold text-ink">Tambahkan bukti tabungan</p>
          <p class="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
            Foto uang, celengan, atau bukti transfer. Foto dikompres dan hanya disimpan di browser ini.
          </p>
          <div class="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
            <button type="button" class="btn btn-secondary btn-sm" @click="triggerCamera">
              <Camera :size="15" />
              Ambil foto
            </button>
            <button type="button" class="btn btn-soft btn-sm" @click="triggerGallery">
              <ImagePlus :size="15" />
              Pilih dari galeri
            </button>
          </div>
          <p class="mt-3 text-[10px] text-muted">
            Kamera mengikuti dukungan browser & perangkat. Galeri selalu tersedia.
          </p>
        </div>
        <p v-if="errors.photo" class="field-error">{{ errors.photo }}</p>
        <p v-else class="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
          <ShieldCheck :size="13" class="mt-0.5 shrink-0 text-success" />
          Ini dokumentasi pribadi, bukan verifikasi otomatis bahwa uang sudah benar-benar disetorkan.
          Tidak ada foto yang diunggah ke server.
        </p>
      </div>

      <div>
        <label for="deposit-note" class="label">Catatan <span class="font-medium text-muted">(opsional)</span></label>
        <textarea
          id="deposit-note"
          v-model="form.note"
          class="textarea"
          maxlength="500"
          rows="2"
          placeholder="Misalnya: sisihan dari uang makan siang minggu ini."
        />
        <p class="mt-1 text-right text-[10px] text-muted">{{ form.note.length }}/500</p>
      </div>

      <div v-if="!appStore.data.wallets.length" class="rounded-xl bg-warning-soft p-3 text-xs font-semibold text-warning">
        Belum ada dompet. <RouterLink to="/dompet" class="underline" @click="ui.closeDeposit()">Buat dompet dulu</RouterLink> sebelum mencatat setoran.
      </div>
    </div>

    <div v-else class="relative pt-1">
      <div class="flex flex-col items-center pb-2 text-center">
        <div class="relative flex size-[76px] items-center justify-center rounded-full bg-success-soft">
          <svg viewBox="0 0 52 52" class="size-10 text-success" fill="none" aria-hidden="true">
            <circle cx="26" cy="26" r="23" stroke="currentColor" stroke-opacity="0.18" stroke-width="2" />
            <path
              d="M15 27.5 22.5 35 38 18.5"
              stroke="currentColor"
              stroke-width="3.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-dasharray="48"
              style="animation: draw-check 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both"
            />
          </svg>
        </div>
        <h3 class="mt-4 text-xl font-extrabold tracking-tight text-ink">Setoran berhasil dicatat</h3>
        <p class="mt-1 text-sm text-muted">Tabunganmu bertambah, dokumentasinya juga tersimpan.</p>
        <p class="mt-4 text-[34px] font-extrabold tracking-tight text-ink">
          {{ formatCurrency(savedDeposit?.amount ?? 0) }}
        </p>
        <div class="mt-2 flex flex-wrap items-center justify-center gap-2">
          <span class="chip tag-primary">
            {{ savedDeposit?.targetId ? appStore.targetName(savedDeposit.targetId) : 'Tabungan umum' }}
          </span>
          <span class="chip">{{ formatDateLong(savedDeposit?.date ?? new Date()) }}</span>
        </div>
      </div>

      <div
        v-if="completedTarget"
        class="mt-4 flex items-center gap-3 rounded-2xl border border-success/25 bg-success-soft p-3.5"
      >
        <TargetIcon :name="completedTarget.icon" color="#5B9563" />
        <div class="min-w-0 flex-1">
          <p class="text-xs font-extrabold text-success">Target tercapai!</p>
          <p class="mt-0.5 truncate text-[11px] text-success/80">
            {{ completedTarget.name }} berhasil kamu penuhi. Luar biasa.
          </p>
        </div>
      </div>

      <div v-if="savedDeposit?.photoId" class="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-2.5">
        <button
          type="button"
          class="size-14 shrink-0 overflow-hidden rounded-xl"
          aria-label="Buka bukti foto"
          @click="lightboxOpen = true"
        >
          <PhotoThumb :photo-id="savedDeposit.photoId" alt="Bukti setoran" />
        </button>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-extrabold text-ink">Bukti foto tersimpan</p>
          <p class="mt-0.5 text-[11px] leading-relaxed text-muted">
            Ada di riwayat setoran dan bisa diperbesar kapan saja.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-soft btn-sm shrink-0"
          @click="lightboxOpen = true"
        >
          Lihat
          <ArrowRight :size="13" />
        </button>
      </div>
      <div v-else class="mt-4 flex items-start gap-2.5 rounded-2xl bg-surface-2 p-3.5 text-[11px] leading-relaxed text-muted">
        <Info :size="15" class="mt-0.5 shrink-0" />
        Setoran ini tersimpan tanpa foto bukti. Kamu bisa menambahkan foto melalui edit setoran.
      </div>

      <div class="mt-4 rounded-xl bg-surface-2 px-3.5 py-3 text-left">
        <div class="flex items-center justify-between gap-3 text-xs">
          <span class="text-muted">Dompet sumber</span>
          <span class="font-bold text-ink">{{ savedDeposit ? appStore.walletName(savedDeposit.walletId) : '—' }}</span>
        </div>
        <div v-if="savedDeposit?.note" class="mt-2 border-t border-line pt-2 text-[11px] leading-relaxed text-muted">
          “{{ savedDeposit.note }}”
        </div>
      </div>
    </div>

    <template #footer>
      <template v-if="mode === 'form'">
        <button type="button" class="btn btn-secondary" :disabled="saving" @click="requestClose">
          Batal
        </button>
        <button type="button" class="btn btn-primary min-w-[150px]" :disabled="saving" @click="submit">
          <LoaderCircle v-if="saving" :size="16" class="animate-spin" />
          <Check v-else :size="16" />
          {{ saving ? 'Menyimpan…' : editing ? 'Simpan Perubahan' : 'Simpan Tabungan' }}
        </button>
      </template>
      <template v-else>
        <button
          v-if="savedDeposit?.photoId"
          type="button"
          class="btn btn-secondary"
          @click="lightboxOpen = true"
        >
          <Camera :size="15" />
          Lihat bukti foto
        </button>
        <button type="button" class="btn btn-primary" @click="ui.closeDeposit()">
          Selesai
        </button>
      </template>
    </template>
  </BaseModal>

  <PhotoLightbox
    :open="lightboxOpen"
    :photo-id="savedDeposit?.photoId"
    :title="`Bukti ${savedDeposit ? formatCurrency(savedDeposit.amount) : 'setoran'}`"
    :subtitle="savedDeposit ? `${formatDateLong(savedDeposit.date)} · ${appStore.walletName(savedDeposit.walletId)}` : undefined"
    @close="lightboxOpen = false"
  />
</template>
