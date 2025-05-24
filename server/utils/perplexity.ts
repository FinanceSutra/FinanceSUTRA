import axios from 'axios';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityRequestOptions {
  model?: string;
  messages: PerplexityMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Function to make requests to the Perplexity API
 */
export async function callPerplexityAPI(options: PerplexityRequestOptions): Promise<string> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY is not set in environment variables');
  }

  try {
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: options.model || "llama-3.1-sonar-small-128k-online",
        messages: options.messages,
        temperature: options.temperature || 0.2,
        max_tokens: options.max_tokens,
        top_p: 0.9,
        frequency_penalty: 1,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data as PerplexityResponse;
    return data.choices[0].message.content;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Perplexity API Error: ${error.response.status} - ${error.response.data.error?.message || JSON.stringify(error.response.data)}`);
    } else {
      throw new Error(`Perplexity API Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Generate strategy recommendations using Perplexity
 */
export async function generateStrategyRecommendations(userPreferences: any): Promise<string> {
  const systemMessage = `You are an expert algorithmic trading advisor specialized in the Indian markets. 
  Your task is to analyze user trading preferences and generate personalized trading strategy recommendations.
  Format your response as a valid JSON array of strategy objects. Each strategy object should include:
  - name: Strategy name
  - description: Brief description
  - matchScore: Number between 70-100 indicating fit
  - riskLevel: Number from 1-5 (1=low, 5=high)
  - expectedReturn: String (e.g., "5-10% monthly")
  - timeFrame: String (daily, weekly, monthly)
  - suitableMarkets: Array of markets (e.g., ["stocks", "forex"])
  - keyIndicators: Array of indicators used
  - tradeFrequency: String (e.g., "daily", "weekly")
  - backtestPerformance: Object with winRate, profitFactor, maxDrawdown, sharpeRatio
  - complexity: Number from 1-5 (1=simple, 5=complex)
  - code: String with template code for the strategy

  Provide exactly 5 diverse trading strategies that match the user preferences for the Indian market.`;

  const userMessage = `Generate trading strategy recommendations based on these preferences:
  - Risk Tolerance: ${userPreferences.riskTolerance}/5
  - Investment Horizon: ${userPreferences.investmentHorizon}
  - Preferred Markets: ${userPreferences.preferredMarkets.join(', ')}
  - Trading Frequency: ${userPreferences.tradingFrequency}
  - Capital Available: ₹${userPreferences.capitalAvailable}
  - Automation Level: ${userPreferences.automationLevel}
  - Preferred Indicators: ${userPreferences.preferredIndicators.join(', ')}
  
  Focus on strategies suitable for Indian markets with capital requirements in INR.
  For each strategy, include sample template code in TypeScript that implements the strategy logic.`;

  try {
    const response = await callPerplexityAPI({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
    });
    
    return response;
  } catch (error) {
    console.error('Error generating strategy recommendations:', error);
    throw error;
  }
}