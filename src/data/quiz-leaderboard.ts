import { loadUserStats, type UserStudyStats } from '@/data/srs-deck'

export interface QuizRunRecord {
  id: string
  modeName: string
  score: number
  accuracy: number
  xpEarned: number
  streak: number
  timestamp: string
  playerName: string
}

export interface LeagueTier {
  id: string
  name: string
  minXp: number
  nextXp: number
  badge: string
  color: string
}

export interface LeagueCompetitor {
  id: string
  name: string
  avatar: string
  countryFlag: string
  streak: number
  weeklyXp: number
  rank: number
  zone: 'promotion' | 'safe' | 'demotion'
  isUser: boolean
}

const QUIZ_LEADERBOARD_KEY = 'nihongo_quiz_leaderboard_runs_v1'
const LEAGUE_ROSTER_KEY_PREFIX = 'nihongo_league_cohort_'

export const LEAGUE_TIERS: LeagueTier[] = [
  {
    id: 'bronze',
    name: 'Bronze League',
    minXp: 0,
    nextXp: 250,
    badge: '🥉',
    color: 'text-amber-700',
  },
  {
    id: 'silver',
    name: 'Silver League',
    minXp: 250,
    nextXp: 600,
    badge: '🥈',
    color: 'text-slate-400',
  },
  {
    id: 'gold',
    name: 'Gold League',
    minXp: 600,
    nextXp: 1200,
    badge: '🥇',
    color: 'text-yellow-500',
  },
  {
    id: 'sapphire',
    name: 'Sapphire League',
    minXp: 1200,
    nextXp: 2500,
    badge: '💎',
    color: 'text-blue-500',
  },
  {
    id: 'ruby',
    name: 'Ruby League',
    minXp: 2500,
    nextXp: 5000,
    badge: '👑',
    color: 'text-rose-500',
  },
  {
    id: 'diamond',
    name: 'Diamond League',
    minXp: 5000,
    nextXp: 10000,
    badge: '🏆',
    color: 'text-indigo-400',
  },
]

export function getCurrentLeague(xp: number): LeagueTier {
  for (let i = LEAGUE_TIERS.length - 1; i >= 0; i--) {
    if (xp >= LEAGUE_TIERS[i].minXp) {
      return LEAGUE_TIERS[i]
    }
  }
  return LEAGUE_TIERS[0]
}

/**
 * Calculates current ISO week string, e.g. "2026-W40"
 */
