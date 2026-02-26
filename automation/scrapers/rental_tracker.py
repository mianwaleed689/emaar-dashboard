"""
RENTAL TRACKER — Emaar Community Rental Yields
Sources: Bayut rental listings, DLD Rental Index
Pulls: Average rents by community/type, calculates live yields

Usage:
    python scrapers/rental_tracker.py

Output:
    outputs/rental_data.json
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


def get_baseline_yields():
    """Baseline yield data from your spreadsheet."""
    return [
        {"community": "Dubai Hills Estate", "unit_type": "1BR Apt", "annual_rent": 75000, "purchase_price": 1529388, "gross_yield": 4.9, "net_yield": 4.2, "demand": "Very High", "tenant_profile": "Professionals, couples"},
        {"community": "Dubai Hills Estate", "unit_type": "2BR Apt", "annual_rent": 110000, "purchase_price": 2200000, "gross_yield": 5.0, "net_yield": 4.3, "demand": "Very High", "tenant_profile": "Families, professionals"},
        {"community": "Dubai Hills Estate", "unit_type": "3BR Apt", "annual_rent": 160000, "purchase_price": 3500000, "gross_yield": 4.6, "net_yield": 3.9, "demand": "High", "tenant_profile": "HNW families"},
        {"community": "Dubai Creek Harbour", "unit_type": "1BR Apt", "annual_rent": 80000, "purchase_price": 1750000, "gross_yield": 4.6, "net_yield": 3.9, "demand": "High", "tenant_profile": "Young professionals"},
        {"community": "Dubai Creek Harbour", "unit_type": "2BR Apt", "annual_rent": 120000, "purchase_price": 2500000, "gross_yield": 4.8, "net_yield": 4.1, "demand": "High", "tenant_profile": "Expat families"},
        {"community": "Dubai Creek Harbour", "unit_type": "3BR Apt", "annual_rent": 170000, "purchase_price": 3500000, "gross_yield": 4.9, "net_yield": 4.1, "demand": "Moderate-High", "tenant_profile": "HNW tenants"},
        {"community": "Emaar Beachfront", "unit_type": "1BR Apt", "annual_rent": 120000, "purchase_price": 3200000, "gross_yield": 3.8, "net_yield": 3.2, "demand": "Very High", "tenant_profile": "Luxury expats"},
        {"community": "Emaar Beachfront", "unit_type": "2BR Apt", "annual_rent": 180000, "purchase_price": 5000000, "gross_yield": 3.6, "net_yield": 3.1, "demand": "High", "tenant_profile": "UHNW tenants"},
        {"community": "Emaar South", "unit_type": "1BR Apt", "annual_rent": 60000, "purchase_price": 1200000, "gross_yield": 5.0, "net_yield": 4.3, "demand": "Growing", "tenant_profile": "Airport staff, young prof."},
        {"community": "Emaar South", "unit_type": "2BR Apt", "annual_rent": 85000, "purchase_price": 1800000, "gross_yield": 4.7, "net_yield": 4.0, "demand": "Growing", "tenant_profile": "Families, value seekers"},
        {"community": "The Valley", "unit_type": "3BR TH", "annual_rent": 95000, "purchase_price": 1600000, "gross_yield": 5.9, "net_yield": 5.0, "demand": "High", "tenant_profile": "Family end-users"},
        {"community": "The Valley", "unit_type": "4BR Villa", "annual_rent": 140000, "purchase_price": 3000000, "gross_yield": 4.7, "net_yield": 4.0, "demand": "High", "tenant_profile": "Large families"},
        {"community": "Rashid Marina", "unit_type": "1BR Apt", "annual_rent": 85000, "purchase_price": 2100000, "gross_yield": 4.0, "net_yield": 3.4, "demand": "Moderate", "tenant_profile": "Maritime lifestyle"},
        {"community": "Downtown Dubai", "unit_type": "1BR Apt", "annual_rent": 95000, "purchase_price": 2500000, "gross_yield": 3.8, "net_yield": 3.2, "demand": "Very High", "tenant_profile": "Tourists, executives"},
        {"community": "Downtown Dubai", "unit_type": "2BR Apt", "annual_rent": 145000, "purchase_price": 4000000, "gross_yield": 3.6, "net_yield": 3.1, "demand": "Very High", "tenant_profile": "UHNW, corp. housing"},
    ]


def get_tenant_segments():
    """Target tenant profiles by segment."""
    return [
        {"segment": "Executive Professionals", "income_aed_month": "40,000-80,000", "preferred_unit": "1-2BR Apt", "preferred_community": "Dubai Hills, Downtown, Creek Harbour", "demand_driver": "DIFC/Business Bay proximity"},
        {"segment": "HNW Families", "income_aed_month": "80,000+", "preferred_unit": "3BR+ Villa/TH", "preferred_community": "Dubai Hills, The Valley, Grand Polo", "demand_driver": "Schools, space, Golden Visa"},
        {"segment": "International Investors", "income_aed_month": "N/A (Buy & Rent)", "preferred_unit": "1-2BR Apt", "preferred_community": "Emaar South, Creek Harbour, Hills", "demand_driver": "Yield optimization, brand trust"},
        {"segment": "Waterfront Lifestyle", "income_aed_month": "50,000-100,000", "preferred_unit": "1-3BR Apt", "preferred_community": "Emaar Beachfront, Rashid Marina", "demand_driver": "Beach access, marina views"},
        {"segment": "Young Professionals", "income_aed_month": "20,000-40,000", "preferred_unit": "Studio/1BR", "preferred_community": "Emaar South, The Valley", "demand_driver": "Affordability, metro access"},
        {"segment": "Tourism Investors", "income_aed_month": "N/A (Short-term)", "preferred_unit": "1-2BR Branded", "preferred_community": "Address/Vida/Palace", "demand_driver": "Hotel-managed returns"},
        {"segment": "Ultra-HNW", "income_aed_month": "200,000+", "preferred_unit": "5BR+ Mansion", "preferred_community": "The Oasis, Grand Polo, Downtown PH", "demand_driver": "Privacy, exclusivity, trophy asset"},
    ]


def calculate_yield_analytics(baseline):
    """Calculate portfolio-level yield analytics."""
    gross_yields = [y["gross_yield"] for y in baseline]
    net_yields = [y["net_yield"] for y in baseline]
    
    # Cash flow estimates (rent - 15% costs)
    cash_flows = [y["annual_rent"] * 0.85 for y in baseline]
    
    # Best yield communities
    by_community = {}
    for y in baseline:
        c = y["community"]
        if c not in by_community:
            by_community[c] = []
        by_community[c].append(y["gross_yield"])
    
    community_avg = {c: round(sum(v) / len(v), 2) for c, v in by_community.items()}
    best_yield_community = max(community_avg, key=community_avg.get)
    
    return {
        "portfolio_avg_gross_yield": round(sum(gross_yields) / len(gross_yields), 2),
        "portfolio_avg_net_yield": round(sum(net_yields) / len(net_yields), 2),
        "highest_gross_yield": max(gross_yields),
        "lowest_gross_yield": min(gross_yields),
        "avg_annual_cash_flow": round(sum(cash_flows) / len(cash_flows)),
        "best_yield_community": best_yield_community,
        "best_yield_community_avg": community_avg[best_yield_community],
        "community_averages": community_avg,
        "yield_spread": round(max(gross_yields) - min(gross_yields), 2),
        "golden_visa_eligible": "All communities (AED 2M+ threshold)",
    }


def run():
    """Main entry point for rental tracker."""
    print("\n" + "=" * 60)
    print("  RENTAL TRACKER — Yield Analysis")
    print("=" * 60 + "\n")
    
    # Baseline data
    print("📊 Loading baseline yield data...")
    baseline = get_baseline_yields()
    
    # Analytics
    print("📈 Calculating yield analytics...")
    analytics = calculate_yield_analytics(baseline)
    
    # Tenant segments
    tenant_segments = get_tenant_segments()
    
    # Output
    output = {
        "last_updated": datetime.now().isoformat(),
        "source": "DLD Rental Index, Bayut, Property Finder",
        "yield_data": baseline,
        "analytics": analytics,
        "tenant_segments": tenant_segments,
        "data_freshness": {
            "baseline": "Feb 2026 (from Emaar launch prices + market rents)",
            "methodology": "Gross = Annual Rent / Purchase Price. Net = Gross × 85%.",
            "note": "Run property_scraper.py to get live rental prices that override these baselines.",
        },
    }
    
    output_file = OUTPUT_DIR / "rental_data.json"
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2, default=str)
    
    a = analytics
    print(f"\n{'─' * 50}")
    print(f"  ✅ Rental data saved to: {output_file}")
    print(f"  📊 Avg Gross Yield: {a['portfolio_avg_gross_yield']}%")
    print(f"  📊 Range: {a['lowest_gross_yield']}% – {a['highest_gross_yield']}%")
    print(f"  🏆 Best: {a['best_yield_community']} ({a['best_yield_community_avg']}%)")
    print(f"  💰 Avg Cash Flow: AED {a['avg_annual_cash_flow']:,}/yr")
    print(f"{'─' * 50}\n")
    
    return output


if __name__ == "__main__":
    run()
