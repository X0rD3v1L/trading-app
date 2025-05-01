use std::collections::VecDeque;
use std::net::TcpListener;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, mpsc};
use std::thread;
use std::time::Duration;
use tungstenite::{accept, connect, Message};
use url::Url;
use serde_json::Value;

mod models;
use models::{
    DepthStreamData, OfferData, StreamWrapper, TradeStreamData, KlineStreamData,
};

static BINANCE_WS_API: &str = "wss://stream.binance.com:9443";

#[derive(Debug)]
struct OrderBook {
    bids: Vec<OfferData>,
    asks: Vec<OfferData>,
}

fn start_local_ws_server(clients: Arc<Mutex<Vec<mpsc::Sender<String>>>>) {
    let server = TcpListener::bind("127.0.0.1:8080").expect("Unable to bind to port 8080");
    println!("Local WebSocket server listening on ws://127.0.0.1:8080");

    for stream in server.incoming() {
        match stream {
            Ok(stream) => {
                
                match accept(stream) {
                    Ok(mut websocket) => {
                        println!("New client connected to local WS.");
                        
                        let (tx, rx) = mpsc::channel::<String>();
                        
                        clients.lock().unwrap().push(tx);
                        
                        thread::spawn(move || {
                            for msg in rx {
                                if websocket.write_message(Message::Text(msg)).is_err() {
                                    
                                    break;
                                }
                            }
                            println!("Client disconnected from local WS.");
                        });
                    },
                    Err(e) => {
                        eprintln!("Error during websocket handshake: {}", e);
                    }
                }
            },
            Err(e) => {
                eprintln!("Connection error on local WS: {}", e);
            }
        }
    }
}

