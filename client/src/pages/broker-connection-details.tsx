import React, { useState, useEffect } from 'react';
import { useLocation, Link as RouterLink } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Shield,
  AlertTriangle,
  Link,
  ExternalLink,
  Check,
  RefreshCw,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/Header';
import type { BrokerConnection } from '@shared/schema';

interface BrokerField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
}

const BrokerConnectionDetails: React.FC = () => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [brokerId, setBrokerId] = useState<string>('');
  const [brokerName, setBrokerName] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  
  // Get the broker ID from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const broker = queryParams.get('broker');
    if (broker) {
      setBrokerId(broker);
      
      // Set broker display name based on ID
      const brokerDisplayNames: Record<string, string> = {
        'paper_trading': 'Paper Trading',
        'zerodha': 'Zerodha',
        'upstox': 'Upstox',
        'interactive_brokers': 'Interactive Brokers',
        'td_ameritrade': 'TD Ameritrade',
        'alpaca': 'Alpaca',
        'oanda': 'OANDA'
      };
      
      setBrokerName(brokerDisplayNames[broker] || broker);
    } else {
      // Redirect back to broker setup page if no broker was specified
      navigate('/broker-setup');
    }
  }, []);
  
  // Get the broker fields based on the broker ID
  const getBrokerFields = (): BrokerField[] => {
    const brokerFields: Record<string, BrokerField[]> = {
      'paper_trading': [
        {
          name: 'accountName',
          label: 'Account Name',
          type: 'text',
          required: true,
          description: 'Give your paper trading account a name (e.g., "Test Account")'
        },
        {
          name: 'initialCapital',
          label: 'Initial Capital',
          type: 'text',
          required: true,
          description: 'Starting capital for your paper trading account (in INR)'
        }
      ],
      'zerodha': [
        {
          name: 'userId',
          label: 'User ID',
          type: 'text',
          required: true,
          description: 'Your Zerodha user ID/client ID'
        },
        {
          name: 'apiKey',
          label: 'API Key',
          type: 'text',
          required: true,
          description: 'Your Zerodha Kite Connect API key'
        },
        {
          name: 'apiSecret',
          label: 'API Secret',
          type: 'password',
          required: true,
          description: 'Your Zerodha API secret'
        },
        {
          name: 'apiToken',
          label: 'Access Token',
          type: 'password',
          required: true,
          description: 'Your Zerodha access token (generated from Kite Connect)'
        }
      ],
      'upstox': [
        {
          name: 'apiKey',
          label: 'API Key',
          type: 'text',
          required: true,
          description: 'Your Upstox API key'
        },
        {
          name: 'apiSecret',
          label: 'API Secret',
          type: 'password',
          required: true,
          description: 'Your Upstox API secret'
        },
        {
          name: 'accessToken',
          label: 'Access Token',
          type: 'password',
          required: true,
          description: 'Your Upstox access token'
        },
        {
          name: 'accountId',
          label: 'Client ID',
          type: 'text',
          required: true,
          description: 'Your Upstox client ID'
        }
      ],
      'interactive_brokers': [
        {
          name: 'apiKey',
          label: 'API Key',
          type: 'text',
          required: true,
          description: 'Your Interactive Brokers API key'
        },
        {
          name: 'apiSecret',
          label: 'API Secret',
          type: 'password',
          required: true,
          description: 'Your Interactive Brokers API secret'
        },
        {
          name: 'accountId',
          label: 'Account ID',
          type: 'text',
          required: true,
          description: 'Your Interactive Brokers account identifier'
        }
      ],
      'td_ameritrade': [
        {
          name: 'apiKey',
          label: 'Consumer Key',
          type: 'text',
          required: true,
          description: 'Your TD Ameritrade developer consumer key'
        },
        {
          name: 'accountId',
          label: 'Account ID',
          type: 'text',
          required: true,
          description: 'Your TD Ameritrade account identifier'
        },
        {
          name: 'callbackUrl',
          label: 'Callback URL',
          type: 'text',
          required: true,
          description: 'OAuth callback URL registered with TD Ameritrade'
        }
      ],
      'alpaca': [
        {
          name: 'apiKey',
          label: 'API Key ID',
          type: 'text',
          required: true,
          description: 'Your Alpaca API key ID'
        },
        {
          name: 'apiSecret',
          label: 'API Secret Key',
          type: 'password',
          required: true,
          description: 'Your Alpaca API secret key'
        },
        {
          name: 'paperTrading',
          label: 'Paper Trading',
          type: 'checkbox',
          required: false,
          description: 'Use paper trading environment (for testing)'
        }
      ],
      'oanda': [
        {
          name: 'apiKey',
          label: 'API Key',
          type: 'text',
          required: true,
          description: 'Your OANDA API key'
        },
        {
          name: 'accountId',
          label: 'Account ID',
          type: 'text',
          required: true,
          description: 'Your OANDA account identifier'
        },
        {
          name: 'environment',
          label: 'Environment',
          type: 'select',
          required: true,
          description: 'Select practice or live environment'
        }
      ]
    };
    
    return brokerFields[brokerId] || [];
  };
  
  // Mutation for creating a broker connection
  const createConnectionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/broker-connections', data);
    },
    onSuccess: () => {
      toast({
        title: 'Connection created',
        description: `Successfully connected to ${brokerName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/broker-connections'] });
      
      // Redirect back to broker setup page
      navigate('/broker-setup');
    },
    onError: (error) => {
      toast({
        title: 'Connection failed',
        description: `Error: ${error}`,
        variant: 'destructive',
      });
      setIsConnecting(false);
    },
  });
  
  // Handle input changes in the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked.toString() : value,
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    
    // Validate required fields
    const brokerFields = getBrokerFields();
    const missingFields = brokerFields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label);
      
    if (missingFields.length > 0) {
      toast({
        title: 'Missing required fields',
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      setIsConnecting(false);
      return;
    }
    
    // Prepare data for API
    const connectionData = {
      broker: brokerName,
      ...formData,
      isActive: true,
    };
    
    createConnectionMutation.mutate(connectionData);
  };
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0">
      <Header
        title={`Connect to ${brokerName}`}
        description="Enter your API credentials to connect to the broker"
      />
      
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/broker-setup')}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Broker Setup
        </Button>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="font-bold mr-2">{brokerName}</span>
              Connection Setup
            </CardTitle>
            <CardDescription>
              Enter your {brokerName} API credentials to establish a connection. These credentials will be securely stored.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {getBrokerFields().map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name} className="font-medium">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <div>
                      {field.type === 'select' ? (
                        <select
                          id={field.name}
                          name={field.name}
                          className="w-full rounded-md border border-gray-300 px-3 py-2"
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          required={field.required}
                        >
                          <option value="">Select an option</option>
                          <option value="practice">Practice</option>
                          <option value="live">Live</option>
                        </select>
                      ) : field.type === 'checkbox' ? (
                        <div className="flex items-center">
                          <Switch 
                            id={field.name} 
                            checked={!!formData[field.name]} 
                            onCheckedChange={(checked) => setFormData({ ...formData, [field.name]: checked.toString() })}
                          />
                          <Label htmlFor={field.name} className="ml-2">{field.description}</Label>
                        </div>
                      ) : (
                        <Input
                          id={field.name}
                          name={field.name}
                          type={field.type}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          required={field.required}
                          placeholder={field.description}
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{field.description}</p>
                  </div>
                ))}
              </div>
              
              <Separator className="my-6" />
              
              <Alert className="my-4 bg-amber-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Security Notice</AlertTitle>
                <AlertDescription>
                  Your API credentials are encrypted and securely stored. We recommend using read-only access whenever possible.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end space-x-4 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/broker-setup')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex items-center"
                  disabled={isConnecting || createConnectionMutation.isPending}
                >
                  {(isConnecting || createConnectionMutation.isPending) ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between text-sm text-gray-500">
            <div>
              Need help? Visit the{' '}
              <a href="#" className="text-blue-600 hover:underline flex items-center inline-flex">
                API documentation <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default BrokerConnectionDetails;