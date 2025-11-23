-- Migration: Add user_follows table
-- Run this in Supabase SQL Editor

-- Create user_follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON public.user_follows(following_id);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all follows"
  ON public.user_follows
  FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.user_follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
  ON public.user_follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Update existing policies to allow viewing all profiles and ratings
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own ratings" ON public.music_ratings;
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.user_favorites;

CREATE POLICY "Users can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can view all ratings"
  ON public.music_ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Users can view all favorites"
  ON public.user_favorites
  FOR SELECT
  USING (true);
