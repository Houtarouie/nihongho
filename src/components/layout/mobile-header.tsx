'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Flame, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import {
  loadUserStats,
  DEFAULT_USER_STATS,
  type UserStudyStats,
} from '@/data/srs-deck'

export function MobileHeader() {
  const [stats, setStats] = useState<UserStudyStats>(DEFAULT_USER_STATS)

  useEffect(() => {
    function sync() {
      setStats(loadUserStats())
    }
    sync()
    window.addEventListener('nihongo-stats-updated', sync)
    return () => window.removeEventListener('nihongo-stats-updated', sync)
  }, [])

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="text-lg font-bold text-primary">Nihongo</span>
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          Anki SRS
        </span>
      </Link>

      <div className="flex items-center gap-1.5">
        <Link
          href="/profile"
          className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-sm"
          title="Profile"
        >
          {stats.avatar || '🌸'}
        </Link>
        <div className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-500">
          <Flame className="h-3.5 w-3.5 fill-orange-500" />
          <span>{stats.currentStreak}d</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
          <Sparkles className="h-3 w-3" />
          <span>{stats.xp}</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
