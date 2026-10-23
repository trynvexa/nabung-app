<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Bell, CalendarDays, Moon, Plus, Settings, ShieldCheck, Sun } from '@lucide/vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import { formatDateLong, formatWeekday } from '@/lib/date'
import { initials } from '@/lib/format'
import { pageTitleFor } from '@/lib/navigation'
import BrandMark from '@/components/brand/BrandMark.vue'

const appStore = useAppStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()
const { isDark, toggleTheme } = useTheme()

const profileName = computed(() => appStore.data.settings.profileName)
const userInitials = computed(() => initials(profileName.value))
const today = new Date()
const isHome = computed(() => route.path === '/')
const isProfile = computed(() => route.path === '/profil')
const isNotificationPage = computed(() => route.path === '/notifikasi')
const isCorePage = computed(() =>
  ['/target', '/transaksi', '/profil', '/notifikasi'].includes(route.path),
)
const mobileTitle = computed(() => {
  if (route.path === '/target') return 'Target Tabungan'
  if (route.path === '/transaksi') return 'Riwayat'
  return pageTitleFor(route.path)
})
const hasNotifications = computed(
  () =>
    appStore.data.targets.some((target) => !target.completedAt) ||
    appStore.upcomingBillReminders.length > 0,
)

function goBack(): void {
  if (window.history.length > 1) router.back()
  else void router.push('/')
}
</script>

<template>
  <header class="glass-header sticky top-0 z-30 border-b border-line/70">
    <div class="flex h-16 items-center justify-between gap-3 px-4 lg:hidden">
      <div v-if="isCorePage" class="flex min-w-0 items-center gap-2">
        <button
          type="button"
          class="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#dce6d2] bg-white/70 text-[#48664d] active:scale-95 dark:border-line dark:bg-surface-2"
          aria-label="Kembali"
          @click="goBack"
        >
          <ArrowLeft :size="18" />
        </button>
        <div class="min-w-0">
          <p class="truncate text-[14px] font-extrabold text-ink">{{ mobileTitle }}</p>
          <p v-if="isProfile" class="text-[9px] font-semibold text-muted">Kelola profil & preferensi</p>
        </div>
      </div>

      <RouterLink v-else to="/" class="flex items-center gap-2.5 transition-transform active:scale-95" aria-label="Tabungin">
        <BrandMark class="size-9 shrink-0 drop-shadow-[0_6px_12px_rgba(74,111,81,0.18)]" />
        <span class="text-[18px] font-black tracking-[-0.05em] text-ink">Tabungin</span>
      </RouterLink>

      <div class="flex items-center gap-2">
        <RouterLink
          v-if="!isNotificationPage && !isProfile"
          to="/notifikasi"
          class="relative flex size-9 items-center justify-center rounded-full border border-[#dce6d2] bg-white/70 text-[#5e705c] transition-colors hover:bg-white dark:border-line dark:bg-surface-2"
          aria-label="Buka notifikasi"
        >
          <Bell :size="17" />
          <span v-if="hasNotifications" class="absolute right-2 top-2 size-1.5 rounded-full bg-[#d88572] ring-2 ring-[#fcfbf4] dark:ring-surface-2" />
        </RouterLink>
        <RouterLink
          v-if="isProfile"
          to="/pengaturan"
          class="flex size-9 items-center justify-center rounded-full border border-[#dce6d2] bg-white/70 text-[#5e705c] transition-colors hover:bg-white dark:border-line dark:bg-surface-2"
          aria-label="Buka pengaturan"
        >
          <Settings :size="17" />
        </RouterLink>
        <RouterLink
          v-else-if="!isHome && !isCorePage"
          to="/profil"
          class="flex size-9 items-center justify-center rounded-[12px] bg-primary-soft text-[11px] font-black text-primary-strong ring-1 ring-primary/20"
          :aria-label="`Buka profil ${profileName}`"
        >
          {{ userInitials }}
        </RouterLink>
      </div>
    </div>

    <div class="hidden h-20 items-center justify-between gap-4 px-8 lg:flex">
      <div class="flex min-w-0 items-center gap-3">
        <span class="flex size-8 items-center justify-center rounded-[10px] bg-primary-soft text-primary-strong">
          <CalendarDays :size="15" />
        </span>
        <p class="text-xs font-semibold text-muted">
          <span class="font-extrabold text-ink-soft">{{ formatWeekday(today) }}</span>,
          {{ formatDateLong(today) }}
        </p>
        <span class="ml-2 hidden items-center gap-1.5 rounded-full border border-primary/15 bg-primary-soft/55 px-2.5 py-1 text-[10px] font-extrabold text-primary-strong sm:flex">
          <ShieldCheck :size="12" />
          Tersimpan lokal
        </span>
      </div>

      <div class="flex items-center gap-2">
        <RouterLink
          to="/notifikasi"
          class="relative icon-btn"
          aria-label="Buka notifikasi"
        >
          <Bell :size="17" />
          <span v-if="hasNotifications" class="absolute right-2 top-2 size-1.5 rounded-full bg-danger ring-2 ring-surface" />
        </RouterLink>
        <button
          type="button"
          class="icon-btn"
          :aria-label="isDark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" :size="17" />
          <Moon v-else :size="17" />
        </button>
        <button type="button" class="btn btn-primary hidden sm:inline-flex" @click="ui.openDeposit()">
          <Plus :size="17" :stroke-width="2.5" />
          Mulai Menabung
        </button>
        <RouterLink
          to="/profil"
          class="flex size-10 items-center justify-center rounded-[14px] bg-primary-soft text-[12px] font-black text-primary-strong ring-1 ring-primary/20 transition-transform hover:scale-105"
          :aria-label="`Buka profil ${profileName}`"
        >
          {{ userInitials }}
        </RouterLink>
      </div>
    </div>
  </header>
</template>
