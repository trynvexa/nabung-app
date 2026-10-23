<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  PiggyBank,
  ShieldCheck,
  Target,
  WalletCards,
  X,
} from '@lucide/vue'
import { useUiStore } from '@/stores/ui'
import CatFace from '@/components/brand/CatFace.vue'

const ui = useUiStore()
const currentStep = ref(0)

interface Step {
  title: string
  subtitle: string
  badge: string
  icon: any
  tone: string
  tips: string[]
}

const steps: Step[] = [
  {
    badge: 'Fitur 1 dari 5 · Ringkasan & Beranda',
    title: 'Pantau Progres Finansialmu 🐱',
    subtitle:
      'Lihat total saldo terkumpul, arus kas pemasukan dan pengeluaran bulan ini, serta rekor streak menabung harianmu.',
    icon: LayoutDashboard,
    tone: 'bg-[#EBF3E8] text-[#3B6444]',
    tips: [
      'Total tabungan & kekayaan bersih dari semua dompet terhitung otomatis.',
      'Grafik interaktif untuk memantau tren pemasukan vs pengeluaran.',
      'Streak harian untuk menjaga konsistensi menabung setiap hari.',
    ],
  },
  {
    badge: 'Fitur 2 dari 5 · Target Impian',
    title: 'Wujudkan Impian Satu per Satu 🎯',
    subtitle:
      'Buat target tabungan spesifik seperti Liburan, Gadget Baru, Motor, hingga Dana Darurat lengkap dengan deadline.',
    icon: Target,
    tone: 'bg-[#FDF3DE] text-[#916B27]',
    tips: [
      'Tentukan nominal impian dan alokasikan setoran ke target tertentu.',
      'Estimasi otomatis berapa hari lagi target impianmu akan tercapai.',
      'Bar persentase progres yang jelas dan memotivasi.',
    ],
  },
  {
    badge: 'Fitur 3 dari 5 · Setoran & Bukti Foto',
    title: 'Catat Tabungan dengan Foto Asli 📸',
    subtitle:
      'Setiap kali menabung, lampirkan bukti foto transfer atau struk ATM. Bukti tersimpan aman di perangkatmu.',
    icon: PiggyBank,
    tone: 'bg-[#E7F3E5] text-[#3F7C47]',
    tips: [
      'Tombol (+) cepat di navigasi bawah untuk mencatat setoran kapan saja.',
      'Pilihan nominal cepat Rp 10.000, 25.000, 50.000, hingga 500.000.',
      'Animasi kembang api konfeti saat target tabunganmu berhasil lunas!',
    ],
  },
  {
    badge: 'Fitur 4 dari 5 · Dompet & Anggaran',
    title: 'Pisahkan Saldo & Batasi Pengeluaran 💳',
    subtitle:
      'Kelola dompet tunai, rekening bank, dan e-wallet secara terpisah. Pasang batas anggaran dan pengingat tagihan.',
    icon: WalletCards,
    tone: 'bg-[#EBF1FA] text-[#355A8A]',
    tips: [
      'Dukungan multi-dompet: Tunai, Bank (BCA, Mandiri, dll.), dan E-Wallet (GoPay, OVO, Dana).',
      'Peringatan otomatis saat pengeluaran kategori hampir melebihi limit.',
      'Pengingat jatuh tempo tagihan listrik, internet, dan langganan.',
    ],
  },
  {
    badge: 'Fitur 5 dari 5 · Keamanan & Privasi',
    title: 'Data 100% Aman di Perangkat Anda 🛡️',
    subtitle:
      'Tabungin dibuat dengan arsitektur offline-first. Seluruh data keuanganmu tidak pernah dikirim ke pihak ketiga.',
    icon: ShieldCheck,
    tone: 'bg-[#F2EDFA] text-[#5C3D8F]',
    tips: [
      'Validasi keamanan berkas biner (magic bytes) anti-malware.',
      'Sistem proteksi rate-limiting untuk menangkal upaya brute-force.',
      'Cadangkan data dan foto ke berkas lokal terenkripsi kapan saja.',
    ],
  },
]

const defaultStep: Step = steps[0]!
const step = computed<Step>(() => steps[currentStep.value] ?? defaultStep)
const isLastStep = computed(() => currentStep.value === steps.length - 1)

function next(): void {
  if (isLastStep.value) {
    finish()
  } else {
    currentStep.value += 1
  }
}

function prev(): void {
  if (currentStep.value > 0) {
    currentStep.value -= 1
  }
}

