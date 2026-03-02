"""
PROPERTY SCRAPER — Emaar Project Prices & Listings
Sources: Bayut.com, PropertyFinder.ae
Pulls: Current prices, price/sqft, availability per community

Usage:
    python scrapers/property_scraper.py

Output:
    outputs/property_data.json
"""

import json
import sys
import time
import re
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import *

try:
    import requests
    from bs4 import BeautifulSoup
    from fake_useragent import UserAgent
except ImportError:
    print("❌ Missing dependencies. Run: pip install requests beautifulsoup4 fake-useragent")
    sys.exit(1)


def get_headers():
    """Generate headers with rotating user agent."""
    try:
        ua = UserAgent()
        agent = ua.random
    except:
        agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    
    return {
        "User-Agent": agent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }


def parse_price(text):
    """Extract numeric price from text like 'AED 1,500,000' or '1.5M'."""
    if not text:
        return None
    text = text.replace(",", "").replace("AED", "").strip()
    
    # Handle M/K suffixes
    if "M" in text.upper():
        try:
            return float(re.sub(r'[^\d.]', '', text)) * 1_000_000
        except:
            return None
    if "K" in text.upper():
        try:
            return float(re.sub(r'[^\d.]', '', text)) * 1_000
        except:
            return None
    
    try:
        return float(re.sub(r'[^\d.]', '', text))
    except:
        return None


def scrape_bayut_community(community, url_path):
    """Scrape listing data from Bayut for a specific community."""
    url = BAYUT_BASE + url_path
    print(f"   🔍 Scraping Bayut: {community}...")
    
    try:
        response = requests.get(url, headers=get_headers(), timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'lxml')
        
        listings = []
        
        # Bayut listing cards (CSS selectors may need updating)
        cards = soup.select('article[role="article"], li[aria-label*="Listing"]')
        if not cards:
            cards = soup.select('[class*="listing"], [class*="property-card"]')
        
        for card in cards[:20]:  # Max 20 per community
            listing = {"community": community, "source": "Bayut"}
            
            # Price
            price_el = card.select_one('[class*="price"], span[aria-label*="Price"]')
            if price_el:
                listing["price"] = parse_price(price_el.get_text())
            
            # Title / Project name
            title_el = card.select_one('h2, [class*="title"]')
            if title_el:
                listing["title"] = title_el.get_text(strip=True)
            
            # Bedrooms
            bed_el = card.select_one('[class*="bed"], [aria-label*="Bed"]')
            if bed_el:
                bed_text = bed_el.get_text(strip=True)
                bed_match = re.search(r'(\d+)', bed_text)
                if bed_match:
                    listing["bedrooms"] = int(bed_match.group(1))
            
            # Area (sqft)
            area_el = card.select_one('[class*="area"], [aria-label*="Area"]')
            if area_el:
                area_text = area_el.get_text(strip=True)
                area_match = re.search(r'([\d,]+)', area_text.replace(",", ""))
                if area_match:
                    listing["sqft"] = int(area_match.group(1))
            
            # Calculate price/sqft
            if listing.get("price") and listing.get("sqft") and listing["sqft"] > 0:
                listing["price_per_sqft"] = round(listing["price"] / listing["sqft"], 0)
            
            # Type
            type_el = card.select_one('[class*="type"], [class*="category"]')
            if type_el:
                listing["property_type"] = type_el.get_text(strip=True)
            
            if listing.get("price"):  # Only include if we got a price
                listings.append(listing)
        
        # Calculate community averages
        prices = [l["price"] for l in listings if l.get("price")]
        ppsf = [l["price_per_sqft"] for l in listings if l.get("price_per_sqft")]
        
        summary = {
            "community": community,
            "source": "Bayut",
            "timestamp": datetime.now().isoformat(),
            "total_listings_found": len(listings),
            "avg_price": round(sum(prices) / len(prices)) if prices else None,
            "min_price": min(prices) if prices else None,
            "max_price": max(prices) if prices else None,
            "avg_price_per_sqft": round(sum(ppsf) / len(ppsf)) if ppsf else None,
            "sample_listings": listings[:5],  # Keep top 5 as samples
        }
        
        print(f"      ✓ Found {len(listings)} listings | Avg: AED {summary['avg_price']:,.0f}" if summary['avg_price'] else f"      ⚠️ No prices found")
        return summary
        
    except requests.exceptions.RequestException as e:
        print(f"      ❌ Request failed: {e}")
        return {"community": community, "source": "Bayut", "error": str(e)}
    except Exception as e:
        print(f"      ❌ Parse error: {e}")
        return {"community": community, "source": "Bayut", "error": str(e)}


