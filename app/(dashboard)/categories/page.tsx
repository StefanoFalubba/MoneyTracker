import { createClient } from '@/lib/supabase/server'
import { CategoriesClient } from '@/components/categories/categories-client'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return <CategoriesClient initialCategories={categories ?? []} userId={user.id} />
}
