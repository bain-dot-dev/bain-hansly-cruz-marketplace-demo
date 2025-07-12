import { supabase } from "@/lib/supabase";

async function updateListingsWithStripeAccounts() {
  console.log("Updating listings with test Stripe account IDs...");

  try {
    // First, add the missing columns if they don't exist
    const { error: alterError } = await supabase.rpc("exec_sql", {
      sql: `
        ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_stripe_account_id TEXT;
        ALTER TABLE listings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
      `,
    });

    if (alterError) {
      console.error("Error adding columns:", alterError);
      // Continue anyway, columns might already exist
    }

    // Update existing listings with test Stripe account IDs
    const { data: listings, error: fetchError } = await supabase
      .from("listings")
      .select("id, seller_stripe_account_id")
      .is("seller_stripe_account_id", null);

    if (fetchError) {
      console.error("Error fetching listings:", fetchError);
      return;
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

    console.log("✅ Database update completed!");
  } catch (error) {
    console.error("❌ Error updating database:", error);
  }
}

// Run the function
updateListingsWithStripeAccounts().catch(console.error);
