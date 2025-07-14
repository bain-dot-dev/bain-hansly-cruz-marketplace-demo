import { supabase } from "@/lib/supabase";

export async function setupDatabase() {
  try {
    console.log("Setting up database tables...");

    // Create connected_accounts table
    const { error: createTableError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS connected_accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID,
          stripe_account_id TEXT UNIQUE NOT NULL,
          account_type TEXT DEFAULT 'express',
          charges_enabled BOOLEAN DEFAULT false,
          payouts_enabled BOOLEAN DEFAULT false,
          details_submitted BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    });

    if (createTableError) {
      console.error("Error creating table:", createTableError);
      return { error: createTableError.message };
    }

    console.log("Database setup completed successfully");
    return { success: true };
  } catch (error) {
    console.error("Database setup failed:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}
