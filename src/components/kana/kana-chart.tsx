'use client'

import React, { useState, useMemo } from 'react'
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
import { speakJapanese, type SRSCard } from '@/data/srs-deck'
import { useProgress } from '@/lib/progress'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  Play,
  CheckSquare,
  Square,
  X,
  Zap,
  Flame,
} from 'lucide-react'
import { KanaQuizModal, type QuizMode } from '@/components/quiz/kana-quiz-modal'
import { StackedProgressBar } from './stacked-progress-bar'
import { MasteryPips } from './mastery-pips'
import { KanaTilePopover } from './kana-tile-popover'
import {
  scriptProgress,
  groupProgress,
  rowProgress,
  weakKana,
  makeKanaId,
  getAllKanaItems,
} from '@/lib/kana/mastery-engine'
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
  const { stats, upsertCards, kanaMastery, cards } = useProgress()
  const [script, setScript] = useState<ScriptType>('hiragana')
  const [section, setSection] = useState<SectionType>('gojuon')
  const [showRomaji, setShowRomaji] = useState(true)
  const [activeItem, setActiveItem] = useState<KanaItem | null>(null)
  const [hoveredTileKana, setHoveredTileKana] = useState<string | null>(null)
  const [activePopoverKana, setActivePopoverKana] = useState<string | null>(null)

  // Custom Selection State
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedKanaMap, setSelectedKanaMap] = useState<Record<string, KanaItem>>({})

  // Quiz Modal State
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [quizItems, setQuizItems] = useState<KanaItem[]>([])
  const [quizTitle, setQuizTitle] = useState('Kana Quiz')
  const [quizMode, setQuizMode] = useState<QuizMode>('kana-to-romaji')

  // Progress Selectors
  const hiraganaProgress = useMemo(
    () => scriptProgress('hiragana', kanaMastery),
    [kanaMastery]
  )
  const katakanaProgress = useMemo(
    () => scriptProgress('katakana', kanaMastery),
    [kanaMastery]
  )
  const currentGroupProgress = useMemo(
    () => groupProgress(script, section, kanaMastery),
    [script, section, kanaMastery]
  )
  const currentWeakKana = useMemo(
    () => weakKana(kanaMastery),
    [kanaMastery]
  )

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

  const currentFlatKana = useMemo(() => {
    const list: KanaItem[] = []
    for (const r of rows) {
      for (const it of r.items) {
        if (it) list.push(it)
      }
    }
    return list
  }, [rows])

  function handleKanaClick(item: KanaItem) {
    if (isSelectMode) {
      setSelectedKanaMap((prev) => {
        const next = { ...prev }
        if (next[item.kana]) {
          delete next[item.kana]
        } else {
          next[item.kana] = item
        }
        return next
      })
    } else {
      setActiveItem(item)
      // Toggle popover on tap/click for mobile & accessibility
      setActivePopoverKana((prev) => (prev === item.kana ? null : item.kana))
      speakJapanese(item.kana, { rate: stats.audioSpeed || 1.0 })
      toast.success(`${item.kana} (${item.romaji}) — ${item.example}`, { duration: 1500 })
    }
  }

  function handlePracticeWeakKana() {
    if (currentWeakKana.length === 0) {
      toast.info('No weak kana identified yet! Practice quizzes to identify tricky characters.')
      return
    }
    const all = getAllKanaItems()
    const items = currentWeakKana
      .map((w) => all.find((k) => k.kana === w.kana))
      .filter((k): k is KanaItem => Boolean(k))

    setQuizItems(items.length > 0 ? items : currentFlatKana.slice(0, 5))
    setQuizTitle(`Weak Kana Practice (${items.length} characters)`)
    setQuizMode('kana-to-romaji')
    setIsQuizOpen(true)
  }

  function handleSelectRow(row: KanaRow) {
    const newItems: Record<string, KanaItem> = {}
    row.items.forEach((it) => {
      if (it) newItems[it.kana] = it
    })
    setSelectedKanaMap((prev) => ({ ...prev, ...newItems }))
    setIsSelectMode(true)
    toast.success(`Selected ${row.rowName}-row for quiz`)
  }

  // Launch quiz for a specific row
  function handleQuizRow(row: KanaRow) {
    const items = row.items.filter((i): i is KanaItem => Boolean(i))
    if (items.length === 0) return
    setQuizItems(items)
    setQuizTitle(`${row.rowName}-Row Quick Quiz`)
    setQuizMode('kana-to-romaji')
    setIsQuizOpen(true)
  }

  // Add a specific row directly to daily SRS
  async function handleAddRowToSRS(row: KanaRow) {
    const items = row.items.filter((i): i is KanaItem => Boolean(i))
    if (items.length === 0) return

    const newCards: SRSCard[] = items.map((it) => ({
      id: `kana-${it.kana}`,
      front: it.kana,
      reading: it.romaji,
      meaning: `Kana character for "${it.romaji}"`,
      category: 'kana',
      jlptLevel: 'N5',
      exampleSentence: it.example,
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: Date.now(),
      status: 'new',
      queue: 'active',
      lapses: 0,
    }))

    const res = await upsertCards(newCards)
    toast.success(`Added ${res.addedCount} cards from ${row.rowName}-row to your Daily SRS Reviews!`)
  }

  // Launch custom quiz from selected items
  function handleLaunchCustomQuiz() {
    const items = Object.values(selectedKanaMap)
    if (items.length === 0) {
      toast.error('Select at least 1 character to start a custom quiz')
      return
    }
    setQuizItems(items)
    setQuizTitle(`Custom Kana Quiz (${items.length} characters)`)
    setQuizMode('kana-to-romaji')
    setIsQuizOpen(true)
  }

  // Add all selected items into daily SRS
  async function handleAddSelectedToSRS() {
    const items = Object.values(selectedKanaMap)
    if (items.length === 0) return

    const newCards: SRSCard[] = items.map((it) => ({
      id: `kana-${it.kana}`,
      front: it.kana,
      reading: it.romaji,
      meaning: `Kana character for "${it.romaji}"`,
      category: 'kana',
      jlptLevel: 'N5',
      exampleSentence: it.example,
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: Date.now(),
      status: 'new',
      queue: 'active',
      lapses: 0,
    }))

    const res = await upsertCards(newCards)
    toast.success(`Added ${res.addedCount} selected characters to your Daily SRS Queue!`)
  }

  // Quick launch all current
  function handleQuizAll() {
    setQuizItems(currentFlatKana)
    setQuizTitle(`Full ${script === 'hiragana' ? 'Hiragana' : 'Katakana'} (${section}) Quiz`)
    setQuizMode('kana-to-romaji')
    setIsQuizOpen(true)
  }

  // Quick launch confusion drill
  function handleQuizConfusion() {
    const confusionItems = currentFlatKana.filter((it) =>
      CONFUSION_PAIRS.some((p) => p.chars.includes(it.kana))
    )
    setQuizItems(confusionItems.length >= 4 ? confusionItems : currentFlatKana.slice(0, 10))
    setQuizTitle(`${script === 'hiragana' ? 'Hiragana' : 'Katakana'} Look-Alike Drill`)
    setQuizMode('kana-to-romaji')
    setIsQuizOpen(true)
  }

  const selectedCount = Object.keys(selectedKanaMap).length
  const scriptConfusions = CONFUSION_PAIRS.filter((c) => c.script === script)

  return (
    <div className="space-y-6">
      {/* Top Stacked Mastery Progress Bars */}
      <div className="grid gap-3 sm:grid-cols-2 p-4 rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs">
        <StackedProgressBar progress={hiraganaProgress} label="Hiragana Mastery" />
        <StackedProgressBar progress={katakanaProgress} label="Katakana Mastery" />
      </div>

      {/* Top Banner: Quick Quizzes, Practice Weak Kana & Custom Selection Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-gradient-to-r from-primary/10 via-background to-muted/40 shadow-xs">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Active Kana Quizzing &amp; SRS
          </h3>
          <p className="text-xs text-muted-foreground">
            Test yourself with smart look-alike distractors or drill your weakest kana.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleQuizAll}
            className="h-8 text-xs rounded-xl gap-1.5 font-semibold"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Quiz All
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePracticeWeakKana}
            className="h-8 text-xs rounded-xl gap-1.5 border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10"
          >
            <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
            Practice Weak Kana {currentWeakKana.length > 0 && `(${currentWeakKana.length})`}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleQuizConfusion}
            className="h-8 text-xs rounded-xl gap-1.5"
          >
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            Confusion Drill
          </Button>

          <Button
            variant={isSelectMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsSelectMode(!isSelectMode)}
            className={`h-8 text-xs rounded-xl gap-1.5 ${
              isSelectMode ? 'bg-primary text-primary-foreground font-bold' : ''
            }`}
          >
            {isSelectMode ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
            {isSelectMode ? 'Selecting Mode (Active)' : 'Select Custom Characters'}
          </Button>
        </div>
      </div>

      {/* Control Switchers & Sub-bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl border bg-card">
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

        {/* Section tabs & Romaji toggle & Group Sub-bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          <div className="w-full sm:w-48">
            <StackedProgressBar
              progress={{
                script,
                total: currentGroupProgress.total,
                countPerStage: currentGroupProgress.countPerStage,
                knownCount: currentGroupProgress.knownCount,
                knownPct: currentGroupProgress.knownPct,
                masteredCount: currentGroupProgress.masteredCount,
                masteredPct: currentGroupProgress.masteredPct,
                weightedPct: currentGroupProgress.knownPct,
              }}
              label={`${section === 'gojuon' ? 'Gojūon' : section === 'dakuten' ? 'Dakuten' : 'Yōon'}`}
              height="sm"
            />
          </div>

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
      <Card className="p-4 sm:p-6 rounded-2xl overflow-visible">
        <div className="space-y-4">
          {rows.map((row, rowIdx) => {
            const rowKey = row.items.find(Boolean)?.row || ''
            const rProg = rowProgress(script, rowKey, kanaMastery)

            return (
              <div key={row.rowName} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                {/* Row title with mini-bar and quick actions */}
                <div className="flex items-center justify-between sm:justify-start gap-2 w-36 shrink-0">
                  <span className="text-xs font-mono font-bold text-muted-foreground uppercase">
                    {row.rowName}-row
                  </span>
                  <div
                    role="progressbar"
                    aria-valuenow={rProg.knownPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${row.rowName} progress: ${rProg.knownPct}%`}
                    className="w-7 h-1.5 bg-muted/60 rounded-full overflow-hidden flex shrink-0"
                    title={`${row.rowName}: ${rProg.knownPct}% known (${rProg.knownCount}/${rProg.total})`}
                  >
                    <div
                      style={{ width: `${rProg.knownPct}%` }}
                      className="bg-primary h-full transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleQuizRow(row)}
                      className="p-1 rounded-md text-primary hover:bg-primary/10 transition-colors"
                      title={`Quiz ${row.rowName}-row`}
                    >
                      <Zap className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleAddRowToSRS(row)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title={`Add ${row.rowName}-row to Daily SRS Reviews`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    {isSelectMode && (
                      <button
                        onClick={() => handleSelectRow(row)}
                        className="text-[10px] text-primary hover:underline font-semibold"
                      >
                        +all
                      </button>
                    )}
                  </div>
                </div>

                {/* Row Characters */}
                <div className="grid grid-cols-5 gap-2 sm:gap-3 flex-1">
                  {row.items.map((item, idx) => {
                    if (!item) {
                      return <div key={`empty-${idx}`} className="min-h-[64px] sm:min-h-[72px]" />
                    }
                    const isSelectedInQuiz = Boolean(selectedKanaMap[item.kana])
                    const isActive = activeItem?.kana === item.kana
                    const record = kanaMastery[makeKanaId(item.kana, script)]
                    const srsCard = cards.find(
                      (c) => c.front === item.kana || c.id === `kana-${item.kana}`
                    )
                    const isPopoverVisible =
                      hoveredTileKana === item.kana || activePopoverKana === item.kana
                    const isTopRow = rowIdx === 0

                    return (
                      <div
                        key={`${item.kana}-${idx}`}
                        className="relative"
                        onMouseEnter={() => setHoveredTileKana(item.kana)}
                        onMouseLeave={() => setHoveredTileKana(null)}
                      >
                        <button
                          onClick={() => handleKanaClick(item)}
                          className={`relative w-full min-h-[64px] sm:min-h-[72px] flex flex-col items-center justify-center p-2 rounded-2xl border transition-all select-none ${
                            isSelectedInQuiz
                              ? 'border-primary bg-primary/15 ring-2 ring-primary'
                              : isActive
                              ? 'border-primary bg-primary/10 scale-102'
                              : 'border-border/70 hover:border-primary/50 hover:bg-muted/40'
                          }`}
                          aria-label={`Character ${item.kana}, pronunciation ${item.romaji}, mastery stage ${record?.stage ?? 0} of 5`}
                        >
                          {/* Checkbox indicator when in select mode */}
                          {isSelectMode && (
                            <span
                              className={`absolute top-1.5 right-1.5 h-3.5 w-3.5 rounded-md flex items-center justify-center border text-[9px] ${
                                isSelectedInQuiz
                                  ? 'bg-primary text-primary-foreground border-primary font-bold'
                                  : 'border-muted-foreground/40 bg-background/80'
                              }`}
                            >
                              {isSelectedInQuiz && '✓'}
                            </span>
                          )}

                          <span className="text-2xl sm:text-3xl font-bold font-japanese leading-none">
                            {item.kana}
                          </span>
                          {showRomaji && (
                            <span className="text-xs font-mono text-muted-foreground mt-0.5 font-medium">
                              {item.romaji}
                            </span>
                          )}

                          {/* 5-pip mastery indicator */}
                          <MasteryPips stage={record?.stage ?? 0} size="sm" className="mt-1" />
                        </button>

                        {/* Hover/Tap Popover */}
                        {isPopoverVisible && (
                          <div
                            className={`absolute left-1/2 -translate-x-1/2 z-50 pointer-events-auto ${
                              isTopRow ? 'top-full mt-2' : 'bottom-full mb-2'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <KanaTilePopover
                              record={record}
                              kana={item.kana}
                              romaji={item.romaji}
                              example={item.example}
                              srsDueDate={srsCard?.dueDate}
                              onClose={() => {
                                setHoveredTileKana(null)
                                setActivePopoverKana(null)
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Floating Bottom Selection Bar (When user has selected items) */}
      {selectedCount > 0 && (
        <div className="fixed bottom-16 md:bottom-6 left-4 right-4 max-w-2xl mx-auto z-40 p-4 rounded-2xl border-2 border-primary/40 bg-background/95 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs font-bold">
                  {selectedCount} Selected
                </Badge>
                <button
                  onClick={() => setSelectedKanaMap({})}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                {Object.values(selectedKanaMap).map((it) => (
                  <span
                    key={it.kana}
                    className="font-japanese text-xs bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded"
                  >
                    {it.kana}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSelectedToSRS}
                className="h-9 text-xs rounded-xl gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                + Add to SRS
              </Button>

              <Button
                size="sm"
                onClick={handleLaunchCustomQuiz}
                className="h-9 text-xs rounded-xl gap-1.5 font-bold shadow-xs"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Start Quiz ({selectedCount})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confusion Pairs Reference */}
      <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              Look-Alike Character Distinctions
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleQuizConfusion}
              className="h-7 text-xs rounded-lg gap-1 border-amber-500/30 text-amber-700 dark:text-amber-300"
            >
              <Zap className="h-3 w-3" />
              Drill Look-Alikes
            </Button>
          </div>
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

      {/* Interactive Quiz Modal */}
      <KanaQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        items={quizItems}
        title={quizTitle}
        initialMode={quizMode}
      />
    </div>
  )
}
