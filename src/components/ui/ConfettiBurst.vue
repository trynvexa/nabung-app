<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    active?: boolean
    count?: number
  }>(),
  {
    active: true,
    count: 28,
  },
)

const colors = ['#5278F6', '#A99AFB', '#24AD7A', '#F5B454', '#EF6B7A', '#7C6CF0']

const pieces = computed(() =>
  Array.from({ length: props.count }, (_, index) => ({
    id: index,
    left: `${(index * 37 + 11) % 100}%`,
    delay: `${(index % 8) * 70}ms`,
    duration: `${1100 + (index % 6) * 160}ms`,
    color: colors[index % colors.length] ?? '#5278F6',
    width: `${5 + (index % 4) * 2}px`,
    height: `${8 + (index % 5) * 2}px`,
    drift: `${(index % 2 === 0 ? 1 : -1) * (14 + (index % 6) * 9)}px`,
    spin: `${180 + (index % 5) * 90}deg`,
  })),
)
</script>

<template>
  <div
    v-if="active"
    class="pointer-events-none absolute inset-x-0 top-0 z-20 h-[320px] overflow-hidden"
    aria-hidden="true"
  >
    <span
      v-for="piece in pieces"
      :key="piece.id"
      class="absolute top-0 rounded-[2px]"
      :style="{
        left: piece.left,
        width: piece.width,
        height: piece.height,
        backgroundColor: piece.color,
        animation: `confetti-fall ${piece.duration} ease-out ${piece.delay} both`,
        '--drift': piece.drift,
        '--spin': piece.spin,
      }"
    />
  </div>
</template>
