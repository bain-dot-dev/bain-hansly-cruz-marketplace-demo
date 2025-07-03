import { Sidebar } from "@/components/layout/sidebar"
import { ItemGrid } from "@/components/marketplace/item-grid"

export default function HomePage() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{"Today's picks"}</h1>
          <ItemGrid />
        </div>
      </div>
    </div>
  )
}
