"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CheckoutButtonProps {
  listingId: string;
  title: string;
  price: number;
  description?: string;
  imageUrl?: string;
  sellerStripeAccountId: string;
  disabled?: boolean;
  className?: string;
}

export function CheckoutButton({
  listingId,
  title,
  price,
  description,
  imageUrl,
  sellerStripeAccountId,
  disabled,
  className,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!sellerStripeAccountId) {
      toast.error("Seller has not set up payments yet");
      return;
    }

    // Show info for test accounts
    if (sellerStripeAccountId.startsWith("acct_test_")) {
      toast.info("Demo mode: This will create a test payment session");
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: sellerStripeAccountId,
          amount: Math.round(price * 100), // Convert to cents
          applicationFee: Math.round(price * 100 * 0.03), // 3% platform fee
          productInfo: {
            name: title,
            description: description || `Purchase ${title}`,
            postId: listingId,
            imageUrl: imageUrl,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: unknown) {
      console.error("Checkout error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || isLoading || !sellerStripeAccountId}
      className={className}
      size="sm"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        "Buy Now"
      )}
    </Button>
  );
}
