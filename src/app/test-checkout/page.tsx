"use client";

import { CheckoutButton } from "@/components/stripe/checkout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestCheckout() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Test Stripe Connect Checkout</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sample Item 1</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              iPhone 14 Pro in excellent condition
            </p>
            <p className="text-2xl font-bold mb-4">$899.00</p>
            <CheckoutButton
              listingId="test-1"
              title="iPhone 14 Pro"
              price={899}
              description="iPhone 14 Pro in excellent condition"
              sellerStripeAccountId="acct_test_sample1"
              className="w-full"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Item 2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              MacBook Pro for work and creativity
            </p>
            <p className="text-2xl font-bold mb-4">$1,299.00</p>
            <CheckoutButton
              listingId="test-2"
              title="MacBook Pro"
              price={1299}
              description="MacBook Pro for work and creativity"
              sellerStripeAccountId="acct_test_sample2"
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Instructions:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Use test card: 4242 4242 4242 4242</li>
          <li>Any future expiry date (e.g., 12/34)</li>
          <li>Any 3-digit CVC</li>
          <li>
            Note: These are test Stripe accounts - real payments will fail
          </li>
        </ul>
      </div>
    </div>
  );
}
