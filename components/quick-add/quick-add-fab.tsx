'use client'

import { useState } from 'react'
import type { Category } from '@/types/database'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { QuickAddForm } from './quick-add-form'
import { Zap } from 'lucide-react'

interface Props {
  categories: Category[]
  userId: string
  onSuccess?: () => void
}

export function QuickAddFAB({ categories, userId, onSuccess }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-all z-40 md:hidden bg-yellow-500 hover:bg-yellow-600 text-white animate-pulse"
          title="Aggiungi transazione velocemente"
        >
          <Zap className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Aggiungi veloce</SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          <QuickAddForm
            categories={categories}
            userId={userId}
            onSuccess={() => {
              setOpen(false)
              onSuccess?.()
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
