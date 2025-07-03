import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { ItemGrid } from "@/components/marketplace/item-grid";

const categories = [
  { name: "Vehicles", slug: "vehicles" },
  { name: "Electronics", slug: "electronics" },
  { name: "Home Goods", slug: "home-goods" },
  { name: "Apparel", slug: "apparel" },
  { name: "Sporting Goods", slug: "sporting-goods" },
  { name: "Toys & Games", slug: "toys-games" },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              {"Today's picks"}
            </h1>

            {/* Mobile categories navigation */}
            <div className="lg:hidden mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Categories
              </h2>
              <div className="overflow-x-auto">
                <div className="flex space-x-3 pb-2">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/category/${category.slug}`}
                      className="flex-shrink-0 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <ItemGrid />
          </div>
        </div>
      </div>
    </div>
  );
}
