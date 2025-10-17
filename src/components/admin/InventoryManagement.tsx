import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Package } from "lucide-react";
import { useState } from "react";

export const InventoryManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState("");

  const { data: products } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('stock', { ascending: true });
      return data || [];
    }
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: string, stock: number }) => {
      const { error } = await supabase.from('products').update({ stock }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      toast({ title: "Stock updated" });
      setEditingId(null);
      setStockValue("");
    }
  });

  const handleUpdate = (id: string) => {
    if (stockValue) {
      updateStockMutation.mutate({ id, stock: Number(stockValue) });
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Total Products</h3>
          </div>
          <p className="text-3xl font-bold">{products?.length || 0}</p>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Low Stock</h3>
          </div>
          <p className="text-3xl font-bold">{products?.filter(p => p.stock < 10).length || 0}</p>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold">Out of Stock</h3>
          </div>
          <p className="text-3xl font-bold">{products?.filter(p => p.stock === 0).length || 0}</p>
        </div>
      </div>

      <div className="border rounded-lg overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left">Product</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Current Stock</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => (
              <tr key={product.id} className="border-b">
                <td className="p-4">{product.name}</td>
                <td className="p-4">{product.category}</td>
                <td className="p-4">
                  {editingId === product.id ? (
                    <Input
                      type="number"
                      value={stockValue}
                      onChange={(e) => setStockValue(e.target.value)}
                      className="w-24"
                    />
                  ) : (
                    product.stock
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    product.stock === 0 ? 'bg-red-100 text-red-800' :
                    product.stock < 10 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {product.stock === 0 ? 'Out of Stock' : product.stock < 10 ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                <td className="p-4">
                  {editingId === product.id ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(product.id)}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setStockValue(""); }}>Cancel</Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => { setEditingId(product.id); setStockValue(product.stock.toString()); }}>
                      Update Stock
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
