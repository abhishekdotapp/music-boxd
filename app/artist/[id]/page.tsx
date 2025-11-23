"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Music, ArrowLeft, ExternalLink, Users, Disc } from "lucide-react";
import { SpotifyAlbumCard, SpotifyTrackCard } from "@/components/SpotifyCards";
import type { SpotifyAlbum, SpotifyTrack, SpotifyArtist } from "@/lib/spotify";

interface ArtistDetails extends SpotifyArtist {
  // SpotifyArtist already has all needed fields
}

export default function ArtistPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const artistId = params.id as string;

  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        // Fetch artist details
        const artistRes = await fetch(`/api/spotify?type=artist&id=${artistId}`);
        if (!artistRes.ok) throw new Error("Failed to fetch artist");
        const artistData = await artistRes.json();
        setArtist(artistData);

        // Fetch top tracks
        const tracksRes = await fetch(`/api/spotify?type=artist-top-tracks&id=${artistId}`);
        if (tracksRes.ok) {
          const tracksData = await tracksRes.json();
          setTopTracks(tracksData.tracks || []);
        }

        // Fetch albums
        const albumsRes = await fetch(`/api/spotify?type=artist-albums&id=${artistId}`);
        if (albumsRes.ok) {
          const albumsData = await albumsRes.json();
          setAlbums(albumsData.items || []);
        }
      } catch (error) {
        console.error("Error fetching artist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [artistId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading artist...</p>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Artist not found</h1>
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

  const imageUrl = artist.images[0]?.url || '/placeholder-album.svg';

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
        {/* Artist Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden mb-8">
          <div className="flex flex-col md:flex-row gap-8 p-8">
            {/* Artist Image */}
            <div className="flex-shrink-0">
              <div className="relative h-64 w-64 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 mx-auto md:mx-0">
                {imageUrl !== '/placeholder-album.svg' ? (
                  <img
                    src={imageUrl}
                    alt={artist.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-500 to-teal-600">
                    <Music className="h-24 w-24 text-white/80" />
                  </div>
                )}
              </div>
            </div>

            {/* Artist Info */}
            <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {artist.name}
              </h1>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                {artist.followers && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{(artist.followers.total / 1000000).toFixed(1)}M followers</span>
                  </div>
                )}
                {artist.popularity && (
                  <div className="flex items-center gap-2">
                    <span>♥ {artist.popularity}% popularity</span>
                  </div>
                )}
              </div>

              {artist.genres && artist.genres.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {artist.genres.slice(0, 5).map((genre, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <a
                href={artist.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors w-fit"
              >
                <ExternalLink className="h-4 w-4" />
                Open in Spotify
              </a>
            </div>
          </div>
        </div>

        {/* Top Tracks */}
        {topTracks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Music className="h-6 w-6" />
              Popular Tracks
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {topTracks.slice(0, 10).map((track, idx) => (
                <SpotifyTrackCard key={`${track.id}-${idx}`} track={track} />
              ))}
            </div>
          </div>
        )}

        {/* Albums */}
        {albums.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Disc className="h-6 w-6" />
              Albums
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {albums.map((album, idx) => (
                <SpotifyAlbumCard key={`${album.id}-${idx}`} album={album} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
