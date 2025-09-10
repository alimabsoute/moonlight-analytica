import yfinance as yf
import pandas as pd
import sqlite3
from datetime import datetime, timedelta
import time
from typing import List, Dict, Optional, Tuple
import logging
import numpy as np
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import pickle
import os
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataManager:
    """
    Advanced data manager with intelligent caching, multi-source support,
    and robust error handling for trading system
    """
    
    def __init__(self, db_path: str = 'data/market_data.db', cache_dir: str = 'data/cache'):
        self.db_path = db_path
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Ensure data directory exists
        Path('data').mkdir(exist_ok=True)
        
        # Database connection
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.create_tables()
        
        # In-memory cache with timestamps
        self.memory_cache = {}
        self.cache_timestamps = {}
        self.cache_ttl = 300  # 5 minutes default TTL
        
        # Rate limiting
        self.last_request = {}
        self.min_request_interval = 0.1  # 100ms between requests per symbol
        
        # Data quality tracking
        self.quality_scores = {}
        
    def create_tables(self):
        """Create all necessary database tables"""
        cursor = self.conn.cursor()
        
        # Price data table with additional fields
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS price_data (
                symbol TEXT,
                date DATE,
                open REAL,
                high REAL,
                low REAL,
                close REAL,
                volume INTEGER,
                adj_close REAL,
                source TEXT DEFAULT 'yahoo',
                quality_score REAL DEFAULT 1.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (symbol, date)
            )
        ''')
        
        # Signals table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS signals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                symbol TEXT,
                strategy TEXT,
                signal_type TEXT,
                strength REAL,
                price REAL,
                stop_loss REAL,
                target REAL,
                notes TEXT,
                processed BOOLEAN DEFAULT FALSE
            )
        ''')
        
        # Trades table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_date DATETIME,
                exit_date DATETIME,
                symbol TEXT,
                strategy TEXT,
                entry_price REAL,
                exit_price REAL,
                quantity INTEGER,
                pnl REAL,
                pnl_pct REAL,
                commission REAL,
                status TEXT DEFAULT 'open',
                exit_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Symbol universe table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS symbols (
                symbol TEXT PRIMARY KEY,
                name TEXT,
                sector TEXT,
                market_cap REAL,
                avg_volume REAL,
                price REAL,
                active BOOLEAN DEFAULT TRUE,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Data quality metrics
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS data_quality (
                symbol TEXT,
                date DATE,
                missing_data_pct REAL,
                price_consistency_score REAL,
                volume_consistency_score REAL,
                overall_quality REAL,
                PRIMARY KEY (symbol, date)
            )
        ''')
        
        self.conn.commit()
        logger.info("Database tables created/verified successfully")
    
    def get_stock_data(self, symbol: str, period: str = '1mo', 
                      interval: str = '1d', use_cache: bool = True,
                      validate_data: bool = True) -> pd.DataFrame:
        """
        Fetch stock data with advanced caching and validation
        
        Args:
            symbol: Stock symbol
            period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
            use_cache: Whether to use cached data
            validate_data: Whether to validate data quality
        
        Returns:
            DataFrame with OHLCV data
        """
        cache_key = f"{symbol}_{period}_{interval}"
        
        # Check memory cache first
        if use_cache and self._is_cache_valid(cache_key):
            logger.debug(f"Returning cached data for {symbol}")
            return self.memory_cache[cache_key].copy()
        
        # Check persistent cache
        if use_cache:
            cached_data = self._load_from_cache(cache_key)
            if cached_data is not None:
                logger.debug(f"Returning persistent cache for {symbol}")
                self.memory_cache[cache_key] = cached_data
                self.cache_timestamps[cache_key] = time.time()
                return cached_data.copy()
        
        # Fetch fresh data
        data = self._fetch_fresh_data(symbol, period, interval)
        
        if data.empty:
            logger.warning(f"No data returned for {symbol}")
            return pd.DataFrame()
        
        # Validate data quality if requested
        if validate_data:
            quality_score = self._validate_data_quality(data, symbol)
            if quality_score < 0.5:
                logger.warning(f"Low quality data for {symbol}: {quality_score:.2f}")
        
        # Cache the data
        if use_cache:
            self.memory_cache[cache_key] = data
            self.cache_timestamps[cache_key] = time.time()
            self._save_to_cache(cache_key, data)
        
        # Store daily data in database
        if interval == '1d':
            self._store_price_data(symbol, data)
        
        return data.copy()
    
    def _fetch_fresh_data(self, symbol: str, period: str, interval: str) -> pd.DataFrame:
        """Fetch fresh data from Yahoo Finance with rate limiting"""
        
        # Rate limiting
        current_time = time.time()
        last_req = self.last_request.get(symbol, 0)
        time_diff = current_time - last_req
        
        if time_diff < self.min_request_interval:
            sleep_time = self.min_request_interval - time_diff
            logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s for {symbol}")
            time.sleep(sleep_time)
        
        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(period=period, interval=interval, auto_adjust=True, prepost=True)
            
            self.last_request[symbol] = time.time()
            
            if data.empty:
                logger.error(f"No data returned for {symbol}")
                return pd.DataFrame()
            
            # Clean and standardize data
            data = self._clean_data(data)
            
            logger.info(f"Fetched {len(data)} records for {symbol}")
            return data
            
        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {e}")
            # Try fallback to database
            return self._load_from_database(symbol, period)
    
    def _clean_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Clean and standardize data"""
        if data.empty:
            return data
        
        # Remove rows with all NaN values
        data = data.dropna(how='all')
        
        # Forward fill missing values (conservative approach)
        data = data.fillna(method='ffill')
        
        # Remove any remaining NaN rows
        data = data.dropna()
        
        # Ensure positive prices
        price_cols = ['Open', 'High', 'Low', 'Close']
        for col in price_cols:
            if col in data.columns:
                data[col] = data[col].abs()
        
        # Ensure High >= Low
        if 'High' in data.columns and 'Low' in data.columns:
            data.loc[data['High'] < data['Low'], ['High', 'Low']] = \
                data.loc[data['High'] < data['Low'], ['Low', 'High']].values
        
        # Ensure Volume is positive integer
        if 'Volume' in data.columns:
            data['Volume'] = data['Volume'].abs().astype(int)
        
        return data
    
    def _validate_data_quality(self, data: pd.DataFrame, symbol: str) -> float:
        """
        Validate data quality and return score (0-1)
        
        Quality factors:
        - Missing data percentage
        - Price consistency (no extreme gaps)
        - Volume consistency
        - Logical price relationships (H>=L, etc.)
        """
        if data.empty:
            return 0.0
        
        quality_factors = {}
        
        # Missing data score
        total_expected = len(data)
        missing_count = data.isnull().sum().sum()
        quality_factors['missing_data'] = 1 - (missing_count / (total_expected * len(data.columns)))
        
        # Price consistency score
        if 'Close' in data.columns and len(data) > 1:
            price_changes = data['Close'].pct_change().abs()
            extreme_changes = (price_changes > 0.5).sum()  # >50% daily change
            quality_factors['price_consistency'] = 1 - (extreme_changes / len(price_changes))
        else:
            quality_factors['price_consistency'] = 1.0
        
        # Volume consistency score  
        if 'Volume' in data.columns and len(data) > 5:
            volume_mean = data['Volume'].mean()
            volume_std = data['Volume'].std()
            if volume_mean > 0:
                cv = volume_std / volume_mean  # Coefficient of variation
                quality_factors['volume_consistency'] = min(1.0, 1 / (1 + cv))
            else:
                quality_factors['volume_consistency'] = 0.0
        else:
            quality_factors['volume_consistency'] = 1.0
        
        # OHLC relationship score
        ohlc_score = 1.0
        if all(col in data.columns for col in ['Open', 'High', 'Low', 'Close']):
            # Check if High >= Low
            invalid_hl = (data['High'] < data['Low']).sum()
            # Check if High >= Open, Close and Low <= Open, Close
            invalid_h = ((data['High'] < data['Open']) | (data['High'] < data['Close'])).sum()
            invalid_l = ((data['Low'] > data['Open']) | (data['Low'] > data['Close'])).sum()
            
            total_invalid = invalid_hl + invalid_h + invalid_l
            ohlc_score = 1 - (total_invalid / (len(data) * 3))
        
        quality_factors['ohlc_relationships'] = ohlc_score
        
        # Overall quality score (weighted average)
        weights = {
            'missing_data': 0.3,
            'price_consistency': 0.3,
            'volume_consistency': 0.2,
            'ohlc_relationships': 0.2
        }
        
        overall_quality = sum(quality_factors[k] * weights[k] for k in quality_factors)
        
        # Store quality metrics
        self.quality_scores[symbol] = {
            'overall': overall_quality,
            'factors': quality_factors,
            'timestamp': datetime.now()
        }
        
        return overall_quality
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cache is still valid"""
        if cache_key not in self.cache_timestamps:
            return False
        
        age = time.time() - self.cache_timestamps[cache_key]
        return age < self.cache_ttl
    
    def _save_to_cache(self, cache_key: str, data: pd.DataFrame):
        """Save data to persistent cache"""
        try:
            cache_file = self.cache_dir / f"{cache_key}.pkl"
            with open(cache_file, 'wb') as f:
                pickle.dump({
                    'data': data,
                    'timestamp': time.time()
                }, f)
        except Exception as e:
            logger.warning(f"Failed to save cache for {cache_key}: {e}")
    
    def _load_from_cache(self, cache_key: str) -> Optional[pd.DataFrame]:
        """Load data from persistent cache"""
        try:
            cache_file = self.cache_dir / f"{cache_key}.pkl"
            if not cache_file.exists():
                return None
            
            with open(cache_file, 'rb') as f:
                cached = pickle.load(f)
            
            # Check if cache is still valid
            age = time.time() - cached['timestamp']
            if age > self.cache_ttl:
                return None
            
            return cached['data']
        except Exception as e:
            logger.warning(f"Failed to load cache for {cache_key}: {e}")
            return None
    
    def _store_price_data(self, symbol: str, data: pd.DataFrame):
        """Store price data in database"""
        if data.empty:
            return
        
        cursor = self.conn.cursor()
        
        for date, row in data.iterrows():
            try:
                cursor.execute('''
                    INSERT OR REPLACE INTO price_data 
                    (symbol, date, open, high, low, close, volume, adj_close, quality_score)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    symbol, 
                    date.date() if hasattr(date, 'date') else date,
                    row.get('Open', 0),
                    row.get('High', 0), 
                    row.get('Low', 0),
                    row.get('Close', 0),
                    int(row.get('Volume', 0)),
                    row.get('Close', 0),  # Using Close as adj_close since auto_adjust=True
                    self.quality_scores.get(symbol, {}).get('overall', 1.0)
                ))
            except Exception as e:
                logger.error(f"Error storing data for {symbol} on {date}: {e}")
                continue
        
        self.conn.commit()
    
    def _load_from_database(self, symbol: str, period: str) -> pd.DataFrame:
        """Load historical data from database as fallback"""
        try:
            # Convert period to days
            days_map = {
                '1d': 1, '5d': 5, '1mo': 30, '3mo': 90, 
                '6mo': 180, '1y': 365, '2y': 730, '5y': 1825, 'max': 3650
            }
            days = days_map.get(period, 30)
            
            start_date = datetime.now() - timedelta(days=days)
            
            query = '''
                SELECT date, open, high, low, close, volume, adj_close
                FROM price_data
                WHERE symbol = ? AND date >= ?
                ORDER BY date
            '''
            
            df = pd.read_sql_query(
                query, self.conn,
                params=(symbol, start_date.date()),
                parse_dates=['date'],
                index_col='date'
            )
            
            # Rename columns to match yfinance format
            if not df.empty:
                df.columns = ['Open', 'High', 'Low', 'Close', 'Volume', 'Adj Close']
            
            logger.info(f"Loaded {len(df)} records from database for {symbol}")
            return df
            
        except Exception as e:
            logger.error(f"Error loading from database for {symbol}: {e}")
            return pd.DataFrame()
    
    def get_multiple_stocks(self, symbols: List[str], period: str = '1mo', 
                           max_workers: int = 10) -> Dict[str, pd.DataFrame]:
        """
        Fetch multiple stocks concurrently for better performance
        
        Args:
            symbols: List of stock symbols
            period: Time period for data
            max_workers: Maximum concurrent requests
            
        Returns:
            Dictionary mapping symbols to DataFrames
        """
        results = {}
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all requests
            future_to_symbol = {
                executor.submit(self.get_stock_data, symbol, period): symbol
                for symbol in symbols
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_symbol):
                symbol = future_to_symbol[future]
                try:
                    data = future.result()
                    results[symbol] = data
                    logger.debug(f"Completed data fetch for {symbol}")
                except Exception as e:
                    logger.error(f"Error fetching {symbol}: {e}")
                    results[symbol] = pd.DataFrame()
        
        logger.info(f"Fetched data for {len(results)} symbols")
        return results
    
    def get_market_snapshot(self, symbols: List[str]) -> Dict[str, Dict]:
        """Get current market data for multiple symbols"""
        snapshots = {}
        
        for symbol in symbols:
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                
                # Get current price from recent data
                recent_data = ticker.history(period='1d', interval='1m')
                current_price = recent_data['Close'].iloc[-1] if not recent_data.empty else info.get('regularMarketPrice', 0)
                
                snapshots[symbol] = {
                    'price': current_price,
                    'change': info.get('regularMarketChange', 0),
                    'change_pct': info.get('regularMarketChangePercent', 0),
                    'volume': info.get('regularMarketVolume', 0),
                    'avg_volume': info.get('averageDailyVolume10Day', 0),
                    'market_cap': info.get('marketCap', 0),
                    '52w_high': info.get('fiftyTwoWeekHigh', 0),
                    '52w_low': info.get('fiftyTwoWeekLow', 0),
                    'pe_ratio': info.get('forwardPE', info.get('trailingPE', 0)),
                    'dividend_yield': info.get('dividendYield', 0),
                    'timestamp': datetime.now()
                }
                
            except Exception as e:
                logger.error(f"Error getting snapshot for {symbol}: {e}")
                snapshots[symbol] = None
        
        return snapshots
    
    def get_sp500_symbols(self) -> List[str]:
        """Get S&P 500 symbols from Wikipedia"""
        try:
            # Try to get from cache first
            cache_file = self.cache_dir / "sp500_symbols.pkl"
            if cache_file.exists():
                mod_time = os.path.getmtime(cache_file)
                if time.time() - mod_time < 86400:  # 24 hours
                    with open(cache_file, 'rb') as f:
                        return pickle.load(f)
            
            # Fetch from Wikipedia
            url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
            tables = pd.read_html(url)
            sp500_table = tables[0]
            symbols = sp500_table['Symbol'].tolist()
            
            # Clean symbols (remove dots, etc.)
            symbols = [s.replace('.', '-') for s in symbols if isinstance(s, str)]
            
            # Cache the results
            with open(cache_file, 'wb') as f:
                pickle.dump(symbols, f)
            
            logger.info(f"Fetched {len(symbols)} S&P 500 symbols")
            return symbols
            
        except Exception as e:
            logger.error(f"Error fetching S&P 500 symbols: {e}")
            # Return a hardcoded list of major stocks as fallback
            return [
                'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'NVDA', 
                'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'PYPL',
                'BAC', 'ADBE', 'NFLX', 'CMCSA', 'VZ', 'XOM', 'PFE', 'TMO',
                'ABT', 'KO', 'CSCO', 'NKE', 'WMT', 'CVX', 'PEP', 'ABBV',
                'CRM', 'MRK', 'INTC', 'T', 'ACN', 'WFC', 'LLY', 'MCD'
            ]
    
    def log_signal(self, symbol: str, strategy: str, signal_type: str,
                   strength: float, price: float, stop_loss: float = None,
                   target: float = None, notes: str = ''):
        """Log a trading signal to database"""
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT INTO signals (timestamp, symbol, strategy, signal_type, 
                               strength, price, stop_loss, target, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (datetime.now(), symbol, strategy, signal_type, 
              strength, price, stop_loss, target, notes))
        self.conn.commit()
    
    def get_recent_signals(self, limit: int = 50) -> pd.DataFrame:
        """Get recent signals from database"""
        query = '''
            SELECT * FROM signals 
            ORDER BY timestamp DESC 
            LIMIT ?
        '''
        return pd.read_sql_query(query, self.conn, params=(limit,))
    
    def update_symbol_universe(self, symbols: List[str]):
        """Update the symbol universe table"""
        snapshots = self.get_market_snapshot(symbols)
        cursor = self.conn.cursor()
        
        for symbol, data in snapshots.items():
            if data:
                cursor.execute('''
                    INSERT OR REPLACE INTO symbols 
                    (symbol, market_cap, avg_volume, price, last_updated)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    symbol,
                    data.get('market_cap', 0),
                    data.get('avg_volume', 0),
                    data.get('price', 0),
                    datetime.now()
                ))
        
        self.conn.commit()
        logger.info(f"Updated universe data for {len(snapshots)} symbols")
    
    def get_data_quality_report(self, symbols: List[str] = None) -> Dict:
        """Generate data quality report"""
        if symbols is None:
            symbols = list(self.quality_scores.keys())
        
        report = {
            'timestamp': datetime.now(),
            'symbols_analyzed': len(symbols),
            'quality_scores': {},
            'summary': {
                'high_quality': 0,    # >0.8
                'medium_quality': 0,  # 0.5-0.8  
                'low_quality': 0      # <0.5
            }
        }
        
        for symbol in symbols:
            if symbol in self.quality_scores:
                score = self.quality_scores[symbol]['overall']
                report['quality_scores'][symbol] = score
                
                if score > 0.8:
                    report['summary']['high_quality'] += 1
                elif score > 0.5:
                    report['summary']['medium_quality'] += 1
                else:
                    report['summary']['low_quality'] += 1
        
        return report
    
    def cleanup_old_data(self, days_to_keep: int = 365):
        """Clean up old cached data and database records"""
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        # Clean database
        cursor = self.conn.cursor()
        cursor.execute('DELETE FROM price_data WHERE date < ?', (cutoff_date.date(),))
        cursor.execute('DELETE FROM signals WHERE timestamp < ?', (cutoff_date,))
        deleted_rows = cursor.rowcount
        self.conn.commit()
        
        # Clean cache files
        cache_files_deleted = 0
        for cache_file in self.cache_dir.glob('*.pkl'):
            try:
                mod_time = os.path.getmtime(cache_file)
                if time.time() - mod_time > days_to_keep * 86400:
                    cache_file.unlink()
                    cache_files_deleted += 1
            except Exception as e:
                logger.warning(f"Error deleting cache file {cache_file}: {e}")
        
        logger.info(f"Cleanup: deleted {deleted_rows} DB records, {cache_files_deleted} cache files")
    
    def close(self):
        """Close database connection and cleanup"""
        if hasattr(self, 'conn'):
            self.conn.close()
        logger.info("DataManager closed successfully")

# Testing and validation functions
def test_data_manager():
    """Test the data manager functionality"""
    dm = DataManager()
    
    print("Testing Data Manager...")
    
    # Test single stock fetch
    print("\n1. Testing single stock fetch...")
    aapl_data = dm.get_stock_data('AAPL', period='1mo')
    print(f"AAPL data shape: {aapl_data.shape}")
    print(f"AAPL latest close: ${aapl_data['Close'].iloc[-1]:.2f}")
    
    # Test multiple stocks
    print("\n2. Testing multiple stocks fetch...")
    symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']
    multi_data = dm.get_multiple_stocks(symbols, period='5d')
    print(f"Fetched data for {len(multi_data)} symbols")
    
    # Test market snapshot
    print("\n3. Testing market snapshot...")
    snapshot = dm.get_market_snapshot(symbols[:3])
    for symbol, data in snapshot.items():
        if data:
            print(f"{symbol}: ${data['price']:.2f} ({data['change_pct']:.1f}%)")
    
    # Test S&P 500 symbols
    print("\n4. Testing S&P 500 symbols...")
    sp500 = dm.get_sp500_symbols()
    print(f"S&P 500 symbols count: {len(sp500)}")
    print(f"First 10: {sp500[:10]}")
    
    # Test signal logging
    print("\n5. Testing signal logging...")
    dm.log_signal('AAPL', 'momentum', 'BUY', 85.5, 150.25, 145.0, 160.0, "Strong momentum breakout")
    recent_signals = dm.get_recent_signals(5)
    print(f"Recent signals: {len(recent_signals)}")
    
    # Test data quality
    print("\n6. Testing data quality...")
    quality_report = dm.get_data_quality_report(symbols[:3])
    print(f"Quality summary: {quality_report['summary']}")
    
    dm.close()
    print("\nData Manager test completed successfully!")

if __name__ == "__main__":
    test_data_manager()