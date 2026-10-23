<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js'
import type { CategoryAmount } from '@/lib/calc'
import { findCategory } from '@/lib/categories'
import { formatCurrency } from '@/lib/format'
import { useIsDark } from '@/composables/useTheme'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  items: CategoryAmount[]
}>()

const isDark = useIsDark()

const data = computed<ChartData<'doughnut'>>(() => ({
  labels: props.items.map((item) => item.category),
  datasets: [
    {
      data: props.items.map((item) => item.amount),
      backgroundColor: props.items.map((item) => findCategory(item.category).color),
      borderColor: isDark.value ? '#1D2820' : '#FFFDF7',
      borderWidth: 3,
      hoverOffset: 4,
      borderRadius: 4,
    },
  ],
}))

const options = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  animation: { duration: 650, easing: 'easeOutQuart' },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: isDark.value ? '#233126' : '#2F4132',
      titleColor: '#F7F4E9',
      bodyColor: '#D9DFD4',
      padding: 11,
      cornerRadius: 10,
      boxWidth: 8,
      boxHeight: 8,
      callbacks: {
        label: (context: TooltipItem<'doughnut'>) =>
          `${context.label}: ${formatCurrency(Number(context.raw ?? 0))}`,
      },
    },
  },
}))
</script>

<template>
  <div class="relative h-[240px] w-full">
    <Doughnut :key="isDark ? 'dark' : 'light'" :data="data" :options="options" />
  </div>
</template>
