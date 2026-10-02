'use client'

import React from 'react'
import Link from 'next/link'
import {
  CalendarCheck,
  Compass,
  Layers,
  BookOpen,
  Flame,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useProgress } from '@/lib/progress'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { AvatarMenu } from '@/components/layout/avatar-menu'

const navItems = [
  { name: 'Today', href: '/today', icon: CalendarCheck },
  { name: 'Path', href: '/path', icon: Compass },
  { name: 'Review', href: '/review', icon: Layers },
  { name: 'Library', href: '/library', icon: BookOpen },
]

export function Sidebar() {
  const pathname = usePathname()
  const { stats } = useProgress()

  return (
    <aside className="hidden w-64 flex-col border-r bg-background md:flex h-screen sticky top-0 justify-between">
      <div>
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b px-4 py-4 lg:h-[60px] lg:px-6">
          <Link href="/today" className="flex items-center gap-2 font-bold">
            <span className="text-xl tracking-tight text-primary">Nihongo</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Navigation Links */}
        <div className="py-4">
          <nav className="grid items-start gap-1 px-3 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary font-bold shadow-xs'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Clean User Status Footer with AvatarMenu trigger */}
      <div className="p-3 border-t bg-muted/20">
        <AvatarMenu
          align="left"
          trigger={
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-background/80 hover:bg-muted/60 hover:border-primary/40 transition-all cursor-pointer">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-base shrink-0">
                  {stats.avatar || '🌸'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold truncate">{stats.displayName || 'Learner'}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {stats.totalStudyMins}m studied
                  </p>
                </div>
              </div>
              {stats.currentStreak > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-500">
                  <Flame className="h-3.5 w-3.5 fill-orange-500" />
                  <span>{stats.currentStreak}d</span>
                </div>
              )}
            </div>
          }
        />
      </div>
    </aside>
  )
}
