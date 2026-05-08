import { createClient } from '@/lib/supabase/server'
import { AnalyticsClient } from '@/components/analytics/analytics-client'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: transactions }, { data: categories }, { data: subcategories }] =
    await Promise.all([
      supabase
        .from('transactions')
        .select('*, category:categories(*), subcategory:subcategories(*)')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
      supabase.from('categories').select('*').eq('user_id', user.id),
      supabase.from('subcategories').select('*').eq('user_id', user.id),
    ])

  return (
    <AnalyticsClient
      transactions={transactions ?? []}
      categories={categories ?? []}
      subcategories={subcategories ?? []}
    />
  )
}
