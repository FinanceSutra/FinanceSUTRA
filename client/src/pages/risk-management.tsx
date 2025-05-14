import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { AlertTriangle, BarChart4, Target, DollarSign, TrendingDown, Settings, Activity, ShieldAlert, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';

// Define interfaces for API responses
interface MarketExposure {
  market: string;
  percentage: number;
}

interface SectorExposure {
  sector: string;
  percentage: number;
}

interface StrategyCorrelation {
  strategy: string;
  correlations: number[];
}

interface PortfolioRisk {
  totalValue: number;
  dailyValue: number;
  dailyChange: number;
  weeklyChange: number;
  monthlyChange: number;
  drawdown: {
    current: number;
    max: number;
  };
  volatility: number;
  sharpeRatio: number;
  beta: number;
  strategies: number;
  activeTrades: number;
  exposureByMarket: MarketExposure[];
  exposureBySector: SectorExposure[];
  correlationMatrix: StrategyCorrelation[];
}

// Default portfolio risk data
const defaultPortfolioRisk: PortfolioRisk = {
  totalValue: 125800,
  dailyValue: 127430,
  dailyChange: 1.3,
  weeklyChange: -2.1,
  monthlyChange: 5.7,
  drawdown: {
    current: 2.5,
    max: 7.8,
  },
  volatility: 12.4,
  sharpeRatio: 1.2,
  beta: 0.86,
  strategies: 5,
  activeTrades: 8,
  exposureByMarket: [
    { market: 'Stocks', percentage: 45 },
    { market: 'Forex', percentage: 30 },
    { market: 'Crypto', percentage: 15 },
    { market: 'Futures', percentage: 10 },
  ],
  exposureBySector: [
    { sector: 'Technology', percentage: 30 },
    { sector: 'Financial', percentage: 20 },
    { sector: 'Healthcare', percentage: 15 },
    { sector: 'Consumer', percentage: 10 },
    { sector: 'Energy', percentage: 10 },
    { sector: 'Other', percentage: 15 },
  ],
  correlationMatrix: [
    { strategy: 'Moving Average Crossover', correlations: [1, 0.3, 0.1, -0.2, 0.7] },
    { strategy: 'RSI Mean Reversion', correlations: [0.3, 1, 0.4, 0.1, 0.2] },
    { strategy: 'Trend Following', correlations: [0.1, 0.4, 1, 0.5, -0.1] },
    { strategy: 'Bollinger Breakout', correlations: [-0.2, 0.1, 0.5, 1, 0.3] },
    { strategy: 'Options Straddle', correlations: [0.7, 0.2, -0.1, 0.3, 1] },
  ],
};

// Risk limits configuration
interface RiskLimit {
  id: string;
  name: string;
  description: string;
  type: 'account' | 'strategy' | 'position';
  metric: string;
  threshold: number;
  currentValue: number;
  status: 'safe' | 'warning' | 'breach';
  action: 'notify' | 'reduce' | 'exit';
  isActive: boolean;
}

const defaultRiskLimits: RiskLimit[] = [
  {
    id: '1',
    name: 'Maximum Drawdown',
    description: 'Maximum acceptable drawdown for the entire account',
    type: 'account',
    metric: 'drawdown',
    threshold: 10,
    currentValue: 2.5,
    status: 'safe',
    action: 'notify',
    isActive: true,
  },
  {
    id: '2',
    name: 'Daily Loss Limit',
    description: 'Maximum loss allowed in a single day',
    type: 'account',
    metric: 'daily P&L',
    threshold: 3,
    currentValue: -1.3,
    status: 'safe',
    action: 'notify',
    isActive: true,
  },
  {
    id: '3',
    name: 'Position Size Limit',
    description: 'Maximum position size as a percentage of account',
    type: 'position',
    metric: 'position size',
    threshold: 5,
    currentValue: 3.2,
    status: 'safe',
    action: 'notify',
    isActive: true,
  },
  {
    id: '4',
    name: 'Market Exposure Limit',
    description: 'Maximum exposure to a single market',
    type: 'account',
    metric: 'market exposure',
    threshold: 50,
    currentValue: 45,
    status: 'warning',
    action: 'notify',
    isActive: true,
  },
  {
    id: '5',
    name: 'Strategy Loss Limit',
    description: 'Maximum loss allowed for a single strategy',
    type: 'strategy',
    metric: 'strategy P&L',
    threshold: 5,
    currentValue: 1.8,
    status: 'safe',
    action: 'reduce',
    isActive: true,
  },
  {
    id: '6',
    name: 'Correlation Risk Limit',
    description: 'Maximum average correlation between strategies',
    type: 'account',
    metric: 'correlation',
    threshold: 0.5,
    currentValue: 0.3,
    status: 'safe',
    action: 'notify',
    isActive: true,
  },
  {
    id: '7',
    name: 'Volatility Limit',
    description: 'Maximum portfolio volatility (annualized)',
    type: 'account',
    metric: 'volatility',
    threshold: 15,
    currentValue: 12.4,
    status: 'safe',
    action: 'reduce',
    isActive: true,
  },
];

// Position sizing configuration
interface PositionSizingRule {
  id: string;
  name: string;
  description: string;
  strategy: string;
  method: 'fixed' | 'volatility' | 'risk-based' | 'kelly';
  riskPerTrade: number;
  maxPositionSize: number;
  isActive: boolean;
}

const defaultPositionSizingRules: PositionSizingRule[] = [
  {
    id: '1',
    name: 'Default Risk-Based Sizing',
    description: 'Risk 1% of the account per trade',
    strategy: 'All Strategies',
    method: 'risk-based',
    riskPerTrade: 1,
    maxPositionSize: 5,
    isActive: true,
  },
  {
    id: '2',
    name: 'Trend Following Size',
    description: 'Volatility-adjusted sizing for trend strategies',
    strategy: 'Trend Following',
    method: 'volatility',
    riskPerTrade: 0.8,
    maxPositionSize: 4,
    isActive: true,
  },
  {
    id: '3',
    name: 'Mean Reversion Size',
    description: 'Kelly criterion sizing for mean reversion',
    strategy: 'RSI Mean Reversion',
    method: 'kelly',
    riskPerTrade: 0.5,
    maxPositionSize: 3,
    isActive: true,
  },
  {
    id: '4',
    name: 'Breakout Trade Size',
    description: 'Aggressive sizing for breakout strategies',
    strategy: 'Bollinger Breakout',
    method: 'risk-based',
    riskPerTrade: 1.2,
    maxPositionSize: 5,
    isActive: true,
  },
  {
    id: '5',
    name: 'Options Trade Size',
    description: 'Conservative fixed sizing for options strategies',
    strategy: 'Options Straddle',
    method: 'fixed',
    riskPerTrade: 0.5,
    maxPositionSize: 2,
    isActive: true,
  },
];

const RiskManagement: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [riskLimits, setRiskLimits] = useState<RiskLimit[]>(defaultRiskLimits);
  const [positionRules, setPositionRules] = useState<PositionSizingRule[]>(defaultPositionSizingRules);
  
  // Redirect to auth if user is not logged in
  useEffect(() => {
    if (user === null) {
      setLocation('/auth');
    }
  }, [user, setLocation]);
  const [newRiskLimit, setNewRiskLimit] = useState<Partial<RiskLimit>>({
    type: 'account',
    metric: 'drawdown',
    threshold: 10,
    action: 'notify',
    isActive: true,
  });
  const [newPositionRule, setNewPositionRule] = useState<Partial<PositionSizingRule>>({
    strategy: 'All Strategies',
    method: 'risk-based',
    riskPerTrade: 1,
    maxPositionSize: 5,
    isActive: true,
  });
  const [isAddingRiskLimit, setIsAddingRiskLimit] = useState(false);
  const [isAddingPositionRule, setIsAddingPositionRule] = useState(false);

  // Query portfolio risk metrics from API only when authenticated
  const { 
    data: portfolioRisk = defaultPortfolioRisk, 
    isLoading: isLoadingRiskData,
    isError: isRiskDataError
  } = useQuery<PortfolioRisk>({
    queryKey: ['/api/risk/portfolio'],
    retry: 3,
    retryDelay: 1000,
    enabled: !!user, // Only run query when user is authenticated
  });

  // Query risk limits from API only when authenticated
  const { 
    data: apiRiskLimits = [], 
    isLoading: isLoadingRiskLimits,
    isError: isRiskLimitsError
  } = useQuery<RiskLimit[]>({
    queryKey: ['/api/risk/limits'],
    retry: 3,
    retryDelay: 1000,
    enabled: !!user, // Only run query when user is authenticated
  });

  // Update state when API data arrives
  React.useEffect(() => {
    if (apiRiskLimits && apiRiskLimits.length > 0) {
      setRiskLimits(apiRiskLimits);
    }
  }, [apiRiskLimits]);

  // Query position sizing rules from API only when authenticated
  const { 
    data: apiPositionRules = [], 
    isLoading: isLoadingPositionRules,
    isError: isPositionRulesError
  } = useQuery<PositionSizingRule[]>({
    queryKey: ['/api/risk/position-rules'],
    retry: 3,
    retryDelay: 1000,
    enabled: !!user, // Only run query when user is authenticated
  });
  
  // Update state when API data arrives
  React.useEffect(() => {
    if (apiPositionRules && apiPositionRules.length > 0) {
      setPositionRules(apiPositionRules);
    }
  }, [apiPositionRules]);

  // Add risk limit mutation
  const addRiskLimitMutation = useMutation({
    mutationFn: async (newLimit: Omit<RiskLimit, 'id' | 'currentValue' | 'status'>) => {
      const res = await apiRequest('POST', '/api/risk/limits', newLimit);
      return res.json();
    },
    onSuccess: (data) => {
      // Update local state with the new limit from the server
      setRiskLimits(prev => [...prev, data]);
      // Reset the form
      setNewRiskLimit({
        type: 'account',
        metric: 'drawdown',
        threshold: 10,
        action: 'notify',
        isActive: true,
      });
      setIsAddingRiskLimit(false);
      // Show success toast
      toast({
        title: 'Risk limit added',
        description: `${data.name} has been added to your risk limits`,
      });
      // Invalidate the risk limits query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/risk/limits'] });
    },
    onError: (error) => {
      toast({
        title: 'Error adding risk limit',
        description: String(error),
        variant: 'destructive',
      });
    }
  });

  // Update risk limit mutation
  const updateRiskLimitMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<RiskLimit> }) => {
      const res = await apiRequest('PUT', `/api/risk/limits/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Risk limit updated',
        description: 'The risk limit has been updated',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/risk/limits'] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating risk limit',
        description: String(error),
        variant: 'destructive',
      });
    }
  });

  // Add position sizing rule mutation
  const addPositionRuleMutation = useMutation({
    mutationFn: async (newRule: Omit<PositionSizingRule, 'id'>) => {
      const res = await apiRequest('POST', '/api/risk/position-rules', newRule);
      return res.json();
    },
    onSuccess: (data) => {
      // Update local state with the new rule from the server
      setPositionRules(prev => [...prev, data]);
      // Reset the form
      setNewPositionRule({
        strategy: 'All Strategies',
        method: 'risk-based',
        riskPerTrade: 1,
        maxPositionSize: 5,
        isActive: true,
      });
      setIsAddingPositionRule(false);
      // Show success toast
      toast({
        title: 'Position sizing rule added',
        description: `${data.name} has been added to your position sizing rules`,
      });
      // Invalidate the position rules query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/risk/position-rules'] });
    },
    onError: (error) => {
      toast({
        title: 'Error adding position sizing rule',
        description: String(error),
        variant: 'destructive',
      });
    }
  });

  // Update position sizing rule mutation
  const updatePositionRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<PositionSizingRule> }) => {
      const res = await apiRequest('PUT', `/api/risk/position-rules/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Position sizing rule updated',
        description: 'The position sizing rule has been updated',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/risk/position-rules'] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating position sizing rule',
        description: String(error),
        variant: 'destructive',
      });
    }
  });

  // Calculate position size mutation
  const calculatePositionSizeMutation = useMutation({
    mutationFn: async (data: { accountSize: number, riskPercentage: number, entryPrice: number, stopLossPrice: number }) => {
      const res = await apiRequest('POST', '/api/risk/calculate-position-size', data);
      return res.json();
    },
    onSuccess: (data) => {
      // In a complete implementation, we would update the UI with the calculation results
      console.log('Position size calculation:', data);
    },
    onError: (error) => {
      toast({
        title: 'Error calculating position size',
        description: String(error),
        variant: 'destructive',
      });
    }
  });

  const isLoading = isLoadingRiskData || isLoadingRiskLimits || isLoadingPositionRules;
  
  // Handle error conditions
  React.useEffect(() => {
    if (isRiskDataError || isRiskLimitsError || isPositionRulesError) {
      toast({
        title: "Error loading risk management data",
        description: "There was a problem loading the risk management data. Please try again.",
        variant: "destructive",
      });
    }
  }, [isRiskDataError, isRiskLimitsError, isPositionRulesError, toast]);

  const toggleRiskLimitActive = (id: string) => {
    const limit = riskLimits.find(l => l.id === id);
    if (!limit) return;
    
    // Optimistically update UI
    setRiskLimits(limits =>
      limits.map(limit =>
        limit.id === id ? { ...limit, isActive: !limit.isActive } : limit
      )
    );
    
    // Send update to API
    updateRiskLimitMutation.mutate({
      id,
      data: { isActive: !limit.isActive }
    });
  };

  const togglePositionRuleActive = (id: string) => {
    const rule = positionRules.find(r => r.id === id);
    if (!rule) return;
    
    // Optimistically update UI
    setPositionRules(rules =>
      rules.map(rule =>
        rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
    
    // Send update to API
    updatePositionRuleMutation.mutate({
      id,
      data: { isActive: !rule.isActive }
    });
  };

  const addRiskLimit = () => {
    if (!newRiskLimit.name || !newRiskLimit.description) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Submit the new risk limit to the API
    addRiskLimitMutation.mutate({
      name: newRiskLimit.name,
      description: newRiskLimit.description,
      type: newRiskLimit.type || 'account',
      metric: newRiskLimit.metric || 'drawdown',
      threshold: newRiskLimit.threshold || 10,
      action: newRiskLimit.action || 'notify',
      isActive: newRiskLimit.isActive || true,
    });
  };

  const addPositionRule = () => {
    if (!newPositionRule.name || !newPositionRule.description) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Submit the new position sizing rule to the API
    addPositionRuleMutation.mutate({
      name: newPositionRule.name,
      description: newPositionRule.description,
      strategy: newPositionRule.strategy || 'All Strategies',
      method: newPositionRule.method || 'risk-based',
      riskPerTrade: newPositionRule.riskPerTrade || 1,
      maxPositionSize: newPositionRule.maxPositionSize || 5,
      isActive: newPositionRule.isActive || true,
    });
  };

  // Using the imported formatters from lib

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-100 text-green-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'breach': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getChangeColor = (value: number) => {
    return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600';
  };

  // If user is not logged in and we're not already redirecting, show a login prompt
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-lg font-medium mb-2">Authentication Required</h2>
        <p className="text-gray-500 mb-4 text-center">
          Please log in to access the Risk Management features.
        </p>
        <Button
          onClick={() => setLocation('/auth')}
        >
          Go to Login
        </Button>
      </div>
    );
  }

  // If there's an error, show a fallback empty state with a retry button
  if (isRiskDataError || isRiskLimitsError || isPositionRulesError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-lg font-medium mb-2">Unable to load risk management data</h2>
        <p className="text-gray-500 mb-4 text-center">
          There was a problem loading the risk management data. This could be due to a network issue.
        </p>
        <Button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/risk/portfolio'] });
            queryClient.invalidateQueries({ queryKey: ['/api/risk/limits'] });
            queryClient.invalidateQueries({ queryKey: ['/api/risk/position-rules'] });
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0">
      <Header 
        title="Risk Management"
        description="Monitor and control risk across your trading strategies"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="limits">Risk Limits</TabsTrigger>
          <TabsTrigger value="position-sizing">Position Sizing</TabsTrigger>
        </TabsList>

        {/* Risk Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(portfolioRisk.totalValue)}</div>
                <div className={`text-sm mt-1 ${getChangeColor(portfolioRisk.dailyChange)}`}>
                  {formatPercentage(portfolioRisk.dailyChange)} today
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Current Drawdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(portfolioRisk.drawdown.current)}</div>
                <div className="text-sm mt-1 text-neutral-500">
                  Max: {formatPercentage(portfolioRisk.drawdown.max)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Active Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioRisk.activeTrades}</div>
                <div className="text-sm mt-1 text-neutral-500">
                  Across {portfolioRisk.strategies} strategies
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" />
                Key Risk Metrics
              </CardTitle>
              <CardDescription>
                Important risk indicators for your trading portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Volatility (Annualized)</span>
                      <span className="text-sm font-semibold">{portfolioRisk.volatility.toFixed(1)}%</span>
                    </div>
                    <Progress value={portfolioRisk.volatility / 0.2} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Sharpe Ratio</span>
                      <span className="text-sm font-semibold">{portfolioRisk.sharpeRatio.toFixed(2)}</span>
                    </div>
                    <Progress value={portfolioRisk.sharpeRatio / 0.03} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Beta to Market</span>
                      <span className="text-sm font-semibold">{portfolioRisk.beta.toFixed(2)}</span>
                    </div>
                    <Progress value={portfolioRisk.beta * 100} className="h-2" />
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium mb-3 block">Market Exposure</span>
                  <div className="space-y-2">
                    {portfolioRisk.exposureByMarket.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs">{item.market}</span>
                          <span className="text-xs font-medium">{item.percentage}%</span>
                        </div>
                        <Progress value={item.percentage} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium mb-3 block">Returns</span>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Daily</span>
                      <span className={`text-sm font-medium ${getChangeColor(portfolioRisk.dailyChange)}`}>
                        {formatPercentage(portfolioRisk.dailyChange)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Weekly</span>
                      <span className={`text-sm font-medium ${getChangeColor(portfolioRisk.weeklyChange)}`}>
                        {formatPercentage(portfolioRisk.weeklyChange)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Monthly</span>
                      <span className={`text-sm font-medium ${getChangeColor(portfolioRisk.monthlyChange)}`}>
                        {formatPercentage(portfolioRisk.monthlyChange)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Correlation Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart4 className="h-5 w-5 mr-2 text-primary" />
                Strategy Correlation Matrix
              </CardTitle>
              <CardDescription>
                Cross-correlation between different trading strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Strategy</TableHead>
                      {portfolioRisk.correlationMatrix.map((row, index) => (
                        <TableHead key={index} className="text-center">
                          {index + 1}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolioRisk.correlationMatrix.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        <TableCell className="font-medium">
                          {rowIndex + 1}. {row.strategy}
                        </TableCell>
                        {row.correlations.map((corr, colIndex) => (
                          <TableCell 
                            key={colIndex} 
                            className={`text-center ${
                              rowIndex === colIndex 
                                ? 'bg-neutral-100' 
                                : Math.abs(corr) > 0.5 && rowIndex !== colIndex
                                  ? 'bg-amber-50'
                                  : ''
                            }`}
                          >
                            {corr.toFixed(2)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-sm text-neutral-500">
                <p>
                  <span className="inline-block w-3 h-3 bg-amber-50 mr-2"></span>
                  Highly correlated strategies (correlation &gt; 0.5)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Limits Tab */}
        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-primary" />
                  Risk Limits
                </CardTitle>
                <Button 
                  onClick={() => setIsAddingRiskLimit(true)}
                  disabled={isAddingRiskLimit}
                >
                  Add New Limit
                </Button>
              </div>
              <CardDescription>
                Set and monitor limits to control risk across your portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAddingRiskLimit ? (
                <Card className="border-2 border-primary/20 mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Risk Limit</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input 
                          id="name" 
                          placeholder="e.g., Daily Loss Limit" 
                          value={newRiskLimit.name || ''}
                          onChange={(e) => setNewRiskLimit({...newRiskLimit, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select 
                          value={newRiskLimit.type}
                          onValueChange={(value) => setNewRiskLimit({...newRiskLimit, type: value as any})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="account">Account Level</SelectItem>
                            <SelectItem value="strategy">Strategy Level</SelectItem>
                            <SelectItem value="position">Position Level</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input 
                        id="description" 
                        placeholder="Describe the purpose of this limit" 
                        value={newRiskLimit.description || ''}
                        onChange={(e) => setNewRiskLimit({...newRiskLimit, description: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="metric">Risk Metric</Label>
                        <Select 
                          value={newRiskLimit.metric}
                          onValueChange={(value) => setNewRiskLimit({...newRiskLimit, metric: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select metric" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="drawdown">Drawdown</SelectItem>
                            <SelectItem value="daily P&L">Daily P&L</SelectItem>
                            <SelectItem value="position size">Position Size</SelectItem>
                            <SelectItem value="market exposure">Market Exposure</SelectItem>
                            <SelectItem value="strategy P&L">Strategy P&L</SelectItem>
                            <SelectItem value="correlation">Correlation</SelectItem>
                            <SelectItem value="volatility">Volatility</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="threshold">Threshold (%)</Label>
                        <Input 
                          id="threshold" 
                          type="number" 
                          value={newRiskLimit.threshold || ''}
                          onChange={(e) => setNewRiskLimit({...newRiskLimit, threshold: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="action">Action When Breached</Label>
                      <Select 
                        value={newRiskLimit.action}
                        onValueChange={(value) => setNewRiskLimit({...newRiskLimit, action: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="notify">Notify Only</SelectItem>
                          <SelectItem value="reduce">Reduce Exposure</SelectItem>
                          <SelectItem value="exit">Exit All Positions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setIsAddingRiskLimit(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addRiskLimit}>
                      Save Risk Limit
                    </Button>
                  </CardFooter>
                </Card>
              ) : null}
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Risk Limit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Threshold</TableHead>
                      <TableHead className="text-right">Current Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead className="text-center">Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riskLimits.map((limit) => (
                      <TableRow key={limit.id}>
                        <TableCell className="font-medium">
                          <div>{limit.name}</div>
                          <div className="text-xs text-neutral-500">{limit.description}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {limit.type === 'account' ? 'Account' : 
                             limit.type === 'strategy' ? 'Strategy' : 'Position'}
                          </Badge>
                        </TableCell>
                        <TableCell>{limit.metric}</TableCell>
                        <TableCell className="text-right">{limit.threshold}%</TableCell>
                        <TableCell className="text-right">{limit.currentValue}%</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(limit.status)}>
                            {limit.status.charAt(0).toUpperCase() + limit.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {limit.action === 'notify' ? 'Notify' : 
                             limit.action === 'reduce' ? 'Reduce Exposure' : 'Exit Positions'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch 
                            checked={limit.isActive} 
                            onCheckedChange={() => toggleRiskLimitActive(limit.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Position Sizing Tab */}
        <TabsContent value="position-sizing" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-primary" />
                  Position Sizing Rules
                </CardTitle>
                <Button 
                  onClick={() => setIsAddingPositionRule(true)}
                  disabled={isAddingPositionRule}
                >
                  Add New Rule
                </Button>
              </div>
              <CardDescription>
                Define rules for calculating optimal position sizes based on risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAddingPositionRule ? (
                <Card className="border-2 border-primary/20 mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Position Sizing Rule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rule-name">Name</Label>
                        <Input 
                          id="rule-name" 
                          placeholder="e.g., Aggressive Trend Following" 
                          value={newPositionRule.name || ''}
                          onChange={(e) => setNewPositionRule({...newPositionRule, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="strategy">Apply To</Label>
                        <Select 
                          value={newPositionRule.strategy}
                          onValueChange={(value) => setNewPositionRule({...newPositionRule, strategy: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select strategy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All Strategies">All Strategies</SelectItem>
                            <SelectItem value="Moving Average Crossover">Moving Average Crossover</SelectItem>
                            <SelectItem value="RSI Mean Reversion">RSI Mean Reversion</SelectItem>
                            <SelectItem value="Trend Following">Trend Following</SelectItem>
                            <SelectItem value="Bollinger Breakout">Bollinger Breakout</SelectItem>
                            <SelectItem value="Options Straddle">Options Straddle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rule-description">Description</Label>
                      <Input 
                        id="rule-description" 
                        placeholder="Describe the purpose of this sizing rule" 
                        value={newPositionRule.description || ''}
                        onChange={(e) => setNewPositionRule({...newPositionRule, description: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="method">Sizing Method</Label>
                        <Select 
                          value={newPositionRule.method}
                          onValueChange={(value) => setNewPositionRule({...newPositionRule, method: value as any})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Size</SelectItem>
                            <SelectItem value="volatility">Volatility Adjusted</SelectItem>
                            <SelectItem value="risk-based">Risk-Based (% of account)</SelectItem>
                            <SelectItem value="kelly">Kelly Criterion</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="risk-per-trade">Risk Per Trade (%)</Label>
                        <Input 
                          id="risk-per-trade" 
                          type="number" 
                          step="0.1"
                          value={newPositionRule.riskPerTrade || ''}
                          onChange={(e) => setNewPositionRule({...newPositionRule, riskPerTrade: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="max-size">Maximum Position Size (% of account)</Label>
                      <Input 
                        id="max-size" 
                        type="number" 
                        value={newPositionRule.maxPositionSize || ''}
                        onChange={(e) => setNewPositionRule({...newPositionRule, maxPositionSize: Number(e.target.value)})}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setIsAddingPositionRule(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addPositionRule}>
                      Save Position Rule
                    </Button>
                  </CardFooter>
                </Card>
              ) : null}
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Rule Name</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Risk Per Trade</TableHead>
                      <TableHead className="text-right">Max Size</TableHead>
                      <TableHead className="text-center">Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positionRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                          <div>{rule.name}</div>
                          <div className="text-xs text-neutral-500">{rule.description}</div>
                        </TableCell>
                        <TableCell>{rule.strategy}</TableCell>
                        <TableCell>
                          <HoverCard>
                            <HoverCardTrigger>
                              <div className="flex items-center cursor-pointer">
                                <span>
                                  {rule.method === 'fixed' ? 'Fixed Size' : 
                                   rule.method === 'volatility' ? 'Volatility Adjusted' : 
                                   rule.method === 'risk-based' ? 'Risk-Based' : 'Kelly Criterion'}
                                </span>
                                <Info className="h-4 w-4 ml-1 text-neutral-400" />
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              <div className="space-y-2">
                                <h4 className="font-semibold">
                                  {rule.method === 'fixed' ? 'Fixed Size' : 
                                   rule.method === 'volatility' ? 'Volatility Adjusted' : 
                                   rule.method === 'risk-based' ? 'Risk-Based' : 'Kelly Criterion'}
                                </h4>
                                <p className="text-sm">
                                  {rule.method === 'fixed' 
                                    ? 'Uses a fixed percentage of your account for each position.' 
                                    : rule.method === 'volatility' 
                                    ? 'Adjusts position size based on the volatility of the asset - lower size for higher volatility.' 
                                    : rule.method === 'risk-based' 
                                    ? 'Calculates position size to risk a fixed percentage of your account on each trade based on stop loss distance.' 
                                    : 'Uses the Kelly Criterion formula to calculate optimal position size based on win rate and risk/reward ratio.'}
                                </p>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </TableCell>
                        <TableCell className="text-right">{rule.riskPerTrade}%</TableCell>
                        <TableCell className="text-right">{rule.maxPositionSize}%</TableCell>
                        <TableCell className="text-center">
                          <Switch 
                            checked={rule.isActive} 
                            onCheckedChange={() => togglePositionRuleActive(rule.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Position Sizing Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-primary" />
                Position Size Calculator
              </CardTitle>
              <CardDescription>
                Calculate optimal position size based on your risk parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-size">Account Size ($)</Label>
                    <Input id="account-size" type="number" defaultValue="100000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="risk-amount">Risk Per Trade (%)</Label>
                    <Slider 
                      id="risk-amount" 
                      defaultValue={[1]} 
                      max={5} 
                      step={0.1}
                      className="py-4"
                    />
                    <div className="text-center text-sm text-neutral-500">1.0%</div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entry-price">Entry Price ($)</Label>
                    <Input id="entry-price" type="number" defaultValue="50.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stop-loss">Stop Loss Price ($)</Label>
                    <Input id="stop-loss" type="number" defaultValue="48.50" />
                  </div>
                  <Button className="w-full">Calculate Position Size</Button>
                </div>
                
                <div className="bg-neutral-50 p-4 rounded-md border">
                  <h3 className="font-semibold text-lg mb-4">Calculation Results</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-neutral-500">Risk Amount ($)</div>
                      <div className="text-xl font-semibold">$1,000.00</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Risk Per Share ($)</div>
                      <div className="text-xl font-semibold">$1.50</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Recommended Shares</div>
                      <div className="text-xl font-semibold">666</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Position Value ($)</div>
                      <div className="text-xl font-semibold">$33,300.00</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Account Allocation</div>
                      <div className="text-xl font-semibold">33.3%</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiskManagement;