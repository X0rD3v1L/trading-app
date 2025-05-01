import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import "./OrderBookComponent.css";

export default function OrderBookComponent() {
  const [asks, setAsks] = useState([]);
  const [bids, setBids] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [currentPrice, setCurrentPrice] = useState('81,237.21');
  const [currentPriceUSD, setCurrentPriceUSD] = useState('$97,000.00');
  const socketRef = useRef(null);

  useEffect(() => {

    const socket = new WebSocket('ws://127.0.0.1:8080');
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('✅ WebSocket connected to Rust backend');
      setConnectionStatus('connected');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        

        if (data && data.stream && data.stream.includes('@depth')) {

          const orderBookData = data.data;
          console.log(orderBookData)

          if (orderBookData.asks && Array.isArray(orderBookData.asks)) {
            const formattedAsks = orderBookData.asks.map(ask => ({
              price: parseFloat(ask[0]),
              qty: parseFloat(ask[1]),
              total: parseFloat(ask[0]) * parseFloat(ask[1])
            })).slice(0, 9); // Limit to 9 entries for UI
            console.log(formattedAsks, "FOrat");
            setAsks(formattedAsks);
          }
          

          if (orderBookData.bids && Array.isArray(orderBookData.bids)) {
            const formattedBids = orderBookData.bids.map(bid => ({
              price: parseFloat(bid[0]),
              qty: parseFloat(bid[1]),
              total: parseFloat(bid[0]) * parseFloat(bid[1])
            })).slice(0, 7); // Limit to 7 entries for UI
            
            setBids(formattedBids);
          }
          

          if (orderBookData.bids && orderBookData.bids.length > 0) {
            const price = parseFloat(orderBookData.bids[0][0]);
            setCurrentPrice(price.toLocaleString(undefined, {minimumFractionDigits: 2}));
            setCurrentPriceUSD(`$${(price).toLocaleString(undefined, {minimumFractionDigits: 2})}`);
          }
        }
        

        if (data && data.event === 'KLINE') {
          const klineData = data.data;

          const price = klineData.close;
          setCurrentPrice(price.toLocaleString(undefined, {minimumFractionDigits: 2}));
          setCurrentPriceUSD(`$${price.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
      setConnectionStatus('error');
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setConnectionStatus('disconnected');
    };


    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <div className="orderbook-container">
      <div className="connection-status">
        Status: <span className={`status-${connectionStatus}`}>{connectionStatus}</span>
      </div>
      
      <div className="orderbook-header">
        <div>Price (USDT)</div>
        <div>Qty (BTC)</div>
        <div>Total (USDT)</div>
      </div>
      
      {/* Asks (Sell orders) */}
      <div className="orderbook-asks">
      {Array.isArray(asks) && asks.length ? (
  asks.map((order, index) => (
    <div key={index} className="orderbook-row">
      <div className="ask-price">{order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
      <div className="order-qty">{order.qty.toFixed(6)}</div>
      <div className="order-total">{order.total.toFixed(2)}</div>
    </div>
  ))
) : (
  <div className="orderbook-loading">Loading ask orders...</div>
)}
      </div>
      
      {/* Current price indicator */}
      <div className="current-price-indicator">
        <div className="indicator-price">{currentPrice} <ChevronRight size={14} className="inline-icon" /></div>
        <div className="indicator-usd">{currentPriceUSD}</div>
      </div>
      
      {/* Bids (Buy orders) */}
      <div className="orderbook-bids">
        {bids.length > 0 ? (
          bids.map((order, index) => (
            <div key={index} className="orderbook-row">
              <div className="bid-price">{order.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
              <div className="order-qty">{order.qty.toFixed(6)}</div>
              <div className="order-total">{order.total.toFixed(2)}</div>
            </div>
          ))
        ) : (
          <div className="orderbook-loading">Loading bid orders...</div>
        )}
      </div>
    </div>
  );
}