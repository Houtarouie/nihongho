'use client'

import { useState } from 'react'
import { PostComposer } from '@/components/social/post-composer'
import { PostCard } from '@/components/social/post-card'

// Mock Data
const MOCK_POSTS = [
  {
    id: '1',
    author: {
      name: 'Kenji',
      username: 'kenjilearns',
      avatar: ''
    },
    content: "Day 14 🇯🇵\nLearned the ヤ・ユ・ヨ row today.\nAlso learned 10 new vocabulary words from the Genki textbook. Getting the hang of it!",
    timeAgo: '2h',
    likes: 14,
    comments: 3,
    jlptLevel: 'N5'
  },
  {
    id: '2',
    author: {
      name: 'Sarah',
      username: 'sarah_tokyo',
      avatar: ''
    },
    content: "Today I finally understood the difference between は and が. The explanation in the new grammar lesson was super helpful. Now I just need to practice it more.",
    timeAgo: '5h',
    likes: 32,
    comments: 8,
    jlptLevel: 'N4'
  }
]

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'following' | 'discover'>('following')

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Community</h1>
      
      <div className="mb-6">
        <div className="flex w-full rounded-lg bg-muted p-1 mb-6">
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
              activeTab === 'following' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Following
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
              activeTab === 'discover' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Discover
          </button>
        </div>
        
        {activeTab === 'following' ? (
          <div className="space-y-4">
            <PostComposer />
            
            <div className="space-y-4">
              {MOCK_POSTS.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg border">
            <p>Discover new learners and interesting posts here.</p>
            <p className="text-sm mt-2">Coming soon!</p>
          </div>
        )}
      </div>
    </div>
  )
}
