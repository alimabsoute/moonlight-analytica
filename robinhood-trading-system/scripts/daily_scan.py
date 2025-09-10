#!/usr/bin/env python3
"""
Daily Scanner Script - Run this every morning at 9:15 AM ET

This script performs comprehensive market scanning using all configured strategies:
- Momentum breakout detection  
- Mean reversion opportunities
- Volatility breakout signals
- Risk assessment and position sizing

Usage:
    python scripts/daily_scan.py [--test] [--preview] [--strategy STRATEGY]
    
Examples:
    python scripts/daily_scan.py                    # Full scan
    python scripts/daily_scan.py --test             # Test mode with limited symbols
    python scripts/daily_scan.py --strategy momentum # Only momentum scan
    python scripts/daily_scan.py --preview          # Preview mode, no alerts
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import argparse
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import pandas as pd
import time

# Import our modules
from src.data_manager import DataManager
from src.risk_management import RiskManager  
from src.alerts import AlertSystem
import yaml

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/daily_scan.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DailyScanner:
    """
    Main daily scanner orchestrating all scanning strategies
    """
    
    def __init__(self, config_path: str = 'config/settings.yaml'):
        self.config_path = config_path
        self.config = self._load_config()
        
        # Initialize core components
        logger.info("Initializing Daily Scanner...")
        self.data_manager = DataManager()
        self.risk_manager = RiskManager(config_path)
        self.alert_system = AlertSystem(config_path)
        
        # Scanner modules (will be imported after MCP generation)
        self.scanners = {}
        self._initialize_scanners()
        
        # Scan results
        self.all_signals = []
        self.scan_summary = {
            'start_time': None,
            'end_time': None,
            'symbols_scanned': 0,
            'total_signals': 0,
            'signals_by_strategy': {},
            'top_signals': [],
            'scan_duration': 0
        }
        
    def _load_config(self) -> Dict:
        """Load configuration from YAML file"""
        try:
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return {}
    
    def _initialize_scanners(self):
        """Initialize all configured scanner strategies"""
        strategies_config = self.config.get('strategies', {})
        
        # Import and initialize momentum scanner
        if strategies_config.get('momentum', {}).get('enabled', False):
            try:
                # This will work after MCP generates the scanner
                from src.scanners.momentum import MomentumScanner
                self.scanners['momentum'] = MomentumScanner(self.data_manager)
                logger.info("Momentum scanner initialized")
            except ImportError:
                logger.warning("Momentum scanner not available - generate with OpenAI MCP")
        
        # Import and initialize mean reversion scanner  
        if strategies_config.get('mean_reversion', {}).get('enabled', False):
            try:
                from src.scanners.mean_reversion import MeanReversionScanner
                self.scanners['mean_reversion'] = MeanReversionScanner(self.data_manager)
                logger.info("Mean reversion scanner initialized")
            except ImportError:
                logger.warning("Mean reversion scanner not available - generate with OpenAI MCP")
        
        # Import and initialize volatility scanner
        if strategies_config.get('volatility_breakout', {}).get('enabled', False):
            try:
                from src.scanners.volatility import VolatilityScanner
                self.scanners['volatility'] = VolatilityScanner(self.data_manager)
                logger.info("Volatility scanner initialized")
            except ImportError:
                logger.warning("Volatility scanner not available")
        
        if not self.scanners:
            logger.error("No scanners available! Generate scanners with MCP first.")
    
    def run_daily_scan(self, test_mode: bool = False, preview_mode: bool = False, 
                      strategy_filter: Optional[str] = None) -> Dict:
        """
        Run the complete daily scanning process
        
        Args:
            test_mode: If True, scan limited symbols for testing
            preview_mode: If True, don't send alerts
            strategy_filter: If specified, only run this strategy
            
        Returns:
            Dict with scan results and summary
        """
        
        logger.info("=" * 60)
        logger.info("STARTING DAILY MARKET SCAN")
        logger.info("=" * 60)
        
        self.scan_summary['start_time'] = datetime.now()
        
        try:
            # Step 1: Pre-flight checks
            if not self._pre_flight_checks():
                return self._generate_error_summary("Pre-flight checks failed")
            
            # Step 2: Get scanning universe
            symbols = self._get_scanning_universe(test_mode)
            if not symbols:
                return self._generate_error_summary("No symbols to scan")
            
            logger.info(f"Scanning {len(symbols)} symbols...")
            self.scan_summary['symbols_scanned'] = len(symbols)
            
            # Step 3: Run all enabled scanners
            self.all_signals = []
            
            for strategy_name, scanner in self.scanners.items():
                # Skip if strategy filter is specified and doesn't match
                if strategy_filter and strategy_name != strategy_filter:
                    continue
                
                logger.info(f"Running {strategy_name} scanner...")
                strategy_signals = self._run_scanner(scanner, symbols, strategy_name)
                
                if strategy_signals:
                    self.all_signals.extend(strategy_signals)
                    self.scan_summary['signals_by_strategy'][strategy_name] = len(strategy_signals)
                    logger.info(f"Found {len(strategy_signals)} {strategy_name} signals")
                else:
                    logger.info(f"No {strategy_name} signals found")
                    self.scan_summary['signals_by_strategy'][strategy_name] = 0
            
            # Step 4: Process and rank signals
            self._process_signals()
            
            # Step 5: Risk assessment and position sizing
            self._assess_risk_and_sizing()
            
            # Step 6: Generate alerts (unless in preview mode)
            if not preview_mode and self.all_signals:
                self._send_alerts()
            
            # Step 7: Log results
            self._log_scan_results()
            
            # Generate final summary
            return self._generate_scan_summary()
            
        except Exception as e:
            logger.error(f"Daily scan failed: {e}", exc_info=True)
            return self._generate_error_summary(str(e))
        
        finally:
            self.scan_summary['end_time'] = datetime.now()
            if self.scan_summary['start_time']:
                duration = (self.scan_summary['end_time'] - self.scan_summary['start_time']).total_seconds()
                self.scan_summary['scan_duration'] = duration
                logger.info(f"Scan completed in {duration:.1f} seconds")
    
    def _pre_flight_checks(self) -> bool:
        """Run pre-flight checks before scanning"""
        logger.info("Running pre-flight checks...")
        
        # Check market hours (basic check - can be enhanced)
        current_time = datetime.now()
        hour = current_time.hour
        
        # Skip market hours check on weekends
        if current_time.weekday() >= 5:  # Saturday = 5, Sunday = 6
            logger.warning("Weekend detected - market closed")
            if not self.config.get('development', {}).get('skip_weekends', True):
                return False
        
        # Check if we're in reasonable scanning hours (6 AM - 8 PM ET)
        elif hour < 6 or hour > 20:
            logger.warning(f"Unusual scanning time: {hour}:00")
        
        # Check PDT status
        can_trade, remaining_trades, pdt_status = self.risk_manager.check_pdt_compliance()
        logger.info(f"PDT Status: {pdt_status}")
        
        if not can_trade:
            logger.warning("No day trades available - signals will be for swing trades only")
        
        # Check daily loss limits (if method exists)
        try:
            if hasattr(self.risk_manager, 'check_daily_loss_limit'):
                if not self.risk_manager.check_daily_loss_limit():
                    logger.error("Daily loss limit exceeded - trading suspended")
                    return False
        except Exception as e:
            logger.warning(f"Could not check daily loss limit: {e}")
        
        # Test data manager connectivity
        try:
            test_data = self.data_manager.get_stock_data('SPY', period='5d')
            if test_data.empty:
                logger.error("Data manager connectivity test failed")
                return False
            logger.info("Data manager connectivity: OK")
        except Exception as e:
            logger.error(f"Data manager test failed: {e}")
            return False
        
        logger.info("✅ Pre-flight checks passed")
        return True
    
    def _get_scanning_universe(self, test_mode: bool) -> List[str]:
        """Get list of symbols to scan"""
        universe_config = self.config.get('scanners', {}).get('universe', {})
        
        if test_mode:
            # Use small set for testing
            symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'META', 'AMZN', 'NFLX']
            logger.info("Test mode: Using limited symbol set")
        else:
            # Get full S&P 500 universe
            logger.info("Getting S&P 500 universe...")
            symbols = self.data_manager.get_sp500_symbols()
        
        # Apply universe filters
        filtered_symbols = self._apply_universe_filters(symbols, universe_config)
        
        logger.info(f"Universe: {len(symbols)} → {len(filtered_symbols)} after filtering")
        return filtered_symbols
    
    def _apply_universe_filters(self, symbols: List[str], config: Dict) -> List[str]:
        """Apply universe filters to symbol list"""
        if not config:
            return symbols
        
        # For now, return all symbols - can add filtering logic here
        # Future enhancements:
        # - Market cap filtering
        # - Volume filtering  
        # - Price range filtering
        # - Sector exclusions
        
        return symbols
    
    def _run_scanner(self, scanner, symbols: List[str], strategy_name: str) -> List:
        """Run a specific scanner on the symbol universe"""
        try:
            start_time = time.time()
            signals = scanner.scan(symbols)
            duration = time.time() - start_time
            
            logger.info(f"{strategy_name} scanner completed in {duration:.1f}s")
            
            # Log signals to database
            for signal in signals:
                if hasattr(signal, 'symbol'):
                    self.data_manager.log_signal(
                        symbol=signal.symbol,
                        strategy=strategy_name,
                        signal_type='BUY',  # Assuming buy signals
                        strength=getattr(signal, 'signal_strength', 0),
                        price=getattr(signal, 'entry_price', 0),
                        stop_loss=getattr(signal, 'stop_loss', 0),
                        target=getattr(signal, 'target_price', 0),
                        notes=getattr(signal, 'notes', '')
                    )
            
            return signals
            
        except Exception as e:
            logger.error(f"Error running {strategy_name} scanner: {e}")
            return []
    
    def _process_signals(self):
        """Process and rank all signals"""
        if not self.all_signals:
            return
        
        logger.info(f"Processing {len(self.all_signals)} signals...")
        
        # Sort by signal strength
        self.all_signals.sort(key=lambda x: getattr(x, 'signal_strength', 0), reverse=True)
        
        # Keep top signals based on configuration
        max_signals = self.config.get('scanners', {}).get('max_signals_per_scan', 20)
        if len(self.all_signals) > max_signals:
            logger.info(f"Limiting to top {max_signals} signals")
            self.all_signals = self.all_signals[:max_signals]
        
        # Store top signals in summary
        self.scan_summary['top_signals'] = []
        for signal in self.all_signals[:10]:  # Top 10 for summary
            if hasattr(signal, 'symbol'):
                self.scan_summary['top_signals'].append({
                    'symbol': signal.symbol,
                    'strategy': getattr(signal, 'strategy', 'unknown'),
                    'strength': getattr(signal, 'signal_strength', 0),
                    'entry_price': getattr(signal, 'entry_price', 0)
                })
        
        self.scan_summary['total_signals'] = len(self.all_signals)
    
    def _assess_risk_and_sizing(self):
        """Assess risk and calculate position sizing for signals"""
        if not self.all_signals:
            return
        
        logger.info("Calculating position sizes and risk assessment...")
        
        account_balance = self.risk_manager.get_current_portfolio_value()
        
        for signal in self.all_signals:
            if hasattr(signal, 'entry_price') and hasattr(signal, 'stop_loss'):
                # Calculate position size
                position_size, shares, risk_analysis = self.risk_manager.calculate_position_size(
                    signal_strength=getattr(signal, 'signal_strength', 50),
                    entry_price=signal.entry_price,
                    stop_loss=signal.stop_loss,
                    account_balance=account_balance,
                    symbol=getattr(signal, 'symbol', '')
                )
                
                # Add sizing info to signal
                signal.suggested_position_size = position_size
                signal.suggested_shares = shares
                signal.risk_analysis = risk_analysis
    
    def _send_alerts(self):
        """Send alerts for discovered signals"""
        logger.info("Sending signal alerts...")
        
        try:
            # Send signal alerts
            self.alert_system.send_signal_alert(self.all_signals, 'signal')
            
            # Send risk alerts if needed
            risk_metrics = self.risk_manager.calculate_portfolio_risk()
            
            if risk_metrics.max_drawdown > 15:  # 15% drawdown warning
                self.alert_system.send_risk_alert(
                    'WARNING', 
                    f'Portfolio drawdown at {risk_metrics.max_drawdown:.1f}%',
                    {'max_drawdown': risk_metrics.max_drawdown}
                )
            
        except Exception as e:
            logger.error(f"Error sending alerts: {e}")
    
    def _log_scan_results(self):
        """Log scan results to database and files"""
        timestamp = datetime.now()
        
        # Log to file
        log_entry = f"""
{'='*60}
DAILY SCAN RESULTS - {timestamp.strftime('%Y-%m-%d %H:%M:%S')}
{'='*60}

