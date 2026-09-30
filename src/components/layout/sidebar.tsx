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
import { ThemeToggle } from '@/components/layout/theme-toggle'

const navItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Learn Kana', href: '/learn', icon: GraduationCap },
  { name: 'Grammar', href: '/grammar', icon: BookOpen },
  { name: 'Reading & Vocab', href: '/reading', icon: BookMarked },
  { name: 'Anki SRS', href: '/practice', icon: Layers },
  { name: 'Community', href: '/community', icon: Users },
  { name: 'Profile', href: '/profile', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 flex-col border-r bg-background md:flex h-screen sticky top-0">
      <div className="flex h-14 items-center justify-between border-b px-4 py-4 lg:h-[60px] lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-xl font-bold text-primary">Nihongo</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            Anki
          </span>
        </Link>
        <ThemeToggle />
      </div>
      <div className="flex-1 overflow-auto py-3">
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
    </aside>
  )
}
