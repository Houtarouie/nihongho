import { describe, it, expect, beforeEach } from 'vitest'
import { LocalRepository } from '@/lib/progress/local-repository'
import type { SRSCard } from '@/data/srs-deck'

// Mock browser window and localStorage for node test environment
const memoryStore: Record<string, string> = {}
if (typeof window === 'undefined') {
  ;(global as any).window = {}
  ;(global as any).localStorage = {
    getItem: (k: string) => memoryStore[k] ?? null,
    setItem: (k: string, v: string) => {
      memoryStore[k] = String(v)
    },
    removeItem: (k: string) => {
      delete memoryStore[k]
    },
    clear: () => {
      for (const k of Object.keys(memoryStore)) {
        delete memoryStore[k]
      }
    },
  }
}

describe('Phase B: Storage & Migration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes kana mastery map with all kana characters at Stage 0 for clean profile', async () => {
    const repo = new LocalRepository('test_user_clean')
    const mastery = await repo.getKanaMastery()

    expect(Object.keys(mastery).length).toBeGreaterThan(140)
    // All characters start at Stage 0
    const stages = Object.values(mastery).map((m) => m.stage)
    expect(stages.every((s) => s === 0)).toBe(true)
  })

  it('migrates existing studied cards so user never loses progress', async () => {
    const userId = 'test_user_migrated'
    const cardsKey = `nihongo_${userId}_srs_cards_v3`

    // Pre-populate an existing studied card in localStorage
    const existingCards: Partial<SRSCard>[] = [
      {
        id: 'vocab-1',
        front: '飲む',
        reading: 'のむ',
        category: 'vocabulary',
        repetition: 4,
        status: 'review',
        interval: 10,
      },
    ]
    localStorage.setItem(cardsKey, JSON.stringify(existingCards))

    const repo = new LocalRepository(userId)
    const mastery = await repo.getKanaMastery()

    // 'の' and 'む' should be migrated to at least Stage 2 (Familiar)
    expect(mastery['hira:の']?.stage).toBeGreaterThanOrEqual(2)
    expect(mastery['hira:む']?.stage).toBeGreaterThanOrEqual(2)
  })

  it('resetAllProgress clears all progress keys', async () => {
    const repo = new LocalRepository('test_reset_user')
    await repo.recordKanaAttempt({
      kanaId: 'hira:あ',
      mode: 'kana-to-romaji',
      correct: true,
    })

    let mastery = await repo.getKanaMastery()
    expect(mastery['hira:あ'].stage).toBe(1)

    await repo.resetAllProgress()

    // After reset, fresh getKanaMastery starts back at Stage 0
    const freshRepo = new LocalRepository('test_reset_user')
    mastery = await freshRepo.getKanaMastery()
    expect(mastery['hira:あ'].stage).toBe(0)
  })
})
