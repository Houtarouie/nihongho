'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Volume2, Plus, CheckCircle2, Layers } from 'lucide-react'
import { BUNPRO_VOCAB_ITEMS, type BunproVocabItem } from '@/data/bunpro-vocab'
import {
  addCustomSRSCard,
  loadSRSCards,
  speakJapanese,
} from '@/data/srs-deck'
import { renderAnkiText } from '@/lib/anki/furigana'
import { toast } from 'sonner'

const LIST_CATEGORIES = [
  'All',
  'JLPT',
  'Essential Core',
  'Textbook (Genki)',
  'Community',
] as const

const JLPT_FILTERS = ['All', 'N5', 'N4', 'N3', 'N2', 'N1'] as const

export function BunproVocabLists() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedLevel, setSelectedLevel] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'need-to-learn' | 'in-srs'
  >('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [srsFronts, setSrsFronts] = useState<Set<string>>(new Set())

  function syncSRSState() {
    const cards = loadSRSCards()
    const fronts = new Set(
      cards.map((c) => c.front.replace(/\[[^\]]+\]/g, '').trim())
    )
    setSrsFronts(fronts)
  }

  useEffect(() => {
    syncSRSState()
  }, [])

  const filteredVocab = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return BUNPRO_VOCAB_ITEMS.filter((item) => {
      if (
        selectedCategory !== 'All' &&
        item.listCategory !== selectedCategory
      ) {
        return false
      }
      if (selectedLevel !== 'All' && item.jlptLevel !== selectedLevel) {
        return false
      }
      const inSRS = srsFronts.has(item.word)
      if (statusFilter === 'need-to-learn' && inSRS) return false
      if (statusFilter === 'in-srs' && !inSRS) return false

      if (!q) return true
      return (
        item.word.toLowerCase().includes(q) ||
        item.furigana.toLowerCase().includes(q) ||
        item.romaji.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q)
      )
    })
  }, [selectedCategory, selectedLevel, statusFilter, searchQuery, srsFronts])

  function handleAddWordToSRS(item: BunproVocabItem) {
    const firstSentence = item.sentences[0]
    const res = addCustomSRSCard({
      front: `${item.word}[${item.furigana}]`,
      reading: `${item.furigana} (${item.romaji})`,
      meaning: item.meaning,
      category: 'vocabulary',
      jlptLevel: item.jlptLevel,
      exampleSentence: firstSentence?.japanese,
      exampleTranslation: firstSentence?.english,
      tags: [item.jlptLevel, item.listCategory, 'bunpro-vocab'],
    })
    syncSRSState()
    if (res.added) {
      toast.success(`Added "${item.word}" to your Anki SRS queue!`)
    } else {
      toast.info(`"${item.word}" is already in your SRS queue!`)
    }
  }

  function handleBatchAddAllFiltered() {
    let added = 0
    for (const item of filteredVocab) {
      const firstSentence = item.sentences[0]
      const res = addCustomSRSCard({
        front: `${item.word}[${item.furigana}]`,
        reading: `${item.furigana} (${item.romaji})`,
        meaning: item.meaning,
        category: 'vocabulary',
        jlptLevel: item.jlptLevel,
        exampleSentence: firstSentence?.japanese,
        exampleTranslation: firstSentence?.english,
        tags: [item.jlptLevel, item.listCategory, 'bunpro-vocab'],
      })
      if (res.added) added++
    }
    syncSRSState()
    toast.success(
      `Batch added ${added} new words from this list into your SRS queue!`
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Batch Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Curated Vocab Lists (単)
          </h2>
          <p className="text-sm text-muted-foreground">
            Quickly find which words you still need to learn with context-driven example sentences and pitch accents.
          </p>
        </div>
        <Button size="sm" onClick={handleBatchAddAllFiltered}>
          <Layers className="h-4 w-4 mr-1.5" /> Add All ({filteredVocab.length}) to SRS
        </Button>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search word, kana, romaji, or English meaning..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex rounded-lg bg-muted p-1 text-xs">
              {(
                [
                  { id: 'all', label: 'All Words' },
                  { id: 'need-to-learn', label: 'Still Need to Learn' },
                  { id: 'in-srs', label: 'In SRS Queue ✓' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                    statusFilter === st.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Curated Deck & JLPT Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap gap-1.5">
              {LIST_CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1">
              {JLPT_FILTERS.map((lvl) => (
                <Button
                  key={lvl}
                  size="sm"
                  variant={selectedLevel === lvl ? 'secondary' : 'ghost'}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setSelectedLevel(lvl)}
                >
                  {lvl}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vocab Cards List */}
      <div className="grid gap-4">
        {filteredVocab.map((item) => {
          const inSRS = srsFronts.has(item.word)
          return (
            <Card
              key={item.id}
              className="hover:border-primary/40 transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <CardTitle className="text-2xl font-bold">
                      <ruby>
                        {item.word}
                        <rt className="text-xs font-normal text-muted-foreground">
                          {item.furigana}
                        </rt>
                      </ruby>
                    </CardTitle>
                    <span className="text-sm font-medium text-primary">
                      {item.meaning}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {item.partOfSpeech}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      Pitch: {item.pitchAccent}
                    </Badge>
                    <Badge className="text-[10px]">{item.jlptLevel}</Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {item.listCategory}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => speakJapanese(item.word)}
                      title="Listen to word"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={inSRS ? 'secondary' : 'outline'}
                      onClick={() => handleAddWordToSRS(item)}
                    >
                      {inSRS ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-500" />{' '}
                          In SRS
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add to SRS
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  Context-Driven Example Sentences:
                </CardDescription>
                <div className="grid gap-2 sm:grid-cols-2">
                  {item.sentences.map((sent, sIdx) => (
                    <div
                      key={sIdx}
                      className="rounded-lg border bg-muted/30 p-3 text-sm flex items-start justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-foreground leading-relaxed">
                          {renderAnkiText(sent.japanese)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sent.english}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => speakJapanese(sent.japanese)}
                        className="text-muted-foreground hover:text-primary shrink-0 mt-0.5"
                        title="Play example sentence"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
