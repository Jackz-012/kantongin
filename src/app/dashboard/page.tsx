'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { TrendingUp, TrendingDown, Wallet, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency, formatDate, getGreeting } from '@/lib/utils'
import { Transaction } from '@/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface SummaryData {
  totalBalance: number
  totalDeposit: number
  totalWithdrawal: number
  transactionCount: number
  monthlyData: { month: string; deposit: number; withdrawal: number; balance: number }[]
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [recentTx, setRecentTx] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna')
      }

      const [summaryRes, txRes] = await Promise.all([
        fetch('/api/summary'),
        fetch('/api/transactions?limit=5'),
      ])

      const summaryJson = await summaryRes.json()
      const txJson = await txRes.json()

      if (summaryJson.data) setSummary(summaryJson.data)
      if (txJson.data) setRecentTx(txJson.data)
      setLoading(false)
    }

    fetchData()
  }, [])

  const chartData = {
    labels: summary?.monthlyData.map((d) => d.month) || [],
    datasets: [
      {
        label: 'Tabungan',
        data: summary?.monthlyData.map((d) => d.deposit) || [],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Penarikan',
        data: summary?.monthlyData.map((d) => d.withdrawal) || [],
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244,63,94,0.05)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#f43f5e',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 } },
      },
      tooltip: {
        backgroundColor: '#1a2236',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
            ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans' } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#64748b',
          font: { family: 'Plus Jakarta Sans' },
          callback: (value: number | string) => {
            const num = typeof value === 'number' ? value : parseFloat(value)
            return num >= 1_000_000
              ? `${(num / 1_000_000).toFixed(1)}Jt`
              : num >= 1_000
              ? `${(num / 1_000).toFixed(0)}Rb`
              : num.toString()
          },
        },
      },
    },
  }

  const statCards = [
    {
      label: 'Total Saldo',
      value: summary?.totalBalance ?? 0,
      icon: Wallet,
      color: 'indigo',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      iconColor: 'text-indigo-400',
      valueColor: 'text-indigo-300',
    },
    {
      label: 'Total Tabungan',
      value: summary?.totalDeposit ?? 0,
      icon: TrendingUp,
      color: 'emerald',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
      valueColor: 'text-emerald-300',
    },
    {
      label: 'Total Penarikan',
      value: summary?.totalWithdrawal ?? 0,
      icon: TrendingDown,
      color: 'rose',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      iconColor: 'text-rose-400',
      valueColor: 'text-rose-300',
    },
    {
      label: 'Total Transaksi',
      value: summary?.transactionCount ?? 0,
      icon: Activity,
      color: 'amber',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      iconColor: 'text-amber-400',
      valueColor: 'text-amber-300',
      isCurrency: false,
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 shimmer rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 shimmer rounded-2xl" />
          ))}
        </div>
        <div className="h-72 shimmer rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div>
        <p className="text-slate-400 text-sm">{getGreeting()},</p>
        <h1 className="text-2xl font-bold text-white">{userName} 👋</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`stat-card border ${card.border}`}
            >
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <p className="text-xs text-slate-400 font-medium">{card.label}</p>
              <p className={`text-lg font-bold ${card.valueColor} leading-tight`}>
                {card.isCurrency === false
                  ? `${card.value} kali`
                  : formatCurrency(card.value as number)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Tren 6 Bulan Terakhir</h2>
        </div>
        <div className="h-64">
          <Line data={chartData} options={chartOptions as Parameters<typeof Line>[0]['options']} />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Transaksi Terbaru</h2>
          <a href="/riwayat" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Lihat semua →
          </a>
        </div>

        {recentTx.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada transaksi. Mulai menabung sekarang!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  tx.type === 'deposit' ? 'bg-emerald-500/15' : 'bg-rose-500/15'
                }`}>
                  {tx.type === 'deposit'
                    ? <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    : <ArrowDownRight className="w-4 h-4 text-rose-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {tx.description || (tx.type === 'deposit' ? 'Tabungan' : 'Penarikan')}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(tx.transaction_date)}</p>
                </div>
                <p className={`text-sm font-semibold flex-shrink-0 ${
                  tx.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
