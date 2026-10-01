'use client'

import { useState, useEffect, useMemo } from 'react'
import { PostComposer } from '@/components/social/post-composer'
import { PostCard, type CommunityPost } from '@/components/social/post-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Trophy,
  Flame,
  Sparkles,
  Trash2,
  Clock,
  ArrowUp,
  ArrowDown,
  Shield,
  Zap,
  Target,
} from 'lucide-react'
import {
  loadUserStats,
  DEFAULT_USER_STATS,
  type UserStudyStats,
} from '@/data/srs-deck'
import {
  loadQuizRuns,
  getLeagueCompetitors,
  clearQuizRuns,
  type QuizRunRecord,
} from '@/data/quiz-leaderboard'

const POSTS_STORAGE_KEY = 'nihongo_user_posts_clean_v2'

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'league' | 'arcade' | 'feed'>(
    'league'
  )
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [stats, setStats] = useState<UserStudyStats>(DEFAULT_USER_STATS)
  const [quizRuns, setQuizRuns] = useState<QuizRunRecord[]>([])

  useEffect(() => {
    function sync() {
      setStats(loadUserStats())
      setQuizRuns(loadQuizRuns())
      try {
        const raw = localStorage.getItem(POSTS_STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            setPosts(parsed)
          }
        }
      } catch {
        // ignore
      }
    }
    sync()
    window.addEventListener('nihongo-stats-updated', sync)
    window.addEventListener('nihongo-leaderboard-updated', sync)
    return () => {
      window.removeEventListener('nihongo-stats-updated', sync)
      window.removeEventListener('nihongo-leaderboard-updated', sync)
    }
  }, [])

  function savePosts(next: CommunityPost[]) {
    setPosts(next)
    try {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  function handleCreatePost(content: string, jlptLevel: string) {
    const user = loadUserStats()
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      author: {
        name: user.displayName || 'Me',
        username: user.username || 'learner',
        avatar: user.avatar || '🌸',
      },
      content,
      timeAgo: 'Just now',
      likes: 0,
      likedByMe: false,
      comments: 0,
      commentsList: [],
      jlptLevel,
    }
    savePosts([newPost, ...posts])
  }

  function handleToggleLike(id: string) {
    const next = posts.map((p) => {
      if (p.id !== id) return p
      const liked = !p.likedByMe
      return {
        ...p,
        likedByMe: liked,
        likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1),
      }
    })
    savePosts(next)
  }

  function handleAddComment(id: string, text: string) {
    const user = loadUserStats()
    const next = posts.map((p) => {
      if (p.id !== id) return p
      const list = p.commentsList || []
      return {
        ...p,
        comments: p.comments + 1,
        commentsList: [
          ...list,
          {
            id: `c-${Date.now()}`,
            author: user.displayName || 'Me',
            text,
          },
        ],
      }
    })
    savePosts(next)
  }

  // Dynamic League Competitor Standings
  const leagueData = useMemo(() => {
    return getLeagueCompetitors(stats)
  }, [stats])

  const { league, competitors, userRank, timeRemaining, isPromotion, isDemotion } =
    leagueData

  const leagueProgress = Math.min(
    100,
    Math.round(
      ((stats.xp - league.minXp) / Math.max(1, league.nextXp - league.minXp)) *
        100
    )
  )

  // Group best score per quiz mode
  const bestByMode = quizRuns.reduce<Record<string, QuizRunRecord>>(
    (acc, run) => {
      if (!acc[run.modeName] || run.score > acc[run.modeName].score) {
        acc[run.modeName] = run
      }
      return acc
    },
    {}
  )

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          League Rankings & Community
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compete in weekly divisions, climb from Bronze to Diamond League, and track your high scores.
        </p>
      </div>

      {/* Duolingo-Style 3-Segment Switcher */}
      <div className="flex w-full rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setActiveTab('league')}
          className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
            activeTab === 'league'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🏆 Weekly League ({league.name.split(' ')[0]})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('arcade')}
          className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
            activeTab === 'arcade'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          ⚡ Quiz High Scores
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
            activeTab === 'feed'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📝 Study Log ({posts.length})
        </button>
      </div>

      {/* TAB 1: WEEKLY LEAGUE RANKINGS */}
      {activeTab === 'league' && (
        <div className="space-y-6">
          {/* League Division Header Banner */}
          <Card className="border-2 border-primary/20 bg-primary/5 overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center text-4xl shrink-0">
                    {league.badge}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="font-semibold text-xs">
                        Current Division
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        Ends in {timeRemaining}
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold mt-0.5">
                      {league.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      30 active learners competing this week
                    </p>
                  </div>
                </div>

                {/* User Current Standing Chip */}
                <div className="flex items-center gap-2 sm:justify-end">
                  <div className="rounded-xl bg-background px-4 py-2 border text-center shadow-xs">
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Your Rank
                    </p>
                    <p className="text-xl font-black text-primary flex items-center justify-center gap-1">
                      #{userRank}
                    </p>
                  </div>
                  <div className="rounded-xl bg-background px-4 py-2 border text-center shadow-xs">
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Weekly XP
                    </p>
                    <p className="text-xl font-black text-yellow-600 dark:text-yellow-400 flex items-center justify-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      {stats.weeklyXp || stats.xp}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Notice */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/80 border text-xs">
                <div className="flex items-center gap-2">
                  {isPromotion ? (
                    <>
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-bold text-green-600 dark:text-green-400">
                        In Promotion Zone (Rank #{userRank})
                      </span>
                      <span className="text-muted-foreground hidden sm:inline">
                        — You will advance to the next league on Sunday!
                      </span>
                    </>
                  ) : isDemotion ? (
                    <>
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="font-bold text-red-500">
                        In Demotion Zone (Rank #{userRank})
                      </span>
                      <span className="text-muted-foreground hidden sm:inline">
                        — Earn more XP to move into the safe zone!
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span className="font-bold text-blue-500">
                        Safe Zone (Rank #{userRank})
                      </span>
                      <span className="text-muted-foreground hidden sm:inline">
                        — Top 7 promote. Keep learning to climb!
                      </span>
                    </>
                  )}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stats.currentStreak}d Streak 🔥
                </div>
              </div>

              {/* Progress to next league tier */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-medium">
                  <span>Progress to Next Tier</span>
                  <span>
                    {stats.xp} / {league.nextXp} XP ({leagueProgress}%)
                  </span>
                </div>
                <Progress value={leagueProgress} className="h-2.5" />
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard Competitor List */}
          <Card className="overflow-hidden">
            <CardHeader className="p-4 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  Division Standings (Top 30)
                </CardTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                    <ArrowUp className="h-3 w-3" /> Top 7 Promote
                  </span>
                  {league.id !== 'bronze' && (
                    <span className="flex items-center gap-1 text-red-500 font-semibold">
                      <ArrowDown className="h-3 w-3" /> Bottom 5 Demote
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {competitors.map((item, idx) => {
                  const isTop3 = item.rank <= 3
                  const isPromoted = item.rank <= 7
                  const isDemoted =
                    league.id !== 'bronze' &&
                    item.rank > competitors.length - 5

                  return (
                    <div key={item.id}>
                      {/* Divider for Promotion Line after rank 7 */}
                      {idx === 7 && (
                        <div className="bg-green-500/10 border-y border-green-500/30 px-4 py-1.5 flex items-center justify-between text-[11px] font-bold text-green-600 dark:text-green-400">
                          <span className="flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5" />
                            ▲ PROMOTION ZONE &bull; Top 7 advance to the next league
                          </span>
                          <span>Safe above this line</span>
                        </div>
                      )}

                      {/* Divider for Demotion Line before bottom 5 */}
                      {league.id !== 'bronze' &&
                        idx === competitors.length - 5 && (
                          <div className="bg-red-500/10 border-y border-red-500/30 px-4 py-1.5 flex items-center justify-between text-[11px] font-bold text-red-500">
                            <span className="flex items-center gap-1.5">
                              <ArrowDown className="h-3.5 w-3.5" />
                              ▼ DEMOTION ZONE &bull; Bottom 5 drop down
                            </span>
                            <span>Earn XP to stay safe</span>
                          </div>
                        )}

                      {/* Row Item */}
                      <div
                        className={`flex items-center justify-between px-4 py-3 transition-colors ${
                          item.isUser
                            ? 'bg-primary/10 font-medium border-l-4 border-l-primary'
                            : isTop3
                            ? 'bg-muted/15'
                            : 'hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Rank indicator */}
                          <div className="w-7 text-center shrink-0">
                            {item.rank === 1 ? (
                              <span className="text-xl" title="1st Place">
                                🥇
                              </span>
                            ) : item.rank === 2 ? (
                              <span className="text-xl" title="2nd Place">
                                🥈
                              </span>
                            ) : item.rank === 3 ? (
                              <span className="text-xl" title="3rd Place">
                                🥉
                              </span>
                            ) : (
                              <span
                                className={`text-xs font-bold font-mono ${
                                  item.isUser
                                    ? 'text-primary font-black text-sm'
                                    : isPromoted
                                    ? 'text-green-600 dark:text-green-400'
                                    : isDemoted
                                    ? 'text-red-500'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                #{item.rank}
                              </span>
                            )}
                          </div>

                          {/* Avatar */}
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-lg shrink-0 border border-border/60">
                            {item.avatar}
                          </div>

                          {/* Name & country */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold truncate">
                                {item.name}
                              </p>
                              {item.isUser && (
                                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground font-black">
                                  YOU
                                </Badge>
                              )}
                              <span
                                className="text-xs"
                                title={`Flag: ${item.countryFlag}`}
                              >
                                {item.countryFlag}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Flame className="h-3 w-3 text-orange-500 fill-orange-500" />
                              {item.streak} day streak
                            </p>
                          </div>
                        </div>

                        {/* XP points */}
                        <div className="text-right shrink-0">
                          <p className="font-extrabold text-sm text-foreground">
                            {item.weeklyXp}{' '}
                            <span className="text-xs font-normal text-muted-foreground">
                              XP
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: QUIZ ARCADE HIGH SCORES */}
      {activeTab === 'arcade' && (
        <div className="space-y-6">
          {/* Best Scores Per Quiz Mode */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Personal Best Scores by Quiz Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(bestByMode).length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center space-y-2">
                  <p>No quiz runs recorded yet.</p>
                  <p className="text-xs">
                    Play any mode in the Quiz Arcade (Learn page) to post your high scores!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.values(bestByMode).map((best) => (
                    <div
                      key={best.modeName}
                      className="rounded-xl border p-3.5 flex items-center justify-between bg-muted/20"
                    >
                      <div>
                        <p className="font-bold text-sm">{best.modeName}</p>
                        <p className="text-xs text-muted-foreground">
                          Streak: {best.streak} &bull; Accuracy: {best.accuracy}%
                        </p>
                      </div>
                      <Badge className="text-xs font-bold">
                        {best.score} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Quiz Run History */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Recent Speedrun History
              </CardTitle>
              {quizRuns.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={clearQuizRuns}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Clear History
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {quizRuns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Complete a quiz session in Learn &rarr; Arcade to see your ranked runs here!
                </div>
              ) : (
                <div className="divide-y">
                  {quizRuns.slice(0, 15).map((run, idx) => (
                    <div
                      key={run.id}
                      className="py-3 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold">
                            {run.playerName} &mdash; {run.modeName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {run.timestamp} &bull; Streak {run.streak} &bull;{' '}
                            {run.accuracy}% accuracy
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          +{run.xpEarned} XP
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Score: {run.score}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: STUDY FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          <PostComposer onCreatePost={handleCreatePost} />

          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center space-y-2">
                <h3 className="font-bold text-base">No study posts yet</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Write a study note above whenever you want to log milestones,
                  new grammar breakthroughs, or questions for your study notes!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onToggleLike={handleToggleLike}
                  onAddComment={handleAddComment}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
