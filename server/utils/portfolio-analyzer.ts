/**
 * Portfolio Analyzer Utility
 * 
 * This utility provides functions for analyzing investment portfolios based on uploaded broker data.
 * It supports data from various Indian brokers like Zerodha, Groww, Upstox, etc. and provides
 * risk analysis, market comparison, and portfolio optimization suggestions.
 */

interface PortfolioHolding {
  symbol: string;
  name: string;
  type: string;  // Equity, MF, ETF, Gold, Bond, etc.
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  allocation: number; // Percentage of portfolio
  sector?: string;
  beta?: number;
  riskLevel?: 'Low' | 'Medium' | 'High';
}

interface RiskAnalysis {
  overallRisk: 'Low' | 'Medium' | 'High';
  diversificationScore: number; // 0-100
  sectorConcentration: {
    sector: string;
    percentage: number;
  }[];
  volatility: number;
  beta: number;
  sharpeRatio: number;
  portfolioCorrelation: number;
  maxDrawdown: number;
  riskContributors: {
    symbol: string;
    contribution: number;
  }[];
}

interface MarketComparison {
  nifty50Performance: number;
  portfolioPerformance: number;
  indexComparisons: {
    indexName: string;
    indexPerformance: number;
  }[];
  sectoralIndices: {
    sector: string;
    indexPerformance: number;
    holdingsPerformance: number;
  }[];
}

interface PortfolioSuggestion {
  type: 'add' | 'remove' | 'reduce' | 'increase' | 'hedge';
  symbol: string;
  name: string;
  reason: string;
  expectedImpact: string;
  confidence: number; // 0-100
}

interface PortfolioAnalysisResult {
  holdings: PortfolioHolding[];
  riskAnalysis: RiskAnalysis;
  marketComparison: MarketComparison;
  suggestions: PortfolioSuggestion[];
}

