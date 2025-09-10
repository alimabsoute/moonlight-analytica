import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
import sqlite3
from dataclasses import dataclass, asdict
import json
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

@dataclass
class BacktestResult:
    """Container for backtest results"""
    strategy_name: str
    start_date: datetime
    end_date: datetime
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    total_return: float
    annual_return: float
    max_drawdown: float
    sharpe_ratio: float
    sortino_ratio: float
    calmar_ratio: float
    profit_factor: float
    avg_win: float
    avg_loss: float
    avg_trade: float
    max_consecutive_wins: int
    max_consecutive_losses: int
    volatility: float
    var_95: float
    trades: List[Dict]
    equity_curve: pd.DataFrame
    monthly_returns: pd.Series
    
    def to_dict(self):
        """Convert to dictionary for storage"""
        result = asdict(self)
        # Convert datetime objects to strings
        result['start_date'] = self.start_date.isoformat()
        result['end_date'] = self.end_date.isoformat()
        # Convert numpy types to Python types
        for key, value in result.items():
            if isinstance(value, np.float64):
                result[key] = float(value)
            elif isinstance(value, np.int64):
                result[key] = int(value)
        return result

@dataclass  
class Trade:
    """Individual trade record"""
    entry_date: datetime
    exit_date: datetime
    symbol: str
    strategy: str
    direction: str  # 'long' or 'short'
    entry_price: float
    exit_price: float
    quantity: int
    commission: float
    pnl: float
    pnl_pct: float
    duration_days: int
    max_favorable_excursion: float  # MFE
    max_adverse_excursion: float    # MAE
    exit_reason: str

