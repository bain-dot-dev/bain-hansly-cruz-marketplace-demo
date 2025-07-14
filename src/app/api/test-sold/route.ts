import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // Update the listing status to sold
    const { error } = await supabase
      .from("listings")
      .update({
        status: "sold",
        sold_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId);

    if (error) {
      console.error("Error updating listing:", error);
      return NextResponse.json(
        { error: "Failed to mark item as sold" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Item marked as sold",
    });
  } catch (error) {
    console.error("Error in test-sold API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
