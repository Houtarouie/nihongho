'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { BookOpen, GraduationCap, BookMarked, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function LibraryContent() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'grammar'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Library &amp; Reference</h1>
        <p className="text-sm text-muted-foreground">
          Reference materials for Grammar, Kana, Vocabulary, and Reading.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={`rounded-2xl transition-all ${activeTab === 'grammar' ? 'border-primary ring-1 ring-primary/20' : ''}`}>
          <CardHeader className="pb-2">
            <BookOpen className="h-5 w-5 text-primary mb-1" />
            <CardTitle className="text-base">Grammar</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            204 curated grammar points with cloze exercises &amp; full 979 dictionary.
          </CardContent>
        </Card>

        <Card className={`rounded-2xl transition-all ${activeTab === 'kana' ? 'border-primary ring-1 ring-primary/20' : ''}`}>
          <CardHeader className="pb-2">
            <GraduationCap className="h-5 w-5 text-blue-500 mb-1" />
            <CardTitle className="text-base">Kana</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Interactive Hiragana &amp; Katakana tables with native audio pronunciation.
          </CardContent>
        </Card>

        <Card className={`rounded-2xl transition-all ${activeTab === 'vocab' ? 'border-primary ring-1 ring-primary/20' : ''}`}>
          <CardHeader className="pb-2">
            <Sparkles className="h-5 w-5 text-green-500 mb-1" />
            <CardTitle className="text-base">Vocabulary</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Essential JLPT N5 vocabulary and everyday scenario words.
          </CardContent>
        </Card>

        <Card className={`rounded-2xl transition-all ${activeTab === 'reading' ? 'border-primary ring-1 ring-primary/20' : ''}`}>
          <CardHeader className="pb-2">
            <BookMarked className="h-5 w-5 text-orange-500 mb-1" />
            <CardTitle className="text-base">Reading</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Graded stories and dialogues with furigana toggle.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div>Loading library...</div>}>
      <LibraryContent />
    </Suspense>
  )
}
