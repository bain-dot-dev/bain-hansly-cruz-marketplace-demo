"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Package, List, Car, Home } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";

const listingTypes = [
  {
    id: "item",
    title: "Item for sale",
    description: "Lorem ipsum dolor sit",
    icon: Package,
    href: "/create/item",
  },
  {
    id: "multiple",
    title: "Create multiple listings",
    description: "Lorem ipsum dolor sit",
    icon: List,
    href: "/create/multiple",
  },
  {
    id: "vehicle",
    title: "Vehicle for sale",
    description: "Lorem ipsum dolor sit",
    icon: Car,
    href: "/create/vehicle",
  },
  {
    id: "home",
    title: "Home for sale or rent",
    description: "Lorem ipsum dolor sit",
    icon: Home,
    href: "/create/home",
  },
];

export default function CreatePage() {
  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Create new listing
          </h1>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="bg-gray-200 rounded-full px-3 py-1">
              Choose listing type
            </span>
          </div>
        </div>

        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-center mb-6 sm:mb-8">
            Choose listing type
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {listingTypes.map((type) => (
              <Link key={type.id} href={type.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <type.icon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                      {type.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {type.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
