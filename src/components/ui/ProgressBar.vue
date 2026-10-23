<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    color?: string
    height?: 'xs' | 'sm' | 'md'
    tone?: 'primary' | 'success' | 'warning' | 'danger' | 'lavender'
    ariaLabel?: string
  }>(),
  {
    height: 'sm',
    tone: 'primary',
    ariaLabel: 'Progres',
  },
)

const percent = computed(() => Math.min(Math.max(props.value, 0), 100))
const heightClass = computed(
  () =>
    ({
      xs: 'h-1.5',
      sm: 'h-2',
      md: 'h-2.5',
    })[props.height],
)
const color = computed(() => {
  if (props.color) return props.color
  return {
    primary: 'var(--primary)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    lavender: 'var(--lavender)',
  }[props.tone]
})
</script>

<template>
  <div
    class="w-full overflow-hidden rounded-full bg-surface-3"
    :class="heightClass"
    role="progressbar"
    :aria-valuenow="Math.round(percent)"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="ariaLabel"
  >
    <div
      class="h-full rounded-full transition-[width] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
      :style="{ width: `${percent}%`, backgroundColor: color }"
    />
  </div>
</template>
