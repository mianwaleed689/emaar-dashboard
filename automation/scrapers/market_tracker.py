"""
MARKET TRACKER — Dubai Real Estate Market Data
Sources: Gulf News, Zawya, DLD publications, Knight Frank
Pulls: Transaction volumes, price indices, market stats

Usage:
    python scrapers/market_tracker.py

Output:
    outputs/market_data.json
"""

import json
import sys
import re
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import *

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("❌ Missing dependencies. Run: pip install requests beautifulsoup4")
    sys.exit(1)


def get_headers():
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
    }


def scrape_gulf_news_property():
    """Scrape latest property news headlines from Gulf News."""
    print("   📰 Scraping Gulf News Property section...")
    url = "https://gulfnews.com/business/property"
    
    try:
        response = requests.get(url, headers=get_headers(), timeout=REQUEST_TIMEOUT)
        soup = BeautifulSoup(response.text, 'lxml')
        
        headlines = []
        articles = soup.select('h2 a, h3 a, [class*="headline"] a')
        
        for a in articles[:15]:
            title = a.get_text(strip=True)
            href = a.get("href", "")
            if title and len(title) > 20 and ("dubai" in title.lower() or "emaar" in title.lower() or "property" in title.lower() or "real estate" in title.lower()):
                headlines.append({
                    "title": title,
                    "url": href if href.startswith("http") else f"https://gulfnews.com{href}",
                    "source": "Gulf News",
                })
        
        print(f"      ✓ Found {len(headlines)} relevant headlines")
        return headlines[:10]
        
    except Exception as e:
        print(f"      ❌ Failed: {e}")
        return []


def scrape_zawya_real_estate():
    """Scrape latest RE news from Zawya."""
    print("   📰 Scraping Zawya Real Estate...")
    url = "https://www.zawya.com/en/real-estate"
    
    try:
        response = requests.get(url, headers=get_headers(), timeout=REQUEST_TIMEOUT)
        soup = BeautifulSoup(response.text, 'lxml')
        
        headlines = []
        articles = soup.select('h2 a, h3 a, [class*="title"] a')
        
        for a in articles[:15]:
            title = a.get_text(strip=True)
            href = a.get("href", "")
            if title and len(title) > 15:
                headlines.append({
                    "title": title,
                    "url": href if href.startswith("http") else f"https://www.zawya.com{href}",
                    "source": "Zawya",
                })
        
        print(f"      ✓ Found {len(headlines)} headlines")
        return headlines[:10]
        
    except Exception as e:
        print(f"      ❌ Failed: {e}")
        return []


def get_baseline_market_data():
    """Return verified baseline market data from your spreadsheet + research."""
    return {
        "annual_2025": {
            "total_sales_value_aed_b": 682.5,
            "total_transactions": 214912,
            "total_txn_value_aed_b": 919,
            "total_all_transactions": 275442,
            "q4_sales_aed_b": 187.5,
            "december_sales_aed_b": 64.82,
            "avg_price_per_sqft": 1755,
            "off_plan_share_pct": 62.6,
            "off_plan_value_aed_b": 293,
            "new_investors_h1": 59075,
            "total_investors_h1": 94700,
            "residential_sales_txns": 203000,
            "avg_apt_rent_aed": 75000,
            "avg_villa_rent_aed": 189900,
            "mortgage_txns": 50974,
            "mortgage_value_aed_b": 179.26,
            "cash_buyers_pct": 87,
            "reidin_price_growth_pct": 12.9,
            "developer_count": 228,
            "units_launched": 131504,
            "yoy_sales_value_growth_pct": 30.7,
            "yoy_txn_volume_growth_pct": 18.8,
            "women_investors_aed_b": 154,
            "total_investor_base": 193100,
            "source": "DLD / DXBinteract / Emarat Al Youm / Zawya",
            "verified_date": "Feb 2026",
        },
        "forecasts_2026": {
            "knight_frank": {
                "prime_growth_pct": 3,
                "mainstream_growth_pct": 1,
                "supply_2026_2030_units": 331000,
                "annual_delivery_est": 66000,
                "notes": "Market transitioning to sustainable phase. 56+ month growth cycle.",
            },
            "cushman_wakefield_core": {
                "price_growth_pct": "5-8",
                "notes": "Marked slowdown from 12-22% annual growth in 2024-25.",
            },
            "fitch_ratings": {
                "correction_possible": True,
                "pipeline_units": 120000,
                "notes": "Moderate correction possible. Oversupply risk in select areas.",
            },
            "industry_consensus": {
                "transaction_growth_pct": "10-15",
                "notes": "Multiple CEOs forecast growth supported by Golden Visa and D33 strategy.",
            },
        },
        "key_indicators": {
            "population_target": "5.8M by 2040",
            "price_cycle_months": "56+",
            "gdp_growth_2025_pct": 4.8,
            "gdp_growth_2026_pct": 5.0,
            "d33_target": "AED 1T annual RE transactions",
        },
    }


def run():
    """Main entry point for market tracker."""
    print("\n" + "=" * 60)
    print("  MARKET TRACKER — Dubai Real Estate Data")
    print("=" * 60 + "\n")
    
    # Baseline verified data
    print("📊 Loading verified baseline market data...")
    market_data = get_baseline_market_data()
    
    # Scrape latest news
    print("\n📰 LATEST NEWS:")
    news = []
    
    gn_headlines = scrape_gulf_news_property()
    news.extend(gn_headlines)
    time.sleep(REQUEST_DELAY)
    
    zawya_headlines = scrape_zawya_real_estate()
    news.extend(zawya_headlines)
    
    # Compile output
    output = {
        "last_updated": datetime.now().isoformat(),
        "market_data": market_data,
        "latest_news": news,
        "data_freshness": {
            "annual_data": "FY 2025 (DLD verified Jan 2026)",
            "forecasts": "2026 outlook (Knight Frank Nov 2025, CW Core Jan 2026, Fitch 2026)",
            "news": f"Scraped {datetime.now().strftime('%b %d, %Y')}",
        },
        "next_data_points_to_watch": [
            "Q1 2026 DLD transaction data (expected Apr 2026)",
            "Emaar Q1 2026 earnings (expected May 7, 2026)",
            "Knight Frank Q4 2025 report",
            "Monthly DLD transaction updates",
            "REIDIN price index monthly update",
        ],
    }
    
    output_file = OUTPUT_DIR / "market_data.json"
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2, default=str)
    
    print(f"\n{'─' * 50}")
    print(f"  ✅ Market data saved to: {output_file}")
    print(f"  📊 2025 Total Sales: AED {market_data['annual_2025']['total_sales_value_aed_b']}B")
    print(f"  📈 YoY Growth: +{market_data['annual_2025']['yoy_sales_value_growth_pct']}%")
    print(f"  📰 News headlines: {len(news)}")
    print(f"  🔮 2026 Forecast: KF +3% prime | CW 5-8% | Fitch: correction possible")
    print(f"{'─' * 50}\n")
    
    return output


if __name__ == "__main__":
    run()
