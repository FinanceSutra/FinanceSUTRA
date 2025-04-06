import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode, IChartApi, ISeriesApi, LineStyle, Time } from 'lightweight-charts';

interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CandlestickChartProps {
  data: CandlestickData[];
  width?: number | string;
  height?: number;
  showVolume?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  symbol?: string;
  timeframe?: string;
  indicators?: {
    type: 'ma' | 'ema' | 'rsi' | 'bollinger';
    period?: number;
    color?: string;
    data: { time: string; value: number }[];
  }[];
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data = [],
  width = '100%',
  height = 500,
  showVolume = true,
  showGrid = true,
  showLegend = true,
  symbol = 'UNKNOWN',
  timeframe = '1D',
  indicators = [],
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const indicatorSeriesRefs = useRef<ISeriesApi<'Line'>[]>([]);
  const legendRef = useRef<HTMLDivElement>(null);
  const [hoveredData, setHoveredData] = useState<CandlestickData | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Calculate width based on container or props
    const containerWidth = typeof width === 'number' ? width : chartContainerRef.current.clientWidth;
    
    // Clean up previous chart instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
      indicatorSeriesRefs.current = [];
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: containerWidth,
      height,
      layout: {
        backgroundColor: '#ffffff',
        textColor: '#333',
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: {
          color: showGrid ? 'rgba(226, 232, 240, 0.5)' : 'rgba(226, 232, 240, 0)',
          style: LineStyle.Dotted,
        },
        horzLines: {
          color: showGrid ? 'rgba(226, 232, 240, 0.5)' : 'rgba(226, 232, 240, 0)',
          style: LineStyle.Dotted,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: 'rgba(113, 128, 150, 0.5)',
          style: LineStyle.Solid,
        },
        horzLine: {
          width: 1,
          color: 'rgba(113, 128, 150, 0.5)',
          style: LineStyle.Solid,
        },
      },
      timeScale: {
        borderColor: 'rgba(226, 232, 240, 1)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(226, 232, 240, 1)',
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#48BB78',
      downColor: '#F56565',
      borderUpColor: '#48BB78',
      borderDownColor: '#F56565',
      wickUpColor: '#48BB78',
      wickDownColor: '#F56565',
    });
    candlestickSeries.setData(data as any);
    candlestickSeriesRef.current = candlestickSeries;

    // Add volume histogram if enabled
    if (showVolume && data[0]?.volume) {
      // Create a pane for volume
      const volumePaneHeight = Math.floor(height / 5);
      
      chart.applyOptions({
        priceScale: {
          scaleMargins: {
            top: 0.05,
            bottom: volumePaneHeight / height,
          },
        },
      });
      
      const volumeSeries = chart.addHistogramSeries({
        color: 'rgba(113, 128, 150, 0.5)',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 1 - (volumePaneHeight / height),
          bottom: 0,
        },
      });
      
      const volumeData = data.map(d => ({
        time: d.time as Time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(72, 187, 120, 0.5)' : 'rgba(245, 101, 101, 0.5)',
      }));
      
      volumeSeries.setData(volumeData as any);
      volumeSeriesRef.current = volumeSeries;
    }

    // Add indicators
    indicators.forEach((indicator, index) => {
      const indicatorSeries = chart.addLineSeries({
        color: indicator.color || getIndicatorColor(index),
        lineWidth: 2,
        priceLineVisible: false,
      });
      indicatorSeries.setData(indicator.data as any);
      indicatorSeriesRefs.current.push(indicatorSeries);
    });

    // Set up crosshair move handler for legend
    if (showLegend) {
      chart.subscribeCrosshairMove((param) => {
        if (
          param.point === undefined ||
          !param.time ||
          param.point.x < 0 ||
          param.point.x > containerWidth ||
          param.point.y < 0 ||
          param.point.y > height
        ) {
          setHoveredData(null);
          return;
        }

        const candleData = param.seriesData.get(candlestickSeries);
        if (candleData) {
          setHoveredData(candleData as any);
        }
      });
    }

    // Set up resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const newWidth = typeof width === 'number' ? width : chartContainerRef.current.clientWidth;
        chartRef.current.applyOptions({ width: newWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Store chart reference for cleanup
    chartRef.current = chart;

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, width, height, showVolume, showGrid, indicators]);

  // Helper function to get colors for indicators
  const getIndicatorColor = (index: number) => {
    const colors = ['#3182CE', '#805AD5', '#38B2AC', '#DD6B20', '#D53F8C'];
    return colors[index % colors.length];
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <h3 className="text-lg font-medium mr-2">{symbol}</h3>
          <span className="text-sm text-neutral-500">{timeframe}</span>
        </div>
        {showLegend && (
          <div ref={legendRef} className="text-sm">
            {hoveredData && (
              <div className="grid grid-cols-4 gap-x-4">
                <div>
                  <span className="text-neutral-500 mr-1">O:</span>
                  <span className="font-mono">{hoveredData.open.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-neutral-500 mr-1">H:</span>
                  <span className="font-mono">{hoveredData.high.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-neutral-500 mr-1">L:</span>
                  <span className="font-mono">{hoveredData.low.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-neutral-500 mr-1">C:</span>
                  <span className={`font-mono ${
                    hoveredData.close > hoveredData.open ? 'text-success' : 'text-danger'
                  }`}>
                    {hoveredData.close.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div ref={chartContainerRef} />
    </div>
  );
};

export default CandlestickChart;
