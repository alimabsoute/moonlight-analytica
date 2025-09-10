#!/usr/bin/env python3
"""
Mean Reversion Scanner - Detect oversold bounce opportunities

This scanner identifies stocks showing mean reversion characteristics:
- Oversold conditions with technical indicators
- Support level bounces
- RSI divergence patterns
- Value opportunities with high probability bounce setups

Strategy: Buy oversold dips, target return to mean, exit on momentum shift
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
class MeanReversionSignal:
    """Mean reversion trading signal with all relevant data"""
    symbol: str
    strategy: str = "mean_reversion"
    signal_strength: float = 0.0
    entry_price: float = 0.0
    stop_loss: float = 0.0
    target_price: float = 0.0
    risk_reward_ratio: float = 0.0
    
    # Technical indicators
    rsi: float = 0.0
    zscore: float = 0.0
    bollinger_position: float = 0.0
    support_level: float = 0.0
    resistance_level: float = 0.0
    
    # Mean reversion metrics
    distance_from_mean: float = 0.0
    oversold_duration: int = 0
    bounce_probability: float = 0.0
    volume_confirmation: bool = False
    
    # Market context
    sector_relative_strength: float = 0.0
    market_sentiment: str = ""
    
    # Timing and confidence
    signal_timestamp: datetime = None
    confidence_score: float = 0.0
    holding_period_days: int = 0
    notes: str = ""

class MeanReversionScanner:
    """
    Mean reversion scanner for identifying oversold bounce opportunities
    
    This scanner looks for:
    1. Oversold RSI conditions with potential reversal
    2. Price near support levels or Bollinger Band lower band
    3. Positive divergence patterns
    4. Volume confirmation of potential bounce
    """
    
    def __init__(self, data_manager: DataManager):
        self.data_manager = data_manager
        self.min_signal_strength = 60  # Default threshold
        self.lookback_days = 20
        self.volume_lookback = 10
        
        # Load configuration if available
        self._load_config()
        
    def _load_config(self):
        """Load scanner configuration from data manager"""
        try:
            config = self.data_manager.config.get('strategies', {}).get('mean_reversion', {})
            self.min_signal_strength = config.get('min_signal_strength', 60)
            self.rsi_oversold = config.get('rsi_oversold', 30)
            self.zscore_threshold = config.get('zscore_threshold', -2.0)
            self.bollinger_position = config.get('bollinger_position', 0.1)
            self.max_positions = config.get('max_positions', 8)
            logger.info("Mean reversion scanner configuration loaded")
        except Exception as e:
            logger.warning(f"Could not load mean reversion config: {e}")
    
    def scan(self, symbols: List[str]) -> List[MeanReversionSignal]:
        """
        Scan symbols for mean reversion opportunities
        
        Args:
            symbols: List of stock symbols to scan
            
        Returns:
            List of mean reversion signals sorted by strength
        """
        logger.info(f"Mean reversion scanning {len(symbols)} symbols...")
        
        signals = []
        
        # Get market benchmark data
        try:
            spy_data = self.data_manager.get_stock_data('SPY', period='3mo')
            spy_zscore = self._calculate_zscore(spy_data['Close'].values, 20)
            market_oversold = spy_zscore < -1.5
        except Exception as e:
            logger.warning(f"Could not get SPY data: {e}")
            market_oversold = False
        
        for symbol in symbols:
            try:
                signal = self._analyze_symbol(symbol, market_oversold)
                if signal and signal.signal_strength >= self.min_signal_strength:
                    signals.append(signal)
                    logger.debug(f"Found mean reversion signal: {symbol} ({signal.signal_strength:.1f}%)")
                    
            except Exception as e:
                logger.debug(f"Error analyzing {symbol}: {e}")
                continue
        
        # Sort by signal strength
        signals.sort(key=lambda x: x.signal_strength, reverse=True)
        
        logger.info(f"Found {len(signals)} mean reversion signals")
        return signals
    
    def _analyze_symbol(self, symbol: str, market_oversold: bool) -> Optional[MeanReversionSignal]:
        """
        Analyze individual symbol for mean reversion characteristics
        
        Args:
            symbol: Stock symbol to analyze
            market_oversold: Whether overall market is oversold
            
        Returns:
            MeanReversionSignal if criteria met, None otherwise
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
        
        # Check mean reversion criteria
        if not self._meets_mean_reversion_criteria(indicators):
            return None
        
        # Calculate signal strength
        signal_strength = self._calculate_signal_strength(indicators, market_oversold)
        
        if signal_strength < self.min_signal_strength:
            return None
        
        # Calculate entry, stop, and target levels
        entry_price = data['Close'].iloc[-1]
        stop_loss, target_price = self._calculate_levels(data, indicators)
        
        # Calculate additional metrics
        bounce_probability = self._calculate_bounce_probability(indicators)
        oversold_duration = self._calculate_oversold_duration(data)
        
        # Create signal
        signal = MeanReversionSignal(
            symbol=symbol,
            signal_strength=signal_strength,
            entry_price=entry_price,
            stop_loss=stop_loss,
            target_price=target_price,
            risk_reward_ratio=(target_price - entry_price) / (entry_price - stop_loss) if entry_price > stop_loss else 0,
            
            # Technical data
            rsi=indicators['rsi'],
            zscore=indicators['zscore'],
            bollinger_position=indicators['bollinger_position'],
            support_level=indicators['support_level'],
            resistance_level=indicators['resistance_level'],
            
            # Mean reversion metrics
            distance_from_mean=indicators['distance_from_mean'],
            oversold_duration=oversold_duration,
            bounce_probability=bounce_probability,
            volume_confirmation=indicators['volume_confirmation'],
            
            # Market context
            market_sentiment=self._assess_market_sentiment(indicators, market_oversold),
            
            # Metadata
            signal_timestamp=datetime.now(),
            confidence_score=self._calculate_confidence(indicators),
            holding_period_days=self._estimate_holding_period(indicators),
            notes=self._generate_notes(symbol, indicators)
        )
        
        return signal
    
    def _calculate_indicators(self, data: pd.DataFrame) -> Dict:
        """Calculate technical indicators for mean reversion analysis"""
        
        # Price and volume data
        close = data['Close'].values
        high = data['High'].values
        low = data['Low'].values
        volume = data['Volume'].values
        
        # Technical indicators
        rsi = talib.RSI(close, timeperiod=14)
        macd, macd_signal, macd_hist = talib.MACD(close, fastperiod=12, slowperiod=26, signalperiod=9)
        
        # Moving averages
        sma_20 = talib.SMA(close, timeperiod=20)
        sma_50 = talib.SMA(close, timeperiod=50)
        
        # Bollinger Bands
        bb_upper, bb_middle, bb_lower = talib.BBANDS(close, timeperiod=20, nbdevup=2, nbdevdn=2)
        
        # Z-score calculation
        zscore = self._calculate_zscore(close, self.lookback_days)
        
        # Support and resistance levels
        support_level, resistance_level = self._calculate_support_resistance(data)
        
        # Volume analysis
        volume_sma = talib.SMA(volume.astype(float), timeperiod=self.volume_lookback)
        current_volume = volume[-1]
        avg_volume = volume_sma[-1] if not np.isnan(volume_sma[-1]) else volume[-10:].mean()
        volume_ratio = current_volume / avg_volume if avg_volume > 0 else 1
        
        # Price action
        current_price = close[-1]
        
        # Bollinger Band position (0 = lower band, 1 = upper band)
        bb_position = (current_price - bb_lower[-1]) / (bb_upper[-1] - bb_lower[-1]) if bb_upper[-1] != bb_lower[-1] else 0.5
        
        # Distance from mean
        distance_from_mean = (current_price - sma_20[-1]) / sma_20[-1] * 100
        
        # Stochastic oscillator
        slowk, slowd = talib.STOCH(high, low, close, fastk_period=14, slowk_period=3, slowd_period=3)
        
        # Williams %R
        willr = talib.WILLR(high, low, close, timeperiod=14)
        
        # Average True Range
        atr = talib.ATR(high, low, close, timeperiod=14)
        
        # Volume confirmation
        volume_confirmation = volume_ratio > 1.2 and current_price < sma_20[-1]
        
        return {
            'rsi': rsi[-1],
            'zscore': zscore,
            'macd': macd[-1],
            'macd_signal': macd_signal[-1],
            'macd_hist': macd_hist[-1],
            'sma_20': sma_20[-1],
            'sma_50': sma_50[-1],
            'bb_upper': bb_upper[-1],
            'bb_middle': bb_middle[-1],
            'bb_lower': bb_lower[-1],
            'bollinger_position': bb_position,
            'support_level': support_level,
            'resistance_level': resistance_level,
            'volume_ratio': volume_ratio,
            'distance_from_mean': distance_from_mean,
            'current_price': current_price,
            'slowk': slowk[-1],
            'slowd': slowd[-1],
            'willr': willr[-1],
            'atr': atr[-1],
            'volume_confirmation': volume_confirmation
        }
    
    def _calculate_zscore(self, prices: np.ndarray, window: int) -> float:
        """Calculate Z-score for the latest price"""
        if len(prices) < window:
            return 0
        
        recent_prices = prices[-window:]
        mean_price = np.mean(recent_prices)
        std_price = np.std(recent_prices)
        
        if std_price == 0:
            return 0
        
        return (prices[-1] - mean_price) / std_price
    
    def _calculate_support_resistance(self, data: pd.DataFrame) -> Tuple[float, float]:
        """Calculate support and resistance levels"""
        
        # Look at recent price action
        recent_data = data.tail(self.lookback_days * 2)
        
        # Support: Recent swing lows
        lows = recent_data['Low']
        support_candidates = []
        
        for i in range(2, len(lows) - 2):
            if lows.iloc[i] < lows.iloc[i-1] and lows.iloc[i] < lows.iloc[i+1]:
                support_candidates.append(lows.iloc[i])
        
        support_level = np.mean(support_candidates) if support_candidates else lows.min()
        
        # Resistance: Recent swing highs
        highs = recent_data['High']
        resistance_candidates = []
        
        for i in range(2, len(highs) - 2):
            if highs.iloc[i] > highs.iloc[i-1] and highs.iloc[i] > highs.iloc[i+1]:
                resistance_candidates.append(highs.iloc[i])
        
        resistance_level = np.mean(resistance_candidates) if resistance_candidates else highs.max()
        
        return support_level, resistance_level
    
    def _meets_mean_reversion_criteria(self, indicators: Dict) -> bool:
        """Check if symbol meets basic mean reversion criteria"""
        
        # RSI oversold
        if indicators['rsi'] > self.rsi_oversold:
            return False
        
        # Z-score oversold
        if indicators['zscore'] > self.zscore_threshold:
            return False
        
        # Near lower Bollinger Band
        if indicators['bollinger_position'] > self.bollinger_position:
            return False
        
        # Price below 20-day moving average
        if indicators['current_price'] >= indicators['sma_20']:
            return False
        
        # Stochastic oversold
        if indicators['slowk'] > 20:
            return False
        
        return True
    
    def _calculate_signal_strength(self, indicators: Dict, market_oversold: bool) -> float:
        """Calculate overall signal strength (0-100)"""
        
        strength = 0
        
        # RSI oversold strength (0-25 points)
        rsi_score = max(0, (30 - indicators['rsi']) / 30 * 25)
        strength += rsi_score
        
        # Z-score strength (0-20 points)
        zscore_score = max(0, min(20, abs(indicators['zscore']) * 5))
        strength += zscore_score
        
        # Bollinger Band position (0-15 points)
        bb_score = max(0, (0.2 - indicators['bollinger_position']) / 0.2 * 15)
        strength += bb_score
        
        # Distance from mean (0-15 points)
        distance_score = max(0, min(15, abs(indicators['distance_from_mean']) * 0.5))
        strength += distance_score
        
        # Support level proximity (0-10 points)
        price_to_support = (indicators['current_price'] - indicators['support_level']) / indicators['current_price']
        support_score = max(0, 10 * (1 - price_to_support * 20))  # Higher score closer to support
        strength += support_score
        
        # Stochastic oversold (0-10 points)
        stoch_score = max(0, (20 - indicators['slowk']) / 20 * 10)
        strength += stoch_score
        
        # Volume confirmation bonus (0-5 points)
        if indicators['volume_confirmation']:
            strength += 5
        
        # Market context bonus
        if market_oversold:
            strength += 5  # Better opportunity when whole market oversold
        
        return min(100, max(0, strength))
    
    def _calculate_levels(self, data: pd.DataFrame, indicators: Dict) -> Tuple[float, float]:
        """Calculate stop loss and target price levels"""
        
        entry_price = indicators['current_price']
        
        # Stop loss: Below support or recent swing low
        recent_low = data['Low'].tail(10).min()
        support_stop = indicators['support_level'] * 0.98  # 2% below support
        
        stop_loss = min(recent_low, support_stop)
        
        # Target: Mean reversion back to 20-day SMA or resistance
        sma_target = indicators['sma_20']
        resistance_target = indicators['resistance_level'] * 0.98  # Just below resistance
        
        # Use the more conservative target
        target_price = min(sma_target, resistance_target)
        
        # Ensure minimum 1.5:1 risk/reward
        risk = entry_price - stop_loss
        min_target = entry_price + (1.5 * risk)
        
        if target_price < min_target:
            target_price = min_target
        
        return stop_loss, target_price
    
    def _calculate_bounce_probability(self, indicators: Dict) -> float:
        """Calculate probability of bounce based on technical factors"""
        
        probability = 50  # Base probability
        
        # RSI extremely oversold
        if indicators['rsi'] < 20:
            probability += 20
        elif indicators['rsi'] < 25:
            probability += 15
        
        # Near support level
        price_to_support = abs(indicators['current_price'] - indicators['support_level']) / indicators['current_price']
        if price_to_support < 0.02:  # Within 2% of support
            probability += 15
        
        # Bollinger Band squeeze
        if indicators['bollinger_position'] < 0.05:
            probability += 10
        
        # Volume confirmation
        if indicators['volume_confirmation']:
            probability += 10
        
        # Stochastic divergence (simplified)
        if indicators['slowk'] < 10:
            probability += 5
        
        return min(100, probability)
    
    def _calculate_oversold_duration(self, data: pd.DataFrame) -> int:
        """Calculate how many days the stock has been oversold"""
        
        # Calculate RSI for recent period
        close = data['Close'].values
        rsi_series = talib.RSI(close, timeperiod=14)
        
        # Count consecutive days below 30
        duration = 0
        for i in range(len(rsi_series) - 1, -1, -1):
            if not np.isnan(rsi_series[i]) and rsi_series[i] < 30:
                duration += 1
            else:
                break
        
        return duration
    
    def _assess_market_sentiment(self, indicators: Dict, market_oversold: bool) -> str:
        """Assess market sentiment for mean reversion context"""
        
        if market_oversold and indicators['rsi'] < 25:
            return "Extreme Oversold"
        elif indicators['rsi'] < 20:
            return "Severely Oversold"
        elif indicators['rsi'] < 25:
            return "Oversold"
        elif indicators['bollinger_position'] < 0.1:
            return "Near Support"
        else:
            return "Mean Reversion Setup"
    
    def _calculate_confidence(self, indicators: Dict) -> float:
        """Calculate confidence score for the signal"""
        
        confidence = 50  # Base confidence
        
        # Multiple oversold indicators
        oversold_count = 0
        if indicators['rsi'] < 30:
            oversold_count += 1
        if indicators['zscore'] < -1.5:
            oversold_count += 1
        if indicators['bollinger_position'] < 0.2:
            oversold_count += 1
        if indicators['slowk'] < 20:
            oversold_count += 1
        
        confidence += oversold_count * 8
        
        # Near support level
        price_to_support = abs(indicators['current_price'] - indicators['support_level']) / indicators['current_price']
        if price_to_support < 0.03:
            confidence += 15
        
        # Volume confirmation
        if indicators['volume_confirmation']:
            confidence += 10
        
        return min(100, confidence)
    
    def _estimate_holding_period(self, indicators: Dict) -> int:
        """Estimate optimal holding period in days"""
        
        # Base holding period for mean reversion
        base_days = 10
        
        # Adjust based on oversold severity
        if indicators['rsi'] < 20:
            return base_days + 5  # Longer hold for extreme oversold
        elif indicators['zscore'] < -2.5:
            return base_days + 3
        
        return base_days
    
    def _generate_notes(self, symbol: str, indicators: Dict) -> str:
        """Generate descriptive notes for the signal"""
        
        notes = []
        
        if indicators['rsi'] < 20:
            notes.append(f"Extremely oversold (RSI: {indicators['rsi']:.1f})")
        elif indicators['rsi'] < 25:
            notes.append(f"Severely oversold (RSI: {indicators['rsi']:.1f})")
        
        if indicators['zscore'] < -2:
            notes.append(f"Z-score: {indicators['zscore']:.1f} (extreme)")
        
        if indicators['bollinger_position'] < 0.1:
            notes.append("Near lower Bollinger Band")
        
        price_to_support = abs(indicators['current_price'] - indicators['support_level']) / indicators['current_price']
        if price_to_support < 0.02:
            notes.append("At key support level")
        
        if indicators['volume_confirmation']:
            notes.append("Volume confirmation")
        
        return "; ".join(notes) if notes else "Standard mean reversion setup"

def main():
    """Test the mean reversion scanner"""
    from src.data_manager import DataManager
    
    # Initialize
    data_manager = DataManager()
    scanner = MeanReversionScanner(data_manager)
    
    # Test symbols
    test_symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'META', 'AMZN', 'NFLX']
    
    print("Testing Mean Reversion Scanner...")
    signals = scanner.scan(test_symbols)
    
    print(f"\nFound {len(signals)} mean reversion signals:")
    for signal in signals:
        print(f"{signal.symbol}: {signal.signal_strength:.1f}% - {signal.notes}")

if __name__ == "__main__":
    main()