import React, { useEffect, useRef } from 'react';
import { 
  createChart, 
  ColorType 
} from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface CandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface ChartIndicator {
  type: 'ma' | 'ema' | 'rsi' | 'bollinger';
  period?: number;
  color?: string;
  data: { time: string; value: number }[];
}

interface LightweightCandlestickChartProps {
  data: CandlestickData[];
  height?: number;
  width?: string;
  title?: string;
  symbol?: string;
  timeframe?: string;
  showVolume?: boolean;
  theme?: 'light' | 'dark';
  indicators?: ChartIndicator[];
}

const LightweightCandlestickChart: React.FC<LightweightCandlestickChartProps> = ({
  data,
  height = 500,
  width = '100%',
  title = 'Price Chart',
  symbol = '',
  timeframe = '',
  showVolume = true,
  theme = 'light',
  indicators = [],
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRefs = useRef<{
    candles: any;
    volume: any;
    indicators: Map<string, any>;
  }>({
    candles: null,
    volume: null,
    indicators: new Map(),
  });
  
  // Format data for lightweight-charts
  const formatCandleData = (candles: CandlestickData[]) => {
    return candles.map(candle => ({
      time: new Date(candle.date).getTime() / 1000,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
  };
  
  const formatVolumeData = (candles: CandlestickData[]) => {
    return candles.map(candle => ({
      time: new Date(candle.date).getTime() / 1000,
      value: candle.volume || 0,
      color: candle.close >= candle.open ? 'rgba(0, 150, 136, 0.5)' : 'rgba(255, 82, 82, 0.5)',
    }));
  };
  
  const formatIndicatorData = (indicator: ChartIndicator) => {
    return indicator.data.map(point => ({
      time: new Date(point.time).getTime() / 1000,
      value: point.value,
    }));
  };
  
  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;
    
    // Cleanup previous chart instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRefs.current.candles = null;
      seriesRefs.current.volume = null;
      seriesRefs.current.indicators.clear();
    }
    
    // Create a new chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { 
          type: ColorType.Solid, 
          color: theme === 'dark' ? '#1E1E1E' : '#FFFFFF' 
        },
        textColor: theme === 'dark' ? '#D9D9D9' : '#191919',
      },
      grid: {
        vertLines: { color: theme === 'dark' ? '#2B2B43' : '#E6E6E6' },
        horzLines: { color: theme === 'dark' ? '#2B2B43' : '#E6E6E6' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: theme === 'dark' ? '#2B2B43' : '#E6E6E6',
      },
      rightPriceScale: {
        borderColor: theme === 'dark' ? '#2B2B43' : '#E6E6E6',
      },
      crosshair: {
        mode: 1,
      },
    });
    
    chartRef.current = chart;
    
    // Add the candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a', 
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    
    seriesRefs.current.candles = candlestickSeries;
    
    // Prepare and set the data
    const candleData = formatCandleData(data);
    candlestickSeries.setData(candleData);
    
    // Add volume if enabled and data available
    if (showVolume && data.some(d => d.volume !== undefined && d.volume > 0)) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.8, // Volume takes up 20% at the bottom
          bottom: 0,
        },
      });
      
      seriesRefs.current.volume = volumeSeries;
      
      // Set volume data
      const volumeData = formatVolumeData(data);
      volumeSeries.setData(volumeData);
    }
    
    // Add technical indicators if available
    if (indicators && indicators.length > 0) {
      indicators.forEach((indicator, idx) => {
        const color = indicator.color || getIndicatorDefaultColor(indicator.type, idx);
        
        const lineSeries = chart.addLineSeries({
          color: color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          title: `${indicator.type.toUpperCase()}${indicator.period ? ` (${indicator.period})` : ''}`,
        });
        
        const lineData = formatIndicatorData(indicator);
        if (lineData.length > 0) {
          lineSeries.setData(lineData);
          seriesRefs.current.indicators.set(`${indicator.type}-${idx}`, lineSeries);
        }
      });
    }
    
    // Fit the content and handle resizing
    chart.timeScale().fitContent();
    
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
        chartRef.current.timeScale().fitContent();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, height, theme, showVolume, indicators]);
  
  // Get default colors for indicators
  const getIndicatorDefaultColor = (type: string, index: number): string => {
    const colors = ['#2962FF', '#FF6D00', '#7B1FA2', '#0097A7', '#388E3C'];
    
    switch (type) {
      case 'ma':
        return '#2962FF';
      case 'ema':
        return '#FF6D00';
      case 'rsi':
        return '#7B1FA2';
      case 'bollinger':
        return '#0097A7';
      default:
        return colors[index % colors.length];
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {title} {symbol && `- ${symbol}`} {timeframe && `(${timeframe})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={chartContainerRef} style={{ width, height }} />
      </CardContent>
    </Card>
  );
};

export default LightweightCandlestickChart;