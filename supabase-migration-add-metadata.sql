-- Migration: Add metadata columns to music_ratings table
-- This adds item_name, item_image, and item_artists columns to store metadata directly

-- Add new columns to music_ratings table
ALTER TABLE public.music_ratings 
ADD COLUMN IF NOT EXISTS item_name TEXT,
ADD COLUMN IF NOT EXISTS item_image TEXT,
ADD COLUMN IF NOT EXISTS item_artists TEXT;

-- Make item_name NOT NULL after adding it (for new rows)
-- Note: Existing rows will have NULL values, you may want to populate them or delete old ratings
-- UPDATE public.music_ratings SET item_name = item_id WHERE item_name IS NULL;

-- Then make it NOT NULL:
-- ALTER TABLE public.music_ratings ALTER COLUMN item_name SET NOT NULL;

-- Note: Run the commented UPDATE statement first if you have existing data
-- Otherwise, just let new ratings populate these fields going forward
