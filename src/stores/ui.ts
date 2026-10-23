import { ref } from 'vue'
import { defineStore } from 'pinia'
import { uid } from '@/lib/id'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  title?: string
  message: string
  variant: ToastVariant
}

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
}

interface ConfirmState extends ConfirmOptions {
  open: boolean
}

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<ToastItem[]>([])
  const confirmState = ref<ConfirmState>({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Lanjutkan',
    cancelLabel: 'Batal',
    tone: 'danger',
  })
  const depositOpen = ref(false)
  const depositEditId = ref<string | null>(null)
  const depositTargetId = ref<string | undefined>(undefined)

  let confirmResolver: ((value: boolean) => void) | null = null

  function dismissToast(id: string): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function notify(
    message: string,
    options: { title?: string; variant?: ToastVariant; duration?: number } = {},
  ): string {
    const id = uid('toast')
    const toast: ToastItem = {
      id,
      message,
      title: options.title,
      variant: options.variant ?? 'success',
    }
    toasts.value = [...toasts.value.slice(-3), toast]
    window.setTimeout(() => dismissToast(id), options.duration ?? 4200)
    return id
  }

  function askConfirm(options: ConfirmOptions): Promise<boolean> {
    if (confirmResolver) {
      confirmResolver(false)
      confirmResolver = null
    }
    confirmState.value = {
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel ?? 'Hapus',
      cancelLabel: options.cancelLabel ?? 'Batal',
      tone: options.tone ?? 'danger',
      open: true,
    }
    return new Promise<boolean>((resolve) => {
      confirmResolver = resolve
    })
  }

  function resolveConfirm(value: boolean): void {
    confirmState.value = { ...confirmState.value, open: false }
    if (confirmResolver) {
      confirmResolver(value)
      confirmResolver = null
    }
  }

  function openDeposit(options: { editId?: string; targetId?: string } = {}): void {
    depositEditId.value = options.editId ?? null
    depositTargetId.value = options.targetId
    depositOpen.value = true
  }

  function closeDeposit(): void {
    depositOpen.value = false
    depositEditId.value = null
    depositTargetId.value = undefined
  }

  return {
    toasts,
    confirmState,
    depositOpen,
    depositEditId,
    depositTargetId,
    notify,
    dismissToast,
    askConfirm,
    resolveConfirm,
    openDeposit,
    closeDeposit,
  }
})
