"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Upload, Music, Disc3, Mic2, ArrowLeft, Save, UserPlus, UserMinus, Share2 } from "lucide-react";
import { SpotifyTrackCard, SpotifyAlbumCard, SpotifyArtistCard } from "@/components/SpotifyCards";
import { ShareStoryCard } from "@/components/ShareStoryCard";
import { FollowModal } from "@/components/FollowModal";
import { searchTracks, searchAlbums, searchArtists } from "@/lib/spotify";
import type { SpotifyTrack, SpotifyAlbum, SpotifyArtist } from "@/lib/spotify";

interface Favorite {
  item_id: string;
  item_name: string;
  item_image: string | null;
  item_artists: string | null;
  position: number;
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

interface EnrichedReview {
  id: string;
  item_id: string;
  item_type: string;
  item_name: string;
  item_image: string | null;
  item_artists: string | null;
  rating: number;
  review: string | null;
  created_at: string;
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewUserId = searchParams.get('user');
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Follow state
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Favorites
  const [favoriteArtists, setFavoriteArtists] = useState<Favorite[]>([]);
  const [favoriteAlbums, setFavoriteAlbums] = useState<Favorite[]>([]);
  const [favoriteTracks, setFavoriteTracks] = useState<Favorite[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<'artist' | 'album' | 'track'>('artist');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [editingType, setEditingType] = useState<'artist' | 'album' | 'track' | null>(null);

  // Recent reviews
  const [recentReviews, setRecentReviews] = useState<EnrichedReview[]>([]);
  
  // Share story
  const [shareReview, setShareReview] = useState<EnrichedReview | null>(null);
  
  // Follow modal
  const [showFollowModal, setShowFollowModal] = useState<'followers' | 'following' | null>(null);

  // Load user and profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/sign-in');
          return;
        }
        setCurrentUser(user);

        // Determine which user profile to view
        const profileUserId = viewUserId || user.id;
        setIsOwnProfile(profileUserId === user.id);

        // Load profile
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', profileUserId)
          .single();

        if (!profileData) {
          router.push('/dashboard');
          return;
        }

        setProfile(profileData);

        // Load favorites
        const { data: favorites } = await supabase
          .from('user_favorites')
          .select('*')
          .eq('user_id', profileUserId)
          .order('position');

        if (favorites) {
          setFavoriteArtists(favorites.filter(f => f.favorite_type === 'artist'));
          setFavoriteAlbums(favorites.filter(f => f.favorite_type === 'album'));
          setFavoriteTracks(favorites.filter(f => f.favorite_type === 'track'));
        }

