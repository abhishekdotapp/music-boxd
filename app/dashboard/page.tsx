"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { 
  getTopTracks, 
  getNewReleases,
  getFeaturedTracks,
  getRecommendationsByArtists,
  getArtistTopTracks,
  getArtistAlbums,
  getSimilarArtists,
  getArtistAlbumsFromList,
  searchTracks,
  searchAlbums,
  searchArtists,
  type SpotifyTrack,
  type SpotifyAlbum,
  type SpotifyArtist
} from "../../lib/spotify";
import { SpotifyTrackCard, SpotifyAlbumCard, SpotifyArtistCard } from "../../components/SpotifyCards";
import { SearchBar } from "../../components/SearchBar";
import { Music, TrendingUp, Disc, Users, Sparkles, User as UserIcon, Menu, X } from "lucide-react";

interface UserPreferences {
  favorite_artists: Array<{
    id: string;
    name: string;
    image: string | null;
  }>;
}

export default function DashboardPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    tracks: SpotifyTrack[];
    albums: SpotifyAlbum[];
    artists: SpotifyArtist[];
  }>({ tracks: [], albums: [], artists: [] });
  const [isSearching, setIsSearching] = useState(false);
  
  // User search states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Music data states
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [topAlbums, setTopAlbums] = useState<SpotifyAlbum[]>([]);
  const [personalizedTracks, setPersonalizedTracks] = useState<SpotifyAlbum[]>([]);
  const [similarArtists, setSimilarArtists] = useState<SpotifyArtist[]>([]);
  const [artistTopTracks, setArtistTopTracks] = useState<SpotifyTrack[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [loadingMusic, setLoadingMusic] = useState(false);
  
  const router = useRouter();

  // Fetch user preferences and check onboarding status
  useEffect(() => {
    async function fetchUserPreferences() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          router.push("/sign-in");
          return;
        }
        
        setUser(authUser);
        
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', authUser.id)
          .single();
          
        setUserPreferences(preferences);
        
        // If user hasn't completed onboarding (no favorite artists), redirect to onboarding page
        if (!preferences || !preferences.favorite_artists || preferences.favorite_artists.length === 0) {
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserPreferences();
  }, [router, supabase]);

  // Fetch music data
  useEffect(() => {
    async function fetchMusicData() {
      if (!userPreferences) return;
      
      setLoadingMusic(true);
      try {
        console.log('Fetching music data...');
        console.log('User favorite artists:', userPreferences.favorite_artists);
        
        // Fetch personalized recommendations based on favorite artists
        let personalizedMusic: SpotifyAlbum[] = [];
        let similarArtistsList: SpotifyArtist[] = [];
        let topTracksFromArtists: SpotifyTrack[] = [];
        
        if (userPreferences.favorite_artists && userPreferences.favorite_artists.length > 0) {
          const artistIds = userPreferences.favorite_artists.map(a => a.id);
          console.log('Fetching personalized recommendations for artists:', artistIds);
          
          // Get albums from favorite artists
          try {
            const artistAlbums = await getArtistAlbumsFromList(artistIds, 3);
            personalizedMusic = artistAlbums;
            console.log('Albums from favorite artists:', personalizedMusic.length);
          } catch (error) {
            console.log('Skipping artist albums due to error');
          }
          
          // Get top tracks from favorite artists (from first 3 artists)
          if (artistIds.length > 0) {
            try {
              const topTracksPromises = artistIds.slice(0, 3).map(id => 
                getArtistTopTracks(id, 4).catch(() => [])
              );
              const topTracksResults = await Promise.all(topTracksPromises);
              topTracksFromArtists = topTracksResults.flat();
              console.log('Top tracks from favorite artists:', topTracksFromArtists.length);
            } catch (error) {
              console.log('Skipping artist top tracks due to error');
            }
          }
        }
        
        // Fetch only working endpoints
        const [tracks, albums] = await Promise.all([
          getTopTracks(12).catch(() => []),
          getNewReleases(12).catch(() => [])
        ]);
        
        console.log('Top tracks:', tracks.length);
        console.log('New releases:', albums.length);
        
        setPersonalizedTracks(personalizedMusic);
        setSimilarArtists(similarArtistsList);
        setArtistTopTracks(topTracksFromArtists);
        setTopTracks(tracks);
        setTopAlbums(albums);
        
        // Fetch recent public reviews
        try {
          const response = await fetch('/api/reviews/recent?limit=6');
          const data = await response.json();
          console.log('Recent reviews fetched:', data.reviews);
          setRecentReviews(data.reviews || []);
        } catch (error) {
          console.error('Error fetching recent reviews:', error);
        }
        
      } catch (error) {
        console.error("Error fetching music data:", error);
      } finally {
        setLoadingMusic(false);
      }
    }

    fetchMusicData();
  }, [userPreferences]);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const [tracks, albums, artists] = await Promise.all([
        searchTracks(searchQuery, 12),
        searchAlbums(searchQuery, 12),
        searchArtists(searchQuery, 12)
      ]);
      
      setSearchResults({ tracks, albums, artists });
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults({ tracks: [], albums: [], artists: [] });
    }
  }, [searchQuery]);

  // User search handler
  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query);
    if (!query || query.length < 2) {
      setUserSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setUserSearchResults(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const hasSearchResults = searchResults.tracks.length > 0 || searchResults.albums.length > 0 || searchResults.artists.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#14181c]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <Image src="/music.png" alt="MusicBoxd Logo" width={32} height={32} className="h-8 w-8 sm:h-9 sm:w-9" />
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">MusicBoxd</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => router.push('/feed')}
                className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-medium transition-all"
              >
                <Music className="h-4 w-4" />
                Feed
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowUserSearch(!showUserSearch)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-medium transition-all"
                >
                  <UserIcon className="h-4 w-4" />
                  Find Users
                </button>
                {showUserSearch && (
                  <div className="absolute top-full right-0 mt-2 w-80 glass rounded-xl border border-white/10 p-4 shadow-2xl z-50">
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                    {userSearchResults.length > 0 && (
                      <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                        {userSearchResults.map((searchUser) => (
                          <button
                            key={searchUser.id}
                            onClick={() => {
                              router.push(`/profile?user=${searchUser.id}`);
                              setShowUserSearch(false);
                            }}
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-white/10 rounded-lg transition-all text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {searchUser.avatar_url ? (
                                <img src={searchUser.avatar_url} alt={searchUser.username} className="w-full h-full object-cover" />
                              ) : (
                                <UserIcon className="h-5 w-5 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{searchUser.username}</p>
                              {searchUser.bio && (
                                <p className="text-xs text-gray-400 truncate">{searchUser.bio}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => router.push("/feed")}
                className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-medium transition-all"
              >
                <Users className="h-4 w-4" />
                Feed
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="btn-primary flex items-center gap-2"
              >
                <UserIcon className="h-4 w-4" />
                Profile
              </button>
              <button
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                    router.push("/sign-in");
                    router.refresh();
                  } catch (error) {
                    console.error('Sign out error:', error);
                    router.push("/sign-in");
                  }
                }}
                className="text-sm text-gray-400 hover:text-white font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          
          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden glass rounded-xl border border-white/10 p-4 mb-4">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    router.push("/profile");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-medium transition-all"
                >
                  <UserIcon className="h-5 w-5" />
                  Profile
                </button>
                <button
                  onClick={() => {
                    router.push("/feed");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-medium transition-all"
                >
                  <Users className="h-5 w-5" />
                  Feed
                </button>
                <button
                  onClick={() => setShowUserSearch(!showUserSearch)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-medium transition-all"
                >
                  <UserIcon className="h-5 w-5" />
                  Find Users
                </button>
                {showUserSearch && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                    {userSearchResults.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {userSearchResults.map((searchUser) => (
                          <button
                            key={searchUser.id}
                            onClick={() => {
                              router.push(`/profile?user=${searchUser.id}`);
                              setShowUserSearch(false);
                              setMobileMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-white/10 rounded-lg transition-all text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {searchUser.avatar_url ? (
                                <img src={searchUser.avatar_url} alt={searchUser.username} className="w-full h-full object-cover" />
                              ) : (
                                <UserIcon className="h-5 w-5 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{searchUser.username}</p>
                              {searchUser.bio && (
                                <p className="text-xs text-gray-400 truncate">{searchUser.bio}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="border-t border-white/10 pt-2 mt-2">
                  <button
                    onClick={async () => {
                      try {
                        await supabase.auth.signOut();
                        setMobileMenuOpen(false);
                        router.push("/sign-in");
                        router.refresh();
                      } catch (error) {
                        console.error('Sign out error:', error);
                        router.push("/sign-in");
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg font-medium transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Search Bar */}
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Search for tracks, albums, or artists..."
          />
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Show search results if searching */}
          {isSearching && (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Searching...</p>
              </div>
            </div>
          )}
          
          {/* Search Results */}
          {!isSearching && hasSearchResults && (
            <div className="space-y-8 mb-12">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Search Results for "{searchQuery}"
                </h2>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Clear Search
                </button>
              </div>
              
              {searchResults.tracks.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Music className="h-5 w-5 text-emerald-400" />
                    Tracks
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {searchResults.tracks.map((track, idx) => (
                      <SpotifyTrackCard key={`${track.id}-${idx}`} track={track} />
                    ))}
                  </div>
                </div>
              )}
              
              {searchResults.albums.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Disc className="h-5 w-5 text-emerald-400" />
                    Albums
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {searchResults.albums.map((album, idx) => (
                      <SpotifyAlbumCard key={`${album.id}-${idx}`} album={album} />
                    ))}
                  </div>
                </div>
              )}
              
              {searchResults.artists.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-400" />
                    Artists
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {searchResults.artists.map((artist, idx) => (
                      <SpotifyArtistCard key={`${artist.id}-${idx}`} artist={artist} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Main Content - Show when not searching */}
          {!hasSearchResults && !isSearching && (
            <>
              {/* Welcome Section */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Welcome back!
                </h2>
                <p className="text-gray-400">
                  Discover new music and keep track of your favorites
                </p>
              </div>

              {/* Discover Header */}
              <div className="mb-8 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-emerald-400" />
                  <h2 className="text-2xl font-bold text-white">Discover Music</h2>
                </div>
              </div>

              {/* Content based on active tab */}
              {loadingMusic ? (
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading music...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Personalized for You */}
                  {personalizedTracks.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-6 w-6 text-emerald-400" />
                        <div>
                          <h3 className="text-2xl font-bold text-white">
                            New Releases from Your Favorites
                          </h3>
                          <p className="text-sm text-gray-400">
                            Latest albums from {userPreferences?.favorite_artists?.slice(0, 3).map(a => a.name).join(', ')}
                            {userPreferences?.favorite_artists && userPreferences.favorite_artists.length > 3 && ` and ${userPreferences.favorite_artists.length - 3} more`}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {personalizedTracks.slice(0, 12).map((album, idx) => (
                          <SpotifyAlbumCard key={`new-release-${album.id}-${idx}`} album={album} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Top Tracks from Your Favorite Artists */}
                  {artistTopTracks.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Music className="h-6 w-6 text-purple-400" />
                        <div>
                          <h3 className="text-2xl font-bold text-white">
                            Popular Tracks from Your Favorites
                          </h3>
                          <p className="text-sm text-gray-400">
                            Top songs from artists you love
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {artistTopTracks.slice(0, 12).map((track, idx) => (
                          <SpotifyTrackCard key={`artist-top-${track.id}-${idx}`} track={track} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Similar Artists You Might Like */}
                  {similarArtists.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-6 w-6 text-blue-400" />
                        <div>
                          <h3 className="text-2xl font-bold text-white">
                            Similar Artists You Might Like
                          </h3>
                          <p className="text-sm text-gray-400">
                            Based on your favorite artists
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {similarArtists.map((artist, idx) => (
                          <SpotifyArtistCard key={`similar-${artist.id}-${idx}`} artist={artist} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* No personalized content message */}
                  {personalizedTracks.length === 0 && (
                    <div className="glass rounded-xl border border-yellow-500/30 p-6 text-center">
                      <Sparkles className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        No Personalized Recommendations Yet
                      </h3>
                      <p className="text-gray-400">
                        We're working on finding music based on your favorite artists. Check out trending tracks below!
                      </p>
                    </div>
                  )}

                  {/* Recent Reviews from Community */}
                  {recentReviews.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-6 w-6 text-emerald-400" />
                          <div>
                            <h3 className="text-2xl font-bold text-white">
                              Recent Reviews
                            </h3>
                            <p className="text-sm text-gray-400">
                              See what the community is listening to
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push('/feed')}
                          className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                        >
                          View All →
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentReviews.slice(0, 4).map((review) => (
                          <div
                            key={review.id}
                            className="glass rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all"
                          >
                            <div className="flex gap-3">
                              {review.item_image && (
                                <img
                                  src={review.item_image}
                                  alt={review.item_name}
                                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {review.user_profiles?.avatar_url ? (
                                      <img
                                        src={review.user_profiles.avatar_url}
                                        alt={review.user_profiles.username}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <UserIcon className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                  <span className="text-sm font-medium text-gray-300">
                                    {review.user_profiles?.username}
                                  </span>
                                  <div className="flex items-center gap-0.5 ml-auto">
                                    {[...Array(5)].map((_, i) => {
                                      const fullStars = Math.floor(review.rating);
                                      const hasHalfStar = review.rating % 1 >= 0.5;
                                      
                                      if (i < fullStars) {
                                        return (
                                          <span key={i} className="text-emerald-400 text-sm">★</span>
                                        );
                                      } else if (i === fullStars && hasHalfStar) {
                                        return (
                                          <span key={i} className="relative inline-block text-sm">
                                            <span className="text-gray-600">★</span>
                                            <span className="absolute left-0 top-0 overflow-hidden text-emerald-400" style={{width: '50%'}}>★</span>
                                          </span>
                                        );
                                      } else {
                                        return (
                                          <span key={i} className="text-gray-600 text-sm">★</span>
                                        );
                                      }
                                    })}
                                  </div>
                                </div>
                                <h4 className="font-semibold text-white text-sm truncate mb-1">
                                  {review.item_name}
                                </h4>
                                {review.item_artists && (
                                  <p className="text-xs text-gray-400 truncate mb-2">
                                    {review.item_artists}
                                  </p>
                                )}
                                {review.review && (
                                  <p className="text-xs text-gray-300 line-clamp-2">
                                    {review.review}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Trending Tracks */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-6 w-6 text-emerald-400" />
                      <h3 className="text-2xl font-bold text-white">
                        Trending Tracks
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {topTracks.slice(0, 6).map((track, idx) => (
                        <SpotifyTrackCard key={`trending-${track.id}-${idx}`} track={track} />
                      ))}
                    </div>
                  </section>

                  {/* Popular Albums */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Disc className="h-6 w-6 text-emerald-400" />
                      <h3 className="text-2xl font-bold text-white">
                        Popular Albums
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {topAlbums.slice(0, 6).map((album, idx) => (
                        <SpotifyAlbumCard key={`popular-album-${album.id}-${idx}`} album={album} />
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-[#14181c]/80 backdrop-blur-md border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-400">
            Powered by Spotify API • MusicBoxd © 2025
          </p>
        </div>
      </footer>
    </div>
  );
}