<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  Bell,
  CalendarClock,
  ChartPie,
  ChevronRight,
  Flame,
  HelpCircle,
  LogOut,
  Moon,
  PiggyBank,
  Settings,
  ShieldCheck,
  Sun,
  Target,
  Wallet,
  WalletCards,
} from '@lucide/vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import { useLocalSession } from '@/composables/useLocalSession'
import CatFace from '@/components/brand/CatFace.vue'
import SavingsCat from '@/components/brand/SavingsCat.vue'
import PageHeader from '@/components/ui/PageHeader.vue'

const appStore = useAppStore()
const ui = useUiStore()
const router = useRouter()
const session = useLocalSession()
const { isDark, toggleTheme } = useTheme()

const profileName = computed(() => appStore.data.settings.profileName)
const profileEmail = computed(() => session.email.value || 'kak.tabungin@gmail.com')
const activeTargets = computed(
  () => appStore.targetCards.filter((entry) => !entry.progress.isComplete).length,
)
const reminderCount = computed(
  () => appStore.upcomingBillReminders.length + appStore.upcomingTargetReminders.length,
)
const levelLabel = computed(() => {
  if (appStore.data.deposits.length >= 20) return 'Level Penabung Ahli'
  if (appStore.data.deposits.length >= 8) return 'Level Penabung'
  return 'Level Pemula'
})

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
    hint: 'Cadangan lokal',
  },
  {
    to: '/pengaturan',
    icon: HelpCircle,
    tone: 'bg-[#fbeae5] text-[#ab5849]',
    label: 'Bantuan',
    hint: 'Panduan singkat',
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
    message: 'Sesi lokal akan ditutup. Data tabungan, target, dan foto tetap tersimpan di perangkat ini.',
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
        <RouterLink to="/pengaturan" class="btn btn-secondary">
          <Settings :size="16" />
          Pengaturan
        </RouterLink>
      </template>
    </PageHeader>

    <div class="space-y-4 lg:mt-6 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-5 lg:space-y-0">
      <section class="overflow-hidden rounded-[26px] border border-line bg-surface/90 px-5 pb-5 pt-6 text-center shadow-card lg:px-7 lg:pb-7 lg:pt-8">
        <div class="relative mx-auto size-[88px]">
          <span class="absolute inset-0 rounded-full bg-[#eaf2dd]" />
          <span class="absolute -left-2 top-2 size-2 rounded-full bg-[#ddbd70]" />
          <span class="absolute -right-1 bottom-3 size-1.5 rounded-full bg-[#a8c392]" />
          <CatFace class="relative z-10 size-full p-1.5" />
        </div>
        <h1 class="mt-3 text-[20px] font-black tracking-[-0.03em] text-ink">{{ profileName }}</h1>
        <p class="mt-0.5 text-[11px] font-semibold text-muted">{{ profileEmail }}</p>
        <span class="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#fbf1d9] px-3 py-1 text-[9px] font-extrabold text-[#946d25]">
          <ShieldCheck :size="11" />
          {{ levelLabel }}
        </span>

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

        <div class="relative mt-4 overflow-hidden rounded-[20px] bg-[#edf4e1] px-4 py-3 text-left">
          <div class="relative z-10 max-w-[70%]">
            <p class="text-[11px] font-extrabold text-[#3f6047]">Terus semangat menabung!</p>
            <p class="mt-1 text-[9px] font-semibold leading-relaxed text-[#71806d]">
              Sedikit demi sedikit, impianmu semakin dekat.
            </p>
          </div>
          <SavingsCat class="absolute -bottom-8 -right-4 w-[110px] opacity-95" />
        </div>
      </section>

      <div class="space-y-4">
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

        <section class="flex items-center justify-between rounded-[20px] border border-line bg-surface px-4 py-3.5 shadow-card">
          <span class="flex items-center gap-2.5 text-[11px] font-bold text-ink-soft">
            <span class="flex size-8 items-center justify-center rounded-xl bg-surface-2 text-muted">
              <Sun v-if="isDark" :size="15" />
              <Moon v-else :size="15" />
            </span>
            Tema {{ isDark ? 'gelap' : 'terang' }}
          </span>
          <button type="button" class="rounded-xl bg-surface-2 px-3 py-2 text-[10px] font-extrabold text-ink" @click="toggleTheme">
            Ganti
          </button>
        </section>

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
              class="flex flex-col items-center gap-1.5 rounded-xl bg-surface-2 px-2 py-2.5 text-center text-[9px] font-bold text-ink-soft"
            >
              <component :is="item.icon" :size="16" class="text-primary" />
              {{ item.label }}
            </RouterLink>
          </div>
        </section>

        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-[18px] border border-[#efd8d1] bg-[#fdf2ef] py-3 text-[11px] font-extrabold text-[#ab5849] transition-colors hover:bg-[#fbeae5]"
          @click="logout"
        >
          <LogOut :size="15" />
          Keluar dari sesi lokal
        </button>
        <p class="px-2 text-center text-[9px] leading-relaxed text-muted lg:hidden">
          Data tabungan tetap tersimpan di perangkat ini setelah keluar.
        </p>
      </div>
    </div>
  </div>
</template>
