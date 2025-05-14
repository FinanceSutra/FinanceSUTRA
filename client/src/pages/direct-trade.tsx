import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, ChevronDown, ChevronUp, Settings, ZoomIn, ZoomOut, Maximize2, BarChart2, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMarketData } from '@/hooks/useMarketData';
import useMarketDataWebSocket from '@/hooks/useMarketDataWebSocket';
import Header from '@/components/layout/Header';
import LightweightCandlestickChart from '@/components/charts/LightweightCandlestickChart';
import { formatCurrency } from '@/lib/formatters';
import PsychologyInsightsPanel from '@/components/trading-psychology/PsychologyInsightsPanel';
import { determineMarketCondition, MarketCondition } from '@/lib/market-condition';
import { getMockTrades, Trade } from '@/lib/mock-trade-data';

// Available timeframes for the chart
const TIMEFRAMES = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1D' },
  { value: '1wk', label: '1W' },
  { value: '1mo', label: '1M' }
];

// Available market symbols (Indian markets focused)
const AVAILABLE_SYMBOLS = [
  // Indian Indices
  { value: 'INDEX:NIFTY50', label: 'NIFTY 50' },
  { value: 'INDEX:BANKNIFTY', label: 'NIFTY BANK' },
  { value: 'INDEX:FINNIFTY', label: 'NIFTY FIN SERVICE' },
  { value: 'INDEX:SENSEX', label: 'BSE SENSEX' },
  
  // Indian Futures/Options
  { value: 'NSE:NIFTY-FUT', label: 'NIFTY FUT' },
  { value: 'NSE:BANKNIFTY-FUT', label: 'BANKNIFTY FUT' },
  { value: 'NSE:NIFTY-OPT', label: 'NIFTY OPT' },
  
  // Indian Stocks
  { value: 'NSE:RELIANCE', label: 'Reliance Industries' },
  { value: 'NSE:TCS', label: 'Tata Consultancy Services' },
  { value: 'NSE:HDFCBANK', label: 'HDFC Bank' },
  { value: 'NSE:INFY', label: 'Infosys' },
  { value: 'NSE:ICICIBANK', label: 'ICICI Bank' },
  { value: 'NSE:HINDUNILVR', label: 'Hindustan Unilever' }
];

// Import chart indicator type from the chart component
import { ChartIndicator } from '@/components/charts/LightweightCandlestickChart';

interface ChartBarData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const getTimeframeLabel = (value: string): string => {
  const found = TIMEFRAMES.find(t => t.value === value);
  return found ? found.label : value;
};

const DirectTrade: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('chart');
  
  // State for symbol and timeframe selection
  const [symbol, setSymbol] = useState('INDEX:NIFTY50');
  const [timeframe, setTimeframe] = useState('1d');
  
  // Psychology insights panel state
  const [showPsychologyPanel, setShowPsychologyPanel] = useState(true);
  const [marketCondition, setMarketCondition] = useState<MarketCondition>('neutral');
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  
  // Trade execution state
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<number>(0);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  
  // Fetch market data using custom hook
  const {
    data: marketData,
    isLoading,
    refetch
  } = useMarketData(symbol, timeframe);
  
  // Initialize WebSocket connection for real-time updates
  const {
    connect,
    disconnect,
    isConnected,
    latestPrice,
    error: wsError
  } = useMarketDataWebSocket({
    symbol,
    onConnect: () => {
      toast({
        title: "WebSocket Connected",
        description: "You are now receiving real-time market data",
      });
    },
    onDisconnect: () => {},
    onError: (error: Error) => {
      toast({
        title: "WebSocket Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update price when latest data is received
  useEffect(() => {
    if (marketData && marketData.length > 0) {
      const lastBar = marketData[marketData.length - 1];
      setPrice(parseFloat(lastBar.close));
    }
  }, [marketData]);
  
  // Update price when real-time data is received
  useEffect(() => {
    if (latestPrice) {
      setPrice(latestPrice);
    }
  }, [latestPrice]);
  
  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);
  
  // Default indicators for the chart
  const indicatorsData: ChartIndicator[] = [
    {
      type: 'ma',
      period: 20,
      color: '#3182CE',
      data: []
    },
    {
      type: 'ma',
      period: 50,
      color: '#805AD5',
      data: []
    }
  ];
  
  // Prepare display data with fallback
  const displayData = marketData ? 
    marketData.map((item: any) => ({
      time: new Date(item.timestamp).toISOString(),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: item.volume ? parseFloat(item.volume) : 0
    })) : 
    [];
    
  // Cleanup WebSocket connection on unmount
  useEffect(() => {
    connect(); // Connect automatically
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  // Update market condition based on price data
  useEffect(() => {
    if (displayData.length > 0) {
      // Convert display data to format expected by market condition function
      const priceData = displayData.map((bar: ChartBarData) => ({
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
        time: bar.time
      }));
      
      // Determine market condition based on price data
      const condition = determineMarketCondition(priceData);
      setMarketCondition(condition);
    }
  }, [displayData]);
  
  // Generate mock trades for the current symbol
  useEffect(() => {
    const mockTrades = getMockTrades(symbol, 10);
    setRecentTrades(mockTrades);
  }, [symbol]);
  
  // Execute buy order
  const executeBuy = () => {
    toast({
      title: "Buy Order Placed",
      description: `Bought ${quantity} units of ${symbol} @ ${formatCurrency(price)}`,
    });
  };
  
  // Execute sell order
  const executeSell = () => {
    toast({
      title: "Sell Order Placed",
      description: `Sold ${quantity} units of ${symbol} @ ${formatCurrency(price)}`,
    });
  };

  // Get current market status 
  const getMarketStatus = () => {
    // In a real app, this would check if markets are open
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();
    
    // Simplified check for Indian markets (9:15 AM to 3:30 PM, Monday to Friday)
    if (currentDay >= 1 && currentDay <= 5 && currentHour >= 9 && currentHour < 16) {
      return "open";
    }
    return "closed";
  };

  const formatSymbolDisplay = (sym: string): string => {
    if (sym.includes(':')) {
      const parts = sym.split(':');
      const ticker = parts[1];
      
      // Handle special cases
      if (ticker === 'NIFTY50') return 'NIFTY';
      if (ticker === 'BANKNIFTY') return 'BANK NIFTY';
      
      return ticker;
    }
    return sym;
  };

  // Get current price data for display
  const getCurrentPriceData = () => {
    if (displayData.length === 0) return { price: 0, change: 0, changePercent: 0 };
    
    const lastBar = displayData[displayData.length - 1];
    const previousBar = displayData.length > 1 ? displayData[displayData.length - 2] : null;
    
    const currentPrice = lastBar.close;
    const previousPrice = previousBar ? previousBar.close : lastBar.open;
    const change = currentPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;
    
    return {
      price: currentPrice,
      change,
      changePercent
    };
  };

  const priceData = getCurrentPriceData();
  const isPriceUp = priceData.change >= 0;

  return (
    <div className="py-4 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0">
      <Header 
        title="Direct Trade"
        description="Place orders directly in the market"
      />
      
      <Tabs defaultValue="chart" className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="option-chain">Option Chain</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="text-sm bg-neutral-100 py-1 px-2 rounded">
              <span className="font-medium">{formatSymbolDisplay(symbol)}</span> 
              <span className="ml-2 text-xs text-neutral-500">
                {getTimeframeLabel(timeframe)}
              </span>
            </div>
            
            <div className="flex items-center">
              <span className="font-bold text-lg">{formatCurrency(priceData.price)}</span>
              <span className={`ml-2 text-sm ${isPriceUp ? 'text-green-600' : 'text-red-600'}`}>
                {isPriceUp ? '▲' : '▼'} {priceData.change.toFixed(2)} ({priceData.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        
        <TabsContent value="chart">
          <div className="bg-white shadow rounded-lg overflow-hidden border border-neutral-200">
            {/* Chart Toolbar */}
            <div className="border-b border-neutral-200 p-2 flex justify-between items-center bg-neutral-50">
              <div className="flex items-center gap-2">
                <Select value={symbol} onValueChange={setSymbol}>
                  <SelectTrigger className="h-8 w-48 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Indian Indices</SelectLabel>
                      {AVAILABLE_SYMBOLS.filter(s => s.value.startsWith('INDEX:')).map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Futures & Options</SelectLabel>
                      {AVAILABLE_SYMBOLS.filter(s => s.value.includes('-FUT') || s.value.includes('-OPT')).map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Indian Stocks</SelectLabel>
                      {AVAILABLE_SYMBOLS.filter(s => s.value.startsWith('NSE:') && !s.value.includes('-')).map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <div className="flex border border-neutral-200 rounded-md overflow-hidden">
                  {TIMEFRAMES.map(tf => (
                    <button
                      key={tf.value}
                      className={`px-2 py-1 text-xs ${timeframe === tf.value ? 'bg-primary text-white' : 'bg-white text-neutral-700 hover:bg-neutral-100'}`}
                      onClick={() => setTimeframe(tf.value)}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
                
                <Button size="sm" variant="outline" className="h-8">
                  <BarChart2 className="h-4 w-4 mr-1" />
                  <span className="text-xs">Indicators</span>
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-1 rounded hover:bg-neutral-100">
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button className="p-1 rounded hover:bg-neutral-100">
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button className="p-1 rounded hover:bg-neutral-100">
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button className="p-1 rounded hover:bg-neutral-100">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Chart Display */}
            <div className="relative">
              {isLoading ? (
                <div className="flex justify-center items-center p-8" style={{height: "500px"}}>
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : displayData.length > 0 ? (
                <div className="relative">
                  <LightweightCandlestickChart
                    data={displayData}
                    height={500}
                    showVolume={true}
                    symbol={formatSymbolDisplay(symbol)}
                    timeframe={timeframe}
                    indicators={indicatorsData}
                  />
                  
                  {/* Trading Controls */}
                  <div className="absolute left-4 top-4 flex flex-col gap-2">
                    <Card className="w-64 shadow-lg">
                      <CardContent className="p-4">
                        <div className="text-sm font-medium mb-3">Place Order</div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="flex flex-col">
                            <label className="text-xs text-neutral-500 mb-1">Quantity</label>
                            <Input 
                              type="number" 
                              value={quantity} 
                              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                              min={1}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-xs text-neutral-500 mb-1">Price (₹)</label>
                            <Input 
                              type="number" 
                              value={price} 
                              onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                              disabled={orderType === 'market'}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mb-3">
                          <button 
                            className={`flex-1 py-1 text-xs rounded-md ${orderType === 'market' ? 'bg-neutral-200 text-neutral-800' : 'bg-white border border-neutral-300'}`}
                            onClick={() => setOrderType('market')}
                          >
                            Market
                          </button>
                          <button 
                            className={`flex-1 py-1 text-xs rounded-md ${orderType === 'limit' ? 'bg-neutral-200 text-neutral-800' : 'bg-white border border-neutral-300'}`}
                            onClick={() => setOrderType('limit')}
                          >
                            Limit
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            onClick={executeBuy}
                            className="bg-green-600 hover:bg-green-700 text-white h-8 text-sm"
                          >
                            BUY @ {formatCurrency(price)}
                          </Button>
                          <Button 
                            onClick={executeSell}
                            className="bg-red-600 hover:bg-red-700 text-white h-8 text-sm"
                          >
                            SELL @ {formatCurrency(price)}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Market Data */}
                  <div className="absolute right-4 top-4 w-64">
                    <Card className="shadow-lg">
                      <CardContent className="p-4 text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-neutral-500">Open</span>
                          <span className="font-medium">{formatCurrency(displayData[0]?.open || 0)}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-neutral-500">High</span>
                          <span className="font-medium">
                            {formatCurrency(Math.max(...displayData.map((d: ChartBarData) => d.high)))}
                          </span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-neutral-500">Low</span>
                          <span className="font-medium">
                            {formatCurrency(Math.min(...displayData.map((d: ChartBarData) => d.low)))}
                          </span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-neutral-500">Close</span>
                          <span className="font-medium">{formatCurrency(displayData[displayData.length - 1]?.close || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Volume</span>
                          <span className="font-medium">{(displayData[displayData.length - 1]?.volume || 0).toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8" style={{height: "500px"}}>
                  <p className="text-neutral-500">No data available for the selected symbol and timeframe</p>
                  <Button className="mt-4" onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              )}
            </div>
            
            {/* Bottom Toolbar */}
            <div className="border-t border-neutral-200 p-2 flex justify-between items-center bg-neutral-50">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <div className={`px-2 py-0.5 rounded-full text-xs ${
                  getMarketStatus() === "open" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {getMarketStatus() === "open" ? "Market Open" : "Market Closed"}
                </div>
                
                <div>Last Update: {new Date().toLocaleTimeString()}</div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleRefresh}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
                
                <Button 
                  size="sm" 
                  variant={showPsychologyPanel ? "default" : "outline"} 
                  className="h-7 text-xs" 
                  onClick={() => setShowPsychologyPanel(!showPsychologyPanel)}
                >
                  <Brain className="h-3 w-3 mr-1" />
                  Psychology
                </Button>
                
                <div className="text-xs text-neutral-500">
                  Data: {isConnected ? "Real-time" : "Delayed"}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="overview">
          <div className="bg-white shadow rounded-lg p-6 border border-neutral-200">
            <h3 className="text-lg font-medium mb-4">Overview Content</h3>
            <p>This tab would contain market overview, news, and fundamentals.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="option-chain">
          <div className="bg-white shadow rounded-lg p-6 border border-neutral-200">
            <h3 className="text-lg font-medium mb-4">Option Chain Content</h3>
            <p>This tab would display the option chain with puts and calls for the selected security.</p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Psychology Insights Panel */}
      {showPsychologyPanel && (
        <PsychologyInsightsPanel
          marketCondition={marketCondition}
          recentTrades={recentTrades.map(trade => ({
            id: trade.id,
            type: trade.type,
            result: trade.result === 'open' ? 'profit' : trade.result,
            symbol: trade.symbol,
            amount: trade.amount,
            timestamp: trade.timestamp
          }))}
          onClose={() => setShowPsychologyPanel(false)}
        />
      )}
    </div>
  );
};

export default DirectTrade;