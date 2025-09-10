#!/usr/bin/env python3
"""
Robinhood Trading System Dashboard

Interactive Streamlit dashboard for monitoring trading signals, performance,
and system health. Provides real-time visualization of:
- Trading signals and opportunities
- Portfolio performance and risk metrics
- Strategy backtesting results
- System monitoring and alerts
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import sqlite3
import yaml
import asyncio
from typing import Dict, List, Optional

# Import our modules
from src.data_manager import DataManager
from src.risk_management import RiskManager
from src.alerts import AlertSystem
from scripts.daily_scan import DailyScanner
from scripts.intraday_monitor import IntradayMonitor
from scripts.weekend_prep import WeekendPrep

# Configure Streamlit page
st.set_page_config(
    page_title="Robinhood Trading System",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

class TradingDashboard:
    """Main dashboard application class"""
    
    def __init__(self):
        self.data_manager = None
        self.risk_manager = None
        self.alert_system = None
        self.init_components()
        
    def init_components(self):
        """Initialize dashboard components"""
        try:
            self.data_manager = DataManager()
            self.risk_manager = RiskManager()
            self.alert_system = AlertSystem()
            
            # Load configuration
            with open('config/settings.yaml', 'r') as f:
                self.config = yaml.safe_load(f)
                
        except Exception as e:
            st.error(f"Failed to initialize dashboard: {e}")
            self.data_manager = None
    
    def run(self):
        """Main dashboard application"""
        
        # Sidebar navigation
        st.sidebar.title("🚀 Trading System")
        page = st.sidebar.selectbox(
            "Navigate",
            ["📊 Overview", "🎯 Live Signals", "📈 Performance", "⚙️ System Status", "🧪 Backtesting", "⚠️ Risk Monitor"]
        )
        
        # Main content based on selected page
        if page == "📊 Overview":
            self.render_overview()
        elif page == "🎯 Live Signals":
            self.render_signals()
        elif page == "📈 Performance":
            self.render_performance()
        elif page == "⚙️ System Status":
            self.render_system_status()
        elif page == "🧪 Backtesting":
            self.render_backtesting()
        elif page == "⚠️ Risk Monitor":
            self.render_risk_monitor()
    
    def render_overview(self):
        """Render overview dashboard"""
        st.title("📊 Trading System Overview")
        
        if not self.data_manager:
            st.error("Dashboard not properly initialized")
            return
        
        # Key metrics row
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            portfolio_value = self.risk_manager.get_current_portfolio_value()
            st.metric("Portfolio Value", f"${portfolio_value:,.2f}")
        
        with col2:
            daily_pnl = self.get_daily_pnl()
            st.metric("Today's P&L", f"${daily_pnl:,.2f}", delta=f"{daily_pnl/portfolio_value*100:.2f}%")
        
        with col3:
            active_positions = len(self.get_active_positions())
            st.metric("Active Positions", active_positions)
        
        with col4:
            day_trades_used, day_trades_available = self.risk_manager.get_day_trade_count()
            st.metric("Day Trades Available", day_trades_available)
        
        # Charts row
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Portfolio Performance")
            self.render_portfolio_chart()
        
        with col2:
            st.subheader("Today's Signals")
            self.render_recent_signals()
        
        # Recent trades table
        st.subheader("Recent Activity")
        self.render_recent_trades()
        
        # Market overview
        st.subheader("Market Overview")
        self.render_market_overview()
    
    def render_signals(self):
        """Render live signals page"""
        st.title("🎯 Live Trading Signals")
        
        # Control panel
        col1, col2, col3 = st.columns(3)
        
        with col1:
            scan_mode = st.selectbox("Scan Mode", ["Live", "Test", "Preview"])
        
        with col2:
            strategy_filter = st.selectbox(
                "Strategy Filter", 
                ["All", "Momentum", "Mean Reversion", "Volatility Breakout"]
            )
        
        with col3:
            if st.button("🔄 Run Scan Now"):
                self.run_manual_scan(scan_mode.lower(), strategy_filter.lower())
        
        # Auto-refresh toggle
        auto_refresh = st.checkbox("Auto-refresh (30s)", value=True)
        if auto_refresh:
            st.rerun()
        
        # Current signals
        st.subheader("Current Signals")
        signals = self.get_current_signals()
        
        if signals:
            df = pd.DataFrame([{
                'Symbol': s.symbol,
                'Strategy': s.strategy.title(),
                'Strength': f"{s.signal_strength:.1f}%",
                'Entry': f"${s.entry_price:.2f}",
                'Target': f"${s.target_price:.2f}",
                'Stop': f"${s.stop_loss:.2f}",
                'R:R': f"{s.risk_reward_ratio:.1f}",
                'Notes': s.notes
            } for s in signals])
            
            st.dataframe(df, use_container_width=True)
            
            # Signal details
            if st.selectbox("View Signal Details", ["None"] + [s.symbol for s in signals]) != "None":
                selected_symbol = st.selectbox("View Signal Details", [s.symbol for s in signals])
                selected_signal = next(s for s in signals if s.symbol == selected_symbol)
                self.render_signal_details(selected_signal)
        else:
            st.info("No current signals. Market conditions may not be favorable.")
        
        # Signal history
        st.subheader("Signal History")
        self.render_signal_history()
    
    def render_performance(self):
        """Render performance analysis page"""
        st.title("📈 Performance Analysis")
        
        # Time period selector
        period = st.selectbox("Time Period", ["1D", "1W", "1M", "3M", "6M", "1Y", "All"])
        
        # Performance metrics
        col1, col2, col3, col4 = st.columns(4)
        
        metrics = self.calculate_performance_metrics(period)
        
        with col1:
            st.metric("Total Return", f"{metrics['total_return']:.2f}%")
        
        with col2:
            st.metric("Sharpe Ratio", f"{metrics['sharpe_ratio']:.2f}")
        
        with col3:
            st.metric("Win Rate", f"{metrics['win_rate']:.1f}%")
        
        with col4:
            st.metric("Max Drawdown", f"{metrics['max_drawdown']:.2f}%")
        
        # Performance charts
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Equity Curve")
            self.render_equity_curve(period)
        
        with col2:
            st.subheader("Monthly Returns")
            self.render_monthly_returns()
        
        # Strategy breakdown
        st.subheader("Strategy Performance")
        self.render_strategy_performance()
        
        # Trade analysis
        st.subheader("Trade Analysis")
        self.render_trade_analysis()
    
    def render_system_status(self):
        """Render system status page"""
        st.title("⚙️ System Status")
        
        # System health indicators
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            data_health = self.check_data_connection()
            st.metric("Data Connection", "✅ Active" if data_health else "❌ Failed")
        
        with col2:
            scanner_status = self.check_scanner_status()
            st.metric("Scanner Status", "🟢 Running" if scanner_status else "🔴 Stopped")
        
        with col3:
            alert_status = self.check_alert_system()
            st.metric("Alert System", "📢 Active" if alert_status else "🔇 Disabled")
        
        with col4:
            last_scan = self.get_last_scan_time()
            st.metric("Last Scan", last_scan)
        
        # Configuration display
        st.subheader("Configuration")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.write("**Account Settings**")
            st.write(f"Paper Trading: {'✅' if self.config.get('paper_trading', {}).get('enabled', True) else '❌'}")
            st.write(f"Live Trading: {'✅' if self.config.get('live_trading', {}).get('enabled', False) else '❌'}")
            st.write(f"Max Positions: {self.config.get('strategies', {}).get('momentum', {}).get('max_positions', 'N/A')}")
        
        with col2:
            st.write("**Risk Settings**")
            st.write(f"Max Daily Loss: ${self.config.get('risk', {}).get('max_daily_loss', 'N/A')}")
            st.write(f"Max Position Risk: {self.config.get('risk', {}).get('max_position_risk_pct', 'N/A')}%")
            st.write(f"PDT Account: {'✅' if self.risk_manager.account_balance >= 25000 else '❌'}")
        
        # Logs
        st.subheader("Recent Logs")
        self.render_recent_logs()
        
        # Manual controls
        st.subheader("Manual Controls")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("🔄 Restart Scanner"):
                st.success("Scanner restart initiated")
        
        with col2:
            if st.button("📧 Test Alerts"):
                self.test_alert_system()
        
        with col3:
            if st.button("💾 Backup Data"):
                self.backup_database()
    
    def render_backtesting(self):
        """Render backtesting page"""
        st.title("🧪 Backtesting Lab")
        
        # Backtesting parameters
        col1, col2, col3 = st.columns(3)
        
        with col1:
            strategy = st.selectbox("Strategy", ["Momentum", "Mean Reversion", "Combined"])
            start_date = st.date_input("Start Date", datetime.now() - timedelta(days=365))
        
        with col2:
            symbols = st.multiselect("Symbols", ["SPY", "QQQ", "AAPL", "MSFT", "GOOGL"], default=["SPY"])
            end_date = st.date_input("End Date", datetime.now())
        
        with col3:
            initial_capital = st.number_input("Initial Capital", value=10000, min_value=1000)
            
        if st.button("🚀 Run Backtest"):
            with st.spinner("Running backtest..."):
                results = self.run_backtest(strategy, symbols, start_date, end_date, initial_capital)
                self.display_backtest_results(results)
        
        # Historical backtests
        st.subheader("Saved Backtests")
        self.render_saved_backtests()
    
    def render_risk_monitor(self):
        """Render risk monitoring page"""
        st.title("⚠️ Risk Monitor")
        
        # Risk alerts
        risk_alerts = self.get_risk_alerts()
        
        if risk_alerts:
            st.error("🚨 Active Risk Alerts")
            for alert in risk_alerts:
                st.warning(f"**{alert['level']}**: {alert['message']}")
        else:
            st.success("✅ No active risk alerts")
        
        # Risk metrics
        col1, col2, col3, col4 = st.columns(4)
        
        risk_metrics = self.risk_manager.calculate_portfolio_risk()
        
        with col1:
            current_risk = risk_metrics.portfolio_risk_pct
            max_risk = self.config.get('risk', {}).get('max_portfolio_risk_pct', 6)
            st.metric("Portfolio Risk", f"{current_risk:.1f}%", delta=f"Max: {max_risk}%")
        
        with col2:
            daily_loss = self.get_daily_pnl()
            max_daily_loss = self.config.get('risk', {}).get('max_daily_loss', 100)
            st.metric("Daily Loss", f"${daily_loss:.2f}", delta=f"Limit: ${max_daily_loss}")
        
        with col3:
            correlation = risk_metrics.max_correlation
            max_correlation = self.config.get('risk', {}).get('max_correlation', 0.7)
            st.metric("Max Correlation", f"{correlation:.2f}", delta=f"Limit: {max_correlation}")
        
        with col4:
            concentration = risk_metrics.max_position_pct
            max_concentration = self.config.get('risk', {}).get('max_single_stock_pct', 15)
            st.metric("Max Position", f"{concentration:.1f}%", delta=f"Limit: {max_concentration}%")
        
        # Risk charts
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Risk Over Time")
            self.render_risk_chart()
        
        with col2:
            st.subheader("Position Sizes")
            self.render_position_sizes()
        
        # Risk settings
        st.subheader("Risk Settings")
        self.render_risk_settings()
    
    # Helper methods
    def get_daily_pnl(self) -> float:
        """Get today's P&L"""
        try:
            # This would query the database for today's trades
            return np.random.uniform(-50, 150)  # Placeholder
        except:
            return 0
    
    def get_active_positions(self) -> List[Dict]:
        """Get currently active positions"""
        try:
            # This would query the database for open positions
            return []  # Placeholder
        except:
            return []
    
    def get_current_signals(self) -> List:
        """Get current trading signals"""
        try:
            # This would run the daily scanner
            from scripts.daily_scan import DailyScanner
            scanner = DailyScanner()
            results = scanner.run_daily_scan(test_mode=True, preview_mode=True)
            return results.get('signals', [])
        except:
            return []
    
    def render_portfolio_chart(self):
        """Render portfolio performance chart"""
        # Generate sample data
        dates = pd.date_range(start='2024-01-01', end=datetime.now(), freq='D')
        values = np.cumsum(np.random.randn(len(dates)) * 0.02) + 10000
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=dates, y=values, mode='lines', name='Portfolio Value'))
        fig.update_layout(height=300, showlegend=False)
        st.plotly_chart(fig, use_container_width=True)
    
    def render_recent_signals(self):
        """Render recent signals summary"""
        signals = self.get_current_signals()
        
        if signals:
            fig = px.bar(
                x=[s.strategy for s in signals[:5]], 
                y=[s.signal_strength for s in signals[:5]],
                title="Signal Strength by Strategy"
            )
            fig.update_layout(height=300)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No recent signals")
    
    def render_recent_trades(self):
        """Render recent trades table"""
        # Placeholder data
        trades_data = {
            'Date': ['2024-01-10', '2024-01-09', '2024-01-08'],
            'Symbol': ['AAPL', 'MSFT', 'GOOGL'],
            'Action': ['BUY', 'SELL', 'BUY'],
            'Quantity': [10, 5, 8],
            'Price': [150.25, 380.50, 142.30],
            'P&L': ['+$45.20', '+$67.80', '-$23.10']
        }
        
        df = pd.DataFrame(trades_data)
        st.dataframe(df, use_container_width=True)
    
    def render_market_overview(self):
        """Render market overview"""
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("SPY", "$425.30", "+0.85%")
        
        with col2:
            st.metric("QQQ", "$365.20", "+1.24%")
        
        with col3:
            st.metric("VIX", "15.6", "-2.1%")
    
    def check_data_connection(self) -> bool:
        """Check if data connection is working"""
        try:
            test_data = self.data_manager.get_stock_data('SPY', period='5d')
            return not test_data.empty
        except:
            return False
    
    def check_scanner_status(self) -> bool:
        """Check scanner status"""
        return True  # Placeholder
    
    def check_alert_system(self) -> bool:
        """Check alert system status"""
        return True  # Placeholder
    
    def get_last_scan_time(self) -> str:
        """Get last scan execution time"""
        return "10:30 AM"  # Placeholder
    
    def calculate_performance_metrics(self, period: str) -> Dict:
        """Calculate performance metrics for given period"""
        return {
            'total_return': np.random.uniform(5, 25),
            'sharpe_ratio': np.random.uniform(1.2, 2.5),
            'win_rate': np.random.uniform(55, 75),
            'max_drawdown': np.random.uniform(5, 15)
        }
    
    def render_equity_curve(self, period: str):
        """Render equity curve chart"""
        # Generate sample data
        days = 30 if period == "1M" else 365
        dates = pd.date_range(start=datetime.now() - timedelta(days=days), end=datetime.now())
        returns = np.cumsum(np.random.randn(len(dates)) * 0.02) + 10000
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=dates, y=returns, mode='lines', name='Portfolio'))
        fig.update_layout(height=300)
        st.plotly_chart(fig, use_container_width=True)

def main():
    """Main application entry point"""
    dashboard = TradingDashboard()
    dashboard.run()

if __name__ == "__main__":
    main()