-- Migration script to update user_preferences table for artist-based recommendations

-- Drop the old table if it exists with the wrong schema
-- DROP TABLE IF EXISTS user_preferences;

-- Create or alter user_preferences table
-- If the table doesn't exist, create it:
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_artists JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the table exists but has favorite_genres column, we need to modify it:
-- First, check if favorite_genres column exists and drop it
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='user_preferences' 
    AND column_name='favorite_genres'
  ) THEN
    ALTER TABLE user_preferences DROP COLUMN favorite_genres;
  END IF;
END $$;

-- Add favorite_artists column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='user_preferences' 
    AND column_name='favorite_artists'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN favorite_artists JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Drop onboarding_done column if it exists (no longer needed)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='user_preferences' 
    AND column_name='onboarding_done'
  ) THEN
    ALTER TABLE user_preferences DROP COLUMN onboarding_done;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;

-- Create RLS policies
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
