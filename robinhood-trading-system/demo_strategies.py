#!/usr/bin/env python3
"""
Demo: Adjust thresholds and show historical strategy performance
"""

from src.data_manager import DataManager
from src.scanners.momentum import MomentumScanner
from src.scanners.mean_reversion import MeanReversionScanner
import pandas as pd

def test_with_relaxed_thresholds():
    """Test with more relaxed thresholds to find signals"""
    
    dm = DataManager()
    
    # Create momentum scanner with relaxed thresholds
    momentum = MomentumScanner(dm)
    momentum.min_signal_strength = 30  # Lower from 65 to 30
    momentum.volume_multiplier = 1.2   # Lower from 1.5 to 1.2
    momentum.price_change_min = 1.0    # Lower from 2.0 to 1.0
    
    # Create mean reversion scanner with relaxed thresholds  
    mean_rev = MeanReversionScanner(dm)
    mean_rev.min_signal_strength = 30  # Lower from 60 to 30
    mean_rev.rsi_oversold = 40         # Raise from 30 to 40
    mean_rev.zscore_threshold = -1.5   # Raise from -2.0 to -1.5
    
    print("=== RELAXED THRESHOLD TESTING ===\n")
    
    test_symbols = ['TSLA', 'NVDA', 'AAPL', 'AMD', 'MSFT', 'QQQ', 'SPY']
    
    for symbol in test_symbols:
        print(f"Testing {symbol}:")
        
        # Test momentum
        mom_signals = momentum.scan([symbol])
        if mom_signals:
            s = mom_signals[0]
            print(f"  ✅ MOMENTUM: {s.signal_strength:.1f}% - {s.notes}")
            print(f"     Entry: ${s.entry_price:.2f} | Target: ${s.target_price:.2f} | Stop: ${s.stop_loss:.2f}")
        
        # Test mean reversion
        mean_signals = mean_rev.scan([symbol])
        if mean_signals:
            s = mean_signals[0]
            print(f"  ✅ MEAN REV: {s.signal_strength:.1f}% - {s.notes}")
            print(f"     Entry: ${s.entry_price:.2f} | Target: ${s.target_price:.2f} | Stop: ${s.stop_loss:.2f}")
        
        if not mom_signals and not mean_signals:
            print(f"  ❌ No signals found")
        
        print()

def simulate_historical_performance():
    """Simulate what signals would have been generated over time"""
    
    print("=== HISTORICAL SIGNAL SIMULATION ===\n")
    
    dm = DataManager()
    
    # Get TSLA data for simulation
    data = dm.get_stock_data('TSLA', period='6mo')
    
    print(f"TSLA Historical Analysis ({len(data)} trading days)")
    print(f"Price Range: ${data['Low'].min():.2f} - ${data['High'].max():.2f}")
    print(f"Current Price: ${data['Close'].iloc[-1]:.2f}")
    print(f"6-Month Return: {((data['Close'].iloc[-1] / data['Close'].iloc[0]) - 1) * 100:.1f}%")
    
    # Calculate some key levels
    sma_20 = data['Close'].rolling(20).mean().iloc[-1]
    sma_50 = data['Close'].rolling(50).mean().iloc[-1]
    current_price = data['Close'].iloc[-1]
    
    print(f"\nTechnical Levels:")
    print(f"  20-day SMA: ${sma_20:.2f} ({'ABOVE' if current_price > sma_20 else 'BELOW'})")
    print(f"  50-day SMA: ${sma_50:.2f} ({'ABOVE' if current_price > sma_50 else 'BELOW'})")
    
    # Calculate RSI manually
    delta = data['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    current_rsi = rsi.iloc[-1]
    
    print(f"  Current RSI: {current_rsi:.1f} ({'OVERSOLD' if current_rsi < 30 else 'OVERBOUGHT' if current_rsi > 70 else 'NEUTRAL'})")
    
    # Show recent volatility
    volatility = data['Close'].pct_change().rolling(20).std() * 100
    print(f"  20-day Volatility: {volatility.iloc[-1]:.1f}%")

if __name__ == "__main__":
    test_with_relaxed_thresholds()
    print("\n" + "="*60 + "\n")
    simulate_historical_performance()