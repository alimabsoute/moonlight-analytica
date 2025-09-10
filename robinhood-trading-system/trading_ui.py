#!/usr/bin/env python3
"""
Professional Trading Strategy Platform
Clean, Google-style interface with comprehensive strategy analysis
"""

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from src.data_manager import DataManager
from src.scanners.momentum import MomentumScanner
from src.scanners.mean_reversion import MeanReversionScanner
import numpy as np
from datetime import datetime, timedelta
import time

# Configure page
st.set_page_config(
    page_title="Professional Trading Platform",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Professional Light Theme CSS - Google Article Style
st.markdown("""
<style>
    /* Main background - clean white */
    .stApp {
        background-color: #ffffff;
    }
    
    /* Sidebar styling */
    .css-1d391kg {
        background-color: #f8f9fa;
        border-right: 1px solid #e9ecef;
    }
    
    /* Headers - professional typography */
    h1, h2, h3 {
        color: #1a1a1a;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-weight: 600;
    }
    
    h1 {
        font-size: 2.2rem;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 3px solid #4285f4;
    }
    
    /* Metrics styling - clean cards */
    div[data-testid="metric-container"] {
        background-color: #ffffff;
        border: 1px solid #e9ecef;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    div[data-testid="metric-container"] > div {
        color: #1a1a1a;
    }
    
    /* Buttons - professional styling */
    .stButton > button {
        background-color: #4285f4;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        font-weight: 500;
        transition: all 0.3s ease;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .stButton > button:hover {
        background-color: #3367d6;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        transform: translateY(-1px);
    }
    
    /* Sidebar elements */
    .stSelectbox > div > div {
        background-color: white;
        border: 1px solid #d1d5db;
        border-radius: 6px;
    }
    
    /* Info boxes */
    .stInfo {
        background-color: #e3f2fd;
        border-left: 4px solid #2196f3;
        padding: 1rem;
        border-radius: 4px;
    }
    
    .stSuccess {
        background-color: #e8f5e8;
        border-left: 4px solid #4caf50;
        padding: 1rem;
        border-radius: 4px;
    }
    
    /* Clean spacing */
    .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
    }
    
    /* Strategy cards */
    .strategy-card {
        background-color: #ffffff;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1.5rem;
        margin: 1rem 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: box-shadow 0.3s ease;
    }
    
    .strategy-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    /* Professional text colors */
    .stMarkdown {
        color: #1a1a1a;
    }
    
    /* Clean table styling */
    .stDataFrame {
        border: 1px solid #e9ecef;
        border-radius: 6px;
    }
</style>
""", unsafe_allow_html=True)

# 📊 Professional Trading Strategy Platform

st.markdown("""
<div style="background-color: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border-left: 4px solid #4285f4;">
    <h4 style="margin: 0; color: #1a1a1a;">Analyze stocks with professional-grade trading strategies</h4>
    <p style="margin: 0.5rem 0 0 0; color: #6c757d;">Get real-time analysis, historical data up to 10 years, and actionable trading signals</p>
</div>
""", unsafe_allow_html=True)

# Navigation tabs
tab1, tab2, tab3, tab4 = st.tabs(["📈 Analysis", "🎯 Strategy Hub", "📚 Learn", "⚙️ Settings"])

with tab4:  # Settings tab
    st.subheader("Platform Settings")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.write("**Display Preferences**")
        show_advanced = st.checkbox("Show Advanced Metrics", value=True)
        show_tooltips = st.checkbox("Show Educational Tooltips", value=True)
        
    with col2:
        st.write("**Data Preferences**")
        max_history = st.selectbox("Maximum Historical Data", ["1Y", "2Y", "5Y", "10Y", "MAX"], index=3)
        update_frequency = st.selectbox("Update Frequency", ["Real-time", "5 minutes", "15 minutes", "1 hour"], index=2)

with tab3:  # Learn tab
    st.subheader("Trading Strategy Education")
    
    st.markdown("""
    ### 🎯 Understanding Trading Strategies
    
    <div class="strategy-card">
        <h4>📈 Momentum Strategy</h4>
        <p><strong>What it does:</strong> Identifies stocks that are trending upward with strong buying pressure</p>
        <p><strong>When to use:</strong> In bull markets or when you see strong upward price movement</p>
        <p><strong>Risk Level:</strong> <span style="color: #ff9800;">Medium</span></p>
        <p><strong>Typical holding period:</strong> 5-15 days</p>
        <p><strong>Key indicators:</strong> RSI above 50, increasing volume, price above moving averages</p>
    </div>
    
    <div class="strategy-card">
        <h4>🔄 Mean Reversion Strategy</h4>
        <p><strong>What it does:</strong> Finds oversold stocks that are likely to bounce back up</p>
        <p><strong>When to use:</strong> When stocks have fallen too far, too fast</p>
        <p><strong>Risk Level:</strong> <span style="color: #4caf50;">Lower</span></p>
        <p><strong>Typical holding period:</strong> 3-10 days</p>
        <p><strong>Key indicators:</strong> RSI below 40, price near support levels, oversold conditions</p>
    </div>
    
    <div class="strategy-card">
        <h4>⚡ Breakout Strategy (Coming Soon)</h4>
        <p><strong>What it does:</strong> Catches stocks breaking above resistance levels</p>
        <p><strong>When to use:</strong> When stocks break out of consolidation patterns</p>
        <p><strong>Risk Level:</strong> <span style="color: #f44336;">Higher</span></p>
        <p><strong>Typical holding period:</strong> 1-5 days</p>
    </div>
    """, unsafe_allow_html=True)

with tab2:  # Strategy Hub
    st.subheader("Interactive Strategy Hub")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        <div class="strategy-card">
            <h4>🚀 Quick Momentum Scan</h4>
            <p>Find trending stocks right now</p>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("Run Momentum Scan", key="momentum_scan"):
            st.info("Scanning for momentum opportunities...")
            # This would run a broader scan
            
    with col2:
        st.markdown("""
        <div class="strategy-card">
            <h4>📉 Oversold Finder</h4>
            <p>Discover bounce candidates</p>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("Find Oversold Stocks", key="oversold_scan"):
            st.info("Scanning for oversold opportunities...")
            
    with col3:
        st.markdown("""
        <div class="strategy-card">
            <h4>📊 Strategy Comparison</h4>
            <p>Compare strategy performance</p>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("Compare Strategies", key="compare_strategies"):
            st.info("Loading strategy comparison...")

with tab1:  # Main analysis tab

    # Professional sidebar with clean styling
    st.sidebar.markdown("""
    <div style="background-color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #e9ecef;">
        <h3 style="margin: 0; color: #1a1a1a; font-size: 1.2rem;">🎯 Analysis Settings</h3>
    </div>
    """, unsafe_allow_html=True)

    # Symbol input with enhanced styling
    st.sidebar.markdown("**Stock Symbol**")
    symbol = st.sidebar.text_input(
        "Enter symbol", 
        value="TSLA", 
        help="Enter any US stock or ETF symbol (e.g., AAPL, SPY, QQQ)",
        label_visibility="collapsed"
    ).upper()
    
    # Enhanced time period selection
    st.sidebar.markdown("**Historical Data Range**")
    period_options = {
        "3 Months": "3mo",
        "6 Months": "6mo", 
        "1 Year": "1y",
        "2 Years": "2y",
        "5 Years": "5y",
        "10 Years": "10y",
        "Maximum": "max"
    }
    period_display = st.sidebar.selectbox(
        "Select timeframe", 
        list(period_options.keys()), 
        index=2,
        label_visibility="collapsed"
    )
    period = period_options[period_display]
    
    # Strategy settings with better organization
    st.sidebar.markdown("---")
    st.sidebar.markdown("**Strategy Configuration**")
    
    strategy_mode = st.sidebar.radio(
        "Analysis Mode",
        ["Beginner (Simple)", "Advanced (Detailed)"],
        index=0
    )
    
    if strategy_mode == "Advanced (Detailed)":
        st.sidebar.markdown("*Advanced Parameters*")
        momentum_threshold = st.sidebar.slider("Momentum Sensitivity", 20, 80, 40, help="Lower = More signals")
        mean_rev_threshold = st.sidebar.slider("Mean Reversion Sensitivity", 20, 80, 40, help="Lower = More signals")
    else:
        # Use default values for beginners
        momentum_threshold = 40
        mean_rev_threshold = 40
        st.sidebar.info("Using optimized default settings for beginners")

    # Professional analyze button
    analyze_clicked = st.sidebar.button(
        "📊 Analyze Stock", 
        help="Get comprehensive analysis and trading signals",
        use_container_width=True
    )
    
    # Quick action buttons
    st.sidebar.markdown("---")
    st.sidebar.markdown("**Quick Actions**")
    
    col1, col2 = st.sidebar.columns(2)
    with col1:
        if st.button("🚀 Momentum", help="Quick momentum check", use_container_width=True):
            analyze_clicked = True
            st.session_state.quick_analysis = "momentum"
    with col2:
        if st.button("🔄 Mean Rev", help="Quick oversold check", use_container_width=True):
            analyze_clicked = True  
            st.session_state.quick_analysis = "mean_reversion"

if analyze_clicked:
    # Professional loading message
    progress_placeholder = st.empty()
    progress_placeholder.info(f"🔍 Analyzing {symbol} with {period_display.lower()} of historical data...")
    
    with st.spinner("Processing data and generating signals..."):
        
        try:
            # Initialize data manager
            dm = DataManager()
            
            # Fetch data with progress indication
            data = dm.get_stock_data(symbol, period=period)
            progress_placeholder.empty()
            
            if data.empty:
                st.error(f"⚠️ Could not fetch data for {symbol}. Please check the symbol and try again.")
                st.info("📊 **Tip:** Make sure you're using a valid US stock or ETF symbol (e.g., AAPL, MSFT, SPY)")
            else:
                # Success message
                st.success(f"✅ Successfully loaded {len(data)} days of data for {symbol}")
                # Enhanced metrics display with better styling
                st.markdown("### 📊 Key Metrics")
                col1, col2, col3, col4 = st.columns(4)
                
                current_price = data['Close'].iloc[-1]
                start_price = data['Close'].iloc[0] 
                return_pct = ((current_price / start_price) - 1) * 100
                high_period = data['High'].max()
                low_period = data['Low'].min()
                
                with col1:
                    st.metric(
                        "Current Price", 
                        f"${current_price:.2f}",
                        help="Latest closing price"
                    )
                
                with col2:
                    delta_color = "normal" if return_pct >= 0 else "inverse"
                    st.metric(
                        f"{period_display} Return", 
                        f"{return_pct:+.1f}%", 
                        delta=f"${current_price - start_price:.2f}",
                        delta_color=delta_color,
                        help=f"Total return over {period_display.lower()}"
                    )
                
                with col3:
                    st.metric(
                        f"{period_display} High", 
                        f"${high_period:.2f}",
                        help=f"Highest price in {period_display.lower()}"
                    )
                
                with col4:
                    st.metric(
                        f"{period_display} Low", 
                        f"${low_period:.2f}",
                        help=f"Lowest price in {period_display.lower()}"
                    )
                
                # Enhanced technical indicators with more options
                st.markdown("---")
                
                # Calculate multiple timeframe moving averages
                sma_10 = data['Close'].rolling(10).mean()
                sma_20 = data['Close'].rolling(20).mean()
                sma_50 = data['Close'].rolling(50).mean()
                sma_200 = data['Close'].rolling(200).mean() if len(data) >= 200 else None
                ema_12 = data['Close'].ewm(span=12).mean()
                ema_26 = data['Close'].ewm(span=26).mean()
                
                # RSI calculation
                delta = data['Close'].diff()
                gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
                rs = gain / loss
                rsi = 100 - (100 / (1 + rs))
                
                # Professional chart creation with enhanced layout
                st.markdown("### 📈 Technical Analysis Chart")
                
                fig = make_subplots(
                    rows=3, cols=1,
                    shared_xaxes=True,
                    vertical_spacing=0.05,
                    subplot_titles=[
                        f'{symbol} Price Action & Moving Averages', 
                        'RSI (Relative Strength Index)',
                        'Volume Analysis'
                    ],
                    row_heights=[0.6, 0.2, 0.2]
                )
                
                # Enhanced price chart with multiple indicators
                fig.add_trace(
                    go.Scatter(
                        x=data.index, 
                        y=data['Close'], 
                        name='Price', 
                        line=dict(color='#1f77b4', width=2),
                        hovertemplate='Price: $%{y:.2f}<extra></extra>'
                    ),
                    row=1, col=1
                )
                
                fig.add_trace(
                    go.Scatter(
                        x=data.index, 
                        y=sma_20, 
                        name='20-day SMA', 
                        line=dict(color='#ff7f0e', width=1.5),
                        hovertemplate='20 SMA: $%{y:.2f}<extra></extra>'
                    ),
                    row=1, col=1
                )
                
                fig.add_trace(
                    go.Scatter(
                        x=data.index, 
                        y=sma_50, 
                        name='50-day SMA', 
                        line=dict(color='#2ca02c', width=1.5),
                        hovertemplate='50 SMA: $%{y:.2f}<extra></extra>'
                    ),
                    row=1, col=1
                )
                
                # Add 200-day SMA if we have enough data
                if sma_200 is not None:
                    fig.add_trace(
                        go.Scatter(
                            x=data.index, 
                            y=sma_200, 
                            name='200-day SMA', 
                            line=dict(color='#d62728', width=2, dash='dash'),
                            hovertemplate='200 SMA: $%{y:.2f}<extra></extra>'
                        ),
                        row=1, col=1
                    )
                
                # Enhanced RSI with better styling
                fig.add_trace(
                    go.Scatter(
                        x=data.index, 
                        y=rsi, 
                        name='RSI', 
                        line=dict(color='#9467bd', width=2),
                        hovertemplate='RSI: %{y:.1f}<extra></extra>'
                    ),
                    row=2, col=1
                )
                
                # RSI reference lines with labels
                fig.add_hline(y=70, line_dash="dash", line_color="#d62728", row=2, col=1, 
                             annotation_text="Overbought (70)", annotation_position="top right")
                fig.add_hline(y=50, line_dash="dot", line_color="#7f7f7f", row=2, col=1,
                             annotation_text="Neutral (50)", annotation_position="top right")
                fig.add_hline(y=30, line_dash="dash", line_color="#2ca02c", row=2, col=1,
                             annotation_text="Oversold (30)", annotation_position="bottom right")
                
                # Volume chart
                fig.add_trace(
                    go.Bar(
                        x=data.index, 
                        y=data['Volume'], 
                        name='Volume',
                        marker_color='#17becf',
                        opacity=0.7,
                        hovertemplate='Volume: %{y:,.0f}<extra></extra>'
                    ),
                    row=3, col=1
                )
                
                # Professional chart layout
                fig.update_layout(
                    height=800, 
                    showlegend=True,
                    template="plotly_white",
                    hovermode='x unified',
                    title=f"{symbol} - Technical Analysis ({period_display})"
                )
                
                fig.update_xaxes(title_text="Date", row=3, col=1)
                fig.update_yaxes(title_text="Price ($)", row=1, col=1)
                fig.update_yaxes(title_text="RSI", row=2, col=1, range=[0, 100])
                fig.update_yaxes(title_text="Volume", row=3, col=1)
                
                st.plotly_chart(fig, use_container_width=True)
                
                # Enhanced Strategy Analysis with better presentation
                st.markdown("---")
                st.markdown("### 🎯 Trading Strategy Analysis")
                
                col1, col2 = st.columns(2)
                
                with col1:
                    st.markdown("""
                    <div class="strategy-card">
                        <h4>🚀 Momentum Strategy</h4>
                        <p><i>"Ride the trend - buy stocks with strong upward momentum"</i></p>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    # Initialize momentum scanner with custom threshold
                    momentum = MomentumScanner(dm)
                    momentum.min_signal_strength = momentum_threshold
                    momentum.volume_multiplier = 1.2
                    momentum.price_change_min = 1.0
                    
                    with st.spinner("Analyzing momentum signals..."):
                        mom_signals = momentum.scan([symbol])
                    
                    if mom_signals:
                        s = mom_signals[0]
                        st.success(f"✅ **Strong Momentum Signal Found!**")
                        
                        # Create professional signal display
                        signal_data = {
                            "Metric": ["Signal Strength", "Entry Price", "Target Price", "Stop Loss", "Risk/Reward", "Confidence"],
                            "Value": [
                                f"{s.signal_strength:.1f}%",
                                f"${s.entry_price:.2f}",
                                f"${s.target_price:.2f}",
                                f"${s.stop_loss:.2f}",
                                f"{s.risk_reward_ratio:.1f}:1",
                                "High" if s.signal_strength > 70 else "Medium" if s.signal_strength > 50 else "Low"
                            ]
                        }
                        st.dataframe(pd.DataFrame(signal_data), use_container_width=True, hide_index=True)
                        
                        if show_tooltips:
                            st.info(f"📝 **Strategy Notes:** {s.notes}")
                            
                    else:
                        st.info("📊 No momentum signals detected at current sensitivity level")
                        if strategy_mode == "Advanced (Detailed)":
                            st.write("*Try lowering the momentum sensitivity slider to find more signals*")
                
                with col2:
                    st.markdown("""
                    <div class="strategy-card">
                        <h4>🔄 Mean Reversion Strategy</h4>
                        <p><i>"Buy the dip - find oversold stocks ready to bounce"</i></p>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    # Initialize mean reversion scanner with custom threshold
                    mean_rev = MeanReversionScanner(dm)
                    mean_rev.min_signal_strength = mean_rev_threshold
                    mean_rev.rsi_oversold = 40
                    mean_rev.zscore_threshold = -1.5
                    
                    with st.spinner("Analyzing mean reversion signals..."):
                        mean_signals = mean_rev.scan([symbol])
                    
                    if mean_signals:
                        s = mean_signals[0]
                        st.success(f"✅ **Mean Reversion Signal Found!**")
                        
                        # Create professional signal display
                        signal_data = {
                            "Metric": ["Signal Strength", "Entry Price", "Target Price", "Stop Loss", "Current RSI", "Oversold Level"],
                            "Value": [
                                f"{s.signal_strength:.1f}%",
                                f"${s.entry_price:.2f}",
                                f"${s.target_price:.2f}", 
                                f"${s.stop_loss:.2f}",
                                f"{s.rsi:.1f}",
                                "Yes" if s.rsi < 35 else "Mild" if s.rsi < 45 else "No"
                            ]
                        }
                        st.dataframe(pd.DataFrame(signal_data), use_container_width=True, hide_index=True)
                        
                        if show_tooltips:
                            st.info(f"📝 **Strategy Notes:** {s.notes}")
                            
                    else:
                        st.info("📊 No mean reversion signals detected at current sensitivity level")
                        if strategy_mode == "Advanced (Detailed)":
                            st.write("*Try lowering the mean reversion sensitivity slider to find more signals*")
                
                # Enhanced Technical Summary
                st.markdown("---")
                st.markdown("### 📊 Comprehensive Technical Summary")
                
                current_rsi = rsi.iloc[-1]
                current_sma20 = sma_20.iloc[-1]
                current_sma50 = sma_50.iloc[-1]
                current_sma200 = sma_200.iloc[-1] if sma_200 is not None else None
                
                # Enhanced volume analysis
                avg_volume_10 = data['Volume'].rolling(10).mean().iloc[-1]
                avg_volume_50 = data['Volume'].rolling(50).mean().iloc[-1]
                current_volume = data['Volume'].iloc[-1]
                volume_ratio_10 = current_volume / avg_volume_10 if avg_volume_10 > 0 else 1
                volume_ratio_50 = current_volume / avg_volume_50 if avg_volume_50 > 0 else 1
                
                # Position in range calculation
                range_position = ((current_price - low_period) / (high_period - low_period) * 100) if high_period > low_period else 50
                
                # Create comprehensive summary
                col1, col2 = st.columns(2)
                
                with col1:
                    st.markdown("**Price Action Analysis**")
                    price_data = {
                        "Indicator": ["Current RSI", "vs 20-day SMA", "vs 50-day SMA", "Position in Range"],
                        "Value": [
                            f"{current_rsi:.1f}",
                            f"{'Above' if current_price > current_sma20 else 'Below'} by ${abs(current_price - current_sma20):.2f}",
                            f"{'Above' if current_price > current_sma50 else 'Below'} by ${abs(current_price - current_sma50):.2f}",
                            f"{range_position:.1f}% of {period_display.lower()} range"
                        ],
                        "Signal": [
                            "🔴 Overbought" if current_rsi > 70 else "🟢 Oversold" if current_rsi < 30 else "🟡 Neutral",
                            "🟢 Bullish" if current_price > current_sma20 else "🔴 Bearish",
                            "🟢 Bullish" if current_price > current_sma50 else "🔴 Bearish",
                            "🔴 Near High" if range_position > 85 else "🟢 Near Low" if range_position < 15 else "🟡 Middle"
                        ]
                    }
                    
                    if current_sma200 is not None:
                        price_data["Indicator"].append("vs 200-day SMA")
                        price_data["Value"].append(f"{'Above' if current_price > current_sma200 else 'Below'} by ${abs(current_price - current_sma200):.2f}")
                        price_data["Signal"].append("🟢 Bullish" if current_price > current_sma200 else "🔴 Bearish")
                    
                    st.dataframe(pd.DataFrame(price_data), use_container_width=True, hide_index=True)
                
                with col2:
                    st.markdown("**Volume & Momentum Analysis**")
                    volume_data = {
                        "Indicator": ["Volume vs 10-day Avg", "Volume vs 50-day Avg", "Volume Trend"],
                        "Value": [
                            f"{volume_ratio_10:.1f}x average",
                            f"{volume_ratio_50:.1f}x average", 
                            "Increasing" if volume_ratio_10 > volume_ratio_50 else "Decreasing"
                        ],
                        "Signal": [
                            "🟢 High" if volume_ratio_10 > 1.5 else "🟡 Normal" if volume_ratio_10 > 0.8 else "🔴 Low",
                            "🟢 High" if volume_ratio_50 > 1.2 else "🟡 Normal" if volume_ratio_50 > 0.8 else "🔴 Low",
                            "🟢 Positive" if volume_ratio_10 > volume_ratio_50 else "🔴 Negative"
                        ]
                    }
                    st.dataframe(pd.DataFrame(volume_data), use_container_width=True, hide_index=True)
                
                # Overall recommendation box
                st.markdown("---")
                st.markdown("**🎯 Overall Assessment**")
                
                # Simple scoring system for overall recommendation
                bullish_signals = 0
                total_signals = 0
                
                signals_to_check = [
                    (current_rsi < 70 and current_rsi > 30, "RSI in healthy range"),
                    (current_price > current_sma20, "Above 20-day moving average"),
                    (current_price > current_sma50, "Above 50-day moving average"), 
                    (volume_ratio_10 > 1.0, "Volume above average"),
                    (return_pct > 0, f"Positive {period_display.lower()} return")
                ]
                
                if current_sma200 is not None:
                    signals_to_check.append((current_price > current_sma200, "Above 200-day moving average"))
                
                positive_signals = []
                negative_signals = []
                
                for signal, description in signals_to_check:
                    total_signals += 1
                    if signal:
                        bullish_signals += 1
                        positive_signals.append(description)
                    else:
                        negative_signals.append(description)
                
                score_pct = (bullish_signals / total_signals) * 100 if total_signals > 0 else 0
                
                if score_pct >= 70:
                    st.success(f"🚀 **Bullish Outlook** ({score_pct:.0f}% positive signals)")
                elif score_pct >= 40:
                    st.warning(f"⚠️ **Neutral/Mixed** ({score_pct:.0f}% positive signals)")
                else:
                    st.error(f"📉 **Bearish Outlook** ({score_pct:.0f}% positive signals)")
                
                if show_advanced:
                    with st.expander("View Detailed Signal Breakdown"):
                        if positive_signals:
                            st.markdown("**🟢 Positive Signals:**")
                            for signal in positive_signals:
                                st.write(f"• {signal}")
                        
                        if negative_signals:
                            st.markdown("**🔴 Negative Signals:**")
                            for signal in negative_signals:
                                st.write(f"• {signal}")
                
        except Exception as e:
            st.error(f"⚠️ **Analysis Error:** Could not complete analysis for {symbol}")
            st.error(f"**Error details:** {str(e)}")
            st.info("🔧 **Troubleshooting Tips:**")
            st.write("• Check if the symbol is correct (e.g., AAPL, MSFT)")
            st.write("• Try a shorter time period if you selected 'Maximum'")
            st.write("• Some symbols may not have enough historical data")
            st.write("• Refresh the page and try again")

    # Enhanced Quick Examples with better organization
    st.sidebar.markdown("---")
    st.sidebar.markdown("**🔥 Popular Stocks**")
    
    example_cols = st.sidebar.columns(2)
    with example_cols[0]:
        if st.button("TSLA", help="Tesla Inc", use_container_width=True):
            st.session_state.symbol = "TSLA"
            st.rerun()
        if st.button("AAPL", help="Apple Inc", use_container_width=True):
            st.session_state.symbol = "AAPL"
            st.rerun()
    
    with example_cols[1]:
        if st.button("NVDA", help="NVIDIA Corp", use_container_width=True):
            st.session_state.symbol = "NVDA"
            st.rerun()
        if st.button("MSFT", help="Microsoft Corp", use_container_width=True):
            st.session_state.symbol = "MSFT"
            st.rerun()
    
    st.sidebar.markdown("**📊 Popular ETFs**")
    etf_cols = st.sidebar.columns(2)
    with etf_cols[0]:
        if st.button("SPY", help="S&P 500 ETF", use_container_width=True):
            st.session_state.symbol = "SPY"
            st.rerun()
    with etf_cols[1]:
        if st.button("QQQ", help="NASDAQ ETF", use_container_width=True):
            st.session_state.symbol = "QQQ"
            st.rerun()
    
    # Professional tips section
    st.sidebar.markdown("---")
    st.sidebar.markdown("**💡 Pro Tips**")
    with st.sidebar.expander("Strategy Guide", expanded=False):
        st.write("🚀 **Momentum Strategy:**")
        st.write("• Best in trending markets")
        st.write("• Look for volume confirmation")
        st.write("• Hold 5-15 days typically")
        
        st.write("🔄 **Mean Reversion:**")
        st.write("• Best when stock oversold")
        st.write("• Look for RSI below 40")
        st.write("• Hold 3-10 days typically")
    
    with st.sidebar.expander("Advanced Settings", expanded=False):
        st.write("⚙️ **Sensitivity Settings:**")
        st.write("• Lower = More signals")
        st.write("• Higher = Fewer, stronger signals")
        st.write("• Start with defaults")
        
        st.write("📅 **Time Periods:**")
        st.write("• Shorter = Recent trends")
        st.write("• Longer = Historical context")
        st.write("• 1-2 years recommended")

# Initialize session state for symbol if not exists
if 'symbol' in st.session_state:
    # Update the symbol input if it was changed via buttons
    pass

if __name__ == "__main__":
    st.write("Run this file with: `streamlit run trading_ui.py`")