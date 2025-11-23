-- Fix the handle_new_user trigger function to work with new schema
-- Run this in Supabase SQL Editor after running supabase_migration.sql

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email)
  );
  
  -- Create user preferences with new schema (favorite_artists instead of genres)
  INSERT INTO public.user_preferences (user_id, favorite_artists)
  VALUES (NEW.id, '[]'::jsonb);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
