import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import yfinance as yf
from stock_picker import MomentumStockPicker

st.set_page_config(page_title="Momentum Stock Picker", page_icon="🚀", layout="wide")

@st.cache_data(ttl=300)  # Cache for 5 minutes
def get_stock_picks():
    picker = MomentumStockPicker()
    return picker.get_daily_picks(top_n=10)

@st.cache_data(ttl=300)
def get_stock_chart(symbol, days=30):
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=f"{days}d")
        return data
    except:
        return None

def main():
    st.title("🚀 Daily Momentum Stock Picker")
    st.markdown("---")
    
    # Sidebar
    with st.sidebar:
        st.header("⚙️ Settings")
        num_picks = st.slider("Number of picks to show", 3, 10, 5)
        refresh_data = st.button("🔄 Refresh Data")
        
        st.markdown("---")
        st.markdown("### 📊 Scoring Legend")
        st.markdown("""
        **Momentum Score (0-100)**
        - Price momentum (5d, 10d, 20d)
        - Moving average alignment
        - Volume confirmation
        - RSI levels
        
        **Continuation Score (0-100)**
        - Trend consistency
        - Volume support
        - Technical breakouts
        - Not overbought
        """)
    
    # Main content
    if refresh_data or 'picks_data' not in st.session_state:
        with st.spinner("Analyzing stocks..."):
            st.session_state.picks_data = get_stock_picks()
    
    picks = st.session_state.picks_data.head(num_picks)
    
    # Display current time
    st.info(f"📅 Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Top picks cards
    st.header("🏆 Top Momentum Picks")
    
    # Create columns for top 3 picks
    if len(picks) >= 3:
        col1, col2, col3 = st.columns(3)
        
        for idx, (col, (_, pick)) in enumerate(zip([col1, col2, col3], picks.head(3).iterrows())):
            with col:
                # Determine color based on performance
                color = "green" if pick['price_change_5d'] > 0 else "red"
                
                st.markdown(f"""
                <div style="
                    border: 2px solid {color};
                    border-radius: 10px;
                    padding: 15px;
                    margin: 10px 0;
                    background-color: rgba({'0,255,0' if color=='green' else '255,0,0'}, 0.1);
                ">
                    <h3 style="text-align: center; margin: 0;">#{idx+1} {pick['symbol']}</h3>
                    <hr>
                    <p><strong>💰 Price:</strong> ${pick['current_price']:.2f}</p>
                    <p><strong>📈 5d Change:</strong> {pick['price_change_5d']:.1f}%</p>
                    <p><strong>🔥 Momentum:</strong> {pick['momentum_score']:.0f}/100</p>
                    <p><strong>⏳ Continuation:</strong> {pick['continuation_score']:.0f}/100</p>
                    <p><strong>📊 Combined:</strong> {pick['combined_score']:.1f}</p>
                </div>
                """, unsafe_allow_html=True)
    
    # Detailed table
    st.header("📋 Detailed Analysis")
    
    # Format the dataframe for display
    display_df = picks.copy()
    display_df['current_price'] = display_df['current_price'].apply(lambda x: f"${x:.2f}")
    display_df['price_change_5d'] = display_df['price_change_5d'].apply(lambda x: f"{x:.1f}%")
    display_df['volume_ratio'] = display_df['volume_ratio'].apply(lambda x: f"{x:.1f}x")
    display_df['rsi'] = display_df['rsi'].apply(lambda x: f"{x:.1f}")
    display_df['above_ma20'] = display_df['above_ma20'].apply(lambda x: "✅" if x else "❌")
    
    # Rename columns for display
    display_df = display_df.rename(columns={
        'symbol': 'Symbol',
        'current_price': 'Price',
        'momentum_score': 'Momentum',
        'continuation_score': 'Continuation',
        'combined_score': 'Combined',
        'price_change_5d': '5d Change',
        'volume_ratio': 'Volume',
        'rsi': 'RSI',
        'above_ma20': 'Above MA20'
    })
    
    st.dataframe(
        display_df[['Symbol', 'Price', '5d Change', 'Momentum', 'Continuation', 'Combined', 'RSI', 'Volume', 'Above MA20']],
        use_container_width=True
    )
    
    # Charts section
    st.header("📈 Stock Charts")
    
    # Select stock for detailed chart
    selected_stock = st.selectbox("Select stock for detailed chart:", picks['symbol'].tolist())
    
    if selected_stock:
        chart_data = get_stock_chart(selected_stock, 30)
        
        if chart_data is not None:
            col1, col2 = st.columns(2)
            
            with col1:
                # Price chart
                fig_price = go.Figure()
                
                fig_price.add_trace(go.Candlestick(
                    x=chart_data.index,
                    open=chart_data['Open'],
                    high=chart_data['High'],
                    low=chart_data['Low'],
                    close=chart_data['Close'],
                    name=selected_stock
                ))
                
                # Add moving averages
                ma5 = chart_data['Close'].rolling(5).mean()
                ma20 = chart_data['Close'].rolling(20).mean()
                
                fig_price.add_trace(go.Scatter(x=chart_data.index, y=ma5, name='MA5', line=dict(color='orange', width=1)))
                fig_price.add_trace(go.Scatter(x=chart_data.index, y=ma20, name='MA20', line=dict(color='red', width=1)))
                
                fig_price.update_layout(
                    title=f"{selected_stock} - Price Chart (30 days)",
                    xaxis_title="Date",
                    yaxis_title="Price ($)",
                    height=400
                )
                
                st.plotly_chart(fig_price, use_container_width=True)
            
            with col2:
                # Volume chart
                fig_volume = go.Figure()
                
                fig_volume.add_trace(go.Bar(
                    x=chart_data.index,
                    y=chart_data['Volume'],
                    name='Volume',
                    marker_color='lightblue'
                ))
                
                fig_volume.update_layout(
                    title=f"{selected_stock} - Volume",
                    xaxis_title="Date",
                    yaxis_title="Volume",
                    height=400
                )
                
                st.plotly_chart(fig_volume, use_container_width=True)
    
    # Performance tracking
    st.header("📊 Historical Performance")
    
    # Score distribution
    fig_scores = go.Figure()
    
    fig_scores.add_trace(go.Scatter(
        x=picks['momentum_score'],
        y=picks['continuation_score'],
        mode='markers+text',
        text=picks['symbol'],
        textposition="top center",
        marker=dict(
            size=picks['combined_score'] / 2,
            color=picks['price_change_5d'],
            colorscale='RdYlGn',
            showscale=True,
            colorbar=dict(title="5d Price Change (%)")
        ),
        name="Stocks"
    ))
    
    fig_scores.update_layout(
        title="Momentum vs Continuation Scores",
        xaxis_title="Momentum Score",
        yaxis_title="Continuation Score",
        height=500
    )
    
    st.plotly_chart(fig_scores, use_container_width=True)
    
    # Download section
    st.header("💾 Export Data")
    
    csv = picks.to_csv(index=False)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M')
    
    st.download_button(
        label="📁 Download picks as CSV",
        data=csv,
        file_name=f"momentum_picks_{timestamp}.csv",
        mime="text/csv"
    )
    
    # Footer
    st.markdown("---")
    st.markdown("""
    **⚠️ Disclaimer:** This tool is for educational and research purposes only. 
    Stock trading involves risk and you should always do your own research before making investment decisions.
    Past performance does not guarantee future results.
    """)

if __name__ == "__main__":
    main()