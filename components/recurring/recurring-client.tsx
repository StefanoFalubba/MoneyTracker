'use client'

import { useState } from 'react'
import type { RecurringTransaction, Category, Subcategory } from '@/types/database'
import { RecurringForm } from '@/components/recurring-form'
import { RecurringList } from '@/components/recurring/recurring-list'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  recurring: (RecurringTransaction & { category?: Category; subcategory?: Subcategory })[]
  categories: Category[]
  subcategories: Subcategory[]
  userId: string
}

export function RecurringClient({
  recurring,
  categories,
  subcategories,
  userId,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  const activeRecurring = recurring.filter((r) => r.is_active)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ricorrenze</h1>
        <p className="text-muted-foreground">Gestisci abbonamenti e spese ricorrenti</p>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <RecurringForm
              categories={categories}
              subcategories={subcategories}
              userId={userId}
              onSuccess={() => {
                setShowForm(false)
                setReloadTrigger((r) => r + 1)
              }}
            />
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => setShowForm(!showForm)}
        className="bg-yellow-500 hover:bg-yellow-600 text-white"
      >
        {showForm ? (
          <>
            <ChevronUp className="h-4 w-4 mr-2" />
            Nascondi form
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-2" />+ Nuova ricorrenza
          </>
        )}
      </Button>

      {/* Stats */}
      {activeRecurring.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Ricorrenze attive</p>
                <p className="text-2xl font-bold">{activeRecurring.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spese ricorrenti</p>
                <p className="text-2xl font-bold text-expense-dark">
                  €
                  {activeRecurring
                    .filter((r) => r.type === 'expense')
                    .reduce((sum, r) => sum + Number(r.amount), 0)
                    .toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entrate ricorrenti</p>
                <p className="text-2xl font-bold text-income-dark">
                  €
                  {activeRecurring
                    .filter((r) => r.type === 'income')
                    .reduce((sum, r) => sum + Number(r.amount), 0)
                    .toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investimenti ricorrenti</p>
                <p className="text-2xl font-bold text-[#534AB7]">
                  €
                  {activeRecurring
                    .filter((r) => r.type === 'investment')
                    .reduce((sum, r) => sum + Number(r.amount), 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          {recurring.length > 0 ? 'Le tue ricorrenze' : 'Ricorrenze'}
        </h2>
        <RecurringList
          key={reloadTrigger}
          recurring={recurring}
          categories={categories}
          onUpdate={() => setReloadTrigger((r) => r + 1)}
        />
      </div>
    </div>
  )
}
