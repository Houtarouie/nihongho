'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Home,
  GraduationCap,
  BookOpen,
  BookMarked,
  Layers,
  Users,
  User,
  Flame,
  Sparkles,
  Clock,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import {
  loadUserStats,
  DEFAULT_USER_STATS,
  type UserStudyStats,
} from '@/data/srs-deck'

const navItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Learn Kana', href: '/learn', icon: GraduationCap },
  { name: 'Grammar', href: '/grammar', icon: BookOpen },
  { name: 'Reading & Vocab', href: '/reading', icon: BookMarked },
  { name: 'Anki SRS', href: '/practice', icon: Layers },
  { name: 'Community & League', href: '/community', icon: Users },
  { name: 'Profile & Settings', href: '/profile', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
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
    <aside className="hidden w-64 flex-col border-r bg-background md:flex h-screen sticky top-0 justify-between">
      <div>
        <div className="flex h-14 items-center justify-between border-b px-4 py-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="text-xl font-bold text-primary">Nihongo</span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              Anki
            </span>
          </Link>
          <ThemeToggle />
        </div>
        <div className="py-3">
          <nav className="grid items-start gap-1 px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted/60'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* User Live Status & Time Tracker Footer */}
      <div className="p-3 border-t bg-muted/20">
        <Link
          href="/profile"
          className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/60 transition-all border border-border/50"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-lg shrink-0">
              {stats.avatar || '🌸'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{stats.displayName}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3 text-blue-500 animate-pulse" />
                {stats.totalStudyMins}m studied
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-orange-500">
              <Flame className="h-3.5 w-3.5 fill-orange-500" />
              {stats.currentStreak}d
            </span>
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
              <Sparkles className="h-2.5 w-2.5" />
              {stats.xp} XP
            </span>
          </div>
        </Link>
      </div>
    </aside>
  )
}
