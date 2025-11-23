import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET || '';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function GET(request: NextRequest) {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return NextResponse.json({ access_token: cachedToken });
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    cachedToken = data.access_token;
    // Set expiry 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    return NextResponse.json({ access_token: cachedToken });
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Spotify' },
      { status: 500 }
    );
  }
}
