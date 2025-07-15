"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Car,
  Home,
  Shirt,
  FileText,
  Smartphone,
  Film,
  Baby,
  Gift,
  Trees,
  Palette,
  Sofa,
  Hammer,
  DollarSign,
  Music,
  Briefcase,
  PawPrint,
  Dumbbell,
  Gamepad2,
  Users,
} from "lucide-react";

const categories = [
  { name: "Vehicles", slug: "vehicles", icon: Car },
  { name: "Property Rentals", slug: "property-rentals", icon: Home },
  { name: "Apparel", slug: "apparel", icon: Shirt },
  { name: "Electronics", slug: "electronics", icon: Smartphone },
  { name: "Classifieds", slug: "classifieds", icon: FileText },
  { name: "Entertainment", slug: "entertainment", icon: Film },
  { name: "Family", slug: "family", icon: Baby },
  { name: "Free Stuff", slug: "free-stuff", icon: Gift },
  { name: "Garden & Outdoor", slug: "garden-outdoor", icon: Trees },
  { name: "Hobbies", slug: "hobbies", icon: Palette },
  { name: "Home Goods", slug: "home-goods", icon: Sofa },
  { name: "Home Improvement", slug: "home-improvement", icon: Hammer },
  { name: "Home Sales", slug: "home-sales", icon: DollarSign },
  { name: "Musical Instruments", slug: "musical-instruments", icon: Music },
  { name: "Office Supplies", slug: "office-supplies", icon: Briefcase },
  { name: "Pet Supplies", slug: "pet-supplies", icon: PawPrint },
  { name: "Sporting Goods", slug: "sporting-goods", icon: Dumbbell },
  { name: "Toys & Games", slug: "toys-games", icon: Gamepad2 },
  { name: "Buy and sell groups", slug: "buy-sell-groups", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
        <nav className="space-y-1">
          {categories.map((category) => {
            const isActive = pathname === `/category/${category.slug}`;
            const IconComponent = category.icon;
            return (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                  isActive
                    ? "bg-[#1877F2] text-white font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <IconComponent className="w-5 h-5 flex-shrink-0" />
                <span>{category.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
