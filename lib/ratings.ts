export interface Rating {
  user_id: string;
  item_id: string; // track, album, or artist ID
  item_type: 'track' | 'album' | 'artist';
  item_name: string; // Song/Album/Artist name
  item_image?: string; // Cover art URL
  item_artists?: string; // Artist names (for tracks/albums)
  rating: number; // 1-5 stars (supports 0.5 increments)
  review?: string;
  $id?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

// Save or update a rating
export async function saveRating(rating: Omit<Rating, 'user_id'>): Promise<Rating> {
  try {
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rating),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save rating');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving rating:', error);
    throw error;
  }
}

// Get a specific rating
export async function getRating(itemId: string): Promise<Rating | null> {
  try {
    const response = await fetch(`/api/ratings?item_id=${itemId}`);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting rating:', error);
    return null;
  }
}

// Get all ratings for a user
export async function getUserRatings(itemType?: string): Promise<Rating[]> {
  try {
    const url = itemType 
      ? `/api/ratings?item_type=${itemType}`
      : '/api/ratings';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting user ratings:', error);
    return [];
  }
}

// Get average rating for an item (this needs a separate endpoint)
export async function getAverageRating(itemId: string): Promise<number> {
  try {
    const response = await fetch(`/api/ratings/average?item_id=${itemId}`);
    
    if (!response.ok) {
      return 0;
    }
    
    const data = await response.json();
    return data.average || 0;
  } catch (error) {
    console.error('Error getting average rating:', error);
    return 0;
  }
}

// Delete a rating
export async function deleteRating(itemId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/ratings?item_id=${itemId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting rating:', error);
    return false;
  }
}
