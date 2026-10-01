'use client'

import { useState, useEffect } from 'react'
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
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { createClient } from '@/lib/supabase/client'
import { getSupabaseEnv } from '@/lib/supabase/config'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [nextUrl, setNextUrl] = useState('/dashboard')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const next = params.get('next')
      if (next && next.startsWith('/')) {
        setNextUrl(next)
      }
    }
  }, [])

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = (formData.get('email') as string)?.trim()
    const password = formData.get('password') as string

    if (!email || !password) {
      setIsLoading(false)
      toast.error('Validation Error', { description: 'Email and password are required.' })
      return
    }

    const { isConfigured, isDashboardUrl } = getSupabaseEnv()
    if (isDashboardUrl) {
      setIsLoading(false)
      toast.error('Configuration Error', {
        description: 'NEXT_PUBLIC_SUPABASE_URL is set to the Dashboard URL. Please use https://<project-id>.supabase.co.',
      })
      return
    }
    if (!isConfigured) {
      setIsLoading(false)
      toast.error('Configuration Error', {
        description: 'Authentication is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      })
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setIsLoading(false)
        toast.error('Login Failed', {
          description: error.message,
        })
        return
      }

      toast.success('Welcome back!')
      window.location.href = nextUrl
    } catch (err) {
      setIsLoading(false)
      toast.error('Connection Error', {
        description:
          err instanceof Error
            ? err.message
            : 'Could not connect to the authentication service.',
      })
    }
  }

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = (formData.get('email') as string)?.trim()
    const password = formData.get('password') as string
    const username = (formData.get('username') as string)?.trim()

    if (!email || !password) {
      setIsLoading(false)
      toast.error('Validation Error', { description: 'Email and password are required.' })
      return
    }

    const { isConfigured, isDashboardUrl } = getSupabaseEnv()
    if (isDashboardUrl) {
      setIsLoading(false)
      toast.error('Configuration Error', {
        description: 'NEXT_PUBLIC_SUPABASE_URL is set to the Dashboard URL. Please use https://<project-id>.supabase.co.',
      })
      return
    }
    if (!isConfigured) {
      setIsLoading(false)
      toast.error('Configuration Error', {
        description: 'Authentication is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      })
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      })

      if (error) {
        setIsLoading(false)
        toast.error('Signup Failed', {
          description: error.message,
        })
        return
      }

      if (data.user && !data.session) {
        setIsLoading(false)
        toast.info('Account created!', {
          description:
            'Please check your email to confirm your account, or disable "Confirm email" in Supabase settings to log in immediately.',
        })
        return
      }

      toast.success('Account created!')
      window.location.href = nextUrl
    } catch (err) {
      setIsLoading(false)
      toast.error('Connection Error', {
        description:
          err instanceof Error
            ? err.message
            : 'Could not connect to the authentication service.',
      })
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
              <form onSubmit={handleLogin}>
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
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
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
              <form onSubmit={handleSignup}>
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
                      placeholder="e.g. tarobun"
                      maxLength={30}
                      autoComplete="username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="At least 6 characters"
                      minLength={6}
                      autoComplete="new-password"
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
