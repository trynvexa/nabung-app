<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from '@lucide/vue'
import { useLocalSession } from '@/composables/useLocalSession'
import { useAppStore } from '@/stores/app'
import { isEmailOrPhone } from '@/lib/identity'
import BrandMark from '@/components/brand/BrandMark.vue'

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
      <div class="text-center">
        <h1 class="text-[28px] font-black leading-[1.2] tracking-[-0.035em] text-[#28432F] sm:text-[30px]">
          Buat Akun Tabungin
        </h1>
        <p class="mx-auto mt-2 max-w-[290px] text-[13px] font-semibold leading-relaxed text-[#687D66]">
          Satu langkah kecil untuk mulai<br class="hidden sm:inline" />
          mengelola impianmu.
        </p>
      </div>

      <form class="mt-7 space-y-3.5" novalidate @submit.prevent="submit">
        <!-- Field 1: Name -->
        <div>
          <label for="reg-name" class="sr-only">Nama panggilan</label>
          <div class="relative">
            <UserRound :size="18" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7B927A]" />
            <input
              id="reg-name"
              v-model="form.name"
              type="text"
              class="h-[50px] w-full rounded-2xl border border-[#DFE7DC] bg-white px-4 pl-11 text-[13px] font-medium text-[#28432F] placeholder-[#97A795] shadow-[0_2px_8px_-2px_rgba(42,69,48,0.04)] transition-all focus:border-[#4A7254] focus:outline-none focus:ring-2 focus:ring-[#4A7254]/15"
              placeholder="Nama panggilan (mis. Kak Tabungin)"
              maxlength="60"
              autocomplete="name"
            />
          </div>
        </div>

        <!-- Field 2: Email / Phone -->
        <div>
          <label for="reg-email" class="sr-only">Email atau nomor HP</label>
          <div class="relative">
            <Mail :size="18" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7B927A]" />
            <input
              id="reg-email"
              v-model="form.email"
              type="email"
              class="h-[50px] w-full rounded-2xl border border-[#DFE7DC] bg-white px-4 pl-11 text-[13px] font-medium text-[#28432F] placeholder-[#97A795] shadow-[0_2px_8px_-2px_rgba(42,69,48,0.04)] transition-all focus:border-[#4A7254] focus:outline-none focus:ring-2 focus:ring-[#4A7254]/15"
              placeholder="Email atau No. HP"
              autocomplete="email"
              inputmode="email"
            />
          </div>
        </div>

        <!-- Field 3: Password -->
        <div>
          <label for="reg-password" class="sr-only">Kata Sandi</label>
          <div class="relative">
            <LockKeyhole :size="18" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7B927A]" />
            <input
              id="reg-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="h-[50px] w-full rounded-2xl border border-[#DFE7DC] bg-white px-4 pl-11 pr-12 text-[13px] font-medium text-[#28432F] placeholder-[#97A795] shadow-[0_2px_8px_-2px_rgba(42,69,48,0.04)] transition-all focus:border-[#4A7254] focus:outline-none focus:ring-2 focus:ring-[#4A7254]/15"
              placeholder="Kata Sandi (minimal 6 karakter)"
              autocomplete="new-password"
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

        <!-- Error Message -->
        <p
          v-if="error"
          class="rounded-xl border border-[#F6C6BC] bg-[#FCEBE7] px-3.5 py-2.5 text-[12px] font-semibold leading-relaxed text-[#AC4838]"
        >
          {{ error }}
        </p>

        <!-- Submit Button -->
        <button
          type="submit"
          class="mt-2 flex h-[50px] w-full items-center justify-center rounded-2xl bg-[#4A7254] text-[14px] font-bold text-white shadow-[0_12px_24px_-6px_rgba(74,114,84,0.38)] transition-all hover:bg-[#3F6347] active:scale-[0.98]"
        >
          Daftar Sekarang
        </button>
      </form>
    </section>

    <!-- Footer: Back to Login -->
    <footer class="pt-2 text-center">
      <p class="text-[12px] font-semibold text-[#738571]">
        Sudah punya akun?
        <RouterLink to="/masuk" class="font-extrabold text-[#4A7254] transition-colors hover:underline">
          Masuk
        </RouterLink>
      </p>
    </footer>
  </main>
</template>
