<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import {
  BriefcaseBusiness,
  BusFront,
  CircleEllipsis,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Laptop,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
  WalletCards,
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
    name: 'CircleEllipsis',
    color: '#8290A8',
    size: 18,
    boxed: true,
    boxSize: 'md',
  },
)

const iconMap: Record<string, Component> = {
  WalletCards,
  Laptop,
  Gift,
  BriefcaseBusiness,
  TrendingUp,
  CircleEllipsis,
  UtensilsCrossed,
  BusFront,
  ShoppingBag,
  GraduationCap,
  Gamepad2,
  HeartPulse,
  ReceiptText,
}

const icon = computed(() => iconMap[props.name] ?? CircleEllipsis)
const boxClass = computed(
  () =>
    ({
      sm: 'size-8 rounded-lg',
      md: 'size-10 rounded-xl',
      lg: 'size-12 rounded-2xl',
    })[props.boxSize],
)
</script>

<template>
  <span
    v-if="boxed"
    class="inline-flex shrink-0 items-center justify-center"
    :class="boxClass"
    :style="{ backgroundColor: `${color}18`, color }"
    aria-hidden="true"
  >
    <component :is="icon" :size="size" :stroke-width="2.1" />
  </span>
  <component
    v-else
    :is="icon"
    :size="size"
    :stroke-width="2.1"
    :style="{ color }"
    aria-hidden="true"
  />
</template>
