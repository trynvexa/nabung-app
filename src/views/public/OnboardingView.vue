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
  <main class="relative mx-auto flex min-h-dvh w-full max-w-[520px] flex-col px-7 pb-8 pt-7 text-center">
    <RouterLink to="/mulai" class="mx-auto flex items-center gap-2.5" aria-label="Tabungin">
      <BrandMark class="size-9" />
      <span class="text-[20px] font-black tracking-[-0.05em] text-[#375c40]">Tabungin</span>
    </RouterLink>

    <div class="flex flex-1 flex-col items-center justify-center py-6">
      <h1 class="max-w-[310px] text-[27px] font-black leading-[1.18] tracking-[-0.035em] text-[#2f4934]">
        Mulai Perjalanan Menabungmu!
      </h1>
      <p class="mt-3 max-w-[290px] text-[12px] font-semibold leading-relaxed text-[#71806d]">
        Kelola keuanganmu dengan mudah, capai impianmu selangkah demi selangkah.
      </p>

      <div class="relative mt-5 flex h-[260px] w-full items-center justify-center sm:h-[300px]">
        <div class="absolute size-[245px] rounded-full bg-[#eaf2da]/95 sm:size-[275px]" />
        <svg class="absolute left-1/2 top-1/2 w-[310px] -translate-x-1/2 -translate-y-1/2 text-[#93ae7b] opacity-70" viewBox="0 0 340 300" fill="none" aria-hidden="true">
          <path d="M85 268c21-55 24-105 12-161" stroke="currentColor" stroke-width="1.6" />
          <path d="M89 207c-29-2-47-18-53-47 30 2 48 18 53 47ZM93 164c-24-8-37-26-37-53 24 8 37 26 37 53Z" fill="currentColor" fill-opacity=".45" />
          <path d="M256 270c-15-49-15-95 3-143" stroke="currentColor" stroke-width="1.6" />
          <path d="M252 217c27-5 43-21 46-49-27 5-43 21-46 49ZM249 176c23-10 34-29 31-55-23 10-34 29-31 55Z" fill="currentColor" fill-opacity=".4" />
          <path d="m171 32 2.8 7.2 7.2 2.8-7.2 2.8-2.8 7.2-2.8-7.2-7.2-2.8 7.2-2.8 2.8-7.2Z" fill="#E3C273" />
        </svg>
        <SavingsCat class="relative z-10 w-[225px] drop-shadow-[0_20px_28px_rgba(63,96,69,0.14)] sm:w-[250px]" />
      </div>

      <div class="mt-4 flex items-center gap-2" aria-hidden="true">
        <span class="size-2 rounded-full bg-[#c7d7b4]" />
        <span class="size-2 rounded-full bg-[#557c5b]" />
        <span class="size-2 rounded-full bg-[#c7d7b4]" />
      </div>
    </div>

    <div class="relative z-10">
      <button type="button" class="btn btn-primary h-12 w-full justify-center text-[13px]" @click="start">
        Mulai Sekarang
        <ArrowRight :size="16" />
      </button>
      <p class="mt-5 text-[11px] font-semibold text-[#758371]">
        Sudah punya akun?
        <RouterLink :to="{ path: '/masuk', query: route.query }" class="font-extrabold text-[#42694a] hover:underline">
          Masuk
        </RouterLink>
      </p>
    </div>
  </main>
</template>
