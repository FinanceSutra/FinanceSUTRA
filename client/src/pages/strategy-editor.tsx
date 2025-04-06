import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Save, ArrowLeft, Play, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import CodeEditor from '@/components/ui/editor';
import type { Strategy } from '@shared/schema';

// Define available symbols and timeframes for dropdown menus
const AVAILABLE_SYMBOLS = [
  { value: 'NASDAQ:QQQ', label: 'NASDAQ:QQQ - Invesco QQQ Trust' },
  { value: 'NYSE:SPY', label: 'NYSE:SPY - SPDR S&P 500 ETF Trust' },
  { value: 'NASDAQ:AAPL', label: 'NASDAQ:AAPL - Apple Inc.' },
  { value: 'NASDAQ:MSFT', label: 'NASDAQ:MSFT - Microsoft Corporation' },
  { value: 'NASDAQ:GOOG', label: 'NASDAQ:GOOG - Alphabet Inc.' },
  { value: 'NYSE:TSLA', label: 'NYSE:TSLA - Tesla Inc.' },
  { value: 'FOREX:EURUSD', label: 'FOREX:EURUSD - Euro/US Dollar' },
  { value: 'FOREX:GBPUSD', label: 'FOREX:GBPUSD - British Pound/US Dollar' },
  { value: 'FOREX:USDJPY', label: 'FOREX:USDJPY - US Dollar/Japanese Yen' },
  { value: 'CRYPTO:BTCUSD', label: 'CRYPTO:BTCUSD - Bitcoin/US Dollar' },
  { value: 'CRYPTO:ETHUSD', label: 'CRYPTO:ETHUSD - Ethereum/US Dollar' },
];

const AVAILABLE_TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
  { value: '1w', label: '1 Week' },
];

// Default Python code for a new strategy
const DEFAULT_CODE = `
class MACrossoverStrategy:
    def __init__(self, fast_period=12, slow_period=26):
        self.fast_period = fast_period
        self.slow_period = slow_period
        
    def generate_signals(self, data):
        """Generate trading signals based on moving average crossover."""
        
        data['fast_ma'] = data['close'].rolling(self.fast_period).mean()
        data['slow_ma'] = data['close'].rolling(self.slow_period).mean()
        
        data['signal'] = 0
        data.loc[data['fast_ma'] > data['slow_ma'], 'signal'] = 1    # Buy signal
        data.loc[data['fast_ma'] < data['slow_ma'], 'signal'] = -1   # Sell signal
        
        return data
    
    def backtest(self, data, initial_capital=10000):
        """Run backtest and calculate performance metrics."""
        
        signals = self.generate_signals(data)
        return self._calculate_returns(signals, initial_capital)
`;

const StrategyEditor: React.FC = () => {
  const { id } = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State for strategy form
  const [strategyName, setStrategyName] = useState('');
  const [strategyDescription, setStrategyDescription] = useState('');
  const [symbol, setSymbol] = useState('NASDAQ:QQQ');
  const [timeframe, setTimeframe] = useState('1d');
  const [isActive, setIsActive] = useState(false);
  const [code, setCode] = useState(DEFAULT_CODE);
  
  // Get strategy if editing an existing one
  const { data: strategy, isLoading: isLoadingStrategy } = useQuery({
    queryKey: [`/api/strategies/${id}`],
    enabled: !!id,
  });
  
  // Set form values when strategy loads
  useEffect(() => {
    if (strategy) {
      setStrategyName(strategy.name);
      setStrategyDescription(strategy.description || '');
      setSymbol(strategy.symbol);
      setTimeframe(strategy.timeframe);
      setIsActive(strategy.isActive);
      setCode(strategy.code);
    }
  }, [strategy]);
  
  // Create save strategy mutation
  const saveStrategyMutation = useMutation({
    mutationFn: async (data: Partial<Strategy>) => {
      if (id) {
        // Update existing strategy
        return apiRequest('PUT', `/api/strategies/${id}`, data);
      } else {
        // Create new strategy
        return apiRequest('POST', '/api/strategies', data);
      }
    },
    onSuccess: () => {
      toast({
        title: `Strategy ${id ? 'updated' : 'created'}`,
        description: `Your strategy has been successfully ${id ? 'updated' : 'created'}`,
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: [`/api/strategies/${id}`] });
      } else {
        // Redirect to strategies page after creating a new strategy
        setLocation('/strategies');
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save strategy: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleSaveStrategy = () => {
    if (!strategyName.trim()) {
      toast({
        title: "Error",
        description: "Strategy name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Strategy code is required",
        variant: "destructive",
      });
      return;
    }
    
    const strategyData = {
      name: strategyName,
      description: strategyDescription,
      symbol,
      timeframe,
      isActive,
      code,
    };
    
    saveStrategyMutation.mutate(strategyData);
  };
  
  // Run backtest handler (placeholder, actual implementation would be in the CodeEditor component)
  const handleRunBacktest = () => {
    toast({
      title: "Running backtest",
      description: "Your strategy is being tested against historical data",
    });
  };
  
  // Handle change in code
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };
  
  // Display loading state
  if (id && isLoadingStrategy) {
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/strategies')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="ml-4">
            <h1 className="text-2xl font-semibold text-neutral-900">
              {id ? 'Edit Strategy' : 'Create Strategy'}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {id ? 'Modify your existing trading strategy' : 'Design a new algorithmic trading strategy'}
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col md:flex-row space-y-2 md:space-y-0 space-x-0 md:space-x-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Settings2 className="w-4 h-4 mr-2" />
                Strategy Settings
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Strategy Settings</SheetTitle>
                <SheetDescription>
                  Configure your trading strategy parameters
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="strategy-name">Strategy Name</Label>
                  <Input
                    id="strategy-name"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    placeholder="MA Crossover Strategy"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="strategy-description">Description</Label>
                  <Textarea
                    id="strategy-description"
                    value={strategyDescription}
                    onChange={(e) => setStrategyDescription(e.target.value)}
                    placeholder="A simple moving average crossover strategy..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="symbol">Trading Symbol</Label>
                  <Select value={symbol} onValueChange={setSymbol}>
                    <SelectTrigger id="symbol">
                      <SelectValue placeholder="Select a symbol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Stocks & ETFs</SelectLabel>
                        {AVAILABLE_SYMBOLS.filter(s => s.value.startsWith('NASDAQ:') || s.value.startsWith('NYSE:')).map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Forex</SelectLabel>
                        {AVAILABLE_SYMBOLS.filter(s => s.value.startsWith('FOREX:')).map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Crypto</SelectLabel>
                        {AVAILABLE_SYMBOLS.filter(s => s.value.startsWith('CRYPTO:')).map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger id="timeframe">
                      <SelectValue placeholder="Select a timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_TIMEFRAMES.map(tf => (
                        <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="active-status">Active Status</Label>
                  <Switch
                    id="active-status"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <Button variant="outline" onClick={handleRunBacktest}>
            <Play className="w-4 h-4 mr-2" />
            Run Backtest
          </Button>
          
          <Button onClick={handleSaveStrategy} disabled={saveStrategyMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save Strategy
          </Button>
        </div>
      </div>
      
      {/* Strategy Editor */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-0">
          {/* Pass run and save handlers to the editor component */}
          <CodeEditor 
            value={code}
            onChange={handleCodeChange}
            language="python"
            height="600px"
            onRun={handleRunBacktest}
            onSave={handleSaveStrategy}
          />
        </div>
      </div>
    </div>
  );
};

export default StrategyEditor;
