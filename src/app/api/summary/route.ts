import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/summary — returns total balance, deposit, withdrawal for current user
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('type, amount, transaction_date')
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const totalDeposit = transactions
    .filter((t) => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalWithdrawal = transactions
    .filter((t) => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalBalance = totalDeposit - totalWithdrawal

  // Monthly data for chart (last 6 months)
  const now = new Date()
  const monthlyData: { month: string; deposit: number; withdrawal: number; balance: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })

    const monthTransactions = transactions.filter((t) =>
      t.transaction_date.startsWith(monthKey)
    )

    const deposit = monthTransactions
      .filter((t) => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0)

    const withdrawal = monthTransactions
      .filter((t) => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0)

    monthlyData.push({ month: monthLabel, deposit, withdrawal, balance: deposit - withdrawal })
  }

  return NextResponse.json({
    data: {
      totalBalance,
      totalDeposit,
      totalWithdrawal,
      transactionCount: transactions.length,
      monthlyData,
    },
  })
}
