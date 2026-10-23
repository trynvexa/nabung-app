<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck } from '@lucide/vue'
import { isEmailOrPhone } from '@/lib/identity'
import BrandMark from '@/components/brand/BrandMark.vue'
import SavingsCat from '@/components/brand/SavingsCat.vue'

const email = ref('')
const error = ref('')
const sent = ref(false)

function submit(): void {
  error.value = ''
  const value = email.value.trim()
  if (!value) {
    error.value = 'Masukkan email atau nomor HP terlebih dahulu.'
    return
  }
  if (!isEmailOrPhone(value)) {
    error.value = 'Masukkan email atau nomor HP yang valid.'
    return
  }
  sent.value = true
}
</script>

<template>
  <main class="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-7 pb-8 pt-5">
    <div class="flex items-center justify-between">
      <RouterLink
        to="/masuk"
        class="flex size-9 items-center justify-center rounded-full border border-[#dce6d2] bg-white/70 text-[#48664d] transition-colors hover:bg-white"
        aria-label="Kembali ke halaman masuk"
      >
        <ArrowLeft :size="17" />
      </RouterLink>
      <div class="flex items-center gap-2">
        <BrandMark class="size-7" />
        <span class="text-[16px] font-black tracking-[-0.04em] text-[#375c40]">Tabungin</span>
      </div>
      <span class="size-9" aria-hidden="true" />
    </div>

    <div class="flex flex-1 flex-col justify-center py-6">
      <div v-if="!sent" class="text-center">
        <div class="relative mx-auto flex h-[190px] w-full items-center justify-center">
          <div class="absolute size-[170px] rounded-full bg-[#edf4df]" />
          <svg class="absolute left-[14%] top-8 w-16 text-[#99b482] opacity-70" viewBox="0 0 80 110" fill="none" aria-hidden="true">
            <path d="M38 108c7-30 6-59-4-88" stroke="currentColor" stroke-width="1.4" />
            <path d="M36 76C20 74 10 63 7 46c16 2 26 13 29 30ZM31 52C17 45 11 33 14 16c14 7 19 19 17 36Z" fill="currentColor" fill-opacity=".5" />
          </svg>
          <SavingsCat class="relative z-10 w-[185px]" />
          <span class="absolute right-[21%] top-12 flex size-10 items-center justify-center rounded-full border-2 border-white bg-[#f7e7b8] text-[#7d6425] shadow-sm">
            <Mail :size="17" />
          </span>
        </div>

        <h1 class="mt-2 text-[25px] font-black tracking-[-0.035em] text-[#2f4934]">Lupa Kata Sandi</h1>
        <p class="mx-auto mt-2 max-w-[290px] text-[12px] font-semibold leading-relaxed text-[#71806d]">
          Masukkan email atau nomor HP untuk mulai memulihkan akses ke tabunganmu.
        </p>

        <form class="mt-6 space-y-3.5 text-left" novalidate @submit.prevent="submit">
          <div class="relative">
            <Mail :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c8f78]" />
            <input
              v-model="email"
              type="text"
              class="input h-12 rounded-xl bg-white/90 pl-10 text-[12px]"
              placeholder="Email atau No. HP"
              autocomplete="email"
            />
          </div>
          <p v-if="error" class="rounded-xl bg-[#fbeae5] px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-[#ab5849]">
            {{ error }}
          </p>
          <button type="submit" class="btn btn-primary h-12 w-full justify-center rounded-xl text-[13px]">
            Kirim Kode
          </button>
        </form>

        <p class="mt-4 text-center text-[11px] font-semibold text-[#758371]">
          Sudah ingat?
          <RouterLink to="/masuk" class="font-extrabold text-[#42694a] hover:underline">Kembali masuk</RouterLink>
        </p>
      </div>

      <div v-else class="text-center">
        <span class="mx-auto flex size-16 items-center justify-center rounded-[22px] bg-[#e7f3e5] text-[#427b48]">
          <CheckCircle2 :size="31" />
        </span>
        <h1 class="mt-5 text-[24px] font-black tracking-[-0.035em] text-[#2f4934]">Permintaan Disiapkan</h1>
        <p class="mx-auto mt-2 max-w-[300px] text-[12px] font-semibold leading-relaxed text-[#71806d]">
          Karena Tabungin berjalan tanpa server, pemulihan akun dilakukan langsung di perangkat ini.
        </p>
        <div class="mx-auto mt-5 flex max-w-sm items-start gap-3 rounded-2xl border border-[#dce6d2] bg-white/80 p-4 text-left">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef4e4] text-[#557c5b]">
            <ShieldCheck :size="17" />
          </span>
          <p class="text-[10px] font-semibold leading-relaxed text-[#647563]">
            Kamu tidak perlu kata sandi untuk membuka data lokal. Gunakan halaman masuk dengan email yang sama untuk melanjutkan.
          </p>
        </div>
        <RouterLink to="/masuk" class="btn btn-primary mt-5 h-12 w-full justify-center rounded-xl text-[13px]">
          Kembali ke Halaman Masuk
        </RouterLink>
      </div>
    </div>
  </main>
</template>
