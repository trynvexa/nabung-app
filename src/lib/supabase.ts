import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { AppData } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export function isSupabaseConfigured(): boolean {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    !supabaseUrl.includes('YOUR_SUPABASE_URL') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')
  )
}

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/**
 * Authentication Helpers
 */
export async function signUpWithSupabase(email: string, password: string, name: string) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi pada file .env.')
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        profile_name: name,
      },
    },
  })
}

export async function signInWithSupabase(email: string, password: string) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi pada file .env.')
  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export async function signInWithSupabaseGoogle() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi pada file .env.')
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })
}

export async function signOutSupabase() {
  if (!supabase) return
  return await supabase.auth.signOut()
}

export async function getSupabaseUser(): Promise<User | null> {
  if (!supabase) return null
  try {
    const { data } = await supabase.auth.getUser()
    return data.user
  } catch {
    return null
  }
}

/**
 * Cloud Data Sync Helpers
 */

/** Fetches full user finance data from Supabase tables */
export async function fetchUserAppDataFromSupabase(userId: string): Promise<AppData | null> {
  if (!supabase) return null

  try {
    const [walletsRes, targetsRes, depositsRes, transactionsRes, budgetsRes, billsRes, challengesRes, transfersRes, settingsRes] =
      await Promise.all([
        supabase.from('wallets').select('*').eq('user_id', userId),
        supabase.from('targets').select('*').eq('user_id', userId),
        supabase.from('deposits').select('*').eq('user_id', userId),
        supabase.from('transactions').select('*').eq('user_id', userId),
        supabase.from('budgets').select('*').eq('user_id', userId),
        supabase.from('bills').select('*').eq('user_id', userId),
        supabase.from('challenges').select('*').eq('user_id', userId),
        supabase.from('transfers').select('*').eq('user_id', userId),
        supabase.from('user_settings').select('*').eq('user_id', userId).single(),
      ])

    if (walletsRes.error && walletsRes.error.code !== 'PGRST116') {
      console.warn('Gagal memuat data dari Supabase:', walletsRes.error.message)
      return null
    }

    const wallets = (walletsRes.data || []).map((w: any) => ({
      id: w.id,
      name: w.name,
      kind: w.kind,
      initialBalance: Number(w.initial_balance) || 0,
      color: w.color || '#5F8563',
      createdAt: w.created_at,
    }))

    const targets = (targetsRes.data || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      targetAmount: Number(t.target_amount) || 0,
      deadline: t.deadline || undefined,
      description: t.description || '',
      icon: t.icon || 'piggy-bank',
      priority: t.priority || 'medium',
      isEmergencyFund: Boolean(t.is_emergency_fund),
      createdAt: t.created_at,
      completedAt: t.completed_at || undefined,
    }))

    const deposits = (depositsRes.data || []).map((d: any) => ({
      id: d.id,
      amount: Number(d.amount) || 0,
      targetId: d.target_id || undefined,
      walletId: d.wallet_id,
      date: d.date,
      note: d.note || '',
      photoId: d.photo_url || undefined,
      photoMeta: d.photo_meta || undefined,
      createdAt: d.created_at,
    }))

    const transactions = (transactionsRes.data || []).map((tr: any) => ({
      id: tr.id,
      type: tr.type,
      amount: Number(tr.amount) || 0,
      category: tr.category,
      date: tr.date,
      note: tr.note || '',
      walletId: tr.wallet_id,
      billId: tr.bill_id || undefined,
      createdAt: tr.created_at,
    }))

    const budgets = (budgetsRes.data || []).map((b: any) => ({
      id: b.id,
      category: b.category,
      monthlyLimit: Number(b.monthly_limit) || 0,
      createdAt: b.created_at,
    }))

    const bills = (billsRes.data || []).map((bl: any) => ({
      id: bl.id,
      name: bl.name,
      amount: Number(bl.amount) || 0,
      category: bl.category,
      walletId: bl.wallet_id,
      dueDay: Number(bl.due_day) || 1,
      frequency: bl.frequency || 'monthly',
      dueDate: bl.due_date || undefined,
      active: bl.active !== false,
      notes: bl.notes || '',
      lastPaidAt: bl.last_paid_at || undefined,
      createdAt: bl.created_at,
    }))

    const challenges = (challengesRes.data || []).map((c: any) => ({
      id: c.id,
      kind: c.kind,
      title: c.title,
      targetAmount: Number(c.target_amount) || 0,
      startDate: c.start_date,
      active: c.active !== false,
      createdAt: c.created_at,
    }))

    const transfers = (transfersRes.data || []).map((tf: any) => ({
      id: tf.id,
      fromWalletId: tf.from_wallet_id,
      toWalletId: tf.to_wallet_id,
      amount: Number(tf.amount) || 0,
      date: tf.date,
      note: tf.note || '',
      createdAt: tf.created_at,
    }))

    const settingsData = settingsRes.data || {}
    const settings = {
      theme: settingsData.theme || 'light',
      hideAmounts: Boolean(settingsData.hide_amounts),
      profileName: settingsData.profile_name || 'Sahabat Tabungin',
      profileAvatar: settingsData.avatar_url || undefined,
    }

    return {
      version: 1,
      wallets,
      targets,
      deposits,
      transactions,
      budgets,
      bills,
      challenges,
      transfers,
      settings,
    }
  } catch (err) {
    console.warn('Terjadi kesalahan sinkronisasi Supabase:', err)
    return null
  }
}

