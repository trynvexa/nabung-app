<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Component } from 'vue'
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Eye,
  EyeOff,
  FileJson,
  FileSpreadsheet,
  HardDrive,
  LoaderCircle,
  LockKeyhole,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
  UserRound,
} from '@lucide/vue'
import type { ThemeMode } from '@/types'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import {
  backupFilename,
  buildBackup,
  csvFilename,
  depositsToCsv,
  downloadFile,
  restoreBackupPhotos,
  transactionsToCsv,
} from '@/lib/backup'
import { sanitizeImportedData } from '@/lib/data'
import { clearPhotos, getStorageEstimate, loadPhoto } from '@/lib/db'
import { formatBytes, formatPercent, initials } from '@/lib/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'

interface ThemeOption {
  value: ThemeMode
  label: string
  description: string
  icon: Component
}

interface StorageInfo {
  usage: number
  quota: number
}

const appStore = useAppStore()
const ui = useUiStore()
const { setTheme } = useTheme()

const hideAmounts = computed(() => appStore.data.settings.hideAmounts)
const profileName = computed(() => appStore.data.settings.profileName)
const profileInitials = computed(() => initials(profileName.value))
const currentTheme = computed(() => appStore.data.settings.theme)
const photoCount = computed(
  () => appStore.data.deposits.filter((deposit) => Boolean(deposit.photoId)).length,
)

const formName = ref(profileName.value)
const profileError = ref('')
const profileSaved = ref(false)

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Terang',
    description: 'Bersih, lembut, dan lapang.',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Gelap',
    description: 'Nyaman untuk malam hari.',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'Ikuti sistem',
    description: 'Menyesuaikan perangkatmu.',
    icon: Monitor,
  },
]

function saveProfile(): void {
  const name = formName.value.trim()
  if (name.length < 2) {
    profileError.value = 'Nama profil minimal 2 karakter.'
    profileSaved.value = false
    return
  }
  profileError.value = ''
  appStore.updateSettings({ profileName: name })
  formName.value = name
  profileSaved.value = true
  ui.notify('Nama profil berhasil diperbarui.', { title: 'Profil disimpan' })
  window.setTimeout(() => {
    profileSaved.value = false
  }, 2500)
}

function chooseTheme(theme: ThemeMode): void {
  setTheme(theme)
  const label = themeOptions.find((option) => option.value === theme)?.label ?? theme
  ui.notify(`Tema ${label.toLowerCase()} diterapkan.`, { title: 'Tampilan diperbarui', variant: 'info' })
}

function toggleAmounts(): void {
  const next = !hideAmounts.value
  appStore.updateSettings({ hideAmounts: next })
  ui.notify(
    next
      ? 'Nominal kini disembunyikan di seluruh aplikasi.'
      : 'Nominal kembali ditampilkan di seluruh aplikasi.',
    { title: next ? 'Nominal disembunyikan' : 'Nominal ditampilkan', variant: 'info' },
  )
}

const exporting = ref(false)
const exportingCsv = ref<'transactions' | 'deposits' | ''>('')
const importing = ref(false)
const resetting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

async function exportBackup(): Promise<void> {
  if (exporting.value) return
  exporting.value = true
  try {
    const backup = await buildBackup(appStore.data)
    downloadFile(
      backupFilename(),
      JSON.stringify(backup, null, 2),
      'application/json;charset=utf-8',
    )
    const photoTotal = Object.keys(backup.photos).length
    ui.notify(
      `Cadangan berisi data keuangan dan ${photoTotal} foto berhasil diunduh.`,
      { title: 'Cadangan dibuat' },
    )
  } catch (error) {
    ui.notify(error instanceof Error ? error.message : 'Cadangan gagal dibuat.', {
      title: 'Ekspor gagal',
      variant: 'error',
    })
  } finally {
    exporting.value = false
  }
}

