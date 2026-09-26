import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="#">
          <span className="font-bold text-xl text-primary">Nihongo</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Login
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Learn Japanese together. <br className="hidden sm:inline" />
                  Every day.
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl pt-4">
                  Study. Share. Build your streak. Reach your JLPT goal.
                </p>
              </div>
              <div className="space-x-4 pt-4">
                <Link href="/login">
                  <Button size="lg">Start Learning</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg">Enter Demo Mode</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
