import { createClient } from '@/lib/supabase/server'
import { InvestmentsClient } from '@/components/investments/investments-client'

export default async function InvestmentsPage() {
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
      .eq('type', 'investment')
      .order('date', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'investment'),
  ])

  return (
    <InvestmentsClient
      transactions={transactions ?? []}
      categories={categories ?? []}
      userId={user.id}
    />
  )
}
