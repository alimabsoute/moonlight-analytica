#!/usr/bin/env python3
"""
Intraday Monitoring Script - Continuous position management during market hours

This script monitors active positions in real-time and executes position management rules:
- Stop loss monitoring and execution
- Profit taking at predetermined levels  
- Trailing stop adjustments
- Risk management alerts
- Position sizing adjustments
- PDT compliance monitoring

Usage:
    python scripts/intraday_monitor.py [--test] [--dry-run] [--positions POSITIONS]
    
Examples:
    python scripts/intraday_monitor.py                    # Full monitoring
    python scripts/intraday_monitor.py --test            # Test mode with demo positions
    python scripts/intraday_monitor.py --dry-run         # No actual trades, logging only
    python scripts/intraday_monitor.py --positions AAPL,MSFT  # Monitor specific positions
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import argparse
import logging
import asyncio
from datetime import datetime, time, timedelta
from typing import List, Dict, Optional, Tuple
import pandas as pd
import time as time_module
from dataclasses import dataclass

# Import our modules
from src.data_manager import DataManager
from src.risk_management import RiskManager, Position
from src.alerts import AlertSystem
import yaml

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/intraday_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class MonitoringAction:
    """Represents an action to take on a position"""
    symbol: str
    action_type: str  # 'stop_loss', 'take_profit', 'trailing_stop', 'reduce_position'
    trigger_price: float
    target_quantity: int
    reason: str
    urgency: str  # 'high', 'medium', 'low'
    estimated_pnl: float

class IntradayMonitor:
    """
    Real-time position monitoring and management system
    """
    
    def __init__(self, config_path: str = 'config/settings.yaml'):
        self.config_path = config_path
        self.config = self._load_config()
        
        # Initialize core components
        logger.info("Initializing Intraday Monitor...")
        self.data_manager = DataManager()
        self.risk_manager = RiskManager(config_path)
        self.alert_system = AlertSystem(config_path)
        
        # Monitoring state
        self.active_positions = {}
        self.pending_actions = []
        self.monitoring_active = False
        self.last_price_update = {}
        
        # Performance tracking
        self.session_stats = {
            'start_time': None,
            'positions_monitored': 0,
            'actions_executed': 0,
            'stop_losses_hit': 0,
            'profits_taken': 0,
            'alerts_sent': 0,
            'total_pnl': 0.0
        }
        
        # Market hours configuration
        self.market_hours = {
            'pre_market_start': time(4, 0),   # 4:00 AM ET
            'market_open': time(9, 30),       # 9:30 AM ET
            'market_close': time(16, 0),      # 4:00 PM ET
            'after_hours_end': time(20, 0)    # 8:00 PM ET
        }
        
    def _load_config(self) -> Dict:
        """Load configuration from YAML file"""
        try:
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return {}
    
    async def start_monitoring(self, test_mode: bool = False, dry_run: bool = False,
                             position_filter: Optional[List[str]] = None) -> None:
        """
        Start the intraday monitoring loop
        
        Args:
            test_mode: Use test positions instead of real ones
            dry_run: Log actions but don't execute trades
            position_filter: Only monitor specific symbols
        """
        
        logger.info("=" * 60)
        logger.info("STARTING INTRADAY POSITION MONITORING")
        logger.info("=" * 60)
        
        self.session_stats['start_time'] = datetime.now()
        self.monitoring_active = True
        
        try:
            # Pre-monitoring setup
            if not await self._pre_monitoring_checks():
                logger.error("Pre-monitoring checks failed - stopping")
                return
            
            # Load initial positions
            await self._load_active_positions(test_mode, position_filter)
            
            if not self.active_positions:
                logger.info("No active positions to monitor")
                return
            
            logger.info(f"Monitoring {len(self.active_positions)} positions...")
            
            # Main monitoring loop
            while self.monitoring_active and self._is_monitoring_hours():
                try:
                    # Update all position data
                    await self._update_position_data()
                    
                    # Check all monitoring rules
                    await self._check_monitoring_rules()
                    
                    # Execute any pending actions
                    await self._execute_pending_actions(dry_run)
                    
                    # Send periodic updates
                    await self._send_periodic_updates()
                    
                    # Brief pause before next iteration
                    await asyncio.sleep(self._get_update_interval())
                    
                except KeyboardInterrupt:
                    logger.info("Monitoring interrupted by user")
                    break
                except Exception as e:
                    logger.error(f"Error in monitoring loop: {e}")
                    await asyncio.sleep(5)  # Longer pause after errors
                    
        except Exception as e:
            logger.error(f"Critical error in monitoring: {e}", exc_info=True)
            
        finally:
            await self._cleanup_monitoring_session()
    
    async def _pre_monitoring_checks(self) -> bool:
        """Run pre-monitoring validation checks"""
        logger.info("Running pre-monitoring checks...")
        
        # Check market status
        if not self._is_monitoring_hours():
            current_time = datetime.now().time()
            logger.warning(f"Outside monitoring hours: {current_time}")
            
            if not self.config.get('development', {}).get('allow_after_hours', False):
                return False
        
        # Check PDT status
        can_trade, remaining_trades, pdt_status = self.risk_manager.check_pdt_compliance()
        logger.info(f"PDT Status: {pdt_status}, Remaining trades: {remaining_trades}")
        
        # Check daily loss limits
        if not self.risk_manager.check_daily_loss_limit():
            logger.error("Daily loss limit exceeded - monitoring disabled")
            return False
        
        # Test data connectivity
        try:
            test_data = self.data_manager.get_stock_data('SPY', period='1d')
            if test_data.empty:
                logger.error("Data connectivity test failed")
                return False
            logger.info("Data connectivity: OK")
        except Exception as e:
            logger.error(f"Data connectivity test failed: {e}")
            return False
        
        logger.info("✅ Pre-monitoring checks passed")
        return True
    
    async def _load_active_positions(self, test_mode: bool, position_filter: Optional[List[str]]):
        """Load active positions from database or create test positions"""
        
        if test_mode:
            # Create test positions for development
            test_positions = [
                Position(
                    symbol='AAPL',
                    shares=10,
                    entry_price=150.00,
                    current_price=152.00,
                    stop_loss=142.50,
                    target_price=165.00,
                    entry_time=datetime.now() - timedelta(hours=2),
                    strategy='momentum'
                ),
                Position(
                    symbol='MSFT',
                    shares=8,
                    entry_price=375.00,
                    current_price=378.50,
                    stop_loss=356.25,
                    target_price=412.50,
                    entry_time=datetime.now() - timedelta(hours=1),
                    strategy='breakout'
                )
            ]
            
            for position in test_positions:
                if not position_filter or position.symbol in position_filter:
                    self.active_positions[position.symbol] = position
                    
        else:
            # Load real positions from database
            positions = self.risk_manager.get_active_positions()
            
            for position in positions:
                if not position_filter or position.symbol in position_filter:
                    self.active_positions[position.symbol] = position
        
        self.session_stats['positions_monitored'] = len(self.active_positions)
        logger.info(f"Loaded {len(self.active_positions)} active positions")
    
    async def _update_position_data(self):
        """Update current prices and P&L for all positions"""
        if not self.active_positions:
            return
        
        symbols = list(self.active_positions.keys())
        
        try:
            # Get current prices for all symbols
            current_prices = self.data_manager.get_current_prices(symbols)
            
            for symbol, position in self.active_positions.items():
                if symbol in current_prices:
                    old_price = position.current_price
                    new_price = current_prices[symbol]
                    
                    # Update position with new price
                    position.current_price = new_price
                    position.unrealized_pnl = (new_price - position.entry_price) * position.shares
                    position.unrealized_pnl_pct = ((new_price - position.entry_price) / position.entry_price) * 100
                    
                    # Log significant price changes
                    if old_price and abs(new_price - old_price) / old_price > 0.02:  # 2% change
                        logger.info(f"{symbol}: ${old_price:.2f} → ${new_price:.2f} "
                                  f"({position.unrealized_pnl_pct:.1f}%)")
                    
                    self.last_price_update[symbol] = datetime.now()
                    
        except Exception as e:
            logger.error(f"Error updating position data: {e}")
    
    async def _check_monitoring_rules(self):
        """Check all monitoring rules and queue actions"""
        self.pending_actions = []  # Clear previous actions
        
        for symbol, position in self.active_positions.items():
            current_price = position.current_price
            
            if not current_price:
                continue
            
            # Check stop loss
            if self._should_trigger_stop_loss(position):
                action = MonitoringAction(
                    symbol=symbol,
                    action_type='stop_loss',
                    trigger_price=current_price,
                    target_quantity=position.shares,
                    reason=f'Stop loss triggered at ${current_price:.2f}',
                    urgency='high',
                    estimated_pnl=position.unrealized_pnl
                )
                self.pending_actions.append(action)
                continue
            
            # Check profit taking levels
            profit_action = self._check_profit_taking(position)
            if profit_action:
                self.pending_actions.append(profit_action)
            
            # Check trailing stop adjustments
            trailing_action = self._check_trailing_stop(position)
            if trailing_action:
                self.pending_actions.append(trailing_action)
            
            # Check position risk limits
            risk_action = self._check_risk_limits(position)
            if risk_action:
                self.pending_actions.append(risk_action)
        
        if self.pending_actions:
            logger.info(f"Queued {len(self.pending_actions)} actions for execution")
    
    def _should_trigger_stop_loss(self, position: Position) -> bool:
        """Check if stop loss should be triggered"""
        if not position.stop_loss or not position.current_price:
            return False
        
        # Long position: trigger if price falls below stop loss
        if position.shares > 0:
            return position.current_price <= position.stop_loss
        
        # Short position: trigger if price rises above stop loss  
        else:
            return position.current_price >= position.stop_loss
    
    def _check_profit_taking(self, position: Position) -> Optional[MonitoringAction]:
        """Check if any profit taking levels should be triggered"""
        if not position.current_price or not position.target_price:
            return None
        
        strategy_config = self.config.get('strategies', {}).get(position.strategy, {})
        profit_levels = strategy_config.get('profit_taking_levels', [])
        
        if not profit_levels:
            # Single target approach
            if position.shares > 0 and position.current_price >= position.target_price:
                return MonitoringAction(
                    symbol=position.symbol,
                    action_type='take_profit',
                    trigger_price=position.current_price,
                    target_quantity=position.shares,
                    reason=f'Price target reached: ${position.current_price:.2f}',
                    urgency='medium',
                    estimated_pnl=position.unrealized_pnl
                )
        else:
            # Multi-level profit taking
            unrealized_pct = position.unrealized_pnl_pct
            
            for level in profit_levels:
                if unrealized_pct >= level and not hasattr(position, f'profit_taken_{level}'):
                    # Take partial profits (typically 1/3 of position)
                    shares_to_sell = max(1, position.shares // 3)
                    
                    return MonitoringAction(
                        symbol=position.symbol,
                        action_type='take_profit',
                        trigger_price=position.current_price,
                        target_quantity=shares_to_sell,
                        reason=f'Partial profit at {level}% level',
                        urgency='low',
                        estimated_pnl=(position.current_price - position.entry_price) * shares_to_sell
                    )
        
        return None
    
    def _check_trailing_stop(self, position: Position) -> Optional[MonitoringAction]:
        """Check if trailing stop should be adjusted"""
        if not self.config.get('risk', {}).get('trailing_stop_enabled', False):
            return None
        
        trailing_pct = self.config.get('risk', {}).get('trailing_stop_pct', 3) / 100
        current_price = position.current_price
        
        if not current_price:
            return None
        
        # Calculate new trailing stop
        if position.shares > 0:  # Long position
            new_stop = current_price * (1 - trailing_pct)
            
            # Only raise the stop loss, never lower it
            if not position.stop_loss or new_stop > position.stop_loss:
                return MonitoringAction(
                    symbol=position.symbol,
                    action_type='trailing_stop',
                    trigger_price=new_stop,
                    target_quantity=0,  # No trade, just adjustment
                    reason=f'Trailing stop adjustment: ${new_stop:.2f}',
                    urgency='low',
                    estimated_pnl=0
                )
        
        return None
    
    def _check_risk_limits(self, position: Position) -> Optional[MonitoringAction]:
        """Check if position violates risk limits"""
        max_loss_pct = self.config.get('risk', {}).get('max_position_loss_pct', 10)
        
        if position.unrealized_pnl_pct <= -max_loss_pct:
            return MonitoringAction(
                symbol=position.symbol,
                action_type='risk_reduction',
                trigger_price=position.current_price,
                target_quantity=position.shares // 2,  # Reduce by half
                reason=f'Risk limit exceeded: {position.unrealized_pnl_pct:.1f}%',
                urgency='high',
                estimated_pnl=position.unrealized_pnl / 2
            )
        
        return None
    
    async def _execute_pending_actions(self, dry_run: bool):
        """Execute all pending monitoring actions"""
        if not self.pending_actions:
            return
        
        # Sort by urgency (high first)
        urgency_order = {'high': 0, 'medium': 1, 'low': 2}
        self.pending_actions.sort(key=lambda x: urgency_order.get(x.urgency, 3))
        
        executed_count = 0
        
        for action in self.pending_actions:
            try:
                if dry_run:
                    logger.info(f"[DRY RUN] Would execute: {action.symbol} {action.action_type} "
                              f"- {action.reason}")
                else:
                    success = await self._execute_single_action(action)
                    if success:
                        executed_count += 1
                        self.session_stats['actions_executed'] += 1
                        
                        # Update session stats
                        if action.action_type == 'stop_loss':
                            self.session_stats['stop_losses_hit'] += 1
                        elif action.action_type == 'take_profit':
                            self.session_stats['profits_taken'] += 1
                        
                        self.session_stats['total_pnl'] += action.estimated_pnl
                
                # Brief pause between actions
                await asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Error executing action for {action.symbol}: {e}")
        
        if executed_count > 0:
            logger.info(f"Successfully executed {executed_count} actions")
    
    async def _execute_single_action(self, action: MonitoringAction) -> bool:
        """Execute a single monitoring action"""
        
        logger.info(f"Executing {action.action_type} for {action.symbol}: {action.reason}")
        
        if action.action_type == 'stop_loss':
            # Close entire position
            success = self._simulate_order_execution(
                action.symbol, 'SELL', action.target_quantity, action.trigger_price
            )
            
            if success:
                # Remove position from monitoring
                if action.symbol in self.active_positions:
                    del self.active_positions[action.symbol]
                
                # Send stop loss alert
                await self.alert_system.send_position_alert(
                    'STOP_LOSS',
                    f'{action.symbol} stop loss executed at ${action.trigger_price:.2f}',
                    {
                        'symbol': action.symbol,
                        'price': action.trigger_price,
                        'pnl': action.estimated_pnl,
                        'shares': action.target_quantity
                    }
                )
        
        elif action.action_type == 'take_profit':
            # Sell specified quantity
            success = self._simulate_order_execution(
                action.symbol, 'SELL', action.target_quantity, action.trigger_price
            )
            
            if success:
                # Update position
                position = self.active_positions.get(action.symbol)
                if position:
                    position.shares -= action.target_quantity
                    
                    # Remove position if fully closed
                    if position.shares <= 0:
                        del self.active_positions[action.symbol]
                
                # Send profit alert
                await self.alert_system.send_position_alert(
                    'PROFIT_TAKEN',
                    f'{action.symbol} profit taken: ${action.estimated_pnl:.2f}',
                    {
                        'symbol': action.symbol,
                        'price': action.trigger_price,
                        'pnl': action.estimated_pnl,
                        'shares': action.target_quantity
                    }
                )
        
        elif action.action_type == 'trailing_stop':
            # Update stop loss price
            position = self.active_positions.get(action.symbol)
            if position:
                old_stop = position.stop_loss
                position.stop_loss = action.trigger_price
                
                logger.info(f"{action.symbol} trailing stop: ${old_stop:.2f} → ${action.trigger_price:.2f}")
                success = True
            else:
                success = False
        
        elif action.action_type == 'risk_reduction':
            # Reduce position size
            success = self._simulate_order_execution(
                action.symbol, 'SELL', action.target_quantity, action.trigger_price
            )
            
            if success:
                position = self.active_positions.get(action.symbol)
                if position:
                    position.shares -= action.target_quantity
                
                # Send risk alert
                await self.alert_system.send_risk_alert(
                    'POSITION_REDUCED',
                    f'{action.symbol} position reduced due to risk limits',
                    {
                        'symbol': action.symbol,
                        'shares_sold': action.target_quantity,
                        'current_loss_pct': position.unrealized_pnl_pct if position else 0
                    }
                )
        
        else:
            logger.warning(f"Unknown action type: {action.action_type}")
            success = False
        
        return success
    
    def _simulate_order_execution(self, symbol: str, side: str, quantity: int, price: float) -> bool:
        """
        Simulate order execution (replace with real broker integration)
        
        In paper trading mode, this logs the trade to database.
        In live trading mode, this would submit actual orders.
        """
        
        logger.info(f"[PAPER TRADE] {side} {quantity} shares of {symbol} at ${price:.2f}")
        
        # Log trade to database
        self.data_manager.log_trade(
            symbol=symbol,
            side=side,
            quantity=quantity,
            price=price,
            trade_type='POSITION_MANAGEMENT',
            notes=f'Automated {side.lower()} via intraday monitoring'
        )
        
        return True  # Always succeed in paper trading
    
    async def _send_periodic_updates(self):
        """Send periodic status updates"""
        now = datetime.now()
        
        # Send updates every 30 minutes during market hours
        if hasattr(self, '_last_update_time'):
            if (now - self._last_update_time).seconds < 1800:  # 30 minutes
                return
        
        self._last_update_time = now
        
        # Calculate current session P&L
        total_unrealized = sum(pos.unrealized_pnl for pos in self.active_positions.values())
        
        # Send status update
        await self.alert_system.send_status_alert(
            'MONITORING_UPDATE',
            f'Monitoring {len(self.active_positions)} positions - P&L: ${total_unrealized:.2f}',
            {
                'positions_count': len(self.active_positions),
                'total_unrealized_pnl': total_unrealized,
                'actions_executed': self.session_stats['actions_executed'],
                'uptime_hours': (now - self.session_stats['start_time']).seconds / 3600
            }
        )
    
    def _is_monitoring_hours(self) -> bool:
        """Check if we're in monitoring hours"""
        current_time = datetime.now().time()
        
        # Monitor from pre-market through after hours
        return (self.market_hours['pre_market_start'] <= current_time <= 
                self.market_hours['after_hours_end'])
    
    def _get_update_interval(self) -> int:
        """Get update interval based on market hours and volatility"""
        current_time = datetime.now().time()
        
        # More frequent updates during market hours
        if (self.market_hours['market_open'] <= current_time <= 
            self.market_hours['market_close']):
            return 30  # 30 seconds during market hours
        else:
            return 120  # 2 minutes during pre/after market
    
    async def _cleanup_monitoring_session(self):
        """Clean up monitoring session and log final statistics"""
        
        self.monitoring_active = False
        end_time = datetime.now()
        
        if self.session_stats['start_time']:
            duration = end_time - self.session_stats['start_time']
            self.session_stats['session_duration_hours'] = duration.total_seconds() / 3600
        
        # Final session summary
        logger.info("=" * 60)
        logger.info("INTRADAY MONITORING SESSION COMPLETE")
        logger.info("=" * 60)
        logger.info(f"Duration: {self.session_stats.get('session_duration_hours', 0):.1f} hours")
        logger.info(f"Positions Monitored: {self.session_stats['positions_monitored']}")
        logger.info(f"Actions Executed: {self.session_stats['actions_executed']}")
        logger.info(f"Stop Losses: {self.session_stats['stop_losses_hit']}")
        logger.info(f"Profits Taken: {self.session_stats['profits_taken']}")
        logger.info(f"Total P&L Impact: ${self.session_stats['total_pnl']:.2f}")
        logger.info("=" * 60)
        
        # Send final session alert
        if self.session_stats['actions_executed'] > 0:
            await self.alert_system.send_session_alert(
                'MONITORING_COMPLETE',
                f'Monitoring session complete - {self.session_stats["actions_executed"]} actions executed',
                self.session_stats
            )

