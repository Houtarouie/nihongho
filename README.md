# Nihongo (日本語) — Japanese Learning Platform

A comprehensive, social Japanese-learning platform designed to take learners from absolute beginner (Kana) through advanced JLPT grammar, graded reading, vocabulary, and active spaced repetition (SRS).

---

## ✨ Features

### 1. 🔤 Kana Learning & Interactive Arcade (`/learn`)
- **Complete Kana Reference**: Interactive charts for **Hiragana** and **Katakana** across all standard rows (Gojuon), voiced variations (Dakuten / Handakuten), and combination sounds (Yoon).
- **Targeted Practice Selection**: Multi-select specific rows or individual characters to customize practice sessions (e.g. practicing only the first 5 characters).
- **Interactive Audio**: Audio pronunciation for all kana characters via speech synthesis.
- **Learning Arcade Modes**:
  - **Kana Quiz**: Rapid-fire multiple-choice quiz with smart distractors.
  - **Audio Dictation**: Listening comprehension tests with romaji or kana input verification.
  - **Confusion Pairs (Look-Alikes)**: Dedicated visual discrimination drills focusing on notoriously difficult look-alike characters (e.g., シ/ツ/ソ/ン, ね/れ/わ, め/ぬ) with visual memory mnemonics.
  - **Sentence Scramble**: Interactive sentence builder using draggable and clickable word/grammar tiles.

---

### 2. 📖 Comprehensive Grammar Path (`/grammar`)
- **Dual Catalog Architecture**:
  - **Core Curriculum (204 points)**: Structured, progressive lesson units with in-depth grammar formulas, nuances, and authentic example sentences.
  - **Reference Dictionary (900+ points)**: Searchable encyclopedia spanning JLPT N5 through N1, conversational idioms, and regional dialects (Kansai-ben 関西弁).
  - **Combined Mode**: Unified search across English meanings, Japanese keywords, and JLPT levels.
- **Grammar Point Inspector**:
  - Deep-dive modal for every grammar point with structural formulas and nuanced explanations.
  - Example sentences with native audio playback.
  - Interactive fill-in-the-blank comprehension checks with immediate feedback.
  - 1-click addition directly to your personal SRS flashcard deck.

---

### 3. 🧠 Spaced Repetition System (SRS) & Practice (`/practice`)
- **SRS Flashcard Review**:
  - Adaptive spaced-repetition algorithm with four rating buttons (*Again*, *Hard*, *Good*, *Easy*) that dynamically calculate next review intervals.
  - Card flipping with interactive furigana toggles, native audio pronunciation, and keyboard shortcuts (Space to flip, 1–4 to rate).
- **Card Browser**: Search, filter, and inspect all cards in your active deck by category (Vocab, Kanji, Grammar) and JLPT level.
- **Custom Card Creator**: Build custom flashcards with front/back text, readings, and example sentences.
- **Deck Analytics**: Visual statistics showing review heatmaps, mastery retention rates, and upcoming review forecasts.

---

### 4. 📚 Graded Reading & Vocabulary (`/reading`)
- **Graded Japanese Dialogues**:
  - Curated conversational stories (N5 & N4) set in authentic contexts (classrooms, cafes, libraries, etc.).
  - Line-by-line audio playback with synchronized highlighting.
  - Furigana display modes: **Always Show**, **Hover Only**, or **Hidden**.
  - Reading orientation toggle: Switch seamlessly between horizontal reading and traditional Japanese vertical reading (**Tategaki 縦書き**).
  - Post-reading comprehension quizzes with explanations.
- **Curated Scenario Vocabulary**:
  - 400 daily conversation words categorized across 20 everyday scenarios (making plans, dining out, train transit, travel, etc.) with slang/casual markers.
  - JLPT N5–N1 vocabulary directories with quick-add to SRS decks.

---

### 5. 📊 Dashboard & Daily Habits (`/dashboard`)
- **Study Metrics**: Real-time tracking of daily study streaks, earned XP, active study time, and completed lessons.
- **Local Date Boundary Streak Logic**: Streaks update based on the learner's local timezone (preventing UTC boundary bugs) and require active study completion to advance.
- **Dynamic "Up Next" Guide**: Recommends the next uncompleted lesson in the core curriculum automatically.
- **Quick Action Bar**: Fast shortcuts to due SRS reviews, grammar lessons, and arcade games.

---

### 6. 👥 Community Feed (`/community`)
- **Social Study Timeline**: Share study updates, streak milestones, and reflections with fellow learners.
- **Interactive Engagement**: Like posts, reply with comments, and view tagged study topics (`#Grammar`, `#Kanji`, `#Streak`).

---

### 7. 👤 Profile & Customization (`/profile`)
- **Learner Stats**: Detailed overview of mastered vocabulary, kanji, grammar points, and total XP.
- **Theme Support**: Full dark mode and light mode support with seamless contrast switching.
- **Progress Management**: Reset options to clear progress or start fresh at any time.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Frontend**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Speech**: Web Speech API (`SpeechSynthesis`)

---

## ⚠️ Known Issues & Current Limitations

1. **Large Grammar Catalog DOM Rendering**:
   - The grammar catalog currently renders cards in full batches without pagination or virtual scrolling. On initial page load or when switching filters over large lists, a momentary frame drop may occur.
2. **Local Storage Synchronization**:
   - SRS review schedules, custom flashcards, and mastered grammar points are currently stored locally in the browser (`localStorage`). Progress does not automatically sync across different devices or browsers yet.
3. **Graded Reading Passage Availability**:
   - Authentic curated reading dialogues are currently available for JLPT N5 and N4. High-level graded dialogues (N3–N1) are in active curriculum development.
4. **Browser Speech Synthesis Dependency**:
   - Audio pronunciation relies on the host browser and operating system's installed Japanese TTS voices (`ja-JP`). Voice naturalness, pitch accent, and availability may vary between browsers and operating systems (e.g., Safari vs. Chrome vs. Firefox).
