'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  X,
  Volume2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Plus,
  Check,
  Zap,
  GraduationCap,
} from 'lucide-react'
import {
  executeOmniSearch,
  type OmniSearchResult,
  type OmniSearchGroupedResults,
} from '@/lib/japanese/search-engine'
import {
  conjugateVerb,
  type ConjugationFormInfo,
  type DeconjugatedResult,
  type VerbConjugationEntry,
} from '@/lib/japanese/conjugator'
import { GrammarPointInspector } from '@/components/bunpro/grammar-point-inspector'
import type { GrammarPointSummary } from '@/data/bunpro-grammar-details'
import { useProgress } from '@/lib/progress'
import { speakJapanese, type SRSCard } from '@/data/srs-deck'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export function OmniSearchDialog() {
  const router = useRouter()
  const { upsertCards } = useProgress()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Active Modals when inspecting specific results
  const [activeGrammar, setActiveGrammar] = useState<GrammarPointSummary | null>(null)
  const [activeVerbConjugations, setActiveVerbConjugations] = useState<{
    verb: string
    entries: VerbConjugationEntry[]
  } | null>(null)
  const [activeRule, setActiveRule] = useState<ConjugationFormInfo | null>(null)

  // Track cards added in this session
  const [addedCardIds, setAddedCardIds] = useState<Set<string>>(new Set())

  // Global Keyboard Shortcut: Ctrl+K or Cmd+K or Slash /
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (e.key === 'Escape' && isOpen) {
        if (activeGrammar) {
          setActiveGrammar(null)
        } else if (activeVerbConjugations) {
          setActiveVerbConjugations(null)
        } else if (activeRule) {
          setActiveRule(null)
        } else {
          setIsOpen(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeGrammar, activeVerbConjugations, activeRule])

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setActiveGrammar(null)
      setActiveVerbConjugations(null)
      setActiveRule(null)
    }
  }, [isOpen])

  // Execute search
  const results: OmniSearchGroupedResults = useMemo(() => {
    return executeOmniSearch(query)
  }, [query])

  // Add vocab card to SRS
  async function handleAddVocabToSRS(item: OmniSearchResult) {
    const payload = item.payload as {
      word: string
      reading: string
      meaning: string
      level?: string
      pos?: string
    }

    const card: SRSCard = {
      id: `vocab-${Date.now()}-${payload.word}`,
      front: payload.word,
      reading: payload.reading || payload.word,
      meaning: payload.meaning,
      category: 'vocabulary',
      jlptLevel: payload.level || 'N5',
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: Date.now(),
      status: 'new',
      queue: 'active',
      lapses: 0,
    }

    await upsertCards([card])
    setAddedCardIds((prev) => new Set(prev).add(item.id))
    toast.success(`"${payload.word}" added to your Daily SRS Review queue!`)
  }

  // Handle clicking a conjugation result
  function handleSelectConjugation(res: OmniSearchResult) {
    if (res.actionType === 'open-conjugation') {
      const payload = res.payload as DeconjugatedResult | ConjugationFormInfo
      if ('dictionary' in payload) {
        const entries = conjugateVerb(payload.dictionary, payload.reading)
        setActiveVerbConjugations({ verb: payload.dictionary, entries })
      } else {
        setActiveRule(payload as ConjugationFormInfo)
      }
    }
  }

  // Expose global open event
  useEffect(() => {
    function handleOpenEvent() {
      setIsOpen(true)
    }
    window.addEventListener('open-omni-search', handleOpenEvent)
    return () => window.removeEventListener('open-omni-search', handleOpenEvent)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50 duration-150">
      <div className="w-full max-w-2xl rounded-3xl border-2 border-border shadow-2xl bg-card overflow-hidden flex flex-col max-h-[82vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b bg-muted/20">
          <Search className="h-5 w-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search grammar (〜て, wa), words (taberu, 暇), conjugations (past, 行かない)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm sm:text-base outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-md border">
            <kbd>ESC</kbd> to close
          </div>
        </div>

        {/* Modal Content / Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Active Grammar Point Inspector Overlay */}
          {activeGrammar ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveGrammar(null)}
                className="gap-1.5 text-xs rounded-xl"
              >
                ← Back to Search Results
              </Button>
              <GrammarPointInspector
                item={activeGrammar}
                allGrammar={[]}
                onSelectGrammar={(g) => setActiveGrammar(g)}
                onBack={() => setActiveGrammar(null)}
                historyTrail={[]}
                initialTab="study"
              />
            </div>
          ) : activeVerbConjugations ? (
            /* Active Verb Conjugation Table */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveVerbConjugations(null)}
                    className="gap-1.5 text-xs rounded-xl mb-1 -ml-2"
                  >
                    ← Back to Search Results
                  </Button>
                  <h3 className="text-xl font-bold font-japanese flex items-center gap-2">
                    <span>{activeVerbConjugations.verb}</span>
                    <Badge variant="outline" className="text-xs font-sans">
                      Conjugation Table
                    </Badge>
                  </h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => speakJapanese(activeVerbConjugations.verb)}
                  className="rounded-xl h-8 gap-1.5 text-xs"
                >
                  <Volume2 className="h-3.5 w-3.5 text-primary" />
                  Listen
                </Button>
              </div>

              <div className="grid gap-2 text-xs">
                {activeVerbConjugations.entries.map((c) => (
                  <div
                    key={c.formKey}
                    className="p-3 rounded-xl border bg-muted/30 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm font-japanese text-foreground">
                          {c.kanji}
                        </span>
                        <span className="text-muted-foreground font-japanese">({c.kana})</span>
                        <Badge variant="secondary" className="text-[10px] py-0 font-normal">
                          {c.nameJa} • {c.nameEn}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{c.explanation}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => speakJapanese(c.kana || c.kanji)}
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : activeRule ? (
            /* Active Conjugation Rule Guide */
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveRule(null)}
                className="gap-1.5 text-xs rounded-xl"
              >
                ← Back to Search Results
              </Button>
              <Card className="rounded-2xl p-5 space-y-4 border-primary/20 bg-primary/5">
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-xs">Conjugation Rule</Badge>
                  <h3 className="text-xl font-bold font-japanese">{activeRule.nameJa} — {activeRule.nameEn}</h3>
                  <p className="text-xs text-muted-foreground">{activeRule.description}</p>
                </div>
                <div className="p-3.5 rounded-xl border bg-background/80 space-y-1.5 text-xs">
                  <span className="font-bold text-primary block">Conjugation Formula:</span>
                  <p className="font-mono text-[11px] text-foreground leading-relaxed">{activeRule.formula}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl border bg-background/80 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Godan Verbs</span>
                    <p className="font-japanese text-sm font-medium">{activeRule.examples.godan}</p>
                  </div>
                  <div className="p-3 rounded-xl border bg-background/80 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Ichidan Verbs</span>
                    <p className="font-japanese text-sm font-medium">{activeRule.examples.ichidan}</p>
                  </div>
                </div>
              </Card>
            </div>
          ) : !query.trim() ? (
            /* Default Suggestions */
            <div className="space-y-5 text-xs">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Popular Searches
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['te-form', 'wa', '〜てください', 'taberu', 'potential', 'past tense', 'kashi', 'ni'].map(
                    (term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-2.5 py-1 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground font-mono text-[11px] transition-colors border"
                      >
                        {term}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl border bg-muted/20 space-y-2 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  What can you search?
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>
                    <strong>Grammar Points:</strong> Type Romaji or Japanese (e.g. <code>te</code>, <code>wa</code>, <code>kudasai</code>, <code>〜ている</code>).
                  </li>
                  <li>
                    <strong>Conjugated Verbs:</strong> Type inflections like <code>tabeta</code>, <code>食べた</code>, <code>ikimasen</code> to reverse-deconjugate!
                  </li>
                  <li>
                    <strong>Conjugation Rules:</strong> Type <code>te-form</code>, <code>potential</code>, <code>passive</code>, <code>causative</code>.
                  </li>
                  <li>
                    <strong>Vocabulary:</strong> Search Japanese or English (e.g. <code>friend</code>, <code>taberu</code>, <code>暇</code>).
                  </li>
                </ul>
              </div>
            </div>
          ) : results.totalCount === 0 ? (
            /* Empty State */
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-semibold">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try searching in Romaji (e.g. <code>te</code>, <code>tabeta</code>), English (e.g. <code>eat</code>, <code>please</code>), or Japanese Kana/Kanji.
              </p>
            </div>
          ) : (
            /* Results Lists */
            <div className="space-y-6 text-xs">
              {/* 1. Conjugations & Deconjugations */}
              {results.conjugations.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Conjugation &amp; Inflections ({results.conjugations.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.conjugations.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectConjugation(item)}
                        className="p-3 rounded-xl border bg-card hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm font-japanese text-foreground">
                              {item.title}
                            </span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-[10px] py-0">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Grammar Points */}
              {results.grammar.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Grammar Points ({results.grammar.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.grammar.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveGrammar(item.payload as GrammarPointSummary)}
                        className="p-3 rounded-xl border bg-card hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm font-japanese text-foreground">
                              {item.title}
                            </span>
                            {item.badge && (
                              <Badge variant="outline" className="text-[10px] py-0 border-primary/30 text-primary">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.audioText && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                speakJapanese(item.audioText!)
                              }}
                              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Vocabulary & Words */}
              {results.vocab.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Vocabulary &amp; Kanji ({results.vocab.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.vocab.map((item) => {
                      const isAdded = addedCardIds.has(item.id)
                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm font-japanese text-foreground">
                                {item.title}
                              </span>
                              {item.badge && (
                                <Badge variant="secondary" className="text-[10px] py-0 font-normal">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.audioText && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => speakJapanese(item.audioText!)}
                                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                              >
                                <Volume2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant={isAdded ? 'secondary' : 'outline'}
                              disabled={isAdded}
                              onClick={() => handleAddVocabToSRS(item)}
                              className="rounded-xl h-7 text-[11px] gap-1 px-2.5 font-normal"
                            >
                              {isAdded ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-500" />
                                  Added
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3" />
                                  Add to SRS
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 4. Curriculum Lessons */}
              {results.lessons.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 uppercase tracking-wider">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Curriculum Lessons ({results.lessons.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.lessons.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setIsOpen(false)
                          router.push('/path')
                        }}
                        className="p-3 rounded-xl border bg-card hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-foreground">
                              {item.title}
                            </span>
                            {item.badge && (
                              <Badge variant="outline" className="text-[10px] py-0">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground px-4">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono">↓</kbd>
            <span>Select:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono">Enter</kbd>
          </div>
          <span>Nihongo OmniSearch</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Trigger button that can be embedded anywhere to open OmniSearch
 */
export function OmniSearchTriggerButton({ className }: { className?: string }) {
  function handleOpen() {
    window.dispatchEvent(new CustomEvent('open-omni-search'))
  }

  return (
    <button
      onClick={handleOpen}
      className={`flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-xl border bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all text-xs font-normal ${className}`}
      aria-label="Open search dialog"
    >
      <div className="flex items-center gap-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="truncate">Search grammar, words, conjugations...</span>
      </div>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted border text-muted-foreground">
        Ctrl K
      </kbd>
    </button>
  )
}
