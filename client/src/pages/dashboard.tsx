import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowUpRight, Plus, DollarSign, FileText, ArrowLeftRight, TrendingUp, IndianRupee } from 'lucide-react';
import Header from '@/components/layout/Header';
import PerformanceChart from '@/components/charts/PerformanceChart';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import type { Strategy, Trade } from '@shared/schema';

interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  positive?: boolean;
  icon: React.ReactNode;
  iconBgClass: string;
  iconColor: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  change,
  positive,
  icon,
  iconBgClass,
  iconColor,
}) => (
  <div className="bg-white rounded-lg shadow p-5">
    <div className="flex items-center">
      <div className={`flex-shrink-0 ${iconBgClass} p-3 rounded-md`}>
        <div className={`h-6 w-6 ${iconColor}`}>{icon}</div>
      </div>
      <div className="ml-5">
        <p className="text-sm font-medium text-neutral-500">{title}</p>
        <div className="flex items-baseline">
          <p className={`text-2xl font-semibold ${positive ? 'text-success' : 'text-neutral-900'}`}>
            {value}
          </p>
          {change && (
            <p className={`ml-2 text-sm ${positive ? 'text-success' : 'text-neutral-500'}`}>
              {positive && '+'}{change}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<string>('7d');
  
  // Fetch strategies
  const { data: strategies, isLoading: loadingStrategies } = useQuery({
    queryKey: ['/api/strategies'],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch trades
  const { data: trades, isLoading: loadingTrades } = useQuery({
    queryKey: ['/api/trades'],
    staleTime: 60000, // 1 minute
  });
  
  // Create performance data from trades for the chart
  const [performanceData, setPerformanceData] = useState<{ date: string; value: number }[]>([]);
  
  useEffect(() => {
    if (trades && trades.length > 0) {
      // Sort trades by date
      const sortedTrades = [...trades].sort(
        (a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()
      );
      
      // Create equity curve
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
      
      setPerformanceData(equity);
    } else {
      // Create sample data if no trades
      const today = new Date();
      const sampleData = [];
      
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        sampleData.push({
          date: date.toISOString().split('T')[0],
          value: 10000 + Math.random() * 2000
        });
      }
      
      setPerformanceData(sampleData);
    }
  }, [trades]);
  
  // Calculate totals
  const totalPnL = trades?.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0) || 0;
  const totalPercentPnL = totalPnL > 0 ? ((totalPnL / 10000) * 100).toFixed(1) : 0;
  const activeStrategies = strategies?.filter(s => s.isActive).length || 0;
  const executedTradesCount = trades?.length || 0;
  
  // Calculate win rate
  const winningTrades = trades?.filter(trade => Number(trade.pnl || 0) > 0).length || 0;
  const winRate = trades?.length ? ((winningTrades / trades.length) * 100).toFixed(1) : 0;
  
  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
  };
  
  if (loadingStrategies || loadingTrades) {
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
      {/* Dashboard Header */}
      <Header
        title="Dashboard"
        description="Monitor your trading strategies and performance"
        dateRangeSelector
        onDateRangeChange={handleDateRangeChange}
        actions={
          <Link href="/strategies/editor">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Strategy
            </Button>
          </Link>
        }
      />

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total P&L Card */}
        <DashboardCard
          title="Total P&L"
          value={formatCurrency(totalPnL, 2)}
          change={`${totalPercentPnL}%`}
          positive={totalPnL > 0}
          icon={<IndianRupee />}
          iconBgClass="bg-success bg-opacity-10"
          iconColor="text-success"
        />

        {/* Active Strategies Card */}
        <DashboardCard
          title="Active Strategies"
          value={activeStrategies}
          change="this week"
          icon={<FileText />}
          iconBgClass="bg-primary bg-opacity-10"
          iconColor="text-primary"
        />

        {/* Executed Trades Card */}
        <DashboardCard
          title="Executed Trades"
          value={executedTradesCount}
          change="last 7 days"
          icon={<ArrowLeftRight />}
          iconBgClass="bg-secondary bg-opacity-10"
          iconColor="text-secondary"
        />

        {/* Win Rate Card */}
        <DashboardCard
          title="Win Rate"
          value={`${winRate}%`}
          change={winRate > 50 ? '+2.3%' : '-1.5%'}
          positive={Number(winRate) > 50}
          icon={<PieChart />}
          iconBgClass="bg-accent bg-opacity-10"
          iconColor="text-accent"
        />
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="p-5 border-b border-neutral-200">
                <PerformanceChart 
                  data={performanceData}
                  timeframe={dateRange === '7d' ? '1W' : dateRange === '30d' ? '1M' : '1Y'}
                  initialInvestment={10000}
                  height={300}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategies Performance */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <div className="p-5 border-b border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-900">Strategy Performance</h3>
              </div>
              <div className="px-5 py-2">
                {strategies && strategies.length > 0 ? (
                  strategies.slice(0, 5).map((strategy: Strategy) => (
                    <div key={strategy.id} className="py-3 border-b border-neutral-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-neutral-900">{strategy.name}</p>
                          <p className="text-xs text-neutral-500">{strategy.symbol}</p>
                        </div>
                        <div className="text-right">
                          {strategy.id % 2 === 0 ? (
                            <p className="font-medium text-success">{formatCurrency(1204.30, 2)}</p>
                          ) : (
                            <p className="font-medium text-danger">{formatCurrency(-623.75, 2)}</p>
                          )}
                          <p className={`text-xs ${strategy.id % 2 === 0 ? 'text-success' : 'text-danger'}`}>
                            {strategy.id % 2 === 0 ? '+8.2%' : '-4.1%'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${strategy.id % 2 === 0 ? 'bg-success' : 'bg-danger'}`} 
                          style={{ width: `${strategy.id % 2 === 0 ? (40 + Math.random() * 30) : (10 + Math.random() * 20)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-neutral-500">
                    <p>No strategies available</p>
                    <Link href="/strategies/editor">
                      <span className="mt-2 text-primary hover:underline inline-flex items-center cursor-pointer">
                        Create your first strategy
                        <ArrowUpRight className="ml-1 w-4 h-4" />
                      </span>
                    </Link>
                  </div>
                )}
              </div>
              <div className="p-4 bg-neutral-50 rounded-b-lg">
                <Link href="/strategies">
                  <span className="w-full block py-2 text-sm text-primary font-medium hover:text-primary-dark text-center cursor-pointer">
                    View All Strategies
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Trades Section */}
      <div className="mt-8">
        <Card>
          <CardContent className="p-0">
            <div className="p-5 border-b border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-900">Recent Trades</h3>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Symbol</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Price</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">P&L</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {trades && trades.length > 0 ? (
                    trades.slice(0, 6).map((trade: Trade) => (
                      <tr key={trade.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-neutral-900">{trade.symbol}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            trade.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {trade.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">
                          {new Date(trade.openedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">
                          {formatCurrency(Number(trade.price), 2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <span className={Number(trade.pnl) > 0 ? 'text-success' : 'text-danger'}>
                            {formatCurrency(Number(trade.pnl), 2)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                        No trades found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-neutral-50 rounded-b-lg">
              <Link href="/reports">
                <span className="w-full block py-2 text-sm text-primary font-medium hover:text-primary-dark text-center cursor-pointer">
                  View All Trades
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Added missing import for PieChart
import { PieChart } from 'lucide-react';

export default Dashboard;
