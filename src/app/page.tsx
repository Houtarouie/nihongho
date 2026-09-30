import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Layers, Users, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/theme-toggle'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center gap-2" href="/">
          <span className="font-bold text-xl text-primary">Nihongo</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            Anki SRS
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-3 sm:gap-5">
          <Link
            className="text-xs sm:text-sm font-medium hover:underline underline-offset-4"
            href="/learn"
          >
            Kana
          </Link>
          <Link
            className="text-xs sm:text-sm font-medium hover:underline underline-offset-4"
            href="/grammar"
          >
            Grammar (979)
          </Link>
          <Link
            className="text-xs sm:text-sm font-medium hover:underline underline-offset-4"
            href="/practice"
          >
            Anki SRS
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
                  Learn Japanese together. <br className="hidden sm:inline" />
                  Powered by Anki FSRS &amp; SM-2.
                </h1>
                <p className="mx-auto max-w-[720px] text-muted-foreground text-sm sm:text-base md:text-xl pt-2">
                  Interactive Hiragana &amp; Katakana charts, full Anki deck management (FSRS v4.5, Cloze deletions, Type-in-Answer, Card Browser, Heatmap &amp; AnkiConnect sync), and a 979-point JLPT N5–N1 Grammar Dictionary.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <Link href="/dashboard">
                  <Button size="lg">Open Dashboard &rarr;</Button>
                </Link>
                <Link href="/practice">
                  <Button variant="outline" size="lg">
                    Launch Anki SRS
                  </Button>
                </Link>
                <Link href="/learn?lesson=hiragana">
                  <Button variant="secondary" size="lg">
                    Hiragana &amp; Katakana
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 bg-muted/40 border-t">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/learn?lesson=hiragana">
                <Card className="h-full hover:border-primary/50 transition-all">
                  <CardHeader className="pb-2">
                    <Sparkles className="h-6 w-6 text-primary mb-1" />
                    <CardTitle className="text-lg">Kana Charts &amp; Quiz</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Full Gojūon, Dakuten, and Yōon Hiragana &amp; Katakana tables with native audio pronunciation.
                  </CardContent>
                </Card>
              </Link>

              <Link href="/practice">
                <Card className="h-full hover:border-primary/50 transition-all">
                  <CardHeader className="pb-2">
                    <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-1" />
                    <CardTitle className="text-lg">Full Anki Suite</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    FSRS &amp; SM-2 schedulers, Subdecks, Cloze, Type-Answer, Card Browser, Heatmap, and AnkiConnect desktop sync.
                  </CardContent>
                </Card>
              </Link>

              <Link href="/grammar">
                <Card className="h-full hover:border-primary/50 transition-all">
                  <CardHeader className="pb-2">
                    <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400 mb-1" />
                    <CardTitle className="text-lg">979 Grammar Points</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Searchable dictionary covering JLPT N5, N4, N3, N2, N1, Non-JLPT slang, and Kansai-ben.
                  </CardContent>
                </Card>
              </Link>

              <Link href="/community">
                <Card className="h-full hover:border-primary/50 transition-all">
                  <CardHeader className="pb-2">
                    <Users className="h-6 w-6 text-orange-500 mb-1" />
                    <CardTitle className="text-lg">Study Community</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Log daily study sessions, maintain your streak, and share milestones with fellow learners.
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
