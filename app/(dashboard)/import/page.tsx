import { createClient } from '@/lib/supabase/server'
import { ImportClient } from '@/components/import/import-client'

export default async function ImportPage() {
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

  return <ImportClient categories={categories ?? []} userId={user.id} />
}
