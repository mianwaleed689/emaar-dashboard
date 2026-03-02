"""
KPI EXTRACTOR — Pattern-Based Financial Data Extraction
Pulls 25+ KPIs from Emaar earnings text using regex patterns.
Works independently of the AI extractor as a reliable fallback.

Each KPI has multiple patterns to handle different PDF layouts
across quarterly, half-year, and annual reports.

Usage:
    from parsers.kpi_extractor import extract_all_kpis
    kpis = extract_all_kpis(earnings_text)
"""

import re
from typing import Optional


def _find_number(text, patterns, multiplier=1.0):
    """
    Search text for a number matching any of the given patterns.
    Returns the first match found, multiplied by the multiplier.
    
    Handles formats like:
        "AED 49.6 billion" → 49.6
        "AED49.6B" → 49.6
        "49.6 billion" → 49.6
        "US$ 13.5 billion" → 13.5
        "AED 1,500,000" → 1500000
    """
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            # Get the number from the first capturing group
            num_str = match.group(1).replace(",", "").strip()
            try:
                value = float(num_str) * multiplier
                return round(value, 2)
            except ValueError:
                continue
    return None


def _find_percentage(text, patterns):
    """Find a percentage value from patterns."""
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            num_str = match.group(1).replace(",", "").strip()
            try:
                return round(float(num_str), 1)
            except ValueError:
                continue
    return None


def extract_property_sales(text):
    """Extract total group property sales."""
    patterns = [
        r'[Pp]roperty\s+sales\s+(?:rose|increased|grew)\s+\d+%\s+(?:year.on.year\s+)?to\s+AED\s*([\d.]+)\s*(?:billion|bn|B)',
        r'(?:group\s+)?property\s+sales\s+(?:of\s+)?(?:reached?\s+)?AED\s*([\d.]+)\s*(?:billion|bn|B)\s*\(US\$?\s*[\d.]+',
        r'(?:highest.ever\s+)?property\s+sales\s+of\s+AED\s*\.?([\d.]+)\s*(?:billion|bn|B)',
        r'AED\s*([\d.]+)\s*(?:billion|bn|B)\s*(?:\([^)]+\)\s*)?(?:in\s+)?property\s+sales',
    ]
    return _find_number(text, patterns)


def extract_revenue(text):
    """Extract total group revenue."""
    patterns = [
        r"(?:highest\s+ever\s+)?(?:total\s+)?(?:group\s+)?revenue\s+(?:for\s+the\s+(?:year|period)\s+)?(?:of\s+)?(?:reached?\s+)?(?:AED\s+)?([\d.]+)\s*(?:billion|bn|B)(?:\s*\(US)",
        r"revenue\s+(?:increased|rose|grew|surged)\s+\d+%\s+(?:year.on.year\s+)?to\s+(?:a\s+record\s+)?AED\s*\.?([\d.]+)\s*(?:billion|bn|B)",
        r"(?:highest\s+ever\s+)?revenue\s+(?:of\s+)?(?:reaching?\s+)?AED\s*\.?([\d.]+)\s*(?:billion|bn|B)",
        r"revenue\s*[:\s]+AED\s*([\d.]+)\s*(?:billion|bn|B)",
    ]
    return _find_number(text, patterns)


def extract_net_profit(text):
    """Extract net profit before tax."""
    patterns = [
        r"net\s+profit\s+(?:before\s+tax\s+)?(?:of\s+)?(?:reached?\s+)?(?:AED\s+)?([\d.]+)\s*(?:billion|bn|B)",
        r"net\s+profit\s+(?:before\s+tax\s+)?(?:rose|increased|grew)\s+.*?AED\s*([\d.]+)\s*(?:billion|bn|B)",
        r"net\s+profit\s*[:\s]+AED\s*([\d.]+)\s*(?:billion|bn|B)",
        r"profit\s+before\s+tax\s+(?:of\s+)?(?:reached?\s+)?AED\s*([\d.]+)\s*(?:billion|bn|B)",
    ]
    return _find_number(text, patterns)


