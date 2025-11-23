"use client";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Music, Users, Star, Share2, Search, Heart } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#14181c]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const features = [
    {
      icon: Star,
      title: "Rate & Review",
      description: "Rate your favorite tracks, albums, and artists. Write detailed reviews and share your thoughts."
    },
    {
      icon: Music,
      title: "Discover Music",
      description: "Explore new music with personalized recommendations powered by Spotify's vast catalog."
    },
    {
      icon: Users,
      title: "Follow & Connect",
      description: "Follow other music lovers, see what they're listening to, and build your music community."
    },
    {
      icon: Share2,
      title: "Share Stories",
      description: "Create beautiful story cards for Instagram, Facebook, and Snapchat to share your reviews."
    },
    {
      icon: Search,
      title: "Search & Track",
      description: "Search millions of tracks and artists. Keep track of your music journey in one place."
    },
    {
      icon: Heart,
      title: "Save Favorites",
      description: "Build your collection of favorite tracks, albums, and artists for easy access."
    }
  ];

  return (
    <div className="min-h-screen bg-[#14181c]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-24 sm:pb-32">
          {/* Header */}
          <div className="flex justify-between items-center mb-16 sm:mb-20">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              MusicBoxd
            </h2>
            {user && (
              <Link 
                href="/dashboard" 
                className="btn-primary text-sm sm:text-base"
              >
                Go to Dashboard
              </Link>
            )}
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-24">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight">
              Your Music Diary,
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Beautifully Organized
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
              Track, rate, and review your favorite music. Discover new artists and connect with fellow music lovers.
            </p>
            
            {/* CTA Buttons */}
            {user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
                <Link 
                  href="/dashboard" 
                  className="btn-primary w-full sm:w-auto text-base sm:text-lg px-8 py-3"
                >
                  Explore Music
                </Link>
                <Link 
                  href="/profile" 
                  className="btn-secondary w-full sm:w-auto text-base sm:text-lg px-8 py-3"
                >
                  My Profile
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
                <Link 
                  href="/sign-up" 
                  className="btn-primary w-full sm:w-auto text-base sm:text-lg px-8 py-3"
                >
                  Get Started Free
                </Link>
                <Link 
                  href="/sign-in" 
                  className="btn-secondary w-full sm:w-auto text-base sm:text-lg px-8 py-3"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto px-4">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-2">Millions</div>
              <div className="text-sm sm:text-base text-gray-400">Tracks to Discover</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-2">Rate</div>
              <div className="text-sm sm:text-base text-gray-400">Any Music You Love</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-2">Share</div>
              <div className="text-sm sm:text-base text-gray-400">Beautiful Story Cards</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto px-4">
            All the tools to track, discover, and share your music journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass rounded-xl border border-white/10 p-6 sm:p-8 hover:border-emerald-500/50 transition-all group"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      {!user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="glass rounded-2xl border border-white/10 p-8 sm:p-12 md:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Ready to Start Your
              <br />
              Music Journey?
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto">
              Join MusicBoxd today and start tracking your favorite music.
            </p>
            <Link 
              href="/sign-up" 
              className="btn-primary text-base sm:text-lg px-8 sm:px-12 py-3 sm:py-4 inline-block"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm sm:text-base text-gray-400">
          <p>© 2025 MusicBoxd. Your Music Diary.</p>
        </div>
      </footer>
    </div>
  );
}
