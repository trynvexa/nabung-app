<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowUpRight, ShieldCheck, Sparkles } from '@lucide/vue'
import { useAppStore } from '@/stores/app'
import { navGroups, settingsNav } from '@/lib/navigation'
import { initials } from '@/lib/format'

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
    class="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-line bg-surface lg:flex"
    aria-label="Navigasi utama"
  >
    <div class="flex h-[84px] items-center px-6">
      <RouterLink to="/" class="group flex items-center gap-3" aria-label="Savezy, ke dashboard">
        <span
          class="flex size-10 items-center justify-center rounded-[14px] bg-primary text-white shadow-[0_10px_24px_-12px_rgba(82,120,246,0.8)] transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105"
        >
          <svg viewBox="0 0 32 32" width="21" height="21" fill="none" aria-hidden="true">
            <path
              d="M8.5 21.7c1.9 1.7 4.5 2.6 7.4 2.6 3.9 0 6.6-1.9 6.6-4.9 0-2.8-2-4-5.9-4.9l-1.9-.4c-2-.5-2.8-1-2.8-2.1 0-1.2 1.2-2 3.2-2 2 0 3.8.7 5.4 1.9l2.2-2.7C20.9 7.6 17.9 6.4 14.7 6.4c-4 0-6.8 2-6.8 5.1 0 2.8 2 4.2 5.7 5l1.9.4c2.1.4 2.9 1 2.9 2.2 0 1.4-1.3 2.1-3.4 2.1-2.2 0-4.1-.8-5.7-2.3l-2.2 2.8Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span>
          <span class="block text-[19px] font-extrabold leading-none tracking-[-0.04em] text-ink">
            Savezy
          </span>
          <span class="mt-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            Menabung berbukti
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

      <div class="mt-6 rounded-2xl border border-line bg-surface-2 p-3.5">
        <div class="flex items-center gap-2">
          <span class="flex size-7 items-center justify-center rounded-lg bg-lavender-soft text-lavender">
            <Sparkles :size="14" />
          </span>
          <p class="text-xs font-extrabold text-ink">Kebiasaan kecil, hasil nyata.</p>
        </div>
        <p class="mt-1.5 text-[11px] leading-relaxed text-muted">
          Catat setiap setoran, sekecil apa pun. Konsistensi mengalahkan nominal besar.
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
          class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-[13px] font-extrabold text-white"
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
