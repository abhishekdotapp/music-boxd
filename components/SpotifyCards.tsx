import React, { useState } from 'react';
import Link from 'next/link';
import { Music, Play, ExternalLink, Clock, Users, User } from 'lucide-react';
import type { SpotifyTrack, SpotifyAlbum, SpotifyArtist } from '@/lib/spotify';

interface SpotifyTrackCardProps {
  track: SpotifyTrack;
}

export function SpotifyTrackCard({ track }: SpotifyTrackCardProps) {
  const imageUrl = track.album.images[0]?.url || '/placeholder-album.svg';
  const durationMin = Math.floor(track.duration_ms / 60000);
  const durationSec = Math.floor((track.duration_ms % 60000) / 1000);

  return (
    <Link
      href={`/track/${track.id}`}
      className="group relative block overflow-hidden rounded-lg transition-all duration-300 hover:scale-105"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-800">
        {imageUrl !== '/placeholder-album.svg' ? (
          <img
            src={imageUrl}
            alt={track.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-700">
            <Music className="h-16 w-16 text-white/80" />
          </div>
        )}
        
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Hover content */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2 text-white text-xs">
            <Clock className="h-3 w-3" />
            <span>{durationMin}:{durationSec.toString().padStart(2, '0')}</span>
            {track.popularity && (
              <>
                <span className="text-white/50">•</span>
                <span className="text-emerald-400">♥ {track.popularity}%</span>
              </>
            )}
          </div>
        </div>

        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="rounded-full bg-emerald-500 p-3 shadow-2xl transform transition-transform group-hover:scale-110">
            <Play className="h-6 w-6 text-white fill-white" />
          </div>
        </div>
      </div>

      {/* Track info below image */}
      <div className="mt-2 px-1">
        <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
          {track.name}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
          {track.artists.map(a => a.name).join(', ')}
        </p>
      </div>

      {/* Spotify link */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.open(track.external_urls.spotify, '_blank', 'noopener,noreferrer');
        }}
        className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-full hover:bg-emerald-600 transition-all opacity-0 group-hover:opacity-100 z-10"
        title="Open in Spotify"
      >
        <ExternalLink className="h-3.5 w-3.5 text-white" />
      </button>
    </Link>
  );
}

interface SpotifyAlbumCardProps {
  album: SpotifyAlbum;
}

export function SpotifyAlbumCard({ album }: SpotifyAlbumCardProps) {
  const imageUrl = album.images[0]?.url || '/placeholder-album.svg';
  const releaseYear = new Date(album.release_date).getFullYear();

  return (
    <Link 
      href={`/album/${album.id}`}
      className="group relative block overflow-hidden rounded-lg transition-all duration-300 hover:scale-105"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-800">
        {imageUrl !== '/placeholder-album.svg' ? (
          <img
            src={imageUrl}
            alt={album.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-600 to-pink-700">
            <Music className="h-16 w-16 text-white/80" />
          </div>
        )}
        
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Hover content */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2 text-white text-xs">
            <span>{releaseYear}</span>
            <span className="text-white/50">•</span>
            <span className="text-emerald-400">{album.total_tracks} tracks</span>
          </div>
        </div>

        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="rounded-full bg-emerald-500 p-3 shadow-2xl transform transition-transform group-hover:scale-110">
            <Play className="h-6 w-6 text-white fill-white" />
          </div>
        </div>
      </div>

      {/* Album info below image */}
      <div className="mt-2 px-1">
        <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
          {album.name}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
          {album.artists.map(a => a.name).join(', ')}
        </p>
      </div>

      {/* Spotify link */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(album.external_urls.spotify, '_blank', 'noopener,noreferrer');
          }}
          className="block p-1.5 bg-black/60 backdrop-blur-sm rounded-full hover:bg-emerald-600 transition-all"
          title="Open in Spotify"
        >
          <ExternalLink className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
    </Link>
  );
}

interface SpotifyArtistCardProps {
  artist: SpotifyArtist;
}

export function SpotifyArtistCard({ artist }: SpotifyArtistCardProps) {
  const imageUrl = artist.images[0]?.url || '/placeholder-album.svg';
  const followerCount = artist.followers ? (artist.followers.total / 1000000).toFixed(1) : '0';

  return (
    <Link 
      href={`/artist/${artist.id}`}
      className="group relative block overflow-hidden rounded-lg transition-all duration-300 hover:scale-105"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-800">
        {imageUrl !== '/placeholder-album.svg' ? (
          <img
            src={imageUrl}
            alt={artist.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
            <User className="h-16 w-16 text-white/80" />
          </div>
        )}
        
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Hover content */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {artist.followers && (
            <div className="flex items-center gap-2 text-white text-xs mb-2">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">{followerCount}M followers</span>
            </div>
          )}
          
          {artist.genres && artist.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {artist.genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-0.5 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-full text-xs text-emerald-300"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="rounded-full bg-emerald-500 p-3 shadow-2xl transform transition-transform group-hover:scale-110">
            <Play className="h-6 w-6 text-white fill-white" />
          </div>
        </div>
      </div>

      {/* Artist info below image */}
      <div className="mt-2 px-1">
        <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
          {artist.name}
        </h3>
        {artist.popularity && (
          <p className="text-xs text-gray-400 mt-0.5">
            {artist.popularity}/100 popularity
          </p>
        )}
      </div>

      {/* Spotify link */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(artist.external_urls.spotify, '_blank', 'noopener,noreferrer');
          }}
          className="block p-1.5 bg-black/60 backdrop-blur-sm rounded-full hover:bg-emerald-600 transition-all"
          title="Open in Spotify"
        >
          <ExternalLink className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
    </Link>
  );
}
