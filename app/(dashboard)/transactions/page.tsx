import { createClient } from '@/lib/supabase/server'
import { TransactionsClient } from '@/components/transactions/transactions-client'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: transactions }, { data: categories }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    supabase.from('categories').select('*').eq('user_id', user.id),
  ])

  return (
    <TransactionsClient
      initialTransactions={transactions ?? []}
      categories={categories ?? []}
      userId={user.id}
    />
  )
}
