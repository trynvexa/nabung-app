<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { X } from '@lucide/vue'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scrollLock'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    subtitle?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    persistent?: boolean
    showClose?: boolean
  }>(),
  {
    size: 'md',
    persistent: false,
    showClose: true,
  },
)

const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
let locked = false
let previouslyFocused: HTMLElement | null = null

const sizeClass = computed(
  () =>
    ({
      sm: 'sm:max-w-md',
      md: 'sm:max-w-xl',
      lg: 'sm:max-w-2xl',
      xl: 'sm:max-w-4xl',
    })[props.size],
)

function release(): void {
  if (locked) {
    unlockBodyScroll()
    locked = false
  }
  document.removeEventListener('keydown', onKeydown)
}

function requestClose(): void {
  if (props.persistent) return
  emit('close')
}

function focusableElements(): HTMLElement[] {
  if (!panel.value) return []
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return [...panel.value.querySelectorAll<HTMLElement>(selector)].filter(
    (element) => element.offsetParent !== null,
  )
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.preventDefault()
    requestClose()
    return
  }
  if (event.key !== 'Tab') return
  const focusable = focusableElements()
  if (focusable.length === 0) {
    event.preventDefault()
    panel.value?.focus()
    return
  }
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement | null
      lockBodyScroll()
      locked = true
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      const firstField = focusableElements()[0]
      ;(firstField ?? panel.value)?.focus({ preventScroll: true })
    } else {
      release()
      previouslyFocused?.focus?.({ preventScroll: true })
      previouslyFocused = null
    }
  },
)

onBeforeUnmount(release)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-5"
        role="presentation"
      >
        <div
          class="absolute inset-0 bg-[#102018]/55 backdrop-blur-[3px]"
          @click="requestClose"
        />
        <div
          ref="panel"
          class="modal-panel relative z-10 flex max-h-[93dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-line bg-surface shadow-[0_30px_80px_-20px_rgba(16,32,24,0.45)] sm:max-h-[90dvh] sm:rounded-[24px]"
          :class="sizeClass"
          role="dialog"
          aria-modal="true"
          :aria-label="title ?? 'Dialog'"
          tabindex="-1"
        >
          <div class="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong sm:hidden" />
          <header
            v-if="title || $slots.header"
            class="flex items-start justify-between gap-4 px-5 pb-4 pt-4 sm:px-6 sm:pt-5"
          >
            <slot name="header">
              <div class="min-w-0">
                <h2 class="text-lg font-extrabold tracking-tight text-ink">{{ title }}</h2>
                <p v-if="subtitle" class="mt-1 text-[13px] leading-relaxed text-muted">
                  {{ subtitle }}
                </p>
              </div>
            </slot>
            <button
              v-if="showClose"
              type="button"
              class="icon-btn icon-btn-sm -mr-1 -mt-1"
              aria-label="Tutup dialog"
              @click="requestClose"
            >
              <X :size="17" />
            </button>
          </header>
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6 sm:pb-6">
            <slot />
          </div>
          <footer
            v-if="$slots.footer"
            class="safe-bottom flex flex-col-reverse gap-2 border-t border-line bg-surface-2/70 px-5 py-3.5 sm:flex-row sm:justify-end sm:px-6"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
