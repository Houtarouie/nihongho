'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronRight,
  ChevronDown,
  Maximize2,
  Download,
  Volume2,
  Plus,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Check,
  Zap,
  Sparkles,
  X,
} from 'lucide-react'
import {
  HIRAGANA_GOJUON,
  HIRAGANA_DAKUTEN,
  HIRAGANA_YOON,
  KATAKANA_GOJUON,
  KATAKANA_DAKUTEN,
  KATAKANA_YOON,
  CURRICULUM_LESSONS,
  type KanaItem,
  type KanaRow,
} from '@/data/kana'
import {
  speakJapanese,
  addCustomSRSCard,
  loadUserStats,
  saveUserStats,
} from '@/data/srs-deck'
import { LearningArcade } from '@/components/games/learning-arcade'
import { toast } from 'sonner'

type ExpandedSection = 'hiragana' | 'katakana' | 'resources' | null
type KanaSubTab = 'gojuon' | 'dakuten' | 'yoon'

const READ_KANA_KEY = 'nihongo_read_kana_chars_v1'

export default function LearnPage() {
  const [expanded, setExpanded] = useState<ExpandedSection>(null)
  const [showArcade, setShowArcade] = useState(false)
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [kanaSubTab, setKanaSubTab] = useState<KanaSubTab>('gojuon')
  const [selectedKana, setSelectedKana] = useState<KanaItem | null>(null)
  const [readChars, setReadChars] = useState<Set<string>>(new Set())
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  const [selectedKanaMap, setSelectedKanaMap] = useState<Record<string, KanaItem>>({})
  const [customQuizPool, setCustomQuizPool] = useState<KanaItem[] | null>(null)

  useEffect(() => {
    const stats = loadUserStats()
    setCompletedLessons(stats.completedLessons || [])
    try {
      const raw = localStorage.getItem(READ_KANA_KEY)
      if (raw) setReadChars(new Set(JSON.parse(raw)))
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const lessonParam = params.get('lesson')
      if (lessonParam === 'hiragana') setExpanded('hiragana')
      else if (lessonParam === 'katakana') setExpanded('katakana')
      else if (lessonParam === 'arcade') setShowArcade(true)
      else if (lessonParam === 'tai-form') {
        setExpanded('resources')
        setActiveLessonId('tai-form')
      }
    }
  }, [])

  function handleKanaClick(item: KanaItem, scriptLabel: string) {
    setSelectedKana(item)
    speakJapanese(item.kana)
    setReadChars((prev) => {
      const next = new Set(prev)
      next.add(item.kana)
      try {
        localStorage.setItem(READ_KANA_KEY, JSON.stringify(Array.from(next)))
      } catch {
        // ignore
      }
      return next
    })
    toast.info(`${item.kana} (${item.romaji})`, {
      description: item.example || `${scriptLabel} character`,
      duration: 1800,
    })
  }

  function handleAddKanaToSRS(item: KanaItem, scriptLabel: string) {
    const res = addCustomSRSCard({
      front: item.kana,
      reading: `${item.romaji} (${scriptLabel})`,
      meaning: `Syllable "${item.romaji}"`,
      category: 'kana',
      jlptLevel: 'N5',
      exampleSentence: item.example,
    })
    if (res.added) {
      toast.success(`Added "${item.kana}" to your Anki deck!`)
    } else {
      toast.info(`"${item.kana}" is already in your Anki deck.`)
    }
  }

  function markLessonComplete(lessonId: string) {
    const stats = loadUserStats()
    const alreadyDone = stats.completedLessons.includes(lessonId)
    const updatedLessons = alreadyDone
      ? stats.completedLessons
      : [...stats.completedLessons, lessonId]

    const updated = saveUserStats({
      completedLessons: updatedLessons,
      xp: alreadyDone ? stats.xp : stats.xp + 50,
    })
    setCompletedLessons(updated.completedLessons)
    toast.success(
      alreadyDone ? 'Lesson already completed!' : 'Lesson completed! +50 XP'
    )
  }

  // Count how many Hiragana / Katakana characters have been read
  const allHiraganaChars = [
    ...HIRAGANA_GOJUON,
    ...HIRAGANA_DAKUTEN,
    ...HIRAGANA_YOON,
  ].flatMap((r) => r.items.filter(Boolean) as KanaItem[])
  const allKatakanaChars = [
    ...KATAKANA_GOJUON,
    ...KATAKANA_DAKUTEN,
    ...KATAKANA_YOON,
  ].flatMap((r) => r.items.filter(Boolean) as KanaItem[])

  const hiraganaReadCount = allHiraganaChars.filter((c) =>
    readChars.has(c.kana)
  ).length
  const katakanaReadCount = allKatakanaChars.filter((c) =>
    readChars.has(c.kana)
  ).length

  const selectedKanaList = Object.values(selectedKanaMap)
  const selectedKanaKeys = new Set(Object.keys(selectedKanaMap))

  function toggleKanaSelection(item: KanaItem) {
    setSelectedKanaMap((prev) => {
      const next = { ...prev }
      if (next[item.kana]) {
        delete next[item.kana]
      } else {
        next[item.kana] = item
      }
      return next
    })
  }

  function selectMultipleKana(items: KanaItem[]) {
    setSelectedKanaMap((prev) => {
      const next = { ...prev }
      items.forEach((item) => {
        next[item.kana] = item
      })
      return next
    })
  }

  function deselectMultipleKana(items: KanaItem[]) {
    setSelectedKanaMap((prev) => {
      const next = { ...prev }
      items.forEach((item) => {
        delete next[item.kana]
      })
      return next
    })
  }

  function clearSelection() {
    setSelectedKanaMap({})
  }

  function handleAddSelectedToSRS() {
    if (selectedKanaList.length === 0) return
    let addedCount = 0
    let existingCount = 0

    for (const item of selectedKanaList) {
      const isKatakana = KATAKANA_GOJUON.some((r) =>
        r.items.some((i) => i?.kana === item.kana)
      )
      const scriptLabel = isKatakana ? 'Katakana' : 'Hiragana'
      const res = addCustomSRSCard({
        front: item.kana,
        reading: `${item.romaji} (${scriptLabel})`,
        meaning: `Kana syllable "${item.romaji}"`,
        category: 'kana',
        jlptLevel: 'N5',
        exampleSentence: item.example,
        tags: ['kana', scriptLabel.toLowerCase(), item.row || 'custom'],
      })
      if (res.added) addedCount++
      else existingCount++
    }

    if (addedCount > 0) {
      toast.success(
        `Added ${addedCount} character${addedCount > 1 ? 's' : ''} to your Anki SRS deck!${
          existingCount > 0 ? ` (${existingCount} already existed)` : ''
        }`
      )
    } else {
      toast.info(`All ${existingCount} selected characters are already in your SRS deck.`)
    }
  }

  function handleStartCustomQuiz() {
    if (selectedKanaList.length === 0) return
    setCustomQuizPool(selectedKanaList)
    setShowArcade(true)
    toast.success(`Starting quiz on ${selectedKanaList.length} selected characters!`)
  }

  function renderKanaChart(rows: KanaRow[], scriptLabel: string) {
    const isYoon = kanaSubTab === 'yoon'
    const currentTabItems = rows.flatMap((r) => r.items.filter(Boolean) as KanaItem[])

    function applyPreset(count: number) {
      const targetItems = currentTabItems.slice(0, count)
      selectMultipleKana(targetItems)
      toast.success(`Selected first ${targetItems.length} ${scriptLabel} characters!`)
    }

    function selectAllCurrent() {
      selectMultipleKana(currentTabItems)
      toast.success(`Selected all ${currentTabItems.length} ${scriptLabel} (${kanaSubTab}) characters!`)
    }

    return (
      <div className="space-y-4 pt-2">
        {/* Sub-tabs: Gojūon | Dakuten | Yōon */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div className="flex gap-1.5">
            {(
              [
                { id: 'gojuon', label: 'Basic (Gojūon)' },
                { id: 'dakuten', label: 'Voiced (Dakuten)' },
                { id: 'yoon', label: 'Combo (Yōon)' },
              ] as const
            ).map((t) => (
              <Button
                key={t.id}
                size="sm"
                variant={kanaSubTab === t.id ? 'default' : 'outline'}
                className="h-8 text-xs"
                onClick={() => setKanaSubTab(t.id)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          {selectedKana && (
            <div className="flex items-center gap-3 text-xs bg-muted/50 px-3 py-1.5 rounded-lg border">
              <span className="text-lg font-bold text-primary">
                {selectedKana.kana}
              </span>
              <span>
                <strong>{selectedKana.romaji}</strong>
                {selectedKana.example ? ` · ${selectedKana.example}` : ''}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => handleAddKanaToSRS(selectedKana, scriptLabel)}
              >
                <Plus className="h-3 w-3 mr-1" /> Deck
              </Button>
            </div>
          )}
        </div>

        {/* Quick Selection Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/30 p-2.5 rounded-lg border border-dashed text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-muted-foreground mr-1 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Quick Pick:
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 bg-background"
              onClick={() => applyPreset(5)}
            >
              First 5 (A-row)
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 bg-background"
              onClick={() => applyPreset(10)}
            >
              First 10 (A + Ka)
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 bg-background"
              onClick={() => applyPreset(15)}
            >
              First 15 (A + Ka + Sa)
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 bg-background"
              onClick={selectAllCurrent}
            >
              Select All
            </Button>
          </div>

          {selectedKanaList.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-[11px]">
                {selectedKanaList.length} picked
              </Badge>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                onClick={clearSelection}
              >
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>
          )}
        </div>

        {/* Kana Table Grid with Row-Level and Card-Level Selection */}
        <div className="space-y-2.5">
          {rows.map((row) => {
            const rowItems = row.items.filter(Boolean) as KanaItem[]
            const isRowAllSelected =
              rowItems.length > 0 &&
              rowItems.every((item) => selectedKanaKeys.has(item.kana))

            function toggleRow() {
              if (isRowAllSelected) {
                deselectMultipleKana(rowItems)
              } else {
                selectMultipleKana(rowItems)
              }
            }

            return (
              <div
                key={row.rowName}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
              >
                <div className="w-28 shrink-0 flex items-center justify-between sm:justify-start gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground truncate">
                    {row.rowName}
                  </span>
                  {rowItems.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant={isRowAllSelected ? 'default' : 'ghost'}
                      className={`h-5 px-1.5 text-[10px] rounded ${
                        isRowAllSelected
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'text-muted-foreground hover:text-foreground border border-muted'
                      }`}
                      onClick={toggleRow}
                      title={isRowAllSelected ? 'Deselect row' : 'Select entire row'}
                    >
                      {isRowAllSelected ? '✓ Row' : '+ Row'}
                    </Button>
                  )}
                </div>

                <div
                  className={`grid flex-1 gap-2 ${
                    isYoon ? 'grid-cols-3' : 'grid-cols-5'
                  }`}
                >
                  {row.items.map((item, idx) => {
                    if (!item) {
                      return (
                        <div
                          key={`empty-${idx}`}
                          className="rounded-lg border border-dashed bg-muted/10 p-2.5"
                        />
                      )
                    }

                    const isSelected = selectedKanaKeys.has(item.kana)

                    return (
                      <button
                        key={item.kana}
                        type="button"
                        onClick={() => {
                          toggleKanaSelection(item)
                          handleKanaClick(item, scriptLabel)
                        }}
                        className={`group relative flex flex-col items-center justify-center rounded-lg border p-2.5 transition-all text-center ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/40 bg-primary/10 shadow-sm'
                            : readChars.has(item.kana)
                            ? 'border-primary/40 bg-primary/5 hover:border-primary'
                            : 'bg-background hover:border-primary/60'
                        }`}
                      >
                        {/* Selection Check Indicator */}
                        <span
                          className={`absolute top-1.5 left-1.5 h-4 w-4 rounded-full flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-muted-foreground/30 text-transparent group-hover:border-primary/60'
                          }`}
                        >
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>

                        {/* Speaker Audio Icon */}
                        <Volume2
                          onClick={(e) => {
                            e.stopPropagation()
                            speakJapanese(item.kana)
                          }}
                          className="h-3.5 w-3.5 text-muted-foreground opacity-60 hover:opacity-100 hover:text-primary absolute top-1.5 right-1.5 transition-opacity"
                        />

                        <span className="text-2xl font-bold mt-1">{item.kana}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {item.romaji}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // If the user opened the Time-Attack Kana Arcade
  if (showArcade) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between border-b pb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowArcade(false)
              setCustomQuizPool(null)
            }}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Kana Overview
          </Button>
          <div className="flex items-center gap-2">
            {customQuizPool && customQuizPool.length > 0 && (
              <Badge variant="outline" className="border-primary text-primary font-semibold">
                🎯 Custom Pool: {customQuizPool.length} Chars
              </Badge>
            )}
            <Badge variant="secondary">Kana Time-Attack &amp; Leaderboard</Badge>
          </div>
        </div>

        <LearningArcade
          initialScript={expanded === 'katakana' ? 'katakana' : 'hiragana'}
          customPool={customQuizPool || undefined}
          onExitCustomPool={() => setCustomQuizPool(null)}
        />
      </div>
    )
  }

  // Clean 2-Column Layout matching Screenshot 3 & 4
  return (
    <div className="max-w-5xl mx-auto py-4 pb-16">
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Left Compact Index Card */}
        <Card className="w-full md:w-56 shrink-0">
          <CardContent className="p-3 space-y-1 text-sm">
            <button
              type="button"
              onClick={() =>
                setExpanded(expanded === 'hiragana' ? null : 'hiragana')
              }
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                expanded === 'hiragana'
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-bold">あ</span>
              <span>Hiragana</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setExpanded(expanded === 'katakana' ? null : 'katakana')
              }
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                expanded === 'katakana'
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-bold">ア</span>
              <span>Katakana</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setExpanded(expanded === 'resources' ? null : 'resources')
              }
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                expanded === 'resources'
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground ml-1" />
              <span>Resources</span>
            </button>
          </CardContent>
        </Card>

        {/* Right Main Accordion Bars + Time-Attack Banner */}
        <div className="flex-1 w-full space-y-4">
          {/* 1. Hiragana Accordion Bar */}
          <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
            <button
              type="button"
              onClick={() =>
                setExpanded(expanded === 'hiragana' ? null : 'hiragana')
              }
              className="w-full flex items-center justify-between px-5 py-4 bg-slate-900 text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expanded === 'hiragana' ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
                <span className="text-lg font-bold">あ Hiragana</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span>
                  {hiraganaReadCount}/{allHiraganaChars.length} Read
                </span>
                <Maximize2 className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </button>

            {expanded === 'hiragana' && (
              <div className="p-5 bg-card border-t">
                {renderKanaChart(
                  kanaSubTab === 'gojuon'
                    ? HIRAGANA_GOJUON
                    : kanaSubTab === 'dakuten'
                      ? HIRAGANA_DAKUTEN
                      : HIRAGANA_YOON,
                  'Hiragana'
                )}
              </div>
            )}
          </div>

          {/* 2. Katakana Accordion Bar */}
          <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
            <button
              type="button"
              onClick={() =>
                setExpanded(expanded === 'katakana' ? null : 'katakana')
              }
              className="w-full flex items-center justify-between px-5 py-4 bg-slate-900 text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expanded === 'katakana' ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
                <span className="text-lg font-bold">ア Katakana</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span>
                  {katakanaReadCount}/{allKatakanaChars.length} Read
                </span>
                <Maximize2 className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </button>

            {expanded === 'katakana' && (
              <div className="p-5 bg-card border-t">
                {renderKanaChart(
                  kanaSubTab === 'gojuon'
                    ? KATAKANA_GOJUON
                    : kanaSubTab === 'dakuten'
                      ? KATAKANA_DAKUTEN
                      : KATAKANA_YOON,
                  'Katakana'
                )}
              </div>
            )}
          </div>

          {/* 3. Resources Accordion Bar */}
          <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
            <button
              type="button"
              onClick={() =>
                setExpanded(expanded === 'resources' ? null : 'resources')
              }
              className="w-full flex items-center justify-between px-5 py-4 bg-slate-900 text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expanded === 'resources' ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
                <Download className="h-4 w-4 text-slate-300" />
                <span className="text-base font-bold">Resources</span>
              </div>
              <span className="text-xs text-slate-400">
                {CURRICULUM_LESSONS.length} Foundation Guides
              </span>
            </button>

            {expanded === 'resources' && (
              <div className="p-5 bg-card border-t space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CURRICULUM_LESSONS.map((lesson) => {
                    const isDone = completedLessons.includes(lesson.id)
                    const isSelected = activeLessonId === lesson.id
                    return (
                      <div
                        key={lesson.id}
                        onClick={() =>
                          setActiveLessonId(isSelected ? null : lesson.id)
                        }
                        className={`rounded-lg border p-3.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">
                            {lesson.title}
                          </span>
                          {isDone && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {lesson.subtitle}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {activeLessonId &&
                  (() => {
                    const activeLesson = CURRICULUM_LESSONS.find(
                      (l) => l.id === activeLessonId
                    )
                    if (!activeLesson) return null
                    return (
                      <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-base">
                            {activeLesson.title}
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => markLessonComplete(activeLesson.id)}
                          >
                            Mark Read ✓
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {activeLesson.summary}
                        </p>
                        <div className="grid gap-2">
                          {activeLesson.keyPoints.map((ex, i) => (
                            <div
                              key={i}
                              onClick={() => speakJapanese(ex.japanese)}
                              className="flex items-center justify-between rounded border bg-background px-3 py-2 text-xs cursor-pointer hover:border-primary/50"
                            >
                              <div>
                                <span className="font-bold text-sm mr-2">
                                  {ex.japanese}
                                </span>
                                <span className="text-muted-foreground">
                                  ({ex.romaji}) — {ex.english}
                                </span>
                              </div>
                              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
              </div>
            )}
          </div>

          {/* 4. Sleek Time-Attack Kana Arcade Banner (Matches Screenshot 3 & 4) */}
          <div className="rounded-xl border bg-zinc-950 text-zinc-100 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-bold">
                Practice your Kana skills with{' '}
                <span className="text-amber-400 tracking-wider font-extrabold">
                  KANA BLITZ
                </span>{' '}
                !
              </p>
              <p className="text-xs sm:text-sm text-zinc-400">
                Time attack kana quizzes, leaderboards, and more!
              </p>
            </div>

            <Button
              onClick={() => setShowArcade(true)}
              className="shrink-0 gap-1.5 font-semibold"
            >
              <ExternalLink className="h-4 w-4" />
              Check it out
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Action Bar for Selected Kana */}
      {selectedKanaList.length > 0 && (
        <div className="fixed bottom-5 left-4 right-4 max-w-2xl mx-auto z-50 rounded-2xl border border-primary/50 bg-background/95 backdrop-blur-md shadow-2xl p-3 sm:p-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Badge variant="default" className="text-xs px-2.5 py-1 font-bold shrink-0">
                ✓ {selectedKanaList.length} Kana Selected
              </Badge>
              <div className="text-xs text-muted-foreground font-mono truncate max-w-[200px] sm:max-w-xs">
                {selectedKanaList.map((k) => k.kana).join(' ')}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 font-medium"
                onClick={handleAddSelectedToSRS}
              >
                <Plus className="h-3.5 w-3.5" />
                Add to SRS ({selectedKanaList.length})
              </Button>

              <Button
                size="sm"
                className="h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow"
                onClick={handleStartCustomQuiz}
              >
                <Zap className="h-3.5 w-3.5 text-yellow-300" />
                Start Quiz ({selectedKanaList.length})
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs px-2 text-muted-foreground hover:text-foreground"
                onClick={clearSelection}
                title="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
