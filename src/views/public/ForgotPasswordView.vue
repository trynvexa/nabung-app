<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck } from '@lucide/vue'
import { isEmailOrPhone } from '@/lib/identity'
import CatFace from '@/components/brand/CatFace.vue'

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
  <main class="relative mx-auto flex min-h-dvh w-full max-w-[460px] flex-col justify-between px-6 pb-8 pt-6">
    <!-- Top Bar with Back Navigation -->
    <header class="flex items-center justify-between">
      <RouterLink
        to="/masuk"
        class="flex size-10 items-center justify-center rounded-2xl border border-[#DFE7DC] bg-white text-[#4A7254] shadow-sm transition-all hover:bg-[#EEF4EC] hover:scale-105 active:scale-95"
        aria-label="Kembali ke halaman masuk"
      >
        <ArrowLeft :size="18" />
      </RouterLink>
      <span class="size-10" aria-hidden="true" />
    </header>

    <!-- Center Content -->
    <section class="flex flex-1 flex-col justify-center py-6">
      <div v-if="!sent" class="text-center">
        <!-- Cute Mascot Face in Circle (Matching Screen 9 of Reference) -->
        <div class="relative mx-auto flex size-24 items-center justify-center rounded-full bg-[#EBF4E8] shadow-sm">
          <CatFace class="size-16 drop-shadow-[0_4px_8px_rgba(42,69,48,0.12)]" />
        </div>

        <h1 class="mt-5 text-[28px] font-black leading-[1.2] tracking-[-0.035em] text-[#28432F]">
          Lupa Kata Sandi
        </h1>
        <p class="mx-auto mt-2.5 max-w-[300px] text-[13px] font-semibold leading-relaxed text-[#687D66]">
          Masukkan email atau nomor HP<br />
          untuk menerima kode reset.
        </p>

        <form class="mt-7 space-y-4 text-left" novalidate @submit.prevent="submit">
          <div class="relative">
            <Mail :size="18" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7B927A]" />
            <input
              v-model="email"
              type="text"
              class="h-[50px] w-full rounded-2xl border border-[#DFE7DC] bg-white px-4 pl-11 text-[13px] font-medium text-[#28432F] placeholder-[#97A795] shadow-[0_2px_8px_-2px_rgba(42,69,48,0.04)] transition-all focus:border-[#4A7254] focus:outline-none focus:ring-2 focus:ring-[#4A7254]/15"
              placeholder="Email atau No. HP"
              autocomplete="email"
            />
          </div>

          <p
            v-if="error"
            class="rounded-xl border border-[#F6C6BC] bg-[#FCEBE7] px-3.5 py-2.5 text-[12px] font-semibold leading-relaxed text-[#AC4838]"
          >
            {{ error }}
          </p>

          <button
            type="submit"
            class="flex h-[50px] w-full items-center justify-center rounded-2xl bg-[#4A7254] text-[14px] font-bold text-white shadow-[0_12px_24px_-6px_rgba(74,114,84,0.38)] transition-all hover:bg-[#3F6347] active:scale-[0.98]"
          >
            Kirim Kode
          </button>
        </form>
      </div>

      <!-- Sent Confirmation State -->
      <div v-else class="text-center">
        <span class="mx-auto flex size-16 items-center justify-center rounded-full bg-[#E7F3E5] text-[#3F7C47]">
          <CheckCircle2 :size="32" />
        </span>
        <h1 class="mt-5 text-[26px] font-black tracking-[-0.035em] text-[#28432F]">
          Instruksi Terkirim!
        </h1>
        <p class="mx-auto mt-2 max-w-[310px] text-[13px] font-semibold leading-relaxed text-[#687D66]">
          Tautan pemulihan kata sandi telah dikirim ke <strong class="text-[#28432F]">{{ email }}</strong>.
        </p>
        <RouterLink
          to="/masuk"
          class="mt-6 inline-flex h-[50px] w-full items-center justify-center rounded-2xl bg-[#4A7254] text-[14px] font-bold text-white shadow-[0_12px_24px_-6px_rgba(74,114,84,0.38)] transition-all hover:bg-[#3F6347]"
        >
          Kembali ke Masuk
        </RouterLink>
      </div>
    </section>

    <!-- Footer Security Note -->
    <footer class="pt-2 text-center">
      <p class="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#738571]">
        <ShieldCheck :size="14" class="text-[#4A7254]" />
        Keamanan akunmu selalu terlindungi
      </p>
    </footer>
  </main>
</template>
