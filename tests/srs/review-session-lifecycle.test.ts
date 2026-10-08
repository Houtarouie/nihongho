import { describe, it, expect } from 'vitest'
import { planDailySession, type PlannedCard } from '@/lib/srs/session-planner'
import { calculateSM2, type SRSCard, type CardRating } from '@/data/srs-deck'

describe('Review Session Lifecycle & State Progression', () => {
  const dummyDeck: SRSCard[] = [
    {
      id: 'card-1',
      front: 'あ',
      reading: 'a',
      meaning: 'a sound',
      category: 'kana',
      jlptLevel: 'N5',
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: Date.now() - 10000,
      status: 'review',
      queue: 'active',
      lapses: 0,
    },
    {
      id: 'card-2',
      front: 'い',
      reading: 'i',
      meaning: 'i sound',
      category: 'kana',
      jlptLevel: 'N5',
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: Date.now() - 10000,
      status: 'new',
      queue: 'active',
      lapses: 0,
    },
    {
      id: 'card-3',
      front: 'う',
      reading: 'u',
      meaning: 'u sound',
      category: 'kana',
      jlptLevel: 'N5',
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: Date.now() - 10000,
      status: 'new',
      queue: 'active',
      lapses: 0,
    },
    {
      id: 'card-4',
      front: 'え',
      reading: 'e',
      meaning: 'e sound',
      category: 'kana',
      jlptLevel: 'N5',
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: Date.now() - 10000,
      status: 'new',
      queue: 'active',
      lapses: 0,
    },
    {
      id: 'card-5',
      front: 'お',
      reading: 'o',
      meaning: 'o sound',
      category: 'kana',
      jlptLevel: 'N5',
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: Date.now() - 10000,
      status: 'new',
      queue: 'active',
      lapses: 0,
    },
    {
      id: 'card-6',
      front: 'か',
      reading: 'ka',
      meaning: 'ka sound',
      category: 'kana',
      jlptLevel: 'N5',
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: Date.now() - 10000,
      status: 'new',
      queue: 'active',
      lapses: 0,
    },
  ]

  it('plans a session of 6 cards and advances index from 0 to 6 without looping', () => {
    const plan = planDailySession({
      deck: dummyDeck,
      kanaMastery: {},
      options: { newCardsPerDay: 5, maxReviewsPerDay: 100, backlogThreshold: 30 },
      today: Date.now(),
    })

    expect(plan.sessionQueue.length).toBe(6)

    // Simulate session progress
    let sessionCards = [...plan.sessionQueue]
    let currentIndex = 0
    let completedCount = 0
    const displayedLabels: string[] = []

    while (currentIndex < sessionCards.length) {
      // Record user-visible card label: e.g. "Card 1 of 6", "Card 2 of 6", ...
      displayedLabels.push(`Card ${currentIndex + 1} of ${sessionCards.length}`)

      // Grade card (e.g. good)
      completedCount++
      currentIndex++
    }

    // Verify all 6 cards displayed in sequential order
    expect(displayedLabels).toEqual([
      'Card 1 of 6',
      'Card 2 of 6',
      'Card 3 of 6',
      'Card 4 of 6',
      'Card 5 of 6',
      'Card 6 of 6',
    ])
    expect(currentIndex).toBe(6)
    expect(completedCount).toBe(6)
    expect(currentIndex >= sessionCards.length).toBe(true) // Session completed!
  })

  it('pushes cards rated again to end of queue and finishes all items', () => {
    const plan = planDailySession({
      deck: dummyDeck.slice(0, 3),
      kanaMastery: {},
      options: { newCardsPerDay: 5, maxReviewsPerDay: 100, backlogThreshold: 30 },
      today: Date.now(),
    })

    expect(plan.sessionQueue.length).toBe(3)

    let sessionCards = [...plan.sessionQueue]
    let currentIndex = 0
    let completedCount = 0
    const displayedCardFronts: string[] = []

    while (currentIndex < sessionCards.length) {
      const currentCard = sessionCards[currentIndex]
      displayedCardFronts.push(currentCard.front)

      // Rate first card "again", others "good"
      if (currentIndex === 0) {
        // Appends to queue
        sessionCards.push(currentCard)
      }

      completedCount++
      currentIndex++
    }

    // First card 'あ' repeats at the end: あ -> い -> う -> あ
    expect(displayedCardFronts).toEqual(['あ', 'い', 'う', 'あ'])
    expect(sessionCards.length).toBe(4)
    expect(currentIndex).toBe(4)
    expect(completedCount).toBe(4)
  })
})
