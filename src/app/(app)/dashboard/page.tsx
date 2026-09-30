'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Flame,
  MessageSquare,
  Heart,
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
  const [friendLiked, setFriendLiked] = useState(false)

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
          <div className="flex items-center gap-3">
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
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/learn?lesson=hiragana">
          <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Kana Charts
                </p>
                <p className="text-lg font-bold mt-0.5">Hiragana & Katakana</p>
              </div>
              <span className="text-2xl font-bold text-primary bg-primary/10 h-10 w-10 rounded-lg flex items-center justify-center">
                あ
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
                  {dueCount} Cards Due Today
                </p>
              </div>
              <span className="text-2xl font-bold text-blue-600 bg-blue-500/10 h-10 w-10 rounded-lg flex items-center justify-center">
                語
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/grammar">
          <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  JLPT N5–N1 Reference
                </p>
                <p className="text-lg font-bold mt-0.5">979 Grammar Points</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary p-1.5 bg-primary/10 rounded-lg" />
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
                <h3 className="font-bold text-xl">「〜たい」 (Want to do)</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Learn how to conjugate polite verbs to express your desires.
                </p>
              </div>
              <Link href="/learn?lesson=tai-form">
                <Button className="shrink-0">Continue Lesson &rarr;</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <StudyLogger />
      </section>

      {/* Friends Activity */}
      <section className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Friends Activity</h2>
          <Link
            href="/community"
            className="text-sm text-primary hover:underline"
          >
            View Community Feed &rarr;
          </Link>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                T
              </div>
              <div>
                <p className="font-medium text-sm">Takeshi (@takeshi_jp)</p>
                <p className="text-xs text-muted-foreground">2 hours ago · N5</p>
              </div>
            </div>
            <p className="text-sm">
              Finally understood は vs が today! Thanks to the new grammar lesson and SRS flashcards.
            </p>
            <div className="flex gap-4 text-muted-foreground">
              <button
                type="button"
                onClick={() => setFriendLiked((v) => !v)}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  friendLiked
                    ? 'text-red-500 font-semibold'
                    : 'hover:text-foreground'
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${friendLiked ? 'fill-red-500' : ''}`}
                />{' '}
                {friendLiked ? 13 : 12}
              </button>
              <Link
                href="/community"
                className="flex items-center gap-1.5 text-xs hover:text-foreground"
              >
                <MessageSquare className="h-4 w-4" /> 3 comments
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
