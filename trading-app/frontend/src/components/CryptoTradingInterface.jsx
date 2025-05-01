import { useState, useEffect } from 'react';
import { Search, Maximize2, Grid, BarChart2, Clock, ChevronRight, Info, ChevronDown } from 'lucide-react';
import './CryptoTradingInterface.css';
import ChartComponent from './ChartComponent'; // Import the ChartComponent component
import OrderBookComponent from './OrderBookComponent'; // Import our new OrderBook component

export default function CryptoTradingInterface() {
  const [activeTab, setActiveTab] = useState('BTC');
  const [activeSidebarTab, setActiveSidebarTab] = useState('orderbook');
  const cryptoList = [
    { symbol: 'WRXN', pair: 'USDT', price: '0.000424 USDT', change: -4.07 },
    { symbol: 'BRISE', pair: 'USDT', price: '0.00000833 USDT', change: -0.31 },
    { symbol: 'MODE', pair: 'USDT', price: '0.00000608 USDT', change: 2.64 },
    { symbol: 'XEN', pair: 'USDT', price: '0.00000058 USDT', change: 1.69 },
    { symbol: 'VOLT', pair: 'USDT', price: '0.00000105 USDT', change: 0.92 },
    { symbol: 'FEP', pair: 'USDT', price: '0.000173 USDT', change: 6.13 },
    { symbol: 'CATS', pair: 'USDT', price: '0.00000097 USDT', change: 1.45 },
    { symbol: 'X', pair: 'USDT', price: '0.0000751 USDT', change: -0.24 },
    { symbol: 'GOATS', pair: 'USDT', price: '0.00000741 USDT', change: 1.38 },
    { symbol: 'TOSHI', pair: 'USDT', price: '0.000141 USDT', change: 0.65 },
    { symbol: 'BTC', pair: 'USDT', price: '94,737.35 USDT', change: 0.59 },
    { symbol: 'DCX', pair: 'USDT', price: '0.000979 USDT', change: 1.21 },
    { symbol: 'XDB', pair: 'USDT', price: '0.002591 USDT', change: 0.65 },
    { symbol: 'ETH', pair: 'USDT', price: '1,805.96 USDT', change: 0.83 },
    { symbol: 'USDC', pair: 'USDT', price: '0.999 USDT', change: 0.01 },
    { symbol: 'CSPR', pair: 'USDT', price: '0.0154 USDT', change: 51.72 },
    { symbol: 'XRP', pair: 'USDT', price: '2.9271 USDT', change: 6.85 },
    { symbol: 'VRA', pair: 'USDT', price: '0.00140 USDT', change: 2.05 },
    { symbol: 'MEMEFI', pair: 'USDT', price: '0.00283 USDT', change: 5.21 },
  ];
  const btcInfo = {
    price: '97,130.45',
    change: '3.244',
    h24: '97,424.02',
    volume: '0.28',
    high: '97,424.02',
    low: '93,528.71',
  };

  return (
    <div className="crypto-app">
      
      <header className="app-header">
        <div className="header-left">
          <div className="logo">CoinDCX</div>
          <nav className="main-nav">
            <div className="nav-item">TRADE</div>
            <div className="nav-item">EARN</div>
            <div className="nav-item">QUICKBUY</div>
            <div className="nav-item">DCX Learn</div>
          </nav>
        </div>
        <div className="header-right">
          <button className="icon-button">
            <Info size={20} />
          </button>
          <button className="icon-button">
            <Clock size={20} />
          </button>
          <button className="login-button">LOGIN</button>
          <button className="register-button">REGISTER</button>
        </div>
      </header>

      
      <div className="main-content">
        
        <div className="left-sidebar">
          <div className="coin-header">
            <div className="bitcoin-icon">
              <span>₿</span>
            </div>
            <span className="coin-title">BTC/USDT</span>
          </div>
          
          <div className="coin-tabs">
            <button 
              className={`tab-button ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              ALL
            </button>
            <button 
              className={`tab-button ${activeTab === 'USDT' ? 'active' : ''}`}
              onClick={() => setActiveTab('USDT')}
            >
              USDT
            </button>
            <button 
              className={`tab-button ${activeTab === 'BTC' ? 'active' : ''}`}
              onClick={() => setActiveTab('BTC')}
            >
              BTC
            </button>
            <button className="tab-button">MORE</button>
          </div>
          
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search Coins"
                className="search-input"
              />
            </div>
          </div>
          
          <div className="coin-list">
            {cryptoList.map((crypto, index) => (
              <div key={index} className="coin-item">
                <div>
                  <div className="coin-symbol">{crypto.symbol}<span className="coin-pair">/{crypto.pair}</span></div>
                  <div className="coin-price">{crypto.price}</div>
                </div>
                <div className={`coin-change ${crypto.change >= 0 ? 'positive' : 'negative'}`}>
                  {crypto.change >= 0 ? '+' : ''}{crypto.change}%
                </div>
              </div>
            ))}
          </div>
        </div>
        
        
        <div className="chart-container">
          <div className="price-header">
            <div>
              <div className="current-price">{btcInfo.price} USDT</div>
              <div className="price-metrics">
                <span className="price-change">{btcInfo.change}%</span>
                <span className="metric-label">Last Price</span>
                <span className="metric-value">{btcInfo.price}</span>
                <span className="metric-label">24h Vol</span>
                <span className="metric-value">{btcInfo.h24}</span>
              </div>
            </div>
            <div className="action-buttons">
              <button className="buy-button small">BUY</button>
              <button className="sell-button small">SELL</button>
            </div>
          </div>
          
          
          <ChartComponent />
        </div>
        
        
        <div className="right-sidebar">
          <div className="orderbook-tabs">
            <button 
              className={`orderbook-tab ${activeSidebarTab === 'orderbook' ? 'active' : ''}`}
              onClick={() => setActiveSidebarTab('orderbook')}
            >
              Order Book
            </button>
            <button 
              className={`orderbook-tab ${activeSidebarTab === 'tradehistory' ? 'active' : ''}`}
              onClick={() => setActiveSidebarTab('tradehistory')}
            >
              Trade History
            </button>
          </div>
          
          <div className="orderbook-filters">
            <button className="filter-button active">All</button>
            <button className="filter-button">10%</button>
            <button className="filter-button">25%</button>
          </div>
          
          
          {activeSidebarTab === 'orderbook' && <OrderBookComponent />}
          
          {activeSidebarTab === 'tradehistory' && (
            <div className="trade-history-placeholder">
              <p>Trade history will be implemented in the next phase</p>
            </div>
          )}
          
          <div className="action-buttons-container">
            <button className="buy-button full">BUY BTC</button>
            <button className="sell-button full">SELL BTC</button>
          </div>
        </div>
      </div>
    </div>
  );
}