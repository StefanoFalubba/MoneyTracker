'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

const schema = z.object({
  amount: z.coerce.number().positive('Importo deve essere positivo'),
  category_id: z.string().min(1, 'Seleziona una categoria'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  categories: Category[]
  userId: string
  onSuccess?: () => void
}

export function QuickAddForm({ categories, userId, onSuccess }: Props) {
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [isLoading, setIsLoading] = useState(false)

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
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from('transactions').insert({
      user_id: userId,
      type,
      amount: data.amount,
      category_id: data.category_id,
      description: data.description || null,
      date: format(new Date(), 'yyyy-MM-dd'),
      subcategory_id: null,
      is_business: false,
    })

    setIsLoading(false)

    if (error) {
      toast.error('Errore nel salvataggio')
      return
    }

    toast.success(`${type === 'expense' ? 'Spesa' : 'Entrata'} aggiunta!`)
    reset()
    onSuccess?.()
  }

  const typeConfig = {
    expense: { label: 'Spesa', color: 'text-expense-dark', bgLight: 'bg-expense-light' },
    income: { label: 'Entrata', color: 'text-income-dark', bgLight: 'bg-income-light' },
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-slate-50 to-white shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-base">Aggiungi veloce</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t)
                  setValue('category_id', '')
                }}
                className={cn(
                  'flex-1 py-2 text-sm font-medium rounded-md border-2 transition-colors',
                  type === t
                    ? t === 'expense'
                      ? 'border-expense bg-expense-light text-expense-dark'
                      : 'border-income bg-income-light text-income-dark'
                    : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {typeConfig[t].label}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="quick-amount" className="text-sm">
              Importo (€)
            </Label>
            <Input
              id="quick-amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              autoFocus
              {...register('amount')}
              className="text-lg font-semibold"
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label htmlFor="quick-category" className="text-sm">
              Categoria
            </Label>
            <Select value={watch('category_id') ?? ''} onValueChange={(v) => setValue('category_id', v)}>
              <SelectTrigger id="quick-category" className="text-base">
                <SelectValue placeholder="Seleziona" />
              </SelectTrigger>
              <SelectContent>
                {filteredCats.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">Nessuna categoria</div>
                ) : (
                  filteredCats.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-xs text-destructive">{errors.category_id.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="quick-description" className="text-sm">
              Note (opzionale)
            </Label>
            <Input
              id="quick-description"
              placeholder="Es: Cena con amici"
              {...register('description')}
              className="text-sm"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              'w-full font-semibold',
              type === 'expense'
                ? 'bg-expense-dark hover:bg-expense-dark/90'
                : 'bg-income-dark hover:bg-income-dark/90'
            )}
          >
            {isLoading ? 'Salvataggio...' : '✓ Aggiungi'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
