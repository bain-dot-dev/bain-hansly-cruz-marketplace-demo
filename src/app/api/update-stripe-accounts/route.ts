import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    console.log("Updating listings with test Stripe account IDs...");

    // First, fetch all listings without Stripe account IDs
    const { data: listings, error: fetchError } = await supabase
      .from("listings")
      .select("id, seller_stripe_account_id")
      .is("seller_stripe_account_id", null);

    if (fetchError) {
      console.error("Error fetching listings:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch listings" },
        { status: 500 }
      );
    }

    console.log(
      `Found ${listings?.length || 0} listings without Stripe account IDs`
    );

    if (listings && listings.length > 0) {
      // Update each listing with a test account ID
      for (const listing of listings) {
        const testAccountId = `acct_test_${Math.random()
          .toString(36)
          .substr(2, 10)}`;

        const { error: updateError } = await supabase
          .from("listings")
          .update({
            seller_stripe_account_id: testAccountId,
            status: "available",
          })
          .eq("id", listing.id);

        if (updateError) {
          console.error(`Error updating listing ${listing.id}:`, updateError);
        } else {
          console.log(
            `Updated listing ${listing.id} with account ${testAccountId}`
          );
        }
      }
    }

    return NextResponse.json({
      message: "Database update completed!",
      updated: listings?.length || 0,
    });
  } catch (error) {
    console.error("Error updating database:", error);
    return NextResponse.json(
      { error: "Failed to update database" },
      { status: 500 }
    );
  }
}
