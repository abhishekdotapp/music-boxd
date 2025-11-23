# 🎵 MusicBoxd

A Letterboxd-style music diary app built with Next.js, Supabase, and Spotify API. Rate, review, and share your favorite music with friends.

## ✨ Features

- 🎸 **Rate & Review** - Rate tracks 1-5 stars and write detailed reviews
- 🎯 **Personalized Discovery** - Get recommendations based on your favorite artists
- 👥 **Follow & Connect** - Follow other music lovers and see their reviews
- 📸 **Share Stories** - Generate beautiful Instagram-story-sized shareable cards
- 🔎 **Search & Track** - Search for any track, album, or artist
- ❤️ **Save Favorites** - Bookmark your favorite tracks, albums, and artists
- 📱 **Mobile Responsive** - Fully optimized for mobile, tablet, and desktop
- 🎭 **Artist-Based Onboarding** - Select your favorite artists for tailored recommendations

## 🚀 Tech Stack

- **Framework**: Next.js 16.0.1 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth (OTP)
- **Music API**: Spotify Web API
- **Styling**: Tailwind CSS
- **Canvas**: Native Canvas 2D API for image generation

## 📦 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Spotify Developer account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd music-boxd
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### 3. Supabase Setup

#### Database Tables

Create these tables in your Supabase SQL Editor:

```sql
-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Music ratings with denormalized metadata
CREATE TABLE music_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  spotify_track_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_name TEXT,
  album_art_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, spotify_track_id)
);

-- User favorites
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('track', 'album', 'artist')),
  spotify_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_image TEXT,
  artist_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_type, spotify_id)
);

-- User follows
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- User preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_artists JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Note:** The `favorite_artists` field stores an array of artist objects with the structure:
```json
[
  {
    "id": "spotify_artist_id",
    "name": "Artist Name",
    "image": "image_url_or_null"
  }
]
```

#### Storage Setup

1. Go to **Storage** in Supabase Dashboard
2. Create a new bucket named `avatars`
3. Enable **Public bucket**
4. Add these RLS policies in the Policies tab:

**Policy 1: Allow users to upload their own avatar (INSERT)**
- Target roles: `authenticated`
- Policy definition:
```sql
(bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

**Policy 2: Allow public read access (SELECT)**
- Target roles: `public`
- Policy definition:
```sql
bucket_id = 'avatars'::text
```

**Policy 3: Allow users to update their own avatar (UPDATE)**
- Target roles: `authenticated`
- Policy definition:
```sql
(bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

**Policy 4: Allow users to delete their own avatar (DELETE)**
- Target roles: `authenticated`
- Policy definition:
```sql
(bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

### 4. Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create app"**
4. Fill in the details:
   - **App name**: MusicBoxd
   - **App description**: A music diary app
   - **Redirect URI**: `http://localhost:3000`
   - **Which API/SDKs**: Web API
5. Click **"Settings"** and copy your **Client ID** and **Client Secret**
6. Add them to `.env.local`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🎨 Project Structure

```
music-boxd/
├── app/
│   ├── dashboard/          # Main music discovery page
│   ├── feed/               # Reviews from followed users
│   ├── profile/            # User profile and reviews
│   ├── sign-in/            # Authentication pages
│   ├── sign-up/
│   ├── onboarding/         # Genre selection
│   └── page.tsx            # Landing page
├── components/
│   ├── Logo.tsx            # App logo component
│   ├── ShareStoryCard.tsx  # Shareable review cards
│   ├── SpotifyCards.tsx    # Music display cards
│   ├── SearchBar.tsx       # Search functionality
│   └── FollowModal.tsx     # User follow/unfollow
├── lib/
│   ├── spotify.ts          # Spotify API integration
│   ├── supabase/
│   │   ├── client.ts       # Supabase client
│   │   └── server.ts       # Server-side Supabase
│   └── appwrite.ts
└── public/
```

## 🔑 Key Features Explained

### Share Story Cards
- Generates 1080x1920px Instagram-story-sized images
- Uses native Canvas 2D API for rendering
- Includes album art, rating, review, and user info
- Download or share directly from the app

### Feed System
- Two-step query to fetch reviews from followed users
- Real-time updates when users post new reviews
- Share button on your own reviews

### Mobile Responsive
- Hamburger menu for mobile navigation
- Responsive grids (3→5 columns)
- Touch-friendly buttons and spacing
- Optimized for all screen sizes

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

### Environment Variables for Production

Make sure to add all `.env.local` variables to your production environment.

## 📝 API Limits

**Spotify API (Client Credentials)**:
- Rate limit: Generous for normal use
- No authentication required for public data
- Access to search, charts, and recommendations

**Supabase Free Tier**:
- 500MB database
- 1GB file storage
- 50,000 monthly active users

## 🛠️ Troubleshooting

### Images Not Loading?
- Verify Spotify credentials in `.env.local`
- Restart dev server after changing environment variables

### "Access Token Error"?
- Check Client ID and Client Secret are correct
- Ensure no extra spaces in `.env.local`

### RLS Errors with Avatars?
- Verify storage bucket is set to **Public**
- Check all 4 RLS policies are created and enabled

### Feed Page Empty?
- Make sure you're following users who have posted reviews
- Check browser console for query errors

## 🎯 Roadmap

- [ ] Audio preview playback
- [ ] User-specific Spotify integration (OAuth)
- [ ] Playlist creation and management
- [ ] Activity feed with likes and comments
- [ ] Explore page with trending reviews
- [ ] Export reviews to PDF
- [ ] Dark/light mode toggle

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📄 License

MIT License - feel free to use this project for your own purposes.

---

Built with ❤️ using Next.js, Supabase, and Spotify API
