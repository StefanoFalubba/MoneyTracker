import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import type { TransactionType } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr)
    return format(date, 'dd/MM/yyyy', { locale: it })
  } catch {
    return dateStr
  }
}

export function formatMonthYear(dateStr: string): string {
  try {
    const date = parseISO(dateStr + '-01')
    return format(date, 'MMM yyyy', { locale: it })
  } catch {
    return dateStr
  }
}

export const TYPE_CONFIG: Record<
  TransactionType,
  { label: string; color: string; bgColor: string; textColor: string; symbol: string; borderColor: string }
> = {
  income: {
    label: 'Entrata',
    color: '#22c55e',
    bgColor: 'bg-income-light',
    textColor: 'text-income-dark',
    symbol: '+',
    borderColor: 'border-income',
  },
  expense: {
    label: 'Spesa',
    color: '#ef4444',
    bgColor: 'bg-expense-light',
    textColor: 'text-expense-dark',
    symbol: '−',
    borderColor: 'border-expense',
  },
  investment: {
    label: 'Investimento',
    color: '#7F77DD',
    bgColor: 'bg-investment-light',
    textColor: 'text-investment-dark',
    symbol: '→',
    borderColor: 'border-investment',
  },
}

export function formatAmount(amount: number, type: TransactionType): string {
  const { symbol } = TYPE_CONFIG[type]
  return `${symbol} ${formatCurrency(amount)}`
}
