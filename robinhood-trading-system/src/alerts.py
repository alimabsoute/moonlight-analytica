import smtplib
import requests
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import List, Dict, Optional, Any
import logging
import yaml
from dataclasses import dataclass
from pathlib import Path
import asyncio
import aiohttp
import pandas as pd

logger = logging.getLogger(__name__)

@dataclass
class AlertConfig:
    """Alert configuration settings"""
    discord_enabled: bool = False
    discord_webhook: str = ""
    email_enabled: bool = False
    email_config: Dict = None
    telegram_enabled: bool = False
    telegram_config: Dict = None
    alert_levels: List[str] = None

class AlertSystem:
    """
    Comprehensive alert system supporting multiple channels:
    - Discord webhooks
    - Email notifications  
    - Telegram bot
    - SMS (future)
    - Push notifications (future)
    """
    
    def __init__(self, config_path: str = 'config/settings.yaml'):
        self.config = self._load_config(config_path)
        self.alert_config = self._parse_alert_config()
        
        # Rate limiting to prevent spam
        self.last_alert_time = {}
        self.alert_cooldown = 60  # 60 seconds between similar alerts
        
        # Alert history for tracking
        self.alert_history = []
        self.max_history = 1000
        
        logger.info("AlertSystem initialized successfully")
    
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from YAML file"""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict:
        """Return default configuration"""
        return {
            'notifications': {
                'discord': {
                    'enabled': False,
                    'webhook_url': '',
                    'alert_levels': ['signal', 'entry', 'exit', 'risk']
                },
                'email': {
                    'enabled': False,
                    'smtp_server': 'smtp.gmail.com',
                    'smtp_port': 587,
                    'sender_email': '',
                    'sender_password': '',
                    'recipient_email': '',
                    'alert_levels': ['risk', 'daily_summary']
                },
                'telegram': {
                    'enabled': False,
                    'bot_token': '',
                    'chat_id': '',
                    'alert_levels': ['entry', 'exit', 'risk']
                }
            }
        }
    
    def _parse_alert_config(self) -> AlertConfig:
        """Parse alert configuration"""
        notif_config = self.config.get('notifications', {})
        
        return AlertConfig(
            discord_enabled=notif_config.get('discord', {}).get('enabled', False),
            discord_webhook=notif_config.get('discord', {}).get('webhook_url', ''),
            email_enabled=notif_config.get('email', {}).get('enabled', False),
            email_config=notif_config.get('email', {}),
            telegram_enabled=notif_config.get('telegram', {}).get('enabled', False),
            telegram_config=notif_config.get('telegram', {}),
            alert_levels=notif_config.get('discord', {}).get('alert_levels', ['signal'])
        )
    
    def send_signal_alert(self, signals: List[Any], alert_type: str = 'signal'):
        """
        Send trading signal alerts
        
        Args:
            signals: List of signal objects
            alert_type: Type of alert ('signal', 'entry', 'exit', etc.)
        """
        if not signals:
            return
        
        # Check rate limiting
        alert_key = f"signals_{len(signals)}"
        if self._is_rate_limited(alert_key):
            return
        
        try:
            # Discord alert
            if self.alert_config.discord_enabled and alert_type in self.alert_config.alert_levels:
                self._send_discord_signal_alert(signals, alert_type)
            
            # Email alert  
            if self.alert_config.email_enabled and alert_type in self.alert_config.email_config.get('alert_levels', []):
                self._send_email_signal_alert(signals, alert_type)
            
            # Telegram alert
            if self.alert_config.telegram_enabled and alert_type in self.alert_config.telegram_config.get('alert_levels', []):
                self._send_telegram_signal_alert(signals, alert_type)
            
            # Record alert
            self._record_alert(alert_type, f"Sent {len(signals)} signal alerts")
            
        except Exception as e:
            logger.error(f"Error sending signal alerts: {e}")
    
    def _send_discord_signal_alert(self, signals: List[Any], alert_type: str):
        """Send Discord webhook alert for signals"""
        if not self.alert_config.discord_webhook:
            return
        
        # Color mapping
        color_map = {
            'signal': 0x00ff00,    # Green for new signals
            'entry': 0x0099ff,     # Blue for entries
            'exit': 0xff9900,      # Orange for exits
            'risk': 0xff0000,      # Red for risk alerts
            'profit': 0x00ffff     # Cyan for profit taking
        }
        
        # Build embed
        embed = {
            "title": f"🚨 {alert_type.upper()} Alert - {len(signals)} Opportunities",
            "description": f"Found {len(signals)} trading opportunities",
            "color": color_map.get(alert_type, 0x808080),
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {
                "text": "Robinhood Trading System"
            },
            "fields": []
        }
        
        # Add top 5 signals to embed
        for i, signal in enumerate(signals[:5]):
            signal_name = f"{signal.symbol}" if hasattr(signal, 'symbol') else f"Signal {i+1}"
            
            # Format signal details
            if hasattr(signal, 'entry_price') and hasattr(signal, 'signal_strength'):
                field_value = (
                    f"**Entry:** ${signal.entry_price:.2f}\n"
                    f"**Stop:** ${getattr(signal, 'stop_loss', 0):.2f}\n"
                    f"**Target:** ${getattr(signal, 'target_price', 0):.2f}\n"
                    f"**Strength:** {signal.signal_strength:.1f}%"
                )
                
                if hasattr(signal, 'notes'):
                    field_value += f"\n**Notes:** {signal.notes[:50]}..."
            else:
                field_value = str(signal)[:100] + "..." if len(str(signal)) > 100 else str(signal)
            
            embed["fields"].append({
                "name": signal_name,
                "value": field_value,
                "inline": True
            })
        
        # Send webhook
        webhook_data = {"embeds": [embed]}
        
        try:
            response = requests.post(self.alert_config.discord_webhook, json=webhook_data)
            if response.status_code == 204:
                logger.info(f"Discord alert sent successfully for {len(signals)} signals")
            else:
                logger.error(f"Discord webhook failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Discord webhook error: {e}")
    
    def _send_email_signal_alert(self, signals: List[Any], alert_type: str):
        """Send email alert for signals"""
        email_config = self.alert_config.email_config
        
        if not all(k in email_config for k in ['sender_email', 'sender_password', 'recipient_email']):
            logger.warning("Incomplete email configuration")
            return
        
        try:
            # Create email
            msg = MIMEMultipart()
            msg['From'] = email_config['sender_email']
            msg['To'] = email_config['recipient_email']
            msg['Subject'] = f"Trading Alert: {len(signals)} {alert_type.title()} Signals - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            
            # Build email body
            body = self._format_email_body(signals, alert_type)
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
            server.starttls()
            server.login(email_config['sender_email'], email_config['sender_password'])
            
            text = msg.as_string()
            server.sendmail(email_config['sender_email'], email_config['recipient_email'], text)
            server.quit()
            
            logger.info(f"Email alert sent successfully for {len(signals)} signals")
            
        except Exception as e:
            logger.error(f"Email alert error: {e}")
    
    def _format_email_body(self, signals: List[Any], alert_type: str) -> str:
        """Format email body for signal alerts"""
        body = f"""
