'use client'

import React from 'react'
import Link from 'next/link'
import { Flame } from 'lucide-react'
import { useProgress } from '@/lib/progress'
import { AvatarMenu } from '@/components/layout/avatar-menu'

export function MobileHeader() {
  const { stats } = useProgress()

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:hidden">
      <Link href="/today" className="flex items-center gap-2">
        <span className="text-lg font-bold text-primary tracking-tight">Nihongo</span>
      </Link>

      <div className="flex items-center gap-2.5">
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
