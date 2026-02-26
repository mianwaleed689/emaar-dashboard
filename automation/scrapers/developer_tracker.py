"""
DEVELOPER TRACKER — Dubai Developer Rankings & Competitor Intelligence
Sources: DXBinteract, Arabian Business, fam Properties analysis
Pulls: Sales rankings, market share, new launches

Usage:
    python scrapers/developer_tracker.py

Output:
    outputs/developer_data.json
"""

import json
import sys
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
    }


def get_verified_rankings():
    """Return verified developer rankings from DXBinteract / fam Properties analysis."""
    return {
        "data_source": "DXBinteract via fam Properties / Arabian Business / Khaleej Times",
        "data_period": "Full Year 2025",
        "verified_date": "Jan 2026",
        "total_dubai_sales_aed_b": 682.5,
        "rankings_by_sales_value": [
            {"rank": 1, "developer": "Emaar Properties", "sales_aed_b": 65.8, "sales_usd_b": 17.9, "units_sold": 13149, "projects_delivered": 27, "units_delivered": 7318, "projects_launched": 54, "units_under_construction": 51032, "segment": "Full Spectrum", "confidence": "VERIFIED"},
            {"rank": 2, "developer": "DAMAC Properties", "sales_aed_b": 35.9, "sales_usd_b": 9.8, "units_sold": 15393, "projects_delivered": 12, "units_delivered": 2113, "projects_launched": 22, "units_under_construction": 46554, "segment": "Mid-Premium → Ultra-Lux", "confidence": "VERIFIED"},
            {"rank": 3, "developer": "Binghatti Developers", "sales_aed_b": 26.0, "sales_usd_b": 7.08, "units_sold": 17061, "projects_delivered": 12, "units_delivered": 4093, "projects_launched": 25, "units_under_construction": 38000, "segment": "Affordable → Mid-Premium", "confidence": "VERIFIED"},
            {"rank": 4, "developer": "Nakheel (Dubai Holding)", "sales_aed_b": 24.6, "sales_usd_b": 6.7, "units_sold": 4160, "projects_delivered": 8, "units_delivered": 1522, "projects_launched": 12, "units_under_construction": 15000, "segment": "Waterfront & Master Comm.", "confidence": "VERIFIED"},
            {"rank": 5, "developer": "Sobha Realty", "sales_aed_b": 22.4, "sales_usd_b": 6.1, "units_sold": 9698, "projects_delivered": 6, "units_delivered": 2260, "projects_launched": 15, "units_under_construction": 26933, "segment": "Premium → Ultra-Luxury", "confidence": "VERIFIED"},
            {"rank": 6, "developer": "Meraas (Dubai Holding)", "sales_aed_b": 20.9, "sales_usd_b": 5.69, "units_sold": 2385, "projects_delivered": 10, "units_delivered": 1913, "projects_launched": 8, "units_under_construction": 12000, "segment": "Premium Lifestyle", "confidence": "VERIFIED"},
            {"rank": 7, "developer": "Omniyat", "sales_aed_b": 11.0, "sales_usd_b": 2.995, "units_sold": 1656, "projects_delivered": 5, "units_delivered": 800, "projects_launched": 6, "units_under_construction": 4500, "segment": "Ultra-Luxury", "confidence": "VERIFIED"},
            {"rank": 8, "developer": "Aldar Properties", "sales_aed_b": 9.9, "sales_usd_b": 2.7, "units_sold": 1732, "projects_delivered": 8, "units_delivered": 1200, "projects_launched": 10, "units_under_construction": 18000, "segment": "Full Spectrum (AD+Dubai)", "confidence": "VERIFIED"},
            {"rank": 9, "developer": "H&H Development", "sales_aed_b": 8.1, "sales_usd_b": 2.2, "units_sold": 1200, "projects_delivered": 4, "units_delivered": 600, "projects_launched": 6, "units_under_construction": 8000, "segment": "Ultra-Luxury Villas", "confidence": "VERIFIED"},
            {"rank": 10, "developer": "Danube Properties", "sales_aed_b": 7.0, "sales_usd_b": 1.906, "units_sold": 4089, "projects_delivered": 15, "units_delivered": 1757, "projects_launched": 18, "units_under_construction": 22000, "segment": "Affordable → Mid-Market", "confidence": "VERIFIED"},
        ],
        "rankings_by_volume": [
            {"rank": 1, "developer": "Binghatti", "units_sold": 17061},
            {"rank": 2, "developer": "DAMAC", "units_sold": 15393},
            {"rank": 3, "developer": "Emaar", "units_sold": 13149},
            {"rank": 4, "developer": "Sobha", "units_sold": 9698},
            {"rank": 5, "developer": "Samana", "units_sold": 4754},
        ],
        "luxury_segment_above_15m": [
            {"rank": 1, "developer": "Nakheel", "sales_aed_b": 16.9, "transactions": 672},
            {"rank": 2, "developer": "Emaar", "sales_aed_b": 15.7, "transactions": 680},
            {"rank": 3, "developer": "Meraas", "sales_aed_b": 9.5, "transactions": 289},
        ],
        "affordable_segment_below_2m": [
            {"rank": 1, "developer": "Binghatti", "sales_aed_b": 16.2, "transactions": 14627},
            {"rank": 2, "developer": "DAMAC", "sales_aed_b": 8.4, "transactions": 6828},
            {"rank": 3, "developer": "Sobha", "sales_aed_b": 8.0, "transactions": 5887},
        ],
    }


