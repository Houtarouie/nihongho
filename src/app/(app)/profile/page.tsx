'use client'

import { useState, useEffect, useRef } from 'react'
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
  RotateCcw,
  Sliders,
  Download,
  Upload,
  Settings2,
} from 'lucide-react'
import {
  loadUserStats,
  saveUserStats,
  loadSRSCards,
  resetUserToFreshStart,
  exportUserDataBackup,
  importUserDataBackup,
  DEFAULT_USER_STATS,
  type UserStudyStats,
} from '@/data/srs-deck'
import { toast } from 'sonner'

const AVATAR_OPTIONS = [
  { emoji: '🌸', label: 'Sakura' },
  { emoji: '🐱', label: 'Neko' },
  { emoji: '🦊', label: 'Kitsune' },
  { emoji: '⛩️', label: 'Torii' },
  { emoji: '🍙', label: 'Onigiri' },
  { emoji: '🥷', label: 'Ninja' },
  { emoji: '🎌', label: 'Hinomaru' },
  { emoji: '⚡', label: 'Kaminari' },
  { emoji: '🍵', label: 'Matcha' },
  { emoji: '🐉', label: 'Ryu' },
  { emoji: '👺', label: 'Tengu' },
  { emoji: '🏯', label: 'Shiro' },
]

