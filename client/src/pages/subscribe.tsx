import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCheck, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_dummy_key');

export default function Subscribe() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [planName, setPlanName] = useState("Pro Plan");
  const [amount, setAmount] = useState(243600); // ₹2,436.00 by default (29 USD * 84 INR/USD)
  const { toast } = useToast();
  
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
    
    // Get or create subscription
    apiRequest("POST", "/api/get-or-create-subscription", {})
      .then((res) => res.json())
      .then((data) => {
        setSubscriptionId(data.subscriptionId);
        setClientSecret(data.clientSecret);
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
  
  const handleCancelSubscription = async () => {
    setLoading(true);
    
    apiRequest("POST", "/api/cancel-subscription", {})
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          toast({
            title: "Subscription Canceled",
            description: data.message,
          });
          setSuccess(true);
        } else {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
        }
      })
      .catch(error => {
        toast({
          title: "Error",
          description: "Failed to cancel subscription. Please try again.",
          variant: "destructive",
        });
        console.error("Subscription cancellation error:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Manage Your Subscription</CardTitle>
          <CardDescription>
            You're currently subscribed to the {planName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="flex items-center space-x-2">
              <CheckCheck className="h-4 w-4 text-green-500" />
              <p className="text-sm text-muted-foreground">
                Your subscription has been canceled.
              </p>
            </div>
          ) : (
            <>
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                  <div className="py-8 flex justify-center">
                    <p>Payment details are being processed...</p>
                  </div>
                </Elements>
              ) : (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={handleCancelSubscription} 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  "Cancel Subscription"
                )}
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-sm text-muted-foreground">
          <p>Manage your subscription and billing details.</p>
          <p>You can cancel your subscription at any time.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
