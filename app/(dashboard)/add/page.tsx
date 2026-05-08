import { createClient } from '@/lib/supabase/server'
import { QuickAddPage } from '@/components/quick-add/quick-add-page'

interface Props {
  searchParams: { type?: string }
}

export default async function AddPage({ searchParams }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)

  const initialType =
    searchParams.type === 'income' ? 'income' : 'expense'

  return (
    <QuickAddPage
      categories={categories ?? []}
      userId={user.id}
      initialType={initialType}
    />
  )
}
