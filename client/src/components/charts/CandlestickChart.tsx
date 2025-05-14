import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ReferenceLine,
  ComposedChart,
  Line,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart as BarChartIcon, 
  LineChart, 
  CandlestickChart as CandlestickIcon, 
  Activity 
} from 'lucide-react';

// Define types for candlestick data
export interface CandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface ChartIndicator {
  type: string;
  period?: number;
  color?: string;
  data: { time: string; value: number }[];
}

interface CandlestickChartProps {
  data: CandlestickData[];
  timeframe?: string;
  height?: number;
  title?: string;
  description?: string;
  currencySymbol?: string;
  showVolume?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  symbol?: string;
  indicators?: ChartIndicator[];
}

type ChartType = 'candlestick' | 'line' | 'bar' | 'area';

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data = [],
  timeframe = '1M',
  height = 400,
  title = 'Market Data',
  description = 'Price movement over time',
  currencySymbol = '₹',
  showVolume = true,
  showGrid = true,
  showLegend = true,
  symbol,
  indicators = [],
}) => {
  // If timeframe is a DB format like '1d', convert to UI format like '1D'
  const normalizeTimeframe = (tf: string): '1D' | '1W' | '1M' | '1Y' => {
    const map: {[key: string]: '1D' | '1W' | '1M' | '1Y'} = {
      '1d': '1D',
      '1wk': '1W',
      '1mo': '1M',
      '1y': '1Y',
      '1m': '1D',
      '5m': '1D',
      '15m': '1D',
      '30m': '1D',
      '1h': '1W',
      '4h': '1W',
    };
    return map[tf] || '1M';
  };
  
  const [activeTimeframe, setActiveTimeframe] = useState<'1D' | '1W' | '1M' | '1Y'>(normalizeTimeframe(timeframe));
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [filteredData, setFilteredData] = useState<CandlestickData[]>(data);

  // Filter data based on the selected timeframe
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Calculate the start date based on the selected timeframe
    const currentDate = new Date();
    let startDate = new Date();

    switch (activeTimeframe) {
      case '1D':
        startDate.setDate(currentDate.getDate() - 1);
        break;
      case '1W':
        startDate.setDate(currentDate.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(currentDate.getMonth() - 1);
        break;
      case '1Y':
        startDate.setFullYear(currentDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(currentDate.getMonth() - 1);
    }

    const filtered = data.filter(
      (item) => new Date(item.date) >= startDate
    );

    setFilteredData(filtered.length > 0 ? filtered : data);
  }, [data, activeTimeframe]);

  // Format currency values
  const formatCurrency = (value: number) => {
    return `${currencySymbol}${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Custom tooltip for all chart types
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-800 text-white p-3 rounded-md shadow-lg text-xs">
          <p className="font-medium mb-1">{label}</p>
          
          {chartType === 'candlestick' && (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>Open:</div>
                <div>{formatCurrency(payload[0].payload.open)}</div>
                <div>High:</div>
                <div>{formatCurrency(payload[0].payload.high)}</div>
                <div>Low:</div>
                <div>{formatCurrency(payload[0].payload.low)}</div>
                <div>Close:</div>
                <div>{formatCurrency(payload[0].payload.close)}</div>
                {payload[0].payload.volume && (
                  <>
                    <div>Volume:</div>
                    <div>{payload[0].payload.volume.toLocaleString()}</div>
                  </>
                )}
              </div>
              <div className="mt-1 pt-1 border-t border-neutral-700">
                <div className={`text-xs ${payload[0].payload.close > payload[0].payload.open ? 'text-green-400' : 'text-red-400'}`}>
                  {payload[0].payload.close > payload[0].payload.open ? '▲' : '▼'} 
                  {formatCurrency(Math.abs(payload[0].payload.close - payload[0].payload.open))} 
                  ({((payload[0].payload.close / payload[0].payload.open - 1) * 100).toFixed(2)}%)
                </div>
              </div>
            </>
          )}
          
          {(chartType === 'line' || chartType === 'area') && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>Close:</div>
              <div>{formatCurrency(payload[0].value)}</div>
            </div>
          )}
          
          {chartType === 'bar' && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>Volume:</div>
              <div>{payload[0].value.toLocaleString()}</div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Format dates on X axis based on timeframe
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    switch (activeTimeframe) {
      case '1D':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '1W':
        return date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
      case '1M':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case '1Y':
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Calculate domain for Y axis for price charts
  const minPrice = Math.min(...filteredData.map(d => d.low)) * 0.998;
  const maxPrice = Math.max(...filteredData.map(d => d.high)) * 1.002;

  // Calculate domain for Y axis for volume chart
  const maxVolume = Math.max(...filteredData.map(d => d.volume || 0)) * 1.1;

  // Prepare data for candlestick visualization
  const prepareVisualData = () => {
    return filteredData.map(candle => ({
      ...candle,
      // Add additional fields used by recharts
      wickTop: candle.high,
      wickBottom: candle.low,
      bodyTop: Math.max(candle.open, candle.close),
      bodyBottom: Math.min(candle.open, candle.close),
      direction: candle.close >= candle.open ? 'up' : 'down',
      color: candle.close >= candle.open ? '#22c55e' : '#ef4444'
    }));
  };

  const visualData = prepareVisualData();
  
  // Render appropriate chart based on selected type
  const renderChart = (): JSX.Element => {
    if (chartType === 'candlestick') {
      return (
        <ComposedChart
          data={visualData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxis}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            yAxisId="price"
            domain={[minPrice, maxPrice]}
            tickFormatter={(value) => formatCurrency(value)}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            yAxisId="volume"
            orientation="right"
            domain={[0, maxVolume]}
            tickFormatter={(value) => value.toLocaleString()}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* Wicks/Shadows */}
          {visualData.map((candle, index) => (
            <Line
              key={`wick-${index}`}
              yAxisId="price"
              type="monotone"
              dataKey="wickTop"
              strokeWidth={1}
              stroke={candle.color}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              data={[candle]}
            />
          ))}
          {visualData.map((candle, index) => (
            <Line
              key={`wick-bottom-${index}`}
              yAxisId="price"
              type="monotone"
              dataKey="wickBottom"
              strokeWidth={1}
              stroke={candle.color}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              data={[candle]}
            />
          ))}

          {/* Candle bodies */}
          {visualData.map((candle, index) => (
            <Bar
              key={`candle-${index}`}
              yAxisId="price"
              dataKey="bodyTop"
              fill={candle.color}
              stroke={candle.color}
              stackId={`stack-${index}`}
              barSize={8}
              isAnimationActive={false}
              data={[candle]}
            />
          ))}
          {visualData.map((candle, index) => (
            <Bar
              key={`candle-body-${index}`}
              yAxisId="price"
              dataKey="bodyBottom"
              fill={candle.color}
              stroke={candle.color}
              stackId={`stack-${index}`}
              barSize={8}
              isAnimationActive={false}
              data={[candle]}
            />
          ))}

          {/* Volume bars */}
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="#64748b"
            fillOpacity={0.3}
            barSize={3}
            name="Volume"
          />
        </ComposedChart>
      );
    } else if (chartType === 'line') {
      return (
        <ComposedChart
          data={filteredData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxis}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            yAxisId="price"
            domain={[minPrice, maxPrice]}
            tickFormatter={(value) => formatCurrency(value)}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            yAxisId="volume"
            orientation="right"
            domain={[0, maxVolume]}
            tickFormatter={(value) => value.toLocaleString()}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Price"
          />
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="#64748b"
            fillOpacity={0.3}
            barSize={3}
            name="Volume"
          />
        </ComposedChart>
      );
    } else if (chartType === 'area') {
      return (
        <ComposedChart
          data={filteredData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxis}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            yAxisId="price"
            domain={[minPrice, maxPrice]}
            tickFormatter={(value) => formatCurrency(value)}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            yAxisId="volume"
            orientation="right"
            domain={[0, maxVolume]}
            tickFormatter={(value) => value.toLocaleString()}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area 
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrice)"
            name="Price"
          />
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="#64748b"
            fillOpacity={0.3}
            barSize={3}
            name="Volume"
          />
        </ComposedChart>
      );
    } else { // bar chart
      return (
        <BarChart
          data={filteredData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxis}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            tickFormatter={(value) => value.toLocaleString()}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="volume" 
            name="Volume" 
            fill="#3b82f6" 
          />
        </BarChart>
      );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={chartType === 'candlestick' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('candlestick')}
              className="rounded-none border-0"
            >
              <CandlestickIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('line')}
              className="rounded-none border-0"
            >
              <LineChart className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'area' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('area')}
              className="rounded-none border-0"
            >
              <Activity className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('bar')}
              className="rounded-none border-0"
            >
              <BarChartIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-5 border-l mx-1"></div>
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={activeTimeframe === '1D' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTimeframe('1D')}
              className="rounded-none border-0 px-2"
            >
              1D
            </Button>
            <Button
              variant={activeTimeframe === '1W' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTimeframe('1W')}
              className="rounded-none border-0 px-2"
            >
              1W
            </Button>
            <Button
              variant={activeTimeframe === '1M' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTimeframe('1M')}
              className="rounded-none border-0 px-2"
            >
              1M
            </Button>
            <Button
              variant={activeTimeframe === '1Y' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTimeframe('1Y')}
              className="rounded-none border-0 px-2"
            >
              1Y
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          {filteredData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-muted-foreground">No market data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CandlestickChart;