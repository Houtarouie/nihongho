import type {
  SRSCard,
  AnkiReviewLog,
  AnkiDeckOptions,
  UserStudyStats,
} from '@/data/srs-deck'
import {
  DEFAULT_SRS_CARDS,
  DEFAULT_DECK_OPTIONS,
  DEFAULT_USER_STATS,
  CATEGORY_TO_DECK,
  getLocalTodayDate,
  getLocalYesterdayDate,
} from '@/data/srs-deck'
import type { WeakPointItem } from '@/data/weak-points'
import type {
  ProgressRepository,
  MigrationResult,
  SyncResult,
} from './types'

// Legacy un-namespaced storage keys for automatic migration
const LEGACY_KEYS = {
  cards: 'nihongo_srs_cards_v2',
  stats: 'nihongo_user_stats_v1',
  options: 'nihongo_anki_options_v1',
  revlog: 'nihongo_anki_revlog_v1',
  weakPoints: 'nihongo_weak_points_v1',
  customDecks: 'nihongo_custom_anki_decks_v1',
  masteredGrammar: 'nihongo_mastered_grammar_v1',
  readKana: 'nihongo_read_kana_chars_v1',
} as const

export class LocalRepository implements ProgressRepository {
  readonly userId: string

  private readonly keys: {
    cards: string
    stats: string
    options: string
    revlog: string
    weakPoints: string
    customDecks: string
    masteredGrammar: string
    readKana: string
    migrated: string
  }

  constructor(rawUserId?: string | null) {
    const cleanId = rawUserId
      ? rawUserId.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
      : 'guest'
    this.userId = cleanId || 'guest'

    this.keys = {
      cards: `nihongo_${this.userId}_srs_cards_v3`,
      stats: `nihongo_${this.userId}_user_stats_v2`,
      options: `nihongo_${this.userId}_deck_options_v2`,
      revlog: `nihongo_${this.userId}_review_logs_v2`,
      weakPoints: `nihongo_${this.userId}_weak_points_v2`,
      customDecks: `nihongo_${this.userId}_custom_decks_v2`,
      masteredGrammar: `nihongo_${this.userId}_mastered_grammar_v2`,
      readKana: `nihongo_${this.userId}_read_kana_v2`,
      migrated: `nihongo_${this.userId}_migrated_v1`,
    }

    // Attempt passive migration on client initialization
    if (typeof window !== 'undefined') {
      this.checkAndMigrateLegacyData()
    }
  }

  private isClient(): boolean {
    return typeof window !== 'undefined'
  }

