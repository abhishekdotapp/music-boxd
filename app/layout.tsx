import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MusicBoxd - Discover, Rate & Share Music",
  description: "Your personal music diary. Discover new tracks, rate your favorites, follow artists, and share your music taste with the community. Powered by Spotify.",
  keywords: ["music", "ratings", "reviews", "spotify", "music discovery", "music diary", "track ratings", "album reviews", "artist discovery"],
  authors: [{ name: "MusicBoxd" }],
  creator: "MusicBoxd",
  publisher: "MusicBoxd",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://musicboxd.app'),
  openGraph: {
    title: "MusicBoxd - Discover, Rate & Share Music",
    description: "Your personal music diary. Discover new tracks, rate your favorites, and share your music taste with the community.",
    url: 'https://musicboxd.app',
    siteName: 'MusicBoxd',
    images: [
      {
        url: '/music.png',
        width: 1200,
        height: 630,
        alt: 'MusicBoxd - Your Music Diary',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "MusicBoxd - Discover, Rate & Share Music",
    description: "Your personal music diary. Discover new tracks, rate your favorites, and share your music taste.",
    images: ['/music.png'],
  },
  icons: {
    icon: '/music.png',
    shortcut: '/music.png',
    apple: '/music.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
