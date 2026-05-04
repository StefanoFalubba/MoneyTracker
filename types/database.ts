export type TransactionType = 'income' | 'expense' | 'investment'

export interface Category {
  id: string
  user_id: string
  name: string
  type: TransactionType
  color: string | null
  icon: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  type: TransactionType
  description: string | null
  date: string
  created_at: string
  category?: Category | null
}

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>>
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at' | 'category'>
        Update: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'category'>>
      }
    }
  }
}
