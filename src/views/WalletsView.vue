<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  ChevronRight,
  Landmark,
  LoaderCircle,
  Pencil,
  PiggyBank,
  Plus,
  Smartphone,
  Trash2,
  Wallet,
} from '@lucide/vue'
import type { Component } from 'vue'
import type { Transfer, WalletKind } from '@/types'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { WALLET_KIND_LABEL } from '@/lib/categories'
import { formatCurrency } from '@/lib/format'
import { formatDateLong, todayKey } from '@/lib/date'
import PageHeader from '@/components/ui/PageHeader.vue'
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'

const appStore = useAppStore()
const ui = useUiStore()

const hideAmounts = computed(() => appStore.data.settings.hideAmounts)
const recentTransfers = computed(() =>
  [...appStore.data.transfers]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6),
)

const kindIcons: Record<WalletKind, Component> = {
  cash: Banknote,
  bank: Landmark,
  ewallet: Smartphone,
}
const kindOptions: Array<{ value: WalletKind; label: string }> = [
  { value: 'cash', label: 'Tunai' },
  { value: 'bank', label: 'Rekening bank' },
  { value: 'ewallet', label: 'Dompet digital' },
]
const colorOptions = ['#5278F6', '#7C6CF0', '#24AD7A', '#F59E0B', '#EF6B7A', '#0EA5A5']

function money(value: number): string {
  return hideAmounts.value ? 'Rp••••••' : formatCurrency(value)
}

const walletFormOpen = ref(false)
const editingWalletId = ref<string | null>(null)
const walletSaving = ref(false)
const walletError = ref('')
const walletForm = reactive({
  name: '',
  kind: 'cash' as WalletKind,
  initialBalance: 0,
  color: '#5278F6',
})
const walletErrors = reactive({ name: '', initialBalance: '' })

function openAddWallet(): void {
  editingWalletId.value = null
  walletForm.name = ''
  walletForm.kind = 'cash'
  walletForm.initialBalance = 0
  walletForm.color = '#5278F6'
  walletErrors.name = ''
  walletErrors.initialBalance = ''
  walletError.value = ''
  walletFormOpen.value = true
}

function openEditWallet(id: string): void {
  const wallet = appStore.data.wallets.find((item) => item.id === id)
  if (!wallet) return
  editingWalletId.value = id
  walletForm.name = wallet.name
  walletForm.kind = wallet.kind
  walletForm.initialBalance = wallet.initialBalance
  walletForm.color = wallet.color
  walletErrors.name = ''
  walletErrors.initialBalance = ''
  walletError.value = ''
  walletFormOpen.value = true
}

function saveWallet(): void {
  if (walletSaving.value) return
  walletErrors.name = walletForm.name.trim() ? '' : 'Nama dompet wajib diisi.'
  walletErrors.initialBalance =
    walletForm.initialBalance >= 0 ? '' : 'Saldo awal tidak boleh negatif.'
  if (walletErrors.name || walletErrors.initialBalance) return
  walletSaving.value = true
  try {
    if (editingWalletId.value) {
      appStore.updateWallet(editingWalletId.value, {
        name: walletForm.name.trim(),
        kind: walletForm.kind,
        initialBalance: walletForm.initialBalance,
        color: walletForm.color,
      })
      ui.notify('Informasi dompet berhasil diperbarui.', { title: 'Dompet diperbarui' })
    } else {
      appStore.addWallet({
        name: walletForm.name.trim(),
        kind: walletForm.kind,
        initialBalance: walletForm.initialBalance,
        color: walletForm.color,
      })
      ui.notify('Dompet baru berhasil ditambahkan.', { title: 'Dompet dibuat' })
    }
    walletFormOpen.value = false
  } catch (error) {
    walletError.value = error instanceof Error ? error.message : 'Dompet gagal disimpan.'
  } finally {
    walletSaving.value = false
  }
}

async function deleteWallet(id: string): Promise<void> {
  const wallet = appStore.data.wallets.find((item) => item.id === id)
  if (!wallet) return
  const confirmed = await ui.askConfirm({
    title: `Hapus dompet “${wallet.name}”?`,
    message:
      'Dompet hanya bisa dihapus jika tidak dipakai transaksi, setoran, transfer, atau tagihan. Saldo dompet tidak akan dipindahkan otomatis.',
    confirmLabel: 'Hapus dompet',
  })
  if (!confirmed) return
  const result = appStore.deleteWallet(id)
  if (result.ok) ui.notify('Dompet berhasil dihapus.', { title: 'Dompet dihapus' })
  else ui.notify(result.message ?? 'Dompet gagal dihapus.', { variant: 'error', title: 'Tidak bisa menghapus' })
}

