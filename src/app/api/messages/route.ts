import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listing_id, buyer_email, seller_email, message } = body;

    // Validation
    if (!listing_id || !buyer_email || !seller_email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          listing_id,
          buyer_email,
          seller_email,
          message,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("user_email");
  if (!userEmail) {
    return NextResponse.json([], { status: 200 });
  }

  // Fetch messages where the user is either the buyer or seller
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`buyer_email.eq.${userEmail},seller_email.eq.${userEmail}`)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || [], { status: 200 });
}
