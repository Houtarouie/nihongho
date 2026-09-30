'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  CheckCircle2,
  Volume2,
  Sparkles,
  Plus,
  ArrowLeft,
  Trophy,
  HelpCircle,
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
import { toast } from 'sonner'

type ActiveView =
  | 'overview'
  | 'hiragana'
  | 'katakana'
  | 'lesson-greetings-aisatsu'
  | 'lesson-self-introduction'
  | 'lesson-wa-vs-ga'
  | 'lesson-tai-form'

type KanaSubTab = 'gojuon' | 'dakuten' | 'yoon' | 'quiz'

export default function LearnPage() {
  const [activeView, setActiveView] = useState<ActiveView>('overview')
  const [kanaSubTab, setKanaSubTab] = useState<KanaSubTab>('gojuon')
  const [selectedKana, setSelectedKana] = useState<KanaItem | null>(null)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  // Kana Quiz state
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [quizAnswered, setQuizAnswered] = useState<string | null>(null)

  useEffect(() => {
    const stats = loadUserStats()
    setCompletedLessons(stats.completedLessons || [])

    // Check URL hash or query param for direct navigation from Dashboard
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const lessonParam = params.get('lesson')
      if (lessonParam === 'tai-form') {
        setActiveView('lesson-tai-form')
      } else if (lessonParam === 'hiragana') {
        setActiveView('hiragana')
      } else if (lessonParam === 'katakana') {
        setActiveView('katakana')
      }
    }
  }, [])

  function markComplete(lessonId: string) {
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
    if (!alreadyDone) {
      toast.success('Lesson completed! +50 XP 🎉')
    } else {
      toast.info('Lesson already marked complete!')
    }
  }

  function handleKanaClick(item: KanaItem, scriptLabel: string) {
    setSelectedKana(item)
    speakJapanese(item.kana)
    toast.info(`${item.kana} (${item.romaji})`, {
      description: item.example || `${scriptLabel} character`,
      duration: 2000,
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
      toast.success(`Added "${item.kana}" to your SRS Practice deck!`)
    } else {
      toast.info(`"${item.kana}" is already in your SRS deck (marked due now).`)
    }
  }

  // Flatten kana for quiz
  const quizPool = useMemo(() => {
    const rows =
      activeView === 'katakana' ? KATAKANA_GOJUON : HIRAGANA_GOJUON
    const flat: KanaItem[] = []
    rows.forEach((r) =>
      r.items.forEach((i) => {
        if (i) flat.push(i)
      })
    )
    // Deterministic shuffle per view
    return [...flat].sort((a, b) => a.romaji.localeCompare(b.romaji))
  }, [activeView])

  const currentQuizItem = quizPool[quizIndex % Math.max(1, quizPool.length)]

  const quizOptions = useMemo(() => {
    if (!currentQuizItem) return []
    const others = quizPool
      .filter((k) => k.romaji !== currentQuizItem.romaji)
      .slice(0, 12)
    const picked = [
      currentQuizItem.romaji,
      others[(quizIndex * 3) % others.length]?.romaji || 'ka',
      others[(quizIndex * 5 + 1) % others.length]?.romaji || 'shi',
      others[(quizIndex * 7 + 2) % others.length]?.romaji || 'to',
    ]
    return Array.from(new Set(picked)).sort()
  }, [currentQuizItem, quizPool, quizIndex])

  function renderKanaGrid(rows: KanaRow[], scriptLabel: string) {
    const isYoon = kanaSubTab === 'yoon'
    return (
      <div className="space-y-6">
        {selectedKana && (
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => speakJapanese(selectedKana.kana)}
                  className="h-16 w-16 rounded-xl bg-background border shadow-sm flex items-center justify-center text-4xl font-bold hover:border-primary transition-colors"
                  title="Play pronunciation"
                >
                  {selectedKana.kana}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">
                      Romaji: {selectedKana.romaji}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => speakJapanese(selectedKana.kana)}
                    >
                      <Volume2 className="h-4 w-4 mr-1" /> Listen
                    </Button>
                  </div>
                  {selectedKana.example && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Example word: <span className="font-medium text-foreground">{selectedKana.example}</span>
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddKanaToSRS(selectedKana, scriptLabel)}
              >
                <Plus className="h-4 w-4 mr-1" /> Add to SRS Deck
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.rowName}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
            >
              <div className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {row.rowName}
              </div>
              <div
                className={`grid flex-1 gap-2 ${
                  isYoon ? 'grid-cols-3' : 'grid-cols-5'
                }`}
              >
                {row.items.map((item, idx) =>
                  item ? (
                    <button
                      key={item.kana}
                      onClick={() => handleKanaClick(item, scriptLabel)}
                      className={`group relative flex flex-col items-center justify-center rounded-xl border p-3 transition-all hover:border-primary hover:shadow-sm ${
                        selectedKana?.kana === item.kana
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : 'bg-card'
                      }`}
                    >
                      <Volume2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 absolute top-2 right-2 transition-opacity" />
                      <span className="text-2xl sm:text-3xl font-bold">
                        {item.kana}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground mt-1">
                        {item.romaji}
                      </span>
                    </button>
                  ) : (
                    <div
                      key={`empty-${idx}`}
                      className="rounded-xl border border-dashed bg-muted/20 p-3"
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Active Lesson Lookup
  const activeLesson = useMemo(() => {
    if (!activeView.startsWith('lesson-')) return null
    const id = activeView.replace('lesson-', '')
    return CURRICULUM_LESSONS.find((l) => l.id === id) || null
  }, [activeView])

  // Calculate dynamic progress percentages
  const section1Progress =
    (completedLessons.includes('hiragana-chart') ? 50 : 0) +
    (completedLessons.includes('katakana-chart') ? 50 : 0)
  const section2Progress =
    (completedLessons.includes('greetings-aisatsu') ? 50 : 0) +
    (completedLessons.includes('self-introduction') ? 50 : 0)
  const section3Progress = completedLessons.includes('wa-vs-ga') ? 100 : 0
  const section4Progress = completedLessons.includes('tai-form') ? 100 : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Navigation Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Japanese Curriculum & Kana Charts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Interactive Hiragana & Katakana charts with audio pronunciation and structured JLPT N5 lessons.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeView === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('overview')}
          >
            Curriculum
          </Button>
          <Button
            variant={activeView === 'hiragana' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveView('hiragana')
              setKanaSubTab('gojuon')
              setSelectedKana(HIRAGANA_GOJUON[0].items[0])
            }}
          >
            あ Hiragana Chart
          </Button>
          <Button
            variant={activeView === 'katakana' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveView('katakana')
              setKanaSubTab('gojuon')
              setSelectedKana(KATAKANA_GOJUON[0].items[0])
            }}
          >
            ア Katakana Chart
          </Button>
        </div>
      </div>

      {/* VIEW 1: HIRAGANA OR KATAKANA INTERACTIVE CHART */}
      {(activeView === 'hiragana' || activeView === 'katakana') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveView('overview')}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <div>
                <h2 className="text-2xl font-bold">
                  {activeView === 'hiragana'
                    ? 'Hiragana Chart (ひらがな)'
                    : 'Katakana Chart (カタカナ)'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Click any character to hear native pronunciation and view example words.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={
                completedLessons.includes(`${activeView}-chart`)
                  ? 'secondary'
                  : 'default'
              }
              onClick={() => markComplete(`${activeView}-chart`)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              {completedLessons.includes(`${activeView}-chart`)
                ? 'Completed'
                : 'Mark Chart Mastered (+50 XP)'}
            </Button>
          </div>

          {/* Sub-tabs for Gojuon / Dakuten / Yoon / Quiz */}
          <div className="flex flex-wrap gap-2 bg-muted p-1 rounded-lg">
            {(
              [
                { id: 'gojuon', label: 'Basic (Gojūon - 46)' },
                { id: 'dakuten', label: 'Voiced (Dakuten - 25)' },
                { id: 'yoon', label: 'Combo (Yōon - 33)' },
                { id: 'quiz', label: '⚡ Interactive Quiz' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setKanaSubTab(tab.id)
                  setQuizAnswered(null)
                }}
                className={`flex-1 min-w-[130px] rounded-md py-1.5 px-3 text-xs sm:text-sm font-medium transition-all ${
                  kanaSubTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {kanaSubTab === 'quiz' ? (
            <Card className="max-w-lg mx-auto">
              <CardHeader className="text-center">
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                  <span>Question {(quizIndex % quizPool.length) + 1}</span>
                  <Badge variant="secondary">Score: {quizScore}</Badge>
                </div>
                <CardTitle className="text-6xl font-bold py-6">
                  {currentQuizItem?.kana}
                </CardTitle>
                <CardDescription>
                  Select the correct Romaji reading for this character:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {quizOptions.map((opt) => {
                    const isCorrect = opt === currentQuizItem?.romaji
                    const isSelected = quizAnswered === opt
                    let btnVariant: 'outline' | 'default' | 'destructive' =
                      'outline'
                    if (quizAnswered) {
                      if (isCorrect) btnVariant = 'default'
                      else if (isSelected) btnVariant = 'destructive'
                    }
                    return (
                      <Button
                        key={opt}
                        variant={btnVariant}
                        className="h-12 text-lg font-semibold"
                        disabled={!!quizAnswered}
                        onClick={() => {
                          setQuizAnswered(opt)
                          speakJapanese(currentQuizItem.kana)
                          if (opt === currentQuizItem.romaji) {
                            setQuizScore((s) => s + 1)
                            toast.success('Correct! 🎉')
                          } else {
                            toast.error(
                              `Not quite! ${currentQuizItem.kana} is "${currentQuizItem.romaji}".`
                            )
                          }
                        }}
                      >
                        {opt}
                      </Button>
                    )
                  })}
                </div>
                {quizAnswered && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setQuizAnswered(null)
                      setQuizIndex((i) => i + 1)
                    }}
                  >
                    Next Character &rarr;
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            renderKanaGrid(
              activeView === 'hiragana'
                ? kanaSubTab === 'gojuon'
                  ? HIRAGANA_GOJUON
                  : kanaSubTab === 'dakuten'
                  ? HIRAGANA_DAKUTEN
                  : HIRAGANA_YOON
                : kanaSubTab === 'gojuon'
                ? KATAKANA_GOJUON
                : kanaSubTab === 'dakuten'
                ? KATAKANA_DAKUTEN
                : KATAKANA_YOON,
              activeView === 'hiragana' ? 'Hiragana' : 'Katakana'
            )
          )}
        </div>
      )}

      {/* VIEW 2: INTERACTIVE LESSON READER */}
      {activeLesson && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveView('overview')}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Curriculum
              </Button>
              <Badge>{activeLesson.jlptLevel}</Badge>
            </div>
            <Button
              size="sm"
              onClick={() => markComplete(activeLesson.id)}
              variant={
                completedLessons.includes(activeLesson.id)
                  ? 'secondary'
                  : 'default'
              }
            >
              <Trophy className="h-4 w-4 mr-1.5" />
              {completedLessons.includes(activeLesson.id)
                ? 'Lesson Completed ✓'
                : 'Complete Lesson (+50 XP)'}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{activeLesson.title}</CardTitle>
              <CardDescription className="text-base">
                {activeLesson.subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-muted/60 p-4 text-sm leading-relaxed">
                {activeLesson.summary}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Key Expressions & Examples
                </h3>
                <div className="grid gap-4">
                  {activeLesson.keyPoints.map((pt, idx) => (
                    <Card key={idx} className="border-border/80">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xl font-bold text-primary">
                              {pt.japanese}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pt.reading} · {pt.romaji}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => speakJapanese(pt.japanese)}
                              title="Listen"
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const res = addCustomSRSCard({
                                  front: pt.japanese,
                                  reading: pt.reading,
                                  meaning: pt.english,
                                  category: 'grammar',
                                  jlptLevel: activeLesson.jlptLevel,
                                  exampleSentence: pt.note,
                                })
                                if (res.added) {
                                  toast.success('Added to your SRS review deck!')
                                } else {
                                  toast.info('Already in your SRS deck!')
                                }
                              }}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" /> SRS
                            </Button>
                          </div>
                        </div>
                        <p className="font-medium text-sm">{pt.english}</p>
                        <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                          💡 {pt.note}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW 3: CURRICULUM OVERVIEW */}
      {activeView === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Section 1: Kana */}
          <Card className="border-primary/40 shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    1. Hiragana & Katakana
                  </CardTitle>
                  <CardDescription>
                    Full Gojūon, Dakuten & Yōon charts with native audio.
                  </CardDescription>
                </div>
                {section1Progress === 100 ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                ) : (
                  <Badge variant="secondary">{section1Progress}%</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={section1Progress} className="h-2" />
              <div className="grid gap-2">
                <Button
                  variant="default"
                  className="justify-start"
                  onClick={() => {
                    setActiveView('hiragana')
                    setKanaSubTab('gojuon')
                    setSelectedKana(HIRAGANA_GOJUON[0].items[0])
                  }}
                >
                  <BookOpen className="mr-2 h-4 w-4" /> Open Interactive Hiragana Chart (あ〜ん)
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    setActiveView('katakana')
                    setKanaSubTab('gojuon')
                    setSelectedKana(KATAKANA_GOJUON[0].items[0])
                  }}
                >
                  <BookOpen className="mr-2 h-4 w-4" /> Open Interactive Katakana Chart (ア〜ン)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Greetings & Intro */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    2. Basic Greetings & Intro
                  </CardTitle>
                  <CardDescription>
                    Introduce yourself and master daily Japanese expressions.
                  </CardDescription>
                </div>
                {section2Progress === 100 ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                ) : (
                  <Badge variant="secondary">{section2Progress}%</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={section2Progress} className="h-2" />
              <div className="grid gap-2">
                <Button
                  variant="default"
                  className="justify-start"
                  onClick={() => setActiveView('lesson-greetings-aisatsu')}
                >
                  <BookOpen className="mr-2 h-4 w-4" /> Greetings (挨拶 - Aisatsu)
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => setActiveView('lesson-self-introduction')}
                >
                  <BookOpen className="mr-2 h-4 w-4" /> Self Introduction (自己紹介)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Sentence Structure */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    3. Sentence Structure & Particles
                  </CardTitle>
                  <CardDescription>
                    Master SOV word order, は vs が, を, に, and で.
                  </CardDescription>
                </div>
                {section3Progress === 100 ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                ) : (
                  <Badge variant="secondary">{section3Progress}%</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={section3Progress} className="h-2" />
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => setActiveView('lesson-wa-vs-ga')}
                >
                  <BookOpen className="mr-2 h-4 w-4" /> は vs が & Essential Particles
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Verb Conjugation & ~tai */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    4. Expressing Desires (〜たい)
                  </CardTitle>
                  <CardDescription>
                    Conjugate verbs to express what you want to do.
                  </CardDescription>
                </div>
                {section4Progress === 100 ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                ) : (
                  <Badge variant="secondary">{section4Progress}%</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={section4Progress} className="h-2" />
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => setActiveView('lesson-tai-form')}
                >
                  <HelpCircle className="mr-2 h-4 w-4" /> Lesson: 「〜たい」 Want to do
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
