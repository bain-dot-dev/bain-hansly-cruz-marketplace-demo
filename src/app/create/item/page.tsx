"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function CreateItemPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    email: "",
    description: "",
    category: "",
  });

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
      let imageUrl = null;

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

      // Create listing
      const listingData = {
        ...formData,
        price: Number.parseFloat(formData.price),
        image_url: imageUrl,
      };

      console.log("Sending listing data:", listingData); // Debug log

      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(listingData),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success!",
          description: "Your listing has been created.",
        });
        router.push(`/item/${result.id}`);
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(
          errorData.details || errorData.error || "Failed to create listing"
        );
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          (error as Error).message ||
          "An error occurred while creating the listing.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
        Create Item Listing
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Image Upload */}
            <div>
              <Label htmlFor="image">Add photos</Label>
              <div className="mt-2">
                {!imagePreview ? (
                  <label htmlFor="image" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-gray-400 transition-colors">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Add photos</p>
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
                      width={300}
                      height={200}
                      className="rounded-lg object-cover w-full h-40 sm:h-48"
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

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Email"
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
              {loading ? "Creating..." : "Next"}
            </Button>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-2">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Preview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Large Preview */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {imagePreview ? (
                  <Image
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <div className="text-blue-400 text-4xl sm:text-6xl">📷</div>
                  </div>
                )}
              </div>

              {/* Details Preview */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">
                    {formData.title || "Title"}
                  </h3>
                  <p className="text-lg sm:text-xl font-semibold">
                    {formData.price ? `$${formData.price}` : "Price"}
                  </p>
                </div>

                <div className="text-sm text-gray-600">
                  <p>Listed 1 hour ago</p>
                  <p>in Palo Alto, CA</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">Seller Information</h4>
                  <p className="text-sm text-gray-600">
                    {formData.email || "Your email"}
                  </p>
                </div>

                {formData.description && (
                  <div>
                    <h4 className="font-semibold mb-1">Description</h4>
                    <p className="text-sm text-gray-600">
                      {formData.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
