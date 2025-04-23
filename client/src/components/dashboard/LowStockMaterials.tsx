import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function LowStockMaterials() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products?lowStock=true'],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-neutral-100">
          <h3 className="font-semibold">Low Stock Materials</h3>
        </div>
        <div className="p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="py-3">
              <Skeleton className="h-14 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-neutral-100">
        <h3 className="font-semibold">Low Stock Materials</h3>
      </div>
      <div className="p-4">
        {products && products.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {products.map((product) => (
              <li key={product.id} className="py-3 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-error bg-opacity-10 rounded p-2 mr-3">
                    <AlertTriangle className="h-5 w-5 text-error" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-neutral-500">
                      Only {product.stockQuantity} left in stock
                    </p>
                  </div>
                </div>
                <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Order
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-6 text-center text-neutral-500">
            <p>All materials are sufficiently stocked</p>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-neutral-100">
        <Link href="/products">
          <Button
            variant="outline"
            className="w-full"
          >
            View All Inventory
          </Button>
        </Link>
      </div>
    </div>
  );
}
