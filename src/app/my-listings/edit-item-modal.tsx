"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define Listing type if not imported from elsewhere
type Listing = {
  id: string | number;
  title: string;
  price: number;
  description: string;
  category: string;
  image_url?: string | null;
};

const categories = [
  "Electronics",
  "Vehicles",
  "Home Goods",
  "Apparel",
  "Sporting Goods",
  "Toys & Games",
  "Musical Instruments",
  "Books",
  "Garden & Outdoor",
  "Pet Supplies",
];

export default function EditItemModal({
  open,
  onClose,
  listing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  listing: Listing;
  onSave: (updated: Listing) => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    listing?.image_url || null
  );
  const [formData, setFormData] = useState({
    title: listing?.title || "",
    price: listing?.price?.toString() || "",
    description: listing?.description || "",
    category: listing?.category || "",
  });

  useEffect(() => {
    setFormData({
      title: listing?.title || "",
      price: listing?.price?.toString() || "",
      description: listing?.description || "",
      category: listing?.category || "",
    });
    setImagePreview(listing?.image_url || null);
    setImageFile(null);
  }, [listing]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = listing?.image_url || null;
      // Upload image if present
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          imageUrl = uploadResult.url;
        }
      }
      // Update listing
      const updatedData = {
        ...formData,
        price: Number.parseFloat(formData.price),
        image_url: imageUrl,
      };
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success!",
          description: "Your listing has been updated.",
        });
        onSave(result);
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.details || errorData.error || "Failed to update listing"
        );
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          (error as Error).message ||
          "An error occurred while updating the listing.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg p-6 w-full max-w-lg mx-auto border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 z-10 bg-white/80 rounded-full p-1 hover:bg-white"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-6 h-6 text-gray-700" />
        </button>
        <h2 className="text-xl font-bold mb-4">Edit Listing</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <Label htmlFor="image">Photo</Label>
            <div className="mt-2">
              {!imagePreview ? (
                <label htmlFor="image" className="cursor-pointer block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center w-full h-72 bg-gray-100 text-center hover:border-gray-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Add photo</p>
                  </div>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative">
                  <Image
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    width={400}
                    height={288}
                    className="rounded-lg object-cover w-full h-72"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Title"
              required
            />
          </div>
          {/* Price */}
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              placeholder="Price"
              required
            />
          </div>
          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Description"
              rows={4}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#1877F2] hover:bg-[#166FE5]"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
