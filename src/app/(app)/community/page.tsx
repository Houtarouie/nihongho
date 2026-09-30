'use client'

import { useState, useEffect } from 'react'
import { PostComposer } from '@/components/social/post-composer'
import { PostCard, type CommunityPost } from '@/components/social/post-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Flame, Sparkles, Trash2, MessageSquarePlus } from 'lucide-react'
import {
  loadUserStats,
  DEFAULT_USER_STATS,
  type UserStudyStats,
} from '@/data/srs-deck'
import {
  loadQuizRuns,
  getCurrentLeague,
  clearQuizRuns,
  type QuizRunRecord,
} from '@/data/quiz-leaderboard'

const POSTS_STORAGE_KEY = 'nihongo_user_posts_clean_v2'

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'feed'>(
    'leaderboard'
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
        avatar: '',
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

  const league = getCurrentLeague(stats.xp)
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
        <h1 className="text-3xl font-bold tracking-tight">
          Leaderboard & Study Feed
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your League rank, personal quiz high scores, and study notes.
        </p>
      </div>

      {/* Simple Duolingo-Style Pill Switcher */}
      <div className="flex w-full rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🏆 Quiz Leaderboard
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
          📝 My Study Posts ({posts.length})
        </button>
      </div>

      {activeTab === 'leaderboard' ? (
        <div className="space-y-6">
          {/* Duolingo-Style League Banner */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center text-3xl shrink-0">
                    {league.badge}
                  </div>
                  <div>
                    <Badge className="mb-1">Current Division</Badge>
                    <h2 className="text-2xl font-extrabold">{league.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {stats.displayName} · {stats.xp} Total XP ·{' '}
                      {stats.currentStreak} Day Streak
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-background px-3.5 py-2 border text-center">
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Total XP
                    </p>
                    <p className="text-lg font-extrabold text-primary flex items-center justify-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      {stats.xp}
                    </p>
                  </div>
                  <div className="rounded-xl bg-background px-3.5 py-2 border text-center">
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Streak
                    </p>
                    <p className="text-lg font-extrabold text-orange-500 flex items-center justify-center gap-1">
                      <Flame className="h-4 w-4 fill-orange-500" />
                      {stats.currentStreak}d
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span>Progress to Next League</span>
                  <span>
                    {stats.xp} / {league.nextXp} XP ({leagueProgress}%)
                  </span>
                </div>
                <Progress value={leagueProgress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Best Scores Per Quiz Mode */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Personal Best Scores by Quiz Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(bestByMode).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No quiz runs recorded yet. Play any mode in the Quiz Arcade or
                  Grammar Practice to post your first score!
                </p>
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
                          Best Streak: {best.streak} · Accuracy: {best.accuracy}%
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

          {/* Recent Quiz Leaderboard History */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Quiz Leaderboard</CardTitle>
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
                  Complete a quiz session to see your ranked runs here!
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
                            {run.playerName} — {run.modeName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {run.timestamp} · Streak {run.streak} ·{' '}
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
      ) : (
        <div className="space-y-4">
          <PostComposer onCreatePost={handleCreatePost} />

          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center space-y-2">
                <MessageSquarePlus className="h-8 w-8 text-muted-foreground mx-auto" />
                <h3 className="font-bold text-base">No study posts yet</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  All bot posts and replies have been removed. Write a post
                  above whenever you want to log your own daily Japanese
                  milestones!
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
