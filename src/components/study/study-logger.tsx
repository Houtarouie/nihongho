'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { loadUserStats, saveUserStats, recordCompletedStudy } from '@/data/srs-deck'

export function StudyLogger() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const form = event.currentTarget
    const formData = new FormData(form)

    const vocab = Math.min(
      1000,
      Math.max(0, Number(formData.get('vocabulary_count')) || 0)
    )
    const kanji = Math.min(
      1000,
      Math.max(0, Number(formData.get('kanji_count')) || 0)
    )
    const grammar = Math.min(
      1000,
      Math.max(0, Number(formData.get('grammar_count')) || 0)
    )
    const duration = Math.min(
      720,
      Math.max(1, Number(formData.get('duration_mins')) || 15)
    )

    recordCompletedStudy(1)
    const stats = loadUserStats()
    const earnedXp = duration * 2 + vocab * 3 + kanji * 5 + grammar * 5

    saveUserStats({
      totalStudyMins: stats.totalStudyMins + duration,
      vocabCount: stats.vocabCount + vocab,
      kanjiCount: stats.kanjiCount + kanji,
      grammarCount: stats.grammarCount + grammar,
      xp: stats.xp + earnedXp,
    })

    toast.success(`Study session logged! +${earnedXp} XP 🔥`, {
      description: `Added ${duration} mins, ${vocab} vocab, ${kanji} kanji, ${grammar} grammar.`,
    })
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Today&apos;s Study</CardTitle>
        <CardDescription>
          Record what you studied today to build your streak and earn XP.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vocab">Vocabulary (words)</Label>
              <Input
                id="vocab"
                name="vocabulary_count"
                type="number"
                defaultValue="5"
                min="0"
                max="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kanji">Kanji</Label>
              <Input
                id="kanji"
                name="kanji_count"
                type="number"
                defaultValue="2"
                min="0"
                max="1000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grammar">Grammar Points</Label>
              <Input
                id="grammar"
                name="grammar_count"
                type="number"
                defaultValue="1"
                min="0"
                max="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Total Time (mins)</Label>
              <Input
                id="duration"
                name="duration_mins"
                type="number"
                defaultValue="15"
                min="1"
                max="720"
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Log Study Session
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
