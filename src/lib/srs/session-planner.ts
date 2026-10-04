import type { SRSCard } from '@/data/srs-deck'
import type { KanaMasteryRecord } from '@/lib/kana/types'
import { makeKanaId, detectKanaScript } from '@/lib/kana/mastery-engine'
import { HIRAGANA_GOJUON, type KanaItem } from '@/data/kana'

export type CardTrack = 'kana' | 'basic_grammar' | 'kana_vocab' | 'kanji_vocab' | 'other'

export interface SessionPlanOptions {
  newCardsPerDay?: number
  maxReviewsPerDay?: number
  backlogThreshold?: number
}

export interface PlannedCard extends SRSCard {
  requiresKanaWarning?: boolean
  track?: CardTrack
}

export interface DailySessionPlan {
  sessionQueue: PlannedCard[]
  dueReviews: PlannedCard[]
  learningCards: PlannedCard[]
  newCards: PlannedCard[]
  totalDue: number
  reviewCount: number
  learningCount: number
  newCount: number
  backlogPaused: boolean
  gatedNewCardsCount: number
  reviewCountLabel: string
  newCountLabel: string
  summaryLabel: string
  description: string
}

/**
 * Checks if a string contains Kanji characters
 */
export function containsKanji(str: string): boolean {
  return /[\u4E00-\u9FAF]/.test(str)
}

/**
 * Extracts kana characters that a card requires
 */
export function extractRequiredKana(card: SRSCard): string[] {
  if (card.requires && card.requires.length > 0) {
    return card.requires
  }

  // If card is kana, it requires nothing
  if (card.category === 'kana' || (card.tags && card.tags.includes('kana'))) {
    return []
  }

  // For vocab / kanji, extract from reading or front
  const sourceText = card.reading || card.front || ''
  // Strip romaji in parentheses e.g. (taberu) and brackets [たべる]
  const cleanText = sourceText.replace(/\([a-zA-Z\s]+\)/g, '')
  const matches = cleanText.match(/[\u3040-\u309F\u30A0-\u30FF]/g)
  if (!matches) return []

  // Return unique kana characters
  return Array.from(new Set(matches))
}

/**
 * Categorizes a card into its curriculum track
 */
export function getCardTrack(card: SRSCard): CardTrack {
  if (card.track) return card.track
  if (card.category === 'kana' || (card.tags && card.tags.includes('kana'))) {
    return 'kana'
  }
  if (card.category === 'grammar' || (card.tags && card.tags.includes('grammar'))) {
    return 'basic_grammar'
  }
  if (card.category === 'kanji' || (card.tags && card.tags.includes('kanji'))) {
    return 'kanji_vocab'
  }
  if (card.category === 'vocabulary' || (card.tags && card.tags.includes('vocabulary'))) {
    return containsKanji(card.front) ? 'kanji_vocab' : 'kana_vocab'
  }
  return 'other'
}

/**
 * Checks if at least targetRatio of Hiragana Gojūon is at Stage >= 3 (Solid)
 */
function isHiraganaGojuonSolidEnough(
  kanaMastery: Record<string, KanaMasteryRecord>,
  targetRatio: number = 0.8
): boolean {
  const gojuonItems = HIRAGANA_GOJUON.flatMap((r) => r.items).filter((it): it is KanaItem => Boolean(it))
  if (gojuonItems.length === 0) return true

  let solidCount = 0
  for (const it of gojuonItems) {
    const id = makeKanaId(it.kana, 'hiragana')
    if ((kanaMastery[id]?.stage ?? 0) >= 3) {
      solidCount++
    }
  }
  return solidCount / gojuonItems.length >= targetRatio
}

/**
 * Evaluates whether prerequisites are satisfied for a card
 */
export function areCardPrerequisitesMet(
  card: SRSCard,
  kanaMastery: Record<string, KanaMasteryRecord>
): boolean {
  const track = getCardTrack(card)

  // 1. Kana cards have no prerequisites
  if (track === 'kana') {
    return true
  }

  // 2. Basic grammar requires Hiragana Gojūon to be at least 80% Solid
  if (track === 'basic_grammar') {
    return isHiraganaGojuonSolidEnough(kanaMastery, 0.8)
  }

  // 3. Vocab and Kanji cards require all constituent kana to be Solid (Stage >= 3)
  const reqKana = extractRequiredKana(card)
  if (reqKana.length === 0) {
    return true
  }

  return reqKana.every((char) => {
    const script = detectKanaScript(char)
    const id = makeKanaId(char, script)
    const record = kanaMastery[id]
    return (record?.stage ?? 0) >= 3
  })
}

/**
 * Formats singular / plural counts correctly
 */
export function formatPlural(count: number, singular: string, plural?: string): string {
  const p = plural || `${singular}s`
  return `${count} ${count === 1 ? singular : p}`
}

