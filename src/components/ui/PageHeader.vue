<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  eyebrow?: string
}>()
</script>

<template>
  <header
    class="animate-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
    style="--delay: 0ms"
  >
    <div class="min-w-0">
      <p v-if="eyebrow" class="eyebrow mb-2">{{ eyebrow }}</p>
      <h1 class="page-title text-balance">{{ title }}</h1>
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2.5">
      <slot name="actions" />
    </div>
  </header>
</template>
