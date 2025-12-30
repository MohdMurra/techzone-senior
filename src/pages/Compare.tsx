import { useCompare } from "@/contexts/CompareContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, GitCompare, ShoppingCart, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Compare() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const handleAddToCart = async (productId: string, productName: string) => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from('cart_items').upsert({
      user_id: session.user.id,
      product_id: productId,
      quantity: 1,
    }, {
      onConflict: 'user_id,product_id',
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Added to cart",
        description: `${productName} has been added to your cart`,
      });
    }
  };

  // Get all unique spec keys from all products
  const allSpecKeys = Array.from(
    new Set(
      compareItems.flatMap(item => Object.keys(item.specs || {}))
    )
  );

  if (compareItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <GitCompare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">No Products to Compare</h1>
            <p className="text-muted-foreground mb-6">
              Add products to compare by clicking the compare icon on product cards.
            </p>
            <Button onClick={() => navigate('/products')}>
              Browse Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Compare Products</h1>
              <p className="text-muted-foreground">
                Comparing {compareItems.length} products side by side
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={clearCompare}>
            Clear All
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left bg-muted/50 min-w-[150px] sticky left-0 z-10">
                  <span className="font-semibold">Specification</span>
                </th>
                {compareItems.map((item) => (
                  <th key={item.id} className="p-4 min-w-[250px]">
                    <Card className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => removeFromCompare(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <CardContent className="p-4">
                        <Link to={`/product/${item.id}`}>
                          <img
                            src={item.image_url || '/placeholder.svg'}
                            alt={item.name}
                            className="w-full h-32 object-contain mb-3"
                          />
                        </Link>
                        <Badge variant="secondary" className="mb-2">
                          {item.category}
                        </Badge>
                        <Link to={`/product/${item.id}`}>
                          <h3 className="font-semibold text-sm mb-2 hover:text-primary">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-lg font-bold text-primary mb-3">
                          ${item.price.toFixed(2)}
                        </p>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleAddToCart(item.id, item.name)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allSpecKeys.map((specKey) => (
                <tr key={specKey} className="border-t">
                  <td className="p-4 font-medium bg-muted/30 capitalize sticky left-0 z-10">
                    {specKey.replace(/_/g, ' ')}
                  </td>
                  {compareItems.map((item) => (
                    <td key={`${item.id}-${specKey}`} className="p-4 text-center">
                      {item.specs?.[specKey] ?? (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {allSpecKeys.length === 0 && (
                <tr className="border-t">
                  <td className="p-4 font-medium bg-muted/30 sticky left-0 z-10">
                    Category
                  </td>
                  {compareItems.map((item) => (
                    <td key={`${item.id}-category`} className="p-4 text-center capitalize">
                      {item.category}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
