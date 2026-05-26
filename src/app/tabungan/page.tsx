'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { SavingsAccount, Transaction } from '@/types'
import {
  PiggyBank, Plus, ArrowUpRight, ArrowDownRight,
  Wallet, Target, TrendingUp, Trash2, X
} from 'lucide-react'

export default function TabunganPage() {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    type: 'deposit' as 'deposit' | 'withdrawal',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  })
  const [amountDisplay, setAmountDisplay] = useState('')

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Hapus semua karakter selain angka
    const raw = e.target.value.replace(/\D/g, '')
    // Format dengan pemisah ribuan
    const formatted = raw ? Number(raw).toLocaleString('id-ID') : ''
    setAmountDisplay(formatted)
    setForm(f => ({ ...f, amount: raw }))
  }

  const fetchAccounts = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    let { data } = await supabase
      .from('savings_accounts')
      .select('*')
      .order('created_at', { ascending: true })

    // Auto-buat akun tabungan default jika belum ada
    if (!data || data.length === 0) {
      const { data: newAccount } = await supabase
        .from('savings_accounts')
        .insert({ user_id: user.id, name: 'Tabungan Utama', target_amount: 0 })
        .select()
        .single()
      if (newAccount) data = [newAccount]
    }

    if (data) {
      setAccounts(data)
      if (data.length > 0 && !selectedAccount) setSelectedAccount(data[0])
    }
    setLoading(false)
  }, [selectedAccount])

  const fetchTransactions = useCallback(async () => {
    if (!selectedAccount) return
    const res = await fetch(`/api/transactions?limit=20`)
    const json = await res.json()
    if (json.data) {
      setTransactions(json.data.filter((t: Transaction) => t.account_id === selectedAccount.id))
    }
  }, [selectedAccount])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])
  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const totalDeposit = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0)
  const totalWithdrawal = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0)
  const balance = totalDeposit - totalWithdrawal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount) return
    const numericAmount = parseInt(form.amount, 10)
    if (!form.amount || isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Masukkan jumlah yang valid.')
      return
    }

    setSubmitting(true)
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_id: selectedAccount.id,
        type: form.type,
        amount: numericAmount,
        description: form.description,
        transaction_date: form.transaction_date,
      }),
    })
    const json = await res.json()

    if (res.ok) {
      toast.success(form.type === 'deposit' ? 'Tabungan berhasil ditambahkan! 💰' : 'Penarikan berhasil dicatat.')
      setForm({ type: 'deposit', amount: '', description: '', transaction_date: new Date().toISOString().split('T')[0] })
      setAmountDisplay('')
      setShowForm(false)
      fetchTransactions()
    } else {
      toast.error(json.error || 'Gagal menyimpan transaksi.')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus transaksi ini?')) return
    const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Transaksi dihapus.')
      setTransactions(prev => prev.filter(t => t.id !== id))
    } else {
      toast.error('Gagal menghapus.')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 shimmer rounded-xl" />
        <div className="h-48 shimmer rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tabungan</h1>
          <p className="text-slate-400 text-sm mt-0.5">Kelola setoran dan penarikan Anda</p>
        </div>
        <button
          id="add-transaction-btn"
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah Transaksi</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {/* Account Selector */}
      {accounts.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => setSelectedAccount(acc)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedAccount?.id === acc.id
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {acc.name}
            </button>
          ))}
        </div>
      )}

      {/* Balance Card */}
      {selectedAccount && (
        <div className="glass-card p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border-indigo-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">{selectedAccount.name}</p>
              <p className="text-4xl font-bold text-white">{formatCurrency(balance)}</p>
              <p className="text-slate-400 text-xs mt-1">Saldo tersedia</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/10">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Total Masuk</p>
              <p className="text-sm font-semibold text-emerald-400">{formatCurrency(totalDeposit)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Total Keluar</p>
              <p className="text-sm font-semibold text-rose-400">{formatCurrency(totalWithdrawal)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Target</p>
              <p className="text-sm font-semibold text-amber-400">
                {formatCurrency(selectedAccount.target_amount || 0)}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          {selectedAccount.target_amount > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Progress Target</span>
                <span>{Math.min(100, Math.round((balance / selectedAccount.target_amount) * 100))}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (balance / selectedAccount.target_amount) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction List */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          Riwayat Transaksi
        </h2>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400 text-sm">Belum ada transaksi di akun ini.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-sm">
              Tambah Transaksi Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/5 transition-colors group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  tx.type === 'deposit' ? 'bg-emerald-500/15' : 'bg-rose-500/15'
                }`}>
                  {tx.type === 'deposit'
                    ? <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    : <ArrowDownRight className="w-4 h-4 text-rose-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {tx.description || (tx.type === 'deposit' ? 'Setoran' : 'Penarikan')}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(tx.transaction_date)}</p>
                </div>
                <p className={`text-sm font-bold flex-shrink-0 ${
                  tx.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="glass-card p-6 w-full max-w-md relative z-10 slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Tambah Transaksi</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Toggle */}
              <div>
                <label className="label">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: 'deposit' }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      form.type === 'deposit'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Tabung
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: 'withdrawal' }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      form.type === 'withdrawal'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" /> Tarik
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="tx-amount" className="label">Jumlah (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rp</span>
                  <input
                    id="tx-amount"
                    type="text"
                    inputMode="numeric"
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    placeholder="0"
                    required
                    className="input-field pl-9"
                  />
                </div>
                {amountDisplay && (
                  <p className="text-xs text-slate-500 mt-1 pl-1">
                    {Number(form.amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="tx-desc" className="label">Keterangan <span className="text-slate-600">(opsional)</span></label>
                <input
                  id="tx-desc"
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="mis. Gaji bulan ini"
                  className="input-field"
                />
              </div>

              {/* Date */}
              <div>
                <label htmlFor="tx-date" className="label">Tanggal</label>
                <input
                  id="tx-date"
                  type="date"
                  value={form.transaction_date}
                  onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))}
                  required
                  className="input-field"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  Batal
                </button>
                <button
                  id="submit-transaction"
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
