import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/transactions — fetch all transactions for current user
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const type = searchParams.get('type')
  const month = searchParams.get('month') // format: YYYY-MM

  let query = supabase
    .from('transactions')
    .select('*, savings_accounts(name)')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })
    .limit(limit)

  if (type && (type === 'deposit' || type === 'withdrawal')) {
    query = query.eq('type', type)
  }

  if (month) {
    const start = `${month}-01`
    const end = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
      .toISOString().split('T')[0]
    query = query.gte('transaction_date', start).lte('transaction_date', end)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST /api/transactions — create a new transaction
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { account_id, type, amount, description, transaction_date } = body

  // Validation
  if (!account_id || !type || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Data tidak lengkap atau tidak valid.' }, { status: 400 })
  }

  if (!['deposit', 'withdrawal'].includes(type)) {
    return NextResponse.json({ error: 'Tipe transaksi tidak valid.' }, { status: 400 })
  }

  // Verify account belongs to user
  const { data: account, error: accountError } = await supabase
    .from('savings_accounts')
    .select('id')
    .eq('id', account_id)
    .eq('user_id', user.id)
    .single()

  if (accountError || !account) {
    return NextResponse.json({ error: 'Akun tabungan tidak ditemukan.' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      account_id,
      user_id: user.id,
      type,
      amount: parseFloat(amount),
      description: description || null,
      transaction_date: transaction_date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

// DELETE /api/transactions?id=xxx — delete a transaction
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID transaksi diperlukan.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Transaksi berhasil dihapus.' })
}
