import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = ({ planName }: { planName: string }) => {
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
          title: "Subscription Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Subscription Successful",
          description: "You are now subscribed!",
        });
      }
    } catch (err: any) {
      toast({
        title: "Subscription Error",
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
          `Subscribe to ${planName}`
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [planName, setPlanName] = useState("Pro Plan");
  const { toast } = useToast();
  
  useEffect(() => {
    // Get plan name from URL params
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    
    if (planParam) {
      setPlanName(planParam);
    }
    
    // Create or retrieve subscription
    apiRequest("POST", "/api/get-or-create-subscription", {})
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          // If no clientSecret, the user is already subscribed
          toast({
            title: "Already Subscribed",
            description: "You already have an active subscription.",
          });
          // Redirect to dashboard
          window.location.href = "/dashboard";
        }
      })
      .catch(error => {
        toast({
          title: "Error",
          description: "Failed to initialize subscription. Please try again.",
          variant: "destructive",
        });
        console.error("Subscription initialization error:", error);
      });
  }, [toast]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Subscribe to {planName}</CardTitle>
          <CardDescription>
            You're subscribing to our {planName} with monthly billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!clientSecret ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <SubscribeForm planName={planName} />
            </Elements>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-sm text-muted-foreground">
          <p>Your subscription is secured by Stripe.</p>
          <p>You can cancel your subscription at any time from your account settings.</p>
          <p>You will be redirected to your dashboard after successful subscription.</p>
        </CardFooter>
      </Card>
    </div>
  );
}