class BacktestEngine:
    """
    Comprehensive backtesting engine for trading strategies
    """
    
    def __init__(self, initial_capital: float = 10000, 
                 commission_per_trade: float = 0.0,
                 position_sizing: str = 'fixed_percent',
                 position_size_pct: float = 0.1):
        
        self.initial_capital = initial_capital
        self.commission_per_trade = commission_per_trade
        self.position_sizing = position_sizing
        self.position_size_pct = position_size_pct
        
        # Backtest state
        self.current_capital = initial_capital
        self.positions = {}
        self.trades = []
        self.equity_curve = []
        self.trade_log = []
        
        # Risk management parameters
        self.max_position_risk = 0.02  # Max 2% risk per position
        self.max_total_risk = 0.06     # Max 6% total portfolio risk
        self.min_trade_size = 100      # Minimum trade size in dollars
        
    def run_backtest(self, signals: pd.DataFrame, price_data: Dict[str, pd.DataFrame],
                     start_date: str, end_date: str, strategy_name: str) -> BacktestResult:
        """
        Run comprehensive backtest on signal data
        
        Args:
            signals: DataFrame with columns [date, symbol, signal_type, strength, entry_price, stop_loss, target]
            price_data: Dict of {symbol: DataFrame} with OHLCV data
            start_date: Start date for backtest
            end_date: End date for backtest
            strategy_name: Name of the strategy being tested
        """
        
        # Initialize backtest
        self._reset_backtest()
        
        # Filter signals by date range
        signals = signals[(signals['date'] >= start_date) & (signals['date'] <= end_date)]
        
        # Get date range for equity curve
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        
        # Process each trading day
        for current_date in date_range:
            # Skip weekends
            if current_date.weekday() >= 5:
                continue
                
            # Process signals for this date
            daily_signals = signals[signals['date'] == current_date]
            
            # Enter new positions
            for _, signal in daily_signals.iterrows():
                self._process_signal(signal, price_data, current_date)
            
            # Update existing positions
            self._update_positions(price_data, current_date)
            
            # Record daily equity
            self._record_daily_equity(current_date)
        
        # Close any remaining positions
        self._close_all_positions(price_data, pd.to_datetime(end_date))
        
        # Calculate performance metrics
        return self._calculate_results(strategy_name, start_date, end_date)
    
    def _reset_backtest(self):
        """Reset backtest state"""
        self.current_capital = self.initial_capital
        self.positions = {}
        self.trades = []
        self.equity_curve = []
        self.trade_log = []
    
    def _process_signal(self, signal: pd.Series, price_data: Dict, current_date: datetime):
        """Process a trading signal"""
        symbol = signal['symbol']
        
        # Skip if we already have a position in this symbol
        if symbol in self.positions:
            return
        
        # Get price data for this symbol
        if symbol not in price_data:
            return
            
        symbol_data = price_data[symbol]
        
        # Get entry price (use next day's open to avoid lookahead bias)
        next_date = current_date + timedelta(days=1)
        entry_data = symbol_data[symbol_data.index >= next_date]
        
        if len(entry_data) == 0:
            return
            
        entry_price = entry_data.iloc[0]['Open']
        
        # Calculate position size
        position_size = self._calculate_position_size(
            signal['strength'], 
            entry_price, 
            signal.get('stop_loss', entry_price * 0.95)
        )
        
        if position_size < self.min_trade_size:
            return
        
        quantity = int(position_size / entry_price)
        if quantity == 0:
            return
        
        # Create position
        position = {
            'symbol': symbol,
            'entry_date': next_date,
            'entry_price': entry_price,
            'quantity': quantity,
            'direction': 'long',  # Assuming long positions for now
            'stop_loss': signal.get('stop_loss', entry_price * 0.95),
            'target': signal.get('target', entry_price * 1.10),
            'strategy': signal.get('strategy', 'unknown'),
            'max_favorable': 0,
            'max_adverse': 0,
            'initial_capital': self.current_capital
        }
        
        # Deduct capital
        cost = quantity * entry_price + self.commission_per_trade
        self.current_capital -= cost
        
        # Store position
        self.positions[symbol] = position
        
        # Log trade entry
        self.trade_log.append({
            'date': next_date,
            'symbol': symbol,
            'action': 'BUY',
            'quantity': quantity,
            'price': entry_price,
            'value': quantity * entry_price,
            'commission': self.commission_per_trade
        })
    
    def _update_positions(self, price_data: Dict, current_date: datetime):
        """Update existing positions and check for exits"""
        positions_to_close = []
        
        for symbol, position in self.positions.items():
            if symbol not in price_data:
                continue
                
            symbol_data = price_data[symbol]
            current_data = symbol_data[symbol_data.index <= current_date]
            
            if len(current_data) == 0:
                continue
                
            current_price = current_data.iloc[-1]['Close']
            high_price = current_data.iloc[-1]['High']
            low_price = current_data.iloc[-1]['Low']
            
            # Update MFE and MAE
            if position['direction'] == 'long':
                favorable_move = high_price - position['entry_price']
                adverse_move = position['entry_price'] - low_price
            else:
                favorable_move = position['entry_price'] - low_price
                adverse_move = high_price - position['entry_price']
            
            position['max_favorable'] = max(position['max_favorable'], favorable_move)
            position['max_adverse'] = max(position['max_adverse'], adverse_move)
            
            # Check exit conditions
            exit_reason = None
            
            if position['direction'] == 'long':
                if current_price <= position['stop_loss']:
                    exit_reason = 'stop_loss'
                elif current_price >= position['target']:
                    exit_reason = 'target'
            else:
                if current_price >= position['stop_loss']:
                    exit_reason = 'stop_loss'
                elif current_price <= position['target']:
                    exit_reason = 'target'
            
            # Check time-based exit (max 30 days)
            days_held = (current_date - position['entry_date']).days
            if days_held >= 30:
                exit_reason = 'time_limit'
            
            if exit_reason:
                positions_to_close.append((symbol, current_price, current_date, exit_reason))
        
        # Close positions
        for symbol, exit_price, exit_date, exit_reason in positions_to_close:
            self._close_position(symbol, exit_price, exit_date, exit_reason)
    
    def _close_position(self, symbol: str, exit_price: float, 
                       exit_date: datetime, exit_reason: str):
        """Close a position and record the trade"""
        if symbol not in self.positions:
            return
        
        position = self.positions[symbol]
        
        # Calculate P&L
        if position['direction'] == 'long':
            pnl = (exit_price - position['entry_price']) * position['quantity']
        else:
            pnl = (position['entry_price'] - exit_price) * position['quantity']
        
        pnl -= self.commission_per_trade  # Subtract exit commission
        pnl_pct = pnl / (position['entry_price'] * position['quantity']) * 100
        
        # Add proceeds back to capital
        proceeds = position['quantity'] * exit_price - self.commission_per_trade
        self.current_capital += proceeds
        
        # Create trade record
        trade = Trade(
            entry_date=position['entry_date'],
            exit_date=exit_date,
            symbol=symbol,
            strategy=position['strategy'],
            direction=position['direction'],
            entry_price=position['entry_price'],
            exit_price=exit_price,
            quantity=position['quantity'],
            commission=self.commission_per_trade * 2,  # Entry + exit
            pnl=pnl,
            pnl_pct=pnl_pct,
            duration_days=(exit_date - position['entry_date']).days,
            max_favorable_excursion=position['max_favorable'],
            max_adverse_excursion=position['max_adverse'],
            exit_reason=exit_reason
        )
        
        self.trades.append(trade)
        
        # Log trade exit
        self.trade_log.append({
            'date': exit_date,
            'symbol': symbol,
            'action': 'SELL',
            'quantity': position['quantity'],
            'price': exit_price,
            'value': position['quantity'] * exit_price,
            'pnl': pnl,
            'commission': self.commission_per_trade
        })
        
        # Remove position
        del self.positions[symbol]
    
    def _close_all_positions(self, price_data: Dict, end_date: datetime):
        """Close all remaining positions at end of backtest"""
        for symbol in list(self.positions.keys()):
            if symbol in price_data:
                symbol_data = price_data[symbol]
                end_data = symbol_data[symbol_data.index <= end_date]
                if len(end_data) > 0:
                    exit_price = end_data.iloc[-1]['Close']
                    self._close_position(symbol, exit_price, end_date, 'backtest_end')
    
    def _calculate_position_size(self, signal_strength: float, 
                               entry_price: float, stop_loss: float) -> float:
        """Calculate position size based on risk management rules"""
        
        # Calculate risk per share
        risk_per_share = abs(entry_price - stop_loss)
        
        if risk_per_share == 0:
            return self.min_trade_size
        
        # Calculate position size based on risk
        max_risk_amount = self.current_capital * self.max_position_risk
        max_shares_by_risk = int(max_risk_amount / risk_per_share)
        
        # Calculate position size based on signal strength
        base_position_pct = self.position_size_pct
        strength_multiplier = signal_strength / 100  # Assuming strength is 0-100
        adjusted_position_pct = base_position_pct * strength_multiplier
        
        position_size_by_pct = self.current_capital * adjusted_position_pct
        max_shares_by_pct = int(position_size_by_pct / entry_price)
        
        # Take the smaller of the two
        final_shares = min(max_shares_by_risk, max_shares_by_pct)
        final_position_size = final_shares * entry_price
        
        return max(final_position_size, self.min_trade_size)
    
    def _record_daily_equity(self, current_date: datetime):
        """Record daily portfolio equity"""
        # Calculate position values
        position_value = 0
        # Note: In a real implementation, you'd get current market values
        # For now, we'll use entry values
        for position in self.positions.values():
            position_value += position['quantity'] * position['entry_price']
        
        total_equity = self.current_capital + position_value
        
        self.equity_curve.append({
            'date': current_date,
            'equity': total_equity,
            'cash': self.current_capital,
            'positions_value': position_value
        })
    
    def _calculate_results(self, strategy_name: str, 
                         start_date: str, end_date: str) -> BacktestResult:
        """Calculate comprehensive backtest results"""
        
        if not self.trades:
            # Return empty results if no trades
            return BacktestResult(
                strategy_name=strategy_name,
                start_date=pd.to_datetime(start_date),
                end_date=pd.to_datetime(end_date),
                total_trades=0,
                winning_trades=0,
                losing_trades=0,
                win_rate=0,
                total_return=0,
                annual_return=0,
                max_drawdown=0,
                sharpe_ratio=0,
                sortino_ratio=0,
                calmar_ratio=0,
                profit_factor=0,
                avg_win=0,
                avg_loss=0,
                avg_trade=0,
                max_consecutive_wins=0,
                max_consecutive_losses=0,
                volatility=0,
                var_95=0,
                trades=[],
                equity_curve=pd.DataFrame(),
                monthly_returns=pd.Series()
            )
        
        # Basic trade statistics
        total_trades = len(self.trades)
        winning_trades = len([t for t in self.trades if t.pnl > 0])
        losing_trades = len([t for t in self.trades if t.pnl < 0])
        win_rate = winning_trades / total_trades * 100 if total_trades > 0 else 0
        
        # P&L calculations
        total_pnl = sum(t.pnl for t in self.trades)
        total_return = total_pnl / self.initial_capital * 100
        
        # Time calculations
        start_dt = pd.to_datetime(start_date)
        end_dt = pd.to_datetime(end_date)
        years = (end_dt - start_dt).days / 365.25
        annual_return = (1 + total_return/100) ** (1/years) - 1 if years > 0 else 0
        annual_return *= 100
        
        # Equity curve analysis
        equity_df = pd.DataFrame(self.equity_curve)
        if not equity_df.empty:
            equity_df['returns'] = equity_df['equity'].pct_change()
            equity_df['cumulative'] = equity_df['equity'] / self.initial_capital
            
            # Drawdown calculation
            equity_df['peak'] = equity_df['cumulative'].expanding().max()
            equity_df['drawdown'] = (equity_df['cumulative'] - equity_df['peak']) / equity_df['peak'] * 100
            max_drawdown = equity_df['drawdown'].min()
            
            # Risk metrics
            daily_returns = equity_df['returns'].dropna()
            if len(daily_returns) > 1:
                volatility = daily_returns.std() * np.sqrt(252) * 100  # Annualized
                
                # Sharpe ratio (assuming 0% risk-free rate)
                sharpe_ratio = (annual_return / 100) / (volatility / 100) if volatility > 0 else 0
                
                # Sortino ratio
                negative_returns = daily_returns[daily_returns < 0]
                downside_std = negative_returns.std() * np.sqrt(252)
                sortino_ratio = (annual_return / 100) / downside_std if downside_std > 0 else 0
                
                # VaR 95%
                var_95 = np.percentile(daily_returns, 5) * 100 if len(daily_returns) > 0 else 0
            else:
                volatility = 0
                sharpe_ratio = 0
                sortino_ratio = 0
                var_95 = 0
        else:
            max_drawdown = 0
            volatility = 0
            sharpe_ratio = 0
            sortino_ratio = 0
            var_95 = 0
        
        # Calmar ratio
        calmar_ratio = (annual_return / abs(max_drawdown)) if max_drawdown != 0 else 0
        
        # Win/Loss statistics
        winning_pnls = [t.pnl for t in self.trades if t.pnl > 0]
        losing_pnls = [t.pnl for t in self.trades if t.pnl < 0]
        
        avg_win = np.mean(winning_pnls) if winning_pnls else 0
        avg_loss = np.mean(losing_pnls) if losing_pnls else 0
        avg_trade = total_pnl / total_trades if total_trades > 0 else 0
        
        # Profit factor
        gross_profit = sum(winning_pnls) if winning_pnls else 0
        gross_loss = abs(sum(losing_pnls)) if losing_pnls else 0
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')
        
        # Consecutive wins/losses
        consecutive_wins = 0
        consecutive_losses = 0
        max_consecutive_wins = 0
        max_consecutive_losses = 0
        
        for trade in self.trades:
            if trade.pnl > 0:
                consecutive_wins += 1
                consecutive_losses = 0
                max_consecutive_wins = max(max_consecutive_wins, consecutive_wins)
            else:
                consecutive_losses += 1
                consecutive_wins = 0
                max_consecutive_losses = max(max_consecutive_losses, consecutive_losses)
        
        # Monthly returns
        if not equity_df.empty:
            equity_df['month'] = equity_df['date'].dt.to_period('M')
            monthly_returns = equity_df.groupby('month')['returns'].sum() * 100
        else:
            monthly_returns = pd.Series()
        
        # Convert trades to dictionaries
        trades_dict = [asdict(trade) for trade in self.trades]
        for trade_dict in trades_dict:
            trade_dict['entry_date'] = trade_dict['entry_date'].isoformat()
            trade_dict['exit_date'] = trade_dict['exit_date'].isoformat()
        
        return BacktestResult(
            strategy_name=strategy_name,
            start_date=start_dt,
            end_date=end_dt,
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            win_rate=win_rate,
            total_return=total_return,
            annual_return=annual_return,
            max_drawdown=max_drawdown,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            calmar_ratio=calmar_ratio,
            profit_factor=profit_factor,
            avg_win=avg_win,
            avg_loss=avg_loss,
            avg_trade=avg_trade,
            max_consecutive_wins=max_consecutive_wins,
            max_consecutive_losses=max_consecutive_losses,
            volatility=volatility,
            var_95=var_95,
            trades=trades_dict,
            equity_curve=equity_df,
            monthly_returns=monthly_returns
        )

