import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Lock, CheckCircle, BookOpen } from "lucide-react";

interface CourseCheckoutData {
  courseId: string;
  courseTitle: string;
  coursePrice: number;
}

export default function CourseCheckout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [courseData, setCourseData] = useState<CourseCheckoutData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });

  useEffect(() => {
    const stored = sessionStorage.getItem('courseCheckout');
    if (stored) {
      setCourseData(JSON.parse(stored));
    } else {
      navigate('/learning-hub');
    }
  }, [navigate]);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id || !courseData) throw new Error('Invalid session or course data');
      
      const { error } = await supabase
        .from('course_enrollments')
        .insert([{
          user_id: session.user.id,
          course_id: courseData.courseId,
          progress: 0
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      sessionStorage.removeItem('courseCheckout');
      queryClient.invalidateQueries({ queryKey: ['enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
      toast({
        title: "Payment Successful!",
        description: "You've been enrolled in the course. Start learning now!"
      });
      navigate(`/course/${courseData?.courseId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Enrollment failed",
        description: error.message,
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      enrollMutation.mutate();
    }, 2000);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container py-8 flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to complete your purchase</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth">
                <Button className="w-full">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-8 flex-1">
        <div className="mb-6">
          <Link to={`/course/${courseData.courseId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Complete Your Purchase</h1>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                  <CardDescription>
                    <span className="flex items-center gap-1 text-amber-600">
                      <Lock className="h-3 w-3" />
                      Demo Mode - No real payment will be processed
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input id="cardName" placeholder="John Doe" required />
                    </div>
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input id="cardNumber" placeholder="4242 4242 4242 4242" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="MM/YY" required />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" required />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>Processing Payment...</>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Pay ${Number(courseData.coursePrice).toFixed(2)}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Your payment information is secure and encrypted</span>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm line-clamp-2">{courseData.courseTitle}</h4>
                      <p className="text-xs text-muted-foreground">Lifetime access</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${Number(courseData.coursePrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>${Number(courseData.coursePrice).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>30-day money-back guarantee</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Lifetime access to course</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Certificate of completion</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}