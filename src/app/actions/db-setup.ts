"use server";

import { supabase } from "@/lib/supabase";

export async function createConnectedAccountsTable() {
  try {
    console.log("Creating connected_accounts table...");

    // First, let's check if the table exists
    const { data: existingTables, error: checkError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "connected_accounts");

    if (checkError) {
      console.error("Error checking existing tables:", checkError);
    }

    console.log("Existing connected_accounts table:", existingTables);

    // If table doesn't exist, we need to create it manually
    // For now, let's try to insert a test record to see what happens
    const { error } = await supabase
      .from("connected_accounts")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Table doesn't exist or has permission issues:", error);
      return {
        error: `Table error: ${error.message}. Please ensure the connected_accounts table exists in your Supabase database.`,
      };
    }

    console.log("connected_accounts table exists and is accessible");
    return { success: true, message: "Table exists and is accessible" };
  } catch (error) {
    console.error("Error in createConnectedAccountsTable:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}
