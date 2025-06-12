import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Save, ArrowLeft } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Strategy } from '@shared/schema';
import Header from '@/components/layout/Header';

// Define available symbols and timeframes for dropdown menus
const AVAILABLE_SYMBOLS = [
  { value: 'NASDAQ:QQQ', label: 'NASDAQ:QQQ - Invesco QQQ Trust' },
  { value: 'NYSE:SPY', label: 'NYSE:SPY - SPDR S&P 500 ETF Trust' },
  { value: 'INDEX:NIFTY', label: 'INDEX:NIFTY - Nifty 50 Index' },
  { value: 'INDEX:BANKNIFTY', label: 'INDEX:BANKNIFTY - Bank Nifty Index' },
  { value: 'INDEX:SPX', label: 'INDEX:SPX - S&P 500 Index' },
  { value: 'INDEX:NDX', label: 'INDEX:NDX - Nasdaq 100 Index' },
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

const STRATEGY_TEMPLATES = [
  { 
    id: 'moving_average',
    name: 'Moving Average Crossover', 
    description: 'A strategy that generates buy signals when a fast moving average crosses above a slow moving average, and sell signals when the fast moving average crosses below the slow moving average.',
    parameters: [
      { name: 'fastPeriod', label: 'Fast Period', type: 'number', default: 12 },
      { name: 'slowPeriod', label: 'Slow Period', type: 'number', default: 26 }
    ]
  },
  { 
    id: 'rsi',
    name: 'RSI Oscillator', 
    description: 'A strategy based on the Relative Strength Index (RSI) indicator. It generates buy signals when RSI falls below an oversold level and sell signals when RSI rises above an overbought level.',
    parameters: [
      { name: 'period', label: 'RSI Period', type: 'number', default: 14 },
      { name: 'overbought', label: 'Overbought Level', type: 'number', default: 70 },
      { name: 'oversold', label: 'Oversold Level', type: 'number', default: 30 }
    ]
  },
  { 
    id: 'bollinger',
    name: 'Bollinger Bands', 
    description: 'A strategy that uses Bollinger Bands to identify overbought and oversold conditions. It generates buy signals when the price touches the lower band and sell signals when the price touches the upper band.',
    parameters: [
      { name: 'period', label: 'Period', type: 'number', default: 20 },
      { name: 'deviations', label: 'Standard Deviations', type: 'number', default: 2 }
    ]
  },
  {
    id: 'options_straddle',
    name: 'Options Straddle Strategy',
    description: 'An options strategy for index derivatives that simultaneously sells at-the-money (ATM) put and call options. Opens 5 minutes after market open and closes 15 minutes before market close with a 40% stop-loss on each leg.',
    parameters: [
      { name: 'quantity', label: 'Quantity (Lots)', type: 'number', default: 1 },
      { name: 'stopLossPercent', label: 'Stop Loss (%)', type: 'number', default: 40 },
      { name: 'entryDelayMins', label: 'Entry Delay (mins after open)', type: 'number', default: 5 },
      { name: 'exitBeforeCloseMins', label: 'Exit Before Close (mins)', type: 'number', default: 15 }
    ]
  }
];

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

const CreateStrategy: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State for strategy form
  const [strategyName, setStrategyName] = useState('');
  const [strategyDescription, setStrategyDescription] = useState('');
  const [symbol, setSymbol] = useState('NASDAQ:QQQ');
  const [timeframe, setTimeframe] = useState('1d');
  const [isActive, setIsActive] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [parameters, setParameters] = useState<Record<string, string>>({});
  
  // Create save strategy mutation
  const saveStrategyMutation = useMutation({
    mutationFn: async (data: Partial<Strategy>) => {
      try {
        // Save to frontend API
        // const frontendResponse = await apiRequest('POST', '/api/strategies', data);
        // const frontendData = await frontendResponse.json();
       
        try {
          // Save to backend API
          console.dir(data);
          const backendResponse = await apiRequest('POST', 'http://localhost:8080/strategies', data);
          const backendData = await backendResponse.json();

          // Return both responses
          return {
            // frontend: frontendData,
            backend: backendData,
            success: true
          };
        } catch (backendError) {
          console.error('Backend save failed:', backendError);
          // If backend fails, still return frontend data but mark partial success
          return {
            // frontend: frontendData,
            success: 'partial',
            error: 'Backend save failed'
          };
        }
      } catch (error) {
        console.error('Strategy save failed:', error);
        throw new Error('Failed to save strategy: ' + (error as Error).message);
      }
    },
    onSuccess: (data) => {
      if (data.success === 'partial') {
        toast({
          title: 'Strategy partially saved',
          description: 'Strategy was saved to frontend but backend save failed. Some features may be limited.',
          variant: "destructive"
        });
      } else {
        toast({
          title: 'Strategy created',
          description: 'Your strategy has been successfully created and saved',
        });
      }
      
      // Invalidate all strategy-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      
      // Redirect to strategies page after creating a new strategy
      setLocation('/strategies');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save strategy: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    // Initialize parameters for the selected template
    const template = STRATEGY_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      const initialParams: Record<string, string> = {};
      template.parameters.forEach(param => {
        initialParams[param.name] = param.default.toString();
      });
      setParameters(initialParams);
      
      // Set strategy name based on template
      if (!strategyName) {
        setStrategyName(`${template.name} Strategy`);
      }
      
      // Set strategy description if empty
      if (!strategyDescription) {
        setStrategyDescription(template.description);
      }
      
      // Set appropriate symbol for specific strategies
      if (templateId === 'options_straddle') {
        setSymbol('INDEX:NIFTY');
        setTimeframe('5m');
      }
    }
  };
  
  // Handle parameter change
  const handleParameterChange = (paramName: string, value: string) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };
  
  // Handle form submission
  const handleCreateStrategy = () => {
    if (!strategyName.trim()) {
      toast({
        title: "Error",
        description: "Strategy name is required",
        variant: "destructive",
      });
      
    }
    
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a strategy template",
        variant: "destructive",
      });
