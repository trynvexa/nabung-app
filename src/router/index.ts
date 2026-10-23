import { createRouter, createWebHistory } from 'vue-router'
import { pageTitleFor } from '@/lib/navigation'
import { useLocalSession } from '@/composables/useLocalSession'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/mulai',
      name: 'splash',
      component: () => import('@/views/public/SplashView.vue'),
      meta: { public: true },
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/public/OnboardingView.vue'),
      meta: { public: true },
    },
    {
      path: '/masuk',
      name: 'login',
      component: () => import('@/views/public/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/daftar',
      name: 'register',
      component: () => import('@/views/public/RegisterView.vue'),
      meta: { public: true },
    },
    {
      path: '/lupa-sandi',
      name: 'forgot-password',
      component: () => import('@/views/public/ForgotPasswordView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/setoran',
      name: 'deposits',
      component: () => import('@/views/DepositsView.vue'),
    },
    {
      path: '/target',
      name: 'targets',
      component: () => import('@/views/TargetsView.vue'),
    },
    {
      path: '/tantangan',
      name: 'challenges',
      component: () => import('@/views/ChallengesView.vue'),
    },
    {
      path: '/transaksi',
      name: 'transactions',
      component: () => import('@/views/TransactionsView.vue'),
    },
    {
      path: '/dompet',
      name: 'wallets',
      component: () => import('@/views/WalletsView.vue'),
    },
    {
      path: '/anggaran',
      name: 'budget',
      component: () => import('@/views/BudgetView.vue'),
    },
    {
      path: '/tagihan',
      name: 'bills',
      component: () => import('@/views/BillsView.vue'),
    },
    {
      path: '/statistik',
      name: 'statistics',
      component: () => import('@/views/StatisticsView.vue'),
    },
    {
      path: '/profil',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
    },
    {
      path: '/notifikasi',
      name: 'notifications',
      component: () => import('@/views/NotificationsView.vue'),
    },
    {
      path: '/pengaturan',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach((to) => {
  const { isSignedIn } = useLocalSession()
  if (to.meta.public === true) return true
  if (!isSignedIn.value) {
    return { path: '/mulai', query: { redirect: to.fullPath } }
  }
  return true
})

router.afterEach((to) => {
  document.title = `${pageTitleFor(to.path)} · Tabungin`
})

export default router
