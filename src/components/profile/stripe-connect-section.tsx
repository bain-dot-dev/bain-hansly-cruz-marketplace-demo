"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  createStripeConnectAccount,
  getStripeConnectStatus,
  disconnectStripeAccount,
  refreshConnectAccountLink,
  syncStripeTransactions,
} from "@/app/actions/stripe";
import {
  Loader2,
  CreditCard,
  DollarSign,
  RefreshCw,
  Unlink,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface StripeStatus {
  connected: boolean;
  status: "pending" | "active" | "restricted" | "not_connected";
  accountId: string | null;
  capabilities: {
    transfers: string;
    card_payments: string;
  };
  requirements?: {
    currently_due?: string[];
    eventually_due?: string[];
    past_due?: string[];
  };
  business_profile?: {
    name?: string;
    url?: string;
    support_email?: string;
  };
  error?: string;
}

export function StripeConnectSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus>({
    connected: false,
    status: "not_connected",
    accountId: null,
    capabilities: {
      transfers: "inactive",
      card_payments: "inactive",
    },
  });

  useEffect(() => {
    // Check if user returned from Stripe Connect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("connected") === "true") {
      toast.success("Stripe account connected successfully!");
      // Remove the parameter from URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (urlParams.get("refresh") === "true") {
      toast.info("Please complete your Stripe account setup");
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Load existing status
    loadStripeStatus();
  }, []);

  const loadStripeStatus = async () => {
    setIsLoading(true);
    try {
      // In a real app, you'd get the accountId from user session/database
      const mockAccountId =
        localStorage.getItem("stripe_account_id") || undefined;
      const result = await getStripeConnectStatus(mockAccountId);

      if (result.error) {
        toast.error(result.error);
      } else {
        setStripeStatus(result as StripeStatus);
        if (result.accountId) {
          localStorage.setItem("stripe_account_id", result.accountId);
        }
      }
    } catch (error) {
      console.error("Error loading Stripe status:", error);
      toast.error("Failed to load payment status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setIsLoading(true);
    try {
      const result = await createStripeConnectAccount();

      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        // Store account ID for later reference
        if (result.accountId) {
          localStorage.setItem("stripe_account_id", result.accountId);
        }
        // Redirect to Stripe Connect onboarding
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Error creating Stripe Connect account:", error);
      toast.error("Failed to create payment account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!stripeStatus.accountId) return;

    setIsLoading(true);
    try {
      const result = await disconnectStripeAccount(stripeStatus.accountId);

      if (result.error) {
        toast.error(result.error);
      } else {
        localStorage.removeItem("stripe_account_id");
        setStripeStatus({
          connected: false,
          status: "not_connected",
          accountId: null,
          capabilities: {
            transfers: "inactive",
            card_payments: "inactive",
          },
        });
        toast.success("Payment account disconnected");
      }
    } catch (error) {
      console.error("Error disconnecting Stripe account:", error);
      toast.error("Failed to disconnect payment account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshLink = async () => {
    if (!stripeStatus.accountId) return;

    setIsLoading(true);
    try {
      const result = await refreshConnectAccountLink(stripeStatus.accountId);

      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Error refreshing account link:", error);
      toast.error("Failed to refresh account link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncTransactions = async () => {
    setIsSyncing(true);
    try {
      const result = await syncStripeTransactions();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Transactions synced successfully");
      }
    } catch (error) {
      console.error("Error syncing transactions:", error);
      toast.error("Failed to sync transactions");
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = () => {
    switch (stripeStatus.status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending Setup
          </Badge>
        );
      case "restricted":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Restricted
          </Badge>
        );
      default:
        return <Badge variant="secondary">Not Connected</Badge>;
    }
  };

  const getCapabilityBadge = (capability: string) => {
    switch (capability) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500 text-xs">
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="text-xs">
            Pending
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="text-xs">
            Inactive
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Unknown
          </Badge>
        );
    }
  };

  if (isLoading && !stripeStatus.accountId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Stripe Connect
          </CardTitle>
          <CardDescription>Loading payment status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Stripe Connect
        </CardTitle>
        <CardDescription>
          {stripeStatus.connected
            ? "Manage your payment account and sync transaction data"
            : "Connect your Stripe account to start receiving payments"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Account Status:</span>
          {getStatusBadge()}
        </div>

        {!stripeStatus.connected ? (
          <>
            <Alert>
              <AlertDescription>
                Connect your Stripe account to receive payments on the platform.
                You&apos;ll be redirected to Stripe to complete the setup
                process with full Stripe Connect integration.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleConnectStripe}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Connect with Stripe
                  <ExternalLink className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                Your Stripe account is connected and ready to receive payments.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-700">Account ID</label>
                <p className="font-mono text-xs break-all text-gray-600">
                  {stripeStatus.accountId}
                </p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Business</label>
                <p className="text-gray-600">
                  {stripeStatus.business_profile?.name || "Not set"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Capabilities
              </label>
              <div className="flex gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">Card Payments:</span>
                  {getCapabilityBadge(stripeStatus.capabilities.card_payments)}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">Transfers:</span>
                  {getCapabilityBadge(stripeStatus.capabilities.transfers)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadStripeStatus}
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Status
                </Button>

                {stripeStatus.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshLink}
                    disabled={isLoading}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Complete Setup
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncTransactions}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <DollarSign className="w-4 h-4 mr-2" />
                  )}
                  Sync Transactions
                </Button>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                disabled={isLoading}
                className="w-full"
              >
                <Unlink className="w-4 h-4 mr-2" />
                Disconnect Account
              </Button>
            </div>

            {stripeStatus.requirements &&
              stripeStatus.requirements.currently_due &&
              stripeStatus.requirements.currently_due.length > 0 && (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Action Required:</strong> Your account requires
                    additional information. Please complete your setup to start
                    receiving payments.
                  </AlertDescription>
                </Alert>
              )}
          </>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Stripe handles all payment processing securely</p>
          <p>• Standard processing fees apply (2.9% + 30¢)</p>
          <p>• Transaction data syncs automatically with Stripe Wrapper</p>
          <p>• Payouts are processed according to your Stripe settings</p>
        </div>
      </CardContent>
    </Card>
  );
}
