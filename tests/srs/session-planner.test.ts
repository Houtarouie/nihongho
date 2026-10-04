import { describe, it, expect } from 'vitest'
import {
  planDailySession,
  formatPlural,
  areCardPrerequisitesMet,
  extractRequiredKana,
  getCardTrack,
} from '@/lib/srs/session-planner'
import type { SRSCard } from '@/data/srs-deck'
import type { KanaMasteryRecord } from '@/lib/kana/types'
import { makeKanaId } from '@/lib/kana/mastery-engine'

function makeMockCard(partial: Partial<SRSCard>): SRSCard {
  return {
    id: partial.id || 'card-test',
    front: partial.front || 'テスト',
    reading: partial.reading || 'てすと',
    meaning: partial.meaning || 'test',
    category: partial.category || 'vocabulary',
    jlptLevel: partial.jlptLevel || 'N5',
    interval: partial.interval ?? 0,
    repetition: partial.repetition ?? 0,
    efactor: partial.efactor ?? 2.5,
    dueDate: partial.dueDate ?? Date.now(),
    status: partial.status || 'new',
    queue: partial.queue || 'active',
    ...partial,
  }
}

function makeSolidKanaMastery(chars: string[]): Record<string, KanaMasteryRecord> {
  const map: Record<string, KanaMasteryRecord> = {}
  for (const c of chars) {
    const id = makeKanaId(c, 'hiragana')
    map[id] = {
      id,
      kana: c,
      romaji: c,
      script: 'hiragana',
      group: 'gojuon',
      row: 'a',
      stage: 3, // Solid
      stageChangedAt: Date.now(),
      attempts: 5,
      correct: 5,
      streak: 5,
      lastSeenAt: Date.now(),
      last10Attempts: [],
      perModeCounts: {
        recognition: { attempts: 5, correct: 5 },
        reverse: { attempts: 0, correct: 0 },
        listening: { attempts: 0, correct: 0 },
        typing: { attempts: 0, correct: 0 },
      },
      confusions: {},
    }
  }
  return map
}

