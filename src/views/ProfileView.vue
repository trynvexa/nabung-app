<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  Bell,
  CalendarClock,
  Camera,
  ChartPie,
  CheckCircle2,
  ChevronRight,
  Flame,
  LogOut,
  Moon,
  PiggyBank,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trash2,
  Wallet,
  WalletCards,
} from '@lucide/vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import { useLocalSession } from '@/composables/useLocalSession'
import { validateImageFile } from '@/lib/security'
import CatFace from '@/components/brand/CatFace.vue'
import SavingsCat from '@/components/brand/SavingsCat.vue'
import PageHeader from '@/components/ui/PageHeader.vue'

const appStore = useAppStore()
const ui = useUiStore()
const router = useRouter()
const session = useLocalSession()
const { isDark, toggleTheme } = useTheme()

const avatarInputRef = ref<HTMLInputElement | null>(null)
const profileName = computed(() => appStore.data.settings.profileName)
const profileAvatar = computed(() => appStore.data.settings.profileAvatar)
const profileEmail = computed(() => session.email.value || 'kak.tabungin@gmail.com')

const activeTargets = computed(
  () => appStore.targetCards.filter((entry) => !entry.progress.isComplete).length,
)
const reminderCount = computed(
  () => appStore.upcomingBillReminders.length + appStore.upcomingTargetReminders.length,
)
const levelLabel = computed(() => {
  if (appStore.data.deposits.length >= 20) return 'Level Penabung Ahli 🏆'
  if (appStore.data.deposits.length >= 8) return 'Level Penabung Rutin ⭐'
  return 'Level Pemula 🚀'
})

function triggerAvatarPick(): void {
  avatarInputRef.value?.click()
}

async function handleAvatarChange(e: Event): Promise<void> {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    const check = await validateImageFile(file)
    if (!check.ok) {
      ui.notify(check.error || 'Format foto tidak valid.', { variant: 'error' })
      return
    }

    const img = new Image()
    const reader = new FileReader()
    reader.onload = () => {
      img.onload = () => {
        const size = Math.min(img.width, img.height)
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 256
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 256, 256)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
        appStore.updateSettings({ profileAvatar: dataUrl })
        ui.notify('Foto profil berhasil diperbarui! 🎉')
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  } catch (err: any) {
    ui.notify(err.message || 'Gagal memproses foto profil.', { variant: 'error' })
  } finally {
    target.value = ''
  }
}

function removeAvatar(): void {
  appStore.updateSettings({ profileAvatar: undefined })
  ui.notify('Foto profil diatur kembali ke maskot kucing 🐱')
}

const menuItems = computed(() => [
  {
    to: '/target',
    icon: Target,
    tone: 'bg-[#e9f1e4] text-[#557c5b]',
    label: 'Target Tabungan',
    hint: `${activeTargets.value} target aktif`,
  },
  {
    to: '/notifikasi',
    icon: Bell,
    tone: 'bg-[#fbf1d9] text-[#9b742c]',
    label: 'Notifikasi',
    hint: reminderCount.value ? `${reminderCount.value} pengingat baru` : 'Semua sudah tenang',
  },
  {
    to: '/pengaturan',
    icon: ShieldCheck,
    tone: 'bg-[#e7f3e5] text-[#427b48]',
    label: 'Keamanan & data',
    hint: 'Cadangan & privasi aman',
  },
])

const tools = [
  { to: '/setoran', label: 'Setoran', icon: PiggyBank },
  { to: '/tantangan', label: 'Tantangan', icon: Flame },
  { to: '/dompet', label: 'Dompet', icon: Wallet },
  { to: '/anggaran', label: 'Anggaran', icon: WalletCards },
  { to: '/tagihan', label: 'Tagihan', icon: CalendarClock },
  { to: '/statistik', label: 'Statistik', icon: ChartPie },
]

