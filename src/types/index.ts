export interface Transaction {
  id: string
  account_id: string
  user_id: string
  type: 'deposit' | 'withdrawal'
  amount: number
  description: string | null
  transaction_date: string
  created_at: string
}

export interface SavingsAccount {
  id: string
  user_id: string
  name: string
  target_amount: number
  created_at: string
}

export interface SummaryData {
  totalBalance: number
  totalDeposit: number
  totalWithdrawal: number
  transactionCount: number
}

export interface TransactionFormData {
  type: 'deposit' | 'withdrawal'
  amount: number
  description: string
  transaction_date: string
  account_id: string
}