def extract_net_profit_attributable(text):
    """Extract net profit attributable to owners."""
    patterns = [
        r"net\s+profit\s+(?:\()?attributable\s+(?:to\s+(?:the\s+)?owners?\s*(?:\))?\s+)?(?:of\s+)?(?:reached?\s+)?(?:AED\s+)?([\d.]+)\s*(?:billion|bn|B)",
        r"profit\s+attributable\s+.*?AED\s*([\d.]+)\s*(?:billion|bn|B)",
        r"attributable\s+(?:net\s+)?profit\s*[:\s]+AED\s*([\d.]+)\s*(?:billion|bn|B)",
    ]
    return _find_number(text, patterns)


def extract_ebitda(text):
    """Extract EBITDA."""
    patterns = [
        r"EBITDA\s+(?:of\s+)?(?:reached?\s+)?(?:AED\s+)?([\d.]+)\s*(?:billion|bn|B)",
        r"EBITDA\s+(?:rose|increased|grew)\s+.*?AED\s*([\d.]+)\s*(?:billion|bn|B)",
        r"EBITDA\s*[:\s]+AED\s*([\d.]+)\s*(?:billion|bn|B)",
    ]
    return _find_number(text, patterns)


def extract_revenue_backlog(text):
    """Extract revenue backlog from property sales."""
    patterns = [
        r"[Rr]evenue\s+backlog\s+(?:rose|increased|grew|reached)\s+\d+%\s+to\s+AED\s*([\d.]+)\s*(?:billion|bn|B)",
        r"[Rr]evenue\s+backlog\s+(?:reached?\s+)?(?:of\s+)?(?:AED\s+)?([\d.]+)\s*(?:billion|bn|B)",
        r"backlog\s+(?:from\s+)?(?:property\s+)?(?:sales\s+)?(?:reached?\s+)?(?:stood\s+at\s+)?(?:approximately\s+)?(?:AED\s+)?([\d.]+)\s*(?:billion|bn|B)",
        r"AED\s*([\d.]+)\s*(?:billion|bn|B)\s*(?:\([^)]+\)\s*)?(?:revenue\s+)?backlog",
    ]
    return _find_number(text, patterns)


def extract_recurring_revenue(text):
    """Extract recurring revenue (malls, hospitality, leasing)."""
    patterns = [
        r"recurring\s+revenue\s+.*?(?:reached?\s+)?(?:AED\s+)?([\d.]+)\s*(?:billion|bn|B)",
        r"recurring\s+revenue\s*[:\s]+AED\s*([\d.]+)\s*(?:billion|bn|B)",
        r"(?:malls?,?\s+)?(?:hospitality,?\s+)?(?:leisure,?\s+)?(?:entertainment,?\s+)?(?:and\s+)?(?:commercial\s+)?leasing\s+(?:reached?\s+)?(?:AED\s+)?([\d.]+)\s*(?:billion|bn|B)\s+in\s+revenue",
    ]
    return _find_number(text, patterns)


def extract_intl_sales(text):
    """Extract international property sales."""
    patterns = [
        r"international\s+(?:property\s+)?sales\s+(?:of\s+)?(?:reached?\s+)?(?:surged\s+.*?)?(?:AED\s+)?([\d.]+)\s*(?:billion|bn|B)",
        r"intl?\s+sales\s*[:\s]+AED\s*([\d.]+)\s*(?:billion|bn|B)",
        r"international\s+(?:operations?\s+)?(?:recorded?\s+)?(?:property\s+)?sales\s+(?:of\s+)?AED\s*([\d.]+)\s*(?:billion|bn|B)",
    ]
    return _find_number(text, patterns)


def extract_mall_revenue(text):
    """Extract malls, retail and leasing revenue."""
    patterns = [
        r"malls?,?\s+retail\s+(?:and\s+)?(?:commercial\s+)?leasing\s+revenue\s+(?:of\s+)?(?:rose\s+.*?)?(?:AED\s+)?([\d.]+)\s*(?:billion|bn|B)",
        r"malls?\s+(?:and\s+)?(?:retail\s+)?(?:leasing\s+)?revenue\s*[:\s]+AED\s*([\d.]+)\s*(?:billion|bn|B)",
        r"retail\s+(?:and\s+)?(?:commercial\s+)?leasing\s+(?:portfolio\s+)?(?:generated?\s+)?AED\s*([\d.]+)\s*(?:billion|bn|B)",
    ]
    return _find_number(text, patterns)


