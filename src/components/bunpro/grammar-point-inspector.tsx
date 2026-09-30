'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  AlertTriangle,
  Info,
  CheckCheck,
  FilePlus2,
  Layers,
  Play,
  Pause,
  MoreVertical,
  ExternalLink,
  Clock,
  Eye,
  EyeOff,
  Settings,
  Check,
  Sparkles,
  Swords,
  Maximize2,
  BookOpen,
  Volume2,
  Plus,
} from 'lucide-react'
import {
  getGrammarPointDetail,
  type GrammarPointSummary,
  type GrammarRelationCard,
} from '@/data/bunpro-grammar-details'
import {
  addCustomSRSCard,
  loadSRSCards,
  loadUserStats,
  saveUserStats,
  speakJapanese,
} from '@/data/srs-deck'
import { toast } from 'sonner'

interface GrammarPointInspectorProps {
  item: GrammarPointSummary
  allGrammar: GrammarPointSummary[]
  onSelectGrammar: (target: GrammarPointSummary) => void
  onBack: () => void
  historyTrail: GrammarPointSummary[]
}

const MASTERED_GRAMMAR_KEY = 'nihongo_bunpro_mastered_grammar_v1'
const GRAMMAR_NOTES_KEY = 'nihongo_bunpro_grammar_notes_v1'
const MASTERED_SENTENCES_KEY = 'nihongo_bunpro_mastered_sentences_v1'

