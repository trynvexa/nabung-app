<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { Component } from 'vue'
import {
  Award,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  LoaderCircle,
  LockKeyhole,
  PiggyBank,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Target as TargetLucide,
  Trash2,
  Trophy,
  Zap,
} from '@lucide/vue'
import type { Challenge, ChallengeKind } from '@/types'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { depositDaysInMonth } from '@/lib/calc'
import {
  addDays,
  addMonths,
  daysBetween,
  eachDayOfMonth,
  formatDateLong,
  formatMonth,
  monthKey,
  parseDate,
  startOfMonth,
  todayKey,
  toDateKey,
} from '@/lib/date'
import { formatCurrency, formatPercent } from '@/lib/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

interface ChallengeProgress {
  challenge: Challenge
  start: Date
  end: Date
  saved: number
  percent: number
  remaining: number
  depositCount: number
  activeDays: number
  daysLeft: number
  daysElapsed: number
  started: boolean
  expired: boolean
  reached: boolean
}

interface BadgeItem {
  id: string
  title: string
  description: string
  icon: Component
  earned: boolean
  value: string
  progress: number
}

interface CalendarCell {
  key: string
  day: number | null
  amount: number
  active: boolean
  today: boolean
}

const appStore = useAppStore()
const ui = useUiStore()

const hideAmounts = computed(() => appStore.data.settings.hideAmounts)
const currentMonth = monthKey()
const today = todayKey()

const kindDays: Record<ChallengeKind, number> = {
  '7-day': 7,
  '30-day': 30,
  weekly: 7,
}

const kindLabels: Record<ChallengeKind, string> = {
  '7-day': '7 hari',
  '30-day': '30 hari',
  weekly: 'Mingguan',
}

function money(value: number): string {
  return hideAmounts.value ? 'Rp••••••' : formatCurrency(value)
}

function kindIcon(kind: ChallengeKind): Component {
  if (kind === '30-day') return Trophy
  if (kind === 'weekly') return CalendarDays
  return Zap
}

function progressFor(challenge: Challenge, includeFuture = false): ChallengeProgress {
  const duration = kindDays[challenge.kind]
  const start = parseDate(challenge.startDate)
  const end = addDays(start, duration - 1)
  const startKey = toDateKey(start)
  const endKey = toDateKey(end)
  const rawDays = daysBetween(start, today)
  const started = rawDays >= 0
  const daysElapsed = Math.min(Math.max(rawDays + 1, 0), duration)
  const daysLeft = Math.max(0, daysBetween(today, end))
  const linked = appStore.data.deposits.filter((deposit) => {
    const key = toDateKey(deposit.date)
    return key >= startKey && key <= endKey && (includeFuture || key <= today || key <= endKey)
  })
  const saved = linked.reduce((total, deposit) => total + deposit.amount, 0)
  const percent =
    challenge.targetAmount > 0 ? Math.min((saved / challenge.targetAmount) * 100, 100) : 0
  return {
    challenge,
    start,
    end,
    saved,
    percent,
    remaining: Math.max(challenge.targetAmount - saved, 0),
    depositCount: linked.length,
    activeDays: new Set(linked.map((deposit) => toDateKey(deposit.date))).size,
    daysLeft,
    daysElapsed,
    started,
    expired: started && daysLeft === 0 && saved < challenge.targetAmount,
    reached: saved >= challenge.targetAmount && challenge.targetAmount > 0,
  }
}

const progressList = computed(() => appStore.data.challenges.map((challenge) => progressFor(challenge)))
const orderedChallenges = computed(() =>
  [...progressList.value].sort((a, b) => {
    if (a.challenge.active !== b.challenge.active) return a.challenge.active ? -1 : 1
    if (a.reached !== b.reached) return a.reached ? 1 : -1
    return a.end.getTime() - b.end.getTime()
  }),
)
const activeChallenges = computed(() =>
  progressList.value.filter((item) => item.challenge.active && !item.reached && !item.expired),
)
const completedChallenges = computed(() => progressList.value.filter((item) => item.reached))
const totalChallengeSaved = computed(() =>
  progressList.value.reduce((total, item) => total + item.saved, 0),
)