Trading System Alert: {alert_type.title()} Signals
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Summary: Found {len(signals)} trading opportunities

Detailed Signals:
{'=' * 50}

"""
        
        for i, signal in enumerate(signals, 1):
            if hasattr(signal, 'symbol'):
                body += f"""
{i}. {signal.symbol}
   Strategy: {getattr(signal, 'strategy', 'Unknown')}
   Entry Price: ${getattr(signal, 'entry_price', 0):.2f}
   Stop Loss: ${getattr(signal, 'stop_loss', 0):.2f}
   Target: ${getattr(signal, 'target_price', 0):.2f}
   Signal Strength: {getattr(signal, 'signal_strength', 0):.1f}%
   Notes: {getattr(signal, 'notes', 'No notes')}
   
"""
            else:
                body += f"{i}. {str(signal)}\n\n"
        
        body += f"""
{'=' * 50}
IMPORTANT DISCLAIMERS:
- This is not financial advice
- Trade at your own risk
- Always use proper position sizing
- Set stop losses before entering trades
- Review each signal before acting

Happy Trading!
Your Robinhood Trading System
"""
        
        return body
    
    def _send_telegram_signal_alert(self, signals: List[Any], alert_type: str):
        """Send Telegram alert for signals"""
        telegram_config = self.alert_config.telegram_config
        
        if not telegram_config.get('bot_token') or not telegram_config.get('chat_id'):
            return
        
        # Format message
        message = f"🚨 *{alert_type.upper()} ALERT*\n\n"
        message += f"Found *{len(signals)}* trading opportunities:\n\n"
        
        for i, signal in enumerate(signals[:3], 1):  # Top 3 for Telegram
            if hasattr(signal, 'symbol'):
                message += f"*{i}. {signal.symbol}*\n"
                message += f"Entry: ${getattr(signal, 'entry_price', 0):.2f}\n"
                message += f"Stop: ${getattr(signal, 'stop_loss', 0):.2f}\n"
                message += f"Target: ${getattr(signal, 'target_price', 0):.2f}\n"
                message += f"Strength: {getattr(signal, 'signal_strength', 0):.1f}%\n\n"
        
        if len(signals) > 3:
            message += f"... and {len(signals) - 3} more signals\n\n"
        
        message += f"⏰ {datetime.now().strftime('%H:%M:%S')}"
        
        # Send via Telegram API
        try:
            url = f"https://api.telegram.org/bot{telegram_config['bot_token']}/sendMessage"
            data = {
                'chat_id': telegram_config['chat_id'],
                'text': message,
                'parse_mode': 'Markdown'
            }
            
            response = requests.post(url, data=data)
            if response.status_code == 200:
                logger.info(f"Telegram alert sent successfully for {len(signals)} signals")
            else:
                logger.error(f"Telegram API error: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Telegram alert error: {e}")
    
    def send_position_alert(self, action: str, symbol: str, price: float, 
                           quantity: int = None, pnl: float = None, reason: str = ""):
        """
        Send position management alerts
        
        Args:
            action: 'BUY', 'SELL', 'STOP', 'TARGET'
            symbol: Stock symbol
            price: Execution price
            quantity: Number of shares
            pnl: Profit/Loss amount
            reason: Reason for action
        """
        alert_key = f"{action}_{symbol}"
        if self._is_rate_limited(alert_key):
            return
        
        try:
            # Discord alert
            if self.alert_config.discord_enabled:
                self._send_discord_position_alert(action, symbol, price, quantity, pnl, reason)
            
            # Email alert for important actions
            if self.alert_config.email_enabled and action in ['STOP', 'TARGET']:
                self._send_email_position_alert(action, symbol, price, quantity, pnl, reason)
            
            # Telegram alert
            if self.alert_config.telegram_enabled:
                self._send_telegram_position_alert(action, symbol, price, quantity, pnl, reason)
            
            self._record_alert('position', f"{action} {symbol} @ ${price:.2f}")
            
        except Exception as e:
            logger.error(f"Error sending position alert: {e}")
    
    def _send_discord_position_alert(self, action: str, symbol: str, price: float,
                                   quantity: int, pnl: float, reason: str):
        """Send Discord position alert"""
        if not self.alert_config.discord_webhook:
            return
        
        color_map = {
            'BUY': 0x00ff00,      # Green
            'SELL': 0xff9900,     # Orange  
            'STOP': 0xff0000,     # Red
            'TARGET': 0x0099ff    # Blue
        }
        
        embed = {
            "title": f"📈 {action} Alert: {symbol}",
            "color": color_map.get(action, 0x808080),
            "timestamp": datetime.utcnow().isoformat(),
            "fields": [
                {"name": "Price", "value": f"${price:.2f}", "inline": True},
                {"name": "Quantity", "value": str(quantity) if quantity else "N/A", "inline": True},
                {"name": "P&L", "value": f"${pnl:.2f}" if pnl else "N/A", "inline": True}
            ]
        }
        
        if reason:
            embed["fields"].append({"name": "Reason", "value": reason, "inline": False})
        
        webhook_data = {"embeds": [embed]}
        
        try:
            response = requests.post(self.alert_config.discord_webhook, json=webhook_data)
            if response.status_code != 204:
                logger.error(f"Discord position alert failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Discord position alert error: {e}")
    
    def _send_email_position_alert(self, action: str, symbol: str, price: float,
                                 quantity: int, pnl: float, reason: str):
        """Send email position alert"""
        email_config = self.alert_config.email_config
        
        try:
            msg = MIMEMultipart()
            msg['From'] = email_config['sender_email']
            msg['To'] = email_config['recipient_email']
            msg['Subject'] = f"Position Alert: {action} {symbol} @ ${price:.2f}"
            
            body = f"""
