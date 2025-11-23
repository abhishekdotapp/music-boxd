import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('Fetching recent reviews, limit:', limit);

    // Get recent reviews (all ratings, not just those with text)
    const { data: reviews, error } = await supabase
      .from('music_ratings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent reviews:', error);
      return NextResponse.json({ reviews: [], error: error.message });
    }

    console.log('Reviews fetched:', reviews?.length || 0);

    if (!reviews || reviews.length === 0) {
      console.log('No reviews found in database');
      return NextResponse.json({ reviews: [] });
    }

    // Get unique user IDs
    const userIds = [...new Set(reviews.map(r => r.user_id))];
    console.log('Fetching profiles for user IDs:', userIds);

    // Fetch user profiles separately
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
    }

    console.log('Profiles fetched:', profiles?.length || 0);

    // Merge the data
    const reviewsWithProfiles = reviews.map(review => ({
      ...review,
      user_profiles: profiles?.find(p => p.id === review.user_id) || {
        username: 'Unknown User',
        avatar_url: null,
      }
    }));

    console.log('Returning reviews with profiles:', reviewsWithProfiles.length);
    return NextResponse.json({ reviews: reviewsWithProfiles });
  } catch (error) {
    console.error('Error in recent reviews API:', error);
    return NextResponse.json({ reviews: [], error: String(error) }, { status: 500 });
  }
}
