-- Music Boxd Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- 1. User Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  genres TEXT[] DEFAULT ARRAY[]::TEXT[],
  onboarding_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- 3. Music Ratings Table
CREATE TABLE IF NOT EXISTS public.music_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL, -- Spotify track/album/artist ID
  item_type TEXT NOT NULL CHECK (item_type IN ('track', 'album', 'artist')),
  item_name TEXT NOT NULL, -- Song/Album/Artist name
  item_image TEXT, -- Cover art URL
  item_artists TEXT, -- Artist names (for tracks/albums)
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, item_id)
);

-- 4. User Favorites Table
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_type TEXT NOT NULL CHECK (favorite_type IN ('artist', 'album', 'track')),
  item_id TEXT NOT NULL, -- Spotify ID
  item_name TEXT NOT NULL,
  item_image TEXT,
  item_artists TEXT, -- JSON string for album/track artists
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, favorite_type, position)
);

-- 5. User Follows Table
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_music_ratings_user_id ON public.music_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_music_ratings_item_id ON public.music_ratings(item_id);
CREATE INDEX IF NOT EXISTS idx_music_ratings_item_type ON public.music_ratings(item_type);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_type ON public.user_favorites(favorite_type);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON public.user_follows(following_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for music_ratings
CREATE POLICY "Users can view all ratings"
  ON public.music_ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own ratings"
  ON public.music_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON public.music_ratings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON public.music_ratings
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_favorites
CREATE POLICY "Users can view all favorites"
  ON public.user_favorites
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own favorites"
  ON public.user_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorites"
  ON public.user_favorites
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.user_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_follows
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

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_music_ratings_updated_at
  BEFORE UPDATE ON public.music_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_favorites_updated_at
  BEFORE UPDATE ON public.user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email)
  );
  
  INSERT INTO public.user_preferences (user_id, favorite_artists)
  VALUES (NEW.id, '[]'::jsonb);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for profile pictures
-- Note: You need to create this bucket manually in Supabase Dashboard
-- Go to Storage → Create bucket → Name: "avatars" → Public bucket: true
-- Then set up the following policies in the Storage section:

-- Storage policy for avatars (add these in Supabase Dashboard → Storage → avatars → Policies):
-- 1. Allow authenticated users to upload their own avatar:
--    Operation: INSERT
--    Policy: (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
-- 
-- 2. Allow anyone to view avatars:
--    Operation: SELECT
--    Policy: bucket_id = 'avatars'
--
-- 3. Allow users to update their own avatar:
--    Operation: UPDATE
--    Policy: (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
--
-- 4. Allow users to delete their own avatar:
--    Operation: DELETE
--    Policy: (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
