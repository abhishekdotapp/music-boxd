"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Music, ArrowLeft, Clock, ExternalLink, User, Star, Share2 } from "lucide-react";
import { RatingModal } from "@/components/RatingModal";
import { ShareStoryCard } from "@/components/ShareStoryCard";
import { saveRating, getRating } from "@/lib/ratings";
import Link from "next/link";

interface TrackDetails {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
  popularity: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

interface TrackReview {
  id: string;
  user_id: string;
  rating: number;
  review: string | null;
  created_at: string;
  user_profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export default function TrackPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const trackId = params.id as string;

  const [track, setTrack] = useState<TrackDetails | null>(null);
  const [reviews, setReviews] = useState<TrackReview[]>([]);
  const [userRating, setUserRating] = useState<number>(0);
  const [userReview, setUserReview] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [shareReview, setShareReview] = useState<TrackReview | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        // Fetch track details from Spotify
        const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: {
            Authorization: `Bearer ${await getSpotifyToken()}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch track");
        const trackData = await response.json();
        setTrack(trackData);

        // Fetch all reviews for this track
        const { data: reviewsData } = await supabase
          .from("music_ratings")
          .select('*')
          .eq("item_id", trackId)
          .eq("item_type", "track")
          .order("created_at", { ascending: false });

        if (reviewsData && reviewsData.length > 0) {
          // Fetch user profiles separately
          const userIds = [...new Set(reviewsData.map(r => r.user_id))];
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);

          // Merge profiles with reviews
          const reviewsWithProfiles = reviewsData.map(review => ({
            ...review,
            user_profiles: profiles?.find(p => p.id === review.user_id) || {
              username: 'Unknown User',
              avatar_url: null,
            }
          }));

          setReviews(reviewsWithProfiles as any);
          
          // Find current user's review
          if (user) {
            const myReview = reviewsData.find((r: any) => r.user_id === user.id);
            if (myReview) {
              setUserRating(myReview.rating);
              setUserReview(myReview.review || "");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching track:", error);
      } finally {
        setLoading(false);
      }
    };

    if (trackId) {
      fetchTrack();
    }
  }, [trackId, user, supabase]);

  const getSpotifyToken = async () => {
    const response = await fetch("/api/spotify-token");
    const data = await response.json();
    return data.access_token;
  };

  const handleSaveRating = async (rating: number, review?: string) => {
    if (!user || !track) return;

    try {
      await saveRating({
        item_id: track.id,
        item_type: "track",
        item_name: track.name,
        item_image: track.album.images[0]?.url,
        item_artists: track.artists.map(a => a.name).join(", "),
        rating,
        review,
        // Pass artist data for automatic preference updates
        artist_id: track.artists[0]?.id,
        artist_name: track.artists[0]?.name,
      } as any);

      setUserRating(rating);
      setUserReview(review || "");

      // Refresh reviews
      const { data: reviewsData } = await supabase
        .from("music_ratings")
        .select('*')
        .eq("item_id", trackId)
        .eq("item_type", "track")
        .order("created_at", { ascending: false });

      if (reviewsData && reviewsData.length > 0) {
        // Fetch user profiles separately
        const userIds = [...new Set(reviewsData.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        // Merge profiles with reviews
        const reviewsWithProfiles = reviewsData.map(review => ({
          ...review,
          user_profiles: profiles?.find(p => p.id === review.user_id) || {
            username: 'Unknown User',
            avatar_url: null,
          }
        }));

        setReviews(reviewsWithProfiles as any);
      }
    } catch (error) {
      console.error("Error saving rating:", error);
      throw error;
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < fullStars
                ? 'fill-yellow-400 text-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'fill-yellow-400 text-yellow-400 opacity-50'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading track...</p>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Track not found</h1>
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

  const durationMin = Math.floor(track.duration_ms / 60000);
  const durationSec = Math.floor((track.duration_ms % 60000) / 1000);
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Track Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden mb-8">
          <div className="flex flex-col md:flex-row gap-8 p-8">
            {/* Album Art */}
            <div className="flex-shrink-0">
              <div className="relative h-64 w-64 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 mx-auto md:mx-0">
                <img
                  src={track.album.images[0]?.url}
                  alt={track.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Track Info */}
            <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {track.name}
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                {track.artists.map(a => a.name).join(", ")}
              </p>

              <Link
                href={`/album/${track.album.id}`}
                className="text-lg text-purple-600 dark:text-purple-400 hover:underline mb-6"
              >
                {track.album.name}
              </Link>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{durationMin}:{durationSec.toString().padStart(2, '0')}</span>
                </div>
                {track.popularity && (
                  <div className="flex items-center gap-2">
                    <span>♥ {track.popularity}% popularity</span>
                  </div>
                )}
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
                  </div>
                )}
              </div>

              {avgRating > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Rating</p>
                  {renderStars(avgRating)}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  {userRating > 0 ? 'Update Rating' : 'Rate Track'}
                </button>
                <a
                  href={track.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Spotify
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            User Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <Music className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No reviews yet. Be the first to rate this track!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 dark:border-zinc-800 pb-6 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    <Link
                      href={`/profile?user=${review.user_id}`}
                      className="flex-shrink-0"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden">
                        {review.user_profiles.avatar_url ? (
                          <img
                            src={review.user_profiles.avatar_url}
                            alt={review.user_profiles.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-white" />
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <Link
                          href={`/profile?user=${review.user_id}`}
                          className="font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400"
                        >
                          {review.user_profiles.username}
                        </Link>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                          {review.user_id === user?.id && (
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
                      {renderStars(review.rating)}
                      {review.review && (
                        <p className="mt-3 text-gray-700 dark:text-gray-300">{review.review}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showRatingModal && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          onSave={handleSaveRating}
          itemName={track.name}
          initialRating={userRating}
          initialReview={userReview}
        />
      )}

      {shareReview && track && (
        <ShareStoryCard
          trackName={track.name}
          artistName={track.artists.map(a => a.name).join(", ")}
          albumArt={track.album.images[0]?.url || ""}
          rating={shareReview.rating}
          review={shareReview.review || undefined}
          username={shareReview.user_profiles.username}
          userAvatar={shareReview.user_profiles.avatar_url || undefined}
          onClose={() => setShareReview(null)}
        />
      )}
    </div>
  );
}