export function getCurrentWeekIdentifier(): string {
  const now = new Date()
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${weekNo}`
}

/**
 * Computes remaining time until this week's league closes (Sunday 23:59:59)
 */
export function getTimeRemainingInWeeklyLeague(): {
  days: number
  hours: number
  minutes: number
  formatted: string
} {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sun, 1 = Mon ...
  const daysUntilSunday = (7 - dayOfWeek) % 7
  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() + daysUntilSunday)
  endOfWeek.setHours(23, 59, 59, 999)

  const diffMs = Math.max(0, endOfWeek.getTime() - now.getTime())
  const totalMins = Math.floor(diffMs / (60 * 1000))
  const days = Math.floor(totalMins / (24 * 60))
  const hours = Math.floor((totalMins % (24 * 60)) / 60)
  const minutes = totalMins % 60

  return {
    days,
    hours,
    minutes,
    formatted: `${days}d ${hours}h ${minutes}m`,
  }
}

const PEER_STUDENTS = [
  { name: 'Elena M.', avatar: '🌸', flag: '🇪🇸', baseMultiplier: 1.45, streak: 19 },
  { name: 'Marcus Chen', avatar: '🐱', flag: '🇨🇦', baseMultiplier: 1.38, streak: 24 },
  { name: 'Hana_S', avatar: '🦊', flag: '🇯🇵', baseMultiplier: 1.3, streak: 31 },
  { name: 'Takumi_N', avatar: '⚡', flag: '🇺🇸', baseMultiplier: 1.25, streak: 15 },
  { name: 'Alex R.', avatar: '🍙', flag: '🇬🇧', baseMultiplier: 1.18, streak: 12 },
  { name: 'Sarah T.', avatar: '⛩️', flag: '🇦🇺', baseMultiplier: 1.12, streak: 22 },
  { name: 'Mia Wong', avatar: '🍵', flag: '🇸🇬', baseMultiplier: 1.05, streak: 9 },
  { name: 'Daniel P.', avatar: '🐉', flag: '🇩🇪', baseMultiplier: 0.98, streak: 17 },
  { name: 'Chloe B.', avatar: '🌸', flag: '🇫🇷', baseMultiplier: 0.92, streak: 14 },
  { name: 'Lucas Silva', avatar: '🥷', flag: '🇧🇷', baseMultiplier: 0.88, streak: 8 },
  { name: 'Yuki_K', avatar: '🐱', flag: '🇺🇸', baseMultiplier: 0.84, streak: 20 },
  { name: 'Emma Watson', avatar: '🦊', flag: '🇬🇧', baseMultiplier: 0.79, streak: 11 },
  { name: 'Liam Davies', avatar: '⚡', flag: '🇳🇿', baseMultiplier: 0.75, streak: 6 },
  { name: 'Noah K.', avatar: '🍙', flag: '🇳🇱', baseMultiplier: 0.71, streak: 13 },
  { name: 'Sofia Rossi', avatar: '🌸', flag: '🇮🇹', baseMultiplier: 0.67, streak: 16 },
  { name: 'Julian M.', avatar: '⛩️', flag: '🇦🇹', baseMultiplier: 0.63, streak: 5 },
  { name: 'Grace Lee', avatar: '🍵', flag: '🇰🇷', baseMultiplier: 0.59, streak: 18 },
  { name: 'Leo Martin', avatar: '🐉', flag: '🇨🇭', baseMultiplier: 0.55, streak: 7 },
  { name: 'Zoe Wang', avatar: '🥷', flag: '🇨🇦', baseMultiplier: 0.51, streak: 10 },
  { name: 'David Kim', avatar: '🐱', flag: '🇺🇸', baseMultiplier: 0.47, streak: 4 },
  { name: 'Mila Novak', avatar: '🌸', flag: '🇨🇿', baseMultiplier: 0.43, streak: 12 },
  { name: 'Oliver B.', avatar: '🦊', flag: '🇮🇪', baseMultiplier: 0.39, streak: 3 },
  { name: 'Maya Patel', avatar: '⚡', flag: '🇮🇳', baseMultiplier: 0.35, streak: 8 },
  { name: 'Ethan Hunt', avatar: '🍙', flag: '🇺🇸', baseMultiplier: 0.31, streak: 2 },
  { name: 'Ella Clark', avatar: '🌸', flag: '🇦🇺', baseMultiplier: 0.27, streak: 5 },
  { name: 'Finn Hansen', avatar: '⛩️', flag: '🇩🇰', baseMultiplier: 0.23, streak: 1 },
  { name: 'Isabella F.', avatar: '🍵', flag: '🇲🇽', baseMultiplier: 0.19, streak: 3 },
  { name: 'Oscar Lind', avatar: '🐉', flag: '🇸🇪', baseMultiplier: 0.15, streak: 2 },
  { name: 'Aria Taylor', avatar: '🥷', flag: '🇬🇧', baseMultiplier: 0.11, streak: 1 },
]

/**
 * Returns dynamic, sorted league competitors for the user's current division.
 */
export function getLeagueCompetitors(stats: UserStudyStats): {
  league: LeagueTier
  competitors: LeagueCompetitor[]
  userRank: number
  userCompetitor: LeagueCompetitor
  timeRemaining: string
  isPromotion: boolean
  isDemotion: boolean
} {
  const league = getCurrentLeague(stats.xp)
  const weekId = getCurrentWeekIdentifier()
  const storageKey = `${LEAGUE_ROSTER_KEY_PREFIX}${weekId}_${league.id}`

  // Target base XP for this league
  const span = Math.max(150, league.nextXp - league.minXp)
  const baseRange = league.minXp + Math.round(span * 0.4)

  let baseRoster: {
    id: string
    name: string
    avatar: string
    flag: string
    streak: number
    weeklyXp: number
  }[] = []

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        baseRoster = JSON.parse(raw)
      }
    } catch {
      // ignore
    }
  }

  if (!baseRoster || baseRoster.length === 0) {
    baseRoster = PEER_STUDENTS.map((peer, idx) => {
      const xpVal = Math.max(
        league.minXp + 15,
        Math.round(baseRange * peer.baseMultiplier + (idx % 5) * 12)
      )
      return {
        id: `peer-${idx}`,
        name: peer.name,
        avatar: peer.avatar,
        flag: peer.flag,
        streak: peer.streak,
        weeklyXp: xpVal,
      }
    })
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(baseRoster))
      } catch {
        // ignore
      }
    }
  }

  // User's own competitive XP
  const userScore = stats.weeklyXp && stats.weeklyXp > 0 ? stats.weeklyXp : stats.xp

  const userEntry: LeagueCompetitor = {
    id: 'current-user-entry',
    name: stats.displayName || 'You',
    avatar: stats.avatar || '🌸',
    countryFlag: '🇯🇵',
    streak: stats.currentStreak || 0,
    weeklyXp: userScore,
    rank: 1,
    zone: 'safe',
    isUser: true,
  }

  // Combine peers and user
  const combined: LeagueCompetitor[] = [
    userEntry,
    ...baseRoster.map((peer) => ({
      id: peer.id,
      name: peer.name,
      avatar: peer.avatar,
      countryFlag: peer.flag,
      streak: peer.streak,
      weeklyXp: peer.weeklyXp,
      rank: 1,
      zone: 'safe' as const,
      isUser: false,
    })),
  ]

  // Sort descending by XP
  combined.sort((a, b) => b.weeklyXp - a.weeklyXp)

  // Assign ranks and zones
  const total = combined.length
  let userRank = 1
  combined.forEach((item, idx) => {
    item.rank = idx + 1
    if (idx < 7) {
      item.zone = 'promotion'
    } else if (league.id !== 'bronze' && idx >= total - 5) {
      item.zone = 'demotion'
    } else {
      item.zone = 'safe'
    }

    if (item.isUser) {
      userRank = item.rank
    }
  })

  const timeRem = getTimeRemainingInWeeklyLeague()

  return {
    league,
    competitors: combined,
    userRank,
    userCompetitor: combined.find((c) => c.isUser) || userEntry,
    timeRemaining: timeRem.formatted,
    isPromotion: userRank <= 7,
    isDemotion: league.id !== 'bronze' && userRank > total - 5,
  }
}

export function loadQuizRuns(): QuizRunRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(QUIZ_LEADERBOARD_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function recordQuizRun(entry: {
  modeName: string
  score: number
  accuracy: number
  xpEarned: number
  streak: number
}): QuizRunRecord[] {
  if (typeof window === 'undefined') return []
  const stats = loadUserStats()
  const runs = loadQuizRuns()
  const newRun: QuizRunRecord = {
    id: `run-${Date.now()}`,
    modeName: entry.modeName,
    score: entry.score,
    accuracy: entry.accuracy,
    xpEarned: entry.xpEarned,
    streak: entry.streak,
    timestamp: new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    playerName: stats.displayName || 'You',
  }
  const updated = [newRun, ...runs].slice(0, 50)
  try {
    localStorage.setItem(QUIZ_LEADERBOARD_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('nihongo-leaderboard-updated'))
  } catch {
    // ignore
  }
  return updated
}

export function clearQuizRuns(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(QUIZ_LEADERBOARD_KEY)
  window.dispatchEvent(new Event('nihongo-leaderboard-updated'))
}
