import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Loader2, Lightbulb, ArrowRight, TrendingUp, ChevronRight, Star, Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/Header';

// Define types for user preferences and recommendations
type UserPreference = {
  riskTolerance: number; // 1-5 scale
  investmentHorizon: string; // short, medium, long
  preferredMarkets: string[]; // forex, stocks, crypto, etc.
  tradingFrequency: string; // day, swing, position
  capitalAvailable: number; // amount in USD
  automationLevel: string; // fully automated, semi-automated, manual
  preferredIndicators: string[]; // moving averages, RSI, MACD, etc.
};

type StrategyRecommendation = {
  id: string;
  name: string;
  description: string;
  matchScore: number; // 0-100
  riskLevel: number; // 1-5
  expectedReturn: string;
  timeFrame: string;
  suitableMarkets: string[];
  keyIndicators: string[];
  tradeFrequency: string;
  backtestPerformance: {
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  complexity: number; // 1-5
};

const defaultPreferences: UserPreference = {
  riskTolerance: 3,
  investmentHorizon: 'medium',
  preferredMarkets: ['stocks'],
  tradingFrequency: 'swing',
  capitalAvailable: 100000, // Higher for Indian market in INR
  automationLevel: 'semi-automated',
  preferredIndicators: ['moving_averages', 'rsi'],
};

// Indian market specific strategy recommendations will be loaded from the API

const StrategyRecommendations: React.FC = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [preferences, setPreferences] = useState<UserPreference>(defaultPreferences);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<StrategyRecommendation[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('preferences');

  // Fetch recommendations from the backend
  const getRecommendations = async () => {
    setIsAnalyzing(true);
    
    try {
      // Make API call to backend
      const response = await apiRequest('POST', '/api/strategy-recommendations', preferences);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch recommendations');
      }
      
      setRecommendations(data);
      setShowResults(true);
      setActiveTab('recommendations');
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate recommendations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePreferenceChange = (field: keyof UserPreference, value: any) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    setShowResults(false);
    setActiveTab('preferences');
  };

  const saveStrategyToFavorites = (strategyId: string) => {
    toast({
      title: 'Strategy Saved',
      description: 'The strategy has been saved to your favorites.',
    });
  };

  // Create a strategy directly from recommendation template
  const createStrategyFromRecommendation = async (recommendation: StrategyRecommendation) => {
    try {
      // Generate the default code based on the recommendation type tailored for Indian markets
      const templateCode = `
class ${recommendation.name.replace(/\s+/g, '')}:
    def __init__(self):
        # Initialize strategy parameters for Indian markets
        self.name = "${recommendation.name}"
        self.timeframe = "${recommendation.timeFrame.toLowerCase()}"
        self.risk_level = ${recommendation.riskLevel}
        self.is_intraday = ${recommendation.timeFrame === 'Daily' && recommendation.tradeFrequency.includes('High')}
        self.initial_capital = 100000  # ₹1,00,000 capital for Indian markets
        
    def generate_signals(self, data):
        """Generate trading signals based on the strategy logic."""
        # Implementation for Indian markets using the key indicators:
        # ${recommendation.keyIndicators.join(', ')}
        
        # Price data for Indian markets
        data['signal'] = 0
        
        ${recommendation.keyIndicators.includes('Moving Averages') ? 
        `# Calculate moving averages
        data['MA20'] = data['close'].rolling(window=20).mean()
        data['MA50'] = data['close'].rolling(window=50).mean()
        
        # Buy signal: MA20 crosses above MA50
        data.loc[(data['MA20'] > data['MA50']) & (data['MA20'].shift(1) <= data['MA50'].shift(1)), 'signal'] = 1
        
        # Sell signal: MA20 crosses below MA50
        data.loc[(data['MA20'] < data['MA50']) & (data['MA20'].shift(1) >= data['MA50'].shift(1)), 'signal'] = -1` : ''}
        
        ${recommendation.keyIndicators.includes('RSI') ? 
        `# Calculate RSI
        delta = data['close'].diff()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        avg_gain = gain.rolling(window=14).mean()
        avg_loss = loss.rolling(window=14).mean()
        rs = avg_gain / avg_loss
        data['RSI'] = 100 - (100 / (1 + rs))
        
        # Buy signal: RSI crosses above 30 (oversold)
        data.loc[(data['RSI'] > 30) & (data['RSI'].shift(1) <= 30), 'signal'] = 1
        
        # Sell signal: RSI crosses below 70 (overbought)
        data.loc[(data['RSI'] < 70) & (data['RSI'].shift(1) >= 70), 'signal'] = -1` : ''}
        
        return data
    
    def backtest(self, data, initial_capital=100000):
        """Run backtest and calculate performance metrics for Indian markets."""
        signals = self.generate_signals(data)
        
        # Apply special rules for Indian markets:
        # - Circuit breakers (5%, 10%, 20% limits)
        # - Special STT (Securities Transaction Tax) considerations
        # - NSE/BSE specific trading rules 
        
        return self._calculate_returns(signals, initial_capital)
`;
      
      // Create the strategy in the database with Indian market symbols
      const response = await apiRequest('POST', '/api/strategies', {
        name: recommendation.name,
        description: recommendation.description,
        symbol: recommendation.suitableMarkets.includes('stocks') ? 'NSE:RELIANCE' : 
                recommendation.suitableMarkets.includes('etfs') ? 'NSE:NIFTYBEES' :
                recommendation.suitableMarkets.includes('forex') ? 'FOREX:USDINR' :
                recommendation.suitableMarkets.includes('crypto') ? 'CRYPTO:BTCINR' : 'NSE:NIFTY',
        timeframe: recommendation.timeFrame === 'Daily' ? '1d' : 
                  recommendation.timeFrame === 'Weekly' ? '1w' : '1h',
        isActive: false,
        code: templateCode,
      });

      if (!response.ok) {
        throw new Error('Failed to create strategy');
      }
      
      // Invalidate strategies query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      
      toast({
        title: 'Strategy Created',
        description: `${recommendation.name} has been saved to your strategies.`,
      });
      
      // Navigate to my strategies page
      navigate('/strategies');
    } catch (error) {
      console.error('Error creating strategy:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create strategy. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0">
      <Header 
        title="Strategy Recommendations"
        description="Get personalized trading strategy recommendations based on your preferences and market conditions"
      />
      
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <Lightbulb className="h-5 w-5 mt-0.5 text-blue-500 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900">AI-Powered Recommendations</h3>
            <p className="text-sm text-blue-700 mt-1">
              Our platform now uses artificial intelligence to generate custom strategy recommendations 
              tailored specifically to your preferences and trading style. AI-generated strategies are 
              personalized to Indian markets and incorporate your preferred indicators, risk tolerance, 
              and capital constraints.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="preferences">Your Preferences</TabsTrigger>
          <TabsTrigger value="recommendations" disabled={!showResults}>
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-primary" />
                Strategy Preferences
              </CardTitle>
              <CardDescription>
                Customize your preferences to get tailored strategy recommendations that match your trading style.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Risk Tolerance */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="risk-tolerance">Risk Tolerance</Label>
                  <Badge variant={preferences.riskTolerance > 3 ? "destructive" : preferences.riskTolerance > 1 ? "default" : "outline"}>
                    {preferences.riskTolerance === 1 ? 'Very Low' : 
                     preferences.riskTolerance === 2 ? 'Low' : 
                     preferences.riskTolerance === 3 ? 'Medium' : 
                     preferences.riskTolerance === 4 ? 'High' : 'Very High'}
                  </Badge>
                </div>
                <Slider 
                  id="risk-tolerance"
                  min={1} 
                  max={5} 
                  step={1} 
                  value={[preferences.riskTolerance]} 
                  onValueChange={(value) => handlePreferenceChange('riskTolerance', value[0])} 
                />
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Conservative</span>
                  <span>Balanced</span>
                  <span>Aggressive</span>
                </div>
              </div>

              {/* Investment Horizon */}
              <div className="space-y-2">
                <Label htmlFor="investment-horizon">Investment Horizon</Label>
                <Select 
                  value={preferences.investmentHorizon}
                  onValueChange={(value) => handlePreferenceChange('investmentHorizon', value)}
                >
                  <SelectTrigger id="investment-horizon">
                    <SelectValue placeholder="Select time horizon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short Term (Days to Weeks)</SelectItem>
                    <SelectItem value="medium">Medium Term (Weeks to Months)</SelectItem>
                    <SelectItem value="long">Long Term (Months to Years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preferred Markets */}
              <div className="space-y-3">
                <Label>Preferred Markets</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['stocks', 'etfs', 'forex', 'crypto', 'futures', 'options'].map((market) => (
                    <div key={market} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`market-${market}`}
                        checked={preferences.preferredMarkets.includes(market)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handlePreferenceChange('preferredMarkets', [...preferences.preferredMarkets, market]);
                          } else {
                            handlePreferenceChange('preferredMarkets', 
                              preferences.preferredMarkets.filter(m => m !== market)
                            );
                          }
                        }}
                      />
                      <Label htmlFor={`market-${market}`} className="capitalize">{market}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trading Frequency */}
              <div className="space-y-2">
                <Label htmlFor="trading-frequency">Trading Frequency</Label>
                <Select 
                  value={preferences.tradingFrequency}
                  onValueChange={(value) => handlePreferenceChange('tradingFrequency', value)}
                >
                  <SelectTrigger id="trading-frequency">
                    <SelectValue placeholder="Select trading frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day Trading (Intraday)</SelectItem>
                    <SelectItem value="swing">Swing Trading (Days to Weeks)</SelectItem>
                    <SelectItem value="position">Position Trading (Weeks to Months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Capital Available */}
              <div className="space-y-2">
                <Label htmlFor="capital">Capital Available (₹)</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">₹</span>
                  <Input 
                    id="capital"
                    type="number" 
                    className="pl-7" 
                    value={preferences.capitalAvailable}
                    onChange={(e) => handlePreferenceChange('capitalAvailable', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Automation Level */}
              <div className="space-y-2">
                <Label htmlFor="automation">Automation Level</Label>
                <Select 
                  value={preferences.automationLevel}
                  onValueChange={(value) => handlePreferenceChange('automationLevel', value)}
                >
                  <SelectTrigger id="automation">
                    <SelectValue placeholder="Select automation level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Trading</SelectItem>
                    <SelectItem value="semi-automated">Semi-Automated (Alerts + Manual Execution)</SelectItem>
                    <SelectItem value="fully-automated">Fully Automated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preferred Indicators */}
              <div className="space-y-3">
                <Label>Preferred Indicators</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'moving_averages', label: 'Moving Averages' },
                    { id: 'rsi', label: 'RSI' },
                    { id: 'macd', label: 'MACD' },
                    { id: 'bollinger', label: 'Bollinger Bands' },
                    { id: 'volume', label: 'Volume Analysis' },
                    { id: 'fibonacci', label: 'Fibonacci' }
                  ].map((indicator) => (
                    <div key={indicator.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`indicator-${indicator.id}`}
                        checked={preferences.preferredIndicators.includes(indicator.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handlePreferenceChange('preferredIndicators', [...preferences.preferredIndicators, indicator.id]);
                          } else {
                            handlePreferenceChange('preferredIndicators', 
                              preferences.preferredIndicators.filter(i => i !== indicator.id)
                            );
                          }
                        }}
                      />
                      <Label htmlFor={`indicator-${indicator.id}`}>{indicator.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button variant="outline" onClick={resetPreferences}>Reset</Button>
              <Button onClick={getRecommendations} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Get Recommendations
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Your Recommended Strategies</h3>
            <Button variant="outline" size="sm" onClick={resetPreferences}>
              Adjust Preferences
            </Button>
          </div>

          <div className="space-y-6">
            {recommendations.map((recommendation) => (
              <Card key={recommendation.id} className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-xl font-semibold">{recommendation.name}</h3>
                      <Badge className="ml-3 bg-primary/20 text-primary">
                        {recommendation.matchScore}% Match
                      </Badge>
                      {recommendation.id.toString().startsWith('ai-') && (
                        <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-violet-500 text-white">
                          AI-Generated
                        </Badge>
                      )}
                    </div>
                    <p className="text-neutral-600 mt-1">{recommendation.description}</p>
                  </div>
                  <div>
                    <Progress 
                      value={recommendation.matchScore} 
                      className="w-16 h-16 rounded-full" 
                    />
                  </div>
                </div>
                
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-neutral-800 flex items-center">
                        <Shield className="w-4 h-4 mr-2 text-primary" />
                        Risk & Return
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Risk Level:</span>
                          <Badge variant={recommendation.riskLevel > 3 ? "destructive" : recommendation.riskLevel > 1 ? "default" : "outline"}>
                            {recommendation.riskLevel}/5
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Expected Return:</span>
                          <span className="font-medium">{recommendation.expectedReturn}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Time Frame:</span>
                          <span>{recommendation.timeFrame}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-neutral-800 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-primary" />
                        Performance Metrics
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Win Rate:</span>
                          <span className="font-medium">{recommendation.backtestPerformance.winRate}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Profit Factor:</span>
                          <span>{recommendation.backtestPerformance.profitFactor}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Max Drawdown:</span>
                          <span>{recommendation.backtestPerformance.maxDrawdown}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Sharpe Ratio:</span>
                          <span>{recommendation.backtestPerformance.sharpeRatio}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-neutral-800 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-primary" />
                        Strategy Details
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Suitable Markets:</span>
                          <span>{recommendation.suitableMarkets.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Trade Frequency:</span>
                          <span>{recommendation.tradeFrequency}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Complexity:</span>
                          <span>{recommendation.complexity}/5</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-neutral-500 block mb-1">Key Indicators:</span>
                          <div className="flex flex-wrap gap-1">
                            {recommendation.keyIndicators.map((indicator, idx) => (
                              <Badge key={idx} variant="outline" className="font-normal">
                                {indicator}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-3 bg-neutral-50 px-6 py-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => saveStrategyToFavorites(recommendation.id)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => createStrategyFromRecommendation(recommendation)}
                  >
                    Create Strategy
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StrategyRecommendations;