export function GrammarPointInspector({
  item,
  allGrammar,
  onSelectGrammar,
  onBack,
  historyTrail,
}: GrammarPointInspectorProps) {
  const detail = getGrammarPointDetail(item)

  // Tabs: Details (full structured page), Examples (focused drill), Resources
  const [activeTab, setActiveTab] = useState<'details' | 'examples' | 'resources'>('details')

  // Mastered & Personal Note states
  const [isMastered, setIsMastered] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [isEditingNote, setIsEditingNote] = useState(false)

  // Relational cards expand state
  const [expandSynonyms, setExpandSynonyms] = useState(false)
  const [expandAntonyms, setExpandAntonyms] = useState(false)
  const [expandRelated, setExpandRelated] = useState(false)

  // Interactive Cram / Nuance Duel Modal state
  const [activeCramGroup, setActiveCramGroup] = useState<{
    title: string
    cards: GrammarRelationCard[]
  } | null>(null)
  const [cramIndex, setCramIndex] = useState(0)
  const [cramSelected, setCramSelected] = useState<string | null>(null)
  const [cramScore, setCramScore] = useState(0)

  // Vocab Coverage states
  const [showVocabList, setShowVocabList] = useState(false)
  const [showVocabQuiz, setShowVocabQuiz] = useState(false)
  const [vocabQuizIdx, setVocabQuizIdx] = useState(0)
  const [vocabQuizPicked, setVocabQuizPicked] = useState<string | null>(null)
  const [vocabQuizScore, setVocabQuizScore] = useState(0)
  const [knownVocabWords, setKnownVocabWords] = useState<Set<string>>(new Set())

  // Examples Player & Interactive Drill states
  const [showSentenceText, setShowSentenceText] = useState(true)
  const [showTranslationText, setShowTranslationText] = useState(true)
  const [clozeDrillMode, setClozeDrillMode] = useState(false)
  const [clozeInputs, setClozeInputs] = useState<Record<string, string>>({})
  const [masteredSentences, setMasteredSentences] = useState<Set<string>>(
    new Set()
  )
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Continuous Audio Player states
  const [isPlayingAll, setIsPlayingAll] = useState(false)
  const [activeExampleIdx, setActiveExampleIdx] = useState<number>(0)
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)

  // Sync local storage states when grammar item changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const masteredRaw = localStorage.getItem(MASTERED_GRAMMAR_KEY)
      const masteredSet: string[] = masteredRaw ? JSON.parse(masteredRaw) : []
      setIsMastered(masteredSet.includes(item.grammar))

      const notesRaw = localStorage.getItem(GRAMMAR_NOTES_KEY)
      const notesMap: Record<string, string> = notesRaw
        ? JSON.parse(notesRaw)
        : {}
      setNoteText(notesMap[item.grammar] || '')
      setIsEditingNote(false)

      const sentRaw = localStorage.getItem(MASTERED_SENTENCES_KEY)
      const sentList: string[] = sentRaw ? JSON.parse(sentRaw) : [
        'desu-ex-1',
        'desu-ex-2',
      ]
      setMasteredSentences(new Set(sentList))

      // Check how many vocab items are already in the user's SRS deck
      const srsCards = loadSRSCards()
      const known = new Set<string>()
      srsCards.forEach((c) => known.add(c.front))
      setKnownVocabWords(known)
    } catch {
      // ignore storage errors
    }
    setActiveCramGroup(null)
    setShowVocabQuiz(false)
    setIsPlayingAll(false)
    setActiveExampleIdx(0)
  }, [item.grammar])

  // Continuous audio playback effect for Examples section
  useEffect(() => {
    if (!isPlayingAll) return
    const examples = detail.allExamples
    if (activeExampleIdx >= examples.length) {
      setIsPlayingAll(false)
      setActiveExampleIdx(0)
      return
    }
    const current = examples[activeExampleIdx]
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(current.plainJapanese)
      u.lang = 'ja-JP'
      u.rate = audioSpeed
      u.onend = () => {
        setActiveExampleIdx((prev) => prev + 1)
      }
      u.onerror = () => {
        setIsPlayingAll(false)
      }
      window.speechSynthesis.speak(u)
    }
    const timer = setTimeout(() => {
      setActiveExampleIdx((prev) => prev + 1)
    }, 3200)
    return () => clearTimeout(timer)
  }, [isPlayingAll, activeExampleIdx, detail.allExamples, audioSpeed])

  function handleToggleMastered() {
    const next = !isMastered
    setIsMastered(next)
    try {
      const raw = localStorage.getItem(MASTERED_GRAMMAR_KEY)
      const list: string[] = raw ? JSON.parse(raw) : []
      const updated = next
        ? Array.from(new Set([...list, item.grammar]))
        : list.filter((g) => g !== item.grammar)
      localStorage.setItem(MASTERED_GRAMMAR_KEY, JSON.stringify(updated))

      if (next) {
        const stats = loadUserStats()
        stats.xp += 25
        stats.grammarCount = Math.max(stats.grammarCount, updated.length)
        saveUserStats(stats)
        toast.success(`Marked "${detail.displayTitle}" as Mastered! (+25 XP)`)
      } else {
        toast.info(`Removed Mastered status from "${detail.displayTitle}"`)
      }
    } catch {
      // ignore
    }
  }

  function handleSaveNote() {
    try {
      const raw = localStorage.getItem(GRAMMAR_NOTES_KEY)
      const map: Record<string, string> = raw ? JSON.parse(raw) : {}
      map[item.grammar] = noteText.trim()
      localStorage.setItem(GRAMMAR_NOTES_KEY, JSON.stringify(map))
      setIsEditingNote(false)
      toast.success('Saved personal grammar note!')
    } catch {
      // ignore
    }
  }

  function handleAddGrammarToDeck() {
    const firstEx = detail.aboutExamples[0]
    const res = addCustomSRSCard({
      front: detail.displayTitle,
      reading: detail.reading || detail.displayTitle,
      meaning: `${detail.meaning} (${detail.structures.join(' / ')})`,
      category: 'grammar',
      jlptLevel: detail.level,
      exampleSentence: firstEx
        ? `${firstEx.plainJapanese} — ${firstEx.plainEnglish}`
        : undefined,
    })
    if (res.added) {
      toast.success(`Added "${detail.displayTitle}" to your Anki SRS Deck!`)
    } else {
      toast.info(`"${detail.displayTitle}" is already in your Anki SRS Deck!`)
    }
  }

  function handleJumpToRelation(rel: GrammarRelationCard) {
    const cleanRel = rel.grammar.replace(/^〜/, '')
    const found =
      allGrammar.find((g) => g.grammar === rel.grammar) ||
      allGrammar.find((g) => g.grammar.split(' ')[0] === rel.grammar) ||
      allGrammar.find((g) => g.grammar.includes(cleanRel))

    if (found) {
      onSelectGrammar(found)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Synthesize a GrammarPointSummary so even external/supplemental points open seamlessly
      onSelectGrammar({
        grammar: rel.grammar,
        meaning: rel.meaning,
        level: rel.level,
        lesson: `${rel.level} Grammar – ${rel.badgeTag || 'Related Structure'}`,
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleStartCram(title: string, cards: GrammarRelationCard[]) {
    // Include current grammar point + the relation cards so the user compares them directly!
    const currentAsRel: GrammarRelationCard = {
      grammar: detail.displayTitle,
      meaning: detail.meaning,
      level: detail.level,
      comparisonText: detail.cautionBanner,
      registerTag:
        detail.metadata.register === 'Polite'
          ? 'Polite'
          : detail.metadata.register === 'Casual'
            ? 'Casual'
            : 'Neutral',
    }
    const pool = [currentAsRel, ...cards]
    setActiveCramGroup({ title, cards: pool })
    setCramIndex(0)
    setCramSelected(null)
    setCramScore(0)
  }

  function handleToggleSentenceMastered(id: string) {
    setMasteredSentences((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      try {
        localStorage.setItem(
          MASTERED_SENTENCES_KEY,
          JSON.stringify(Array.from(next))
        )
      } catch {
        // ignore
      }
      return next
    })
  }

  function handleCheckCloze(exId: string, expected: string) {
    const val = (clozeInputs[exId] || '').trim()
    if (val === expected) {
      toast.success(`Correct! 「${expected}」 locked in! (+10 XP)`)
      if (!masteredSentences.has(exId)) {
        handleToggleSentenceMastered(exId)
      }
    } else {
      toast.error(`Expected 「${expected}」 — try typing ${expected}!`)
    }
  }

  const coveredVocabCount = detail.vocabItems.filter((v) =>
    knownVocabWords.has(v.word)
  ).length
  const totalVocabCount = detail.vocabItems.length
  const vocabCoveragePct =
    totalVocabCount > 0
      ? Math.round((coveredVocabCount / totalVocabCount) * 100)
      : 0

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Navigation & Breadcrumb Trail */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            All Grammar
          </Button>
          {historyTrail.length > 1 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
              <span>History:</span>
              {historyTrail.slice(-4).map((h, i) => (
                <React.Fragment key={`${h.grammar}-${i}`}>
                  {i > 0 && <span>&rarr;</span>}
                  <button
                    type="button"
                    onClick={() => onSelectGrammar(h)}
                    className={`px-1.5 py-0.5 rounded hover:bg-muted ${
                      h.grammar === item.grammar
                        ? 'font-bold text-[#e15b64] bg-[#e15b64]/10'
                        : ''
                    }`}
                  >
                    {h.grammar.split(' ')[0]}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-[#e15b64] hover:bg-[#d04a53] text-white">
            {detail.level} Grammar
          </Badge>
          <Badge variant="outline" className="text-xs">
            {detail.lesson.split(' – ')[0]}
          </Badge>
        </div>
      </div>

      {/* Centered Grammar Point Hero Header + Caution Banner (Screenshot 1) */}
      <div className="text-center space-y-2 py-2">
        <div className="inline-flex items-center gap-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            {detail.displayTitle}
          </h1>
          <button
            type="button"
            onClick={() => speakJapanese(detail.displayTitle)}
            className="h-9 w-9 rounded-full bg-[#e15b64]/15 text-[#e15b64] hover:bg-[#e15b64] hover:text-white flex items-center justify-center transition-colors"
            title="Listen to pronunciation"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>

        <p className="text-lg sm:text-xl font-medium text-muted-foreground">
          {detail.meaning}
        </p>

        {/* Amber Caution / Key Nuance Line (Screenshot 1 exact match) */}
        <div className="pt-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0 fill-amber-500/20" />
          <span>{detail.cautionBanner}</span>
        </div>
      </div>

      {/* 3-Tab Navigation Bar: Details | Examples | Resources (Screenshot 1) */}
      <div className="border-b flex justify-center">
        <div className="grid grid-cols-3 w-full max-w-xl text-sm font-semibold">
          {(['details', 'examples', 'resources'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 px-4 capitalize transition-all border-t-2 border-x rounded-t-md -mb-px ${
                activeTab === tab
                  ? 'bg-background text-foreground border-border border-t-[#e15b64] font-bold shadow-sm'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Cram / Spot-the-Difference Nuance Duel Banner (when triggered) */}
      {activeCramGroup && (
        <Card className="border-2 border-[#e15b64] bg-[#e15b64]/5 shadow-lg animate-in fade-in duration-200">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-[#e15b64]" />
                <div>
                  <h3 className="font-bold text-base">
                    {activeCramGroup.title} — Spot the Nuance Duel!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Question {cramIndex + 1} of {activeCramGroup.cards.length} ·
                    Score: {cramScore}/{activeCramGroup.cards.length}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActiveCramGroup(null)}
              >
                Close
              </Button>
            </div>

            {(() => {
              const targetCard =
                activeCramGroup.cards[
                  cramIndex % activeCramGroup.cards.length
                ]
              return (
                <div className="space-y-4">
                  <div className="rounded-lg bg-background p-4 border space-y-1.5">
                    <Badge variant="outline" className="text-[11px]">
                      Target Register: {targetCard.registerTag} ({targetCard.level})
                    </Badge>
                    <p className="text-sm font-medium">
                      Which grammar structure fits this exact nuance and register?
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      &ldquo;{targetCard.comparisonText}&rdquo;
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeCramGroup.cards.map((opt) => {
                      const isPicked = cramSelected === opt.grammar
                      const isRight = opt.grammar === targetCard.grammar
                      let cls =
                        'border bg-background hover:border-[#e15b64]/60 text-left p-3 rounded-lg transition-all'
                      if (cramSelected) {
                        if (isRight) {
                          cls =
                            'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-semibold p-3 rounded-lg text-left'
                        } else if (isPicked) {
                          cls =
                            'border-red-500 bg-red-500/10 text-red-800 dark:text-red-200 p-3 rounded-lg text-left'
                        }
                      }
                      return (
                        <button
                          key={opt.grammar}
                          type="button"
                          disabled={Boolean(cramSelected)}
                          onClick={() => {
                            setCramSelected(opt.grammar)
                            if (opt.grammar === targetCard.grammar) {
                              setCramScore((s) => s + 1)
                              speakJapanese(opt.grammar)
                              toast.success('Spot on! +15 XP')
                            } else {
                              toast.error(
                                `Not quite — ${targetCard.grammar} is ${targetCard.registerTag} (${targetCard.level}).`
                              )
                            }
                          }}
                          className={cls}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold">
                              {opt.grammar}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                              {opt.level} · {opt.registerTag}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {opt.meaning}
                          </p>
                        </button>
                      )
                    })}
                  </div>

                  {cramSelected && (
                    <div className="flex justify-end">
                      {cramIndex + 1 < activeCramGroup.cards.length ? (
                        <Button
                          size="sm"
                          className="bg-[#e15b64] hover:bg-[#d04a53] text-white"
                          onClick={() => {
                            setCramIndex((i) => i + 1)
                            setCramSelected(null)
                          }}
                        >
                          Next Nuance Question &rarr;
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            toast.success(
                              `Finished Nuance Cram! Score: ${cramScore}/${activeCramGroup.cards.length}`
                            )
                            setActiveCramGroup(null)
                          }}
                        >
                          Finish Cram Session ✓
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* MAIN 2-COLUMN BUNPRO LAYOUT (Screenshot 1) */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 8 COLUMNS: Structure, Details, About, Topics, Synonyms, Antonyms, Related, Vocab, Examples */}
          <div className="lg:col-span-8 space-y-6">
            {/* Top 2-Card Row: Structure & Details (Screenshot 1 exact match) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Structure Card */}
              <Card className="shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-bold">Structure</h2>
                    <span
                      title="How this grammar point attaches to preceding words"
                      className="text-muted-foreground cursor-help"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm font-medium">
                    {detail.structures.map((st, i) => {
                      const parts = st.split(detail.displayTitle)
                      return (
                        <div key={i} className="leading-relaxed">
                          {parts.length > 1 ? (
                            <>
                              <span>{parts[0]}</span>
                              <span className="text-[#e15b64] font-bold">
                                {detail.displayTitle}
                              </span>
                              <span>{parts.slice(1).join(detail.displayTitle)}</span>
                            </>
                          ) : (
                            <span>{st}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Details Metadata Card */}
              <Card className="shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <h2 className="text-base font-bold">Details</h2>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div
                        className="flex items-center gap-1 text-muted-foreground cursor-help"
                        title={detail.metadata.partOfSpeechTooltip}
                      >
                        <span>Part of Speech</span>
                        <Info className="h-3 w-3" />
                      </div>
                      <p className="font-semibold text-sm text-foreground mt-0.5">
                        {detail.metadata.partOfSpeech}
                      </p>
                    </div>

                    <div>
                      <div
                        className="flex items-center gap-1 text-muted-foreground cursor-help"
                        title={detail.metadata.wordTypeTooltip}
                      >
                        <span>Word Type</span>
                        <Info className="h-3 w-3" />
                      </div>
                      <p className="font-semibold text-sm text-foreground mt-0.5">
                        {detail.metadata.wordType}
                      </p>
                    </div>

                    <div className="col-span-2 pt-1">
                      <div
                        className="flex items-center gap-1 text-muted-foreground cursor-help"
                        title={detail.metadata.registerTooltip}
                      >
                        <span>Register</span>
                        <Info className="h-3 w-3" />
                      </div>
                      <p className="font-semibold text-sm text-foreground mt-0.5">
                        {detail.metadata.register}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* About [Grammar Point] Card with Inline Highlighted Sentences (Screenshot 1) */}
            <Card className="shadow-sm">
              <CardContent className="p-6 space-y-5">
                <h2 className="text-base font-bold">
                  About {detail.displayTitle}
                </h2>

                <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
                  {detail.aboutParagraphs.map((para, idx) => (
                    <p key={idx}>
                      {para.split(/(です|だ|い-Adjectives|な-Adjectives|auxiliary verb)/g).map((chunk, cIdx) => {
                        if (chunk === 'です' || chunk === 'だ' || chunk === detail.displayTitle) {
                          return (
                            <span
                              key={cIdx}
                              className="text-[#e15b64] font-semibold"
                            >
                              {chunk}
                            </span>
                          )
                        }
                        if (chunk === 'auxiliary verb') {
                          return (
                            <span
                              key={cIdx}
                              title={detail.metadata.partOfSpeechTooltip}
                              className="underline decoration-dotted cursor-help font-medium"
                            >
                              {chunk}
                            </span>
                          )
                        }
                        return <React.Fragment key={cIdx}>{chunk}</React.Fragment>
                      })}
                    </p>
                  ))}
                </div>

                {/* Core Example Cards inside About (Screenshot 1 exact style) */}
                <div className="space-y-3 pt-2">
                  {detail.aboutExamples.map((ex) => (
                    <div
                      key={ex.id}
                      className="relative flex items-center justify-between gap-3 rounded-lg bg-muted/40 hover:bg-muted/70 border border-border/60 px-4 py-4 transition-colors"
                    >
                      {/* Coral Play Button */}
                      <button
                        type="button"
                        onClick={() => speakJapanese(ex.plainJapanese)}
                        className="h-7 w-7 rounded-full bg-[#e15b64] hover:bg-[#d04a53] text-white flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95"
                        title="Play sentence audio"
                      >
                        <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                      </button>

                      {/* Centered Japanese + English */}
                      <div className="flex-1 text-center space-y-1">
                        <div
                          className="text-lg sm:text-xl font-medium tracking-wide [&_rt]:text-[10px] [&_rt]:text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: ex.japaneseHtml }}
                        />
                        <div
                          className="text-xs sm:text-sm text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: ex.englishHtml }}
                        />
                      </div>

                      {/* 3-Dot Action Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(openMenuId === ex.id ? null : ex.id)
                          }
                          className="h-7 w-7 rounded hover:bg-background flex items-center justify-center text-muted-foreground hover:text-foreground"
                          title="Sentence options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenuId === ex.id && (
                          <div className="absolute right-0 top-8 z-30 w-48 rounded-lg border bg-popover p-1.5 shadow-lg text-xs space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                const res = addCustomSRSCard({
                                  front: ex.plainJapanese,
                                  reading: detail.displayTitle,
                                  meaning: ex.plainEnglish,
                                  category: 'grammar',
                                  jlptLevel: detail.level,
                                  exampleSentence: ex.plainJapanese,
                                })
                                if (res.added) {
                                  toast.success('Sentence added to Anki SRS!')
                                } else {
                                  toast.info('Sentence already in Anki SRS!')
                                }
                                setOpenMenuId(null)
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-muted flex items-center gap-2"
                            >
                              <Plus className="h-3.5 w-3.5 text-[#e15b64]" />
                              Add Sentence to SRS
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setClozeDrillMode(true)
                                setOpenMenuId(null)
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-muted flex items-center gap-2"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                              Practice Cloze Fill-In
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* TOPICS, SYNONYMS, ANTONYMS, RELATED (Screenshots 2 & 3 exact layout) */}
            <Card className="shadow-sm">
              <CardContent className="p-6 space-y-6">
                {/* Topics Section */}
                <div className="space-y-3">
                  <h2 className="text-base font-bold">Topics</h2>
                  <div className="rounded-lg border overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 flex items-center gap-3 border-b">
                      <div className="h-9 w-9 rounded-lg bg-[#e15b64] text-white flex items-center justify-center font-bold text-lg shrink-0">
                        ⛩
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base">
                          {detail.topicCard.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {detail.topicCard.subtitle}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 space-y-3 bg-background">
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {detail.topicCard.description}
                      </p>
                      <div className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{detail.topicCard.readTime}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Synonyms Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold">Synonyms</h2>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2.5"
                        onClick={() => setExpandSynonyms((v) => !v)}
                      >
                        {expandSynonyms ? 'Collapse' : 'Expand All'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2.5 border-[#e15b64] text-[#e15b64] hover:bg-[#e15b64] hover:text-white gap-1"
                        onClick={() =>
                          handleStartCram('Synonyms Nuance Cram', detail.synonyms)
                        }
                      >
                        <Clock className="h-3 w-3" />
                        Cram!
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detail.synonyms.map((syn, idx) => (
                      <div
                        key={syn.grammar}
                        className={`rounded-lg border p-4 space-y-2.5 transition-all ${
                          idx === 1
                            ? 'border-[#e15b64]/70 bg-[#e15b64]/[0.03]'
                            : 'bg-muted/30 hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-base text-[#e15b64]">
                                {syn.grammar}
                              </span>
                              {syn.reading && syn.reading !== syn.grammar && (
                                <span className="text-xs text-muted-foreground">
                                  {syn.reading}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-medium text-muted-foreground">
                              {syn.meaning}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleJumpToRelation(syn)}
                            className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground shrink-0"
                            title={`Inspect ${syn.grammar}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap pb-2 border-b">
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold">
                            <span className="bg-[#e15b64] text-white px-1 rounded-[2px]">
                              文
                            </span>
                            {syn.level} Grammar
                          </span>
                          {syn.badgeTag && (
                            <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              📖 {syn.badgeTag}
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-xs text-muted-foreground leading-relaxed ${
                            expandSynonyms ? '' : 'line-clamp-2'
                          }`}
                        >
                          {syn.comparisonText}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-border" />

                {/* Antonyms Section */}
                {detail.antonyms.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold">Antonyms</h2>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5"
                            onClick={() => setExpandAntonyms((v) => !v)}
                          >
                            {expandAntonyms ? 'Collapse' : 'Expand All'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5 border-[#e15b64] text-[#e15b64] hover:bg-[#e15b64] hover:text-white gap-1"
                            onClick={() =>
                              handleStartCram(
                                'Antonyms Contrast Cram',
                                detail.antonyms
                              )
                            }
                          >
                            <Clock className="h-3 w-3" />
                            Cram!
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {detail.antonyms.map((ant) => (
                          <div
                            key={ant.grammar}
                            className="rounded-lg border bg-muted/30 hover:border-primary/40 p-4 space-y-2.5 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-bold text-base">
                                  {ant.grammar}
                                </span>
                                <p className="text-xs font-medium text-muted-foreground">
                                  {ant.meaning}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleJumpToRelation(ant)}
                                className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground shrink-0"
                                title={`Inspect ${ant.grammar}`}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 pb-2 border-b">
                              <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold">
                                <span className="bg-[#e15b64] text-white px-1 rounded-[2px]">
                                  文
                                </span>
                                {ant.level} Grammar
                              </span>
                            </div>

                            <p
                              className={`text-xs text-muted-foreground leading-relaxed ${
                                expandAntonyms ? '' : 'line-clamp-2'
                              }`}
                            >
                              {ant.comparisonText}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <hr className="border-border" />
                  </>
                )}

                {/* Related Section (Screenshot 3) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold">Related</h2>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2.5"
                        onClick={() => setExpandRelated((v) => !v)}
                      >
                        {expandRelated ? 'Collapse' : 'Expand All'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2.5 border-[#e15b64] text-[#e15b64] hover:bg-[#e15b64] hover:text-white gap-1"
                        onClick={() =>
                          handleStartCram('Related Grammar Cram', detail.related)
                        }
                      >
                        <Clock className="h-3 w-3" />
                        Cram!
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detail.related.map((rel) => (
                      <div
                        key={rel.grammar}
                        className="rounded-lg border bg-muted/30 hover:border-primary/40 p-4 space-y-2.5 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-base">
                                {rel.grammar}
                              </span>
                              {rel.reading && rel.reading !== rel.grammar && (
                                <span className="text-xs text-muted-foreground">
                                  {rel.reading}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-medium text-muted-foreground">
                              {rel.meaning}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleJumpToRelation(rel)}
                            className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground shrink-0"
                            title={`Inspect ${rel.grammar}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 pb-2 border-b">
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold">
                            <span className="bg-[#e15b64] text-white px-1 rounded-[2px]">
                              文
                            </span>
                            {rel.level} Grammar
                          </span>
                        </div>

                        <p
                          className={`text-xs text-muted-foreground leading-relaxed ${
                            expandRelated ? '' : 'line-clamp-2'
                          }`}
                        >
                          {rel.comparisonText}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* VOCAB COVERAGE CARD (Screenshot 3 exact match) */}
            <Card className="shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold">Vocab Coverage</h2>
                    <p className="text-xs text-muted-foreground">
                      You&apos;ve covered {vocabCoveragePct}% of this item&apos;s
                      Vocab
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => setShowVocabList((v) => !v)}
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      {showVocabList ? 'Hide List' : 'Expand List'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs border-[#e15b64] text-[#e15b64] hover:bg-[#e15b64] hover:text-white"
                      onClick={() => {
                        setShowVocabQuiz((v) => !v)
                        setVocabQuizIdx(0)
                        setVocabQuizPicked(null)
                        setVocabQuizScore(0)
                      }}
                    >
                      Knowledge Check
                    </Button>
                  </div>
                </div>

                {/* Progress Bar + X/17 Counter */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-[#e15b64] transition-all duration-300"
                      style={{ width: `${vocabCoveragePct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">
                    {coveredVocabCount}/{totalVocabCount}
                  </span>
                </div>

                {/* Expanded Component Vocab List */}
                {showVocabList && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t">
                    {detail.vocabItems.map((v) => {
                      const isKnown = knownVocabWords.has(v.word)
                      return (
                        <div
                          key={v.word}
                          className="flex items-center justify-between rounded-md border px-3 py-2 text-xs bg-muted/20"
                        >
                          <div>
                            <button
                              type="button"
                              onClick={() => speakJapanese(v.word)}
                              className="font-bold text-sm hover:text-[#e15b64] mr-1.5"
                            >
                              {v.word}
                            </button>
                            <span className="text-muted-foreground">
                              ({v.reading}) — {v.meaning}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant={isKnown ? 'secondary' : 'outline'}
                            className="h-6 px-2 text-[11px]"
                            onClick={() => {
                              addCustomSRSCard({
                                front: v.word,
                                reading: v.reading,
                                meaning: v.meaning,
                                category: 'vocabulary',
                                jlptLevel: v.level,
                              })
                              setKnownVocabWords((prev) => {
                                const next = new Set(prev)
                                next.add(v.word)
                                return next
                              })
                              toast.success(`Marked "${v.word}" as covered & added to SRS!`)
                            }}
                          >
                            {isKnown ? '✓ Covered' : '+ Cover'}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Interactive Vocab Knowledge Check Mini-Quiz */}
                {showVocabQuiz && detail.vocabItems.length >= 4 && (
                  <div className="rounded-lg border-2 border-[#e15b64]/50 bg-[#e15b64]/5 p-4 space-y-3">
                    {(() => {
                      const targetV =
                        detail.vocabItems[
                          vocabQuizIdx % detail.vocabItems.length
                        ]
                      const distractors = detail.vocabItems
                        .filter((x) => x.word !== targetV.word)
                        .slice(0, 3)
                      const options = [targetV, ...distractors].sort((a, b) =>
                        a.word.localeCompare(b.word)
                      )

                      return (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#e15b64]">
                              Vocab Knowledge Check ({vocabQuizIdx + 1}/
                              {Math.min(5, detail.vocabItems.length)})
                            </span>
                            <span className="text-muted-foreground">
                              Score: {vocabQuizScore}
                            </span>
                          </div>
                          <p className="text-sm font-bold">
                            What is the meaning of 「{targetV.word}」 (
                            {targetV.reading})?
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {options.map((opt) => {
                              const picked = vocabQuizPicked === opt.word
                              const right = opt.word === targetV.word
                              return (
                                <button
                                  key={opt.word}
                                  type="button"
                                  disabled={Boolean(vocabQuizPicked)}
                                  onClick={() => {
                                    setVocabQuizPicked(opt.word)
                                    if (right) {
                                      setVocabQuizScore((s) => s + 1)
                                      setKnownVocabWords((prev) => {
                                        const next = new Set(prev)
                                        next.add(targetV.word)
                                        return next
                                      })
                                      speakJapanese(targetV.word)
                                    }
                                  }}
                                  className={`p-2 rounded border text-xs text-left transition-all ${
                                    vocabQuizPicked
                                      ? right
                                        ? 'border-emerald-500 bg-emerald-500/15 font-bold'
                                        : picked
                                          ? 'border-red-500 bg-red-500/15'
                                          : 'opacity-60'
                                      : 'bg-background hover:border-[#e15b64]'
                                  }`}
                                >
                                  {opt.meaning}
                                </button>
                              )
                            })}
                          </div>
                          {vocabQuizPicked && (
                            <div className="flex justify-end">
                              {vocabQuizIdx + 1 <
                              Math.min(5, detail.vocabItems.length) ? (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-[#e15b64] text-white"
                                  onClick={() => {
                                    setVocabQuizIdx((i) => i + 1)
                                    setVocabQuizPicked(null)
                                  }}
                                >
                                  Next Word &rarr;
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    toast.success(
                                      `Vocab Knowledge Check complete! (${vocabQuizScore}/${Math.min(5, detail.vocabItems.length)})`
                                    )
                                    setShowVocabQuiz(false)
                                  }}
                                >
                                  Done ✓
                                </Button>
                              )}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* EXAMPLES PLAYER & INTERACTIVE DRILL SECTION (Screenshot 3 exact match) */}
            <Card className="shadow-sm">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-base font-bold">Examples</h2>
                  <Button
                    size="sm"
                    variant={clozeDrillMode ? 'default' : 'outline'}
                    onClick={() => setClozeDrillMode((v) => !v)}
                    className={`h-8 text-xs gap-1.5 ${
                      clozeDrillMode ? 'bg-[#e15b64] hover:bg-[#d04a53] text-white' : ''
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {clozeDrillMode
                      ? 'Exit Cloze Drill'
                      : '⚡ Try Cloze Drill Right Now'}
                  </Button>
                </div>

                {/* Audio Scrubber + Sentence / Translation Visibility Toggles (Screenshot 3) */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[220px] flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isPlayingAll) {
                          setIsPlayingAll(false)
                          if (
                            typeof window !== 'undefined' &&
                            'speechSynthesis' in window
                          ) {
                            window.speechSynthesis.cancel()
                          }
                        } else {
                          setIsPlayingAll(true)
                        }
                      }}
                      className="h-8 w-8 rounded-full flex items-center justify-center text-foreground hover:bg-muted shrink-0"
                      title={isPlayingAll ? 'Pause all' : 'Play all examples'}
                    >
                      {isPlayingAll ? (
                        <Pause className="h-4 w-4 fill-current" />
                      ) : (
                        <Play className="h-4 w-4 fill-current" />
                      )}
                    </button>

                    {/* Coral Scrubber Track */}
                    <div className="relative flex-1 h-2 rounded-full bg-muted flex items-center">
                      <div
                        className="h-full rounded-full bg-[#e15b64] transition-all"
                        style={{
                          width: `${
                            ((activeExampleIdx + 1) /
                              detail.allExamples.length) *
                            100
                          }%`,
                        }}
                      />
                      <div
                        className="absolute h-4 w-4 rounded-full bg-[#e15b64] shadow border-2 border-white -translate-x-1/2 transition-all"
                        style={{
                          left: `${
                            ((activeExampleIdx + 0.2) /
                              detail.allExamples.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>

                    <span className="text-xs font-mono text-muted-foreground">
                      00:0{(activeExampleIdx + 1) * 2}
                    </span>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowSpeedMenu((v) => !v)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        title="Audio speed"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      {showSpeedMenu && (
                        <div className="absolute right-0 top-7 z-20 rounded border bg-popover p-1 shadow text-xs">
                          {[0.75, 1.0, 1.25].map((sp) => (
                            <button
                              key={sp}
                              type="button"
                              onClick={() => {
                                setAudioSpeed(sp)
                                setShowSpeedMenu(false)
                              }}
                              className={`block w-full px-2 py-1 text-left rounded ${
                                audioSpeed === sp
                                  ? 'bg-[#e15b64] text-white font-bold'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {sp}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sentence & Translation Toggle Buttons (Screenshot 3 exact match) */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowSentenceText((v) => !v)}
                      className="h-8 text-xs gap-1.5"
                    >
                      {showSentenceText ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      Sentence
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowTranslationText((v) => !v)}
                      className="h-8 text-xs gap-1.5"
                    >
                      {showTranslationText ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      Translation
                    </Button>
                  </div>
                </div>

                {/* Example Cards List (Screenshot 3 style with active coral border & bottom-right green check) */}
                <div className="space-y-3">
                  {detail.allExamples.map((ex, idx) => {
                    const isCurrent = idx === activeExampleIdx
                    const isDone = masteredSentences.has(ex.id)

                    return (
                      <div
                        key={ex.id}
                        onClick={() => setActiveExampleIdx(idx)}
                        className={`relative overflow-hidden flex items-center justify-between gap-3 rounded-lg border px-4 py-5 transition-all cursor-pointer ${
                          isCurrent
                            ? 'border-[#e15b64] bg-muted/30 shadow-sm'
                            : 'border-border/60 bg-muted/20 hover:bg-muted/40'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveExampleIdx(idx)
                            speakJapanese(ex.plainJapanese)
                          }}
                          className="h-7 w-7 rounded-full bg-[#e15b64] hover:bg-[#d04a53] text-white flex items-center justify-center shrink-0 shadow-sm"
                        >
                          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                        </button>

                        <div className="flex-1 text-center space-y-1.5">
                          {clozeDrillMode ? (
                            <div
                              className="flex flex-wrap items-center justify-center gap-2 text-base sm:text-lg font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>{ex.clozePrompt.split('____')[0]}</span>
                              <Input
                                value={clozeInputs[ex.id] || ''}
                                onChange={(e) =>
                                  setClozeInputs((prev) => ({
                                    ...prev,
                                    [ex.id]: e.target.value,
                                  }))
                                }
                                placeholder={ex.clozeHint}
                                className="w-28 h-8 text-center font-bold border-[#e15b64]"
                              />
                              <span>{ex.clozePrompt.split('____')[1]}</span>
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-[#e15b64] text-white"
                                onClick={() =>
                                  handleCheckCloze(ex.id, ex.clozeAnswer)
                                }
                              >
                                Check
                              </Button>
                            </div>
                          ) : (
                            <div
                              className={`text-lg sm:text-xl font-medium tracking-wide transition-all [&_rt]:text-[10px] [&_rt]:text-muted-foreground ${
                                showSentenceText
                                  ? ''
                                  : 'blur-sm hover:blur-none select-none'
                              }`}
                              dangerouslySetInnerHTML={{
                                __html: ex.japaneseHtml,
                              }}
                            />
                          )}

                          <div
                            className={`text-xs sm:text-sm text-muted-foreground transition-all ${
                              showTranslationText
                                ? ''
                                : 'blur-sm hover:blur-none select-none'
                            }`}
                            dangerouslySetInnerHTML={{ __html: ex.englishHtml }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            const res = addCustomSRSCard({
                              front: ex.plainJapanese,
                              reading: detail.displayTitle,
                              meaning: ex.plainEnglish,
                              category: 'grammar',
                              jlptLevel: detail.level,
                              exampleSentence: ex.plainJapanese,
                            })
                            if (res.added) {
                              toast.success('Added example sentence to SRS!')
                            } else {
                              toast.info('Already in SRS deck!')
                            }
                          }}
                          className="h-7 w-7 rounded hover:bg-background flex items-center justify-center text-muted-foreground"
                          title="Add sentence to SRS"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {/* Bottom-right green checkmark badge (Screenshot 3 exact match) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleSentenceMastered(ex.id)
                          }}
                          title="Toggle sentence mastered"
                          className={`absolute bottom-0 right-0 px-2.5 py-0.5 rounded-tl-md text-[10px] flex items-center justify-center transition-colors ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : 'bg-muted text-muted-foreground hover:bg-emerald-500/10'
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT 4 COLUMNS: Action Buttons & Personal Note (Screenshot 1 exact match) */}
          <div className="lg:col-span-4 space-y-3 lg:sticky lg:top-16">
            <button
              type="button"
              onClick={handleToggleMastered}
              className={`w-full rounded-md border px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                isMastered
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'border-[#e15b64]/70 text-[#e15b64] hover:bg-[#e15b64]/10 bg-background'
              }`}
            >
              <CheckCheck className="h-4 w-4" />
              {isMastered ? 'Mastered ✓' : 'Mark as Mastered'}
            </button>

            <button
              type="button"
              onClick={() => setIsEditingNote((v) => !v)}
              className="w-full rounded-md border border-[#e15b64]/70 text-[#e15b64] hover:bg-[#e15b64]/10 bg-background px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <FilePlus2 className="h-4 w-4" />
              {noteText ? 'Edit Personal Note' : 'Add Note'}
            </button>

            <button
              type="button"
              onClick={handleAddGrammarToDeck}
              className="w-full rounded-md border border-[#e15b64]/70 text-[#e15b64] hover:bg-[#e15b64]/10 bg-background px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Layers className="h-4 w-4" />
              Add to a Deck
            </button>

            {/* Fun Efficiency Upgrade: 1-Click Nuance Duel Button */}
            <button
              type="button"
              onClick={() =>
                handleStartCram(
                  `${detail.displayTitle} Register & Nuance Duel`,
                  [...detail.synonyms, ...detail.antonyms]
                )
              }
              className="w-full rounded-md bg-[#e15b64] hover:bg-[#d04a53] text-white px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Swords className="h-4 w-4" />
              Spot the Difference Duel!
            </button>

            {/* Personal Study Note Box */}
            {(isEditingNote || noteText) && (
              <Card className="border-[#e15b64]/40">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#e15b64]">
                      Personal Study Note
                    </span>
                    {!isEditingNote && (
                      <button
                        type="button"
                        onClick={() => setIsEditingNote(true)}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {isEditingNote ? (
                    <div className="space-y-2">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={4}
                        placeholder={`Write your own mnemonic or nuance note for ${detail.displayTitle}...`}
                        className="w-full rounded-md border bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#e15b64]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setIsEditingNote(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-[#e15b64] text-white"
                          onClick={handleSaveNote}
                        >
                          Save Note
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-foreground whitespace-pre-wrap">
                      {noteText}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Link to Corresponding Graded Reading Passage */}
            <Card className="bg-muted/30">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <BookOpen className="h-4 w-4 text-[#e15b64]" />
                  <span>Read in Context</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  See <strong>{detail.displayTitle}</strong> used in a full
                  graded dialogue with vertical/horizontal reading modes.
                </p>
                <Link href="/reading" className="block pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs"
                  >
                    Open [{detail.level}] Lesson{' '}
                    {detail.resources.readingPassageLesson} Passage &rarr;
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* FOCUSED EXAMPLES TAB */}
      {activeTab === 'examples' && (
        <Card className="shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold">
                  All {detail.allExamples.length} Context Sentences for{' '}
                  {detail.displayTitle}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Toggle Sentence/Translation visibility for listening or
                  reading drills, or practice Cloze fill-in.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSentenceText((v) => !v)}
                  className="h-8 text-xs gap-1.5"
                >
                  {showSentenceText ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                  Sentence
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTranslationText((v) => !v)}
                  className="h-8 text-xs gap-1.5"
                >
                  {showTranslationText ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                  Translation
                </Button>
                <Button
                  size="sm"
                  onClick={() => setClozeDrillMode((v) => !v)}
                  className="h-8 text-xs bg-[#e15b64] hover:bg-[#d04a53] text-white"
                >
                  {clozeDrillMode ? 'Standard View' : 'Cloze Drill'}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {detail.allExamples.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-5"
                >
                  <button
                    type="button"
                    onClick={() => speakJapanese(ex.plainJapanese)}
                    className="h-8 w-8 rounded-full bg-[#e15b64] text-white flex items-center justify-center shrink-0"
                  >
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  </button>
                  <div className="flex-1 text-center space-y-1">
                    {clozeDrillMode ? (
                      <div className="flex items-center justify-center gap-2">
                        <span>{ex.clozePrompt.split('____')[0]}</span>
                        <Input
                          value={clozeInputs[ex.id] || ''}
                          onChange={(e) =>
                            setClozeInputs((p) => ({
                              ...p,
                              [ex.id]: e.target.value,
                            }))
                          }
                          placeholder={ex.clozeHint}
                          className="w-28 h-8 text-center font-bold border-[#e15b64]"
                        />
                        <span>{ex.clozePrompt.split('____')[1]}</span>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-[#e15b64] text-white"
                          onClick={() =>
                            handleCheckCloze(ex.id, ex.clozeAnswer)
                          }
                        >
                          Check
                        </Button>
                      </div>
                    ) : (
                      <div
                        className={`text-xl font-medium ${
                          showSentenceText ? '' : 'blur-sm hover:blur-none'
                        }`}
                        dangerouslySetInnerHTML={{ __html: ex.japaneseHtml }}
                      />
                    )}
                    <div
                      className={`text-sm text-muted-foreground ${
                        showTranslationText ? '' : 'blur-sm hover:blur-none'
                      }`}
                      dangerouslySetInnerHTML={{ __html: ex.englishHtml }}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      addCustomSRSCard({
                        front: ex.plainJapanese,
                        reading: detail.displayTitle,
                        meaning: ex.plainEnglish,
                        category: 'grammar',
                        jlptLevel: detail.level,
                      })
                      toast.success('Added example to Anki SRS!')
                    }}
                  >
                    + SRS
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* RESOURCES & MEMORY MNEMONICS TAB */}
      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5 space-y-2">
              <Badge className="bg-[#e15b64] text-white">Memory Hook</Badge>
              <h3 className="font-bold text-base">
                How to Remember {detail.displayTitle}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {detail.resources.mnemonic}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                Common JLPT Trap
              </Badge>
              <h3 className="font-bold text-base">Watch Out For</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {detail.resources.commonMistake}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
