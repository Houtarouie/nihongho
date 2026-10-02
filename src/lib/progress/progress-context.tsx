'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import type {
  SRSCard,
  AnkiReviewLog,
  AnkiDeckOptions,
  UserStudyStats,
} from '@/data/srs-deck'
import {
  DEFAULT_USER_STATS,
  DEFAULT_DECK_OPTIONS,
} from '@/data/srs-deck'
import type { WeakPointItem } from '@/data/weak-points'
import { createClient } from '@/lib/supabase/client'
import { getSupabaseEnv } from '@/lib/supabase/config'
import type { ProgressRepository, SyncResult, MigrationResult } from './types'
import { LocalRepository } from './local-repository'
import { SupabaseRepository } from './supabase-repository'

interface ProgressContextValue {
  repository: ProgressRepository
  userId: string
  isGuest: boolean
  stats: UserStudyStats
  cards: SRSCard[]
  weakPoints: WeakPointItem[]
  deckOptions: AnkiDeckOptions
  isLoading: boolean
  isSyncing: boolean

  // Actions
  updateStats: (partial: Partial<UserStudyStats>) => Promise<UserStudyStats>
  updateCards: (cards: SRSCard[]) => Promise<void>
  upsertCards: (cards: SRSCard[]) => Promise<{ allCards: SRSCard[]; addedCount: number }>
  recordReview: (log: Omit<AnkiReviewLog, 'id'>) => Promise<void>
  addWeakPoint: (item: Omit<WeakPointItem, 'missCount' | 'lastMissed'>) => Promise<WeakPointItem>
  removeWeakPoint: (idOrFront: string) => Promise<void>
  syncNow: () => Promise<SyncResult>
  migrateLegacy: () => Promise<MigrationResult>
  refreshAll: () => Promise<void>
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>('guest')
  const [repository, setRepository] = useState<ProgressRepository>(() => new LocalRepository('guest'))
  const [stats, setStats] = useState<UserStudyStats>(DEFAULT_USER_STATS)
  const [cards, setCards] = useState<SRSCard[]>([])
  const [weakPoints, setWeakPoints] = useState<WeakPointItem[]>([])
  const [deckOptions, setDeckOptions] = useState<AnkiDeckOptions>(DEFAULT_DECK_OPTIONS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  const repoRef = useRef(repository)
  repoRef.current = repository

  // Refresh all state from current repository
  const refreshAll = useCallback(async (targetRepo?: ProgressRepository) => {
    const active = targetRepo || repoRef.current
    try {
      const [newStats, newCards, newWeak, newOpts] = await Promise.all([
        active.getStats(),
        active.getCards(),
        active.getWeakPoints(),
        active.getDeckOptions(),
      ])
      setStats(newStats)
      setCards(newCards)
      setWeakPoints(newWeak)
      setDeckOptions(newOpts)
    } catch {
      // ignore read error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Listen to Supabase Auth State and switch repository
  useEffect(() => {
    let isMounted = true
    const { isConfigured } = getSupabaseEnv()

    async function initAuth() {
      if (!isConfigured) {
        const guestRepo = new LocalRepository('guest')
        if (isMounted) {
          setUserId('guest')
          setRepository(guestRepo)
          await refreshAll(guestRepo)
        }
        return
      }

      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user?.id) {
          const userRepo = new SupabaseRepository(session.user.id)
          if (isMounted) {
            setUserId(session.user.id)
            setRepository(userRepo)
            await refreshAll(userRepo)
          }
        } else {
          const guestRepo = new LocalRepository('guest')
          if (isMounted) {
            setUserId('guest')
            setRepository(guestRepo)
            await refreshAll(guestRepo)
          }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            if (!isMounted) return
            if (session?.user?.id) {
              const userRepo = new SupabaseRepository(session.user.id)
              setUserId(session.user.id)
              setRepository(userRepo)
              await refreshAll(userRepo)
            } else {
              const guestRepo = new LocalRepository('guest')
              setUserId('guest')
              setRepository(guestRepo)
              await refreshAll(guestRepo)
            }
          }
        )

        return () => subscription.unsubscribe()
      } catch {
        const guestRepo = new LocalRepository('guest')
        if (isMounted) {
          setUserId('guest')
          setRepository(guestRepo)
          await refreshAll(guestRepo)
        }
      }
    }

    const unsubPromise = initAuth()
    return () => {
      isMounted = false
      unsubPromise.then((unsub) => unsub?.())
    }
  }, [refreshAll])

  // Backward-compatibility bridge: synchronize on legacy CustomEvents if triggered
  useEffect(() => {
    function handleLegacyStats() {
      repoRef.current.getStats().then(setStats).catch(() => {})
    }
    function handleLegacyWeak() {
      repoRef.current.getWeakPoints().then(setWeakPoints).catch(() => {})
    }
    window.addEventListener('nihongo-stats-updated', handleLegacyStats)
    window.addEventListener('nihongo-weak-points-updated', handleLegacyWeak)
    return () => {
      window.removeEventListener('nihongo-stats-updated', handleLegacyStats)
      window.removeEventListener('nihongo-weak-points-updated', handleLegacyWeak)
    }
  }, [])

  // Actions
  const updateStats = useCallback(async (partial: Partial<UserStudyStats>): Promise<UserStudyStats> => {
    const updated = await repoRef.current.saveStats(partial)
    setStats(updated)
    // Dispatch for legacy consumers
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('nihongo-stats-updated'))
    }
    return updated
  }, [])

  const updateCards = useCallback(async (newCards: SRSCard[]): Promise<void> => {
    await repoRef.current.saveCards(newCards)
    setCards(newCards)
  }, [])

  const upsertCards = useCallback(async (incoming: SRSCard[]) => {
    const res = await repoRef.current.upsertCards(incoming)
    setCards(res.allCards)
    return res
  }, [])

  const recordReview = useCallback(async (log: Omit<AnkiReviewLog, 'id'>): Promise<void> => {
    await repoRef.current.logReview(log)
  }, [])

  const addWeakPoint = useCallback(
    async (item: Omit<WeakPointItem, 'missCount' | 'lastMissed'>): Promise<WeakPointItem> => {
      const list = await repoRef.current.getWeakPoints()
      const existingIdx = list.findIndex((w) => w.id === item.id || w.front === item.front)
      const now = Date.now()

      let resultItem: WeakPointItem
      if (existingIdx >= 0) {
        list[existingIdx] = {
          ...list[existingIdx],
          ...item,
          missCount: (list[existingIdx].missCount || 1) + 1,
          lastMissed: now,
        }
        resultItem = list[existingIdx]
      } else {
        resultItem = {
          ...item,
          missCount: 1,
          lastMissed: now,
        }
        list.unshift(resultItem)
      }

      await repoRef.current.saveWeakPoints(list)
      setWeakPoints(list)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('nihongo-weak-points-updated'))
      }
      return resultItem
    },
    []
  )

  const removeWeakPoint = useCallback(async (idOrFront: string): Promise<void> => {
    const list = await repoRef.current.getWeakPoints()
    const filtered = list.filter((w) => w.id !== idOrFront && w.front !== idOrFront)
    await repoRef.current.saveWeakPoints(filtered)
    setWeakPoints(filtered)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('nihongo-weak-points-updated'))
    }
  }, [])

  const syncNow = useCallback(async (): Promise<SyncResult> => {
    setIsSyncing(true)
    try {
      const res = await repoRef.current.syncRemote()
      await refreshAll()
      return res
    } finally {
      setIsSyncing(false)
    }
  }, [refreshAll])

  const migrateLegacy = useCallback(async (): Promise<MigrationResult> => {
    const res = await repoRef.current.migrateLegacyData()
    await refreshAll()
    return res
  }, [refreshAll])

  const value: ProgressContextValue = {
    repository,
    userId,
    isGuest: userId === 'guest',
    stats,
    cards,
    weakPoints,
    deckOptions,
    isLoading,
    isSyncing,
    updateStats,
    updateCards,
    upsertCards,
    recordReview,
    addWeakPoint,
    removeWeakPoint,
    syncNow,
    migrateLegacy,
    refreshAll,
  }

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) {
    throw new Error('useProgress must be used within a ProgressProvider')
  }
  return ctx
}
