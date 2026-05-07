import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RecurringForm } from '@/components/recurring-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

interface Props {
  params: {
    id: string
  }
}

export default async function EditRecurringPage({ params }: Props) {
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
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single(),
      supabase.from('categories').select('*').eq('user_id', user.id),
      supabase.from('subcategories').select('*').eq('user_id', user.id),
    ])

  if (!recurring) {
    redirect('/recurring')
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" asChild className="gap-2">
        <a href="/recurring">
          <ChevronLeft className="h-4 w-4" />
          Indietro
        </a>
      </Button>

      <RecurringForm
        initialData={recurring}
        categories={categories ?? []}
        subcategories={subcategories ?? []}
        userId={user.id}
        onSuccess={() => redirect('/recurring')}
      />
    </div>
  )
}
