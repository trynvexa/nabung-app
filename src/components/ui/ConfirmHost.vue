<script setup lang="ts">
import { TriangleAlert } from '@lucide/vue'
import { useUiStore } from '@/stores/ui'
import BaseModal from './BaseModal.vue'

const ui = useUiStore()
</script>

<template>
  <BaseModal
    :open="ui.confirmState.open"
    :title="ui.confirmState.title"
    size="sm"
    @close="ui.resolveConfirm(false)"
  >
    <div class="flex items-start gap-3.5">
      <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <TriangleAlert :size="21" />
      </span>
      <p class="pt-1 text-sm leading-relaxed text-ink-soft">{{ ui.confirmState.message }}</p>
    </div>
    <template #footer>
      <button type="button" class="btn btn-secondary" @click="ui.resolveConfirm(false)">
        {{ ui.confirmState.cancelLabel }}
      </button>
      <button
        type="button"
        class="btn"
        :class="ui.confirmState.tone === 'primary' ? 'btn-primary' : 'btn-danger'"
        @click="ui.resolveConfirm(true)"
      >
        {{ ui.confirmState.confirmLabel }}
      </button>
    </template>
  </BaseModal>
</template>
