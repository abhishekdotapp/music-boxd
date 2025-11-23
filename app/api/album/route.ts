import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET || '';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const albumId = searchParams.get('albumId');

  if (!albumId) {
    return NextResponse.json({ error: 'Album ID required' }, { status: 400 });
  }

  try {
    // Get access token
    if (!cachedToken || Date.now() >= tokenExpiry) {
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }

      const tokenData = await tokenResponse.json();
      cachedToken = tokenData.access_token;
      tokenExpiry = Date.now() + (tokenData.expires_in - 300) * 1000;
    }

    // Get album details
    const albumResponse = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: {
        'Authorization': `Bearer ${cachedToken}`,
      },
    });

    if (!albumResponse.ok) {
      throw new Error('Failed to fetch album');
    }

    const albumData = await albumResponse.json();
    return NextResponse.json(albumData);
  } catch (error) {
    console.error('Error fetching album:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album details' },
      { status: 500 }
    );
  }
}
