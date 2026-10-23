<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { AlertTriangle, LoaderCircle, RefreshCw, ShieldCheck, Sparkles } from '@lucide/vue'
import { useAppStore } from '@/stores/app'
import { useTheme } from '@/composables/useTheme'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopBar from '@/components/layout/AppTopBar.vue'
import MobileNav from '@/components/layout/MobileNav.vue'
import ToastHost from '@/components/ui/ToastHost.vue'
import ConfirmHost from '@/components/ui/ConfirmHost.vue'
import DepositModal from '@/components/deposits/DepositModal.vue'

const appStore = useAppStore()
const route = useRoute()
useTheme()

onMounted(() => {
  void appStore.init()
})

async function retry(): Promise<void> {
  await appStore.init()
}

function reloadPage(): void {
  window.location.reload()
}
</script>

<template>
  <div class="min-h-dvh bg-app-gradient text-ink">
    <div
      v-if="appStore.loading"
      class="flex min-h-dvh flex-col items-center justify-center px-5 py-10"
      role="status"
      aria-live="polite"
    >
      <span
        class="flex size-14 items-center justify-center rounded-[20px] bg-primary text-white shadow-[0_18px_40px_-20px_rgba(82,120,246,0.9)]"
      >
        <svg viewBox="0 0 32 32" width="27" height="27" fill="none" aria-hidden="true">
          <path
            d="M8.5 21.7c1.9 1.7 4.5 2.6 7.4 2.6 3.9 0 6.6-1.9 6.6-4.9 0-2.8-2-4-5.9-4.9l-1.9-.4c-2-.5-2.8-1-2.8-2.1 0-1.2 1.2-2 3.2-2 2 0 3.8.7 5.4 1.9l2.2-2.7C20.9 7.6 17.9 6.4 14.7 6.4c-4 0-6.8 2-6.8 5.1 0 2.8 2 4.2 5.7 5l1.9.4c2.1.4 2.9 1 2.9 2.2 0 1.4-1.3 2.1-3.4 2.1-2.2 0-4.1-.8-5.7-2.3l-2.2 2.8Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <p class="mt-4 text-[24px] font-extrabold tracking-[-0.04em] text-ink">Savezy</p>
      <p class="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
        <LoaderCircle :size="13" class="animate-spin" />
        Menyiapkan tabunganmu di perangkat ini...
      </p>

      <div class="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-3" aria-hidden="true">
        <div class="card overflow-hidden p-4">
          <div class="animate-shimmer h-3 w-20 rounded-full" />
          <div class="animate-shimmer mt-4 h-8 w-32 rounded-lg" />
          <div class="animate-shimmer mt-4 h-2 w-full rounded-full" />
        </div>
        <div class="card overflow-hidden p-4">
          <div class="animate-shimmer h-3 w-16 rounded-full" />
          <div class="animate-shimmer mt-4 h-8 w-24 rounded-lg" />
          <div class="animate-shimmer mt-4 h-2 w-full rounded-full" />
        </div>
        <div class="card overflow-hidden p-4">
          <div class="animate-shimmer h-3 w-24 rounded-full" />
          <div class="animate-shimmer mt-4 h-8 w-28 rounded-lg" />
          <div class="animate-shimmer mt-4 h-2 w-full rounded-full" />
        </div>
      </div>

      <div class="mt-5 flex items-center gap-2 text-[10px] font-bold text-muted">
        <ShieldCheck :size="13" class="text-success" />
        Data lokal · tanpa server
      </div>
    </div>

    <div
      v-else-if="appStore.fatalError"
      class="flex min-h-dvh items-center justify-center px-5 py-10"
    >
      <section class="card w-full max-w-lg p-6 text-center sm:p-8">
        <span class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
          <AlertTriangle :size="27" />
        </span>
        <h1 class="mt-5 text-xl font-extrabold tracking-tight text-ink">Data gagal dibuka</h1>
        <p class="mt-2 text-sm leading-relaxed text-muted">{{ appStore.fatalError }}</p>
        <p class="mt-3 rounded-xl bg-surface-2 p-3 text-[11px] leading-relaxed text-muted">
          Pastikan penyimpanan situs tidak diblokir dan kamu tidak membuka Savezy dari mode privat yang ketat.
          Data lama tidak dihapus oleh percobaan ini.
        </p>
        <div class="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <button type="button" class="btn btn-primary" @click="retry">
            <RefreshCw :size="16" />
            Coba lagi
          </button>
          <button type="button" class="btn btn-secondary" @click="reloadPage">
            Muat ulang halaman
          </button>
        </div>
      </section>
    </div>

    <template v-else>
      <AppSidebar />
      <div class="min-w-0 lg:pl-[272px]">
        <AppTopBar />

        <main class="page-shell">
          <div
            v-if="appStore.persistenceWarning"
            class="mb-4 flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning-soft/70 px-4 py-3 text-[11px] leading-relaxed text-ink-soft"
            role="alert"
          >
            <AlertTriangle :size="15" class="mt-0.5 shrink-0 text-warning" />
            <span>{{ appStore.persistenceWarning }}</span>
          </div>

          <RouterView v-slot="{ Component }">
            <Transition name="page" mode="out-in">
              <component :is="Component" :key="route.path" />
            </Transition>
          </RouterView>

          <footer class="mt-8 flex flex-col items-center justify-between gap-2 border-t border-line/70 py-5 text-center sm:flex-row sm:text-left">
            <p class="text-[10px] font-semibold text-muted">
              Savezy · menabung dengan bukti, dikelola sepenuhnya di perangkatmu.
            </p>
            <p class="flex items-center gap-1.5 text-[10px] font-bold text-muted">
              <Sparkles :size="12" class="text-lavender" />
              Kebiasaan kecil, hasil nyata.
            </p>
          </footer>
        </main>
      </div>

      <MobileNav />
    </template>

    <ToastHost />
    <ConfirmHost />
    <DepositModal v-if="!appStore.loading && !appStore.fatalError" />
  </div>
</template>