async function logout(): Promise<void> {
  const confirmed = await ui.askConfirm({
    title: 'Keluar dari Tabungin?',
    message: 'Sesi lokal akan ditutup. Data tabungan, target, dan foto tetap tersimpan aman di perangkat ini.',
    confirmLabel: 'Keluar',
    cancelLabel: 'Batal',
  })
  if (!confirmed) return
  session.signOut()
  await router.push('/masuk')
}
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <PageHeader
      class="hidden lg:flex"
      title="Profil & preferensi"
      subtitle="Kenali pemilik tabungan, atur tampilan, dan akses fitur Tabungin lainnya."
      eyebrow="Akun lokal"
    >
      <template #actions>
        <button type="button" class="btn btn-secondary" @click="ui.openTour()">
          <Sparkles :size="16" class="text-lavender" />
          Panduan Fitur
        </button>
        <RouterLink to="/pengaturan" class="btn btn-secondary">
          <Settings :size="16" />
          Pengaturan
        </RouterLink>
      </template>
    </PageHeader>

    <div class="space-y-4 lg:mt-6 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-5 lg:space-y-0">
      <!-- Left Card: Profile & Stats -->
      <section class="overflow-hidden rounded-[26px] border border-line bg-surface/90 px-5 pb-5 pt-6 text-center shadow-card lg:px-7 lg:pb-7 lg:pt-8">
        <!-- Avatar Container with Photo Support -->
        <div class="relative mx-auto size-[98px]">
          <span class="absolute inset-0 rounded-full bg-[#EBF4E8] ring-4 ring-[#EBF4E8] dark:bg-[#253628] dark:ring-[#2C3B2E]" />
          
          <div class="relative z-10 size-full overflow-hidden rounded-full shadow-inner">
            <img
              v-if="profileAvatar"
              :src="profileAvatar"
              alt="Foto Profil"
              class="size-full object-cover"
            />
            <CatFace v-else class="size-full p-2" />
          </div>

          <!-- Camera Upload Action Badge -->
          <button
            type="button"
            class="absolute -bottom-1 -right-1 z-20 flex size-8 items-center justify-center rounded-full bg-[#4A7254] text-white shadow-md transition-all hover:scale-110 active:scale-95"
            aria-label="Ganti foto profil"
            title="Ganti foto profil"
            @click="triggerAvatarPick"
          >
            <Camera :size="15" />
          </button>
        </div>

        <!-- Hidden File Input for Avatar -->
        <input
          ref="avatarInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="handleAvatarChange"
        />

        <!-- Reset Avatar Button (if custom photo is active) -->
        <div v-if="profileAvatar" class="mt-2.5">
          <button
            type="button"
            class="inline-flex items-center gap-1 text-[11px] font-bold text-danger hover:underline"
            @click="removeAvatar"
          >
            <Trash2 :size="12" />
            <span>Pakai Maskot Kucing</span>
          </button>
        </div>

        <h1 class="mt-3 text-[21px] font-black tracking-[-0.03em] text-ink">{{ profileName }}</h1>
        <p class="mt-0.5 text-[11px] font-semibold text-muted">{{ profileEmail }}</p>
        
        <span class="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#fbf1d9] px-3.5 py-1 text-[10px] font-extrabold text-[#946d25] dark:bg-[#382d1c] dark:text-[#E4BF78]">
          <ShieldCheck :size="12" />
          {{ levelLabel }}
        </span>

        <!-- Quick 3-Metric Stats -->
        <div class="mt-5 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface-2/65 py-3">
          <div>
            <p class="text-[9px] font-bold uppercase tracking-wide text-muted">Target</p>
            <p class="mt-1 text-sm font-black text-ink">{{ activeTargets }}</p>
          </div>
          <div>
            <p class="text-[9px] font-bold uppercase tracking-wide text-muted">Setoran</p>
            <p class="mt-1 text-sm font-black text-ink">{{ appStore.data.deposits.length }}</p>
          </div>
          <div>
            <p class="text-[9px] font-bold uppercase tracking-wide text-muted">Streak</p>
            <p class="mt-1 text-sm font-black text-ink">{{ appStore.streak }} hari</p>
          </div>
        </div>

        <!-- Savings Encouragement Banner with Cute Mascot -->
        <div class="relative mt-4 overflow-hidden rounded-[20px] bg-[#edf4e1] px-4 py-3 text-left dark:bg-[#203123]">
          <div class="relative z-10 max-w-[70%]">
            <p class="text-[12px] font-extrabold text-[#3f6047] dark:text-[#A7D4A8]">Terus semangat menabung!</p>
            <p class="mt-0.5 text-[10px] font-semibold leading-relaxed text-[#71806d] dark:text-[#B1C3B0]">
              Sedikit demi sedikit, impianmu semakin dekat.
            </p>
          </div>
          <SavingsCat class="animate-cat absolute -bottom-8 -right-4 w-[110px] opacity-95" />
        </div>
      </section>

      <!-- Right Column: Menu, Security Card, Tour & Tools -->
      <div class="space-y-4">
        <!-- Interactive Feature Tour Button -->
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-[22px] border border-[#DFE7DC] bg-gradient-to-r from-[#EBF4E8] to-[#F5F8F4] p-4 text-left shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] dark:border-[#2C3B2E] dark:from-[#1E2C20] dark:to-[#172119]"
          @click="ui.openTour()"
        >
          <div class="flex items-center gap-3">
            <span class="flex size-10 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-[#243527]">
              <Sparkles :size="20" class="text-[#4E7858] dark:text-[#A8D3A9]" />
            </span>
            <div>
              <p class="text-[13px] font-black text-[#28432F] dark:text-[#E8F2E7]">Panduan Fitur & Cara Pakai</p>
              <p class="text-[10px] font-semibold text-[#6D806B] dark:text-[#B0C3AF]">
                Lihat tur interaktif semua fitur Tabungin
              </p>
            </div>
          </div>
          <span class="rounded-xl bg-[#4A7254] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm">
            Buka Tur
          </span>
        </button>

        <!-- Navigation Links -->
        <section class="rounded-[24px] border border-line bg-surface px-4 py-2 shadow-card lg:px-5">
          <RouterLink
            v-for="item in menuItems"
            :key="item.label"
            :to="item.to"
            class="flex items-center gap-3 border-b border-line/70 py-3.5 last:border-b-0"
          >
            <span class="flex size-9 shrink-0 items-center justify-center rounded-xl" :class="item.tone">
              <component :is="item.icon" :size="16" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-[12px] font-extrabold text-ink">{{ item.label }}</span>
              <span class="mt-0.5 block text-[9px] font-semibold text-muted">{{ item.hint }}</span>
            </span>
            <ChevronRight :size="15" class="shrink-0 text-muted" />
          </RouterLink>
        </section>

        <!-- Security & Privacy Status Badge -->
        <section class="rounded-[22px] border border-line bg-surface p-4 shadow-card">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <ShieldCheck :size="16" class="text-success" />
              <p class="text-[11px] font-extrabold text-ink">Keamanan & Privasi Akun</p>
            </div>
            <span class="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-[9px] font-extrabold text-success">
              <CheckCircle2 :size="10" />
              Terlindungi
            </span>
          </div>
          <p class="mt-1 text-[10px] font-medium leading-relaxed text-muted">
            Data tersimpan 100% lokal, terlindungi proteksi brute-force, dan validasi berkas biner aktif.
          </p>
        </section>

        <!-- Dark Mode Toggle -->
        <section class="flex items-center justify-between rounded-[20px] border border-line bg-surface px-4 py-3.5 shadow-card">
          <span class="flex items-center gap-2.5 text-[11px] font-bold text-ink-soft">
            <span class="flex size-8 items-center justify-center rounded-xl bg-surface-2 text-muted">
              <Sun v-if="isDark" :size="15" />
              <Moon v-else :size="15" />
            </span>
            Tema {{ isDark ? 'gelap' : 'terang' }}
          </span>
          <button type="button" class="rounded-xl bg-surface-2 px-3 py-2 text-[10px] font-extrabold text-ink transition-transform active:scale-95" @click="toggleTheme">
            Ganti
          </button>
        </section>

        <!-- Mobile Tool Grid -->
        <section class="rounded-[22px] border border-line bg-surface p-4 shadow-card lg:hidden">
          <div class="flex items-center justify-between">
            <p class="text-[11px] font-extrabold text-ink">Fitur lainnya</p>
            <RouterLink to="/pengaturan" class="text-[9px] font-extrabold text-primary">Atur</RouterLink>
          </div>
          <div class="mt-3 grid grid-cols-3 gap-2">
            <RouterLink
              v-for="item in tools"
              :key="item.to"
              :to="item.to"
              class="flex flex-col items-center gap-1.5 rounded-xl bg-surface-2 px-2 py-2.5 text-center text-[9px] font-bold text-ink-soft transition-colors hover:bg-surface-3"
            >
              <component :is="item.icon" :size="16" class="text-primary" />
              {{ item.label }}
            </RouterLink>
          </div>
        </section>

        <!-- Logout Button -->
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-[18px] border border-[#efd8d1] bg-[#fdf2ef] py-3 text-[11px] font-extrabold text-[#ab5849] transition-all hover:bg-[#fbeae5] active:scale-[0.99] dark:border-[#4B2824] dark:bg-[#2C1917] dark:text-[#FFAAA0]"
          @click="logout"
        >
          <LogOut :size="15" />
          Keluar dari sesi lokal
        </button>
        <p class="px-2 text-center text-[9px] leading-relaxed text-muted lg:hidden">
          Data tabungan dan foto tetap tersimpan aman di perangkat ini setelah keluar.
        </p>
      </div>
    </div>
  </div>
</template>
