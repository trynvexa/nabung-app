<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowRight } from '@lucide/vue'
import BrandMark from '@/components/brand/BrandMark.vue'
import SavingsCat from '@/components/brand/SavingsCat.vue'

const route = useRoute()
const router = useRouter()

function start(): void {
  void router.push({ path: '/masuk', query: route.query })
}
</script>

<template>
  <main class="relative mx-auto flex min-h-dvh w-full max-w-[460px] flex-col justify-between px-6 pb-8 pt-7 text-center">
    <!-- Top Header: Logo + App Name -->
    <header class="pt-2">
      <RouterLink
        to="/mulai"
        class="mx-auto inline-flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.02]"
        aria-label="Tabungin"
      >
        <BrandMark class="size-9" />
        <span class="text-[22px] font-black tracking-[-0.04em] text-[#34593A]">Tabungin</span>
      </RouterLink>
    </header>

    <!-- Center Hero Content -->
    <section class="flex flex-1 flex-col items-center justify-center py-4">
      <!-- Title -->
      <h1 class="max-w-[320px] text-[28px] font-black leading-[1.2] tracking-[-0.035em] text-[#28432F] sm:text-[30px]">
        Mulai Perjalanan<br />Menabungmu!
      </h1>

      <!-- Subtitle -->
      <p class="mt-2.5 max-w-[310px] text-[13px] font-semibold leading-relaxed text-[#687D66]">
        Kelola keuanganmu dengan mudah,<br class="hidden sm:inline" />
        capai impianmu selangkah demi selangkah.
      </p>

      <!-- Center Mascot in Soft Ambient Halo -->
      <div class="relative mt-5 flex h-[260px] w-full items-center justify-center sm:h-[280px]">
        <!-- Soft Mint Circular Backdrop -->
        <div class="absolute size-[240px] rounded-full bg-[#EBF4E8]/95 shadow-inner sm:size-[260px]" />

        <!-- Floating Sparkle Accents with Animations -->
        <span class="animate-sparkle absolute left-[15%] top-8 size-2.5 rounded-full bg-[#F5C747]/85 shadow-sm" />
        <span class="animate-leaf absolute right-[14%] top-12 size-3 rounded-full bg-[#83AA7F]/75 shadow-sm" />
        <span class="animate-sparkle absolute right-[18%] bottom-8 size-2 rounded-full bg-[#F5C747]/85 shadow-sm" style="animation-delay: 1.5s;" />

        <!-- Mascot with Gentle Floating Animation -->
        <SavingsCat class="animate-cat relative z-10 w-[235px] drop-shadow-[0_20px_30px_rgba(42,69,48,0.14)] sm:w-[255px]" />
      </div>

      <!-- 4-Dot Carousel (Second dot active) -->
      <div class="mt-5 flex items-center justify-center gap-2" aria-hidden="true">
        <span class="size-2.5 rounded-full bg-[#C2D8BF]" />
        <span class="h-2.5 w-7 rounded-full bg-[#4E7858] shadow-sm transition-all" />
        <span class="size-2.5 rounded-full bg-[#C2D8BF]" />
        <span class="size-2.5 rounded-full bg-[#C2D8BF]" />
      </div>
    </section>

    <!-- Bottom Actions: Primary CTA + Login Link -->
    <footer class="relative z-10 w-full pt-2">
      <button
        type="button"
        class="animate-pill-pulse flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#4A7254] text-[14px] font-bold text-white shadow-[0_12px_24px_-6px_rgba(74,114,84,0.38)] transition-all hover:bg-[#3F6347] active:scale-[0.98]"
        @click="start"
      >
        <span>Mulai Sekarang</span>
        <ArrowRight :size="18" />
      </button>

      <p class="mt-4 text-[12px] font-semibold text-[#738571]">
        Sudah punya akun?
        <RouterLink
          :to="{ path: '/masuk', query: route.query }"
          class="font-extrabold text-[#4A7254] transition-colors hover:underline"
        >
          Masuk
        </RouterLink>
      </p>
    </footer>
  </main>
</template>
