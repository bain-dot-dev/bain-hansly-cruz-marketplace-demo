"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const categories = [
  { name: "Vehicles", slug: "vehicles" },
  { name: "Property Rentals", slug: "property-rentals" },
  { name: "Apparel", slug: "apparel" },
  { name: "Classifieds", slug: "classifieds" },
  { name: "Electronics", slug: "electronics" },
  { name: "Entertainment", slug: "entertainment" },
  { name: "Family", slug: "family" },
  { name: "Free Stuff", slug: "free-stuff" },
  { name: "Garden & Outdoor", slug: "garden-outdoor" },
  { name: "Hobbies", slug: "hobbies" },
  { name: "Home Goods", slug: "home-goods" },
  { name: "Home Improvement", slug: "home-improvement" },
  { name: "Home Sales", slug: "home-sales" },
  { name: "Musical Instruments", slug: "musical-instruments" },
  { name: "Office Supplies", slug: "office-supplies" },
  { name: "Pet Supplies", slug: "pet-supplies" },
  { name: "Sporting Goods", slug: "sporting-goods" },
  { name: "Toys & Games", slug: "toys-games" },
  { name: "Buy and sell groups", slug: "buy-sell-groups" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:block w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
        <nav className="space-y-1">
          {categories.map((category) => {
            const isActive = pathname === `/category/${category.slug}`;
            return (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className={cn(
                  "block px-3 py-2 text-sm rounded-md transition-colors",
                  isActive
                    ? "bg-[#1877F2] text-white font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {category.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
