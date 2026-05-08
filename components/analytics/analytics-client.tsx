'use client'

import { useMemo, useState } from 'react'
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  differenceInDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  parseISO,
  isWithinInterval,
} from 'date-fns'
import { it } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import type { Transaction, Category, Subcategory, TransactionType } from '@/types/database'
import { formatCurrency, TYPE_CONFIG } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'

type Tx = Transaction & { category: Category | null; subcategory: Subcategory | null }
type AccountFilter = 'all' | 'personal' | 'business'
type DatePreset =
  | 'today'
  | 'week'
  | 'month'
  | 'last30'
  | 'last90'
  | 'year'
  | 'last12'
  | 'all'
  | 'custom'

interface Props {
  transactions: Tx[]
  categories: Category[]
  subcategories: Subcategory[]
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#84cc16',
  '#a855f7', '#14b8a6', '#facc15', '#fb7185', '#6366f1',
]

export function AnalyticsClient({ transactions, categories, subcategories }: Props) {
  // FILTERS STATE
  const [datePreset, setDatePreset] = useState<DatePreset>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('expense')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all')
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(true)

  // Compute date range from preset
  const { dateFrom, dateTo, prevFrom, prevTo, rangeLabel } = useMemo(() => {
    const now = new Date()
    let from: Date
    let to: Date = endOfDay(now)
    let label: string

    switch (datePreset) {
      case 'today':
        from = startOfDay(now)
        label = 'Oggi'
        break
      case 'week':
        from = startOfWeek(now, { weekStartsOn: 1 })
        to = endOfWeek(now, { weekStartsOn: 1 })
        label = 'Questa settimana'
        break
      case 'month':
        from = startOfMonth(now)
        to = endOfMonth(now)
        label = format(now, 'MMMM yyyy', { locale: it })
        break
      case 'last30':
        from = startOfDay(subDays(now, 29))
        label = 'Ultimi 30 giorni'
        break
      case 'last90':
        from = startOfDay(subDays(now, 89))
        label = 'Ultimi 90 giorni'
        break
      case 'year':
        from = startOfYear(now)
        to = endOfYear(now)
        label = `Anno ${format(now, 'yyyy')}`
        break
      case 'last12':
        from = startOfMonth(subMonths(now, 11))
        label = 'Ultimi 12 mesi'
        break
      case 'all':
        from = new Date(2000, 0, 1)
        label = 'Tutto il periodo'
        break
      case 'custom':
        from = customFrom ? startOfDay(parseISO(customFrom)) : startOfDay(subDays(now, 30))
        to = customTo ? endOfDay(parseISO(customTo)) : endOfDay(now)
        label = `${format(from, 'd MMM yyyy', { locale: it })} – ${format(to, 'd MMM yyyy', { locale: it })}`
        break
      default:
        from = startOfMonth(now)
        to = endOfMonth(now)
        label = format(now, 'MMMM yyyy', { locale: it })
    }

    // Previous comparable period
    const days = differenceInDays(to, from) + 1
    const prevTo = endOfDay(subDays(from, 1))
    const prevFrom = startOfDay(subDays(from, days))

    return { dateFrom: from, dateTo: to, prevFrom, prevTo, rangeLabel: label }
  }, [datePreset, customFrom, customTo])

  // FILTER TRANSACTIONS
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const txDate = parseISO(t.date)
      if (!isWithinInterval(txDate, { start: dateFrom, end: dateTo })) return false
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (categoryFilter !== 'all' && t.category_id !== categoryFilter) return false
      if (subcategoryFilter !== 'all' && t.subcategory_id !== subcategoryFilter) return false
      if (accountFilter === 'business' && !t.is_business) return false
      if (accountFilter === 'personal' && t.is_business) return false
      const amount = Number(t.amount)
      if (minAmount && amount < Number(minAmount)) return false
      if (maxAmount && amount > Number(maxAmount)) return false
      if (search) {
        const q = search.toLowerCase()
        const haystack = `${t.description ?? ''} ${t.category?.name ?? ''} ${t.subcategory?.name ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [
    transactions, dateFrom, dateTo, typeFilter, categoryFilter,
    subcategoryFilter, accountFilter, minAmount, maxAmount, search,
  ])

  // Previous period transactions (for comparison) - with same filters but date range
  const prevFiltered = useMemo(() => {
    return transactions.filter((t) => {
      const txDate = parseISO(t.date)
      if (!isWithinInterval(txDate, { start: prevFrom, end: prevTo })) return false
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (categoryFilter !== 'all' && t.category_id !== categoryFilter) return false
      if (subcategoryFilter !== 'all' && t.subcategory_id !== subcategoryFilter) return false
      if (accountFilter === 'business' && !t.is_business) return false
      if (accountFilter === 'personal' && t.is_business) return false
      return true
    })
  }, [transactions, prevFrom, prevTo, typeFilter, categoryFilter, subcategoryFilter, accountFilter])

  // KPI
  const kpi = useMemo(() => {
    const total = filtered.reduce((s, t) => s + Number(t.amount), 0)
    const count = filtered.length
    const days = Math.max(1, differenceInDays(dateTo, dateFrom) + 1)
    const avgPerDay = total / days
    const max = filtered.reduce((m, t) => Math.max(m, Number(t.amount)), 0)
    const min = filtered.length > 0 ? filtered.reduce((m, t) => Math.min(m, Number(t.amount)), Infinity) : 0
    const avg = count > 0 ? total / count : 0

    const prevTotal = prevFiltered.reduce((s, t) => s + Number(t.amount), 0)
    const variation = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0
    const variationAbs = total - prevTotal

    return { total, count, avgPerDay, max, min, avg, prevTotal, variation, variationAbs }
  }, [filtered, prevFiltered, dateFrom, dateTo])

  // TIME SERIES (daily or monthly based on range)
  const timeSeries = useMemo(() => {
    const days = differenceInDays(dateTo, dateFrom) + 1
    const useMonthly = days > 90

    if (useMonthly) {
      const months = eachMonthOfInterval({ start: dateFrom, end: dateTo })
      return months.map((m) => {
        const monthStart = startOfMonth(m)
        const monthEnd = endOfMonth(m)
        const txs = filtered.filter((t) => {
          const d = parseISO(t.date)
          return isWithinInterval(d, { start: monthStart, end: monthEnd })
        })
        return {
          date: format(m, 'MMM yy', { locale: it }),
          totale: txs.reduce((s, t) => s + Number(t.amount), 0),
          conteggio: txs.length,
        }
      })
    } else {
      const allDays = eachDayOfInterval({ start: dateFrom, end: dateTo })
      return allDays.map((d) => {
        const dayStr = format(d, 'yyyy-MM-dd')
        const txs = filtered.filter((t) => t.date === dayStr)
        return {
          date: format(d, days <= 31 ? 'd MMM' : 'd MMM', { locale: it }),
          totale: txs.reduce((s, t) => s + Number(t.amount), 0),
          conteggio: txs.length,
        }
      })
    }
  }, [filtered, dateFrom, dateTo])

  // CATEGORY BREAKDOWN
  const byCategory = useMemo(() => {
    const map: Record<string, { name: string; icon: string; value: number; count: number }> = {}
    for (const t of filtered) {
      const key = t.category_id ?? 'none'
      const name = t.category?.name ?? 'Senza categoria'
      const icon = t.category?.icon ?? '❓'
      if (!map[key]) map[key] = { name, icon, value: 0, count: 0 }
      map[key].value += Number(t.amount)
      map[key].count += 1
    }
    return Object.values(map).sort((a, b) => b.value - a.value)
  }, [filtered])

  // SUBCATEGORY BREAKDOWN (when single category selected)
  const bySubcategory = useMemo(() => {
    if (categoryFilter === 'all') return []
    const map: Record<string, { name: string; icon: string; value: number; count: number }> = {}
    for (const t of filtered) {
      const key = t.subcategory_id ?? 'none'
      const name = t.subcategory?.name ?? 'Senza sottocategoria'
      const icon = t.subcategory?.icon ?? '•'
      if (!map[key]) map[key] = { name, icon, value: 0, count: 0 }
      map[key].value += Number(t.amount)
      map[key].count += 1
    }
    return Object.values(map).sort((a, b) => b.value - a.value)
  }, [filtered, categoryFilter])

  // TOP TRANSACTIONS
  const topTransactions = useMemo(() => {
    return [...filtered]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 10)
  }, [filtered])

  // EXPORT CSV
  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Categoria', 'Sottocategoria', 'Descrizione', 'Importo', 'P.IVA']
    const rows = filtered.map((t) => [
      t.date,
      TYPE_CONFIG[t.type].label,
      t.category?.name ?? '',
      t.subcategory?.name ?? '',
      (t.description ?? '').replace(/"/g, '""'),
      Number(t.amount).toFixed(2),
      t.is_business ? 'Sì' : 'No',
    ])
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analisi_${format(dateFrom, 'yyyy-MM-dd')}_${format(dateTo, 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredSubcats = subcategories.filter((s) => s.category_id === categoryFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Analisi</h1>
          <p className="text-muted-foreground capitalize text-sm">{rangeLabel}</p>
        </div>
        <Button onClick={exportCSV} variant="outline" disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Esporta CSV
        </Button>
      </div>

      {/* Date preset pills */}
      <div className="flex flex-wrap gap-2">
        {([
          ['today', 'Oggi'],
          ['week', 'Settimana'],
          ['month', 'Mese'],
          ['last30', '30 giorni'],
          ['last90', '90 giorni'],
          ['year', 'Anno'],
          ['last12', '12 mesi'],
          ['all', 'Tutto'],
          ['custom', '🗓 Personalizzato'],
        ] as [DatePreset, string][]).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setDatePreset(k)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              datePreset === k
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground hover:bg-muted border-border'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom range */}
      {datePreset === 'custom' && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Da</Label>
                <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">A</Label>
                <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3 cursor-pointer" onClick={() => setFiltersOpen(!filtersOpen)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Filtri avanzati</CardTitle>
            {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {filtersOpen && (
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Type */}
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TransactionType | 'all')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="expense">Spese</SelectItem>
                    <SelectItem value="income">Entrate</SelectItem>
                    <SelectItem value="investment">Investimenti</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={(v) => {
                    setCategoryFilter(v)
                    setSubcategoryFilter('all')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte</SelectItem>
                    {categories
                      .filter((c) => typeFilter === 'all' || c.type === typeFilter)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory */}
              {categoryFilter !== 'all' && filteredSubcats.length > 0 && (
                <div>
                  <Label className="text-xs">Sottocategoria</Label>
                  <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte</SelectItem>
                      {filteredSubcats.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.icon} {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Account */}
              <div>
                <Label className="text-xs">Conto</Label>
                <Select value={accountFilter} onValueChange={(v) => setAccountFilter(v as AccountFilter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌐 Globale</SelectItem>
                    <SelectItem value="personal">👤 Personale</SelectItem>
                    <SelectItem value="business">💼 P.IVA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount min */}
              <div>
                <Label className="text-xs">Importo min (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>

              {/* Amount max */}
              <div>
                <Label className="text-xs">Importo max (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="∞"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>

              {/* Search */}
              <div className="lg:col-span-3">
                <Label className="text-xs">Cerca per descrizione, categoria...</Label>
                <Input
                  placeholder="Es: Netflix, cena, Amazon..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {(typeFilter !== 'all' || categoryFilter !== 'all' || subcategoryFilter !== 'all' ||
              accountFilter !== 'all' || minAmount || maxAmount || search) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTypeFilter('all')
                  setCategoryFilter('all')
                  setSubcategoryFilter('all')
                  setAccountFilter('all')
                  setMinAmount('')
                  setMaxAmount('')
                  setSearch('')
                }}
              >
                Resetta filtri
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(kpi.total)}</p>
            <div className="flex items-center gap-1 mt-1">
              {kpi.variation > 0 ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : kpi.variation < 0 ? (
                <TrendingDown className="h-3 w-3 text-green-500" />
              ) : (
                <Minus className="h-3 w-3 text-muted-foreground" />
              )}
              <span
                className={`text-xs ${
                  typeFilter === 'expense'
                    ? kpi.variation > 0 ? 'text-red-500' : kpi.variation < 0 ? 'text-green-500' : 'text-muted-foreground'
                    : kpi.variation > 0 ? 'text-green-500' : kpi.variation < 0 ? 'text-red-500' : 'text-muted-foreground'
                }`}
              >
                {kpi.variation > 0 ? '+' : ''}{kpi.variation.toFixed(1)}% vs prec.
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Transazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpi.count}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Media: {formatCurrency(kpi.avg)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Media giornaliera</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(kpi.avgPerDay)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              su {differenceInDays(dateTo, dateFrom) + 1} giorni
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Massimo singolo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(kpi.max)}</p>
            {kpi.count > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Min: {formatCurrency(kpi.min)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time series */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Nessun dato per il periodo selezionato
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(v) => `€${v}`} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'totale' ? formatCurrency(value) : value
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totale"
                    name="Totale €"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuzione per categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Nessun dato
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={byCategory}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) =>
                      percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                    }
                    labelLine={false}
                  >
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top categories bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top categorie</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Nessun dato
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byCategory.slice(0, 8)} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `€${v}`} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subcategory breakdown if filtering by category */}
      {bySubcategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dettaglio sottocategorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bySubcategory.map((s, i) => {
                const pct = kpi.total > 0 ? (s.value / kpi.total) * 100 : 0
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-lg">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{s.name}</span>
                        <span className="text-sm font-semibold">{formatCurrency(s.value)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-muted rounded-full flex-1 overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {s.count} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 10 transazioni</CardTitle>
        </CardHeader>
        <CardContent>
          {topTransactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nessuna transazione nel periodo
            </div>
          ) : (
            <div className="divide-y">
              {topTransactions.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 py-2">
                  <span className="text-xs text-muted-foreground w-6">#{i + 1}</span>
                  <span className="text-lg">{t.category?.icon ?? '💰'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {t.description ?? t.category?.name ?? '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(t.date), 'd MMM yyyy', { locale: it })}
                      </span>
                      <Badge
                        variant={
                          t.type === 'income' ? 'income' : t.type === 'expense' ? 'expense' : 'investment'
                        }
                      >
                        {TYPE_CONFIG[t.type].label}
                      </Badge>
                      {t.is_business && (
                        <Badge variant="outline" className="text-xs bg-blue-50 border-blue-300 text-blue-900">
                          💼
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {formatCurrency(Number(t.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full filtered list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Tutte le transazioni filtrate ({filtered.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nessuna transazione corrisponde ai filtri</p>
            </div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filtered.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">{t.category?.icon ?? '💰'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {t.description ?? t.category?.name ?? '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(t.date), 'd MMM yyyy', { locale: it })}
                      </span>
                      {t.subcategory && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {t.subcategory.icon} {t.subcategory.name}
                        </span>
                      )}
                      {t.is_business && (
                        <Badge variant="outline" className="text-xs bg-blue-50 border-blue-300 text-blue-900">
                          💼
                        </Badge>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