Position Alert: {action} {symbol}

Details:
- Symbol: {symbol}
- Action: {action}
- Price: ${price:.2f}
- Quantity: {quantity if quantity else 'N/A'}
- P&L: ${pnl:.2f if pnl else 0}
- Reason: {reason if reason else 'Manual'}
- Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

This is an automated alert from your Robinhood Trading System.
"""
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
            server.starttls()
            server.login(email_config['sender_email'], email_config['sender_password'])
            server.send_message(msg)
            server.quit()
            
        except Exception as e:
            logger.error(f"Email position alert error: {e}")
    
    def _send_telegram_position_alert(self, action: str, symbol: str, price: float,
                                    quantity: int, pnl: float, reason: str):
        """Send Telegram position alert"""
        telegram_config = self.alert_config.telegram_config
        
        if not telegram_config.get('bot_token'):
            return
        
        # Emoji mapping
        emoji_map = {
            'BUY': '🟢',
            'SELL': '🟡', 
            'STOP': '🔴',
            'TARGET': '🎯'
        }
        
        message = f"{emoji_map.get(action, '📈')} *{action} {symbol}*\n\n"
        message += f"Price: ${price:.2f}\n"
        
        if quantity:
            message += f"Shares: {quantity}\n"
        if pnl:
            pnl_emoji = "💰" if pnl > 0 else "💸"
            message += f"P&L: {pnl_emoji} ${pnl:.2f}\n"
        if reason:
            message += f"Reason: {reason}\n"
        
        message += f"\n⏰ {datetime.now().strftime('%H:%M:%S')}"
        
        try:
            url = f"https://api.telegram.org/bot{telegram_config['bot_token']}/sendMessage"
            data = {
                'chat_id': telegram_config['chat_id'],
                'text': message,
                'parse_mode': 'Markdown'
            }
            
            response = requests.post(url, data=data)
            if response.status_code != 200:
                logger.error(f"Telegram position alert failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Telegram position alert error: {e}")
    
    def send_risk_alert(self, alert_level: str, message: str, metrics: Dict = None):
        """
        Send risk management alerts
        
        Args:
            alert_level: 'WARNING', 'CRITICAL', 'INFO'
            message: Alert message
            metrics: Optional risk metrics dict
        """
        alert_key = f"risk_{alert_level}"
        if self._is_rate_limited(alert_key, cooldown=300):  # 5 min cooldown for risk alerts
            return
        
        try:
            # Always send risk alerts to all channels
            if self.alert_config.discord_enabled:
                self._send_discord_risk_alert(alert_level, message, metrics)
            
            if self.alert_config.email_enabled:
                self._send_email_risk_alert(alert_level, message, metrics)
            
            if self.alert_config.telegram_enabled:
                self._send_telegram_risk_alert(alert_level, message, metrics)
            
            self._record_alert('risk', f"{alert_level}: {message}")
            
        except Exception as e:
            logger.error(f"Error sending risk alert: {e}")
    
    def send_daily_summary(self, summary_data: Dict):
        """Send end-of-day summary"""
        try:
            if self.alert_config.email_enabled:
                self._send_email_daily_summary(summary_data)
            
            if self.alert_config.discord_enabled:
                self._send_discord_daily_summary(summary_data)
            
            self._record_alert('summary', "Daily summary sent")
            
        except Exception as e:
            logger.error(f"Error sending daily summary: {e}")
    
    def _send_email_daily_summary(self, summary_data: Dict):
        """Send daily summary email"""
        email_config = self.alert_config.email_config
        
        try:
            msg = MIMEMultipart()
            msg['From'] = email_config['sender_email']
            msg['To'] = email_config['recipient_email']
            msg['Subject'] = f"Daily Trading Summary - {datetime.now().strftime('%Y-%m-%d')}"
            
            # Build comprehensive summary
            body = f"""
