-- ============================================================
-- KANTONGIN — Supabase Database Schema
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tabel savings_accounts (akun/dompet tabungan per user)
CREATE TABLE savings_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Tabungan Utama',
  target_amount NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel transactions (setiap transaksi setoran/penarikan)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES savings_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('deposit', 'withdrawal')) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Index untuk performa query
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — user hanya bisa akses data miliknya sendiri
CREATE POLICY "user_own_accounts" ON savings_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_own_transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);
