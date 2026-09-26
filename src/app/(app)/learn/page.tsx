import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BookOpen, CheckCircle, Lock } from 'lucide-react'

export default function LearnPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">JLPT N5 Curriculum</h1>
        <p className="text-muted-foreground">Master the basics of Japanese grammar, vocabulary, and kanji.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Section 1 */}
        <Card className="border-primary/50 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">1. Hiragana & Katakana</CardTitle>
                <CardDescription>The foundation of Japanese reading.</CardDescription>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={100} className="h-2" />
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start">
                <BookOpen className="mr-2 h-4 w-4" /> Hiragana Chart
              </Button>
              <Button variant="outline" className="justify-start">
                <BookOpen className="mr-2 h-4 w-4" /> Katakana Basics
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 2 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">2. Basic Greetings & Intro</CardTitle>
                <CardDescription>Introduce yourself and say hello.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={45} className="h-2" />
            <div className="grid gap-2">
              <Button variant="default" className="justify-start">
                <BookOpen className="mr-2 h-4 w-4" /> Greetings (Aisatsu)
              </Button>
              <Button variant="outline" className="justify-start">
                <BookOpen className="mr-2 h-4 w-4" /> Self Introduction
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 3 */}
        <Card className="opacity-75">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">3. Sentence Structure</CardTitle>
                <CardDescription>Subject, object, and verbs.</CardDescription>
              </div>
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={0} className="h-2" />
            <div className="grid gap-2">
              <Button variant="outline" disabled className="justify-start">
                <BookOpen className="mr-2 h-4 w-4" /> は vs が
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
