'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Category, Subcategory, RecurringTransaction, RecurringFrequency } from '@/types/database'
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

const schema = z.object({
  name: z.string().min(1, 'Nome obbligatorio'),
  amount: z.coerce.number().positive('Importo deve essere positivo'),
  type: z.enum(['expense', 'income', 'investment']),
  category_id: z.string().min(1, 'Seleziona una categoria'),
  subcategory_id: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  start_date: z.string().min(1, 'Data inizio obbligatoria'),
  end_date: z.string().optional(),
  description: z.string().optional(),
  is_business: z.boolean().default(false),
})

type FormData = z.infer<typeof schema>

interface Props {
  categories: Category[]
  subcategories: Subcategory[]
  userId: string
  initialData?: RecurringTransaction
  onSuccess?: () => void
}

const frequencyConfig: Record<RecurringFrequency, string> = {
  daily: 'Giornaliero',
  weekly: 'Settimanale',
  biweekly: 'Bisettimanale',
  monthly: 'Mensile',
  quarterly: 'Trimestrale',
  yearly: 'Annuale',
}

export function RecurringForm({
  categories,
  subcategories,
  userId,
  initialData,
  onSuccess,
}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<'expense' | 'income' | 'investment'>(
    initialData?.type ?? 'expense'
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          amount: initialData.amount,
          type: initialData.type,
          category_id: initialData.category_id,
          subcategory_id: initialData.subcategory_id || '',
          frequency: initialData.frequency,
          start_date: initialData.start_date,
          end_date: initialData.end_date || '',
          description: initialData.description || '',
          is_business: initialData.is_business,
        }
      : undefined,
  })

  const selectedCategory = watch('category_id')
  const filteredCats = categories.filter((c) => c.type === selectedType)
  const filteredSubcats = selectedCategory
    ? subcategories.filter((s) => s.category_id === selectedCategory)
    : []

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    const supabase = createClient()

    try {
      if (initialData) {
        // Update existing
        const { error } = await supabase
          .from('recurring_transactions')
          .update({
            name: data.name,
            amount: data.amount,
            type: data.type,
            category_id: data.category_id,
            subcategory_id: data.subcategory_id || null,
            frequency: data.frequency,
            start_date: data.start_date,
            end_date: data.end_date || null,
            description: data.description || null,
            is_business: data.is_business,
            updated_at: new Date().toISOString(),
          })
          .eq('id', initialData.id)
          .eq('user_id', userId)

        if (error) {
          toast.error('Errore nel salvataggio')
          return
        }
        toast.success('Ricorrenza aggiornata!')
      } else {
        // Create new
        const { error } = await supabase.from('recurring_transactions').insert({
          user_id: userId,
          name: data.name,
          amount: data.amount,
          type: data.type,
          category_id: data.category_id,
          subcategory_id: data.subcategory_id || null,
          frequency: data.frequency,
          start_date: data.start_date,
          end_date: data.end_date || null,
          description: data.description || null,
          is_business: data.is_business,
          is_active: true,
        })

        if (error) {
          toast.error('Errore nel salvataggio')
          return
        }
        toast.success('Ricorrenza creata!')
      }

      reset()
      onSuccess?.()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {initialData ? 'Modifica ricorrenza' : 'Crea ricorrenza'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1">
            <Label htmlFor="name" className="text-sm">
              Nome (es: Netflix)
            </Label>
            <Input
              id="name"
              placeholder="Netflix, Spotify, Affitto..."
              autoFocus
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Type toggle */}
          <div className="space-y-1">
            <Label className="text-sm">Tipo</Label>
            <div className="flex gap-2">
              {(['expense', 'income', 'investment'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSelectedType(t)
                    setValue('type', t)
                    setValue('category_id', '')
                  }}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium rounded-md border-2 transition-colors',
                    selectedType === t
                      ? t === 'expense'
                        ? 'border-expense bg-expense-light text-expense-dark'
                        : t === 'income'
                        ? 'border-income bg-income-light text-income-dark'
                        : 'border-[#7F77DD] bg-[#7F77DD]/10 text-[#534AB7]'
                      : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {t === 'expense' ? 'Spesa' : t === 'income' ? 'Entrata' : 'Investimento'}
                </button>
              ))}
            </div>
          </div>

          {/* Importo */}
          <div className="space-y-1">
            <Label htmlFor="amount" className="text-sm">
              Importo (€)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register('amount')}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          {/* Categoria */}
          <div className="space-y-1">
            <Label htmlFor="category" className="text-sm">
              Categoria
            </Label>
            <Select value={watch('category_id') ?? ''} onValueChange={(v) => setValue('category_id', v)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Seleziona categoria" />
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

          {/* Sottocategoria */}
          {filteredSubcats.length > 0 && (
            <div className="space-y-1">
              <Label htmlFor="subcategory" className="text-sm">
                Sottocategoria (opzionale)
              </Label>
              <Select
                value={watch('subcategory_id') ?? ''}
                onValueChange={(v) => setValue('subcategory_id', v)}
              >
                <SelectTrigger id="subcategory">
                  <SelectValue placeholder="Seleziona sottocategoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessuna</SelectItem>
                  {filteredSubcats.map((subcat) => (
                    <SelectItem key={subcat.id} value={subcat.id}>
                      {subcat.icon} {subcat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Frequenza */}
          <div className="space-y-1">
            <Label htmlFor="frequency" className="text-sm">
              Frequenza
            </Label>
            <Select value={watch('frequency') ?? ''} onValueChange={(v) => setValue('frequency', v as RecurringFrequency)}>
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Seleziona frequenza" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(frequencyConfig).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.frequency && (
              <p className="text-xs text-destructive">{errors.frequency.message}</p>
            )}
          </div>

          {/* Data inizio */}
          <div className="space-y-1">
            <Label htmlFor="start-date" className="text-sm">
              Data inizio
            </Label>
            <Input id="start-date" type="date" {...register('start_date')} />
            {errors.start_date && (
              <p className="text-xs text-destructive">{errors.start_date.message}</p>
            )}
          </div>

          {/* Data fine */}
          <div className="space-y-1">
            <Label htmlFor="end-date" className="text-sm">
              Data fine (opzionale)
            </Label>
            <Input id="end-date" type="date" {...register('end_date')} />
          </div>

          {/* Descrizione */}
          <div className="space-y-1">
            <Label htmlFor="description" className="text-sm">
              Descrizione (opzionale)
            </Label>
            <Input
              id="description"
              placeholder="Note aggiuntive..."
              {...register('description')}
            />
          </div>

          {/* P.IVA toggle */}
          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <input
              type="checkbox"
              id="is-business"
              {...register('is_business')}
              className="rounded"
            />
            <Label htmlFor="is-business" className="text-sm cursor-pointer">
              Spesa P.IVA
            </Label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              'w-full font-semibold',
              selectedType === 'expense'
                ? 'bg-expense-dark hover:bg-expense-dark/90'
                : selectedType === 'income'
                ? 'bg-income-dark hover:bg-income-dark/90'
                : 'bg-[#534AB7] hover:bg-[#534AB7]/90'
            )}
          >
            {isLoading ? 'Salvataggio...' : initialData ? '✓ Aggiorna' : '+ Crea ricorrenza'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