// Market data and sector mapping
const marketData = {
  // Sector performance over last 3 months (%)
  sectorPerformance: {
    'Information Technology': 8.5,
    'Financial Services': 6.2,
    'Energy': 15.3,
    'Infrastructure': -5.7,
    'Consumer Goods': 4.3,
    'Pharma': 10.2,
    'Auto': 7.8,
    'Metals': -2.5,
    'FMCG': 3.2,
    'Telecom': 5.6
  },
  // Indian indices performance over last 3 months (%)
  indices: {
    'Nifty 50': 12.5,
    'Sensex': 11.8, 
    'Nifty Bank': 8.9,
    'Nifty IT': 9.2,
    'Nifty Pharma': 14.5,
    'Nifty Auto': 7.6,
    'Nifty FMCG': 4.2,
    'Nifty Energy': 16.3,
    'Nifty Metal': -1.8,
    'Nifty Realty': 3.5
  },
  // Nifty 50 performance (using same value for compatibility)
  nifty50Performance: 12.5,
  // Stock data cache for common Indian stocks
  stocks: {
    // Symbol -> {name, price, sector, beta}
    'RELIANCE': { 
      name: 'Reliance Industries Ltd', 
      price: 2750, 
      sector: 'Energy', 
      beta: 1.1,
      volatility: 22.3,
      riskLevel: 'Medium'
    },
    'TCS': { 
      name: 'Tata Consultancy Services Ltd', 
      price: 3450, 
      sector: 'Information Technology', 
      beta: 0.8,
      volatility: 18.7,
      riskLevel: 'Low'
    },
    'HDFCBANK': { 
      name: 'HDFC Bank Ltd', 
      price: 1420, 
      sector: 'Financial Services', 
      beta: 1.2,
      volatility: 24.1,
      riskLevel: 'Medium'
    },
    'INFY': { 
      name: 'Infosys Ltd', 
      price: 1600, 
      sector: 'Information Technology', 
      beta: 0.9,
      volatility: 19.8,
      riskLevel: 'Low'
    },
    'AXISBANK': { 
      name: 'Axis Bank Ltd', 
      price: 920, 
      sector: 'Financial Services', 
      beta: 1.3,
      volatility: 28.2,
      riskLevel: 'Medium'
    },
    'ADANIPORTS': { 
      name: 'Adani Ports & SEZ Ltd', 
      price: 650, 
      sector: 'Infrastructure', 
      beta: 1.4,
      volatility: 32.5,
      riskLevel: 'High'
    },
    'SGBJAN28': { 
      name: 'Sovereign Gold Bond Jan 2028', 
      price: 5800, 
      sector: 'Gold', 
      beta: 0.1,
      volatility: 12.3,
      riskLevel: 'Low'
    },
    'SBIN': { 
      name: 'State Bank of India', 
      price: 560, 
      sector: 'Financial Services', 
      beta: 1.3,
      volatility: 27.8,
      riskLevel: 'Medium'
    },
    'TATAMOTORS': { 
      name: 'Tata Motors Ltd', 
      price: 780, 
      sector: 'Auto', 
      beta: 1.5,
      volatility: 31.2,
      riskLevel: 'High'
    },
    'SUNPHARMA': { 
      name: "Sun Pharmaceutical Industries Ltd", 
      price: 1050, 
      sector: 'Pharma', 
      beta: 0.7,
      volatility: 17.9,
      riskLevel: 'Low'
    },
    'BHARTIARTL': { 
      name: 'Bharti Airtel Ltd', 
      price: 840, 
      sector: 'Telecom', 
      beta: 0.9,
      volatility: 19.3,
      riskLevel: 'Medium'
    },
    'HCLTECH': { 
      name: 'HCL Technologies Ltd', 
      price: 1180, 
      sector: 'Information Technology', 
      beta: 0.85,
      volatility: 19.2,
      riskLevel: 'Low'
    },
    'WIPRO': { 
      name: 'Wipro Ltd', 
      price: 420, 
      sector: 'Information Technology', 
      beta: 0.9,
      volatility: 20.5,
      riskLevel: 'Low'
    },
    'ITC': { 
      name: 'ITC Ltd', 
      price: 440, 
      sector: 'FMCG', 
      beta: 0.7,
      volatility: 15.3,
      riskLevel: 'Low'
    },
    'DIVISLAB': { 
      name: "Divi's Laboratories Ltd", 
      price: 3600, 
      sector: 'Pharma', 
      beta: 0.8,
      volatility: 18.9,
      riskLevel: 'Medium'
    },
    'HINDALCO': { 
      name: 'Hindalco Industries Ltd', 
      price: 520, 
      sector: 'Metals', 
      beta: 1.6,
      volatility: 33.1,
      riskLevel: 'High'
    },
    'KOTAKBANK': { 
      name: 'Kotak Mahindra Bank Ltd', 
      price: 1740, 
      sector: 'Financial Services', 
      beta: 1.1,
      volatility: 23.6,
      riskLevel: 'Medium'
    },
    'NIFTYBEES': { 
      name: 'Nippon India ETF Nifty BeES', 
      price: 220, 
      sector: 'ETF', 
      beta: 1.0,
      volatility: 15.8,
      riskLevel: 'Medium'
    }
  }
};

/**
 * Parses portfolio data from different broker formats
 */
