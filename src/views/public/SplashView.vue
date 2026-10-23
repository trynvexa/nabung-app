<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Heart } from '@lucide/vue'
import SavingsCat from '@/components/brand/SavingsCat.vue'

const route = useRoute()
const router = useRouter()
let timer: ReturnType<typeof setTimeout> | undefined

function next(): void {
  if (timer) clearTimeout(timer)
  void router.push({ path: '/onboarding', query: route.query })
}

onMounted(() => {
  timer = setTimeout(next, 3200)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <main
    class="relative mx-auto flex min-h-dvh w-full max-w-[520px] cursor-pointer flex-col items-center justify-between overflow-hidden px-7 pb-9 pt-12 text-center"
    aria-label="Selamat datang di Tabungin"
    tabindex="0"
    @click="next"
    @keydown.enter="next"
    @keydown.space.prevent="next"
  >
    <div class="flex flex-1 flex-col items-center justify-center">
      <div class="relative">
        <div class="absolute left-1/2 top-1/2 size-[310px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#edf4de]/90" />
        <svg class="absolute -left-16 -top-8 w-24 text-[#91ad78] opacity-80" viewBox="0 0 100 120" fill="none" aria-hidden="true">
          <path d="M28 116c9-34 10-64 3-98" stroke="currentColor" stroke-width="1.6" />
          <path d="M31 81C10 80-2 68-6 47c21 1 34 13 37 34ZM33 56C15 49 7 34 10 14c18 7 26 22 23 42Z" fill="currentColor" fill-opacity=".5" />
        </svg>
        <svg class="absolute -right-20 top-2 w-28 text-[#91ad78] opacity-70" viewBox="0 0 110 120" fill="none" aria-hidden="true">
          <path d="M83 116c-10-29-9-59 5-92" stroke="currentColor" stroke-width="1.6" />
          <path d="M80 80c20-2 33-14 39-35-21 1-34 14-39 35ZM77 54c17-9 23-24 18-44-17 9-23 25-18 44Z" fill="currentColor" fill-opacity=".5" />
        </svg>
        <span class="absolute -left-12 top-[43%] size-2 rounded-full bg-[#e1bf6b]" />
        <span class="absolute -right-8 top-[28%] size-1.5 rounded-full bg-[#b0c996]" />
        <span class="absolute -right-16 bottom-12 size-2.5 rounded-full bg-[#e1bf6b]/80" />

        <SavingsCat class="relative z-10 w-[280px] drop-shadow-[0_26px_32px_rgba(76,111,76,0.16)] sm:w-[315px]" />
      </div>

      <h1 class="display-wordmark mt-5 text-[47px] leading-none text-[#3f6748]">Tabungin</h1>
      <p class="mt-4 flex items-center justify-center gap-1 text-[16px] font-bold leading-relaxed text-[#4b6c50]">
        Menabung Hari Ini,
        <br />
        Untuk Nanti
        <Heart :size="15" class="ml-1 text-[#d9a64e]" fill="currentColor" />
      </p>
    </div>

    <div class="relative z-10 mt-8 flex items-center gap-2" aria-hidden="true">
      <span class="size-2 rounded-full bg-[#557c5b]" />
      <span class="size-2 rounded-full bg-[#c7d7b4]" />
      <span class="size-2 rounded-full bg-[#c7d7b4]" />
    </div>
    <p class="relative z-10 mt-4 text-[10px] font-semibold text-[#789072]">Ketuk untuk melanjutkan</p>

    <div class="absolute inset-x-[-12%] bottom-[-58px] h-[190px] rounded-[50%] bg-[#e8f0d8]" aria-hidden="true" />
    <div class="absolute inset-x-[-20%] bottom-[-92px] h-[190px] rounded-[50%] bg-[#f1f5e5]" aria-hidden="true" />
  </main>
</template>