        // Load recent reviews with metadata already included
        const { data: reviews } = await supabase
          .from('music_ratings')
          .select('*')
          .eq('user_id', profileUserId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (reviews) {
          setRecentReviews(reviews);
        }

        // Load follow stats for all profiles
        const response = await fetch(`/api/follow?user_id=${profileUserId}`);
        const followData = await response.json();
        setFollowerCount(followData.followerCount);
        setFollowingCount(followData.followingCount);
        setIsFollowing(followData.isFollowing);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase, router, viewUserId]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !currentUser) {
        return;
      }

      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${currentUser.id}/avatar.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
    } catch (error: any) {
      alert('Error uploading avatar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      let results: any[] = [];
      if (searchType === 'track') {
        results = await searchTracks(searchQuery, 10);
      } else if (searchType === 'album') {
        results = await searchAlbums(searchQuery, 10);
      } else {
        results = await searchArtists(searchQuery, 10);
      }
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile || !currentUser || isOwnProfile) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/follow?following_id=${profile.id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setIsFollowing(false);
          setFollowerCount(prev => prev - 1);
        }
      } else {
        // Follow
        const response = await fetch('/api/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ following_id: profile.id }),
        });
        if (response.ok) {
          setIsFollowing(true);
          setFollowerCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAddFavorite = async (item: any) => {
    if (!currentUser || selectedPosition === null) return;

    try {
      const favoriteData = {
        user_id: currentUser.id,
        favorite_type: editingType,
        item_id: item.id,
        item_name: item.name,
        item_image: item.images?.[0]?.url || item.album?.images?.[0]?.url || null,
        item_artists: editingType !== 'artist' 
          ? JSON.stringify(item.artists?.map((a: any) => a.name) || [])
          : null,
        position: selectedPosition,
      };

      const { error } = await supabase
        .from('user_favorites')
        .upsert(favoriteData, { onConflict: 'user_id,favorite_type,position' });

      if (error) throw error;

      // Refresh favorites
      const { data: favorites } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('position');

      if (favorites) {
        setFavoriteArtists(favorites.filter(f => f.favorite_type === 'artist'));
        setFavoriteAlbums(favorites.filter(f => f.favorite_type === 'album'));
        setFavoriteTracks(favorites.filter(f => f.favorite_type === 'track'));
      }

      // Close editing mode
      setSearchResults([]);
      setSearchQuery("");
      setSelectedPosition(null);
      setEditingType(null);
    } catch (error: any) {
      alert('Error adding favorite: ' + error.message);
    }
  };

  const handleSaveBio = async () => {
    if (!currentUser || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ bio: profile.bio })
        .eq('id', currentUser.id);

      if (error) throw error;
      alert('Bio saved!');
    } catch (error: any) {
      alert('Error saving bio: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#14181c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Profile Section */}
        <div className="glass rounded-xl border border-white/10 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              Back to Dashboard
            </button>
            {!isOwnProfile && (
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 text-sm sm:text-base ${
                  isFollowing
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'btn-primary'
                }`}
              >
                {isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {followLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
            {/* Avatar */}
            <div className="flex flex-col items-center w-full sm:w-auto">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center overflow-hidden ring-4 ring-white/10">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-white" />
                  )}
                </div>
                {isOwnProfile && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute bottom-0 right-0 bg-emerald-500 text-white p-2 rounded-full hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-lg"
                    >
                      <Upload className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </>
                )}
              </div>
              {isOwnProfile && (
                <p className="mt-2 text-sm text-gray-400">
                  {uploading ? 'Uploading...' : 'Click to upload'}
                </p>
              )}
              <div className="mt-4 flex gap-4 sm:gap-6 text-center">
                <button
                  onClick={() => setShowFollowModal('followers')}
                  className="hover:opacity-80 transition-opacity"
                >
                  <div className="text-xl sm:text-2xl font-bold text-white">{followerCount}</div>
                  <div className="text-xs text-gray-400">Followers</div>
                </button>
                <button
                  onClick={() => setShowFollowModal('following')}
                  className="hover:opacity-80 transition-opacity"
                >
                  <div className="text-xl sm:text-2xl font-bold text-white">{followingCount}</div>
                  <div className="text-xs text-gray-400">Following</div>
                </button>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 w-full">
              {isOwnProfile && (
                <div className="flex justify-end mb-4">
                  {!isEditingProfile ? (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="text-gray-400 hover:text-white text-sm px-4 py-2"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profile?.username || ''}
                    readOnly
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm sm:text-base cursor-not-allowed opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profile?.bio || ''}
                    onChange={(e) => isEditingProfile && setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                    readOnly={!isEditingProfile}
                    rows={3}
                    maxLength={200}
                    placeholder={isOwnProfile && isEditingProfile ? "Tell us about your music taste..." : "No bio yet"}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 resize-none transition-all ${
                      isEditingProfile ? 'focus:outline-none focus:ring-2 focus:ring-emerald-500' : 'cursor-not-allowed opacity-60'
                    }`}
                  />
                  {isOwnProfile && isEditingProfile && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">
                        {(profile?.bio || '').length}/200
                      </span>
                      <button
                        onClick={() => {
                          handleSaveBio();
                          setIsEditingProfile(false);
                        }}
                        disabled={saving}
                        className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 w-full sm:w-auto justify-center"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Favorites Section */}
        <div className="glass rounded-xl border border-white/10 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
            {isOwnProfile ? 'Your Top 5 Favorites' : `${profile?.username}'s Top 5 Favorites`}
          </h2>

          {/* Search Interface - Only show when editing */}
          {editingType && selectedPosition !== null && (
            <div className="mb-8 p-4 glass rounded-xl border-2 border-emerald-500">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-emerald-300">
                  Select {editingType} for position #{selectedPosition}
                </h3>
                <button
                  onClick={() => {
                    setEditingType(null);
                    setSelectedPosition(null);
                    setSearchResults([]);
                    setSearchQuery("");
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={`Search for ${editingType}s...`}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  autoFocus
                />

                <button
                  onClick={handleSearch}
                  className="btn-primary px-4 sm:px-6 py-2 text-sm sm:text-base w-full sm:w-auto"
                >
                  Search
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
                  {searchResults.map(item => (
                    <div key={item.id} className="relative cursor-pointer" onClick={() => handleAddFavorite(item)}>
                      {editingType === 'track' && <SpotifyTrackCard track={item} />}
                      {editingType === 'album' && <SpotifyAlbumCard album={item} />}
                      {editingType === 'artist' && <SpotifyArtistCard artist={item} />}
                      <div className="absolute inset-0 bg-emerald-600/20 hover:bg-emerald-600/40 rounded-lg flex items-center justify-center transition-colors">
                        <span className="bg-emerald-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                          Select
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Display Favorites */}
          <div className="space-y-8">
            {/* Favorite Artists */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Mic2 className="h-5 w-5 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top 5 Artists</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-4">
                {[1, 2, 3, 4, 5].map(pos => {
                  const fav = favoriteArtists.find(f => f.position === pos);
                  return (
                    <div 
                      key={pos} 
                      className={`text-center ${isOwnProfile ? 'cursor-pointer group' : ''}`}
                      onClick={() => {
                        if (!isOwnProfile) return;
                        setEditingType('artist');
                        setSelectedPosition(pos);
                        setSearchType('artist');
                        setSearchResults([]);
                        setSearchQuery("");
                      }}
                    >
                      <div className={`aspect-square bg-gray-200 dark:bg-zinc-800 rounded-lg mb-2 overflow-hidden relative ${isOwnProfile ? 'hover:ring-2 hover:ring-purple-500' : ''} transition-all`}>
                        {fav?.item_image ? (
                          <img src={fav.item_image} alt={fav.item_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Music className="h-8 w-8 sm:h-12 sm:w-12" />
                          </div>
                        )}
                        {isOwnProfile && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-xs sm:text-sm font-semibold">
                              {fav ? 'Change' : 'Add'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">#{pos}</div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                        {fav?.item_name || 'Empty'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Favorite Albums */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Disc3 className="h-5 w-5 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top 5 Albums</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-4">
                {[1, 2, 3, 4, 5].map(pos => {
                  const fav = favoriteAlbums.find(f => f.position === pos);
                  return (
                    <div 
                      key={pos} 
                      className={`text-center ${isOwnProfile ? 'cursor-pointer group' : ''}`}
                      onClick={() => {
                        if (!isOwnProfile) return;
                        setEditingType('album');
                        setSelectedPosition(pos);
                        setSearchType('album');
                        setSearchResults([]);
                        setSearchQuery("");
                      }}
                    >
                      <div className={`aspect-square bg-gray-200 dark:bg-zinc-800 rounded-lg mb-2 overflow-hidden relative ${isOwnProfile ? 'hover:ring-2 hover:ring-purple-500' : ''} transition-all`}>
                        {fav?.item_image ? (
                          <img src={fav.item_image} alt={fav.item_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Music className="h-8 w-8 sm:h-12 sm:w-12" />
                          </div>
                        )}
                        {isOwnProfile && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-xs sm:text-sm font-semibold">
                              {fav ? 'Change' : 'Add'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">#{pos}</div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {fav?.item_name || 'Empty'}
                      </p>
                      {fav?.item_artists && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {JSON.parse(fav.item_artists).join(', ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Favorite Tracks */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Music className="h-5 w-5 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top 5 Tracks</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-4">
                {[1, 2, 3, 4, 5].map(pos => {
                  const fav = favoriteTracks.find(f => f.position === pos);
                  return (
                    <div 
                      key={pos} 
                      className={`text-center ${isOwnProfile ? 'cursor-pointer group' : ''}`}
                      onClick={() => {
                        if (!isOwnProfile) return;
                        setEditingType('track');
                        setSelectedPosition(pos);
                        setSearchType('track');
                        setSearchResults([]);
                        setSearchQuery("");
                      }}
                    >
                      <div className={`aspect-square bg-gray-200 dark:bg-zinc-800 rounded-lg mb-2 overflow-hidden relative ${isOwnProfile ? 'hover:ring-2 hover:ring-purple-500' : ''} transition-all`}>
                        {fav?.item_image ? (
                          <img src={fav.item_image} alt={fav.item_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Music className="h-8 w-8 sm:h-12 sm:w-12" />
                          </div>
                        )}
                        {isOwnProfile && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-xs sm:text-sm font-semibold">
                              {fav ? 'Change' : 'Add'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">#{pos}</div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {fav?.item_name || 'Empty'}
                      </p>
                      {fav?.item_artists && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {JSON.parse(fav.item_artists).join(', ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reviews Section */}
        {recentReviews.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Recent Reviews</h2>
              {recentReviews.length > 5 && (
                <button
                  onClick={() => router.push(`/profile?user=${profile?.id}`)}
                  className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  View All ({recentReviews.length})
                </button>
              )}
            </div>
            <div className="space-y-4">
              {recentReviews.slice(0, 5).map(review => {
                const isTrack = review.item_type === 'track';
                const isAlbum = review.item_type === 'album';
                
                return (
                  <div key={review.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-purple-500 dark:hover:border-purple-500 transition-colors">
                    {/* Cover Art */}
                    <div className="flex-shrink-0 w-20 h-20 mx-auto sm:mx-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-zinc-700">
                      {review.item_image ? (
                        <img 
                          src={review.item_image} 
                          alt={review.item_name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {isTrack && <Music className="h-4 w-4 text-purple-600 flex-shrink-0" />}
                            {isAlbum && <Disc3 className="h-4 w-4 text-purple-600 flex-shrink-0" />}
                            {!isTrack && !isAlbum && <Mic2 className="h-4 w-4 text-purple-600 flex-shrink-0" />}
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase">
                              {review.item_type}
                            </span>
                          </div>
                          <a 
                            href={`/album/${review.item_id}`}
                            className="font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors block truncate"
                          >
                            {review.item_name}
                          </a>
                          {review.item_artists && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {review.item_artists}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4 flex-shrink-0">
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            {[...Array(5)].map((_, i) => {
                              const fullStars = Math.floor(review.rating);
                              const hasHalfStar = review.rating % 1 >= 0.5;
                              
                              if (i < fullStars) {
                                return <span key={i} className="text-yellow-500 text-base sm:text-lg">★</span>;
                              } else if (i === fullStars && hasHalfStar) {
                                return <span key={i} className="text-yellow-500 text-base sm:text-lg">⯨</span>;
                              } else {
                                return <span key={i} className="text-gray-300 dark:text-gray-600 text-base sm:text-lg">★</span>;
                              }
                            })}
                            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white ml-1 sm:ml-2">
                              {review.rating % 1 === 0 ? review.rating.toFixed(0) : review.rating.toFixed(1)}
                            </span>
                          </div>
                          {isOwnProfile && (
                            <button
                              onClick={() => setShareReview(review)}
                              className="text-emerald-500 hover:text-emerald-400 transition-colors"
                              title="Share to stories"
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {review.review && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-2 italic line-clamp-2">
                          "{review.review}"
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {shareReview && profile && (
        <ShareStoryCard
          trackName={shareReview.item_name}
          artistName={shareReview.item_artists || "Unknown Artist"}
          albumArt={shareReview.item_image || ""}
          rating={shareReview.rating}
          review={shareReview.review || undefined}
          username={profile.username}
          userAvatar={profile.avatar_url || undefined}
          onClose={() => setShareReview(null)}
        />
      )}

      {showFollowModal && profile && (
        <FollowModal
          userId={profile.id}
          type={showFollowModal}
          onClose={() => setShowFollowModal(null)}
        />
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
