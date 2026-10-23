<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ChevronRight,
  LayoutGrid,
  Moon,
  PiggyBank,
  Plus,
  Settings,
  Sun,
  X,
} from '@lucide/vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import { mobilePrimaryNav, navGroups, settingsNav } from '@/lib/navigation'
import { initials } from '@/lib/format'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scrollLock'

const route = useRoute()
const appStore = useAppStore()
const ui = useUiStore()
const { isDark, toggleTheme } = useTheme()

const sheetOpen = ref(false)
const profileName = appStore.data.settings.profileName
const userInitials = initials(profileName)
const allDestinations = [
  ...navGroups.flatMap((group) => group.items),
  settingsNav,
].filter((item) => !mobilePrimaryNav.some((primary) => primary.to === item.to))

let locked = false

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}

function sheetLabel(label: string): string {
  return label === 'Setoran Tabungan' ? 'Setoran' : label
}

function openSheet(): void {
  sheetOpen.value = true
  if (!locked) {
    lockBodyScroll()
    locked = true
  }
}

function closeSheet(): void {
  sheetOpen.value = false
  if (locked) {
    unlockBodyScroll()
    locked = false
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') closeSheet()
}

watch(sheetOpen, (open) => {
  if (open) document.addEventListener('keydown', onKeydown)
  else document.removeEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  if (locked) unlockBodyScroll()
})
</script>

<template>
  <nav
    class="mobile-nav fixed inset-x-0 bottom-0 z-40 border-t border-line lg:hidden"
    aria-label="Navigasi mobile"
  >
    <div class="safe-bottom grid grid-cols-5 items-end px-2 pt-2">
      <RouterLink
        v-for="item in mobilePrimaryNav.slice(0, 2)"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold transition-colors"
        :class="isActive(item.to) ? 'text-primary' : 'text-muted'"
      >
        <span
          class="flex size-8 items-center justify-center rounded-xl transition-colors"
          :class="isActive(item.to) ? 'bg-primary-soft' : ''"
        >
          <component :is="item.icon" :size="19" :stroke-width="isActive(item.to) ? 2.4 : 2" />
        </span>
        {{ item.label }}
      </RouterLink>

      <div class="flex flex-col items-center">
        <button
          type="button"
          class="-mt-6 flex size-15 items-center justify-center rounded-full bg-primary text-white shadow-[0_16px_30px_-12px_rgba(74,111,81,0.7)] ring-4 ring-page/95 transition-transform active:scale-95 dark:text-[#172117]"
          aria-label="Mulai menabung"
          @click="ui.openDeposit()"
        >
          <Plus :size="25" :stroke-width="2.7" />
        </button>
        <span class="mt-1 text-[9px] font-extrabold uppercase tracking-wide text-primary">Menabung</span>
      </div>

      <RouterLink
        :to="mobilePrimaryNav[2]?.to ?? '/target'"
        class="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold transition-colors"
        :class="isActive(mobilePrimaryNav[2]?.to ?? '/target') ? 'text-primary' : 'text-muted'"
      >
        <span
          class="flex size-8 items-center justify-center rounded-xl transition-colors"
          :class="isActive(mobilePrimaryNav[2]?.to ?? '/target') ? 'bg-primary-soft' : ''"
        >
          <component
            :is="mobilePrimaryNav[2]?.icon ?? PiggyBank"
            :size="19"
            :stroke-width="isActive(mobilePrimaryNav[2]?.to ?? '/target') ? 2.4 : 2"
          />
        </span>
        {{ mobilePrimaryNav[2]?.label ?? 'Target' }}
      </RouterLink>

      <button
        type="button"
        class="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold text-muted transition-colors"
        :class="sheetOpen ? 'text-primary' : ''"
        aria-label="Buka menu lainnya"
        @click="openSheet"
      >
        <span class="flex size-8 items-center justify-center rounded-xl" :class="sheetOpen ? 'bg-primary-soft' : ''">
          <LayoutGrid :size="19" :stroke-width="2" />
        </span>
        Menu
      </button>
    </div>
  </nav>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="sheetOpen" class="fixed inset-0 z-[80] flex items-end lg:hidden" role="presentation">
        <div class="absolute inset-0 bg-[#102018]/55 backdrop-blur-[2px]" @click="closeSheet" />
        <Transition name="sheet" appear>
          <div
            class="safe-bottom relative z-10 max-h-[85dvh] w-full overflow-y-auto rounded-t-[28px] border border-line bg-surface p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Menu Tabungin"
          >
            <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span
                  class="flex size-11 items-center justify-center rounded-[15px] bg-primary-soft text-sm font-black text-primary-strong ring-1 ring-primary/15"
                >
                  {{ userInitials }}
                </span>
                <div>
                  <p class="text-sm font-extrabold text-ink">{{ profileName }}</p>
                  <p class="mt-0.5 text-[11px] font-semibold text-muted">Tabungin · celengan impianmu</p>
                </div>
              </div>
              <button type="button" class="icon-btn" aria-label="Tutup menu" @click="closeSheet">
                <X :size="18" />
              </button>
            </div>

            <button
              type="button"
              class="btn btn-primary mt-4 w-full"
              @click="closeSheet(); ui.openDeposit()"
            >
              <Plus :size="17" />
              Mulai Menabung
            </button>

            <div class="mt-5 grid grid-cols-2 gap-2">
              <RouterLink
                v-for="(item, index) in allDestinations"
                :key="item.to"
                :to="item.to"
                class="flex items-center gap-3 rounded-[16px] border border-line bg-surface-2 px-3 py-3 text-left transition-colors active:bg-surface-3"
                :class="{ 'col-span-2': allDestinations.length % 2 === 1 && index === allDestinations.length - 1 }"
                @click="closeSheet"
              >
                <span
                  class="flex size-9 shrink-0 items-center justify-center rounded-xl"
                  :class="isActive(item.to) ? 'bg-primary text-white dark:text-[#172117]' : 'bg-surface text-muted'"
                >
                  <component :is="item.icon" :size="17" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block whitespace-nowrap text-xs font-bold text-ink">{{ sheetLabel(item.label) }}</span>
                </span>
                <ChevronRight :size="13" class="text-muted" />
              </RouterLink>
            </div>

            <div class="mt-5 flex items-center justify-between rounded-2xl border border-line px-3.5 py-3">
              <span class="flex items-center gap-2 text-xs font-bold text-ink-soft">
                <Settings :size="15" class="text-muted" />
                Tema {{ isDark ? 'gelap' : 'terang' }}
              </span>
              <button
                type="button"
                class="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-xs font-bold text-ink"
                @click="toggleTheme"
              >
                <Sun v-if="isDark" :size="15" />
                <Moon v-else :size="15" />
                Ganti
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
