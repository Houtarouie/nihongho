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
import {
  Search,
  Volume2,
  Plus,
  CheckCircle2,
  Layers,
  Download,
  Flame,
} from 'lucide-react'
import { BUNPRO_VOCAB_ITEMS, type BunproVocabItem } from '@/data/bunpro-vocab'
import {
  CONVERSATION_SCENARIOS,
  ALL_CONVERSATION_WORDS,
  SCENARIO_ICONS,
  type ConversationWord,
  type ConversationScenario,
} from '@/data/conversation-vocab'
import {
  addCustomSRSCard,
  loadSRSCards,
  speakJapanese,
} from '@/data/srs-deck'
import { renderAnkiText } from '@/lib/anki/furigana'
import { toast } from 'sonner'

type VocabCatalogMode = 'conversation' | 'jlpt' | 'all'

const STANDARD_CATEGORIES = [
  'All',
  'JLPT',
  'Essential Core',
  'Textbook (Genki)',
  'Community',
] as const

const JLPT_FILTERS = ['All', 'N5', 'N4', 'N3', 'N2', 'N1'] as const

export function BunproVocabLists() {
  const [catalogMode, setCatalogMode] =
    useState<VocabCatalogMode>('conversation')

  // Conversational state
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<'all' | 'standard' | 'slang'>('all')

  // Standard JLPT state
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedLevel, setSelectedLevel] = useState<string>('All')

  // Common filters
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'need-to-learn' | 'in-srs'
  >('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [srsFronts, setSrsFronts] = useState<Set<string>>(new Set())
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)

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

  function playAudio(text: string, id: string) {
    setPlayingAudioId(id)
    speakJapanese(text, {
      onEnd: () => setPlayingAudioId(null),
      onError: () => setPlayingAudioId(null),
    })
    setTimeout(() => {
      setPlayingAudioId((curr) => (curr === id ? null : curr))
    }, 4500)
  }

  // Active scenario object
  const activeScenario = useMemo(() => {
    if (selectedScenarioId === 'all') return null
    return (
      CONVERSATION_SCENARIOS.find((s) => s.id === selectedScenarioId) || null
    )
  }, [selectedScenarioId])

  // Filtered Conversational words
  const filteredConversationWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return ALL_CONVERSATION_WORDS.filter((item) => {
      if (selectedScenarioId !== 'all' && item.scenarioId !== selectedScenarioId) {
        return false
      }
      if (tagFilter !== 'all' && item.tag !== tagFilter) {
        return false
      }
      const inSRS = srsFronts.has(item.word)
      if (statusFilter === 'need-to-learn' && inSRS) return false
      if (statusFilter === 'in-srs' && !inSRS) return false

      if (!q) return true
      return (
        item.word.toLowerCase().includes(q) ||
        item.reading.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.example.ja.toLowerCase().includes(q) ||
        item.example.en.toLowerCase().includes(q)
      )
    })
  }, [selectedScenarioId, tagFilter, statusFilter, searchQuery, srsFronts])

  // Filtered Standard JLPT items
  const filteredStandardVocab = useMemo(() => {
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

  // Add individual Conversational word to SRS
  function handleAddConversationWordToSRS(item: ConversationWord) {
    const scenario = CONVERSATION_SCENARIOS.find((s) => s.id === item.scenarioId)
    const res = addCustomSRSCard({
      front: `${item.word}[${item.reading}]`,
      reading: item.reading,
      meaning: item.meaning,
      category: 'vocabulary',
      jlptLevel: item.tag === 'slang' ? 'Slang' : 'Conversation',
      deckName: scenario
        ? `Japanese::Conversation::${scenario.scenario}`
        : 'Japanese::Casual Conversation',
      exampleSentence: item.example.ja,
      exampleTranslation: item.example.en,
      tags: [
        'conversation',
        item.tag,
        item.pos,
        item.scenarioId || 'scenario',
      ].filter(Boolean),
    })
    syncSRSState()
    if (res.added) {
      toast.success(`Added "${item.word}" (${item.reading}) to Anki SRS!`)
    } else {
      toast.info(`"${item.word}" is already in your SRS queue!`)
    }
  }

  // Add individual Standard JLPT word to SRS
  function handleAddStandardWordToSRS(item: BunproVocabItem) {
    const firstSentence = item.sentences[0]
    const res = addCustomSRSCard({
      front: `${item.word}[${item.furigana}]`,
      reading: `${item.furigana} (${item.romaji})`,
      meaning: item.meaning,
      category: 'vocabulary',
      jlptLevel: item.jlptLevel,
      exampleSentence: firstSentence?.japanese,
      exampleTranslation: firstSentence?.english,
      tags: [item.jlptLevel, item.listCategory, 'curated-vocab'],
    })
    syncSRSState()
    if (res.added) {
      toast.success(`Added "${item.word}" to your Anki SRS queue!`)
    } else {
      toast.info(`"${item.word}" is already in your SRS queue!`)
    }
  }

  // Batch add scenario to SRS
  function handleBatchAddScenario(scenario: ConversationScenario) {
    let added = 0
    for (const item of scenario.words) {
      const res = addCustomSRSCard({
        front: `${item.word}[${item.reading}]`,
        reading: item.reading,
        meaning: item.meaning,
        category: 'vocabulary',
        jlptLevel: item.tag === 'slang' ? 'Slang' : 'Conversation',
        deckName: `Japanese::Conversation::${scenario.scenario}`,
        exampleSentence: item.example.ja,
        exampleTranslation: item.example.en,
        tags: ['conversation', item.tag, item.pos, scenario.id],
      })
      if (res.added) added++
    }
    syncSRSState()
    toast.success(
      `Added ${added} words from "${scenario.scenario}" to your Anki SRS queue!`
    )
  }

  // Batch add filtered conversation words to SRS
  function handleBatchAddFilteredConversation() {
    let added = 0
    for (const item of filteredConversationWords) {
      const scenario = CONVERSATION_SCENARIOS.find(
        (s) => s.id === item.scenarioId
      )
      const res = addCustomSRSCard({
        front: `${item.word}[${item.reading}]`,
        reading: item.reading,
        meaning: item.meaning,
        category: 'vocabulary',
        jlptLevel: item.tag === 'slang' ? 'Slang' : 'Conversation',
        deckName: scenario
          ? `Japanese::Conversation::${scenario.scenario}`
          : 'Japanese::Casual Conversation',
        exampleSentence: item.example.ja,
        exampleTranslation: item.example.en,
        tags: [
          'conversation',
          item.tag,
          item.pos,
          item.scenarioId || 'scenario',
        ].filter(Boolean),
      })
      if (res.added) added++
    }
    syncSRSState()
    toast.success(
      `Added ${added} conversational words to your Anki SRS queue!`
    )
  }

  // Batch add filtered standard vocab
  function handleBatchAddFilteredStandard() {
    let added = 0
    for (const item of filteredStandardVocab) {
      const firstSentence = item.sentences[0]
      const res = addCustomSRSCard({
        front: `${item.word}[${item.furigana}]`,
        reading: `${item.furigana} (${item.romaji})`,
        meaning: item.meaning,
        category: 'vocabulary',
        jlptLevel: item.jlptLevel,
        exampleSentence: firstSentence?.japanese,
        exampleTranslation: firstSentence?.english,
        tags: [item.jlptLevel, item.listCategory, 'curated-vocab'],
      })
      if (res.added) added++
    }
    syncSRSState()
    toast.success(`Batch added ${added} new words to your SRS queue!`)
  }

  // Export scenario as Anki TSV
  function handleExportScenarioAnkiTSV(scenario: ConversationScenario) {
    const lines = [
      '#separator:tab',
      '#html:true',
      '#tags column:5',
      '#deck:Japanese::Conversation::' + scenario.scenario,
      ...scenario.words.map((w) => {
        const front = `${w.word}[${w.reading}]`
        const back = w.meaning
        const reading = w.reading
        const sentence = `${w.example.ja}<br><small style="color:#666">${w.example.reading}</small><br><i>${w.example.en}</i>`
        const tags = `conversation ${w.tag} ${w.pos} ${scenario.id}`
        return `${front}\t${back}\t${reading}\t${sentence}\t${tags}`
      }),
    ]
    const blob = new Blob([lines.join('\n')], {
      type: 'text/tab-separated-values;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Anki_${scenario.id}_${scenario.scenario.replace(
      /[^a-zA-Z0-9]/g,
      '_'
    )}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(
      `Exported ${scenario.words.length} cards from "${scenario.scenario}" for Anki!`
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Dual Catalog Switcher */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span>Vocabulary & Daily Conversation (単語)</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Explore 400 real-life conversational words across 20 daily scenarios
            and standard JLPT curriculum with audio playback and 1-click Anki SRS
            sync.
          </p>
        </div>

        {/* Dual Catalog Segmented Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setCatalogMode('conversation')}
            className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
              catalogMode === 'conversation'
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border/60 bg-card hover:border-primary/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">💬</span>
              <div>
                <div className="font-bold text-sm">Daily Conversation</div>
                <div className="text-xs text-muted-foreground">
                  20 Scenarios · Slang & Friends
                </div>
              </div>
            </div>
            <Badge
              variant={catalogMode === 'conversation' ? 'default' : 'secondary'}
              className="text-xs font-semibold"
            >
              400 Words
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setCatalogMode('jlpt')}
            className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
              catalogMode === 'jlpt'
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border/60 bg-card hover:border-primary/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📚</span>
              <div>
                <div className="font-bold text-sm">JLPT & Textbooks</div>
                <div className="text-xs text-muted-foreground">
                  N5–N1 Core & Genki Vocab
                </div>
              </div>
            </div>
            <Badge
              variant={catalogMode === 'jlpt' ? 'default' : 'secondary'}
              className="text-xs font-semibold"
            >
              Standard
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setCatalogMode('all')}
            className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
              catalogMode === 'all'
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border/60 bg-card hover:border-primary/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">✨</span>
              <div>
                <div className="font-bold text-sm">All Vocab Combined</div>
                <div className="text-xs text-muted-foreground">
                  Search across all catalogs
                </div>
              </div>
            </div>
            <Badge
              variant={catalogMode === 'all' ? 'default' : 'secondary'}
              className="text-xs font-semibold"
            >
              425+ Words
            </Badge>
          </button>
        </div>
      </div>

      {/* Mode 1: Conversational Scenarios */}
      {catalogMode === 'conversation' && (
        <div className="space-y-5">
          {/* Scenario Selector Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Choose Scenario ({CONVERSATION_SCENARIOS.length} Topics):</span>
              {selectedScenarioId !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedScenarioId('all')}
                  className="text-primary hover:underline lowercase font-normal"
                >
                  show all scenarios
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <Button
                size="sm"
                variant={selectedScenarioId === 'all' ? 'default' : 'outline'}
                className="h-8 shrink-0 text-xs rounded-full font-medium"
                onClick={() => setSelectedScenarioId('all')}
              >
                🌟 All Topics (400)
              </Button>
              {CONVERSATION_SCENARIOS.map((sc) => {
                const icon = SCENARIO_ICONS[sc.id] || '💬'
                const isSelected = selectedScenarioId === sc.id
                return (
                  <Button
                    key={sc.id}
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    className={`h-8 shrink-0 text-xs rounded-full font-medium transition-all ${
                      isSelected
                        ? 'shadow-sm'
                        : 'hover:border-primary/40 bg-card/60'
                    }`}
                    onClick={() => setSelectedScenarioId(sc.id)}
                  >
                    <span className="mr-1">{icon}</span>
                    <span>{sc.scenario}</span>
                    <span className="ml-1.5 opacity-60 text-[10px]">
                      ({sc.words.length})
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Active Scenario Banner */}
          {activeScenario && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {SCENARIO_ICONS[activeScenario.id] || '💬'}
                    </span>
                    <h3 className="text-lg font-bold">
                      {activeScenario.scenario}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {activeScenario.words.length} Words
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground italic">
                    &ldquo;{activeScenario.situation}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportScenarioAnkiTSV(activeScenario)}
                    className="text-xs"
                    title="Export as Anki Deck .txt format"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Export Anki (.txt)
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBatchAddScenario(activeScenario)}
                    className="text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Entire Topic to SRS
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filter Bar */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search word, reading, English meaning, or example sentences..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex rounded-lg bg-muted p-1 text-xs shrink-0">
                  {(
                    [
                      { id: 'all', label: 'All Words' },
                      { id: 'need-to-learn', label: 'Need to Learn' },
                      { id: 'in-srs', label: 'In SRS ✓' },
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

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground mr-1">
                    Style:
                  </span>
                  {(
                    [
                      { id: 'all', label: 'All Styles' },
                      { id: 'standard', label: 'Standard Japanese' },
                      { id: 'slang', label: '🔥 Slang & Casual' },
                    ] as const
                  ).map((t) => (
                    <Button
                      key={t.id}
                      size="sm"
                      variant={tagFilter === t.id ? 'default' : 'ghost'}
                      className="h-7 text-xs px-2.5"
                      onClick={() => setTagFilter(t.id)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Showing {filteredConversationWords.length} words
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={handleBatchAddFilteredConversation}
                  >
                    <Layers className="h-3.5 w-3.5 mr-1" /> Add All ({filteredConversationWords.length}) to SRS
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversational Cards List */}
          <div className="grid gap-4">
            {filteredConversationWords.map((item) => {
              const inSRS = srsFronts.has(item.word)
              const isWordPlaying = playingAudioId === `word-${item.id}`
              const isExamplePlaying = playingAudioId === `ex-${item.id}`

              return (
                <Card
                  key={item.id}
                  className="hover:border-primary/40 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-baseline gap-2.5">
                        <CardTitle className="text-2xl font-bold flex items-baseline gap-2">
                          <span>{item.word}</span>
                          <span className="text-sm font-normal text-muted-foreground">
                            [{item.reading}]
                          </span>
                        </CardTitle>

                        <span className="text-sm font-semibold text-primary">
                          {item.meaning}
                        </span>

                        <Badge variant="outline" className="text-[10px]">
                          {item.pos}
                        </Badge>

                        {item.tag === 'slang' ? (
                          <Badge className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1 font-semibold">
                            <Flame className="h-3 w-3" /> Slang
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Standard
                          </Badge>
                        )}

                        {item.scenarioTitle && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-muted-foreground hidden md:inline-flex"
                          >
                            {SCENARIO_ICONS[item.scenarioId || ''] || '💬'}{' '}
                            {item.scenarioTitle}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant={isWordPlaying ? 'secondary' : 'ghost'}
                          onClick={() =>
                            playAudio(item.word, `word-${item.id}`)
                          }
                          title="Listen to word"
                          className={isWordPlaying ? 'text-primary' : ''}
                        >
                          <Volume2
                            className={`h-4 w-4 ${
                              isWordPlaying ? 'animate-pulse' : ''
                            }`}
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant={inSRS ? 'secondary' : 'outline'}
                          onClick={() => handleAddConversationWordToSRS(item)}
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

                  <CardContent className="pt-1 pb-3.5">
                    {/* Example Sentence Container */}
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground leading-relaxed">
                          {item.example.ja}
                        </p>
                        <p className="text-xs text-muted-foreground/80 font-mono">
                          {item.example.reading}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium pt-0.5">
                          {item.example.en}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          playAudio(item.example.ja, `ex-${item.id}`)
                        }
                        className={`text-muted-foreground hover:text-primary shrink-0 mt-0.5 p-1 rounded-md hover:bg-muted ${
                          isExamplePlaying ? 'text-primary' : ''
                        }`}
                        title="Play example sentence audio"
                      >
                        <Volume2
                          className={`h-4 w-4 ${
                            isExamplePlaying ? 'animate-pulse' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Mode 2: Standard JLPT & Textbook Lists */}
      {catalogMode === 'jlpt' && (
        <div className="space-y-5">
          {/* Header & Batch Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                JLPT & Textbook Core Curriculum
              </h3>
              <p className="text-sm text-muted-foreground">
                Official level-graded Japanese vocabulary with pitch accent and
                furigana annotations.
              </p>
            </div>
            <Button size="sm" onClick={handleBatchAddFilteredStandard}>
              <Layers className="h-4 w-4 mr-1.5" /> Add All ({filteredStandardVocab.length}) to SRS
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

              {/* Categories & JLPT Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {STANDARD_CATEGORIES.map((cat) => (
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
            {filteredStandardVocab.map((item) => {
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
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-mono"
                        >
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
                          onClick={() => handleAddStandardWordToSRS(item)}
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
      )}

      {/* Mode 3: All Vocab Combined */}
      {catalogMode === 'all' && (
        <div className="space-y-5">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search across all 425+ words (Japanese, Romaji, English)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex rounded-lg bg-muted p-1 text-xs shrink-0">
                  {(
                    [
                      { id: 'all', label: 'All Words' },
                      { id: 'need-to-learn', label: 'Need to Learn' },
                      { id: 'in-srs', label: 'In SRS ✓' },
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
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>
                  Showing {filteredConversationWords.length} conversational +{' '}
                  {filteredStandardVocab.length} standard items
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Render Combined lists */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Conversational Daily Words ({filteredConversationWords.length})
            </h4>
            <div className="grid gap-3">
              {filteredConversationWords.slice(0, 50).map((item) => {
                const inSRS = srsFronts.has(item.word)
                return (
                  <Card key={`all-conv-${item.id}`} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-xl font-bold">{item.word}</span>
                        <span className="text-xs text-muted-foreground">
                          [{item.reading}]
                        </span>
                        <span className="text-sm font-medium text-primary">
                          {item.meaning}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {item.pos}
                        </Badge>
                        {item.tag === 'slang' && (
                          <Badge className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                            Slang
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => speakJapanese(item.word)}
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={inSRS ? 'secondary' : 'outline'}
                          onClick={() => handleAddConversationWordToSRS(item)}
                        >
                          {inSRS ? 'In SRS ✓' : '+ Add'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pt-4">
              Standard JLPT Words ({filteredStandardVocab.length})
            </h4>
            <div className="grid gap-3">
              {filteredStandardVocab.map((item) => {
                const inSRS = srsFronts.has(item.word)
                return (
                  <Card key={`all-std-${item.id}`} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-xl font-bold">{item.word}</span>
                        <span className="text-xs text-muted-foreground">
                          [{item.furigana}]
                        </span>
                        <span className="text-sm font-medium text-primary">
                          {item.meaning}
                        </span>
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
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={inSRS ? 'secondary' : 'outline'}
                          onClick={() => handleAddStandardWordToSRS(item)}
                        >
                          {inSRS ? 'In SRS ✓' : '+ Add'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