def scrape_bayut_rentals(community, url_path):
    """Scrape rental listing data from Bayut."""
    url = BAYUT_BASE + url_path
    print(f"   🏠 Scraping Bayut rentals: {community}...")
    
    try:
        response = requests.get(url, headers=get_headers(), timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'lxml')
        
        rents = []
        cards = soup.select('article[role="article"], li[aria-label*="Listing"]')
        if not cards:
            cards = soup.select('[class*="listing"], [class*="property-card"]')
        
        for card in cards[:20]:
            price_el = card.select_one('[class*="price"], span[aria-label*="Price"]')
            if price_el:
                rent = parse_price(price_el.get_text())
                if rent and rent < 1_000_000:  # Filter out sale prices
                    rents.append(rent)
        
        summary = {
            "community": community,
            "type": "rental",
            "avg_annual_rent": round(sum(rents) / len(rents)) if rents else None,
            "min_rent": min(rents) if rents else None,
            "max_rent": max(rents) if rents else None,
            "listings_sampled": len(rents),
        }
        
        print(f"      ✓ {len(rents)} rentals | Avg: AED {summary['avg_annual_rent']:,.0f}/yr" if summary['avg_annual_rent'] else f"      ⚠️ No rental data")
        return summary
        
    except Exception as e:
        print(f"      ❌ Failed: {e}")
        return {"community": community, "type": "rental", "error": str(e)}


def calculate_live_yields(sale_data, rental_data):
    """Calculate live yields by matching sale and rental data per community."""
    print("\n   📊 Calculating live yields...")
    
    yields = []
    for community in EMAAR_COMMUNITIES[:6]:  # Main communities
        sale = next((s for s in sale_data if s.get("community") == community), None)
        rent = next((r for r in rental_data if r.get("community") == community), None)
        
        if sale and rent and sale.get("avg_price") and rent.get("avg_annual_rent"):
            gross_yield = (rent["avg_annual_rent"] / sale["avg_price"]) * 100
            net_yield = gross_yield * 0.85  # Est 15% costs
            
            yields.append({
                "community": community,
                "avg_sale_price": sale["avg_price"],
                "avg_annual_rent": rent["avg_annual_rent"],
                "gross_yield_pct": round(gross_yield, 2),
                "net_yield_pct": round(net_yield, 2),
                "timestamp": datetime.now().isoformat(),
            })
            
            print(f"      {community}: {gross_yield:.1f}% gross / {net_yield:.1f}% net")
    
    return yields


def run():
    """Main entry point for property scraper."""
    print("\n" + "=" * 60)
    print("  PROPERTY SCRAPER — Bayut & Property Finder")
    print("=" * 60 + "\n")
    
    # ─── SALE LISTINGS ────────────────────────────────
    print("📍 SALE LISTINGS:")
    sale_data = []
    for community, url_path in BAYUT_SEARCH_URLS.items():
        result = scrape_bayut_community(community, url_path)
        sale_data.append(result)
        time.sleep(REQUEST_DELAY)
    
    # ─── RENTAL LISTINGS ──────────────────────────────
    print("\n📍 RENTAL LISTINGS:")
    rental_data = []
    for community, url_path in BAYUT_RENTAL_URLS.items():
        result = scrape_bayut_rentals(community, url_path)
        rental_data.append(result)
        time.sleep(REQUEST_DELAY)
    
    # ─── LIVE YIELDS ──────────────────────────────────
    live_yields = calculate_live_yields(sale_data, rental_data)
    
    # ─── COMPARE WITH BASELINE ────────────────────────
    # Your spreadsheet baseline prices
    baseline = {
        "Dubai Hills Estate": {"avg_ppsf": 2400, "avg_price": 1750000},
        "Dubai Creek Harbour": {"avg_ppsf": 2700, "avg_price": 1810000},
        "Emaar Beachfront": {"avg_ppsf": 4150, "avg_price": 3200000},
        "Emaar South": {"avg_ppsf": 2800, "avg_price": 1200000},
        "Downtown Dubai": {"avg_ppsf": 3500, "avg_price": 2500000},
        "The Valley": {"avg_ppsf": 1100, "avg_price": 1600000},
    }
    
    changes = []
    for s in sale_data:
        community = s.get("community")
        if community in baseline and s.get("avg_price"):
            base_price = baseline[community]["avg_price"]
            live_price = s["avg_price"]
            change_pct = ((live_price - base_price) / base_price) * 100
            changes.append({
                "community": community,
                "baseline_price": base_price,
                "live_price": live_price,
                "change_pct": round(change_pct, 1),
                "direction": "↑" if change_pct > 0 else "↓",
            })
    
    # ─── OUTPUT ───────────────────────────────────────
    output = {
        "last_updated": datetime.now().isoformat(),
        "source": "Bayut / Property Finder",
        "sale_data": sale_data,
        "rental_data": rental_data,
        "live_yields": live_yields,
        "price_changes_vs_baseline": changes,
    }
    
    output_file = OUTPUT_DIR / "property_data.json"
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2, default=str)
    
    print(f"\n{'─' * 50}")
    print(f"  ✅ Property data saved to: {output_file}")
    print(f"  📍 Communities scraped: {len(sale_data)}")
    print(f"  🏠 Rental data: {len(rental_data)} communities")
    print(f"  📊 Live yields: {len(live_yields)} communities")
    if changes:
        print(f"\n  PRICE CHANGES vs BASELINE:")
        for c in changes:
            print(f"    {c['direction']} {c['community']}: {c['change_pct']:+.1f}%")
    print(f"{'─' * 50}\n")
    
    return output


if __name__ == "__main__":
    run()
