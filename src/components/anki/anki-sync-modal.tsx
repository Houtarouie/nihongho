'use client'

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Download, CheckCircle2, FileArchive } from 'lucide-react'
import {
  importAnkiDeckCards,
  type SRSCard,
} from '@/data/srs-deck'
import {
  exportToAnkiTSV,
  parseAnkiTSV,
  parseAnkiApkgBinary,
} from '@/lib/anki/importer'
import { toast } from 'sonner'

interface AnkiSyncModalProps {
  cards: SRSCard[]
  onCardsChanged: (next: SRSCard[]) => void
  onImportSuccess?: (deckName: string) => void
}

export function AnkiSyncPanel({
  cards,
  onCardsChanged,
  onImportSuccess,
}: AnkiSyncModalProps) {
  const [customDeckName, setCustomDeckName] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [lastImportedDeck, setLastImportedDeck] = useState<{
    name: string
    count: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const rawName =
      customDeckName.trim() ||
      file.name.replace(/\.(apkg|colpkg|txt|tsv|csv|json)$/i, '').trim() ||
      'Imported Deck'
    const fullDeckName = rawName.startsWith('Japanese::')
      ? rawName
      : `Japanese::${rawName}`

    try {
      if (/\.(apkg|colpkg)$/i.test(file.name)) {
        const parsedCards = await parseAnkiApkgBinary(file, fullDeckName)
        if (parsedCards.length === 0) {
          toast.error(
            'Could not find readable text cards in this .apkg file. Make sure it is a standard Anki 2.1 .apkg deck.'
          )
          setIsImporting(false)
          return
        }
        const { allCards, addedCount } = importAnkiDeckCards(
          fullDeckName,
          parsedCards
        )
        onCardsChanged(allCards)
        setLastImportedDeck({ name: fullDeckName, count: addedCount })
        toast.success(
          `Imported "${fullDeckName}" (${addedCount} cards with English translations)!`
        )
        if (onImportSuccess) onImportSuccess(fullDeckName)
      } else {
        const text = await file.text()
        const parsed = parseAnkiTSV(text, fullDeckName)
        if (parsed.length === 0) {
          toast.error('No valid cards found in this file.')
          setIsImporting(false)
          return
        }
        const { allCards, addedCount } = importAnkiDeckCards(
          fullDeckName,
          parsed
        )
        onCardsChanged(allCards)
        setLastImportedDeck({ name: fullDeckName, count: addedCount })
        toast.success(`Imported "${fullDeckName}" (${addedCount} cards)!`)
        if (onImportSuccess) onImportSuccess(fullDeckName)
      }
    } catch {
      toast.error('Failed to read deck file.')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleExportCollection() {
    const content = exportToAnkiTSV(cards)
    const blob = new Blob([content], {
      type: 'text/tab-separated-values;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nihongo-deck-export-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported your collection!')
  }

  return (
    <div className="max-w-xl mx-auto py-4">
      <Card>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1.5">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <FileArchive className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Import Anki Deck (.apkg)</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Select a pre-installed <code className="font-mono">.apkg</code>{' '}
              deck file from your computer to add it directly to your Decks.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="deck-name-override"
              className="text-xs font-medium text-muted-foreground"
            >
              Deck Name (Optional — uses file name automatically if left blank)
            </label>
            <Input
              id="deck-name-override"
              value={customDeckName}
              onChange={(e) => setCustomDeckName(e.target.value)}
              placeholder="e.g. Core 2K, N5 Vocab..."
            />
          </div>

          {/* Clean 1-Click .apkg Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40 p-8 text-center cursor-pointer transition-all space-y-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".apkg,.colpkg,.txt,.tsv,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="h-7 w-7 text-primary mx-auto" />
            <p className="text-sm font-semibold">
              {isImporting
                ? 'Extracting .apkg deck...'
                : 'Click to select your .apkg file'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports <code className="font-mono">.apkg</code>,{' '}
              <code className="font-mono">.colpkg</code>, and{' '}
              <code className="font-mono">.txt / .csv</code>
            </p>
          </div>

          {lastImportedDeck && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Imported <strong>{lastImportedDeck.name}</strong> (
                  {lastImportedDeck.count} cards)
                </span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>{cards.length} total cards in your collection</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleExportCollection}
              className="h-8 text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export Backup (.txt)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
