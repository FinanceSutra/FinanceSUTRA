import OpenAI from "openai";
import { UserPreference } from "../recommendation-engine";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Type for AI generated strategy recommendations
export type AIStrategyRecommendation = {
  id?: string; // Optional ID field, will be generated if not provided
  name: string;
  description: string;
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
  riskLevel: number;
  expectedReturn: string;
  complexity: number;
  matchScore: number;
  code: string;
};

// Generate AI trading strategy recommendations based on user preferences
export async function generateAIRecommendations(
  userPreference: UserPreference
): Promise<AIStrategyRecommendation[]> {
  try {
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key is not set. Using fallback recommendation strategy.");
      // Return an empty array to signal the calling function to use the template-based recommendations
      return [];
    }

    // Format the prompt with user preferences
    const prompt = `Generate 3 personalized algorithmic trading strategies for Indian markets based on the following user preferences:
    
Risk Tolerance: ${userPreference.riskTolerance}/5
Investment Horizon: ${userPreference.investmentHorizon}
Preferred Markets: ${Array.isArray(userPreference.preferredMarkets) ? userPreference.preferredMarkets.join(', ') : userPreference.preferredMarkets}
Trading Frequency: ${userPreference.tradingFrequency}
Capital Available: ₹${userPreference.capitalAvailable.toLocaleString('en-IN')}
Automation Level: ${userPreference.automationLevel}
Preferred Indicators: ${Array.isArray(userPreference.preferredIndicators) ? userPreference.preferredIndicators.join(', ') : userPreference.preferredIndicators}

For each strategy, include:
1. A creative name
2. A clear description explaining the logic
3. Suitable markets from the user's preferences
4. Time frame (e.g., "Daily", "Hourly", "Weekly")
5. Expected trade frequency
6. Key technical indicators used
7. Risk level (1-5 scale)
8. Expected return range (e.g., "12-18% annual")
9. Complexity level (1-5 scale)
10. Match score (70-95 range) indicating how well it matches user preferences
11. Realistic backtest performance metrics:
   - Win rate (percentage)
   - Profit factor (ratio)
   - Max drawdown (percentage)
   - Sharpe ratio (decimal)
12. Detailed strategy code in the Pine Script format for TradingView (preferred in Indian markets)

The strategies should be tailored specifically for the Indian markets, incorporating any relevant local market characteristics, regulations, or trading patterns.

Respond with a JSON object with a 'strategies' array containing the generated strategies.`;

    // Call OpenAI API to generate recommendations
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert algorithmic trading strategy developer specializing in Indian markets. You create well-balanced, practical trading strategies based on user preferences."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      console.warn("No content returned from OpenAI");
      return [];
    }

    try {
      const parsedContent = JSON.parse(content);
      const strategies = parsedContent.strategies;
      
      if (!strategies || !Array.isArray(strategies) || strategies.length === 0) {
        console.warn("Invalid or empty strategies array from OpenAI");
        return [];
      }

      // Process and format the recommendations with strong type checking and default values
      return strategies.map((strategy: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`, // Create a unique ID with ai- prefix to identify AI-generated strategies
        name: strategy.name || `AI Strategy ${index + 1}`,
        description: strategy.description || 'A personalized trading strategy based on your preferences',
        timeFrame: strategy.timeFrame || 'Daily',
        suitableMarkets: Array.isArray(strategy.suitableMarkets) 
          ? strategy.suitableMarkets 
          : strategy.suitableMarkets 
            ? [strategy.suitableMarkets] 
            : ['stocks'],
        keyIndicators: Array.isArray(strategy.keyIndicators) 
          ? strategy.keyIndicators 
          : strategy.keyIndicators
            ? [strategy.keyIndicators]
            : ['Moving Average', 'RSI'],
        tradeFrequency: strategy.tradeFrequency || 'Medium (3-5 trades per week)',
        backtestPerformance: {
          winRate: typeof strategy.backtestPerformance?.winRate === 'number' 
            ? strategy.backtestPerformance.winRate 
            : 65,
          profitFactor: typeof strategy.backtestPerformance?.profitFactor === 'number' 
            ? strategy.backtestPerformance.profitFactor 
            : 2.1,
          maxDrawdown: typeof strategy.backtestPerformance?.maxDrawdown === 'number' 
            ? strategy.backtestPerformance.maxDrawdown 
            : 15,
          sharpeRatio: typeof strategy.backtestPerformance?.sharpeRatio === 'number' 
            ? strategy.backtestPerformance.sharpeRatio 
            : 1.5,
        },
        riskLevel: typeof strategy.riskLevel === 'number' ? strategy.riskLevel : userPreference.riskTolerance,
        expectedReturn: strategy.expectedReturn || '15-20% annual',
        complexity: typeof strategy.complexity === 'number' ? strategy.complexity : 3,
        matchScore: typeof strategy.matchScore === 'number' ? strategy.matchScore : 85,
        code: strategy.code || '// Placeholder for strategy code\n// This is a customized strategy based on your preferences',
      }));
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      return [];
    }
  } catch (error: unknown) {
    console.error("Error generating AI recommendations:", error);
    // Don't re-throw the error, just return an empty array to fall back to template recommendations
    return [];
  }
}