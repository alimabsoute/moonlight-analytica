#!/usr/bin/env python3
"""
Quick Demo: Test ANY symbol with historical data
"""

from src.data_manager import DataManager
import pandas as pd
import numpy as np

def analyze_any_symbol(symbol):
    """Analyze any symbol with 6 months of data"""
    
    print(f"=== ANALYZING {symbol} ===")
    
    dm = DataManager()
    
    # Fetch data (automatically downloads if not cached)
    data = dm.get_stock_data(symbol, period='6mo')
    
    if data.empty:
        print(f"Could not fetch data for {symbol}")
        return
    
    print(f"Data Points: {len(data)} trading days")
    print(f"Date Range: {data.index[0].strftime('%Y-%m-%d')} to {data.index[-1].strftime('%Y-%m-%d')}")
    
    # Price analysis
    current_price = data['Close'].iloc[-1]
    start_price = data['Close'].iloc[0]
    high_6m = data['High'].max()
    low_6m = data['Low'].min()
    
    return_6m = ((current_price / start_price) - 1) * 100
    
    print(f"Current Price: ${current_price:.2f}")
    print(f"6-Month Return: {return_6m:+.1f}%")
    print(f"6-Month Range: ${low_6m:.2f} - ${high_6m:.2f}")
    
    # Technical indicators
    sma_20 = data['Close'].rolling(20).mean().iloc[-1]
    sma_50 = data['Close'].rolling(50).mean().iloc[-1]
    
    # RSI calculation
    delta = data['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    current_rsi = rsi.iloc[-1]
    
    # Volume analysis
    avg_volume = data['Volume'].rolling(20).mean().iloc[-1]
    current_volume = data['Volume'].iloc[-1]
    volume_ratio = current_volume / avg_volume
    
    print(f"Technical Indicators:")
    print(f"  RSI: {current_rsi:.1f}")
    print(f"  20-day SMA: ${sma_20:.2f} ({'Above' if current_price > sma_20 else 'Below'})")
    print(f"  50-day SMA: ${sma_50:.2f} ({'Above' if current_price > sma_50 else 'Below'})")
    print(f"  Volume Ratio: {volume_ratio:.1f}x average")
    
    # Simple strategy signals
    signals = []
    
    # Momentum signals
    if current_price > sma_20 and current_rsi > 50 and volume_ratio > 1.2:
        signals.append("MOMENTUM: Bullish trend with volume")
    
    # Mean reversion signals  
    if current_rsi < 35 and current_price < sma_20:
        signals.append("MEAN REVERSION: Oversold bounce setup")
    
    # Breakout signals
    if current_price > high_6m * 0.98:  # Near 6-month high
        signals.append("BREAKOUT: Near 6-month highs")
    
    if current_price < low_6m * 1.02:   # Near 6-month low
        signals.append("SUPPORT: Near 6-month lows")
    
    print(f"Current Signals:")
    if signals:
        for signal in signals:
            print(f"  - {signal}")
    else:
        print(f"  - No clear signals (neutral zone)")
    
    return data

def test_multiple_symbols():
    """Test various symbols to show capabilities"""
    
    # Mix of stocks and ETFs
    symbols = [
        'TSLA',   # High volatility stock
        'AAPL',   # Large cap stable
        'NVDA',   # AI/tech momentum
        'AMD',    # Semiconductor
        'QQQ',    # Tech ETF
        'SPY',    # S&P 500 ETF
        'VTI',    # Total market ETF
        'IWM'     # Small cap ETF
    ]
    
    results = {}
    
    for symbol in symbols:
        try:
            print()
            data = analyze_any_symbol(symbol)
            if data is not None:
                results[symbol] = data
        except Exception as e:
            print(f"Error analyzing {symbol}: {e}")
    
    print(f"\n=== PORTFOLIO COMPARISON ===")
    if results:
        for symbol, data in results.items():
            current = data['Close'].iloc[-1]
            start = data['Close'].iloc[0]
            ret = ((current / start) - 1) * 100
            print(f"{symbol}: {ret:+.1f}% (${current:.2f})")

if __name__ == "__main__":
    test_multiple_symbols()