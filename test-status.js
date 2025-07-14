// Test the fixed getStripeConnectStatus function
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testGetStatus() {
  console.log("Testing getStripeConnectStatus query...");

  const userId = "58a431a4-ceb6-435d-831b-3be45b6ef2e0"; // Real user ID from the database

  try {
    // Test the new query logic
    const { data: accountData, error: dbError } = await supabase
      .from("connected_accounts")
      .select("stripe_account_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return;
    }

    if (accountData) {
      console.log(
        "✅ Found most recent account:",
        accountData.stripe_account_id
      );
    } else {
      console.log("❌ No account found");
    }
  } catch (e) {
    console.error("Exception:", e.message);
  }
}

testGetStatus()
  .then(() => {
    console.log("Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
