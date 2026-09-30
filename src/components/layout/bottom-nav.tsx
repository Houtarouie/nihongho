'use client'

import Link from 'next/link'
import {
  Home,
  GraduationCap,
  BookOpen,
  BookMarked,
  Layers,
  Users,
  User,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Kana', href: '/learn', icon: GraduationCap },
  { name: 'Grammar', href: '/grammar', icon: BookOpen },
  { name: 'Reading', href: '/reading', icon: BookMarked },
  { name: 'Anki SRS', href: '/practice', icon: Layers },
  { name: 'Social', href: '/community', icon: Users },
  { name: 'Profile', href: '/profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur px-1 md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] sm:text-xs font-medium transition-colors',
              isActive
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isActive && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
            )}
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="truncate max-w-[56px]">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
