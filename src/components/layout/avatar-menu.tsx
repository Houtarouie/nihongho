'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  LogOut,
  LogIn,
  RefreshCw,
  Volume2,
  Eye,
  Target,
  Cloud,
  HardDrive,
  X,
  FileCode,
} from 'lucide-react'
import { useProgress } from '@/lib/progress'
import { createClient } from '@/lib/supabase/client'
import { exportUserDataBackup, importUserDataBackup, type SRSCard } from '@/data/srs-deck'
import { parseAnkiApkgBinary } from '@/lib/anki/importer'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AvatarMenuProps {
  align?: 'left' | 'right'
  trigger?: React.ReactNode
}

export function AvatarMenu({ align = 'right', trigger }: AvatarMenuProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { stats, updateStats, isGuest, syncNow, isSyncing, refreshAll, upsertCards } = useProgress()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const backupInputRef = useRef<HTMLInputElement | null>(null)
  const apkgInputRef = useRef<HTMLInputElement | null>(null)

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  async function handleDailyGoal(mins: number) {
    try {
      await updateStats({ dailyGoalMins: mins })
      toast.success(`Daily goal set to ${mins} minutes`)
    } catch {
      toast.error('Failed to update daily goal')
    }
  }

  async function handleFurigana(mode: 'always' | 'hover' | 'hidden') {
    try {
      await updateStats({ furiganaMode: mode })
      toast.success(`Furigana display set to ${mode}`)
    } catch {
      toast.error('Failed to update furigana mode')
    }
  }

  async function handleAudioSpeed(speed: number) {
    try {
      await updateStats({ audioSpeed: speed })
      toast.success(`Audio speed set to ${speed}x`)
    } catch {
      toast.error('Failed to update audio speed')
    }
  }

  function handleExportBackup() {
    try {
      const dataStr = exportUserDataBackup()
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nihongo-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Backup downloaded successfully')
    } catch {
      toast.error('Failed to generate backup')
    }
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const success = importUserDataBackup(text)
        if (success) {
          await refreshAll()
          toast.success('Progress restored from backup!')
          setIsOpen(false)
        } else {
          toast.error('Invalid backup file format')
        }
      } catch {
        toast.error('Failed to read backup file')
      }
    }
    reader.readAsText(file)
  }

  async function handleImportApkg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      toast.info('Extracting Anki deck...')
      const parsed = await parseAnkiApkgBinary(file)
      if (parsed && parsed.length > 0) {
        const newCards: SRSCard[] = parsed.map((p, idx) => ({
          id: `apkg-${Date.now()}-${idx}`,
          front: p.front,
          reading: p.reading,
          meaning: p.meaning,
          category: p.category || 'vocabulary',
          jlptLevel: p.jlptLevel || 'N5',
          exampleSentence: p.exampleSentence,
          exampleTranslation: p.exampleTranslation,
          tags: p.tags,
          interval: 0,
          repetition: 0,
          efactor: 2.5,
          dueDate: Date.now(),
          status: 'new',
          queue: 'active',
          lapses: 0,
        }))
        const res = await upsertCards(newCards)
        toast.success(`Imported ${res.addedCount} cards from ${file.name}!`)
        setIsOpen(false)
      } else {
        toast.error('No readable cards found in .apkg file')
      }
    } catch {
      toast.error('Failed to parse .apkg file')
    }
  }

  async function handleSync() {
    try {
      const res = await syncNow()
      if (res.success) {
        toast.success(`Synced ${res.pushedCards ?? 0} cards and ${res.pushedReviews ?? 0} reviews to cloud`)
      } else {
        toast.error(res.error || 'Sync failed')
      }
    } catch {
      toast.error('Sync failed')
    }
  }

  async function handleSignOut() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.success('Signed out')
      router.push('/login')
      setIsOpen(false)
    } catch {
      toast.error('Sign out error')
    }
  }

  const dropdownPositionClass =
    align === 'left'
      ? 'left-0 sm:left-full bottom-0 sm:bottom-0 sm:ml-3 mb-2 sm:mb-0'
      : 'right-0 top-full mt-2'

  return (
    <div className={trigger ? 'relative w-full block' : 'relative inline-block'} ref={menuRef}>
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)} role="button" tabIndex={0} className="w-full">
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 transition-all border border-primary/20 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Open settings menu"
          aria-expanded={isOpen}
        >
          <span>{stats.avatar || '🌸'}</span>
        </button>
      )}

      {isOpen && (
        <div
          className={`absolute ${dropdownPositionClass} w-80 sm:w-96 max-w-[calc(100vw-32px)] rounded-3xl border bg-popover p-4 text-popover-foreground shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-100 max-h-[85vh] overflow-y-auto`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b mb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-xl shrink-0">
                {stats.avatar || '🌸'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{stats.displayName || 'Learner'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isGuest ? (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground gap-1 border-muted">
                      <HardDrive className="h-2.5 w-2.5" />
                      Guest (Saved locally)
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-[10px] py-0 px-1.5 gap-1 bg-green-600/90 text-white">
                      <Cloud className="h-2.5 w-2.5" />
                      Cloud synced
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Preferences */}
          <div className="space-y-3 pb-3 border-b text-xs">
            {/* Daily Goal */}
            <div>
              <div className="flex items-center justify-between mb-1.5 font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  Daily Study Goal
                </span>
                <span className="font-semibold text-foreground">{stats.dailyGoalMins || 15}m</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[5, 10, 15, 20].map((m) => (
                  <button
                    key={m}
                    onClick={() => handleDailyGoal(m)}
                    className={`py-1 rounded-md text-xs font-medium border transition-colors ${
                      (stats.dailyGoalMins || 15) === m
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/40 hover:bg-muted text-muted-foreground border-transparent'
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>

            {/* Furigana Mode */}
            <div>
              <div className="flex items-center justify-between mb-1.5 font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  Furigana (Ruby)
                </span>
                <span className="font-semibold capitalize text-foreground">{stats.furiganaMode || 'always'}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['always', 'hover', 'hidden'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleFurigana(mode)}
                    className={`py-1 rounded-md text-xs font-medium capitalize border transition-colors ${
                      (stats.furiganaMode || 'always') === mode
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/40 hover:bg-muted text-muted-foreground border-transparent'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Speed */}
            <div>
              <div className="flex items-center justify-between mb-1.5 font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-primary" />
                  Audio Speed
                </span>
                <span className="font-semibold text-foreground">{stats.audioSpeed || 1.0}x</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { speed: 0.8, label: '0.8x (Slower)' },
                  { speed: 1.0, label: '1.0x (Normal)' },
                ].map((s) => (
                  <button
                    key={s.speed}
                    onClick={() => handleAudioSpeed(s.speed)}
                    className={`py-1 rounded-md text-xs font-medium border transition-colors ${
                      (stats.audioSpeed || 1.0) === s.speed
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/40 hover:bg-muted text-muted-foreground border-transparent'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5 font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 text-primary" />
                  Theme
                </span>
                <span className="font-semibold capitalize text-foreground">{theme || 'system'}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Laptop },
                ].map((t) => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex items-center justify-center gap-1 py-1 rounded-md text-xs font-medium border transition-colors ${
                        theme === t.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/40 hover:bg-muted text-muted-foreground border-transparent'
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Backup & Anki Import */}
          <div className="py-2.5 border-b space-y-1.5 text-xs">
            {!isGuest && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full justify-start gap-2 h-8 text-xs font-normal"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing to cloud...' : 'Sync progress to cloud'}
              </Button>
            )}

            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportBackup}
                className="justify-start gap-1.5 h-8 text-xs font-normal"
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                Export backup
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => backupInputRef.current?.click()}
                className="justify-start gap-1.5 h-8 text-xs font-normal"
              >
                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                Import backup
              </Button>
            </div>

            {/* Import Anki .apkg */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => apkgInputRef.current?.click()}
              className="w-full justify-start gap-2 h-8 text-xs font-normal border-primary/20 text-primary hover:bg-primary/10"
            >
              <FileCode className="h-3.5 w-3.5" />
              Import Anki Deck (.apkg / .colpkg)
            </Button>

            <input
              type="file"
              ref={backupInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
            <input
              type="file"
              ref={apkgInputRef}
              onChange={handleImportApkg}
              accept=".apkg,.colpkg"
              className="hidden"
            />
          </div>

          {/* Account Footer */}
          <div className="pt-2 text-xs">
            {isGuest ? (
              <Button
                size="sm"
                onClick={() => {
                  setIsOpen(false)
                  router.push('/login')
                }}
                className="w-full gap-2 h-8 text-xs"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign in to save progress
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start gap-2 h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