def extract_hotel_revenue(text):
    """Extract hospitality, leisure and entertainment revenue."""
    patterns = [
        r"[Hh]ospitality,?\s+(?:leisure,?\s+)?(?:and\s+)?(?:entertainment\s+)?revenue\s+(?:increased|rose|grew)\s+\d+%\s+(?:year.on.year\s+)?to\s+AED\s*([\d.]+)\s*(?:billion|bn|B)",
        r"[Hh]ospitality,?\s+(?:leisure,?\s+)?(?:and\s+)?(?:entertainment\s+)?(?:businesses?\s+)?(?:posted\s+)?revenue\s+(?:of\s+)?AED\s*([\d.]+)\s*(?:billion|bn|B)",
        r"hospitality\s+revenue\s*[:\s]+AED\s*([\d.]+)\s*(?:billion|bn|B)",
    ]
    return _find_number(text, patterns)


def extract_mall_occupancy(text):
    """Extract mall occupancy rate."""
    patterns = [
        r"(?:mall|retail)\s+(?:average\s+)?occupancy\s+(?:across\s+malls?\s+)?(?:at\s+)?(?:of\s+)?([\d.]+)\s*%",
        r"(?:with|at)\s+([\d.]+)\s*%\s*(?:mall\s+)?occupancy",
        r"occupancy\s+(?:across\s+)?malls?\s+(?:at\s+)?([\d.]+)",
    ]
    return _find_percentage(text, patterns)


def extract_new_launches(text):
    """Extract number of new project launches."""
    patterns = [
        r"(?:launched?\s+)([\d]+)\s+(?:new\s+)?(?:residential\s+)?projects?",
        r"([\d]+)\s+(?:new\s+)?(?:residential\s+)?projects?\s+(?:were\s+)?(?:launched|introduced|unveiled)",
        r"launch\s+of\s+([\d]+)\s+(?:new\s+)?projects?",
    ]
    return _find_number(text, patterns)


def extract_units_delivered(text):
    """Extract cumulative units delivered."""
    patterns = [
        r"([\d,]+)\s*\+?\s*(?:residential\s+)?units?\s+(?:delivered|completed|handed\s+over)(?:\s+since\s+2002)?",
        r"delivered\s+(?:approximately\s+)?(?:over\s+)?([\d,]+)\s*\+?\s*(?:residential\s+)?units?",
    ]
    result = _find_number(text, patterns)
    if result and result < 1000:
        result = result * 1000  # Fix if extracted as "79" instead of "79000"
    return result


def extract_land_bank(text):
    """Extract land bank size."""
    patterns = [
        r"land\s+bank\s+(?:of\s+)?(?:approximately\s+)?([\d,]+)\s*(?:million\s+)?sq(?:uare)?\s*\.?\s*ft",
        r"([\d,]+)\s*(?:million\s+)?sq(?:uare)?\s*\.?\s*ft\.?\s*(?:of\s+)?(?:land|development)",
    ]
    return _find_number(text, patterns)


