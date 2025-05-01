use serde::{Deserialize, Serialize};
use std::collections::VecDeque;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamWrapper<T> {
    pub stream: String,
    pub data: T,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OfferData {
    pub price: String,
    pub quantity: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TradeStreamData {
    pub e: String,                
    pub E: u64,                   
    pub s: String,                
    pub t: u64,                   
    pub p: String,                
    pub q: String,                
    #[serde(default)]             
    pub b: Option<u64>,           
    #[serde(default)]
    pub a: Option<u64>,           
    pub T: u64,                   
    pub m: bool,                  
    #[serde(default)]
    pub M: Option<bool>,          
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DepthStreamData {
    #[serde(default)]
    pub e: Option<String>,
    #[serde(default)]
    pub E: Option<u64>,
    #[serde(default)]
    pub s: Option<String>,
    #[serde(default)]
    pub U: Option<u64>,
    #[serde(default)]
    pub u: Option<u64>,
    #[serde(rename = "lastUpdateId", default)]
    pub last_update_id: Option<u64>,
    #[serde(default)]
    pub b: Vec<Vec<String>>,
    #[serde(default)]
    pub a: Vec<Vec<String>>,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KlineData {
    pub t: u64,            
    pub T: u64,            
    pub s: String,         
    pub i: String,         
    pub f: u64,            
    pub L: u64,            
    pub o: String,         
    pub c: String,         
    pub h: String,         
    pub l: String,         
    pub v: String,         
    pub n: u64,            
    pub x: bool,           
    pub q: String,         
    pub V: String,         
    pub Q: String,         
    pub B: String,         
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KlineStreamData {
    pub e: String,         
    pub E: u64,            
    pub s: String,         
    pub k: KlineData,      
}


impl TradeStreamData {
    pub fn add_to_history(&self, history: &mut VecDeque<TradeStreamData>) {
        if history.len() >= 100 {
            history.pop_front();
        }
        
        history.push_back(self.clone());
    }
}


impl Clone for TradeStreamData {
    fn clone(&self) -> Self {
        TradeStreamData {
            e: self.e.clone(),
            E: self.E,
            s: self.s.clone(),
            t: self.t,
            p: self.p.clone(),
            q: self.q.clone(),
            b: self.b,
            a: self.a,
            T: self.T,
            m: self.m,
            M: self.M,
        }
    }
}