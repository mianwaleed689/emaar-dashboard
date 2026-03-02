"""
EMAAR AUTOMATION — MASTER ORCHESTRATOR
═══════════════════════════════════════
Runs all scrapers, combines data, generates unified dashboard output.

Usage:
    python main.py              # Run all scrapers
    python main.py --stock      # Stock data only
    python main.py --property   # Property listings only
    python main.py --market     # Market data only
    python main.py --developer  # Developer rankings only
    python main.py --rental     # Rental yields only
    python main.py --check      # Test all connections
    python main.py --quick      # Stock + market only (fastest)

Output:
    outputs/dashboard_data.json     # Combined dashboard feed
    outputs/changelog.json          # What changed since last run
    outputs/alerts.json             # Active alerts
"""

import json
import sys
import time
import argparse
import logging
from datetime import datetime
from pathlib import Path

# Setup paths
BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR))
from config import OUTPUT_DIR, LOG_DIR, LOG_FILE

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(),
    ]
)
logger = logging.getLogger(__name__)


def run_stock():
    """Run stock fetcher."""
    from scrapers.stock_fetcher import run as stock_run
    return stock_run()


def run_property():
    """Run property scraper."""
    from scrapers.property_scraper import run as property_run
    return property_run()


def run_market():
    """Run market tracker."""
    from scrapers.market_tracker import run as market_run
    return market_run()


def run_developer():
    """Run developer tracker."""
    from scrapers.developer_tracker import run as developer_run
    return developer_run()


def run_rental():
    """Run rental tracker."""
    from scrapers.rental_tracker import run as rental_run
    return rental_run()


def detect_changes():
    """Compare current outputs with previous run to detect changes."""
    changelog = []
    prev_file = OUTPUT_DIR / "dashboard_data_prev.json"
    curr_file = OUTPUT_DIR / "dashboard_data.json"
    
    if not prev_file.exists() or not curr_file.exists():
        return [{"type": "FIRST_RUN", "message": "First run — no comparison available"}]
    
    try:
        with open(prev_file) as f:
            prev = json.load(f)
        with open(curr_file) as f:
            curr = json.load(f)
        
        # Check stock price change
        prev_price = prev.get("stock", {}).get("price", {}).get("current")
        curr_price = curr.get("stock", {}).get("price", {}).get("current")
        if prev_price and curr_price and prev_price != curr_price:
            change_pct = ((curr_price - prev_price) / prev_price) * 100
            changelog.append({
                "type": "STOCK_PRICE",
                "field": "Emaar Stock Price",
                "previous": f"AED {prev_price}",
                "current": f"AED {curr_price}",
                "change": f"{change_pct:+.2f}%",
            })
        
        # Check analyst target
        prev_target = prev.get("stock", {}).get("analysts", {}).get("target_mean")
        curr_target = curr.get("stock", {}).get("analysts", {}).get("target_mean")
        if prev_target and curr_target and prev_target != curr_target:
            changelog.append({
                "type": "ANALYST_TARGET",
                "field": "Analyst Target Price",
                "previous": f"AED {prev_target}",
                "current": f"AED {curr_target}",
            })
        
    except Exception as e:
        changelog.append({"type": "ERROR", "message": f"Change detection failed: {e}"})
    
    return changelog


def combine_outputs():
    """Combine all individual outputs into one dashboard feed."""
    print("\n📦 Combining all data into dashboard feed...")
    
    combined = {
        "last_updated": datetime.now().isoformat(),
        "version": "1.0",
        "data_sources": [
            "Yahoo Finance (stock, financials)",
            "Bayut (property listings, rentals)",
            "DXBinteract (developer rankings)",
            "DLD (market transactions)",
            "Knight Frank / CW Core / Fitch (forecasts)",
        ],
    }
    
    # Load each output file if it exists
    files_to_load = {
        "stock": "stock_data.json",
        "property": "property_data.json",
        "market": "market_data.json",
        "developers": "developer_data.json",
        "rentals": "rental_data.json",
    }
    
    for key, filename in files_to_load.items():
        filepath = OUTPUT_DIR / filename
        if filepath.exists():
            try:
                with open(filepath) as f:
                    combined[key] = json.load(f)
                print(f"   ✓ Loaded {filename}")
            except Exception as e:
                print(f"   ⚠️ Failed to load {filename}: {e}")
                combined[key] = {"error": str(e)}
        else:
            print(f"   ⏭️ {filename} not found (run that scraper first)")
    
    # Save previous version for change detection
    dashboard_file = OUTPUT_DIR / "dashboard_data.json"
    prev_file = OUTPUT_DIR / "dashboard_data_prev.json"
    if dashboard_file.exists():
        import shutil
        shutil.copy2(dashboard_file, prev_file)
    
    # Save combined
    with open(dashboard_file, 'w') as f:
        json.dump(combined, f, indent=2, default=str)
    
    # Detect changes
    changes = detect_changes()
    with open(OUTPUT_DIR / "changelog.json", 'w') as f:
        json.dump({"timestamp": datetime.now().isoformat(), "changes": changes}, f, indent=2)
    
    # Collect all alerts
    all_alerts = []
    if "stock" in combined and "alerts" in combined["stock"]:
        all_alerts.extend(combined["stock"]["alerts"])
    
    with open(OUTPUT_DIR / "alerts.json", 'w') as f:
        json.dump({"timestamp": datetime.now().isoformat(), "alerts": all_alerts}, f, indent=2)
    
    return combined


