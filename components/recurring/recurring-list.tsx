'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { RecurringTransaction, Category, Subcategory } from '@/types/database'
import { formatCurrency, TYPE_CONFIG } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Edit2, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { addDays, addWeeks, addMonths, addQuarters, addYears, format } from 'date-fns'
import { it } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Props {
  recurring: (RecurringTransaction & { category?: Category; subcategory?: Subcategory })[]
  categories: Category[]
  onUpdate?: () => void
}

const frequencyConfig: Record<string, { label: string; days: number }> = {
  daily: { label: 'Giornaliero', days: 1 },
  weekly: { label: 'Settimanale', days: 7 },
  biweekly: { label: 'Bisettimanale', days: 14 },
  monthly: { label: 'Mensile', days: 30 },
  quarterly: { label: 'Trimestrale', days: 90 },
  yearly: { label: 'Annuale', days: 365 },
}

function getNextExecutionDate(r: RecurringTransaction): Date {
  const lastDate = r.last_executed_date ? new Date(r.last_executed_date) : new Date(r.start_date)
  const now = new Date()

  switch (r.frequency) {
    case 'daily':
      return addDays(lastDate, 1)
    case 'weekly':
      return addWeeks(lastDate, 1)
    case 'biweekly':
      return addWeeks(lastDate, 2)
    case 'monthly':
      return addMonths(lastDate, 1)
    case 'quarterly':
      return addQuarters(lastDate, 1)
    case 'yearly':
      return addYears(lastDate, 1)
    default:
      return addDays(lastDate, 1)
  }
}

export function RecurringList({ recurring, categories, onUpdate }: Props) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState<string | null>(null)

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setIsToggling(id)
    const supabase = createClient()

    const { error } = await supabase
      .from('recurring_transactions')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    setIsToggling(null)

    if (error) {
      toast.error('Errore nel cambio stato')
      return
    }

    toast.success(currentStatus ? 'Ricorrenza disattivata' : 'Ricorrenza attivata')
    onUpdate?.()
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    const supabase = createClient()

    const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)

    setIsDeleting(null)

    if (error) {
      toast.error('Errore nell\'eliminazione')
      return
    }

    toast.success('Ricorrenza eliminata')
    onUpdate?.()
  }

  if (recurring.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-muted-foreground">Nessuna ricorrenza configurata.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Aggiungi un abbonamento ricorrente come Netflix o la spesa settimanale.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {recurring.map((r) => {
        const nextDate = getNextExecutionDate(r)
        const isOverdue = nextDate < new Date()

        return (
          <Card key={r.id} className={cn(r.is_active ? '' : 'opacity-50')}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{r.category?.icon ?? '💰'}</span>
                    <div>
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.category?.name}
                        {r.subcategory && ` • ${r.subcategory.name}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <Badge
                      variant={
                        r.type === 'income'
                          ? 'income'
                          : r.type === 'expense'
                          ? 'expense'
                          : 'investment'
                      }
                    >
                      {TYPE_CONFIG[r.type].label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {frequencyConfig[r.frequency]?.label ?? r.frequency}
                    </Badge>
                    {r.is_business && (
                      <Badge variant="outline" className="text-xs bg-blue-50">
                        P.IVA
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    <p>
                      Importo:{' '}
                      <span
                        className={`font-semibold ${
                          r.type === 'income'
                            ? 'text-income-dark'
                            : r.type === 'expense'
                            ? 'text-expense-dark'
                            : 'text-[#534AB7]'
                        }`}
                      >
                        {r.type === 'investment' ? '→ ' : r.type === 'income' ? '+ ' : '− '}
                        {formatCurrency(Number(r.amount))}
                      </span>
                    </p>
                    {r.last_executed_date && (
                      <p>Ultima esecuzione: {format(new Date(r.last_executed_date), 'd MMM yyyy', { locale: it })}</p>
                    )}
                    <p className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                      Prossima esecuzione: {format(nextDate, 'd MMM yyyy', { locale: it })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggle(r.id, r.is_active)}
                    disabled={isToggling === r.id}
                  >
                    {r.is_active ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>

                  <Button size="sm" variant="ghost" asChild>
                    <a href={`/recurring/${r.id}/edit`}>
                      <Edit2 className="h-4 w-4" />
                    </a>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>Elimina ricorrenza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Eliminerai &quot;{r.name}&quot; dalla lista. Le transazioni passate non verranno eliminate.
                      </AlertDialogDescription>
                      <div className="flex gap-2">
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(r.id)}
                          disabled={isDeleting === r.id}
                          className="bg-destructive"
                        >
                          {isDeleting === r.id ? 'Eliminazione...' : 'Elimina'}
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
