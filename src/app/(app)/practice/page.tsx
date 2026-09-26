'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const MOCK_REVIEW = {
  word: '食べる',
  reading: 'たべる',
  meaning: 'to eat'
}

export default function PracticePage() {
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <div className="max-w-xl mx-auto flex flex-col h-[calc(100vh-12rem)]">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Daily Review</h1>
        <p className="text-muted-foreground">14 cards due today</p>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <Card className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 cursor-pointer shadow-md transition-all hover:shadow-lg" onClick={() => !showAnswer && setShowAnswer(true)}>
          <CardContent className="space-y-6">
            <h2 className="text-6xl font-bold">{MOCK_REVIEW.word}</h2>
            
            {showAnswer ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <p className="text-2xl text-blue-500 font-medium">{MOCK_REVIEW.reading}</p>
                <p className="text-xl text-muted-foreground">{MOCK_REVIEW.meaning}</p>
              </div>
            ) : (
              <p className="text-muted-foreground mt-8">Tap to show answer</p>
            )}
          </CardContent>
        </Card>
      </div>

      {showAnswer && (
        <div className="grid grid-cols-4 gap-2 mt-8 animate-in fade-in duration-300">
          <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => setShowAnswer(false)}>
            Again
            <span className="block text-xs mt-1 text-muted-foreground">&lt; 1m</span>
          </Button>
          <Button variant="outline" className="text-orange-500 border-orange-200 hover:bg-orange-50" onClick={() => setShowAnswer(false)}>
            Hard
            <span className="block text-xs mt-1 text-muted-foreground">2d</span>
          </Button>
          <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => setShowAnswer(false)}>
            Good
            <span className="block text-xs mt-1 text-muted-foreground">4d</span>
          </Button>
          <Button variant="outline" className="text-blue-500 border-blue-200 hover:bg-blue-50" onClick={() => setShowAnswer(false)}>
            Easy
            <span className="block text-xs mt-1 text-muted-foreground">7d</span>
          </Button>
        </div>
      )}
    </div>
  )
}
