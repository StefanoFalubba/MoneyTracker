'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Category, Subcategory, TransactionType } from '@/types/database'
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

const subschema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  icon: z.string().optional(),
  color: z.string().optional(),
})

type FormData = z.infer<typeof schema>
type SubFormData = z.infer<typeof subschema>

interface Props {
  initialCategories: Category[]
  initialSubcategories: Subcategory[]
  userId: string
}

const SECTIONS: { type: TransactionType; label: string; accentColor: string }[] = [
  { type: 'income', label: 'Entrate', accentColor: 'text-income-dark border-income-light' },
  { type: 'expense', label: 'Spese', accentColor: 'text-expense-dark border-expense-light' },
  { type: 'investment', label: 'Investimenti', accentColor: 'text-[#534AB7] border-investment-light' },
]

export function CategoriesClient({ initialCategories, initialSubcategories, userId }: Props) {
  const [categories, setCategories] = useState(initialCategories)
  const [subcategories, setSubcategories] = useState(initialSubcategories)
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [formOpen, setFormOpen] = useState(false)
  const [formType, setFormType] = useState<TransactionType>('expense')
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [deletingCat, setDeletingCat] = useState<Category | null>(null)
  const [subFormOpen, setSubFormOpen] = useState(false)
  const [selectedCatForSub, setSelectedCatForSub] = useState<Category | null>(null)
  const [editingSubcat, setEditingSubcat] = useState<Subcategory | null>(null)
  const [deletingSubcat, setDeletingSubcat] = useState<Subcategory | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const {
    register: registerSub,
    handleSubmit: handleSubmitSub,
    reset: resetSub,
    formState: { errors: errorsSub },
  } = useForm<SubFormData>({ resolver: zodResolver(subschema) })

  async function reload() {
    const supabase = createClient()
    const [{ data: catData }, { data: subData }] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name'),
      supabase
        .from('subcategories')
        .select('*')
        .eq('user_id', userId)
        .order('name'),
    ])
    setCategories(catData ?? [])
    setSubcategories(subData ?? [])
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

    const { error } = editingCat
      ? await supabase
          .from('categories')
          .update({
            type: formType,
            name: data.name,
            icon: data.icon || null,
            color: data.color || null,
          })
          .eq('id', editingCat.id)
      : await supabase.from('categories').insert({
          user_id: userId,
          type: formType,
          name: data.name,
          icon: data.icon || null,
          color: data.color || null,
        })

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

  function openAddSubcategory(cat: Category) {
    setSelectedCatForSub(cat)
    setEditingSubcat(null)
    resetSub({ name: '', icon: '', color: '' })
    setSubFormOpen(true)
  }

  function openEditSubcategory(subcat: Subcategory) {
    const cat = categories.find(c => c.id === subcat.category_id)
    if (!cat) return
    setSelectedCatForSub(cat)
    setEditingSubcat(subcat)
    resetSub({ name: subcat.name, icon: subcat.icon ?? '', color: subcat.color ?? '' })
    setSubFormOpen(true)
  }

  async function onSubmitSubcategory(data: SubFormData) {
    if (!selectedCatForSub) return
    const supabase = createClient()

    const { error } = editingSubcat
      ? await supabase
          .from('subcategories')
          .update({
            name: data.name,
            icon: data.icon || null,
            color: data.color || null,
          })
          .eq('id', editingSubcat.id)
      : await supabase.from('subcategories').insert({
          user_id: userId,
          category_id: selectedCatForSub.id,
          name: data.name,
          icon: data.icon || null,
          color: data.color || null,
        })

    if (error) {
      toast.error('Errore durante il salvataggio')
      return
    }

    toast.success(editingSubcat ? 'Sottocategoria aggiornata' : 'Sottocategoria aggiunta')
    setSubFormOpen(false)
    await reload()
  }

  async function handleDeleteSubcategory() {
    if (!deletingSubcat) return
    const supabase = createClient()
    const { error } = await supabase.from('subcategories').delete().eq('id', deletingSubcat.id)
    if (error) {
      toast.error('Errore durante la cancellazione')
    } else {
      toast.success('Sottocategoria eliminata')
      await reload()
    }
    setDeletingSubcat(null)
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
                <div className="space-y-3">
                  {sectionCats.map((cat) => {
                    const catSubs = subcategories.filter(s => s.category_id === cat.id)
                    const isExpanded = expandedCats.has(cat.id)
                    return (
                      <div key={cat.id} className="border rounded-md bg-muted/20">
                        <div className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-lg">{cat.icon ?? '📂'}</span>
                            <span className="text-sm font-medium truncate">{cat.name}</span>
                            {type === 'expense' && catSubs.length > 0 && (
                              <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                {catSubs.length}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2">
                            {type === 'expense' && catSubs.length > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setExpandedCats(prev => {
                                  const next = new Set(prev)
                                  if (next.has(cat.id)) next.delete(cat.id)
                                  else next.add(cat.id)
                                  return next
                                })}
                              >
                                <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
                              </Button>
                            )}
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

                        {/* Subcategories section */}
                        {type === 'expense' && isExpanded && catSubs.length > 0 && (
                          <div className="border-t bg-muted/10 p-3 space-y-2">
                            <div className="flex justify-between items-center pb-2">
                              <span className="text-xs font-semibold text-muted-foreground">SOTTOCATEGORIE</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs"
                                onClick={() => openAddSubcategory(cat)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Aggiungi
                              </Button>
                            </div>
                            <div className="space-y-1">
                              {catSubs.map(subcat => (
                                <div
                                  key={subcat.id}
                                  className="flex items-center justify-between p-2 rounded bg-white/50 hover:bg-white/80 transition-colors text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span>{subcat.icon || '·'}</span>
                                    <span className="truncate">{subcat.name}</span>
                                  </div>
                                  <div className="flex gap-0.5 ml-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => openEditSubcategory(subcat)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-destructive hover:text-destructive"
                                      onClick={() => setDeletingSubcat(subcat)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add first subcategory button for expense categories without subcategories */}
                        {type === 'expense' && catSubs.length === 0 && (
                          <div className="border-t px-3 py-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-7 text-xs"
                              onClick={() => openAddSubcategory(cat)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Aggiungi sottocategoria
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
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

      {/* Subcategory form dialog */}
      <Dialog open={subFormOpen} onOpenChange={(v) => !v && setSubFormOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingSubcat ? 'Modifica sottocategoria' : 'Nuova sottocategoria'}
              {selectedCatForSub && <span className="ml-2 text-sm font-normal text-muted-foreground">in {selectedCatForSub.name}</span>}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitSub(onSubmitSubcategory)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sub-name">Nome</Label>
              <Input id="sub-name" placeholder="es. Pizza" {...registerSub('name')} />
              {errorsSub.name && (
                <p className="text-sm text-destructive">{errorsSub.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-icon">Icona (emoji)</Label>
              <Input id="sub-icon" placeholder="🍕" maxLength={4} {...registerSub('icon')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-color">Colore (hex)</Label>
              <Input id="sub-color" placeholder="#f97316" {...registerSub('color')} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setSubFormOpen(false)}>
                Annulla
              </Button>
              <Button type="submit">{editingSubcat ? 'Aggiorna' : 'Aggiungi'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete category confirmation */}
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

      {/* Delete subcategory confirmation */}
      <AlertDialog open={!!deletingSubcat} onOpenChange={(v) => !v && setDeletingSubcat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina sottocategoria</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro? Le transazioni associate manterranno la sottocategoria impostata su null.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubcategory}
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