describe('Phase E: Beginner-First Daily Session Planner & Card Gating', () => {
  const now = Date.now()

  it('Day 1 beginner with 0 kana mastery gets ZERO kanji/vocab in new cards queue', () => {
    const deck: SRSCard[] = [
      makeMockCard({ id: 'v1', front: '飲む[のむ]', reading: 'のむ', category: 'vocabulary', status: 'new' }),
      makeMockCard({ id: 'v2', front: '食べる[たべる]', reading: 'たべる', category: 'vocabulary', status: 'new' }),
      makeMockCard({ id: 'k1', front: '日', reading: 'ニチ・ひ', category: 'kanji', status: 'new' }),
      makeMockCard({ id: 'kana-a', front: 'あ', reading: 'a', category: 'kana', status: 'new' }),
      makeMockCard({ id: 'kana-i', front: 'い', reading: 'i', category: 'kana', status: 'new' }),
    ]

    const emptyMastery = {}
    const plan = planDailySession({
      deck,
      kanaMastery: emptyMastery,
      options: { newCardsPerDay: 5 },
      today: now,
    })

    // Should only pick the kana cards; vocab & kanji cards MUST be gated
    expect(plan.newCards.length).toBe(2)
    expect(plan.newCards.every((c) => c.category === 'kana')).toBe(true)
    expect(plan.newCards.some((c) => c.category === 'vocabulary')).toBe(false)
    expect(plan.newCards.some((c) => c.category === 'kanji')).toBe(false)
  })

  it('Learning Hiragana up to Solid unlocks only the vocab whose characters are known', () => {
    // Learner knows 'の' and 'む' Solid, but NOT 'た', 'べ', 'る'
    const mastery = makeSolidKanaMastery(['の', 'む'])

    const cardNomu = makeMockCard({ id: 'v1', front: '飲む[のむ]', reading: 'のむ', category: 'vocabulary', status: 'new' })
    const cardTaberu = makeMockCard({ id: 'v2', front: '食べる[たべる]', reading: 'たべる', category: 'vocabulary', status: 'new' })

    expect(areCardPrerequisitesMet(cardNomu, mastery)).toBe(true)
    expect(areCardPrerequisitesMet(cardTaberu, mastery)).toBe(false)

    const plan = planDailySession({
      deck: [cardNomu, cardTaberu],
      kanaMastery: mastery,
      options: { newCardsPerDay: 5 },
      today: now,
    })

    expect(plan.newCards.length).toBe(1)
    expect(plan.newCards[0].id).toBe('v1')
  })

  it('Backlog safety: 31 pending reviews pauses new cards entirely (newCount = 0)', () => {
    // 31 reviews due
    const reviews: SRSCard[] = Array.from({ length: 31 }, (_, i) =>
      makeMockCard({
        id: `rev-${i}`,
        front: `Card ${i}`,
        reading: 'a',
        category: 'kana',
        status: 'review',
        dueDate: now - 1000,
        interval: 3,
        repetition: 2,
      })
    )
    const newKana = makeMockCard({ id: 'new-kana', front: 'う', reading: 'u', category: 'kana', status: 'new' })

    const plan = planDailySession({
      deck: [...reviews, newKana],
      kanaMastery: {},
      options: { newCardsPerDay: 5, backlogThreshold: 30 },
      today: now,
    })

    expect(plan.dueReviews.length).toBe(31)
    expect(plan.backlogPaused).toBe(true)
    expect(plan.newCount).toBe(0)
    expect(plan.newCards.length).toBe(0)
  })

  it('Plural strings format correctly for 0, 1, and many', () => {
    expect(formatPlural(0, 'review')).toBe('0 reviews')
    expect(formatPlural(1, 'review')).toBe('1 review')
    expect(formatPlural(2, 'review')).toBe('2 reviews')

    expect(formatPlural(0, 'new card')).toBe('0 new cards')
    expect(formatPlural(1, 'new card')).toBe('1 new card')
    expect(formatPlural(5, 'new card')).toBe('5 new cards')

    const plan1 = planDailySession({
      deck: [
        makeMockCard({ id: 'r1', status: 'review', dueDate: now - 1000 }),
        makeMockCard({ id: 'k1', category: 'kana', status: 'new' }),
      ],
      kanaMastery: {},
      options: { newCardsPerDay: 1 },
      today: now,
    })
    expect(plan1.reviewCountLabel).toBe('1 review')
    expect(plan1.newCountLabel).toBe('1 new')
    expect(plan1.summaryLabel).toBe('1 review + 1 new')
  })

  it('Seed deck migration: flags existing learned kanji cards as requiresKanaWarning without deleting them', () => {
    // Existing user has 飲む already in review status, but kanaMastery is empty
    const learnedCard = makeMockCard({
      id: 'v-learned',
      front: '飲む[のむ]',
      reading: 'のむ',
      category: 'vocabulary',
      status: 'review',
      dueDate: now - 5000,
    })

    const plan = planDailySession({
      deck: [learnedCard],
      kanaMastery: {},
      options: { newCardsPerDay: 5 },
      today: now,
    })

    // Must still be in due reviews (not deleted!)
    expect(plan.dueReviews.length).toBe(1)
    // But flagged with requiresKanaWarning
    expect(plan.dueReviews[0].requiresKanaWarning).toBe(true)
  })

  it('Enforces strict priority order in session queue: due reviews -> learning -> new kana -> new grammar -> vocab', () => {
    // Mastery with full hiragana solid
    const allGojuon = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ','ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ','を','ん']
    const mastery = makeSolidKanaMastery(allGojuon)

    const dueRev = makeMockCard({ id: 'due-1', status: 'review', dueDate: now - 1000 })
    const learningCard = makeMockCard({ id: 'learn-1', status: 'learning', dueDate: now - 500 })
    const newKana = makeMockCard({ id: 'new-k', category: 'kana', status: 'new' })
    const newGrammar = makeMockCard({ id: 'new-g', category: 'grammar', status: 'new', tags: ['N5'] })
    const newVocab = makeMockCard({ id: 'new-v', category: 'vocabulary', front: 'あめ', reading: 'あめ', status: 'new' })

    const plan = planDailySession({
      deck: [newVocab, dueRev, newGrammar, learningCard, newKana],
      kanaMastery: mastery,
      options: { newCardsPerDay: 10 },
      today: now,
    })

    const queueIds = plan.sessionQueue.map((c) => c.id)
    expect(queueIds).toEqual(['due-1', 'learn-1', 'new-k', 'new-g', 'new-v'])
  })
})
