'use client'

import { useState, useEffect } from 'react'
import { PostComposer } from '@/components/social/post-composer'
import { PostCard, type CommunityPost } from '@/components/social/post-card'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Flame, UserPlus, Check } from 'lucide-react'
import { loadUserStats } from '@/data/srs-deck'

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: '1',
    author: {
      name: 'Kenji',
      username: 'kenjilearns',
      avatar: '',
    },
    content:
      'Day 14 🇯🇵\nLearned the ヤ・ユ・ヨ row and Dakuten characters today.\nAlso reviewed 15 vocabulary flashcards in the SRS deck. Getting the hang of it!',
    timeAgo: '2h',
    likes: 14,
    likedByMe: false,
    comments: 2,
    commentsList: [
      { id: 'c1', author: 'Sarah', text: 'Keep up the streak! 🔥' },
      { id: 'c2', author: 'Takeshi', text: 'Dakuten gets super easy after a few days!' },
    ],
    jlptLevel: 'N5',
  },
  {
    id: '2',
    author: {
      name: 'Sarah',
      username: 'sarah_tokyo',
      avatar: '',
    },
    content:
      'Today I finally understood the difference between は and が! The explanation in the curriculum lesson was super helpful. Now practicing N4 grammar points.',
    timeAgo: '5h',
    likes: 32,
    likedByMe: false,
    comments: 1,
    commentsList: [
      { id: 'c3', author: 'Kenji', text: 'That lesson helped me a ton too!' },
    ],
    jlptLevel: 'N4',
  },
  {
    id: '3',
    author: {
      name: 'Yuki',
      username: 'yuki_osaka',
      avatar: '',
    },
    content:
      'Checked out the 関西弁 (Kansai-ben) section in the Grammar Dictionary! だ ⇒ や and ない ⇒ へん are so fun to use when watching Japanese comedy shows.',
    timeAgo: '1d',
    likes: 48,
    likedByMe: false,
    comments: 0,
    commentsList: [],
    jlptLevel: 'N3',
  },
]

const SUGGESTED_LEARNERS = [
  {
    username: 'takeshi_jp',
    name: 'Takeshi',
    level: 'N4',
    streak: 29,
    bio: 'Studying 30 mins every morning before work!',
  },
  {
    username: 'hana_kanji',
    name: 'Hana',
    level: 'N3',
    streak: 45,
    bio: 'Kanji & reading enthusiast. Road to N2!',
  },
  {
    username: 'alex_nihongo',
    name: 'Alex',
    level: 'N5',
    streak: 9,
    bio: 'Mastering Hiragana, Katakana, and basic verbs.',
  },
]

const POSTS_STORAGE_KEY = 'nihongo_community_posts_v1'

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'following' | 'discover'>(
    'following'
  )
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS)
  const [followedUsers, setFollowedUsers] = useState<string[]>(['takeshi_jp'])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POSTS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPosts(parsed)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  function savePosts(next: CommunityPost[]) {
    setPosts(next)
    try {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  function handleCreatePost(content: string, jlptLevel: string) {
    const user = loadUserStats()
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      author: {
        name: user.displayName || 'Student',
        username: user.username || 'learner',
        avatar: '',
      },
      content,
      timeAgo: 'Just now',
      likes: 1,
      likedByMe: true,
      comments: 0,
      commentsList: [],
      jlptLevel,
    }
    savePosts([newPost, ...posts])
  }

  function handleToggleLike(id: string) {
    const next = posts.map((p) => {
      if (p.id !== id) return p
      const liked = !p.likedByMe
      return {
        ...p,
        likedByMe: liked,
        likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1),
      }
    })
    savePosts(next)
  }

  function handleAddComment(id: string, text: string) {
    const user = loadUserStats()
    const next = posts.map((p) => {
      if (p.id !== id) return p
      const list = p.commentsList || []
      return {
        ...p,
        comments: p.comments + 1,
        commentsList: [
          ...list,
          {
            id: `c-${Date.now()}`,
            author: user.displayName || 'Me',
            text,
          },
        ],
      }
    })
    savePosts(next)
  }

  function toggleFollow(username: string) {
    setFollowedUsers((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <h1 className="text-3xl font-bold mb-6">Community</h1>

      <div className="mb-6">
        <div className="flex w-full rounded-lg bg-muted p-1 mb-6">
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
              activeTab === 'following'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Study Feed ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
              activeTab === 'discover'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Discover Learners
          </button>
        </div>

        {activeTab === 'following' ? (
          <div className="space-y-4">
            <PostComposer onCreatePost={handleCreatePost} />

            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onToggleLike={handleToggleLike}
                  onAddComment={handleAddComment}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              Active Japanese Learners to Follow
            </h2>
            <div className="grid gap-4">
              {SUGGESTED_LEARNERS.map((learner) => {
                const isFollowing = followedUsers.includes(learner.username)
                return (
                  <Card key={learner.username}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                          {learner.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">
                              {learner.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              @{learner.username}
                            </span>
                            <Badge variant="secondary">{learner.level}</Badge>
                            <span className="flex items-center gap-0.5 text-xs text-orange-500 font-semibold">
                              <Flame className="h-3.5 w-3.5 fill-orange-500" />
                              {learner.streak}d
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {learner.bio}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isFollowing ? 'secondary' : 'default'}
                        onClick={() => toggleFollow(learner.username)}
                      >
                        {isFollowing ? (
                          <>
                            <Check className="h-4 w-4 mr-1" /> Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" /> Follow
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
