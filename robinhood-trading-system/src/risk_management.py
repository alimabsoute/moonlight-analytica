import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import json
import logging
from pathlib import Path
import sqlite3

logger = logging.getLogger(__name__)

@dataclass
class Position:
    """Represents a trading position"""
    symbol: str
    entry_date: datetime
    entry_price: float
    quantity: int
    position_type: str  # 'long' or 'short'
    stop_loss: float
    target: float
    strategy: str
    max_favorable_excursion: float = 0.0
    max_adverse_excursion: float = 0.0
    current_price: float = 0.0
    unrealized_pnl: float = 0.0
    
    def update_price(self, current_price: float):
        """Update position with current price and calculate MFE/MAE"""
        self.current_price = current_price
        
        if self.position_type == 'long':
            self.unrealized_pnl = (current_price - self.entry_price) * self.quantity
            favorable_move = current_price - self.entry_price
            adverse_move = self.entry_price - current_price
        else:  # short
            self.unrealized_pnl = (self.entry_price - current_price) * self.quantity
            favorable_move = self.entry_price - current_price
            adverse_move = current_price - self.entry_price
        
        # Update MFE/MAE
        if favorable_move > self.max_favorable_excursion:
            self.max_favorable_excursion = favorable_move
        if adverse_move > self.max_adverse_excursion:
            self.max_adverse_excursion = adverse_move
    
    def should_exit(self) -> Tuple[bool, str]:
        """Check if position should be exited"""
        if self.position_type == 'long':
            if self.current_price <= self.stop_loss:
                return True, 'stop_loss'
            elif self.current_price >= self.target:
                return True, 'target_reached'
        else:  # short
            if self.current_price >= self.stop_loss:
                return True, 'stop_loss'
            elif self.current_price <= self.target:
                return True, 'target_reached'
        
        # Time-based exit (30 days max)
        if (datetime.now() - self.entry_date).days >= 30:
            return True, 'time_limit'
        
        return False, ''

@dataclass
class RiskMetrics:
    """Risk metrics for portfolio"""
    total_exposure: float
    cash_available: float
    portfolio_value: float
    unrealized_pnl: float
    daily_pnl: float
    max_drawdown: float
    var_95: float  # Value at Risk 95%
    position_concentration: Dict[str, float]  # Symbol -> % of portfolio
    sector_concentration: Dict[str, float]    # Sector -> % of portfolio
    leverage_ratio: float
    margin_used: float

