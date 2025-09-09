#!/usr/bin/env python3
"""
Quick runner script for daily momentum stock picks
Run this each morning for your top 3 picks
"""

from stock_picker import MomentumStockPicker
from datetime import datetime
import json

def main():
    print("Starting Daily Momentum Stock Analysis...")
    print(f"Date: {datetime.now().strftime('%A, %B %d, %Y at %I:%M %p')}")
    print("-" * 60)
    
    # Initialize picker
    picker = MomentumStockPicker()
    
    # Get top 3 picks
    print("Analyzing top 100 S&P 500 stocks...")
    top_picks = picker.get_daily_picks(top_n=3)
    
    # Display results
    picker.display_picks(top_picks)
    
    # Save detailed results
    timestamp = datetime.now().strftime('%Y%m%d_%H%M')
    
    # Save as CSV
    csv_filename = f"picks_{timestamp}.csv"
    top_picks.to_csv(csv_filename, index=False)
    
    # Save as JSON with additional metadata
    json_data = {
        'timestamp': timestamp,
        'date': datetime.now().isoformat(),
        'picks': top_picks.to_dict('records')
    }
    
    json_filename = f"picks_{timestamp}.json"
    with open(json_filename, 'w') as f:
        json.dump(json_data, f, indent=2, default=str)
    
    print(f"\nData saved:")
    print(f"   CSV: {csv_filename}")
    print(f"   JSON: {json_filename}")
    
    # Quick summary for action
    print(f"\nQUICK SUMMARY FOR TODAY:")
    print("-" * 40)
    
    for idx, (_, pick) in enumerate(top_picks.iterrows(), 1):
        trend_strength = "STRONG" if pick['combined_score'] > 70 else "MODERATE" if pick['combined_score'] > 50 else "WEAK"
        print(f"{idx}. {pick['symbol']} - ${pick['current_price']:.2f} ({trend_strength} momentum)")
    
    print(f"\nFor detailed charts and analysis, run:")
    print(f"   streamlit run dashboard.py")
    
    return top_picks

if __name__ == "__main__":
    try:
        picks = main()
    except KeyboardInterrupt:
        print("\n\nAnalysis interrupted by user")
    except Exception as e:
        print(f"\nError during analysis: {str(e)}")
        print("Please check your internet connection and try again.")