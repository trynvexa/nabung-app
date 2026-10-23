<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CalendarDays, Moon, Plus, ShieldCheck, Sun } from '@lucide/vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import { formatDateLong, formatWeekday } from '@/lib/date'
import { initials } from '@/lib/format'

const appStore = useAppStore()
const ui = useUiStore()
const { isDark, toggleTheme } = useTheme()

const profileName = computed(() => appStore.data.settings.profileName)
const userInitials = computed(() => initials(profileName.value))
const today = new Date()
</script>

<template>
  <header
    class="glass-header sticky top-0 z-30 flex h-[68px] items-center justify-between gap-4 border-b border-line/70 px-4 sm:px-6 lg:h-[76px] lg:px-8"
  >
    <div class="flex min-w-0 items-center gap-3">
      <RouterLink to="/" class="flex items-center gap-2 lg:hidden" aria-label="Savezy">
        <span
          class="flex size-9 items-center justify-center rounded-xl bg-primary text-white shadow-[0_8px_18px_-10px_rgba(82,120,246,0.8)]"
        >
          <svg viewBox="0 0 32 32" width="18" height="18" fill="none" aria-hidden="true">
            <path
              d="M8.5 21.7c1.9 1.7 4.5 2.6 7.4 2.6 3.9 0 6.6-1.9 6.6-4.9 0-2.8-2-4-5.9-4.9l-1.9-.4c-2-.5-2.8-1-2.8-2.1 0-1.2 1.2-2 3.2-2 2 0 3.8.7 5.4 1.9l2.2-2.7C20.9 7.6 17.9 6.4 14.7 6.4c-4 0-6.8 2-6.8 5.1 0 2.8 2 4.2 5.7 5l1.9.4c2.1.4 2.9 1 2.9 2.2 0 1.4-1.3 2.1-3.4 2.1-2.2 0-4.1-.8-5.7-2.3l-2.2 2.8Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span class="text-[17px] font-extrabold tracking-[-0.04em] text-ink">Savezy</span>
      </RouterLink>

      <div class="hidden items-center gap-2.5 lg:flex">
        <span class="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-muted">
          <CalendarDays :size="15" />
        </span>
        <p class="text-xs font-semibold text-muted">
          <span class="font-bold text-ink-soft">{{ formatWeekday(today) }}</span>,
          {{ formatDateLong(today) }}
        </p>
      </div>

      <span
        class="hidden items-center gap-1.5 rounded-full border border-line bg-surface/70 px-2.5 py-1 text-[10px] font-bold text-muted sm:flex lg:ml-2"
      >
        <ShieldCheck :size="12" class="text-success" />
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
        class="flex size-10 items-center justify-center rounded-xl bg-primary text-[12px] font-extrabold text-white ring-2 ring-primary/15 transition-transform hover:scale-105"
        :aria-label="`Buka pengaturan profil ${profileName}`"
      >
        {{ userInitials }}
      </RouterLink>
    </div>
  </header>
</template>
