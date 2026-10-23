<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Eye, EyeOff, LockKeyhole, Mail } from '@lucide/vue'
import { useLocalSession } from '@/composables/useLocalSession'
import { useAppStore } from '@/stores/app'
import { isEmailOrPhone } from '@/lib/identity'
import BrandMark from '@/components/brand/BrandMark.vue'
import SavingsCat from '@/components/brand/SavingsCat.vue'

const router = useRouter()
const route = useRoute()
const session = useLocalSession()
const appStore = useAppStore()

const form = reactive({
  email: '',
  password: '',
  remember: true,
})
const showPassword = ref(false)
const error = ref('')

function destination(): string {
  const value = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

function submit(): void {
  error.value = ''
  const email = form.email.trim()
  if (!email) {
    error.value = 'Masukkan email atau nomor HP terlebih dahulu.'
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
  session.signIn(email, {
    remember: form.remember,
    name: appStore.loading ? '' : appStore.data.settings.profileName,
  })
  void router.push(destination())
}

function continueWithGoogle(): void {
  session.signIn('kak.tabungin@gmail.com', {
    remember: form.remember,
    name: appStore.loading ? '' : appStore.data.settings.profileName,
    provider: 'google',
  })
  void router.push(destination())
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
        <h1 class="text-[25px] font-black tracking-[-0.035em] text-[#2f4934]">Selamat Datang Kembali!</h1>
        <p class="mx-auto mt-2 max-w-[270px] text-[12px] font-semibold leading-relaxed text-[#71806d]">
          Masuk untuk melanjutkan perjalanan menabungmu.
        </p>
      </div>

      <div class="relative mx-auto mt-2 flex h-[150px] w-full items-center justify-center">
        <div class="absolute size-[145px] rounded-full bg-[#edf4df]" />
        <svg class="absolute left-[18%] top-6 w-14 text-[#99b482] opacity-70" viewBox="0 0 70 100" fill="none" aria-hidden="true">
          <path d="M30 98c8-28 8-54 1-80" stroke="currentColor" stroke-width="1.4" />
          <path d="M32 68C16 67 6 57 3 41c16 1 26 11 29 27ZM34 46C20 40 13 28 15 11c14 6 20 18 19 35Z" fill="currentColor" fill-opacity=".5" />
        </svg>
        <SavingsCat class="relative z-10 w-[155px] drop-shadow-[0_14px_20px_rgba(76,111,76,0.1)]" />
      </div>

      <form class="mt-1 space-y-3.5" novalidate @submit.prevent="submit">
        <div>
          <label for="login-email" class="sr-only">Email atau nomor HP</label>
          <div class="relative">
            <Mail :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c8f78]" />
            <input
              id="login-email"
              v-model="form.email"
              type="email"
              class="input h-12 rounded-xl bg-white/90 pl-10 text-[12px]"
              placeholder="Email atau No. HP"
              autocomplete="email"
              inputmode="email"
            />
          </div>
        </div>

        <div>
          <label for="login-password" class="sr-only">Kata Sandi</label>
          <div class="relative">
            <LockKeyhole :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c8f78]" />
            <input
              id="login-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="input h-12 rounded-xl bg-white/90 pl-10 pr-11 text-[12px]"
              placeholder="Kata Sandi"
              autocomplete="current-password"
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
        </div>

        <div class="flex items-center justify-between gap-3 text-[10px] font-semibold">
          <label class="flex cursor-pointer items-center gap-2 text-[#647563]">
            <input v-model="form.remember" type="checkbox" class="size-3.5 rounded accent-[#557c5b]" />
            Ingat saya
          </label>
          <RouterLink to="/lupa-sandi" class="font-extrabold text-[#42694a] hover:underline">Lupa kata sandi?</RouterLink>
        </div>

        <p v-if="error" class="rounded-xl bg-[#fbeae5] px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-[#ab5849]">
          {{ error }}
        </p>

        <button type="submit" class="btn btn-primary h-12 w-full justify-center rounded-xl text-[13px]">
          Masuk
        </button>
      </form>

      <div class="my-5 flex items-center gap-3 text-[10px] font-semibold text-[#97a391]">
        <span class="h-px flex-1 bg-[#dde5d2]" />
        atau masuk dengan
        <span class="h-px flex-1 bg-[#dde5d2]" />
      </div>

      <button
        type="button"
        class="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#dce3d3] bg-white/90 text-[12px] font-extrabold text-[#3e4a3d] shadow-[0_6px_18px_-16px_rgba(47,73,52,0.5)] transition-colors hover:bg-white"
        @click="continueWithGoogle"
      >
        <svg viewBox="0 0 24 24" class="size-4" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.91a5.05 5.05 0 0 1-2.19 3.31v2.76h3.55c2.08-1.91 3.29-4.73 3.29-8.08Z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.27-2.67l-3.55-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.44.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84Z" />
          <path fill="#EA4335" d="M12 5.37c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.58 10.58 0 0 0 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84C6.71 7.3 9.14 5.37 12 5.37Z" />
        </svg>
        Google
      </button>

      <p class="mt-6 text-center text-[11px] font-semibold text-[#758371]">
        Belum punya akun?
        <RouterLink to="/daftar" class="font-extrabold text-[#42694a] hover:underline">Daftar di sini</RouterLink>
      </p>
    </div>
  </main>
</template>