function exportCsv(kind: 'transactions' | 'deposits'): void {
  if (exportingCsv.value) return
  exportingCsv.value = kind
  try {
    if (kind === 'transactions') {
      downloadFile(
        csvFilename('transaksi'),
        transactionsToCsv(appStore.data),
        'text/csv;charset=utf-8',
      )
      ui.notify('Daftar transaksi diunduh sebagai CSV.', { title: 'Ekspor transaksi selesai' })
    } else {
      downloadFile(
        csvFilename('setoran'),
        depositsToCsv(appStore.data),
        'text/csv;charset=utf-8',
      )
      ui.notify('Daftar setoran diunduh sebagai CSV.', { title: 'Ekspor setoran selesai' })
    }
  } catch {
    ui.notify('File CSV gagal dibuat. Coba lagi.', { variant: 'error' })
  } finally {
    exportingCsv.value = ''
  }
}

function triggerImport(): void {
  if (importing.value) return
  fileInput.value?.click()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function onImportFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || importing.value) return
  if (file.size > 40 * 1024 * 1024) {
    ui.notify('Ukuran file melebihi 40 MB. Pilih file cadangan yang lebih kecil.', {
      title: 'File terlalu besar',
      variant: 'error',
    })
    return
  }

  importing.value = true
  try {
    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text()) as unknown
    } catch {
      ui.notify('File tidak dapat dibaca sebagai JSON yang valid.', {
        title: 'Format file salah',
        variant: 'error',
      })
      return
    }

    const sanitized = sanitizeImportedData(parsed)
    if (!sanitized) {
      ui.notify(
        'File bukan cadangan Savezy yang valid. Pastikan file berasal dari menu Ekspor cadangan.',
        { title: 'Cadangan tidak dikenali', variant: 'error' },
      )
      return
    }

    const data = sanitized.data
    const confirmed = await ui.askConfirm({
      title: 'Impor dan ganti seluruh data?',
      message: `Data saat ini akan diganti dengan ${data.deposits.length} setoran, ${data.transactions.length} transaksi, ${data.targets.length} target, dan ${sanitized.photoIds.length} kandidat foto. Tindakan ini tidak dapat dibatalkan tanpa cadangan lain.`,
      confirmLabel: 'Impor sekarang',
      cancelLabel: 'Batal',
      tone: 'danger',
    })
    if (!confirmed) return

    await clearPhotos()
    const photosRaw = isRecord(parsed) ? parsed.photos : undefined
    const restored = photosRaw
      ? await restoreBackupPhotos(photosRaw, sanitized.photoIds)
      : 0

    let missingPhotos = 0
    for (const deposit of data.deposits) {
      if (!deposit.photoId) continue
      const photo = await loadPhoto(deposit.photoId)
      if (!photo) {
        deposit.photoId = undefined
        deposit.photoMeta = undefined
        missingPhotos += 1
      }
    }

    appStore.replaceData(data)
    await appStore.flush()
    formName.value = data.settings.profileName
    profileError.value = ''
    await refreshStorage()

    if (missingPhotos > 0) {
      ui.notify(
        `${data.deposits.length} setoran berhasil diimpor. ${missingPhotos} foto tidak tersedia di file cadangan; setoran tetap tersimpan tanpa foto.`,
        { title: 'Impor selesai dengan catatan', variant: 'warning', duration: 6500 },
      )
    } else {
      ui.notify(
        `${data.deposits.length} setoran, ${data.transactions.length} transaksi, dan ${restored} foto berhasil dipulihkan.`,
        { title: 'Impor berhasil' },
      )
    }
  } catch (error) {
    ui.notify(error instanceof Error ? error.message : 'Cadangan gagal diimpor.', {
      title: 'Impor gagal',
      variant: 'error',
    })
  } finally {
    importing.value = false
  }
}

const storage = ref<StorageInfo | null>(null)
const storageLoading = ref(false)
const storagePercent = computed(() => {
  if (!storage.value || storage.value.quota <= 0) return 0
  return Math.min((storage.value.usage / storage.value.quota) * 100, 100)
})
const storagePercentLabel = computed(() =>
  storage.value ? formatPercent(storagePercent.value, 1) : '—',
)

