"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckoutButton } from "@/components/stripe/checkout-button";

interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  location: string;
  image_url?: string;
  category: string;
  status?: string;
  seller_stripe_account_id?: string;
  created_at: string;
}

export function ItemGrid({ category }: { category?: string }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const url = category
          ? `/api/listings?category=${encodeURIComponent(category)}`
          : "/api/listings";

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          // Handle both array and object responses
          const listingsData = Array.isArray(data) ? data : data.listings || [];
          setListings(listingsData);
        }
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [category]);

  if (loading) {
    return (
      <div className="w-full overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="overflow-hidden min-w-0">
              <Skeleton className="aspect-square w-full" />
              <CardContent className="p-2 sm:p-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <p className="text-gray-500">No listings found.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {listings.map((listing) => (
          <Card
            key={listing.id}
            className="overflow-hidden hover:shadow-lg transition-shadow min-w-0"
          >
            <Link href={`/item/${listing.id}`} className="min-w-0">
              <div className="aspect-square relative bg-gray-100">
                {listing.image_url ? (
                  <Image
                    src={listing.image_url || "/placeholder.svg"}
                    alt={listing.title}
                    fill
                    className={`object-cover ${
                      listing.status === "sold" ? "opacity-60" : ""
                    }`}
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ${
                      listing.status === "sold" ? "opacity-60" : ""
                    }`}
                  >
                    <div className="text-blue-400 text-2xl sm:text-4xl">📷</div>
                  </div>
                )}

                {/* Sold overlay */}
                {/* {listing.status === "sold" && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-red-600 text-white px-2 py-1 rounded-md text-xs font-semibold">
                      SOLD
                    </div>
                  </div>
                )} */}
              </div>
            </Link>
            <CardContent className="p-2 sm:p-3 min-w-0 flex flex-col justify-between">
              <div>
                <div
                  className={`font-semibold text-sm sm:text-lg mb-1 truncate ${
                    listing.status === "sold"
                      ? "text-gray-500"
                      : "text-gray-900"
                  }`}
                >
                  ${listing.price.toLocaleString()}
                </div>
                <div
                  className={`text-xs sm:text-sm mb-2 line-clamp-2 break-words ${
                    listing.status === "sold"
                      ? "text-gray-400"
                      : "text-gray-600"
                  }`}
                >
                  {listing.title}
                </div>
                <div
                  className={`text-xs truncate ${
                    listing.status === "sold"
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  {listing.location}
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex gap-2 items-center">
                  <Badge variant="secondary" className="text-xs truncate">
                    {listing.category}
                  </Badge>
                  {listing.status === "sold" && (
                    <Badge variant="destructive" className="text-xs">
                      Sold
                    </Badge>
                  )}
                </div>
                {listing.status !== "sold" &&
                  listing.seller_stripe_account_id && (
                    <CheckoutButton
                      listingId={listing.id}
                      title={listing.title}
                      price={listing.price}
                      description={listing.description}
                      imageUrl={listing.image_url}
                      sellerStripeAccountId={listing.seller_stripe_account_id}
                      className="w-full text-xs bg-[#8e3fe7] hover:bg-[#7e18f2] text-white font-semibold py-3"
                    />
                  )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
