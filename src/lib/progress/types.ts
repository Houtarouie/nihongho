import type {
  SRSCard,
  AnkiReviewLog,
  AnkiDeckOptions,
  UserStudyStats,
} from '@/data/srs-deck'
import type { WeakPointItem } from '@/data/weak-points'

export interface SyncResult {
  success: boolean
  pushedCards?: number
  pulledCards?: number
  pushedReviews?: number
  error?: string
}

export interface MigrationResult {
  migrated: boolean
  cardCount: number
  statsMigrated: boolean
  error?: string
}

export interface ProgressRepository {
  readonly userId: string

  // User Study Statistics
  getStats(): Promise<UserStudyStats>
  saveStats(stats: Partial<UserStudyStats>): Promise<UserStudyStats>

  // SRS Cards
  getCards(): Promise<SRSCard[]>
  saveCards(cards: SRSCard[]): Promise<void>
  upsertCards(incoming: SRSCard[]): Promise<{ allCards: SRSCard[]; addedCount: number }>

  // Review Logs
  logReview(log: Omit<AnkiReviewLog, 'id'>): Promise<void>
  getReviewLogs(): Promise<AnkiReviewLog[]>

  // Deck Options & Custom Decks
  getDeckOptions(): Promise<AnkiDeckOptions>
  saveDeckOptions(opts: Partial<AnkiDeckOptions>): Promise<AnkiDeckOptions>
  getCustomDecks(): Promise<string[]>
  saveCustomDecks(decks: string[]): Promise<void>

  // Weak Points
  getWeakPoints(): Promise<WeakPointItem[]>
  saveWeakPoints(list: WeakPointItem[]): Promise<void>

  // Learning Progress (Grammar & Kana)
  getMasteredGrammar(): Promise<string[]>
  saveMasteredGrammar(list: string[]): Promise<void>
  getReadKana(): Promise<string[]>
  saveReadKana(list: string[]): Promise<void>

  // Data Migration & Sync
  migrateLegacyData(): Promise<MigrationResult>
  syncRemote(): Promise<SyncResult>
}
