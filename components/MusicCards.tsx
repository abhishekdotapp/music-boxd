import React from 'react';
import { Music, Play, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SpotifyTrack, SpotifyAlbum, SpotifyArtist } from '@/lib/spotify';

// Spotify Components
interface SpotifyTrackCardProps {
  track: SpotifyTrack;
  showImage?: boolean;
}

export function SpotifyTrackCard({ track, showImage = true }: SpotifyTrackCardProps) {
  const imageUrl = track.album?.images?.[0]?.url;

  return (
    <a 
      href={track.external_urls.spotify} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group relative flex flex-col overflow-hidden rounded-lg bg-white dark:bg-zinc-900 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {showImage && (
        <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={track.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
              <Music className="h-16 w-16 text-white/80" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Play className="h-12 w-12 text-white drop-shadow-lg" />
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {track.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
          {track.artists.map(a => a.name).join(', ')}
        </p>
        {track.popularity && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${track.popularity > 70 ? 'bg-green-500' : track.popularity > 40 ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
              {track.popularity}% popular
            </span>
          </div>
        )}
      </div>
      <ExternalLink className="absolute top-2 right-2 h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
    </a>
  );
}

interface SpotifyAlbumCardProps {
  album: SpotifyAlbum;
}

export function SpotifyAlbumCard({ album }: SpotifyAlbumCardProps) {
  const imageUrl = album.images?.[0]?.url;

  return (
    <a 
      href={album.external_urls.spotify} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group relative flex flex-col overflow-hidden rounded-lg bg-white dark:bg-zinc-900 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={album.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600">
            <Music className="h-16 w-16 text-white/80" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Play className="h-12 w-12 text-white drop-shadow-lg" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {album.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
          {album.artists.map(a => a.name).join(', ')}
        </p>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          {album.total_tracks} tracks • {new Date(album.release_date).getFullYear()}
        </div>
      </div>
      <ExternalLink className="absolute top-2 right-2 h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
    </a>
  );
}

interface SpotifyArtistCardProps {
  artist: SpotifyArtist;
}

export function SpotifyArtistCard({ artist }: SpotifyArtistCardProps) {
  const imageUrl = artist.images?.[0]?.url;

  return (
    <a 
      href={artist.external_urls.spotify} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group relative flex flex-col items-center overflow-hidden rounded-lg bg-white dark:bg-zinc-900 p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative h-32 w-32 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={artist.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-500 to-teal-600">
            <Music className="h-12 w-12 text-white/80" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white text-center line-clamp-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
        {artist.name}
      </h3>
      {artist.followers && (
        <div className="mt-2 flex flex-col items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
          <span>{artist.followers.total.toLocaleString()} followers</span>
          {artist.popularity && (
            <span className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${artist.popularity > 70 ? 'bg-green-500' : artist.popularity > 40 ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
              {artist.popularity}% popular
            </span>
          )}
        </div>
      )}
      <ExternalLink className="absolute top-2 right-2 h-4 w-4 text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

