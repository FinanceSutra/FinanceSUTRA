import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Smartphone, Building } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/formatters";
import UpiPayment from "@/components/payment/UpiPayment";
import NetBankingPayment from "@/components/payment/NetBankingPayment";
import RazorpayIntegration from "@/components/payment/RazorpayIntegration";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const StripeCheckoutForm = ({ amount, planName }: { amount: number, planName: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Thank you for your purchase!",
        });
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement className="py-4" />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${formatCurrency(amount / 100)}`
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(243600); // ₹2,436.00 by default (29 USD * 84 INR/USD)
  const [planName, setPlanName] = useState("Pro Plan");
  const [paymentMethod, setPaymentMethod] = useState("upi"); // Default to UPI
  const { toast } = useToast();
  
  // For demo purposes
  const upiId = "finance.sutra@okaxis";
  
  const handlePaymentSuccess = () => {
    // Redirect to dashboard or show success message
    window.location.href = "/dashboard";
  };
  
  useEffect(() => {
    // Get amount and plan name from URL params
    const params = new URLSearchParams(window.location.search);
    const amountParam = params.get('amount');
    const planParam = params.get('plan');
    
    if (amountParam) {
      setAmount(parseInt(amountParam));
    }
    
    if (planParam) {
      setPlanName(planParam);
    }
    
    // Create PaymentIntent as soon as the page loads (for Stripe)
    if (paymentMethod === 'card') {
      apiRequest("POST", "/api/create-payment-intent", { 
        amount: amount / 100 // Convert to rupees for the API
      })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch(error => {
          toast({
            title: "Error",
            description: "Failed to initialize payment. Please try again.",
            variant: "destructive",
          });
          console.error("Payment initialization error:", error);
        });
    }
  }, [amount, paymentMethod, toast]);
  
  // Render the appropriate payment component based on selected method
  const renderPaymentMethod = () => {
    switch (paymentMethod) {
      case 'upi':
        return <UpiPayment amount={amount / 100} upiId={upiId} onSuccess={handlePaymentSuccess} />;
        
      case 'netbanking':
        return <NetBankingPayment amount={amount / 100} onSuccess={handlePaymentSuccess} />;
        
      case 'card':
        if (!clientSecret) {
          return (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        return <RazorpayIntegration amount={amount / 100} planName={planName} onSuccess={handlePaymentSuccess} />;
        
      case 'stripe':
        if (!clientSecret) {
          return (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        return (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
            <StripeCheckoutForm amount={amount} planName={planName} />
          </Elements>
        );
        
      default:
        return <UpiPayment amount={amount / 100} upiId={upiId} onSuccess={handlePaymentSuccess} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Complete Your Purchase</CardTitle>
          <CardDescription>
            You're purchasing the {planName} for {formatCurrency(amount / 100)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upi" className="flex items-center justify-center">
                <Smartphone className="h-4 w-4 mr-2" />
                <span>UPI</span>
              </TabsTrigger>
              <TabsTrigger value="netbanking" className="flex items-center justify-center">
                <Building className="h-4 w-4 mr-2" />
                <span>NetBanking</span>
              </TabsTrigger>
              <TabsTrigger value="card" className="flex items-center justify-center">
                <CreditCard className="h-4 w-4 mr-2" />
                <span>Card</span>
              </TabsTrigger>
              <TabsTrigger value="stripe" className="flex items-center justify-center">
                <CreditCard className="h-4 w-4 mr-2" />
                <span>Stripe</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upi" className="mt-6">
              {renderPaymentMethod()}
            </TabsContent>
            
            <TabsContent value="netbanking" className="mt-6">
              {renderPaymentMethod()}
            </TabsContent>
            
            <TabsContent value="card" className="mt-6">
              {renderPaymentMethod()}
            </TabsContent>
            
            <TabsContent value="stripe" className="mt-6">
              {renderPaymentMethod()}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-sm text-muted-foreground">
          <p>Your payment information is secure and encrypted.</p>
          <p>You will be redirected to your dashboard after a successful payment.</p>
        </CardFooter>
      </Card>
    </div>
  );
}