class StrategyOptimizer:
    """
    Optimize strategy parameters using walk-forward analysis
    """
    
    def __init__(self, backtest_engine: BacktestEngine):
        self.backtest_engine = backtest_engine
        
    def walk_forward_optimization(self, signals_generator, price_data: Dict,
                                 parameter_ranges: Dict, optimization_metric: str = 'sharpe_ratio',
                                 in_sample_days: int = 252, out_sample_days: int = 63) -> Dict:
        """
        Perform walk-forward optimization
        
        Args:
            signals_generator: Function that generates signals given parameters
            price_data: Price data dictionary
            parameter_ranges: Dict of parameter names to list of values to test
            optimization_metric: Metric to optimize ('sharpe_ratio', 'total_return', etc.)
            in_sample_days: Days for optimization
            out_sample_days: Days for testing
        """
        
        results = []
        
        # Get parameter combinations
        import itertools
        param_names = list(parameter_ranges.keys())
        param_values = list(parameter_ranges.values())
        param_combinations = list(itertools.product(*param_values))
        
        print(f"Testing {len(param_combinations)} parameter combinations...")
        
        # Get date range
        all_dates = sorted(list(price_data.values())[0].index)
        
        # Walk forward through time
        current_start = 0
        walk_forward_results = []
        
        while current_start + in_sample_days + out_sample_days < len(all_dates):
            # Define periods
            in_sample_start = all_dates[current_start]
            in_sample_end = all_dates[current_start + in_sample_days]
            out_sample_start = all_dates[current_start + in_sample_days + 1]
            out_sample_end = all_dates[current_start + in_sample_days + out_sample_days]
            
            print(f"Optimizing: {in_sample_start.date()} to {in_sample_end.date()}")
            print(f"Testing: {out_sample_start.date()} to {out_sample_end.date()}")
            
            # Test all parameter combinations on in-sample data
            best_params = None
            best_score = -np.inf
            
            for params in param_combinations:
                param_dict = dict(zip(param_names, params))
                
                # Generate signals with these parameters
                signals = signals_generator(**param_dict)
                
                # Run backtest on in-sample period
                result = self.backtest_engine.run_backtest(
                    signals, price_data, 
                    in_sample_start.strftime('%Y-%m-%d'),
                    in_sample_end.strftime('%Y-%m-%d'),
                    f"Optimization_{param_dict}"
                )
                
                # Get optimization metric value
                score = getattr(result, optimization_metric)
                
                if score > best_score:
                    best_score = score
                    best_params = param_dict
            
            print(f"Best in-sample params: {best_params}, Score: {best_score:.3f}")
            
            # Test best parameters on out-of-sample data
            if best_params:
                signals = signals_generator(**best_params)
                out_sample_result = self.backtest_engine.run_backtest(
                    signals, price_data,
                    out_sample_start.strftime('%Y-%m-%d'),
                    out_sample_end.strftime('%Y-%m-%d'),
                    f"OutSample_{best_params}"
                )
                
                walk_forward_results.append({
                    'in_sample_start': in_sample_start,
                    'in_sample_end': in_sample_end,
                    'out_sample_start': out_sample_start,
                    'out_sample_end': out_sample_end,
                    'best_params': best_params,
                    'in_sample_score': best_score,
                    'out_sample_result': out_sample_result
                })
            
            # Move forward
            current_start += out_sample_days
        
        return {
            'walk_forward_results': walk_forward_results,
            'summary': self._summarize_walk_forward(walk_forward_results, optimization_metric)
        }
    
    def _summarize_walk_forward(self, results: List[Dict], metric: str) -> Dict:
        """Summarize walk-forward optimization results"""
        if not results:
            return {}
        
        in_sample_scores = [r['in_sample_score'] for r in results]
        out_sample_scores = [getattr(r['out_sample_result'], metric) for r in results]
        
        return {
            'num_periods': len(results),
            'avg_in_sample_score': np.mean(in_sample_scores),
            'avg_out_sample_score': np.mean(out_sample_scores),
            'out_sample_std': np.std(out_sample_scores),
            'out_sample_sharpe': np.mean(out_sample_scores) / np.std(out_sample_scores) if np.std(out_sample_scores) > 0 else 0,
            'correlation_in_out': np.corrcoef(in_sample_scores, out_sample_scores)[0,1],
            'best_period': max(results, key=lambda x: getattr(x['out_sample_result'], metric))
        }

