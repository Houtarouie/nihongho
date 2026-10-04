'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useProgress } from '@/lib/progress'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function OnboardingDialog() {
  const router = useRouter()
  const { stats, updateStats, kanaMastery, isLoading } = useProgress()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Only show on first run if user hasn't seen onboarding and has no kana progress
    if (isLoading) return
    const hasSeenOnboarding = Boolean(stats.completedLessons?.includes('onboarding_seen'))
    const hasProgress = Object.keys(kanaMastery).length > 0
    if (!hasSeenOnboarding && !hasProgress) {
      setIsOpen(true)
    }
  }, [isLoading, stats.completedLessons, kanaMastery])

  if (!isOpen) return null

  async function handleSelect(level: 'beginner' | 'hiragana' | 'both') {
    setIsOpen(false)
    const currentLessons = stats.completedLessons || []
    await updateStats({
      completedLessons: Array.from(new Set([...currentLessons, 'onboarding_seen'])),
    })

    if (level === 'beginner') {
      router.push('/path')
    } else if (level === 'hiragana') {
      router.push('/path?placement=hiragana')
    } else if (level === 'both') {
      router.push('/path?placement=both')
    }
  }

  async function handleDismiss() {
    setIsOpen(false)
    const currentLessons = stats.completedLessons || []
    await updateStats({
      completedLessons: Array.from(new Set([...currentLessons, 'onboarding_seen'])),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md rounded-3xl border-2 border-primary/20 shadow-2xl overflow-hidden bg-card">
        <CardHeader className="text-center pb-2 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 text-xl font-japanese font-bold">
            日
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">
            Welcome to Nihongo! 🌸
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            What is your current Japanese reading level?
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-3">
          <button
            onClick={() => handleSelect('beginner')}
            className="w-full text-left p-3.5 rounded-2xl border bg-muted/30 hover:bg-primary/5 hover:border-primary/40 transition-all space-y-0.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                Complete Beginner
              </span>
              <span className="text-xs font-mono text-muted-foreground">Start at あ</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Learn Hiragana and Katakana step-by-step from zero before grammar and vocabulary.
            </p>
          </button>

          <button
            onClick={() => handleSelect('hiragana')}
            className="w-full text-left p-3.5 rounded-2xl border bg-muted/30 hover:bg-primary/5 hover:border-primary/40 transition-all space-y-0.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                I know Hiragana
              </span>
              <span className="text-xs font-mono text-primary font-semibold">Test Out (20Q)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Take a quick 20-question placement quiz to verify Hiragana and unlock Unit 1 directly.
            </p>
          </button>

          <button
            onClick={() => handleSelect('both')}
            className="w-full text-left p-3.5 rounded-2xl border bg-muted/30 hover:bg-primary/5 hover:border-primary/40 transition-all space-y-0.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                I know Hiragana + Katakana
              </span>
              <span className="text-xs font-mono text-primary font-semibold">Test Out (20Q)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Test out of both kana alphabets and immediately jump into core sentences &amp; grammar.
            </p>
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