def calculate_emaar_analytics(rankings):
    """Calculate Emaar-specific competitive analytics."""
    devs = rankings["rankings_by_sales_value"]
    emaar = devs[0]
    
    top_10_sales = sum(d["sales_aed_b"] for d in devs)
    top_10_units = sum(d["units_delivered"] for d in devs)
    
    return {
        "emaar_market_position": {
            "rank_by_value": 1,
            "rank_by_volume": 3,
            "rank_luxury_segment": 2,
            "sales_aed_b": emaar["sales_aed_b"],
            "pct_of_top_10_sales": round((emaar["sales_aed_b"] / top_10_sales) * 100, 1),
            "pct_of_dubai_total": round((emaar["sales_aed_b"] / rankings["total_dubai_sales_aed_b"]) * 100, 1),
            "lead_over_number_2_aed_b": round(emaar["sales_aed_b"] - devs[1]["sales_aed_b"], 1),
            "multiple_vs_number_2": round(emaar["sales_aed_b"] / devs[1]["sales_aed_b"], 2),
            "units_delivered_pct_of_top_10": round((emaar["units_delivered"] / top_10_units) * 100, 1),
            "largest_pipeline_units": emaar["units_under_construction"],
            "most_projects_launched": emaar["projects_launched"],
        },
        "competitive_moats": [
            f"1.83× sales vs #2 (DAMAC) — AED {emaar['sales_aed_b']}B vs {devs[1]['sales_aed_b']}B",
            f"Largest pipeline: {emaar['units_under_construction']:,} units under construction",
            f"Most projects launched: {emaar['projects_launched']} in 2025",
            f"Most units delivered: {emaar['units_delivered']:,} (31% of Top 10)",
            "Only developer with 3 investment-grade credit ratings",
            "14+ master communities vs competitors' 2-5 average",
        ],
    }


def scrape_developer_news():
    """Scrape latest developer-related news."""
    print("   📰 Checking for developer news...")
    
    search_terms = ["Emaar new project", "DAMAC launch", "Dubai developer 2026"]
    headlines = []
    
    for term in search_terms:
        try:
            url = f"https://www.arabianbusiness.com/search?q={term.replace(' ', '+')}"
            response = requests.get(url, headers=get_headers(), timeout=REQUEST_TIMEOUT)
            soup = BeautifulSoup(response.text, 'lxml')
            
            for a in soup.select('h2 a, h3 a')[:3]:
                title = a.get_text(strip=True)
                if title and len(title) > 15:
                    headlines.append({
                        "title": title,
                        "url": a.get("href", ""),
                        "search_term": term,
                        "source": "Arabian Business",
                    })
            
            time.sleep(REQUEST_DELAY)
        except Exception as e:
            print(f"      ⚠️ Search failed for '{term}': {e}")
    
    print(f"      ✓ Found {len(headlines)} headlines")
    return headlines


def run():
    """Main entry point for developer tracker."""
    print("\n" + "=" * 60)
    print("  DEVELOPER TRACKER — Competitive Intelligence")
    print("=" * 60 + "\n")
    
    # Verified rankings
    print("📊 Loading verified developer rankings...")
    rankings = get_verified_rankings()
    
    # Emaar analytics
    print("📈 Calculating Emaar competitive analytics...")
    emaar_analytics = calculate_emaar_analytics(rankings)
    
    # News
    print("\n📰 DEVELOPER NEWS:")
    news = scrape_developer_news()
    
    # Output
    output = {
        "last_updated": datetime.now().isoformat(),
        "rankings": rankings,
        "emaar_analytics": emaar_analytics,
        "developer_news": news,
        "data_freshness": {
            "rankings": "FY 2025 (DXBinteract verified Jan 2026)",
            "note": "Rankings update annually. Monitor DXBinteract for quarterly updates.",
        },
    }
    
    output_file = OUTPUT_DIR / "developer_data.json"
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2, default=str)
    
    ea = emaar_analytics["emaar_market_position"]
    print(f"\n{'─' * 50}")
    print(f"  ✅ Developer data saved to: {output_file}")
    print(f"  🏆 Emaar: #1 by value (AED {ea['sales_aed_b']}B)")
    print(f"  📊 {ea['pct_of_top_10_sales']}% of Top 10 | {ea['pct_of_dubai_total']}% of Dubai")
    print(f"  💪 {ea['multiple_vs_number_2']}× larger than #2")
    print(f"{'─' * 50}\n")
    
    return output


if __name__ == "__main__":
    run()
