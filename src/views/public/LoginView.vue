<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Eye, EyeOff, LockKeyhole, Mail, ShieldAlert } from '@lucide/vue'
import { useLocalSession } from '@/composables/useLocalSession'
import { useAppStore } from '@/stores/app'
import { isEmailOrPhone } from '@/lib/identity'
import { getRemainingLockTime, recordFailedAttempt, resetRateLimit, sanitizeText } from '@/lib/security'
import BrandMark from '@/components/brand/BrandMark.vue'

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
const lockSeconds = ref(0)
let lockTimer: ReturnType<typeof setInterval> | undefined

function checkLock(): void {
  lockSeconds.value = getRemainingLockTime('login')
  if (lockSeconds.value > 0 && !lockTimer) {
    lockTimer = setInterval(() => {
      lockSeconds.value = getRemainingLockTime('login')
      if (lockSeconds.value <= 0) {
        clearInterval(lockTimer)
        lockTimer = undefined
      }
    }, 1000)
  }
}

onMounted(() => {
  checkLock()
})

onBeforeUnmount(() => {
  if (lockTimer) clearInterval(lockTimer)
})

function destination(): string {
  const value = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

function submit(): void {
  error.value = ''
  checkLock()
  if (lockSeconds.value > 0) {
    error.value = `Keamanan aktif: Akun terkunci sementara. Coba lagi dalam ${lockSeconds.value} detik.`
    return
  }

  const email = sanitizeText(form.email)
  if (!email) {
    error.value = 'Masukkan email atau nomor HP terlebih dahulu.'
    return
  }
  if (!isEmailOrPhone(email)) {
    const res = recordFailedAttempt('login')
    if (res.locked) {
      checkLock()
      error.value = `Keamanan aktif: Terlalu banyak percobaan gagal. Silakan tunggu ${res.remainingSec} detik.`
      return
    }
    error.value = 'Masukkan email atau nomor HP yang valid.'
    return
  }
  if (form.password.length < 6) {
    const res = recordFailedAttempt('login')
    if (res.locked) {
      checkLock()
      error.value = `Keamanan aktif: Terlalu banyak percobaan gagal. Silakan tunggu ${res.remainingSec} detik.`
      return
    }
    error.value = 'Kata sandi minimal 6 karakter.'
    return
  }

  resetRateLimit('login')
  session.signIn(email, {
    remember: form.remember,
    name: appStore.loading ? '' : appStore.data.settings.profileName,
  })
  void router.push(destination())
}

function continueWithGoogle(): void {
  checkLock()
  if (lockSeconds.value > 0) {
    error.value = `Keamanan aktif: Coba lagi dalam ${lockSeconds.value} detik.`
    return
  }
  resetRateLimit('login')
  session.signIn('kak.tabungin@gmail.com', {
    remember: form.remember,
    name: appStore.loading ? '' : appStore.data.settings.profileName,
    provider: 'google',
  })
  void router.push(destination())
}
</script>

<template>
  <main class="relative mx-auto flex min-h-dvh w-full max-w-[460px] flex-col justify-between px-6 pb-8 pt-7">
    <!-- Top Header: Logo + App Name -->
    <header class="pt-2 text-center">
      <RouterLink
        to="/mulai"
        class="inline-flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.02]"
        aria-label="Tabungin"
      >
        <BrandMark class="size-8" />
        <span class="text-[21px] font-black tracking-[-0.04em] text-[#34593A]">Tabungin</span>
      </RouterLink>
    </header>

    <!-- Center Content & Form -->
    <section class="flex flex-1 flex-col justify-center py-5">
      <!-- Heading & Subtitle -->
      <div class="text-center">
        <h1 class="text-[28px] font-black leading-[1.2] tracking-[-0.035em] text-[#28432F] sm:text-[30px]">
          Selamat Datang<br />Kembali!
        </h1>
        <p class="mx-auto mt-2 max-w-[290px] text-[13px] font-semibold leading-relaxed text-[#687D66]">
          Masuk untuk melanjutkan<br class="hidden sm:inline" />
          perjalanan menabungmu.
        </p>
      </div>

      <!-- Login Form (Clean, Modern Pill Inputs) -->
      <form class="mt-7 space-y-3.5" novalidate @submit.prevent="submit">
        <!-- Field 1: Email / Phone -->
        <div>
          <label for="login-email" class="sr-only">Email atau nomor HP</label>
          <div class="relative">
            <Mail :size="18" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7B927A]" />
            <input
              id="login-email"
              v-model="form.email"
              type="email"
              class="h-[50px] w-full rounded-2xl border border-[#DFE7DC] bg-white px-4 pl-11 text-[13px] font-medium text-[#28432F] placeholder-[#97A795] shadow-[0_2px_8px_-2px_rgba(42,69,48,0.04)] transition-all focus:border-[#4A7254] focus:outline-none focus:ring-2 focus:ring-[#4A7254]/15"
              placeholder="Email atau No. HP"
              autocomplete="email"
              inputmode="email"
            />
          </div>
        </div>

        <!-- Field 2: Password -->
        <div>
          <label for="login-password" class="sr-only">Kata Sandi</label>
          <div class="relative">
            <LockKeyhole :size="18" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7B927A]" />
            <input
              id="login-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="h-[50px] w-full rounded-2xl border border-[#DFE7DC] bg-white px-4 pl-11 pr-12 text-[13px] font-medium text-[#28432F] placeholder-[#97A795] shadow-[0_2px_8px_-2px_rgba(42,69,48,0.04)] transition-all focus:border-[#4A7254] focus:outline-none focus:ring-2 focus:ring-[#4A7254]/15"
              placeholder="Kata Sandi"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="absolute right-2.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-xl text-[#7B927A] transition-colors hover:bg-[#EEF4EC] hover:text-[#4A7254]"
              :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" :size="17" />
              <Eye v-else :size="17" />
            </button>
          </div>
        </div>

        <!-- Remember Me & Forgot Password Row -->
        <div class="flex items-center justify-between gap-3 px-1 pt-0.5 text-[12px] font-semibold">
          <label class="flex cursor-pointer select-none items-center gap-2 text-[#5E735C]">
            <input
              v-model="form.remember"
              type="checkbox"
              class="size-4 rounded-md border-[#CADBC5] text-[#4A7254] accent-[#4A7254] transition-colors focus:ring-0"
            />
            Ingat saya
          </label>
          <RouterLink
            to="/lupa-sandi"
            class="font-extrabold text-[#4A7254] transition-colors hover:underline"
          >
            Lupa kata sandi?
          </RouterLink>
        </div>

        <!-- Validation Error Message -->
        <p
          v-if="error"
          class="flex items-center gap-2 rounded-xl border border-[#F6C6BC] bg-[#FCEBE7] px-3.5 py-2.5 text-[12px] font-semibold leading-relaxed text-[#AC4838]"
        >
          <ShieldAlert :size="16" class="shrink-0" />
          <span>{{ error }}</span>
        </p>

        <!-- Submit Button (Masuk) -->
        <button
          type="submit"
          :disabled="lockSeconds > 0"
          class="animate-pill-pulse mt-2 flex h-[50px] w-full items-center justify-center rounded-2xl bg-[#4A7254] text-[14px] font-bold text-white shadow-[0_12px_24px_-6px_rgba(74,114,84,0.38)] transition-all hover:bg-[#3F6347] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span v-if="lockSeconds > 0">Terkunci ({{ lockSeconds }} dtk)</span>
          <span v-else>Masuk</span>
        </button>
      </form>

      <!-- Divider -->
      <div class="my-5 flex items-center gap-3 text-[11px] font-semibold text-[#8B9D88]">
        <span class="h-px flex-1 bg-[#DEE5DA]" />
        atau masuk dengan
        <span class="h-px flex-1 bg-[#DEE5DA]" />
      </div>

      <!-- Google Button -->
      <button
        type="button"
        class="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-2xl border border-[#DFE7DC] bg-white text-[13px] font-bold text-[#354536] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.04)] transition-all hover:bg-[#F9FAF8] active:scale-[0.99]"
        @click="continueWithGoogle"
      >
        <svg viewBox="0 0 24 24" class="size-[18px]" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.91a5.05 5.05 0 0 1-2.19 3.31v2.76h3.55c2.08-1.91 3.29-4.73 3.29-8.08Z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.27-2.67l-3.55-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.44.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84Z" />
          <path fill="#EA4335" d="M12 5.37c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.58 10.58 0 0 0 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84C6.71 7.3 9.14 5.37 12 5.37Z" />
        </svg>
        <span>Google</span>
      </button>
    </section>

    <!-- Footer: Register Link -->
    <footer class="pt-2 text-center">
      <p class="text-[12px] font-semibold text-[#738571]">
        Belum punya akun?
        <RouterLink to="/daftar" class="font-extrabold text-[#4A7254] transition-colors hover:underline">
          Daftar di sini
        </RouterLink>
      </p>
    </footer>
  </main>
</template>
