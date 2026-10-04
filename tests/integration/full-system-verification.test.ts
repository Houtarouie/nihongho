import { describe, it, expect } from 'vitest'
import {
  recordKanaAttempt,
  scriptProgress,
  weakKana,
  makeKanaId,
  createInitialKanaRecord,
} from '@/lib/kana/mastery-engine'
import {
  buildQuestion,
  buildBalancedPositionBag,
  fisherYatesShuffle,
} from '@/lib/kana/question-builder'
import {
  getUnit0Lessons,
  getUnitState,
  getNextCurriculumStep,
  isLessonComplete,
  buildPlacementQuiz,
  evaluatePlacementQuiz,
} from '@/lib/curriculum/curriculum-engine'
import {
  planDailySession,
  formatPlural,
  areCardPrerequisitesMet,
  extractRequiredKana,
} from '@/lib/srs/session-planner'
import { DEFAULT_SRS_CARDS, type SRSCard } from '@/data/srs-deck'
import { HIRAGANA_GOJUON, type KanaItem } from '@/data/kana'
import type { KanaMasteryRecord } from '@/lib/kana/types'

describe('End-to-End System Verification (Phases A through E)', () => {
  const now = 1700000000000

  // -------------------------------------------------------------
  // PHASE A: Quiz bias & question generation
  // -------------------------------------------------------------
  describe('Phase A: Quiz generation & bias elimination', () => {
    it('generates exactly 4 distinct options even with 1 selected kana', () => {
      const targetItem: KanaItem = { kana: 'あ', romaji: 'a', row: 'a' }
      const q = buildQuestion({
        target: targetItem,
        pool: [targetItem],
        mode: 'kana-to-romaji',
      })

      expect(q.options.length).toBe(4)
      expect(new Set(q.options).size).toBe(4)
      expect(q.options[q.correctIndex]).toBe('a')
    })

    it('distributes correct answer across slots within 22% - 28% over 10,000 trials', () => {
      const targetItem: KanaItem = { kana: 'し', romaji: 'shi', row: 'sa' }
      const counts = [0, 0, 0, 0]
      const trials = 10000

      for (let i = 0; i < trials; i++) {
        const q = buildQuestion({
          target: targetItem,
          pool: [targetItem],
          mode: 'kana-to-romaji',
        })
        counts[q.correctIndex]++
      }

      for (let slot = 0; slot < 4; slot++) {
        const pct = (counts[slot] / trials) * 100
        expect(pct).toBeGreaterThanOrEqual(22)
        expect(pct).toBeLessThanOrEqual(28)
      }
    })

    it('balanced position bag never places answer in the same slot more than twice in a row', () => {
      const bag = buildBalancedPositionBag(15)
      expect(bag.length).toBe(15)

      let repeatCount = 1
      for (let i = 1; i < bag.length; i++) {
        if (bag[i] === bag[i - 1]) {
          repeatCount++
          expect(repeatCount).toBeLessThanOrEqual(2)
        } else {
          repeatCount = 1
        }
      }
    })
  })

  // -------------------------------------------------------------
  // PHASE B: Mastery engine stage ladder & selectors
  // -------------------------------------------------------------
  describe('Phase B: Mastery engine progression & calendar day boundaries', () => {
    it('promotes stage correctly with calendar day constraints', () => {
      let record = createInitialKanaRecord({ kana: 'あ', romaji: 'a', script: 'hiragana', group: 'gojuon', row: 'a' })
      expect(record.stage).toBe(0) // New

      // 1 attempt -> Stage 1 Learning
      record = recordKanaAttempt({
        record,
        mode: 'kana-to-romaji',
        correct: true,
        now,
      })
      expect(record.stage).toBe(1) // Learning

      // 2 consecutive correct in recognition -> Stage 2 Familiar
      record = recordKanaAttempt({
        record,
        mode: 'kana-to-romaji',
        correct: true,
        now: now + 1000,
      })
      expect(record.stage).toBe(2) // Familiar

      // 1 correct in reverse mode -> Stage 3 Solid
      record = recordKanaAttempt({
        record,
        mode: 'romaji-to-kana',
        correct: true,
        now: now + 2000,
      })
      expect(record.stage).toBe(3) // Solid

      // Cramming in same calendar day CANNOT reach Stage 4 (Strong requires >= 1 day gap)
      record = recordKanaAttempt({
        record,
        mode: 'kana-to-romaji',
        correct: true,
        now: now + 3600 * 1000, // +1 hour, same day
      })
      expect(record.stage).toBe(3) // Still 3!

      // Next calendar day (+25 hours) -> Promotes to Stage 4 Strong
      const nextDay = now + 25 * 3600 * 1000
      record = recordKanaAttempt({
        record,
        mode: 'kana-to-romaji',
        correct: true,
        now: nextDay,
      })
      expect(record.stage).toBe(4) // Strong
    })

    it('drops stage on miss without ever dropping below Stage 1', () => {
      let record = createInitialKanaRecord({ kana: 'い', romaji: 'i', script: 'hiragana', group: 'gojuon', row: 'a' })
      record.stage = 3

      // Miss drops 1 stage from Solid (3 -> 2)
      record = recordKanaAttempt({
        record,
        mode: 'kana-to-romaji',
        correct: false,
        now,
      })
      expect(record.stage).toBe(2)

      // Another miss drops to 1
      record = recordKanaAttempt({
        record,
        mode: 'kana-to-romaji',
        correct: false,
        now: now + 1000,
      })
      expect(record.stage).toBe(1)

      // Further miss never drops below 1
      record = recordKanaAttempt({
        record,
        mode: 'kana-to-romaji',
        correct: false,
        now: now + 2000,
      })
      expect(record.stage).toBe(1)
    })
  })

  // -------------------------------------------------------------
  // PHASE D: Data-driven curriculum & path sync
  // -------------------------------------------------------------
  describe('Phase D: Data-driven curriculum, placement test-out, and soft gate', () => {
    it('chunks Unit 0 into row lessons of <= 5 characters each', () => {
      const lessons = getUnit0Lessons()
      expect(lessons.length).toBeGreaterThan(10)
      for (const l of lessons) {
        expect(l.items.length).toBeGreaterThan(0)
        expect(l.items.length).toBeLessThanOrEqual(5)
      }
    })

    it('initially locks Unit 1 and reports exact unlock criteria', () => {
      const emptyMastery = {}
      const u0 = getUnitState('unit-0', emptyMastery)
      const u1 = getUnitState('unit-1', emptyMastery)

      expect(u0.status).toBe('available')
      expect(u0.progressPct).toBe(0)

      expect(u1.status).toBe('locked')
      expect(u1.lockedReason).toContain('Unlocks when Hiragana is 80% known')
    })

    it('placement test-out with >=90% marks script Solid (Stage 3, NEVER 5) and unlocks Unit 1', () => {
      const sample = buildPlacementQuiz('hiragana')
      expect(sample.length).toBe(20)

      // Pass placement test (20/20 correct)
      const results = sample.map((it) => ({ kana: it.kana, correct: true }))
      const evalRes = evaluatePlacementQuiz('hiragana', results, now)

      expect(evalRes.passed).toBe(true)
      expect(evalRes.awardedStage).toBe(3) // Stage 3 Solid, NEVER 5 Mastered

      const updatedMastery = evalRes.recordsToUpdate!
      const u1 = getUnitState('unit-1', updatedMastery)

      expect(u1.status).toBe('available')
      expect(u1.lockedReason).toBeUndefined()
    })
  })

  // -------------------------------------------------------------
  // PHASE E: Beginner-first daily session planner
  // -------------------------------------------------------------
  describe('Phase E: Beginner-first daily session planner & card gating', () => {
    it('fresh beginner receives 0 vocabulary/kanji cards in daily session', () => {
      const loadedDeck: SRSCard[] = (DEFAULT_SRS_CARDS as SRSCard[]).map((c) => ({
        ...c,
        status: 'new',
        interval: 0,
        repetition: 0,
        queue: 'active',
        dueDate: now,
      }))

      const plan = planDailySession({
        deck: loadedDeck,
        kanaMastery: {},
        options: { newCardsPerDay: 5 },
        today: now,
      })

      expect(plan.newCards.length).toBeGreaterThan(0)
      expect(plan.newCards.every((c) => c.category === 'kana')).toBe(true)
      expect(plan.newCards.some((c) => c.category === 'vocabulary')).toBe(false)
      expect(plan.newCards.some((c) => c.category === 'kanji')).toBe(false)
    })

    it('31 pending reviews triggers backlog safety: pauses new cards entirely', () => {
      const mockReviews: SRSCard[] = Array.from({ length: 31 }, (_, i) => ({
        id: `r-${i}`,
        front: `Rev ${i}`,
        reading: 'r',
        meaning: 'rev',
        category: 'kana',
        jlptLevel: 'N5',
        interval: 3,
        repetition: 2,
        efactor: 2.5,
        dueDate: now - 10000,
        status: 'review',
      }))

      const plan = planDailySession({
        deck: [...mockReviews, ...(DEFAULT_SRS_CARDS as SRSCard[])],
        kanaMastery: {},
        options: { newCardsPerDay: 5, backlogThreshold: 30 },
        today: now,
      })

      expect(plan.backlogPaused).toBe(true)
      expect(plan.newCount).toBe(0)
      expect(plan.newCards.length).toBe(0)
      expect(plan.summaryLabel).toContain('new cards paused due to review backlog')
    })

    it('formats singular and plural labels accurately (e.g. 1 review, not 1 reviews)', () => {
      expect(formatPlural(1, 'review')).toBe('1 review')
      expect(formatPlural(2, 'review')).toBe('2 reviews')
      expect(formatPlural(1, 'card')).toBe('1 card')
      expect(formatPlural(5, 'card')).toBe('5 cards')
    })
  })
})
