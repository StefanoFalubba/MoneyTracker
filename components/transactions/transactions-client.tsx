'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Transaction, Category, TransactionType } from '@/types/database'
import { formatCurrency, formatDate, TYPE_CONFIG } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { TransactionForm } from '@/components/transaction-form'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 20

interface Props {
  initialTransactions: (Transaction & { category: Category | null })[]
  categories: Category[]
  userId: string
}

export function TransactionsClient({ initialTransactions, categories, userId }: Props) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null)

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterCategory !== 'all' && t.category_id !== filterCategory) return false
      if (filterDateFrom && t.date < filterDateFrom) return false
      if (filterDateTo && t.date > filterDateTo) return false
      return true
    })
  }, [transactions, filterType, filterCategory, filterDateFrom, filterDateTo])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function reload() {
    const supabase = createClient()
    const { data } = await supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    setTransactions(data ?? [])
  }

  async function handleDelete() {
    if (!deletingTx) return
    const supabase = createClient()
    const { error } = await supabase.from('transactions').delete().eq('id', deletingTx.id)
    if (error) {
      toast.error('Errore durante la cancellazione')
    } else {
      toast.success('Transazione eliminata')
      await reload()
    }
    setDeletingTx(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transazioni</h1>
        <Button onClick={() => { setEditingTx(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={filterType} onValueChange={(v) => { setFilterType(v as TransactionType | 'all'); setPage(1) }}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                <SelectItem value="income">Entrate</SelectItem>
                <SelectItem value="expense">Spese</SelectItem>
                <SelectItem value="investment">Investimenti</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(1) }}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Da"
              value={filterDateFrom}
              onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1) }}
            />
            <Input
              type="date"
              placeholder="A"
              value={filterDateTo}
              onChange={(e) => { setFilterDateTo(e.target.value); setPage(1) }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {filtered.length} transazion{filtered.length === 1 ? 'e' : 'i'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {paginated.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-muted-foreground">Nessuna transazione trovata</p>
            </div>
          ) : (
            <div className="divide-y">
              {paginated.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 px-6 py-4 hover:bg-muted/30 transition-colors ${
                    t.type === 'investment' ? 'border-l-2 border-l-[#7F77DD]' : ''
                  }`}
                >
                  <span className="text-xl hidden sm:block">{t.category?.icon ?? '💰'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {t.description ?? t.category?.name ?? '—'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatDate(t.date)}</span>
                      <Badge
                        variant={
                          t.type === 'income' ? 'income' : t.type === 'expense' ? 'expense' : 'investment'
                        }
                      >
                        {TYPE_CONFIG[t.type].label}
                      </Badge>
                      {t.category && (
                        <span className="text-xs text-muted-foreground">{t.category.name}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold whitespace-nowrap ${
                      t.type === 'income'
                        ? 'text-income-dark'
                        : t.type === 'expense'
                        ? 'text-expense-dark'
                        : 'text-[#534AB7]'
                    }`}
                  >
                    {t.type === 'investment' ? '→ ' : t.type === 'income' ? '+ ' : '− '}
                    {formatCurrency(Number(t.amount))}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditingTx(t); setFormOpen(true) }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingTx(t)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Transaction form modal */}
      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        categories={categories}
        transaction={editingTx}
        userId={userId}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingTx} onOpenChange={(v) => !v && setDeletingTx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina transazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa transazione? L&apos;azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