function finish(): void {
  localStorage.setItem('tabungin_tour_completed', 'true')
  ui.closeTour()
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="ui.tourOpen"
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
      >
        <!-- Modal Card -->
        <div
          class="animate-cute-pop relative flex w-full max-w-[500px] flex-col overflow-hidden rounded-[28px] border border-[#DFE7DC] bg-white p-6 shadow-2xl dark:border-[#2C3B2E] dark:bg-[#1A251D] sm:p-7"
        >
          <!-- Top Row: Mascot Badge + Close Button -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="flex size-10 items-center justify-center rounded-2xl bg-[#EBF4E8] p-1 shadow-sm dark:bg-[#253628]">
                <CatFace class="size-full" />
              </div>
              <div>
                <p class="text-[10px] font-black uppercase tracking-wider text-[#4E7858] dark:text-[#A8D3A9]">
                  Panduan Tabungin
                </p>
                <p class="text-[12px] font-bold text-[#6D806B] dark:text-[#91A48F]">
                  {{ step.badge }}
                </p>
              </div>
            </div>

            <button
              type="button"
              class="flex size-8 items-center justify-center rounded-full text-[#7B927A] transition-colors hover:bg-[#EEF4EC] hover:text-[#3B6444] dark:hover:bg-[#253628]"
              aria-label="Tutup panduan"
              @click="finish"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- Feature Hero Card -->
          <div class="mt-5 rounded-2xl border border-[#DFE7DC] p-5 shadow-sm dark:border-[#2C3B2E] dark:bg-[#1E2B21]" :class="step.tone.split(' ')[0]">
            <div class="flex items-center gap-3">
              <div class="flex size-11 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-[#172119]">
                <component :is="step.icon" :size="22" :class="step.tone.split(' ')[1]" />
              </div>
              <h2 id="tour-title" class="text-[18px] font-black tracking-[-0.03em] text-[#28432F] dark:text-[#E8F2E7]">
                {{ step.title }}
              </h2>
            </div>

            <p class="mt-3 text-[13px] font-medium leading-relaxed text-[#4A5E4C] dark:text-[#B2C5B4]">
              {{ step.subtitle }}
            </p>

            <!-- Key Feature Tips -->
            <ul class="mt-4 space-y-2 border-t border-black/5 pt-3.5 dark:border-white/5">
              <li
                v-for="(tip, idx) in step.tips"
                :key="idx"
                class="flex items-start gap-2 text-[12px] font-semibold text-[#3B503D] dark:text-[#CBDCCB]"
              >
                <CheckCircle2 :size="15" class="mt-0.5 shrink-0 text-[#4E7858] dark:text-[#A8D3A9]" />
                <span>{{ tip }}</span>
              </li>
            </ul>
          </div>

          <!-- Step Indicator Dots -->
          <div class="mt-5 flex items-center justify-center gap-1.5" aria-hidden="true">
            <button
              v-for="(_, idx) in steps"
              :key="idx"
              type="button"
              class="h-2 rounded-full transition-all"
              :class="idx === currentStep ? 'w-6 bg-[#4E7858]' : 'w-2 bg-[#D3E2D0] hover:bg-[#B3CBB0]'"
              :aria-label="`Lompat ke langkah ${idx + 1}`"
              @click="currentStep = idx"
            />
          </div>

          <!-- Modal Action Buttons -->
          <div class="mt-6 flex items-center justify-between gap-3">
            <button
              v-if="currentStep > 0"
              type="button"
              class="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-[#DFE7DC] px-4 text-[12px] font-bold text-[#556E57] transition-all hover:bg-[#EEF4EC] dark:border-[#2C3B2E] dark:text-[#CBDCCB]"
              @click="prev"
            >
              <ArrowLeft :size="15" />
              <span>Sebelumnya</span>
            </button>
            <button
              v-else
              type="button"
              class="text-[12px] font-bold text-[#7E937D] hover:underline"
              @click="finish"
            >
              Lewati panduan
            </button>

            <button
              type="button"
              class="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#4A7254] px-5 text-[13px] font-bold text-white shadow-[0_8px_18px_-4px_rgba(74,114,84,0.4)] transition-all hover:bg-[#3F6347] active:scale-[0.98]"
              @click="next"
            >
              <span v-if="isLastStep">Mulai Menabung! 🚀</span>
              <span v-else>Lanjut</span>
              <ArrowRight v-if="!isLastStep" :size="16" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
