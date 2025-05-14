import OpenAI from "openai";
import { UserPreference } from "../recommendation-engine";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate personalized strategy recommendations based on user preferences
 */
export async function generateStrategyRecommendations(userPreference: UserPreference, tradeHistory: any[] = []) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Analyze trade history if available
    const tradeHistoryAnalysis = tradeHistory.length > 0 
      ? `Based on the user's trading history of ${tradeHistory.length} trades, they tend to ${
          tradeHistory.filter(t => t.pnl > 0).length > tradeHistory.length * 0.6 
            ? 'be profitable' 
            : 'struggle with consistency'
        }.`
      : 'User has no trading history yet.';
    
    const prompt = `
    You are an expert algorithmic trading advisor specializing in the Indian financial markets. 
    Generate personalized trading strategy recommendations for a trader with the following preferences:
    
    - Risk Tolerance: ${userPreference.riskTolerance}/5 (where 1 is very conservative and 5 is very aggressive)
    - Investment Horizon: ${userPreference.investmentHorizon} (short, medium, or long term)
    - Preferred Markets: ${userPreference.preferredMarkets.join(', ')}
    - Trading Frequency: ${userPreference.tradingFrequency} (day, swing, or position trading)
    - Capital Available: ₹${userPreference.capitalAvailable.toLocaleString('en-IN')}
    - Automation Level: ${userPreference.automationLevel}
    - Preferred Indicators: ${userPreference.preferredIndicators.join(', ')}
    
    ${tradeHistoryAnalysis}
    
    For each strategy, provide:
    1. A unique ID (string)
    2. Name of the strategy (string)
    3. Description explaining how it works (string)
    4. Match score based on how well it fits the user preferences (number 0-100)
    5. Risk level (number 1-5) 
    6. Expected return (string, e.g. "15-20% annually")
    7. Timeframe (string, e.g. "Daily", "Weekly", "Monthly")
    8. Suitable markets - array of applicable markets (array of strings)
    9. Key indicators used in the strategy (array of strings)
    10. Trading frequency description (string)
    11. Backtest performance metrics (object with winRate, profitFactor, maxDrawdown, sharpeRatio - all numbers)
    12. Complexity level (number 1-5)
    13. Code sample implementing the strategy (string)
    
    Generate 3 high-quality, unique strategies that would be most suitable for this trader. Focus on strategies that:
    - Are appropriate for Indian markets (Nifty, Bank Nifty, etc.)
    - Use INR as the currency
    - Incorporate the preferred indicators
    - Match their risk tolerance and automation preference
    - Suit their capital constraints

    Return ONLY valid JSON without explanation or extra text. Format as an array of strategy objects.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }
    
    const parsedContent = JSON.parse(content);
    
    if (!parsedContent.strategies || !Array.isArray(parsedContent.strategies)) {
      throw new Error('Invalid response format from OpenAI');
    }
    
    return parsedContent.strategies;
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    throw error;
  }
}