export function parsePortfolioFile(
  fileContent: string, 
  brokerType: string
): PortfolioHolding[] {
  // In a real implementation, this would parse different broker file formats
  // For this demo, we'll return mock data
  
  console.log(`Parsing ${brokerType} portfolio file`);
  
  // Generate sample portfolio data based on broker type
  // In a real app, this would use actual file parsing logic
  const mockPortfolio: PortfolioHolding[] = [
    {
      symbol: "RELIANCE",
      name: "Reliance Industries Ltd",
      type: "Equity",
      quantity: 10,
      avgPrice: 2400,
      currentPrice: 2750,
      value: 27500,
      pnl: 3500,
      pnlPercent: 14.58,
      allocation: 16.5,
      sector: "Energy",
      beta: 1.1,
      riskLevel: "Medium"
    },
    {
      symbol: "TCS",
      name: "Tata Consultancy Services Ltd",
      type: "Equity",
      quantity: 5,
      avgPrice: 3200,
      currentPrice: 3450,
      value: 17250,
      pnl: 1250,
      pnlPercent: 7.81,
      allocation: 10.3,
      sector: "Information Technology",
      beta: 0.8,
      riskLevel: "Low"
    },
    {
      symbol: "HDFCBANK",
      name: "HDFC Bank Ltd",
      type: "Equity",
      quantity: 15,
      avgPrice: 1500,
      currentPrice: 1420,
      value: 21300,
      pnl: -1200,
      pnlPercent: -5.33,
      allocation: 12.8,
      sector: "Financial Services",
      beta: 1.2,
      riskLevel: "Medium"
    },
    {
      symbol: "INFY",
      name: "Infosys Ltd",
      type: "Equity",
      quantity: 20,
      avgPrice: 1450,
      currentPrice: 1600,
      value: 32000,
      pnl: 3000,
      pnlPercent: 10.34,
      allocation: 19.2,
      sector: "Information Technology",
      beta: 0.9,
      riskLevel: "Low"
    },
    {
      symbol: "AXISBANK",
      name: "Axis Bank Ltd",
      type: "Equity",
      quantity: 25,
      avgPrice: 850,
      currentPrice: 920,
      value: 23000,
      pnl: 1750,
      pnlPercent: 8.24,
      allocation: 13.8,
      sector: "Financial Services",
      beta: 1.3,
      riskLevel: "Medium"
    },
    {
      symbol: "ADANIPORTS",
      name: "Adani Ports & SEZ Ltd",
      type: "Equity",
      quantity: 40,
      avgPrice: 750,
      currentPrice: 650,
      value: 26000,
      pnl: -4000,
      pnlPercent: -13.33,
      allocation: 15.6,
      sector: "Infrastructure",
      beta: 1.4,
      riskLevel: "High"
    },
    {
      symbol: "SGBJAN28",
      name: "Sovereign Gold Bond Jan 2028",
      type: "Gold",
      quantity: 5,
      avgPrice: 5000,
      currentPrice: 5800,
      value: 29000,
      pnl: 4000,
      pnlPercent: 16.00,
      allocation: 11.8,
      beta: 0.1,
      riskLevel: "Low"
    },
  ];
  
  // In a real implementation, different brokers would have different parsing logic
  if (brokerType === 'zerodha') {
    // Zerodha specific parsing would go here
    // For this example, add a Zerodha-specific holding
    mockPortfolio.push({
      symbol: "SBIN",
      name: "State Bank of India",
      type: "Equity",
      quantity: 30,
      avgPrice: 520,
      currentPrice: 560,
      value: 16800,
      pnl: 1200,
      pnlPercent: 7.69,
      allocation: 9.5,
      sector: "Financial Services",
      beta: 1.3,
      riskLevel: "Medium"
    });
  } else if (brokerType === 'groww') {
    // Groww specific parsing would go here
    // For this example, add a Groww-specific holding
    mockPortfolio.push({
      symbol: "TATAMOTORS",
      name: "Tata Motors Ltd",
      type: "Equity",
      quantity: 20,
      avgPrice: 700,
      currentPrice: 780,
      value: 15600,
      pnl: 1600,
      pnlPercent: 11.43,
      allocation: 8.8,
      sector: "Auto",
      beta: 1.5,
      riskLevel: "High"
    });
  }
  
  // Recalculate allocations to ensure they sum to 100%
  const totalValue = mockPortfolio.reduce((sum, holding) => sum + holding.value, 0);
  return mockPortfolio.map(holding => ({
    ...holding,
    allocation: (holding.value / totalValue) * 100
  }));
}

/**
 * Analyzes portfolio risk based on holdings data
 */
