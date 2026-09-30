import { loadUserStats } from '@/data/srs-deck'

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
  name: string
  minXp: number
  nextXp: number
  badge: string
}

const QUIZ_LEADERBOARD_KEY = 'nihongo_quiz_leaderboard_runs_v1'

export const LEAGUE_TIERS: LeagueTier[] = [
  { name: 'Bronze League', minXp: 0, nextXp: 200, badge: '🥉' },
  { name: 'Silver League', minXp: 200, nextXp: 500, badge: '🥈' },
  { name: 'Gold League', minXp: 500, nextXp: 1000, badge: '🥇' },
  { name: 'Sapphire League', minXp: 1000, nextXp: 2000, badge: '💎' },
  { name: 'Diamond League', minXp: 2000, nextXp: 5000, badge: '👑' },
]

export function getCurrentLeague(xp: number): LeagueTier {
  for (let i = LEAGUE_TIERS.length - 1; i >= 0; i--) {
    if (xp >= LEAGUE_TIERS[i].minXp) {
      return LEAGUE_TIERS[i]
    }
  }
  return LEAGUE_TIERS[0]
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
