'use client'

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Volume2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  SlidersHorizontal,
  Search,
  Plus,
  ArrowRight,
  BookOpen,
  X,
  FileCode,
  Upload,
} from 'lucide-react'
import { useProgress } from '@/lib/progress'
import {
  calculateSM2,
  getIntervalLabels,
  speakJapanese,
  type SRSCard,
  type CardRating,
  type CardCategory,
} from '@/data/srs-deck'
import { parseAnkiApkgBinary } from '@/lib/anki/importer'
import { renderAnkiText } from '@/lib/anki/furigana'
import { convertRomajiToKana } from '@/lib/kana-ime'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type ReviewTab = 'review' | 'weak' | 'browse' | 'add'

function ReviewContent() {
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode') === 'weak' ? 'weak' : 'review'

  const {
    cards,
    updateCards,
    upsertCards,
    recordReview,
    weakPoints,
    addWeakPoint,
    removeWeakPoint,
    deckOptions,
    updateStats,
    stats,
    isLoading,
  } = useProgress()

  const [activeTab, setActiveTab] = useState<ReviewTab>(initialMode)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Current session queue
  const [sessionCards, setSessionCards] = useState<SRSCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [typedInput, setTypedInput] = useState('')
  const [completedCount, setCompletedCount] = useState(0)
  const [sessionLapses, setSessionLapses] = useState<SRSCard[]>([])

  // Browse search
  const [searchQuery, setSearchQuery] = useState('')

  // Add Card form state
  const [addMode, setAddMode] = useState<'single' | 'apkg'>('single')
  const [newFront, setNewFront] = useState('')
  const [newReading, setNewReading] = useState('')
  const [newMeaning, setNewMeaning] = useState('')
  const [newCategory, setNewCategory] = useState<CardCategory>('vocabulary')
  const [newJlpt, setNewJlpt] = useState('N5')
  const [isImportingApkg, setIsImportingApkg] = useState(false)

  // Initialize review queue (reviews due + capped new cards for realistic daily session)
  useEffect(() => {
    if (isLoading) return
    const now = Date.now() + 60 * 1000
    const activeCards = cards.filter((c) => c.queue !== 'suspended')

    // 1. Cards scheduled for review today
    const reviewsDue = activeCards.filter((c) => c.status !== 'new' && (c.dueDate || 0) <= now)

    // 2. New cards capped by daily limit
    const newCardsAll = activeCards.filter((c) => c.status === 'new' || (c.repetition === 0 && c.interval === 0))
    const newCardsCap = Math.max(5, deckOptions.newCardsPerDay || 20)
    const newCardsToday = newCardsAll.slice(0, newCardsCap)

    const sessionQueue = [...reviewsDue, ...newCardsToday]
    // Shuffle slightly for spaced review
    const shuffled = [...sessionQueue].sort(() => Math.random() - 0.5)
    setSessionCards(shuffled)
    setCurrentIndex(0)
    setIsRevealed(false)
    setTypedInput('')
    setCompletedCount(0)
    setSessionLapses([])
  }, [cards, isLoading, deckOptions.newCardsPerDay])

  const currentCard: SRSCard | undefined = sessionCards[currentIndex]

  // Play audio on reveal if autoPlayAudio is enabled
  useEffect(() => {
    if (isRevealed && currentCard && deckOptions.autoPlayAudio) {
      speakJapanese(currentCard.reading || currentCard.front, {
        rate: stats.audioSpeed || 1.0,
      })
    }
  }, [isRevealed, currentCard, deckOptions.autoPlayAudio, stats.audioSpeed])

  // Answer intervals preview
  const intervals = useMemo(() => {
    if (!currentCard) return { again: '< 1m', hard: '1d', good: '2d', easy: '4d' }
    return getIntervalLabels(currentCard, deckOptions)
  }, [currentCard, deckOptions])

  // Reveal card
  const handleReveal = useCallback(() => {
    setIsRevealed(true)
  }, [])

  // Grade card rating
  const handleRate = useCallback(
    async (rating: CardRating) => {
      if (!currentCard) return

      const updatedCard = calculateSM2(currentCard, rating, deckOptions)
      const now = Date.now()

      // Log review
      await recordReview({
        cardId: currentCard.id,
        rating,
        interval: updatedCard.interval,
        timestamp: now,
      })

      // If lapse (Again or Hard), register weak point
      if (rating === 'again' || rating === 'hard') {
        setSessionLapses((prev) => [...prev, currentCard])
        await addWeakPoint({
          id: currentCard.id,
          front: currentCard.front,
          reading: currentCard.reading,
          meaning: currentCard.meaning,
          type:
            currentCard.category === 'kana'
              ? 'kana'
              : currentCard.category === 'grammar'
              ? 'grammar'
              : currentCard.category === 'kanji'
              ? 'kanji'
              : 'vocab',
          notes: currentCard.exampleSentence,
        })
      }

      // Update in main cards collection
      const nextAllCards = cards.map((c) => (c.id === currentCard.id ? updatedCard : c))
      await updateCards(nextAllCards)

      // Update local study stats
      await updateStats({
        reviewsCompletedToday: (stats.reviewsCompletedToday || 0) + 1,
      })

      // If rated 'again', push to end of current session queue to repeat
      if (rating === 'again') {
        setSessionCards((prev) => [...prev, updatedCard])
      }

      setCompletedCount((prev) => prev + 1)
      setCurrentIndex((prev) => prev + 1)
      setIsRevealed(false)
      setTypedInput('')
    },
    [currentCard, deckOptions, cards, recordReview, addWeakPoint, updateCards, updateStats, stats]
  )

  // Keyboard shortcuts (Space = reveal, 1 = Again, 2 = Hard, 3 = Good, 4 = Easy)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (activeTab !== 'review' || !currentCard) return
      // Ignore if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        if (e.key === 'Enter' && !isRevealed) {
          e.preventDefault()
          handleReveal()
        }
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        if (!isRevealed) {
          handleReveal()
        } else {
          handleRate('good')
        }
      } else if (isRevealed) {
        if (e.key === '1') handleRate('again')
        else if (e.key === '2') handleRate('hard')
        else if (e.key === '3') handleRate('good')
        else if (e.key === '4') handleRate('easy')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, currentCard, isRevealed, handleReveal, handleRate])

  // Handle adding custom card
  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault()
    if (!newFront.trim() || !newMeaning.trim()) {
      toast.error('Please enter character/word and meaning')
      return
    }

    const newCard: SRSCard = {
      id: `card-${Date.now()}`,
      front: newFront.trim(),
      reading: newReading.trim() || newFront.trim(),
      meaning: newMeaning.trim(),
      category: newCategory,
      jlptLevel: newJlpt,
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: Date.now(),
      status: 'new',
      queue: 'active',
      lapses: 0,
    }

    await updateCards([newCard, ...cards])
    toast.success(`Card "${newCard.front}" added to review queue!`)
    setNewFront('')
    setNewReading('')
    setNewMeaning('')
    setActiveTab('review')
  }

  async function handleImportApkgFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImportingApkg(true)
    try {
      toast.info(`Extracting cards from ${file.name}...`)
      const parsed = await parseAnkiApkgBinary(file)
      if (parsed && parsed.length > 0) {
        const newCards: SRSCard[] = parsed.map((p, idx) => ({
          id: `apkg-${Date.now()}-${idx}`,
          front: p.front,
          reading: p.reading,
          meaning: p.meaning,
          category: p.category || 'vocabulary',
          jlptLevel: p.jlptLevel || 'N5',
          exampleSentence: p.exampleSentence,
          exampleTranslation: p.exampleTranslation,
          tags: p.tags,
          interval: 0,
          repetition: 0,
          efactor: 2.5,
          dueDate: Date.now(),
          status: 'new' as const,
          queue: 'active' as const,
          lapses: 0,
        }))
        const res = await upsertCards(newCards)
        toast.success(`Successfully imported ${res.addedCount} cards from ${file.name}!`)
        setActiveTab('browse')
      } else {
        toast.error('No readable notes or cards found in this .apkg file')
      }
    } catch {
      toast.error('Failed to parse .apkg file')
    } finally {
      setIsImportingApkg(false)
    }
  }

  // Filter cards for Browse tab
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards
    const q = searchQuery.toLowerCase()
    return cards.filter(
      (c) =>
        c.front.toLowerCase().includes(q) ||
        c.reading.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q)
    )
  }, [cards, searchQuery])

  return (
    <div className="space-y-6 pb-16">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div className="flex items-center gap-3">
          <Link href="/today">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-xl text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Today
            </Button>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Spaced Review</h1>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl self-start sm:self-auto overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('review')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'review'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Review ({sessionCards.length - currentIndex > 0 ? sessionCards.length - currentIndex : 0})
          </button>
          <button
            onClick={() => setActiveTab('weak')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'weak'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            Weak Spots ({weakPoints.length})
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'browse'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Browse ({cards.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('add')
              setAddMode('single')
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
              activeTab === 'add' && addMode === 'single'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
          <button
            onClick={() => {
              setActiveTab('add')
              setAddMode('apkg')
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'add' && addMode === 'apkg'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileCode className="h-3.5 w-3.5 text-primary" />
            Import .apkg
          </button>
        </div>
      </div>

      {/* 1. REVIEW SESSION TAB */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          {isLoading ? (
            <Card className="p-8 text-center rounded-2xl">
              <p className="text-sm text-muted-foreground animate-pulse">Loading study queue...</p>
            </Card>
          ) : sessionCards.length === 0 || currentIndex >= sessionCards.length ? (
            /* Session Completed Screen */
            <Card className="text-center p-8 sm:p-12 rounded-2xl border-primary/20 bg-primary/5 space-y-5">
              <div className="h-16 w-16 bg-primary/15 text-primary rounded-full flex items-center justify-center mx-auto text-2xl">
                🎉
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Review Session Completed!</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  You reviewed {completedCount} card{completedCount === 1 ? '' : 's'} in this session.
                  All scheduled reviews for today are cleared.
                </p>
              </div>

              {sessionLapses.length > 0 && (
                <div className="p-4 rounded-xl border bg-background/80 max-w-md mx-auto text-left space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>{sessionLapses.length} item{sessionLapses.length === 1 ? '' : 's'} need extra practice:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sessionLapses.map((l, i) => (
                      <Badge key={i} variant="outline" className="font-japanese text-xs py-0.5">
                        {l.front} ({l.reading})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link href="/today">
                  <Button size="lg" className="rounded-xl gap-2 font-semibold">
                    Return to Today
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/path">
                  <Button variant="outline" size="lg" className="rounded-xl gap-2">
                    <BookOpen className="h-4 w-4" />
                    Continue Curriculum
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            /* Active Card Flashcard Player */
            <div className="space-y-4">
              {/* Progress indicator */}
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span className="font-mono">
                  Card {currentIndex + 1} of {sessionCards.length}
                </span>
                <span className="capitalize font-semibold text-primary">
                  {currentCard.category} • {currentCard.jlptLevel}
                </span>
              </div>

              {/* Flashcard Box */}
              <Card className="min-h-[320px] sm:min-h-[380px] flex flex-col justify-between p-6 sm:p-8 rounded-3xl border-2 border-border shadow-md transition-all">
                {/* Front Side */}
                <div className="space-y-6 text-center">
                  <div className="space-y-2">
                    <span className="text-4xl sm:text-6xl font-bold font-japanese tracking-tight block py-4 select-text">
                      {renderAnkiText(currentCard.front, { isClozeRevealed: isRevealed })}
                    </span>

                    <button
                      onClick={() =>
                        speakJapanese(currentCard.reading || currentCard.front, {
                          rate: stats.audioSpeed || 1.0,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 hover:bg-muted text-xs text-muted-foreground transition-colors"
                      aria-label="Play audio"
                    >
                      <Volume2 className="h-3.5 w-3.5 text-primary" />
                      Listen Pronunciation
                    </button>
                  </div>

                  {/* Optional typed input for kana recall */}
                  {!isRevealed && (
                    <div className="max-w-xs mx-auto">
                      <Input
                        placeholder="Type reading in romaji / kana (optional)..."
                        value={typedInput}
                        onChange={(e) => setTypedInput(convertRomajiToKana(e.target.value))}
                        className="text-center font-japanese text-sm rounded-xl h-10"
                        lang="ja"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                  )}

                  {/* Revealed Back Side */}
                  {isRevealed && (
                    <div className="pt-6 border-t animate-in fade-in-50 duration-150 space-y-4 text-left max-w-lg mx-auto">
                      {typedInput && (
                        <div className="p-2.5 rounded-xl bg-muted/40 border text-xs flex items-center justify-between">
                          <span className="text-muted-foreground">Your input:</span>
                          <span className="font-japanese font-bold">{typedInput}</span>
                          <span className="text-muted-foreground">Target:</span>
                          <span className="font-japanese font-bold text-primary">{currentCard.reading}</span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                          Reading &amp; Meaning
                        </span>
                        <div className="text-lg font-bold text-primary font-japanese">
                          {currentCard.reading}
                        </div>
                        <div className="text-base text-foreground font-medium">
                          {currentCard.meaning}
                        </div>
                      </div>

                      {currentCard.exampleSentence && (
                        <div className="space-y-1 pt-2 border-t text-xs">
                          <span className="uppercase tracking-wider font-semibold text-muted-foreground">
                            Example
                          </span>
                          <div className="text-sm font-japanese font-medium text-foreground">
                            {renderAnkiText(currentCard.exampleSentence, { isClozeRevealed: true })}
                          </div>
                          {currentCard.exampleTranslation && (
                            <div className="text-xs text-muted-foreground">
                              {currentCard.exampleTranslation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Rating / Action Buttons */}
                <div className="pt-6 mt-4">
                  {!isRevealed ? (
                    <Button
                      size="lg"
                      onClick={handleReveal}
                      className="w-full h-12 rounded-2xl font-bold text-base shadow-sm"
                    >
                      Show Answer (Space)
                    </Button>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 sm:gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleRate('again')}
                        className="h-14 sm:h-16 flex flex-col items-center justify-center p-1 rounded-2xl border-red-500/30 hover:bg-red-500/10 text-red-600 dark:text-red-400 font-bold"
                      >
                        <span className="text-sm">Again</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{intervals.again} (1)</span>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => handleRate('hard')}
                        className="h-14 sm:h-16 flex flex-col items-center justify-center p-1 rounded-2xl border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                      >
                        <span className="text-sm">Hard</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{intervals.hard} (2)</span>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => handleRate('good')}
                        className="h-14 sm:h-16 flex flex-col items-center justify-center p-1 rounded-2xl border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-bold"
                      >
                        <span className="text-sm">Good</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{intervals.good} (3)</span>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => handleRate('easy')}
                        className="h-14 sm:h-16 flex flex-col items-center justify-center p-1 rounded-2xl border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                      >
                        <span className="text-sm">Easy</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{intervals.easy} (4)</span>
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Collapsible Advanced Settings Drawer */}
          <div className="pt-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{showAdvanced ? 'Hide Advanced Settings' : 'Advanced Scheduler Settings'}</span>
            </button>

            {showAdvanced && (
              <Card className="mt-3 p-4 rounded-2xl border bg-muted/20 space-y-3 text-xs">
                <div className="font-bold text-foreground">Scheduler Defaults</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-muted-foreground">Algorithm</span>
                    <p className="font-semibold capitalize">{deckOptions.algorithm || 'SM-2'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">New Cards / Day</span>
                    <p className="font-semibold">{deckOptions.newCardsPerDay || 25}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Reviews / Day</span>
                    <p className="font-semibold">{deckOptions.maxReviewsPerDay || 200}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Leech Threshold</span>
                    <p className="font-semibold">{deckOptions.leechThreshold || 8} lapses</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 2. WEAK SPOTS TAB */}
      {activeTab === 'weak' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Focus Areas &amp; Weak Points</h2>
              <p className="text-xs text-muted-foreground">
                Items missed during reviews or quizzes automatically log here for dedicated recall drills.
              </p>
            </div>
          </div>

          {weakPoints.length === 0 ? (
            <Card className="p-8 text-center rounded-2xl">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold">No weak spots recorded!</p>
              <p className="text-xs text-muted-foreground mt-1">
                As you review, any tricky items you grade Again or Hard will appear here.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {weakPoints.map((item) => (
                <Card key={item.id || item.front} className="p-4 rounded-2xl flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-2xl font-bold font-japanese">{item.front}</span>
                        <p className="text-xs text-muted-foreground">{item.reading}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-xs font-mono">
                          {item.missCount} lapse{item.missCount === 1 ? '' : 's'}
                        </Badge>
                        <button
                          onClick={() => removeWeakPoint(item.id || item.front)}
                          className="p-1 text-muted-foreground hover:text-destructive rounded-lg"
                          title="Remove from weak spots"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-foreground font-medium">{item.meaning}</p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground font-japanese bg-muted/40 p-2 rounded-lg">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="pt-3 border-t mt-3 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        speakJapanese(item.reading || item.front, {
                          rate: stats.audioSpeed || 1.0,
                        })
                      }
                      className="h-7 text-xs rounded-lg gap-1"
                    >
                      <Volume2 className="h-3 w-3" />
                      Listen
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. BROWSE ALL CARDS TAB */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Japanese, reading, or meaning..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="rounded-2xl border divide-y overflow-hidden bg-card">
            {filteredCards.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No cards match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30 transition-colors text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-japanese">{card.front}</span>
                      <span className="text-muted-foreground">({card.reading})</span>
                      <Badge variant="outline" className="text-[10px] py-0">
                        {card.category}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] py-0">
                        {card.jlptLevel}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{card.meaning}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-muted-foreground font-mono text-[11px]">
                    <span>Interval: {card.interval}d</span>
                    <span>Reps: {card.repetition}</span>
                    <span>Status: {card.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. ADD / IMPORT CARDS TAB */}
      {activeTab === 'add' && (
        <Card className="p-6 rounded-2xl max-w-lg mx-auto">
          {/* Sub-mode selector */}
          <div className="flex items-center p-1 rounded-xl bg-muted/60 mb-5 border text-xs">
            <button
              type="button"
              onClick={() => setAddMode('single')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                addMode === 'single'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              Create Flashcard
            </button>
            <button
              type="button"
              onClick={() => setAddMode('apkg')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                addMode === 'apkg'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileCode className="h-3.5 w-3.5 text-primary" />
              Import Anki .apkg
            </button>
          </div>

          {addMode === 'single' ? (
            <>
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg">Create Custom SRS Flashcard</CardTitle>
                <CardDescription className="text-xs">
                  Add your own custom vocabulary or grammar point to your spaced repetition queue.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleAddCard} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label htmlFor="front" className="text-xs font-semibold">
                    Front (Kanji or Word)
                  </Label>
                  <Input
                    id="front"
                    placeholder="e.g. 友達 or ともだち"
                    value={newFront}
                    onChange={(e) => setNewFront(e.target.value)}
                    className="font-japanese text-sm rounded-xl h-9"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reading" className="text-xs font-semibold">
                    Reading (Hiragana)
                  </Label>
                  <Input
                    id="reading"
                    placeholder="e.g. ともだち"
                    value={newReading}
                    onChange={(e) => setNewReading(convertRomajiToKana(e.target.value))}
                    className="font-japanese text-sm rounded-xl h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="meaning" className="text-xs font-semibold">
                    Meaning (English)
                  </Label>
                  <Input
                    id="meaning"
                    placeholder="e.g. Friend"
                    value={newMeaning}
                    onChange={(e) => setNewMeaning(e.target.value)}
                    className="text-sm rounded-xl h-9"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Category</Label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as CardCategory)}
                      className="w-full h-9 rounded-xl border bg-background px-3 text-xs"
                    >
                      <option value="vocabulary">Vocabulary</option>
                      <option value="kanji">Kanji</option>
                      <option value="grammar">Grammar</option>
                      <option value="kana">Kana</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">JLPT Level</Label>
                    <select
                      value={newJlpt}
                      onChange={(e) => setNewJlpt(e.target.value)}
                      className="w-full h-9 rounded-xl border bg-background px-3 text-xs"
                    >
                      <option value="N5">N5</option>
                      <option value="N4">N4</option>
                      <option value="N3">N3</option>
                      <option value="N2">N2</option>
                      <option value="N1">N1</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" className="w-full rounded-xl h-9 text-xs font-semibold mt-2">
                  Save Card to SRS Queue
                </Button>
              </form>
            </>
          ) : (
            <div className="space-y-4 text-xs">
              <CardHeader className="p-0 pb-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-primary" />
                  Import Anki Deck (.apkg / .colpkg)
                </CardTitle>
                <CardDescription className="text-xs">
                  Directly load your exported Anki deck files into your personal spaced repetition queue.
                </CardDescription>
              </CardHeader>

              <div
                onClick={() => document.getElementById('anki-tab-file-input')?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const file = e.dataTransfer.files?.[0]
                  if (file) {
                    const fakeEvent = {
                      target: { files: [file] },
                    } as unknown as React.ChangeEvent<HTMLInputElement>
                    handleImportApkgFile(fakeEvent)
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isImportingApkg
                    ? 'border-primary bg-primary/5 animate-pulse'
                    : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
                }`}
              >
                <input
                  id="anki-tab-file-input"
                  type="file"
                  accept=".apkg,.colpkg"
                  onChange={handleImportApkgFile}
                  className="hidden"
                  disabled={isImportingApkg}
                />
                <div className="space-y-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    {isImportingApkg ? (
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {isImportingApkg
                        ? 'Decompressing & extracting cards...'
                        : 'Choose .apkg file or drag & drop here'}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Supports Anki 2.1 packages, Core 2k/6k, JLPT decks, Kaishi 1.5k, and custom decks
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs gap-1.5"
                    disabled={isImportingApkg}
                  >
                    <FileCode className="h-3.5 w-3.5" />
                    Select Deck from Computer
                  </Button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2 text-[11px] text-muted-foreground">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Client-side SQLite Processing
                </p>
                <p>
                  Decompressed and extracted directly in your browser without uploading to any external server.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="outline" className="text-[10px] py-0">Anki 2.1 SQLite</Badge>
                  <Badge variant="outline" className="text-[10px] py-0">Furigana [kanji;reading]</Badge>
                  <Badge variant="outline" className="text-[10px] py-0">Cloze deletions</Badge>
                  <Badge variant="outline" className="text-[10px] py-0">Tags preserved</Badge>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading review session...</div>}>
      <ReviewContent />
    </Suspense>
  )
}
