<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from '@lucide/vue'
import { useLocalSession } from '@/composables/useLocalSession'
import { useAppStore } from '@/stores/app'
import { isEmailOrPhone } from '@/lib/identity'
import BrandMark from '@/components/brand/BrandMark.vue'
import SavingsCat from '@/components/brand/SavingsCat.vue'

const router = useRouter()
const session = useLocalSession()
const appStore = useAppStore()

const form = reactive({
  name: '',
  email: '',
  password: '',
})
const showPassword = ref(false)
const error = ref('')

function submit(): void {
  error.value = ''
  const name = form.name.trim()
  const email = form.email.trim()
  if (name.length < 2) {
    error.value = 'Nama panggilan minimal 2 karakter.'
    return
  }
  if (!isEmailOrPhone(email)) {
    error.value = 'Masukkan email atau nomor HP yang valid.'
    return
  }
  if (form.password.length < 6) {
    error.value = 'Kata sandi minimal 6 karakter.'
    return
  }
  session.signIn(email, { remember: true, name })
  if (!appStore.loading) {
    appStore.updateSettings({ profileName: name })
  }
  void router.push('/')
}
</script>

<template>
  <main class="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-7 pb-8 pt-7">
    <RouterLink to="/mulai" class="mx-auto flex items-center gap-2.5" aria-label="Tabungin">
      <BrandMark class="size-8" />
      <span class="text-[19px] font-black tracking-[-0.05em] text-[#375c40]">Tabungin</span>
    </RouterLink>

    <div class="flex flex-1 flex-col justify-center py-7">
      <div class="text-center">
        <h1 class="text-[25px] font-black tracking-[-0.035em] text-[#2f4934]">Buat Akun Tabungin</h1>
        <p class="mx-auto mt-2 max-w-[280px] text-[12px] font-semibold leading-relaxed text-[#71806d]">
          Satu langkah kecil untuk mulai mengelola impianmu.
        </p>
      </div>

      <div class="relative mx-auto mt-1 flex h-[130px] w-full items-center justify-center">
        <div class="absolute size-[130px] rounded-full bg-[#edf4df]" />
        <SavingsCat class="relative z-10 w-[140px]" />
      </div>

      <form class="mt-1 space-y-3.5" novalidate @submit.prevent="submit">
        <div class="relative">
          <UserRound :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c8f78]" />
          <input
            v-model="form.name"
            type="text"
            class="input h-12 rounded-xl bg-white/90 pl-10 text-[12px]"
            placeholder="Nama panggilan"
            maxlength="60"
            autocomplete="name"
          />
        </div>
        <div class="relative">
          <Mail :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c8f78]" />
          <input
            v-model="form.email"
            type="email"
            class="input h-12 rounded-xl bg-white/90 pl-10 text-[12px]"
            placeholder="Email atau No. HP"
            autocomplete="email"
            inputmode="email"
          />
        </div>
        <div class="relative">
          <LockKeyhole :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c8f78]" />
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="input h-12 rounded-xl bg-white/90 pl-10 pr-11 text-[12px]"
            placeholder="Kata Sandi minimal 6 karakter"
            autocomplete="new-password"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#7c8f78] hover:bg-[#edf3e2] hover:text-[#42694a]"
            :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" :size="16" />
            <Eye v-else :size="16" />
          </button>
        </div>

        <p v-if="error" class="rounded-xl bg-[#fbeae5] px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-[#ab5849]">
          {{ error }}
        </p>

        <button type="submit" class="btn btn-primary h-12 w-full justify-center rounded-xl text-[13px]">
          Daftar dan Mulai
        </button>
      </form>

      <p class="mt-6 text-center text-[11px] font-semibold text-[#758371]">
        Sudah punya akun?
        <RouterLink to="/masuk" class="font-extrabold text-[#42694a] hover:underline">Masuk di sini</RouterLink>
      </p>
      <p class="mx-auto mt-4 max-w-[290px] text-center text-[9px] leading-relaxed text-[#8a9784]">
        Akun ini hanya menjadi sesi lokal di perangkatmu. Tabungin tidak menyimpan kata sandi dan tidak mengirim data ke server.
      </p>
    </div>
  </main>
</template>