def print_summary(combined):
    """Print a nice summary of the run."""
    print("\n" + "═" * 60)
    print("  EMAAR AUTOMATION — RUN COMPLETE")
    print("═" * 60)
    print(f"  ⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Stock summary
    stock = combined.get("stock", {})
    if stock and not stock.get("error"):
        price = stock.get("price", {}).get("current", "N/A")
        target = stock.get("analysts", {}).get("target_mean", "N/A")
        print(f"\n  📈 STOCK: AED {price} | Target: AED {target}")
    
    # Property summary
    prop = combined.get("property", {})
    if prop and not prop.get("error"):
        communities = len(prop.get("sale_data", []))
        print(f"  🏠 PROPERTY: {communities} communities tracked")
    
    # Market summary
    mkt = combined.get("market", {})
    if mkt and not mkt.get("error"):
        news = len(mkt.get("latest_news", []))
        print(f"  📊 MARKET: {news} news headlines collected")
    
    # Developer summary
    dev = combined.get("developers", {})
    if dev and not dev.get("error"):
        emaar_pos = dev.get("emaar_analytics", {}).get("emaar_market_position", {})
        print(f"  🏆 DEVELOPERS: Emaar #{emaar_pos.get('rank_by_value', '?')} by value")
    
    # Alerts
    alerts_file = OUTPUT_DIR / "alerts.json"
    if alerts_file.exists():
        with open(alerts_file) as f:
            alerts = json.load(f).get("alerts", [])
        if alerts:
            print(f"\n  ⚠️ {len(alerts)} ACTIVE ALERTS:")
            for a in alerts:
                print(f"    [{a.get('severity', 'INFO')}] {a.get('message', '')}")
    
    print(f"\n  📁 All outputs saved to: {OUTPUT_DIR}/")
    print(f"  📋 Dashboard feed: dashboard_data.json")
    print("═" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Emaar Properties Data Automation")
    parser.add_argument("--stock", action="store_true", help="Run stock fetcher only")
    parser.add_argument("--property", action="store_true", help="Run property scraper only")
    parser.add_argument("--market", action="store_true", help="Run market tracker only")
    parser.add_argument("--developer", action="store_true", help="Run developer tracker only")
    parser.add_argument("--rental", action="store_true", help="Run rental tracker only")
    parser.add_argument("--quick", action="store_true", help="Quick run: stock + market only")
    parser.add_argument("--check", action="store_true", help="Test all connections")
    args = parser.parse_args()
    
    start_time = time.time()
    
    print("\n" + "╔" + "═" * 58 + "╗")
    print("║" + "  EMAAR PROPERTIES — DATA AUTOMATION SUITE v1.0".center(58) + "║")
    print("║" + f"  {datetime.now().strftime('%B %d, %Y at %H:%M')}".center(58) + "║")
    print("╚" + "═" * 58 + "╝\n")
    
    # Determine which scrapers to run
    run_all = not any([args.stock, args.property, args.market, args.developer, args.rental, args.quick, args.check])
    
    if args.check:
        print("🔍 CONNECTION CHECK:")
        print("   Testing Yahoo Finance...", end=" ")
        try:
            import yfinance as yf
            t = yf.Ticker("EMAAR.AE")
            p = t.info.get("currentPrice") or t.info.get("regularMarketPrice")
            print(f"✓ (AED {p})")
        except Exception as e:
            print(f"❌ ({e})")
        
        print("   Testing Bayut...", end=" ")
        try:
            import requests
            r = requests.get("https://www.bayut.com", timeout=10)
            print(f"✓ (Status {r.status_code})")
        except Exception as e:
            print(f"❌ ({e})")
        
        print("   Testing Gulf News...", end=" ")
        try:
            r = requests.get("https://gulfnews.com", timeout=10)
            print(f"✓ (Status {r.status_code})")
        except Exception as e:
            print(f"❌ ({e})")
        
        return
    
    # Run scrapers
    results = {}
    
    if run_all or args.stock or args.quick:
        try:
            results["stock"] = run_stock()
        except Exception as e:
            logger.error(f"Stock fetcher failed: {e}")
            print(f"❌ Stock fetcher failed: {e}")
    
    if run_all or args.property:
        try:
            results["property"] = run_property()
        except Exception as e:
            logger.error(f"Property scraper failed: {e}")
            print(f"❌ Property scraper failed: {e}")
    
    if run_all or args.market or args.quick:
        try:
            results["market"] = run_market()
        except Exception as e:
            logger.error(f"Market tracker failed: {e}")
            print(f"❌ Market tracker failed: {e}")
    
    if run_all or args.developer:
        try:
            results["developer"] = run_developer()
        except Exception as e:
            logger.error(f"Developer tracker failed: {e}")
            print(f"❌ Developer tracker failed: {e}")
    
    if run_all or args.rental:
        try:
            results["rental"] = run_rental()
        except Exception as e:
            logger.error(f"Rental tracker failed: {e}")
            print(f"❌ Rental tracker failed: {e}")
    
    # Combine outputs
    combined = combine_outputs()
    
    # Summary
    elapsed = time.time() - start_time
    print_summary(combined)
    print(f"  ⏱️ Total time: {elapsed:.1f} seconds\n")
    
    logger.info(f"Automation run complete in {elapsed:.1f}s")


if __name__ == "__main__":
    main()
