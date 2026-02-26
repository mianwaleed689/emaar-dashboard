"""
EARNINGS PROCESSOR — Complete Emaar Earnings Analysis Pipeline
═══════════════════════════════════════════════════════════════
Takes an Emaar earnings PDF → Extracts text → Pulls KPIs → 
Compares with previous data → Generates dashboard-ready output

This is the main entry point for Phase 3.

Usage:
    python parsers/earnings_processor.py path/to/emaar_fy2025.pdf
    python parsers/earnings_processor.py path/to/emaar_q1_2026.pdf --ai
    python parsers/earnings_processor.py --demo    (run with sample text)

Output:
    outputs/earnings_extracted.json    # Extracted KPIs
    outputs/earnings_comparison.json   # Changes vs previous period
    outputs/dashboard_data.json        # Updated dashboard feed
"""

import json
import sys
import argparse
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import OUTPUT_DIR


# ─── BASELINE DATA (Your spreadsheet FY 2025) ────────
BASELINE_FY2025 = {
    "period": "FY 2025",
    "property_sales_aed_b": 80.4,
    "revenue_aed_b": 49.6,
    "net_profit_pretax_aed_b": 25.7,
    "net_profit_attr_aed_b": 17.6,
    "ebitda_aed_b": 25.6,
    "revenue_backlog_aed_b": 155,
    "recurring_revenue_aed_b": 10.5,
    "intl_sales_aed_b": 9.3,
    "mall_revenue_aed_b": 6.3,
    "hotel_revenue_aed_b": 4.2,
    "mall_occupancy_pct": 98,
    "new_project_launches": 48,
    "units_delivered_cumulative": 79000,
    "land_bank_sqft_m": 618,
    "emaardev_sales_aed_b": 71.1,
    "emaardev_revenue_aed_b": 27.5,
    "dividend_per_share_aed": 1.0,
    "eps_aed": 2.0,
}


def process_earnings_pdf(pdf_path, use_ai=False):
    """
    Complete pipeline: PDF → Text → KPIs → Comparison → Output
    
    Args:
        pdf_path: Path to Emaar earnings PDF
        use_ai: Whether to use Claude API for enhanced extraction
    
    Returns:
        dict with extracted KPIs, comparison, and alerts
    """
    from parsers.pdf_parser import extract_text_from_pdf, identify_document_type
    from parsers.kpi_extractor import extract_all_kpis
    from parsers.ai_extractor import ai_extract_kpis, merge_extractions
    
    print("\n" + "═" * 60)
    print("  EMAAR EARNINGS PROCESSOR")
    print("═" * 60 + "\n")
    
    # ─── STEP 1: Extract Text ─────────────────────────
    print("📄 STEP 1: Extracting text from PDF...")
    pdf_result = extract_text_from_pdf(pdf_path)
    text = pdf_result["text"]
    doc_info = identify_document_type(text)
    
    print(f"   Document: {doc_info['document_type']}")
    print(f"   Period: {doc_info['reporting_period']}")
    print(f"   Year: {doc_info['reporting_year']}")
    print(f"   Pages: {pdf_result['page_count']}")
    print(f"   Characters: {pdf_result['char_count']:,}")
    
    # ─── STEP 2: Extract KPIs (Regex) ─────────────────
    print("\n🔍 STEP 2: Regex-based KPI extraction...")
    regex_kpis = extract_all_kpis(text)
    
    stats = regex_kpis["extraction_stats"]
    print(f"   Extracted: {stats['kpis_extracted']}/{stats['total_possible']} KPIs")
    print(f"   Confidence: {stats['confidence']}")
    
    # ─── STEP 3: AI Extraction (Optional) ─────────────
    ai_kpis = None
    if use_ai:
        print("\n🤖 STEP 3: AI-powered extraction...")
        ai_kpis = ai_extract_kpis(text)
    else:
        print("\n⏭️ STEP 3: AI extraction skipped (use --ai to enable)")
    
    # ─── STEP 4: Merge Results ────────────────────────
    print("\n📊 STEP 4: Merging extractions...")
    if ai_kpis:
        final_kpis = merge_extractions(regex_kpis, ai_kpis)
        print(f"   Method: Merged (regex + AI)")
    else:
        final_kpis = regex_kpis
        print(f"   Method: Regex only")
    
    # ─── STEP 5: Compare with Baseline ────────────────
    print("\n📈 STEP 5: Comparing with FY 2025 baseline...")
    comparison = compare_with_baseline(final_kpis, BASELINE_FY2025)
    
    # ─── STEP 6: Generate Alerts ──────────────────────
    print("\n⚠️ STEP 6: Checking for alerts...")
    alerts = generate_alerts(final_kpis, comparison)
    
    # ─── STEP 7: Save Outputs ─────────────────────────
    print("\n💾 STEP 7: Saving outputs...")
    
    output = {
        "processed_at": datetime.now().isoformat(),
        "source_file": str(pdf_path),
        "document_info": doc_info,
        "extracted_kpis": final_kpis,
        "comparison_vs_baseline": comparison,
        "alerts": alerts,
        "pdf_metadata": {
            "pages": pdf_result["page_count"],
            "chars": pdf_result["char_count"],
            "method": pdf_result["method_used"],
        },
    }
    
    # Save extracted KPIs
    kpi_file = OUTPUT_DIR / "earnings_extracted.json"
    with open(kpi_file, 'w') as f:
        json.dump(output, f, indent=2, default=str)
    print(f"   ✓ KPIs → {kpi_file}")
    
    # Save comparison
    comp_file = OUTPUT_DIR / "earnings_comparison.json"
    with open(comp_file, 'w') as f:
        json.dump(comparison, f, indent=2, default=str)
    print(f"   ✓ Comparison → {comp_file}")
    
    # Update dashboard data
    update_dashboard_data(final_kpis)
    
    # ─── SUMMARY ──────────────────────────────────────
    print_summary(final_kpis, comparison, alerts)
    
    return output