class RiskManager:
    """
    Advanced risk management system with PDT compliance,
    position sizing, portfolio risk monitoring, and dynamic stops
    """
    
    def __init__(self, config_path: str = 'config/settings.yaml', 
                 db_path: str = 'data/market_data.db'):
        
        # Load configuration
        self.config = self._load_config(config_path)
        
        # Account settings
        self.account_balance = self.config.get('account', {}).get('initial_balance', 10000)
        self.monthly_budget = self.config.get('account', {}).get('monthly_budget', 1000)
        self.max_position_pct = self.config.get('account', {}).get('max_position_size_pct', 10)
        self.reserve_cash_pct = self.config.get('account', {}).get('reserve_cash_pct', 20)
        
        # Risk parameters
        self.max_portfolio_risk = self.config.get('risk', {}).get('max_portfolio_risk_pct', 6)
        self.max_position_risk = self.config.get('risk', {}).get('max_position_risk_pct', 2)
        self.max_daily_loss = self.config.get('risk', {}).get('max_daily_loss', 100)
        self.max_consecutive_losses = self.config.get('risk', {}).get('max_consecutive_losses', 3)
        self.correlation_limit = self.config.get('risk', {}).get('max_correlation', 0.7)
        
        # PDT settings
        self.pdt_limit = 3  # Pattern Day Trader limit
        self.account_minimum = 25000  # PDT minimum account size
        
        # Current state
        self.positions: Dict[str, Position] = {}
        self.cash_available = self.account_balance
        self.daily_pnl = 0.0
        self.realized_pnl = 0.0
        
        # Day trading tracking
        self.day_trades = []  # List of day trade dates
        self.consecutive_losses = 0
        self.trading_suspended = False
        self.suspension_reason = ""
        
        # Performance tracking
        self.equity_curve = []
        self.monthly_returns = {}
        self.risk_metrics_history = []
        
        # Database connection
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self._create_risk_tables()
        
        # Sector mappings for concentration risk
        self.sector_mappings = self._load_sector_mappings()
        
        logger.info("RiskManager initialized successfully")
    
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from file or use defaults"""
        try:
            import yaml
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.warning(f"Could not load config from {config_path}: {e}")
            # Return default configuration
            return {
                'account': {
                    'initial_balance': 10000,
                    'monthly_budget': 1000,
                    'max_position_size_pct': 10,
                    'reserve_cash_pct': 20
                },
                'risk': {
                    'max_portfolio_risk_pct': 6,
                    'max_position_risk_pct': 2,
                    'max_daily_loss': 100,
                    'max_consecutive_losses': 3,
                    'max_correlation': 0.7
                }
            }
    
    def _create_risk_tables(self):
        """Create risk management tables"""
        cursor = self.conn.cursor()
        
        # Risk metrics history
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS risk_metrics (
                date DATE PRIMARY KEY,
                portfolio_value REAL,
                cash_available REAL,
                total_exposure REAL,
                unrealized_pnl REAL,
                daily_pnl REAL,
                max_drawdown REAL,
                var_95 REAL,
                num_positions INTEGER,
                largest_position_pct REAL
            )
        ''')
        
        # PDT tracking
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS day_trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE,
                symbol TEXT,
                entry_time TIMESTAMP,
                exit_time TIMESTAMP,
                pnl REAL
            )
        ''')
        
        self.conn.commit()
    
    def _load_sector_mappings(self) -> Dict[str, str]:
        """Load sector mappings for concentration risk"""
        # Simplified sector mappings - in production, this would come from a data provider
        return {
            # Technology
            'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology', 
            'META': 'Technology', 'NVDA': 'Technology', 'ADBE': 'Technology',
            'CRM': 'Technology', 'ORCL': 'Technology', 'INTC': 'Technology',
            
            # Financial
            'JPM': 'Financial', 'BAC': 'Financial', 'WFC': 'Financial',
            'GS': 'Financial', 'MS': 'Financial', 'V': 'Financial', 'MA': 'Financial',
            
            # Healthcare  
            'JNJ': 'Healthcare', 'PFE': 'Healthcare', 'UNH': 'Healthcare',
            'ABBV': 'Healthcare', 'TMO': 'Healthcare', 'ABT': 'Healthcare',
            
            # Consumer
            'AMZN': 'Consumer', 'TSLA': 'Consumer', 'HD': 'Consumer',
            'WMT': 'Consumer', 'DIS': 'Consumer', 'NKE': 'Consumer',
            'MCD': 'Consumer', 'SBUX': 'Consumer',
            
            # Energy
            'XOM': 'Energy', 'CVX': 'Energy', 'SLB': 'Energy',
            
            # Utilities
            'NEE': 'Utilities', 'DUK': 'Utilities', 'SO': 'Utilities'
        }
    
    def calculate_position_size(self, signal_strength: float, entry_price: float, 
                              stop_loss: float, account_balance: float = None,
                              symbol: str = None) -> Tuple[float, int, Dict]:
        """
        Calculate optimal position size using multiple risk factors
        
        Returns:
            - Position size in dollars
            - Number of shares
            - Risk analysis dict
        """
        if account_balance is None:
            account_balance = self.get_current_portfolio_value()
        
        risk_analysis = {
            'signal_strength': signal_strength,
            'entry_price': entry_price,
            'stop_loss': stop_loss,
            'risk_per_share': abs(entry_price - stop_loss),
            'constraints': []
        }
        
        # Check if trading is suspended
        if self.trading_suspended:
            risk_analysis['constraints'].append(f"Trading suspended: {self.suspension_reason}")
            return 0, 0, risk_analysis
        
        # Risk per share
        risk_per_share = abs(entry_price - stop_loss)
        if risk_per_share <= 0:
            risk_analysis['constraints'].append("Invalid stop loss - no risk defined")
            return 0, 0, risk_analysis
        
        # 1. Position risk constraint (max 2% of portfolio per position)
        max_risk_amount = account_balance * (self.max_position_risk / 100)
        max_shares_by_risk = int(max_risk_amount / risk_per_share)
        position_size_by_risk = max_shares_by_risk * entry_price
        
        # 2. Position size constraint (max 10% of portfolio)
        max_position_value = account_balance * (self.max_position_pct / 100)
        max_shares_by_size = int(max_position_value / entry_price)
        position_size_by_size = max_shares_by_size * entry_price
        
        # 3. Signal strength adjustment
        base_signal = 60  # Minimum signal strength
        max_signal = 100
        if signal_strength < base_signal:
            risk_analysis['constraints'].append(f"Signal strength too low: {signal_strength:.1f}%")
            return 0, 0, risk_analysis
        
        # Scale position based on signal strength
        strength_multiplier = (signal_strength - base_signal) / (max_signal - base_signal)
        strength_multiplier = max(0.5, min(1.5, 0.5 + strength_multiplier))  # 0.5x to 1.5x
        
        # 4. Cash availability constraint
        reserve_cash = account_balance * (self.reserve_cash_pct / 100)
        available_cash = self.cash_available - reserve_cash
        
        if available_cash <= 0:
            risk_analysis['constraints'].append("Insufficient cash available")
            return 0, 0, risk_analysis
        
        # 5. Concentration risk constraint
        concentration_multiplier = 1.0
        if symbol:
            current_concentration = self._calculate_symbol_concentration(symbol)
            if current_concentration > 0.15:  # Already >15% in this symbol
                concentration_multiplier = 0.5
                risk_analysis['constraints'].append(f"High concentration in {symbol}: {current_concentration:.1%}")
        
        # Take the most restrictive constraint
        shares_by_risk = max_shares_by_risk
        shares_by_size = max_shares_by_size
        shares_by_cash = int(available_cash / entry_price)
        
        final_shares = min(shares_by_risk, shares_by_size, shares_by_cash)
        
        # Apply signal strength and concentration adjustments
        final_shares = int(final_shares * strength_multiplier * concentration_multiplier)
        
        # Minimum position size check
        min_position_value = 100  # $100 minimum
        if final_shares * entry_price < min_position_value:
            risk_analysis['constraints'].append(f"Position too small: ${final_shares * entry_price:.2f}")
            return 0, 0, risk_analysis
        
        final_position_size = final_shares * entry_price
        
        # Update risk analysis
        risk_analysis.update({
            'max_shares_by_risk': shares_by_risk,
            'max_shares_by_size': shares_by_size,
            'max_shares_by_cash': shares_by_cash,
            'signal_multiplier': strength_multiplier,
            'concentration_multiplier': concentration_multiplier,
            'final_shares': final_shares,
            'final_position_size': final_position_size,
            'position_risk_pct': (final_shares * risk_per_share) / account_balance * 100,
            'position_size_pct': final_position_size / account_balance * 100
        })
        
        return final_position_size, final_shares, risk_analysis
    
    def _calculate_symbol_concentration(self, symbol: str) -> float:
        """Calculate current concentration in a symbol"""
        if symbol not in self.positions:
            return 0.0
        
        position_value = self.positions[symbol].quantity * self.positions[symbol].current_price
        portfolio_value = self.get_current_portfolio_value()
        
        return position_value / portfolio_value if portfolio_value > 0 else 0.0
    
    def check_pdt_compliance(self) -> Tuple[bool, int, str]:
        """
        Check Pattern Day Trading compliance
        
        Returns:
            - Can make day trades (bool)
            - Remaining day trades (int) 
            - Status message (str)
        """
        # Clean old day trades (5 business days)
        cutoff_date = datetime.now() - timedelta(days=7)  # Account for weekends
        self.day_trades = [dt for dt in self.day_trades if dt > cutoff_date]
        
        # Check account balance
        portfolio_value = self.get_current_portfolio_value()
        is_pdt_account = portfolio_value >= self.account_minimum
        
        if is_pdt_account:
            # PDT accounts can make unlimited day trades
            return True, 999, f"PDT Account (${portfolio_value:,.0f} >= ${self.account_minimum:,})"
        
        # Non-PDT account - limited to 3 day trades per 5 days
        remaining_trades = max(0, self.pdt_limit - len(self.day_trades))
        can_day_trade = remaining_trades > 0
        
        status = f"Non-PDT Account: {remaining_trades} day trades remaining"
        if not can_day_trade:
            status += " - No day trades available until " + \
                     (min(self.day_trades) + timedelta(days=7)).strftime('%Y-%m-%d')
        
        return can_day_trade, remaining_trades, status
    
    def add_position(self, symbol: str, entry_price: float, quantity: int,
                     position_type: str, stop_loss: float, target: float,
                     strategy: str) -> bool:
        """
        Add a new position with risk validation
        
        Returns:
            True if position added successfully
        """
        # Validate position parameters
        if quantity <= 0 or entry_price <= 0:
            logger.error(f"Invalid position parameters for {symbol}")
            return False
        
        # Check if we already have a position in this symbol
        if symbol in self.positions:
            logger.warning(f"Already have position in {symbol}")
            return False
        
        # Calculate position cost
        position_cost = quantity * entry_price
        
        # Check cash availability
        if position_cost > self.cash_available:
            logger.error(f"Insufficient cash for {symbol} position: ${position_cost:.2f}")
            return False
        
        # Create position
        position = Position(
            symbol=symbol,
            entry_date=datetime.now(),
            entry_price=entry_price,
            quantity=quantity,
            position_type=position_type,
            stop_loss=stop_loss,
            target=target,
            strategy=strategy,
            current_price=entry_price
        )
        
        # Add to positions
        self.positions[symbol] = position
        self.cash_available -= position_cost
        
        logger.info(f"Added {position_type} position: {quantity} shares of {symbol} @ ${entry_price:.2f}")
        
        # Log to database
        self._log_position_change('OPEN', position)
        
        return True
    
    def update_positions(self, market_data: Dict[str, Dict]):
        """Update all positions with current market prices"""
        for symbol, position in self.positions.items():
            if symbol in market_data and market_data[symbol]:
                current_price = market_data[symbol].get('price', position.current_price)
                position.update_price(current_price)
    
    def close_position(self, symbol: str, exit_price: float, 
                       exit_reason: str = 'manual') -> Tuple[bool, float]:
        """
        Close a position and calculate P&L
        
        Returns:
            - Success (bool)
            - Realized P&L (float)
        """
        if symbol not in self.positions:
            logger.error(f"No position found for {symbol}")
            return False, 0.0
        
        position = self.positions[symbol]
        
        # Calculate P&L
        if position.position_type == 'long':
            pnl = (exit_price - position.entry_price) * position.quantity
        else:  # short
            pnl = (position.entry_price - exit_price) * position.quantity
        
        # Add proceeds back to cash
        proceeds = position.quantity * exit_price
        self.cash_available += proceeds
        
        # Update daily P&L
        self.daily_pnl += pnl
        self.realized_pnl += pnl
        
        # Check for day trade
        entry_date = position.entry_date.date()
        exit_date = datetime.now().date()
        if entry_date == exit_date:
            self.day_trades.append(datetime.now())
            logger.info(f"Day trade recorded for {symbol}")
            
            # Log day trade to database
            self._log_day_trade(symbol, position.entry_date, datetime.now(), pnl)
        
        # Update consecutive losses counter
        if pnl < 0:
            self.consecutive_losses += 1
        else:
            self.consecutive_losses = 0
        
        # Check if we should suspend trading
        self._check_trading_suspension()
        
        # Log position close
        self._log_position_change('CLOSE', position, exit_price, pnl, exit_reason)
        
        # Remove position
        del self.positions[symbol]
        
        logger.info(f"Closed {position.position_type} position: {symbol} @ ${exit_price:.2f}, P&L: ${pnl:.2f}")
        
        return True, pnl
    
    def get_positions_to_exit(self) -> List[Tuple[str, str]]:
        """Get list of positions that should be exited"""
        positions_to_exit = []
        
        for symbol, position in self.positions.items():
            should_exit, reason = position.should_exit()
            if should_exit:
                positions_to_exit.append((symbol, reason))
        
        return positions_to_exit
    
    def calculate_portfolio_risk(self) -> RiskMetrics:
        """Calculate comprehensive portfolio risk metrics"""
        
        # Current portfolio values
        portfolio_value = self.get_current_portfolio_value()
        total_exposure = sum(pos.quantity * pos.current_price for pos in self.positions.values())
        unrealized_pnl = sum(pos.unrealized_pnl for pos in self.positions.values())
        
        # Position concentration
        position_concentration = {}
        for symbol, position in self.positions.items():
            position_value = position.quantity * position.current_price
            position_concentration[symbol] = position_value / portfolio_value if portfolio_value > 0 else 0
        
        # Sector concentration
        sector_concentration = {}
        for symbol, position in self.positions.items():
            sector = self.sector_mappings.get(symbol, 'Other')
            position_value = position.quantity * position.current_price
            position_pct = position_value / portfolio_value if portfolio_value > 0 else 0
            
            if sector in sector_concentration:
                sector_concentration[sector] += position_pct
            else:
                sector_concentration[sector] = position_pct
        
        # Calculate VaR (simplified - would use more sophisticated models in production)
        position_values = [pos.unrealized_pnl for pos in self.positions.values()]
        var_95 = np.percentile(position_values, 5) if position_values else 0
        
        # Calculate maximum drawdown from equity curve
        max_drawdown = self._calculate_max_drawdown()
        
        risk_metrics = RiskMetrics(
            total_exposure=total_exposure,
            cash_available=self.cash_available,
            portfolio_value=portfolio_value,
            unrealized_pnl=unrealized_pnl,
            daily_pnl=self.daily_pnl,
            max_drawdown=max_drawdown,
            var_95=var_95,
            position_concentration=position_concentration,
            sector_concentration=sector_concentration,
            leverage_ratio=total_exposure / portfolio_value if portfolio_value > 0 else 0,
            margin_used=0  # Assuming cash account
        )
        
        # Store metrics history
        self.risk_metrics_history.append({
            'timestamp': datetime.now(),
            'metrics': risk_metrics
        })
        
        return risk_metrics
    
    def _calculate_max_drawdown(self) -> float:
        """Calculate maximum drawdown from equity curve"""
        if len(self.equity_curve) < 2:
            return 0.0
        
        equity_values = [point['equity'] for point in self.equity_curve]
        peak = equity_values[0]
        max_dd = 0.0
        
        for equity in equity_values:
            if equity > peak:
                peak = equity
            drawdown = (peak - equity) / peak
            max_dd = max(max_dd, drawdown)
        
        return max_dd * 100  # Return as percentage
    
    def _check_trading_suspension(self):
        """Check if trading should be suspended due to risk limits"""
        
        # Check daily loss limit
        if self.daily_pnl <= -self.max_daily_loss:
            self.trading_suspended = True
            self.suspension_reason = f"Daily loss limit exceeded: ${self.daily_pnl:.2f}"
            return
        
        # Check consecutive losses
        if self.consecutive_losses >= self.max_consecutive_losses:
            self.trading_suspended = True
            self.suspension_reason = f"Too many consecutive losses: {self.consecutive_losses}"
            return
        
        # Check portfolio drawdown
        risk_metrics = self.calculate_portfolio_risk()
        if risk_metrics.max_drawdown > 20:  # 20% max drawdown
            self.trading_suspended = True
            self.suspension_reason = f"Portfolio drawdown too high: {risk_metrics.max_drawdown:.1f}%"
            return
        
        # Reset suspension if all checks pass
        if self.trading_suspended:
            self.trading_suspended = False
            self.suspension_reason = ""
            logger.info("Trading suspension lifted")
    
    def get_current_portfolio_value(self) -> float:
        """Calculate current total portfolio value"""
        positions_value = sum(pos.quantity * pos.current_price for pos in self.positions.values())
        return self.cash_available + positions_value
    
    def record_daily_equity(self):
        """Record daily equity for performance tracking"""
        equity_point = {
            'date': datetime.now().date(),
            'equity': self.get_current_portfolio_value(),
            'cash': self.cash_available,
            'positions_value': sum(pos.quantity * pos.current_price for pos in self.positions.values()),
            'unrealized_pnl': sum(pos.unrealized_pnl for pos in self.positions.values()),
            'realized_pnl': self.realized_pnl
        }
        
        self.equity_curve.append(equity_point)
        
        # Store to database
        cursor = self.conn.cursor()
        risk_metrics = self.calculate_portfolio_risk()
        cursor.execute('''
            INSERT OR REPLACE INTO risk_metrics 
            (date, portfolio_value, cash_available, total_exposure, unrealized_pnl, 
             daily_pnl, max_drawdown, var_95, num_positions, largest_position_pct)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            equity_point['date'],
            equity_point['equity'],
            self.cash_available,
            risk_metrics.total_exposure,
            risk_metrics.unrealized_pnl,
            self.daily_pnl,
            risk_metrics.max_drawdown,
            risk_metrics.var_95,
            len(self.positions),
            max(risk_metrics.position_concentration.values()) * 100 if risk_metrics.position_concentration else 0
        ))
        self.conn.commit()
    
    def _log_position_change(self, action: str, position: Position, 
                           exit_price: float = None, pnl: float = None, 
                           exit_reason: str = None):
        """Log position changes to database"""
        # This would integrate with your trades database table
        pass
    
    def _log_day_trade(self, symbol: str, entry_time: datetime, 
                      exit_time: datetime, pnl: float):
        """Log day trade to database"""
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT INTO day_trades (date, symbol, entry_time, exit_time, pnl)
            VALUES (?, ?, ?, ?, ?)
        ''', (entry_time.date(), symbol, entry_time, exit_time, pnl))
        self.conn.commit()
    
    def reset_daily_metrics(self):
        """Reset daily metrics (call at start of each trading day)"""
        self.daily_pnl = 0.0
        # Don't reset consecutive losses - they persist across days
    
    def generate_risk_report(self) -> Dict:
        """Generate comprehensive risk report"""
        risk_metrics = self.calculate_portfolio_risk()
        can_day_trade, remaining_trades, pdt_status = self.check_pdt_compliance()
        
        report = {
            'timestamp': datetime.now(),
            'account_summary': {
                'portfolio_value': risk_metrics.portfolio_value,
                'cash_available': self.cash_available,
                'realized_pnl': self.realized_pnl,
                'unrealized_pnl': risk_metrics.unrealized_pnl,
                'daily_pnl': self.daily_pnl
            },
            'risk_metrics': asdict(risk_metrics),
            'pdt_status': {
                'can_day_trade': can_day_trade,
                'remaining_trades': remaining_trades,
                'status': pdt_status
            },
            'risk_limits': {
                'trading_suspended': self.trading_suspended,
                'suspension_reason': self.suspension_reason,
                'consecutive_losses': self.consecutive_losses,
                'max_daily_loss': self.max_daily_loss,
                'current_daily_pnl': self.daily_pnl
            },
            'positions': {
                'count': len(self.positions),
                'symbols': list(self.positions.keys()),
                'largest_position': max(risk_metrics.position_concentration.items(), 
                                      key=lambda x: x[1]) if risk_metrics.position_concentration else None,
                'positions_to_exit': self.get_positions_to_exit()
            }
        }
        
        return report
    
    def close(self):
        """Close database connection"""
        if hasattr(self, 'conn'):
            self.conn.close()

# Testing function
def test_risk_manager():
    """Test risk manager functionality"""
    rm = RiskManager()
    
    print("Testing Risk Manager...")
    
    # Test position sizing
    print("\n1. Testing position sizing...")
    position_size, shares, analysis = rm.calculate_position_size(
        signal_strength=85.0,
        entry_price=150.0,
        stop_loss=145.0,
        symbol='AAPL'
    )
    print(f"Position size: ${position_size:.2f} ({shares} shares)")
    print(f"Risk analysis: {analysis['position_risk_pct']:.2f}% of portfolio")
    
    # Test PDT compliance
    print("\n2. Testing PDT compliance...")
    can_trade, remaining, status = rm.check_pdt_compliance()
    print(f"Can day trade: {can_trade}, Remaining: {remaining}")
    print(f"Status: {status}")
    
    # Test adding position
    print("\n3. Testing position management...")
    success = rm.add_position('AAPL', 150.0, shares, 'long', 145.0, 160.0, 'momentum')
    print(f"Position added: {success}")
    
    # Test risk metrics
    print("\n4. Testing risk metrics...")
    risk_metrics = rm.calculate_portfolio_risk()
    print(f"Portfolio value: ${risk_metrics.portfolio_value:.2f}")
    print(f"Total exposure: ${risk_metrics.total_exposure:.2f}")
    print(f"Position concentration: {risk_metrics.position_concentration}")
    
    # Test risk report
    print("\n5. Testing risk report...")
    report = rm.generate_risk_report()
    print(f"Account summary: ${report['account_summary']['portfolio_value']:.2f}")
    
    rm.close()
    print("\nRisk Manager test completed successfully!")

if __name__ == "__main__":
    test_risk_manager()