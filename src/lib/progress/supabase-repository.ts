import type {
  SRSCard,
  AnkiReviewLog,
  AnkiDeckOptions,
  UserStudyStats,
} from '@/data/srs-deck'
import type { WeakPointItem } from '@/data/weak-points'
import { createClient } from '@/lib/supabase/client'
import { getSupabaseEnv } from '@/lib/supabase/config'
import { LocalRepository } from './local-repository'
import type { KanaMasteryRecord, QuizModeType } from '@/lib/kana/types'
import type {
  ProgressRepository,
  MigrationResult,
  SyncResult,
} from './types'

export class SupabaseRepository implements ProgressRepository {
  readonly userId: string
  private readonly local: LocalRepository
  private remoteTablesAvailable: boolean | null = null

  constructor(userId: string) {
    this.userId = userId
    this.local = new LocalRepository(userId)
  }

  private isOnline(): boolean {
    if (typeof window === 'undefined') return false
    return navigator.onLine && getSupabaseEnv().isConfigured
  }

  // Delegated local reads with optional background remote sync
  async getStats(): Promise<UserStudyStats> {
    const localStats = await this.local.getStats()
    if (!this.isOnline()) return localStats

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.userId)
        .maybeSingle()

      if (error) {
        if (error.code === '42P01' || error.message.includes('404')) {
          this.remoteTablesAvailable = false
        }
        return localStats
      }

