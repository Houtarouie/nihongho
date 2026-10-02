import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarCheck, Compass, Layers, BookOpen } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/theme-toggle'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center gap-2" href="/">
          <span className="font-bold text-xl text-primary tracking-tight">Nihongo</span>
        </Link>
        <nav className="ml-auto flex items-center gap-3 sm:gap-5">
          <Link
            className="text-xs sm:text-sm font-medium hover:underline underline-offset-4"
            href="/today"
          >
            Today
          </Link>
          <Link
            className="text-xs sm:text-sm font-medium hover:underline underline-offset-4"
            href="/path"
          >
            Path
          </Link>
          <Link
            className="text-xs sm:text-sm font-medium hover:underline underline-offset-4"
            href="/review"
          >
            Review
          </Link>
          <Link
            className="text-xs sm:text-sm font-medium hover:underline underline-offset-4"
            href="/library"
          >
            Library
          </Link>
          <Link
            className="text-xs sm:text-sm font-medium hover:underline underline-offset-4"
            href="/login"
          >
            Login
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                  Learn Japanese, one day at a time.
                </h1>
                <p className="mx-auto max-w-[720px] text-muted-foreground text-sm sm:text-base md:text-xl pt-2">
                  A structured learning path for JLPT N5, daily spaced-repetition reviews, interactive kana charts, and curated grammar.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <Link href="/today">
                  <Button size="lg" className="rounded-xl">Start Today &rarr;</Button>
                </Link>
                <Link href="/path">
                  <Button variant="outline" size="lg" className="rounded-xl">
                    Explore Learning Path
                  </Button>
                </Link>
                <Link href="/library?tab=kana">
                  <Button variant="secondary" size="lg" className="rounded-xl">
                    Kana Charts
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 bg-muted/40 border-t">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/today">
                <Card className="h-full hover:border-primary/50 transition-all rounded-2xl">
                  <CardHeader className="pb-2">
                    <CalendarCheck className="h-6 w-6 text-primary mb-1" />
                    <CardTitle className="text-lg">Daily Habit</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Clear what&apos;s due today in 5–15 minutes with spaced repetition that sticks.
                  </CardContent>
                </Card>
              </Link>

              <Link href="/path">
                <Card className="h-full hover:border-primary/50 transition-all rounded-2xl">
                  <CardHeader className="pb-2">
                    <Compass className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-1" />
                    <CardTitle className="text-lg">Guided Path</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Step-by-step units covering Kana, essential particles, and N5 fundamentals.
                  </CardContent>
                </Card>
              </Link>

              <Link href="/review">
                <Card className="h-full hover:border-primary/50 transition-all rounded-2xl">
                  <CardHeader className="pb-2">
                    <Layers className="h-6 w-6 text-green-600 dark:text-green-400 mb-1" />
                    <CardTitle className="text-lg">Smart SRS Review</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Spaced repetition with active recall, thumb-friendly buttons, and mistake tracking.
                  </CardContent>
                </Card>
              </Link>

              <Link href="/library">
                <Card className="h-full hover:border-primary/50 transition-all rounded-2xl">
                  <CardHeader className="pb-2">
                    <BookOpen className="h-6 w-6 text-orange-500 mb-1" />
                    <CardTitle className="text-lg">Rich Library</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Curated grammar explanations with cloze examples, vocabulary, and kana audio.
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