Daily Trading Summary
{datetime.now().strftime('%A, %B %d, %Y')}
{'=' * 50}

PERFORMANCE SUMMARY
Portfolio Value: ${summary_data.get('portfolio_value', 0):,.2f}
Daily P&L: ${summary_data.get('daily_pnl', 0):,.2f}
Total Return: {summary_data.get('total_return_pct', 0):.2f}%

TRADING ACTIVITY
Signals Generated: {summary_data.get('signals_generated', 0)}
Trades Executed: {summary_data.get('trades_executed', 0)}
Positions Closed: {summary_data.get('positions_closed', 0)}
Win Rate: {summary_data.get('win_rate', 0):.1f}%

RISK METRICS
Max Drawdown: {summary_data.get('max_drawdown', 0):.2f}%
Cash Available: ${summary_data.get('cash_available', 0):,.2f}
Position Count: {summary_data.get('position_count', 0)}
PDT Trades Remaining: {summary_data.get('day_trades_remaining', 0)}

"""
            
            # Add top positions if available
            if 'top_positions' in summary_data:
                body += "TOP POSITIONS\n"
                for symbol, data in summary_data['top_positions'].items():
                    body += f"- {symbol}: ${data.get('value', 0):,.2f} ({data.get('pnl_pct', 0):+.1f}%)\n"
                body += "\n"
            
            # Add recent signals if available
            if 'recent_signals' in summary_data and summary_data['recent_signals']:
                body += "RECENT SIGNALS\n"
                for signal in summary_data['recent_signals'][:5]:
                    body += f"- {signal.get('symbol', 'N/A')}: {signal.get('strategy', 'N/A')} ({signal.get('strength', 0):.1f}%)\n"
                body += "\n"
            
            body += """
