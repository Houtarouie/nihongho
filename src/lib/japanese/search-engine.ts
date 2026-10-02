import { convertRomajiToKana } from '@/lib/kana-ime'
import {
  CONJUGATION_RULES_DATABASE,
  deconjugate,
} from '@/lib/japanese/conjugator'
import curatedGrammarData from '@/data/user-grammar-curated.json'
import referenceGrammarData from '@/data/grammar.json'
import userConversationData from '@/data/user-conversation-vocab.json'
import { BUNPRO_VOCAB_ITEMS } from '@/data/bunpro-vocab'
import { CURRICULUM_PATH } from '@/data/curriculum-path'
import type { GrammarPointSummary } from '@/data/bunpro-grammar-details'

export interface OmniSearchResult {
  category: 'grammar' | 'conjugation' | 'vocab' | 'lesson'
  id: string
  title: string
  subtitle: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'outline'
  audioText?: string
  actionType: 'open-grammar' | 'open-conjugation' | 'open-lesson' | 'add-srs'
  payload: unknown
  score: number
}

export interface OmniSearchGroupedResults {
  grammar: OmniSearchResult[]
  conjugations: OmniSearchResult[]
  vocab: OmniSearchResult[]
  lessons: OmniSearchResult[]
  totalCount: number
}

// Pre-index curated grammar items
const ALL_GRAMMAR: GrammarPointSummary[] = [
  ...curatedGrammarData.grammar.map((g) => ({
    grammar: g.grammar,
    title: g.title,
    meaning: g.meaning,
    level: g.level,
    lesson: g.lesson,
    track: 'core' as const,
  })),
  ...(referenceGrammarData as GrammarPointSummary[]).map((r) => ({
    grammar: r.grammar,
    meaning: r.meaning,
    level: r.level,
    lesson: r.lesson,
    title: r.title || r.grammar,
    track: 'reference' as const,
  })),
]

// Pre-index vocabulary items
interface UnifiedVocabItem {
  id: string
  word: string
  reading: string
  meaning: string
  level?: string
  pos?: string
  example?: string
}

const ALL_VOCAB: UnifiedVocabItem[] = [
  ...userConversationData.scenarios.flatMap((s) =>
    (s.words || []).map((w) => ({
      id: w.id,
      word: w.word,
      reading: w.reading,
      meaning: w.meaning,
      level: 'N5',
      pos: w.pos,
      example: w.example?.ja,
    }))
  ),
  ...BUNPRO_VOCAB_ITEMS.map((b) => ({
    id: b.id,
    word: b.word,
    reading: b.furigana,
    meaning: b.meaning,
    level: b.jlptLevel,
    pos: b.partOfSpeech,
  })),
]

// Common particles Romaji overrides
const PARTICLE_ROMAJI_OVERRIDE: Record<string, string> = {
  wa: 'は',
  e: 'へ',
  o: 'を',
  wo: 'を',
}

/**
 * High-performance multilingual search matcher
 */
export function matchQueryScore(targetText: string, query: string, kanaQuery: string): number {
  if (!targetText || !query) return 0
  const lower = targetText.toLowerCase()

  // 1. Exact match
  if (lower === query || lower === kanaQuery) return 100

  // 2. Starts with query or converted kana
  if (lower.startsWith(query) || (kanaQuery && lower.startsWith(kanaQuery))) return 90

  // 3. Contains converted kana (Japanese intent)
  if (kanaQuery && lower.includes(kanaQuery)) return 80

  // 4. Word-boundary English match
  if (query.length <= 2 && /^[a-z]+$/.test(query)) {
    const wordBoundRegex = new RegExp(`\\b${query}\\b`, 'i')
    if (wordBoundRegex.test(lower)) return 60
    return 0 // Avoid accidental substring matching inside unrelated words like "destination"
  }

  // 5. General substring match for 3+ letters
  if (lower.includes(query)) return 50

  return 0
}

/**
 * Searches across all Grammar Points with Romaji & Kana support
 */
