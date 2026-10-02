'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Layers, ArrowLeft } from 'lucide-react'
import { useProgress } from '@/lib/progress'

export default function ReviewPage() {
  const { cards, isLoading } = useProgress()
  const now = Date.now()
  const dueCards = cards.filter((c) => (c.dueDate || 0) <= now && c.queue !== 'suspended')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SRS Review</h1>
          <p className="text-sm text-muted-foreground">
            Spaced repetition review session.
          </p>
        </div>
        <Link href="/today">
          <Button variant="ghost" size="sm" className="gap-1.5 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
            Today
          </Button>
        </Link>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            {dueCards.length} Cards Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Loading cards...'
              : dueCards.length === 0
              ? 'All cards reviewed! Great job.'
              : `${dueCards.length} cards scheduled for spaced review.`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
