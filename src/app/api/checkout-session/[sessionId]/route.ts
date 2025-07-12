import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // First, try to get the charge record to find the Stripe account
    const { data: chargeRecord, error: chargeError } = await supabase
      .from("direct_charges")
      .select("*")
      .eq("checkout_session_id", sessionId)
      .single();

    if (chargeError || !chargeRecord) {
      console.error("Charge record not found:", chargeError);

      // If charge record not found, try to retrieve session without connected account
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        return NextResponse.json({ session });
      } catch (stripeError) {
        console.error("Stripe session not found:", stripeError);
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
    }

    // Check if this is a test mode session
    const isTestAccount =
      chargeRecord.connected_account_id.startsWith("acct_test_");

    let session;
    if (isTestAccount) {
      // For test accounts, retrieve session without connected account context
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } else {
      // For real accounts, retrieve the session using the connected account
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        stripeAccount: chargeRecord.connected_account_id,
      });
    }

    // Update the charge record status if the payment succeeded
    if (
      session.payment_status === "paid" &&
      chargeRecord.status === "pending"
    ) {
      try {
        await supabase
          .from("direct_charges")
          .update({
            status: "succeeded",
            payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", chargeRecord.id);

        // Also update the listing status to sold if we have the post ID
        if (session.metadata?.postId) {
          await supabase
            .from("listings")
            .update({
              status: "sold",
              sold_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", session.metadata.postId);
        }
      } catch (updateError) {
        console.error("Failed to update charge record:", updateError);
        // Continue since the session was retrieved successfully
      }
    }

    return NextResponse.json({ session });
  } catch (error: Error | unknown) {
    console.error("Error retrieving checkout session:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
