import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';

const TestPage = () => {
  const [healthResult, setHealthResult] = useState<string>('Results will appear here...');
  const [userResult, setUserResult] = useState<string>('Results will appear here...');
  const [stripeResult, setStripeResult] = useState<string>('Results will appear here...');
  const [wsResult, setWsResult] = useState<string>('Results will appear here...');
  const [apiResult, setApiResult] = useState<string>('Results will appear here...');
  const [symbol, setSymbol] = useState<string>('AAPL');
  const [isLoading, setIsLoading] = useState({
    health: false,
    user: false,
    stripe: false,
    websocket: false,
    api: false
  });

  const testHealthEndpoint = async () => {
    setIsLoading(prev => ({ ...prev, health: true }));
    try {
      const response = await fetch('/healthz');
      const text = await response.text();
      setHealthResult(JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        body: text
      }, null, 2));
    } catch (error: any) {
      setHealthResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, health: false }));
    }
  };

  const testUserEndpoint = async () => {
    setIsLoading(prev => ({ ...prev, user: true }));
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUserResult(JSON.stringify(data, null, 2));
      } else {
        setUserResult(JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          message: 'Failed to fetch user data. You may need to login first.'
        }, null, 2));
      }
    } catch (error: any) {
      setUserResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, user: false }));
    }
  };

  const testStripeEndpoint = async () => {
    setIsLoading(prev => ({ ...prev, stripe: true }));
    try {
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        amount: 19.99
      });
      const data = await response.json();
      setStripeResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setStripeResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, stripe: false }));
    }
  };

  const testApiStatus = async () => {
    setIsLoading(prev => ({ ...prev, api: true }));
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      setApiResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setApiResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, api: false }));
    }
  };

  const testWebSocket = () => {
    setIsLoading(prev => ({ ...prev, websocket: true }));
    try {
      // WebSocket URL logic
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}`;
      
      // Update the result with the connection attempt
      setWsResult(`Attempting to connect to ${wsUrl}...`);
      
      // Create WebSocket
      const ws = new WebSocket(wsUrl);
      
      // Connection opened
      ws.addEventListener('open', () => {
        setWsResult(prev => prev + '\nConnection established! Subscribing to ' + symbol);
        
        // Subscribe to the symbol
        ws.send(JSON.stringify({
          type: 'subscribe',
          symbol: symbol
        }));
      });
      
      // Listen for messages
      ws.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        setWsResult(prev => prev + '\nReceived: ' + JSON.stringify(data, null, 2));
      });
      
      // Handle errors
      ws.addEventListener('error', (error) => {
        setWsResult(prev => prev + '\nWebSocket Error: ' + JSON.stringify(error, null, 2));
      });
      
      // Connection closed
      ws.addEventListener('close', (event) => {
        setWsResult(prev => prev + `\nConnection closed (${event.code}): ${event.reason}`);
        setIsLoading(prev => ({ ...prev, websocket: false }));
      });
      
      // Cleanup function
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          setIsLoading(prev => ({ ...prev, websocket: false }));
        }
      }, 10000); // Close after 10 seconds
    } catch (error: any) {
      setWsResult(`Error: ${error.message}`);
      setIsLoading(prev => ({ ...prev, websocket: false }));
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold">API Test Page</h1>
      <p className="text-muted-foreground">Use this page to test the API endpoints</p>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Status</CardTitle>
            <CardDescription>Check the API status endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto h-32">
              {apiResult}
            </pre>
          </CardContent>
          <CardFooter>
            <Button onClick={testApiStatus} disabled={isLoading.api}>
              {isLoading.api ? 'Checking...' : 'Check API Status'}
            </Button>
          </CardFooter>
        </Card>
      
        <Card>
          <CardHeader>
            <CardTitle>WebSocket Test</CardTitle>
            <CardDescription>Test WebSocket connection and data streaming</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Input 
                  id="symbol" 
                  value={symbol} 
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="Enter stock symbol"
                  className="w-full"
                />
              </div>
              <pre className="bg-muted p-4 rounded-md overflow-auto h-32">
                {wsResult}
              </pre>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={testWebSocket} disabled={isLoading.websocket}>
              {isLoading.websocket ? 'Testing...' : 'Test WebSocket'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health Check</CardTitle>
            <CardDescription>Test the server health endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto h-32">
              {healthResult}
            </pre>
          </CardContent>
          <CardFooter>
            <Button onClick={testHealthEndpoint} disabled={isLoading.health}>
              {isLoading.health ? 'Testing...' : 'Test Health Endpoint'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Info</CardTitle>
            <CardDescription>Test the user info endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto h-32">
              {userResult}
            </pre>
          </CardContent>
          <CardFooter>
            <Button onClick={testUserEndpoint} disabled={isLoading.user}>
              {isLoading.user ? 'Testing...' : 'Get User Info'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stripe Payment Intent</CardTitle>
            <CardDescription>Test the Stripe payment intent endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto h-32">
              {stripeResult}
            </pre>
          </CardContent>
          <CardFooter>
            <Button onClick={testStripeEndpoint} disabled={isLoading.stripe}>
              {isLoading.stripe ? 'Testing...' : 'Create Payment Intent'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default TestPage;