export function analyzePortfolioRisk(holdings: PortfolioHolding[]): RiskAnalysis {
  // Calculate sector concentration
  const sectors: { [key: string]: number } = {};
  let totalAllocation = 0;
  
  holdings.forEach(holding => {
    if (holding.sector) {
      if (!sectors[holding.sector]) {
        sectors[holding.sector] = 0;
      }
      sectors[holding.sector] += holding.allocation;
      totalAllocation += holding.allocation;
    }
  });
  
  const sectorConcentration = Object.entries(sectors).map(([sector, percentage]) => ({
    sector,
    percentage: (percentage / totalAllocation) * 100
  }));
  
  // Identify top risk contributors
  const riskContributors = holdings
    .filter(holding => holding.beta && holding.beta > 1)
    .sort((a, b) => (b.beta || 0) - (a.beta || 0))
    .slice(0, 3)
    .map(holding => ({
      symbol: holding.symbol,
      contribution: holding.allocation * (holding.beta || 1)
    }));
  
  // Calculate portfolio beta
  const weightedBeta = holdings.reduce((sum, holding) => {
    return sum + (holding.allocation / 100) * (holding.beta || 1);
  }, 0);
  
  // Determine overall risk based on portfolio characteristics
  let overallRisk: 'Low' | 'Medium' | 'High' = 'Medium';
  const highRiskCount = holdings.filter(h => h.riskLevel === 'High').length;
  const lowRiskCount = holdings.filter(h => h.riskLevel === 'Low').length;
  
  if (highRiskCount > holdings.length / 3) {
    overallRisk = 'High';
  } else if (lowRiskCount > holdings.length / 2) {
    overallRisk = 'Low';
  }
  
  // Calculate volatility as weighted average of individual volatilities
  // In a real implementation, this would use covariance matrix and proper math
  const avgVolatility = holdings.reduce((sum, holding) => {
    const stockInfo = marketData.stocks[holding.symbol];
    return sum + (holding.allocation / 100) * (stockInfo?.volatility || 20);
  }, 0);
  
  // Calculate diversification score based on sector concentration and correlation
  let diversificationScore = 100;
  
  // Penalty for sector concentration
  const highConcentrationSectors = sectorConcentration.filter(s => s.percentage > 25);
  diversificationScore -= highConcentrationSectors.length * 15;
  
  // Penalty for too few sectors
  if (sectorConcentration.length < 4) {
    diversificationScore -= (4 - sectorConcentration.length) * 10;
  }
  
  // Penalty for high correlation between holdings
  // In reality, this would be based on actual correlation matrix
  if (sectorConcentration.filter(s => s.percentage > 20).length > 1) {
    diversificationScore -= 10;
  }
  
  // Bound the score between 0-100
  diversificationScore = Math.max(0, Math.min(100, diversificationScore));
  
  return {
    overallRisk,
    diversificationScore,
    sectorConcentration,
    volatility: avgVolatility,
    beta: weightedBeta,
    sharpeRatio: 0.92, // Would calculate from returns and volatility
    portfolioCorrelation: 0.78, // Would calculate from correlation matrix
    maxDrawdown: 15.2, // Would calculate from historical returns
    riskContributors
  };
}

/**
 * Compares portfolio performance with market benchmarks
 */
export function compareWithMarket(holdings: PortfolioHolding[]): MarketComparison {
  // Calculate portfolio performance
  const totalInvestment = holdings.reduce((sum, holding) => sum + (holding.avgPrice * holding.quantity), 0);
  const currentValue = holdings.reduce((sum, holding) => sum + (holding.currentPrice * holding.quantity), 0);
  const portfolioPerformance = ((currentValue - totalInvestment) / totalInvestment) * 100;
  
  // Generate index comparisons
  const indexComparisons = Object.entries(marketData.indices).map(([indexName, performance]) => ({
    indexName,
    indexPerformance: performance
  }));
  
  // Calculate sector performance for holdings vs. benchmarks
  const sectoralIndices: {
    sector: string;
    indexPerformance: number;
    holdingsPerformance: number;
  }[] = [];
  
  // Group holdings by sector
  const sectorMap: { [sector: string]: PortfolioHolding[] } = {};
  holdings.forEach(holding => {
    if (holding.sector) {
      if (!sectorMap[holding.sector]) {
        sectorMap[holding.sector] = [];
      }
      sectorMap[holding.sector].push(holding);
    }
  });
  
  // Calculate performance by sector
  Object.entries(sectorMap).forEach(([sector, sectorHoldings]) => {
    const sectorInvestment = sectorHoldings.reduce((sum, h) => sum + (h.avgPrice * h.quantity), 0);
    const sectorValue = sectorHoldings.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
    const sectorPerformance = ((sectorValue - sectorInvestment) / sectorInvestment) * 100;
    
    // Use the sector performance data if available, otherwise default to 0
    const sectorIndex = marketData.sectorPerformance[sector as keyof typeof marketData.sectorPerformance] || 0;
    
    sectoralIndices.push({
      sector,
      indexPerformance: sectorIndex,
      holdingsPerformance: sectorPerformance
    });
  });
  
  return {
    nifty50Performance: marketData.nifty50Performance,
    portfolioPerformance,
    indexComparisons,
    sectoralIndices
  };
}

/**
 * Generates portfolio optimization suggestions
 */
export function generateSuggestions(
  holdings: PortfolioHolding[],
  riskAnalysis: RiskAnalysis
): PortfolioSuggestion[] {
  const suggestions: PortfolioSuggestion[] = [];
  
  // Check sector concentration
  const highConcentrationSectors = riskAnalysis.sectorConcentration
    .filter(sector => sector.percentage > 25)
    .map(sector => sector.sector);
  
  if (highConcentrationSectors.length > 0) {
    // Suggest reducing exposure to overly concentrated sectors
    const highestConcentrationSector = highConcentrationSectors[0];
    const holdingToReduce = holdings.find(h => h.sector === highestConcentrationSector);
    
    if (holdingToReduce) {
      suggestions.push({
        type: 'reduce',
        symbol: holdingToReduce.symbol,
        name: holdingToReduce.name,
        reason: `Your portfolio has ${highConcentrationSectors.length} overconcentrated sectors, with ${highestConcentrationSector} at ${riskAnalysis.sectorConcentration.find(s => s.sector === highestConcentrationSector)?.percentage.toFixed(1)}% of your portfolio.`,
        expectedImpact: "Reducing this position will improve sector diversification and lower overall portfolio risk.",
        confidence: 80
      });
    }
  }
  
  // Check for poor performers to potentially exit
  const poorPerformers = holdings
    .filter(h => h.pnlPercent < -10)
    .sort((a, b) => a.pnlPercent - b.pnlPercent);
  
  if (poorPerformers.length > 0) {
    suggestions.push({
      type: 'remove',
      symbol: poorPerformers[0].symbol,
      name: poorPerformers[0].name,
      reason: `This holding has declined by ${Math.abs(poorPerformers[0].pnlPercent).toFixed(2)}% and is underperforming its sector benchmark by a significant margin.`,
      expectedImpact: "Removing this position can stop further losses and free up capital for better opportunities.",
      confidence: 75
    });
  }
  
  // Suggest adding more diversification
  const missingSectors = ['Consumer Goods', 'Pharma', 'Auto'];
  const portfolioSectors = new Set(holdings.map(h => h.sector));
  const sectorsToAdd = missingSectors.filter(sector => !portfolioSectors.has(sector));
  
  if (sectorsToAdd.length > 0) {
    // Find stock suggestions for missing sectors
    let suggestionSymbol = "DIVISLAB";
    let suggestionName = "Divi's Laboratories Ltd";
    let suggestionSector = "Pharma";

    if (sectorsToAdd.includes('Consumer Goods')) {
      suggestionSymbol = "ITC";
      suggestionName = "ITC Ltd";
      suggestionSector = "Consumer Goods";
    } else if (sectorsToAdd.includes('Auto')) {
      suggestionSymbol = "TATAMOTORS";
      suggestionName = "Tata Motors Ltd";
      suggestionSector = "Auto";
    }

    suggestions.push({
      type: 'add',
      symbol: suggestionSymbol,
      name: suggestionName,
      reason: `Your portfolio lacks exposure to key sectors like ${sectorsToAdd.join(', ')} which can improve diversification.`,
      expectedImpact: `Adding exposure to ${suggestionSector} sector can reduce correlation with existing holdings and improve risk-adjusted returns.`,
      confidence: 85
    });
  }
  
  // Suggest hedging if overall risk is high
  if (riskAnalysis.overallRisk === 'High') {
    suggestions.push({
      type: 'hedge',
      symbol: "NIFTYBEES",
      name: "Nippon India ETF Nifty BeES",
      reason: "Your portfolio has above-average market risk with a beta of " + riskAnalysis.beta.toFixed(2) + ".",
      expectedImpact: "Adding this index ETF can provide a hedge against market volatility while maintaining market exposure.",
      confidence: 70
    });
  }
  
  return suggestions;
}

/**
 * Main function to analyze a portfolio
 * In a real implementation, this would fetch real-time market data
 */
export function analyzePortfolio(
  fileContent: string,
  brokerType: string
): PortfolioAnalysisResult {
  // Parse portfolio file
  const holdings = parsePortfolioFile(fileContent, brokerType);
  
  // Analyze portfolio risk
  const riskAnalysis = analyzePortfolioRisk(holdings);
  
  // Compare with market benchmarks
  const marketComparison = compareWithMarket(holdings);
  
  // Generate optimization suggestions
  const suggestions = generateSuggestions(holdings, riskAnalysis);
  
  return {
    holdings,
    riskAnalysis,
    marketComparison,
    suggestions
  };
}