export default function ProfilePage() {
  const router = useRouter()
  const [stats, setStats] = useState<UserStudyStats>(DEFAULT_USER_STATS)

  // Profile form state
  const [displayName, setDisplayName] = useState(DEFAULT_USER_STATS.displayName)
  const [username, setUsername] = useState(DEFAULT_USER_STATS.username)
  const [email, setEmail] = useState(DEFAULT_USER_STATS.email)
  const [bio, setBio] = useState(DEFAULT_USER_STATS.bio || '')
  const [selectedAvatar, setSelectedAvatar] = useState('🌸')
  const [targetJlpt, setTargetJlpt] = useState(DEFAULT_USER_STATS.targetJlpt)

  // Learning preferences
  const [dailyGoalMins, setDailyGoalMins] = useState(15)
  const [audioSpeed, setAudioSpeed] = useState(1.0)
  const [furiganaMode, setFuriganaMode] = useState<'always' | 'hover' | 'hidden'>('always')

  // Custom Stats Editor state
  const [showCustomStats, setShowCustomStats] = useState(false)
  const [customStreak, setCustomStreak] = useState(0)
  const [customMins, setCustomMins] = useState(0)
  const [customXp, setCustomXp] = useState(0)
  const [customVocab, setCustomVocab] = useState(0)
  const [customKanji, setCustomKanji] = useState(0)
  const [customGrammar, setCustomGrammar] = useState(0)

  const [masteredCount, setMasteredCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function syncData() {
    const loaded = loadUserStats()
    setStats(loaded)
    setDisplayName(loaded.displayName)
    setUsername(loaded.username)
    setEmail(loaded.email)
    setBio(loaded.bio || '')
    setSelectedAvatar(loaded.avatar || '🌸')
    setTargetJlpt(loaded.targetJlpt)
    setDailyGoalMins(loaded.dailyGoalMins || 15)
    setAudioSpeed(loaded.audioSpeed || 1.0)
    setFuriganaMode(loaded.furiganaMode || 'always')

    setCustomStreak(loaded.currentStreak)
    setCustomMins(loaded.totalStudyMins)
    setCustomXp(loaded.xp)
    setCustomVocab(loaded.vocabCount)
    setCustomKanji(loaded.kanjiCount)
    setCustomGrammar(loaded.grammarCount)

    const cards = loadSRSCards()
    setMasteredCount(
      cards.filter((c) => c.status === 'mastered' || c.interval >= 7).length
    )
  }

  useEffect(() => {
    syncData()
    window.addEventListener('nihongo-stats-updated', syncData)
    return () => window.removeEventListener('nihongo-stats-updated', syncData)
  }, [])

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    const updated = saveUserStats({
      displayName: displayName.trim().slice(0, 50) || 'Learner',
      username:
        username
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 30) || 'learner',
      email: email.trim() || 'student@nihongo.app',
      bio: bio.trim().slice(0, 160),
      avatar: selectedAvatar,
      targetJlpt,
      dailyGoalMins,
      audioSpeed,
      furiganaMode,
    })
    setStats(updated)
    toast.success('Profile & learning settings updated successfully!')
  }

  function handleResetToFresh() {
    if (
      window.confirm(
        'Start fresh from 0? This will set your streak, XP, and study time to 0 so you can track your real progress from day one.'
      )
    ) {
      const fresh = resetUserToFreshStart(displayName)
      setStats(fresh)
      syncData()
      toast.success('Profile reset to clean start (0 stats)!')
    }
  }

  function handleSaveCustomStats(e: React.FormEvent) {
    e.preventDefault()
    const updated = saveUserStats({
      currentStreak: Math.max(0, customStreak),
      longestStreak: Math.max(customStreak, stats.longestStreak),
      totalStudyMins: Math.max(0, customMins),
      xp: Math.max(0, customXp),
      vocabCount: Math.max(0, customVocab),
      kanjiCount: Math.max(0, customKanji),
      grammarCount: Math.max(0, customGrammar),
    })
    setStats(updated)
    setShowCustomStats(false)
    toast.success('Custom statistics saved successfully!')
  }

  function handleExportBackup() {
    const json = exportUserDataBackup()
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nihongo_backup_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported complete data backup!')
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (importUserDataBackup(content)) {
        syncData()
        toast.success('Data backup restored successfully!')
      } else {
        toast.error('Invalid backup file. Could not restore.')
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Header Profile Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/15 border-2 border-primary/20 text-3xl flex items-center justify-center shrink-0">
            {stats.avatar || '🌸'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{stats.displayName}</h1>
              <Badge className="font-semibold">Target: JLPT {stats.targetJlpt}</Badge>
              {stats.isFreshUser && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-500/40">
                  Clean Slate
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              @{stats.username} &bull; {stats.email}
            </p>
            {stats.bio && (
              <p className="text-xs text-muted-foreground/90 italic mt-1 max-w-md">
                &ldquo;{stats.bio}&rdquo;
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/login')}
          >
            <LogOut className="h-4 w-4 mr-1.5" /> Switch Account
          </Button>
        </div>
      </div>

      {/* Real-Time Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="hover:border-orange-500/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-500 fill-orange-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Streak</p>
              <p className="text-xl font-black">{stats.currentStreak} days</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-yellow-500/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-yellow-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total XP</p>
              <p className="text-xl font-black">{stats.xp}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-blue-500/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Study Time</p>
              <p className="text-xl font-black">{stats.totalStudyMins}m</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-green-500/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-green-600 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">SRS Mastered</p>
              <p className="text-xl font-black">{masteredCount} cards</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Learning Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="rounded-xl border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Vocabulary Learned</p>
            <p className="text-2xl font-bold mt-1 text-primary">{stats.vocabCount}</p>
          </div>
          <div className="rounded-xl border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Kanji Studied</p>
            <p className="text-2xl font-bold mt-1 text-primary">{stats.kanjiCount}</p>
          </div>
          <div className="rounded-xl border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Grammar Points</p>
            <p className="text-2xl font-bold mt-1 text-primary">{stats.grammarCount}</p>
          </div>
          <div className="rounded-xl border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Lessons Completed</p>
            <p className="text-2xl font-bold mt-1 text-primary">
              {stats.completedLessons?.length || 0}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Profile & Learning Settings
          </CardTitle>
          <CardDescription>
            Customize your identity, avatar, learning goals, and reading preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Avatar Picker */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Choose Your Avatar</Label>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av.label}
                    type="button"
                    onClick={() => setSelectedAvatar(av.emoji)}
                    className={`h-11 w-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                      selectedAvatar === av.emoji
                        ? 'bg-primary/20 border-2 border-primary scale-110 shadow-sm'
                        : 'border bg-card hover:bg-muted/60'
                    }`}
                    title={av.label}
                  >
                    {av.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Name & Username */}
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
                <Label htmlFor="username">Username (@)</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={30}
                  required
                />
              </div>
            </div>

            {/* Email & Bio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Study Goal / Bio</Label>
                <Input
                  id="bio"
                  placeholder="e.g. Taking JLPT N5 in December!"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                />
              </div>
            </div>

            {/* Preferences: Target JLPT, Daily Goal, Audio Speed, Furigana */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="targetJlpt">Target JLPT Level</Label>
                <select
                  id="targetJlpt"
                  value={targetJlpt}
                  onChange={(e) => setTargetJlpt(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                >
                  <option value="N5">JLPT N5 (Beginner)</option>
                  <option value="N4">JLPT N4 (Elementary)</option>
                  <option value="N3">JLPT N3 (Intermediate)</option>
                  <option value="N2">JLPT N2 (Pre-Advanced)</option>
                  <option value="N1">JLPT N1 (Advanced)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyGoal">Daily Goal</Label>
                <select
                  id="dailyGoal"
                  value={dailyGoalMins}
                  onChange={(e) => setDailyGoalMins(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                >
                  <option value={5}>5 mins / Casual</option>
                  <option value={15}>15 mins / Regular</option>
                  <option value={30}>30 mins / Serious</option>
                  <option value={60}>60 mins / Intense</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audioSpeed">Audio Speed</Label>
                <select
                  id="audioSpeed"
                  value={audioSpeed}
                  onChange={(e) => setAudioSpeed(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                >
                  <option value={0.8}>0.8x (Slower)</option>
                  <option value={0.9}>0.9x (Comfortable)</option>
                  <option value={1.0}>1.0x (Standard)</option>
                  <option value={1.1}>1.1x (Natural)</option>
                  <option value={1.2}>1.2x (Fast)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="furiganaMode">Furigana Mode</Label>
                <select
                  id="furiganaMode"
                  value={furiganaMode}
                  onChange={(e) =>
                    setFuriganaMode(
                      e.target.value as 'always' | 'hover' | 'hidden'
                    )
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                >
                  <option value="always">Always Show Furigana</option>
                  <option value="hover">Show on Hover/Tap</option>
                  <option value="hidden">Hide Furigana (Kanji)</option>
                </select>
              </div>
            </div>

            <Button type="submit" className="font-semibold">
              <Save className="h-4 w-4 mr-1.5" /> Save Profile Settings
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Data & Defaults Management */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary" />
              Defaults & Progress Management
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCustomStats(!showCustomStats)}
            >
              {showCustomStats ? 'Close Editor' : 'Custom Stats Editor'}
            </Button>
          </CardTitle>
          <CardDescription>
            Not locked to default numbers. Start fresh from 0, directly edit your
            streak & minutes, or export your full collection backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions Grid */}
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetToFresh}
              className="justify-start h-auto py-3 px-4 border-dashed border-2 hover:border-red-500/50 w-full sm:w-auto"
            >
              <RotateCcw className="h-5 w-5 mr-3 text-red-500 shrink-0" />
              <div className="text-left">
                <div className="font-bold text-sm">Start Fresh from 0</div>
                <div className="text-xs text-muted-foreground">
                  Reset streak, time, & XP to zero for your genuine journey
                </div>
              </div>
            </Button>
          </div>

          {/* Custom Stats Manual Editor */}
          {showCustomStats && (
            <form
              onSubmit={handleSaveCustomStats}
              className="rounded-xl border bg-muted/30 p-4 space-y-4 pt-4"
            >
              <h4 className="font-bold text-sm text-primary">
                Directly Customize Your Stats
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="customStreak" className="text-xs">
                    Current Streak (days)
                  </Label>
                  <Input
                    id="customStreak"
                    type="number"
                    min="0"
                    value={customStreak}
                    onChange={(e) => setCustomStreak(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customMins" className="text-xs">
                    Study Time (minutes)
                  </Label>
                  <Input
                    id="customMins"
                    type="number"
                    min="0"
                    value={customMins}
                    onChange={(e) => setCustomMins(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customXp" className="text-xs">
                    Total XP Points
                  </Label>
                  <Input
                    id="customXp"
                    type="number"
                    min="0"
                    value={customXp}
                    onChange={(e) => setCustomXp(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customVocab" className="text-xs">
                    Vocab Count
                  </Label>
                  <Input
                    id="customVocab"
                    type="number"
                    min="0"
                    value={customVocab}
                    onChange={(e) => setCustomVocab(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customKanji" className="text-xs">
                    Kanji Count
                  </Label>
                  <Input
                    id="customKanji"
                    type="number"
                    min="0"
                    value={customKanji}
                    onChange={(e) => setCustomKanji(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customGrammar" className="text-xs">
                    Grammar Points
                  </Label>
                  <Input
                    id="customGrammar"
                    type="number"
                    min="0"
                    value={customGrammar}
                    onChange={(e) => setCustomGrammar(Number(e.target.value))}
                  />
                </div>
              </div>
              <Button type="submit" size="sm">
                Apply Custom Stats
              </Button>
            </form>
          )}

          {/* Backup & Restore */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
            <div className="text-xs text-muted-foreground">
              Backup your entire local learning history, SRS cards, and league scores.
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleExportBackup}
              >
                <Download className="h-3.5 w-3.5 mr-1" /> Export JSON
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 mr-1" /> Restore Backup
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