const badges = computed<BadgeItem[]>(() => {
  const depositCount = appStore.data.deposits.length
  const targetCount = appStore.data.targets.length
  const completedTargets = appStore.targetCards.filter((card) => card.progress.isComplete).length
  const emergency = appStore.targetCards.find((card) => card.target.isEmergencyFund)
  const emergencyPercent = emergency?.progress.percent ?? 0
  return [
    {
      id: 'first-step',
      title: 'Langkah Pertama',
      description: 'Catat setoran pertamamu dengan bukti foto.',
      icon: Sparkles,
      earned: depositCount > 0,
      value: `${Math.min(depositCount, 1)}/1 setoran`,
      progress: depositCount > 0 ? 100 : 0,
    },
    {
      id: 'three-days',
      title: 'Mulai Konsisten',
      description: 'Capai streak menabung 3 hari berturut-turut.',
      icon: Flame,
      earned: appStore.bestStreak >= 3,
      value: `${Math.min(appStore.bestStreak, 3)}/3 hari`,
      progress: Math.min((appStore.bestStreak / 3) * 100, 100),
    },
    {
      id: 'seven-days',
      title: 'Seminggu Penuh',
      description: 'Pertahankan kebiasaan menabung selama 7 hari.',
      icon: BadgeCheck,
      earned: appStore.bestStreak >= 7,
      value: `${Math.min(appStore.bestStreak, 7)}/7 hari`,
      progress: Math.min((appStore.bestStreak / 7) * 100, 100),
    },
    {
      id: 'ten-deposits',
      title: 'Rajin Mencatat',
      description: 'Kumpulkan 10 setoran tabungan.',
      icon: PiggyBank,
      earned: depositCount >= 10,
      value: `${Math.min(depositCount, 10)}/10 setoran`,
      progress: Math.min((depositCount / 10) * 100, 100),
    },
    {
      id: 'target-reached',
      title: 'Mimpi Tercapai',
      description: 'Selesaikan satu target tabungan.',
      icon: Trophy,
      earned: completedTargets > 0,
      value: `${Math.min(completedTargets, 1)}/1 target`,
      progress: completedTargets > 0 ? 100 : 0,
    },
    {
      id: 'emergency-ready',
      title: 'Jaring Pengaman',
      description: 'Isi dana darurat hingga setengah target.',
      icon: ShieldCheck,
      earned: Boolean(emergency && emergencyPercent >= 50),
      value: `${formatPercent(Math.min(emergencyPercent, 50))}/50%`,
      progress: Math.min(emergencyPercent * 2, 100),
    },
    {
      id: 'three-targets',
      title: 'Kolektor Mimpi',
      description: 'Buat setidaknya tiga target tabungan.',
      icon: TargetLucide,
      earned: targetCount >= 3,
      value: `${Math.min(targetCount, 3)}/3 target`,
      progress: Math.min((targetCount / 3) * 100, 100),
    },
    {
      id: 'challenge-star',
      title: 'Bintang Tantangan',
      description: 'Tuntaskan satu tantangan menabung.',
      icon: Star,
      earned: completedChallenges.value.length > 0,
      value: `${Math.min(completedChallenges.value.length, 1)}/1 selesai`,
      progress: completedChallenges.value.length > 0 ? 100 : 0,
    },
  ]
})
const earnedBadges = computed(() => badges.value.filter((badge) => badge.earned).length)

const lastSevenDays = computed(() => {
  const days = new Set(appStore.data.deposits.map((deposit) => toDateKey(deposit.date)))
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6)
    const key = toDateKey(date)
    return {
      key,
      label: ['M', 'S', 'S', 'R', 'K', 'J', 'S'][date.getDay()] ?? '',
      active: days.has(key),
      today: key === today,
    }
  })
})