fn main() {
    
    let running = Arc::new(AtomicBool::new(true));
    let r = running.clone();
    ctrlc::set_handler(move || {
        println!("Received Ctrl+C, shutting down...");
        r.store(false, Ordering::SeqCst);
    }).expect("Error setting Ctrl-C handler");

    
    let clients: Arc<Mutex<Vec<mpsc::Sender<String>>>> = Arc::new(Mutex::new(Vec::new()));

    
    let clients_clone = clients.clone();
    thread::spawn(move || {
        start_local_ws_server(clients_clone);
    });

    
    let binance_url = format!("{}/stream?streams=btcusdt@kline_1m/btcusdt@trade/btcusdt@depth10@100ms", BINANCE_WS_API);
    let (mut socket, response) =
        connect(Url::parse(&binance_url).unwrap()).expect("Can't connect to Binance");

    println!("Connected to Binance stream.");
    println!("HTTP status code: {}", response.status());
    for (header, value) in response.headers() {
        println!("- {}: {:?}", header, value);
    }

    
    let mut last_100_trades: VecDeque<TradeStreamData> = VecDeque::with_capacity(100);
    let mut order_book: Option<OrderBook> = None;
    
    
    while running.load(Ordering::SeqCst) {
        let msg = match socket.read() {
            Ok(msg) => msg,
            Err(e) => {
                eprintln!("Error reading message from Binance: {}", e);
                break;
            }
        };
        
        match msg {
            Message::Text(text) => {
                
                match serde_json::from_str::<Value>(&text) {
                    Ok(parsed_data) => {
                        
                        let preview = if text.len() > 100 {
                            format!("{}...", &text[..100])
                        } else {
                            text.clone()
                        };
                        println!("Received: {}", preview);
                        
                        
                        if let Some(stream) = parsed_data.get("stream").and_then(Value::as_str) {
                            if stream.contains("@kline") {
                                
                                match serde_json::from_str::<StreamWrapper<KlineStreamData>>(&text) {
                                    Ok(kline_data) => {
                                        let k = &kline_data.data.k;
                                
                                        let custom_msg = serde_json::json!({
                                            "event": "KLINE",
                                            "data": {
                                                "time": k.t,
                                                "open": k.o.parse::<f64>().unwrap_or(0.0),
                                                "high": k.h.parse::<f64>().unwrap_or(0.0),
                                                "low": k.l.parse::<f64>().unwrap_or(0.0),
                                                "close": k.c.parse::<f64>().unwrap_or(0.0),
                                                "volume": k.v.parse::<f64>().unwrap_or(0.0)
                                            }
                                        });
                                
                                        let custom_msg_str = custom_msg.to_string();
                                
                                        
                                        let mut locked_clients = clients.lock().unwrap();
                                        locked_clients.retain(|client_sender| client_sender.send(custom_msg_str.clone()).is_ok());
                                
                                        println!("Broadcasted formatted kline: {}", custom_msg_str);
                                    },
                                    Err(e) => eprintln!("Failed to parse kline data: {}", e),
                                }                                
                            } else if stream.contains("@depth") {
                                
                                match serde_json::from_str::<StreamWrapper<DepthStreamData>>(&text) {
                                    Ok(depth_data) => {
                                        let bids: Vec<OfferData> = depth_data.data.b.iter()
                                            .map(|bid| OfferData {
                                                price: bid[0].clone(),
                                                quantity: bid[1].clone(),
                                            }).collect();
                                        let asks: Vec<OfferData> = depth_data.data.a.iter()
                                            .map(|ask| OfferData {
                                                price: ask[0].clone(),
                                                quantity: ask[1].clone(),
                                            }).collect();
                                        order_book = Some(OrderBook { bids, asks });
                                        
                                        
                                        if let Some(symbol) = &depth_data.data.s {
                                            println!("Updated order book for {}", symbol);
                                        } else {
                                            println!("Updated order book, update ID: {}", 
                                                depth_data.data.last_update_id.unwrap_or(0));
                                        }
                                    },
                                    Err(e) => {
                                        eprintln!("Failed to parse depth data: {}", e);
                                        eprintln!("Raw JSON: {}", text);
                                    },
                                }
                            } else if stream.contains("@trade") {
                                
                                match serde_json::from_str::<StreamWrapper<TradeStreamData>>(&text) {
                                    Ok(trade_data) => {
                                        
                                        trade_data.data.add_to_history(&mut last_100_trades);
                                        
                                        
                                        println!("Trade: {} {} at price {}", 
                                            if trade_data.data.m { "Sell" } else { "Buy" },
                                            trade_data.data.q,
                                            trade_data.data.p);
                                        
                                        
                                        if let Some(buyer_id) = trade_data.data.b {
                                            println!("  Buyer order ID: {}", buyer_id);
                                        }
                                        
                                        if let Some(seller_id) = trade_data.data.a {
                                            println!("  Seller order ID: {}", seller_id);
                                        }
                                    },
                                    Err(e) => {
                                        eprintln!("Failed to parse trade data: {}", e);
                                        eprintln!("Raw JSON: {}", text);
                                    },
                                }
                            }
                        }
                    },
                    Err(e) => {
                        eprintln!("Failed to parse JSON: {}", e);
                        eprintln!("Raw message: {}", text);
                    }
                }
                
                
                let mut locked_clients = clients.lock().unwrap();
                
                locked_clients.retain(|client_sender| client_sender.send(text.clone()).is_ok());
            },
            Message::Binary(data) => {
                println!("Received binary data: {} bytes", data.len());
            },
            Message::Ping(data) => {
                println!("Received ping from Binance, responding with pong");
                if let Err(e) = socket.write_message(Message::Pong(data)) {
                    eprintln!("Failed to send pong: {}", e);
                }
            },
            Message::Pong(_) => {
                println!("Received pong from Binance");
            },
            Message::Close(frame) => {
                println!("Binance connection closed: {:?}", frame);
                break;
            },
            Message::Frame(_) => {
                println!("Received raw frame (unusual)");
            },
        }
        
        
        thread::sleep(Duration::from_millis(10));
    }
    
    
    println!("Sending close frame to Binance...");
    if let Err(e) = socket.close(None) {
        eprintln!("Error sending close frame: {}", e);
    }
    println!("WebSocket connection to Binance closed");
}