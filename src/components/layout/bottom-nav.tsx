'use client'

import React from 'react'
import Link from 'next/link'
import {
  CalendarCheck,
  Compass,
  Layers,
  BookOpen,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Today', href: '/today', icon: CalendarCheck },
  { name: 'Path', href: '/path', icon: Compass },
  { name: 'Review', href: '/review', icon: Layers },
  { name: 'Library', href: '/library', icon: BookOpen },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 pb-[env(safe-area-inset-bottom)] items-center justify-around border-t bg-background/95 backdrop-blur px-2 md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[48px] px-3 py-1 text-xs font-medium transition-colors rounded-xl',
              isActive
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isActive && (
              <span className="absolute top-0 h-1 w-10 rounded-full bg-primary" />
            )}
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-[11px] leading-tight font-medium tracking-tight">
              {item.name}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
