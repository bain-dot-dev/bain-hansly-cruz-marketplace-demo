import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "summary";

    switch (action) {
      case "summary":
        return getTransactionSummary();
      case "analytics":
        return getMarketplaceAnalytics();
      case "sellers":
        return getSellerPerformance();
      case "categories":
        return getCategoryPerformance();
      case "sync":
        return syncStripeData();
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}

async function getTransactionSummary() {
  try {
    // Get transaction summary using our database function
    const { data, error } = await supabase.rpc("get_transaction_summary", {
      days_back: 30,
    });

    if (error) {
      throw error;
    }

    // Get additional metrics
    const { data: totalMetrics, error: metricsError } = await supabase
      .from("direct_charges")
      .select("amount, application_fee_amount, status, created_at")
      .gte(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (metricsError) {
      throw metricsError;
    }

    const summary = data?.[0] || {
      period: "Last 30 days",
      transaction_count: 0,
      total_volume: 0,
      platform_fees: 0,
      successful_rate: 0,
    };

    return NextResponse.json({
      success: true,
      summary: {
        ...summary,
        average_transaction:
          summary.transaction_count > 0
            ? (summary.total_volume / summary.transaction_count).toFixed(2)
            : 0,
        total_transactions: totalMetrics?.length || 0,
        successful_transactions:
          totalMetrics?.filter((t) => t.status === "succeeded").length || 0,
        pending_transactions:
          totalMetrics?.filter((t) => t.status === "pending").length || 0,
      },
    });
  } catch (error) {
    console.error("Error getting transaction summary:", error);
    throw error;
  }
}

async function getMarketplaceAnalytics() {
  try {
    const { data, error } = await supabase
      .from("marketplace_analytics")
      .select("*")
      .order("transaction_date", { ascending: false })
      .limit(30);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      analytics: data || [],
      total_days: data?.length || 0,
    });
  } catch (error) {
    console.error("Error getting marketplace analytics:", error);
    throw error;
  }
}

async function getSellerPerformance() {
  try {
    const { data, error } = await supabase
      .from("seller_performance")
      .select("*")
      .order("total_sales", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      sellers: data || [],
      total_sellers: data?.length || 0,
    });
  } catch (error) {
    console.error("Error getting seller performance:", error);
    throw error;
  }
}

async function getCategoryPerformance() {
  try {
    const { data, error } = await supabase
      .from("category_performance")
      .select("*")
      .order("total_revenue", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      categories: data || [],
      total_categories: data?.length || 0,
    });
  } catch (error) {
    console.error("Error getting category performance:", error);
    throw error;
  }
}

async function syncStripeData() {
  try {
    // Call the sync function we created in the database
    const { error } = await supabase.rpc("sync_stripe_charges");

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Stripe data synchronized successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error syncing Stripe data:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "create_test_transaction":
        return createTestTransaction(data);
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Analytics POST API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

interface TestTransactionData {
  account_id?: string;
  amount?: number;
  fee?: number;
  description?: string;
  status?: "succeeded" | "pending" | "failed";
  metadata?: Record<string, unknown>;
}

async function createTestTransaction(transactionData: TestTransactionData) {
  try {
    const { data, error } = await supabase
      .from("direct_charges")
      .insert({
        connected_account_id: transactionData.account_id || "acct_test_demo",
        amount: transactionData.amount || 10000, // $100.00 in cents
        application_fee_amount: transactionData.fee || 300, // $3.00 in cents
        currency: "usd",
        description: transactionData.description || "Test transaction",
        status: transactionData.status || "succeeded",
        payment_intent_id: `pi_test_${Date.now()}`,
        checkout_session_id: `cs_test_${Date.now()}`,
        metadata: {
          test: true,
          created_via_api: true,
          ...transactionData.metadata,
        },
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Test transaction created successfully",
      transaction: data,
    });
  } catch (error) {
    console.error("Error creating test transaction:", error);
    throw error;
  }
}
