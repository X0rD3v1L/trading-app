import React, { useEffect, useRef, useState } from "react";
import { Kline } from "../utils/kline";

const ChartComponent = () => {
  const chartRef = useRef(null);
  const klineInstance = useRef(null);
  const [timeframe, setTimeframe] = useState("2m");
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m"
      );
      const data = await res.json();
      return data.map(([time1, open, high, low, close, volume]) => ({
        time: time1 / 1000,
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: Number(volume),
      }));
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const setup = async () => {
      const data = await fetchInitialData();

      if (!chartRef.current) return;

      klineInstance.current = new Kline(chartRef.current);
      data.forEach((k) => klineInstance.current.upsert1minKline(k));

      const socket = new WebSocket("ws://127.0.0.1:8080");

      socket.onopen = () => {
        console.log("✅ WebSocket connected to Rust backend");
        setConnectionStatus("connected");
      };

      socket.onmessage = (event) => {
        try {
          const pl = JSON.parse(event.data);
          console.log(pl);
          if (pl && pl.event === "KLINE") {
            klineInstance.current?.upsert1minKline(pl.data);
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      socket.onclose = () => {
        console.log("🔌 WebSocket disconnected");
        setConnectionStatus("disconnected");
      };

      klineInstance.current.setTargetTimeframe(timeframe);

      return () => {
        socket.close();
      };
    };

    setup();
  }, []);

  useEffect(() => {
    if (klineInstance.current) {
      klineInstance.current.setTargetTimeframe(timeframe);
    }
  }, [timeframe]);

  return (
    <>
      <div>
        <div className="timeframe-selector">
          <select 
            onChange={(e) => setTimeframe(e.target.value)} 
            value={timeframe}
            className="timeframe-select"
          >
            <option value="2m">2m</option>
            <option value="3m">3m</option>
            <option value="5m">5m</option>
            <option value="10m">10m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
          </select>
        </div>
      </div>
      
      <div>
        
        {isLoading ? (
          <div className="loading-indicator">Loading chart data...</div>
        ) : (
          <div 
            ref={chartRef} 
            className="chart-content"
            style={{ width: "100%", height: "450px" }}
          />
        )}
        
        {connectionStatus === "disconnected" && !isLoading && (
          <div className="connection-warning">
            Websocket disconnected. Showing historical data only.
          </div>
        )}
      </div>
    </>
  );
};

export default ChartComponent