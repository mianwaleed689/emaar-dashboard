"""
GENERATE DASHBOARD DATA — DXB Analytics
========================================
Combines all scraper outputs into a single emaar.json file
that the React dashboard reads.

Usage:
    python generate_dashboard_data.py

    This script:
    1. Reads outputs from individual scrapers (stock_data.json, etc.)
    2. Merges with baseline data
    3. Outputs emaar.json to the dashboard's public/data/ folder
    4. You then: git add . && git commit -m "Data update" && git push

Can also be called from main.py after all scrapers run.
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

# ─── PATHS ────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
SCRAPER_OUTPUT_DIR = BASE_DIR / "outputs"
# UPDATE THIS to your dashboard's public/data/ folder:
DASHBOARD_DATA_DIR = Path(r"C:\WaleedScans\T\TRADING\emaar-dashboard\public\data")

# ─── BASELINE DATA (used when scrapers haven't run yet) ─
BASELINE = {
    "meta": {
        "last_updated": datetime.now().isoformat(),
        "version": "1.0",
        "source": "DXB Analytics Automation",
        "developer": "Emaar Properties PJSC"
    },
    "stock": {
        "price": 17.05,
        "target": 20.77,
        "rating": "STRONG BUY",
        "change_pct": 2.1,
        "52w_high": 18.20,
        "52w_low": 9.85,
        "market_cap_b": 68.2,
        "pe_ratio": 8.5,
        "credit_rating": "BBB+",
        "credit_agency": "S&P / Baa1"
    },
    "financials": [
        {"year": "2020", "revenue": 14.9, "grossProfit": 4.8, "ebitda": 6.2, "netProfit": 2.7, "propertySales": 14, "backlog": 28, "recurringRev": 5.3, "intlSales": 0.6, "mallRev": 3.2, "hotelRev": 2.1, "dividend": 0.15, "eps": 0.24, "gm": 32.2, "em": 41.6, "nm": 14.1},
        {"year": "2021", "revenue": 27.9, "grossProfit": 11.6, "ebitda": 8.5, "netProfit": 6.6, "propertySales": 23.9, "backlog": 32, "recurringRev": 5.8, "intlSales": 0.8, "mallRev": 3.5, "hotelRev": 2.3, "dividend": 0.25, "eps": 0.60, "gm": 41.6, "em": 30.5, "nm": 19.0},
        {"year": "2022", "revenue": 24.9, "grossProfit": 12.6, "ebitda": 9.8, "netProfit": 8.1, "propertySales": 30.7, "backlog": 41.5, "recurringRev": 7.5, "intlSales": 1.2, "mallRev": 4.2, "hotelRev": 3.3, "dividend": 0.35, "eps": 0.77, "gm": 50.6, "em": 39.4, "nm": 27.3},
        {"year": "2023", "revenue": 26.7, "grossProfit": 16.9, "ebitda": 16.0, "netProfit": 15.1, "propertySales": 40.3, "backlog": 71.8, "recurringRev": 8.6, "intlSales": 2.9, "mallRev": 5.8, "hotelRev": 2.8, "dividend": 0.50, "eps": 1.32, "gm": 63.3, "em": 59.9, "nm": 43.4},
        {"year": "2024", "revenue": 35.5, "grossProfit": 20.4, "ebitda": 19.3, "netProfit": 18.9, "propertySales": 69.5, "backlog": 111.5, "recurringRev": 9.3, "intlSales": 4.1, "mallRev": 5.6, "hotelRev": 3.7, "dividend": 1.00, "eps": 1.53, "gm": 57.5, "em": 54.4, "nm": 38.0},
        {"year": "2025", "revenue": 49.6, "grossProfit": 28.5, "ebitda": 25.6, "netProfit": 25.7, "propertySales": 80.4, "backlog": 155.0, "recurringRev": 10.5, "intlSales": 9.3, "mallRev": 6.3, "hotelRev": 4.2, "dividend": 1.00, "eps": 2.00, "gm": 57.5, "em": 51.6, "nm": 35.5},
    ],
    "developers": [
        {"rank": 1, "name": "Emaar", "sales": 65.8, "units": 13149, "delivered": 7318, "underConst": 51032},
        {"rank": 2, "name": "DAMAC", "sales": 35.9, "units": 15393, "delivered": 2113, "underConst": 46554},
        {"rank": 3, "name": "Binghatti", "sales": 26.0, "units": 17061, "delivered": 4093, "underConst": 38000},
        {"rank": 4, "name": "Nakheel", "sales": 24.6, "units": 4160, "delivered": 1522, "underConst": 15000},
        {"rank": 5, "name": "Sobha", "sales": 22.4, "units": 9698, "delivered": 2260, "underConst": 26933},
        {"rank": 6, "name": "Meraas", "sales": 20.9, "units": 2385, "delivered": 1913, "underConst": 12000},
        {"rank": 7, "name": "Omniyat", "sales": 11.0, "units": 1656, "delivered": 800, "underConst": 4500},
        {"rank": 8, "name": "Aldar", "sales": 9.9, "units": 1732, "delivered": 1200, "underConst": 18000},
        {"rank": 9, "name": "H&H", "sales": 8.1, "units": 1200, "delivered": 600, "underConst": 8000},
        {"rank": 10, "name": "Danube", "sales": 7.0, "units": 4089, "delivered": 1757, "underConst": 22000},
    ],
    "segments": [
        {"name": "UAE Property Dev", "revenue": 36.4, "growth": "44%"},
        {"name": "Malls & Retail", "revenue": 6.3, "growth": "13%"},
        {"name": "Hospitality", "revenue": 4.2, "growth": "12%"},
        {"name": "International", "revenue": 2.6, "growth": "124%"},
    ],
    "risks": [
        {"factor": "Premium Pricing", "score": 125, "level": "High"},
        {"factor": "Market Cycle", "score": 100, "level": "High"},
        {"factor": "Supply Competition", "score": 60, "level": "Medium"},
        {"factor": "Geographic Conc.", "score": 45, "level": "Medium"},
        {"factor": "Interest Rate", "score": 8, "level": "Low"},
        {"factor": "Execution", "score": 2, "level": "V.Low"},
        {"factor": "Regulatory", "score": 2, "level": "V.Low"},
        {"factor": "Currency (Peg)", "score": 2, "level": "V.Low"},
        {"factor": "Liquidity", "score": 1, "level": "V.Low"},
    ],
    "yields": [
        {"label": "DHE 1BR", "community": "Dubai Hills", "rent": 75, "price": 1529, "gross": 4.9, "net": 4.2, "demand": "V.High"},
        {"label": "DHE 2BR", "community": "Dubai Hills", "rent": 110, "price": 2200, "gross": 5.0, "net": 4.3, "demand": "V.High"},
        {"label": "DHE 3BR", "community": "Dubai Hills", "rent": 160, "price": 3500, "gross": 4.6, "net": 3.9, "demand": "High"},
        {"label": "DCH 1BR", "community": "Creek Harbour", "rent": 80, "price": 1750, "gross": 4.6, "net": 3.9, "demand": "High"},
        {"label": "DCH 2BR", "community": "Creek Harbour", "rent": 120, "price": 2500, "gross": 4.8, "net": 4.1, "demand": "High"},
        {"label": "EBF 1BR", "community": "Beachfront", "rent": 120, "price": 3200, "gross": 3.8, "net": 3.2, "demand": "V.High"},
        {"label": "ES 1BR", "community": "Emaar South", "rent": 60, "price": 1200, "gross": 5.0, "net": 4.3, "demand": "Growing"},
        {"label": "ES 2BR", "community": "Emaar South", "rent": 85, "price": 1800, "gross": 4.7, "net": 4.0, "demand": "Growing"},
        {"label": "TV 3BR", "community": "The Valley", "rent": 95, "price": 1600, "gross": 5.9, "net": 5.0, "demand": "High"},
        {"label": "DT 1BR", "community": "Downtown", "rent": 95, "price": 2500, "gross": 3.8, "net": 3.2, "demand": "V.High"},
    ],
    "roiPhases": [
        {"phase": "Pre-Launch", "low": 8, "high": 12, "avg": 10},
        {"phase": "Construction", "low": 12, "high": 20, "avg": 16},
        {"phase": "Handover", "low": 15, "high": 25, "avg": 20},
        {"phase": "Rental Y1+", "low": 4.5, "high": 8, "avg": 6.3},
        {"phase": "5-Year Hold", "low": 30, "high": 50, "avg": 40},
    ],
    "communities": [
        {"name": "DHE", "full": "Dubai Hills Estate", "projects": 16, "yield": "5.0-7.0%", "ppsf": "1,800-3,500"},
        {"name": "DCH", "full": "Dubai Creek Harbour", "projects": 11, "yield": "5.0-6.5%", "ppsf": "1,700-3,000"},
        {"name": "EBF", "full": "Emaar Beachfront", "projects": 5, "yield": "4.0-5.5%", "ppsf": "3,000-5,500"},
        {"name": "GPC", "full": "Grand Polo Club", "projects": 6, "yield": "3.5-5.0%", "ppsf": "1,500-2,200"},
        {"name": "ES", "full": "Emaar South", "projects": 2, "yield": "6.0-8.0%", "ppsf": "1,200-1,650"},
        {"name": "TV", "full": "The Valley", "projects": 2, "yield": "5.5-7.0%", "ppsf": "1,200-1,500"},
        {"name": "RYM", "full": "Rashid Yachts & Marina", "projects": 2, "yield": "5.0-6.5%", "ppsf": "2,000-3,500"},
        {"name": "TO", "full": "The Oasis", "projects": 1, "yield": "3.0-4.5%", "ppsf": "1,500-2,000"},
    ],
    "dubaiMarket": {
        "stats": [
            {"metric": "Total Sales Value", "val": "AED 682.5B", "yoy": "+30.7%"},
            {"metric": "Sales Transactions", "val": "214,912", "yoy": "+18.8%"},
            {"metric": "Off-Plan Share", "val": "62.6%", "yoy": "Growing"},
            {"metric": "Cash Buyers", "val": "87%", "yoy": "Dominant"},
            {"metric": "Avg Price/sqft", "val": "AED 1,755", "yoy": "+18.3%"},
            {"metric": "New Investors H1", "val": "59,075", "yoy": "+22%"},
        ],
        "salesHistory": [
            {"year": "2020", "sales": 120}, {"year": "2021", "sales": 230},
            {"year": "2022", "sales": 300}, {"year": "2023", "sales": 410},
            {"year": "2024", "sales": 522.4}, {"year": "2025", "sales": 682.5},
        ],
        "indicators": [
            ["Population", "5.8M by 2040"], ["Price Cycle", "56+ months up"],
            ["Developers", "228 active"], ["Units Launched", "131,504"],
            ["Mortgage Txns", "50,974"], ["2026 Pipeline", "~120K units"],
            ["Women Investors", "AED 154B"], ["REIDIN Growth", "+12.9% YoY"],
            ["Investor Base", "193.1K"],
        ]
    }
}


def load_scraper_output(filename):
    """Try to load a scraper output file. Returns None if not found."""
    path = SCRAPER_OUTPUT_DIR / filename
    if path.exists():
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"  ⚠️  Error reading {filename}: {e}")
    return None


def merge_stock_data(data, stock_output):
    """Merge live stock data from stock_fetcher.py output."""
    if not stock_output:
        return

    price_data = stock_output.get("price", {})
    valuation = stock_output.get("valuation", {})
    analyst = stock_output.get("analyst", {})

    if price_data.get("current"):
        data["stock"]["price"] = round(price_data["current"], 2)
    if price_data.get("52w_high"):
        data["stock"]["52w_high"] = round(price_data["52w_high"], 2)
    if price_data.get("52w_low"):
        data["stock"]["52w_low"] = round(price_data["52w_low"], 2)
    if valuation.get("market_cap"):
        data["stock"]["market_cap_b"] = round(valuation["market_cap"] / 1e9, 1)
    if valuation.get("pe_ratio"):
        data["stock"]["pe_ratio"] = round(valuation["pe_ratio"], 1)
    if analyst.get("target_mean"):
        data["stock"]["target"] = round(analyst["target_mean"], 2)
    if analyst.get("recommendation"):
        data["stock"]["rating"] = analyst["recommendation"].upper()

    print("  ✅ Stock data merged")


def merge_rental_data(data, rental_output):
    """Merge live rental/yield data from rental_tracker.py output."""
    if not rental_output:
        return

    # If rental scraper outputs yield data in the expected format,
    # update the yields array
    scraped_yields = rental_output.get("yields", [])
    if scraped_yields:
        data["yields"] = scraped_yields
        print(f"  ✅ Rental data merged ({len(scraped_yields)} units)")


def merge_developer_data(data, dev_output):
    """Merge developer ranking data from developer_tracker.py output."""
    if not dev_output:
        return

    scraped_devs = dev_output.get("developers", [])
    if scraped_devs:
        data["developers"] = scraped_devs
        print(f"  ✅ Developer data merged ({len(scraped_devs)} developers)")


def generate():
    """Main function: generate emaar.json for the dashboard."""
    print("=" * 50)
    print("DXB Analytics — Dashboard Data Generator")
    print("=" * 50)

    # Start with baseline
    data = json.loads(json.dumps(BASELINE))  # deep copy
    data["meta"]["last_updated"] = datetime.now().isoformat()

    # Try to merge scraper outputs
    print("\n📊 Checking scraper outputs...")

    stock_data = load_scraper_output("stock_data.json")
    if stock_data:
        merge_stock_data(data, stock_data)
    else:
        print("  ℹ️  No stock_data.json found, using baseline")

    rental_data = load_scraper_output("rental_data.json")
    if rental_data:
        merge_rental_data(data, rental_data)
    else:
        print("  ℹ️  No rental_data.json found, using baseline")

    dev_data = load_scraper_output("developer_data.json")
    if dev_data:
        merge_developer_data(data, dev_data)
    else:
        print("  ℹ️  No developer_data.json found, using baseline")

    # Save to dashboard
    DASHBOARD_DATA_DIR.mkdir(parents=True, exist_ok=True)
    output_path = DASHBOARD_DATA_DIR / "emaar.json"

    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"\n✅ Dashboard data saved to: {output_path}")
    print(f"   Size: {output_path.stat().st_size:,} bytes")
    print(f"   Updated: {data['meta']['last_updated']}")
    print(f"\n📌 Next: cd to your dashboard folder and run:")
    print(f"   git add . && git commit -m \"Data update {datetime.now().strftime('%d %b %Y')}\" && git push")

    return data


if __name__ == "__main__":
    generate()
