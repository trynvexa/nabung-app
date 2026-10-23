<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { ImageOff } from '@lucide/vue'
import { loadPhoto } from '@/lib/db'

const props = withDefaults(
  defineProps<{
    photoId?: string
    alt?: string
  }>(),
  {
    alt: 'Bukti setoran',
  },
)

const url = ref('')
const loading = ref(false)
const failed = ref(false)
let requestToken = 0

function revoke(): void {
  if (url.value) {
    URL.revokeObjectURL(url.value)
    url.value = ''
  }
}

async function load(id?: string): Promise<void> {
  requestToken += 1
  const token = requestToken
  revoke()
  failed.value = false
  if (!id) {
    loading.value = false
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
  () => props.photoId,
  (id) => void load(id),
  { immediate: true },
)

onBeforeUnmount(() => {
  requestToken += 1
  revoke()
})
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-surface-3">
    <img
      v-if="url"
      :src="url"
      :alt="alt"
      class="h-full w-full object-cover"
      loading="lazy"
      draggable="false"
    />
    <div v-else-if="loading" class="animate-shimmer absolute inset-0" aria-label="Memuat foto" />
    <div
      v-else
      class="flex h-full w-full flex-col items-center justify-center gap-1 bg-surface-2 text-muted"
    >
      <ImageOff :size="18" :stroke-width="1.8" />
      <span class="text-[9px] font-bold uppercase tracking-wide">Tanpa foto</span>
    </div>
  </div>
</template>
