import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Link,
  Key,
  Settings,
  Info,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Clock,
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
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/Header';
import type { BrokerConnection } from '@shared/schema';

interface BrokerInfo {
  id: string;
  name: string;
  logo: React.ReactNode;
  description: string;
  url: string;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
}

const BrokerSetupPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedBroker, setSelectedBroker] = useState<BrokerInfo | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  
  // Query for broker connections
  const { data: brokerConnections, isLoading: loadingConnections } = useQuery({
    queryKey: ['/api/broker-connections'],
  });
  
  // Mutation for creating a broker connection
  const createConnectionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/broker-connections', data);
    },
    onSuccess: () => {
      toast({
        title: 'Connection created',
        description: `Successfully connected to ${selectedBroker?.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/broker-connections'] });
      setConnectDialogOpen(false);
      setFormData({});
    },
    onError: (error) => {
      toast({
        title: 'Connection failed',
        description: `Error: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for deleting a broker connection
  const deleteConnectionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/broker-connections/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Connection removed',
        description: 'The broker connection has been successfully removed',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/broker-connections'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to remove connection: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for testing a broker connection
  const testConnectionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('POST', `/api/broker-connections/${id}/test`);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Connection test successful',
          description: 'Successfully connected to the broker API',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Connection test failed',
          description: data.message || 'Could not connect to the broker API',
          variant: 'destructive',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/broker-connections'] });
    },
    onError: (error) => {
      toast({
        title: 'Connection test failed',
        description: `Error: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  // List of available brokers
  const availableBrokers: BrokerInfo[] = [
    {
      id: 'paper_trading',
      name: 'Paper Trading',
      logo: <span className="font-bold text-blue-600">Paper Trading</span>,
      description: 'Simulate trading with virtual money in a risk-free environment. Perfect for testing strategies without real capital at risk.',
      url: '#',
      fields: [
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
      ]
    },
    // Indian Brokers
    {
      id: 'zerodha',
      name: 'Zerodha',
      logo: <span className="font-bold text-blue-600">Zerodha</span>,
      description: 'India\'s largest stock broker offering the lowest, most transparent brokerage rates in the industry.',
      url: 'https://zerodha.com',
      fields: [
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
      ]
    },
    {
      id: 'upstox',
      name: 'Upstox',
      logo: <span className="font-bold text-red-600">Upstox</span>,
      description: 'Online trading and investment platform for stocks, derivatives, currencies, commodities, and mutual funds.',
      url: 'https://upstox.com',
      fields: [
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
      ]
    },
    // International Brokers
    {
      id: 'interactive_brokers',
      name: 'Interactive Brokers',
      logo: <span className="font-bold text-neutral-700">Interactive Brokers</span>,
      description: 'Connect to Interactive Brokers to trade stocks, options, futures, forex and more.',
      url: 'https://www.interactivebrokers.com',
      fields: [
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
      ]
    },
    {
      id: 'td_ameritrade',
      name: 'TD Ameritrade',
      logo: <span className="font-bold text-neutral-700">TD Ameritrade</span>,
      description: 'Connect to TD Ameritrade to access their wide range of trading instruments.',
      url: 'https://www.tdameritrade.com',
      fields: [
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
      ]
    },
    {
      id: 'alpaca',
      name: 'Alpaca',
      logo: <span className="font-bold text-neutral-700">Alpaca</span>,
      description: 'Connect to Alpaca for commission-free stock trading API.',
      url: 'https://alpaca.markets',
      fields: [
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
      ]
    },
    {
      id: 'oanda',
      name: 'OANDA',
      logo: <span className="font-bold text-neutral-700">OANDA</span>,
      description: 'Connect to OANDA for forex and CFD trading.',
      url: 'https://www.oanda.com',
      fields: [
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
    }
  ];
  
  // Find active connections
  const getActiveConnection = (brokerId: string) => {
    if (!brokerConnections) return null;
    return brokerConnections.find((conn: BrokerConnection) => conn.broker.toLowerCase() === brokerId.toLowerCase());
  };
  
  // Handle input changes in the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  // Handle connect button click
  const handleConnect = (broker: BrokerInfo) => {
    setSelectedBroker(broker);
    setFormData({});
    setConnectDialogOpen(true);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBroker) return;
    
    // Validate required fields
    const missingFields = selectedBroker.fields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label);
      
    if (missingFields.length > 0) {
      toast({
        title: 'Missing required fields',
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }
    
    // Prepare data for API
    const connectionData = {
      broker: selectedBroker.name,
      ...formData,
      isActive: true,
    };
    
    createConnectionMutation.mutate(connectionData);
  };
  
  if (loadingConnections) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0">
      <Header
        title="Broker Setup"
        description="Connect to trading brokers to execute your strategies"
      />
      
      <div className="mb-8">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            Connect your broker to start trading with real accounts. These connections are securely stored and can be managed at any time.
          </AlertDescription>
        </Alert>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {availableBrokers.map(broker => {
          const activeConnection = getActiveConnection(broker.id);
          const isConnected = !!activeConnection;
          
          return (
            <Card key={broker.id} className={`
              border
              ${isConnected ? 'border-primary' : 'border-neutral-200'}
              rounded-lg p-5 hover:border-primary transition-colors
              flex flex-col justify-between
            `}>
              <div>
                <div className="w-32 h-12 mb-4 bg-neutral-100 rounded flex items-center justify-center relative">
                  {broker.logo}
                  {isConnected && (
                    <div className="absolute top-0 right-0 bg-success rounded-full w-3 h-3 transform translate-x-1/2 -translate-y-1/2"></div>
                  )}
                </div>
                <p className="text-neutral-600 text-sm mb-4">{broker.description}</p>
                {isConnected && (
                  <div className="flex items-center mb-4">
                    {activeConnection.status === 'connected' && (
                      <Badge variant="outline" className="flex items-center bg-green-100 text-green-800">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                    {activeConnection.status === 'failed' && (
                      <Badge variant="destructive" className="flex items-center">
                        <ShieldAlert className="h-3 w-3 mr-1" />
                        Connection Failed
                      </Badge>
                    )}
                    {activeConnection.status === 'pending' && (
                      <Badge variant="secondary" className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {!activeConnection.status && (
                      <Badge className="flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        Status Unknown
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              {isConnected ? (
                <div className="space-y-2">
                  <div className="text-xs text-neutral-500">
                    <p>Account ID: {activeConnection.accountId || 'Not specified'}</p>
                    {activeConnection.lastConnected ? (
                      <p>Last connected: {new Date(activeConnection.lastConnected).toLocaleString()}</p>
                    ) : (
                      <p>Last connected: Never</p>
                    )}
                    <p>Environment: {activeConnection.environment || 'Live'}</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      disabled={testConnectionMutation.isPending}
                      onClick={() => testConnectionMutation.mutate(activeConnection.id)}
                    >
                      {testConnectionMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-1" />
                      )}
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      disabled={deleteConnectionMutation.isPending}
                      onClick={() => deleteConnectionMutation.mutate(activeConnection.id)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => handleConnect(broker)}
                  className="mt-4 w-full"
                  variant="outline"
                >
                  Connect
                </Button>
              )}
            </Card>
          );
        })}
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Broker Connection FAQ</CardTitle>
            <CardDescription>
              Common questions about connecting to brokers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How secure are my API keys?</AccordionTrigger>
                <AccordionContent>
                  Your API keys are securely encrypted and stored. We use industry-standard security practices to ensure your credentials are protected. We never store API secrets in plaintext.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>What permissions do I need to grant?</AccordionTrigger>
                <AccordionContent>
                  For automated trading, you need to grant read and trade permissions. For security reasons, we recommend not granting withdrawal permissions unless absolutely necessary.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>What is paper trading?</AccordionTrigger>
                <AccordionContent>
                  Paper trading allows you to simulate trades in a risk-free environment using virtual currency. It's perfect for testing strategies without risking real money.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>How do I generate API keys for my broker?</AccordionTrigger>
                <AccordionContent>
                  <p>For Indian brokers:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <span className="font-semibold">Zerodha:</span> 
                      <a href="https://kite.zerodha.com/settings/api" target="_blank" rel="noopener noreferrer" className="text-primary ml-1 inline-flex items-center">
                        Visit Kite Connect dashboard <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </li>
                    <li>
                      <span className="font-semibold">Upstox:</span> 
                      <a href="https://upstox.com/developer/login" target="_blank" rel="noopener noreferrer" className="text-primary ml-1 inline-flex items-center">
                        Visit Upstox developer portal <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </li>
                  </ul>
                  <p className="mt-2">For international brokers:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <span className="font-semibold">Interactive Brokers:</span> 
                      <a href="https://www.interactivebrokers.com/en/software/am/am/manageaccount/capoptions.htm" target="_blank" rel="noopener noreferrer" className="text-primary ml-1 inline-flex items-center">
                        Visit IBKR account management <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </li>
                    <li>
                      <span className="font-semibold">Alpaca:</span> 
                      <a href="https://app.alpaca.markets/paper/dashboard/overview" target="_blank" rel="noopener noreferrer" className="text-primary ml-1 inline-flex items-center">
                        Visit Alpaca dashboard <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect to {selectedBroker?.name}</DialogTitle>
            <DialogDescription>
              Enter your broker credentials to connect your account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {selectedBroker?.fields.map(field => (
                <div key={field.name} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={field.name} className="text-right">
                    {field.label}
                  </Label>
                  <div className="col-span-3">
                    {field.type === 'select' ? (
                      <Select onValueChange={(value) => setFormData({ ...formData, [field.name]: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {field.name === 'environment' && (
                            <>
                              <SelectItem value="paper">Paper Trading</SelectItem>
                              <SelectItem value="live">Live Trading</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
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
                </div>
              ))}
              
              <div className="col-span-4">
                <Alert variant="warning" className="bg-amber-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Security Notice</AlertTitle>
                  <AlertDescription>
                    Your API credentials are encrypted and securely stored. We recommend using read-only access whenever possible.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setConnectDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createConnectionMutation.isPending}>
                {createConnectionMutation.isPending ? 'Connecting...' : 'Connect'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrokerSetupPage;