import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

  // Last 6 months range
  const sixMonthsAgo = format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd')

  const [{ data: transactions }, { data: recentTransactions }, { data: categories }, { data: recurring }] =
    await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', sixMonthsAgo)
        .lte('date', monthEnd)
        .order('date', { ascending: false }),
      supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10),
      supabase.from('categories').select('*').eq('user_id', user.id),
      supabase
        .from('recurring_transactions')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name'),
    ])

  return (
    <DashboardClient
      transactions={transactions ?? []}
      recentTransactions={recentTransactions ?? []}
      categories={categories ?? []}
      recurring={recurring ?? []}
      monthStart={monthStart}
      monthEnd={monthEnd}
      sixMonthsAgo={sixMonthsAgo}
      currentMonthLabel={format(now, 'MMMM yyyy')}
      userId={user.id}
    />
  )
}
