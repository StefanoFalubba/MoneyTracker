'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Transaction, Category, TransactionType } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const schema = z.object({
  amount: z.coerce.number().positive('Inserisci un importo valido'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  date: z.string().min(1, 'Seleziona una data'),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  categories: Category[]
  transaction?: Transaction | null
  userId: string
}

const TYPE_TABS: { type: TransactionType; label: string; color: string; accent: string }[] = [
  { type: 'income', label: 'Entrata', color: 'text-income-dark', accent: 'border-income bg-income-light' },
  { type: 'expense', label: 'Spesa', color: 'text-expense-dark', accent: 'border-expense bg-expense-light' },
  { type: 'investment', label: 'Investimento', color: 'text-[#534AB7]', accent: 'border-[#7F77DD] bg-investment-light' },
]

export function TransactionForm({ open, onClose, onSaved, categories, transaction, userId }: Props) {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense')
  const [loading, setLoading] = useState(false)

  const filteredCats = categories.filter((c) => c.type === type)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: transaction ? Number(transaction.amount) : undefined,
      description: transaction?.description ?? '',
      category_id: transaction?.category_id ?? undefined,
      date: transaction?.date ?? format(new Date(), 'yyyy-MM-dd'),
    },
  })

  useEffect(() => {
    if (open) {
      if (transaction) {
        setType(transaction.type)
        reset({
          amount: Number(transaction.amount),
          description: transaction.description ?? '',
          category_id: transaction.category_id ?? undefined,
          date: transaction.date,
        })
      } else {
        setType('expense')
        reset({
          amount: undefined,
          description: '',
          category_id: undefined,
          date: format(new Date(), 'yyyy-MM-dd'),
        })
      }
    }
  }, [open, transaction, reset])

  // Reset category when type changes
  useEffect(() => {
    setValue('category_id', undefined)
  }, [type, setValue])

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()

    const payload = {
      user_id: userId,
      type,
      amount: data.amount,
      description: data.description || null,
      category_id: data.category_id || null,
      date: data.date,
    }

    const { error } = transaction
      ? await supabase.from('transactions').update(payload).eq('id', transaction.id)
      : await supabase.from('transactions').insert(payload)

    setLoading(false)

    if (error) {
      toast.error('Errore durante il salvataggio')
      return
    }

    toast.success(transaction ? 'Transazione aggiornata' : 'Transazione aggiunta')
    onSaved()
    onClose()
  }

  const currentTab = TYPE_TABS.find((t) => t.type === type)!

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Modifica transazione' : 'Nuova transazione'}
          </DialogTitle>
        </DialogHeader>

        {/* Type selector */}
        <div className="flex gap-2">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.type}
              type="button"
              onClick={() => setType(tab.type)}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md border-2 transition-colors',
                type === tab.type ? tab.accent + ' ' + tab.color : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Importo (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register('amount')}
              className={cn(
                'focus-visible:ring-2',
                type === 'income' && 'focus-visible:ring-income',
                type === 'expense' && 'focus-visible:ring-expense',
                type === 'investment' && 'focus-visible:ring-[#7F77DD]'
              )}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Input
              id="description"
              placeholder="Descrizione opzionale"
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={watch('category_id') ?? ''}
              onValueChange={(v) => setValue('category_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCats.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvataggio...' : transaction ? 'Aggiorna' : 'Aggiungi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
