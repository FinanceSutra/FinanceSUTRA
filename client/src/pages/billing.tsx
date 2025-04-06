import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  Check,
  Shield,
  Zap,
  Clock,
  ChevronRight,
  Info,
  AlertTriangle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency, usdToInr } from '@/lib/formatters';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_dummy_key');

// Pricing plans
const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'Forever',
    description: 'Basic algorithmic trading capabilities',
    features: [
      'Up to 3 active strategies',
      'Basic backtesting',
      'Daily market data',
      'Single broker connection',
      'Manual trading execution',
    ],
    limitedFeatures: [
      'No real-time data',
      'Limited historical data (1 year)',
      'No advanced indicators',
      'No strategy automation',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    period: 'per month',
    description: 'Advanced features for serious traders',
    features: [
      'Unlimited active strategies',
      'Advanced backtesting',
      'Real-time market data',
      'Multiple broker connections',
      'Automated strategy execution',
      'Advanced technical indicators',
      '5-year historical data',
      'Strategy optimization',
      'Priority support',
    ],
    limitedFeatures: [],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    period: 'per month',
    description: 'Full-featured solution for professional traders',
    features: [
      'Everything in Pro plan',
      'Enterprise-level API access',
      'Custom strategy development',
      'Dedicated support team',
      'VPS hosting for strategies',
      'Risk management tools',
      'Team collaboration features',
      'White-label options',
      'Custom integrations',
    ],
    limitedFeatures: [],
    popular: false,
  },
];

// Sample invoice data for demonstration
const invoices = [
  {
    id: 'INV-001',
    date: '2023-05-01',
    amount: 49,
    status: 'paid',
    plan: 'Pro',
  },
  {
    id: 'INV-002',
    date: '2023-04-01',
    amount: 49,
    status: 'paid',
    plan: 'Pro',
  },
  {
    id: 'INV-003',
    date: '2023-03-01',
    amount: 49,
    status: 'paid',
    plan: 'Pro',
  },
];

