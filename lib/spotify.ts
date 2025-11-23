import axios from 'axios';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

// Spotify API Types
export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  genres?: string[];
  followers?: {
    total: number;
  };
  popularity?: number;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  images: SpotifyImage[];
  release_date: string;
  total_tracks: number;
  album_type: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: SpotifyImage[];
  };
  duration_ms: number;
  popularity: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

// Get Spotify Access Token from our API route
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await fetch('/api/spotify-token');
    if (!response.ok) {
      throw new Error('Failed to get access token');
    }
    
    const data = await response.json();
    accessToken = data.access_token;
    // Set expiry 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (3600 - 300) * 1000; // Spotify tokens last 1 hour
    return accessToken!;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    throw error;
  }
}

// Make authenticated request to Spotify API
async function spotifyRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  try {
    const token = await getAccessToken();
    
    const response = await axios.get(`https://api.spotify.com/v1${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error(`Spotify API Error ${error.response.status} for ${endpoint}:`, error.response.data);
    } else {
      console.error(`Error making Spotify request to ${endpoint}:`, error.message);
    }
    throw error;
  }
}

// Search for tracks
export async function searchTracks(query: string, limit: number = 20): Promise<SpotifyTrack[]> {
  try {
    const data = await spotifyRequest<{ tracks: { items: SpotifyTrack[] } }>('/search', {
      q: query,
      type: 'track',
      limit,
    });
    return data.tracks.items;
  } catch (error) {
    console.error('Error searching tracks:', error);
    return [];
  }
}

// Search for albums
export async function searchAlbums(query: string, limit: number = 20): Promise<SpotifyAlbum[]> {
  try {
    const data = await spotifyRequest<{ albums: { items: SpotifyAlbum[] } }>('/search', {
      q: query,
      type: 'album',
      limit,
    });
    return data.albums.items;
  } catch (error) {
    console.error('Error searching albums:', error);
    return [];
  }
}

// Search for artists
export async function searchArtists(query: string, limit: number = 20): Promise<SpotifyArtist[]> {
  try {
    const data = await spotifyRequest<{ artists: { items: SpotifyArtist[] } }>('/search', {
      q: query,
      type: 'artist',
      limit,
    });
    return data.artists.items;
  } catch (error) {
    console.error('Error searching artists:', error);
    return [];
  }
}

// Get new releases (albums)
export async function getNewReleases(limit: number = 20): Promise<SpotifyAlbum[]> {
  try {
    const data = await spotifyRequest<{ albums: { items: SpotifyAlbum[] } }>('/browse/new-releases', {
      limit,
      country: 'US',
    });
    return data.albums.items || [];
  } catch (error) {
    console.error('Error getting new releases:', error);
    return [];
  }
}

// Get featured/popular tracks using search
export async function getFeaturedTracks(limit: number = 20): Promise<SpotifyTrack[]> {
  try {
    // Use search for popular tracks with a trending term
    const data = await spotifyRequest<{ tracks: { items: SpotifyTrack[] } }>('/search', {
      q: 'year:2024-2025',
      type: 'track',
      limit,
      market: 'US',
    });
    
    if (data.tracks?.items && data.tracks.items.length > 0) {
      // Sort by popularity
      return data.tracks.items.sort((a, b) => b.popularity - a.popularity);
    }
    
    // Fallback to top tracks
    return await getTopTracks(limit);
  } catch (error) {
    console.error('Error getting featured tracks:', error);
    // Fallback to top tracks
    return await getTopTracks(limit);
  }
}

// Get recommendations based on genres
export async function getRecommendationsByGenre(genre: string, limit: number = 20): Promise<SpotifyTrack[]> {
  try {
    // Map common genre names to Spotify seed genres
    const genreMap: Record<string, string> = {
      'rock': 'rock',
      'pop': 'pop',
      'hip-hop': 'hip-hop',
      'hip hop': 'hip-hop',
      'rap': 'hip-hop',
      'jazz': 'jazz',
      'classical': 'classical',
      'electronic': 'electronic',
      'edm': 'edm',
      'dance': 'dance',
      'country': 'country',
      'r&b': 'r-n-b',
      'rnb': 'r-n-b',
      'indie': 'indie',
      'alternative': 'alt-rock',
      'metal': 'metal',
      'folk': 'folk',
      'blues': 'blues',
      'reggae': 'reggae',
      'latin': 'latin',
      'soul': 'soul',
      'funk': 'funk',
      'punk': 'punk',
      'k-pop': 'k-pop',
      'kpop': 'k-pop',
    };

    const seedGenre = genreMap[genre.toLowerCase()] || genre.toLowerCase().replace(/\s+/g, '-');
    console.log('Getting recommendations for genre:', seedGenre);
    
    const data = await spotifyRequest<{ tracks: SpotifyTrack[] }>('/recommendations', {
      seed_genres: seedGenre,
      limit,
      market: 'US',
    });
    
    if (data.tracks && data.tracks.length > 0) {
      console.log(`Found ${data.tracks.length} recommendations for ${seedGenre}`);
      return data.tracks;
    }
    
    // Fallback: search for popular tracks in that genre
    console.log('No recommendations, trying search fallback for:', genre);
    return await searchTracksByGenre(genre, limit);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    // Fallback to search
    return await searchTracksByGenre(genre, limit);
  }
}

// Fallback: Search for tracks by genre
async function searchTracksByGenre(genre: string, limit: number = 20): Promise<SpotifyTrack[]> {
  try {
    const data = await spotifyRequest<{ tracks: { items: SpotifyTrack[] } }>('/search', {
      q: `genre:"${genre}"`,
      type: 'track',
      limit,
    });
    return data.tracks?.items || [];
  } catch (error) {
    console.error('Error searching tracks by genre:', error);
    return [];
  }
}

// Get recommendations based on favorite artists
export async function getRecommendationsByArtists(artistIds: string[], limit: number = 20): Promise<SpotifyTrack[]> {
  try {
    if (!artistIds || artistIds.length === 0) {
      return await getTopTracks(limit);
    }

    // Spotify allows up to 5 seed artists
    const seedArtists = artistIds.slice(0, 5).join(',');
    console.log('Getting recommendations for artists:', seedArtists);
    
    const data = await spotifyRequest<{ tracks: SpotifyTrack[] }>('/recommendations', {
      seed_artists: seedArtists,
      limit,
      market: 'US',
    });
    
    if (data.tracks && data.tracks.length > 0) {
      console.log(`Found ${data.tracks.length} artist-based recommendations`);
      return data.tracks;
    }
    
    // Fallback to top tracks if no recommendations
    console.log('No recommendations found, falling back to top tracks');
    return await getTopTracks(limit);
  } catch (error) {
    console.error('Error getting artist recommendations:', error);
    return await getTopTracks(limit);
  }
}

// Get similar artists based on a seed artist
export async function getSimilarArtists(artistId: string, limit: number = 10): Promise<SpotifyArtist[]> {
  try {
    const data = await spotifyRequest<{ artists: SpotifyArtist[] }>(`/artists/${artistId}/related-artists`);
    return data.artists?.slice(0, limit) || [];
  } catch (error) {
    console.error('Error getting similar artists:', error);
    return [];
  }
}

// Get artist's top tracks
export async function getArtistTopTracks(artistId: string, limit: number = 10): Promise<SpotifyTrack[]> {
  try {
    const data = await spotifyRequest<{ tracks: SpotifyTrack[] }>(`/artists/${artistId}/top-tracks`, {
      market: 'US',
    });
    return data.tracks?.slice(0, limit) || [];
  } catch (error) {
    console.error('Error getting artist top tracks:', error);
    return [];
  }
}

// Get artist's albums
export async function getArtistAlbums(artistId: string, limit: number = 20): Promise<SpotifyAlbum[]> {
  try {
    const data = await spotifyRequest<{ items: SpotifyAlbum[] }>(`/artists/${artistId}/albums`, {
      include_groups: 'album,single',
      limit,
      market: 'US',
    });
    return data.items || [];
  } catch (error) {
    console.error('Error getting artist albums:', error);
    return [];
  }
}

// Get recommendations based on multiple user genres
export async function getRecommendationsByUserGenres(genres: string[], limit: number = 20): Promise<SpotifyTrack[]> {
  try {
    if (!genres || genres.length === 0) {
      return await getTopTracks(limit);
    }

    // Take up to 5 genres (Spotify limit for seed_genres)
    const genreMap: Record<string, string> = {
      'rock': 'rock',
      'pop': 'pop',
      'hip-hop': 'hip-hop',
      'hip hop': 'hip-hop',
      'rap': 'hip-hop',
      'jazz': 'jazz',
      'classical': 'classical',
      'electronic': 'electronic',
      'edm': 'edm',
      'dance': 'dance',
      'country': 'country',
      'r&b': 'r-n-b',
      'rnb': 'r-n-b',
      'indie': 'indie',
      'alternative': 'alt-rock',
      'metal': 'metal',
      'folk': 'folk',
      'blues': 'blues',
      'reggae': 'reggae',
      'latin': 'latin',
      'soul': 'soul',
      'funk': 'funk',
      'punk': 'punk',
      'k-pop': 'k-pop',
      'kpop': 'k-pop',
    };

    const seedGenres = genres
      .slice(0, 5)
      .map(g => genreMap[g.toLowerCase()] || g.toLowerCase().replace(/\s+/g, '-'))
      .join(',');

    console.log('Getting recommendations for genres:', seedGenres);
    
    const data = await spotifyRequest<{ tracks: SpotifyTrack[] }>('/recommendations', {
      seed_genres: seedGenres,
      limit,
      market: 'US',
    });
    
    if (data.tracks && data.tracks.length > 0) {
      return data.tracks;
    }

    // Fallback: get recommendations for first genre only
    return await getRecommendationsByGenre(genres[0], limit);
  } catch (error) {
    console.error('Error getting recommendations by user genres:', error);
    return await getRecommendationsByGenre(genres[0], limit);
  }
}

// Get top/trending tracks
export async function getTopTracks(limit: number = 20): Promise<SpotifyTrack[]> {
  try {
    // Use search for popular tracks instead of playlists
    const data = await spotifyRequest<{ tracks: { items: SpotifyTrack[] } }>('/search', {
      q: 'year:2024-2025',
      type: 'track',
      limit,
      market: 'US',
    });
    
    // Sort by popularity
    return data.tracks?.items.sort((a, b) => b.popularity - a.popularity) || [];
  } catch (error) {
    console.error('Error getting top tracks:', error);
    return [];
  }
}

// Get albums from favorite artists
export async function getArtistAlbumsFromList(artistIds: string[], limitPerArtist: number = 3): Promise<SpotifyAlbum[]> {
  try {
    const albumPromises = artistIds.slice(0, 5).map(async (artistId) => {
      try {
        const data = await spotifyRequest<{ items: SpotifyAlbum[] }>(`/artists/${artistId}/albums`, {
          include_groups: 'album,single',
          market: 'US',
          limit: limitPerArtist,
        });
        return data.items || [];
      } catch (error) {
        return [];
      }
    });
    
    const results = await Promise.all(albumPromises);
    const allAlbums = results.flat();
    
    // Deduplicate by album ID and sort by release date
    const uniqueAlbums = Array.from(
      new Map(allAlbums.map(album => [album.id, album])).values()
    );
    
    return uniqueAlbums.sort((a, b) => 
      new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
    );
  } catch (error) {
    console.error('Error getting artist albums:', error);
    return [];
  }
}

// Get several artists by IDs
export async function getSeveralArtists(ids: string[]): Promise<SpotifyArtist[]> {
  try {
    const data = await spotifyRequest<{ artists: SpotifyArtist[] }>('/artists', {
      ids: ids.join(','),
    });
    return data.artists;
  } catch (error) {
    console.error('Error getting artists:', error);
    return [];
  }
}

// Get available genre seeds
export async function getAvailableGenres(): Promise<string[]> {
  try {
    const data = await spotifyRequest<{ genres: string[] }>('/recommendations/available-genre-seeds');
    return data.genres;
  } catch (error) {
    console.error('Error getting available genres:', error);
    return [];
  }
}

// Helper to get best quality image
export function getBestImage(images: SpotifyImage[]): string {
  if (!images || images.length === 0) return '/placeholder-album.svg';
  
  // Sort by size and return largest
  const sorted = [...images].sort((a, b) => (b.width || 0) - (a.width || 0));
  return sorted[0]?.url || '/placeholder-album.svg';
}

// Get category playlists (for discovering music by mood/genre)
export async function getCategoryPlaylists(categoryId: string, limit: number = 20) {
  try {
    const data = await spotifyRequest<{ playlists: { items: Array<any> } }>(`/browse/categories/${categoryId}/playlists`, {
      limit,
    });
    return data.playlists.items;
  } catch (error) {
    console.error('Error getting category playlists:', error);
    return [];
  }
}
