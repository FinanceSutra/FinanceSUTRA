import WebSocket from 'ws';

const protocol = 'ws:';
const wsUrl = `${protocol}//localhost:5000/ws`;
const socket = new WebSocket(wsUrl);

socket.on('open', () => {
  console.log('Connected to WebSocket server');
  // Subscribe to Reliance stock
  socket.send(JSON.stringify({
    type: 'subscribe',
    symbol: 'RELIANCE',
    timeframe: '1d'
  }));
});

socket.on('message', (data) => {
  console.log('Received:', JSON.parse(data.toString()));
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Close after 10 seconds
setTimeout(() => {
  socket.close();
  console.log('Connection closed');
}, 10000);
