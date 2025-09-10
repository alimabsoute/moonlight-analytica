#!/usr/bin/env python3
"""
Quick test of TSLA trading strategies
"""

from src.data_manager import DataManager
from src.scanners.momentum import MomentumScanner
from src.scanners.mean_reversion import MeanReversionScanner

# Initialize
dm = DataManager()
momentum = MomentumScanner(dm)
mean_rev = MeanReversionScanner(dm)

# Test TSLA specifically
symbol = 'TSLA'
print(f'Testing {symbol} trading strategies...\n')

# Run momentum scan
print('=== MOMENTUM ANALYSIS ===')
momentum_signals = momentum.scan([symbol])
if momentum_signals:
    s = momentum_signals[0]
    print(f'Signal Strength: {s.signal_strength:.1f}%')
    print(f'Entry Price: ${s.entry_price:.2f}')
    print(f'Target: ${s.target_price:.2f}')
    print(f'Stop Loss: ${s.stop_loss:.2f}')
    print(f'Risk/Reward: {s.risk_reward_ratio:.1f}:1')
    print(f'Notes: {s.notes}')
else:
    print('No momentum signals found')

print(f'\n=== MEAN REVERSION ANALYSIS ===')
mean_signals = mean_rev.scan([symbol])
if mean_signals:
    s = mean_signals[0]
    print(f'Signal Strength: {s.signal_strength:.1f}%')
    print(f'Entry Price: ${s.entry_price:.2f}')
    print(f'Target: ${s.target_price:.2f}')
    print(f'Stop Loss: ${s.stop_loss:.2f}')
    print(f'RSI: {s.rsi:.1f}')
    print(f'Notes: {s.notes}')
else:
    print('No mean reversion signals found')

# Test different symbols
print(f'\n=== TESTING OTHER SYMBOLS ===')
test_symbols = ['NVDA', 'AAPL', 'AMD', 'QQQ']

for sym in test_symbols:
    mom_sigs = momentum.scan([sym])
    mean_sigs = mean_rev.scan([sym])
    
    mom_strength = mom_sigs[0].signal_strength if mom_sigs else 0
    mean_strength = mean_sigs[0].signal_strength if mean_sigs else 0
    
    print(f'{sym}: Momentum={mom_strength:.1f}%, Mean Reversion={mean_strength:.1f}%')