const transferOpen = ref(false)
const transferSaving = ref(false)
const transferError = ref('')
const transferErrors = reactive({ amount: '', from: '', to: '', date: '' })
const transferForm = reactive({
  fromWalletId: '',
  toWalletId: '',
  amount: 0,
  date: todayKey(),
  note: '',
})

const fromBalance = computed(
  () =>
    appStore.walletsWithBalance.find((entry) => entry.wallet.id === transferForm.fromWalletId)
      ?.balance ?? 0,
)
const toWallets = computed(() =>
  appStore.walletsWithBalance.filter((entry) => entry.wallet.id !== transferForm.fromWalletId),
)

function openTransfer(fromWalletId?: string): void {
  transferForm.fromWalletId = fromWalletId ?? appStore.data.wallets[0]?.id ?? ''
  transferForm.toWalletId =
    appStore.data.wallets.find((wallet) => wallet.id !== transferForm.fromWalletId)?.id ?? ''
  transferForm.amount = 0
  transferForm.date = todayKey()
  transferForm.note = ''
  Object.assign(transferErrors, { amount: '', from: '', to: '', date: '' })
  transferError.value = ''
  transferOpen.value = true
}

function onTransferFromChange(): void {
  if (transferForm.toWalletId === transferForm.fromWalletId) {
    transferForm.toWalletId = toWallets.value[0]?.wallet.id ?? ''
  }
  transferErrors.from = ''
}

function saveTransfer(): void {
  if (transferSaving.value) return
  transferErrors.amount =
    transferForm.amount > 0 ? '' : 'Nominal transfer harus lebih dari 0.'
  transferErrors.from = transferForm.fromWalletId ? '' : 'Pilih dompet asal.'
  transferErrors.to =
    transferForm.toWalletId && transferForm.toWalletId !== transferForm.fromWalletId
      ? ''
      : 'Pilih dompet tujuan yang berbeda.'
  transferErrors.date = transferForm.date
    ? transferForm.date > todayKey()
      ? 'Tanggal tidak boleh di masa depan.'
      : ''
    : 'Tanggal wajib diisi.'
  if (transferForm.amount > fromBalance.value) {
    transferErrors.amount = 'Saldo dompet asal tidak mencukupi.'
  }
  if (Object.values(transferErrors).some(Boolean)) return
  transferSaving.value = true
  const result = appStore.addTransfer({
    fromWalletId: transferForm.fromWalletId,
    toWalletId: transferForm.toWalletId,
    amount: transferForm.amount,
    date: transferForm.date,
    note: transferForm.note.trim(),
  })
  transferSaving.value = false
  if (!result.ok) {
    transferError.value = result.message ?? 'Transfer gagal diproses.'
    return
  }
  ui.notify('Transfer antardompet berhasil dicatat tanpa mengubah total kekayaan.', {
    title: 'Transfer berhasil',
  })
  transferOpen.value = false
}

