"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Music, ArrowLeft, User, Star, Share2 } from "lucide-react";
import { ShareStoryCard } from "@/components/ShareStoryCard";
import Link from "next/link";

interface FeedReview {
  id: string;
  user_id: string;
  item_id: string;
  item_type: string;
  item_name: string;
  item_image: string | null;
  item_artists: string | null;
  rating: number;
  review: string | null;
  created_at: string;
  user_profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export default function FeedPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<FeedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareReview, setShareReview] = useState<FeedReview | null>(null);

  useEffect(() => {
    async function loadFeed() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/sign-in');
          return;
        }
        setUser(user);

        // Get list of users current user follows
        const { data: following } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (!following || following.length === 0) {
          setLoading(false);
          return;
        }

        const followingIds = following.map(f => f.following_id);

        console.log('Following IDs:', followingIds);
        console.log('Following count:', followingIds.length);

        // First, get all ratings from followed users
        const { data: feedReviews, error: feedError } = await supabase
          .from('music_ratings')
          .select('*')
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .limit(50);

        console.log('Feed reviews (raw):', feedReviews);
        console.log('Feed error:', feedError);

        // If we have reviews, fetch the user profiles separately
        if (feedReviews && feedReviews.length > 0) {
          const userIds = [...new Set(feedReviews.map(r => r.user_id))];
          
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);

          console.log('Profiles:', profiles);

          // Merge the data
          const reviewsWithProfiles = feedReviews.map(review => ({
            ...review,
            user_profiles: profiles?.find(p => p.id === review.user_id) || {
              username: 'Unknown User',
              avatar_url: null,
            }
          }));

          console.log('Reviews with profiles:', reviewsWithProfiles);
          setReviews(reviewsWithProfiles as any);
        }
      } catch (error) {
        console.error('Error loading feed:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFeed();
  }, [supabase, router]);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <span key={i} className="text-emerald-400 text-lg">★</span>;
          } else if (i === fullStars && hasHalfStar) {
            return (
              <span key={i} className="relative inline-block text-lg">
                <span className="text-gray-600">★</span>
                <span className="absolute left-0 top-0 overflow-hidden text-emerald-400" style={{width: '50%'}}>★</span>
              </span>
            );
          } else {
            return <span key={i} className="text-gray-600 text-lg">★</span>;
          }
        })}
        <span className="ml-2 text-sm text-gray-400">{rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1)}</span>
      </div>
    );
  };  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#14181c]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#14181c]">
      {/* Header */}
      <header className="bg-[#14181c]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Following Feed</h1>

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <Music className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No reviews yet</h2>
            <p className="text-gray-400">
              Follow other users to see their reviews here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
            <div
              key={review.id}
              className="glass rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all"
            >
              {/* User info */}
              <div className="flex items-center justify-between mb-4">
                <Link 
                  href={`/profile?user=${review.user_id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {review.user_profiles.avatar_url ? (
                      <img
                        src={review.user_profiles.avatar_url}
                        alt={review.user_profiles.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {review.user_profiles.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </Link>
                {review.user_id === user?.id && (
                  <button
                    onClick={() => setShareReview(review)}
                    className="text-emerald-500 hover:text-emerald-400 transition-colors"
                    title="Share to stories"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                )}
              </div>                {/* Review content */}
                <div className="flex gap-4">
                  {review.item_image && (
                    <Link
                      href={review.item_type === 'album' ? `/album/${review.item_id}` : '#'}
                      className="flex-shrink-0"
                    >
                      <img
                        src={review.item_image}
                        alt={review.item_name}
                        className="w-20 h-20 rounded-lg object-cover hover:opacity-80 transition-opacity"
                      />
                    </Link>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <Link
                      href={review.item_type === 'album' ? `/album/${review.item_id}` : review.item_type === 'track' ? `/track/${review.item_id}` : '#'}
                      className="font-semibold text-white hover:text-emerald-400 transition-colors"
                    >
                      {review.item_name}
                    </Link>
                    {review.item_artists && (
                      <p className="text-sm text-gray-400 mb-2">
                        {review.item_artists}
                      </p>
                    )}
                    {renderStars(review.rating)}
                    {review.review && (
                      <p className="mt-3 text-gray-300">{review.review}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {shareReview && (
        <ShareStoryCard
          trackName={shareReview.item_name}
          artistName={shareReview.item_artists || "Unknown Artist"}
          albumArt={shareReview.item_image || ""}
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
