#!/usr/bin/env python3
"""
Simple Trading Interface - Works immediately
"""

from src.data_manager import DataManager
from src.scanners.momentum import MomentumScanner
from src.scanners.mean_reversion import MeanReversionScanner

def test_symbol(symbol):
    """Quick test of any symbol"""
    
    print(f"\n" + "="*50)
    print(f"TESTING {symbol.upper()}")
    print("="*50)
    
    try:
        # Initialize
        dm = DataManager()
        data = dm.get_stock_data(symbol, period='6mo')
        
        if data.empty:
            print(f"Could not fetch data for {symbol}")
            return
        
        # Basic info
        current = data['Close'].iloc[-1]
        start = data['Close'].iloc[0]
        return_pct = ((current / start) - 1) * 100
        high = data['High'].max()
        low = data['Low'].min()
        
        print(f"Current Price: ${current:.2f}")
        print(f"6-Month Return: {return_pct:+.1f}%")
        print(f"Range: ${low:.2f} - ${high:.2f}")
        
        # Technical indicators
        sma20 = data['Close'].rolling(20).mean().iloc[-1]
        
        # RSI
        delta = data['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rsi = 100 - (100 / (1 + gain / loss))
        current_rsi = rsi.iloc[-1]
        
        print(f"RSI: {current_rsi:.1f}")
        print(f"vs 20-day SMA: {'Above' if current > sma20 else 'Below'}")
        
        # Test strategies with low thresholds
        momentum = MomentumScanner(dm)
        momentum.min_signal_strength = 30
        momentum.volume_multiplier = 1.2
        momentum.price_change_min = 1.0
        
        mean_rev = MeanReversionScanner(dm)
        mean_rev.min_signal_strength = 30
        mean_rev.rsi_oversold = 40
        
        print(f"\nSTRATEGY RESULTS:")
        
        # Momentum test
        mom_signals = momentum.scan([symbol])
        if mom_signals:
            s = mom_signals[0]
            print(f"MOMENTUM: {s.signal_strength:.1f}% strength")
            print(f"  Entry: ${s.entry_price:.2f}")
            print(f"  Target: ${s.target_price:.2f}")
            print(f"  Stop: ${s.stop_loss:.2f}")
        else:
            print(f"MOMENTUM: No signals")
        
        # Mean reversion test
        mean_signals = mean_rev.scan([symbol])
        if mean_signals:
            s = mean_signals[0]
            print(f"MEAN REVERSION: {s.signal_strength:.1f}% strength")
            print(f"  Entry: ${s.entry_price:.2f}")
            print(f"  Target: ${s.target_price:.2f}")
            print(f"  Stop: ${s.stop_loss:.2f}")
        else:
            print(f"MEAN REVERSION: No signals")
        
        # Simple signals
        signals = []
        if current > sma20 and current_rsi > 50:
            signals.append("BULLISH trend")
        if current_rsi < 35:
            signals.append("OVERSOLD setup")
        if current > high * 0.95:
            signals.append("NEAR HIGHS")
        
        if signals:
            print(f"\nQUICK SIGNALS: {', '.join(signals)}")
        else:
            print(f"\nQUICK SIGNALS: Neutral")
            
    except Exception as e:
        print(f"Error: {e}")

def main():
    """Main interface"""
    print("TRADING STRATEGY TESTER")
    print("Enter any stock symbol to test")
    print("Type 'quit' to exit")
    
    # Quick examples
    examples = ['TSLA', 'NVDA', 'AAPL', 'QQQ', 'SPY']
    print(f"\nPOPULAR SYMBOLS: {', '.join(examples)}")
    
    while True:
        try:
            symbol = input(f"\nEnter symbol: ").strip().upper()
            
            if symbol.lower() in ['quit', 'exit', 'q']:
                break
                
            if symbol:
                test_symbol(symbol)
                
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Error: {e}")
    
    print("Goodbye!")

if __name__ == "__main__":
    main()