/** Syncs local AppData up to Supabase tables */
export async function syncAppDataToSupabase(userId: string, data: AppData): Promise<boolean> {
  if (!supabase) return false

  try {
    // 1. User Settings & Profile
    await supabase.from('user_settings').upsert({
      user_id: userId,
      theme: data.settings.theme,
      hide_amounts: data.settings.hideAmounts,
      profile_name: data.settings.profileName,
      avatar_url: data.settings.profileAvatar || null,
      updated_at: new Date().toISOString(),
    })

    // 2. Wallets
    if (data.wallets.length > 0) {
      const records = data.wallets.map((w) => ({
        id: w.id,
        user_id: userId,
        name: w.name,
        kind: w.kind,
        initial_balance: w.initialBalance,
        color: w.color,
        created_at: w.createdAt,
      }))
      await supabase.from('wallets').upsert(records)
    }

    // 3. Targets
    if (data.targets.length > 0) {
      const records = data.targets.map((t) => ({
        id: t.id,
        user_id: userId,
        name: t.name,
        target_amount: t.targetAmount,
        deadline: t.deadline || null,
        description: t.description || '',
        icon: t.icon,
        priority: t.priority,
        is_emergency_fund: t.isEmergencyFund,
        created_at: t.createdAt,
        completed_at: t.completedAt || null,
      }))
      await supabase.from('targets').upsert(records)
    }

    // 4. Deposits
    if (data.deposits.length > 0) {
      const records = data.deposits.map((d) => ({
        id: d.id,
        user_id: userId,
        target_id: d.targetId || null,
        wallet_id: d.walletId,
        amount: d.amount,
        date: d.date,
        note: d.note || '',
        photo_url: d.photoId || null,
        photo_meta: d.photoMeta || null,
        created_at: d.createdAt,
      }))
      await supabase.from('deposits').upsert(records)
    }

    // 5. Transactions
    if (data.transactions.length > 0) {
      const records = data.transactions.map((tr) => ({
        id: tr.id,
        user_id: userId,
        type: tr.type,
        amount: tr.amount,
        category: tr.category,
        date: tr.date,
        note: tr.note || '',
        wallet_id: tr.walletId,
        bill_id: tr.billId || null,
        created_at: tr.createdAt,
      }))
      await supabase.from('transactions').upsert(records)
    }

    // 6. Budgets
    if (data.budgets.length > 0) {
      const records = data.budgets.map((b) => ({
        id: b.id,
        user_id: userId,
        category: b.category,
        monthly_limit: b.monthlyLimit,
        created_at: b.createdAt,
      }))
      await supabase.from('budgets').upsert(records)
    }

    // 7. Bills
    if (data.bills.length > 0) {
      const records = data.bills.map((bl) => ({
        id: bl.id,
        user_id: userId,
        name: bl.name,
        amount: bl.amount,
        category: bl.category,
        wallet_id: bl.walletId,
        due_day: bl.dueDay,
        frequency: bl.frequency,
        due_date: bl.dueDate || null,
        active: bl.active,
        notes: bl.notes || '',
        last_paid_at: bl.lastPaidAt || null,
        created_at: bl.createdAt,
      }))
      await supabase.from('bills').upsert(records)
    }

    return true
  } catch (err) {
    console.error('Gagal sinkronisasi ke Supabase:', err)
    return false
  }
}

/** Uploads photo proof to Supabase Storage Bucket */
export async function uploadReceiptToSupabaseStorage(
  userId: string,
  blob: Blob,
  fileName: string,
): Promise<string | null> {
  if (!supabase) return null
  try {
    const ext = blob.type === 'image/png' ? 'png' : 'jpg'
    const path = `${userId}/${Date.now()}_${fileName}.${ext}`
    const { data, error } = await supabase.storage.from('receipts').upload(path, blob, {
      contentType: blob.type,
      upsert: true,
    })
    if (error || !data) {
      console.warn('Gagal unggah foto bukti ke Supabase Storage:', error?.message)
      return null
    }
    const { data: pubData } = supabase.storage.from('receipts').getPublicUrl(data.path)
    return pubData.publicUrl
  } catch {
    return null
  }
}
