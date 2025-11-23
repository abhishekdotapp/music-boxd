"use client";

import { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface FollowModalProps {
  userId: string;
  type: 'followers' | 'following';
  onClose: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

export function FollowModal({ userId, type, onClose }: FollowModalProps) {
  const supabase = createClient();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        if (type === 'followers') {
          // Get users who follow this user
          const { data, error } = await supabase
            .from('user_follows')
            .select('follower_id')
            .eq('following_id', userId);

          if (error) {
            console.error('Error fetching followers:', error);
            return;
          }

          if (data && data.length > 0) {
            const followerIds = data.map(f => f.follower_id);
            const { data: profiles } = await supabase
              .from('user_profiles')
              .select('id, username, avatar_url, bio')
              .in('id', followerIds);
            
            if (profiles) {
              setUsers(profiles);
            }
          }
        } else {
          // Get users this user follows
          const { data, error } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', userId);

          if (error) {
            console.error('Error fetching following:', error);
            return;
          }

          if (data && data.length > 0) {
            const followingIds = data.map(f => f.following_id);
            const { data: profiles } = await supabase
              .from('user_profiles')
              .select('id, username, avatar_url, bio')
              .in('id', followingIds);
            
            if (profiles) {
              setUsers(profiles);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [supabase, userId, type]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-xl border border-white/10 w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                No {type === 'followers' ? 'followers' : 'following'} yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile?user=${user.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {user.username}
                    </p>
                    {user.bio && (
                      <p className="text-sm text-gray-400 truncate">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
