import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type {
  ActionResult,
  AppData,
  AppSettings,
  Bill,
  Budget,
  Challenge,
  Deposit,
  FinanceTransaction,
  PhotoMeta,
  SavingsTarget,
  Transfer,
  Wallet,
} from '@/types'
import {
  clearPhotos,
  deletePhoto,
  loadAppData,
  mirrorAppData,
  saveAppData,
  savePhoto,
} from '@/lib/db'
import { addMonths, formatDateLong, monthKey, startOfMonth, todayKey } from '@/lib/date'
import {
  budgetStatuses,
  categorySpending,
  estimatedCompletion,
  longestStreak,
  monthSummary,
  monthlySeries,
  netWorth,
  savingsStreak,
  targetProgress,
  totalSavings,
  totalTargetCommitment,
  totalWalletBalance,
  upcomingBills,
  upcomingTargets,
  walletBalances,
} from '@/lib/calc'
import { createDemoReceipt } from '@/lib/image'
import { uid } from '@/lib/id'
import { normalizeAppData } from '@/lib/data'
import { createEmptyData, createSeedData } from '@/lib/seed'

export interface DepositPayload {
  amount: number
  targetId?: string
  walletId: string
  date: string
  note: string
  photoId?: string
  photoMeta?: PhotoMeta
}

export interface DepositResult {
  deposit: Deposit
  completedTarget?: SavingsTarget
}

