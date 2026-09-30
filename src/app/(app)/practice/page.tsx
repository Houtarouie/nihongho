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
  X,
} from 'lucide-react'
import {
  loadSRSCards,
  saveSRSCards,
  calculateSM2,
  getIntervalLabels,
  addCustomSRSCard,
  loadUserStats,
  saveUserStats,
  speakJapanese,
  DEFAULT_SRS_CARDS,
  type SRSCard,
  type CardCategory,
  type CardRating,
} from '@/data/srs-deck'
import { toast } from 'sonner'

export default function PracticePage() {
  const [cards, setCards] = useState<SRSCard[]>([])
  const [categoryFilter, setCategoryFilter] = useState<'all' | CardCategory>(
    'all'
  )
  const [cramMode, setCramMode] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sessionReviewed, setSessionReviewed] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)

  // New card form state
  const [newFront, setNewFront] = useState('')
  const [newReading, setNewReading] = useState('')
  const [newMeaning, setNewMeaning] = useState('')
  const [newCategory, setNewCategory] = useState<CardCategory>('vocabulary')
  const [newLevel, setNewLevel] = useState('N5')
  const [newExample, setNewExample] = useState('')

  useEffect(() => {
    setCards(loadSRSCards())
  }, [])

  // Filter cards that are due (or all cards in category if cramMode is active)
  const queue = useMemo(() => {
    const now = Date.now() + 60 * 1000 // include cards due within 1 minute
    return cards
      .filter((c) => categoryFilter === 'all' || c.category === categoryFilter)
      .filter((c) => cramMode || c.dueDate <= now)
      .sort((a, b) => a.dueDate - b.dueDate)
  }, [cards, categoryFilter, cramMode])

  const currentCard = queue[0] || null

  const statsSummary = useMemo(() => {
    const now = Date.now() + 60 * 1000
    const filtered = cards.filter(
      (c) => categoryFilter === 'all' || c.category === categoryFilter
    )
    return {
      total: filtered.length,
      due: filtered.filter((c) => c.dueDate <= now).length,
      learning: filtered.filter((c) => c.status === 'learning').length,
      mastered: filtered.filter(
        (c) => c.status === 'mastered' || c.interval >= 7
      ).length,
    }
  }, [cards, categoryFilter])

  const handleRate = useCallback(
    (rating: CardRating) => {
      if (!currentCard) return
      const updatedCard = calculateSM2(currentCard, rating)

      // If in cram mode and rated good/easy/hard, push dueDate forward so it leaves current cram queue
      const nextCards = cards.map((c) =>
        c.id === currentCard.id ? updatedCard : c
      )
      setCards(nextCards)
      saveSRSCards(nextCards)
      setShowAnswer(false)
      setSessionReviewed((prev) => prev + 1)

      // Update user XP and review count
      const userStats = loadUserStats()
      saveUserStats({
        xp: userStats.xp + (rating === 'again' ? 2 : 10),
        reviewsCompletedToday: (userStats.reviewsCompletedToday || 0) + 1,
      })
    },
    [currentCard, cards]
  )

  // Keyboard shortcuts: Space to flip, 1/2/3/4 to rate
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }
      if (!currentCard) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (!showAnswer) {
          setShowAnswer(true)
          speakJapanese(currentCard.front)
        }
      } else if (showAnswer) {
        if (e.key === '1') handleRate('again')
        if (e.key === '2') handleRate('hard')
        if (e.key === '3') handleRate('good')
        if (e.key === '4') handleRate('easy')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentCard, showAnswer, handleRate])

  function handleAddCard(e: React.FormEvent) {
    e.preventDefault()
    if (!newFront.trim() || !newMeaning.trim()) {
      toast.error('Please enter both the Japanese term and its meaning.')
      return
    }
    addCustomSRSCard({
      front: newFront.trim().slice(0, 100),
      reading: newReading.trim().slice(0, 100) || newFront.trim().slice(0, 100),
      meaning: newMeaning.trim().slice(0, 200),
      category: newCategory,
      jlptLevel: newLevel,
      exampleSentence: newExample.trim().slice(0, 200) || undefined,
    })
    setCards(loadSRSCards())
    setNewFront('')
    setNewReading('')
    setNewMeaning('')
    setNewExample('')
    setShowAddForm(false)
    toast.success('Custom flashcard added to your SRS deck!')
  }

  function handleResetDeck() {
    const now = Date.now()
    const reset: SRSCard[] = DEFAULT_SRS_CARDS.map((card) => ({
      ...card,
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: now,
      status: 'new',
    }))
    setCards(reset)
    saveSRSCards(reset)
    setCramMode(false)
    setShowAnswer(false)
    setSessionReviewed(0)
    toast.success('SRS deck reset! All cards are now due for review.')
  }

  const intervalLabels = currentCard
    ? getIntervalLabels(currentCard)
    : { again: '< 1m', hard: '1d', good: '4d', easy: '7d' }

  const totalSessionCards = sessionReviewed + queue.length
  const progressPercent =
    totalSessionCards > 0
      ? Math.round((sessionReviewed / totalSessionCards) * 100)
      : 100

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            SRS Flashcard Practice
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            SM-2 Spaced Repetition System — reviews adapt to your memory strength.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm((v) => !v)}
          >
            {showAddForm ? (
              <>
                <X className="h-4 w-4 mr-1" /> Close
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" /> Add Card
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetDeck}
            title="Reset all cards to due"
          >
            <RotateCcw className="h-4 w-4 mr-1" /> Reset Deck
          </Button>
        </div>
      </div>

      {/* Add Custom Flashcard Modal/Drawer */}
      {showAddForm && (
        <Card className="border-primary/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Create Custom Flashcard</CardTitle>
            <CardDescription>
              Add any vocabulary word, kanji, or grammar pattern to your personal SRS deck.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCard} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="front">Japanese (Front) *</Label>
                  <Input
                    id="front"
                    placeholder="e.g. 桜 or 〜ばよかった"
                    value={newFront}
                    onChange={(e) => setNewFront(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reading">Reading (Furigana / Romaji)</Label>
                  <Input
                    id="reading"
                    placeholder="e.g. さくら (sakura)"
                    value={newReading}
                    onChange={(e) => setNewReading(e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="meaning">English Meaning *</Label>
                  <Input
                    id="meaning"
                    placeholder="e.g. Cherry blossom"
                    value={newMeaning}
                    onChange={(e) => setNewMeaning(e.target.value)}
                    maxLength={200}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as CardCategory)
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="vocabulary">Vocabulary</option>
                    <option value="kanji">Kanji</option>
                    <option value="grammar">Grammar</option>
                    <option value="kana">Kana</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="example">Example Sentence (Optional)</Label>
                  <Input
                    id="example"
                    placeholder="e.g. 春に桜が咲きます。"
                    value={newExample}
                    onChange={(e) => setNewExample(e.target.value)}
                    maxLength={200}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="level">JLPT Level</Label>
                  <select
                    id="level"
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N2">N2</option>
                    <option value="N1">N1</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save to Deck</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 bg-muted p-1 rounded-lg">
        {(
          [
            { id: 'all', label: 'All Cards' },
            { id: 'vocabulary', label: 'Vocabulary' },
            { id: 'kanji', label: 'Kanji' },
            { id: 'kana', label: 'Kana' },
            { id: 'grammar', label: 'Grammar' },
          ] as const
        ).map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setCategoryFilter(cat.id)
              setShowAnswer(false)
            }}
            className={`flex-1 min-w-[90px] rounded-md py-1.5 px-3 text-xs sm:text-sm font-medium transition-all ${
              categoryFilter === cat.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="rounded-lg border bg-card p-2.5">
          <p className="text-xs text-muted-foreground">Due Now</p>
          <p className="text-lg font-bold text-primary">{statsSummary.due}</p>
        </div>
        <div className="rounded-lg border bg-card p-2.5">
          <p className="text-xs text-muted-foreground">Learning</p>
          <p className="text-lg font-bold text-orange-500">
            {statsSummary.learning}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-2.5">
          <p className="text-xs text-muted-foreground">Mastered</p>
          <p className="text-lg font-bold text-green-600">
            {statsSummary.mastered}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-2.5">
          <p className="text-xs text-muted-foreground">Done Today</p>
          <p className="text-lg font-bold">{sessionReviewed}</p>
        </div>
      </div>

      {/* Session Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Session Progress</span>
          <span>
            {sessionReviewed} / {totalSessionCards} cards ({progressPercent}%)
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Active Flashcard OR Session Complete State */}
      {currentCard ? (
        <div className="space-y-6">
          <Card
            className="min-h-[320px] flex flex-col justify-between p-6 sm:p-8 cursor-pointer shadow-sm hover:border-primary/50 transition-all select-none"
            onClick={() => {
              if (!showAnswer) {
                setShowAnswer(true)
                speakJapanese(currentCard.front)
              }
            }}
          >
            {/* Card Top Metadata */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="uppercase">
                  {currentCard.category}
                </Badge>
                <Badge variant="outline">{currentCard.jlptLevel}</Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  speakJapanese(currentCard.front)
                }}
                title="Listen to pronunciation"
              >
                <Volume2 className="h-4 w-4 mr-1" /> Audio
              </Button>
            </div>

            {/* Card Center Prompt / Answer */}
            <CardContent className="py-8 text-center space-y-6">
              <h2 className="text-5xl sm:text-6xl font-bold tracking-tight">
                {currentCard.front}
              </h2>

              {showAnswer ? (
                <div className="space-y-4 pt-4 border-t animate-in fade-in duration-200">
                  <div>
                    <p className="text-2xl text-blue-600 dark:text-blue-400 font-semibold">
                      {currentCard.reading}
                    </p>
                    <p className="text-xl font-medium text-foreground mt-1">
                      {currentCard.meaning}
                    </p>
                  </div>

                  {currentCard.exampleSentence && (
                    <div className="rounded-lg bg-muted/60 p-3 text-sm max-w-md mx-auto">
                      <div className="flex items-center justify-center gap-2">
                        <p className="font-medium text-foreground">
                          {currentCard.exampleSentence}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            speakJapanese(currentCard.exampleSentence!)
                          }}
                          className="text-muted-foreground hover:text-primary"
                          title="Play sentence audio"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                      {currentCard.exampleTranslation && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {currentCard.exampleTranslation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground pt-6">
                  Click card or press <kbd className="px-1.5 py-0.5 border rounded bg-muted text-xs">Space</kbd> to reveal answer
                </p>
              )}
            </CardContent>

            <div className="text-center text-xs text-muted-foreground">
              Repetitions: {currentCard.repetition} · Ease:{' '}
              {currentCard.efactor.toFixed(2)}
            </div>
          </Card>

          {/* Rating Controls */}
          {showAnswer ? (
            <div className="grid grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleRate('again')}
              >
                <span className="font-semibold">Again</span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {intervalLabels.again}
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                onClick={() => handleRate('hard')}
              >
                <span className="font-semibold">Hard</span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {intervalLabels.hard}
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                onClick={() => handleRate('good')}
              >
                <span className="font-semibold">Good</span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {intervalLabels.good}
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => handleRate('easy')}
              >
                <span className="font-semibold">Easy</span>
                <span className="text-xs text-muted-foreground mt-0.5">
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
                speakJapanese(currentCard.front)
              }}
            >
              Show Answer
            </Button>
          )}
        </div>
      ) : (
        <Card className="p-8 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">All Due Reviews Complete! 🎉</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              You have reviewed {sessionReviewed} cards in this session. Want to keep practicing ahead of schedule?
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button onClick={handleResetDeck}>
              <Sparkles className="h-4 w-4 mr-1.5" /> Practice All Cards Again
            </Button>
            <Button variant="outline" onClick={() => setShowAddForm(true)}>
              <Layers className="h-4 w-4 mr-1.5" /> Add Custom Flashcards
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