const selectedMonth = ref(startOfMonth(new Date()))
const selectedMonthKey = computed(() => monthKey(selectedMonth.value))
const selectedMonthDepositDays = computed(() =>
  depositDaysInMonth(appStore.data.deposits, selectedMonthKey.value),
)
const selectedMonthTotals = computed(() => {
  const map = new Map<string, number>()
  for (const deposit of appStore.data.deposits) {
    if (monthKey(deposit.date) !== selectedMonthKey.value) continue
    const key = toDateKey(deposit.date)
    map.set(key, (map.get(key) ?? 0) + deposit.amount)
  }
  return map
})
const selectedMonthCount = computed(
  () =>
    appStore.data.deposits.filter((deposit) => monthKey(deposit.date) === selectedMonthKey.value)
      .length,
)
const selectedMonthTotal = computed(() =>
  appStore.data.deposits
    .filter((deposit) => monthKey(deposit.date) === selectedMonthKey.value)
    .reduce((total, deposit) => total + deposit.amount, 0),
)
const calendarCells = computed<CalendarCell[]>(() => {
  const days = eachDayOfMonth(selectedMonth.value)
  const leading = startOfMonth(selectedMonth.value).getDay()
  const cells: CalendarCell[] = Array.from({ length: leading }, (_, index) => ({
    key: `leading-${index}`,
    day: null,
    amount: 0,
    active: false,
    today: false,
  }))
  for (const date of days) {
    const key = toDateKey(date)
    cells.push({
      key,
      day: date.getDate(),
      amount: selectedMonthTotals.value.get(key) ?? 0,
      active: selectedMonthDepositDays.value.has(key),
      today: key === today,
    })
  }
  const trailing = (7 - (cells.length % 7)) % 7
  for (let index = 0; index < trailing; index += 1) {
    cells.push({
      key: `trailing-${index}`,
      day: null,
      amount: 0,
      active: false,
      today: false,
    })
  }
  return cells
})

function shiftMonth(offset: number): void {
  const next = addMonths(selectedMonth.value, offset)
  if (monthKey(next) > currentMonth) return
  selectedMonth.value = startOfMonth(next)
}

function challengeStatus(item: ChallengeProgress): string {
  if (!item.started) return 'Belum dimulai'
  if (item.reached) return 'Tantangan tercapai'
  if (item.expired) return 'Waktu habis'
  if (!item.challenge.active) return 'Dijeda'
  if (item.daysLeft === 0) return 'Hari terakhir'
  if (item.daysLeft === 1) return '1 hari lagi'
  return `${item.daysLeft} hari lagi`
}

function challengeTone(item: ChallengeProgress): 'success' | 'warning' | 'danger' | 'primary' {
  if (item.reached) return 'success'
  if (item.expired) return 'danger'
  if (!item.challenge.active) return 'warning'
  return 'primary'
}

function toggleChallenge(item: ChallengeProgress): void {
  const next = !item.challenge.active
  appStore.toggleChallenge(item.challenge.id, next)
  ui.notify(
    next
      ? `${item.challenge.title} kembali dipantau.`
      : `${item.challenge.title} dijeda. Progres yang sudah tercatat tetap aman.`,
    { title: next ? 'Tantangan dilanjutkan' : 'Tantangan dijeda', variant: 'info' },
  )
}

async function removeChallenge(item: ChallengeProgress): Promise<void> {
  const confirmed = await ui.askConfirm({
    title: `Hapus ${item.challenge.title}?`,
    message:
      'Tantangan akan dihapus, tetapi setoran tabungan dan riwayat keuanganmu tidak ikut terhapus.',
    confirmLabel: 'Hapus tantangan',
  })
  if (!confirmed) return
  if (appStore.deleteChallenge(item.challenge.id)) {
    ui.notify('Tantangan berhasil dihapus.', { title: 'Tantangan dihapus' })
  }
}

const formOpen = ref(false)
const saving = ref(false)
const formError = ref('')
const form = reactive({
  title: 'Tantangan 7 Hari',
  kind: '7-day' as ChallengeKind,
  targetAmount: 20_000,
  startDate: todayKey(),
})
const errors = reactive({ title: '', targetAmount: '', startDate: '' })

const kindOptions: Array<{ kind: ChallengeKind; label: string; description: string; icon: Component }> = [
  { kind: '7-day', label: '7 hari', description: 'Mulai kebiasaan kecil.', icon: Zap },
  { kind: '30-day', label: '30 hari', description: 'Bangun konsistensi.', icon: Trophy },
  { kind: 'weekly', label: 'Mingguan', description: 'Satu minggu fokus.', icon: CalendarDays },
]

function defaultTitle(kind: ChallengeKind): string {
  return kind === '30-day'
    ? 'Tantangan 30 Hari'
    : kind === 'weekly'
      ? 'Tantangan Mingguan'
      : 'Tantangan 7 Hari'
}

