/**
 * Mock trade data for demonstration purposes
 * In a real application, this would be replaced with actual trade history from the API
 */

export interface Trade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  amount: number;
  result: 'profit' | 'loss' | 'open';
  profitLoss?: number;
  percentChange?: number;
  timestamp: Date;
}

/**
 * Get mock recent trades for the provided symbol
 * @param symbol - The trading symbol
 * @param count - Number of trades to generate (default: 10)
 * @returns Array of mock trade data
 */
export function getMockTrades(symbol: string, count: number = 10): Trade[] {
  const trades: Trade[] = [];
  const now = new Date();
  
  // Generate random trades over the past 7 days
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 7); // 0-6 days ago
    const hoursAgo = Math.floor(Math.random() * 24); // 0-23 hours ago
    
    const tradeDate = new Date(now);
    tradeDate.setDate(tradeDate.getDate() - daysAgo);
    tradeDate.setHours(tradeDate.getHours() - hoursAgo);
    
    const type = Math.random() > 0.5 ? 'buy' : 'sell';
    const price = getRandomPrice(symbol);
    const quantity = Math.floor(Math.random() * 100) + 1;
    const amount = price * quantity;
    
    // Generate a random profit/loss status with slightly higher probability of profit
    const isProfit = Math.random() > 0.4;
    const result = isProfit ? 'profit' : 'loss';
    
    // Random profit/loss percentage between 1% and 10%
    const percentChange = isProfit 
      ? Math.random() * 9 + 1 
      : -(Math.random() * 9 + 1);
    
    const profitLoss = (amount * percentChange) / 100;
    
    trades.push({
      id: `trade-${symbol}-${i}-${Date.now()}`,
      symbol,
      type,
      quantity,
      price,
      amount,
      result,
      profitLoss,
      percentChange,
      timestamp: tradeDate
    });
  }
  
  // Sort by date (newest first)
  return trades.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Generate a realistic price for a symbol
 * @param symbol - The trading symbol
 * @returns A mock price appropriate for the symbol
 */
function getRandomPrice(symbol: string): number {
  // Set price ranges based on the type of symbol
  if (symbol.includes('NIFTY')) {
    return Math.round((18000 + Math.random() * 2000) * 100) / 100; // NIFTY around 18000-20000
  } else if (symbol.includes('BANK')) {
    return Math.round((40000 + Math.random() * 5000) * 100) / 100; // BANKNIFTY around 40000-45000
  } else if (symbol.startsWith('NSE:')) {
    return Math.round((500 + Math.random() * 1500) * 100) / 100; // NSE stocks around 500-2000
  } else {
    return Math.round((100 + Math.random() * 200) * 100) / 100; // Default range
  }
}