// Credit card form component using Stripe
const CheckoutForm: React.FC<{ amount: number; plan: string; isSubscription?: boolean }> = ({ amount, plan, isSubscription }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    
    try {
      if (isSubscription) {
        // For subscriptions, we use confirmCardPayment
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/billing?subscription_success=true`,
          },
        });
        
        if (error) {
          throw error;
        }
      } else {
        // For one-time payments
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/billing?payment_success=true`,
          },
        });
        
        if (error) {
          throw error;
        }
      }
      
      // If we get here without redirecting, it means the payment was successful but no redirect happened
      toast({
        title: isSubscription ? "Subscription Successful" : "Payment Successful",
        description: isSubscription ? 
          "Your subscription is now active. Thank you for subscribing!" : 
          "Thank you for your purchase!",
      });
    } catch (error: any) {
      toast({
        title: isSubscription ? "Subscription Failed" : "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <PaymentElement />
        
        <div className="pt-4 border-t border-neutral-200">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-neutral-500">Plan</span>
            <span className="text-sm font-medium">{plan}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-sm text-neutral-500">{isSubscription ? 'Subscription Fee' : 'Total'}</span>
            <span className="text-lg font-semibold">
              {formatCurrency(amount)}{isSubscription && plan !== 'Lifetime' ? '/mo' : ''}
            </span>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || processing}
          >
            {processing ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                Processing...
              </>
            ) : (
              isSubscription ? 'Subscribe Now' : 'Pay Now'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

// Checkout dialog with Stripe integration
const CheckoutDialog: React.FC<{ 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  selectedPlan: typeof plans[0];
}> = ({ open, onOpenChange, selectedPlan }) => {
  const [clientSecret, setClientSecret] = useState('');
  
  React.useEffect(() => {
    if (open && selectedPlan.price > 0) {
      // Create subscription for paid plans
      if (selectedPlan.id === 'pro' || selectedPlan.id === 'enterprise') {
        // For subscription plans, use the subscription endpoint
        apiRequest("POST", "/api/get-or-create-subscription")
          .then((res) => res.json())
          .then((data) => {
            setClientSecret(data.clientSecret);
          })
          .catch(error => {
            console.error("Error creating subscription:", error);
          });
      } else {
        // For one-time payments, use the payment intent endpoint
        apiRequest("POST", "/api/create-payment-intent", { amount: selectedPlan.price })
          .then((res) => res.json())
          .then((data) => {
            setClientSecret(data.clientSecret);
          })
          .catch(error => {
            console.error("Error creating payment intent:", error);
          });
      }
    }
  }, [open, selectedPlan]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Subscribe to {selectedPlan.name}</DialogTitle>
          <DialogDescription>
            Complete your subscription to the {selectedPlan.name} plan to access premium features.
          </DialogDescription>
        </DialogHeader>
        
        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm 
              amount={selectedPlan.price} 
              plan={selectedPlan.name} 
              isSubscription={selectedPlan.id === 'pro' || selectedPlan.id === 'enterprise'} 
            />
          </Elements>
        ) : selectedPlan.price > 0 ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="py-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Free Plan Selected</AlertTitle>
              <AlertDescription>
                You've selected the Free plan. No payment is required.
              </AlertDescription>
            </Alert>
            <Button className="w-full mt-4" onClick={() => onOpenChange(false)}>
              Activate Free Plan
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Dialog for plan change
const ChangePlanDialog: React.FC<{ 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
}> = ({ open, onOpenChange, currentPlan }) => {
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Find available plans for upgrade (filter out current plan and free plan if on pro)
  const availablePlans = plans.filter(plan => plan.id !== 'free' && plan.id !== currentPlan);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlanId) {
      toast({
        title: "No Plan Selected",
        description: "Please select a plan to continue.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Map plan ID to Stripe Price ID
      let stripePriceId = '';
      if (selectedPlanId === 'pro') {
        stripePriceId = 'price_pro';
      } else if (selectedPlanId === 'enterprise') {
        stripePriceId = 'price_enterprise';
      }
      
      const response = await apiRequest("POST", "/api/change-plan", { 
        newPlanId: stripePriceId
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Plan Changed Successfully",
          description: result.message,
        });
        onOpenChange(false);
        // Refetch user data
        window.location.reload();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Failed to Change Plan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Change Your Plan</DialogTitle>
          <DialogDescription>
            Select a new plan to upgrade your subscription.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <RadioGroup value={selectedPlanId} onValueChange={setSelectedPlanId}>
              {availablePlans.map((plan) => (
                <div key={plan.id} className="flex items-start space-x-3 border rounded-md p-4">
                  <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={`plan-${plan.id}`} className="text-base font-medium">
                      {plan.name} - {formatCurrency(usdToInr(plan.price))}/month
                    </Label>
                    <p className="text-sm text-neutral-500 mt-1">{plan.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !selectedPlanId}>
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  Processing...
                </>
              ) : (
                'Change Plan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Dialog for subscription cancellation
const CancelSubscriptionDialog: React.FC<{ 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/cancel-subscription");
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Subscription Cancelled",
          description: result.message,
        });
        onOpenChange(false);
        // Refetch user data
        window.location.reload();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Failed to Cancel Subscription",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cancel Your Subscription</DialogTitle>
          <DialogDescription>
            We're sorry to see you go. Your subscription will remain active until the end of your current billing period.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Please Note</AlertTitle>
              <AlertDescription>
                By cancelling, you'll lose access to premium features at the end of your billing period. You will not be charged again.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Help us improve (optional)</Label>
              <Input 
                id="cancel-reason" 
                placeholder="Why are you cancelling?" 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Keep Subscription</Button>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  Processing...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const BillingPage: React.FC = () => {
  const { toast } = useToast();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(plans[1]); // Default to Pro plan
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  // Query for current user
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    staleTime: 60000, // 1 minute
  });
  
  const handleSelectPlan = (plan: typeof plans[0]) => {
    // Determine which payment page to redirect to based on billing type
    if (plan.billingType === 'monthly' || plan.billingType === 'yearly') {
      // For subscription plans, redirect to subscribe page
      window.location.href = `/subscribe?plan=${encodeURIComponent(plan.name)}`;
    } else {
      // For one-time payment plans, redirect to checkout page
      window.location.href = `/checkout?amount=${plan.price * 100}&plan=${encodeURIComponent(plan.name)}`;
    }
  };
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0">
      <Header
        title="Billing & Subscription"
        description="Manage your subscription plan and payment methods"
      />
      
      <Tabs defaultValue="subscription" className="space-y-8">
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscription" className="space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Your current subscription plan and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h3 className="text-xl font-bold">{user?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}</h3>
                  <p className="text-sm text-neutral-500">
                    {user?.subscriptionStatus === 'active' 
                      ? 'Active until June 30, 2023' 
                      : 'Basic algorithmic trading capabilities'}
                  </p>
                </div>
                <Badge 
                  variant={user?.subscriptionStatus === 'active' ? 'success' : 'secondary'}
                  className="mt-2 md:mt-0"
                >
                  {user?.subscriptionStatus === 'active' ? 'Active' : 'Free Tier'}
                </Badge>
              </div>
              
              {user?.subscriptionStatus === 'active' && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Renewal Notice</AlertTitle>
                  <AlertDescription>
                    Your subscription will automatically renew on June 30, 2023. You'll be charged {formatCurrency(usdToInr(49))} for the next billing cycle.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              {user?.subscriptionStatus === 'active' ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setChangePlanDialogOpen(true)}
                  >
                    Change Plan
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    Cancel Subscription
                  </Button>
                </>
              ) : (
                <Button onClick={() => handleSelectPlan(plans.find(p => p.id === 'pro') || plans[1])}>
                  Upgrade to Pro
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* Available Plans */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`
                    relative
                    ${plan.popular ? 'border-primary' : 'border-neutral-200'}
                  `}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-0 right-0 flex justify-center">
                      <span className="bg-primary text-white text-xs px-3 py-1 rounded-full font-medium">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">{formatCurrency(usdToInr(plan.price))}</span>
                      <span className="ml-2 text-neutral-500">{plan.period}</span>
                    </div>
                    
                    <div className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-success mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                      
                      {plan.limitedFeatures.map((feature, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-4 h-0.5 bg-neutral-300 mr-2 mt-2.5 flex-shrink-0" />
                          <span className="text-sm text-neutral-500">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant={plan.popular ? 'default' : 'outline'} 
                      className="w-full"
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {plan.id === 'free' ? 'Start Free' : 'Subscribe'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your payment methods and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.subscriptionStatus === 'active' ? (
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-3 text-neutral-500" />
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-xs text-neutral-500">Visa • Expires 12/2025</p>
                      </div>
                    </div>
                    <Badge>Default</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border rounded-lg border-dashed">
                  <CreditCard className="h-8 w-8 mx-auto text-neutral-400" />
                  <p className="mt-2 text-neutral-500">No payment methods added yet</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/checkout'}
              >
                Add Payment Method
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Update your billing address and tax information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" defaultValue={user?.fullName || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="john@example.com" defaultValue={user?.email || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Billing Address</Label>
                <Input id="address" placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="New York" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP / Postal Code</Label>
                  <Input id="zip" placeholder="10001" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" placeholder="United States" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>
                View and download your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(usdToInr(invoice.amount))}</TableCell>
                        <TableCell>
                          <Badge
                            variant={invoice.status === 'paid' ? 'success' : 'destructive'}
                          >
                            {invoice.status === 'paid' ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Download PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6">
                  <p className="text-neutral-500">No invoices found</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Billing Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>
                Configure your billing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-medium">Email Receipts</h4>
                  <p className="text-sm text-neutral-500">Receive receipts via email for all payments</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-medium">Payment Reminders</h4>
                  <p className="text-sm text-neutral-500">Receive reminders before subscription renewals</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Invoice Currency</h4>
                <RadioGroup defaultValue="inr">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inr" id="inr" />
                    <Label htmlFor="inr">INR (₹)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="usd" id="usd" />
                    <Label htmlFor="usd">USD ($)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="eur" id="eur" />
                    <Label htmlFor="eur">EUR (€)</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Payment dialog */}
      <CheckoutDialog 
        open={paymentDialogOpen} 
        onOpenChange={setPaymentDialogOpen} 
        selectedPlan={selectedPlan}
      />
      
      {/* Change plan dialog */}
      <ChangePlanDialog
        open={changePlanDialogOpen}
        onOpenChange={setChangePlanDialogOpen}
        currentPlan={user?.plan || 'free'}
      />
      
      {/* Cancel subscription dialog */}
      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
      />
    </div>
  );
};

export default BillingPage;
