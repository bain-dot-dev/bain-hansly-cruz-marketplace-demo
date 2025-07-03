import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { ItemGrid } from "@/components/marketplace/item-grid";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categoryName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-4 sm:mb-6">
              <Link
                href="/"
                className="lg:hidden mr-3 p-1 hover:bg-gray-100 rounded"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {categoryName}
              </h1>
            </div>
            <ItemGrid category={categoryName} />
          </div>
        </div>
      </div>
    </div>
  );
}
