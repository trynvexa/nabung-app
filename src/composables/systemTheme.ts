import { ref } from 'vue'

export const systemPrefersDark = ref(false)
let initialized = false

export function initSystemTheme(): void {
  if (initialized || typeof window === 'undefined' || !window.matchMedia) return
  initialized = true
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  systemPrefersDark.value = media.matches
  const listener = (event: MediaQueryListEvent) => {
    systemPrefersDark.value = event.matches
  }
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', listener)
  } else {
    media.addListener(listener)
  }
}
