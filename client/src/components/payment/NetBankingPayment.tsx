import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';

interface NetBankingPaymentProps {
  amount: number;
  onSuccess: () => void;
}

// List of major Indian banks for NetBanking
const BANKS = [
  { id: 'sbi', name: 'State Bank of India' },
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'icici', name: 'ICICI Bank' },
  { id: 'axis', name: 'Axis Bank' },
  { id: 'kotak', name: 'Kotak Mahindra Bank' },
  { id: 'idfc', name: 'IDFC First Bank' },
  { id: 'pnb', name: 'Punjab National Bank' },
  { id: 'bob', name: 'Bank of Baroda' },
  { id: 'yes', name: 'Yes Bank' },
];

const NetBankingPayment: React.FC<NetBankingPaymentProps> = ({ amount, onSuccess }) => {
  const { toast } = useToast();
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleProceed = () => {
    if (!selectedBank) {
      toast({
        title: "Select a bank",
        description: "Please select your bank to proceed",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    // In a real implementation, this would redirect to the bank's login page
    // For demo purposes, we'll simulate a successful payment after a delay
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
      toast({
        title: "Payment Successful",
        description: "Your NetBanking payment has been processed successfully!",
      });
    }, 2000);
  };
  
  return (
    <div className="flex flex-col items-center space-y-6">
      <Card className="w-full max-w-md p-4 bg-primary/5 border-2 border-primary/10">
        <CardContent className="pt-4">
          <div className="mb-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
            <p className="font-semibold text-lg">{formatCurrency(amount)}</p>
          </div>
          
          <div className="mb-6">
            <div className="text-sm font-medium mb-2">Select Your Bank</div>
            <RadioGroup 
              value={selectedBank} 
              onValueChange={setSelectedBank}
              className="grid grid-cols-1 gap-2"
            >
              {BANKS.map(bank => (
                <div 
                  key={bank.id}
                  className="flex items-center space-x-2 border rounded-md p-3 hover:bg-accent cursor-pointer"
                >
                  <RadioGroupItem value={bank.id} id={bank.id} />
                  <Label htmlFor={bank.id} className="flex-1 cursor-pointer">{bank.name}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleProceed}
            disabled={isProcessing || !selectedBank}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to Bank...
              </>
            ) : (
              "Proceed to NetBanking"
            )}
          </Button>
        </CardContent>
      </Card>
      
      <div className="text-sm text-muted-foreground text-center">
        <p>You will be redirected to your bank's secure login page</p>
        <p>All transactions are secured with 128-bit encryption</p>
      </div>
    </div>
  );
};

export default NetBankingPayment;