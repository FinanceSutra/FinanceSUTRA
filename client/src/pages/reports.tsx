import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Calendar, ChevronLeft, ChevronRight, ArrowUpDown, DollarSign, PieChart } from 'lucide-react';
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import PerformanceChart from '@/components/charts/PerformanceChart';
import type { Trade, Strategy } from '@shared/schema';

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(value);
};

// Helper function to format percent
const formatPercent = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const ReportsPage: React.FC = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('30d');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  
  // Calculate date range based on selection
  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    return {
      startDate,
      endDate,
    };
  };
  
  // Query for strategies
  const { data: strategies } = useQuery({
    queryKey: ['/api/strategies'],
  });
  
  // Query for trades
  const { data: trades, isLoading: loadingTrades } = useQuery({
    queryKey: ['/api/trades'],
    staleTime: 60000, // 1 minute
  });
  
  // Filter trades based on selected strategy and date range
  const filteredTrades = React.useMemo(() => {
    if (!trades) return [];
    
    const { startDate, endDate } = getDateRange();
    
    return trades.filter((trade: Trade) => {
      const tradeDate = new Date(trade.openedAt);
      const matchesDateRange = tradeDate >= startDate && tradeDate <= endDate;
      const matchesStrategy = selectedStrategyId ? trade.strategyId === parseInt(selectedStrategyId) : true;
      
      return matchesDateRange && matchesStrategy;
    });
  }, [trades, dateRange, selectedStrategyId]);
  
  // Calculate P&L metrics
  const metrics = React.useMemo(() => {
    if (!filteredTrades.length) {
      return {
        totalPnl: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        totalTrades: 0,
        profitFactor: 0,
      };
    }
    
    const totalPnl = filteredTrades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
    const winningTrades = filteredTrades.filter(trade => Number(trade.pnl || 0) > 0);
    const losingTrades = filteredTrades.filter(trade => Number(trade.pnl || 0) <= 0);
    
    const winRate = (winningTrades.length / filteredTrades.length) * 100;
    
    const avgWin = winningTrades.length
      ? winningTrades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0) / winningTrades.length
      : 0;
      
    const avgLoss = losingTrades.length
      ? losingTrades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0) / losingTrades.length
      : 0;
      
    const totalWinAmount = winningTrades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
    const totalLossAmount = Math.abs(losingTrades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0));
    
    const profitFactor = totalLossAmount ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? Infinity : 0;
    
    return {
      totalPnl,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgWin,
      avgLoss,
      totalTrades: filteredTrades.length,
      profitFactor,
    };
  }, [filteredTrades]);
  
  // Create performance data for chart
  const performanceData = React.useMemo(() => {
    if (!filteredTrades.length) return [];
    
    const sortedTrades = [...filteredTrades].sort((a, b) => 
      new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()
    );
    
    const equity: { date: string; value: number }[] = [];
    let balance = 10000; // Starting balance
    
    // Add initial data point
    const firstTradeDate = new Date(sortedTrades[0].openedAt);
    firstTradeDate.setDate(firstTradeDate.getDate() - 1);
    equity.push({
      date: firstTradeDate.toISOString().split('T')[0],
      value: balance
    });
    
    // Build equity curve
    sortedTrades.forEach(trade => {
      if (trade.pnl) {
        balance += Number(trade.pnl);
        
        const date = new Date(trade.closedAt || trade.openedAt)
          .toISOString()
          .split('T')[0];
          
        equity.push({
          date,
          value: balance
        });
      }
    });
    
    return equity;
  }, [filteredTrades]);
  
  // Generate P&L by strategy data
  const pnlByStrategy = React.useMemo(() => {
    if (!trades || !strategies) return [];
    
    const { startDate, endDate } = getDateRange();
    
    const strategyPnl = strategies.map((strategy: Strategy) => {
      const strategyTrades = trades.filter((trade: Trade) => {
        const tradeDate = new Date(trade.openedAt);
        return trade.strategyId === strategy.id && 
               tradeDate >= startDate && 
               tradeDate <= endDate;
      });
      
      const totalPnl = strategyTrades.reduce((sum, trade: Trade) => sum + Number(trade.pnl || 0), 0);
      const winningTrades = strategyTrades.filter((trade: Trade) => Number(trade.pnl || 0) > 0).length;
      const winRate = strategyTrades.length ? (winningTrades / strategyTrades.length) * 100 : 0;
      
      return {
        id: strategy.id,
        name: strategy.name,
        symbol: strategy.symbol,
        pnl: totalPnl,
        trades: strategyTrades.length,
        winRate,
      };
    });
    
    return strategyPnl.sort((a, b) => b.pnl - a.pnl);
  }, [trades, strategies, dateRange]);
  
  // Handle download report
  const handleDownloadReport = () => {
    toast({
      title: "Report downloaded",
      description: "Your P&L report has been downloaded",
    });
  };
  
  if (loadingTrades) {
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
        title="P&L Reports"
        description="Track and analyze your trading performance"
        dateRangeSelector
        onDateRangeChange={setDateRange}
        actions={
          <Button onClick={handleDownloadReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        }
      />
      
      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total P&L Card */}
        <Card>
          <CardContent className="p-4 flex items-start">
            <div className="mr-4 bg-success bg-opacity-10 p-3 rounded-full">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">Total P&L</p>
              <p className={`text-2xl font-semibold ${metrics.totalPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(metrics.totalPnl)}
              </p>
              <p className={`text-sm ${metrics.totalPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                {metrics.totalPnl >= 0 ? '+' : ''}{formatPercent(metrics.totalPnl / 100)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Win Rate Card */}
        <Card>
          <CardContent className="p-4 flex items-start">
            <div className="mr-4 bg-accent bg-opacity-10 p-3 rounded-full">
              <PieChart className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">Win Rate</p>
              <p className="text-2xl font-semibold text-neutral-900">{metrics.winRate.toFixed(1)}%</p>
              <p className="text-sm text-neutral-500">
                {metrics.winningTrades} / {metrics.totalTrades} trades
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Profit Factor Card */}
        <Card>
          <CardContent className="p-4 flex items-start">
            <div className="mr-4 bg-primary bg-opacity-10 p-3 rounded-full">
              <ArrowUpDown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">Profit Factor</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
              </p>
              <p className="text-sm text-neutral-500">Wins ÷ Losses</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Average Trade Card */}
        <Card>
          <CardContent className="p-4 flex items-start">
            <div className="mr-4 bg-secondary bg-opacity-10 p-3 rounded-full">
              <Calendar className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">Avg Trade</p>
              <p className={`text-2xl font-semibold ${metrics.totalPnl / Math.max(1, metrics.totalTrades) >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(metrics.totalPnl / Math.max(1, metrics.totalTrades))}
              </p>
              <p className="text-sm text-neutral-500">
                W: {formatCurrency(metrics.avgWin)} L: {formatCurrency(metrics.avgLoss)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="heatmap">Performance Heatmap</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
              <CardDescription>
                Equity curve over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData.length > 0 ? (
                <PerformanceChart
                  data={performanceData}
                  timeframe={dateRange === '7d' ? '1W' : dateRange === '30d' ? '1M' : '1Y'}
                  initialInvestment={10000}
                  height={300}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-neutral-500">
                  No performance data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Monthly Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
              <CardDescription>
                P&L breakdown by month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Trades</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                    <TableHead className="text-right">Return %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.length > 0 ? (
                    (() => {
                      // Group trades by month
                      const months: { [key: string]: Trade[] } = {};
                      filteredTrades.forEach(trade => {
                        const monthKey = new Date(trade.openedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        });
                        if (!months[monthKey]) months[monthKey] = [];
                        months[monthKey].push(trade);
                      });
                      
                      return Object.entries(months).map(([month, monthTrades]) => {
                        const totalPnl = monthTrades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
                        const wins = monthTrades.filter(trade => Number(trade.pnl || 0) > 0).length;
                        const winRate = (wins / monthTrades.length) * 100;
                        
                        return (
                          <TableRow key={month}>
                            <TableCell className="font-medium">{month}</TableCell>
                            <TableCell>{monthTrades.length}</TableCell>
                            <TableCell>{winRate.toFixed(1)}%</TableCell>
                            <TableCell className={`text-right ${totalPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                              {formatCurrency(totalPnl)}
                            </TableCell>
                            <TableCell className={`text-right ${totalPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                              {totalPnl >= 0 ? '+' : ''}{(totalPnl / 100).toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-neutral-500">
                        No trades found for the selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trades" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>
                  Detailed record of all your trades
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Select
                  value={selectedStrategyId || ""}
                  onValueChange={setSelectedStrategyId}
                >
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="All Strategies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Strategies</SelectItem>
                    {strategies && strategies.map((strategy: Strategy) => (
                      <SelectItem key={strategy.id} value={strategy.id.toString()}>
                        {strategy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.length > 0 ? (
                      filteredTrades.map((trade: Trade) => {
                        const strategy = strategies?.find((s: Strategy) => s.id === trade.strategyId);
                        
                        return (
                          <TableRow key={trade.id}>
                            <TableCell>{new Date(trade.openedAt).toLocaleDateString()}</TableCell>
                            <TableCell>{trade.symbol}</TableCell>
                            <TableCell>
                              <Badge variant={trade.type === 'BUY' ? 'success' : 'destructive'}>
                                {trade.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(Number(trade.price))}</TableCell>
                            <TableCell>{Number(trade.quantity)}</TableCell>
                            <TableCell>{strategy?.name || '-'}</TableCell>
                            <TableCell className={`text-right font-medium ${Number(trade.pnl) >= 0 ? 'text-success' : 'text-danger'}`}>
                              {Number(trade.pnl) >= 0 ? '+' : ''}{formatCurrency(Number(trade.pnl))}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-neutral-500">
                          No trades found for the selected period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-neutral-500">
                Showing {filteredTrades.length} trades
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="strategies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>P&L by Strategy</CardTitle>
              <CardDescription>
                Performance comparison across all strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Trades</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pnlByStrategy.length > 0 ? (
                    pnlByStrategy.map((strategy) => (
                      <TableRow key={strategy.id}>
                        <TableCell className="font-medium">{strategy.name}</TableCell>
                        <TableCell>{strategy.symbol}</TableCell>
                        <TableCell>{strategy.trades}</TableCell>
                        <TableCell>{strategy.winRate.toFixed(1)}%</TableCell>
                        <TableCell className={`text-right font-medium ${strategy.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                          {strategy.pnl >= 0 ? '+' : ''}{formatCurrency(strategy.pnl)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-neutral-500">
                        No strategy performance data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Strategy Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Strategy Performance Comparison</CardTitle>
              <CardDescription>
                Visual comparison of strategy returns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {pnlByStrategy.length > 0 ? (
                  <div className="space-y-4">
                    {pnlByStrategy.map((strategy) => (
                      <div key={strategy.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${strategy.pnl >= 0 ? 'bg-success' : 'bg-danger'}`}></div>
                            <span className="font-medium">{strategy.name}</span>
                          </div>
                          <span className={`font-medium ${strategy.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                            {strategy.pnl >= 0 ? '+' : ''}{formatCurrency(strategy.pnl)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${strategy.pnl >= 0 ? 'bg-success' : 'bg-danger'}`} 
                            style={{ 
                              width: `${Math.min(100, Math.max(1, Math.abs(strategy.pnl) / Math.max(...pnlByStrategy.map(s => Math.abs(s.pnl))) * 100))}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-neutral-500">
                    No strategy performance data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="heatmap" className="space-y-6">
          {/* Import and use HeatmapChart here */}
          <div>
            {(() => {
              if (!filteredTrades || filteredTrades.length === 0) {
                return (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-neutral-500">
                      No trade data available for generating the heatmap
                    </div>
                  </div>
                );
              }
              
              // Import HeatmapChart
              const HeatmapChart = require('@/components/charts/HeatmapChart').default;
              
              // Define heatmap dimensions
              const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
              const marketConditions = ['bull', 'bear', 'sideways', 'volatile', 'low-volatile'];
              
              // Generate heatmap data based on trades
              // This function categorizes trades by timeframe and market condition
              const generateHeatmapData = () => {
                // Initialize data structure
                const heatmapData: {
                  [key: string]: {
                    [key: string]: {
                      count: number;
                      wins: number;
                      losses: number;
                      totalPnl: number;
                    }
                  }
                } = {};
                
                // Initialize all combinations to avoid empty cells
                timeframes.forEach(timeframe => {
                  heatmapData[timeframe] = {};
                  marketConditions.forEach(condition => {
                    heatmapData[timeframe][condition] = {
                      count: 0,
                      wins: 0,
                      losses: 0,
                      totalPnl: 0
                    };
                  });
                });
                
                // Group trades by strategy to determine market condition based on timeframe
                const strategiesMap = strategies && strategies.reduce((acc: any, s: Strategy) => {
                  acc[s.id] = s;
                  return acc;
                }, {});
                
                // Process each trade
                filteredTrades.forEach(trade => {
                  const strategy = strategiesMap && strategiesMap[trade.strategyId];
                  if (!strategy) return;
                  
                  const timeframe = strategy.timeframe || '1d';
                  
                  // Determine market condition based on PnL trend
                  // In a real application, you would have more sophisticated logic
                  let marketCondition = 'sideways';
                  const pnl = Number(trade.pnl || 0);
                  
                  if (pnl > 0) {
                    marketCondition = Math.abs(pnl) > 1000 ? 'bull' : 'volatile';
                  } else if (pnl < 0) {
                    marketCondition = Math.abs(pnl) > 1000 ? 'bear' : 'low-volatile';
                  }
                  
                  // Accumulate data
                  const cell = heatmapData[timeframe][marketCondition];
                  cell.count += 1;
                  
                  if (pnl > 0) {
                    cell.wins += 1;
                  } else {
                    cell.losses += 1;
                  }
                  
                  cell.totalPnl += pnl;
                });
                
                // Convert to format expected by HeatmapChart
                const formattedData = [];
                
                for (const timeframe of timeframes) {
                  for (const condition of marketConditions) {
                    const cell = heatmapData[timeframe][condition];
                    if (cell.count > 0) {
                      formattedData.push({
                        x: timeframe,
                        y: condition,
                        count: cell.count,
                        winRate: (cell.wins / cell.count) * 100,
                        totalPnl: cell.totalPnl,
                        avgPnl: cell.totalPnl / cell.count,
                        value: (cell.wins / cell.count) * 100 // Default value is win rate
                      });
                    } else {
                      // Add empty cell with default values
                      formattedData.push({
                        x: timeframe,
                        y: condition,
                        count: 0,
                        winRate: 0,
                        totalPnl: 0,
                        avgPnl: 0,
                        value: 0
                      });
                    }
                  }
                }
                
                return formattedData;
              };
              
              // Define metrics for the heatmap
              const metrics = [
                {
                  id: 'winRate',
                  label: 'Win Rate (%)',
                  description: 'Percentage of winning trades',
                  valueFormatter: (v: number) => `${v.toFixed(1)}%`,
                  colorScale: (v: number) => {
                    // Color scale from red to green
                    if (v === 0) return '#f1f5f9'; // Light gray for empty cells
                    if (v < 30) return '#ef4444'; // Red
                    if (v < 40) return '#f97316'; // Orange
                    if (v < 50) return '#eab308'; // Yellow
                    if (v < 60) return '#84cc16'; // Light green
                    return '#22c55e'; // Green
                  },
                  domain: [0, 100],
                  defaultValue: 0
                },
                {
                  id: 'totalPnl',
                  label: 'Total P&L (₹)',
                  description: 'Total profit/loss for each combination',
                  valueFormatter: (v: number) => formatCurrency(v),
                  colorScale: (v: number) => {
                    // Color scale based on positive/negative P&L
                    if (v === 0) return '#f1f5f9'; // Light gray for empty cells
                    if (v < -10000) return '#ef4444'; // Red
                    if (v < -5000) return '#f97316'; // Orange
                    if (v < 0) return '#fbbf24'; // Yellow
                    if (v < 5000) return '#84cc16'; // Light green
                    if (v < 10000) return '#22c55e'; // Green
                    return '#15803d'; // Dark green
                  },
                  domain: [-15000, 15000],
                  defaultValue: 0
                },
                {
                  id: 'avgPnl',
                  label: 'Avg P&L per Trade (₹)',
                  description: 'Average profit/loss per trade',
                  valueFormatter: (v: number) => formatCurrency(v),
                  colorScale: (v: number) => {
                    // Color scale based on positive/negative average P&L
                    if (v === 0) return '#f1f5f9'; // Light gray for empty cells
                    if (v < -1000) return '#ef4444'; // Red
                    if (v < -500) return '#f97316'; // Orange
                    if (v < 0) return '#fbbf24'; // Yellow
                    if (v < 500) return '#84cc16'; // Light green
                    if (v < 1000) return '#22c55e'; // Green
                    return '#15803d'; // Dark green
                  },
                  domain: [-1500, 1500],
                  defaultValue: 0
                },
                {
                  id: 'count',
                  label: 'Trade Count',
                  description: 'Number of trades',
                  valueFormatter: (v: number) => v.toString(),
                  colorScale: (v: number) => {
                    // Color scale based on trade count
                    if (v === 0) return '#f1f5f9'; // Light gray for empty cells
                    if (v < 5) return '#f0f9ff'; // Very light blue
                    if (v < 10) return '#bae6fd'; // Light blue
                    if (v < 20) return '#7dd3fc'; // Blue
                    if (v < 50) return '#0ea5e9'; // Medium blue
                    return '#0369a1'; // Dark blue
                  },
                  domain: [0, 100],
                  defaultValue: 0
                }
              ];
              
              const heatmapData = generateHeatmapData();
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <HeatmapChart
                      data={heatmapData}
                      xAxisCategories={timeframes}
                      yAxisCategories={marketConditions}
                      metrics={metrics}
                      title="Trading Performance Heatmap"
                      description="Analyze performance across different timeframes and market conditions"
                      height={500}
                    />
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Understanding the Heatmap</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Timeframes</h3>
                          <p className="text-muted-foreground">
                            The horizontal axis represents different trading timeframes from 1-minute (1m) to daily (1d) charts.
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-2">Market Conditions</h3>
                          <p className="text-muted-foreground">
                            The vertical axis represents different market conditions:
                          </p>
                          <ul className="mt-2 space-y-1 list-disc pl-6">
                            <li><span className="font-medium">Bull</span> - Strong upward trending market</li>
                            <li><span className="font-medium">Bear</span> - Strong downward trending market</li>
                            <li><span className="font-medium">Sideways</span> - Range-bound, low directional movement</li>
                            <li><span className="font-medium">Volatile</span> - High price fluctuations with directional movement</li>
                            <li><span className="font-medium">Low-Volatile</span> - Minimal price fluctuations</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-2">How to Use</h3>
                          <p className="text-muted-foreground">
                            Identify your strongest performing combinations of timeframes and market conditions.
                            Focus on trading strategies that align with the green (high-performing) cells and avoid or
                            revise strategies in red (underperforming) cells.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
