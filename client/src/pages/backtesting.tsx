import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Play,
  FileText,
  Settings,
  Calendar,
  ChevronRight,
  ArrowUpDown,
  DollarSign,
  BarChart,
  LineChart,
  PieChart,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import PerformanceChart from '@/components/charts/PerformanceChart';
import CandlestickChart from '@/components/charts/CandlestickChart';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Strategy, Backtest } from '@shared/schema';

const BacktestingPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [initialCapital, setInitialCapital] = useState(10000);
  const [activeTab, setActiveTab] = useState('setup');
  const [backtest, setBacktest] = useState<Backtest | null>(null);
  const [selectedBacktestId, setSelectedBacktestId] = useState<number | null>(null);
  
  // Fetch strategies
  const { data: strategies, isLoading: loadingStrategies } = useQuery({
    queryKey: ['/api/strategies'],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch selected strategy
  const { data: selectedStrategy } = useQuery({
    queryKey: [`/api/strategies/${selectedStrategyId}`],
    enabled: !!selectedStrategyId,
  });
  
  // Fetch backtests for selected strategy
  const { data: backtests, isLoading: loadingBacktests, refetch: refetchBacktests } = useQuery({
    queryKey: [`/api/strategies/${selectedStrategyId}/backtests`],
    enabled: !!selectedStrategyId,
  });
  
  // Select first strategy by default
  useEffect(() => {
    if (strategies && strategies.length > 0 && !selectedStrategyId) {
      setSelectedStrategyId(strategies[0].id);
    }
  }, [strategies, selectedStrategyId]);
  
  // Run backtest mutation
  const runBacktestMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStrategyId) {
        throw new Error('No strategy selected');
      }
      
      const response = await apiRequest('POST', `/api/strategies/${selectedStrategyId}/backtest`, {
        startDate,
        endDate,
        initialCapital,
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Backtest completed',
        description: 'Your strategy has been successfully backtested',
      });
      setBacktest(data);
      setActiveTab('results');
      refetchBacktests();
    },
    onError: (error) => {
      toast({
        title: 'Backtest failed',
        description: `Error: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  // Fetch selected backtest
  useEffect(() => {
    if (selectedBacktestId && backtests) {
      const foundBacktest = backtests.find((bt: Backtest) => bt.id === selectedBacktestId);
      if (foundBacktest) {
        setBacktest(foundBacktest);
        setActiveTab('results');
      }
    }
  }, [selectedBacktestId, backtests]);
  
  // Handle run backtest
  const handleRunBacktest = () => {
    if (!selectedStrategyId) {
      toast({
        title: 'No strategy selected',
        description: 'Please select a strategy to run the backtest',
        variant: 'destructive',
      });
      return;
    }
    
    runBacktestMutation.mutate();
  };
  
  // Format equity data for chart
  const formatEquityData = (equity: any[]) => {
    if (!equity) return [];
    
    return equity.map((point) => ({
      date: typeof point.date === 'string' ? point.date : new Date(point.date).toISOString().split('T')[0],
      value: Number(point.value),
    }));
  };
  
  // Format the selected backtest's statistics
  const backtestStats = backtest ? [
    { label: 'Initial Capital', value: `$${Number(backtest.initialCapital).toLocaleString()}` },
    { label: 'Final Capital', value: `$${Number(backtest.finalCapital).toLocaleString()}` },
    { label: 'Total Return', value: `$${Number(backtest.totalPnl).toLocaleString()}` },
    { label: 'Return %', value: `${Number(backtest.percentReturn).toFixed(2)}%` },
    { label: 'Number of Trades', value: backtest.trades },
    { label: 'Win Rate', value: `${Number(backtest.winRate).toFixed(2)}%` },
    { label: 'Sharpe Ratio', value: Number(backtest.sharpeRatio).toFixed(2) },
    { label: 'Max Drawdown', value: `${Number(backtest.maxDrawdown).toFixed(2)}%` },
  ] : [];
  
  if (loadingStrategies) {
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
        title="Backtesting"
        description="Test your trading strategies against historical data"
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="setup" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!backtest} className="flex items-center">
            <BarChart className="mr-2 h-4 w-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backtest Configuration</CardTitle>
              <CardDescription>
                Configure the parameters for your backtest run
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="strategy">Select Strategy</Label>
                <Select 
                  value={selectedStrategyId ? String(selectedStrategyId) : ''} 
                  onValueChange={(value) => setSelectedStrategyId(Number(value))}
                >
                  <SelectTrigger id="strategy">
                    <SelectValue placeholder="Select a strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    {strategies && strategies.map((strategy: Strategy) => (
                      <SelectItem key={strategy.id} value={String(strategy.id)}>
                        {strategy.name} ({strategy.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input 
                    id="start-date" 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input 
                    id="end-date" 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="initial-capital">Initial Capital</Label>
                  <span className="text-sm text-neutral-500">
                    ${initialCapital.toLocaleString()}
                  </span>
                </div>
                <Slider
                  id="initial-capital"
                  min={1000}
                  max={100000}
                  step={1000}
                  value={[initialCapital]}
                  onValueChange={(values) => setInitialCapital(values[0])}
                />
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>$1,000</span>
                  <span>$100,000</span>
                </div>
              </div>
              
              <Accordion type="single" collapsible className="border rounded-md">
                <AccordionItem value="advanced-settings">
                  <AccordionTrigger className="px-4">Advanced Settings</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="commission">Commission (%)</Label>
                        <Input id="commission" type="number" min="0" step="0.01" defaultValue="0.1" />
                        <p className="text-xs text-neutral-500">
                          Trading commission per transaction
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slippage">Slippage (%)</Label>
                        <Input id="slippage" type="number" min="0" step="0.01" defaultValue="0.05" />
                        <p className="text-xs text-neutral-500">
                          Estimated slippage per trade
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="position-size">Position Size (%)</Label>
                      <Input id="position-size" type="number" min="0" max="100" step="1" defaultValue="100" />
                      <p className="text-xs text-neutral-500">
                        Percentage of capital to use per trade
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                className="flex items-center" 
                onClick={handleRunBacktest}
                disabled={runBacktestMutation.isPending}
              >
                {runBacktestMutation.isPending ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    Running Backtest
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Backtest
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {selectedStrategy && (
            <Card>
              <CardHeader>
                <CardTitle>Strategy Code</CardTitle>
                <CardDescription>
                  Review the code for the selected strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-neutral-800 text-white p-4 rounded-md font-mono text-sm overflow-x-auto max-h-80">
                  <pre>{selectedStrategy.code}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="results" className="space-y-6">
          {backtest && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>Backtest Results</CardTitle>
                      <CardDescription>
                        Results for {selectedStrategy?.name} from {new Date(backtest.startDate).toLocaleDateString()} to {new Date(backtest.endDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="mt-4 md:mt-0 flex">
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('setup')}>
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back to Setup
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Performance summary cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 flex items-start">
                        <div className="mr-4 bg-primary bg-opacity-10 p-3 rounded-full">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-500">Total Return</p>
                          <p className={`text-2xl font-semibold ${Number(backtest.totalPnl) >= 0 ? 'text-success' : 'text-danger'}`}>
                            {Number(backtest.totalPnl) >= 0 ? '+' : ''}${Number(backtest.totalPnl).toLocaleString()}
                          </p>
                          <p className={`text-sm ${Number(backtest.percentReturn) >= 0 ? 'text-success' : 'text-danger'}`}>
                            {Number(backtest.percentReturn) >= 0 ? '+' : ''}{Number(backtest.percentReturn).toFixed(2)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 flex items-start">
                        <div className="mr-4 bg-secondary bg-opacity-10 p-3 rounded-full">
                          <ArrowUpDown className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-500">Total Trades</p>
                          <p className="text-2xl font-semibold text-neutral-900">{backtest.trades}</p>
                          <p className="text-sm text-success">Win rate: {Number(backtest.winRate).toFixed(2)}%</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 flex items-start">
                        <div className="mr-4 bg-accent bg-opacity-10 p-3 rounded-full">
                          <LineChart className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-500">Sharpe Ratio</p>
                          <p className="text-2xl font-semibold text-neutral-900">{Number(backtest.sharpeRatio).toFixed(2)}</p>
                          <p className="text-sm text-neutral-500">Risk-adjusted return</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 flex items-start">
                        <div className="mr-4 bg-danger bg-opacity-10 p-3 rounded-full">
                          <BarChart className="h-5 w-5 text-danger" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-500">Max Drawdown</p>
                          <p className="text-2xl font-semibold text-danger">{Number(backtest.maxDrawdown).toFixed(2)}%</p>
                          <p className="text-sm text-neutral-500">Maximum loss from peak</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Equity curve chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Equity Curve</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PerformanceChart
                        data={formatEquityData(backtest.equity)}
                        height={300}
                        initialInvestment={Number(backtest.initialCapital)}
                      />
                    </CardContent>
                  </Card>
                  
                  {/* Trades table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Trades</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-auto max-h-96">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead className="text-right">P&L</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {backtest.trades_data && backtest.trades_data.map((trade: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{new Date(trade.date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    trade.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {trade.type}
                                  </span>
                                </TableCell>
                                <TableCell>${Number(trade.price).toFixed(2)}</TableCell>
                                <TableCell>{Number(trade.quantity).toFixed(2)}</TableCell>
                                <TableCell className={`text-right ${Number(trade.pnl) >= 0 ? 'text-success' : 'text-danger'}`}>
                                  {Number(trade.pnl) >= 0 ? '+' : ''}${Number(trade.pnl).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backtest History</CardTitle>
              <CardDescription>
                View and compare previous backtest runs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBacktests ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : backtests && backtests.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Filter by Strategy</Label>
                    <Select 
                      value={selectedStrategyId ? String(selectedStrategyId) : ''} 
                      onValueChange={(value) => setSelectedStrategyId(Number(value))}
                    >
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select a strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        {strategies && strategies.map((strategy: Strategy) => (
                          <SelectItem key={strategy.id} value={String(strategy.id)}>
                            {strategy.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="border rounded-md divide-y">
                    {backtests.map((backtest: Backtest) => (
                      <div key={backtest.id} className="p-4 hover:bg-neutral-50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="font-medium">{selectedStrategy?.name || 'Strategy'}</h4>
                            <div className="flex items-center text-sm text-neutral-500">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              {new Date(backtest.startDate).toLocaleDateString()} - {new Date(backtest.endDate).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="mt-2 sm:mt-0 flex items-center">
                            <div className="mr-6">
                              <p className="text-sm text-neutral-500">Return</p>
                              <p className={`font-medium ${Number(backtest.percentReturn) >= 0 ? 'text-success' : 'text-danger'}`}>
                                {Number(backtest.percentReturn) >= 0 ? '+' : ''}{Number(backtest.percentReturn).toFixed(2)}%
                              </p>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedBacktestId(backtest.id)}
                            >
                              View Results
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-neutral-500">
                          <div>
                            <span>Trades: {backtest.trades}</span>
                          </div>
                          <div>
                            <span>Win Rate: {Number(backtest.winRate).toFixed(2)}%</span>
                          </div>
                          <div>
                            <span>Sharpe: {Number(backtest.sharpeRatio).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-neutral-100 mb-4">
                    <FileText className="h-6 w-6 text-neutral-500" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900">No backtests found</h3>
                  <p className="mt-2 text-neutral-500">
                    {selectedStrategyId
                      ? "You haven't run any backtests for this strategy yet"
                      : "Select a strategy to view its backtest history"}
                  </p>
                  {selectedStrategyId && (
                    <Button className="mt-4" onClick={() => setActiveTab('setup')}>
                      <Play className="w-4 h-4 mr-2" />
                      Run a Backtest
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BacktestingPage;
