#!/usr/bin/env python3
"""
Momentum Scanner - Detect breakout and trending opportunities

This scanner identifies stocks showing strong momentum characteristics:
- Price breaking above resistance levels
- Volume surge indicating institutional interest  
- Technical indicators aligned for upward movement
- Relative strength vs market

Strategy: Buy momentum breakouts, ride the trend, exit on momentum loss
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import talib
from dataclasses import dataclass

# Import our modules
from src.data_manager import DataManager

# Set up logging
logger = logging.getLogger(__name__)

@dataclass
class MomentumSignal:
    """Momentum trading signal with all relevant data"""
    symbol: str
    strategy: str = "momentum"
    signal_strength: float = 0.0
    entry_price: float = 0.0
    stop_loss: float = 0.0
    target_price: float = 0.0
    risk_reward_ratio: float = 0.0
    
    # Technical indicators
    rsi: float = 0.0
    macd: float = 0.0
    volume_ratio: float = 0.0
    price_change_pct: float = 0.0
    breakout_level: float = 0.0
    
    # Market context
    relative_strength: float = 0.0
    sector_momentum: float = 0.0
    market_conditions: str = ""
    
    # Timing and confidence
    signal_timestamp: datetime = None
    confidence_score: float = 0.0
    holding_period_days: int = 0
    notes: str = ""

class MomentumScanner:
    """
    Momentum scanner for identifying breakout opportunities
    
    This scanner looks for:
    1. Price breakouts above key resistance levels
    2. Volume surges indicating institutional buying
    3. Technical momentum indicators alignment
    4. Relative strength vs benchmark
    """
    
    def __init__(self, data_manager: DataManager):
        self.data_manager = data_manager
        self.min_signal_strength = 65  # Default threshold
        self.lookback_days = 20
        self.volume_lookback = 10
        
        # Load configuration if available
        self._load_config()
        
    def _load_config(self):
        """Load scanner configuration from data manager"""
        try:
            config = self.data_manager.config.get('strategies', {}).get('momentum', {})
            self.min_signal_strength = config.get('min_signal_strength', 65)
            self.rsi_range = config.get('rsi_range', [50, 80])
            self.volume_multiplier = config.get('volume_multiplier', 1.5)
            self.price_change_min = config.get('price_change_min', 2.0)
            self.max_positions = config.get('max_positions', 10)
            logger.info("Momentum scanner configuration loaded")
        except Exception as e:
            logger.warning(f"Could not load momentum config: {e}")
    
    def scan(self, symbols: List[str]) -> List[MomentumSignal]:
        """
        Scan symbols for momentum opportunities
        
        Args:
            symbols: List of stock symbols to scan
            
        Returns:
            List of momentum signals sorted by strength
        """
        logger.info(f"Momentum scanning {len(symbols)} symbols...")
        
        signals = []
        
        # Get market benchmark data for relative strength
        try:
            spy_data = self.data_manager.get_stock_data('SPY', period='3mo')
            spy_returns = spy_data['Close'].pct_change(periods=self.lookback_days).iloc[-1]
        except Exception as e:
            logger.warning(f"Could not get SPY data: {e}")
            spy_returns = 0
        
        for symbol in symbols:
            try:
                signal = self._analyze_symbol(symbol, spy_returns)
                if signal and signal.signal_strength >= self.min_signal_strength:
                    signals.append(signal)
                    logger.debug(f"Found momentum signal: {symbol} ({signal.signal_strength:.1f}%)")
                    
            except Exception as e:
                logger.debug(f"Error analyzing {symbol}: {e}")
                continue
        
        # Sort by signal strength
        signals.sort(key=lambda x: x.signal_strength, reverse=True)
        
        logger.info(f"Found {len(signals)} momentum signals")
        return signals
    
    def _analyze_symbol(self, symbol: str, spy_returns: float) -> Optional[MomentumSignal]:
        """
        Analyze individual symbol for momentum characteristics
        
        Args:
            symbol: Stock symbol to analyze
            spy_returns: SPY returns for relative strength calculation
            
        Returns:
            MomentumSignal if criteria met, None otherwise
        """
        # Get stock data
        try:
            data = self.data_manager.get_stock_data(symbol, period='6mo')
            if data.empty or len(data) < 50:
                return None
        except Exception as e:
            logger.debug(f"Could not get data for {symbol}: {e}")
            return None
        
        # Calculate technical indicators
        try:
            indicators = self._calculate_indicators(data)
        except Exception as e:
            logger.debug(f"Indicator calculation failed for {symbol}: {e}")
            return None
        
        # Check momentum criteria
        if not self._meets_momentum_criteria(indicators):
            return None
        
        # Calculate signal strength
        signal_strength = self._calculate_signal_strength(indicators, spy_returns)
        
        if signal_strength < self.min_signal_strength:
            return None
        
        # Calculate entry, stop, and target levels
        entry_price = data['Close'].iloc[-1]
        stop_loss, target_price = self._calculate_levels(data, indicators)
        
        # Calculate relative strength
        stock_returns = data['Close'].pct_change(periods=self.lookback_days).iloc[-1]
        relative_strength = stock_returns - spy_returns
        
        # Create signal
        signal = MomentumSignal(
            symbol=symbol,
            signal_strength=signal_strength,
            entry_price=entry_price,
            stop_loss=stop_loss,
            target_price=target_price,
            risk_reward_ratio=(target_price - entry_price) / (entry_price - stop_loss) if entry_price > stop_loss else 0,
            
            # Technical data
            rsi=indicators['rsi'],
            macd=indicators['macd'],
            volume_ratio=indicators['volume_ratio'],
            price_change_pct=indicators['price_change_pct'],
            breakout_level=indicators['breakout_level'],
            
            # Market context
            relative_strength=relative_strength * 100,
            market_conditions=self._assess_market_conditions(indicators),
            
            # Metadata
            signal_timestamp=datetime.now(),
            confidence_score=self._calculate_confidence(indicators),
            holding_period_days=self._estimate_holding_period(indicators),
            notes=self._generate_notes(symbol, indicators)
        )
        
        return signal
    
    def _calculate_indicators(self, data: pd.DataFrame) -> Dict:
        """Calculate technical indicators for momentum analysis"""
        
        # Price and volume data
        close = data['Close'].values
        high = data['High'].values
        low = data['Low'].values
        volume = data['Volume'].values
        
        # Technical indicators
        rsi = talib.RSI(close, timeperiod=14)[-1]
        macd, macd_signal, macd_hist = talib.MACD(close, fastperiod=12, slowperiod=26, signalperiod=9)
        
        # Moving averages
        sma_20 = talib.SMA(close, timeperiod=20)
        sma_50 = talib.SMA(close, timeperiod=50)
        ema_12 = talib.EMA(close, timeperiod=12)
        
        # Bollinger Bands
        bb_upper, bb_middle, bb_lower = talib.BBANDS(close, timeperiod=20, nbdevup=2, nbdevdn=2)
        
        # Volume analysis
        volume_sma = talib.SMA(volume.astype(float), timeperiod=self.volume_lookback)
        current_volume = volume[-1]
        avg_volume = volume_sma[-1] if not np.isnan(volume_sma[-1]) else volume[-10:].mean()
        volume_ratio = current_volume / avg_volume if avg_volume > 0 else 1
        
        # Price action
        current_price = close[-1]
        price_change_pct = ((current_price - close[-2]) / close[-2]) * 100
        
        # Breakout level calculation
        recent_high = np.max(high[-self.lookback_days:])
        breakout_level = recent_high
        
        # Momentum oscillator
        momentum = talib.MOM(close, timeperiod=10)[-1]
        
        # Average True Range for volatility
        atr = talib.ATR(high, low, close, timeperiod=14)[-1]
        
        return {
            'rsi': rsi,
            'macd': macd[-1],
            'macd_signal': macd_signal[-1],
            'macd_hist': macd_hist[-1],
            'sma_20': sma_20[-1],
            'sma_50': sma_50[-1],
            'ema_12': ema_12[-1],
            'bb_upper': bb_upper[-1],
            'bb_middle': bb_middle[-1],
            'bb_lower': bb_lower[-1],
            'volume_ratio': volume_ratio,
            'price_change_pct': price_change_pct,
            'breakout_level': breakout_level,
            'momentum': momentum,
            'atr': atr,
            'current_price': current_price,
            'recent_high': recent_high
        }
    
    def _meets_momentum_criteria(self, indicators: Dict) -> bool:
        """Check if symbol meets basic momentum criteria"""
        
        # RSI in momentum range (not overbought/oversold)
        if not (self.rsi_range[0] <= indicators['rsi'] <= self.rsi_range[1]):
            return False
        
        # Volume surge
        if indicators['volume_ratio'] < self.volume_multiplier:
            return False
        
        # Minimum price movement
        if abs(indicators['price_change_pct']) < self.price_change_min:
            return False
        
        # Price above key moving averages
        if indicators['current_price'] < indicators['sma_20']:
            return False
        
        # MACD bullish
        if indicators['macd'] < indicators['macd_signal']:
            return False
        
        # Positive momentum
        if indicators['momentum'] <= 0:
            return False
        
        return True
    
    def _calculate_signal_strength(self, indicators: Dict, spy_returns: float) -> float:
        """Calculate overall signal strength (0-100)"""
        
        strength = 0
        
        # RSI contribution (0-20 points)
        rsi_score = 20 * (indicators['rsi'] - 50) / 30  # Peak at RSI 80
        strength += max(0, min(20, rsi_score))
        
        # Volume surge contribution (0-25 points)
        volume_score = min(25, (indicators['volume_ratio'] - 1) * 10)
        strength += volume_score
        
        # Price momentum contribution (0-20 points)
        momentum_score = min(20, abs(indicators['price_change_pct']) * 2)
        strength += momentum_score
        
        # MACD strength (0-15 points)
        macd_strength = min(15, indicators['macd_hist'] * 1000)  # Scale MACD histogram
        strength += max(0, macd_strength)
        
        # Breakout proximity (0-10 points)
        breakout_distance = (indicators['recent_high'] - indicators['current_price']) / indicators['current_price']
        breakout_score = max(0, 10 * (1 - breakout_distance * 100))  # Higher score closer to breakout
        strength += breakout_score
        
        # Moving average alignment (0-10 points)
        ma_score = 0
        if indicators['current_price'] > indicators['ema_12']:
            ma_score += 3
        if indicators['ema_12'] > indicators['sma_20']:
            ma_score += 3
        if indicators['sma_20'] > indicators['sma_50']:
            ma_score += 4
        strength += ma_score
        
        return min(100, max(0, strength))
    
    def _calculate_levels(self, data: pd.DataFrame, indicators: Dict) -> Tuple[float, float]:
        """Calculate stop loss and target price levels"""
        
        entry_price = indicators['current_price']
        atr = indicators['atr']
        
        # Stop loss: Below recent swing low or 2 ATR
        recent_lows = data['Low'].tail(self.lookback_days)
        swing_low = recent_lows.min()
        
        # Use the more conservative stop
        atr_stop = entry_price - (2 * atr)
        swing_stop = swing_low * 0.98  # 2% below swing low
        
        stop_loss = max(atr_stop, swing_stop)
        
        # Target: 2:1 risk/reward minimum
        risk = entry_price - stop_loss
        min_target = entry_price + (2 * risk)
        
        # Also consider resistance levels
        resistance_target = indicators['breakout_level'] * 1.05  # 5% above breakout
        
        target_price = max(min_target, resistance_target)
        
        return stop_loss, target_price
    
    def _assess_market_conditions(self, indicators: Dict) -> str:
        """Assess current market conditions"""
        
        if indicators['rsi'] > 70 and indicators['volume_ratio'] > 2:
            return "Strong Bullish"
        elif indicators['rsi'] > 60 and indicators['macd_hist'] > 0:
            return "Bullish"
        elif indicators['rsi'] > 50:
            return "Neutral Bullish"
        else:
            return "Neutral"
    
    def _calculate_confidence(self, indicators: Dict) -> float:
        """Calculate confidence score for the signal"""
        
        confidence = 50  # Base confidence
        
        # High volume increases confidence
        if indicators['volume_ratio'] > 2:
            confidence += 20
        elif indicators['volume_ratio'] > 1.5:
            confidence += 10
        
        # Strong momentum increases confidence
        if indicators['price_change_pct'] > 5:
            confidence += 15
        elif indicators['price_change_pct'] > 3:
            confidence += 10
        
        # MACD confirmation
        if indicators['macd_hist'] > 0:
            confidence += 10
        
        # RSI in sweet spot
        if 55 <= indicators['rsi'] <= 75:
            confidence += 10
        
        return min(100, confidence)
    
    def _estimate_holding_period(self, indicators: Dict) -> int:
        """Estimate optimal holding period in days"""
        
        # Base holding period
        base_days = 15
        
        # Adjust based on momentum strength
        if indicators['rsi'] > 70:
            return base_days - 5  # Shorter hold for overbought
        elif indicators['volume_ratio'] > 2:
            return base_days + 10  # Longer hold for high volume
        
        return base_days
    
    def _generate_notes(self, symbol: str, indicators: Dict) -> str:
        """Generate descriptive notes for the signal"""
        
        notes = []
        
        if indicators['volume_ratio'] > 2:
            notes.append(f"High volume surge ({indicators['volume_ratio']:.1f}x)")
        
        if indicators['price_change_pct'] > 5:
            notes.append(f"Strong price move (+{indicators['price_change_pct']:.1f}%)")
        
        if indicators['current_price'] > indicators['breakout_level']:
            notes.append("Breaking above resistance")
        
        if indicators['macd_hist'] > 0:
            notes.append("MACD bullish crossover")
        
        if 60 <= indicators['rsi'] <= 75:
            notes.append("RSI in momentum zone")
        
        return "; ".join(notes) if notes else "Standard momentum setup"

def main():
    """Test the momentum scanner"""
    from src.data_manager import DataManager
    
    # Initialize
    data_manager = DataManager()
    scanner = MomentumScanner(data_manager)
    
    # Test symbols
    test_symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'META', 'AMZN', 'NFLX']
    
    print("Testing Momentum Scanner...")
    signals = scanner.scan(test_symbols)
    
    print(f"\nFound {len(signals)} momentum signals:")
    for signal in signals:
        print(f"{signal.symbol}: {signal.signal_strength:.1f}% - {signal.notes}")

if __name__ == "__main__":
    main()