import { Link } from "react-router-dom";
import { ShoppingCart, GitCompare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCompare } from "@/contexts/CompareContext";

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  image: string;
  category: string;
  stock: number;
  specs?: Record<string, any>;
}

export const ProductCard = ({
  id,
  name,
  slug,
  price,
  salePrice,
  image,
  category,
  stock,
  specs
}: ProductCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useCompare();
  
  const inCompare = isInCompare(id);

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inCompare) {
      removeFromCompare(id);
      toast({
        title: "Removed from compare",
        description: `${name} removed from comparison`,
      });
    } else if (canAddMore) {
      addToCompare({ id, name, category, price, image_url: image, specs });
      toast({
        title: "Added to compare",
        description: `${name} added to comparison`,
      });
    } else {
      toast({
        title: "Compare limit reached",
        description: "You can compare up to 4 products",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to cart",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .insert({
        user_id: session.session.user.id,
        product_id: id,
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
        description: `${name} has been added to your cart`
      });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
    }
  };

  const discount = salePrice ? Math.round(((price - salePrice) / price) * 100) : 0;

  return (
    <Link to={`/product/${slug}`}>
      <Card className="group h-full overflow-hidden hover-lift card-elevated transition-all duration-300">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img src={image} alt={name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {discount > 0 && <Badge className="absolute top-2 right-2 bg-destructive">-{discount}%</Badge>}
          {stock === 0 && <Badge className="absolute top-2 left-2 bg-muted-foreground">Out of Stock</Badge>}
          <Button
            variant={inCompare ? "default" : "secondary"}
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleToggleCompare}
          >
            {inCompare ? <Check className="h-4 w-4" /> : <GitCompare className="h-4 w-4" />}
          </Button>
        </div>
        <CardContent className="p-4">
          <Badge variant="secondary" className="mb-2 text-xs">{category}</Badge>
          <h3 className="font-semibold line-clamp-2 mb-2">{name}</h3>
          <div className="flex items-baseline gap-2">
            {salePrice ? (
              <>
                <span className="text-xl font-bold text-primary">${salePrice.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground line-through">${price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-xl font-bold text-primary">${price.toFixed(2)}</span>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button className="w-full" onClick={handleAddToCart} disabled={stock === 0}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};