async function refreshStorage(): Promise<void> {
  storageLoading.value = true
  try {
    storage.value = await getStorageEstimate()
  } finally {
    storageLoading.value = false
  }
}

async function resetWithDemo(): Promise<void> {
  if (resetting.value) return
  const confirmed = await ui.askConfirm({
    title: 'Muat ulang data contoh?',
    message:
      'Seluruh data saat ini dan foto bukti akan dihapus, lalu diganti dengan data contoh Savezy. Ekspor cadangan terlebih dahulu jika data ini masih kamu butuhkan.',
    confirmLabel: 'Muat data contoh',
    cancelLabel: 'Batal',
    tone: 'danger',
  })
  if (!confirmed) return
  resetting.value = true
  try {
    await appStore.resetAll(true)
    formName.value = appStore.data.settings.profileName
    await refreshStorage()
    ui.notify('Data contoh berhasil dimuat kembali.', { title: 'Data direset' })
  } catch (error) {
    ui.notify(error instanceof Error ? error.message : 'Data gagal direset.', {
      title: 'Reset gagal',
      variant: 'error',
    })
  } finally {
    resetting.value = false
  }
}

async function resetEmpty(): Promise<void> {
  if (resetting.value) return
  const confirmed = await ui.askConfirm({
    title: 'Kosongkan semua data?',
    message:
      'Semua setoran, target, transaksi, anggaran, tagihan, tantangan, transfer, dan foto akan dihapus permanen. Hanya satu dompet kosong yang tersisa.',
    confirmLabel: 'Kosongkan semua',
    cancelLabel: 'Batal',
    tone: 'danger',
  })
  if (!confirmed) return
  resetting.value = true
  try {
    await appStore.resetAll(false)
    formName.value = appStore.data.settings.profileName
    await refreshStorage()
    ui.notify('Aplikasi kembali ke kondisi kosong. Mulai dari langkah pertamamu.', {
      title: 'Data dikosongkan',
    })
  } catch (error) {
    ui.notify(error instanceof Error ? error.message : 'Data gagal dikosongkan.', {
      title: 'Reset gagal',
      variant: 'error',
    })
  } finally {
    resetting.value = false
  }
}

onMounted(() => {
  void refreshStorage()
})
</script>

<template>
  <div>
    <PageHeader
      title="Pengaturan"
      subtitle="Atur profil, tampilan, dan cadangan data. Semua informasi tetap tersimpan di perangkat ini."
      eyebrow="Preferensi & data"
    >
      <template #actions>
        <button type="button" class="btn btn-primary" :disabled="exporting" @click="exportBackup">
          <LoaderCircle v-if="exporting" :size="16" class="animate-spin" />
          <Download v-else :size="16" />
          Ekspor Cadangan
        </button>
      </template>
    </PageHeader>

    <div class="mt-6 grid gap-4 lg:grid-cols-[1.05fr_1fr]">
      <section class="card animate-rise p-5 sm:p-6" style="--delay: 50ms">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="eyebrow">Profil</p>
            <h2 class="mt-1 text-base font-extrabold text-ink">Kenali pemilik tabungan</h2>
          </div>
          <span class="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <UserRound :size="17" />
          </span>
        </div>

        <div class="mt-5 flex items-center gap-4">
          <span
            class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-[17px] font-extrabold text-white shadow-[0_12px_26px_-16px_rgba(82,120,246,0.9)]"
          >
            {{ profileInitials }}
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-extrabold text-ink">{{ profileName }}</p>
            <p class="mt-1 text-[11px] font-semibold text-muted">
              {{ appStore.data.deposits.length }} setoran · {{ appStore.data.targets.length }} target
            </p>
          </div>
        </div>

        <div class="mt-5">
          <label for="profile-name" class="label">Nama profil</label>
          <div class="flex flex-col gap-2 sm:flex-row">
            <input
              id="profile-name"
              v-model="formName"
              type="text"
              class="input flex-1"
              :class="profileError ? 'border-danger' : ''"
              maxlength="60"
              autocomplete="name"
              placeholder="Nama kamu"
              @input="profileError = ''; profileSaved = false"
            />
            <button
              type="button"
              class="btn btn-primary shrink-0"
              :disabled="!formName.trim() || formName.trim() === profileName"
              @click="saveProfile"
            >
              <CheckCircle2 v-if="profileSaved" :size="16" />
              Simpan
            </button>
          </div>
          <p v-if="profileError" class="field-error">{{ profileError }}</p>
          <p v-else class="field-hint">Nama ini hanya disimpan di perangkatmu dan tidak dikirim ke server.</p>
        </div>
      </section>

      <section class="card animate-rise p-5 sm:p-6" style="--delay: 90ms">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="eyebrow">Tampilan</p>
            <h2 class="mt-1 text-base font-extrabold text-ink">Sesuaikan suasana</h2>
          </div>
          <span class="flex size-9 items-center justify-center rounded-xl bg-lavender-soft text-lavender">
            <Palette :size="17" />
          </span>
        </div>

        <div class="mt-4 space-y-2">
          <button
            v-for="option in themeOptions"
            :key="option.value"
            type="button"
            class="flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors"
            :class="currentTheme === option.value ? 'border-primary bg-primary-soft/60' : 'border-line bg-surface-2 hover:border-line-strong'"
            @click="chooseTheme(option.value)"
          >
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-lg"
              :class="currentTheme === option.value ? 'bg-primary text-white' : 'bg-surface text-muted'"
            >
              <component :is="option.icon" :size="16" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-xs font-extrabold text-ink">{{ option.label }}</span>
              <span class="mt-0.5 block text-[10px] text-muted">{{ option.description }}</span>
            </span>
            <span
              class="size-4 shrink-0 rounded-full border-2"
              :class="currentTheme === option.value ? 'border-primary bg-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-surface' : 'border-line-strong'"
              aria-hidden="true"
            />
          </button>
        </div>

        <div class="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line p-3.5">
          <div class="flex items-center gap-2.5">
            <span class="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-muted">
              <EyeOff v-if="hideAmounts" :size="15" />
              <Eye v-else :size="15" />
            </span>
            <div>
              <p class="text-xs font-bold text-ink">Sembunyikan nominal</p>
              <p class="mt-0.5 text-[10px] text-muted">Berguna saat layar dilihat orang lain.</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="hideAmounts"
            class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
            :class="hideAmounts ? 'bg-primary' : 'bg-line-strong'"
            aria-label="Sembunyikan semua nominal"
            @click="toggleAmounts"
          >
            <span
              class="absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform"
              :class="hideAmounts ? 'translate-x-[22px]' : 'translate-x-0.5'"
            />
          </button>
        </div>
      </section>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <section class="card animate-rise overflow-hidden" style="--delay: 130ms">
        <div class="border-b border-line px-5 py-4 sm:px-6">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="eyebrow">Cadangan</p>
              <h2 class="mt-1 text-base font-extrabold text-ink">Simpan dan pulihkan data</h2>
              <p class="mt-1 text-xs text-muted">
                Cadangan JSON menyertakan metadata dan foto bukti setoran yang tersimpan.
              </p>
            </div>
            <span class="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <FileJson :size="17" />
            </span>
          </div>
        </div>

        <div class="p-5 sm:p-6">
          <div class="rounded-2xl border border-primary/15 bg-primary-soft/50 p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-start gap-3">
                <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-primary">
                  <Database :size="18" />
                </span>
                <div>
                  <p class="text-xs font-extrabold text-ink">Cadangan lengkap Savezy</p>
                  <p class="mt-1 text-[11px] leading-relaxed text-muted">
                    {{ appStore.data.deposits.length }} setoran · {{ photoCount }} foto · {{ appStore.data.transactions.length }} transaksi
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="btn btn-primary btn-sm shrink-0"
                :disabled="exporting"
                @click="exportBackup"
              >
                <LoaderCircle v-if="exporting" :size="14" class="animate-spin" />
                <Download v-else :size="14" />
                Unduh JSON
              </button>
            </div>
          </div>

          <div class="mt-3 rounded-2xl border border-line bg-surface-2 p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-start gap-3">
                <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-lavender">
                  <Upload :size="18" />
                </span>
                <div>
                  <p class="text-xs font-extrabold text-ink">Pulihkan dari cadangan</p>
                  <p class="mt-1 text-[11px] leading-relaxed text-muted">
                    Impor file JSON akan mengganti seluruh data saat ini setelah konfirmasi.
                  </p>
                </div>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept="application/json,.json"
                class="sr-only"
                @change="onImportFile"
              />
              <button
                type="button"
                class="btn btn-secondary btn-sm shrink-0"
                :disabled="importing"
                @click="triggerImport"
              >
                <LoaderCircle v-if="importing" :size="14" class="animate-spin" />
                <Upload v-else :size="14" />
                {{ importing ? 'Memeriksa...' : 'Pilih file' }}
              </button>
            </div>
          </div>

          <div class="mt-5">
            <h3 class="text-xs font-extrabold text-ink">Ekspor tabel CSV</h3>
            <p class="mt-1 text-[11px] text-muted">Untuk dibuka di aplikasi spreadsheet atau arsip pribadi.</p>
            <div class="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                class="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-left transition-colors hover:border-line-strong hover:bg-surface-2 disabled:opacity-50"
                :disabled="!appStore.data.transactions.length || exportingCsv === 'transactions'"
                @click="exportCsv('transactions')"
              >
                <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
                  <FileSpreadsheet :size="16" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block text-xs font-bold text-ink">Transaksi</span>
                  <span class="mt-0.5 block text-[10px] text-muted">
                    {{ appStore.data.transactions.length ? `${appStore.data.transactions.length} baris` : 'Belum ada data' }}
                  </span>
                </span>
                <Download :size="14" class="shrink-0 text-muted" />
              </button>
              <button
                type="button"
                class="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-left transition-colors hover:border-line-strong hover:bg-surface-2 disabled:opacity-50"
                :disabled="!appStore.data.deposits.length || exportingCsv === 'deposits'"
                @click="exportCsv('deposits')"
              >
                <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <FileSpreadsheet :size="16" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block text-xs font-bold text-ink">Setoran tabungan</span>
                  <span class="mt-0.5 block text-[10px] text-muted">
                    {{ appStore.data.deposits.length ? `${appStore.data.deposits.length} baris` : 'Belum ada data' }}
                  </span>
                </span>
                <Download :size="14" class="shrink-0 text-muted" />
              </button>
            </div>
          </div>

          <p class="mt-4 flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-[10px] leading-relaxed text-muted">
            <ShieldCheck :size="14" class="mt-0.5 shrink-0 text-success" />
            File cadangan dibuat di browser dan langsung diunduh. Savezy tidak mengunggah data ke server mana pun.
          </p>
        </div>
      </section>

      <div class="space-y-4">
        <section class="card animate-rise p-5 sm:p-6" style="--delay: 170ms">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="eyebrow">Penyimpanan</p>
              <h2 class="mt-1 text-sm font-extrabold text-ink">Ruang lokal perangkat</h2>
            </div>
            <button
              type="button"
              class="icon-btn icon-btn-sm"
              aria-label="Segarkan informasi penyimpanan"
              :disabled="storageLoading"
              @click="refreshStorage"
            >
              <RefreshCw :size="14" :class="storageLoading ? 'animate-spin' : ''" />
            </button>
          </div>

          <div class="mt-4 flex items-center gap-3">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary">
              <HardDrive :size="19" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-extrabold text-ink">
                {{ storage ? formatBytes(storage.usage) : 'Tidak tersedia' }}
              </p>
              <p class="mt-0.5 text-[10px] font-semibold text-muted">
                {{ storage && storage.quota > 0 ? `dari kuota ${formatBytes(storage.quota)}` : 'Browser tidak memberi estimasi kuota' }}
              </p>
            </div>
            <span class="text-xs font-extrabold text-primary">{{ storagePercentLabel }}</span>
          </div>
          <ProgressBar
            class="mt-3"
            :value="storagePercent"
            tone="primary"
            height="xs"
            aria-label="Pemakaian penyimpanan lokal"
          />
          <div class="mt-3 grid grid-cols-2 gap-2">
            <div class="rounded-xl bg-surface-2 p-3">
              <p class="text-[10px] font-semibold text-muted">Foto bukti</p>
              <p class="mt-1 text-sm font-extrabold text-ink">{{ photoCount }}</p>
            </div>
            <div class="rounded-xl bg-surface-2 p-3">
              <p class="text-[10px] font-semibold text-muted">Total data</p>
              <p class="mt-1 text-sm font-extrabold text-ink">
                {{ appStore.data.deposits.length + appStore.data.transactions.length }}
              </p>
            </div>
          </div>
        </section>

        <section class="animate-rise rounded-2xl border border-danger/20 bg-danger-soft/40 p-5" style="--delay: 210ms">
          <div class="flex items-start gap-3">
            <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-danger">
              <AlertTriangle :size="17" />
            </span>
            <div class="min-w-0">
              <p class="text-xs font-extrabold text-ink">Area reset data</p>
              <p class="mt-1 text-[11px] leading-relaxed text-muted">
                Tindakan di bawah ini menghapus data dan foto secara permanen. Unduh cadangan terlebih dahulu.
              </p>
              <div class="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  class="btn btn-secondary btn-sm justify-start"
                  :disabled="resetting"
                  @click="resetWithDemo"
                >
                  <RotateCcw :size="14" />
                  Muat ulang data contoh
                </button>
                <button
                  type="button"
                  class="btn btn-danger btn-sm justify-start"
                  :disabled="resetting"
                  @click="resetEmpty"
                >
                  <Trash2 :size="14" />
                  Kosongkan semua data
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="animate-rise rounded-2xl border border-line bg-surface p-4" style="--delay: 250ms">
          <div class="flex items-start gap-2.5">
            <LockKeyhole :size="15" class="mt-0.5 shrink-0 text-success" />
            <p class="text-[10px] leading-relaxed text-muted">
              Data keuangan dan foto disimpan di IndexedDB browser. Preferensi ringan disimpan di LocalStorage.
              Menghapus data situs atau berganti perangkat tanpa cadangan akan menghilangkan data ini.
            </p>
          </div>
        </section>
      </div>
    </div>

    <div class="mt-4 grid gap-4 sm:grid-cols-3">
      <section class="card animate-rise p-5 text-center" style="--delay: 290ms">
        <span class="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Database :size="18" />
        </span>
        <p class="mt-3 text-xs font-extrabold text-ink">Data milikmu</p>
        <p class="mt-1 text-[10px] leading-relaxed text-muted">Tidak ada akun, iklan, atau pengiriman data ke server.</p>
      </section>
      <section class="card animate-rise p-5 text-center" style="--delay: 330ms">
        <span class="mx-auto flex size-10 items-center justify-center rounded-xl bg-success-soft text-success">
          <ShieldCheck :size="18" />
        </span>
        <p class="mt-3 text-xs font-extrabold text-ink">Foto terkompresi</p>
        <p class="mt-1 text-[10px] leading-relaxed text-muted">Bukti setoran disimpan lokal dan dioptimalkan sebelum disimpan.</p>
      </section>
      <section class="card animate-rise p-5 text-center" style="--delay: 370ms">
        <span class="mx-auto flex size-10 items-center justify-center rounded-xl bg-lavender-soft text-lavender">
          <FileJson :size="18" />
        </span>
        <p class="mt-3 text-xs font-extrabold text-ink">Cadangan portabel</p>
        <p class="mt-1 text-[10px] leading-relaxed text-muted">Satu file JSON untuk memindahkan data ke browser lain.</p>
      </section>
    </div>
  </div>
</template>
