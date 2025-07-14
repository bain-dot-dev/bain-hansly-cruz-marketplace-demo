"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  RefreshCw,
  Database,
  CreditCard,
  BarChart3,
} from "lucide-react";

interface TransactionSummary {
  period: string;
  transaction_count: number;
  total_volume: number;
  platform_fees: number;
  successful_rate: number;
  average_transaction: number;
  total_transactions: number;
  successful_transactions: number;
  pending_transactions: number;
}

interface SellerPerformance {
  stripe_account_id: string;
  total_listings: number;
  sold_listings: number;
  total_sales: number;
  stripe_volume: number;
  platform_fees_paid: number;
  conversion_rate: number;
}

interface CategoryPerformance {
  category: string;
  total_listings: number;
  sold_count: number;
  avg_price: number;
  total_revenue: number;
  category_conversion_rate: number;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [sellers, setSellers] = useState<SellerPerformance[]>([]);
  const [categories, setCategories] = useState<CategoryPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Load summary
      const summaryResponse = await fetch("/api/analytics?action=summary");
      const summaryData = await summaryResponse.json();
      if (summaryData.success) {
        setSummary(summaryData.summary);
      }

      // Load sellers
      const sellersResponse = await fetch("/api/analytics?action=sellers");
      const sellersData = await sellersResponse.json();
      if (sellersData.success) {
        setSellers(sellersData.sellers);
      }

      // Load categories
      const categoriesResponse = await fetch(
        "/api/analytics?action=categories"
      );
      const categoriesData = await categoriesResponse.json();
      if (categoriesData.success) {
        setCategories(categoriesData.categories);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/analytics?action=sync");
      const data = await response.json();

      if (data.success) {
        toast.success("Stripe data synchronized successfully");
        loadAnalytics(); // Reload data after sync
      } else {
        toast.error("Failed to sync Stripe data");
      }
    } catch (error) {
      console.error("Error syncing data:", error);
      toast.error("Failed to sync Stripe data");
    } finally {
      setIsSyncing(false);
    }
  };

  const createTestTransaction = async () => {
    try {
      const response = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_test_transaction",
          data: {
            amount: Math.floor(Math.random() * 50000) + 1000, // $10-$500
            description: "Test marketplace transaction",
            status: Math.random() > 0.1 ? "succeeded" : "pending",
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Test transaction created");
        loadAnalytics();
      } else {
        toast.error("Failed to create test transaction");
      }
    } catch (error) {
      console.error("Error creating test transaction:", error);
      toast.error("Failed to create test transaction");
    }
  };

  if (isLoading && !summary) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Marketplace Analytics</h1>
          <p className="text-gray-600 mt-2">
            Transaction data powered by Stripe Connect and Stripe Wrapper
            integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Sync Stripe Data
          </Button>
          <Button variant="outline" onClick={createTestTransaction}>
            <CreditCard className="w-4 h-4 mr-2" />
            Create Test Transaction
          </Button>
          <Button onClick={loadAnalytics} disabled={isLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Volume
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.total_volume.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">{summary.period}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transactions
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.transaction_count}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.successful_rate.toFixed(1)}% success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Platform Fees
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.platform_fees.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Revenue generated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Transaction
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.average_transaction}
              </div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seller Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Sellers
            </CardTitle>
            <CardDescription>
              Performance metrics for connected Stripe accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sellers.slice(0, 5).map((seller, index) => (
                <div
                  key={seller.stripe_account_id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {seller.stripe_account_id
                          .replace("acct_", "")
                          .substring(0, 12)}
                        ...
                      </p>
                      <p className="text-xs text-gray-500">
                        {seller.sold_listings}/{seller.total_listings} sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${seller.stripe_volume.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {seller.conversion_rate.toFixed(1)}% conversion
                    </p>
                  </div>
                </div>
              ))}
              {sellers.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No seller data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Category Performance
            </CardTitle>
            <CardDescription>
              Sales performance by product category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">
                      {category.category}
                    </span>
                    <Badge variant="secondary">
                      {category.category_conversion_rate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      {category.sold_count}/{category.total_listings} sold
                    </span>
                    <span>${category.total_revenue.toFixed(2)} revenue</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          category.category_conversion_rate,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No category data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Stripe Wrapper Integration
          </CardTitle>
          <CardDescription>
            Real-time transaction data synchronization with Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold">Stripe Connect</h3>
              <p className="text-sm text-gray-600">
                Secure payment processing for marketplace sellers
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Database className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold">Stripe Wrapper</h3>
              <p className="text-sm text-gray-600">
                Foreign data wrapper for real-time transaction sync
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold">Analytics Views</h3>
              <p className="text-sm text-gray-600">
                Materialized views for fast performance insights
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
