'use client'

import React, { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { BunproReadingPractice } from '@/components/bunpro/reading-practice'
import { BunproVocabLists } from '@/components/bunpro/vocab-lists'

export default function ReadingAndVocabPage() {
  const [activeTab, setActiveTab] = useState<'reading' | 'vocab'>('reading')

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Bunpro Feature Hero Cards (Screenshot 3 exact layout + interactive tab selector) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Reading Passages */}
        <button
          type="button"
          onClick={() => setActiveTab('reading')}
          className={`relative overflow-hidden rounded-xl border p-6 text-left transition-all ${
            activeTab === 'reading'
              ? 'bg-zinc-900 text-zinc-100 border-[#e15b64] ring-2 ring-[#e15b64]/30 shadow-lg'
              : 'bg-zinc-900/90 text-zinc-200 border-zinc-800 hover:border-zinc-700 opacity-85 hover:opacity-100'
          }`}
        >
          {/* Decorative Book Watermark */}
          <div className="pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 opacity-[0.07]">
            <BookOpen className="w-40 h-40 text-white" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Reading Passages
              </h2>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  activeTab === 'reading'
                    ? 'bg-[#e15b64] text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {activeTab === 'reading' ? 'Active' : 'Open Reader'}
              </span>
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-300 list-disc pl-4">
              <li>Sharpen your reading speed, comprehension and listening.</li>
              <li>50+ graded passages by JLPT level (N5–N1, Lessons 1–10).</li>
              <li>
                Each passage includes a full audio recording, vertical/horizontal
                modes, and side-by-side translation.
              </li>
            </ul>
          </div>
        </button>

        {/* Card 2: Vocab Lists */}
        <button
          type="button"
          onClick={() => setActiveTab('vocab')}
          className={`relative overflow-hidden rounded-xl border p-6 text-left transition-all ${
            activeTab === 'vocab'
              ? 'bg-zinc-900 text-zinc-100 border-[#e15b64] ring-2 ring-[#e15b64]/30 shadow-lg'
              : 'bg-zinc-900/90 text-zinc-200 border-zinc-800 hover:border-zinc-700 opacity-85 hover:opacity-100'
          }`}
        >
          {/* Decorative Kanji Watermark 単 */}
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 select-none text-[130px] font-black leading-none text-white opacity-[0.07]">
            単
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Vocab Lists
              </h2>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  activeTab === 'vocab'
                    ? 'bg-[#e15b64] text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {activeTab === 'vocab' ? 'Active' : 'Browse Decks'}
              </span>
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-300 list-disc pl-4">
              <li>Quickly find which words you still need to learn.</li>
              <li>Context-driven example sentences with native audio & pitch accent.</li>
              <li>
                Curated lists: JLPT N5–N1, Bunpro Core, Textbook & community-made.
              </li>
            </ul>
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
