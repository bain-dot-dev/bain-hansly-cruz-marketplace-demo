"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  image_url?: string;
  category: string;
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
          setListings(data);
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
          <Link key={listing.id} href={`/item/${listing.id}`} className="min-w-0">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer min-w-0">
              <div className="aspect-square relative bg-gray-100">
                {listing.image_url ? (
                  <Image
                    src={listing.image_url || "/placeholder.svg"}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <div className="text-blue-400 text-2xl sm:text-4xl">📷</div>
                  </div>
                )}
              </div>
              <CardContent className="p-2 sm:p-3 min-w-0">
                <div className="font-semibold text-sm sm:text-lg text-gray-900 mb-1 truncate">
                  ${listing.price.toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2 break-words">
                  {listing.title}
                </div>
                <div className="text-xs text-gray-500 truncate">{listing.location}</div>
                <Badge variant="secondary" className="mt-1 sm:mt-2 text-xs truncate">
                  {listing.category}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
