// Quick database test script
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabase() {
  console.log("Testing database connection...");

  // Test basic connection
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);
    console.log("Profiles table accessible:", !error);
    if (error) console.log("Profiles error:", error.message);
  } catch (e) {
    console.log("Profiles table error:", e.message);
  }

  // Test connected_accounts table
  try {
    const { data, error } = await supabase
      .from("connected_accounts")
      .select("count")
      .limit(1);
    console.log("Connected accounts table accessible:", !error);
    if (error) console.log("Connected accounts error:", error.message);
  } catch (e) {
    console.log("Connected accounts table error:", e.message);
  }

  // Test direct_charges table
  try {
    const { data, error } = await supabase
      .from("direct_charges")
      .select("count")
      .limit(1);
    console.log("Direct charges table accessible:", !error);
    if (error) console.log("Direct charges error:", error.message);
  } catch (e) {
    console.log("Direct charges table error:", e.message);
  }

  // Test listings table
  try {
    const { data, error } = await supabase
      .from("listings")
      .select("count")
      .limit(1);
    console.log("Listings table accessible:", !error);
    if (error) console.log("Listings error:", error.message);
  } catch (e) {
    console.log("Listings table error:", e.message);
  }
}

testDatabase()
  .then(() => {
    console.log("Database test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Database test failed:", error);
    process.exit(1);
  });
