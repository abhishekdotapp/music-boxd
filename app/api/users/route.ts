import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const { data: users, error } = await supabase
      .from("user_profiles")
      .select("id, username, avatar_url, bio")
      .ilike("username", `%${query}%`)
      .limit(10);

    if (error) {
      console.error("Error searching users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error: any) {
    console.error("Error in user search route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
