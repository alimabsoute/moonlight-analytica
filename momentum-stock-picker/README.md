# 🚀 Daily Momentum Stock Picker

An AI-powered tool that identifies the top 3 stocks with strongest momentum likely to continue moving higher for 2-3 days.

## 🎯 What It Does

- **Analyzes 100 most liquid S&P 500 stocks** daily for momentum signals
- **Identifies top 3 picks** with highest probability of continued upward movement
- **Multi-factor scoring system** combining price momentum, volume, and technical indicators
- **Predicts 2-3 day continuation** using trend analysis and momentum persistence

## 🔍 Analysis Factors

### Momentum Indicators
- **Price Changes**: 5-day, 10-day, and 20-day momentum
- **Moving Averages**: 5, 20, 50-day alignment and slope
- **Volume Analysis**: Volume spikes and relative volume ratios
- **RSI**: Momentum without overbought conditions
- **Breakouts**: Stocks near 52-week highs

### Continuation Prediction
- **Trend Consistency**: Aligned short and medium-term trends
- **Volume Support**: Volume confirmation of price moves
- **Technical Strength**: Not overbought, sustainable momentum
- **Pattern Recognition**: Breakout patterns with follow-through

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Get Daily Picks (Command Line)
```bash
python run_picker.py
```

### 3. Interactive Dashboard
```bash
streamlit run dashboard.py
```

## 📊 Output Example

```
================================================================================
🚀 TOP 3 MOMENTUM PICKS - 2024-01-15
================================================================================

#1. NVDA
   💰 Current Price: $485.32
   📈 5-Day Change: 8.2%
   🔥 Momentum Score: 85/100
   ⏳ Continuation Score: 78/100
   📊 Combined Score: 82.4
   📈 RSI: 65.3
   🔊 Volume Ratio: 1.8x
   📊 Above MA20: ✅

#2. AMD
   💰 Current Price: $142.87
   📈 5-Day Change: 6.1%
   🔥 Momentum Score: 79/100
   ⏳ Continuation Score: 71/100
   📊 Combined Score: 76.2
   📈 RSI: 58.9
   🔊 Volume Ratio: 1.4x
   📊 Above MA20: ✅
```

## 📈 Scoring System

### Momentum Score (0-100)
- **25 points**: Strong 5-day price momentum (>3%)
- **20 points**: Solid 10-day momentum (>5%)
- **15 points**: Above both MA5 and MA20
- **15 points**: Volume spike confirmation
- **10 points**: Positive RSI momentum (50-75)
- **15 points**: Near 52-week highs

### Continuation Score (0-100)
- **30 points**: Recent momentum with volume support
- **25 points**: All moving averages aligned upward
- **20 points**: Not overbought (RSI < 70)
- **15 points**: Consistent short and medium-term trends
- **10 points**: Volume confirmation

## 📁 Files Generated

Each run creates timestamped files:
- `picks_YYYYMMDD_HHMM.csv` - Spreadsheet format
- `picks_YYYYMMDD_HHMM.json` - Detailed data with metadata

## 🎛️ Customization

### Change Number of Picks
```python
# In run_picker.py
top_picks = picker.get_daily_picks(top_n=5)  # Get top 5 instead of 3
```

### Adjust Stock Universe
```python
# In stock_picker.py, modify the sp500_top_100 list
# Add or remove tickers as needed
```

### Modify Scoring Weights
```python
# In calculate_momentum_score() and predict_continuation()
# Adjust point values for different factors
```

## 🎯 Best Practices

### When to Use
- **Morning Analysis**: Run before market open for day trading
- **Swing Trading**: 2-3 day holding periods work best
- **High Volume Days**: Works better during active market periods

### Risk Management
- **Never risk more than 2% per position**
- **Use stop losses** (suggest 3-5% below entry)
- **Diversify across picks** (don't put everything in #1 pick)
- **Monitor news and earnings** that could affect momentum

### Optimal Timing
- **Best Results**: During trending market conditions
- **Avoid**: Low volume days, major news events, earnings weeks
- **Review**: Check picks against broader market direction

## 🔧 Advanced Features

### Dashboard Features
- **Interactive Charts**: Candlestick charts with moving averages
- **Real-time Updates**: Refresh data throughout the day
- **Historical Tracking**: Performance analysis of past picks
- **Export Options**: CSV download for spreadsheet analysis

### Command Line Options
```bash
# Quick morning routine
python run_picker.py

# Web dashboard for detailed analysis
streamlit run dashboard.py
```

## ⚠️ Important Disclaimers

1. **Educational Purpose**: This tool is for learning and research only
2. **Not Financial Advice**: Always do your own research
3. **Market Risk**: All trading involves risk of loss
4. **Past Performance**: Does not guarantee future results
5. **Data Accuracy**: Double-check all data before trading

## 🤝 Contributing

Feel free to improve the scoring algorithm, add new indicators, or enhance the dashboard. Key areas for enhancement:

- **Machine Learning**: Add ML models for better prediction
- **More Indicators**: MACD, Bollinger Bands, etc.
- **Sector Analysis**: Sector rotation detection
- **News Integration**: Sentiment analysis from news
- **Options Data**: Unusual options activity

## 📞 Support

For issues or questions:
1. Check internet connection (uses Yahoo Finance API)
2. Verify all dependencies are installed
3. Ensure valid stock symbols in universe
4. Check market hours (some data unavailable when closed)

---

**Happy Trading! 🚀📈**

Remember: The best momentum strategy combines this tool with your own market knowledge and risk management!