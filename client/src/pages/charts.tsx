import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import useMarketDataWebSocket, { MarketDataItem as WSMarketDataItem } from '@/hooks/useMarketDataWebSocket';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import CandlestickChart from '@/components/charts/CandlestickChart';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import { sma, ema, bollingerBands, rsi } from '@/lib/indicators';

// Define available symbols and timeframes for dropdown menus
const AVAILABLE_SYMBOLS = [
  // Indian Indices
  { value: 'INDEX:NIFTY50', label: 'INDEX:NIFTY50 - NSE Nifty 50' },
  { value: 'INDEX:BANKNIFTY', label: 'INDEX:BANKNIFTY - NSE Bank Nifty' },
  { value: 'INDEX:FINNIFTY', label: 'INDEX:FINNIFTY - NSE Financial Services' },
  { value: 'INDEX:SENSEX', label: 'INDEX:SENSEX - BSE Sensex' },
  
  // Indian Stocks
  { value: 'NSE:RELIANCE', label: 'NSE:RELIANCE - Reliance Industries Ltd.' },
  { value: 'NSE:HDFCBANK', label: 'NSE:HDFCBANK - HDFC Bank Ltd.' },
  { value: 'NSE:TCS', label: 'NSE:TCS - Tata Consultancy Services Ltd.' },
  { value: 'NSE:INFY', label: 'NSE:INFY - Infosys Ltd.' },
  { value: 'NSE:ICICIBANK', label: 'NSE:ICICIBANK - ICICI Bank Ltd.' },
  
  // US Indices & Stocks
  { value: 'NASDAQ:QQQ', label: 'NASDAQ:QQQ - Invesco QQQ Trust' },
  { value: 'NYSE:SPY', label: 'NYSE:SPY - SPDR S&P 500 ETF Trust' },
  { value: 'NASDAQ:AAPL', label: 'NASDAQ:AAPL - Apple Inc.' },
  { value: 'NASDAQ:MSFT', label: 'NASDAQ:MSFT - Microsoft Corporation' },
  { value: 'NASDAQ:GOOG', label: 'NASDAQ:GOOG - Alphabet Inc.' },
  { value: 'NYSE:TSLA', label: 'NYSE:TSLA - Tesla Inc.' },
  
  // Forex & Crypto
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

// Define available indicators
const AVAILABLE_INDICATORS = [
  { value: 'sma', label: 'Simple Moving Average (SMA)' },
  { value: 'ema', label: 'Exponential Moving Average (EMA)' },
  { value: 'bollinger', label: 'Bollinger Bands' },
  { value: 'rsi', label: 'Relative Strength Index (RSI)' },
  { value: 'macd', label: 'MACD' },
];

interface MarketDataItem {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndicatorConfig {
  id: string;
  type: string;
  period: number;
  color: string;
  visible: boolean;
}

// Chart indicator types that the CandlestickChart component expects
type ChartIndicatorType = 'ma' | 'ema' | 'rsi' | 'bollinger';

// Chart indicator data structure
interface ChartIndicator {
  type: ChartIndicatorType;
  period?: number;
  color?: string;
  data: { time: string; value: number }[];
}

const Charts: React.FC = () => {
  const { toast } = useToast();
  
  // State for symbol and timeframe selection
  const [symbol, setSymbol] = useState('INDEX:NIFTY50');
  const [timeframe, setTimeframe] = useState('1d');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // State for indicators
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([
    { id: '1', type: 'sma', period: 20, color: '#3182CE', visible: true },
    { id: '2', type: 'sma', period: 50, color: '#805AD5', visible: true },
  ]);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('chart');
  
  // State for real-time data
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  
  // When symbol or timeframe changes, disable real-time updates to avoid confusion
  useEffect(() => {
    if (realtimeEnabled) {
      setRealtimeEnabled(false);
      disconnect();
      toast({
        title: "Real-time updates disabled",
        description: "Changing symbol or timeframe requires refresh",
      });
    }
  }, [symbol, timeframe]);
  
  // WebSocket connection for real-time data
  const { 
    isConnected, 
    latestData,
    error: wsError,
    connect,
    disconnect
  } = useMarketDataWebSocket({
    symbol,
    timeframe,
    onDataUpdate: (data) => {
      // Handle the incoming data update
      console.log('Real-time data update:', data);
    }
  });
  
  // Fetch market data
  const { data: marketData, isLoading, refetch } = useQuery({
    queryKey: [`/api/market-data`, { symbol, timeframe, start: startDate, end: endDate }],
    queryFn: async () => {
      const res = await fetch(`/api/market-data?symbol=${symbol}&timeframe=${timeframe}&start=${startDate}&end=${endDate}`);
      if (!res.ok) {
        throw new Error('Failed to fetch market data');
      }
      return res.json() as Promise<MarketDataItem[]>;
    },
  });
  
  // Format data for the candlestick chart
  const formatChartData = (data: MarketDataItem[]) => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      time: new Date(item.timestamp).toISOString().split('T')[0],
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
      volume: Number(item.volume),
    }));
  };
  
  // Calculate indicators for the chart
  const calculateIndicators = (data: MarketDataItem[]): ChartIndicator[] => {
    if (!data || data.length === 0) return [];
    
    return indicators.filter(ind => ind.visible).flatMap(indicator => {
      const prices = data.map(item => Number(item.close));
      const times = data.map(item => new Date(item.timestamp).toISOString().split('T')[0]);
      
      let indicatorData: { time: string; value: number }[] = [];
      
      switch (indicator.type) {
        case 'sma':
          const smaValues = sma(prices, indicator.period);
          indicatorData = times.map((time, i) => ({
            time,
            value: smaValues[i],
          })).filter(d => d.value !== null && d.value !== undefined);
          
          return [{
            type: 'ma', // Map sma to ma type which is expected by CandlestickChart
            data: indicatorData,
            color: indicator.color,
            period: indicator.period
          }];
          
        case 'ema':
          const emaValues = ema(prices, indicator.period);
          indicatorData = times.map((time, i) => ({
            time,
            value: emaValues[i],
          })).filter(d => d.value !== null && d.value !== undefined);
          
          return [{
            type: 'ema',
            data: indicatorData,
            color: indicator.color,
            period: indicator.period
          }];
          
        case 'bollinger':
          const { upper, middle, lower } = bollingerBands(prices, indicator.period);
          
          // Create bollinger bands data that will be rendered by the chart
          // Basic approach - send middle band as the main data
          indicatorData = times.map((time, i) => ({
            time, 
            value: middle[i],
          })).filter(d => d.value !== null && d.value !== undefined);
          
          return [{
            type: 'bollinger',
            data: indicatorData,
            color: indicator.color,
            period: indicator.period
          }];
          
        case 'rsi':
          const rsiValues = rsi(prices, indicator.period);
          indicatorData = times.map((time, i) => ({
            time,
            value: rsiValues[i],
          })).filter(d => d.value !== null && d.value !== undefined);
          
          return [{
            type: 'rsi',
            data: indicatorData,
            color: indicator.color,
            period: indicator.period
          }];
          
        default:
          return [];
      }
    });
  };
  
  // Add a new indicator
  const handleAddIndicator = () => {
    const newId = String(indicators.length + 1);
    setIndicators([
      ...indicators,
      { id: newId, type: 'sma', period: 20, color: '#3182CE', visible: true }
    ]);
  };
  
  // Update an indicator
  const handleUpdateIndicator = (id: string, field: string, value: string | number | boolean) => {
    setIndicators(indicators.map(indicator => 
      indicator.id === id ? { ...indicator, [field]: value } : indicator
    ));
  };
  
  // Remove an indicator
  const handleRemoveIndicator = (id: string) => {
    setIndicators(indicators.filter(indicator => indicator.id !== id));
  };
  
  // Format symbol name for display
  const formatSymbolName = (symbolValue: string) => {
    const symbol = AVAILABLE_SYMBOLS.find(s => s.value === symbolValue);
    return symbol ? symbol.label.split(' - ')[1] : symbolValue;
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Chart refreshed",
      description: "The latest market data has been loaded",
    });
  };
  
  // Format historical data from API
  const historicalData = marketData ? formatChartData(marketData) : [];
  const indicatorsData = marketData ? calculateIndicators(marketData) : [];
  
  // Combine historical data with real-time data if enabled
  const displayData = realtimeEnabled && latestData && historicalData.length > 0 ? 
    [...historicalData, {
      time: new Date(latestData.timestamp).toISOString().split('T')[0],
      open: latestData.open,
      high: latestData.high,
      low: latestData.low,
      close: latestData.close,
      volume: latestData.volume
    }] : 
    historicalData;
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0">
      <Header 
        title="Charts"
        description="Visualize market data and analyze price movements"
      />
      
      {/* Chart Controls */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="p-4 border-b border-neutral-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Symbol</label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a symbol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Indian Indices</SelectLabel>
                    {AVAILABLE_SYMBOLS.filter(s => s.value.startsWith('INDEX:')).map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Indian Stocks</SelectLabel>
                    {AVAILABLE_SYMBOLS.filter(s => s.value.startsWith('NSE:')).map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>US Stocks & ETFs</SelectLabel>
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
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Timeframe</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_TIMEFRAMES.map(tf => (
                    <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Start Date</label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">End Date</label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-neutral-200">
            <TabsList className="h-auto p-0 bg-transparent border-b-0">
              <TabsTrigger 
                value="chart" 
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Chart
              </TabsTrigger>
              <TabsTrigger 
                value="indicators" 
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Indicators
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Settings
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="chart" className="m-0 p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : displayData.length > 0 ? (
              <div className="p-4">
                <CandlestickChart
                  data={displayData}
                  height={500}
                  showVolume={true}
                  showGrid={true}
                  showLegend={true}
                  symbol={formatSymbolName(symbol)}
                  timeframe={timeframe}
                  indicators={indicatorsData}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <p className="text-neutral-500">No data available for the selected symbol and timeframe</p>
                <Button className="mt-4" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="indicators" className="m-0 p-0">
            <div className="p-4">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium">Technical Indicators</h3>
                <Button onClick={handleAddIndicator} size="sm">
                  Add Indicator
                </Button>
              </div>
              
              {indicators.length > 0 ? (
                <div className="space-y-4">
                  {indicators.map((indicator) => (
                    <div key={indicator.id} className="flex flex-col md:flex-row gap-4 p-4 border border-neutral-200 rounded-md">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                        <Select
                          value={indicator.type}
                          onValueChange={(val) => handleUpdateIndicator(indicator.id, 'type', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select indicator type" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_INDICATORS.map(ind => (
                              <SelectItem key={ind.value} value={ind.value}>
                                {ind.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="w-full md:w-32">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Period</label>
                        <Input
                          type="number"
                          min={1}
                          max={200}
                          value={indicator.period}
                          onChange={(e) => handleUpdateIndicator(indicator.id, 'period', parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div className="w-full md:w-32">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Color</label>
                        <Input
                          type="color"
                          value={indicator.color}
                          onChange={(e) => handleUpdateIndicator(indicator.id, 'color', e.target.value)}
                          className="h-10 p-1"
                        />
                      </div>
                      
                      <div className="flex items-end gap-2">
                        <div className="flex items-center h-10">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={indicator.visible}
                              onChange={(e) => handleUpdateIndicator(indicator.id, 'visible', e.target.checked)}
                              className="rounded border-neutral-300 text-primary focus:ring-primary"
                            />
                            <span>Visible</span>
                          </label>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleRemoveIndicator(indicator.id)}
                          className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-5 w-5" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500 mb-4">No indicators added yet</p>
                  <Button onClick={handleAddIndicator}>
                    Add Your First Indicator
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="m-0 p-0">
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Chart Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Real-time Updates
                  </label>
                  <div className="mt-1">
                    <label className="inline-flex items-center gap-2">
                      <Switch
                        checked={realtimeEnabled}
                        onCheckedChange={(checked) => {
                          setRealtimeEnabled(checked);
                          if (checked) {
                            toast({
                              title: "Real-time updates enabled",
                              description: "Chart will update as new data arrives",
                            });
                            connect();
                          } else {
                            toast({
                              title: "Real-time updates disabled",
                              description: "Chart will only update when manually refreshed",
                            });
                            disconnect();
                          }
                        }}
                      />
                      <span>Enable real-time market data updates</span>
                    </label>
                    {wsError && (
                      <p className="text-xs text-red-500 mt-1">
                        {wsError}
                      </p>
                    )}
                    {isConnected && (
                      <p className="text-xs text-green-500 mt-1">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Connected to WebSocket server
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Show Volume
                  </label>
                  <div className="mt-1">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={true}
                        className="rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      <span>Display volume bars</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Show Grid
                  </label>
                  <div className="mt-1">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={true}
                        className="rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      <span>Display grid lines</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Auto-scale Chart
                  </label>
                  <div className="mt-1">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={true}
                        className="rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      <span>Auto-fit price scale</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-neutral-50 rounded-md">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Connection Status</h4>
                <div className="flex items-center">
                  {isConnected ? (
                    <>
                      <Wifi className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-600">Connected to WebSocket server</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-5 w-5 text-neutral-400 mr-2" />
                      <span className="text-neutral-500">Disconnected</span>
                    </>
                  )}
                </div>
                {wsError && (
                  <p className="text-sm text-red-500 mt-2">
                    Error: {wsError}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Charts;