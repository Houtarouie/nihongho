'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function StudyLogger() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    
    // Will hook up to Supabase next
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData.entries())
    console.log(data)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.success("Study session logged!", {
      description: "Keep up the great work 🔥"
    })
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Today&apos;s Study</CardTitle>
        <CardDescription>Record what you studied today to maintain your streak.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vocab">Vocabulary (words)</Label>
              <Input id="vocab" name="vocabulary_count" type="number" defaultValue="0" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kanji">Kanji</Label>
              <Input id="kanji" name="kanji_count" type="number" defaultValue="0" min="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grammar">Grammar Points</Label>
              <Input id="grammar" name="grammar_count" type="number" defaultValue="0" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Total Time (mins)</Label>
              <Input id="duration" name="duration_mins" type="number" defaultValue="15" min="1" required />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Log Study Session"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
