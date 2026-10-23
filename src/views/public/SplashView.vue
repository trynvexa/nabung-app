<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SavingsCat from '@/components/brand/SavingsCat.vue'

const route = useRoute()
const router = useRouter()
let timer: ReturnType<typeof setTimeout> | undefined

function next(): void {
  if (timer) clearTimeout(timer)
  void router.push({ path: '/onboarding', query: route.query })
}

onMounted(() => {
  timer = setTimeout(next, 4200)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <div class="relative min-h-dvh w-full overflow-hidden bg-gradient-to-b from-[#F7FAF6] via-[#F4F8F3] to-[#EDF4EC]">
    <main
      class="relative z-10 mx-auto flex min-h-dvh w-full max-w-[480px] cursor-pointer select-none flex-col items-center justify-between px-6 pb-12 pt-10 text-center"
      aria-label="Selamat datang di Tabungin - Ketuk untuk melanjutkan"
      tabindex="0"
      role="button"
      @click="next"
      @keydown.enter="next"
      @keydown.space.prevent="next"
    >
      <!-- Top Spacer -->
      <div class="h-2" aria-hidden="true" />

      <!-- Center Hero Illustration & Brand Wordmark -->
      <div class="flex flex-1 flex-col items-center justify-center py-4">
        <!-- Mascot Container with Soft Mint Circular Aura -->
        <div class="relative flex items-center justify-center">
          <!-- Glowing Ambient Circle -->
          <div class="absolute size-[285px] rounded-full bg-[#EBF4E8]/95 shadow-inner sm:size-[315px]" />

          <!-- Floating ambient sparkles around mascot with cute animation -->
          <span class="animate-sparkle absolute -left-10 top-1/4 size-2.5 rounded-full bg-[#F5C747]/85 shadow-sm" />
          <span class="animate-leaf absolute -right-8 top-1/3 size-3 rounded-full bg-[#83AA7F]/75 shadow-sm" />
          <span class="animate-sparkle absolute -right-12 bottom-1/4 size-2.5 rounded-full bg-[#F5C747]/85 shadow-sm" style="animation-delay: 1.2s;" />

          <!-- High-fidelity Cat Mascot hugging Rp Jar with gentle breathing animation -->
          <SavingsCat class="animate-cat relative z-10 w-[285px] drop-shadow-[0_24px_34px_rgba(42,69,48,0.16)] sm:w-[320px]" />
        </div>

        <!-- Playful Brand Title -->
        <h1 class="mt-6 text-[48px] font-black tracking-[-0.04em] text-[#34593A] drop-shadow-sm transition-transform hover:scale-105 sm:text-[52px]">
          Tabungin
        </h1>

        <!-- Slogan -->
        <p class="mt-3 flex flex-col items-center justify-center text-[16px] font-bold leading-snug text-[#456A4B] sm:text-[17px]">
          <span>Menabung Hari Ini,</span>
          <span class="inline-flex items-center gap-1.5">
            Untuk Nanti
            <span class="inline-block animate-bounce text-[18px] leading-none" role="img" aria-label="cinta hijau">💚</span>
          </span>
        </p>
      </div>

      <!-- Bottom Indicator & Prompt -->
      <div class="relative z-20 flex w-full flex-col items-center pb-4">
        <!-- 4 Dots Carousel (First active) -->
        <div class="flex items-center justify-center gap-2" aria-hidden="true">
          <span class="h-2.5 w-7 rounded-full bg-[#4E7858] shadow-sm transition-all" />
          <span class="size-2.5 rounded-full bg-[#C2D8BF]" />
          <span class="size-2.5 rounded-full bg-[#C2D8BF]" />
          <span class="size-2.5 rounded-full bg-[#C2D8BF]" />
        </div>

        <p class="mt-3.5 text-[12px] font-bold tracking-wide text-[#587356]">
          Ketuk layar untuk mulai
        </p>
      </div>
    </main>

    <!-- 3-Layered Rolling Hills: Full Width Across Desktop & Mobile (Never Cut Off!) -->
    <div class="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-[180px] w-full overflow-hidden sm:h-[220px]" aria-hidden="true">
      <svg
        class="absolute inset-0 size-full"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        fill="none"
      >
        <!-- Layer 1: Back Soft Hill -->
        <path
          d="M 0 220 L 0 95 Q 360 45 720 85 Q 1080 125 1440 65 L 1440 220 Z"
          fill="#DFEADC"
        />
        <!-- Layer 2: Middle Soft Hill -->
        <path
          d="M 0 220 L 0 120 Q 340 75 720 120 Q 1100 160 1440 100 L 1440 220 Z"
          fill="#C8DFC4"
        />
        <!-- Layer 3: Front Rich Hill -->
        <path
          d="M 0 220 L 0 145 Q 280 155 680 130 Q 1040 105 1440 150 L 1440 220 Z"
          fill="#A0C698"
        />
      </svg>

      <!-- Botanical Sprouts Rising on Far Left -->
      <svg class="absolute -bottom-2 left-4 w-32 text-[#7FA97B] sm:left-12 sm:w-44" viewBox="0 0 100 120" fill="currentColor">
        <path d="M 20 120 C 35 80 50 50 65 20 C 66 18 69 19 68 22 C 58 55 45 85 30 120 Z" />
        <path d="M 45 80 C 25 75 15 60 25 45 C 45 48 55 65 45 80 Z" opacity="0.9" />
        <path d="M 55 50 C 72 40 85 52 75 68 C 60 68 52 58 55 50 Z" opacity="0.8" />
      </svg>

      <!-- Botanical Sprouts Rising on Far Right -->
      <svg class="absolute -bottom-2 right-4 w-32 text-[#7FA97B] sm:right-12 sm:w-44" viewBox="0 0 100 120" fill="currentColor">
        <path d="M 80 120 C 65 80 50 50 35 20 C 34 18 31 19 32 22 C 42 55 55 85 70 120 Z" />
        <path d="M 55 80 C 75 75 85 60 75 45 C 55 48 45 65 55 80 Z" opacity="0.9" />
        <path d="M 45 50 C 28 40 15 52 25 68 C 40 68 48 58 45 50 Z" opacity="0.8" />
      </svg>
    </div>
  </div>
</template>
