"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface Session {
  id: string;
  amount_total: number;
  payment_status: string;
  payment_intent: string;
  metadata?: {
    postId?: string;
  };
}

export default function PurchaseSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const postId = searchParams.get("post_id");

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;

      try {
        const response = await fetch(`/api/checkout-session/${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch session");
        }

        setSession(data.session);
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/">
              <Button>Return to Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-green-700">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <p className="text-gray-600">
              Your payment has been processed successfully.
            </p>

            {session && (
              <div className="bg-gray-100 p-4 rounded-lg text-left">
                <div className="text-sm space-y-2">
                  <div>
                    <strong>Amount:</strong> $
                    {(session.amount_total / 100).toFixed(2)}
                  </div>
                  <div>
                    <strong>Payment ID:</strong> {session.payment_intent}
                  </div>
                  <div>
                    <strong>Status:</strong> {session.payment_status}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  Continue Shopping
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
