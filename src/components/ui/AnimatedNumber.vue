<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatCompactCurrency, formatCurrency, formatNumber } from '@/lib/format'

const props = withDefaults(
  defineProps<{
    value: number
    duration?: number
    format?: 'currency' | 'number' | 'compact'
    hide?: boolean
    animateOnMount?: boolean
  }>(),
  {
    duration: 900,
    format: 'currency',
    hide: false,
    animateOnMount: true,
  },
)

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null

const displayValue = ref(props.animateOnMount ? 0 : props.value)
let animationFrame = 0

function animateTo(target: number, from = displayValue.value): void {
  cancelAnimationFrame(animationFrame)
  if (prefersReducedMotion?.matches) {
    displayValue.value = target
    return
  }
  const start = performance.now()
  const distance = target - from
  if (distance === 0) {
    displayValue.value = target
    return
  }
  const duration = Math.max(280, props.duration)

  const tick = (now: number) => {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    displayValue.value = from + distance * eased
    if (progress < 1) {
      animationFrame = requestAnimationFrame(tick)
    } else {
      displayValue.value = target
    }
  }
  animationFrame = requestAnimationFrame(tick)
}

const formatted = computed(() => {
  if (props.format === 'compact') return formatCompactCurrency(displayValue.value)
  if (props.format === 'number') return formatNumber(displayValue.value)
  return formatCurrency(displayValue.value)
})

const accessibleLabel = computed(() => {
  if (props.format === 'number') return formatNumber(props.value)
  return formatCurrency(props.value)
})

watch(
  () => props.value,
  (next, previous) => {
    if (props.hide) {
      displayValue.value = next
      return
    }
    animateTo(next, previous === undefined ? displayValue.value : displayValue.value)
  },
)

onMounted(() => {
  if (props.animateOnMount) animateTo(props.value, 0)
  else displayValue.value = props.value
})

onBeforeUnmount(() => cancelAnimationFrame(animationFrame))
</script>

<template>
  <span class="text-num inline-flex items-baseline" :aria-label="accessibleLabel">
    <template v-if="hide">
      <span aria-hidden="true">Rp</span>
      <span class="balance-hidden" aria-hidden="true">••••••</span>
    </template>
    <template v-else>{{ formatted }}</template>
  </span>
</template>
