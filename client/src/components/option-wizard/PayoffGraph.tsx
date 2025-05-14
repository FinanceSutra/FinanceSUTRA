import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Position = {
  id: number;
  segment: string;
  buyOrSell: string;
  strikeType: string;
  strikeValue: string;
  expiry: string;
  lots: number;
  slPercent: number;
  trlPercent: number;
  entryPercent: number;
};

interface PayoffGraphProps {
  positions: Position[];
  underlying: string;
  daysLeft: number | null;
  entryDays: string[];
}

// Constants for strategy calculations
const NIFTY_BANK_SPOT = 48350;
const NIFTY_50_SPOT = 22500;
const NIFTY_FIN_SERVICE_SPOT = 20800;
const OPTION_MULTIPLIER = 30; // Each lot has 30 contracts

const PayoffGraph: React.FC<PayoffGraphProps> = ({ positions, underlying, daysLeft, entryDays }) => {
  const [timeDecay, setTimeDecay] = useState<'today' | '1day' | '1week' | 'expiry'>('today');
  const [payoffData, setPayoffData] = useState<any[]>([]);
  
  // Get the spot price based on the selected underlying
  const getSpotPrice = (): number => {
    switch (underlying) {
      case 'NIFTY BANK':
        return NIFTY_BANK_SPOT;
      case 'NIFTY 50':
        return NIFTY_50_SPOT;
      case 'NIFTY FIN SERVICE':
        return NIFTY_FIN_SERVICE_SPOT;
      default:
        return NIFTY_BANK_SPOT;
    }
  };

  // Calculate theoretical option price based on spot price, strike, days to expiry
  const calculateOptionPrice = (
    spotPrice: number, 
    strike: number, 
    daysToExpiry: number, 
    type: 'CE' | 'PE'
  ): number => {
    // This is a simplified option pricing model
    // In a real app, you would use Black-Scholes or other proper pricing models
    const timeDecayFactor = Math.max(0.1, daysToExpiry / 30);
    const distanceFromStrike = type === 'CE' 
      ? spotPrice - strike 
      : strike - spotPrice;
    
    // Calculate intrinsic value
    const intrinsic = Math.max(0, distanceFromStrike);
    
    // Add time value based on days to expiry and volatility
    const volatility = 0.2; // Assumed volatility of 20%
    const timeValue = strike * volatility * timeDecayFactor * Math.sqrt(daysToExpiry / 365);
    
    return intrinsic + timeValue;
  };

  // Calculate payoff for the strategy at different underlying prices
  const calculatePayoff = () => {
    const spotPrice = getSpotPrice();
    let daysToExpiry = 1;
    
    switch (timeDecay) {
      case '1day':
        daysToExpiry = Math.max(1, (daysLeft || 7) - 1);
        break;
      case '1week':
        daysToExpiry = Math.max(1, (daysLeft || 7) - 5);
        break;
      case 'expiry':
        daysToExpiry = 0.1; // Almost at expiry
        break;
      default:
        daysToExpiry = daysLeft || 7;
    }
    
    // Generate price range +/- 5% around the spot price
    const minPrice = spotPrice * 0.95;
    const maxPrice = spotPrice * 1.05;
    const step = (maxPrice - minPrice) / 50;
    
    const data = [];
    
    for (let price = minPrice; price <= maxPrice; price += step) {
      let payoff = 0;
      
      positions.forEach(position => {
        // Determine strike price based on spotPrice and strikeValue
        let strike = spotPrice;
        if (position.strikeValue === '+1') {
          strike = spotPrice * 1.01; // 1% above spot
        } else if (position.strikeValue === '-1') {
          strike = spotPrice * 0.99; // 1% below spot
        }
        
        // Calculate option price at current spot
        const initialOptionPrice = calculateOptionPrice(
          spotPrice, 
          strike, 
          daysLeft || 7, 
          position.segment as 'CE' | 'PE'
        );
        
        // Calculate option price at hypothetical price
        const currentOptionPrice = calculateOptionPrice(
          price, 
          strike, 
          daysToExpiry, 
          position.segment as 'CE' | 'PE'
        );
        
        // Calculate P&L for this position
        const positionPnL = position.buyOrSell === 'B'
          ? (currentOptionPrice - initialOptionPrice) * position.lots * OPTION_MULTIPLIER
          : (initialOptionPrice - currentOptionPrice) * position.lots * OPTION_MULTIPLIER;
        
        payoff += positionPnL;
      });
      
      data.push({
        price: Math.round(price),
        payoff: Math.round(payoff),
      });
    }
    
    return data;
  };

  useEffect(() => {
    // Calculate payoff data when dependencies change
    const data = calculatePayoff();
    setPayoffData(data);
  }, [positions, underlying, daysLeft, timeDecay]);

  // Get day names for the week
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Strategy Payoff Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <Label>Time Decay</Label>
              <Select value={timeDecay} onValueChange={(value) => setTimeDecay(value as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time decay" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="1day">After 1 day</SelectItem>
                  <SelectItem value="1week">After 1 week</SelectItem>
                  <SelectItem value="expiry">At expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              {weekdays.map(day => (
                <div 
                  key={day}
                  className={`px-3 py-1 rounded-md text-sm ${
                    entryDays.includes(day) 
                      ? 'bg-green-100 text-green-800 border border-green-300' 
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={payoffData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="price" 
                  label={{ value: `${underlying} Price`, position: 'insideBottomRight', offset: -10 }} 
                />
                <YAxis 
                  label={{ value: 'P&L (₹)', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip formatter={(value) => [`₹${value}`, 'P&L']} />
                <Legend />
                <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
                <ReferenceLine x={getSpotPrice()} stroke="#888" strokeDasharray="3 3" label="Current" />
                <Line 
                  type="monotone" 
                  dataKey="payoff" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  name="Strategy P&L"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Max Profit</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{Math.max(...payoffData.map(d => d.payoff))}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Max Loss</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{Math.min(...payoffData.map(d => d.payoff))}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Break-even</p>
              <p className="text-2xl font-bold">
                {(() => {
                  const breakeven = payoffData.find(d => Math.abs(d.payoff) < 10)?.price;
                  return breakeven ? `₹${breakeven}` : 'N/A';
                })()}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Risk:Reward</p>
              <p className="text-2xl font-bold">
                {(() => {
                  const maxProfit = Math.max(...payoffData.map(d => d.payoff));
                  const maxLoss = Math.abs(Math.min(...payoffData.map(d => d.payoff)));
                  return maxLoss > 0 ? (maxProfit / maxLoss).toFixed(2) : 'N/A';
                })()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayoffGraph;