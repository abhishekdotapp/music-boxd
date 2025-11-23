"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { searchArtists, type SpotifyArtist } from "@/lib/spotify";
import { Search, X, Music } from "lucide-react";

export default function OnboardingPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedArtists, setSelectedArtists] = useState<SpotifyArtist[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyArtist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Redirect if not signed in
  useEffect(() => {
    async function checkAuth() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/sign-in");
      } else {
        setUser(authUser);
        setLoading(false);
      }
    }
    checkAuth();
  }, [router, supabase]);

  // Search for artists
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchArtists(query, 10);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching artists:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddArtist = (artist: SpotifyArtist) => {
    if (selectedArtists.some(a => a.id === artist.id)) return;
    if (selectedArtists.length >= 10) {
      setError("You can select up to 10 artists");
      return;
    }
    setSelectedArtists(prev => [...prev, artist]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveArtist = (artistId: string) => {
    setSelectedArtists(prev => prev.filter(a => a.id !== artistId));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    if (selectedArtists.length === 0) {
      setError("Please select at least 3 artists");
      return;
    }

    if (selectedArtists.length < 3) {
      setError("Please select at least 3 artists for better recommendations");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Save artist IDs and names to user preferences
      const artistData = selectedArtists.map(artist => ({
        id: artist.id,
        name: artist.name,
        image: artist.images[0]?.url || null
      }));

      console.log('Saving artist data:', artistData);
      console.log('User ID:', user.id);

      // Check if preferences exist (don't use .single() to avoid error on no results)
      const { data: existingPrefs, error: checkError } = await supabase
        .from('user_preferences')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing preferences:', checkError);
      }

      let result;
      if (existingPrefs) {
        // Update existing preferences
        console.log('Updating existing preferences');
        result = await supabase
          .from('user_preferences')
          .update({
            favorite_artists: artistData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Insert new preferences
        console.log('Inserting new preferences');
        result = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            favorite_artists: artistData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) {
        console.error('Supabase error:', result.error);
        throw result.error;
      }

      console.log('Preferences saved successfully');
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Error saving preferences:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));
      setError(err.message || "Failed to save your preferences. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="bg-white dark:bg-zinc-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              className="h-10 w-auto"
              src="/music.png"
              alt="MusicBoxd"
              width={100}
              height={100}
              priority
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">MusicBoxd</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Welcome, {user?.username || user?.firstName}!
            </span>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to MusicBoxd!
            </h1>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
              Let's personalize your experience. Select your favorite artists.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-md">
                {error}
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Search and select your favorite artists (at least 3):
              </h2>
              
              {/* Search Bar */}
              <div className="relative mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search for artists..."
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                  />
                </div>
                
                {/* Search Results Dropdown */}
                {searchQuery && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {searchResults.map((artist) => (
                      <div
                        key={artist.id}
                        onClick={() => handleAddArtist(artist)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer border-b border-gray-200 dark:border-zinc-700 last:border-b-0"
                      >
                        {artist.images[0] ? (
                          <img
                            src={artist.images[0].url}
                            alt={artist.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                            <Music className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{artist.name}</p>
                          {artist.genres && artist.genres.length > 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {artist.genres.slice(0, 2).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {isSearching && (
                  <div className="absolute z-10 w-full mt-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-lg p-4 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Searching...</p>
                  </div>
                )}
              </div>

              {/* Selected Artists */}
              {selectedArtists.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Selected Artists ({selectedArtists.length}/10):
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedArtists.map((artist) => (
                      <div
                        key={artist.id}
                        className="relative bg-gray-100 dark:bg-zinc-800 rounded-lg p-3 flex flex-col items-center group"
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveArtist(artist.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {artist.images[0] ? (
                          <img
                            src={artist.images[0].url}
                            alt={artist.name}
                            className="w-16 h-16 rounded-full object-cover mb-2"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center mb-2">
                            <Music className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <p className="text-xs text-center text-gray-900 dark:text-white font-medium line-clamp-2">
                          {artist.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || selectedArtists.length < 3}
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : `Continue to Dashboard ${selectedArtists.length >= 3 ? '✓' : `(${selectedArtists.length}/3)`}`}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}