def compare_with_baseline(kpis, baseline):
    """Compare extracted KPIs with baseline data."""
    comparison = {
        "baseline_period": baseline["period"],
        "changes": [],
    }
    
    field_labels = {
        "property_sales_aed_b": "Property Sales",
        "revenue_aed_b": "Revenue",
        "net_profit_pretax_aed_b": "Net Profit (Pre-Tax)",
        "ebitda_aed_b": "EBITDA",
        "revenue_backlog_aed_b": "Revenue Backlog",
        "recurring_revenue_aed_b": "Recurring Revenue",
        "intl_sales_aed_b": "International Sales",
        "mall_revenue_aed_b": "Mall Revenue",
        "hotel_revenue_aed_b": "Hotel Revenue",
        "mall_occupancy_pct": "Mall Occupancy",
        "new_project_launches": "New Launches",
    }
    
    for field, label in field_labels.items():
        base_val = baseline.get(field)
        curr_val = kpis.get(field)
        
        if base_val is not None and curr_val is not None:
            if base_val != 0:
                change_pct = ((curr_val - base_val) / base_val) * 100
            else:
                change_pct = 0
            
            change = {
                "metric": label,
                "field": field,
                "baseline": base_val,
                "current": curr_val,
                "change_abs": round(curr_val - base_val, 2),
                "change_pct": round(change_pct, 1),
                "direction": "↑" if curr_val > base_val else "↓" if curr_val < base_val else "→",
                "significance": "HIGH" if abs(change_pct) > 15 else "MEDIUM" if abs(change_pct) > 5 else "LOW",
            }
            comparison["changes"].append(change)
            
            icon = change["direction"]
            print(f"   {icon} {label}: {base_val} → {curr_val} ({change_pct:+.1f}%)")
    
    return comparison


