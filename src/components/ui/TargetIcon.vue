<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import {
  Car,
  Gift,
  GraduationCap,
  House,
  Laptop,
  PiggyBank,
  Plane,
  ShieldCheck,
  Sparkles,
  Target,
} from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    name?: string
    color?: string
    size?: number
    boxed?: boolean
    boxSize?: 'sm' | 'md' | 'lg'
  }>(),
  {
    name: 'Target',
    color: '#5F8563',
    size: 20,
    boxed: true,
    boxSize: 'md',
  },
)

const iconMap: Record<string, Component> = {
  Target,
  PiggyBank,
  ShieldCheck,
  Plane,
  House,
  Car,
  Laptop,
  GraduationCap,
  Gift,
  Sparkles,
}
const icon = computed(() => iconMap[props.name] ?? Target)
const boxClass = computed(
  () =>
    ({
      sm: 'size-9 rounded-xl',
      md: 'size-11 rounded-xl',
      lg: 'size-14 rounded-2xl',
    })[props.boxSize],
)
</script>

<template>
  <span
    v-if="boxed"
    class="inline-flex shrink-0 items-center justify-center"
    :class="boxClass"
    :style="{ backgroundColor: `${color}16`, color }"
    aria-hidden="true"
  >
    <component :is="icon" :size="size" :stroke-width="2" />
  </span>
  <component
    v-else
    :is="icon"
    :size="size"
    :stroke-width="2"
    :style="{ color }"
    aria-hidden="true"
  />
</template>