  private getItem<T>(key: string): T | null {
    if (!this.isClient()) return null
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (!this.isClient()) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore storage quota or private browsing errors
    }
  }

  /**
   * One-time automated migration: If user-namespaced cards do not exist,
   * look for legacy un-namespaced keys and migrate them over seamlessly.
   */
  private checkAndMigrateLegacyData() {
    if (this.getItem<boolean>(this.keys.migrated)) return
    try {
      const legacyCards = localStorage.getItem(LEGACY_KEYS.cards)
      const legacyStats = localStorage.getItem(LEGACY_KEYS.stats)
      const legacyOptions = localStorage.getItem(LEGACY_KEYS.options)
      const legacyRevlog = localStorage.getItem(LEGACY_KEYS.revlog)
      const legacyWeak = localStorage.getItem(LEGACY_KEYS.weakPoints)
      const legacyDecks = localStorage.getItem(LEGACY_KEYS.customDecks)
      const legacyGrammar = localStorage.getItem(LEGACY_KEYS.masteredGrammar)
      const legacyKana = localStorage.getItem(LEGACY_KEYS.readKana)

      if (legacyCards && !localStorage.getItem(this.keys.cards)) {
        localStorage.setItem(this.keys.cards, legacyCards)
      }
      if (legacyStats && !localStorage.getItem(this.keys.stats)) {
        localStorage.setItem(this.keys.stats, legacyStats)
      }
      if (legacyOptions && !localStorage.getItem(this.keys.options)) {
        localStorage.setItem(this.keys.options, legacyOptions)
      }
      if (legacyRevlog && !localStorage.getItem(this.keys.revlog)) {
        localStorage.setItem(this.keys.revlog, legacyRevlog)
      }
      if (legacyWeak && !localStorage.getItem(this.keys.weakPoints)) {
        localStorage.setItem(this.keys.weakPoints, legacyWeak)
      }
      if (legacyDecks && !localStorage.getItem(this.keys.customDecks)) {
        localStorage.setItem(this.keys.customDecks, legacyDecks)
      }
      if (legacyGrammar && !localStorage.getItem(this.keys.masteredGrammar)) {
        localStorage.setItem(this.keys.masteredGrammar, legacyGrammar)
      }
      if (legacyKana && !localStorage.getItem(this.keys.readKana)) {
        localStorage.setItem(this.keys.readKana, legacyKana)
      }

      this.setItem(this.keys.migrated, true)
    } catch {
      // ignore migration error
    }
  }

  async migrateLegacyData(): Promise<MigrationResult> {
    this.checkAndMigrateLegacyData()
    const cards = await this.getCards()
    return {
      migrated: true,
      cardCount: cards.length,
      statsMigrated: true,
    }
  }

  // User Study Statistics
  async getStats(): Promise<UserStudyStats> {
    const stored = this.getItem<Partial<UserStudyStats>>(this.keys.stats)
    if (!stored) return { ...DEFAULT_USER_STATS }

    const base: UserStudyStats = {
      ...DEFAULT_USER_STATS,
      ...stored,
      totalStudyMins:
        typeof stored.totalStudyMins === 'number'
          ? stored.totalStudyMins
          : DEFAULT_USER_STATS.totalStudyMins,
      todayStudySeconds:
        typeof stored.todayStudySeconds === 'number'
          ? stored.todayStudySeconds
          : 0,
      weeklyXp:
        typeof stored.weeklyXp === 'number'
          ? stored.weeklyXp
          : stored.xp || DEFAULT_USER_STATS.weeklyXp,
      currentStreak:
        typeof stored.currentStreak === 'number'
          ? stored.currentStreak
          : DEFAULT_USER_STATS.currentStreak,
      xp: typeof stored.xp === 'number' ? stored.xp : DEFAULT_USER_STATS.xp,
    }

    // Verify streak gap based on local timezone boundaries
    const today = getLocalTodayDate()
    const yesterday = getLocalYesterdayDate()
    if (
      base.lastStudyDate &&
      base.lastStudyDate !== today &&
      base.lastStudyDate !== yesterday
    ) {
      base.currentStreak = 0
      base.reviewsCompletedToday = 0
    } else if (base.lastStudyDate !== today) {
      base.reviewsCompletedToday = 0
    }

    return base
  }

  async saveStats(stats: Partial<UserStudyStats>): Promise<UserStudyStats> {
    const current = await this.getStats()
    const updated: UserStudyStats = { ...current, ...stats }
    this.setItem(this.keys.stats, updated)
    return updated
  }

  // SRS Cards
  async getCards(): Promise<SRSCard[]> {
    const stored = this.getItem<SRSCard[]>(this.keys.cards)
    if (Array.isArray(stored) && stored.length > 0) {
      return stored.map((c) => ({
        ...c,
        deckName: c.deckName || CATEGORY_TO_DECK[c.category] || 'Japanese::Default',
        noteType: c.noteType || 'basic',
        flag: c.flag ?? 0,
        queue: c.queue || 'active',
        lapses: c.lapses ?? 0,
        tags: c.tags || [c.jlptLevel, c.category],
        stability: c.stability ?? Math.max(1, c.interval || 1),
        difficulty: c.difficulty ?? 5.0,
      }))
    }

    // If empty or never seeded, initialize with DEFAULT_SRS_CARDS
    const now = Date.now()
    const initialized: SRSCard[] = DEFAULT_SRS_CARDS.map((card) => ({
      ...card,
      deckName: card.deckName || CATEGORY_TO_DECK[card.category],
      noteType: card.noteType || 'basic',
      flag: 0,
      queue: 'active',
      lapses: 0,
      tags: card.tags || [card.jlptLevel, card.category],
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      stability: 1.0,
      difficulty: 5.0,
      dueDate: now,
      status: 'new',
    }))
    this.setItem(this.keys.cards, initialized)
    return initialized
  }

  async saveCards(cards: SRSCard[]): Promise<void> {
    this.setItem(this.keys.cards, cards)
  }

  async upsertCards(incoming: SRSCard[]): Promise<{ allCards: SRSCard[]; addedCount: number }> {
    const existing = await this.getCards()
    const existingMap = new Map<string, SRSCard>()
    existing.forEach((c) => existingMap.set(c.id, c))

    let addedCount = 0
    incoming.forEach((inc) => {
      if (!existingMap.has(inc.id)) {
        addedCount++
      }
      existingMap.set(inc.id, inc)
    })

    const allCards = Array.from(existingMap.values())
    await this.saveCards(allCards)
    return { allCards, addedCount }
  }

  // Review Logs
  async logReview(log: Omit<AnkiReviewLog, 'id'>): Promise<void> {
    const existing = await this.getReviewLogs()
    const fullLog: AnkiReviewLog = {
      ...log,
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }
    existing.push(fullLog)
    // Keep max 3,000 historical logs in local storage
    this.setItem(this.keys.revlog, existing.slice(-3000))
  }

  async getReviewLogs(): Promise<AnkiReviewLog[]> {
    const stored = this.getItem<AnkiReviewLog[]>(this.keys.revlog)
    return Array.isArray(stored) ? stored : []
  }

  // Deck Options & Custom Decks
  async getDeckOptions(): Promise<AnkiDeckOptions> {
    const stored = this.getItem<AnkiDeckOptions>(this.keys.options)
    return stored ? { ...DEFAULT_DECK_OPTIONS, ...stored } : { ...DEFAULT_DECK_OPTIONS }
  }

  async saveDeckOptions(opts: Partial<AnkiDeckOptions>): Promise<AnkiDeckOptions> {
    const current = await this.getDeckOptions()
    const updated = { ...current, ...opts }
    this.setItem(this.keys.options, updated)
    return updated
  }

  async getCustomDecks(): Promise<string[]> {
    const stored = this.getItem<string[]>(this.keys.customDecks)
    return Array.isArray(stored) ? stored : []
  }

  async saveCustomDecks(decks: string[]): Promise<void> {
    this.setItem(this.keys.customDecks, decks)
  }

  // Weak Points
  async getWeakPoints(): Promise<WeakPointItem[]> {
    const stored = this.getItem<WeakPointItem[]>(this.keys.weakPoints)
    return Array.isArray(stored) ? stored : []
  }

  async saveWeakPoints(list: WeakPointItem[]): Promise<void> {
    this.setItem(this.keys.weakPoints, list)
  }

  // Grammar & Kana Progress
  async getMasteredGrammar(): Promise<string[]> {
    const stored = this.getItem<string[]>(this.keys.masteredGrammar)
    return Array.isArray(stored) ? stored : []
  }

  async saveMasteredGrammar(list: string[]): Promise<void> {
    this.setItem(this.keys.masteredGrammar, list)
  }

  async getReadKana(): Promise<string[]> {
    const stored = this.getItem<string[]>(this.keys.readKana)
    return Array.isArray(stored) ? stored : []
  }

  async saveReadKana(list: string[]): Promise<void> {
    this.setItem(this.keys.readKana, list)
  }

  // Remote Sync (No-op in LocalRepository)
  async syncRemote(): Promise<SyncResult> {
    return { success: true }
  }
}
