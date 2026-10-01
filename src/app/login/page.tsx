'use client'

import { useState } from 'react'
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
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/theme-toggle'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)

  async function onSubmit(
    event: React.FormEvent<HTMLFormElement>,
    action: typeof login | typeof signup
  ) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)

    try {
      const result = await action(formData)
      setIsLoading(false)

      if (result?.error) {
        toast.error('Authentication Error', {
          description: result.error,
        })
      }
    } catch (err) {
      setIsLoading(false)
      // Allow Next.js redirect exceptions (NEXT_REDIRECT) to bubble
      if (
        err &&
        typeof err === 'object' &&
        'digest' in err &&
        typeof (err as { digest: string }).digest === 'string' &&
        (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
      ) {
        throw err
      }
      toast.error('Authentication Error', {
        description:
          err instanceof Error
            ? err.message
            : 'An error occurred during authentication.',
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
