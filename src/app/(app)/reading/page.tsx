'use client'

import React, { useState } from 'react'
import { BookOpen, Layers } from 'lucide-react'
import { BunproReadingPractice } from '@/components/bunpro/reading-practice'
import { BunproVocabLists } from '@/components/bunpro/vocab-lists'

export default function ReadingAndVocabPage() {
  const [activeTab, setActiveTab] = useState<'reading' | 'vocab'>('reading')

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Simple Duolingo-Style Top Switcher Cards using Native Site Palette */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('reading')}
          className={`relative overflow-hidden rounded-2xl border-2 border-b-4 p-5 text-left transition-all ${
            activeTab === 'reading'
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'bg-card hover:border-primary/40'
          }`}
        >
          <div className="pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 opacity-[0.06]">
            <BookOpen className="w-32 h-32" />
          </div>

          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold tracking-tight">
                📖 Graded Stories & Reading
              </h2>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  activeTab === 'reading'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {activeTab === 'reading' ? 'Active' : 'Open Stories'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Curated Japanese graded reading dialogues with native audio,
              furigana controls, grammar breakdown, and vertical/horizontal reading modes.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vocab')}
          className={`relative overflow-hidden rounded-2xl border-2 border-b-4 p-5 text-left transition-all ${
            activeTab === 'vocab'
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'bg-card hover:border-primary/40'
          }`}
        >
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-[100px] font-black leading-none opacity-[0.06]">
            単
          </div>

          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Curated Vocabulary & Conversation
              </h2>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  activeTab === 'vocab'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {activeTab === 'vocab' ? 'Active' : 'Browse Words'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              400 daily conversation words across 20 scenarios, plus JLPT N5–N1
              and Textbook lists with 1-click Anki deck sync.
            </p>
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'reading' ? (
        <BunproReadingPractice />
      ) : (
        <BunproVocabLists />
      )}
    </div>
  )
}
