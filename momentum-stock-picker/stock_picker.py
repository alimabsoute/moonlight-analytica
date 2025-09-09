import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')
pd.options.mode.chained_assignment = None

class MomentumStockPicker:
    def __init__(self):
        # S&P 500 tickers - using most liquid stocks
        self.sp500_top_100 = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK-B', 'UNH', 'JNJ',
            'XOM', 'JPM', 'V', 'PG', 'HD', 'CVX', 'MA', 'BAC', 'ABBV', 'PFE',
            'AVGO', 'KO', 'LLY', 'MRK', 'PEP', 'TMO', 'COST', 'WMT', 'DHR', 'ABT',
            'ACN', 'VZ', 'ADBE', 'NKE', 'CRM', 'TXN', 'NEE', 'RTX', 'ORCL', 'QCOM',
            'PM', 'DIS', 'WFC', 'UNP', 'BMY', 'HON', 'LOW', 'T', 'SPGI', 'UPS',
            'AMD', 'INTU', 'IBM', 'GS', 'CAT', 'AMGN', 'SBUX', 'BLK', 'AXP', 'BKNG',
            'DE', 'MDT', 'TJX', 'ADP', 'GILD', 'MMM', 'LRCX', 'BA', 'C', 'MO',
            'TMUS', 'AMT', 'CVS', 'SCHW', 'FIS', 'NOW', 'ZTS', 'PYPL', 'CHTR', 'SYK',
            'CB', 'ANTM', 'MU', 'BDX', 'ISRG', 'PLD', 'TFC', 'SO', 'REGN', 'AMAT',
            'CI', 'AON', 'CL', 'BSX', 'TGT', 'APD', 'CSX', 'DUK', 'MMC', 'KLAC'
        ]
        
    def fetch_stock_data(self, symbol, period="3mo"):
        """Fetch stock data with error handling"""
        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(period=period)
            if data.empty:
                return None
            return data
        except Exception as e:
            print(f"Error fetching data for {symbol}: {e}")
            return None
    
    def calculate_momentum_indicators(self, data):
        """Calculate multiple momentum indicators"""
        if data is None or len(data) < 20:
            return None
        
        indicators = {}
        
        # Price momentum
        current_price = data['Close'].iloc[-1]
        price_5d = data['Close'].iloc[-6] if len(data) > 6 else data['Close'].iloc[0]
        price_10d = data['Close'].iloc[-11] if len(data) > 11 else data['Close'].iloc[0] 
        price_20d = data['Close'].iloc[-21] if len(data) > 21 else data['Close'].iloc[0]
        
        indicators['price_change_5d'] = (current_price / price_5d - 1) * 100 if price_5d > 0 else 0
        indicators['price_change_10d'] = (current_price / price_10d - 1) * 100 if price_10d > 0 else 0
        indicators['price_change_20d'] = (current_price / price_20d - 1) * 100 if price_20d > 0 else 0
        
        # Moving averages
        data['MA_5'] = data['Close'].rolling(window=5).mean()
        data['MA_20'] = data['Close'].rolling(window=20).mean()
        data['MA_50'] = data['Close'].rolling(window=50).mean()
        
        ma5_current = data['MA_5'].iloc[-1]
        ma20_current = data['MA_20'].iloc[-1]
        
        indicators['above_ma5'] = current_price > ma5_current if not pd.isna(ma5_current) else False
        indicators['above_ma20'] = current_price > ma20_current if not pd.isna(ma20_current) else False
        
        ma5_prev = data['MA_5'].iloc[-6] if len(data) > 6 else ma5_current
        indicators['ma5_slope'] = (ma5_current / ma5_prev - 1) * 100 if not pd.isna(ma5_prev) and ma5_prev > 0 else 0
        
        # Volume indicators
        volume_recent = data['Volume'].iloc[-5:].mean()
        volume_base = data['Volume'].iloc[-20:-5].mean() if len(data) > 20 else data['Volume'].mean()
        indicators['volume_ratio_5d'] = volume_recent / volume_base if volume_base > 0 else 1.0
        
        volume_ma20 = data['Volume'].rolling(20).mean().iloc[-1]
        indicators['volume_spike'] = data['Volume'].iloc[-1] > (volume_ma20 * 1.5) if not pd.isna(volume_ma20) else False
        
        # Relative Strength Index (simplified)
        delta = data['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi_value = rs.iloc[-1]
        if pd.isna(rsi_value) or rsi_value == 0:
            indicators['rsi'] = 50.0  # neutral
        else:
            indicators['rsi'] = 100 - (100 / (1 + rsi_value))
        
        # Volatility
        volatility_calc = data['Close'].pct_change().rolling(20).std() * np.sqrt(252) * 100
        indicators['volatility'] = volatility_calc.iloc[-1] if not pd.isna(volatility_calc.iloc[-1]) else 20.0
        
        # Breakout detection
        high_20 = data['High'].rolling(20).max().iloc[-1]
        indicators['near_52w_high'] = (current_price / high_20 > 0.95) if not pd.isna(high_20) and high_20 > 0 else False
        
        return indicators
    
    def calculate_momentum_score(self, indicators):
        """Calculate composite momentum score"""
        if indicators is None:
            return 0
        
        score = 0
        
        # Price momentum weights
        if indicators['price_change_5d'] > 3:
            score += 25
        elif indicators['price_change_5d'] > 1:
            score += 15
        elif indicators['price_change_5d'] > 0:
            score += 5
        
        if indicators['price_change_10d'] > 5:
            score += 20
        elif indicators['price_change_10d'] > 2:
            score += 10
        
        # Moving average alignment
        if indicators['above_ma5'] and indicators['above_ma20']:
            score += 15
        if indicators['ma5_slope'] > 1:
            score += 10
        
        # Volume confirmation
        if indicators['volume_ratio_5d'] > 1.2:
            score += 10
        if indicators['volume_spike']:
            score += 15
        
        # RSI momentum (not overbought)
        if 50 < indicators['rsi'] < 75:
            score += 10
        elif indicators['rsi'] > 75:
            score -= 5  # Potentially overbought
        
        # Breakout bonus
        if indicators['near_52w_high']:
            score += 15
        
        # Volatility consideration
        if 15 < indicators['volatility'] < 40:
            score += 5
        elif indicators['volatility'] > 50:
            score -= 10  # Too volatile
        
        return max(0, min(100, score))
    
    def predict_continuation(self, data, indicators):
        """Predict if momentum will continue for 2-3 days"""
        if indicators is None:
            return 0
        
        continuation_score = 0
        
        # Strong recent momentum with volume
        if indicators['price_change_5d'] > 2 and indicators['volume_ratio_5d'] > 1.1:
            continuation_score += 30
        
        # Trend alignment
        if indicators['above_ma5'] and indicators['above_ma20'] and indicators['ma5_slope'] > 0:
            continuation_score += 25
        
        # Not overbought
        if indicators['rsi'] < 70:
            continuation_score += 20
        
        # Consistent momentum
        if indicators['price_change_5d'] > 0 and indicators['price_change_10d'] > 0:
            continuation_score += 15
        
        # Volume support
        if indicators['volume_spike'] and indicators['volume_ratio_5d'] > 1.0:
            continuation_score += 10
        
        return min(100, continuation_score)
    
    def get_daily_picks(self, top_n=3):
        """Get top momentum picks for the day"""
        print("Analyzing stocks for momentum opportunities...")
        
        results = []
        
        for symbol in self.sp500_top_100:
            print(f"Analyzing {symbol}...", end=" ")
            
            data = self.fetch_stock_data(symbol)
            if data is None:
                print("FAIL")
                continue
                
            indicators = self.calculate_momentum_indicators(data)
            if indicators is None:
                print("FAIL")
                continue
                
            momentum_score = self.calculate_momentum_score(indicators)
            continuation_score = self.predict_continuation(data, indicators)
            
            # Combined score for ranking
            combined_score = (momentum_score * 0.6) + (continuation_score * 0.4)
            
            current_price = data['Close'].iloc[-1]
            
            results.append({
                'symbol': symbol,
                'current_price': current_price,
                'momentum_score': momentum_score,
                'continuation_score': continuation_score,
                'combined_score': combined_score,
                'price_change_5d': indicators['price_change_5d'],
                'volume_ratio': indicators['volume_ratio_5d'],
                'rsi': indicators['rsi'],
                'above_ma20': indicators['above_ma20']
            })
            
            print("OK")
        
        # Sort by combined score and return top picks
        results_df = pd.DataFrame(results)
        top_picks = results_df.nlargest(top_n, 'combined_score')
        
        return top_picks
    
    def display_picks(self, picks):
        """Display the top picks in a formatted way"""
        print("\n" + "="*80)
        print(f"TOP {len(picks)} MOMENTUM PICKS - {datetime.now().strftime('%Y-%m-%d')}")
        print("="*80)
        
        for idx, pick in picks.iterrows():
            print(f"\n#{picks.index.get_loc(idx) + 1}. {pick['symbol']}")
            print(f"   Current Price: ${pick['current_price']:.2f}")
            print(f"   5-Day Change: {pick['price_change_5d']:.1f}%")
            print(f"   Momentum Score: {pick['momentum_score']:.0f}/100")
            print(f"   Continuation Score: {pick['continuation_score']:.0f}/100")
            print(f"   Combined Score: {pick['combined_score']:.1f}")
            print(f"   RSI: {pick['rsi']:.1f}")
            print(f"   Volume Ratio: {pick['volume_ratio']:.1f}x")
            print(f"   Above MA20: {'YES' if pick['above_ma20'] else 'NO'}")
            
        print("\n" + "="*80)
        print("DISCLAIMER: This is for educational purposes. Always do your own research!")
        print("="*80)

def main():
    picker = MomentumStockPicker()
    
    # Get daily picks
    top_picks = picker.get_daily_picks(top_n=3)
    
    # Display results
    picker.display_picks(top_picks)
    
    # Save to CSV for tracking
    timestamp = datetime.now().strftime('%Y%m%d_%H%M')
    filename = f"momentum_picks_{timestamp}.csv"
    top_picks.to_csv(filename, index=False)
    print(f"\nResults saved to: {filename}")

if __name__ == "__main__":
    main()