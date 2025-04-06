import { useState, useEffect, useRef, useCallback } from 'react';

export interface MarketDataItem {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: string;
}

interface WebSocketMessage {
  type: string;
  symbol: string;
  data?: MarketDataItem;
  error?: string;
}

interface UseMarketDataWebSocketProps {
  symbol: string;
  timeframe: string;
  onDataUpdate?: (data: MarketDataItem) => void;
}

const useMarketDataWebSocket = ({
  symbol,
  timeframe,
  onDataUpdate
}: UseMarketDataWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [latestData, setLatestData] = useState<MarketDataItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  
  // Determine the WebSocket URL based on the current environment
  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  };
  
  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }
    
    try {
      const wsUrl = getWebSocketUrl();
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        
        // Subscribe to the specified symbol and timeframe
        ws.send(JSON.stringify({
          type: 'subscribe',
          symbol,
          timeframe
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          
          switch (message.type) {
            case 'price_update':
              if (message.data) {
                // Convert timestamp string to Date if needed
                const data = {
                  ...message.data,
                  timestamp: message.data.timestamp instanceof Date 
                    ? message.data.timestamp 
                    : new Date(message.data.timestamp)
                };
                
                setLatestData(data);
                if (onDataUpdate) onDataUpdate(data);
              }
              break;
              
            case 'initial_data':
              if (message.data) {
                // Convert timestamp string to Date if needed
                const data = {
                  ...message.data,
                  timestamp: message.data.timestamp instanceof Date 
                    ? message.data.timestamp 
                    : new Date(message.data.timestamp)
                };
                
                setLatestData(data);
                if (onDataUpdate) onDataUpdate(data);
              }
              break;
              
            case 'error':
              if (message.error) {
                setError(message.error);
                console.error(`WebSocket error: ${message.error}`);
              }
              break;
              
            default:
              console.log('Unknown message type:', message);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };
      
      ws.onclose = (event) => {
        console.log(`WebSocket disconnected, code: ${event.code}, reason: ${event.reason}`);
        setIsConnected(false);
        
        // Attempt to reconnect after a delay, unless the connection was closed deliberately
        if (event.code !== 1000) {
          setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 5000);
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError(`Failed to create WebSocket: ${err}`);
    }
  }, [symbol, timeframe, onDataUpdate]);
  
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      // Unsubscribe before closing
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'unsubscribe',
          symbol,
          timeframe
        }));
      }
      
      wsRef.current.close(1000, 'Disconnected by user');
      wsRef.current = null;
      setIsConnected(false);
    }
  }, [symbol, timeframe]);
  
  useEffect(() => {
    // Only connect when the component unmounts if it was connected before
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [isConnected, disconnect]);
  
  // Resubscribe when symbol or timeframe changes
  useEffect(() => {
    if (isConnected && wsRef.current) {
      // Unsubscribe from previous symbol/timeframe
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        symbol,
        timeframe
      }));
      
      // Subscribe to new symbol/timeframe
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        symbol,
        timeframe
      }));
    }
  }, [symbol, timeframe, isConnected]);
  
  return {
    isConnected,
    latestData,
    error,
    connect,
    disconnect
  };
};

export default useMarketDataWebSocket;