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

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: Category
        Insert: {
          id?: string
          user_id: string
          name: string
          type: TransactionType
          color?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: TransactionType
          color?: string | null
          icon?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: Omit<Transaction, 'category'>
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          amount: number
          type: TransactionType
          description?: string | null
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          amount?: number
          type?: TransactionType
          description?: string | null
          date?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
