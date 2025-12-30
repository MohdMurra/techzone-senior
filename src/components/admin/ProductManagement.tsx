import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { z } from "zod";

const productSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(200, 'Name too long (max 200 chars)'),
  
  description: z.string()
    .trim()
    .max(2000, 'Description too long (max 2000 chars)')
    .optional()
    .or(z.literal('')),
  
  slug: z.string()
    .trim()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  
  price: z.number()
    .min(0.01, 'Price must be at least $0.01')
    .max(999999, 'Price too high (max $999,999)'),
  
  sale_price: z.number()
    .min(0.01, 'Sale price must be at least $0.01')
    .max(999999, 'Sale price too high')
    .nullable()
    .optional(),
  
  stock: z.number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(999999, 'Stock too high (max 999,999)'),
  
  image_url: z.string()
    .url('Must be a valid URL')
    .max(500, 'URL too long')
    .optional()
    .or(z.literal('')),
  
  category: z.enum(['laptop', 'cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler'])
}).refine((data) => {
  if (data.sale_price && data.sale_price >= data.price) {
    return false;
  }
  return true;
}, { message: 'Sale price must be less than regular price', path: ['sale_price'] });

export const ProductManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    sale_price: "",
    category: "laptop",
    stock: "",
    image_url: "",
    slug: ""
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      return data || [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingProduct) {
        const { error } = await supabase.from('products').update(data).eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: editingProduct ? "Product updated" : "Product created" });
      setIsOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: "Product deleted" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      sale_price: "",
      category: "laptop",
      stock: "",
      image_url: "",
      slug: ""
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      sale_price: product.sale_price || "",
      category: product.category,
      stock: product.stock,
      image_url: product.image_url || "",
      slug: product.slug
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToValidate = {
      name: formData.name,
      description: formData.description || '',
      slug: formData.slug,
      price: Number(formData.price),
      sale_price: formData.sale_price ? Number(formData.sale_price) : null,
      stock: Number(formData.stock),
      image_url: formData.image_url || '',
      category: formData.category as 'laptop' | 'cpu' | 'gpu' | 'motherboard' | 'ram' | 'storage' | 'psu' | 'case' | 'cooler'
    };
    
    const result = productSchema.safeParse(dataToValidate);
    
    if (!result.success) {
      const errorMessage = result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      
      toast({ 
        title: "Validation Error", 
        description: errorMessage,
        variant: "destructive" 
      });
      return;
    }
    
    saveMutation.mutate(result.data);
  };

  return (
    <div className="space-y-4 mt-6">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button onClick={resetForm}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price</Label>
                <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
              </div>
              <div>
                <Label>Sale Price</Label>
                <Input type="number" step="0.01" value={formData.sale_price} onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="cpu">CPU</SelectItem>
                    <SelectItem value="gpu">GPU</SelectItem>
                    <SelectItem value="motherboard">Motherboard</SelectItem>
                    <SelectItem value="ram">RAM</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                    <SelectItem value="psu">PSU</SelectItem>
                    <SelectItem value="case">Case</SelectItem>
                    <SelectItem value="cooler">Cooler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">{editingProduct ? 'Update' : 'Create'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left">Product</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Price</th>
              <th className="p-4 text-left">Stock</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => (
              <tr key={product.id} className="border-b">
                <td className="p-4">{product.name}</td>
                <td className="p-4">{product.category}</td>
                <td className="p-4">${Number(product.price).toFixed(2)}</td>
                <td className="p-4">{product.stock}</td>
                <td className="p-4 flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