      if (data) {
        this.remoteTablesAvailable = true
        // Reconcile remote profile fields into stats
        const merged: UserStudyStats = {
          ...localStats,
          displayName: data.display_name || localStats.displayName,
          username: data.username || localStats.username,
          avatar: data.avatar_url || localStats.avatar,
          bio: data.bio || localStats.bio,
          currentStreak: Math.max(data.current_streak || 0, localStats.currentStreak),
          longestStreak: Math.max(data.longest_streak || 0, localStats.longestStreak),
          xp: Math.max(data.xp || 0, localStats.xp),
          targetJlpt: data.target_jlpt_level || localStats.targetJlpt,
          totalStudyMins: Math.max(data.total_study_time_mins || 0, localStats.totalStudyMins),
        }
        await this.local.saveStats(merged)
        return merged
      }
    } catch {
      // ignore network errors and return local
    }

    return localStats
  }

  async saveStats(stats: Partial<UserStudyStats>): Promise<UserStudyStats> {
    const updated = await this.local.saveStats(stats)
    if (!this.isOnline() || this.remoteTablesAvailable === false) return updated

    try {
      const supabase = createClient()
      await supabase
        .from('profiles')
        .update({
          display_name: updated.displayName,
          avatar_url: updated.avatar,
          bio: updated.bio,
          current_streak: updated.currentStreak,
          longest_streak: updated.longestStreak,
          xp: updated.xp,
          target_jlpt_level: updated.targetJlpt,
          total_study_time_mins: updated.totalStudyMins,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.userId)
    } catch {
      // Non-blocking background sync failure
    }

    return updated
  }

  // Cards
  async getCards(): Promise<SRSCard[]> {
    return this.local.getCards()
  }

  async saveCards(cards: SRSCard[]): Promise<void> {
    await this.local.saveCards(cards)
  }

  async upsertCards(incoming: SRSCard[]): Promise<{ allCards: SRSCard[]; addedCount: number }> {
    return this.local.upsertCards(incoming)
  }

  // Review Logs
  async logReview(log: Omit<AnkiReviewLog, 'id'>): Promise<void> {
    await this.local.logReview(log)
    if (!this.isOnline() || this.remoteTablesAvailable === false) return

    try {
      const supabase = createClient()
      await supabase.from('review_logs').insert({
        user_id: this.userId,
        card_id: log.cardId,
        rating: log.rating,
        interval: log.interval,
        timestamp: log.timestamp,
      })
    } catch {
      // Non-blocking log sync
    }
  }

  async getReviewLogs(): Promise<AnkiReviewLog[]> {
    return this.local.getReviewLogs()
  }

  // Deck Options & Custom Decks
  async getDeckOptions(): Promise<AnkiDeckOptions> {
    return this.local.getDeckOptions()
  }

  async saveDeckOptions(opts: Partial<AnkiDeckOptions>): Promise<AnkiDeckOptions> {
    return this.local.saveDeckOptions(opts)
  }

  async getCustomDecks(): Promise<string[]> {
    return this.local.getCustomDecks()
  }

  async saveCustomDecks(decks: string[]): Promise<void> {
    return this.local.saveCustomDecks(decks)
  }

  // Weak Points
  async getWeakPoints(): Promise<WeakPointItem[]> {
    return this.local.getWeakPoints()
  }

  async saveWeakPoints(list: WeakPointItem[]): Promise<void> {
    return this.local.saveWeakPoints(list)
  }

  // Grammar & Kana Progress
  async getMasteredGrammar(): Promise<string[]> {
    return this.local.getMasteredGrammar()
  }

  async saveMasteredGrammar(list: string[]): Promise<void> {
    return this.local.saveMasteredGrammar(list)
  }

  async getReadKana(): Promise<string[]> {
    return this.local.getReadKana()
  }

  async saveReadKana(list: string[]): Promise<void> {
    return this.local.saveReadKana(list)
  }

  // Migration
  async migrateLegacyData(): Promise<MigrationResult> {
    return this.local.migrateLegacyData()
  }

  // Remote Sync: pushes local cards, review logs, and stats to Supabase
  async syncRemote(): Promise<SyncResult> {
    if (!this.isOnline()) {
      return { success: false, error: 'Offline or Supabase not configured' }
    }

    try {
      const supabase = createClient()
      const stats = await this.local.getStats()
      const cards = await this.local.getCards()

      // 1. Sync Profile Stats
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: this.userId,
          username: stats.username || `user_${this.userId.slice(0, 8)}`,
          display_name: stats.displayName,
          avatar_url: stats.avatar,
          bio: stats.bio,
          current_streak: stats.currentStreak,
          longest_streak: stats.longestStreak,
          xp: stats.xp,
          target_jlpt_level: stats.targetJlpt,
          total_study_time_mins: stats.totalStudyMins,
          updated_at: new Date().toISOString(),
        })

      if (profileError) {
        if (profileError.code === '42P01') {
          this.remoteTablesAvailable = false
          return {
            success: false,
            error: 'Supabase tables (schema.sql) not yet initialized in database',
          }
        }
        return { success: false, error: profileError.message }
      }

      this.remoteTablesAvailable = true

      // 2. Sync User Cards if user_cards table is present
      const { error: cardsError } = await supabase
        .from('user_cards')
        .upsert(
          cards.map((c) => ({
            id: `${this.userId}_${c.id}`,
            user_id: this.userId,
            card_id: c.id,
            deck_name: c.deckName,
            category: c.category,
            jlpt_level: c.jlptLevel,
            front: c.front,
            reading: c.reading,
            meaning: c.meaning,
            note_type: c.noteType,
            interval: c.interval,
            repetition: c.repetition,
            efactor: c.efactor,
            stability: c.stability,
            difficulty: c.difficulty,
            due_date: c.dueDate,
            status: c.status,
            tags: c.tags,
            lapses: c.lapses,
            flag: c.flag,
            updated_at: new Date().toISOString(),
          }))
        )

      return {
        success: true,
        pushedCards: cardsError ? 0 : cards.length,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown sync error'
      return { success: false, error: msg }
    }
  }

  // Kana Mastery Tracking (Phase B)
  async getKanaMastery(): Promise<Record<string, KanaMasteryRecord>> {
    return this.local.getKanaMastery()
  }

  async saveKanaMastery(map: Record<string, KanaMasteryRecord>): Promise<void> {
    return this.local.saveKanaMastery(map)
  }

  async recordKanaAttempt(params: {
    kanaId: string
    mode: QuizModeType | 'srs'
    correct: boolean
    responseMs?: number
    source?: string
    pickedKanaId?: string
    now?: number
  }): Promise<KanaMasteryRecord> {
    return this.local.recordKanaAttempt(params)
  }

  async resetAllProgress(): Promise<void> {
    return this.local.resetAllProgress()
  }
}
