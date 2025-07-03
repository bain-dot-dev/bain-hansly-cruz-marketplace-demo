"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  seller_email: string;
  image_url?: string;
  location: string;
  created_at: string;
}

export default function ItemDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("I want to buy your item!");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setListing(data);
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [params.id]);

  const sendMessage = async () => {
    if (!listing || !message.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listing_id: listing.id,
          seller_email: listing.seller_email,
          buyer_email: "buyer@example.com", // In a real app, this would come from auth
          message: message.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Message sent!",
          description: "Your message has been sent to the seller.",
        });
        setMessage("");
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          (error as Error).message ||
          "An error occurred while sending the message.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/4 mb-4 sm:mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="aspect-square bg-gray-200 rounded-lg"></div>
            <div className="space-y-3 sm:space-y-4">
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
          Listing not found
        </h1>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to marketplace
          </Button>
        </Link>
      </div>
    );
  }

  const timeAgo = new Date(listing.created_at).toLocaleDateString();

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <Link
        href="/"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {listing.image_url ? (
            <Image
              src={listing.image_url || "/placeholder.svg"}
              alt={listing.title}
              width={600}
              height={600}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <div className="text-blue-400 text-6xl sm:text-8xl">📷</div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {listing.title}
            </h1>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              ${listing.price.toLocaleString()}
            </p>
          </div>

          <div className="text-sm text-gray-600">
            <p>Listed on {timeAgo}</p>
            <p>in {listing.location}</p>
          </div>

          {listing.description && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Seller Information
            </h3>
            <p className="text-gray-700">{listing.seller_email}</p>
          </div>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Send seller a message
              </h3>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="I want to buy your item!"
                rows={4}
                className="mb-3"
              />
              <Button
                onClick={sendMessage}
                disabled={sendingMessage || !message.trim()}
                className="w-full bg-[#1877F2] hover:bg-[#166FE5]"
              >
                {sendingMessage ? "Sending..." : "Send"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
