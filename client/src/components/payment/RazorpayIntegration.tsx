import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';

interface RazorpayIntegrationProps {
  amount: number;
  planName: string;
  customerId?: string;
  onSuccess: () => void;
}

// Mock implementation for Razorpay
// In a real app, you would include the Razorpay SDK and handle the payment properly
const RazorpayIntegration: React.FC<RazorpayIntegrationProps> = ({ 
  amount, 
  planName, 
  customerId,
  onSuccess 
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'number' && !/^\d*$/.test(value)) return;
    if (name === 'expiry' && !/^\d{0,2}\/?\d{0,2}$/.test(value)) return;
    if (name === 'cvv' && !/^\d{0,3}$/.test(value)) return;
    
    setCardDetails({ ...cardDetails, [name]: value });
  };
  
  const formatExpiry = (value: string) => {
    const expiry = value.replace('/', '');
    
    if (expiry.length > 2) {
      return `${expiry.slice(0, 2)}/${expiry.slice(2, 4)}`;
    }
    
    return expiry;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Very basic validation
    if (cardDetails.number.length < 16) {
      toast({
        title: "Invalid Card Number",
        description: "Please enter a valid 16-digit card number",
        variant: "destructive",
      });
      return;
    }
    
    if (!cardDetails.name) {
      toast({
        title: "Enter Card Holder Name",
        description: "Please enter the name on your card",
        variant: "destructive",
      });
      return;
    }
    
    if (cardDetails.expiry.length < 5) {
      toast({
        title: "Invalid Expiry Date",
        description: "Please enter a valid expiry date (MM/YY)",
        variant: "destructive",
      });
      return;
    }
    
    if (cardDetails.cvv.length < 3) {
      toast({
        title: "Invalid CVV",
        description: "Please enter a valid 3-digit CVV",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // In a real implementation, this would call Razorpay's API
    // For demo purposes, we'll simulate a successful payment after a delay
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
      toast({
        title: "Payment Successful",
        description: `Your payment of ${formatCurrency(amount)} has been processed successfully!`,
      });
    }, 2000);
  };
  
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-medium">Credit/Debit Card Payment</h3>
          <p className="text-sm text-muted-foreground">Powered by Razorpay</p>
        </div>
        
        <Card className="w-full bg-primary/5 border-2 border-primary/10">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="number">Card Number</Label>
                <div className="relative">
                  <Input
                    id="number"
                    name="number"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.number}
                    onChange={handleChange}
                    maxLength={16}
                    className="pl-10"
                    required
                  />
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Card Holder Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Smith"
                  value={cardDetails.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    name="expiry"
                    placeholder="MM/YY"
                    value={formatExpiry(cardDetails.expiry)}
                    onChange={handleChange}
                    maxLength={5}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    name="cvv"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={handleChange}
                    maxLength={3}
                    required
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    `Pay ${formatCurrency(amount)}`
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-4 text-sm text-muted-foreground text-center space-y-1">
          <p>Your card information is secure with Razorpay</p>
          <div className="flex justify-center space-x-2">
            <span>Secure Checkout</span>
            <span>•</span>
            <span>PCI DSS Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorpayIntegration;