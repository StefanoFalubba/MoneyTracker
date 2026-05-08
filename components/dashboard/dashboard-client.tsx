'use client'

import { useMemo, useState } from 'react'
import { format, subMonths, addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { Transaction, Category, RecurringTransaction } from '@/types/database'
import { formatCurrency, formatDate, TYPE_CONFIG } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { QuickAddForm } from '@/components/quick-add/quick-add-form'
import { QuickAddFAB } from '@/components/quick-add/quick-add-fab'

interface Props {
  transactions: Transaction[]
  recentTransactions: (Transaction & { category: Category | null })[]
  categories: Category[]
  recurring: (RecurringTransaction & { category?: Category | null })[]
  monthStart: string
  monthEnd: string
  sixMonthsAgo: string
  currentMonthLabel: string
  userId: string
}

type AccountFilter = 'all' | 'personal' | 'business'

export function DashboardClient({
  transactions,
  recentTransactions,
  categories,
  recurring,
  monthStart,
  monthEnd,
  currentMonthLabel,
  userId,
}: Props) {
  const [reloadTrigger, setReloadTrigger] = useState(0)
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all')

  // Apply account filter to all transactions
  const filteredTransactions = useMemo(() => {
    if (accountFilter === 'all') return transactions
    if (accountFilter === 'business') return transactions.filter((t) => t.is_business)
    return transactions.filter((t) => !t.is_business)
  }, [transactions, accountFilter])

  // Monthly totals for the current month
  const monthlyTotals = useMemo(() => {
    const monthTxs = filteredTransactions.filter(
      (t) => t.date >= monthStart && t.date <= monthEnd
    )
    return {
      income: monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
      expense: monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
      investment: monthTxs.filter((t) => t.type === 'investment').reduce((s, t) => s + Number(t.amount), 0),
    }
  }, [filteredTransactions, monthStart, monthEnd])

  const netBalance = monthlyTotals.income - monthlyTotals.expense

  // Bar chart data: last 6 months
  const barData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i)
      const key = format(month, 'yyyy-MM')
      const label = format(month, 'MMM', { locale: it })
      const monthTxs = filteredTransactions.filter((t) => t.date.startsWith(key))
      return {
        month: label,
        Entrate: monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
        Spese: monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
        Investimenti: monthTxs.filter((t) => t.type === 'investment').reduce((s, t) => s + Number(t.amount), 0),
      }
    })
  }, [filteredTransactions])

  // Expense pie data for current month
  const expensePieData = useMemo(() => {
    const monthTxs = filteredTransactions.filter(
      (t) => t.date >= monthStart && t.date <= monthEnd && t.type === 'expense'
    )
    const byCat: Record<string, number> = {}
    for (const t of monthTxs) {
      const cat = categories.find((c) => c.id === t.category_id)
      const key = cat?.name ?? 'Altro'
      byCat[key] = (byCat[key] ?? 0) + Number(t.amount)
    }
    return Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredTransactions, categories, monthStart, monthEnd])

  // Investment donut data
  const investmentDonutData = useMemo(() => {
    const monthTxs = filteredTransactions.filter(
      (t) => t.date >= monthStart && t.date <= monthEnd && t.type === 'investment'
    )
    const byCat: Record<string, number> = {}
    for (const t of monthTxs) {
      const cat = categories.find((c) => c.id === t.category_id)
      const key = cat?.name ?? 'Altro'
      byCat[key] = (byCat[key] ?? 0) + Number(t.amount)
    }
    return Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredTransactions, categories, monthStart, monthEnd])

  const EXPENSE_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#ec4899', '#f43f5e',
    '#a855f7', '#06b6d4', '#3b82f6', '#dc2626', '#84cc16',
  ]
  const INVESTMENT_COLORS = [
    '#7F77DD', '#534AB7', '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd',
  ]

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground capitalize">{currentMonthLabel}</p>
          </div>

          {/* Account filter */}
          <div className="flex gap-1 p-1 bg-muted rounded-md">
            {(['all', 'personal', 'business'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setAccountFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  accountFilter === f
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? '🌐 Globale' : f === 'personal' ? '👤 Personale' : '💼 P.IVA'}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Add Form - Desktop Only */}
        <div className="hidden md:block">
          <QuickAddForm
            categories={categories}
            userId={userId}
            onSuccess={() => setReloadTrigger(r => r + 1)}
          />
        </div>

        {/* Quick Add FAB - Mobile Only */}
        <QuickAddFAB
          categories={categories}
          userId={userId}
          onSuccess={() => setReloadTrigger(r => r + 1)}
        />

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Income */}
          <Card className="border-l-4 border-l-income">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Entrate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-income-dark">
                + {formatCurrency(monthlyTotals.income)}
              </p>
            </CardContent>
          </Card>

          {/* Expense */}
          <Card className="border-l-4 border-l-expense">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Spese</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-expense-dark">
                − {formatCurrency(monthlyTotals.expense)}
              </p>
            </CardContent>
          </Card>

          {/* Investment */}
          <Card className="border-l-4 border-l-[#7F77DD]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                Investito
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      non è una spesa — i soldi restano tuoi
                    </p>
                  </TooltipContent>
                </UITooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" style={{ color: '#534AB7' }}>
                → {formatCurrency(monthlyTotals.investment)}
              </p>
            </CardContent>
          </Card>

          {/* Net balance */}
          <Card className="border-l-4 border-l-slate-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo netto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  netBalance >= 0 ? 'text-income-dark' : 'text-expense-dark'
                }`}
              >
                {netBalance >= 0 ? '+ ' : '− '}
                {formatCurrency(Math.abs(netBalance))}
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground -mt-4">
          Il saldo netto non include gli investimenti.
        </p>

        {/* Prossime ricorrenze */}
        {recurring.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prossime ricorrenze</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recurring.slice(0, 5).map((r) => {
                  const lastDate = r.last_executed_date ? new Date(r.last_executed_date) : new Date(r.start_date)
                  let nextDate = lastDate

                  switch (r.frequency) {
                    case 'daily':
                      nextDate = addDays(lastDate, 1)
                      break
                    case 'weekly':
                      nextDate = addWeeks(lastDate, 1)
                      break
                    case 'biweekly':
                      nextDate = addWeeks(lastDate, 2)
                      break
                    case 'monthly':
                      nextDate = addMonths(lastDate, 1)
                      break
                    case 'quarterly':
                      nextDate = addQuarters(lastDate, 1)
                      break
                    case 'yearly':
                      nextDate = addYears(lastDate, 1)
                      break
                  }

                  return (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{r.category?.icon ?? '💰'}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{format(nextDate, 'd MMM', { locale: it })}</p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-semibold whitespace-nowrap ml-2 ${
                          r.type === 'income'
                            ? 'text-income-dark'
                            : r.type === 'expense'
                            ? 'text-expense-dark'
                            : 'text-[#534AB7]'
                        }`}
                      >
                        {r.type === 'investment' ? '→ ' : r.type === 'income' ? '+ ' : '− '}
                        {formatCurrency(Number(r.amount))}
                      </span>
                    </div>
                  )
                })}
                {recurring.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    <a href="/recurring" className="text-blue-600 hover:underline">
                      Visualizza tutte le {recurring.length} ricorrenze
                    </a>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Ultimi 6 mesi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `€${v}`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(l) => l}
                  />
                  <Legend />
                  <Bar dataKey="Entrate" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Spese" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Investimenti" fill="#7F77DD" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spese per categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {expensePieData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  Nessuna spesa questo mese
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {expensePieData.map((_, i) => (
                        <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Investment donut */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Investimenti per categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {investmentDonutData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  Nessun investimento questo mese
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={investmentDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {investmentDonutData.map((_, i) => (
                        <Cell key={i} fill={INVESTMENT_COLORS[i % INVESTMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transazioni recenti</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">💸</div>
                <p className="text-muted-foreground">Nessuna transazione ancora.</p>
                <p className="text-sm text-muted-foreground">
                  Aggiungi la tua prima transazione dalla pagina Transazioni.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {recentTransactions.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between py-3 ${
                      t.type === 'investment' ? 'border-l-2 border-l-[#7F77DD] pl-3' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg">{t.category?.icon ?? '💰'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {t.description ?? t.category?.name ?? '—'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{formatDate(t.date)}</span>
                          <Badge
                            variant={
                              t.type === 'income'
                                ? 'income'
                                : t.type === 'expense'
                                ? 'expense'
                                : 'investment'
                            }
                          >
                            {TYPE_CONFIG[t.type].label}
                          </Badge>
                          {t.category && (
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              {t.category.name}
                            </span>
                          )}
                          {t.is_business && (
                            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-300 text-blue-900">
                              💼 P.IVA
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold ml-2 whitespace-nowrap ${
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