export function searchGrammarPoints(query: string, maxResults = 8): OmniSearchResult[] {
  const cleanQ = query.trim().toLowerCase()
  if (!cleanQ) return []

  const kanaQ = PARTICLE_ROMAJI_OVERRIDE[cleanQ] || convertRomajiToKana(cleanQ)

  const scored = ALL_GRAMMAR.map((item) => {
    let score = 0

    // Match on Japanese grammar pattern (highest weight)
    const grammarScore = matchQueryScore(item.grammar, cleanQ, kanaQ)
    if (grammarScore > 0) score += grammarScore * 1.5

    // Special particle match for 'wa' -> 'は'
    if (cleanQ === 'wa' && item.grammar === 'は') score = 150
    if (cleanQ === 'e' && item.grammar === 'へ') score = 150
    if ((cleanQ === 'o' || cleanQ === 'wo') && item.grammar === 'を') score = 150

    // Match on Title
    if (item.title) {
      const titleScore = matchQueryScore(item.title, cleanQ, kanaQ)
      score = Math.max(score, titleScore)
    }

    // Match on English meaning
    const meaningScore = matchQueryScore(item.meaning, cleanQ, '')
    score = Math.max(score, meaningScore * 0.8)

    return { item, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(({ item, score }) => ({
      category: 'grammar',
      id: `grammar-${item.grammar}-${item.level}`,
      title: item.grammar,
      subtitle: item.meaning,
      badge: item.level,
      badgeVariant: item.track === 'core' ? 'default' : 'outline',
      audioText: item.grammar,
      actionType: 'open-grammar',
      payload: item,
      score,
    }))
}

/**
 * Searches Conjugation Rules and Deconjugates inflected verb forms
 */
export function searchConjugations(query: string): OmniSearchResult[] {
  const cleanQ = query.trim().toLowerCase()
  if (!cleanQ) return []

  const kanaQ = convertRomajiToKana(cleanQ)
  const results: OmniSearchResult[] = []

  // 1. Search rule definitions (e.g. "te form", "potential", "passive")
  for (const rule of CONJUGATION_RULES_DATABASE) {
    let matched = false
    if (rule.aliases.some((a) => a === cleanQ || a === kanaQ)) matched = true
    if (rule.nameEn.toLowerCase().includes(cleanQ)) matched = true
    if (rule.nameJa.includes(kanaQ)) matched = true

    if (matched) {
      results.push({
        category: 'conjugation',
        id: `conj-rule-${rule.id}`,
        title: `${rule.nameJa} — ${rule.nameEn}`,
        subtitle: rule.description,
        badge: 'Conjugation Rule',
        badgeVariant: 'secondary',
        actionType: 'open-conjugation',
        payload: rule,
        score: 110,
      })
    }
  }

  // 2. Reverse Deconjugate (e.g. user typed "食べた" or "tabeta" or "行かない")
  const deconjugated = deconjugate(cleanQ).concat(deconjugate(kanaQ))
  for (const d of deconjugated) {
    results.push({
      category: 'conjugation',
      id: `deconj-${d.surface}-${d.formKey}`,
      title: `${d.surface} → Base: ${d.dictionary} (${d.formNameJa})`,
      subtitle: `${d.formNameEn}: ${d.explanation}`,
      badge: 'Inflection',
      badgeVariant: 'outline',
      audioText: d.surface,
      actionType: 'open-conjugation',
      payload: d,
      score: 95,
    })
  }

  return results.slice(0, 5)
}

/**
 * Searches Vocabulary items by Kanji, Kana, and English meaning
 */
export function searchVocabulary(query: string, maxResults = 8): OmniSearchResult[] {
  const cleanQ = query.trim().toLowerCase()
  if (!cleanQ) return []

  const kanaQ = convertRomajiToKana(cleanQ)

  const scored = ALL_VOCAB.map((v) => {
    let score = 0

    // Match word or reading
    const wordScore = matchQueryScore(v.word, cleanQ, kanaQ)
    const readScore = matchQueryScore(v.reading, cleanQ, kanaQ)
    score = Math.max(score, wordScore * 1.3, readScore * 1.1)

    // Match English meaning
    const meaningScore = matchQueryScore(v.meaning, cleanQ, '')
    score = Math.max(score, meaningScore)

    return { v, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(({ v, score }) => ({
      category: 'vocab',
      id: `vocab-${v.id}-${v.word}`,
      title: `${v.word} (${v.reading})`,
      subtitle: v.meaning,
      badge: v.level || (v.pos ? v.pos.toUpperCase() : 'VOCAB'),
      badgeVariant: 'outline',
      audioText: v.reading || v.word,
      actionType: 'add-srs',
      payload: v,
      score,
    }))
}

/**
 * Searches Curriculum Lessons across units 0 to 16
 */
export function searchCurriculumLessons(query: string, maxResults = 6): OmniSearchResult[] {
  const cleanQ = query.trim().toLowerCase()
  if (!cleanQ) return []

  const kanaQ = convertRomajiToKana(cleanQ)
  const results: OmniSearchResult[] = []

  for (const unit of CURRICULUM_PATH) {
    for (const lesson of unit.lessons) {
      let score = 0

      // Match title
      const titleScore = matchQueryScore(lesson.title, cleanQ, kanaQ)
      if (titleScore > 0) score += titleScore

      // Match keypoints
      for (const kp of lesson.keyPoints) {
        const kpScore = matchQueryScore(kp, cleanQ, kanaQ)
        if (kpScore > 0) score = Math.max(score, kpScore * 0.9)
      }

      // Match description
      const descScore = matchQueryScore(lesson.description, cleanQ, '')
      if (descScore > 0) score = Math.max(score, descScore * 0.7)

      if (score > 0) {
        results.push({
          category: 'lesson',
          id: `lesson-${lesson.id}`,
          title: `Unit ${unit.unitNumber}.${lesson.lessonNumber}: ${lesson.title}`,
          subtitle: lesson.description,
          badge: unit.jlptLevel,
          badgeVariant: 'secondary',
          actionType: 'open-lesson',
          payload: { unit, lesson },
          score,
        })
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, maxResults)
}

/**
 * Unified OmniSearch execution: combines all domains
 */
export function executeOmniSearch(query: string): OmniSearchGroupedResults {
  const cleanQ = query.trim()
  if (!cleanQ) {
    return {
      grammar: [],
      conjugations: [],
      vocab: [],
      lessons: [],
      totalCount: 0,
    }
  }

  const grammar = searchGrammarPoints(cleanQ)
  const conjugations = searchConjugations(cleanQ)
  const vocab = searchVocabulary(cleanQ)
  const lessons = searchCurriculumLessons(cleanQ)

  const totalCount =
    grammar.length + conjugations.length + vocab.length + lessons.length

  return {
    grammar,
    conjugations,
    vocab,
    lessons,
    totalCount,
  }
}
