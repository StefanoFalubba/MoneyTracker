'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Category, TransactionType } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  icon: z.string().optional(),
  color: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  initialCategories: Category[]
  userId: string
}

const SECTIONS: { type: TransactionType; label: string; accentColor: string }[] = [
  { type: 'income', label: 'Entrate', accentColor: 'text-income-dark border-income-light' },
  { type: 'expense', label: 'Spese', accentColor: 'text-expense-dark border-expense-light' },
  { type: 'investment', label: 'Investimenti', accentColor: 'text-[#534AB7] border-investment-light' },
]

export function CategoriesClient({ initialCategories, userId }: Props) {
  const [categories, setCategories] = useState(initialCategories)
  const [formOpen, setFormOpen] = useState(false)
  const [formType, setFormType] = useState<TransactionType>('expense')
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [deletingCat, setDeletingCat] = useState<Category | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function reload() {
    const supabase = createClient()
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name')
    setCategories(data ?? [])
  }

  function openAdd(type: TransactionType) {
    setFormType(type)
    setEditingCat(null)
    reset({ name: '', icon: '', color: '' })
    setFormOpen(true)
  }

  function openEdit(cat: Category) {
    setFormType(cat.type)
    setEditingCat(cat)
    reset({ name: cat.name, icon: cat.icon ?? '', color: cat.color ?? '' })
    setFormOpen(true)
  }

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    const payload = {
      user_id: userId,
      type: formType,
      name: data.name,
      icon: data.icon || null,
      color: data.color || null,
    }

    const { error } = editingCat
      ? await supabase.from('categories').update(payload).eq('id', editingCat.id)
      : await supabase.from('categories').insert(payload)

    if (error) {
      toast.error('Errore durante il salvataggio')
      return
    }

    toast.success(editingCat ? 'Categoria aggiornata' : 'Categoria aggiunta')
    setFormOpen(false)
    await reload()
  }

  async function handleDelete() {
    if (!deletingCat) return
    const supabase = createClient()
    const { error } = await supabase.from('categories').delete().eq('id', deletingCat.id)
    if (error) {
      toast.error('Errore durante la cancellazione')
    } else {
      toast.success('Categoria eliminata')
      await reload()
    }
    setDeletingCat(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categorie</h1>

      {SECTIONS.map(({ type, label }) => {
        const sectionCats = categories.filter((c) => c.type === type)
        return (
          <Card key={type}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle
                  className={`text-base ${
                    type === 'income'
                      ? 'text-income-dark'
                      : type === 'expense'
                      ? 'text-expense-dark'
                      : 'text-[#534AB7]'
                  }`}
                >
                  {label}
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => openAdd(type)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Aggiungi
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sectionCats.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna categoria</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {sectionCats.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-md border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{cat.icon ?? '📂'}</span>
                        <span className="text-sm font-medium truncate">{cat.name}</span>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(cat)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeletingCat(cat)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Category form dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => !v && setFormOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingCat ? 'Modifica categoria' : 'Nuova categoria'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="es. Alimentari" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icona (emoji)</Label>
              <Input id="icon" placeholder="🛒" maxLength={4} {...register('icon')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Colore (hex)</Label>
              <Input id="color" placeholder="#22c55e" {...register('color')} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Annulla
              </Button>
              <Button type="submit">{editingCat ? 'Aggiorna' : 'Aggiungi'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingCat} onOpenChange={(v) => !v && setDeletingCat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro? Le transazioni associate manterranno la categoria impostata su null.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
