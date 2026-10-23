<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CalendarDays, Expand, Pencil, Trash2, Wallet } from '@lucide/vue'
import { useAppStore } from '@/stores/app'
import { formatCurrency } from '@/lib/format'
import { formatDateLong, formatTime } from '@/lib/date'
import BaseModal from '@/components/ui/BaseModal.vue'
import PhotoThumb from '@/components/ui/PhotoThumb.vue'
import PhotoLightbox from '@/components/ui/PhotoLightbox.vue'
import TargetIcon from '@/components/ui/TargetIcon.vue'

const props = defineProps<{
  open: boolean
  depositId?: string
}>()

const emit = defineEmits<{
  close: []
  edit: [id: string]
  delete: [id: string]
}>()

const appStore = useAppStore()
const lightboxOpen = ref(false)

const deposit = computed(() =>
  props.depositId
    ? appStore.data.deposits.find((item) => item.id === props.depositId)
    : undefined,
)
const target = computed(() =>
  deposit.value?.targetId
    ? appStore.data.targets.find((item) => item.id === deposit.value?.targetId)
    : undefined,
)
const targetSaved = computed(() => {
  if (!target.value) return 0
  return appStore.data.deposits
    .filter((item) => item.targetId === target.value?.id)
    .reduce((total, item) => total + item.amount, 0)
})

watch(
  () => props.open,
  (open) => {
    if (!open) lightboxOpen.value = false
  },
)
</script>

<template>
  <BaseModal
    :open="open"
    title="Detail setoran"
    subtitle="Bukti foto dan informasi setoran yang tersimpan."
    size="lg"
    @close="emit('close')"
  >
    <div v-if="deposit" class="space-y-4 pt-1">
      <div class="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-surface-2 p-4">
        <div>
          <p class="eyebrow">Nominal setoran</p>
          <p class="mt-1.5 text-[28px] font-extrabold tracking-tight text-ink">
            {{ formatCurrency(deposit.amount) }}
          </p>
          <p class="mt-1 text-xs font-semibold text-muted">
            {{ formatDateLong(deposit.date) }} · {{ formatTime(deposit.date) }} WIB
          </p>
        </div>
        <span
          class="chip"
          :class="deposit.photoId ? 'tag-success' : 'tag-warning'"
        >
          <span class="size-1.5 rounded-full" :class="deposit.photoId ? 'bg-success' : 'bg-warning'" />
          {{ deposit.photoId ? 'Bukti foto tersimpan' : 'Tanpa bukti foto' }}
        </span>
      </div>

      <div v-if="deposit.photoId" class="group relative overflow-hidden rounded-2xl border border-line">
        <div class="aspect-[16/10] w-full cursor-zoom-in" @click="lightboxOpen = true">
          <PhotoThumb :photo-id="deposit.photoId" alt="Bukti setoran" />
          <div
            class="absolute inset-0 flex items-center justify-center bg-[#0b1220]/0 opacity-0 transition-all duration-200 group-hover:bg-[#0b1220]/25 group-hover:opacity-100"
          >
            <span class="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-ink shadow-lg">
              <Expand :size="14" />
              Perbesar foto
            </span>
          </div>
        </div>
        <button
          type="button"
          class="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-lg bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/55"
          aria-label="Buka foto ukuran penuh"
          @click="lightboxOpen = true"
        >
          <Expand :size="15" />
        </button>
      </div>
      <div
        v-else
        class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong bg-surface-2 px-5 py-8 text-center text-muted"
      >
        <p class="text-xs font-bold">Foto bukti tidak tersedia</p>
        <p class="max-w-xs text-[11px] leading-relaxed">
          Setoran ini tercatat tanpa dokumentasi foto. Kamu dapat menambahkannya melalui tombol edit.
        </p>
      </div>

      <div class="grid gap-2 sm:grid-cols-2">
        <div class="rounded-xl border border-line p-3.5">
          <div class="flex items-center gap-2 text-[11px] font-bold text-muted">
            <TargetIcon
              :name="target?.icon ?? 'PiggyBank'"
              :color="target ? '#5278F6' : '#8290A8'"
              :size="14"
              :boxed="false"
            />
            Target tabungan
          </div>
          <p class="mt-1.5 text-sm font-bold text-ink">{{ target?.name ?? 'Tabungan umum' }}</p>
          <p v-if="target" class="mt-1 text-[11px] text-muted">
            Terkumpul {{ formatCurrency(targetSaved) }} dari {{ formatCurrency(target.targetAmount) }}
          </p>
          <p v-else class="mt-1 text-[11px] text-muted">Setoran tidak dikaitkan ke target tertentu.</p>
        </div>
        <div class="rounded-xl border border-line p-3.5">
          <div class="flex items-center gap-2 text-[11px] font-bold text-muted">
            <Wallet :size="14" />
            Dompet sumber
          </div>
          <p class="mt-1.5 text-sm font-bold text-ink">{{ appStore.walletName(deposit.walletId) }}</p>
          <div class="mt-1 flex items-center gap-1 text-[11px] text-muted">
            <CalendarDays :size="12" />
            Dicatat {{ formatDateLong(deposit.createdAt) }}
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-line p-3.5">
        <p class="text-[11px] font-bold text-muted">Catatan</p>
        <p class="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
          {{ deposit.note || 'Tidak ada catatan untuk setoran ini.' }}
        </p>
      </div>
    </div>

    <div v-else class="py-10 text-center text-sm text-muted">Setoran tidak ditemukan.</div>

    <template #footer>
      <button
        v-if="deposit"
        type="button"
        class="btn btn-danger sm:mr-auto"
        @click="emit('delete', deposit.id)"
      >
        <Trash2 :size="15" />
        Hapus
      </button>
      <button type="button" class="btn btn-secondary" @click="emit('close')">Tutup</button>
      <button
        v-if="deposit"
        type="button"
        class="btn btn-primary"
        @click="emit('edit', deposit.id)"
      >
        <Pencil :size="15" />
        Edit Setoran
      </button>
    </template>
  </BaseModal>

  <PhotoLightbox
    :open="lightboxOpen"
    :photo-id="deposit?.photoId"
    :title="deposit ? `Bukti ${formatCurrency(deposit.amount)}` : 'Bukti setoran'"
    :subtitle="deposit ? `${formatDateLong(deposit.date)} · ${appStore.walletName(deposit.walletId)}` : undefined"
    @close="lightboxOpen = false"
  />
</template>
