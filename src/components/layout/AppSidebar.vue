<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowUpRight, ShieldCheck, Sparkles } from '@lucide/vue'
import { useAppStore } from '@/stores/app'
import { navGroups, settingsNav } from '@/lib/navigation'
import { initials } from '@/lib/format'
import BrandMark from '@/components/brand/BrandMark.vue'

const route = useRoute()
const appStore = useAppStore()
const profileName = computed(() => appStore.data.settings.profileName)
const userInitials = computed(() => initials(profileName.value))

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-line/80 bg-surface/95 backdrop-blur-xl lg:flex"
    aria-label="Navigasi utama"
  >
    <div class="flex h-[90px] items-center px-6">
      <RouterLink to="/" class="group flex items-center gap-3" aria-label="Tabungin, ke dashboard">
        <BrandMark
          class="size-11 shrink-0 drop-shadow-[0_10px_18px_rgba(74,111,81,0.22)] transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105"
        />
        <span>
          <span class="block text-[21px] font-black leading-none tracking-[-0.045em] text-ink">
            Tabungin
          </span>
          <span class="mt-1 block text-[10px] font-extrabold uppercase tracking-[0.15em] text-primary-strong/80">
            Celengan impianmu
          </span>
        </span>
      </RouterLink>
    </div>

    <nav class="hide-scrollbar flex-1 overflow-y-auto px-3 pb-4">
      <div v-for="group in navGroups" :key="group.label">
        <p class="nav-label">{{ group.label }}</p>
        <div class="space-y-0.5">
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="nav-item group"
            :class="isActive(item.to) ? 'nav-item-active' : ''"
            :aria-current="isActive(item.to) ? 'page' : undefined"
          >
            <component
              :is="item.icon"
              :size="18"
              :stroke-width="isActive(item.to) ? 2.3 : 2"
              class="shrink-0 transition-transform duration-200 group-hover:scale-105"
            />
            <span class="truncate">{{ item.label }}</span>
            <span
              v-if="isActive(item.to)"
              class="absolute right-3 size-1.5 rounded-full bg-primary"
            />
          </RouterLink>
        </div>
      </div>

      <div class="relative mt-5 overflow-hidden rounded-[20px] border border-primary/15 bg-primary-soft/60 p-4">
        <svg
          class="pointer-events-none absolute -bottom-8 -right-7 w-28 text-primary/15"
          viewBox="0 0 120 120"
          fill="none"
          aria-hidden="true"
        >
          <path d="M18 112C38 84 60 60 98 41" stroke="currentColor" stroke-width="2" />
          <path d="M46 80c-18-2-28-13-30-32 18 2 28 13 30 32ZM69 56c-16-8-21-22-16-40 16 8 21 21 16 40ZM90 38c-10-12-10-24-1-38" fill="currentColor" fill-opacity=".55" />
        </svg>
        <div class="relative flex items-center gap-2">
          <span class="flex size-8 items-center justify-center rounded-[10px] bg-surface/80 text-lavender shadow-sm">
            <Sparkles :size="15" />
          </span>
          <p class="text-xs font-black text-ink">Kecil-kecil, lama-lama besar.</p>
        </div>
        <p class="relative mt-2 text-[11px] font-medium leading-relaxed text-ink-soft/80">
          Sisihkan sedikit hari ini. Konsistensi kecil akan terasa besar nanti.
        </p>
      </div>
    </nav>

    <div class="border-t border-line p-3">
      <RouterLink
        :to="settingsNav.to"
        class="group flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-surface-2"
        :class="isActive(settingsNav.to) ? 'bg-primary-soft' : ''"
      >
        <span
          class="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-primary-soft text-[13px] font-black text-primary-strong ring-1 ring-primary/15"
        >
          {{ userInitials }}
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[13px] font-extrabold text-ink">{{ profileName }}</span>
          <span class="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-muted">
            <ShieldCheck :size="11" />
            Data lokal di perangkat ini
          </span>
        </span>
        <component
          :is="settingsNav.icon"
          :size="17"
          class="shrink-0 text-muted transition-transform duration-200 group-hover:rotate-12"
        />
      </RouterLink>
      <RouterLink
        to="/pengaturan"
        class="mt-1 flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        Kelola data & cadangan
        <ArrowUpRight :size="13" />
      </RouterLink>
    </div>
  </aside>
</template>
