import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Clock, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FlashSale {
  id: string;
  product_id: string;
  discount_percent: number;
  original_price: number;
  sale_price: number;
  ends_at: string;
  stock_limit: number | null;
  sold_count: number;
  products: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    category: string;
  };
}

function CountdownTimer({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24) + Math.floor(difference / (1000 * 60 * 60 * 24)) * 24,
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div className="flex items-center gap-1 text-sm font-mono">
      <Clock className="h-4 w-4 text-destructive" />
      <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded">
        {String(timeLeft.hours).padStart(2, '0')}
      </span>
      :
      <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded">
        {String(timeLeft.minutes).padStart(2, '0')}
      </span>
      :
      <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded">
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

export function FlashSalesSection() {
  const { toast } = useToast();

  const { data: flashSales, isLoading } = useQuery({
    queryKey: ['flash-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_sales')
        .select(`
          *,
          products (id, name, slug, image_url, category)
        `)
        .eq('is_active', true)
        .gt('ends_at', new Date().toISOString())
        .order('ends_at', { ascending: true })
        .limit(4);

      if (error) throw error;
      return data as FlashSale[];
    },
  });

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const handleAddToCart = async (flashSale: FlashSale) => {
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
      product_id: flashSale.product_id,
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
        title: "Added to cart!",
        description: `${flashSale.products.name} at ${flashSale.discount_percent}% off!`,
      });
    }
  };

  if (isLoading || !flashSales?.length) return null;

  return (
    <section className="py-12 bg-gradient-to-r from-destructive/5 via-background to-destructive/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Flame className="h-6 w-6 text-destructive animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Flash Sales</h2>
              <p className="text-muted-foreground text-sm">Limited time offers - Don't miss out!</p>
            </div>
          </div>
          <Link to="/products?sale=true">
            <Button variant="outline" size="sm">View All Deals</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {flashSales.map((sale) => (
            <Card key={sale.id} className="group relative overflow-hidden border-destructive/20 hover:border-destructive/40 transition-colors">
              <Badge className="absolute top-3 left-3 z-10 bg-destructive text-destructive-foreground">
                -{sale.discount_percent}% OFF
              </Badge>
              
              {sale.stock_limit && (
                <Badge variant="secondary" className="absolute top-3 right-3 z-10">
                  {sale.stock_limit - sale.sold_count} left
                </Badge>
              )}

              <CardContent className="p-4">
                <Link to={`/product/${sale.products.slug}`}>
                  <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={sale.products.image_url || '/placeholder.svg'}
                      alt={sale.products.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {sale.products.name}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl font-bold text-destructive">
                    ${Number(sale.sale_price).toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    ${Number(sale.original_price).toFixed(2)}
                  </span>
                </div>

                <div className="mb-4">
                  <CountdownTimer endTime={sale.ends_at} />
                </div>

                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleAddToCart(sale)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
