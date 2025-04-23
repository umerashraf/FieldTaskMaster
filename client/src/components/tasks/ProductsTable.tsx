import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Product, ProductUsage } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type ProductsTableProps = {
  taskId: number;
};

type ProductWithUsage = ProductUsage & {
  product: Product;
};

export default function ProductsTable({ taskId }: ProductsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [newProductQuantity, setNewProductQuantity] = useState<number>(1);

  // Get products used in this task
  const { data: productUsage, isLoading: usageLoading } = useQuery<ProductWithUsage[]>({
    queryKey: [`/api/tasks/${taskId}/products`],
  });

  // Get all products for selection
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Add product to task
  const addProduct = useMutation({
    mutationFn: async (data: { taskId: number; productId: number; quantity: number }) => {
      const response = await apiRequest('POST', '/api/product-usage', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/products`] });
      toast({
        title: "Product added",
        description: "The product has been added to the task.",
      });
      setSelectedProductId(null);
      setNewProductQuantity(1);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product.",
        variant: "destructive",
      });
    },
  });

  // Update product quantity
  const updateQuantity = useMutation({
    mutationFn: async (data: { id: number; quantity: number }) => {
      const response = await apiRequest('PATCH', `/api/product-usage/${data.id}`, {
        quantity: data.quantity,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/products`] });
      toast({
        title: "Quantity updated",
        description: "The product quantity has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quantity.",
        variant: "destructive",
      });
    },
  });

  // Remove product from task
  const removeProduct = useMutation({
    mutationFn: async (usageId: number) => {
      await apiRequest('DELETE', `/api/product-usage/${usageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/products`] });
      toast({
        title: "Product removed",
        description: "The product has been removed from the task.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove product.",
        variant: "destructive",
      });
    },
  });

  // Handle adding a new product
  const handleAddProduct = () => {
    if (!selectedProductId || newProductQuantity <= 0) return;
    
    addProduct.mutate({
      taskId,
      productId: selectedProductId,
      quantity: newProductQuantity,
    });
  };

  // Handle quantity change
  const handleQuantityChange = (usageId: number, quantity: number) => {
    if (quantity <= 0) return;
    updateQuantity.mutate({ id: usageId, quantity });
  };

  // Handle product removal
  const handleRemoveProduct = (usageId: number) => {
    removeProduct.mutate(usageId);
  };

  // Calculate total for a product
  const calculateTotal = (unitPrice: number, quantity: number) => {
    return (unitPrice * quantity).toFixed(2);
  };

  // Filter out products that are already in use
  const availableProducts = products?.filter(product => 
    !productUsage?.some(usage => usage.productId === product.id)
  );

  const isLoading = usageLoading || productsLoading;
  const isPending = addProduct.isPending || updateQuantity.isPending || removeProduct.isPending;

  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-800 mb-3">Products</h3>
      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Product</label>
              <Select
                value={selectedProductId?.toString() || ""}
                onValueChange={(value) => setSelectedProductId(Number(value))}
                disabled={isPending || !availableProducts?.length}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts?.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} {product.stockQuantity > 0 ? `(${product.stockQuantity} in stock)` : "(Out of stock)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-24">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Quantity</label>
              <Input
                type="number"
                min="1"
                value={newProductQuantity}
                onChange={(e) => setNewProductQuantity(Number(e.target.value))}
                disabled={isPending || !selectedProductId}
              />
            </div>
            
            <div>
              <Button
                onClick={handleAddProduct}
                disabled={isPending || !selectedProductId || newProductQuantity <= 0}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : productUsage && productUsage.length > 0 ? (
                  productUsage.map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell className="font-medium">{usage.product.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          className="w-20"
                          value={usage.quantity}
                          onChange={(e) => handleQuantityChange(usage.id, Number(e.target.value))}
                          disabled={isPending}
                        />
                      </TableCell>
                      <TableCell>${usage.product.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>${calculateTotal(usage.product.unitPrice, usage.quantity)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveProduct(usage.id)}
                          disabled={isPending}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-neutral-500">
                      No products added to this task yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {productUsage && productUsage.length > 0 && (
            <div className="flex justify-end mt-4">
              <div className="bg-neutral-50 p-2 rounded-md">
                <span className="font-medium">Total: $</span>
                {productUsage.reduce((sum, usage) => 
                  sum + (usage.product.unitPrice * usage.quantity), 0
                ).toFixed(2)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
