import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    console.log("Setting up database tables...");

    // Check if connected_accounts table exists first
    const { data: tables, error: listError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "connected_accounts");

    if (listError) {
      console.error("Error checking tables:", listError);
    }

    console.log("Existing connected_accounts table:", tables);

    if (!tables || tables.length === 0) {
      return NextResponse.json(
        {
          error:
            "The connected_accounts table does not exist. Please run the setup-stripe-connect.sql script in your Supabase SQL Editor.",
          instructions: [
            "1. Go to your Supabase dashboard",
            "2. Navigate to SQL Editor",
            "3. Run the contents of setup-stripe-connect.sql",
            "4. This will create the necessary tables for Stripe Connect",
          ],
        },
        { status: 400 }
      );
    }

    // Test if we can access the table
    const { data: testData, error: testError } = await supabase
      .from("connected_accounts")
      .select("count", { count: "exact", head: true });

    if (testError) {
      console.error("Error accessing connected_accounts:", testError);
      return NextResponse.json(
        {
          error: `Database access error: ${testError.message}`,
          details:
            "The connected_accounts table exists but cannot be accessed. Check your RLS policies.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Database is properly configured",
      tableCount: testData,
    });
  } catch (error) {
    console.error("Database setup error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
