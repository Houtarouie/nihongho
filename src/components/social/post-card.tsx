'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Heart, MessageSquare, Share2 } from 'lucide-react'
import { toast } from 'sonner'

export interface CommunityPost {
  id: string
  author: {
    name: string
    username: string
    avatar: string
  }
  content: string
  timeAgo: string
  likes: number
  likedByMe?: boolean
  comments: number
  commentsList?: { id: string; author: string; text: string }[]
  jlptLevel?: string
}

interface PostProps {
  post: CommunityPost
  onToggleLike?: (id: string) => void
  onAddComment?: (id: string, text: string) => void
}

export function PostCard({ post, onToggleLike, onAddComment }: PostProps) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')

  function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    onAddComment?.(post.id, commentText.trim().slice(0, 300))
    setCommentText('')
  }

  return (
    <Card className="mb-4">
      <CardHeader className="p-4 pb-2 flex flex-row items-start space-y-0">
        <div className="flex items-center gap-3 flex-1">
          <Avatar>
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{post.author.name}</span>
              <span className="text-muted-foreground text-xs">
                @{post.author.username}
              </span>
              <span className="text-muted-foreground text-xs">
                · {post.timeAgo}
              </span>
            </div>
            {post.jlptLevel && (
              <span className="text-xs font-medium text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
                {post.jlptLevel}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {post.content}
        </p>
      </CardContent>
      <CardFooter className="px-4 py-3 border-t flex flex-col items-stretch gap-3">
        <div className="flex gap-6 text-muted-foreground w-full">
          <button
            type="button"
            onClick={() => onToggleLike?.(post.id)}
            className={`flex items-center gap-1.5 transition-colors ${
              post.likedByMe
                ? 'text-red-500 font-semibold'
                : 'hover:text-primary'
            }`}
          >
            <Heart
              className={`h-4 w-4 ${post.likedByMe ? 'fill-red-500' : ''}`}
            />
            <span className="text-xs">{post.likes}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">{post.comments}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(post.content)
              }
              toast.success('Post copied to clipboard!')
            }}
            className="flex items-center gap-1.5 hover:text-primary transition-colors ml-auto"
            title="Share post"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {showComments && (
          <div className="pt-2 border-t space-y-3 w-full">
            {post.commentsList && post.commentsList.length > 0 && (
              <div className="space-y-2">
                {post.commentsList.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg bg-muted/60 px-3 py-2 text-xs"
                  >
                    <span className="font-semibold mr-2">{c.author}:</span>
                    <span>{c.text}</span>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <Input
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={300}
                className="h-8 text-xs"
              />
              <Button type="submit" size="sm" className="h-8">
                Reply
              </Button>
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
