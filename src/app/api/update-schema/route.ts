import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    // Add listing_id field to direct_charges table
    console.log("Adding listing_id field to direct_charges table...");

    const { error: alterError } = await supabase.rpc("exec_sql", {
      sql: "ALTER TABLE direct_charges ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id);",
    });

    if (alterError) {
      console.error("Error adding column:", alterError);
      // Try alternative approach if RPC doesn't work
    }

    // Create index
    const { error: indexError } = await supabase.rpc("exec_sql", {
      sql: "CREATE INDEX IF NOT EXISTS idx_direct_charges_listing_id ON direct_charges(listing_id);",
    });

    if (indexError) {
      console.error("Error creating index:", indexError);
    }

    // Update existing records to populate listing_id from metadata
    const { data: updateData, error: updateError } = await supabase
      .from("direct_charges")
      .select("id, metadata")
      .not("metadata->post_id", "is", null);

    if (updateError) {
      console.error("Error fetching records:", updateError);
      return NextResponse.json(
        { error: "Failed to fetch existing records" },
        { status: 500 }
      );
    }

    let updatedCount = 0;

    // Update each record individually
    for (const record of updateData || []) {
      const postId = record.metadata?.post_id;
      if (postId) {
        const { error: updateRecordError } = await supabase
          .from("direct_charges")
          .update({ listing_id: postId })
          .eq("id", record.id);

        if (!updateRecordError) {
          updatedCount++;
        }
      }
    }

    // Check the results
    const { data: resultData, error: resultError } = await supabase
      .from("direct_charges")
      .select("id, listing_id, metadata")
      .not("listing_id", "is", null);

    if (resultError) {
      console.error("Error fetching results:", resultError);
    }

    return NextResponse.json({
      success: true,
      message: "Database schema updated successfully",
      updated_records: updatedCount,
      total_with_listing_id: resultData?.length || 0,
    });
  } catch (error) {
    console.error("Error updating schema:", error);
    return NextResponse.json(
      { error: "Failed to update database schema" },
      { status: 500 }
    );
  }
}
