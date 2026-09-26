'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ImagePlus, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function PostComposer() {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    if (!content.trim()) return
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setContent('')
    toast.success("Post created!")
    setIsSubmitting(false)
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
            placeholder="What did you learn today?"
            className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 shadow-none text-base"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          {/* Mock image attachment area */}
        </div>
      </CardContent>
      <CardFooter className="px-4 py-3 bg-muted/50 border-t flex justify-between items-center">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
          <ImagePlus className="h-5 w-5 mr-2" />
          Photo
        </Button>
        <Button 
          size="sm" 
          onClick={handleSubmit} 
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Post Learning
        </Button>
      </CardFooter>
    </Card>
  )
}
