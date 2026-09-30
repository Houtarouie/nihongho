'use client'

import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { SRSCard, AnkiReviewLog } from '@/data/srs-deck'

interface AnkiStatsProps {
  cards: SRSCard[]
  reviewLogs: AnkiReviewLog[]
}

export function AnkiStats({ cards, reviewLogs }: AnkiStatsProps) {
  // 1. Card Maturity Breakdown (Anki standard: New, Learning, Young < 21d, Mature >= 21d, Suspended)
  const maturity = useMemo(() => {
    let newCount = 0
    let learnCount = 0
    let youngCount = 0
    let matureCount = 0
    let suspendedCount = 0

    for (const c of cards) {
      if (c.queue === 'suspended' || c.queue === 'buried') {
        suspendedCount++
      } else if (c.status === 'new') {
        newCount++
      } else if (c.status === 'learning' || c.interval === 0) {
        learnCount++
      } else if (c.interval < 21) {
        youngCount++
      } else {
        matureCount++
      }
    }
    const total = Math.max(1, cards.length)
    return {
      newCount,
      learnCount,
      youngCount,
      matureCount,
      suspendedCount,
      total,
    }
  }, [cards])

  // 2. 28-Day Review Heatmap
  const heatmapDays = useMemo(() => {
    const days: { dateStr: string; label: string; count: number }[] = []
    const DAY_MS = 24 * 60 * 60 * 1000
    const now = new Date()

    const countsByDate: Record<string, number> = {}
    for (const log of reviewLogs) {
      const dStr = new Date(log.timestamp).toISOString().split('T')[0]
      countsByDate[dStr] = (countsByDate[dStr] || 0) + 1
    }

    for (let i = 27; i >= 0; i--) {
      const d = new Date(now.getTime() - i * DAY_MS)
      const dStr = d.toISOString().split('T')[0]
      days.push({
        dateStr: dStr,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: countsByDate[dStr] || 0,
      })
    }
    return days
  }, [reviewLogs])

  // 3. 14-Day Forecast
  const forecast = useMemo(() => {
    const DAY_MS = 24 * 60 * 60 * 1000
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const baseMs = startOfToday.getTime()

    const buckets = Array.from({ length: 14 }, (_, idx) => ({
      dayOffset: idx,
      label: idx === 0 ? 'Today' : idx === 1 ? 'Tmrw' : `+${idx}d`,
      due: 0,
    }))

    for (const c of cards) {
      if (c.queue !== 'active') continue
      const diffDays = Math.max(
        0,
        Math.floor((c.dueDate - baseMs) / DAY_MS)
      )
      if (diffDays < 14) {
        buckets[diffDays].due += 1
      }
    }
    const maxDue = Math.max(1, ...buckets.map((b) => b.due))
    return { buckets, maxDue }
  }, [cards])

  // 4. Answer Button Retention Stats
  const retentionStats = useMemo(() => {
    let again = 0
    let hard = 0
    let good = 0
    let easy = 0
    for (const log of reviewLogs) {
      if (log.rating === 'again') again++
      else if (log.rating === 'hard') hard++
      else if (log.rating === 'good') good++
      else if (log.rating === 'easy') easy++
    }
    const total = again + hard + good + easy
    const passCount = hard + good + easy
    const retentionRate =
      total > 0 ? Math.round((passCount / total) * 100) : 100
    return { again, hard, good, easy, total, retentionRate }
  }, [reviewLogs])

  return (
    <div className="space-y-6">
      {/* Review Heatmap */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Anki Review Heatmap (Last 28 Days)
              </CardTitle>
              <CardDescription>
                Daily review consistency and total cards studied ({retentionStats.total} total reviews)
              </CardDescription>
            </div>
            <Badge variant="secondary">
              True Retention: {retentionStats.retentionRate}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
            {heatmapDays.map((d) => {
              const intensity =
                d.count === 0
                  ? 'bg-muted border-border'
                  : d.count < 8
                  ? 'bg-green-500/30 border-green-500/40 text-green-900 dark:text-green-200'
                  : d.count < 16
                  ? 'bg-green-500/60 border-green-500/70 text-white'
                  : 'bg-green-600 border-green-700 text-white'
              return (
                <div
                  key={d.dateStr}
                  className={`rounded-md border p-2 flex flex-col items-center justify-center text-center transition-all ${intensity}`}
                  title={`${d.label}: ${d.count} reviews`}
                >
                  <span className="text-[10px] opacity-80">{d.label.split(' ')[1]}</span>
                  <span className="text-xs font-bold">{d.count}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Card Counts & Answer Accuracy */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Card Maturity Breakdown</CardTitle>
            <CardDescription>
              Distribution of New, Learning, Young (&lt;21d), and Mature (&ge;21d) cards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  New
                </span>
                <span>{maturity.newCount} cards</span>
              </div>
              <Progress
                value={(maturity.newCount / maturity.total) * 100}
                className="h-2"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-orange-500 font-medium">
                  Learning / Relearning
                </span>
                <span>{maturity.learnCount} cards</span>
              </div>
              <Progress
                value={(maturity.learnCount / maturity.total) * 100}
                className="h-2"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Young (Interval 1–20d)
                </span>
                <span>{maturity.youngCount} cards</span>
              </div>
              <Progress
                value={(maturity.youngCount / maturity.total) * 100}
                className="h-2"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300 font-semibold">
                  Mature (Interval &ge;21d)
                </span>
                <span>{maturity.matureCount} cards</span>
              </div>
              <Progress
                value={(maturity.matureCount / maturity.total) * 100}
                className="h-2"
              />
            </div>

            {maturity.suspendedCount > 0 && (
              <p className="text-xs text-muted-foreground pt-1">
                Suspended / Buried: {maturity.suspendedCount} cards
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Answer Button Accuracy</CardTitle>
            <CardDescription>
              Historical grading distribution across all review sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-lg border p-3 bg-red-500/5 border-red-500/20">
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                  Again
                </p>
                <p className="text-xl font-bold mt-1">{retentionStats.again}</p>
              </div>
              <div className="rounded-lg border p-3 bg-orange-500/5 border-orange-500/20">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                  Hard
                </p>
                <p className="text-xl font-bold mt-1">{retentionStats.hard}</p>
              </div>
              <div className="rounded-lg border p-3 bg-green-500/5 border-green-500/20">
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
                  Good
                </p>
                <p className="text-xl font-bold mt-1">{retentionStats.good}</p>
              </div>
              <div className="rounded-lg border p-3 bg-blue-500/5 border-blue-500/20">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  Easy
                </p>
                <p className="text-xl font-bold mt-1">{retentionStats.easy}</p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              FSRS target retention is configured to <strong>90%</strong>. Your current True Retention is{' '}
              <strong className="text-foreground">
                {retentionStats.retentionRate}%
              </strong>
              .
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 14-Day Due Forecast */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">14-Day Review Forecast</CardTitle>
          <CardDescription>
            Number of cards scheduled to become due over the next 2 weeks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 items-end h-36 pt-4">
            {forecast.buckets.map((b) => {
              const heightPct = Math.max(
                8,
                Math.round((b.due / forecast.maxDue) * 100)
              )
              return (
                <div
                  key={b.label}
                  className="flex flex-col items-center justify-end h-full gap-1"
                >
                  <span className="text-[10px] font-semibold">{b.due}</span>
                  <div className="w-full bg-muted rounded-t-md flex items-end h-20 overflow-hidden">
                    <div
                      className="w-full bg-primary rounded-t-md transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {b.label}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
