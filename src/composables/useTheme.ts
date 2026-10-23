import { computed, watchEffect } from 'vue'
import { useAppStore } from '@/stores/app'
import { systemPrefersDark } from './systemTheme'

export function useTheme() {
  const appStore = useAppStore()
  const isDark = computed(
    () =>
      appStore.data.settings.theme === 'dark' ||
      (appStore.data.settings.theme === 'system' && systemPrefersDark.value),
  )

  watchEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', isDark.value)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', isDark.value ? '#0A1020' : '#F5F7FC')
  })

  function toggleTheme(): void {
    appStore.updateSettings({ theme: isDark.value ? 'light' : 'dark' })
  }

  function setTheme(theme: 'light' | 'dark' | 'system'): void {
    appStore.updateSettings({ theme })
  }

  return { isDark, toggleTheme, setTheme }
}

export function useIsDark() {
  const appStore = useAppStore()
  return computed(
    () =>
      appStore.data.settings.theme === 'dark' ||
      (appStore.data.settings.theme === 'system' && systemPrefersDark.value),
  )
}
