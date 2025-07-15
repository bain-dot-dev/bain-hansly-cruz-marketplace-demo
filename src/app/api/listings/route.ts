import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sellerEmail = searchParams.get("seller_email");

    let query = supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (sellerEmail) {
      query = query.eq("seller_email", sellerEmail);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch listings" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test Supabase connection
    console.log("Environment check:", {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓" : "✗",
      key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓" : "✗",
    });

    const body = await request.json();
    console.log("Received data:", body); // Debug log
    const { title, description, price, category, email, image_url } = body;

    // Validation
    if (!title || !price || !category || !email) {
      console.log("Validation failed:", { title, price, category, email }); // Debug log
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate a test Stripe account ID for the seller
    const testStripeAccountId = `acct_test_${Math.random()
      .toString(36)
      .substr(2, 10)}`;

    const { data, error } = await supabase
      .from("listings")
      .insert([
        {
          title,
          description,
          price,
          category,
          seller_email: email, // Map email to seller_email
          seller_stripe_account_id: testStripeAccountId, // Add test Stripe account
          image_url,
          location: "Palo Alto, CA", // Default location
          status: "available", // Set initial status
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          error: "Failed to create listing",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log("Created listing with Stripe account:", testStripeAccountId);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
