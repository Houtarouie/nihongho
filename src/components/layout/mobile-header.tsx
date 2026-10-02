'use client'

import React from 'react'
import Link from 'next/link'
import { Flame, Search } from 'lucide-react'
import { useProgress } from '@/lib/progress'
import { AvatarMenu } from '@/components/layout/avatar-menu'

export function MobileHeader() {
  const { stats } = useProgress()

  function handleOpenSearch() {
    window.dispatchEvent(new CustomEvent('open-omni-search'))
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:hidden">
      <Link href="/today" className="flex items-center gap-2">
        <span className="text-lg font-bold text-primary tracking-tight">Nihongo</span>
      </Link>

      <div className="flex items-center gap-2.5">
        <button
          onClick={handleOpenSearch}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border"
          aria-label="Open search dialog"
        >
          <Search className="h-4 w-4" />
        </button>

        {stats.currentStreak > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-500">
            <Flame className="h-3.5 w-3.5 fill-orange-500" />
            <span>{stats.currentStreak}d</span>
          </div>
        )}
        <AvatarMenu />
      </div>
    </header>
  )
}
