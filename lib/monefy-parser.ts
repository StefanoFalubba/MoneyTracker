export interface MonefyRow {
  date: string       // ISO format: yyyy-MM-dd
  account: string
  category: string
  amount: number     // positive = income, negative = expense
  currency: string
  description: string
  rawAmount: string
}

export interface ParsedRow {
  date: string
  account: string
  category: string
  amount: number
  absAmount: number
  suggestedType: 'income' | 'expense'
  currency: string
  description: string
}

export interface ParseResult {
  valid: ParsedRow[]
  skipped: { row: number; reason: string }[]
}

const TRANSFER_KEYWORDS = [
  'transfer',
  'trasferimento',
  'internal transfer',
  'savings',
  'savings account',
]

function parseAmount(raw: string): number {
  // Handle both comma and dot as decimal separator
  const cleaned = raw.trim().replace(/\s/g, '').replace(',', '.')
  const val = parseFloat(cleaned)
  return isNaN(val) ? 0 : val
}

function parseDate(raw: string): string | null {
  // Monefy format: dd/MM/yyyy
  const parts = raw.trim().split('/')
  if (parts.length !== 3) return null
  const [day, month, year] = parts
  if (!day || !month || !year) return null
  const d = parseInt(day, 10)
  const m = parseInt(month, 10)
  const y = parseInt(year, 10)
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null
  const paddedD = String(d).padStart(2, '0')
  const paddedM = String(m).padStart(2, '0')
  return `${y}-${paddedM}-${paddedD}`
}

function isTransfer(category: string): boolean {
  const lower = category.toLowerCase().trim()
  return TRANSFER_KEYWORDS.some((kw) => lower.includes(kw))
}

export function parseMonefyCSV(content: string): ParseResult {
  const valid: ParsedRow[] = []
  const skipped: { row: number; reason: string }[] = []

  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length === 0) {
    return { valid, skipped }
  }

  // Skip header row (row index 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const rowNum = i + 1 // 1-based for human display

    // Split on semicolon
    const cols = line.split(';')

    if (cols.length < 5) {
      skipped.push({ row: rowNum, reason: 'Formato riga non valido (meno di 5 colonne)' })
      continue
    }

    const rawDate = cols[0] ?? ''
    const account = (cols[1] ?? '').trim()
    const category = (cols[2] ?? '').trim()
    const rawAmount = (cols[3] ?? '').trim()
    const currency = (cols[4] ?? '').trim()
    const description = (cols[7] ?? '').trim()

    // Skip transfers
    if (isTransfer(category)) {
      skipped.push({ row: rowNum, reason: `Trasferimento tra conti ignorato (categoria: ${category})` })
      continue
    }

    // Parse date
    const date = parseDate(rawDate)
    if (!date) {
      skipped.push({ row: rowNum, reason: `Data non valida: "${rawDate}"` })
      continue
    }

    // Parse amount
    const amount = parseAmount(rawAmount)
    if (amount === 0) {
      skipped.push({ row: rowNum, reason: `Importo non valido o zero: "${rawAmount}"` })
      continue
    }

    const absAmount = Math.abs(amount)
    const suggestedType: 'income' | 'expense' = amount > 0 ? 'income' : 'expense'

    valid.push({
      date,
      account,
      category,
      amount,
      absAmount,
      suggestedType,
      currency,
      description,
    })
  }

  return { valid, skipped }
}

export function getUniqueMonefyCategories(rows: ParsedRow[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const row of rows) {
    if (!seen.has(row.category)) {
      seen.add(row.category)
      result.push(row.category)
    }
  }
  return result
}
