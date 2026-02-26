"""
EMAAR AUTOMATION — CENTRAL CONFIGURATION
All settings, tickers, URLs, and thresholds in one place.
"""

import os
from pathlib import Path

# ─── PATHS ────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = BASE_DIR / "outputs"
LOG_DIR = BASE_DIR / "logs"

# Create directories if they don't exist
for d in [DATA_DIR, OUTPUT_DIR, LOG_DIR]:
    d.mkdir(exist_ok=True)

# ─── EMAAR STOCK ──────────────────────────────────────
EMAAR_TICKER = "EMAAR.AE"          # Yahoo Finance ticker
EMAAR_DEV_TICKER = "EMAARDEV.AE"   # Emaar Development
DFM_INDEX = "DFMGI.AE"             # Dubai Financial Market Index

# Related tickers for comparison
PEER_TICKERS = {
    "Emaar Properties": "EMAAR.AE",
    "Emaar Development": "EMAARDEV.AE",
    "DAMAC": "DAMAC.AE",
    "Aldar": "ALDAR.AD",
    "Deyaar": "DEYAAR.AE",
}

# ─── EMAAR COMMUNITIES ───────────────────────────────
EMAAR_COMMUNITIES = [
    "Dubai Hills Estate",
    "Dubai Creek Harbour",
    "Emaar Beachfront",
    "Emaar South",
    "The Valley",
    "Grand Polo Club",
    "Rashid Yachts Marina",
    "The Oasis",
    "Downtown Dubai",
    "Business Bay",
]

# ─── BAYUT / PROPERTY FINDER SEARCH URLS ─────────────
BAYUT_BASE = "https://www.bayut.com"
BAYUT_SEARCH_URLS = {
    "Dubai Hills Estate": "/for-sale/property/dubai/dubai-hills-estate/",
    "Dubai Creek Harbour": "/for-sale/property/dubai/dubai-creek-harbour/",
    "Emaar Beachfront": "/for-sale/property/dubai/dubai-harbour/emaar-beachfront/",
    "Emaar South": "/for-sale/property/dubai/dubai-south-dubai-world-central/emaar-south/",
    "Downtown Dubai": "/for-sale/property/dubai/downtown-dubai/",
    "The Valley": "/for-sale/property/dubai/the-valley/",
}

PF_BASE = "https://www.propertyfinder.ae"
PF_SEARCH_URLS = {
    "Dubai Hills Estate": "/en/search?l=2642&c=2&fu=0&ob=mr&page=1",
    "Dubai Creek Harbour": "/en/search?l=2517&c=2&fu=0&ob=mr&page=1",
    "Emaar Beachfront": "/en/search?l=3082&c=2&fu=0&ob=mr&page=1",
}

# ─── RENTAL SEARCH URLS ──────────────────────────────
BAYUT_RENTAL_URLS = {
    "Dubai Hills Estate": "/to-rent/property/dubai/dubai-hills-estate/",
    "Dubai Creek Harbour": "/to-rent/property/dubai/dubai-creek-harbour/",
    "Emaar Beachfront": "/to-rent/property/dubai/dubai-harbour/emaar-beachfront/",
    "Downtown Dubai": "/to-rent/property/dubai/downtown-dubai/",
    "Emaar South": "/to-rent/property/dubai/dubai-south-dubai-world-central/emaar-south/",
}

# ─── NEWS & DATA SOURCES ─────────────────────────────
NEWS_URLS = {
    "Emaar IR": "https://properties.emaar.com/en/investor-relations/emaar-properties-pjsc/",
    "Gulf News Property": "https://gulfnews.com/business/property",
    "Zawya RE": "https://www.zawya.com/en/real-estate",
    "Arabian Business RE": "https://www.arabianbusiness.com/industries/real-estate",
}

# ─── DEVELOPER RANKINGS (BASELINE FROM YOUR SHEET) ───
BASELINE_DEVELOPERS = [
    {"rank": 1, "name": "Emaar", "sales_aed_b": 65.8, "units_sold": 13149, "delivered": 7318},
    {"rank": 2, "name": "DAMAC", "sales_aed_b": 35.9, "units_sold": 15393, "delivered": 2113},
    {"rank": 3, "name": "Binghatti", "sales_aed_b": 26.0, "units_sold": 17061, "delivered": 4093},
    {"rank": 4, "name": "Nakheel", "sales_aed_b": 24.6, "units_sold": 4160, "delivered": 1522},
    {"rank": 5, "name": "Sobha", "sales_aed_b": 22.4, "units_sold": 9698, "delivered": 2260},
    {"rank": 6, "name": "Meraas", "sales_aed_b": 20.9, "units_sold": 2385, "delivered": 1913},
    {"rank": 7, "name": "Omniyat", "sales_aed_b": 11.0, "units_sold": 1656, "delivered": 800},
    {"rank": 8, "name": "Aldar", "sales_aed_b": 9.9, "units_sold": 1732, "delivered": 1200},
    {"rank": 9, "name": "H&H", "sales_aed_b": 8.1, "units_sold": 1200, "delivered": 600},
    {"rank": 10, "name": "Danube", "sales_aed_b": 7.0, "units_sold": 4089, "delivered": 1757},
]

# ─── ALERT THRESHOLDS ────────────────────────────────
ALERTS = {
    "stock_price_drop_pct": -5,        # Alert if stock drops > 5% in a day
    "stock_price_rise_pct": 5,         # Alert if stock rises > 5% in a day
    "analyst_target_change": True,     # Alert on analyst target change
    "new_project_launch": True,        # Alert on new Emaar project
    "credit_rating_change": True,      # Alert on rating change
    "market_volume_spike_pct": 20,     # Alert if DLD volume spikes > 20%
}

# ─── SCRAPING SETTINGS ───────────────────────────────
REQUEST_DELAY = 2          # Seconds between requests (be respectful)
REQUEST_TIMEOUT = 15       # Seconds before timeout
MAX_RETRIES = 3            # Retry failed requests
USER_AGENT_ROTATE = True   # Rotate user agents

# ─── LOGGING ─────────────────────────────────────────
LOG_FILE = LOG_DIR / "automation.log"
LOG_LEVEL = "INFO"  # DEBUG, INFO, WARNING, ERROR
