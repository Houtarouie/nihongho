'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Keyboard,
  Target,
  Headphones,
  Puzzle,
  Grid,
  Volume2,
  Flame,
  Sparkles,
  RotateCcw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Trophy,
} from 'lucide-react'
import {
  getKanaPool,
  buildSmartDistractors,
  cleanRomaji,
  CONFUSION_MNEMONICS,
  SENTENCE_SCRAMBLE_CHALLENGES,
  type KanaDeckScope,
} from '@/data/quiz-engine'
import {
  HIRAGANA_GOJUON,
  KATAKANA_GOJUON,
  type KanaItem,
} from '@/data/kana'
import {
  speakJapanese,
  addCustomSRSCard,
  loadUserStats,
  saveUserStats,
} from '@/data/srs-deck'
import {
  loadQuizRuns,
  recordQuizRun,
  getCurrentLeague,
  type QuizRunRecord,
} from '@/data/quiz-leaderboard'
import { toast } from 'sonner'

type GameMode =
  | 'speed-typing'
  | 'confusion-pairs'
  | 'audio-dictation'
  | 'sentence-builder'
  | 'memory-match'
  | 'leaderboard'

interface LearningArcadeProps {
  initialScript?: 'hiragana' | 'katakana' | 'both'
  customPool?: KanaItem[]
  onExitCustomPool?: () => void
}

