<script setup lang="ts">
import { computed, onMounted } from 'vue'
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
import FeatureTourModal from '@/components/ui/FeatureTourModal.vue'
import BrandMark from '@/components/brand/BrandMark.vue'
import BotanicalDecor from '@/components/brand/BotanicalDecor.vue'
import AuthBackdrop from '@/components/brand/AuthBackdrop.vue'
import { useUiStore } from '@/stores/ui'
import { useLocalSession } from '@/composables/useLocalSession'

const appStore = useAppStore()
const ui = useUiStore()
const route = useRoute()
const { isSignedIn } = useLocalSession()
const isPublic = computed(() => route.meta.public === true)
useTheme()

onMounted(async () => {
  await appStore.init()
  if (isSignedIn.value && localStorage.getItem('tabungin_tour_completed') !== 'true') {
    setTimeout(() => {
      ui.openTour()
    }, 900)
  }
})

async function retry(): Promise<void> {
  await appStore.init()
}

function reloadPage(): void {
  window.location.reload()
}
</script>

<template>
  <div class="relative isolate min-h-dvh bg-app-gradient text-ink">
    <template v-if="isPublic">
      <div class="relative min-h-dvh overflow-hidden bg-[#F4F8F3]">
        <AuthBackdrop />
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </div>
    </template>

    <template v-else>
      <BotanicalDecor />

      <div
        v-if="appStore.loading"
      class="relative flex min-h-dvh flex-col items-center justify-center px-5 py-10"
      role="status"
      aria-live="polite"
    >
      <BrandMark
        class="size-16 drop-shadow-[0_18px_30px_rgba(74,111,81,0.28)]"
      />
      <p class="mt-4 text-[26px] font-black tracking-[-0.045em] text-ink">Tabungin</p>
      <p class="mt-1 text-xs font-bold tracking-wide text-primary-strong">Celengan impianmu</p>
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
        Tersimpan aman di perangkatmu
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
          Pastikan penyimpanan situs tidak diblokir dan kamu tidak membuka Tabungin dari mode privat yang ketat.
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
      <div class="relative z-10 min-w-0 lg:pl-[272px]">
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

          <footer class="mt-8 hidden flex-col items-center justify-between gap-2 border-t border-line/70 py-5 text-center sm:flex-row sm:text-left lg:flex">
            <p class="text-[10px] font-semibold text-muted">
              Tabungin · celengan impianmu, dikelola sepenuhnya di perangkat ini.
            </p>
            <p class="flex items-center gap-1.5 text-[10px] font-bold text-muted">
              <Sparkles :size="12" class="text-lavender" />
              Kecil-kecil, lama-lama jadi besar.
            </p>
          </footer>
        </main>
      </div>

      <MobileNav />
    </template>
    </template>

    <ToastHost />
    <ConfirmHost />
    <DepositModal v-if="!isPublic && !appStore.loading && !appStore.fatalError" />
    <FeatureTourModal />
  </div>
</template>
