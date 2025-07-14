"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowLeft, Package } from "lucide-react";

interface CheckoutSession {
  id: string;
  payment_status: string;
  customer_details?: {
    email?: string;
    name?: string;
  };
  amount_total?: number;
  metadata?: {
    postId?: string;
    product_name?: string;
  };
}

function PurchaseSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const postId = searchParams.get("post_id");

  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/checkout-session/${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to verify payment");
        }

        if (data.session) {
          setSession(data.session);

          // If payment is successful, the API has already updated the listing status
          if (data.session.payment_status === "paid") {
            console.log("Payment successful, item marked as sold");
          }
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
        setError(
          err instanceof Error ? err.message : "Failed to verify payment"
        );
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying your payment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Payment Verification Failed
              </h2>
              <p className="text-gray-600 mb-4">
                {error || "Unable to verify your payment"}
              </p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Marketplace
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaymentSuccessful = session.payment_status === "paid";
  const amount = session.amount_total ? session.amount_total / 100 : 0;
  const productName = session.metadata?.product_name || "Item";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {isPaymentSuccessful ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Package className="w-8 h-8 text-gray-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isPaymentSuccessful ? "Payment Successful!" : "Payment Processing"}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <div className="text-center space-y-4">
            {isPaymentSuccessful ? (
              <>
                <p className="text-gray-600">
                  Thank you for your purchase! You have successfully bought:
                </p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900">{productName}</p>
                  <p className="text-lg font-bold text-green-600">
                    ${amount.toFixed(2)}
                  </p>
                </div>

                {session.customer_details?.email && (
                  <p className="text-sm text-gray-600">
                    A receipt has been sent to {session.customer_details.email}
                  </p>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    🎉 This item has been marked as sold and is no longer
                    available for purchase.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-gray-600">
                Your payment is being processed. Please wait...
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Marketplace
                </Button>
              </Link>

              {postId && (
                <Link href={`/item/${postId}`} className="flex-1">
                  <Button className="w-full">View Item</Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PurchaseSuccessContent />
    </Suspense>
  );
}
