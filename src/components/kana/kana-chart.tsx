'use client'

import React, { useState } from 'react'
import {
  HIRAGANA_GOJUON,
  HIRAGANA_DAKUTEN,
  HIRAGANA_YOON,
  KATAKANA_GOJUON,
  KATAKANA_DAKUTEN,
  KATAKANA_YOON,
  type KanaItem,
  type KanaRow,
} from '@/data/kana'
import { speakJapanese } from '@/data/srs-deck'
import { useProgress } from '@/lib/progress'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

type ScriptType = 'hiragana' | 'katakana'
type SectionType = 'gojuon' | 'dakuten' | 'yoon'

const CONFUSION_PAIRS = [
  {
    script: 'hiragana',
    chars: ['さ', 'き'],
    desc: 'さ (sa) has 1 horizontal line; き (ki) has 2 horizontal lines.',
  },
  {
    script: 'hiragana',
    chars: ['わ', 'れ', 'ね'],
    desc: 'わ (wa) curves inward; れ (re) curls outward at the end; ね (ne) loops into a knot.',
  },
  {
    script: 'hiragana',
    chars: ['い', 'り'],
    desc: 'い (i) left stroke is longer; り (ri) right stroke is longer.',
  },
  {
    script: 'katakana',
    chars: ['シ', 'ツ'],
    desc: 'シ (shi) strokes are horizontal-slanted (bottom-up); ツ (tsu) strokes are vertical-dropping (top-down).',
  },
  {
    script: 'katakana',
    chars: ['ソ', 'ン'],
    desc: 'ソ (so) stroke comes from top down; ン (n) stroke rises from bottom up.',
  },
  {
    script: 'katakana',
    chars: ['ク', 'ワ', 'ケ'],
    desc: 'ク (ku) is open left; ワ (wa) has closed shoulder; ケ (ke) has lower cross.',
  },
]

export function KanaChart() {
  const { stats } = useProgress()
  const [script, setScript] = useState<ScriptType>('hiragana')
  const [section, setSection] = useState<SectionType>('gojuon')
  const [showRomaji, setShowRomaji] = useState(true)
  const [activeItem, setActiveItem] = useState<KanaItem | null>(null)

  const rows: KanaRow[] =
    script === 'hiragana'
      ? section === 'gojuon'
        ? HIRAGANA_GOJUON
        : section === 'dakuten'
        ? HIRAGANA_DAKUTEN
        : HIRAGANA_YOON
      : section === 'gojuon'
      ? KATAKANA_GOJUON
      : section === 'dakuten'
      ? KATAKANA_DAKUTEN
      : KATAKANA_YOON

  function handlePlayKana(item: KanaItem) {
    setActiveItem(item)
    speakJapanese(item.kana, { rate: stats.audioSpeed || 1.0 })
    toast.success(`${item.kana} (${item.romaji}) — ${item.example}`, { duration: 1500 })
  }

  const scriptConfusions = CONFUSION_PAIRS.filter((c) => c.script === script)

  return (
    <div className="space-y-6">
      {/* Control Switchers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border bg-card">
        {/* Hiragana vs Katakana */}
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl">
          <button
            onClick={() => setScript('hiragana')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              script === 'hiragana'
                ? 'bg-background text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Hiragana (ひらがな)
          </button>
          <button
            onClick={() => setScript('katakana')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              script === 'katakana'
                ? 'bg-background text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Katakana (カタカナ)
          </button>
        </div>

        {/* Section tabs & Romaji toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs">
            <button
              onClick={() => setSection('gojuon')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                section === 'gojuon'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Gojūon (Basic)
            </button>
            <button
              onClick={() => setSection('dakuten')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                section === 'dakuten'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dakuten (Voiced)
            </button>
            <button
              onClick={() => setSection('yoon')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                section === 'yoon'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yōon (Combos)
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRomaji(!showRomaji)}
            className="h-8 gap-1.5 text-xs rounded-xl"
          >
            {showRomaji ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showRomaji ? 'Hide Romaji' : 'Show Romaji'}
          </Button>
        </div>
      </div>

      {/* Interactive Grid */}
      <Card className="p-4 sm:p-6 rounded-2xl">
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.rowName} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-xs font-mono font-bold text-muted-foreground w-12 shrink-0 uppercase">
                {row.rowName}-row
              </span>

              <div className="grid grid-cols-5 gap-2 sm:gap-3 flex-1">
                {row.items.map((item, idx) => {
                  if (!item) {
                    return <div key={`empty-${idx}`} className="min-h-[58px] sm:min-h-[64px]" />
                  }
                  const isSelected = activeItem?.kana === item.kana

                  return (
                    <button
                      key={`${item.kana}-${idx}`}
                      onClick={() => handlePlayKana(item)}
                      className={`min-h-[58px] sm:min-h-[64px] flex flex-col items-center justify-center p-2 rounded-2xl border transition-all select-none ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20 scale-102'
                          : 'border-border/70 hover:border-primary/50 hover:bg-muted/40'
                      }`}
                      aria-label={`Character ${item.kana}, pronunciation ${item.romaji}`}
                    >
                      <span className="text-2xl sm:text-3xl font-bold font-japanese leading-none">
                        {item.kana}
                      </span>
                      {showRomaji && (
                        <span className="text-xs font-mono text-muted-foreground mt-1 font-medium">
                          {item.romaji}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Confusion Pairs Reference */}
      <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            Look-Alike Character Distinctions
          </CardTitle>
          <CardDescription className="text-xs">
            Tricky pairs that frequently cause confusion for Japanese beginners.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scriptConfusions.map((pair, idx) => (
              <div key={idx} className="p-3 rounded-xl border bg-background/90 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 font-japanese text-xl font-bold text-primary">
                    {pair.chars.map((ch, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-muted/60">
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{pair.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