def generate_alerts(kpis, comparison):
    """Generate alerts based on extracted data."""
    alerts = []
    
    for change in comparison.get("changes", []):
        # Alert on significant drops
        if change["change_pct"] < -10:
            alerts.append({
                "type": "METRIC_DROP",
                "severity": "HIGH",
                "metric": change["metric"],
                "message": f"{change['metric']} dropped {abs(change['change_pct'])}% vs baseline",
                "details": f"{change['baseline']} → {change['current']}",
            })
        
        # Alert on significant growth
        if change["change_pct"] > 30:
            alerts.append({
                "type": "METRIC_SURGE",
                "severity": "INFO",
                "metric": change["metric"],
                "message": f"{change['metric']} surged {change['change_pct']}% vs baseline",
                "details": f"{change['baseline']} → {change['current']}",
            })
    
    # Credit rating alerts
    credit = kpis.get("credit_ratings", {})
    baseline_ratings = {"sp_rating": "BBB+", "moodys_rating": "Baa1", "fitch_rating": "BBB"}
    for agency, baseline_rating in baseline_ratings.items():
        new_rating = credit.get(agency)
        if new_rating and new_rating != baseline_rating:
            alerts.append({
                "type": "CREDIT_RATING_CHANGE",
                "severity": "HIGH",
                "message": f"Credit rating changed: {agency} {baseline_rating} → {new_rating}",
            })
    
    # Notable events from AI
    notable = kpis.get("notable_events", [])
    for event in notable:
        alerts.append({
            "type": "NOTABLE_EVENT",
            "severity": "INFO",
            "message": event,
        })
    
    if alerts:
        print(f"   ⚠️ {len(alerts)} alerts generated")
        for a in alerts:
            print(f"      [{a['severity']}] {a['message']}")
    else:
        print("   ✓ No alerts — all metrics within expected range")
    
    return alerts


def update_dashboard_data(kpis):
    """Update the main dashboard_data.json with new earnings data."""
    dashboard_file = OUTPUT_DIR / "dashboard_data.json"
    
    if dashboard_file.exists():
        with open(dashboard_file) as f:
            dashboard = json.load(f)
    else:
        dashboard = {}
    
    dashboard["earnings_latest"] = {
        "updated_at": datetime.now().isoformat(),
        "kpis": kpis,
    }
    
    with open(dashboard_file, 'w') as f:
        json.dump(dashboard, f, indent=2, default=str)
    
    print(f"   ✓ Dashboard → {dashboard_file}")


def print_summary(kpis, comparison, alerts):
    """Print a formatted summary."""
    print("\n" + "═" * 60)
    print("  EXTRACTION SUMMARY")
    print("═" * 60)
    
    doc = kpis.get("document_info", {})
    print(f"  📄 Document: {doc.get('document_type', 'N/A')}")
    print(f"  📅 Period: {doc.get('reporting_period', 'N/A')} {doc.get('reporting_year', '')}")
    
    stats = kpis.get("extraction_stats", {})
    print(f"  🎯 Extraction: {stats.get('kpis_extracted', 'N/A')} KPIs | {stats.get('confidence', 'N/A')} confidence")
    
    print(f"\n  KEY METRICS EXTRACTED:")
    key_fields = [
        ("Property Sales", "property_sales_aed_b", "AED B"),
        ("Revenue", "revenue_aed_b", "AED B"),
        ("Net Profit", "net_profit_pretax_aed_b", "AED B"),
        ("EBITDA", "ebitda_aed_b", "AED B"),
        ("Backlog", "revenue_backlog_aed_b", "AED B"),
        ("Recurring Rev", "recurring_revenue_aed_b", "AED B"),
        ("Intl Sales", "intl_sales_aed_b", "AED B"),
        ("Mall Rev", "mall_revenue_aed_b", "AED B"),
        ("Hotel Rev", "hotel_revenue_aed_b", "AED B"),
    ]
    
    for label, field, unit in key_fields:
        val = kpis.get(field)
        if val is not None:
            print(f"    ✓ {label}: {val} {unit}")
        else:
            print(f"    ✗ {label}: not found")
    
    if alerts:
        print(f"\n  ⚠️ {len(alerts)} ALERTS")
    
    print(f"\n  📁 Files saved to: {OUTPUT_DIR}/")
    print("═" * 60 + "\n")


