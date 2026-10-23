<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CalendarDays, Moon, Plus, ShieldCheck, Sun } from '@lucide/vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import { formatDateLong, formatWeekday } from '@/lib/date'
import { initials } from '@/lib/format'
import BrandMark from '@/components/brand/BrandMark.vue'

const appStore = useAppStore()
const ui = useUiStore()
const { isDark, toggleTheme } = useTheme()

const profileName = computed(() => appStore.data.settings.profileName)
const userInitials = computed(() => initials(profileName.value))
const today = new Date()
</script>

<template>
  <header
    class="glass-header sticky top-0 z-30 flex h-[70px] items-center justify-between gap-4 border-b border-line/70 px-4 sm:px-6 lg:h-[80px] lg:px-8"
  >
    <div class="flex min-w-0 items-center gap-3">
      <RouterLink to="/" class="flex items-center gap-2.5 transition-transform active:scale-95 lg:hidden" aria-label="Tabungin">
        <BrandMark class="size-9 shrink-0 drop-shadow-[0_6px_12px_rgba(74,111,81,0.2)]" />
        <span class="text-[18px] font-black tracking-[-0.045em] text-ink">Tabungin</span>
      </RouterLink>

      <div class="hidden items-center gap-2.5 lg:flex">
        <span class="flex size-8 items-center justify-center rounded-[10px] bg-primary-soft text-primary-strong">
          <CalendarDays :size="15" />
        </span>
        <p class="text-xs font-semibold text-muted">
          <span class="font-extrabold text-ink-soft">{{ formatWeekday(today) }}</span>,
          {{ formatDateLong(today) }}
        </p>
      </div>

      <span
        class="hidden items-center gap-1.5 rounded-full border border-primary/15 bg-primary-soft/55 px-2.5 py-1 text-[10px] font-extrabold text-primary-strong sm:flex lg:ml-2"
      >
        <ShieldCheck :size="12" />
        Tersimpan lokal
      </span>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="icon-btn"
        :aria-label="isDark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'"
        @click="toggleTheme"
      >
        <Sun v-if="isDark" :size="17" />
        <Moon v-else :size="17" />
      </button>
      <button
        type="button"
        class="btn btn-primary hidden sm:inline-flex"
        @click="ui.openDeposit()"
      >
        <Plus :size="17" :stroke-width="2.5" />
        Mulai Menabung
      </button>
      <RouterLink
        to="/pengaturan"
        class="flex size-10 items-center justify-center rounded-[14px] bg-primary-soft text-[12px] font-black text-primary-strong ring-1 ring-primary/20 transition-transform hover:scale-105"
        :aria-label="`Buka pengaturan profil ${profileName}`"
      >
        {{ userInitials }}
      </RouterLink>
    </div>
  </header>
</template>
