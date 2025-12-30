import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  sale_price?: number;
  image_url?: string;
  specs?: Record<string, any>;
}

interface ProductRecommendationsProps {
  currentProduct?: Product | null;
  title?: string;
}

export function ProductRecommendations({ currentProduct, title = "Recommended For You" }: ProductRecommendationsProps) {
  const [browsingHistory, setBrowsingHistory] = useState<Product[]>([]);

  // Load browsing history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('browsingHistory');
    if (stored) {
      setBrowsingHistory(JSON.parse(stored));
    }
  }, []);

  // Track current product in browsing history
  useEffect(() => {
    if (currentProduct) {
      const stored = localStorage.getItem('browsingHistory');
      const history: Product[] = stored ? JSON.parse(stored) : [];
      
      // Remove if already exists, add to front
      const filtered = history.filter(p => p.id !== currentProduct.id);
      const updated = [currentProduct, ...filtered].slice(0, 20);
      
      localStorage.setItem('browsingHistory', JSON.stringify(updated));
      setBrowsingHistory(updated);
    }
  }, [currentProduct?.id]);

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: cartItems } = useQuery({
    queryKey: ['cart-items-for-rec', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', session.user.id);
      if (error) throw error;
      return data?.map(item => item.products) || [];
    },
    enabled: !!session?.user?.id,
  });

  const { data: allProducts } = useQuery({
    queryKey: ['all-products-for-rec'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, category, price, sale_price, image_url, specs')
        .limit(50);
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: recommendedProducts, isLoading } = useQuery({
    queryKey: ['ai-recommendations', currentProduct?.id, cartItems?.length, browsingHistory.length],
    queryFn: async () => {
      if (!allProducts?.length) return [];

      try {
        const response = await supabase.functions.invoke('ai-recommendations', {
          body: {
            currentProduct,
            cartItems,
            browsingHistory,
            allProducts,
          },
        });

        if (response.error) throw response.error;
        
        const { recommendedIds } = response.data;
        
        if (!recommendedIds?.length) {
          // Fallback to random products
          return allProducts
            .filter(p => p.id !== currentProduct?.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);
        }

        // Map IDs to products
        const recommended = recommendedIds
          .map((id: string) => allProducts.find(p => p.id === id))
          .filter(Boolean)
          .slice(0, 4);

        return recommended.length > 0 ? recommended : allProducts
          .filter(p => p.id !== currentProduct?.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 4);
      } catch (error) {
        console.error('AI recommendations error:', error);
        // Fallback to related category products
        return allProducts
          .filter(p => p.id !== currentProduct?.id)
          .filter(p => currentProduct ? p.category !== currentProduct.category : true)
          .sort(() => Math.random() - 0.5)
          .slice(0, 4);
      }
    },
    enabled: !!allProducts?.length,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[320px] rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!recommendedProducts?.length) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">{title}</h2>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            AI Powered
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedProducts.map((product) => (
            <ProductCard 
              key={product.id}
              id={product.id}
              name={product.name}
              slug={product.slug}
              price={product.price}
              salePrice={product.sale_price}
              image={product.image_url || '/placeholder.svg'}
              category={product.category}
              stock={100}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
