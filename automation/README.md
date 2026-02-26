# EMAAR PROPERTIES — DATA AUTOMATION SUITE
# ═══════════════════════════════════════════
# Auto-pull live data from 8+ sources to feed your dashboard
# Built: Feb 2026 | Author: AI-Assisted | Version: 1.0

## 🚀 QUICK START

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run all scrapers at once
python main.py

# 3. Run individual scrapers
python scrapers/stock_fetcher.py        # Emaar stock + financials
python scrapers/property_scraper.py     # Bayut/PF listings
python scrapers/market_tracker.py       # Dubai market data
python scrapers/developer_tracker.py    # Developer rankings
python scrapers/rental_tracker.py       # Rental yield data

# 4. Schedule auto-runs (see below)
```

## 📁 PROJECT STRUCTURE

```
emaar-automation/
├── main.py                    # Master orchestrator — runs everything
├── config.py                  # All settings in one place
├── requirements.txt           # Python dependencies
├── README.md                  # This file
├── scrapers/
│   ├── stock_fetcher.py       # Yahoo Finance: stock price, financials, analyst data
│   ├── property_scraper.py    # Bayut + Property Finder: project prices, availability
│   ├── market_tracker.py      # DLD data: transactions, avg prices, volume
│   ├── developer_tracker.py   # DXBinteract: developer rankings
│   └── rental_tracker.py      # Rental listings: yields by community
├── data/
│   └── (baseline JSON files from your spreadsheet)
├── outputs/
│   ├── dashboard_data.json    # Combined output for dashboard
│   ├── stock_data.json        # Latest stock data
│   ├── property_data.json     # Latest property listings
│   ├── market_data.json       # Latest market stats
│   ├── changelog.json         # What changed since last run
│   └── alerts.json            # Price/data alerts
└── logs/
    └── automation.log         # Run history
```

## 🔄 AUTO-SCHEDULING

### Windows (Task Scheduler)
```bash
# Run daily at 8am Dubai time
schtasks /create /tn "EmaarUpdate" /tr "python C:\path\to\main.py" /sc daily /st 08:00
```

### Mac/Linux (cron)
```bash
# Run daily at 8am
crontab -e
0 8 * * * cd /path/to/emaar-automation && python main.py >> logs/cron.log 2>&1
```

### Cloud (Free Options)
- **GitHub Actions**: Free, runs on schedule, see .github/workflows example
- **PythonAnywhere**: Free tier, scheduled tasks
- **Railway.app**: Free tier with cron

## 📊 OUTPUT FORMAT

All outputs are JSON files that your React dashboard can consume.
The `dashboard_data.json` combines everything into one file.

## ⚠️ IMPORTANT NOTES

- Yahoo Finance API (via yfinance) is free and reliable
- Web scraping Bayut/Property Finder may need occasional selector updates
- DXBinteract data is updated monthly
- Run `main.py --check` to test all connections before scheduling
- Some sources rate-limit — built-in delays handle this
