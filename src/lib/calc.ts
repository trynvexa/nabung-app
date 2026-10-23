import type {
  AppData,
  Bill,
  Budget,
  Deposit,
  FinanceTransaction,
  SavingsTarget,
  Wallet,
} from '@/types'
import {
  addMonths,
  daysBetween,
  formatMonthShort,
  monthKey,
  nextMonthlyDue,
  parseDate,
  startOfDay,
  startOfMonth,
  toDateKey,
  todayKey,
} from './date'
import { findCategory } from './categories'
import { roundCurrency, sum } from './id'

export interface WalletBalance {
  wallet: Wallet
  balance: number
}

export interface TargetProgress {
  saved: number
  target: number
  percent: number
  remaining: number
  depositCount: number
  isComplete: boolean
}

export interface MonthSummary {
  key: string
  income: number
  expense: number
  depositTotal: number
  depositCount: number
  balance: number
}

export interface MonthPoint {
  key: string
  label: string
  income: number
  expense: number
  deposits: number
}

export interface CategoryAmount {
  category: string
  amount: number
  color: string
}

export interface BudgetStatus {
  budget: Budget
  spent: number
  remaining: number
  percent: number
  state: 'safe' | 'near' | 'over'
}

export function walletBalance(
  wallet: Wallet,
  transactions: FinanceTransaction[],
  deposits: Deposit[],
  transfers: AppData['transfers'],
): number {
  const income = sum(
    transactions
      .filter((transaction) => transaction.walletId === wallet.id && transaction.type === 'income')
      .map((transaction) => transaction.amount),
  )
  const expense = sum(
    transactions
      .filter((transaction) => transaction.walletId === wallet.id && transaction.type === 'expense')
      .map((transaction) => transaction.amount),
  )
  const savings = sum(
    deposits.filter((deposit) => deposit.walletId === wallet.id).map((deposit) => deposit.amount),
  )
  const outgoing = sum(
    transfers.filter((transfer) => transfer.fromWalletId === wallet.id).map((transfer) => transfer.amount),
  )
  const incoming = sum(
    transfers.filter((transfer) => transfer.toWalletId === wallet.id).map((transfer) => transfer.amount),
  )
  return roundCurrency(wallet.initialBalance + income - expense - savings - outgoing + incoming)
}

export function walletBalances(data: AppData): WalletBalance[] {
  return data.wallets.map((wallet) => ({
    wallet,
    balance: walletBalance(wallet, data.transactions, data.deposits, data.transfers),
  }))
}

export function totalWalletBalance(data: AppData): number {
  return sum(walletBalances(data).map((entry) => entry.balance))
}

export function totalSavings(data: AppData): number {
  return sum(data.deposits.map((deposit) => deposit.amount))
}

export function netWorth(data: AppData): number {
  return roundCurrency(totalWalletBalance(data) + totalSavings(data))
}

export function targetProgress(target: SavingsTarget, deposits: Deposit[]): TargetProgress {
  const linked = deposits.filter((deposit) => deposit.targetId === target.id)
  const saved = sum(linked.map((deposit) => deposit.amount))
  const percent = target.targetAmount > 0 ? Math.min((saved / target.targetAmount) * 100, 100) : 0
  return {
    saved,
    target: target.targetAmount,
    percent,
    remaining: Math.max(target.targetAmount - saved, 0),
    depositCount: linked.length,
    isComplete: saved >= target.targetAmount && target.targetAmount > 0,
  }
}

export function totalTargetCommitment(data: AppData): { target: number; saved: number; percent: number } {
  const target = sum(data.targets.map((item) => item.targetAmount))
  const savedOnTargets = sum(
    data.targets.map((item) => Math.min(targetProgress(item, data.deposits).saved, item.targetAmount)),
  )
  return {
    target,
    saved: savedOnTargets,
    percent: target > 0 ? Math.min((savedOnTargets / target) * 100, 100) : 0,
  }
}

export function monthSummary(data: AppData, key: string): MonthSummary {
  const transactions = data.transactions.filter((item) => item.date.slice(0, 7) === key)
  const deposits = data.deposits.filter((item) => toDateKey(item.date).slice(0, 7) === key)
  const income = sum(
    transactions.filter((item) => item.type === 'income').map((item) => item.amount),
  )
  const expense = sum(
    transactions.filter((item) => item.type === 'expense').map((item) => item.amount),
  )
  return {
    key,
    income,
    expense,
    depositTotal: sum(deposits.map((item) => item.amount)),
    depositCount: deposits.length,
    balance: income - expense,
  }
}

export function monthlySeries(data: AppData, monthCount: number, from: Date = new Date()): MonthPoint[] {
  const points: MonthPoint[] = []
  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const date = addMonths(startOfMonth(from), -offset)
    const key = monthKey(date)
    const summary = monthSummary(data, key)
    points.push({
      key,
      label: formatMonthShort(date),
      income: summary.income,
      expense: summary.expense,
      deposits: summary.depositTotal,
    })
  }
  return points
}

