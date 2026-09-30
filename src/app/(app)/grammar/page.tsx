'use client'

import { useState, useMemo } from 'react'
import grammarData from '@/data/grammar.json'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Volume2, Plus } from 'lucide-react'
import { addCustomSRSCard, speakJapanese } from '@/data/srs-deck'
import { toast } from 'sonner'

const LEVELS = ['All', 'N5', 'N4', 'N3', 'N2', 'N1', 'Non-JLPT', '関西弁'] as const

export default function GrammarPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>('N5')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPoints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return grammarData.filter((item) => {
      const matchesLevel =
        selectedLevel === 'All' || item.level === selectedLevel
      if (!matchesLevel) return false
      if (!q) return true
      return (
        item.grammar.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        (item.lesson && item.lesson.toLowerCase().includes(q))
      )
    })
  }, [selectedLevel, searchQuery])

  function handleAddGrammarToSRS(item: {
    grammar: string
    meaning: string
    level: string
    lesson?: string | null
  }) {
    const res = addCustomSRSCard({
      front: item.grammar,
      reading: item.grammar,
      meaning: item.meaning,
      category: 'grammar',
      jlptLevel: item.level,
      exampleSentence: item.lesson || undefined,
    })
    if (res.added) {
      toast.success(`Added "${item.grammar}" to your SRS Practice deck!`)
    } else {
      toast.info(`"${item.grammar}" is already in your SRS deck!`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          Grammar Dictionary
        </h1>
        <p className="text-muted-foreground text-sm">
          Search and practice all {grammarData.length} Japanese grammar points from JLPT N5 to N1, Non-JLPT, and Kansai-ben.
        </p>
      </div>

      {/* Search & Level Filter Controls */}
      <div className="space-y-3 sticky top-0 z-10 bg-background/95 backdrop-blur py-3 border-b">
        <div className="relative">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search grammar point or English meaning (e.g. たい, because, must)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((level) => {
            const count =
              level === 'All'
                ? grammarData.length
                : grammarData.filter((g) => g.level === level).length
            return (
              <Button
                key={level}
                size="sm"
                variant={selectedLevel === level ? 'default' : 'outline'}
                onClick={() => setSelectedLevel(level)}
                className="h-8 text-xs"
              >
                {level}{' '}
                <span className="ml-1 opacity-70 text-[11px]">({count})</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filteredPoints.length} grammar points</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-primary hover:underline"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Grammar Cards Grid */}
      {filteredPoints.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No grammar points matched &ldquo;{searchQuery}&rdquo; in {selectedLevel}.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPoints.map((item, index) => (
            <Card
              key={`${item.level}-${item.grammar}-${index}`}
              className="hover:border-primary/50 transition-colors flex flex-col justify-between"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-bold leading-snug">
                    {item.grammar}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0">
                    {item.level}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  {item.meaning}
                </p>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {item.lesson ? item.lesson.split(' – ')[0] : item.level}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => speakJapanese(item.grammar.split(' ')[0])}
                      title="Listen"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleAddGrammarToSRS(item)}
                      title="Add to SRS Practice Deck"
                    >
                      <Plus className="h-3 w-3 mr-1" /> SRS
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
