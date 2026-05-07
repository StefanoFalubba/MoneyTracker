import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

interface RecurringTransaction {
  id: string
  user_id: string
  category_id: string
  subcategory_id: string | null
  amount: number
  type: 'income' | 'expense' | 'investment'
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  start_date: string
  end_date: string | null
  last_executed_date: string | null
  is_business: boolean
  description: string | null
  is_active: boolean
}

function getNextDate(frequency: string, from: Date): Date {
  const date = new Date(from)
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1)
      break
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'biweekly':
      date.setDate(date.getDate() + 14)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'quarterly':
      date.setMonth(date.getMonth() + 3)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
  }
  return date
}

function shouldExecute(recurring: RecurringTransaction, today: Date): boolean {
  const startDate = new Date(recurring.start_date)
  if (today < startDate) return false

  if (recurring.end_date) {
    const endDate = new Date(recurring.end_date)
    if (today > endDate) return false
  }

  if (!recurring.is_active) return false

  const lastDate = recurring.last_executed_date
    ? new Date(recurring.last_executed_date)
    : startDate

  const nextDate = getNextDate(recurring.frequency, lastDate)
  return today >= nextDate
}

export async function POST(req: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get all active recurring transactions
    const { data: recurring, error: fetchError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('is_active', true)

    if (fetchError) {
      console.error('Error fetching recurring transactions:', fetchError)
      return new Response(JSON.stringify({ error: fetchError }), { status: 500 })
    }

    let processed = 0
    let created = 0
    let errors = 0

    for (const r of (recurring || []) as RecurringTransaction[]) {
      if (!shouldExecute(r, today)) {
        continue
      }

      processed++

      try {
        // Create transaction
        const { error: insertError } = await supabase.from('transactions').insert({
          user_id: r.user_id,
          category_id: r.category_id,
          subcategory_id: r.subcategory_id,
          amount: r.amount,
          type: r.type,
          description: r.description || `${r.name} (ricorrente)`,
          date: today.toISOString().split('T')[0],
          is_business: r.is_business,
        })

        if (insertError) {
          console.error(`Error creating transaction for ${r.id}:`, insertError)
          errors++
          continue
        }

        created++

        // Update last_executed_date
        const { error: updateError } = await supabase
          .from('recurring_transactions')
          .update({ last_executed_date: today.toISOString().split('T')[0] })
          .eq('id', r.id)

        if (updateError) {
          console.error(`Error updating recurring ${r.id}:`, updateError)
        }

        // Check if end_date has passed and deactivate
        if (r.end_date && today > new Date(r.end_date)) {
          await supabase
            .from('recurring_transactions')
            .update({ is_active: false })
            .eq('id', r.id)
        }
      } catch (err) {
        console.error(`Unexpected error processing recurring ${r.id}:`, err)
        errors++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        created,
        errors,
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Cron job error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    )
  }
}