export function LearningArcade({
  initialScript = 'hiragana',
  customPool,
  onExitCustomPool,
}: LearningArcadeProps) {
  const [gameMode, setGameMode] = useState<GameMode>('speed-typing')
  const [script, setScript] = useState<'hiragana' | 'katakana' | 'both'>(
    initialScript
  )
  const [scope, setScope] = useState<KanaDeckScope>(
    customPool && customPool.length > 0 ? 'custom' : 'gojuon'
  )
  const [customSelectedKana, setCustomSelectedKana] = useState<Set<string>>(
    new Set(customPool ? customPool.map((c) => c.kana) : [])
  )
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false)

  // Shared adaptive quiz state
  const [queue, setQueue] = useState<KanaItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [missedItems, setMissedItems] = useState<KanaItem[]>([])

  // Mode 1: Speed Typing state
  const [typedInput, setTypedInput] = useState('')
  const [typingFeedback, setTypingFeedback] = useState<
    'idle' | 'correct' | 'wrong'
  >('idle')

  // Mode 2 & 3: Multiple Choice & Direction state
  const [quizDirection, setQuizDirection] = useState<
    'kana-to-romaji' | 'romaji-to-kana'
  >('kana-to-romaji')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  // Mode 4: Sentence Scramble state
  const [sentenceIdx, setSentenceIdx] = useState(0)
  const [pickedTiles, setPickedTiles] = useState<string[]>([])
  const [sentenceChecked, setSentenceChecked] = useState<
    'idle' | 'correct' | 'wrong'
  >('idle')

  // Mode 5: Memory Match Blitz state
  const [matchCards, setMatchCards] = useState<
    {
      id: string
      pairId: string
      label: string
      type: 'kana' | 'romaji'
      matched: boolean
    }[]
  >([])
  const [flippedIds, setFlippedIds] = useState<string[]>([])
  const [matchMoves, setMatchMoves] = useState(0)

  useEffect(() => {
    if (customPool && customPool.length > 0) {
      setCustomSelectedKana(new Set(customPool.map((c) => c.kana)))
      setScope('custom')
    }
  }, [customPool])

  // Build pool when script, scope, customPool, or customSelectedKana changes
  const basePool = useMemo(() => {
    if (scope === 'custom') {
      if (customSelectedKana.size > 0) {
        const allPool = getKanaPool(script, 'all')
        const picked = allPool.filter((c) => customSelectedKana.has(c.kana))
        if (picked.length > 0) return picked
      }
      if (customPool && customPool.length > 0) {
        return customPool
      }
      // If none explicitly selected, default to the first 5 characters (A-row)
      const firstRow =
        script === 'katakana' ? KATAKANA_GOJUON[0].items : HIRAGANA_GOJUON[0].items
      return firstRow.filter(Boolean) as KanaItem[]
    }
    const pool = getKanaPool(script, scope)
    return pool.length > 0 ? pool : getKanaPool('hiragana', 'gojuon')
  }, [script, scope, customPool, customSelectedKana])

  // Initialize / Reset Queue
  function initQueue() {
    const activePool = [...basePool]
    for (let i = activePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[activePool[i], activePool[j]] = [activePool[j], activePool[i]]
    }
    setQueue(activePool)
    setCurrentIndex(0)
    setSelectedOption(null)
    setTypedInput('')
    setTypingFeedback('idle')
  }

  useEffect(() => {
    initQueue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePool])

  // Initialize Memory Match Grid with random pairs and random card positions
  function initMemoryBoard() {
    const poolCopy = [...basePool]
    for (let i = poolCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]]
    }
    const pairs = poolCopy.slice(0, 6)
    const deck: {
      id: string
      pairId: string
      label: string
      type: 'kana' | 'romaji'
      matched: boolean
    }[] = []
    pairs.forEach((p, idx) => {
      deck.push({
        id: `k-${idx}-${Date.now()}`,
        pairId: p.kana,
        label: p.kana,
        type: 'kana',
        matched: false,
      })
      deck.push({
        id: `r-${idx}-${Date.now()}`,
        pairId: p.kana,
        label: cleanRomaji(p.romaji),
        type: 'romaji',
        matched: false,
      })
    })
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
    setMatchCards(deck)
    setFlippedIds([])
    setMatchMoves(0)
  }

  useEffect(() => {
    if (gameMode === 'memory-match') {
      initMemoryBoard()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode, basePool])

  const currentItem = queue[currentIndex % Math.max(1, queue.length)] || basePool[0]

  const smartOptions = useMemo(() => {
    if (!currentItem) return []
    return buildSmartDistractors(currentItem, basePool, quizDirection)
  }, [currentItem, basePool, quizDirection])

  function awardXP(amount: number) {
    const stats = loadUserStats()
    saveUserStats({ xp: stats.xp + amount })
  }

  /**
   * Adaptive Re-queueing: When a learner misses an item, re-insert it 3 positions
   * ahead in the queue so they MUST retrieve it again!
   */
  function requeueMissedItem(item: KanaItem) {
    setMissedItems((prev) =>
      prev.some((m) => m.kana === item.kana) ? prev : [...prev, item]
    )
    setQueue((prev) => {
      const next = [...prev]
      const insertAt = Math.min(next.length, currentIndex + 3)
      next.splice(insertAt, 0, item)
      return next
    })
  }

  // Mode 1 Handler: Tofugu-Style Speed Typing
  function handleTypingChange(val: string) {
    setTypedInput(val)
    setTypingFeedback('idle')
    if (!currentItem) return

    const expected = cleanRomaji(currentItem.romaji)
    if (val.trim().toLowerCase() === expected) {
      // Instant auto-advance on exact match!
      speakJapanese(currentItem.kana)
      const nextStreak = streak + 1
      setStreak(nextStreak)
      setScore((s) => s + 10 * Math.min(5, Math.floor(nextStreak / 3) + 1))
      awardXP(5)
      setTypedInput('')
      setTypingFeedback('correct')
      setCurrentIndex((i) => i + 1)
    }
  }

  function handleTypingSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentItem) return
    const expected = cleanRomaji(currentItem.romaji)
    if (typedInput.trim().toLowerCase() === expected) {
      handleTypingChange(typedInput)
    } else {
      setTypingFeedback('wrong')
      setStreak(0)
      speakJapanese(currentItem.kana)
      requeueMissedItem(currentItem)
      toast.error(
        `${currentItem.kana} is "${expected}" — Re-queued 3 cards ahead for mastery!`
      )
    }
  }

  // Mode 2 & 3 Handler: Smart Confusion-Pair & Audio Dictation choice
  function handleOptionSelect(opt: string, forceExpected?: string) {
    if (!currentItem || selectedOption) return
    setSelectedOption(opt)
    speakJapanese(currentItem.kana)

    const correctVal =
      forceExpected ??
      (gameMode === 'audio-dictation'
        ? currentItem.kana
        : quizDirection === 'kana-to-romaji'
        ? cleanRomaji(currentItem.romaji)
        : currentItem.kana)

    if (opt === correctVal) {
      const nextStreak = streak + 1
      setStreak(nextStreak)
      setScore((s) => s + 10)
      awardXP(5)
      // Successfully answered correctly - clear from weak spots if previously present
      setMissedItems((prev) => prev.filter((m) => m.kana !== currentItem.kana))
      toast.success('Spot on! 🎯')
    } else {
      setStreak(0)
      requeueMissedItem(currentItem)
      toast.error(
        `Missed! ${currentItem.kana} = ${cleanRomaji(
          currentItem.romaji
        )}. Added to adaptive retry loop.`
      )
    }
  }

  // Mode 4: Sentence Builder
  const currentSentence =
    SENTENCE_SCRAMBLE_CHALLENGES[
      sentenceIdx % SENTENCE_SCRAMBLE_CHALLENGES.length
    ]

  const availableSentenceTiles = useMemo(() => {
    const all = [
      ...currentSentence.correctTiles,
      ...currentSentence.distractorTiles,
    ]
    return all.sort((a, b) => a.localeCompare(b))
  }, [currentSentence])

  function checkSentenceOrder() {
    const joined = pickedTiles.join('')
    if (joined === currentSentence.fullJapanese) {
      setSentenceChecked('correct')
      speakJapanese(currentSentence.fullJapanese)
      setStreak((s) => s + 1)
      setScore((s) => s + 25)
      awardXP(25)
      toast.success('Perfect Japanese sentence! +25 XP 🎉')
    } else {
      setSentenceChecked('wrong')
      setStreak(0)
      toast.error('Word or particle order is not quite right. Try adjusting!')
    }
  }

  // Mode 5: Memory Match Blitz click handler
  function handleMatchCardClick(cardId: string) {
    if (flippedIds.length >= 2 || flippedIds.includes(cardId)) return
    const target = matchCards.find((c) => c.id === cardId)
    if (!target || target.matched) return

    if (target.type === 'kana') {
      speakJapanese(target.label)
    }

    const nextFlipped = [...flippedIds, cardId]
    setFlippedIds(nextFlipped)

    if (nextFlipped.length === 2) {
      setMatchMoves((m) => m + 1)
      const first = matchCards.find((c) => c.id === nextFlipped[0])
      const second = matchCards.find((c) => c.id === nextFlipped[1])

      if (first && second && first.pairId === second.pairId) {
        setMatchCards((prev) =>
          prev.map((c) =>
            c.pairId === first.pairId ? { ...c, matched: true } : c
          )
        )
        setFlippedIds([])
        setStreak((s) => s + 1)
        setScore((s) => s + 15)
        awardXP(10)
      } else {
        setStreak(0)
        setTimeout(() => {
          setFlippedIds([])
        }, 700)
      }
    }
  }

  const allMatched =
    matchCards.length > 0 && matchCards.every((c) => c.matched)

  const [leaderboardRuns, setLeaderboardRuns] = useState<QuizRunRecord[]>([])

  useEffect(() => {
    setLeaderboardRuns(loadQuizRuns())
  }, [gameMode, score])

  function handleSaveRunToLeaderboard() {
    if (score <= 0) {
      toast.info('Answer a few questions first to earn points for the leaderboard!')
      return
    }
    const modeTitleMap: Record<GameMode, string> = {
      'speed-typing': 'Speed Recall Typing',
      'confusion-pairs': 'Confusion Pairs',
      'audio-dictation': 'Audio Dictation',
      'sentence-builder': 'Sentence Builder',
      'memory-match': 'Memory Blitz',
      leaderboard: 'Quiz Arcade',
    }
    const totalAttempts = Math.max(1, currentIndex + missedItems.length)
    const acc = Math.max(
      50,
      Math.min(
        100,
        Math.round(
          ((totalAttempts - missedItems.length) / totalAttempts) * 100
        )
      )
    )
    const updated = recordQuizRun({
      modeName: modeTitleMap[gameMode],
      score,
      accuracy: acc,
      xpEarned: Math.max(10, Math.round(score / 2)),
      streak,
    })
    setLeaderboardRuns(updated)
    toast.success(`Posted ${score} pts in ${modeTitleMap[gameMode]} to the Leaderboard! 🏆`)
    setGameMode('leaderboard')
  }

  return (
    <div className="space-y-6">
      {/* Top Game Mode Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {(
          [
            {
              id: 'speed-typing',
              label: 'Speed Recall',
              sub: 'Tofugu Typing',
              icon: Keyboard,
            },
            {
              id: 'confusion-pairs',
              label: 'Confusion Pairs',
              sub: 'Look-Alikes',
              icon: Target,
            },
            {
              id: 'audio-dictation',
              label: 'Audio Dictation',
              sub: 'Ear Trainer',
              icon: Headphones,
            },
            {
              id: 'sentence-builder',
              label: 'Sentence Builder',
              sub: 'Particle Order',
              icon: Puzzle,
            },
            {
              id: 'memory-match',
              label: 'Memory Blitz',
              sub: 'Pair Match',
              icon: Grid,
            },
            {
              id: 'leaderboard',
              label: 'Leaderboard',
              sub: 'Top Scores & League',
              icon: Trophy,
            },
          ] as const
        ).map((m) => {
          const Icon = m.icon
          const active = gameMode === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setGameMode(m.id)
                setSelectedOption(null)
                setTypingFeedback('idle')
                if (m.id === 'confusion-pairs') {
                  setScope('confusion')
                }
              }}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                active
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'bg-card hover:border-primary/40'
              }`}
            >
              <Icon
                className={`h-4 w-4 mb-1.5 ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span className="font-bold text-xs sm:text-sm">{m.label}</span>
              <span className="text-[10px] text-muted-foreground">{m.sub}</span>
            </button>
          )
        })}
      </div>

      {/* Script & Row Filter Controls + Live Combo Score Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-muted p-0.5 text-xs">
            {(
              [
                { id: 'hiragana', label: 'あ Hiragana' },
                { id: 'katakana', label: 'ア Katakana' },
                { id: 'both', label: 'あ+ア Mixed' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScript(s.id)}
                className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                  script === s.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {gameMode !== 'sentence-builder' && gameMode !== 'leaderboard' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={scope}
                onChange={(e) => {
                  const newScope = e.target.value as KanaDeckScope
                  setScope(newScope)
                  if (newScope === 'custom') setShowCustomPicker(true)
                }}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium"
              >
                <option value="gojuon">Basic (Gojūon 46)</option>
                <option value="confusion">🔥 Confusion Pairs (Look-Alikes)</option>
                <option value="dakuten">Voiced (Dakuten 25)</option>
                <option value="yoon">Combo (Yōon 33)</option>
                <option value="all">All Kana Combined (104)</option>
                <option value="custom">
                  🎯 Custom Selection ({basePool.length} chars)
                </option>
              </select>

              <Button
                type="button"
                size="sm"
                variant={scope === 'custom' || showCustomPicker ? 'default' : 'outline'}
                className="h-8 text-xs font-semibold gap-1"
                onClick={() => {
                  setScope('custom')
                  setShowCustomPicker(!showCustomPicker)
                }}
              >
                🎯 {scope === 'custom' ? `Pick (${basePool.length})` : 'Pick Characters'}
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-1">
            <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
            Combo: {streak}x
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
            Score: {score}
          </Badge>
          {gameMode !== 'leaderboard' && score > 0 && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleSaveRunToLeaderboard}
            >
              <Trophy className="h-3.5 w-3.5" />
              Post Score
            </Button>
          )}
        </div>
      </div>

      {/* Custom Character Selection Drawer */}
      {(scope === 'custom' || showCustomPicker) && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="p-4 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span>🎯 Custom Character Selection &amp; SRS</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {basePool.length} Active Characters
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Pick specific characters (e.g. just the first 5 characters you learned) to quiz yourself or add to your Anki SRS deck.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => {
                    let added = 0
                    for (const item of basePool) {
                      const res = addCustomSRSCard({
                        front: item.kana,
                        reading: item.romaji,
                        meaning: `Kana syllable "${cleanRomaji(item.romaji)}"`,
                        category: 'kana',
                        jlptLevel: 'N5',
                        exampleSentence: item.example,
                        tags: ['kana', script, item.row],
                      })
                      if (res.added) added++
                    }
                    toast.success(
                      `Added ${basePool.length} characters (${added} new) to your Anki SRS queue!`
                    )
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add to Anki SRS ({basePool.length})
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs font-bold"
                  onClick={() => {
                    initQueue()
                    setShowCustomPicker(false)
                    toast.success(`Starting quiz on ${basePool.length} chosen characters!`)
                  }}
                >
                  ⚡ Start Quiz ({basePool.length})
                </Button>
                {onExitCustomPool && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={onExitCustomPool}
                  >
                    Exit Custom
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs border-b pb-2">
              <span className="font-semibold text-muted-foreground mr-1">
                Quick Presets:
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  const first5 = (
                    script === 'katakana'
                      ? KATAKANA_GOJUON[0].items
                      : HIRAGANA_GOJUON[0].items
                  )
                    .filter(Boolean)
                    .map((c) => c!.kana)
                  setCustomSelectedKana(new Set(first5))
                  setScope('custom')
                  toast.info('Selected first 5 characters (A-row: a, i, u, e, o)')
                }}
              >
                First 5: A-row ({script === 'katakana' ? 'ア〜オ' : 'あ〜お'})
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  const rows =
                    script === 'katakana'
                      ? [KATAKANA_GOJUON[0], KATAKANA_GOJUON[1]]
                      : [HIRAGANA_GOJUON[0], HIRAGANA_GOJUON[1]]
                  const first10 = rows
                    .flatMap((r) => r.items)
                    .filter(Boolean)
                    .map((c) => c!.kana)
                  setCustomSelectedKana(new Set(first10))
                  setScope('custom')
                  toast.info('Selected first 10 characters (A + Ka rows)')
                }}
              >
                First 10: A + Ka ({script === 'katakana' ? 'ア〜コ' : 'あ〜こ'})
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  const rows =
                    script === 'katakana'
                      ? [KATAKANA_GOJUON[0], KATAKANA_GOJUON[1], KATAKANA_GOJUON[2]]
                      : [HIRAGANA_GOJUON[0], HIRAGANA_GOJUON[1], HIRAGANA_GOJUON[2]]
                  const first15 = rows
                    .flatMap((r) => r.items)
                    .filter(Boolean)
                    .map((c) => c!.kana)
                  setCustomSelectedKana(new Set(first15))
                  setScope('custom')
                  toast.info('Selected first 15 characters (A + Ka + Sa rows)')
                }}
              >
                First 15: A + Ka + Sa
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  const all = getKanaPool(script, 'gojuon').map((c) => c.kana)
                  setCustomSelectedKana(new Set(all))
                  setScope('custom')
                }}
              >
                Select All Gojūon
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setCustomSelectedKana(new Set())}
              >
                Clear
              </Button>
            </div>

            {/* Interactive Grid of Characters */}
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-1">
              {getKanaPool(script, 'gojuon').map((item) => {
                const isSelected =
                  customSelectedKana.has(item.kana) ||
                  (customSelectedKana.size === 0 && basePool.some((b) => b.kana === item.kana))
                return (
                  <button
                    key={item.kana}
                    type="button"
                    onClick={() => {
                      const next = new Set(
                        customSelectedKana.size === 0
                          ? basePool.map((b) => b.kana)
                          : customSelectedKana
                      )
                      if (next.has(item.kana)) next.delete(item.kana)
                      else next.add(item.kana)
                      setCustomSelectedKana(next)
                      setScope('custom')
                    }}
                    className={`h-9 px-2.5 rounded-lg border text-sm font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background hover:bg-muted/60 text-muted-foreground'
                    }`}
                  >
                    <span>{item.kana}</span>
                    <span className="text-[10px] font-normal opacity-80">
                      {cleanRomaji(item.romaji)}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* GAME MODE 1: TOFUGU-STYLE SPEED RECALL TYPING */}
      {gameMode === 'speed-typing' && currentItem && (
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                Active Recall #{currentIndex + 1} (No Multiple Choice)
              </span>
              <button
                type="button"
                onClick={() => speakJapanese(currentItem.kana)}
                className="flex items-center gap-1 hover:text-primary"
              >
                <Volume2 className="h-3.5 w-3.5" /> Audio
              </button>
            </div>
            <CardTitle className="text-7xl font-bold py-6 select-none">
              {currentItem.kana}
            </CardTitle>
            <CardDescription>
              Type the exact Romaji reading — auto-advances immediately when correct!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleTypingSubmit} className="space-y-3">
              <Input
                value={typedInput}
                onChange={(e) => handleTypingChange(e.target.value)}
                placeholder="Type romaji (e.g. ka, shi, tsu)..."
                className={`text-center text-xl font-bold h-12 ${
                  typingFeedback === 'wrong'
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }`}
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Check / Press Enter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTypingFeedback('wrong')
                    speakJapanese(currentItem.kana)
                    requeueMissedItem(currentItem)
                  }}
                >
                  Reveal Answer
                </Button>
              </div>
            </form>

            {typingFeedback === 'wrong' && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-red-600 dark:text-red-400">
                    Answer: {currentItem.kana} = {cleanRomaji(currentItem.romaji)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      setTypingFeedback('idle')
                      setTypedInput('')
                      setCurrentIndex((i) => i + 1)
                    }}
                  >
                    Next &rarr;
                  </Button>
                </div>
                {CONFUSION_MNEMONICS[currentItem.kana] && (
                  <p className="text-muted-foreground">
                    💡 {CONFUSION_MNEMONICS[currentItem.kana]}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* GAME MODE 2: CONFUSION-PAIR DISCRIMINATION QUIZ */}
      {gameMode === 'confusion-pairs' && currentItem && (
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
              <span>Look-Alike Discrimination #{currentIndex + 1}</span>
              <button
                type="button"
                onClick={() => {
                  setQuizDirection((d) =>
                    d === 'kana-to-romaji' ? 'romaji-to-kana' : 'kana-to-romaji'
                  )
                  setSelectedOption(null)
                }}
                className="text-primary font-medium hover:underline"
              >
                Switch to{' '}
                {quizDirection === 'kana-to-romaji'
                  ? 'Romaji → Kana'
                  : 'Kana → Romaji'}
              </button>
            </div>
            <CardTitle className="text-6xl font-bold py-5">
              {quizDirection === 'kana-to-romaji'
                ? currentItem.kana
                : cleanRomaji(currentItem.romaji)}
            </CardTitle>
            <CardDescription>
              Watch out for look-alike confusion pairs! Choose carefully:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {smartOptions.map((opt) => {
                const correctVal =
                  quizDirection === 'kana-to-romaji'
                    ? cleanRomaji(currentItem.romaji)
                    : currentItem.kana
                const isCorrect = opt === correctVal
                const isPicked = selectedOption === opt
                let variant: 'outline' | 'default' | 'destructive' = 'outline'
                if (selectedOption) {
                  if (isCorrect) variant = 'default'
                  else if (isPicked) variant = 'destructive'
                }
                return (
                  <Button
                    key={opt}
                    variant={variant}
                    className="h-14 text-xl font-bold"
                    disabled={!!selectedOption}
                    onClick={() => handleOptionSelect(opt)}
                  >
                    {opt}
                  </Button>
                )
              })}
            </div>

            {selectedOption && (
              <div className="space-y-3 pt-2 border-t">
                {CONFUSION_MNEMONICS[currentItem.kana] && (
                  <div className="rounded-lg bg-muted/60 p-3 text-xs">
                    <p className="font-semibold text-foreground mb-0.5">
                      💡 Visual Distinction Tip:
                    </p>
                    <p className="text-muted-foreground">
                      {CONFUSION_MNEMONICS[currentItem.kana]}
                    </p>
                  </div>
                )}
                {currentItem.example && (
                  <p className="text-xs text-center text-muted-foreground">
                    Example word: <strong>{currentItem.example}</strong>
                  </p>
                )}
                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedOption(null)
                    setCurrentIndex((i) => i + 1)
                  }}
                >
                  Next Challenge &rarr;
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* GAME MODE 3: AUDIO DICTATION EAR-TRAINER */}
      {gameMode === 'audio-dictation' && currentItem && (
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">
              🎧 Audio Dictation &amp; Listening Quiz
            </CardTitle>
            <CardDescription>
              Listen to the native Japanese pronunciation and identify the exact Kana character!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="py-4 flex flex-col items-center gap-3">
              <Button
                size="lg"
                className="h-20 w-20 rounded-full shadow-md"
                onClick={() => speakJapanese(currentItem.kana)}
              >
                <Volume2 className="h-9 w-9" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Click speaker to play sound ({selectedOption ? `${currentItem.kana} (${cleanRomaji(currentItem.romaji)})` : 'Hidden until answered'})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {buildSmartDistractors(currentItem, basePool, 'romaji-to-kana').map(
                (kanaOpt) => {
                  const isCorrect = kanaOpt === currentItem.kana
                  const isPicked = selectedOption === kanaOpt
                  let variant: 'outline' | 'default' | 'destructive' = 'outline'
                  if (selectedOption) {
                    if (isCorrect) variant = 'default'
                    else if (isPicked) variant = 'destructive'
                  }
                  return (
                    <Button
                      key={kanaOpt}
                      variant={variant}
                      className="h-14 text-2xl font-bold"
                      disabled={!!selectedOption}
                      onClick={() => {
                        handleOptionSelect(kanaOpt, currentItem.kana)
                      }}
                    >
                      {kanaOpt}
                    </Button>
                  )
                }
              )}
            </div>

            {selectedOption && (
              <Button
                className="w-full"
                onClick={() => {
                  setSelectedOption(null)
                  const nextIdx = currentIndex + 1
                  setCurrentIndex(nextIdx)
                  const nextItem = queue[nextIdx % Math.max(1, queue.length)]
                  if (nextItem) speakJapanese(nextItem.kana)
                }}
              >
                Next Audio Prompt &rarr;
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* GAME MODE 4: BUNPRO-STYLE SENTENCE BUILDER & PARTICLE SCRAMBLE */}
      {gameMode === 'sentence-builder' && (
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge>{currentSentence.jlptLevel} Grammar &amp; Syntax</Badge>
              <span className="text-xs text-muted-foreground">
                Sentence {(sentenceIdx % SENTENCE_SCRAMBLE_CHALLENGES.length) + 1} of{' '}
                {SENTENCE_SCRAMBLE_CHALLENGES.length}
              </span>
            </div>
            <CardTitle className="text-xl pt-2">
              &ldquo;{currentSentence.english}&rdquo;
            </CardTitle>
            <CardDescription>💡 {currentSentence.hint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Assembled Sentence Tray */}
            <div className="min-h-[64px] rounded-xl border-2 border-dashed p-3 flex flex-wrap items-center gap-2 bg-muted/30">
              {pickedTiles.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  Tap Japanese words &amp; particles below in the correct SOV order...
                </span>
              ) : (
                pickedTiles.map((tile, idx) => (
                  <Button
                    key={`${tile}-${idx}`}
                    size="sm"
                    variant="secondary"
                    className="font-bold text-base"
                    onClick={() => {
                      setSentenceChecked('idle')
                      setPickedTiles((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }}
                  >
                    {tile}
                  </Button>
                ))
              )}
            </div>

            {/* Available Word & Particle Bank */}
            <div className="flex flex-wrap gap-2">
              {availableSentenceTiles.map((tile, idx) => {
                const usedCount = pickedTiles.filter((t) => t === tile).length
                const totalCount = availableSentenceTiles.filter(
                  (t) => t === tile
                ).length
                const isExhausted = usedCount >= totalCount
                return (
                  <Button
                    key={`bank-${tile}-${idx}`}
                    variant="outline"
                    disabled={isExhausted}
                    className="font-bold text-base"
                    onClick={() => {
                      setSentenceChecked('idle')
                      speakJapanese(tile)
                      setPickedTiles((prev) => [...prev, tile])
                    }}
                  >
                    {tile}
                  </Button>
                )
              })}
            </div>

            {sentenceChecked === 'correct' && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-700 dark:text-green-300 flex items-center justify-between">
                <span>
                  ✓ Correct: <strong>{currentSentence.fullJapanese}</strong>
                </span>
                <Button
                  size="sm"
                  onClick={() => {
                    setPickedTiles([])
                    setSentenceChecked('idle')
                    setSentenceIdx((i) => i + 1)
                  }}
                >
                  Next Sentence &rarr;
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={checkSentenceOrder}
                disabled={pickedTiles.length === 0}
              >
                Check Sentence
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPickedTiles([])
                  setSentenceChecked('idle')
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GAME MODE 5: MEMORY MATCH BLITZ */}
      {gameMode === 'memory-match' && (
        <Card className="max-w-xl mx-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  🃏 Kana &amp; Romaji Memory Blitz
                </CardTitle>
                <CardDescription>
                  Match each Japanese character with its Romaji sound!
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Moves: {matchMoves}</Badge>
                <Button size="sm" variant="ghost" onClick={initMemoryBoard}>
                  <RotateCcw className="h-4 w-4 mr-1" /> New Board
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {allMatched ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
                <h3 className="text-xl font-bold">
                  Board Cleared in {matchMoves} Moves! 🎉
                </h3>
                <Button onClick={initMemoryBoard}>Play Another Round</Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {matchCards.map((c) => {
                  const isFlipped = flippedIds.includes(c.id) || c.matched
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={c.matched}
                      onClick={() => handleMatchCardClick(c.id)}
                      className={`h-20 rounded-xl border text-center font-bold transition-all flex items-center justify-center ${
                        c.matched
                          ? 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400 opacity-60'
                          : isFlipped
                          ? 'border-primary bg-primary/15 text-primary ring-1 ring-primary'
                          : 'bg-card hover:border-primary/50'
                      }`}
                    >
                      <span
                        className={
                          c.type === 'kana' ? 'text-3xl' : 'text-lg font-mono'
                        }
                      >
                        {c.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* GAME MODE 6: QUIZ LEADERBOARD */}
      {gameMode === 'leaderboard' && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trophy className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-xl">
                    Quiz Arcade Leaderboard
                  </CardTitle>
                  <CardDescription>
                    Your personal high scores, streaks, and League standing
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs font-bold">
                {getCurrentLeague(loadUserStats().xp).badge}{' '}
                {getCurrentLeague(loadUserStats().xp).name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {leaderboardRuns.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-sm text-muted-foreground">
                  No quiz scores posted yet! Play any quiz mode above and click{' '}
                  <strong>Post Score</strong> to record your run.
                </p>
                <Button size="sm" onClick={() => setGameMode('speed-typing')}>
                  Start Speed Recall &rarr;
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {leaderboardRuns.map((run, idx) => (
                  <div
                    key={run.id}
                    className="py-3 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold">
                          {run.playerName} — {run.modeName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {run.timestamp} · Best Combo {run.streak}x ·{' '}
                          {run.accuracy}% accuracy
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="font-bold">{run.score} pts</Badge>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        +{run.xpEarned} XP
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Adaptive Weak Spots Tray (Missed Items Tracker) */}
      {missedItems.length > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  Weak Spots Detected ({missedItems.length}) — Automatically Re-queued for Mastery
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {missedItems.map((m) => (
                  <Badge key={m.kana} variant="outline" className="text-xs">
                    {m.kana} ({cleanRomaji(m.romaji)})
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                let added = 0
                for (const m of missedItems) {
                  const res = addCustomSRSCard({
                    front: m.kana,
                    reading: m.romaji,
                    meaning: `Kana syllable "${cleanRomaji(m.romaji)}"`,
                    category: 'kana',
                    jlptLevel: 'N5',
                    exampleSentence: m.example,
                  })
                  if (res.added) added++
                }
                toast.success(
                  `Sent ${missedItems.length} weak-spot characters (${added} new) to your Anki SRS deck!`
                )
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Send Weak Spots to Anki SRS
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