SUMMARY:
- Symbols Scanned: {self.scan_summary['symbols_scanned']}
- Total Signals: {self.scan_summary['total_signals']}
- Scan Duration: {self.scan_summary['scan_duration']:.1f}s

SIGNALS BY STRATEGY:
"""
        
        for strategy, count in self.scan_summary['signals_by_strategy'].items():
            log_entry += f"- {strategy}: {count}\n"
        
        log_entry += "\nTOP 5 SIGNALS:\n"
        for i, signal in enumerate(self.scan_summary['top_signals'][:5], 1):
            log_entry += f"{i}. {signal['symbol']} ({signal['strategy']}) - {signal['strength']:.1f}%\n"
        
        logger.info(log_entry)
    
    def _generate_scan_summary(self) -> Dict:
        """Generate final scan summary"""
        summary = self.scan_summary.copy()
        summary['status'] = 'success'
        summary['signals'] = self.all_signals
        
        return summary
    
    def _generate_error_summary(self, error_message: str) -> Dict:
        """Generate error summary"""
        return {
            'status': 'error',
            'error_message': error_message,
            'start_time': self.scan_summary.get('start_time'),
            'end_time': datetime.now(),
            'signals': []
        }

def main():
    """Main entry point for daily scanner"""
    parser = argparse.ArgumentParser(description='Daily Market Scanner')
    parser.add_argument('--test', action='store_true', 
                       help='Test mode with limited symbols')
    parser.add_argument('--preview', action='store_true',
                       help='Preview mode - no alerts sent') 
    parser.add_argument('--strategy', type=str,
                       help='Run specific strategy only')
    parser.add_argument('--config', type=str, default='config/settings.yaml',
                       help='Path to config file')
    
    args = parser.parse_args()
    
    # Create logs directory
    os.makedirs('logs', exist_ok=True)
    
    # Initialize scanner
    try:
        scanner = DailyScanner(args.config)
    except Exception as e:
        logger.error(f"Failed to initialize scanner: {e}")
        sys.exit(1)
    
    # Run scan
    results = scanner.run_daily_scan(
        test_mode=args.test,
        preview_mode=args.preview,
        strategy_filter=args.strategy
    )
    
    # Print results summary
    if results['status'] == 'success':
        print(f"\nScan completed successfully!")
        print(f"Found {results['total_signals']} signals")
        print(f"Duration: {results['scan_duration']:.1f}s")
        
        if results['signals']:
            print(f"\nTop Signals:")
            for i, signal in enumerate(results['top_signals'][:5], 1):
                print(f"{i}. {signal['symbol']} - {signal['strength']:.1f}% ({signal['strategy']})")
        else:
            print("\nNo signals found")
            
    else:
        print(f"\nScan failed: {results['error_message']}")
        sys.exit(1)

if __name__ == "__main__":
    main()