export const useAppStore = defineStore('app', () => {
  const data = ref<AppData>(createEmptyData())
  const hydrated = ref(false)
  const loading = ref(true)
  const fatalError = ref('')
  const persistenceWarning = ref('')
  const saving = ref(false)

  const currentMonth = computed(() => monthKey())
  const previousMonth = computed(() => monthKey(addMonths(startOfMonth(new Date()), -1)))
  const walletsWithBalance = computed(() => walletBalances(data.value))
  const totalWallet = computed(() => totalWalletBalance(data.value))
  const totalSaved = computed(() => totalSavings(data.value))
  const netWorthTotal = computed(() => netWorth(data.value))
  const thisMonthSummary = computed(() => monthSummary(data.value, currentMonth.value))
  const previousMonthSummary = computed(() => monthSummary(data.value, previousMonth.value))
  const targetCards = computed(() =>
    data.value.targets.map((target) => ({
      target,
      progress: targetProgress(target, data.value.deposits),
      estimate: estimatedCompletion(target, data.value.deposits),
    })),
  )
  const targetCommitment = computed(() => totalTargetCommitment(data.value))
  const recentDeposits = computed(() =>
    [...data.value.deposits]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
  )
  const monthlyPoints = computed(() => monthlySeries(data.value, 6))
  const currentBudgetStatuses = computed(() => budgetStatuses(data.value, currentMonth.value))
  const currentCategorySpending = computed(() => categorySpending(data.value, currentMonth.value))
  const upcomingBillReminders = computed(() => upcomingBills(data.value, 14))
  const upcomingTargetReminders = computed(() => upcomingTargets(data.value, 45))
  const streak = computed(() => savingsStreak(data.value.deposits))
  const bestStreak = computed(() => longestStreak(data.value.deposits))
  const depositsThisMonth = computed(
    () =>
      data.value.deposits.filter((deposit) => monthKey(deposit.date) === currentMonth.value).length,
  )

  let saveTimer: ReturnType<typeof setTimeout> | undefined
  let initialized = false
  let watcherActive = false

  function walletName(walletId: string): string {
    return data.value.wallets.find((wallet) => wallet.id === walletId)?.name ?? 'Dompet terhapus'
  }

  function targetName(targetId?: string): string {
    if (!targetId) return 'Tabungan umum'
    return data.value.targets.find((target) => target.id === targetId)?.name ?? 'Tabungan umum'
  }

  function reconcileTargets(ids: Array<string | undefined>): void {
    const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))]
    for (const id of unique) {
      const target = data.value.targets.find((item) => item.id === id)
      if (!target) continue
      const progress = targetProgress(target, data.value.deposits)
      if (progress.isComplete && !target.completedAt) {
        target.completedAt = new Date().toISOString()
      } else if (!progress.isComplete && target.completedAt) {
        target.completedAt = undefined
      }
    }
  }

  async function attachDemoPhotos(source: AppData): Promise<void> {
    const candidates = [...source.deposits]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4)
    let index = 0
    for (const deposit of candidates) {
      try {
        const target = source.targets.find((item) => item.id === deposit.targetId)
        const receipt = await createDemoReceipt({
          amount: deposit.amount,
          target: target?.name ?? 'Tabungan umum',
          dateLabel: formatDateLong(deposit.date),
          variant: index,
        })
        const photoId = uid('img')
        await savePhoto({
          id: photoId,
          blob: receipt.blob,
          mimeType: 'image/jpeg',
          width: receipt.width,
          height: receipt.height,
          size: receipt.blob.size,
          createdAt: new Date().toISOString(),
        })
        deposit.photoId = photoId
        deposit.photoMeta = {
          mimeType: 'image/jpeg',
          size: receipt.blob.size,
          width: receipt.width,
          height: receipt.height,
          originalName: 'Contoh bukti setoran',
        }
        index += 1
      } catch {
        // Demo photos are a nice-to-have; keep metadata usable without IndexedDB.
      }
    }
  }

  async function flush(): Promise<void> {
    saving.value = true
    mirrorAppData(data.value)
    try {
      await saveAppData(data.value)
      persistenceWarning.value = ''
    } catch {
      persistenceWarning.value =
        'Penyimpanan browser gagal. Perubahan terakhir mungkin belum tersimpan permanen.'
    } finally {
      saving.value = false
    }
  }

  function persistSoon(): void {
    mirrorAppData(data.value)
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      void flush()
    }, 180)
  }

  function onBeforeUnload(): void {
    mirrorAppData(data.value)
  }

  function onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') mirrorAppData(data.value)
  }

  function startAutosave(): void {
    if (watcherActive) return
    watch(data, persistSoon, { deep: true })
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onVisibilityChange)
    watcherActive = true
  }

  async function init(): Promise<void> {
    if (initialized) return
    loading.value = true
    fatalError.value = ''
    try {
      const stored = await loadAppData()
      const normalized = stored ? normalizeAppData(stored) : null
      if (normalized) {
        data.value = normalized
      } else {
        if (stored) {
          persistenceWarning.value =
            'Data lokal lama tidak dapat dibaca. Tabungin memuat data contoh baru; impor cadangan untuk memulihkan data Anda.'
        }
        const seeded = createSeedData()
        await attachDemoPhotos(seeded)
        data.value = seeded
      }
      await flush()
      hydrated.value = true
      initialized = true
      startAutosave()
    } catch (error) {
      fatalError.value =
        error instanceof Error
          ? error.message
          : 'Tabungin tidak dapat membuka penyimpanan lokal di browser ini.'
    } finally {
      loading.value = false
    }
  }

  function addDeposit(payload: DepositPayload): DepositResult {
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      throw new Error('Nominal setoran harus lebih dari 0.')
    }
    if (!data.value.wallets.some((wallet) => wallet.id === payload.walletId)) {
      throw new Error('Pilih dompet sumber yang valid.')
    }
    const targetBefore = payload.targetId
      ? data.value.targets.find((target) => target.id === payload.targetId)
      : undefined
    const wasComplete = targetBefore
      ? targetProgress(targetBefore, data.value.deposits).isComplete
      : false
    const deposit: Deposit = {
      ...payload,
      id: uid('deposit'),
      createdAt: new Date().toISOString(),
    }
    data.value.deposits.push(deposit)
    reconcileTargets([deposit.targetId])
    const completedTarget =
      targetBefore && !wasComplete && targetBefore.completedAt ? targetBefore : undefined
    return { deposit, completedTarget }
  }

  function updateDeposit(id: string, payload: DepositPayload): DepositResult {
    const deposit = data.value.deposits.find((item) => item.id === id)
    if (!deposit) throw new Error('Setoran tidak ditemukan.')
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      throw new Error('Nominal setoran harus lebih dari 0.')
    }
    if (!data.value.wallets.some((wallet) => wallet.id === payload.walletId)) {
      throw new Error('Pilih dompet sumber yang valid.')
    }
    const previousTargetId = deposit.targetId
    const targetBefore = payload.targetId
      ? data.value.targets.find((target) => target.id === payload.targetId)
      : undefined
    const wasComplete = targetBefore
      ? targetProgress(targetBefore, data.value.deposits).isComplete
      : false
    Object.assign(deposit, payload)
    reconcileTargets([previousTargetId, payload.targetId])
    const completedTarget =
      targetBefore && !wasComplete && targetBefore.completedAt ? targetBefore : undefined
    return { deposit, completedTarget }
  }

  function deleteDeposit(id: string): boolean {
    const index = data.value.deposits.findIndex((deposit) => deposit.id === id)
    if (index < 0) return false
    const [removed] = data.value.deposits.splice(index, 1)
    reconcileTargets([removed?.targetId])
    if (removed?.photoId) void deletePhoto(removed.photoId)
    return true
  }

  function addTarget(
    payload: Omit<SavingsTarget, 'id' | 'createdAt' | 'completedAt'>,
  ): SavingsTarget {
    const target: SavingsTarget = {
      ...payload,
      id: uid('target'),
      createdAt: new Date().toISOString(),
    }
    data.value.targets.push(target)
    return target
  }

  function updateTarget(
    id: string,
    payload: Partial<Omit<SavingsTarget, 'id' | 'createdAt'>>,
  ): SavingsTarget {
    const target = data.value.targets.find((item) => item.id === id)
    if (!target) throw new Error('Target tidak ditemukan.')
    Object.assign(target, payload)
    if (target.targetAmount <= 0) throw new Error('Nominal target harus lebih dari 0.')
    reconcileTargets([target.id])
    return target
  }

  function deleteTarget(id: string): boolean {
    const index = data.value.targets.findIndex((target) => target.id === id)
    if (index < 0) return false
    data.value.targets.splice(index, 1)
    for (const deposit of data.value.deposits) {
      if (deposit.targetId === id) {
        deposit.targetId = undefined
        deposit.note = deposit.note || 'Setoran dialihkan ke tabungan umum.'
      }
    }
    return true
  }

  function addTransaction(
    payload: Omit<FinanceTransaction, 'id' | 'createdAt'>,
  ): FinanceTransaction {
    if (payload.amount <= 0) throw new Error('Nominal transaksi harus lebih dari 0.')
    const transaction: FinanceTransaction = {
      ...payload,
      id: uid('tx'),
      createdAt: new Date().toISOString(),
    }
    data.value.transactions.push(transaction)
    return transaction
  }

  function updateTransaction(
    id: string,
    payload: Partial<Omit<FinanceTransaction, 'id' | 'createdAt'>>,
  ): FinanceTransaction {
    const transaction = data.value.transactions.find((item) => item.id === id)
    if (!transaction) throw new Error('Transaksi tidak ditemukan.')
    Object.assign(transaction, payload)
    if (transaction.amount <= 0) throw new Error('Nominal transaksi harus lebih dari 0.')
    return transaction
  }

  function deleteTransaction(id: string): boolean {
    const transaction = data.value.transactions.find((item) => item.id === id)
    const index = data.value.transactions.findIndex((item) => item.id === id)
    if (index < 0) return false
    data.value.transactions.splice(index, 1)
    if (transaction?.billId) {
      const bill = data.value.bills.find((item) => item.id === transaction.billId)
      if (bill) bill.lastPaidAt = undefined
    }
    return true
  }

  function addWallet(payload: Omit<Wallet, 'id' | 'createdAt'>): Wallet {
    const wallet: Wallet = {
      ...payload,
      id: uid('wallet'),
      createdAt: new Date().toISOString(),
    }
    data.value.wallets.push(wallet)
    return wallet
  }

  function updateWallet(id: string, payload: Partial<Omit<Wallet, 'id' | 'createdAt'>>): Wallet {
    const wallet = data.value.wallets.find((item) => item.id === id)
    if (!wallet) throw new Error('Dompet tidak ditemukan.')
    Object.assign(wallet, payload)
    return wallet
  }

  function deleteWallet(id: string): ActionResult {
    if (data.value.wallets.length <= 1) {
      return { ok: false, message: 'Sisakan minimal satu dompet agar transaksi tetap bisa dicatat.' }
    }
    const related =
      data.value.transactions.some((item) => item.walletId === id) ||
      data.value.deposits.some((item) => item.walletId === id) ||
      data.value.transfers.some((item) => item.fromWalletId === id || item.toWalletId === id) ||
      data.value.bills.some((item) => item.walletId === id)
    if (related) {
      return {
        ok: false,
        message: 'Dompet masih dipakai transaksi, setoran, transfer, atau tagihan.',
      }
    }
    data.value.wallets = data.value.wallets.filter((wallet) => wallet.id !== id)
    return { ok: true }
  }

  function addTransfer(payload: Omit<Transfer, 'id' | 'createdAt'>): ActionResult {
    if (payload.fromWalletId === payload.toWalletId) {
      return { ok: false, message: 'Dompet asal dan tujuan harus berbeda.' }
    }
    if (payload.amount <= 0) {
      return { ok: false, message: 'Nominal transfer harus lebih dari 0.' }
    }
    if (!data.value.wallets.some((wallet) => wallet.id === payload.fromWalletId)) {
      return { ok: false, message: 'Dompet asal tidak ditemukan.' }
    }
    if (!data.value.wallets.some((wallet) => wallet.id === payload.toWalletId)) {
      return { ok: false, message: 'Dompet tujuan tidak ditemukan.' }
    }
    const source = walletBalances(data.value).find((item) => item.wallet.id === payload.fromWalletId)
    if (source && source.balance < payload.amount) {
      return { ok: false, message: 'Saldo dompet asal tidak mencukupi.' }
    }
    data.value.transfers.push({
      ...payload,
      id: uid('transfer'),
      createdAt: new Date().toISOString(),
    })
    return { ok: true }
  }

  function deleteTransfer(id: string): boolean {
    const index = data.value.transfers.findIndex((transfer) => transfer.id === id)
    if (index < 0) return false
    data.value.transfers.splice(index, 1)
    return true
  }

  function addBudget(payload: Omit<Budget, 'id' | 'createdAt'>): ActionResult {
    if (payload.monthlyLimit <= 0) {
      return { ok: false, message: 'Batas anggaran harus lebih dari 0.' }
    }
    if (data.value.budgets.some((budget) => budget.category === payload.category)) {
      return { ok: false, message: 'Anggaran untuk kategori ini sudah ada.' }
    }
    data.value.budgets.push({
      ...payload,
      id: uid('budget'),
      createdAt: new Date().toISOString(),
    })
    return { ok: true }
  }

  function updateBudget(id: string, monthlyLimit: number): ActionResult {
    const budget = data.value.budgets.find((item) => item.id === id)
    if (!budget) return { ok: false, message: 'Anggaran tidak ditemukan.' }
    if (monthlyLimit <= 0) return { ok: false, message: 'Batas anggaran harus lebih dari 0.' }
    budget.monthlyLimit = monthlyLimit
    return { ok: true }
  }

  function deleteBudget(id: string): boolean {
    const index = data.value.budgets.findIndex((budget) => budget.id === id)
    if (index < 0) return false
    data.value.budgets.splice(index, 1)
    return true
  }

  function addBill(payload: Omit<Bill, 'id' | 'createdAt'>): Bill {
    const bill: Bill = {
      ...payload,
      id: uid('bill'),
      createdAt: new Date().toISOString(),
    }
    data.value.bills.push(bill)
    return bill
  }

  function updateBill(id: string, payload: Partial<Omit<Bill, 'id' | 'createdAt'>>): Bill {
    const bill = data.value.bills.find((item) => item.id === id)
    if (!bill) throw new Error('Tagihan tidak ditemukan.')
    Object.assign(bill, payload)
    return bill
  }

  function deleteBill(id: string): boolean {
    const index = data.value.bills.findIndex((bill) => bill.id === id)
    if (index < 0) return false
    data.value.bills.splice(index, 1)
    return true
  }

  function markBillPaid(id: string): ActionResult {
    const bill = data.value.bills.find((item) => item.id === id)
    if (!bill) return { ok: false, message: 'Tagihan tidak ditemukan.' }
    if (!bill.active) return { ok: false, message: 'Tagihan ini sudah tidak aktif.' }
    if (!data.value.wallets.some((wallet) => wallet.id === bill.walletId)) {
      return { ok: false, message: 'Dompet tagihan tidak ditemukan.' }
    }
    const paidThisMonth = data.value.transactions.some(
      (transaction) =>
        transaction.billId === bill.id && monthKey(transaction.date) === monthKey(todayKey()),
    )
    if (bill.frequency === 'monthly' && paidThisMonth) {
      return { ok: false, message: 'Tagihan ini sudah dibayar bulan ini.' }
    }
    const date = todayKey()
    data.value.transactions.push({
      id: uid('tx'),
      type: 'expense',
      amount: bill.amount,
      category: bill.category || 'Tagihan',
      date,
      note: `Pembayaran ${bill.name}`,
      walletId: bill.walletId,
      billId: bill.id,
      createdAt: new Date().toISOString(),
    })
    bill.lastPaidAt = date
    if (bill.frequency === 'once') bill.active = false
    return { ok: true, message: 'Tagihan ditandai lunas dan pengeluaran dicatat.' }
  }

  function addChallenge(
    payload: Omit<Challenge, 'id' | 'createdAt' | 'active'> & { active?: boolean },
  ): Challenge {
    const challenge: Challenge = {
      ...payload,
      active: payload.active ?? true,
      id: uid('challenge'),
      createdAt: new Date().toISOString(),
    }
    data.value.challenges.push(challenge)
    return challenge
  }

  function toggleChallenge(id: string, active?: boolean): boolean {
    const challenge = data.value.challenges.find((item) => item.id === id)
    if (!challenge) return false
    challenge.active = active ?? !challenge.active
    return true
  }

  function deleteChallenge(id: string): boolean {
    const index = data.value.challenges.findIndex((challenge) => challenge.id === id)
    if (index < 0) return false
    data.value.challenges.splice(index, 1)
    return true
  }

  function updateSettings(patch: Partial<AppSettings>): void {
    data.value.settings = { ...data.value.settings, ...patch }
  }

  function replaceData(next: AppData): void {
    const normalized = normalizeAppData(next)
    if (!normalized) throw new Error('Struktur data tidak valid.')
    data.value = normalized
    void flush()
  }

  async function resetAll(seed: boolean): Promise<void> {
    if (saveTimer) clearTimeout(saveTimer)
    await clearPhotos()
    if (seed) {
      const seeded = createSeedData()
      await attachDemoPhotos(seeded)
      data.value = seeded
    } else {
      data.value = createEmptyData()
    }
    await flush()
  }

  return {
    data,
    hydrated,
    loading,
    fatalError,
    persistenceWarning,
    saving,
    currentMonth,
    previousMonth,
    walletsWithBalance,
    totalWallet,
    totalSaved,
    netWorthTotal,
    thisMonthSummary,
    previousMonthSummary,
    targetCards,
    targetCommitment,
    recentDeposits,
    monthlyPoints,
    currentBudgetStatuses,
    currentCategorySpending,
    upcomingBillReminders,
    upcomingTargetReminders,
    streak,
    bestStreak,
    depositsThisMonth,
    init,
    flush,
    walletName,
    targetName,
    addDeposit,
    updateDeposit,
    deleteDeposit,
    addTarget,
    updateTarget,
    deleteTarget,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addWallet,
    updateWallet,
    deleteWallet,
    addTransfer,
    deleteTransfer,
    addBudget,
    updateBudget,
    deleteBudget,
    addBill,
    updateBill,
    deleteBill,
    markBillPaid,
    addChallenge,
    toggleChallenge,
    deleteChallenge,
    updateSettings,
    replaceData,
    resetAll,
  }
})
