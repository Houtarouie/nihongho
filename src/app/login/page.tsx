'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, UserCheck } from 'lucide-react'
import { saveUserStats } from '@/data/srs-deck'
import { ThemeToggle } from '@/components/layout/theme-toggle'

const PRESET_ACCOUNTS = [
  {
    displayName: 'Kenji',
    username: 'kenjilearns',
    email: 'kenji@nihongo.app',
    targetJlpt: 'N5',
    currentStreak: 14,
    longestStreak: 21,
    xp: 1240,
    totalStudyMins: 320,
    vocabCount: 145,
    kanjiCount: 42,
    grammarCount: 28,
    completedLessons: ['hiragana-chart', 'katakana-chart'],
  },
  {
    displayName: 'Sakura',
    username: 'sakura_tokyo',
    email: 'sakura@nihongo.app',
    targetJlpt: 'N3',
    currentStreak: 38,
    longestStreak: 45,
    xp: 4820,
    totalStudyMins: 1450,
    vocabCount: 620,
    kanjiCount: 215,
    grammarCount: 94,
    completedLessons: [
      'hiragana-chart',
      'katakana-chart',
      'greetings-aisatsu',
      'self-introduction',
      'wa-vs-ga',
      'tai-form',
    ],
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)

  function handlePresetLogin(preset: (typeof PRESET_ACCOUNTS)[number]) {
    saveUserStats(preset)
    toast.success(`Signed in as ${preset.displayName} (${preset.email})`)
    router.push('/dashboard')
  }

  async function onSubmit(
    event: React.FormEvent<HTMLFormElement>,
    action: typeof login | typeof signup
  ) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = (formData.get('email') as string)?.trim() || 'student@nihongo.app'
    const username =
      (formData.get('username') as string)?.trim() || email.split('@')[0]

    try {
      const result = await action(formData)
      setIsLoading(false)

      if (result?.fallback) {
        // Offline / local fallback when Supabase env is not configured
        saveUserStats({
          displayName: username,
          username: username.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'student',
          email,
        })
        toast.success(`Welcome, ${username}!`)
        router.push('/dashboard')
        return
      }

      if (result?.error) {
        toast.error('Authentication Error', {
          description: result.error,
        })
      }
    } catch {
      setIsLoading(false)
      saveUserStats({
        displayName: username,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'student',
        email,
      })
      toast.success(`Signed in as ${username}!`)
      router.push('/dashboard')
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-muted/40 px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Nihongo</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Learn Japanese together. Every day.
          </p>
        </div>

        {/* Instant 1-Click Built-in Accounts */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" /> Quick Access Accounts (No Setup Needed)
            </CardTitle>
            <CardDescription className="text-xs">
              Click either built-in account below to sign in immediately:
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESET_ACCOUNTS.map((acc) => (
              <Button
                key={acc.email}
                type="button"
                variant="outline"
                className="h-auto py-2.5 px-3 flex flex-col items-start text-left bg-background hover:border-primary"
                onClick={() => handlePresetLogin(acc)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm">{acc.displayName}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    JLPT {acc.targetJlpt}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground truncate w-full mt-0.5">
                  {acc.email}
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>

        <div className="w-full space-y-4">
          <div className="flex w-full rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
                isLogin
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
                !isLogin
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {isLogin ? (
            <Card>
              <form onSubmit={(e) => onSubmit(e, login)}>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>
                    Enter your email and password to log in.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      defaultValue="kenji@nihongo.app"
                      placeholder="kenji@nihongo.app"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      defaultValue="nihongo123"
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      'Log in'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          ) : (
            <Card>
              <form onSubmit={(e) => onSubmit(e, signup)}>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Enter your details to start learning Japanese.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      name="username"
                      placeholder="kenjilearns"
                      maxLength={30}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      minLength={6}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      'Sign up'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
