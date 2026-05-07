import { createClient } from '@/lib/supabase/server'
import { RecurringClient } from '@/components/recurring/recurring-client'

export default async function RecurringPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: recurring }, { data: categories }, { data: subcategories }] =
    await Promise.all([
      supabase
        .from('recurring_transactions')
        .select('*, category:categories(*), subcategory:subcategories(*)')
        .eq('user_id', user.id)
        .order('name'),
      supabase.from('categories').select('*').eq('user_id', user.id),
      supabase.from('subcategories').select('*').eq('user_id', user.id),
    ])

  return (
    <RecurringClient
      recurring={recurring ?? []}
      categories={categories ?? []}
      subcategories={subcategories ?? []}
      userId={user.id}
    />
  )
}
