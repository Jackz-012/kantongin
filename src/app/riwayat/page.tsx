'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Transaction } from '@/types'
import { History, ArrowUpRight, ArrowDownRight, Search, Filter, Trash2, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const MONTHS = [
  'Semua', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filtered, setFiltered] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all')
  const [monthFilter, setMonthFilter] = useState(0) // 0 = all

  const fetchAll = useCallback(async () => {
    const res = await fetch('/api/transactions?limit=200')
    const json = await res.json()
    if (json.data) {
      setTransactions(json.data)
      setFiltered(json.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    let result = [...transactions]

    if (typeFilter !== 'all') result = result.filter(t => t.type === typeFilter)

    if (monthFilter > 0) {
      result = result.filter(t => {
        const m = new Date(t.transaction_date).getMonth() + 1
        return m === monthFilter
      })
    }

    if (search.trim()) {
      result = result.filter(t =>
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.amount.toString().includes(search)
      )
    }

    setFiltered(result)
  }, [transactions, typeFilter, monthFilter, search])

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

  const totalDeposit = filtered.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0)
  const totalWithdrawal = filtered.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 shimmer rounded-xl" />
        <div className="h-16 shimmer rounded-2xl" />
        <div className="h-96 shimmer rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <History className="w-6 h-6 text-indigo-400" />
          Riwayat Transaksi
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Semua catatan pemasukan dan pengeluaran Anda</p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Tampil</p>
          <p className="text-lg font-bold text-white">{filtered.length}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Masuk</p>
          <p className="text-base font-bold text-emerald-400">{formatCurrency(totalDeposit)}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Keluar</p>
          <p className="text-base font-bold text-rose-400">{formatCurrency(totalWithdrawal)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari keterangan atau jumlah..."
            className="input-field pl-10 text-sm"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
          {(['all', 'deposit', 'withdrawal'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === t
                  ? t === 'deposit' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : t === 'withdrawal' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {t === 'all' ? 'Semua' : t === 'deposit' ? '↑ Masuk' : '↓ Keluar'}
            </button>
          ))}
        </div>

        {/* Month Filter */}
        <div className="flex gap-1.5 flex-wrap">
          {MONTHS.map((m, i) => (
            <button
              key={i}
              onClick={() => setMonthFilter(i)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                monthFilter === i
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10 hover:text-slate-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Tidak ada transaksi yang sesuai filter.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="text-left px-6 py-4 font-medium">Jenis</th>
                    <th className="text-left px-6 py-4 font-medium">Keterangan</th>
                    <th className="text-left px-6 py-4 font-medium">Tanggal</th>
                    <th className="text-right px-6 py-4 font-medium">Jumlah</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(tx => (
                    <tr key={tx.id} className="hover:bg-white/3 transition-colors group">
                      <td className="px-6 py-3.5">
                        <span className={tx.type === 'deposit' ? 'badge-deposit' : 'badge-withdrawal'}>
                          {tx.type === 'deposit'
                            ? <><ArrowUpRight className="w-3 h-3" /> Masuk</>
                            : <><ArrowDownRight className="w-3 h-3" /> Keluar</>}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-300 max-w-xs truncate">
                        {tx.description || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400">
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td className={`px-6 py-3.5 text-right font-semibold ${
                        tx.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden divide-y divide-white/5">
              {filtered.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 p-4 hover:bg-white/3 transition-colors group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'deposit' ? 'bg-emerald-500/15' : 'bg-rose-500/15'
                  }`}>
                    {tx.type === 'deposit'
                      ? <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      : <ArrowDownRight className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.description || '—'}</p>
                    <p className="text-xs text-slate-500">{formatDate(tx.transaction_date)}</p>
                  </div>
                  <p className={`text-sm font-bold flex-shrink-0 ${
                    tx.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
