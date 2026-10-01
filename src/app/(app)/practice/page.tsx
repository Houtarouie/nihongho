'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Volume2,
  RotateCcw,
  Plus,
  CheckCircle2,
  Sparkles,
  Layers,
  Undo2,
  Flag,
  EyeOff,
  PauseCircle,
  Settings2,
  BarChart3,
  Search,
  RefreshCw,
  Play,
} from 'lucide-react'
import {
  loadSRSCards,
  saveSRSCards,
  calculateSM2,
  getIntervalLabels,
  addCustomSRSCard,
  importAnkiDeckCards,
  loadUserStats,
  saveUserStats,
  loadDeckOptions,
  saveDeckOptions,
  loadReviewLogs,
  appendReviewLog,
  speakJapanese,
  DEFAULT_SRS_CARDS,
  DEFAULT_DECK_OPTIONS,
  CATEGORY_TO_DECK,
  type SRSCard,
  type CardCategory,
  type CardRating,
  type AnkiNoteType,
  type AnkiFlag,
  type AnkiDeckOptions,
  type AnkiReviewLog,
} from '@/data/srs-deck'
import { renderAnkiText, diffTypedAnswer } from '@/lib/anki/furigana'
import { convertRomajiToKana } from '@/lib/kana-ime'
import { AnkiBrowser } from '@/components/anki/anki-browser'
import { AnkiStats } from '@/components/anki/anki-stats'
import { AnkiSyncPanel } from '@/components/anki/anki-sync-modal'
import { toast } from 'sonner'

type AnkiTopTab = 'decks' | 'study' | 'add' | 'browse' | 'stats' | 'sync'

const FLAG_COLORS: Record<AnkiFlag, string> = {
  0: 'text-muted-foreground',
  1: 'text-red-500 fill-red-500',
  2: 'text-orange-500 fill-orange-500',
  3: 'text-green-500 fill-green-500',
  4: 'text-blue-500 fill-blue-500',
}

