<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from '@lucide/vue'
import { useUiStore } from '@/stores/ui'
import type { ToastVariant } from '@/stores/ui'
import type { Component } from 'vue'

const ui = useUiStore()

const icons: Record<ToastVariant, Component> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
}

const tones: Record<ToastVariant, string> = {
  success: 'bg-success-soft text-success',
  error: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-primary-soft text-primary',
}

const labels: Record<ToastVariant, string> = {
  success: 'Berhasil',
  error: 'Gagal',
  warning: 'Perhatian',
  info: 'Informasi',
}
</script>

<template>
  <div
    class="pointer-events-none fixed left-4 right-4 top-4 z-[120] flex flex-col items-end gap-2 sm:left-auto sm:right-5 sm:w-[370px]"
    aria-live="polite"
    aria-atomic="false"
  >
    <TransitionGroup name="toast">
      <div
        v-for="toast in ui.toasts"
        :key="toast.id"
        class="pointer-events-auto flex w-full items-start gap-3 rounded-[18px] border border-line bg-surface p-3.5 shadow-[0_20px_50px_-24px_rgba(47,65,50,0.4)]"
      >
        <span
          class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl"
          :class="tones[toast.variant]"
        >
          <component :is="icons[toast.variant]" :size="18" :stroke-width="2.2" />
        </span>
        <div class="min-w-0 flex-1 pt-0.5">
          <p class="text-[13px] font-extrabold text-ink">{{ toast.title ?? labels[toast.variant] }}</p>
          <p class="mt-0.5 text-xs leading-relaxed text-muted">{{ toast.message }}</p>
        </div>
        <button
          type="button"
          class="mt-0.5 rounded-lg p-1 text-muted transition-colors hover:bg-surface-3 hover:text-ink"
          aria-label="Tutup notifikasi"
          @click="ui.dismissToast(toast.id)"
        >
          <X :size="15" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
