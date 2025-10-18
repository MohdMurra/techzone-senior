import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Package, Clock } from "lucide-react";

export default function Shipping() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Shipping Information</h1>
          <p className="text-muted-foreground mb-8">
            Everything you need to know about our shipping policies
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Free Shipping</CardTitle>
                <CardDescription>Orders over $500</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Secure Packaging</CardTitle>
                <CardDescription>Safe delivery guaranteed</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Fast Delivery</CardTitle>
                <CardDescription>2-5 business days</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Standard Shipping (5-7 business days)</h3>
                <p className="text-muted-foreground">$9.99 - Free for orders over $500</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Express Shipping (2-3 business days)</h3>
                <p className="text-muted-foreground">$19.99</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Next Day Delivery</h3>
                <p className="text-muted-foreground">$39.99 - Order before 2 PM</p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">International Shipping</h3>
                <p className="text-muted-foreground">
                  We ship worldwide. International shipping costs and delivery times vary by location.
                  Please contact us for a quote.
                </p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Tracking Your Order</h3>
                <p className="text-muted-foreground">
                  Once your order ships, you'll receive a tracking number via email. You can also
                  track your order status in your profile.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}