DISCLAIMERS
- This is not financial advice
- Past performance does not guarantee future results
- Always trade responsibly with proper risk management

Generated by Robinhood Trading System
"""
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
            server.starttls()
            server.login(email_config['sender_email'], email_config['sender_password'])
            server.send_message(msg)
            server.quit()
            
            logger.info("Daily summary email sent successfully")
            
        except Exception as e:
            logger.error(f"Daily summary email error: {e}")
    
    def _is_rate_limited(self, alert_key: str, cooldown: int = None) -> bool:
        """Check if alert is rate limited"""
        if cooldown is None:
            cooldown = self.alert_cooldown
        
        current_time = datetime.now()
        last_time = self.last_alert_time.get(alert_key)
        
        if last_time is None:
            self.last_alert_time[alert_key] = current_time
            return False
        
        time_diff = (current_time - last_time).total_seconds()
        
        if time_diff < cooldown:
            return True
        
        self.last_alert_time[alert_key] = current_time
        return False
    
    def _record_alert(self, alert_type: str, message: str):
        """Record alert in history"""
        alert_record = {
            'timestamp': datetime.now(),
            'type': alert_type,
            'message': message
        }
        
        self.alert_history.append(alert_record)
        
        # Trim history if too long
        if len(self.alert_history) > self.max_history:
            self.alert_history = self.alert_history[-self.max_history:]
    
    def get_alert_history(self, limit: int = 50) -> List[Dict]:
        """Get recent alert history"""
        return self.alert_history[-limit:]
    
    def test_alerts(self):
        """Test all configured alert channels"""
        test_results = {
            'discord': False,
            'email': False,
            'telegram': False
        }
        
        # Test Discord
        if self.alert_config.discord_enabled:
            try:
                embed = {
                    "title": "🧪 Test Alert",
                    "description": "This is a test alert from your Robinhood Trading System",
                    "color": 0x00ff00,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                response = requests.post(self.alert_config.discord_webhook, json={"embeds": [embed]})
                test_results['discord'] = response.status_code == 204
            except Exception as e:
                logger.error(f"Discord test failed: {e}")
        
        # Test Email
        if self.alert_config.email_enabled:
            try:
                email_config = self.alert_config.email_config
                msg = MIMEMultipart()
                msg['From'] = email_config['sender_email']
                msg['To'] = email_config['recipient_email']
                msg['Subject'] = "Test Alert - Trading System"
                
                body = "This is a test email from your Robinhood Trading System. If you receive this, email alerts are working correctly."
                msg.attach(MIMEText(body, 'plain'))
                
                server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
                server.starttls()
                server.login(email_config['sender_email'], email_config['sender_password'])
                server.send_message(msg)
                server.quit()
                
                test_results['email'] = True
            except Exception as e:
                logger.error(f"Email test failed: {e}")
        
        # Test Telegram
        if self.alert_config.telegram_enabled:
            try:
                telegram_config = self.alert_config.telegram_config
                url = f"https://api.telegram.org/bot{telegram_config['bot_token']}/sendMessage"
                data = {
                    'chat_id': telegram_config['chat_id'],
                    'text': '🧪 *Test Alert*\n\nThis is a test message from your Robinhood Trading System.',
                    'parse_mode': 'Markdown'
                }
                
                response = requests.post(url, data=data)
                test_results['telegram'] = response.status_code == 200
            except Exception as e:
                logger.error(f"Telegram test failed: {e}")
        
        return test_results

# Testing and utility functions
def test_alert_system():
    """Test the alert system functionality"""
    alerts = AlertSystem()
    
    print("Testing Alert System...")
    
    # Test configuration loading
    print(f"Discord enabled: {alerts.alert_config.discord_enabled}")
    print(f"Email enabled: {alerts.alert_config.email_enabled}")
    print(f"Telegram enabled: {alerts.alert_config.telegram_enabled}")
    
    # Create mock signal for testing
    class MockSignal:
        def __init__(self, symbol, entry_price, stop_loss, target_price, signal_strength, notes):
            self.symbol = symbol
            self.entry_price = entry_price
            self.stop_loss = stop_loss
            self.target_price = target_price
            self.signal_strength = signal_strength
            self.notes = notes
            self.strategy = "momentum"
    
    # Test signal alert
    test_signals = [
        MockSignal("AAPL", 150.25, 145.00, 160.00, 85.5, "Strong momentum breakout"),
        MockSignal("MSFT", 380.50, 370.00, 400.00, 78.2, "Technical indicator alignment")
    ]
    
    print(f"\nTesting signal alerts with {len(test_signals)} signals...")
    alerts.send_signal_alert(test_signals, 'signal')
    
    # Test position alert
    print("Testing position alert...")
    alerts.send_position_alert('BUY', 'AAPL', 150.25, 100, None, 'Signal entry')
    
    # Test risk alert
    print("Testing risk alert...")
    alerts.send_risk_alert('WARNING', 'Daily loss limit approaching', {'daily_pnl': -75})
    
    # Test daily summary
    print("Testing daily summary...")
    summary_data = {
        'portfolio_value': 10500,
        'daily_pnl': 250,
        'total_return_pct': 5.0,
        'signals_generated': 3,
        'trades_executed': 2,
        'win_rate': 66.7,
        'max_drawdown': -2.1,
        'position_count': 5
    }
    alerts.send_daily_summary(summary_data)
    
    # Test alert channels
    print("Testing alert channels...")
    test_results = alerts.test_alerts()
    for channel, success in test_results.items():
        status = "✅ PASSED" if success else "❌ FAILED (or disabled)"
        print(f"{channel.title()}: {status}")
    
    print("\nAlert System test completed!")

if __name__ == "__main__":
    test_alert_system()