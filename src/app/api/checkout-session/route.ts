import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { accountId, amount, applicationFee, productInfo } =
      await request.json();

    if (!accountId) {
      return NextResponse.json(
        { error: "Missing connected account ID" },
        { status: 400 }
      );
    }

    if (!amount || amount < 50) {
      return NextResponse.json(
        { error: "Amount must be at least 50 cents" },
        { status: 400 }
      );
    }

    console.log("Creating checkout session for account:", accountId);

    // Check if this is a test account (starts with acct_test_)
    const isTestAccount = accountId.startsWith("acct_test_");

    try {
      let session;

      if (isTestAccount) {
        // For test accounts, create a regular checkout session (not connected account)
        console.log("Using test mode - creating regular checkout session");
        session = await stripe.checkout.sessions.create({
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: productInfo?.name || "Marketplace Item",
                  description:
                    productInfo?.description || "Purchase from marketplace",
                },
                unit_amount: amount,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${
            request.headers.get("origin") || "http://localhost:3000"
          }/purchase-success?session_id={CHECKOUT_SESSION_ID}&post_id=${
            productInfo?.postId || ""
          }`,
          cancel_url: `${
            request.headers.get("origin") || "http://localhost:3000"
          }/?cancelled=true`,
          metadata: {
            postId: productInfo?.postId || "",
            connectedAccountId: accountId,
            testMode: "true",
            applicationFee: (
              applicationFee || Math.round(amount * 0.03)
            ).toString(),
          },
        });
      } else {
        // For real accounts, create a checkout session on the connected account
        session = await stripe.checkout.sessions.create(
          {
            line_items: [
              {
                price_data: {
                  currency: "usd",
                  product_data: {
                    name: productInfo?.name || "Marketplace Item",
                    description:
                      productInfo?.description || "Purchase from marketplace",
                  },
                  unit_amount: amount,
                },
                quantity: 1,
              },
            ],
            payment_intent_data: {
              application_fee_amount:
                applicationFee || Math.round(amount * 0.03), // 3% platform fee
            },
            mode: "payment",
            success_url: `${
              request.headers.get("origin") || "http://localhost:3000"
            }/purchase-success?session_id={CHECKOUT_SESSION_ID}&post_id=${
              productInfo?.postId || ""
            }`,
            cancel_url: `${
              request.headers.get("origin") || "http://localhost:3000"
            }/?cancelled=true`,
            metadata: {
              postId: productInfo?.postId || "",
              connectedAccountId: accountId,
            },
          },
          {
            stripeAccount: accountId,
          }
        );
      }

      // Create a direct charge record for tracking
      try {
        const { error: chargeError } = await supabase
          .from("direct_charges")
          .insert({
            connected_account_id: accountId,
            amount: amount,
            application_fee_amount: applicationFee || Math.round(amount * 0.03),
            description: productInfo?.description || "Marketplace purchase",
            checkout_session_id: session.id,
            metadata: {
              post_id: productInfo?.postId || "",
              product_name: productInfo?.name || "Marketplace Item",
            },
          });

        if (chargeError) {
          console.error("Failed to create charge record:", chargeError);
          // Continue since the session was created successfully
        }
      } catch (dbError) {
        console.error("Database error creating charge record:", dbError);
        // Continue since the session was created successfully
      }

      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (stripeError: unknown) {
      console.error("Stripe error creating checkout session:", stripeError);

      // If it's a connected account error, provide helpful feedback
      if (
        stripeError instanceof Error &&
        "code" in stripeError &&
        stripeError.code === "account_invalid"
      ) {
        return NextResponse.json(
          { error: "Seller account is not properly set up for payments" },
          { status: 400 }
        );
      }

      throw stripeError;
    }
  } catch (error: Error | unknown) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
