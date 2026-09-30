'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Flame,
  Sparkles,
  BookOpen,
  PenTool,
  Clock,
} from 'lucide-react'
import { StudyLogger } from '@/components/study/study-logger'
import {
  loadUserStats,
  loadSRSCards,
  DEFAULT_USER_STATS,
  type UserStudyStats,
} from '@/data/srs-deck'

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStudyStats>(DEFAULT_USER_STATS)
  const [dueCount, setDueCount] = useState<number>(28)

  useEffect(() => {
    function sync() {
      setStats(loadUserStats())
      const cards = loadSRSCards()
      const now = Date.now() + 60 * 1000
      setDueCount(cards.filter((c) => c.dueDate <= now).length)
    }
    sync()
    window.addEventListener('nihongo-stats-updated', sync)
    return () => window.removeEventListener('nihongo-stats-updated', sync)
  }, [])

  const jlptProgress = Math.min(
    100,
    Math.round(
      ((stats.completedLessons?.length || 0) / 6) * 60 +
        Math.min(40, Math.round(stats.vocabCount / 5))
    )
  )

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full text-sm font-bold">
              <Flame className="h-4 w-4 fill-orange-500" />
              <span>{stats.currentStreak} day streak</span>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3 text-yellow-500" /> {stats.xp} XP
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" /> {stats.totalStudyMins}m studied
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight pt-1">
            Welcome back, {stats.displayName} 👋
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href="/practice">
            <Button size="sm">
              <PenTool className="h-4 w-4 mr-1.5" />
              Review SRS ({dueCount} due)
            </Button>
          </Link>
        </div>
      </header>

      {/* Quick Access Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/learn">
          <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Writing Systems & Drills
                </p>
                <p className="text-lg font-bold mt-0.5">Hiragana & Katakana</p>
              </div>
              <span className="text-2xl font-bold text-primary bg-primary/10 h-10 w-10 rounded-xl flex items-center justify-center">
                あ
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/grammar">
          <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  JLPT N5–N1 Library
                </p>
                <p className="text-lg font-bold mt-0.5">979 Grammar Points</p>
              </div>
              <BookOpen className="h-9 w-9 text-primary p-2 bg-primary/10 rounded-xl" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/reading">
          <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Graded Passages & Vocab
                </p>
                <p className="text-lg font-bold mt-0.5">Reading & Vocab</p>
              </div>
              <span className="text-2xl font-bold text-primary bg-primary/10 h-10 w-10 rounded-xl flex items-center justify-center">
                単
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/practice">
          <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Spaced Repetition
                </p>
                <p className="text-lg font-bold mt-0.5">
                  {dueCount} Cards Due
                </p>
              </div>
              <span className="text-2xl font-bold text-primary bg-primary/10 h-10 w-10 rounded-xl flex items-center justify-center">
                語
              </span>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Progress & Goals */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>JLPT {stats.targetJlpt} Progress</span>
                <span className="text-muted-foreground font-semibold text-sm">
                  {jlptProgress}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={jlptProgress} className="h-2.5" />
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">Vocabulary</p>
                  <p className="font-bold text-base">{stats.vocabCount}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">Kanji</p>
                  <p className="font-bold text-base">{stats.kanjiCount}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">Grammar</p>
                  <p className="font-bold text-base">{stats.grammarCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Continue Learning */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
              <div>
                <Badge className="mb-2">Up Next in Curriculum</Badge>
                <h3 className="font-bold text-xl">「です / だ」 (To be, Is)</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Practice declarative sentences with minimalist fill-in-the-blank drills.
                </p>
              </div>
              <Link href="/grammar">
                <Button className="shrink-0">Start Practice &rarr;</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <StudyLogger />
      </section>
    </div>
  )
}