class BacktestAnalyzer:
    """
    Analyze and visualize backtest results
    """
    
    @staticmethod
    def plot_equity_curve(result: BacktestResult, save_path: str = None):
        """Plot equity curve with drawdown"""
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8))
        
        if not result.equity_curve.empty:
            # Equity curve
            ax1.plot(result.equity_curve['date'], result.equity_curve['cumulative'])
            ax1.set_title(f'{result.strategy_name} - Equity Curve')
            ax1.set_ylabel('Portfolio Value (Normalized)')
            ax1.grid(True)
            
            # Drawdown
            ax2.fill_between(result.equity_curve['date'], result.equity_curve['drawdown'], 0, 
                           color='red', alpha=0.3)
            ax2.set_title('Drawdown (%)')
            ax2.set_xlabel('Date')
            ax2.set_ylabel('Drawdown %')
            ax2.grid(True)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path)
        else:
            plt.show()
    
    @staticmethod
    def plot_monthly_returns(result: BacktestResult, save_path: str = None):
        """Plot monthly returns heatmap"""
        if result.monthly_returns.empty:
            print("No monthly returns data available")
            return
        
        # Convert to DataFrame with year and month columns
        monthly_df = result.monthly_returns.to_frame('returns')
        monthly_df['year'] = monthly_df.index.year
        monthly_df['month'] = monthly_df.index.month
        
        # Pivot for heatmap
        heatmap_data = monthly_df.pivot(index='year', columns='month', values='returns')
        
        # Create heatmap
        plt.figure(figsize=(12, 8))
        sns.heatmap(heatmap_data, annot=True, fmt='.1f', cmap='RdYlGn', center=0)
        plt.title(f'{result.strategy_name} - Monthly Returns (%)')
        plt.xlabel('Month')
        plt.ylabel('Year')
        
        if save_path:
            plt.savefig(save_path)
        else:
            plt.show()
    
    @staticmethod
    def plot_trade_analysis(result: BacktestResult, save_path: str = None):
        """Plot trade analysis charts"""
        if not result.trades:
            print("No trades data available")
            return
        
        trades_df = pd.DataFrame(result.trades)
        
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
        
        # P&L distribution
        ax1.hist(trades_df['pnl'], bins=30, alpha=0.7, edgecolor='black')
        ax1.set_title('P&L Distribution')
        ax1.set_xlabel('P&L ($)')
        ax1.set_ylabel('Frequency')
        ax1.axvline(x=0, color='red', linestyle='--')
        
        # P&L by duration
        ax2.scatter(trades_df['duration_days'], trades_df['pnl'], alpha=0.6)
        ax2.set_title('P&L vs Trade Duration')
        ax2.set_xlabel('Duration (Days)')
        ax2.set_ylabel('P&L ($)')
        ax2.axhline(y=0, color='red', linestyle='--')
        
        # MAE vs MFE
        ax3.scatter(trades_df['max_adverse_excursion'], trades_df['max_favorable_excursion'], 
                   c=trades_df['pnl'], cmap='RdYlGn', alpha=0.6)
        ax3.set_title('MAE vs MFE')
        ax3.set_xlabel('Max Adverse Excursion ($)')
        ax3.set_ylabel('Max Favorable Excursion ($)')
        
        # Cumulative P&L
        trades_df['cumulative_pnl'] = trades_df['pnl'].cumsum()
        ax4.plot(range(len(trades_df)), trades_df['cumulative_pnl'])
        ax4.set_title('Cumulative P&L by Trade')
        ax4.set_xlabel('Trade Number')
        ax4.set_ylabel('Cumulative P&L ($)')
        ax4.grid(True)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path)
        else:
            plt.show()
    
    @staticmethod
    def generate_report(result: BacktestResult) -> str:
        """Generate comprehensive text report"""
        report = f"""
BACKTEST REPORT: {result.strategy_name}
{'=' * 60}

PERIOD: {result.start_date.date()} to {result.end_date.date()}

PERFORMANCE SUMMARY
-------------------
Total Return: {result.total_return:.2f}%
Annual Return: {result.annual_return:.2f}%
Max Drawdown: {result.max_drawdown:.2f}%
Volatility: {result.volatility:.2f}%

RISK METRICS
------------
Sharpe Ratio: {result.sharpe_ratio:.3f}
Sortino Ratio: {result.sortino_ratio:.3f}
Calmar Ratio: {result.calmar_ratio:.3f}
VaR 95%: {result.var_95:.2f}%

TRADING STATISTICS
------------------
Total Trades: {result.total_trades}
Winning Trades: {result.winning_trades}
Losing Trades: {result.losing_trades}
Win Rate: {result.win_rate:.1f}%

Average Win: ${result.avg_win:.2f}
Average Loss: ${result.avg_loss:.2f}
Average Trade: ${result.avg_trade:.2f}
Profit Factor: {result.profit_factor:.2f}

Max Consecutive Wins: {result.max_consecutive_wins}
Max Consecutive Losses: {result.max_consecutive_losses}

MONTHLY PERFORMANCE
------------------
"""
        if not result.monthly_returns.empty:
            report += f"Best Month: {result.monthly_returns.max():.2f}%\n"
            report += f"Worst Month: {result.monthly_returns.min():.2f}%\n"
            report += f"Average Month: {result.monthly_returns.mean():.2f}%\n"
            report += f"Monthly Volatility: {result.monthly_returns.std():.2f}%\n"
        
        return report

