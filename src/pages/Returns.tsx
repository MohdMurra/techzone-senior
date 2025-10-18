import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Shield, CheckCircle } from "lucide-react";

export default function Returns() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Returns & Refunds</h1>
          <p className="text-muted-foreground mb-8">
            Our hassle-free return policy
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <RotateCcw className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>30-Day Returns</CardTitle>
                <CardDescription>Free returns within 30 days</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Warranty Protected</CardTitle>
                <CardDescription>All products covered</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Easy Process</CardTitle>
                <CardDescription>Simple return steps</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Return Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Eligibility</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Items must be returned within 30 days of delivery</li>
                  <li>Products must be in original packaging</li>
                  <li>All accessories and documentation must be included</li>
                  <li>Items must be unused and in resalable condition</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Non-Returnable Items</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Software and digital products</li>
                  <li>Opened or used components (for hygiene reasons)</li>
                  <li>Custom-built PCs (unless defective)</li>
                  <li>Sale or clearance items marked as final sale</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Return</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Step 1: Request a Return</h3>
                <p className="text-muted-foreground">
                  Contact our customer service team or initiate a return from your order history.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Step 2: Pack Your Item</h3>
                <p className="text-muted-foreground">
                  Carefully package your item in its original box with all accessories.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Step 3: Ship It Back</h3>
                <p className="text-muted-foreground">
                  Use the prepaid return label we provide. Drop it off at any authorized carrier location.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Step 4: Get Your Refund</h3>
                <p className="text-muted-foreground">
                  Once we receive and inspect your return, we'll process your refund within 5-7 business days.
                </p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Refund Method</h3>
                <p className="text-muted-foreground">
                  Refunds will be issued to your original payment method. Please allow 5-10 business days
                  for the refund to appear in your account.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}