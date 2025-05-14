import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  Lightbulb, 
  History, 
  Shuffle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  X,
  Check,
  Eye,
  Shield
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PsychologyInsightsPanelProps {
  marketCondition: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  recentTrades?: Array<{
    id: string;
    type: 'buy' | 'sell';
    result: 'profit' | 'loss';
    symbol: string;
    amount: number;
    timestamp: Date;
  }>;
  onClose?: () => void;
}

export interface EmotionalState {
  fear: number;
  greed: number;
  patience: number;
  discipline: number;
  overconfidence: number;
}

const PsychologyInsightsPanel: React.FC<PsychologyInsightsPanelProps> = ({
  marketCondition = 'neutral',
  recentTrades = [],
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('insights');
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentEmotionalState, setCurrentEmotionalState] = useState<EmotionalState>({
    fear: 30,
    greed: 40,
    patience: 75,
    discipline: 65,
    overconfidence: 25
  });

  // Generate insights based on market condition
  const getMarketBasedInsights = () => {
    switch (marketCondition) {
      case 'bullish':
        return {
          title: "Bullish Market Psychology",
          description: "Markets are trending up. Stay disciplined and avoid FOMO.",
          insights: [
            "Be cautious of overconfidence in rising markets",
            "Set trailing stop losses to protect profits",
            "Don't chase momentum without confirmation",
            "Consider taking partial profits as prices rise"
          ],
          dominantEmotions: ["Greed", "Overconfidence"]
        };
      case 'bearish':
        return {
          title: "Bearish Market Psychology",
          description: "Markets are trending down. Control fear and look for quality entries.",
          insights: [
            "Fear can lead to panic selling at market bottoms",
            "Avoid averaging down without a plan",
            "Look for oversold conditions as potential opportunities",
            "Maintain cash reserves for opportunities"
          ],
          dominantEmotions: ["Fear", "Anxiety"]
        };
      case 'volatile':
        return {
          title: "Volatile Market Psychology",
          description: "High market volatility detected. Trade smaller and be patient.",
          insights: [
            "Reduce position sizes during high volatility",
            "Widen stop losses to accommodate swings",
            "Consider moving to longer timeframes",
            "Be prepared for false breakouts"
          ],
          dominantEmotions: ["Stress", "Uncertainty"]
        };
      default:
        return {
          title: "Neutral Market Psychology",
          description: "Markets are consolidating. Practice patience and preparation.",
          insights: [
            "Use ranging markets to practice patience",
            "Prepare watchlists for potential breakouts",
            "Focus on risk-reward ratios for new trades",
            "Review and refine your trading plan"
          ],
          dominantEmotions: ["Patience", "Calmness"]
        };
    }
  };

  // Analyze trading patterns based on recent trades
  const analyzeTradingPatterns = () => {
    if (recentTrades.length === 0) {
      return {
        patterns: ["No recent trading data available"],
        suggestions: ["Start tracking your trades for personalized insights"]
      };
    }

    const profitTrades = recentTrades.filter(trade => trade.result === 'profit').length;
    const lossTrades = recentTrades.filter(trade => trade.result === 'loss').length;
    const winRate = profitTrades / recentTrades.length;
    
    const patterns = [];
    const suggestions = [];

    // Check win rate
    if (winRate < 0.4) {
      patterns.push("Low win rate detected (below 40%)");
      suggestions.push("Review your entry criteria and consider paper trading to refine strategy");
    } else if (winRate > 0.7) {
      patterns.push("High win rate (above 70%) - excellent performance");
      suggestions.push("Consider increasing position sizes on high-conviction trades");
    }

    // Check for overtrading
    if (recentTrades.length > 10) {
      const lastDay = new Date();
      lastDay.setDate(lastDay.getDate() - 1);
      const tradesLastDay = recentTrades.filter(trade => trade.timestamp > lastDay).length;
      
      if (tradesLastDay > 5) {
        patterns.push("Potential overtrading detected");
        suggestions.push("Consider reducing trading frequency and focusing on quality setups");
      }
    }

    // Check for revenge trading
    const lossSequences = getConsecutiveLosses(recentTrades);
    if (lossSequences > 2) {
      patterns.push("Consecutive losses detected - risk of revenge trading");
      suggestions.push("Take a short break after consecutive losses to reset emotionally");
    }

    // Default patterns if none detected
    if (patterns.length === 0) {
      patterns.push("Trading patterns appear balanced");
      suggestions.push("Continue following your trading plan consistently");
    }

    return { patterns, suggestions };
  };

  // Helper function to detect consecutive losses
  const getConsecutiveLosses = (trades: PsychologyInsightsPanelProps['recentTrades']) => {
    if (!trades || trades.length === 0) return 0;
    
    let maxConsecutive = 0;
    let current = 0;
    
    for (const trade of trades) {
      if (trade.result === 'loss') {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 0;
      }
    }
    
    return maxConsecutive;
  };

  // Get emotional calibration recommendations
  const getEmotionalCalibration = () => {
    const { fear, greed, patience, discipline, overconfidence } = currentEmotionalState;
    const recommendations = [];
    
    if (fear > 60) {
      recommendations.push("High fear levels may lead to missed opportunities. Practice breathing techniques before trading.");
    }
    
    if (greed > 60) {
      recommendations.push("Elevated greed detected. Remember to stick to your profit targets and avoid moving stops.");
    }
    
    if (patience < 40) {
      recommendations.push("Low patience could lead to premature entries. Wait for confirmation before entering trades.");
    }
    
    if (discipline < 40) {
      recommendations.push("Work on improving trading discipline. Use checklists before entering trades.");
    }
    
    if (overconfidence > 60) {
      recommendations.push("Be cautious of overconfidence. Review your recent wins and losses objectively.");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Your emotional balance appears healthy. Continue monitoring and maintaining awareness.");
    }
    
    return recommendations;
  };

  // Get pre-trade checklist
  const getPreTradeChecklist = () => [
    { id: 1, text: "Is this trade aligned with my strategy?", checked: false },
    { id: 2, text: "Have I identified clear entry and exit points?", checked: false },
    { id: 3, text: "Is my position sizing appropriate for my account?", checked: false },
    { id: 4, text: "Am I trading based on analysis, not emotion?", checked: false },
    { id: 5, text: "Have I checked market conditions and news?", checked: false }
  ];

  const marketInsights = getMarketBasedInsights();
  const { patterns, suggestions } = analyzeTradingPatterns();
  const emotionalRecommendations = getEmotionalCalibration();
  const preTradeChecklist = getPreTradeChecklist();

  // If minimized, show compact version
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-primary text-white shadow-lg"
        >
          <Brain className="h-4 w-4" />
          <span>Trading Psychology</span>
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-96 shadow-xl fixed bottom-4 right-4 z-50 border-t-4 border-t-primary">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Trading Psychology</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => setIsMinimized(true)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Insights to help maintain a balanced trading mindset
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mx-4">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="emotions">Emotions</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
        </TabsList>
        
        <CardContent className="pt-4 px-4 max-h-96 overflow-y-auto">
          <TabsContent value="insights" className="mt-0">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                {marketCondition === 'bullish' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : marketCondition === 'bearish' ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : marketCondition === 'volatile' ? (
                  <Activity className="h-4 w-4 text-orange-500" />
                ) : (
                  <Activity className="h-4 w-4 text-blue-500" />
                )}
                <h3 className="font-medium text-sm">{marketInsights.title}</h3>
              </div>
              <p className="text-xs text-gray-600 mb-2">{marketInsights.description}</p>
              
              <div className="space-y-2 mt-3">
                {marketInsights.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5" />
                    <span className="text-xs">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <History className="h-4 w-4 text-purple-500" />
                <h3 className="font-medium text-sm">Your Trading Patterns</h3>
              </div>
              
              <div className="space-y-2">
                {patterns.map((pattern, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <AlertTriangle className={`h-4 w-4 ${pattern.includes('Low') || pattern.includes('Potential') || pattern.includes('Consecutive') ? 'text-amber-500' : 'text-green-500'} mt-0.5`} />
                    <span className="text-xs">{pattern}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-2 mt-2 border-t border-gray-100">
                <h4 className="text-xs font-medium mb-2">Suggestions:</h4>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Shuffle className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-xs">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="emotions" className="mt-0">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-indigo-500" />
                <h3 className="font-medium text-sm">Emotional Balance</h3>
              </div>
              
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">Fear</span>
                    <span className="text-xs font-medium">{currentEmotionalState.fear}%</span>
                  </div>
                  <Progress value={currentEmotionalState.fear} className="h-1.5" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">Greed</span>
                    <span className="text-xs font-medium">{currentEmotionalState.greed}%</span>
                  </div>
                  <Progress value={currentEmotionalState.greed} className="h-1.5" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">Patience</span>
                    <span className="text-xs font-medium">{currentEmotionalState.patience}%</span>
                  </div>
                  <Progress value={currentEmotionalState.patience} className="h-1.5" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">Discipline</span>
                    <span className="text-xs font-medium">{currentEmotionalState.discipline}%</span>
                  </div>
                  <Progress value={currentEmotionalState.discipline} className="h-1.5" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">Overconfidence</span>
                    <span className="text-xs font-medium">{currentEmotionalState.overconfidence}%</span>
                  </div>
                  <Progress value={currentEmotionalState.overconfidence} className="h-1.5" />
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-medium mb-2">Recommendations:</h4>
                <div className="space-y-2">
                  {emotionalRecommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-teal-500 mt-0.5" />
                      <span className="text-xs">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                <Clock className="h-4 w-4 inline mr-1" />
                <strong>Tip:</strong> Taking a 5-minute meditation break can reset emotional balance before placing trades.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="checklist" className="mt-0">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-green-500" />
                <h3 className="font-medium text-sm">Pre-Trade Checklist</h3>
              </div>
              
              <p className="text-xs text-gray-600 mb-3">
                Review these points before placing your next trade
              </p>
              
              <div className="space-y-2">
                {preTradeChecklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <input 
                      type="checkbox" 
                      id={`check-${item.id}`} 
                      className="h-4 w-4 rounded text-primary border-gray-300 focus:ring-primary"
                    />
                    <label htmlFor={`check-${item.id}`} className="text-xs">
                      {item.text}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-3 bg-amber-50 rounded-lg mb-3">
              <p className="text-xs text-amber-700">
                <Eye className="h-4 w-4 inline mr-1" />
                <strong>Insight:</strong> Complete this checklist to avoid impulsive trading decisions.
              </p>
            </div>
            
            <Button size="sm" className="w-full text-xs">
              Reset Checklist
            </Button>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="pt-0 px-4 pb-4">
        <div className="w-full text-center">
          <p className="text-xs text-gray-500">
            Update your emotional state daily for better insights
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PsychologyInsightsPanel;