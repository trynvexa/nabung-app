<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import { useIsDark } from '@/composables/useTheme'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const props = defineProps<{
  labels: string[]
  values: number[]
  color?: string
}>()

const isDark = useIsDark()

const data = computed<ChartData<'line'>>(() => ({
  labels: props.labels,
  datasets: [
    {
      label: 'Total tabungan',
      data: props.values,
      borderColor: props.color ?? (isDark.value ? '#91A8FF' : '#5278F6'),
      backgroundColor: isDark.value ? 'rgba(125,152,255,0.14)' : 'rgba(82,120,246,0.10)',
      pointBackgroundColor: props.color ?? (isDark.value ? '#91A8FF' : '#5278F6'),
      pointBorderColor: isDark.value ? '#11192B' : '#FFFFFF',
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2.5,
      fill: true,
      tension: 0.38,
    },
  ],
}))

const options = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 700, easing: 'easeOutQuart' },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: isDark.value ? '#1B2740' : '#182747',
      titleColor: '#E9EEFA',
      bodyColor: '#C9D3E6',
      padding: 11,
      cornerRadius: 10,
      displayColors: false,
      callbacks: {
        label: (context: TooltipItem<'line'>) => formatCurrency(Number(context.raw ?? 0)),
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: isDark.value ? '#8D9AB2' : '#8290A8',
        font: { size: 11, weight: 600, family: 'Manrope Variable' },
      },
    },
    y: {
      beginAtZero: true,
      grid: { color: isDark.value ? 'rgba(255,255,255,0.07)' : '#EDF1F8' },
      border: { display: false },
      ticks: {
        color: isDark.value ? '#8D9AB2' : '#8290A8',
        font: { size: 10, weight: 600, family: 'Manrope Variable' },
        maxTicksLimit: 4,
        callback: (value: string | number) => formatCompactCurrency(Number(value)),
      },
    },
  },
}))
</script>

<template>
  <div class="relative h-[240px] w-full">
    <Line :key="isDark ? 'dark' : 'light'" :data="data" :options="options" />
  </div>
</template>
