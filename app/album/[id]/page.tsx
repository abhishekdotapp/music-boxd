"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Music, Clock, ArrowLeft, ExternalLink, Calendar, Disc } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { RatingModal } from "@/components/RatingModal";
import { saveRating, getRating, type Rating } from "@/lib/ratings";

interface AlbumTrack {
  id: string;
  name: string;
  track_number: number;
  duration_ms: number;
  artists: Array<{ id: string; name: string }>;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

interface AlbumDetails {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  images: Array<{ url: string; height: number; width: number }>;
  release_date: string;
  total_tracks: number;
  genres: string[];
  label: string;
  popularity: number;
  tracks: {
    items: AlbumTrack[];
  };
  external_urls: {
    spotify: string;
  };
}

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const albumId = params.id as string;

  const [album, setAlbum] = useState<AlbumDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackRatings, setTrackRatings] = useState<Record<string, number>>({});
  const [trackReviews, setTrackReviews] = useState<Record<string, string>>({});
  const [albumRating, setAlbumRating] = useState<number>(0);
  const [albumReview, setAlbumReview] = useState<string>("");
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<{ id: string; name: string; type: 'track' | 'album' } | null>(null);

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();
  }, [supabase]);

  // Fetch album details
  useEffect(() => {
    async function fetchAlbum() {
      try {
        setLoading(true);
        const response = await fetch(`/api/album?albumId=${albumId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch album');
        }
        const data = await response.json();
        setAlbum(data);
      } catch (error) {
        console.error('Error fetching album:', error);
      } finally {
        setLoading(false);
      }
    }

    if (albumId) {
      fetchAlbum();
    }
  }, [albumId]);

  // Load existing ratings
  useEffect(() => {
    async function loadRatings() {
      if (!user || !album) return;

      try {
        // Load album rating
        const albumRatingData = await getRating(album.id);
        if (albumRatingData) {
          setAlbumRating(albumRatingData.rating);
          setAlbumReview(albumRatingData.review || "");
        }

        // Load track ratings
        const ratings: Record<string, number> = {};
        const reviews: Record<string, string> = {};
        for (const track of album.tracks.items) {
          const rating = await getRating(track.id);
          if (rating) {
            ratings[track.id] = rating.rating;
            reviews[track.id] = rating.review || "";
          }
        }
        setTrackRatings(ratings);
        setTrackReviews(reviews);
      } catch (error) {
        console.error('Error loading ratings:', error);
      }
    }

    loadRatings();
  }, [user, album]);

  // Open modal for track
  const handleTrackRatingClick = (trackId: string, trackName: string) => {
    setModalItem({ id: trackId, name: trackName, type: 'track' });
    setModalOpen(true);
  };

  // Open modal for album
  const handleAlbumRatingClick = () => {
    if (!album) return;
    setModalItem({ id: album.id, name: album.name, type: 'album' });
    setModalOpen(true);
  };

  // Save rating from modal
  const handleSaveRating = async (rating: number, review?: string) => {
    if (!user || !modalItem || !album) return;

    try {
      // Find the item details
      let itemName = modalItem.name;
      let itemImage = album.images[0]?.url;
      let itemArtists = album.artists.map(a => a.name).join(', ');
      let artistId = album.artists[0]?.id;
      let artistName = album.artists[0]?.name;

      if (modalItem.type === 'track') {
        const track = album.tracks.items.find(t => t.id === modalItem.id);
        if (track) {
          itemName = track.name;
          itemImage = album.images[0]?.url;
          itemArtists = track.artists.map(a => a.name).join(', ');
          artistId = track.artists[0]?.id;
          artistName = track.artists[0]?.name;
        }
      }

      await saveRating({
        item_id: modalItem.id,
        item_type: modalItem.type,
        item_name: itemName,
        item_image: itemImage,
        item_artists: itemArtists,
        rating,
        review,
        // Pass artist data for automatic preference updates
        artist_id: artistId,
        artist_name: artistName,
      } as any);

      if (modalItem.type === 'track') {
        setTrackRatings(prev => ({ ...prev, [modalItem.id]: rating }));
        setTrackReviews(prev => ({ ...prev, [modalItem.id]: review || "" }));
      } else {
        setAlbumRating(rating);
        setAlbumReview(review || "");
      }
    } catch (error) {
      console.error('Error saving rating:', error);
      throw error;
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading album...</p>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Album not found</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalDuration = album.tracks.items.reduce((acc, track) => acc + track.duration_ms, 0);
  const avgRating = Object.values(trackRatings).length > 0
    ? Object.values(trackRatings).reduce((a, b) => a + b, 0) / Object.values(trackRatings).length
    : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
        </div>
      </header>

      {/* Album Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Album Cover */}
            <div className="md:flex-shrink-0 md:w-80">
              {album.images[0]?.url ? (
                <img
                  src={album.images[0].url}
                  alt={album.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Music className="h-32 w-32 text-white/80" />
                </div>
              )}
            </div>

            {/* Album Details */}
            <div className="p-8 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {album.name}
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                    {album.artists.map(a => a.name).join(', ')}
                  </p>
                </div>
                <a
                  href={album.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  <ExternalLink className="h-6 w-6" />
                </a>
              </div>

              {/* Rating */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rate this album
                  </p>
                  {albumRating > 0 && (
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      ⭐ {albumRating.toFixed(1)}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleAlbumRatingClick}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-medium transition-all"
                >
                  {albumRating > 0 ? 'Edit Rating & Review' : 'Add Rating & Review'}
                </button>
                {albumReview && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic line-clamp-2">
                    "{albumReview}"
                  </p>
                )}
              </div>

              {/* Album Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Release Date</p>
                  <p className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                    <Calendar className="h-4 w-4" />
                    {new Date(album.release_date).getFullYear()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tracks</p>
                  <p className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                    <Disc className="h-4 w-4" />
                    {album.total_tracks}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                  <p className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                    <Clock className="h-4 w-4" />
                    {Math.floor(totalDuration / 60000)} min
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Track Rating</p>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {avgRating > 0 ? `⭐ ${avgRating.toFixed(1)}` : 'Not rated'}
                  </p>
                </div>
              </div>

              {album.label && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Label: {album.label}
                </p>
              )}
            </div>
          </div>

          {/* Track List */}
          <div className="border-t border-gray-200 dark:border-zinc-800 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Tracks</h2>
            <div className="space-y-2">
              {album.tracks.items.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-gray-500 dark:text-gray-400 w-8 text-center font-medium">
                    {track.track_number}
                  </span>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {track.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {track.artists.map(a => a.name).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-12">
                      {formatDuration(track.duration_ms)}
                    </span>
                    
                    <div className="min-w-[140px]">
                      <button
                        onClick={() => handleTrackRatingClick(track.id, track.name)}
                        className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 text-sm font-medium transition-colors"
                      >
                        {trackRatings[track.id] > 0 ? (
                          <span>⭐ {trackRatings[track.id].toFixed(1)}</span>
                        ) : (
                          'Rate'
                        )}
                      </button>
                    </div>

                    <a
                      href={track.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveRating}
        itemName={modalItem?.name || ""}
        initialRating={
          modalItem?.type === 'album' ? albumRating : (trackRatings[modalItem?.id || ""] || 0)
        }
        initialReview={
          modalItem?.type === 'album' ? albumReview : (trackReviews[modalItem?.id || ""] || "")
        }
      />
    </div>
  );
}
