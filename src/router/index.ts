import { createRouter, createWebHistory } from 'vue-router'
import { pageTitleFor } from '@/lib/navigation'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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

router.afterEach((to) => {
  document.title = `${pageTitleFor(to.path)} · Savezy`
})

export default router
