#!/usr/bin/env python3
"""
Simple Trading Interface - No dependencies needed
Just run this file and follow prompts
"""

from src.data_manager import DataManager
from src.scanners.momentum import MomentumScanner
from src.scanners.mean_reversion import MeanReversionScanner
import pandas as pd

def analyze_symbol(symbol, momentum_threshold=40, mean_rev_threshold=40):
    """Analyze any symbol with trading strategies"""
    
    print(f"\n{'='*50}")
    print(f"ANALYZING {symbol.upper()}")
    print(f"{'='*50}")
    
    try:
        # Initialize
        dm = DataManager()
        data = dm.get_stock_data(symbol, period='6mo')
        
        if data.empty:
            print(f"❌ Could not fetch data for {symbol}")
            return
        
        # Basic metrics
        current_price = data['Close'].iloc[-1]
        start_price = data['Close'].iloc[0]
        high_6m = data['High'].max()
        low_6m = data['Low'].min()
        return_6m = ((current_price / start_price) - 1) * 100
        
        print(f"📊 BASIC METRICS:")
        print(f"   Current Price: ${current_price:.2f}")
        print(f"   6-Month Return: {return_6m:+.1f}%")
        print(f"   6-Month Range: ${low_6m:.2f} - ${high_6m:.2f}")
        print(f"   Data Points: {len(data)} trading days")
        
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
        
        print(f"\n📈 TECHNICAL INDICATORS:")
        print(f"   RSI: {current_rsi:.1f} {'(Overbought)' if current_rsi > 70 else '(Oversold)' if current_rsi < 30 else '(Neutral)'}")
        print(f"   20-day SMA: ${sma_20:.2f} ({'Above' if current_price > sma_20 else 'Below'})")
        print(f"   50-day SMA: ${sma_50:.2f} ({'Above' if current_price > sma_50 else 'Below'})")
        print(f"   Volume Ratio: {volume_ratio:.1f}x average")
        
        # Strategy analysis
        print(f"\n🚀 MOMENTUM STRATEGY (Threshold: {momentum_threshold}%):")
        
        momentum = MomentumScanner(dm)
        momentum.min_signal_strength = momentum_threshold
        momentum.volume_multiplier = 1.2
        momentum.price_change_min = 1.0
        
        mom_signals = momentum.scan([symbol])
        
        if mom_signals:
            s = mom_signals[0]
            print(f"   ✅ SIGNAL FOUND! Strength: {s.signal_strength:.1f}%")
            print(f"   📈 Entry: ${s.entry_price:.2f}")
            print(f"   🎯 Target: ${s.target_price:.2f} (+{((s.target_price/s.entry_price-1)*100):.1f}%)")
            print(f"   🛑 Stop: ${s.stop_loss:.2f} ({((s.stop_loss/s.entry_price-1)*100):.1f}%)")
            print(f"   ⚖️  Risk/Reward: {s.risk_reward_ratio:.1f}:1")
            print(f"   📝 Notes: {s.notes}")
        else:
            print(f"   ❌ No momentum signals (try lowering threshold)")
        
        print(f"\n🔄 MEAN REVERSION STRATEGY (Threshold: {mean_rev_threshold}%):")
        
        mean_rev = MeanReversionScanner(dm)
        mean_rev.min_signal_strength = mean_rev_threshold
        mean_rev.rsi_oversold = 40
        mean_rev.zscore_threshold = -1.5
        
        mean_signals = mean_rev.scan([symbol])
        
        if mean_signals:
            s = mean_signals[0]
            print(f"   ✅ SIGNAL FOUND! Strength: {s.signal_strength:.1f}%")
            print(f"   📈 Entry: ${s.entry_price:.2f}")
            print(f"   🎯 Target: ${s.target_price:.2f} (+{((s.target_price/s.entry_price-1)*100):.1f}%)")
            print(f"   🛑 Stop: ${s.stop_loss:.2f} ({((s.stop_loss/s.entry_price-1)*100):.1f}%)")
            print(f"   📊 RSI: {s.rsi:.1f}")
            print(f"   📝 Notes: {s.notes}")
        else:
            print(f"   ❌ No mean reversion signals (try lowering threshold)")
        
        # Quick signals summary
        signals = []
        if current_price > sma_20 and current_rsi > 50 and volume_ratio > 1.2:
            signals.append("💪 BULLISH: Above 20-day SMA with momentum")
        
        if current_rsi < 35:
            signals.append("🔄 OVERSOLD: Potential bounce setup")
        
        if current_price > high_6m * 0.98:
            signals.append("🚀 BREAKOUT: Near 6-month highs")
        
        if current_price < low_6m * 1.02:
            signals.append("📉 SUPPORT: Testing 6-month lows")
        
        print(f"\n💡 QUICK SIGNALS:")
        if signals:
            for signal in signals:
                print(f"   {signal}")
        else:
            print(f"   🔹 Neutral zone - no clear directional bias")
        
        return True
        
    except Exception as e:
        print(f"❌ Error analyzing {symbol}: {e}")
        return False

def main():
    """Interactive trading interface"""
    
    print("🚀 TRADING STRATEGY TESTER")
    print("Test any stock or ETF with live data and strategies")
    print("Enter 'quit' to exit\n")
    
    while True:
        try:
            # Get user input
            symbol = input("📈 Enter stock symbol (e.g., TSLA, AAPL, QQQ): ").strip().upper()
            
            if symbol.lower() in ['quit', 'exit', 'q']:
                print("👋 Goodbye!")
                break
            
            if not symbol:
                continue
            
            # Optional threshold adjustment
            print(f"\n⚙️  Strategy Settings (press Enter for defaults):")
            
            mom_input = input("   Momentum threshold (20-80, default 40): ").strip()
            momentum_threshold = int(mom_input) if mom_input.isdigit() else 40
            
            mean_input = input("   Mean reversion threshold (20-80, default 40): ").strip()
            mean_rev_threshold = int(mean_input) if mean_input.isdigit() else 40
            
            # Run analysis
            success = analyze_symbol(symbol, momentum_threshold, mean_rev_threshold)
            
            if success:
                print(f"\n🔄 Test another symbol? (y/n): ", end="")
                continue_choice = input().strip().lower()
                if continue_choice in ['n', 'no']:
                    break
            
        except KeyboardInterrupt:
            print(f"\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            continue

if __name__ == "__main__":
    main()