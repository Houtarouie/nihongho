'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Flame,
  Trophy,
  Clock,
  BookOpen,
  LogOut,
  Save,
  Sparkles,
} from 'lucide-react'
import {
  loadUserStats,
  saveUserStats,
  loadSRSCards,
  DEFAULT_USER_STATS,
  type UserStudyStats,
} from '@/data/srs-deck'
import { toast } from 'sonner'

export default function ProfilePage() {
  const router = useRouter()
  const [stats, setStats] = useState<UserStudyStats>(DEFAULT_USER_STATS)
  const [displayName, setDisplayName] = useState(DEFAULT_USER_STATS.displayName)
  const [username, setUsername] = useState(DEFAULT_USER_STATS.username)
  const [targetJlpt, setTargetJlpt] = useState(DEFAULT_USER_STATS.targetJlpt)
  const [masteredCount, setMasteredCount] = useState(0)

  useEffect(() => {
    const loaded = loadUserStats()
    setStats(loaded)
    setDisplayName(loaded.displayName)
    setUsername(loaded.username)
    setTargetJlpt(loaded.targetJlpt)

    const cards = loadSRSCards()
    setMasteredCount(
      cards.filter((c) => c.status === 'mastered' || c.interval >= 7).length
    )
  }, [])

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    const updated = saveUserStats({
      displayName: displayName.trim().slice(0, 50) || 'Student',
      username:
        username
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 30) || 'student',
      targetJlpt,
    })
    setStats(updated)
    toast.success('Profile updated successfully!')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center">
            {stats.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{stats.displayName}</h1>
              <Badge>Target: JLPT {stats.targetJlpt}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              @{stats.username} · {stats.email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/login')}
        >
          <LogOut className="h-4 w-4 mr-1.5" /> Switch Account / Sign Out
        </Button>
      </div>

      {/* Lifetime Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-500 fill-orange-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Current Streak</p>
              <p className="text-xl font-bold">{stats.currentStreak} days</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-yellow-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total XP</p>
              <p className="text-xl font-bold">{stats.xp}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Study Time</p>
              <p className="text-xl font-bold">{stats.totalStudyMins}m</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-green-600 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">SRS Mastered</p>
              <p className="text-xl font-bold">{masteredCount} cards</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Learning Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Vocabulary Learned</p>
            <p className="text-2xl font-bold mt-1">{stats.vocabCount}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Kanji Studied</p>
            <p className="text-2xl font-bold mt-1">{stats.kanjiCount}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Grammar Points</p>
            <p className="text-2xl font-bold mt-1">{stats.grammarCount}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Lessons Completed</p>
            <p className="text-2xl font-bold mt-1">
              {stats.completedLessons?.length || 0}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Settings</CardTitle>
          <CardDescription>
            Customize your display name, username, and target JLPT goal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={30}
                  required
                />
              </div>
            </div>
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="targetJlpt">Target JLPT Level</Label>
              <select
                id="targetJlpt"
                value={targetJlpt}
                onChange={(e) => setTargetJlpt(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="N5">JLPT N5 (Beginner)</option>
                <option value="N4">JLPT N4 (Elementary)</option>
                <option value="N3">JLPT N3 (Intermediate)</option>
                <option value="N2">JLPT N2 (Pre-Advanced)</option>
                <option value="N1">JLPT N1 (Advanced)</option>
              </select>
            </div>
            <Button type="submit">
              <Save className="h-4 w-4 mr-1.5" /> Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