def extract_yoy_growth_rates(text):
    """Extract year-over-year growth percentages."""
    growth = {}
    
    # Revenue growth
    patterns = [
        r"revenue\s+.*?(?:increase|growth|grew|rose|up)\s+(?:of\s+)?([\d.]+)\s*%",
        r"revenue\s+.*?([\d.]+)\s*%\s+(?:increase|growth|year.on.year)",
    ]
    growth["revenue_yoy_pct"] = _find_percentage(text, patterns)
    
    # Profit growth
    patterns = [
        r"(?:net\s+)?profit\s+.*?(?:increase|growth|grew|rose|up)\s+(?:of\s+)?([\d.]+)\s*%",
        r"(?:net\s+)?profit\s+.*?([\d.]+)\s*%\s+(?:increase|growth)",
    ]
    growth["net_profit_yoy_pct"] = _find_percentage(text, patterns)
    
    # EBITDA growth
    patterns = [
        r"EBITDA\s+.*?(?:increase|growth|grew|rose|up)\s+(?:of\s+)?([\d.]+)\s*%",
        r"EBITDA\s+.*?([\d.]+)\s*%\s+(?:increase|growth)",
    ]
    growth["ebitda_yoy_pct"] = _find_percentage(text, patterns)
    
    # Property sales growth
    patterns = [
        r"property\s+sales\s+.*?(?:increase|growth|grew|rose|up)\s+(?:of\s+)?([\d.]+)\s*%",
        r"sales\s+.*?([\d.]+)\s*%\s+(?:increase|growth|year.on.year)",
    ]
    growth["property_sales_yoy_pct"] = _find_percentage(text, patterns)
    
    # International sales growth
    patterns = [
        r"international\s+.*?(?:increase|growth|surged?)\s+(?:of\s+)?([\d.]+)\s*%",
        r"([\d.]+)\s*%\s+(?:increase|growth)\s+.*?international",
    ]
    growth["intl_sales_yoy_pct"] = _find_percentage(text, patterns)
    
    # Backlog growth
    patterns = [
        r"backlog\s+.*?(?:increase|growth|grew|rose)\s+(?:of\s+)?([\d.]+)\s*%",
    ]
    growth["backlog_yoy_pct"] = _find_percentage(text, patterns)
    
    return growth


def extract_emaar_dev_kpis(text):
    """Extract Emaar Development-specific KPIs."""
    dev = {}
    
    # EmaarDev property sales
    patterns = [
        r"Emaar\s+Development\s+.*?property\s+sales\s+(?:of\s+)?(?:reached?\s+)?(?:AED\s+)?([\d.]+)\s*(?:billion|bn|B)",
        r"Emaar\s+Development\s+(?:achieved?\s+)?(?:property\s+)?sales\s+(?:of\s+)?AED\s*([\d.]+)\s*(?:billion|bn|B)",
    ]
    dev["emaardev_sales_aed_b"] = _find_number(text, patterns)
    
    # EmaarDev revenue
    patterns = [
        r"Emaar\s+Development(?:'s)?\s+revenue\s+(?:rose\s+to\s+)?(?:of\s+)?AED\s*([\d.]+)\s*(?:billion|bn|B)",
    ]
    dev["emaardev_revenue_aed_b"] = _find_number(text, patterns)
    
    # EmaarDev net profit
    patterns = [
        r"Emaar\s+Development\s+.*?net\s+profit\s+(?:before\s+tax\s+)?(?:of\s+)?(?:reached?\s+)?AED\s*([\d.]+)\s*(?:billion|bn|B)",
    ]
    dev["emaardev_net_profit_aed_b"] = _find_number(text, patterns)
    
    return dev


def extract_credit_info(text):
    """Extract credit rating information."""
    credit = {}
    
    # S&P
    sp_match = re.search(r"S&P\s*(?:Global)?\s*[:\s]*([A-D][A-D]?[A-D]?[+-]?)", text, re.IGNORECASE)
    if sp_match:
        credit["sp_rating"] = sp_match.group(1).strip()
    
    # Moody's
    moodys_match = re.search(r"Moody'?s\s*[:\s]*((?:Baa|Ba|B|Aaa|Aa|A)[123]?)", text, re.IGNORECASE)
    if moodys_match:
        credit["moodys_rating"] = moodys_match.group(1).strip()
    
    # Fitch
    fitch_match = re.search(r"Fitch\s*[:\s]*([A-D][A-D]?[A-D]?[+-]?)", text, re.IGNORECASE)
    if fitch_match:
        credit["fitch_rating"] = fitch_match.group(1).strip()
    
    return credit


