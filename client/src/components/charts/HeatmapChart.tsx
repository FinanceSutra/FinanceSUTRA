import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  Tooltip,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Cell,
  Rectangle,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Defining types for the heatmap data
export interface HeatmapDataPoint {
  x: string;
  y: string;
  value: number;
  count: number;
  totalPnl: number;
  avgPnl: number;
  winRate: number;
}

export interface HeatmapMetric {
  id: string;
  label: string;
  description: string;
  valueFormatter: (value: number) => string;
  colorScale: (value: number) => string;
  domain: [number, number];
  defaultValue: number;
}

interface HeatmapChartProps {
  data: HeatmapDataPoint[];
  xAxisCategories: string[];
  yAxisCategories: string[];
  metrics: HeatmapMetric[];
  title?: string;
  description?: string;
  height?: number;
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({
  data = [],
  xAxisCategories,
  yAxisCategories,
  metrics,
  title = 'Trading Performance Heatmap',
  description = 'Analyze your trading performance across multiple dimensions',
  height = 500,
}) => {
  // State for selected metric
  const [selectedMetric, setSelectedMetric] = useState<string>(metrics[0]?.id || 'winRate');

  // Get the currently selected metric configuration
  const currentMetric = useMemo(() => {
    return metrics.find(m => m.id === selectedMetric) || metrics[0];
  }, [metrics, selectedMetric]);

  // Calculate cell size based on the chart area and number of categories
  const cellWidth = 100 / xAxisCategories.length;
  const cellHeight = 100 / yAxisCategories.length;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border shadow-md rounded-md p-3 text-sm">
          <div className="font-semibold mb-1">{`${data.x} × ${data.y}`}</div>
          <div className="text-muted-foreground text-xs mb-2">{`${data.count} trades`}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>Win Rate:</div>
            <div className={data.winRate >= 50 ? 'text-success' : 'text-destructive'}>
              {data.winRate.toFixed(1)}%
            </div>
            <div>Avg P&L:</div>
            <div className={data.avgPnl >= 0 ? 'text-success' : 'text-destructive'}>
              ₹{data.avgPnl.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div>Total P&L:</div>
            <div className={data.totalPnl >= 0 ? 'text-success' : 'text-destructive'}>
              ₹{data.totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div>{currentMetric.label}:</div>
            <div>{currentMetric.valueFormatter(data[currentMetric.id])}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom rendering for the heatmap cells
  const renderCustomizedShape = (props: any) => {
    const { x, y, width, height, value } = props;
    
    // Skip rendering if there's no data
    if (value === currentMetric.defaultValue) {
      return (
        <Rectangle
          {...props}
          fill="#f1f5f9"
          stroke="#e2e8f0"
        />
      );
    }

    // Get the color based on the value
    const cellColor = currentMetric.colorScale(value);

    return (
      <Rectangle
        {...props}
        fill={cellColor}
        stroke="#fff"
        strokeWidth={1}
        rx={2}
        ry={2}
      />
    );
  };

  // Custom legend 
  const renderColorLegend = () => {
    const [min, max] = currentMetric.domain;
    const steps = 5;
    const stepSize = (max - min) / steps;
    
    return (
      <div className="flex items-center justify-center mt-4">
        <div className="text-xs mr-2">{currentMetric.valueFormatter(min)}</div>
        <div className="flex h-4">
          {Array.from({ length: steps + 1 }).map((_, i) => {
            const value = min + stepSize * i;
            return (
              <div
                key={i}
                className="w-12"
                style={{ backgroundColor: currentMetric.colorScale(value) }}
              />
            );
          })}
        </div>
        <div className="text-xs ml-2">{currentMetric.valueFormatter(max)}</div>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">Metric:</span>
          <Select
            value={selectedMetric}
            onValueChange={(value) => setSelectedMetric(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              {metrics.map((metric) => (
                <SelectItem key={metric.id} value={metric.id}>
                  {metric.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          {data.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 60 }}
                >
                  <XAxis
                    dataKey="x"
                    type="category"
                    allowDuplicatedCategory={false}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                    interval={0}
                    padding={{ left: cellWidth / 2, right: cellWidth / 2 }}
                  />
                  <YAxis
                    dataKey="y"
                    type="category"
                    allowDuplicatedCategory={false}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                    interval={0}
                    padding={{ top: cellHeight / 2, bottom: cellHeight / 2 }}
                    reversed
                  />
                  <ZAxis 
                    dataKey={currentMetric.id} 
                    type="number" 
                    domain={currentMetric.domain} 
                    range={[0, 0]} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter
                    data={data}
                    shape={renderCustomizedShape}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} />
                    ))}
                  </Scatter>
                  {currentMetric.id === 'winRate' && (
                    <ReferenceLine y={0} stroke="#cbd5e1" />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
              {renderColorLegend()}
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-muted-foreground">No trading data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatmapChart;