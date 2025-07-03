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
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {categoryName}
          </h1>
          <ItemGrid category={categoryName} />
        </div>
      </div>
    </div>
  );
}
