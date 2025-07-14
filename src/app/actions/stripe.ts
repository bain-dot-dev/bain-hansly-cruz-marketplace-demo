"use server";

import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

export async function createStripeConnectAccount(userId?: string) {
  try {
    console.log("Creating Stripe Connect account...");

    if (!userId) {
      return { error: "You must be logged in to connect a Stripe account" };
    }

    // Create a Stripe Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US", // You can make this dynamic based on user location
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      // Pre-fill with test data for easier testing
      business_type: "individual",
      individual: {
        first_name: "Test",
        last_name: "User",
        email: "testuser@example.com",
      },
    });

    console.log("Created Stripe account:", account.id);

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/profile?refresh=true`,
      return_url: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/profile?connected=true`,
      type: "account_onboarding",
    });

    // Store the account ID in the database with user association
    const { error: dbError } = await supabase
      .from("connected_accounts")
      .insert({
        user_id: userId,
        stripe_account_id: account.id,
        account_type: "express",
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      // Continue since the Stripe account was created successfully
    }

    return {
      success: true,
      url: accountLink.url,
      accountId: account.id,
    };
  } catch (error) {
    console.error("Stripe Connect error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create Stripe Connect account",
    };
  }
}

export async function getStripeConnectStatus(
  accountId?: string,
  userId?: string
) {
  try {
    console.log("Fetching Stripe Connect status...");

    if (!userId) {
      return {
        connected: false,
        status: "not_connected",
        accountId: null,
        capabilities: {
          transfers: "inactive",
          card_payments: "inactive",
        },
      };
    }

    // If no accountId provided, try to get the most recent one from database
    if (!accountId) {
      const { data: accountData, error: dbError } = await supabase
        .from("connected_accounts")
        .select("stripe_account_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (dbError || !accountData) {
        console.log("No connected account found for user:", userId, dbError);
        return {
          connected: false,
          status: "not_connected",
          accountId: null,
          capabilities: {
            transfers: "inactive",
            card_payments: "inactive",
          },
        };
      }

      accountId = accountData.stripe_account_id;
      console.log("Found account for user:", userId, "->", accountId);
    }

    // Get account details from Stripe
    if (!accountId) {
      return {
        connected: false,
        status: "not_connected",
        accountId: null,
        capabilities: {
          transfers: "inactive",
          card_payments: "inactive",
        },
      };
    }

    const account = await stripe.accounts.retrieve(accountId);

    // Update database with current status
    const { error: dbError } = await supabase
      .from("connected_accounts")
      .upsert({
        user_id: userId,
        stripe_account_id: accountId,
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
        details_submitted: account.details_submitted || false,
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error("Database update error:", dbError);
    }

    return {
      connected: account.details_submitted && account.charges_enabled,
      status: account.details_submitted
        ? account.charges_enabled
          ? "active"
          : "restricted"
        : "pending",
      accountId: account.id,
      capabilities: {
        transfers:
          typeof account.capabilities?.transfers === "string"
            ? account.capabilities.transfers
            : account.capabilities?.transfers
            ? "active"
            : "inactive",
        card_payments:
          typeof account.capabilities?.card_payments === "string"
            ? account.capabilities.card_payments
            : account.capabilities?.card_payments
            ? "active"
            : "inactive",
      },
      requirements: account.requirements,
      business_profile: account.business_profile,
    };
  } catch (error) {
    console.error("Error fetching Stripe status:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch account status",
    };
  }
}

export async function disconnectStripeAccount(accountId: string) {
  try {
    console.log("Disconnecting Stripe account...");

    // Remove account from our database
    const { error: dbError } = await supabase
      .from("connected_accounts")
      .delete()
      .eq("stripe_account_id", accountId);

    if (dbError) {
      console.error("Database error:", dbError);
      return { error: "Failed to disconnect account from database" };
    }

    // Note: We don't delete the Stripe account itself as it may have
    // historical transaction data. We just remove it from our system.

    return { success: true };
  } catch (error) {
    console.error("Error disconnecting Stripe:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to disconnect account",
    };
  }
}

export async function refreshConnectAccountLink(accountId: string) {
  try {
    console.log("Refreshing Stripe Connect account link...");

    // Create a new account link for re-onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/profile?refresh=true`,
      return_url: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/profile?connected=true`,
      type: "account_onboarding",
    });

    return {
      success: true,
      url: accountLink.url,
    };
  } catch (error) {
    console.error("Error refreshing account link:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to refresh account link",
    };
  }
}

export async function syncStripeTransactions() {
  try {
    console.log("Syncing Stripe transactions...");

    // This would typically call the sync function we created in the database
    const { error } = await supabase.rpc("sync_stripe_charges");

    if (error) {
      console.error("Sync error:", error);
      return { error: "Failed to sync transactions" };
    }

    return { success: true, message: "Transactions synced successfully" };
  } catch (error) {
    console.error("Error syncing transactions:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to sync transactions",
    };
  }
}
