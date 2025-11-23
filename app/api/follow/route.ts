import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST - Follow a user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { following_id } = await request.json();

    if (!following_id) {
      return NextResponse.json({ error: "following_id is required" }, { status: 400 });
    }

    if (following_id === user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_follows")
      .insert({
        follower_id: user.id,
        following_id: following_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error following user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in follow route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Unfollow a user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const following_id = searchParams.get("following_id");

    if (!following_id) {
      return NextResponse.json({ error: "following_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", following_id);

    if (error) {
      console.error("Error unfollowing user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in unfollow route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Check follow status and get counts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Get follower count
    const { count: followerCount } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user_id);

    // Get following count
    const { count: followingCount } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", user_id);

    // Check if current user follows this user
    let isFollowing = false;
    if (user) {
      const { data } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", user_id)
        .single();
      
      isFollowing = !!data;
    }

    return NextResponse.json({
      followerCount: followerCount || 0,
      followingCount: followingCount || 0,
      isFollowing,
    });
  } catch (error: any) {
    console.error("Error in get follow status route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
