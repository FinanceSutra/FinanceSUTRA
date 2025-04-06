import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';

interface UpiPaymentProps {
  amount: number;
  upiId: string;
  onSuccess: () => void;
}

const UpiPayment: React.FC<UpiPaymentProps> = ({ amount, upiId, onSuccess }) => {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Generate the UPI payment link
  const upiPaymentString = `upi://pay?pa=${upiId}&pn=FinanceSUTRA&am=${amount}&cu=INR&tn=FinanceSUTRA Payment`;
  
  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast({
      title: "UPI ID Copied",
      description: "UPI ID has been copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 3000);
  };
  
  const verifyPayment = () => {
    setIsVerifying(true);
    
    // In a real implementation, this would call an API to verify the payment
    // For demo purposes, we'll simulate a successful payment after a delay
    setTimeout(() => {
      setIsVerifying(false);
      onSuccess();
      toast({
        title: "Payment Verified",
        description: "Your payment has been successfully verified!",
      });
    }, 2000);
  };
  
  return (
    <div className="flex flex-col items-center space-y-6">
      <Card className="w-full max-w-md p-4 bg-primary/5 border-2 border-primary/10">
        <CardContent className="pt-4 flex flex-col items-center">
          <QRCodeSVG 
            value={upiPaymentString}
            size={200}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"L"}
            includeMargin={false}
          />
          
          <div className="my-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Scan QR with any UPI app</p>
            <p className="font-semibold text-lg">{formatCurrency(amount)}</p>
          </div>
          
          <div className="w-full flex items-center justify-center space-x-2 mt-2">
            <div className="flex-1 p-2 border rounded-md bg-background text-center truncate">
              {upiId}
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={copyUpiId}
              title="Copy UPI ID"
              className="shrink-0"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="mt-6 space-y-2 w-full">
            <p className="text-sm text-center mb-2">
              After completing payment in your UPI app, click the button below
            </p>
            <Button 
              className="w-full" 
              onClick={verifyPayment}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Payment...
                </>
              ) : (
                "I've Paid"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-sm text-muted-foreground space-y-1 text-center">
        <p className="font-medium">Supported UPI Apps:</p>
        <div className="flex justify-center space-x-4">
          <span>Google Pay</span>
          <span>PhonePe</span>
          <span>Paytm</span>
          <span>BHIM</span>
          <span>Other UPI apps</span>
        </div>
      </div>
    </div>
  );
};

export default UpiPayment;