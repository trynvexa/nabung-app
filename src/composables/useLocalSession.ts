import { computed, ref } from 'vue'

const STORAGE_KEY = 'tabungin:local-session'

export interface LocalSession {
  email: string
  name: string
  provider: 'email' | 'google'
  signedInAt: string
}

function parseSession(raw: string | null): LocalSession | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<LocalSession>
    if (!value || typeof value.email !== 'string' || !value.email.trim()) return null
    return {
      email: value.email.trim().slice(0, 160),
      name: typeof value.name === 'string' ? value.name.trim().slice(0, 80) : '',
      provider: value.provider === 'google' ? 'google' : 'email',
      signedInAt:
        typeof value.signedInAt === 'string' ? value.signedInAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

function readSession(): LocalSession | null {
  if (typeof window === 'undefined') return null
  return (
    parseSession(window.localStorage.getItem(STORAGE_KEY)) ??
    parseSession(window.sessionStorage.getItem(STORAGE_KEY))
  )
}

const session = ref<LocalSession | null>(readSession())

export function useLocalSession() {
  const isSignedIn = computed(() => Boolean(session.value))
  const email = computed(() => session.value?.email ?? '')
  const displayName = computed(() => session.value?.name ?? '')

  function signIn(
    emailAddress: string,
    options: { remember?: boolean; name?: string; provider?: LocalSession['provider'] } = {},
  ): void {
    const value: LocalSession = {
      email: emailAddress.trim().slice(0, 160),
      name: (options.name ?? '').trim().slice(0, 80),
      provider: options.provider ?? 'email',
      signedInAt: new Date().toISOString(),
    }
    session.value = value
    if (typeof window === 'undefined') return
    const target = options.remember === false ? window.sessionStorage : window.localStorage
    const other = options.remember === false ? window.localStorage : window.sessionStorage
    other.removeItem(STORAGE_KEY)
    target.setItem(STORAGE_KEY, JSON.stringify(value))
  }

  function signOut(): void {
    session.value = null
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(STORAGE_KEY)
    window.sessionStorage.removeItem(STORAGE_KEY)
  }

  return { session, isSignedIn, email, displayName, signIn, signOut }
}