def extract_all_kpis(text):
    """
    Master function — extracts all available KPIs from earnings text.
    Returns a structured dict ready for dashboard consumption.
    """
    from parsers.pdf_parser import clean_text, identify_document_type
    
    cleaned = clean_text(text)
    doc_info = identify_document_type(text)
    
    kpis = {
        "extraction_method": "regex_pattern_matching",
        "document_info": doc_info,
        
        # Core financials (AED Billions)
        "property_sales_aed_b": extract_property_sales(cleaned),
        "revenue_aed_b": extract_revenue(cleaned),
        "net_profit_pretax_aed_b": extract_net_profit(cleaned),
        "net_profit_attr_aed_b": extract_net_profit_attributable(cleaned),
        "ebitda_aed_b": extract_ebitda(cleaned),
        "revenue_backlog_aed_b": extract_revenue_backlog(cleaned),
        "recurring_revenue_aed_b": extract_recurring_revenue(cleaned),
        
        # Segment data
        "intl_sales_aed_b": extract_intl_sales(cleaned),
        "mall_revenue_aed_b": extract_mall_revenue(cleaned),
        "hotel_revenue_aed_b": extract_hotel_revenue(cleaned),
        "mall_occupancy_pct": extract_mall_occupancy(cleaned),
        
        # Operations
        "new_project_launches": extract_new_launches(cleaned),
        "units_delivered_cumulative": extract_units_delivered(cleaned),
        "land_bank_sqft_m": extract_land_bank(cleaned),
        
        # Growth rates
        "yoy_growth": extract_yoy_growth_rates(cleaned),
        
        # Emaar Development
        "emaar_development": extract_emaar_dev_kpis(cleaned),
        
        # Credit
        "credit_ratings": extract_credit_info(cleaned),
    }
    
    # Count how many KPIs were extracted
    extracted = sum(1 for k, v in kpis.items() 
                    if v is not None and k not in ["extraction_method", "document_info", "yoy_growth", "emaar_development", "credit_ratings"])
    total_fields = 14  # Number of top-level numeric KPIs
    
    kpis["extraction_stats"] = {
        "kpis_extracted": extracted,
        "total_possible": total_fields,
        "extraction_rate_pct": round((extracted / total_fields) * 100, 1),
        "confidence": "HIGH" if extracted >= 10 else "MEDIUM" if extracted >= 6 else "LOW",
    }
    
    return kpis


if __name__ == "__main__":
    # Test with a sample text
    sample = """
    Emaar Properties reported record financial results for 2025. 
    Property sales rose 16% year-on-year to AED 80.4 billion (US$21.9 billion).
    Revenue increased 40% to AED 49.6 billion (US$13.5 billion).
    Net profit before tax grew 36% to AED 25.7 billion (US$7 billion).
    EBITDA reached AED 25.6 billion, up 33% from 2024.
    Revenue backlog rose 39% to AED 155 billion (US$42.1 billion).
    International property sales surged 124% to AED 9.3 billion.
    Malls, retail and commercial leasing revenue rose 13% to AED 6.3 billion.
    Hospitality, leisure and entertainment revenue increased 12% to AED 4.2 billion.
    Recurring revenue reached AED 10.5 billion, up 13%.
    During 2025, the company launched 48 new residential projects.
    Emaar Development achieved property sales of AED 71.1 billion.
    Mall occupancy at 98%.
    S&P: BBB+ | Moody's: Baa1 | Fitch: BBB
    """
    
    kpis = extract_all_kpis(sample)
    
    print("\n" + "=" * 50)
    print("  KPI EXTRACTION TEST")
    print("=" * 50)
    for k, v in kpis.items():
        if k in ["extraction_method", "document_info", "extraction_stats"]:
            continue
        if isinstance(v, dict):
            print(f"\n  {k}:")
            for sk, sv in v.items():
                print(f"    {sk}: {sv}")
        else:
            status = "✓" if v is not None else "✗"
            print(f"  {status} {k}: {v}")
    
    stats = kpis["extraction_stats"]
    print(f"\n  📊 Extracted: {stats['kpis_extracted']}/{stats['total_possible']} ({stats['extraction_rate_pct']}%)")
    print(f"  🎯 Confidence: {stats['confidence']}")