// const strategyData = {
//         strategyName,
//         strategyDescription,
//         symbol,
//         timeframe,
//         // quantity,
//         // stopLoss,
//         // entryDelay,
//         // exitBeforeClose,
//         template: selectedTemplate,
//         parameters,
//         isActive,
//       };
//       console.log(strategyData);

      return;
    }
    
    // Generate template-specific code based on the selected template and parameters
    let finalCode = DEFAULT_CODE;
    const template = STRATEGY_TEMPLATES.find(t => t.id === selectedTemplate);
    
    if (template) {
      // Generate code based on template type and parameters
      if (selectedTemplate === 'moving_average') {
        const fastPeriod = parameters['fastPeriod'] || '12';
        const slowPeriod = parameters['slowPeriod'] || '26';
        
        finalCode = `
class MACrossoverStrategy:
    def __init__(self, fast_period=${fastPeriod}, slow_period=${slowPeriod}):
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
      } else if (selectedTemplate === 'rsi') {
        const period = parameters['period'] || '14';
        const overbought = parameters['overbought'] || '70';
        const oversold = parameters['oversold'] || '30';
        
        finalCode = `
class RSIOscillatorStrategy:
    def __init__(self, rsi_period=${period}, overbought=${overbought}, oversold=${oversold}):
        self.rsi_period = rsi_period
        self.overbought = overbought
        self.oversold = oversold
        
    def generate_signals(self, data):
        """Generate trading signals based on RSI values."""
        
        # Calculate RSI
        delta = data['close'].diff()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        
        avg_gain = gain.rolling(window=self.rsi_period).mean()
        avg_loss = loss.rolling(window=self.rsi_period).mean()
        
        rs = avg_gain / avg_loss
        data['rsi'] = 100 - (100 / (1 + rs))
        
        # Generate signals
        data['signal'] = 0
        data.loc[data['rsi'] < self.oversold, 'signal'] = 1  # Buy signal
        data.loc[data['rsi'] > self.overbought, 'signal'] = -1  # Sell signal
        
        return data
    
    def backtest(self, data, initial_capital=10000):
        """Run backtest and calculate performance metrics."""
        
        signals = self.generate_signals(data)
        return self._calculate_returns(signals, initial_capital)
`;
      } else if (selectedTemplate === 'bollinger') {
        const period = parameters['period'] || '20';
        const deviations = parameters['deviations'] || '2';
        
        finalCode = `
class BollingerBandsStrategy:
    def __init__(self, period=${period}, deviations=${deviations}):
        self.period = period
        self.deviations = deviations
        
    def generate_signals(self, data):
        """Generate trading signals based on Bollinger Bands."""
        
        # Calculate Bollinger Bands
        data['sma'] = data['close'].rolling(window=self.period).mean()
        data['std'] = data['close'].rolling(window=self.period).std()
        data['upper_band'] = data['sma'] + (data['std'] * self.deviations)
        data['lower_band'] = data['sma'] - (data['std'] * self.deviations)
        
        # Generate signals
        data['signal'] = 0
        data.loc[data['close'] < data['lower_band'], 'signal'] = 1  # Buy signal
        data.loc[data['close'] > data['upper_band'], 'signal'] = -1  # Sell signal
        
        return data
    
    def backtest(self, data, initial_capital=10000):
        """Run backtest and calculate performance metrics."""
        
        signals = self.generate_signals(data)
        return self._calculate_returns(signals, initial_capital)
`;
      } else if (selectedTemplate === 'options_straddle') {
        const quantity = parameters['quantity'] || '1';
        const stopLossPercent = parameters['stopLossPercent'] || '40';
        const entryDelayMins = parameters['entryDelayMins'] || '5';
        const exitBeforeCloseMins = parameters['exitBeforeCloseMins'] || '15';
        
        finalCode = `
class OptionsStraddleStrategy:
    def __init__(self, quantity=${quantity}, stop_loss_percent=${stopLossPercent}, entry_delay_mins=${entryDelayMins}, exit_before_close_mins=${exitBeforeCloseMins}):
        self.quantity = quantity
        self.stop_loss_percent = stop_loss_percent
        self.entry_delay_mins = entry_delay_mins
        self.exit_before_close_mins = exit_before_close_mins
        
    def generate_signals(self, data):
        """Generate trading signals for options straddle strategy."""
        # This is a simplified version of a straddle strategy
        # In a real implementation, this would handle options chains
        # and calculate strikes, premiums, etc.
        
        # Mark market open and close times
        market_open_time = 9 * 60 + 15  # 9:15 AM in minutes
        market_close_time = 15 * 60 + 30  # 3:30 PM in minutes
        
        # Convert timestamp to minutes since midnight
        data['time_mins'] = data['timestamp'].dt.hour * 60 + data['timestamp'].dt.minute
        
        # Entry and exit times
        entry_time = market_open_time + self.entry_delay_mins
        exit_time = market_close_time - self.exit_before_close_mins
        
        # Generate signals
        data['signal'] = 0
        
        # Entry signal at specified time after open
        data.loc[data['time_mins'] == entry_time, 'signal'] = 1
        
        # Exit signal at specified time before close
        data.loc[data['time_mins'] == exit_time, 'signal'] = -1
        
        return data
    
    def backtest(self, data, initial_capital=10000):
        """Run backtest for options straddle strategy."""
        signals = self.generate_signals(data)
        # Implementation of _calculate_returns would track:
        # - Entry prices for both legs
        # - Stop losses for each leg
        # - P&L calculations
        return self._calculate_returns(signals, initial_capital)
`;
      }
    }
    
    // Prepare the strategy data to be saved
    const strategyData = {
      name: strategyName,
      description: strategyDescription,
      symbol,
      timeframe,
      isActive,
      code: finalCode,
    };
    
    saveStrategyMutation.mutate(strategyData);
  };
  
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
              Create Strategy
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Create a new algorithmic trading strategy using our templates
            </p>
          </div>
        </div>

      </div>
      
      {/* Strategy Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Strategy details */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Details</CardTitle>
              <CardDescription>Basic information about your strategy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  rows={4}
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
                      <SelectLabel>Indices</SelectLabel>
                      {AVAILABLE_SYMBOLS.filter(s => s.value.startsWith('INDEX:')).map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectGroup>
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
              
              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="active-status">Activate strategy</Label>
                <Switch
                  id="active-status"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column: Strategy template and parameters */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Template</CardTitle>
              <CardDescription>Select a pre-built strategy template</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {STRATEGY_TEMPLATES.map(template => (
                  <div 
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-primary hover:shadow-sm ${
                      selectedTemplate === template.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-neutral-200'
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-neutral-500 mt-1 line-clamp-3">{template.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Strategy Parameters</CardTitle>
                <CardDescription>
                  Customize the parameters for your {
                    STRATEGY_TEMPLATES.find(t => t.id === selectedTemplate)?.name
                  } strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {STRATEGY_TEMPLATES.find(t => t.id === selectedTemplate)?.parameters.map(param => (
                    <div key={param.name} className="space-y-2">
                      <Label htmlFor={param.name}>{param.label}</Label>
                      <Input
                        id={param.name}
                        type={param.type}
                        value={parameters[param.name] || param.default}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
         <div className="mt-4 md:mt-0 flex justify-center col-span-1 lg:col-start-2">
          <Button 
            onClick={handleCreateStrategy} 
            disabled={saveStrategyMutation.isPending || !selectedTemplate}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Strategy
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateStrategy;