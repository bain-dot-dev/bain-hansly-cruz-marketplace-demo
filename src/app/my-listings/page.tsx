"use client";

import { useEffect, useState, useRef } from "react";

import dynamic from "next/dynamic";
const EditItemModal = dynamic(() => import("./edit-item-modal"), {
  ssr: false,
});
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Eye, Edit, Trash2, Plus, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: "available" | "sold" | "pending";
  image_url?: string;
  location: string;
  created_at: string;
  updated_at: string;
  sold_at?: string;
  seller_stripe_account_id?: string;
}

// Modal state for image viewer
type ModalState = {
  open: boolean;
  imageUrl?: string;
  title?: string;
};

export default function MyListingsPage() {
  const { user, loading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editModal, setEditModal] = useState<{
    open: boolean;
    listing: Listing | null;
  }>({ open: false, listing: null });

  // Only fetch listings when the user's email string actually changes
  const lastFetchedEmail = useRef<string | undefined>(undefined);
  useEffect(() => {
    const fetchMyListings = async (email: string) => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/listings?seller_email=${encodeURIComponent(email)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch listings");
        }
        const data = await response.json();
        setListings(data || []);
      } catch (err) {
        console.error("Error fetching listings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load listings"
        );
      } finally {
        setIsLoading(false);
      }
    };
    if (!loading && user?.email) {
      if (lastFetchedEmail.current !== user.email) {
        lastFetchedEmail.current = user.email;
        fetchMyListings(user.email);
      }
    } else if (!loading && !user) {
      setIsLoading(false);
      setError("Please sign in to view your listings");
    }
  }, [user, user?.email, loading]);

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete listing");
      }

      toast.success("Listing deleted successfully");
      // Remove from local state
      setListings((prev) => prev.filter((listing) => listing.id !== listingId));
    } catch (err) {
      console.error("Error deleting listing:", err);
      toast.error("Failed to delete listing");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500 text-white";
      case "sold":
        return "bg-red-500 text-white";
      case "pending":
        return "bg-yellow-500 text-white";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "available":
        return "default";
      case "sold":
        return "secondary";
      case "pending":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Image Modal */}
      {modal.open && modal.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setModal({ open: false })}
        >
          <div
            className="relative bg-white rounded-lg shadow-lg overflow-hidden p-0"
            style={{ maxWidth: "95vw", maxHeight: "99vh", padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 z-10 bg-white/80 rounded-full p-1 hover:bg-white"
              onClick={() => setModal({ open: false })}
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
            <Image
              src={modal.imageUrl}
              alt={modal.title || "Listing image"}
              width={1600}
              height={1600}
              className="object-contain max-h-[90vh] max-w-[90vw] w-auto h-auto bg-white"
              priority
            />
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">My Listings</h1>
            <p className="text-gray-600">Manage your marketplace items</p>
          </div>
        </div>
        <Link href="/create/item">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Listing
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{listings.length}</div>
            <p className="text-sm text-gray-600">Total Listings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {listings.filter((l) => l.status === "available").length}
            </div>
            <p className="text-sm text-gray-600">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {listings.filter((l) => l.status === "sold").length}
            </div>
            <p className="text-sm text-gray-600">Sold</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {listings.filter((l) => l.status === "pending").length}
            </div>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
            <p className="text-gray-600 mb-6">
              Start selling by creating your first listing
            </p>
            <Link href="/create/item">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Listing
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {listing.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs truncate">
                        {listing.category}
                      </Badge>
                      <Badge
                        variant={getStatusVariant(listing.status)}
                        className={getStatusColor(listing.status)}
                      >
                        {listing.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Image */}
                {listing.image_url && (
                  <div
                    className="aspect-video relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer"
                    onClick={() =>
                      setModal({
                        open: true,
                        imageUrl: listing.image_url,
                        title: listing.title,
                      })
                    }
                  >
                    <Image
                      src={listing.image_url}
                      alt={listing.title}
                      fill
                      className="object-cover transition-transform duration-200 hover:scale-105"
                    />
                  </div>
                )}

                {/* Description */}
                {listing.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {listing.description}
                  </p>
                )}

                {/* Price and Location */}
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPrice(listing.price)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {listing.location}
                  </div>
                </div>

                {/* Dates */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Created: {formatDate(listing.created_at)}</div>
                  {listing.sold_at && (
                    <div>Sold: {formatDate(listing.sold_at)}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/item/${listing.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>

                  {listing.status === "available" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditModal({ open: true, listing })}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {/* Edit Item Modal */}
                  {editModal.open && editModal.listing && (
                    <EditItemModal
                      open={editModal.open}
                      listing={editModal.listing}
                      onClose={() =>
                        setEditModal({ open: false, listing: null })
                      }
                      onSave={(updated) => {
                        setListings((prev) =>
                          prev.map((l) => {
                            if (l.id === String(updated.id)) {
                              // Ensure image_url is string or undefined
                              const image_url =
                                updated.image_url ?? l.image_url;
                              return {
                                ...l,
                                ...updated,
                                id: String(updated.id),
                                image_url:
                                  typeof image_url === "string"
                                    ? image_url
                                    : undefined,
                              };
                            }
                            return l;
                          })
                        );
                        setEditModal({ open: false, listing: null });
                      }}
                    />
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteListing(listing.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