/**
 * Pure daily session planner:
 * - Priority order: (1) due reviews; (2) learning steps; (3) new kana; (4) new basic grammar; (5) vocab (when kana are Solid); (6) kanji vocab last.
 * - Caps new cards at beginner-safe default (e.g. 5/day).
 * - Day 1 beginner yields 0 vocabulary cards.
 * - Backlog safety: if pending reviews > 30, pause new cards entirely.
 * - Seed deck migration: existing learned cards lacking Solid kana are NOT deleted; flagged with requiresKanaWarning.
 */
export function planDailySession(params: {
  deck: SRSCard[]
  kanaMastery: Record<string, KanaMasteryRecord>
  options?: SessionPlanOptions
  today?: number
}): DailySessionPlan {
  const { deck, kanaMastery, options, today = Date.now() } = params

  const activeCards = deck.filter((c) => c.queue !== 'suspended')

  // 1. Due Reviews (cards in review status with dueDate <= today)
  const rawDueReviews = activeCards.filter(
    (c) => c.status === 'review' && (c.dueDate || 0) <= today
  )

  // 2. Learning Steps (cards in learning status with dueDate <= today or intraday)
  const rawLearning = activeCards.filter(
    (c) =>
      c.status === 'learning' ||
      (c.status !== 'new' && c.repetition > 0 && c.interval < 1 && (c.dueDate || 0) <= today)
  )

  // Check prerequisites on existing learned cards without deleting them (migration safety)
  const dueReviews: PlannedCard[] = rawDueReviews.map((card) => {
    const met = areCardPrerequisitesMet(card, kanaMastery)
    return {
      ...card,
      track: getCardTrack(card),
      requiresKanaWarning: !met,
    }
  })

  const learningCards: PlannedCard[] = rawLearning.map((card) => {
    const met = areCardPrerequisitesMet(card, kanaMastery)
    return {
      ...card,
      track: getCardTrack(card),
      requiresKanaWarning: !met,
    }
  })

  // 3. Backlog safety check
  const backlogThreshold = options?.backlogThreshold ?? 30
  const isBacklogPaused = dueReviews.length > backlogThreshold
  const maxNew = isBacklogPaused ? 0 : Math.max(0, options?.newCardsPerDay ?? 5)

  // 4. Candidate new cards (status === 'new' or unreviewed non-learning card)
  const rawNewCards = activeCards.filter(
    (c) =>
      c.status === 'new' ||
      (c.status !== 'review' &&
        c.status !== 'learning' &&
        c.status !== 'mastered' &&
        c.repetition === 0 &&
        c.interval === 0)
  )

  let gatedNewCardsCount = 0
  const eligibleNewCards: PlannedCard[] = []

  for (const card of rawNewCards) {
    if (areCardPrerequisitesMet(card, kanaMastery)) {
      eligibleNewCards.push({
        ...card,
        track: getCardTrack(card),
        requiresKanaWarning: false,
      })
    } else {
      gatedNewCardsCount++
    }
  }

  // Sort eligible new cards strictly by track priority:
  // (3) new kana -> (4) new basic grammar -> (5) kana-only vocab -> (6) kanji vocab -> other
  const TRACK_PRIORITY: Record<CardTrack, number> = {
    kana: 1,
    basic_grammar: 2,
    kana_vocab: 3,
    kanji_vocab: 4,
    other: 5,
  }

  eligibleNewCards.sort((a, b) => {
    const pA = TRACK_PRIORITY[a.track || 'other']
    const pB = TRACK_PRIORITY[b.track || 'other']
    return pA - pB
  })

  const newCards = eligibleNewCards.slice(0, maxNew)

  // 5. Final Session Queue composition
  // Strict priority order: (1) due reviews; (2) learning steps; (3-6) new cards
  const sessionQueue = [...dueReviews, ...learningCards, ...newCards]

  const reviewCount = dueReviews.length
  const learningCount = learningCards.length
  const newCount = newCards.length
  const totalDue = sessionQueue.length

  const reviewCountLabel = formatPlural(reviewCount, 'review')
  const newCountLabel = `${newCount} new`
  const summaryLabel = isBacklogPaused
    ? `${reviewCountLabel} (new cards paused due to review backlog)`
    : `${reviewCountLabel} + ${newCount} new`

  const description =
    totalDue > 0
      ? `You have ${formatPlural(totalDue, 'card')} scheduled for recall today (${summaryLabel}).`
      : 'Zero pending reviews. Continue progressing along your curriculum path.'

  return {
    sessionQueue,
    dueReviews,
    learningCards,
    newCards,
    totalDue,
    reviewCount,
    learningCount,
    newCount,
    backlogPaused: isBacklogPaused,
    gatedNewCardsCount,
    reviewCountLabel,
    newCountLabel,
    summaryLabel,
    description,
  }
}
