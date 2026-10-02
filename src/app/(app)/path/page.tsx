'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

export default function PathPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Learning Path</h1>
        <p className="text-sm text-muted-foreground">
          Step-by-step roadmap from Kana basics to JLPT N5 mastery.
        </p>
      </div>

      <div className="space-y-4">
        <Card className="rounded-2xl border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Unit 0</span>
              <span className="text-xs text-muted-foreground">4 Lessons</span>
            </div>
            <CardTitle className="text-lg">Kana Foundations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Master the Hiragana and Katakana phonetic scripts, pronunciation, and sound variations.
            </p>
            <Link href="/library?tab=kana">
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
                Open Kana Chart
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
