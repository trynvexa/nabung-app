<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { Plus } from '@lucide/vue'
import { useUiStore } from '@/stores/ui'
import { mobilePrimaryNav } from '@/lib/navigation'

const route = useRoute()
const ui = useUiStore()

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <nav
    class="mobile-nav fixed inset-x-0 bottom-0 z-40 border-t border-line lg:hidden"
    aria-label="Navigasi mobile"
  >
    <div class="safe-bottom mx-auto grid max-w-lg grid-cols-5 items-center px-2 pt-1.5">
      <RouterLink
        v-for="item in mobilePrimaryNav.slice(0, 2)"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-bold transition-colors"
        :class="isActive(item.to) ? 'text-primary' : 'text-muted'"
      >
        <component :is="item.icon" :size="19" :stroke-width="isActive(item.to) ? 2.4 : 1.8" />
        {{ item.label }}
      </RouterLink>

      <div class="flex items-center justify-center">
        <button
          type="button"
          class="-mt-6 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#6d936e] to-[#4c7152] text-white shadow-[0_14px_28px_-12px_rgba(60,93,65,0.75)] ring-4 ring-[#f8faef] transition-transform active:scale-95 dark:ring-[#151d17]"
          aria-label="Tambah tabungan"
          @click="ui.openDeposit()"
        >
          <Plus :size="25" :stroke-width="2.4" />
        </button>
      </div>

      <RouterLink
        v-for="item in mobilePrimaryNav.slice(2)"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-bold transition-colors"
        :class="isActive(item.to) ? 'text-primary' : 'text-muted'"
      >
        <component :is="item.icon" :size="19" :stroke-width="isActive(item.to) ? 2.4 : 1.8" />
        {{ item.label }}
      </RouterLink>
    </div>
  </nav>
</template>
