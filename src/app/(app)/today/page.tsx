'use client'

import React from 'react'
import Link from 'next/link'
import {
  CalendarCheck,
  Layers,
  Compass,
  ArrowRight,
  Flame,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import { useProgress } from '@/lib/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StackedProgressBar } from '@/components/kana/stacked-progress-bar'
import {
  scriptProgress,
  getAllKanaItems,
  makeKanaId,
  detectKanaScript,
} from '@/lib/kana/mastery-engine'

export default function TodayPage() {
  const { stats, cards, weakPoints, deckOptions, kanaMastery, isLoading } = useProgress()

  const now = Date.now()
  const tomorrow = now + 24 * 60 * 60 * 1000

  // Derive honest metrics from cards
  const activeCards = cards.filter((c) => c.queue !== 'suspended')

  // 1. Review cards due (already learned cards scheduled for today)
  const reviewsDue = activeCards.filter((c) => c.status !== 'new' && (c.dueDate || 0) <= now)
  const dueTomorrow = activeCards.filter(
    (c) => c.status !== 'new' && (c.dueDate || 0) > now && (c.dueDate || 0) <= tomorrow
  )

  // 2. New cards introduced today (capped by daily new limit)
  const newCardsAll = activeCards.filter((c) => c.status === 'new' || (c.repetition === 0 && c.interval === 0))
  const newCardsCap = Math.max(5, deckOptions.newCardsPerDay || 20)
  const newCardsToday = newCardsAll.slice(0, newCardsCap)

  // Today's actual study queue
  const dueTodayCount = reviewsDue.length + newCardsToday.length
  const estimatedMins = Math.max(1, Math.ceil(dueTodayCount * 0.4))

  const stageNew = newCardsAll.length
  const stageLearning = activeCards.filter((c) => c.status === 'learning' || (c.interval > 0 && c.interval < 7)).length
  const stageReview = activeCards.filter((c) => c.status === 'review' || (c.interval >= 7 && c.interval < 21)).length
  const stageMature = activeCards.filter((c) => c.status === 'mastered' || c.interval >= 21).length

  // Time-of-day greeting
  const currentHour = new Date().getHours()
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  // Top weak points (up to 3)
  const topWeakSpots = [...weakPoints]
    .sort((a, b) => (b.missCount || 0) - (a.missCount || 0))
    .slice(0, 3)

  // Kana Mastery Progress Selectors
  const hiraganaProgress = React.useMemo(
    () => scriptProgress('hiragana', kanaMastery),
    [kanaMastery]
  )
  const katakanaProgress = React.useMemo(
    () => scriptProgress('katakana', kanaMastery),
    [kanaMastery]
  )

  const nextKanaToLearn = React.useMemo(() => {
    const all = getAllKanaItems()
    // 1. Any Hiragana below Familiar (stage 2)
    for (const k of all) {
      if (detectKanaScript(k.kana) !== 'hiragana') continue
      const id = makeKanaId(k.kana, 'hiragana')
      const stage = kanaMastery[id]?.stage ?? 0
      if (stage < 2) {
        return {
          kana: k.kana,
          romaji: k.romaji,
          script: 'Hiragana',
          row: k.row,
        }
      }
    }
    // 2. Any Hiragana below Solid (stage 3)
    for (const k of all) {
      if (detectKanaScript(k.kana) !== 'hiragana') continue
      const id = makeKanaId(k.kana, 'hiragana')
      const stage = kanaMastery[id]?.stage ?? 0
      if (stage < 3) {
        return {
          kana: k.kana,
          romaji: k.romaji,
          script: 'Hiragana',
          row: k.row,
        }
      }
    }
    // 3. Any Katakana below Familiar (stage 2)
    for (const k of all) {
      if (detectKanaScript(k.kana) !== 'katakana') continue
      const id = makeKanaId(k.kana, 'katakana')
      const stage = kanaMastery[id]?.stage ?? 0
      if (stage < 2) {
        return {
          kana: k.kana,
          romaji: k.romaji,
          script: 'Katakana',
          row: k.row,
        }
      }
    }
    return null
  }, [kanaMastery])

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Greeting & Streak Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {greeting}, {stats.displayName || 'Learner'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here is your personalized Japanese practice for today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {stats.currentStreak > 0 ? (
            <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-sm font-bold text-orange-600 dark:text-orange-400">
              <Flame className="h-4 w-4 fill-orange-500 text-orange-500" />
              <span>{stats.currentStreak} day streak</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Start your streak today</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Primary Hero Action Card */}
      <Card className="overflow-hidden border-2 border-primary/25 bg-gradient-to-br from-primary/5 via-background to-primary/10 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-background/80 font-semibold gap-1.5 text-xs text-primary border-primary/30">
              <CalendarCheck className="h-3.5 w-3.5 text-primary" />
              Today&apos;s Focus
            </Badge>
            {dueTodayCount > 0 && (
              <span className="text-xs text-muted-foreground font-mono">
                ~{estimatedMins} min session
              </span>
            )}
          </div>
          <CardTitle className="text-xl sm:text-2xl mt-1">
            {isLoading
              ? 'Loading your study queue...'
              : dueTodayCount > 0
              ? 'Daily Spaced-Repetition Review'
              : 'All caught up on reviews! 🎉'}
          </CardTitle>
          <CardDescription className="text-sm">
            {isLoading
              ? 'Fetching your cards from storage...'
              : dueTodayCount > 0
              ? `You have ${dueTodayCount} card${dueTodayCount === 1 ? '' : 's'} scheduled for recall today (${reviewsDue.length} reviews + ${newCardsToday.length} new).`
              : 'Zero pending reviews. Continue progressing along your curriculum path.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-1">
          <div className="flex flex-wrap items-center gap-3">
            {dueTodayCount > 0 ? (
              <Link href="/review">
                <Button size="lg" className="rounded-xl font-semibold gap-2 shadow-sm">
                  <Layers className="h-4 w-4" />
                  Start Reviews ({dueTodayCount})
                  <ArrowRight className="h-4 w-4 ml-0.5" />
                </Button>
              </Link>
            ) : (
              <Link href="/path">
                <Button size="lg" className="rounded-xl font-semibold gap-2 shadow-sm">
                  <Compass className="h-4 w-4" />
                  Continue Learning Path
                  <ArrowRight className="h-4 w-4 ml-0.5" />
                </Button>
              </Link>
            )}

            <Link href="/library?tab=kana">
              <Button variant="outline" size="lg" className="rounded-xl gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Kana &amp; Grammar Reference
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 2.5 Compact Kana Mastery Card */}
      <Card className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">Kana Mastery</span>
          </div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-muted-foreground">
              {nextKanaToLearn ? (
                <span>
                  Next up:{' '}
                  <strong className="text-foreground">
                    {nextKanaToLearn.script} {nextKanaToLearn.kana} ({nextKanaToLearn.romaji})
                  </strong>
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Kana foundations solid!
                </span>
              )}
            </span>
            <Link href="/library?tab=kana">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1 px-2 font-semibold">
                Open Kana &rarr;
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StackedProgressBar progress={hiraganaProgress} label="Hiragana Mastery" />
          <StackedProgressBar progress={katakanaProgress} label="Katakana Mastery" />
        </div>
      </Card>

      {/* 3. Daily Queue Breakdown & Honest SRS Distribution */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/80">
          <CardHeader className="pb-1 pt-4">
            <CardDescription className="text-xs font-medium">Due Today</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-primary">
              {isLoading ? '...' : dueTodayCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-xs text-muted-foreground">
            {reviewsDue.length} reviews + {newCardsToday.length} new
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="pb-1 pt-4">
            <CardDescription className="text-xs font-medium">Due Tomorrow</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-foreground">
              {isLoading ? '...' : dueTomorrow.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-xs text-muted-foreground">
            Upcoming forecast queue
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="pb-1 pt-4">
            <CardDescription className="text-xs font-medium">In Learning</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {isLoading ? '...' : stageLearning}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-xs text-muted-foreground">
            Interval &lt; 7 days
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="pb-1 pt-4">
            <CardDescription className="text-xs font-medium">Mature (&ge; 21d)</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {isLoading ? '...' : stageMature}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-xs text-muted-foreground">
            Solid long-term retention
          </CardContent>
        </Card>
      </div>

      {/* 4. SRS Stage Breakdown Bar */}
      {activeCards.length > 0 && (
        <Card className="rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
            <span>SRS Retention Pipeline ({activeCards.length} Total Cards)</span>
            <span>{stageMature} Mature ({Math.round((stageMature / activeCards.length) * 100)}%)</span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/60">
            {stageMature > 0 && (
              <div
                style={{ width: `${(stageMature / activeCards.length) * 100}%` }}
                className="bg-emerald-500 transition-all"
                title={`Mature: ${stageMature}`}
              />
            )}
            {stageReview > 0 && (
              <div
                style={{ width: `${(stageReview / activeCards.length) * 100}%` }}
                className="bg-blue-500 transition-all"
                title={`Review: ${stageReview}`}
              />
            )}
            {stageLearning > 0 && (
              <div
                style={{ width: `${(stageLearning / activeCards.length) * 100}%` }}
                className="bg-amber-500 transition-all"
                title={`Learning: ${stageLearning}`}
              />
            )}
            {stageNew > 0 && (
              <div
                style={{ width: `${(stageNew / activeCards.length) * 100}%` }}
                className="bg-muted-foreground/30 transition-all"
                title={`New: ${stageNew}`}
              />
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 px-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Mature ({stageMature})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Review ({stageReview})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Learning ({stageLearning})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/30" /> New ({stageNew})
            </span>
          </div>
        </Card>
      )}

      {/* 5. Weak Spots & Mistakes */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Focus Areas &amp; Weak Spots
            </CardTitle>
            {topWeakSpots.length > 0 && (
              <Link href="/review?mode=weak">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-primary gap-1">
                  Drill Mistakes
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
          <CardDescription className="text-xs">
            Items missed during quizzes or reviews automatically surface here for targeted recall.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {topWeakSpots.length === 0 ? (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 border text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>No weak points detected. Keep reviewing to track tricky items!</span>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3">
              {topWeakSpots.map((item) => (
                <div
                  key={item.id || item.front}
                  className="flex flex-col justify-between p-3 rounded-xl border bg-muted/20 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-lg font-bold font-japanese">{item.front}</span>
                      <p className="text-xs text-muted-foreground">{item.reading}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {item.missCount} missed
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{item.meaning}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. Learning Path Snapshot */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Compass className="h-4 w-4 text-blue-500" />
                JLPT N5 Path Progress
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Structured units from Kana scripts to core N5 grammar.
              </CardDescription>
            </div>
            <Link href="/path">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-primary gap-1">
                View Full Path
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-3.5 rounded-xl border bg-muted/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">Unit 0: Kana Foundations</span>
                <Badge variant="outline" className="text-[10px]">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Hiragana, Katakana, dakuten, and sound combinations with audio.
              </p>
              <div className="pt-1">
                <Link href="/library?tab=kana">
                  <Button variant="secondary" size="sm" className="h-7 text-xs rounded-lg">
                    Open Kana Tables
                  </Button>
                </Link>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border bg-muted/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">Unit 1: Core Particles &amp; Sentences</span>
                <Badge variant="secondary" className="text-[10px]">Up Next</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                です / だ, は, か, and introductory self-introductions.
              </p>
              <div className="pt-1">
                <Link href="/library?tab=grammar">
                  <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg">
                    Preview Grammar Points
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
