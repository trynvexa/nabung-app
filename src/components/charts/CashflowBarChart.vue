<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js'
import type { MonthPoint } from '@/lib/calc'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import { useIsDark } from '@/composables/useTheme'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{
  points: MonthPoint[]
}>()

const isDark = useIsDark()

const data = computed<ChartData<'bar'>>(() => ({
  labels: props.points.map((point) => point.label),
  datasets: [
    {
      label: 'Pemasukan',
      data: props.points.map((point) => point.income),
      backgroundColor: isDark.value ? '#7D98FF' : '#5278F6',
      hoverBackgroundColor: isDark.value ? '#91A8FF' : '#3D61DE',
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 18,
    },
    {
      label: 'Pengeluaran',
      data: props.points.map((point) => point.expense),
      backgroundColor: isDark.value ? '#B9ABFF' : '#C4B8FF',
      hoverBackgroundColor: isDark.value ? '#C9BEFF' : '#A99AFB',
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 18,
    },
  ],
}))

const options = computed<ChartOptions<'bar'>>(() => ({
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
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      boxPadding: 4,
      callbacks: {
        label: (context: TooltipItem<'bar'>) =>
          `${context.dataset.label ?? ''}: ${formatCurrency(Number(context.raw ?? 0))}`,
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
  <div class="relative h-[260px] w-full sm:h-[290px]">
    <Bar :key="isDark ? 'dark' : 'light'" :data="data" :options="options" />
  </div>
</template>