export function categorySpending(data: AppData, key: string): CategoryAmount[] {
  const totals = new Map<string, number>()
  for (const transaction of data.transactions) {
    if (transaction.type !== 'expense' || transaction.date.slice(0, 7) !== key) continue
    totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount)
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      color: findCategory(category).color,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function budgetStatuses(data: AppData, key: string): BudgetStatus[] {
  const spending = categorySpending(data, key)
  return data.budgets.map((budget) => {
    const spent = spending.find((entry) => entry.category === budget.category)?.amount ?? 0
    const percent =
      budget.monthlyLimit > 0 ? Math.max((spent / budget.monthlyLimit) * 100, 0) : 0
    return {
      budget,
      spent,
      remaining: budget.monthlyLimit - spent,
      percent,
      state: percent >= 100 ? 'over' : percent >= 80 ? 'near' : 'safe',
    }
  })
}

export function savingsStreak(deposits: Deposit[], reference: Date = new Date()): number {
  const days = new Set(deposits.map((deposit) => toDateKey(deposit.date)))
  if (days.size === 0) return 0
  const today = startOfDay(reference)
  const todayK = toDateKey(today)
  const yesterdayK = toDateKey(new Date(today.getTime() - 86_400_000))
  let cursor: Date
  if (days.has(todayK)) {
    cursor = today
  } else if (days.has(yesterdayK)) {
    cursor = new Date(today.getTime() - 86_400_000)
  } else {
    return 0
  }
  let streak = 0
  while (days.has(toDateKey(cursor))) {
    streak += 1
    cursor = new Date(cursor.getTime() - 86_400_000)
  }
  return streak
}

export function longestStreak(deposits: Deposit[]): number {
  const keys = [...new Set(deposits.map((deposit) => toDateKey(deposit.date)))].sort()
  let best = 0
  let current = 0
  let previous: Date | null = null
  for (const key of keys) {
    const date = parseDate(key)
    current = previous && daysBetween(previous, date) === 1 ? current + 1 : 1
    best = Math.max(best, current)
    previous = date
  }
  return best
}

export function averageMonthlySavings(target: SavingsTarget, deposits: Deposit[]): number {
  const linked = deposits
    .filter((deposit) => deposit.targetId === target.id)
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
  if (linked.length === 0) return 0
  const first = parseDate(linked[0]?.date ?? target.createdAt)
  const days = Math.max(daysBetween(first, new Date()), 1)
  const months = Math.max(days / 30.4, 1)
  return sum(linked.map((deposit) => deposit.amount)) / months
}

export function estimatedCompletion(target: SavingsTarget, deposits: Deposit[]): Date | null {
  const progress = targetProgress(target, deposits)
  if (progress.remaining === 0) return null
  const average = averageMonthlySavings(target, deposits)
  if (average <= 0) return null
  const monthsNeeded = Math.ceil(progress.remaining / average)
  if (monthsNeeded > 600) return null
  return new Date(new Date().getFullYear(), new Date().getMonth() + monthsNeeded, 1)
}

export function depositDaysInMonth(deposits: Deposit[], month: string): Set<string> {
  return new Set(
    deposits
      .filter((deposit) => toDateKey(deposit.date).slice(0, 7) === month)
      .map((deposit) => toDateKey(deposit.date)),
  )
}

export function nextBillDue(bill: Bill): Date | null {
  if (!bill.active) return null
  if (bill.frequency === 'once') {
    return bill.dueDate ? parseDate(bill.dueDate) : null
  }
  return nextMonthlyDue(bill.dueDay, bill.lastPaidAt)
}

export function upcomingBills(data: AppData, withinDays = 14): Array<{ bill: Bill; due: Date; days: number }> {
  return data.bills
    .map((bill) => ({ bill, due: nextBillDue(bill) }))
    .filter((entry): entry is { bill: Bill; due: Date } => entry.due !== null)
    .map((entry) => ({ ...entry, days: daysBetween(todayKey(), entry.due) }))
    .filter((entry) => entry.days <= withinDays)
    .sort((a, b) => a.days - b.days)
}

export function upcomingTargets(data: AppData, withinDays = 45): Array<{ target: SavingsTarget; days: number }> {
  return data.targets
    .filter((target) => Boolean(target.deadline))
    .map((target) => ({ target, days: daysBetween(todayKey(), target.deadline as string) }))
    .filter((entry) => entry.days >= 0 && entry.days <= withinDays)
    .sort((a, b) => a.days - b.days)
}

export function depositsForMonth(data: AppData, key: string): Deposit[] {
  return data.deposits
    .filter((deposit) => toDateKey(deposit.date).slice(0, 7) === key)
    .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
}

export function expenseRatio(data: AppData, key: string): number {
  const summary = monthSummary(data, key)
  if (summary.income <= 0) return summary.expense > 0 ? 100 : 0
  return Math.min((summary.expense / summary.income) * 100, 999)
}

export function savingsRate(data: AppData, key: string): number {
  const summary = monthSummary(data, key)
  if (summary.income <= 0) return 0
  return Math.min((summary.depositTotal / summary.income) * 100, 100)
}

export function comparePercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}