# Example usage and testing functions
def create_sample_signals() -> pd.DataFrame:
    """Create sample signals for testing"""
    dates = pd.date_range('2023-01-01', '2023-12-31', freq='D')
    symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']
    
    signals = []
    for date in dates[::5]:  # Every 5th day
        for symbol in np.random.choice(symbols, 2):  # Random 2 symbols
            if np.random.random() > 0.7:  # 30% chance of signal
                price = 100 + np.random.normal(0, 20)
                signals.append({
                    'date': date,
                    'symbol': symbol,
                    'signal_type': 'BUY',
                    'strength': np.random.uniform(60, 95),
                    'entry_price': price,
                    'stop_loss': price * 0.95,
                    'target': price * 1.10,
                    'strategy': 'momentum'
                })
    
    return pd.DataFrame(signals)

def create_sample_price_data() -> Dict[str, pd.DataFrame]:
    """Create sample price data for testing"""
    symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']
    dates = pd.date_range('2023-01-01', '2023-12-31', freq='D')
    
    price_data = {}
    
    for symbol in symbols:
        # Generate random walk price data
        initial_price = 100 + np.random.normal(0, 20)
        returns = np.random.normal(0.001, 0.02, len(dates))  # Daily returns
        prices = [initial_price]
        
        for ret in returns[1:]:
            prices.append(prices[-1] * (1 + ret))
        
        # Create OHLCV data
        df = pd.DataFrame(index=dates)
        df['Close'] = prices
        df['Open'] = df['Close'].shift(1) * (1 + np.random.normal(0, 0.001, len(df)))
        df['High'] = df[['Open', 'Close']].max(axis=1) * (1 + np.random.uniform(0, 0.02, len(df)))
        df['Low'] = df[['Open', 'Close']].min(axis=1) * (1 - np.random.uniform(0, 0.02, len(df)))
        df['Volume'] = np.random.randint(1000000, 10000000, len(df))
        
        df = df.fillna(method='forward').fillna(method='backward')
        price_data[symbol] = df
    
    return price_data

# Testing function
def run_sample_backtest():
    """Run a sample backtest to demonstrate the system"""
    print("Running sample backtest...")
    
    # Create sample data
    signals = create_sample_signals()
    price_data = create_sample_price_data()
    
    # Initialize backtest engine
    engine = BacktestEngine(
        initial_capital=10000,
        commission_per_trade=1.0,
        position_sizing='fixed_percent',
        position_size_pct=0.1
    )
    
    # Run backtest
    result = engine.run_backtest(
        signals=signals,
        price_data=price_data,
        start_date='2023-01-01',
        end_date='2023-12-31',
        strategy_name='Sample Momentum Strategy'
    )
    
    # Generate report
    print(BacktestAnalyzer.generate_report(result))
    
    # Create visualizations
    BacktestAnalyzer.plot_equity_curve(result)
    BacktestAnalyzer.plot_trade_analysis(result)
    
    return result

if __name__ == "__main__":
    # Run sample backtest
    sample_result = run_sample_backtest()