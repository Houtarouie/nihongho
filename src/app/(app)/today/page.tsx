'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProgress } from '@/lib/progress'
import { CalendarCheck, Layers, Compass, ArrowRight } from 'lucide-react'

export default function TodayPage() {
  const { stats, cards, isLoading } = useProgress()
  const now = Date.now()
  const dueCards = cards.filter((c) => (c.dueDate || 0) <= now && c.queue !== 'suspended')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Today</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back{stats.displayName ? `, ${stats.displayName}` : ''}. Here is your plan for today.
        </p>
      </div>

      <Card className="rounded-2xl border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            {dueCards.length > 0 ? "Today's Review Queue" : 'All caught up!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Loading your study queue...'
              : dueCards.length > 0
              ? `You have ${dueCards.length} review card${dueCards.length === 1 ? '' : 's'} waiting.`
              : 'You have completed all pending reviews. Continue with your next path lesson.'}
          </p>
          <div className="flex gap-3">
            {dueCards.length > 0 ? (
              <Link href="/review">
                <Button className="gap-2 rounded-xl">
                  <Layers className="h-4 w-4" />
                  Start Review ({dueCards.length})
                </Button>
              </Link>
            ) : (
              <Link href="/path">
                <Button className="gap-2 rounded-xl">
                  <Compass className="h-4 w-4" />
                  Continue Learning Path
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
