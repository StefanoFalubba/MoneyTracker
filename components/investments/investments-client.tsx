'use client'

import { useState, useMemo } from 'react'
import { format, getYear } from 'date-fns'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Transaction, Category } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const COLORS = ['#7F77DD', '#534AB7', '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']

interface Props {
  transactions: (Transaction & { category: Category | null })[]
  categories: Category[]
  userId: string
}

export function InvestmentsClient({ transactions, categories }: Props) {
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const currentYear = getYear(new Date())

  const totalAllTime = useMemo(
    () => transactions.reduce((s, t) => s + Number(t.amount), 0),
    [transactions]
  )

  const totalThisYear = useMemo(
    () =>
      transactions
        .filter((t) => t.date.startsWith(String(currentYear)))
        .reduce((s, t) => s + Number(t.amount), 0),
    [transactions, currentYear]
  )

  // Donut chart data (all time)
  const donutData = useMemo(() => {
    const byCat: Record<string, number> = {}
    for (const t of transactions) {
      const key = t.category?.name ?? 'Altro'
      byCat[key] = (byCat[key] ?? 0) + Number(t.amount)
    }
    return Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  // Allocation table
  const allocationTable = useMemo(() => {
    return donutData.map((d) => ({
      ...d,
      pct: totalAllTime > 0 ? ((d.value / totalAllTime) * 100).toFixed(1) : '0',
    }))
  }, [donutData, totalAllTime])

  // Filtered list
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterCategory !== 'all' && t.category_id !== filterCategory) return false
      if (filterDateFrom && t.date < filterDateFrom) return false
      if (filterDateTo && t.date > filterDateTo) return false
      return true
    })
  }, [transactions, filterCategory, filterDateFrom, filterDateTo])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Investimenti</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-[#7F77DD]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totale investito (sempre)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ color: '#534AB7' }}>
              → {formatCurrency(totalAllTime)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#7F77DD]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Investito nel {currentYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ color: '#534AB7' }}>
              → {formatCurrency(totalThisYear)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuzione investimenti</CardTitle>
          </CardHeader>
          <CardContent>
            {donutData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Nessun investimento
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Allocation table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Allocazione portafoglio</CardTitle>
          </CardHeader>
          <CardContent>
            {allocationTable.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Nessun dato
              </div>
            ) : (
              <div className="space-y-2">
                {allocationTable.map((row, i) => (
                  <div key={row.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{row.name}</span>
                        <span className="font-medium ml-2">{row.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full mt-1">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${row.pct}%`,
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatCurrency(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              value={filterCategory}
              onValueChange={setFilterCategory}
            >
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
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
            <Input
              type="date"
              placeholder="A"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {filtered.length} investiment{filtered.length === 1 ? 'o' : 'i'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-muted-foreground">Nessun investimento trovato</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 px-6 py-4 border-l-2 border-l-[#7F77DD] hover:bg-muted/30 transition-colors"
                >
                  <span className="text-xl hidden sm:block">{t.category?.icon ?? '📊'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {t.description ?? t.category?.name ?? '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatDate(t.date)}</span>
                      <Badge variant="investment">investimento</Badge>
                      {t.category && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {t.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#534AB7] whitespace-nowrap">
                    → {formatCurrency(Number(t.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