function selectKind(kind: ChallengeKind): void {
  const defaults = (['7-day', '30-day', 'weekly'] as ChallengeKind[]).map(defaultTitle)
  if (!form.title.trim() || defaults.includes(form.title.trim())) {
    form.title = defaultTitle(kind)
  }
  form.kind = kind
}

function openAdd(): void {
  form.title = 'Tantangan 7 Hari'
  form.kind = '7-day'
  form.targetAmount = 20_000
  form.startDate = todayKey()
  errors.title = ''
  errors.targetAmount = ''
  errors.startDate = ''
  formError.value = ''
  formOpen.value = true
}

function saveChallenge(): void {
  if (saving.value) return
  errors.title = form.title.trim().length >= 3 ? '' : 'Nama tantangan minimal 3 karakter.'
  errors.targetAmount = form.targetAmount > 0 ? '' : 'Target nominal harus lebih dari 0.'
  errors.startDate = form.startDate ? '' : 'Pilih tanggal mulai tantangan.'
  if (errors.title || errors.targetAmount || errors.startDate) return
  saving.value = true
  try {
    appStore.addChallenge({
      title: form.title.trim(),
      kind: form.kind,
      targetAmount: form.targetAmount,
      startDate: form.startDate,
      active: true,
    })
    ui.notify('Tantangan baru siap menemani kebiasaan menabungmu.', {
      title: 'Tantangan dibuat',
    })
    formOpen.value = false
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Tantangan gagal disimpan.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Tantangan"
      subtitle="Ubah menabung menjadi permainan kecil yang konsisten. Rayakan streak, kalender, dan lencana yang kamu kumpulkan."
      eyebrow="Kebiasaan menabung"
    >
      <template #actions>
        <button type="button" class="btn btn-primary" @click="openAdd">
          <Plus :size="17" :stroke-width="2.5" />
          Buat Tantangan
        </button>
      </template>
    </PageHeader>

    <div class="mt-6 grid gap-4 sm:grid-cols-3">
      <section class="card animate-rise p-5" style="--delay: 50ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Streak saat ini</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-warning-soft text-warning">
            <Flame :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[30px] font-extrabold tracking-tight text-ink">
          {{ appStore.streak }} <span class="text-sm font-bold text-muted">hari</span>
        </p>
        <div class="mt-3 flex items-center gap-1.5">
          <span
            v-for="day in lastSevenDays"
            :key="day.key"
            class="flex size-7 flex-1 items-center justify-center rounded-lg text-[9px] font-extrabold"
            :class="[
              day.active ? 'bg-warning text-white dark:text-[#172117]' : 'bg-surface-2 text-muted',
              day.today ? 'ring-2 ring-warning/30' : '',
            ]"
            :title="day.key"
          >
            {{ day.label }}
          </span>
        </div>
      </section>

      <section class="card animate-rise p-5" style="--delay: 90ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Rekor terbaik</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Trophy :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[30px] font-extrabold tracking-tight text-ink">
          {{ appStore.bestStreak }} <span class="text-sm font-bold text-muted">hari</span>
        </p>
        <p class="mt-3 text-[11px] font-semibold text-muted">
          {{ appStore.streak > 0 ? 'Teruskan ritme, sekecil apa pun setoranmu.' : 'Satu setoran hari ini bisa memulai streak baru.' }}
        </p>
      </section>

      <section class="card animate-rise p-5" style="--delay: 130ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Lencana terkumpul</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-lavender-soft text-lavender">
            <Award :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[30px] font-extrabold tracking-tight text-ink">
          {{ earnedBadges }} <span class="text-sm font-bold text-muted">/ {{ badges.length }}</span>
        </p>
        <div class="mt-3">
          <ProgressBar
            :value="(earnedBadges / badges.length) * 100"
            tone="lavender"
            aria-label="Progres lencana"
          />
        </div>
      </section>
    </div>

    <div class="mt-4 grid items-start gap-4 lg:grid-cols-[1.55fr_1fr]">
      <section class="card animate-rise overflow-hidden" style="--delay: 170ms">
        <div class="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 class="text-base font-extrabold text-ink">Tantangan menabung</h2>
            <p class="mt-0.5 text-xs text-muted">
              {{ activeChallenges.length }} aktif · {{ completedChallenges.length }} tercapai ·
              total {{ money(totalChallengeSaved) }} terkumpul dalam tantangan
            </p>
          </div>
          <button type="button" class="btn btn-soft btn-sm shrink-0" @click="openAdd">
            <Plus :size="14" />
            Baru
          </button>
        </div>

        <div v-if="orderedChallenges.length" class="space-y-3 p-4 sm:p-5">
          <article
            v-for="item in orderedChallenges"
            :key="item.challenge.id"
            class="rounded-2xl border border-line bg-surface-2/60 p-4 transition-colors hover:border-line-strong"
            :class="{ 'opacity-70': !item.challenge.active }"
          >
            <div class="flex items-start gap-3">
              <span
                class="flex size-11 shrink-0 items-center justify-center rounded-xl"
                :class="
                  item.reached
                    ? 'bg-success-soft text-success'
                    : item.expired
                      ? 'bg-danger-soft text-danger'
                      : 'bg-primary-soft text-primary'
                "
              >
                <component :is="kindIcon(item.challenge.kind)" :size="19" />
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 class="text-sm font-extrabold text-ink">{{ item.challenge.title }}</h3>
                    <p class="mt-1 text-[10px] font-semibold text-muted">
                      {{ kindLabels[item.challenge.kind] }} · {{ formatDateLong(item.start) }} –
                      {{ formatDateLong(item.end) }}
                    </p>
                  </div>
                  <span
                    class="chip px-2 py-0.5 text-[9px]"
                    :class="
                      item.reached
                        ? 'tag-success'
                        : item.expired
                          ? 'tag-danger'
                          : !item.challenge.active
                            ? 'tag-warning'
                            : 'tag-primary'
                    "
                  >
                    <CheckCircle2 v-if="item.reached" :size="10" />
                    <Clock3 v-else :size="10" />
                    {{ challengeStatus(item) }}
                  </span>
                </div>

                <div class="mt-3">
                  <div class="flex items-end justify-between gap-2">
                    <p class="text-[11px] font-semibold text-muted">
                      Terkumpul
                      <span class="font-extrabold text-ink">{{ money(item.saved) }}</span>
                      dari {{ money(item.challenge.targetAmount) }}
                    </p>
                    <p class="text-xs font-extrabold" :class="item.reached ? 'text-success' : 'text-primary'">
                      {{ formatPercent(item.percent) }}
                    </p>
                  </div>
                  <ProgressBar
                    class="mt-2"
                    :value="item.percent"
                    :tone="challengeTone(item)"
                    :aria-label="`Progres ${item.challenge.title}`"
                  />
                </div>

                <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div class="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-muted">
                    <span>{{ item.depositCount }} setoran</span>
                    <span>{{ item.activeDays }}/{{ kindDays[item.challenge.kind] }} hari aktif</span>
                    <span v-if="item.reached">Target tercapai</span>
                    <span v-else-if="item.expired">Sisa {{ money(item.remaining) }}</span>
                    <span v-else-if="item.started">Sisa {{ money(item.remaining) }}</span>
                    <span v-else>Mulai {{ formatDateLong(item.start) }}</span>
                  </div>
                  <div class="flex items-center gap-0.5">
                    <button
                      type="button"
                      class="btn btn-secondary btn-sm"
                      @click="toggleChallenge(item)"
                    >
                      {{ item.challenge.active ? 'Jeda' : 'Lanjutkan' }}
                    </button>
                    <button
                      type="button"
                      class="icon-btn icon-btn-sm border-transparent bg-transparent hover:text-danger"
                      :aria-label="`Hapus ${item.challenge.title}`"
                      title="Hapus tantangan"
                      @click="removeChallenge(item)"
                    >
                      <Trash2 :size="13" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <EmptyState
          v-else
          :icon="Flame"
          title="Belum ada tantangan"
          description="Mulai dengan tantangan 7 hari dan nominal kecil. Konsistensi lebih penting daripada besarnya setoran."
        >
          <button type="button" class="btn btn-primary btn-sm" @click="openAdd">
            <Plus :size="14" />
            Buat tantangan pertama
          </button>
        </EmptyState>
      </section>

      <div class="space-y-4">
        <section class="card animate-rise p-5" style="--delay: 210ms">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-ink">Kalender setoran</h2>
              <p class="mt-1 text-[11px] text-muted">Satu titik untuk setiap hari menabung.</p>
            </div>
            <div class="flex items-center gap-1 rounded-lg border border-line bg-surface p-0.5">
              <button
                type="button"
                class="icon-btn icon-btn-sm border-transparent"
                aria-label="Bulan sebelumnya"
                @click="shiftMonth(-1)"
              >
                <ChevronLeft :size="14" />
              </button>
              <button
                type="button"
                class="icon-btn icon-btn-sm border-transparent"
                aria-label="Bulan berikutnya"
                :disabled="selectedMonthKey >= currentMonth"
                @click="shiftMonth(1)"
              >
                <ChevronRight :size="14" />
              </button>
            </div>
          </div>

          <p class="mt-3 text-xs font-extrabold text-ink">{{ formatMonth(selectedMonth) }}</p>
          <div class="mt-3 grid grid-cols-7 gap-1">
            <span
              v-for="label in ['M', 'S', 'S', 'R', 'K', 'J', 'S']"
              :key="label"
              class="pb-1 text-center text-[9px] font-extrabold uppercase tracking-wide text-muted"
            >
              {{ label }}
            </span>
            <div
              v-for="cell in calendarCells"
              :key="cell.key"
              class="relative flex aspect-square items-center justify-center rounded-lg text-[10px] font-bold"
              :class="[
                cell.day === null
                  ? ''
                  : cell.active
                    ? 'bg-primary text-white shadow-[0_4px_10px_-6px_rgba(74,111,81,0.8)] dark:text-[#172117]'
                    : 'bg-surface-2 text-ink-soft',
                cell.today ? 'ring-2 ring-primary/30' : '',
              ]"
              :title="cell.day === null ? undefined : `${cell.day} · ${cell.active ? money(cell.amount) : 'Belum ada setoran'}`"
            >
              {{ cell.day }}
              <span
                v-if="cell.day !== null && cell.active"
                class="absolute bottom-0.5 size-1 rounded-full bg-white/80"
              />
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between border-t border-line pt-3">
            <div>
              <p class="text-[10px] font-semibold text-muted">{{ selectedMonthCount }} setoran</p>
              <p class="mt-0.5 text-xs font-extrabold text-ink">{{ money(selectedMonthTotal) }}</p>
            </div>
            <span class="flex items-center gap-1.5 text-[10px] font-semibold text-muted">
              <span class="size-2 rounded-full bg-primary" /> Ada setoran
            </span>
          </div>
        </section>

        <section class="animate-rise rounded-2xl border border-lavender/20 bg-lavender-soft/50 p-5" style="--delay: 250ms">
          <div class="flex items-start gap-3">
            <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-lavender">
              <TargetLucide :size="17" />
            </span>
            <div>
              <p class="text-xs font-extrabold text-ink">Tantangan dihitung dari setoran asli.</p>
              <p class="mt-1 text-[11px] leading-relaxed text-muted">
                Progres diambil dari setoran bertanggal di dalam periode tantangan. Menghapus setoran akan
                menyesuaikan progres dan lencana secara otomatis.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <section class="mt-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-base font-extrabold text-ink">Lencana kebiasaan</h2>
          <p class="mt-1 text-xs text-muted">
            {{ earnedBadges }} dari {{ badges.length }} lencana terbuka. Setiap lencana berasal dari data nyata.
          </p>
        </div>
      </div>
      <div class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="(badge, index) in badges"
          :key="badge.id"
          class="card animate-rise p-4"
          :class="badge.earned ? 'border-success/25' : ''"
          :style="{ '--delay': `${300 + index * 35}ms` }"
        >
          <div class="flex items-start justify-between gap-2">
            <span
              class="flex size-10 items-center justify-center rounded-xl"
              :class="badge.earned ? 'bg-success-soft text-success' : 'bg-surface-2 text-muted'"
            >
              <component :is="badge.icon" :size="18" />
            </span>
            <span
              class="chip px-1.5 py-0.5 text-[9px]"
              :class="badge.earned ? 'tag-success' : 'tag-primary'"
            >
              <LockKeyhole v-if="!badge.earned" :size="9" />
              <CheckCircle2 v-else :size="9" />
              {{ badge.earned ? 'Terbuka' : 'Terkunci' }}
            </span>
          </div>
          <h3 class="mt-3 text-xs font-extrabold text-ink">{{ badge.title }}</h3>
          <p class="mt-1 text-[11px] leading-relaxed text-muted">{{ badge.description }}</p>
          <div class="mt-3">
            <ProgressBar
              :value="badge.progress"
              :tone="badge.earned ? 'success' : 'primary'"
              height="xs"
              :aria-label="`Progres lencana ${badge.title}`"
            />
            <p class="mt-1.5 text-right text-[9px] font-bold text-muted">{{ badge.value }}</p>
          </div>
        </article>
      </div>
    </section>

    <BaseModal
      :open="formOpen"
      title="Buat tantangan"
      subtitle="Pilih durasi, target, dan tanggal mulai. Tantangan akan dihitung dari setoran pada periode tersebut."
      size="md"
      :persistent="saving"
      @close="formOpen = false"
    >
      <div class="space-y-4 pt-1">
        <div>
          <span class="label">Durasi tantangan</span>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="option in kindOptions"
              :key="option.kind"
              type="button"
              class="rounded-xl border p-3 text-left transition-colors"
              :class="form.kind === option.kind ? 'border-primary bg-primary-soft/60' : 'border-line bg-surface-2'"
              @click="selectKind(option.kind)"
            >
              <component
                :is="option.icon"
                :size="16"
                :class="form.kind === option.kind ? 'text-primary' : 'text-muted'"
              />
              <span class="mt-2 block text-xs font-extrabold text-ink">{{ option.label }}</span>
              <span class="mt-0.5 block text-[9px] leading-relaxed text-muted">{{ option.description }}</span>
            </button>
          </div>
        </div>

        <div>
          <label for="challenge-title" class="label">Nama tantangan</label>
          <input
            id="challenge-title"
            v-model="form.title"
            type="text"
            class="input"
            :class="errors.title ? 'border-danger' : ''"
            placeholder="Contoh: Tantangan 7 Hari"
            maxlength="80"
            @input="errors.title = ''"
          />
          <p v-if="errors.title" class="field-error">{{ errors.title }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="challenge-target" class="label">Target terkumpul</label>
            <CurrencyInput
              id="challenge-target"
              v-model="form.targetAmount"
              :invalid="!!errors.targetAmount"
            />
            <p v-if="errors.targetAmount" class="field-error">{{ errors.targetAmount }}</p>
            <p v-else class="field-hint">Total setoran yang ingin dicapai selama tantangan.</p>
          </div>
          <div>
            <label for="challenge-start" class="label">Tanggal mulai</label>
            <input
              id="challenge-start"
              v-model="form.startDate"
              type="date"
              class="input"
              :class="errors.startDate ? 'border-danger' : ''"
              @input="errors.startDate = ''"
            />
            <p v-if="errors.startDate" class="field-error">{{ errors.startDate }}</p>
          </div>
        </div>

        <div class="rounded-xl border border-line bg-surface-2 p-3.5">
          <p class="flex items-center gap-2 text-[11px] font-extrabold text-ink">
            <CalendarDays :size="14" class="text-primary" />
            {{ kindLabels[form.kind] }} · {{ formatDateLong(form.startDate) }}
          </p>
          <p class="mt-1.5 text-[10px] leading-relaxed text-muted">
            Berakhir pada
            <span class="font-bold text-ink-soft">{{ formatDateLong(addDays(parseDate(form.startDate), kindDays[form.kind] - 1)) }}</span>.
            Setoran pada rentang tanggal ini otomatis dihitung.
          </p>
        </div>

        <div v-if="formError" class="rounded-xl bg-danger-soft p-3 text-xs font-semibold text-danger">
          {{ formError }}
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-secondary" :disabled="saving" @click="formOpen = false">Batal</button>
        <button type="button" class="btn btn-primary" :disabled="saving" @click="saveChallenge">
          <LoaderCircle v-if="saving" :size="16" class="animate-spin" />
          <Plus v-else :size="16" />
          Buat Tantangan
        </button>
      </template>
    </BaseModal>
  </div>
</template>
