<script setup lang="ts">
import type { Component } from 'vue'
import { PiggyBank } from '@lucide/vue'

withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: Component
    compact?: boolean
  }>(),
  {
    icon: () => PiggyBank,
    compact: false,
  },
)
</script>

<template>
  <div
    class="flex flex-col items-center justify-center text-center"
    :class="compact ? 'px-4 py-8' : 'px-6 py-12 sm:py-16'"
  >
    <div class="relative mb-5" aria-hidden="true">
      <div class="absolute -left-7 top-3 size-9 rounded-full bg-primary-soft" />
      <div class="absolute -right-6 bottom-1 size-6 rounded-full bg-lavender-soft" />
      <div
        class="relative flex size-20 items-center justify-center rounded-[26px] border border-line bg-surface-2 text-primary shadow-[0_14px_30px_-20px_rgba(82,120,246,0.6)]"
      >
        <component :is="icon" :size="30" :stroke-width="1.7" />
        <span class="absolute -right-1.5 -top-1.5 size-3 rounded-full bg-lavender" />
      </div>
    </div>
    <h3 class="text-base font-extrabold tracking-tight text-ink">{{ title }}</h3>
    <p v-if="description" class="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
      {{ description }}
    </p>
    <div v-if="$slots.default" class="mt-5 flex flex-wrap justify-center gap-2">
      <slot />
    </div>
  </div>
</template>
