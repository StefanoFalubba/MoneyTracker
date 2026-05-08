'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Category } from '@/types/database'
import { QuickAddForm } from './quick-add-form'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Plus, Home } from 'lucide-react'

interface Props {
  categories: Category[]
  userId: string
  initialType?: 'expense' | 'income'
}

export function QuickAddPage({ categories, userId, initialType }: Props) {
  const router = useRouter()
  const [justAdded, setJustAdded] = useState(false)
  const [count, setCount] = useState(0)

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Aggiungi veloce</h1>
        <p className="text-sm text-muted-foreground">
          Inserisci una transazione e basta
        </p>
        {count > 0 && (
          <p className="text-xs text-green-600 mt-1">
            ✓ {count} transazion{count === 1 ? 'e' : 'i'} aggiunt{count === 1 ? 'a' : 'e'} oggi
          </p>
        )}
      </div>

      {justAdded ? (
        <div className="bg-card rounded-lg border p-6 text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Aggiunta!</h2>
            <p className="text-sm text-muted-foreground">
              Cosa vuoi fare ora?
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => setJustAdded(false)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" strokeWidth={3} />
              Aggiungi un&apos;altra
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              Vai alla Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <QuickAddForm
          key={count}
          categories={categories}
          userId={userId}
          initialType={initialType}
          onSuccess={() => {
            setCount((c) => c + 1)
            setJustAdded(true)
          }}
        />
      )}
    </div>
  )
}
