-- ====================================================================
-- Nihongo App Phase 2 Database Schema Migration
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- to initialize cloud persistence tables for user cards, reviews, and weak spots.
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (extends auth.users if not already created)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  current_jlpt_level TEXT DEFAULT 'Beginner',
  target_jlpt_level TEXT DEFAULT 'N5',
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_study_days INTEGER DEFAULT 0,
  total_vocabulary_learned INTEGER DEFAULT 0,
  total_kanji_learned INTEGER DEFAULT 0,
  total_study_time_mins INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. User Cards Table (stores user SRS cards with FSRS & SM-2 parameters)
CREATE TABLE IF NOT EXISTS public.user_cards (
  id TEXT PRIMARY KEY, -- Composite key: user_id || '_' || card_id
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id TEXT NOT NULL,
  deck_name TEXT DEFAULT 'Japanese::Default',
  category TEXT DEFAULT 'vocabulary',
  jlpt_level TEXT DEFAULT 'N5',
  front TEXT NOT NULL,
  reading TEXT,
  meaning TEXT NOT NULL,
  note_type TEXT DEFAULT 'basic',
  interval INTEGER DEFAULT 0,
  repetition INTEGER DEFAULT 0,
  efactor REAL DEFAULT 2.5,
  stability REAL DEFAULT 1.0,
  difficulty REAL DEFAULT 5.0,
  due_date BIGINT NOT NULL,
  status TEXT DEFAULT 'new',
  tags TEXT[] DEFAULT '{}',
  lapses INTEGER DEFAULT 0,
  flag INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Review Logs Table (records active recall reviews for FSRS/SM-2 analytics)
CREATE TABLE IF NOT EXISTS public.review_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id TEXT NOT NULL,
  rating TEXT NOT NULL,
  interval INTEGER NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Weak Points Table (stores characters/grammar marked for focused review)
CREATE TABLE IF NOT EXISTS public.weak_points (
  id TEXT PRIMARY KEY, -- e.g. user_id || '_' || item_id
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL,
  front TEXT NOT NULL,
  reading TEXT,
  meaning TEXT NOT NULL,
  notes TEXT,
  look_alikes TEXT[] DEFAULT '{}',
  miss_count INTEGER DEFAULT 1,
  last_missed BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS) on all Phase 2 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weak_points ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies (Owner-only access)
-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User Cards
DROP POLICY IF EXISTS "Users can manage their own cards." ON public.user_cards;
CREATE POLICY "Users can manage their own cards." ON public.user_cards FOR ALL USING (auth.uid() = user_id);

-- Review Logs
DROP POLICY IF EXISTS "Users can manage their own review logs." ON public.review_logs;
CREATE POLICY "Users can manage their own review logs." ON public.review_logs FOR ALL USING (auth.uid() = user_id);

-- Weak Points
DROP POLICY IF EXISTS "Users can manage their own weak points." ON public.weak_points;
CREATE POLICY "Users can manage their own weak points." ON public.weak_points FOR ALL USING (auth.uid() = user_id);

-- 8. Auto-create profile trigger on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