export default function PracticePage() {
  const [activeTab, setActiveTab] = useState<AnkiTopTab>('study')
  const [cards, setCards] = useState<SRSCard[]>([])
  const [deckOptions, setDeckOptions] = useState<AnkiDeckOptions>(
    DEFAULT_DECK_OPTIONS
  )
  const [reviewLogs, setReviewLogs] = useState<AnkiReviewLog[]>([])
  const [categoryFilter, setCategoryFilter] = useState<'all' | CardCategory>(
    'all'
  )
  const [selectedDeckName, setSelectedDeckName] = useState<string | null>(null)
  const [customDecks, setCustomDecks] = useState<string[]>([])
  const [newDeckInput, setNewDeckInput] = useState('')
  const [cramMode, setCramMode] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sessionReviewed, setSessionReviewed] = useState(0)
  const [showDeckOptionsModal, setShowDeckOptionsModal] = useState(false)

  // Undo stack for Anki Ctrl+Z / Undo last review
  const [undoStack, setUndoStack] = useState<SRSCard[]>([])

  // Type-in-the-answer input state
  const [typedAnswer, setTypedAnswer] = useState('')

  // Add Note form state
  const [newNoteType, setNewNoteType] = useState<AnkiNoteType>('basic')
  const [newFront, setNewFront] = useState('')
  const [newReading, setNewReading] = useState('')
  const [newMeaning, setNewMeaning] = useState('')
  const [newCategory, setNewCategory] = useState<CardCategory>('vocabulary')
  const [newCustomDeckTarget, setNewCustomDeckTarget] = useState<string>('')
  const [newLevel, setNewLevel] = useState('N5')
  const [newExample, setNewExample] = useState('')
  const [newTags, setNewTags] = useState('N5')

  useEffect(() => {
    const loaded = loadSRSCards()
    setCards(loaded)
    setDeckOptions(loadDeckOptions())
    setReviewLogs(loadReviewLogs())
    try {
      const raw = localStorage.getItem('nihongo_custom_anki_decks_v1')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setCustomDecks(parsed)
      }
    } catch {
      // ignore
    }

    // Auto-repair any previously imported .apkg deck whose cards lacked English translations
    const brokenDeckCard = loaded.find(
      (c) => c.deckName && !/[a-zA-Z]{2,}/.test(c.meaning || '')
    )
    if (brokenDeckCard?.deckName) {
      fetch(
        `/api/anki-repair?deckName=${encodeURIComponent(brokenDeckCard.deckName)}`
      )
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data?.cards) && data.cards.length > 0) {
            const { allCards } = importAnkiDeckCards(
              brokenDeckCard.deckName!,
              data.cards
            )
            setCards(allCards)
          }
        })
        .catch(() => {
          // ignore
        })
    }
  }, [])

  function handleCreateCustomDeck(e: React.FormEvent) {
    e.preventDefault()
    const clean = newDeckInput.trim()
    if (!clean) return
    const fullTitle = clean.startsWith('Japanese::')
      ? clean
      : `Japanese::${clean}`
    const updated = Array.from(new Set([...customDecks, fullTitle]))
    setCustomDecks(updated)
    try {
      localStorage.setItem(
        'nihongo_custom_anki_decks_v1',
        JSON.stringify(updated)
      )
    } catch {
      // ignore
    }
    setNewDeckInput('')
    setNewCustomDeckTarget(fullTitle)
    toast.success(
      `Created deck "${fullTitle}"! You can now add cards to it or install notes into it.`
    )
  }

  function handleDeleteCustomDeck(deckTitle: string) {
    const updatedDecks = customDecks.filter((d) => d !== deckTitle)
    setCustomDecks(updatedDecks)
    try {
      localStorage.setItem(
        'nihongo_custom_anki_decks_v1',
        JSON.stringify(updatedDecks)
      )
    } catch {
      // ignore
    }
    const nextCards = cards.filter((c) => c.deckName !== deckTitle)
    updateCards(nextCards)
    if (selectedDeckName === deckTitle) setSelectedDeckName(null)
    toast.info(`Removed deck "${deckTitle}".`)
  }

  function updateCards(next: SRSCard[]) {
    setCards(next)
    saveSRSCards(next)
  }

  // Filter active due queue
  const queue = useMemo(() => {
    const now = Date.now() + 60 * 1000
    return cards
      .filter((c) => (c.queue || 'active') === 'active')
      .filter((c) =>
        selectedDeckName
          ? c.deckName === selectedDeckName
          : categoryFilter === 'all' || c.category === categoryFilter
      )
      .filter((c) => cramMode || c.dueDate <= now)
      .sort((a, b) => a.dueDate - b.dueDate)
      .slice(0, deckOptions.maxReviewsPerDay)
  }, [
    cards,
    categoryFilter,
    selectedDeckName,
    cramMode,
    deckOptions.maxReviewsPerDay,
  ])

  const currentCard = queue[0] || null

  // Per-deck New / Learn / Due counts for the Anki Decks table
  const deckTreeCounts = useMemo(() => {
    const now = Date.now() + 60 * 1000
    const categories: ('all' | CardCategory)[] = [
      'all',
      'vocabulary',
      'kanji',
      'kana',
      'grammar',
    ]
    return categories.map((cat) => {
      const subset = cards.filter(
        (c) =>
          (c.queue || 'active') === 'active' &&
          (cat === 'all' || c.category === cat)
      )
      const dueSubset = subset.filter((c) => c.dueDate <= now)
      return {
        category: cat,
        title:
          cat === 'all'
            ? 'Japanese (All Decks)'
            : CATEGORY_TO_DECK[cat],
        newCount: dueSubset.filter((c) => c.status === 'new').length,
        learnCount: dueSubset.filter((c) => c.status === 'learning').length,
        reviewCount: dueSubset.filter(
          (c) => c.status === 'review' || c.status === 'mastered'
        ).length,
        totalCount: subset.length,
      }
    })
  }, [cards])

  // Installed & Custom Decks rows
  const customDeckRows = useMemo(() => {
    const now = Date.now() + 60 * 1000
    const defaultNames = new Set(Object.values(CATEGORY_TO_DECK))
    const allDeckNames = new Set<string>(customDecks)
    cards.forEach((c) => {
      if (c.deckName && !defaultNames.has(c.deckName)) {
        allDeckNames.add(c.deckName)
      }
    })
    return Array.from(allDeckNames).map((deckName) => {
      const subset = cards.filter(
        (c) => (c.queue || 'active') === 'active' && c.deckName === deckName
      )
      const dueSubset = subset.filter((c) => c.dueDate <= now)
      return {
        deckName,
        newCount: dueSubset.filter((c) => c.status === 'new').length,
        learnCount: dueSubset.filter((c) => c.status === 'learning').length,
        reviewCount: dueSubset.filter(
          (c) => c.status === 'review' || c.status === 'mastered'
        ).length,
        totalCount: subset.length,
      }
    })
  }, [cards, customDecks])

  const handleRate = useCallback(
    (rating: CardRating) => {
      if (!currentCard) return
      // Push previous state to Undo stack
      setUndoStack((prev) => [...prev.slice(-19), currentCard])

      const updatedCard = calculateSM2(currentCard, rating, deckOptions)
      const nextCards = cards.map((c) =>
        c.id === currentCard.id ? updatedCard : c
      )
      setCards(nextCards)
      saveSRSCards(nextCards)
      appendReviewLog(currentCard.id, rating, updatedCard.interval)
      setReviewLogs(loadReviewLogs())

      setShowAnswer(false)
      setTypedAnswer('')
      setSessionReviewed((prev) => prev + 1)

      const userStats = loadUserStats()
      saveUserStats({
        xp: userStats.xp + (rating === 'again' ? 2 : 10),
        reviewsCompletedToday: (userStats.reviewsCompletedToday || 0) + 1,
      })
    },
    [currentCard, cards, deckOptions]
  )

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    const previousCard = undoStack[undoStack.length - 1]
    setUndoStack((prev) => prev.slice(0, -1))
    const nextCards = cards.map((c) =>
      c.id === previousCard.id ? previousCard : c
    )
    setCards(nextCards)
    saveSRSCards(nextCards)
    setShowAnswer(false)
    setTypedAnswer('')
    setSessionReviewed((prev) => Math.max(0, prev - 1))
    toast.info(`Undid review for "${previousCard.front}"`)
  }, [undoStack, cards])

  function handleBuryCurrent() {
    if (!currentCard) return
    setUndoStack((prev) => [...prev.slice(-19), currentCard])
    const next = cards.map((c) =>
      c.id === currentCard.id ? { ...c, queue: 'buried' as const } : c
    )
    updateCards(next)
    setShowAnswer(false)
    setTypedAnswer('')
    toast.info('Card buried until next session (-)')
  }

  function handleSuspendCurrent() {
    if (!currentCard) return
    setUndoStack((prev) => [...prev.slice(-19), currentCard])
    const next = cards.map((c) =>
      c.id === currentCard.id ? { ...c, queue: 'suspended' as const } : c
    )
    updateCards(next)
    setShowAnswer(false)
    setTypedAnswer('')
    toast.info('Card suspended (@). Unsuspend anytime in Browse.')
  }

  function handleCycleFlagCurrent() {
    if (!currentCard) return
    const nextFlag = (((currentCard.flag || 0) + 1) % 5) as AnkiFlag
    const next = cards.map((c) =>
      c.id === currentCard.id ? { ...c, flag: nextFlag } : c
    )
    updateCards(next)
  }

  // Keyboard shortcuts: Space to reveal, 1/2/3/4 to rate, z to undo, r to replay audio, - to bury, @ to suspend
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }
      if (activeTab !== 'study') return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        handleUndo()
        return
      }
      if (!currentCard) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (!showAnswer) {
          setShowAnswer(true)
          if (deckOptions.autoPlayAudio) speakJapanese(currentCard.front)
        }
      } else if (e.key.toLowerCase() === 'r') {
        speakJapanese(currentCard.front)
      } else if (e.key === '-') {
        handleBuryCurrent()
      } else if (e.key === '@') {
        handleSuspendCurrent()
      } else if (showAnswer) {
        if (e.key === '1') handleRate('again')
        if (e.key === '2') handleRate('hard')
        if (e.key === '3') handleRate('good')
        if (e.key === '4') handleRate('easy')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function handleAddCard(e: React.FormEvent) {
    e.preventDefault()
    if (!newFront.trim() || !newMeaning.trim()) {
      toast.error('Please enter both the Front and Meaning fields.')
      return
    }
    const targetDeck = newCustomDeckTarget.trim() || undefined
    addCustomSRSCard({
      front: newFront.trim().slice(0, 200),
      reading:
        newReading.trim().slice(0, 100) || newFront.trim().slice(0, 100),
      meaning: newMeaning.trim().slice(0, 200),
      category: newCategory,
      jlptLevel: newLevel,
      noteType: newNoteType,
      deckName: targetDeck,
      exampleSentence: newExample.trim().slice(0, 200) || undefined,
      tags: newTags
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean),
    })
    setCards(loadSRSCards())
    setNewFront('')
    setNewReading('')
    setNewMeaning('')
    setNewExample('')
    toast.success(
      `Added ${newNoteType.toUpperCase()} note to ${
        targetDeck || CATEGORY_TO_DECK[newCategory]
      }!`
    )
    if (targetDeck) {
      setSelectedDeckName(targetDeck)
    }
    setActiveTab('study')
  }

  function handleResetDeck() {
    const now = Date.now()
    const reset: SRSCard[] = DEFAULT_SRS_CARDS.map((card) => ({
      ...card,
      deckName: card.deckName || CATEGORY_TO_DECK[card.category],
      noteType: card.noteType || 'basic',
      flag: 0,
      queue: 'active',
      lapses: 0,
      tags: card.tags || [card.jlptLevel, card.category],
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      stability: 1.0,
      difficulty: 5.0,
      dueDate: now,
      status: 'new',
    }))
    updateCards(reset)
    setCramMode(false)
    setShowAnswer(false)
    setSessionReviewed(0)
    setUndoStack([])
    toast.success('Anki deck reset! All cards are due for review.')
  }

  const intervalLabels = currentCard
    ? getIntervalLabels(currentCard, deckOptions)
    : { again: '< 1m', hard: '1d', good: '4d', easy: '7d' }

  const totalSessionCards = sessionReviewed + queue.length
  const progressPercent =
    totalSessionCards > 0
      ? Math.round((sessionReviewed / totalSessionCards) * 100)
      : 100

  const typeDiff = useMemo(() => {
    if (!currentCard || currentCard.noteType !== 'type' || !showAnswer)
      return null
    return diffTypedAnswer(currentCard.reading, typedAnswer)
  }, [currentCard, showAnswer, typedAnswer])

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Anki Navigation Header (Decks | Study | Add | Browse | Stats | Sync) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Anki SRS Workspace
            </h1>
            <Badge variant="secondary" className="uppercase text-[10px]">
              {deckOptions.algorithm === 'fsrs' ? 'FSRS v4.5' : 'SM-2'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Create your own decks, install Anki <code className="font-mono">.apkg</code> decks, and review with FSRS/SM-2.
          </p>
        </div>

        {/* Anki Desktop-Style Top Menu Bar */}
        <div className="flex flex-wrap gap-1.5 bg-muted p-1 rounded-lg">
          {(
            [
              { id: 'decks', label: 'Decks', icon: Layers },
              { id: 'study', label: 'Study', icon: Play },
              { id: 'add', label: 'Add', icon: Plus },
              { id: 'browse', label: 'Browse', icon: Search },
              { id: 'stats', label: 'Stats', icon: BarChart3 },
              { id: 'sync', label: 'Install / Sync', icon: RefreshCw },
            ] as const
          ).map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                  activeTab === t.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* TAB 1: ANKI DECKS TREE & DECK OPTIONS */}
      {activeTab === 'decks' && (
        <div className="space-y-6">
          {/* Create Your Own Custom Deck & Install Anki Deck Bar */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <form
                onSubmit={handleCreateCustomDeck}
                className="flex flex-1 items-center gap-2"
              >
                <Input
                  value={newDeckInput}
                  onChange={(e) => setNewDeckInput(e.target.value)}
                  placeholder="Create your own deck (e.g. My Anime Deck, N4 Verbs)..."
                  className="bg-background"
                />
                <Button type="submit" size="sm" className="shrink-0">
                  <Plus className="h-4 w-4 mr-1" /> Create Deck
                </Button>
              </form>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab('sync')}
                className="shrink-0"
              >
                📥 Install Anki Deck (.apkg / Shared)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Anki Decks</CardTitle>
                <CardDescription>
                  Click any deck (built-in or user-installed) to start reviewing due cards.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDeckOptionsModal((v) => !v)}
                >
                  <Settings2 className="h-4 w-4 mr-1.5" /> Deck Options
                </Button>
                <Button size="sm" variant="ghost" onClick={handleResetDeck}>
                  <RotateCcw className="h-4 w-4 mr-1.5" /> Reset All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden divide-y">
                <div className="grid grid-cols-12 bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground">
                  <div className="col-span-6 sm:col-span-7">Deck</div>
                  <div className="col-span-2 text-center text-blue-600 dark:text-blue-400">
                    New
                  </div>
                  <div className="col-span-2 text-center text-orange-500">
                    Learn
                  </div>
                  <div className="col-span-2 sm:col-span-1 text-center text-green-600 dark:text-green-400">
                    Due
                  </div>
                </div>
                {deckTreeCounts.map((row) => (
                  <div
                    key={row.category}
                    onClick={() => {
                      setSelectedDeckName(null)
                      setCategoryFilter(row.category)
                      setActiveTab('study')
                    }}
                    className={`grid grid-cols-12 items-center px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-muted/40 ${
                      !selectedDeckName && categoryFilter === row.category
                        ? 'bg-primary/5 font-semibold'
                        : ''
                    }`}
                  >
                    <div className="col-span-6 sm:col-span-7 flex items-center gap-2 truncate">
                      <span>
                        {row.category === 'all' ? '📂' : '└─ 📘'} {row.title}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        ({row.totalCount} total)
                      </span>
                    </div>
                    <div className="col-span-2 text-center font-bold text-blue-600 dark:text-blue-400">
                      {row.newCount}
                    </div>
                    <div className="col-span-2 text-center font-bold text-orange-500">
                      {row.learnCount}
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-center font-bold text-green-600 dark:text-green-400">
                      {row.reviewCount}
                    </div>
                  </div>
                ))}

                {/* Installed & Custom User Decks */}
                {customDeckRows.map((cRow) => (
                  <div
                    key={cRow.deckName}
                    onClick={() => {
                      setSelectedDeckName(cRow.deckName)
                      setActiveTab('study')
                    }}
                    className={`grid grid-cols-12 items-center px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-muted/40 ${
                      selectedDeckName === cRow.deckName
                        ? 'bg-primary/5 font-semibold'
                        : ''
                    }`}
                  >
                    <div className="col-span-6 sm:col-span-7 flex items-center justify-between gap-2 truncate pr-2">
                      <div className="truncate">
                        <span>└─ 📦 {cRow.deckName}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">
                          ({cRow.totalCount} cards)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[11px]"
                          onClick={(e) => {
                            e.stopPropagation()
                            setNewCustomDeckTarget(cRow.deckName)
                            setActiveTab('add')
                          }}
                        >
                          + Add Card
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCustomDeck(cRow.deckName)
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="col-span-2 text-center font-bold text-blue-600 dark:text-blue-400">
                      {cRow.newCount}
                    </div>
                    <div className="col-span-2 text-center font-bold text-orange-500">
                      {cRow.learnCount}
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-center font-bold text-green-600 dark:text-green-400">
                      {cRow.reviewCount}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Study / Filtered Deck Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  <strong>Custom Study (Filtered Deck):</strong> Practice ahead of schedule without waiting for due dates.
                </div>
                <Button
                  size="sm"
                  variant={cramMode ? 'default' : 'outline'}
                  onClick={() => {
                    setCramMode((v) => !v)
                    setActiveTab('study')
                    toast.success(
                      !cramMode
                        ? 'Custom Study (Cram Mode) enabled!'
                        : 'Returned to standard due schedule.'
                    )
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  {cramMode ? 'Exit Cram Mode' : 'Cram All Cards Now'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Deck Options Drawer */}
          {showDeckOptionsModal && (
            <Card className="border-primary/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Anki Deck Options ({deckOptions.algorithm.toUpperCase()})
                </CardTitle>
                <CardDescription>
                  Customize the spaced repetition scheduler, target retention, daily limits, and leech threshold.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Scheduler Algorithm</Label>
                  <select
                    value={deckOptions.algorithm}
                    onChange={(e) =>
                      setDeckOptions(
                        saveDeckOptions({
                          algorithm: e.target.value as AnkiDeckOptions['algorithm'],
                        })
                      )
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="fsrs">FSRS v4.5 (Modern Anki)</option>
                    <option value="sm2">Classic SM-2 (Legacy Anki)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>FSRS Desired Retention (0.75–0.97)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.75"
                    max="0.97"
                    value={deckOptions.desiredRetention}
                    onChange={(e) =>
                      setDeckOptions(
                        saveDeckOptions({
                          desiredRetention:
                            Number(e.target.value) || 0.9,
                        })
                      )
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Max Reviews / Day</Label>
                  <Input
                    type="number"
                    min="10"
                    max="1000"
                    value={deckOptions.maxReviewsPerDay}
                    onChange={(e) =>
                      setDeckOptions(
                        saveDeckOptions({
                          maxReviewsPerDay: Number(e.target.value) || 200,
                        })
                      )
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Graduating Interval (days)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={deckOptions.graduatingInterval}
                    onChange={(e) =>
                      setDeckOptions(
                        saveDeckOptions({
                          graduatingInterval: Number(e.target.value) || 1,
                        })
                      )
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Easy Interval (days)</Label>
                  <Input
                    type="number"
                    min="2"
                    max="60"
                    value={deckOptions.easyInterval}
                    onChange={(e) =>
                      setDeckOptions(
                        saveDeckOptions({
                          easyInterval: Number(e.target.value) || 4,
                        })
                      )
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Leech Threshold (lapses)</Label>
                  <Input
                    type="number"
                    min="3"
                    max="20"
                    value={deckOptions.leechThreshold}
                    onChange={(e) =>
                      setDeckOptions(
                        saveDeckOptions({
                          leechThreshold: Number(e.target.value) || 8,
                        })
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: ANKI REVIEWER (STUDY) */}
      {activeTab === 'study' && (
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Deck Filter Pills */}
          <div className="flex flex-wrap gap-1.5 bg-muted p-1 rounded-lg">
            {(
              [
                { id: 'all', label: 'All Decks' },
                { id: 'vocabulary', label: 'Vocabulary' },
                { id: 'kanji', label: 'Kanji' },
                { id: 'kana', label: 'Kana' },
                { id: 'grammar', label: 'Grammar' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategoryFilter(cat.id)
                  setShowAnswer(false)
                  setTypedAnswer('')
                }}
                className={`flex-1 min-w-[72px] rounded-md py-1.5 px-2 text-xs font-medium transition-all ${
                  categoryFilter === cat.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Session Progress & Action Bar */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Reviewed: <strong>{sessionReviewed}</strong> /{' '}
                {totalSessionCards} ({progressPercent}%)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  disabled={undoStack.length === 0}
                  onClick={handleUndo}
                  title="Undo last review (Ctrl+Z)"
                >
                  <Undo2 className="h-3.5 w-3.5 mr-1" /> Undo
                </Button>
                {currentCard && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={handleCycleFlagCurrent}
                      title="Flag card"
                    >
                      <Flag
                        className={`h-3.5 w-3.5 mr-1 ${
                          FLAG_COLORS[(currentCard.flag || 0) as AnkiFlag]
                        }`}
                      />
                      Flag
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={handleBuryCurrent}
                      title="Bury card until tomorrow (-)"
                    >
                      <EyeOff className="h-3.5 w-3.5 mr-1" /> Bury
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={handleSuspendCurrent}
                      title="Suspend card (@)"
                    >
                      <PauseCircle className="h-3.5 w-3.5 mr-1" /> Suspend
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Active Card or Session Complete */}
          {currentCard ? (
            <div className="space-y-5">
              <Card
                className="min-h-[320px] flex flex-col justify-between p-5 sm:p-8 shadow-sm hover:border-primary/50 transition-all"
                onClick={() => {
                  if (!showAnswer && currentCard.noteType !== 'type') {
                    setShowAnswer(true)
                    if (deckOptions.autoPlayAudio)
                      speakJapanese(currentCard.front)
                  }
                }}
              >
                {/* Card Header Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="uppercase text-[10px]">
                      {currentCard.category}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {currentCard.jlptLevel}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {currentCard.noteType || 'basic'}
                    </Badge>
                    {(currentCard.tags || []).includes('leech') && (
                      <Badge variant="destructive" className="text-[10px]">
                        🩸 Leech
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      speakJapanese(currentCard.front)
                    }}
                    title="Replay audio (R)"
                  >
                    <Volume2 className="h-4 w-4 mr-1" /> Audio
                  </Button>
                </div>

                {/* Card Prompt Body (Adapts to Note Type: basic, reversed, cloze, type) */}
                <CardContent className="py-6 px-0 text-center space-y-6">
                  {currentCard.noteType === 'reversed' ? (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Recall Japanese for:
                      </p>
                      <h2 className="text-3xl sm:text-4xl font-bold">
                        {currentCard.meaning}
                      </h2>
                    </div>
                  ) : currentCard.noteType === 'cloze' ? (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Cloze Deletion
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-bold leading-relaxed">
                        {renderAnkiText(currentCard.front, {
                          isClozeRevealed: showAnswer,
                        })}
                      </h2>
                    </div>
                  ) : (
                    <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-snug">
                      {showAnswer
                        ? renderAnkiText(currentCard.front)
                        : currentCard.front.replace(/\[[^\]]+\]/g, '')}
                    </h2>
                  )}

                  {/* Type-in-the-Answer Input Field */}
                  {currentCard.noteType === 'type' && !showAnswer && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        setTypedAnswer((prev) =>
                          convertRomajiToKana(prev, { finalizeTrailingN: true })
                        )
                        setShowAnswer(true)
                        if (deckOptions.autoPlayAudio)
                          speakJapanese(currentCard.front)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="max-w-xs mx-auto space-y-2 pt-2"
                    >
                      <Input
                        placeholder="Type reading (auto-converts romaji → kana)..."
                        value={typedAnswer}
                        onChange={(e) =>
                          setTypedAnswer(convertRomajiToKana(e.target.value))
                        }
                        className="text-center"
                        autoFocus
                      />
                      <Button type="submit" size="sm" className="w-full">
                        Check Typed Answer
                      </Button>
                    </form>
                  )}

                  {/* Revealed Back Side */}
                  {showAnswer ? (
                    <div className="space-y-4 pt-4 border-t animate-in fade-in duration-200">
                      {/* Type-in-Answer Character Diff */}
                      {typeDiff && (
                        <div className="rounded-lg bg-muted/60 p-2.5 text-sm">
                          <p className="text-xs text-muted-foreground mb-1">
                            Typed Answer Check:
                          </p>
                          <div className="font-mono text-base font-bold tracking-wider">
                            {typeDiff.diffs.map((d, idx) => (
                              <span
                                key={idx}
                                className={
                                  d.status === 'correct'
                                    ? 'text-green-600 dark:text-green-400'
                                    : d.status === 'wrong'
                                    ? 'text-red-500 line-through'
                                    : 'text-orange-500 underline'
                                }
                              >
                                {d.char}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        {currentCard.noteType === 'reversed' && (
                          <p className="text-3xl font-bold mb-1">
                            {renderAnkiText(currentCard.front)}
                          </p>
                        )}
                        <p className="text-xl sm:text-2xl text-blue-600 dark:text-blue-400 font-semibold">
                          {currentCard.reading}
                        </p>
                        <p className="text-lg sm:text-xl font-medium text-foreground mt-1">
                          {currentCard.meaning}
                        </p>
                      </div>

                      {(currentCard.exampleSentence ||
                        currentCard.exampleTranslation) && (
                        <div className="rounded-lg bg-muted/60 p-3 text-sm max-w-md mx-auto">
                          {currentCard.exampleSentence && (
                            <div className="flex items-center justify-center gap-2">
                              <p className="font-medium text-foreground">
                                {renderAnkiText(currentCard.exampleSentence)}
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  speakJapanese(currentCard.exampleSentence!)
                                }}
                                className="text-muted-foreground hover:text-primary shrink-0"
                                title="Play sentence audio"
                              >
                                <Volume2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          {currentCard.exampleTranslation && (
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {currentCard.exampleTranslation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    currentCard.noteType !== 'type' && (
                      <p className="text-xs sm:text-sm text-muted-foreground pt-4">
                        Tap card or press{' '}
                        <kbd className="px-1.5 py-0.5 border rounded bg-muted text-xs">
                          Space
                        </kbd>{' '}
                        to show answer
                      </p>
                    )
                  )}
                </CardContent>

                {/* Bottom FSRS / SM-2 Telemetry */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground border-t pt-3">
                  <span>{currentCard.deckName}</span>
                  <span>
                    Ivl: {currentCard.interval}d · S:{' '}
                    {(currentCard.stability ?? 1).toFixed(1)} · D:{' '}
                    {(currentCard.difficulty ?? 5).toFixed(1)}
                  </span>
                </div>
              </Card>

              {/* Anki 4-Button Rating Bar (Dark Mode Compatible) */}
              {showAnswer ? (
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                    onClick={() => handleRate('again')}
                  >
                    <span className="font-semibold text-xs sm:text-sm">
                      Again
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {intervalLabels.again}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10"
                    onClick={() => handleRate('hard')}
                  >
                    <span className="font-semibold text-xs sm:text-sm">
                      Hard
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {intervalLabels.hard}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                    onClick={() => handleRate('good')}
                  >
                    <span className="font-semibold text-xs sm:text-sm">
                      Good
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {intervalLabels.good}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                    onClick={() => handleRate('easy')}
                  >
                    <span className="font-semibold text-xs sm:text-sm">
                      Easy
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {intervalLabels.easy}
                    </span>
                  </Button>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setShowAnswer(true)
                    if (deckOptions.autoPlayAudio)
                      speakJapanese(currentCard.front)
                  }}
                >
                  Show Answer
                </Button>
              )}
            </div>
          ) : (
            <Card className="p-8 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">
                  Congratulations! You have finished this deck for now. 🎉
                </h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  You reviewed {sessionReviewed} cards in this session. Use Custom Study (Cram) to review ahead of schedule or browse your collection.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button onClick={() => setCramMode(true)}>
                  <Sparkles className="h-4 w-4 mr-1.5" /> Custom Study (Cram All)
                </Button>
                <Button variant="outline" onClick={handleResetDeck}>
                  <RotateCcw className="h-4 w-4 mr-1.5" /> Reset Due Dates
                </Button>
                <Button variant="secondary" onClick={() => setActiveTab('stats')}>
                  <BarChart3 className="h-4 w-4 mr-1.5" /> View Anki Stats
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: ANKI ADD NOTE EDITOR */}
      {activeTab === 'add' && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">Add Anki Note</CardTitle>
            <CardDescription>
              Supports Basic, Reversed, Cloze deletion (<code className="font-mono">{'{{c1::answer::hint}}'}</code>), Type-in-Answer, and Furigana (<code className="font-mono">漢字[かんじ]</code>).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCard} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Note Type</Label>
                  <select
                    value={newNoteType}
                    onChange={(e) =>
                      setNewNoteType(e.target.value as AnkiNoteType)
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="basic">Basic (JP &rarr; EN)</option>
                    <option value="reversed">Basic &amp; Reversed (EN &rarr; JP)</option>
                    <option value="cloze">Cloze Deletion</option>
                    <option value="type">Type in the Answer</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Deck</Label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as CardCategory)
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="vocabulary">Japanese::JLPT Vocabulary</option>
                    <option value="kanji">Japanese::JLPT Kanji</option>
                    <option value="grammar">Japanese::JLPT Grammar</option>
                    <option value="kana">Japanese::Hiragana &amp; Katakana</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>JLPT Level</Label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N2">N2</option>
                    <option value="N1">N1</option>
                  </select>
                </div>
              </div>

              {/* Optional Custom Deck Target */}
              <div className="space-y-1.5">
                <Label htmlFor="custom-deck-target">
                  Custom Deck Name (Optional — leave blank to use default category deck)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-deck-target"
                    value={newCustomDeckTarget}
                    onChange={(e) => setNewCustomDeckTarget(e.target.value)}
                    placeholder="e.g. Japanese::My Custom Deck"
                  />
                  {customDeckRows.length > 0 && (
                    <select
                      value={newCustomDeckTarget}
                      onChange={(e) => setNewCustomDeckTarget(e.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="">Default Deck</option>
                      {customDeckRows.map((d) => (
                        <option key={d.deckName} value={d.deckName}>
                          {d.deckName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="front">
                    Front (Japanese / Cloze Expression) *
                  </Label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewFront((prev) =>
                        prev ? `${prev} {{c1::言葉::word}}` : '{{c1::食べる[たべる]::to eat}}'
                      )
                    }
                    className="text-xs text-primary hover:underline"
                  >
                    + Insert {'{{c1::Cloze}}'}
                  </button>
                </div>
                <Input
                  id="front"
                  placeholder="e.g. 食べる[たべる] or 日本[にほん]へ {{c1::行きたい::want to go}} です。"
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reading">Reading (Kana / Romaji)</Label>
                  <Input
                    id="reading"
                    placeholder="e.g. たべる (taberu)"
                    value={newReading}
                    onChange={(e) => setNewReading(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="meaning">Back / Meaning *</Label>
                  <Input
                    id="meaning"
                    placeholder="e.g. to eat"
                    value={newMeaning}
                    onChange={(e) => setNewMeaning(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="example">Example Sentence (Optional)</Label>
                  <Input
                    id="example"
                    placeholder="e.g. りんごを 食べる[たべる]。"
                    value={newExample}
                    onChange={(e) => setNewExample(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tags">Anki Tags (space-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="N5 verb food"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-1.5" /> Add Note to Anki Deck
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: ANKI CARD BROWSER */}
      {activeTab === 'browse' && (
        <AnkiBrowser cards={cards} onUpdateCards={updateCards} />
      )}

      {/* TAB 5: ANKI STATISTICS & HEATMAP */}
      {activeTab === 'stats' && (
        <AnkiStats cards={cards} reviewLogs={reviewLogs} />
      )}

      {/* TAB 6: ANKI .APKG IMPORT */}
      {activeTab === 'sync' && (
        <AnkiSyncPanel
          cards={cards}
          onCardsChanged={updateCards}
          onImportSuccess={(deckName) => {
            const updated = Array.from(new Set([...customDecks, deckName]))
            setCustomDecks(updated)
            try {
              localStorage.setItem(
                'nihongo_custom_anki_decks_v1',
                JSON.stringify(updated)
              )
            } catch {
              // ignore
            }
            setSelectedDeckName(deckName)
            setActiveTab('decks')
          }}
        />
      )}
    </div>
  )
}
