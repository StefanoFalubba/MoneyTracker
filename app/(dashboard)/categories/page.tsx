import { createClient } from '@/lib/supabase/server'
import { CategoriesClient } from '@/components/categories/categories-client'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: categories }, { data: subcategories }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name'),
    supabase
      .from('subcategories')
      .select('*')
      .eq('user_id', user.id)
      .order('name'),
  ])

  return (
    <CategoriesClient
      initialCategories={categories ?? []}
      initialSubcategories={subcategories ?? []}
      userId={user.id}
    />
  )
}
