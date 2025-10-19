import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();
      return data;
    }
  });

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });

  const handleAddToCart = async () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to cart",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .insert({
        user_id: session.user.id,
        product_id: product!.id,
        quantity: 1
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Added to cart",
        description: `${product!.name} has been added to your cart`
      });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container py-8">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container py-8">
          <p>Product not found</p>
          <Link to="/products">
            <Button className="mt-4">Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const discount = product.sale_price
    ? Math.round(((Number(product.price) - Number(product.sale_price)) / Number(product.price)) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-8 flex-1">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={product.image_url || '/placeholder.svg'}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {discount > 0 && (
              <Badge className="absolute top-4 right-4 bg-destructive text-lg px-4 py-2">
                -{discount}%
              </Badge>
            )}
            {product.stock === 0 && (
              <Badge className="absolute top-4 left-4 bg-muted-foreground text-lg px-4 py-2">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <Badge variant="secondary" className="w-fit mb-4">
              {product.category}
            </Badge>
            
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            
            <div className="flex items-baseline gap-3 mb-6">
              {product.sale_price ? (
                <>
                  <span className="text-4xl font-bold text-primary">
                    ${Number(product.sale_price).toFixed(2)}
                  </span>
                  <span className="text-2xl text-muted-foreground line-through">
                    ${Number(product.price).toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-4xl font-bold text-primary">
                  ${Number(product.price).toFixed(2)}
                </span>
              )}
            </div>

            {product.description && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <h2 className="font-semibold mb-2">Description</h2>
                  <p className="text-muted-foreground">{product.description}</p>
                </CardContent>
              </Card>
            )}

            {product.specs && Object.keys(product.specs).length > 0 && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <h2 className="font-semibold mb-3">Specifications</h2>
                  <dl className="space-y-2">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b pb-2">
                        <dt className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                        <dd className="font-medium">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}

            <div className="mt-auto space-y-3">
              <p className="text-sm text-muted-foreground">
                Stock: {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
              </p>
              
              <Button
                size="lg"
                className="w-full"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
