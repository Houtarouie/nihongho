'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface PostComposerProps {
  onCreatePost?: (content: string, jlptLevel: string) => void
}

export function PostComposer({ onCreatePost }: PostComposerProps) {
  const [content, setContent] = useState('')
  const [jlptLevel, setJlptLevel] = useState('N5')

  function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed) return
    onCreatePost?.(trimmed.slice(0, 1000), jlptLevel)
    setContent('')
    toast.success('Post shared with the community!')
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4 flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src="" />
          <AvatarFallback>Me</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="What did you learn in Japanese today? (e.g. Practiced Hiragana or learned 〜たい form!)"
            className="min-h-[90px] resize-none border-none focus-visible:ring-0 p-0 shadow-none text-base"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
          />
        </div>
      </CardContent>
      <CardFooter className="px-4 py-3 bg-muted/40 border-t flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Level tag:</span>
          <select
            value={jlptLevel}
            onChange={(e) => setJlptLevel(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs font-medium"
          >
            <option value="N5">JLPT N5</option>
            <option value="N4">JLPT N4</option>
            <option value="N3">JLPT N3</option>
            <option value="N2">JLPT N2</option>
            <option value="N1">JLPT N1</option>
          </select>
        </div>
        <Button size="sm" onClick={handleSubmit} disabled={!content.trim()}>
          <Send className="h-4 w-4 mr-2" />
          Post Learning
        </Button>
      </CardFooter>
    </Card>
  )
}
