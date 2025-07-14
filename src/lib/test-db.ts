import { supabaseClient } from "@/lib/supabase-client";

export async function testDatabaseConnection() {
  try {
    console.log("Testing database connection...");

    // Test basic connection
    const { data, error } = await supabaseClient
      .from("connected_accounts")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.error("Database connection error:", error);
      return { error: error.message };
    }

    console.log(
      "Database connection successful. Connected accounts count:",
      data
    );
    return { success: true, count: data };
  } catch (error) {
    console.error("Database test failed:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}
