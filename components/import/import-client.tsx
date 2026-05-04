'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { parseMonefyCSV, getUniqueMonefyCategories } from '@/lib/monefy-parser'
import type { ParsedRow } from '@/lib/monefy-parser'
import type { Category, TransactionType } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Upload, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react'

type Step = 1 | 2 | 3 | 4


interface CategoryMapping {
  monefyCategory: string
  targetCategoryId: string | null   // null = create new
  newCategoryName: string
  newCategoryType: TransactionType
}

interface Props {
  categories: Category[]
  userId: string
}

export function ImportClient({ categories, userId }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [skippedRows, setSkippedRows] = useState<{ row: number; reason: string }[]>([])
  const [mappings, setMappings] = useState<CategoryMapping[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    imported: number
    skippedDuplicates: number
  } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  function processFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const result = parseMonefyCSV(content)
      setParsedRows(result.valid)
      setSkippedRows(result.skipped)

      const uniqueCats = getUniqueMonefyCategories(result.valid)
      setMappings(
        uniqueCats.map((cat) => {
          const suggestedType = result.valid.find((r) => r.category === cat)?.suggestedType ?? 'expense'
          return {
            monefyCategory: cat,
            targetCategoryId: null,
            newCategoryName: cat,
            newCategoryType: suggestedType,
          }
        })
      )
      setStep(2)
    }
    reader.readAsText(file, 'utf-8')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function updateMapping(index: number, patch: Partial<CategoryMapping>) {
    setMappings((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)))
  }

  async function handleImport() {
    setImporting(true)
    const supabase = createClient()

    // Create any new categories first
    const catIdMap: Record<string, string> = {}

    for (const mapping of mappings) {
      if (mapping.targetCategoryId) {
        catIdMap[mapping.monefyCategory] = mapping.targetCategoryId
      } else {
        // Create new category
        const { data, error } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: mapping.newCategoryName || mapping.monefyCategory,
            type: mapping.newCategoryType,
            icon: null,
            color: null,
          })
          .select()
          .single()

        if (error || !data) {
          toast.error(`Errore creando categoria: ${mapping.monefyCategory}`)
          setImporting(false)
          return
        }
        catIdMap[mapping.monefyCategory] = data.id
      }
    }

    // Fetch existing transactions to detect duplicates
    const { data: existing } = await supabase
      .from('transactions')
      .select('date, amount, description, category_id')
      .eq('user_id', userId)

    const existingSet = new Set(
      (existing ?? []).map(
        (t) => `${t.date}|${t.amount}|${t.description ?? ''}|${t.category_id ?? ''}`
      )
    )

    let imported = 0
    let skippedDuplicates = 0

    const toInsert = []

    for (const row of parsedRows) {
      const catId = catIdMap[row.category] ?? null
      const type: TransactionType =
        mappings.find((m) => m.monefyCategory === row.category)?.newCategoryType ??
        row.suggestedType

      const key = `${row.date}|${row.absAmount}|${row.description}|${catId ?? ''}`
      if (existingSet.has(key)) {
        skippedDuplicates++
        continue
      }

      toInsert.push({
        user_id: userId,
        category_id: catId,
        amount: row.absAmount,
        type,
        description: row.description || null,
        date: row.date,
      })
    }

    // Batch insert in chunks of 100
    for (let i = 0; i < toInsert.length; i += 100) {
      const chunk = toInsert.slice(i, i + 100)
      const { error } = await supabase.from('transactions').insert(chunk)
      if (error) {
        toast.error('Errore durante l\'importazione')
        setImporting(false)
        return
      }
      imported += chunk.length
    }

    setImportResult({ imported, skippedDuplicates })
    setImporting(false)
    setStep(4)
    toast.success(`${imported} transazioni importate!`)
  }

  const dateRange = parsedRows.length > 0
    ? {
        from: parsedRows.reduce((min, r) => (r.date < min ? r.date : min), parsedRows[0].date),
        to: parsedRows.reduce((max, r) => (r.date > max ? r.date : max), parsedRows[0].date),
      }
    : null

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Importa da Monefy</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Importa le tue transazioni da un file CSV esportato da Monefy
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : step > s
                  ? 'bg-income text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {s < 4 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
        <div className="ml-2 text-muted-foreground">
          {step === 1 && 'Carica file'}
          {step === 2 && 'Anteprima'}
          {step === 3 && 'Mappa categorie'}
          {step === 4 && 'Completato'}
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card>
          <CardContent className="pt-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">Trascina il file CSV qui</p>
              <p className="text-xs text-muted-foreground mb-4">oppure clicca per selezionarlo</p>
              <label className="cursor-pointer">
                <Button asChild variant="outline">
                  <span>Scegli file CSV</span>
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground font-medium mb-1">Formato atteso (Monefy):</p>
              <code className="text-xs text-muted-foreground">
                date;account;category;amount;currency;converted amount;currency;description
              </code>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Anteprima — {parsedRows.length} righe valide, {skippedRows.length} saltate
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2 text-left font-medium">Data</th>
                      <th className="px-4 py-2 text-left font-medium">Categoria</th>
                      <th className="px-4 py-2 text-left font-medium">Descrizione</th>
                      <th className="px-4 py-2 text-right font-medium">Importo</th>
                      <th className="px-4 py-2 text-left font-medium">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-2">{formatDate(row.date)}</td>
                        <td className="px-4 py-2">{row.category}</td>
                        <td className="px-4 py-2 text-muted-foreground">{row.description || '—'}</td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(row.absAmount)}
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant={row.suggestedType === 'income' ? 'income' : 'expense'}>
                            {row.suggestedType === 'income' ? 'Entrata' : 'Spesa'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedRows.length > 10 && (
                  <p className="text-xs text-muted-foreground px-4 py-2">
                    e altri {parsedRows.length - 10} righe...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {skippedRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Righe saltate ({skippedRows.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {skippedRows.map((s, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      Riga {s.row}: {s.reason}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStep(1)}>Indietro</Button>
            <Button onClick={() => setStep(3)}>
              Continua — mappa categorie
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Category mapping */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Mappa le {mappings.length} categorie Monefy
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Per ogni categoria, scegli una categoria esistente o creane una nuova
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {mappings.map((m, i) => (
                <div key={m.monefyCategory} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{m.monefyCategory}</span>
                    <Badge variant={m.newCategoryType === 'income' ? 'income' : m.newCategoryType === 'expense' ? 'expense' : 'investment'} className="text-xs">
                      {parsedRows.filter((r) => r.category === m.monefyCategory).length} righe
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Categoria esistente (opzionale)</Label>
                      <Select
                        value={m.targetCategoryId ?? '__new__'}
                        onValueChange={(v) =>
                          updateMapping(i, {
                            targetCategoryId: v === '__new__' ? null : v,
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Crea nuova" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__new__">+ Crea nuova categoria</SelectItem>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.icon} {c.name} ({c.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {!m.targetCategoryId && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">Nome nuova categoria</Label>
                          <Input
                            className="h-8 text-xs"
                            value={m.newCategoryName}
                            onChange={(e) => updateMapping(i, { newCategoryName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-xs">Tipo</Label>
                          <div className="flex gap-2">
                            {(['income', 'expense', 'investment'] as TransactionType[]).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => updateMapping(i, { newCategoryType: t })}
                                className={`flex-1 py-1 text-xs rounded border transition-colors ${
                                  m.newCategoryType === t
                                    ? t === 'income'
                                      ? 'bg-income-light text-income-dark border-income'
                                      : t === 'expense'
                                      ? 'bg-expense-light text-expense-dark border-expense'
                                      : 'bg-investment-light text-[#534AB7] border-[#7F77DD]'
                                    : 'bg-muted text-muted-foreground border-transparent'
                                }`}
                              >
                                {t === 'income' ? 'Entrata' : t === 'expense' ? 'Spesa' : 'Investimento'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStep(2)}>Indietro</Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? 'Importazione...' : `Importa ${parsedRows.length} transazioni`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && importResult && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-income" />
            <h2 className="text-xl font-semibold">Importazione completata!</h2>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <p className="text-2xl font-bold text-income-dark">{importResult.imported}</p>
                <p className="text-muted-foreground">transazioni importate</p>
              </div>
              {importResult.skippedDuplicates > 0 && (
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {importResult.skippedDuplicates}
                  </p>
                  <p className="text-muted-foreground">duplicati saltati</p>
                </div>
              )}
              {dateRange && (
                <div>
                  <p className="text-sm font-medium">
                    {formatDate(dateRange.from)} — {formatDate(dateRange.to)}
                  </p>
                  <p className="text-muted-foreground">intervallo date</p>
                </div>
              )}
            </div>
            <Button
              onClick={() => {
                setStep(1)
                setParsedRows([])
                setSkippedRows([])
                setMappings([])
                setImportResult(null)
              }}
            >
              Nuova importazione
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
