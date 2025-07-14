import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { transactionId, listingId } = await request.json();

    if (!transactionId || !listingId) {
      return NextResponse.json(
        { error: "Transaction ID and Listing ID are required" },
        { status: 400 }
      );
    }

    // Update the transaction with the listing_id
    const { data, error } = await supabase
      .from("direct_charges")
      .update({ listing_id: listingId })
      .eq("id", transactionId)
      .select()
      .single();

    if (error) {
      console.error("Error updating transaction:", error);
      return NextResponse.json(
        { error: "Failed to update transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Transaction updated with listing_id",
      transaction: data,
    });
  } catch (error) {
    console.error("Error in link-transaction API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
