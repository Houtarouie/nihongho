# Nihongo - Japanese Learning Platform

A social Japanese-learning platform where users learn Japanese, post what they studied each day, maintain learning streaks, and follow a structured JLPT curriculum.

## Tech Stack
- Next.js (App Router)
- React
- Tailwind CSS
- shadcn/ui
- Supabase (Auth, PostgreSQL)
- Vercel

## Local Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Supabase Setup**
   - Create a new project on [Supabase](https://supabase.com).
   - Go to Project Settings -> API and copy your `Project URL` and `anon public` key.
   - Rename `.env.example` to `.env.local` and add your keys:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```
   - Go to the SQL Editor in Supabase and run the script located in `supabase/schema.sql` to create the tables and security policies.
   - Run the script in `supabase/seed.sql` to insert the initial learning curriculum data.

3. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment to Vercel

1. Push your code to a GitHub repository.
2. Import the project in Vercel.
3. In the Vercel project settings, add the Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Core Features Implemented

- **Authentication:** Email/Password signup and login via Supabase Auth.
- **Social Feed:** View learning posts, likes, and comments from friends.
- **Study Logger:** Log daily study time, vocabulary, kanji, and grammar to maintain streaks.
- **Curriculum:** Visual progress tracking for JLPT N5 content.
- **Spaced Repetition (SRS):** Interactive flashcard interface for reviewing vocabulary and kanji.
- **Responsive UI:** Desktop sidebar and mobile bottom navigation layout.
