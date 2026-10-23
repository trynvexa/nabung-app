<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { Download, ImageOff, LoaderCircle, X } from '@lucide/vue'
import { loadPhoto } from '@/lib/db'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scrollLock'

const props = withDefaults(
  defineProps<{
    open: boolean
    photoId?: string
    title?: string
    subtitle?: string
    filename?: string
  }>(),
  {
    title: 'Bukti setoran',
    filename: 'tabungin-bukti-setoran.jpg',
  },
)

const emit = defineEmits<{ close: [] }>()

const url = ref('')
const loading = ref(false)
const failed = ref(false)
let locked = false
let requestToken = 0

function revoke(): void {
  if (url.value) {
    URL.revokeObjectURL(url.value)
    url.value = ''
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}

async function load(id?: string): Promise<void> {
  requestToken += 1
  const token = requestToken
  revoke()
  failed.value = false
  if (!id) {
    failed.value = true
    return
  }
  loading.value = true
  const record = await loadPhoto(id)
  if (token !== requestToken) return
  if (!record) {
    failed.value = true
    loading.value = false
    return
  }
  url.value = URL.createObjectURL(record.blob)
  loading.value = false
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      lockBodyScroll()
      locked = true
      document.addEventListener('keydown', onKeydown)
      void load(props.photoId)
    } else {
      if (locked) {
        unlockBodyScroll()
        locked = false
      }
      document.removeEventListener('keydown', onKeydown)
      revoke()
    }
  },
)

onBeforeUnmount(() => {
  requestToken += 1
  if (locked) unlockBodyScroll()
  document.removeEventListener('keydown', onKeydown)
  revoke()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-[90] flex flex-col bg-[#08120c]/92 text-white backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <header class="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div class="min-w-0">
            <p class="text-sm font-extrabold">{{ title }}</p>
            <p v-if="subtitle" class="mt-0.5 text-xs text-white/60">{{ subtitle }}</p>
          </div>
          <div class="flex items-center gap-2">
            <a
              v-if="url"
              :href="url"
              :download="filename"
              class="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-white/15"
            >
              <Download :size="15" />
              <span class="hidden sm:inline">Unduh</span>
            </a>
            <button
              type="button"
              class="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/15"
              aria-label="Tutup pratinjau foto"
              @click="emit('close')"
            >
              <X :size="19" />
            </button>
          </div>
        </header>
        <div class="flex min-h-0 flex-1 items-center justify-center px-4 pb-5" @click.self="emit('close')">
          <div v-if="loading" class="flex flex-col items-center gap-3 text-white/70">
            <LoaderCircle :size="28" class="animate-spin" />
            <p class="text-xs font-semibold">Memuat bukti foto…</p>
          </div>
          <div
            v-else-if="failed"
            class="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-10 text-white/60"
          >
            <ImageOff :size="32" />
            <p class="text-sm font-semibold">Foto tidak tersedia di perangkat ini.</p>
            <p class="text-xs">Bukti mungkin dihapus atau penyimpanan browser dibersihkan.</p>
          </div>
          <img
            v-else-if="url"
            :src="url"
            :alt="title"
            class="max-h-full max-w-full rounded-2xl object-contain shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
            @click.self="emit('close')"
          />
        </div>
        <footer class="safe-bottom px-4 pb-4 text-center text-[11px] text-white/40">
          Dokumentasi pribadi. Foto disimpan lokal dan bukan verifikasi otomatis.
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>
