import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Heart, MessageSquare, Share2, MoreHorizontal } from 'lucide-react'

interface PostProps {
  post: {
    id: string
    author: {
      name: string
      username: string
      avatar: string
    }
    content: string
    timeAgo: string
    likes: number
    comments: number
    jlptLevel?: string
  }
}

export function PostCard({ post }: PostProps) {
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
              <span className="text-muted-foreground text-xs">@{post.author.username}</span>
              <span className="text-muted-foreground text-xs">· {post.timeAgo}</span>
            </div>
            {post.jlptLevel && (
              <span className="text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full w-fit mt-1">
                {post.jlptLevel}
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="whitespace-pre-wrap">{post.content}</p>
      </CardContent>
      <CardFooter className="px-4 py-3 border-t flex gap-6 text-muted-foreground">
        <button className="flex items-center gap-2 hover:text-primary transition-colors">
          <Heart className="h-4 w-4" />
          <span className="text-xs">{post.likes}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-primary transition-colors">
          <MessageSquare className="h-4 w-4" />
          <span className="text-xs">{post.comments}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-primary transition-colors ml-auto">
          <Share2 className="h-4 w-4" />
        </button>
      </CardFooter>
    </Card>
  )
}
