// Test script to check connected_accounts table contents
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConnectedAccounts() {
  console.log("Checking connected_accounts table...");

  try {
    // Get all connected accounts
    const { data, error } = await supabase
      .from("connected_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error querying connected_accounts:", error);
      return;
    }

    console.log("Found connected accounts:", data?.length || 0);
    if (data && data.length > 0) {
      console.log("Recent accounts:");
      data.forEach((account, index) => {
        console.log(
          `${index + 1}. User ID: ${account.user_id}, Stripe Account: ${
            account.stripe_account_id
          }, Status: ${
            account.charges_enabled ? "enabled" : "disabled"
          }, Created: ${account.created_at}`
        );
      });
    } else {
      console.log("No connected accounts found in database");
    }

    // Test the specific query that getStripeConnectStatus would use
    console.log("\nTesting specific user query...");
    const testUserId = "test-user-id"; // Replace with actual user ID if you have one
    const { data: specificData, error: specificError } = await supabase
      .from("connected_accounts")
      .select("stripe_account_id")
      .eq("user_id", testUserId)
      .single();

    if (specificError && specificError.code !== "PGRST116") {
      // PGRST116 is "not found"
      console.error("Error in specific query:", specificError);
    } else if (specificData) {
      console.log(
        "Found account for test user:",
        specificData.stripe_account_id
      );
    } else {
      console.log("No account found for test user ID");
    }
  } catch (e) {
    console.error("Exception:", e.message);
  }
}

checkConnectedAccounts()
  .then(() => {
    console.log("Connected accounts check completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Check failed:", error);
    process.exit(1);
  });
