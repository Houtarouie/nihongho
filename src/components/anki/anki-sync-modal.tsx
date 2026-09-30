'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import {
  addCustomSRSCard,
  loadSRSCards,
  type SRSCard,
} from '@/data/srs-deck'
import { exportToAnkiTSV, parseAnkiTSV } from '@/lib/anki/importer'
import {
  pingAnkiConnect,
  pushCardsToAnkiConnect,
  pullCardsFromAnkiConnect,
} from '@/lib/anki/ankiconnect'
import { toast } from 'sonner'

interface AnkiSyncModalProps {
  cards: SRSCard[]
  onCardsChanged: (next: SRSCard[]) => void
}

export function AnkiSyncPanel({ cards, onCardsChanged }: AnkiSyncModalProps) {
  const [importText, setImportText] = useState('')
  const [ankiStatus, setAnkiStatus] = useState<{
    checked: boolean
    connected: boolean
    decks: string[]
    error?: string
  }>({ checked: false, connected: false, decks: [] })
  const [targetDeck, setTargetDeck] = useState('Nihongo::Japanese')
  const [isSyncing, setIsSyncing] = useState(false)

  function handleExportTSV() {
    const content = exportToAnkiTSV(cards)
    const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nihongo-anki-deck-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported Anki .txt deck file! Import it directly in Desktop Anki (File -> Import).')
  }

  function handleImportTSV() {
    if (!importText.trim()) {
      toast.error('Paste Anki TSV/CSV lines or upload a .txt file first.')
      return
    }
    const parsed = parseAnkiTSV(importText)
    if (parsed.length === 0) {
      toast.error('No valid tab- or comma-separated notes found.')
      return
    }
    let added = 0
    for (const item of parsed) {
      const res = addCustomSRSCard(item)
      if (res.added) added++
    }
    onCardsChanged(loadSRSCards())
    setImportText('')
    toast.success(`Imported ${parsed.length} notes (${added} new cards added)!`)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImportText(reader.result)
        toast.info(`Loaded "${file.name}". Click "Import Notes" to add to deck.`)
      }
    }
    reader.readAsText(file)
  }

  async function handleCheckAnkiConnect() {
    setIsSyncing(true)
    const status = await pingAnkiConnect()
    setAnkiStatus({ checked: true, ...status })
    setIsSyncing(false)
    if (status.connected) {
      toast.success(`Connected to Desktop Anki! Found ${status.decks.length} decks.`)
    } else {
      toast.error('Desktop Anki not detected on 127.0.0.1:8765.')
    }
  }

  async function handlePushToDesktopAnki() {
    setIsSyncing(true)
    try {
      const res = await pushCardsToAnkiConnect(targetDeck, cards)
      toast.success(
        `Pushed ${res.addedCount} new cards to Desktop Anki deck "${targetDeck}"!`
      )
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to push to AnkiConnect'
      )
    } finally {
      setIsSyncing(false)
    }
  }

  async function handlePullFromDesktopAnki() {
    setIsSyncing(true)
    try {
      const notes = await pullCardsFromAnkiConnect(targetDeck)
      if (notes.length === 0) {
        toast.info(`No notes found in Desktop Anki deck "${targetDeck}".`)
      } else {
        let added = 0
        for (const n of notes) {
          const res = addCustomSRSCard({
            front: n.front,
            reading: n.reading,
            meaning: n.meaning,
            category: 'vocabulary',
            jlptLevel: 'N5',
            deckName: `Japanese::${targetDeck}`,
            tags: n.tags,
          })
          if (res.added) added++
        }
        onCardsChanged(loadSRSCards())
        toast.success(`Pulled ${notes.length} notes (${added} new) from Desktop Anki!`)
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to pull from AnkiConnect'
      )
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 1. Anki File Import / Export (.txt / .tsv) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Anki Deck File Import &amp; Export (.txt / .tsv)
          </CardTitle>
          <CardDescription>
            Export your deck for Desktop Anki / AnkiDroid, or import any Anki Tab-Separated deck file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleExportTSV} className="w-full" variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export All {cards.length} Cards as Anki .txt
          </Button>

          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="anki-file">Upload Anki .txt / .tsv / .csv File</Label>
            <Input
              id="anki-file"
              type="file"
              accept=".txt,.tsv,.csv"
              onChange={handleFileUpload}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="anki-paste">
              Or Paste Tab/Comma-Separated Notes (Front [tab] Meaning [tab] Reading)
            </Label>
            <Textarea
              id="anki-paste"
              placeholder={"桜[さくら]\tCherry blossom\tさくら\n約束[やくそく]\tPromise\tやくそく"}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="min-h-[100px] font-mono text-xs"
            />
          </div>

          <Button onClick={handleImportTSV} className="w-full">
            <Upload className="h-4 w-4 mr-2" /> Import Notes into Anki Deck
          </Button>
        </CardContent>
      </Card>

      {/* 2. Live Desktop AnkiConnect Sync (http://127.0.0.1:8765) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              AnkiConnect Live Desktop Sync
            </CardTitle>
            {ankiStatus.checked &&
              (ankiStatus.connected ? (
                <Badge className="bg-green-600 text-white gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="h-3 w-3" /> Offline
                </Badge>
              ))}
          </div>
          <CardDescription>
            Sync directly with Desktop Anki running the official AnkiConnect add-on (code <code className="font-mono font-bold">2055492159</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCheckAnkiConnect}
            disabled={isSyncing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`}
            />
            Test Connection to Desktop Anki (Port 8765)
          </Button>

          <div className="space-y-2">
            <Label htmlFor="target-deck">Desktop Anki Deck Name</Label>
            <Input
              id="target-deck"
              value={targetDeck}
              onChange={(e) => setTargetDeck(e.target.value)}
              placeholder="Nihongo::Japanese"
            />
            {ankiStatus.decks.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {ankiStatus.decks.slice(0, 6).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTargetDeck(d)}
                    className="text-[11px] px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handlePushToDesktopAnki}
              disabled={isSyncing}
              variant="default"
            >
              Push to Anki
            </Button>
            <Button
              onClick={handlePullFromDesktopAnki}
              disabled={isSyncing}
              variant="secondary"
            >
              Pull from Anki
            </Button>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">
              How to enable AnkiConnect in Desktop Anki:
            </p>
            <p>1. Open Anki &rarr; Tools &rarr; Add-ons &rarr; Get Add-ons.</p>
            <p>
              2. Enter code <code className="font-mono font-bold">2055492159</code> and restart Anki.
            </p>
            <p>
              3. Add your site URL to <code className="font-mono">webCorsOriginList</code> in AnkiConnect config.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
