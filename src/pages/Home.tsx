import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Cpu, Zap, Shield, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-gaming.jpg";

export default function Home() {
  const { data: featuredProducts } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .limit(6);
      return data || [];
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>

        <div className="container relative z-10 animate-fade-in">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Build Your Dream
              <span className="block gradient-text">Gaming PC</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Premium components, expert guidance, and unbeatable performance. Start your build today.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/builder">
                <Button size="lg" className="group">
                  PC Builder
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/products">
                <Button size="lg" variant="outline">
                  Shop Products
                </Button>
              </Link>
              <Link to="/learning-hub">
                <Button size="lg" variant="secondary">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Learning Hub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="h-14 w-14 rounded-full bg-gradient-hero flex items-center justify-center mb-4">
                <Cpu className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Compatibility</h3>
              <p className="text-muted-foreground">
                Our PC Builder checks every component for compatibility automatically
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="h-14 w-14 rounded-full bg-gradient-hero flex items-center justify-center mb-4">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast Shipping</h3>
              <p className="text-muted-foreground">
                Get your components delivered quickly with premium shipping options
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="h-14 w-14 rounded-full bg-gradient-hero flex items-center justify-center mb-4">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Warranty Protected</h3>
              <p className="text-muted-foreground">
                All products come with manufacturer warranty and our support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
              <p className="text-muted-foreground">
                Handpicked components for your next build
              </p>
            </div>
            <Link to="/products">
              <Button variant="outline">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts?.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={Number(product.price)}
                salePrice={product.sale_price ? Number(product.sale_price) : undefined}
                image={product.image_url || '/placeholder.svg'}
                category={product.category}
                stock={product.stock}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Build Your Dream PC?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Use our intelligent PC Builder to create the perfect setup
          </p>
          <Link to="/builder">
            <Button size="lg" variant="secondary">
              Start Building Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">TechZone</h3>
              <p className="text-sm text-muted-foreground">
                Your trusted source for PC components and builds.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/products" className="text-muted-foreground hover:text-primary">All Products</Link></li>
                <li><Link to="/builder" className="text-muted-foreground hover:text-primary">PC Builder</Link></li>
                <li><Link to="/builds" className="text-muted-foreground hover:text-primary">Community Builds</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary">Contact Us</a></li>
                <li><Link to="/shipping" className="text-muted-foreground hover:text-primary">Shipping Info</Link></li>
                <li><Link to="/returns" className="text-muted-foreground hover:text-primary">Returns</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy-policy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2025 TechZone. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
