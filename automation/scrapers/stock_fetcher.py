"""
STOCK FETCHER — Emaar Properties Stock & Financial Data
Sources: Yahoo Finance (via yfinance library)
Pulls: Stock price, market cap, P/E, analyst targets, financials, dividends

Usage:
    python scrapers/stock_fetcher.py
    
Output:
    outputs/stock_data.json
"""

import json
import sys
import os
from datetime import datetime, timedelta
from pathlib import Path

# Add parent to path for config
sys.path.insert(0, str(Path(__file__).parent.parent))
from config import *

try:
    import yfinance as yf
    import pandas as pd
except ImportError:
    print("❌ Missing dependencies. Run: pip install yfinance pandas")
    sys.exit(1)


def fetch_emaar_stock():
    """Fetch comprehensive Emaar stock data from Yahoo Finance."""
    print("📈 Fetching Emaar stock data...")
    
    ticker = yf.Ticker(EMAAR_TICKER)
    
    # ─── CURRENT PRICE & INFO ─────────────────────────
    info = ticker.info
    
    stock_data = {
        "last_updated": datetime.now().isoformat(),
        "source": "Yahoo Finance",
        "ticker": EMAAR_TICKER,
        
        # Price data
        "price": {
            "current": info.get("currentPrice") or info.get("regularMarketPrice"),
            "previous_close": info.get("previousClose"),
            "open": info.get("open") or info.get("regularMarketOpen"),
            "day_high": info.get("dayHigh") or info.get("regularMarketDayHigh"),
            "day_low": info.get("dayLow") or info.get("regularMarketDayLow"),
            "52w_high": info.get("fiftyTwoWeekHigh"),
            "52w_low": info.get("fiftyTwoWeekLow"),
            "50d_avg": info.get("fiftyDayAverage"),
            "200d_avg": info.get("twoHundredDayAverage"),
            "currency": "AED",
        },
        
        # Valuation
        "valuation": {
            "market_cap": info.get("marketCap"),
            "market_cap_aed_b": round(info.get("marketCap", 0) / 1e9, 1) if info.get("marketCap") else None,
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "pb_ratio": info.get("priceToBook"),
            "ev_ebitda": info.get("enterpriseToEbitda"),
            "enterprise_value": info.get("enterpriseValue"),
        },
        
        # Dividends
        "dividend": {
            "dividend_rate": info.get("dividendRate"),
            "dividend_yield": info.get("dividendYield"),
            "payout_ratio": info.get("payoutRatio"),
            "ex_date": str(info.get("exDividendDate", "")),
        },
        
        # Analyst data
        "analysts": {
            "target_mean": info.get("targetMeanPrice"),
            "target_high": info.get("targetHighPrice"),
            "target_low": info.get("targetLowPrice"),
            "target_median": info.get("targetMedianPrice"),
            "recommendation": info.get("recommendationKey"),
            "num_analysts": info.get("numberOfAnalystOpinions"),
        },
        
        # Key financials from Yahoo
        "financials_summary": {
            "revenue": info.get("totalRevenue"),
            "revenue_aed_b": round(info.get("totalRevenue", 0) / 1e9, 1) if info.get("totalRevenue") else None,
            "net_income": info.get("netIncomeToCommon"),
            "ebitda": info.get("ebitda"),
            "total_debt": info.get("totalDebt"),
            "total_cash": info.get("totalCash"),
            "profit_margin": info.get("profitMargins"),
            "operating_margin": info.get("operatingMargins"),
            "return_on_equity": info.get("returnOnEquity"),
            "book_value": info.get("bookValue"),
            "eps_trailing": info.get("trailingEps"),
            "eps_forward": info.get("forwardEps"),
        },
        
        # Shares
        "shares": {
            "shares_outstanding": info.get("sharesOutstanding"),
            "float_shares": info.get("floatShares"),
        },
    }
    
    # ─── PRICE HISTORY (1 Year) ───────────────────────
    print("   📊 Fetching price history...")
    hist = ticker.history(period="1y")
    if not hist.empty:
        # Calculate key metrics
        current = hist['Close'].iloc[-1]
        month_ago = hist['Close'].iloc[-22] if len(hist) > 22 else hist['Close'].iloc[0]
        year_start = hist['Close'].iloc[0]
        
        stock_data["performance"] = {
            "1d_change_pct": round(((current - hist['Close'].iloc[-2]) / hist['Close'].iloc[-2]) * 100, 2) if len(hist) > 1 else 0,
            "1m_change_pct": round(((current - month_ago) / month_ago) * 100, 2),
            "ytd_change_pct": round(((current - year_start) / year_start) * 100, 2),
            "1y_high": round(float(hist['Close'].max()), 3),
            "1y_low": round(float(hist['Close'].min()), 3),
            "avg_volume": int(hist['Volume'].mean()),
        }
        
        # Last 30 days price data for charts
        recent = hist.tail(30)
        stock_data["price_history_30d"] = [
            {
                "date": str(idx.date()),
                "close": round(float(row['Close']), 3),
                "volume": int(row['Volume']),
            }
            for idx, row in recent.iterrows()
        ]
    
    # ─── INCOME STATEMENT (ANNUAL) ────────────────────
    print("   📋 Fetching financial statements...")
    try:
        income = ticker.financials
        if income is not None and not income.empty:
            stock_data["income_statement"] = {}
            for col in income.columns[:4]:  # Last 4 years
                year = str(col.year)
                stock_data["income_statement"][year] = {
                    "total_revenue": float(income.loc["Total Revenue", col]) if "Total Revenue" in income.index else None,
                    "gross_profit": float(income.loc["Gross Profit", col]) if "Gross Profit" in income.index else None,
                    "operating_income": float(income.loc["Operating Income", col]) if "Operating Income" in income.index else None,
                    "net_income": float(income.loc["Net Income", col]) if "Net Income" in income.index else None,
                    "ebitda": float(income.loc["EBITDA", col]) if "EBITDA" in income.index else None,
                }
    except Exception as e:
        print(f"   ⚠️ Could not fetch income statement: {e}")
    
    # ─── QUARTERLY RESULTS ────────────────────────────
    try:
        quarterly = ticker.quarterly_financials
        if quarterly is not None and not quarterly.empty:
            stock_data["quarterly_results"] = {}
            for col in quarterly.columns[:4]:  # Last 4 quarters
                qtr = f"Q{((col.month - 1) // 3) + 1} {col.year}"
                stock_data["quarterly_results"][qtr] = {
                    "revenue": float(quarterly.loc["Total Revenue", col]) if "Total Revenue" in quarterly.index else None,
                    "net_income": float(quarterly.loc["Net Income", col]) if "Net Income" in quarterly.index else None,
                }
    except Exception as e:
        print(f"   ⚠️ Could not fetch quarterly data: {e}")
    
    # ─── DIVIDEND HISTORY ─────────────────────────────
    try:
        divs = ticker.dividends
        if divs is not None and len(divs) > 0:
            stock_data["dividend_history"] = [
                {"date": str(idx.date()), "amount": round(float(val), 4)}
                for idx, val in divs.tail(10).items()
            ]
    except Exception as e:
        print(f"   ⚠️ Could not fetch dividend history: {e}")
    
    return stock_data


