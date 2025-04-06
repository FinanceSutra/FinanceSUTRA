import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface PerformanceDataPoint {
  date: string;
  value: number;
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  timeframe?: '1D' | '1W' | '1M' | '1Y';
  height?: number;
  showGrid?: boolean;
  currencySymbol?: string;
  initialInvestment?: number;
}

const formatCurrency = (value: number, symbol = '$') => {
  return `${symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data = [],
  timeframe = '1M',
  height = 300,
  showGrid = true,
  currencySymbol = '$',
  initialInvestment,
}) => {
  const [activeTimeframe, setActiveTimeframe] = useState(timeframe);
  const [filteredData, setFilteredData] = useState<PerformanceDataPoint[]>(data);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Filter data based on selected timeframe
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

  const handleTimeframeChange = (tf: '1D' | '1W' | '1M' | '1Y') => {
    setActiveTimeframe(tf);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-800 text-white p-2 rounded-md text-xs shadow-lg">
          <p className="font-medium mb-1">{label}</p>
          <p>
            Value:{' '}
            {formatCurrency(payload[0].value, currencySymbol)}
          </p>
          {initialInvestment && (
            <p>
              Gain/Loss:{' '}
              {payload[0].value >= initialInvestment ? (
                <span className="text-green-400">
                  +{formatCurrency(payload[0].value - initialInvestment, currencySymbol)} (
                  {((payload[0].value / initialInvestment - 1) * 100).toFixed(2)}%)
                </span>
              ) : (
                <span className="text-red-400">
                  {formatCurrency(payload[0].value - initialInvestment, currencySymbol)} (
                  {((payload[0].value / initialInvestment - 1) * 100).toFixed(2)}%)
                </span>
              )}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Calculate domain for Y axis
  const minValue = Math.min(...filteredData.map(d => d.value)) * 0.95;
  const maxValue = Math.max(...filteredData.map(d => d.value)) * 1.05;

  // Format dates on X axis based on timeframe
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    switch (activeTimeframe) {
      case '1D':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '1W':
      case '1M':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case '1Y':
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleDateString();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-neutral-900">Performance History</h3>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              activeTimeframe === '1D'
                ? 'text-primary bg-primary bg-opacity-10'
                : 'text-neutral-500 hover:bg-neutral-100'
            }`}
            onClick={() => handleTimeframeChange('1D')}
          >
            1D
          </button>
          <button
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              activeTimeframe === '1W'
                ? 'text-primary bg-primary bg-opacity-10'
                : 'text-neutral-500 hover:bg-neutral-100'
            }`}
            onClick={() => handleTimeframeChange('1W')}
          >
            1W
          </button>
          <button
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              activeTimeframe === '1M'
                ? 'text-primary bg-primary bg-opacity-10'
                : 'text-neutral-500 hover:bg-neutral-100'
            }`}
            onClick={() => handleTimeframeChange('1M')}
          >
            1M
          </button>
          <button
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              activeTimeframe === '1Y'
                ? 'text-primary bg-primary bg-opacity-10'
                : 'text-neutral-500 hover:bg-neutral-100'
            }`}
            onClick={() => handleTimeframeChange('1Y')}
          >
            1Y
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        {filteredData.length > 0 ? (
          <ResponsiveContainer>
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
                tickMargin={10}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, currencySymbol)}
                tick={{ fontSize: 12 }}
                tickMargin={10}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                domain={[minValue, maxValue]}
              />
              <Tooltip content={<CustomTooltip />} />
              {initialInvestment && (
                <ReferenceLine
                  y={initialInvestment}
                  stroke="#718096"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Initial',
                    position: 'insideBottomRight',
                    fontSize: 12,
                    fill: '#718096',
                  }}
                />
              )}
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3182CE" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3182CE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3182CE"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <p className="text-neutral-500">No performance data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceChart;