async function deleteTransfer(transfer: Transfer): Promise<void> {
  const confirmed = await ui.askConfirm({
    title: 'Hapus catatan transfer?',
    message: `Transfer ${money(transfer.amount)} dari ${appStore.walletName(transfer.fromWalletId)} ke ${appStore.walletName(transfer.toWalletId)} akan dibatalkan dan saldo kedua dompet disesuaikan.`,
    confirmLabel: 'Hapus transfer',
  })
  if (!confirmed) return
  if (appStore.deleteTransfer(transfer.id)) {
    ui.notify('Catatan transfer berhasil dihapus dan saldo diperbarui.', { title: 'Transfer dihapus' })
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Dompet & Rekening"
      subtitle="Pantau saldo di setiap dompet. Transfer antardompet hanya memindahkan uang, bukan menambah pemasukan."
      eyebrow="Sumber dana"
    >
      <template #actions>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="appStore.data.wallets.length < 2"
          @click="openTransfer()"
        >
          <ArrowLeftRight :size="16" />
          Transfer
        </button>
        <button type="button" class="btn btn-primary" @click="openAddWallet">
          <Plus :size="17" :stroke-width="2.5" />
          Tambah Dompet
        </button>
      </template>
    </PageHeader>

    <div class="mt-6 grid gap-4 sm:grid-cols-3">
      <section class="card animate-rise p-5" style="--delay: 50ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Total kekayaan</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Wallet :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="appStore.netWorthTotal" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">Saldo dompet + total tabungan</p>
      </section>
      <section class="card animate-rise p-5" style="--delay: 90ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Saldo di dompet</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-success-soft text-success">
            <Banknote :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="appStore.totalWallet" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">{{ appStore.data.wallets.length }} dompet aktif</p>
      </section>
      <section class="card animate-rise p-5" style="--delay: 130ms">
        <div class="flex items-center justify-between">
          <span class="eyebrow">Dialokasikan ke tabungan</span>
          <span class="flex size-8 items-center justify-center rounded-lg bg-lavender-soft text-lavender">
            <PiggyBank :size="15" />
          </span>
        </div>
        <p class="mt-3 text-[24px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="appStore.totalSaved" :hide="hideAmounts" />
        </p>
        <p class="mt-1 text-[11px] font-semibold text-muted">Nilai setoran dari dompet</p>
      </section>
    </div>

    <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="(entry, index) in appStore.walletsWithBalance"
        :key="entry.wallet.id"
        class="card animate-rise group relative overflow-hidden p-5"
        :style="{ '--delay': `${170 + index * 40}ms` }"
      >
        <div
          class="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full opacity-[0.08]"
          :style="{ backgroundColor: entry.wallet.color }"
        />
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <span
              class="flex size-11 items-center justify-center rounded-2xl"
              :style="{ backgroundColor: `${entry.wallet.color}18`, color: entry.wallet.color }"
            >
              <component :is="kindIcons[entry.wallet.kind]" :size="20" />
            </span>
            <div>
              <h2 class="text-sm font-extrabold text-ink">{{ entry.wallet.name }}</h2>
              <p class="mt-0.5 text-[10px] font-semibold text-muted">
                {{ WALLET_KIND_LABEL[entry.wallet.kind] }}
              </p>
            </div>
          </div>
          <div class="flex gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <button
              type="button"
              class="icon-btn icon-btn-sm border-transparent bg-transparent"
              aria-label="Edit dompet"
              @click="openEditWallet(entry.wallet.id)"
            >
              <Pencil :size="13" />
            </button>
            <button
              type="button"
              class="icon-btn icon-btn-sm border-transparent bg-transparent hover:text-danger"
              aria-label="Hapus dompet"
              @click="deleteWallet(entry.wallet.id)"
            >
              <Trash2 :size="13" />
            </button>
          </div>
        </div>

        <p class="mt-5 text-[26px] font-extrabold tracking-tight text-ink">
          <AnimatedNumber :value="entry.balance" :hide="hideAmounts" />
        </p>
        <div class="mt-2 flex items-center justify-between">
          <p class="text-[10px] font-semibold text-muted">
            Saldo awal {{ money(entry.wallet.initialBalance) }}
          </p>
          <button
            type="button"
            class="flex items-center gap-1 text-[10px] font-extrabold text-primary"
            @click="openTransfer(entry.wallet.id)"
          >
            Transfer
            <ArrowRight :size="11" />
          </button>
        </div>
        <div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-3">
          <div
            class="h-full rounded-full"
            :style="{
              backgroundColor: entry.wallet.color,
              width: `${Math.min(Math.max((entry.balance / Math.max(appStore.totalWallet, 1)) * 100, 4), 100)}%`,
            }"
          />
        </div>
      </article>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <section class="card animate-rise overflow-hidden" style="--delay: 310ms">
        <div class="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 class="text-base font-extrabold text-ink">Transfer terbaru</h2>
            <p class="mt-0.5 text-xs text-muted">Perpindahan dana internal antar dompet.</p>
          </div>
          <span class="chip">{{ appStore.data.transfers.length }}</span>
        </div>
        <div v-if="recentTransfers.length" class="divide-y divide-line">
          <div
            v-for="transfer in recentTransfers"
            :key="transfer.id"
            class="group flex items-center gap-3 px-5 py-3.5 sm:px-6"
          >
            <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <ArrowLeftRight :size="15" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="flex flex-wrap items-center gap-1.5 text-[11px] font-extrabold text-ink">
                {{ appStore.walletName(transfer.fromWalletId) }}
                <ChevronRight :size="12" class="text-muted" />
                {{ appStore.walletName(transfer.toWalletId) }}
              </p>
              <p class="mt-0.5 truncate text-[10px] text-muted">
                {{ formatDateLong(transfer.date) }}{{ transfer.note ? ` · ${transfer.note}` : '' }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-xs font-extrabold text-ink">{{ money(transfer.amount) }}</p>
              <button
                type="button"
                class="mt-1 text-[9px] font-bold text-muted transition-colors hover:text-danger"
                @click="deleteTransfer(transfer)"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          compact
          :icon="ArrowLeftRight"
          title="Belum ada transfer"
          description="Pindahkan saldo antar dompet tanpa mengubah total pemasukan atau pengeluaran."
        >
          <button
            type="button"
            class="btn btn-soft btn-sm"
            :disabled="appStore.data.wallets.length < 2"
            @click="openTransfer()"
          >
            <ArrowLeftRight :size="14" />
            Transfer dana
          </button>
        </EmptyState>
      </section>

      <section class="card animate-rise p-5 sm:p-6" style="--delay: 350ms">
        <div class="flex items-center gap-2">
          <span class="flex size-8 items-center justify-center rounded-lg bg-success-soft text-success">
            <ArrowLeftRight :size="15" />
          </span>
          <h2 class="text-sm font-extrabold text-ink">Cara Savezy menghitung</h2>
        </div>
        <div class="mt-4 space-y-3 text-[11px] leading-relaxed text-muted">
          <p><strong class="text-ink">Saldo dompet</strong> = saldo awal + pemasukan − pengeluaran − setoran tabungan ± transfer.</p>
          <p><strong class="text-ink">Setoran tabungan</strong> mengurangi saldo dompet sumber dan menambah total tabungan. Ini alokasi internal, bukan pengeluaran baru.</p>
          <p><strong class="text-ink">Transfer antardompet</strong> tidak masuk laporan pemasukan atau pengeluaran agar tidak terhitung ganda.</p>
        </div>
      </section>
    </div>

    <BaseModal
      :open="walletFormOpen"
      :title="editingWalletId ? 'Edit dompet' : 'Tambah dompet'"
      subtitle="Beri nama yang mudah dikenali dan saldo awal sesuai kondisi saat ini."
      size="sm"
      :persistent="walletSaving"
      @close="walletFormOpen = false"
    >
      <div class="space-y-4 pt-1">
        <div>
          <label for="wallet-name" class="label">Nama dompet</label>
          <input
            id="wallet-name"
            v-model="walletForm.name"
            type="text"
            class="input"
            maxlength="60"
            placeholder="Misalnya: BCA, GoPay, Dompet Tunai"
            :class="walletErrors.name ? 'border-danger' : ''"
          />
          <p v-if="walletErrors.name" class="field-error">{{ walletErrors.name }}</p>
        </div>
        <div>
          <span class="label">Jenis</span>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="option in kindOptions"
              :key="option.value"
              type="button"
              class="flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[10px] font-bold transition-colors"
              :class="
                walletForm.kind === option.value
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-line bg-surface-2 text-muted hover:text-ink'
              "
              @click="walletForm.kind = option.value"
            >
              <component :is="kindIcons[option.value]" :size="18" />
              {{ option.label }}
            </button>
          </div>
        </div>
        <div>
          <label for="wallet-balance" class="label">Saldo awal</label>
          <CurrencyInput id="wallet-balance" v-model="walletForm.initialBalance" />
          <p class="field-hint">Saldo saat dompet mulai dicatat, bukan saldo saat ini.</p>
        </div>
        <div>
          <span class="label">Warna dompet</span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="color in colorOptions"
              :key="color"
              type="button"
              class="size-8 rounded-full ring-offset-2 ring-offset-surface transition-all"
              :class="walletForm.color === color ? 'ring-2 ring-ink' : ''"
              :style="{ backgroundColor: color }"
              :aria-label="`Pilih warna ${color}`"
              :aria-pressed="walletForm.color === color"
              @click="walletForm.color = color"
            />
          </div>
        </div>
        <div v-if="walletError" class="rounded-xl bg-danger-soft p-3 text-xs font-semibold text-danger">{{ walletError }}</div>
      </div>
      <template #footer>
        <button type="button" class="btn btn-secondary" :disabled="walletSaving" @click="walletFormOpen = false">Batal</button>
        <button type="button" class="btn btn-primary" :disabled="walletSaving" @click="saveWallet">
          <LoaderCircle v-if="walletSaving" :size="16" class="animate-spin" />
          <Plus v-else :size="16" />
          {{ editingWalletId ? 'Simpan Perubahan' : 'Tambah Dompet' }}
        </button>
      </template>
    </BaseModal>

    <BaseModal
      :open="transferOpen"
      title="Transfer antardompet"
      subtitle="Pindahkan saldo tanpa mengubah laporan pemasukan atau pengeluaran."
      size="md"
      :persistent="transferSaving"
      @close="transferOpen = false"
    >
      <div class="space-y-4 pt-1">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="transfer-from" class="label">Dari dompet</label>
            <select
              id="transfer-from"
              v-model="transferForm.fromWalletId"
              class="select"
              :class="transferErrors.from ? 'border-danger' : ''"
              @change="onTransferFromChange"
            >
              <option disabled value="">Pilih dompet</option>
              <option v-for="entry in appStore.walletsWithBalance" :key="entry.wallet.id" :value="entry.wallet.id">
                {{ entry.wallet.name }} · {{ money(entry.balance) }}
              </option>
            </select>
            <p v-if="transferErrors.from" class="field-error">{{ transferErrors.from }}</p>
          </div>
          <div>
            <label for="transfer-to" class="label">Ke dompet</label>
            <select
              id="transfer-to"
              v-model="transferForm.toWalletId"
              class="select"
              :class="transferErrors.to ? 'border-danger' : ''"
              @change="transferErrors.to = ''"
            >
              <option disabled value="">Pilih dompet tujuan</option>
              <option v-for="entry in toWallets" :key="entry.wallet.id" :value="entry.wallet.id">
                {{ entry.wallet.name }}
              </option>
            </select>
            <p v-if="transferErrors.to" class="field-error">{{ transferErrors.to }}</p>
          </div>
        </div>

        <div>
          <label for="transfer-amount" class="label">Nominal transfer</label>
          <CurrencyInput id="transfer-amount" v-model="transferForm.amount" large :invalid="!!transferErrors.amount" />
          <p class="field-hint">Saldo tersedia di dompet asal: {{ money(fromBalance) }}</p>
          <p v-if="transferErrors.amount" class="field-error">{{ transferErrors.amount }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="transfer-date" class="label">Tanggal</label>
            <input
              id="transfer-date"
              v-model="transferForm.date"
              type="date"
              class="input"
              :max="todayKey()"
              :class="transferErrors.date ? 'border-danger' : ''"
            />
            <p v-if="transferErrors.date" class="field-error">{{ transferErrors.date }}</p>
          </div>
          <div>
            <label for="transfer-note" class="label">Catatan <span class="font-medium text-muted">(opsional)</span></label>
            <input id="transfer-note" v-model="transferForm.note" type="text" class="input" maxlength="300" placeholder="Misalnya: isi saldo e-wallet" />
          </div>
        </div>

        <div v-if="transferError" class="rounded-xl bg-danger-soft p-3 text-xs font-semibold text-danger">{{ transferError }}</div>
        <div class="flex items-start gap-2 rounded-xl bg-primary-soft/60 p-3 text-[11px] leading-relaxed">
          <span class="mt-0.5 text-primary"><ArrowLeftRight :size="14" /></span>
          <p class="text-ink-soft">
            Transfer hanya memindahkan dana. Total kekayaan tetap sama dan tidak dihitung sebagai pemasukan atau pengeluaran.
          </p>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn-secondary" :disabled="transferSaving" @click="transferOpen = false">Batal</button>
        <button type="button" class="btn btn-primary" :disabled="transferSaving" @click="saveTransfer">
          <LoaderCircle v-if="transferSaving" :size="16" class="animate-spin" />
          <ArrowLeftRight v-else :size="16" />
          Transfer Sekarang
        </button>
      </template>
    </BaseModal>
  </div>
</template>
