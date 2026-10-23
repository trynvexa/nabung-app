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
      borderColor: props.color ?? (isDark.value ? '#9CC09A' : '#5F8563'),
      backgroundColor: isDark.value ? 'rgba(156,192,154,0.14)' : 'rgba(95,133,99,0.12)',
      pointBackgroundColor: props.color ?? (isDark.value ? '#9CC09A' : '#5F8563'),
      pointBorderColor: isDark.value ? '#1D2820' : '#FFFDF7',
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
      backgroundColor: isDark.value ? '#233126' : '#2F4132',
      titleColor: '#F7F4E9',
      bodyColor: '#D9DFD4',
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
        color: isDark.value ? '#98A593' : '#7F8D7B',
        font: { size: 11, weight: 700, family: 'Nunito Variable' },
      },
    },
    y: {
      beginAtZero: true,
      grid: { color: isDark.value ? 'rgba(255,255,255,0.07)' : '#EBE8DB' },
      border: { display: false },
      ticks: {
        color: isDark.value ? '#98A593' : '#7F8D7B',
        font: { size: 10, weight: 700, family: 'Nunito Variable' },
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
