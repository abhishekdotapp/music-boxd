import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Create or update a rating
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { item_id, item_type, item_name, item_image, item_artists, rating, review, artist_id, artist_name } = body;

    if (!item_id || !item_type || !item_name || rating === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert rating with metadata
    const { data, error } = await supabase
      .from('music_ratings')
      .upsert({
        user_id: user.id,
        item_id,
        item_type,
        item_name,
        item_image: item_image || null,
        item_artists: item_artists || null,
        rating,
        review: review || '',
      }, {
        onConflict: 'user_id,item_id'
      })
      .select()
      .single();

    if (error) throw error;

    // If rating is 4+ stars and it's a track, add artist to preferences
    if (rating >= 4 && item_type === 'track' && artist_id && artist_name) {
      try {
        // Get current preferences
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('favorite_artists')
          .eq('user_id', user.id)
          .maybeSingle();

        const currentArtists = preferences?.favorite_artists || [];
        
        // Check if artist is already in favorites
        const artistExists = currentArtists.some((a: any) => a.id === artist_id);
        
        if (!artistExists) {
          // Add the artist to favorites
          const updatedArtists = [
            ...currentArtists,
            {
              id: artist_id,
              name: artist_name,
              image: item_image || null
            }
          ];

          if (preferences) {
            // Update existing preferences
            await supabase
              .from('user_preferences')
              .update({
                favorite_artists: updatedArtists,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id);
          } else {
            // Insert new preferences
            await supabase
              .from('user_preferences')
              .insert({
                user_id: user.id,
                favorite_artists: updatedArtists,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
          }
          
          console.log(`Added artist ${artist_name} to user preferences (rated ${rating} stars)`);
        }
      } catch (prefError) {
        // Don't fail the rating if preference update fails
        console.error('Error updating preferences:', prefError);
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error saving rating:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save rating' },
      { status: 500 }
    );
  }
}

// GET - Get rating(s)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');
    const itemType = searchParams.get('item_type');

    let query = supabase
      .from('music_ratings')
      .select('*')
      .eq('user_id', user.id);
    
    if (itemId) {
      query = query.eq('item_id', itemId);
    }
    
    if (itemType) {
      query = query.eq('item_type', itemType);
    }

    const { data, error } = await query;

    if (error) throw error;

    // If looking for a specific item, return single result
    if (itemId) {
      return NextResponse.json(data && data.length > 0 ? data[0] : null);
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error getting ratings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get ratings' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a rating
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');

    if (!itemId) {
      return NextResponse.json({ error: 'Missing item_id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('music_ratings')
      .delete()
      .eq('user_id', user.id)
      .eq('item_id', itemId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting rating:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete rating' },
      { status: 500 }
    );
  }
}