def run_demo():
    """Run with sample text from the verified FY 2025 earnings."""
    print("\n🧪 RUNNING DEMO with FY 2025 sample text...\n")
    
    sample_text = """
    Dubai, UAE – 12 February 2026: Emaar Properties PJSC (DFM: EMAAR) reported 
    a solid financial and operational performance for the full year 2025, supported 
    by sustained demand across its core businesses.
    
    Emaar's diversified portfolio and strategic focus on quality, customer experience, 
    and sustainability have driven consistent growth across its property development, 
    retail, hospitality, and international businesses.
    
    Property sales rose 16% year-on-year to AED 80.4 billion (US$21.9 billion), 
    while revenue increased 40% to AED 49.6 billion (US$13.5 billion).
    
    Net profit before tax grew 36% to AED 25.7 billion (US$7 billion), and EBITDA 
    reached AED 25.6 billion (US$7 billion), up 33% from 2024.
    
    Revenue backlog rose 39% to AED 155 billion (US$42.1 billion), providing 
    visibility on future earnings.
    
    Net profit attributable to owners reached AED 17.6 billion (US$4.8 billion), 
    up 30% year-on-year.
    
    International property sales surged 124% to AED 9.3 billion (US$2.5 billion), 
    with revenue of AED 2.6 billion across Egypt and India.
    
    Emaar's malls, retail and commercial leasing revenue rose 13% to AED 6.3 billion, 
    with 98% occupancy. Dubai Mall attracted 111 million visitors.
    
    Hospitality, leisure and entertainment revenue increased 12% to AED 4.2 billion, 
    supported by strong tourism inflows and three new hotels. UAE hotels maintained 
    average occupancy of 82%.
    
    Recurring revenue from malls, hotels, and commercial leasing reached AED 10.5 
    billion, up 13%.
    
    During 2025, the company launched 48 new residential projects across its 
    communities. Emaar has delivered 79,000+ units since 2002.
    
    Emaar Development PJSC recorded property sales of AED 71.1 billion, up 9%. 
    Revenue rose 44% to AED 27.5 billion. Net profit before tax climbed 52% to 
    AED 15.5 billion.
    
    The company's land bank covers approximately 618 million sq. ft., with 344 
    million sq. ft. in the UAE. 36 million sq. ft. acquired in 2025.
    
    Credit ratings: S&P BBB+ (upgraded March 2025) | Moody's Baa1 | Fitch BBB 
    — All stable outlook.
    
    The Board recommended maintaining dividends at 100% of share capital for 2025, 
    totaling AED 8.9 billion (AED 1.0 per share). EPS: AED 2.0.
    
    Emaar also announced ultra-luxury residential community Emaar Hills and 
    continued development of Grand Polo Club and Resort and Dubai Square.
    """
    
    from parsers.kpi_extractor import extract_all_kpis
    
    print("🔍 Extracting KPIs from sample text...\n")
    kpis = extract_all_kpis(sample_text)
    
    comparison = compare_with_baseline(kpis, BASELINE_FY2025)
    alerts = generate_alerts(kpis, comparison)
    
    # Save outputs
    output = {
        "processed_at": datetime.now().isoformat(),
        "source": "DEMO — FY 2025 sample text",
        "extracted_kpis": kpis,
        "comparison_vs_baseline": comparison,
        "alerts": alerts,
    }
    
    output_file = OUTPUT_DIR / "earnings_extracted.json"
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2, default=str)
    
    print_summary(kpis, comparison, alerts)
    return output


def main():
    parser = argparse.ArgumentParser(description="Emaar Earnings PDF Processor")
    parser.add_argument("pdf_path", nargs="?", help="Path to earnings PDF")
    parser.add_argument("--ai", action="store_true", help="Enable AI-powered extraction (needs ANTHROPIC_API_KEY)")
    parser.add_argument("--demo", action="store_true", help="Run demo with sample FY 2025 text")
    args = parser.parse_args()
    
    if args.demo:
        run_demo()
    elif args.pdf_path:
        process_earnings_pdf(args.pdf_path, use_ai=args.ai)
    else:
        print("Usage:")
        print("  python parsers/earnings_processor.py <path_to_pdf>        # Process a PDF")
        print("  python parsers/earnings_processor.py <path_to_pdf> --ai   # With AI extraction")
        print("  python parsers/earnings_processor.py --demo               # Run demo")


if __name__ == "__main__":
    main()
