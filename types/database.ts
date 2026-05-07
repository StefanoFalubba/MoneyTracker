export type TransactionType = 'income' | 'expense' | 'investment'
export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'

export interface Category {
  id: string
  user_id: string
  name: string
  type: TransactionType
  color: string | null
  icon: string | null
  created_at: string
}

export interface Subcategory {
  id: string
  user_id: string
  category_id: string
  name: string
  icon: string | null
  color: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  subcategory_id: string | null
  amount: number
  type: TransactionType
  description: string | null
  date: string
  is_business?: boolean
  created_at: string
  category?: Category | null
  subcategory?: Subcategory | null
}

export interface RecurringTransaction {
  id: string
  user_id: string
  category_id: string
  subcategory_id: string | null
  name: string
  amount: number
  type: TransactionType
  frequency: RecurringFrequency
  start_date: string
  end_date: string | null
  last_executed_date: string | null
  is_business: boolean
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  category?: Category | null
  subcategory?: Subcategory | null
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
      subcategories: {
        Row: Subcategory
        Insert: {
          id?: string
          user_id: string
          category_id: string
          name: string
          icon?: string | null
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          name?: string
          icon?: string | null
          color?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: Omit<Transaction, 'category' | 'subcategory'>
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          subcategory_id?: string | null
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
          subcategory_id?: string | null
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