def main():
    """Main entry point for intraday monitor"""
    parser = argparse.ArgumentParser(description='Intraday Position Monitor')
    parser.add_argument('--test', action='store_true',
                       help='Test mode with demo positions')
    parser.add_argument('--dry-run', action='store_true',
                       help='Log actions but don\'t execute trades')
    parser.add_argument('--positions', type=str,
                       help='Comma-separated list of symbols to monitor')
    parser.add_argument('--config', type=str, default='config/settings.yaml',
                       help='Path to config file')
    
    args = parser.parse_args()
    
    # Parse position filter
    position_filter = None
    if args.positions:
        position_filter = [pos.strip().upper() for pos in args.positions.split(',')]
    
    # Create logs directory
    os.makedirs('logs', exist_ok=True)
    
    # Initialize monitor
    try:
        monitor = IntradayMonitor(args.config)
    except Exception as e:
        logger.error(f"Failed to initialize monitor: {e}")
        sys.exit(1)
    
    # Run monitoring
    try:
        asyncio.run(monitor.start_monitoring(
            test_mode=args.test,
            dry_run=args.dry_run,
            position_filter=position_filter
        ))
    except KeyboardInterrupt:
        logger.info("Monitoring stopped by user")
    except Exception as e:
        logger.error(f"Monitoring failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()