def fetch_peer_comparison():
    """Fetch basic data for peer developers."""
    print("📊 Fetching peer comparison data...")
    
    peers = {}
    for name, tick in PEER_TICKERS.items():
        try:
            t = yf.Ticker(tick)
            info = t.info
            peers[name] = {
                "ticker": tick,
                "price": info.get("currentPrice") or info.get("regularMarketPrice"),
                "market_cap_b": round(info.get("marketCap", 0) / 1e9, 1) if info.get("marketCap") else None,
                "pe_ratio": info.get("trailingPE"),
                "dividend_yield": info.get("dividendYield"),
                "52w_change_pct": info.get("52WeekChange"),
            }
            print(f"   ✓ {name}: AED {peers[name]['price']}")
        except Exception as e:
            print(f"   ⚠️ {name}: Failed ({e})")
            peers[name] = {"ticker": tick, "error": str(e)}
    
    return peers


def check_alerts(stock_data):
    """Check if any alert thresholds are breached."""
    alerts = []
    
    perf = stock_data.get("performance", {})
    
    # Stock price drop
    daily_change = perf.get("1d_change_pct", 0)
    if daily_change <= ALERTS["stock_price_drop_pct"]:
        alerts.append({
            "type": "STOCK_DROP",
            "severity": "HIGH",
            "message": f"Emaar stock dropped {daily_change}% today",
            "timestamp": datetime.now().isoformat(),
        })
    
    # Stock price rise
    if daily_change >= ALERTS["stock_price_rise_pct"]:
        alerts.append({
            "type": "STOCK_RISE",
            "severity": "INFO",
            "message": f"Emaar stock rose {daily_change}% today",
            "timestamp": datetime.now().isoformat(),
        })
    
    # Analyst target change (compare with previous run)
    prev_file = OUTPUT_DIR / "stock_data.json"
    if prev_file.exists():
        try:
            with open(prev_file) as f:
                prev = json.load(f)
            prev_target = prev.get("analysts", {}).get("target_mean")
            curr_target = stock_data.get("analysts", {}).get("target_mean")
            if prev_target and curr_target and prev_target != curr_target:
                alerts.append({
                    "type": "ANALYST_TARGET_CHANGE",
                    "severity": "MEDIUM",
                    "message": f"Analyst target changed: AED {prev_target} → AED {curr_target}",
                    "timestamp": datetime.now().isoformat(),
                })
        except:
            pass
    
    return alerts


def run():
    """Main entry point for stock fetcher."""
    print("\n" + "=" * 60)
    print("  EMAAR STOCK FETCHER — Yahoo Finance")
    print("=" * 60 + "\n")
    
    # Fetch main data
    stock_data = fetch_emaar_stock()
    
    # Fetch peers
    stock_data["peer_comparison"] = fetch_peer_comparison()
    
    # Check alerts
    alerts = check_alerts(stock_data)
    stock_data["alerts"] = alerts
    
    # Save output
    output_file = OUTPUT_DIR / "stock_data.json"
    with open(output_file, 'w') as f:
        json.dump(stock_data, f, indent=2, default=str)
    
    # Print summary
    price = stock_data["price"].get("current", "N/A")
    target = stock_data["analysts"].get("target_mean", "N/A")
    rec = stock_data["analysts"].get("recommendation", "N/A")
    mcap = stock_data["valuation"].get("market_cap_aed_b", "N/A")
    
    print(f"\n{'─' * 50}")
    print(f"  EMAAR (EMAAR.AE)")
    print(f"  Price: AED {price}")
    print(f"  Market Cap: AED {mcap}B")
    print(f"  Target: AED {target} ({rec})")
    print(f"  P/E: {stock_data['valuation'].get('pe_ratio', 'N/A')}")
    if alerts:
        print(f"\n  ⚠️ {len(alerts)} ALERTS:")
        for a in alerts:
            print(f"    [{a['severity']}] {a['message']}")
    print(f"\n  ✅ Saved to: {output_file}")
    print(f"{'─' * 50}\n")
    
    return stock_data


if __name__ == "__main__":
    run()
