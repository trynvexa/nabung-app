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
    class="mobile-nav fixed inset-x-0 bottom-0 z-40 border-t border-[#DFE7DC]/80 bg-white/95 backdrop-blur-xl shadow-[0_-8px_30px_rgba(42,69,48,0.06)] dark:border-[#2C3B2E] dark:bg-[#151E17]/95 lg:hidden"
    aria-label="Navigasi mobile"
  >
    <div class="safe-bottom mx-auto grid max-w-lg grid-cols-5 items-center px-3 pt-2 pb-1.5">
      <!-- 1st & 2nd Items (Beranda, Target) -->
      <RouterLink
        v-for="item in mobilePrimaryNav.slice(0, 2)"
        :key="item.to"
        :to="item.to"
        class="group relative flex flex-col items-center gap-1 rounded-2xl py-1 text-[10px] transition-all duration-200 active:scale-95"
        :class="isActive(item.to) ? 'font-black text-[#34593A] dark:text-[#A8D3A9]' : 'font-bold text-[#71856F] hover:text-[#4A7254] dark:text-[#8E9F8D]'"
      >
        <span
          class="flex size-9 items-center justify-center rounded-2xl transition-all duration-200"
          :class="isActive(item.to) ? 'bg-[#EBF4E8] text-[#34593A] shadow-sm dark:bg-[#253628] dark:text-[#A8D3A9]' : 'group-hover:bg-[#F4F8F3] dark:group-hover:bg-[#1F2B20]'"
        >
          <component :is="item.icon" :size="20" :stroke-width="isActive(item.to) ? 2.5 : 1.9" />
        </span>
        <span class="tracking-tight">{{ item.label }}</span>
        <span
          v-if="isActive(item.to)"
          class="absolute -bottom-0.5 h-1 w-3 rounded-full bg-[#4E7858] transition-all"
        />
      </RouterLink>

      <!-- Center Floating (+) Button -->
      <div class="flex items-center justify-center">
        <button
          type="button"
          class="-mt-6 flex size-14 items-center justify-center rounded-full bg-gradient-to-b from-[#557E58] to-[#3A5F3E] text-white shadow-[0_12px_24px_-4px_rgba(60,100,66,0.45)] ring-4 ring-[#F4F8F3] transition-all duration-200 hover:scale-105 active:scale-95 dark:ring-[#151E17]"
          aria-label="Tambah tabungan baru"
          title="Tambah tabungan baru"
          @click="ui.openDeposit()"
        >
          <Plus :size="26" :stroke-width="2.6" class="transition-transform group-hover:rotate-90" />
        </button>
      </div>

      <!-- 3rd & 4th Items (Riwayat, Profil) -->
      <RouterLink
        v-for="item in mobilePrimaryNav.slice(2)"
        :key="item.to"
        :to="item.to"
        class="group relative flex flex-col items-center gap-1 rounded-2xl py-1 text-[10px] transition-all duration-200 active:scale-95"
        :class="isActive(item.to) ? 'font-black text-[#34593A] dark:text-[#A8D3A9]' : 'font-bold text-[#71856F] hover:text-[#4A7254] dark:text-[#8E9F8D]'"
      >
        <span
          class="flex size-9 items-center justify-center rounded-2xl transition-all duration-200"
          :class="isActive(item.to) ? 'bg-[#EBF4E8] text-[#34593A] shadow-sm dark:bg-[#253628] dark:text-[#A8D3A9]' : 'group-hover:bg-[#F4F8F3] dark:group-hover:bg-[#1F2B20]'"
        >
          <component :is="item.icon" :size="20" :stroke-width="isActive(item.to) ? 2.5 : 1.9" />
        </span>
        <span class="tracking-tight">{{ item.label }}</span>
        <span
          v-if="isActive(item.to)"
          class="absolute -bottom-0.5 h-1 w-3 rounded-full bg-[#4E7858] transition-all"
        />
      </RouterLink>
    </div>
  </nav>
</template>
