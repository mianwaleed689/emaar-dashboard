"""
AI EXTRACTOR — Claude-Powered Intelligent KPI Extraction
Uses the Anthropic API to extract KPIs that regex can't reliably catch.
Falls back to regex extraction if API is unavailable.

Setup:
    export ANTHROPIC_API_KEY="your-key-here"
    pip install anthropic

Usage:
    from parsers.ai_extractor import ai_extract_kpis
    kpis = ai_extract_kpis(earnings_text)
"""

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

# The prompt template for Claude to extract KPIs
EXTRACTION_PROMPT = """You are a financial data extraction specialist for Emaar Properties PJSC.

Extract ALL available financial KPIs from the following earnings text. Return ONLY a valid JSON object with no additional text.

Use these exact field names and return numbers in billions (AED) where applicable:

{{
  "reporting_period": "FY 2025 / 9M 2025 / H1 2025 / Q1 2025 etc.",
  "reporting_year": 2025,
  
  "property_sales_aed_b": null,
  "revenue_aed_b": null,
  "net_profit_pretax_aed_b": null,
  "net_profit_attr_aed_b": null,
  "ebitda_aed_b": null,
  "ebitda_margin_pct": null,
  "net_margin_pct": null,
  "gross_profit_aed_b": null,
  
  "revenue_backlog_aed_b": null,
  "recurring_revenue_aed_b": null,
  "recurring_ebitda_aed_b": null,
  
  "intl_sales_aed_b": null,
  "intl_revenue_aed_b": null,
  
  "mall_revenue_aed_b": null,
  "mall_ebitda_aed_b": null,
  "mall_occupancy_pct": null,
  "dubai_mall_footfall_m": null,
  
  "hotel_revenue_aed_b": null,
  "hotel_occupancy_pct": null,
  "new_hotels_added": null,
  
  "uae_dev_revenue_aed_b": null,
  "uae_dev_backlog_aed_b": null,
  
  "emaardev_sales_aed_b": null,
  "emaardev_revenue_aed_b": null,
  "emaardev_profit_aed_b": null,
  
  "new_project_launches": null,
  "units_delivered_cumulative": null,
  "units_under_development": null,
  "land_bank_sqft_m": null,
  "land_acquired_sqft_m": null,
  
  "dividend_per_share_aed": null,
  "dividend_total_aed_b": null,
  "eps_aed": null,
  
  "sp_rating": null,
  "moodys_rating": null,
  "fitch_rating": null,
  
  "revenue_yoy_pct": null,
  "profit_yoy_pct": null,
  "ebitda_yoy_pct": null,
  "sales_yoy_pct": null,
  "intl_sales_yoy_pct": null,
  "backlog_yoy_pct": null,
  "recurring_rev_yoy_pct": null,
  "mall_rev_yoy_pct": null,
  "hotel_rev_yoy_pct": null,
  
  "notable_events": []
}}

Rules:
- Return null for any KPI not found in the text
- Numbers should be in AED billions (e.g., 49.6 not 49,600,000,000)
- Percentages as plain numbers (e.g., 40 not 0.40)
- notable_events: list of strings for any significant announcements (new communities, mega projects, strategic updates)
- ONLY return valid JSON, no markdown, no explanation

EARNINGS TEXT:
{text}
"""


def ai_extract_kpis(text, max_chars=12000):
    """
    Use Claude API to intelligently extract KPIs from earnings text.
    
    Args:
        text: Raw earnings text
        max_chars: Max characters to send (to manage token usage)
    
    Returns:
        dict of extracted KPIs, or None if API unavailable
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    
    if not api_key:
        print("   ⚠️ ANTHROPIC_API_KEY not set — falling back to regex extraction")
        print("   💡 Set it with: export ANTHROPIC_API_KEY='your-key-here'")
        return None
    
    try:
        import anthropic
    except ImportError:
        print("   ⚠️ anthropic package not installed — falling back to regex")
        print("   💡 Install with: pip install anthropic")
        return None
    
    print("   🤖 Using Claude API for intelligent extraction...")
    
    # Truncate text if too long
    if len(text) > max_chars:
        text = text[:max_chars]
        print(f"   📝 Text truncated to {max_chars:,} chars")
    
    try:
        client = anthropic.Anthropic(api_key=api_key)
        
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[
                {
                    "role": "user",
                    "content": EXTRACTION_PROMPT.format(text=text)
                }
            ]
        )
        
        # Extract JSON from response
        response_text = message.content[0].text.strip()
        
        # Clean up any markdown formatting
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip("`").strip()
        
        kpis = json.loads(response_text)
        kpis["extraction_method"] = "claude_ai"
        
        # Count extracted
        extracted = sum(1 for k, v in kpis.items() 
                       if v is not None and k not in ["extraction_method", "reporting_period", "reporting_year", "notable_events"])
        total = 40  # approximate total fields
        
        kpis["extraction_stats"] = {
            "kpis_extracted": extracted,
            "total_possible": total,
            "extraction_rate_pct": round((extracted / total) * 100, 1),
            "confidence": "VERY HIGH" if extracted >= 25 else "HIGH" if extracted >= 15 else "MEDIUM",
            "model_used": "claude-sonnet-4-20250514",
        }
        
        print(f"   ✓ AI extracted {extracted}/{total} KPIs ({kpis['extraction_stats']['extraction_rate_pct']}%)")
        return kpis
        
    except json.JSONDecodeError as e:
        print(f"   ❌ Failed to parse AI response as JSON: {e}")
        return None
    except Exception as e:
        print(f"   ❌ AI extraction failed: {e}")
        return None


def merge_extractions(regex_kpis, ai_kpis):
    """
    Merge regex and AI extractions, preferring AI for complex fields
    and regex for simple numeric fields where it's reliable.
    
    Strategy:
    - Core numbers (revenue, profit, sales): Use regex if available (more precise)
    - Growth rates: Prefer AI (better at context)
    - Qualitative data: AI only (notable events, etc.)
    - Fill gaps: Use whichever has data
    """
    if not ai_kpis:
        return regex_kpis
    if not regex_kpis:
        return ai_kpis
    
    merged = {"extraction_method": "merged (regex + AI)"}
    
    # Core financials — prefer regex (precise pattern matching)
    core_fields = [
        "property_sales_aed_b", "revenue_aed_b", "net_profit_pretax_aed_b",
        "net_profit_attr_aed_b", "ebitda_aed_b", "revenue_backlog_aed_b",
        "recurring_revenue_aed_b", "intl_sales_aed_b", "mall_revenue_aed_b",
        "hotel_revenue_aed_b", "mall_occupancy_pct", "new_project_launches",
        "units_delivered_cumulative", "land_bank_sqft_m",
    ]
    
    for field in core_fields:
        regex_val = regex_kpis.get(field)
        ai_val = ai_kpis.get(field)
        
        if regex_val is not None:
            merged[field] = regex_val
        elif ai_val is not None:
            merged[field] = ai_val
        else:
            merged[field] = None
    
    # AI-exclusive fields (regex can't extract these reliably)
    ai_exclusive = [
        "ebitda_margin_pct", "net_margin_pct", "gross_profit_aed_b",
        "recurring_ebitda_aed_b", "intl_revenue_aed_b", "mall_ebitda_aed_b",
        "dubai_mall_footfall_m", "hotel_occupancy_pct", "new_hotels_added",
        "uae_dev_revenue_aed_b", "uae_dev_backlog_aed_b",
        "units_under_development", "land_acquired_sqft_m",
        "dividend_per_share_aed", "dividend_total_aed_b", "eps_aed",
        "notable_events", "reporting_period", "reporting_year",
    ]
    
    for field in ai_exclusive:
        merged[field] = ai_kpis.get(field)
    
    # Growth rates — merge from both
    regex_growth = regex_kpis.get("yoy_growth", {})
    ai_growth = {}
    for key in ["revenue_yoy_pct", "profit_yoy_pct", "ebitda_yoy_pct", 
                 "sales_yoy_pct", "intl_sales_yoy_pct", "backlog_yoy_pct",
                 "recurring_rev_yoy_pct", "mall_rev_yoy_pct", "hotel_rev_yoy_pct"]:
        ai_growth[key] = ai_kpis.get(key)
    
    merged["yoy_growth"] = {}
    all_growth_keys = set(list(regex_growth.keys()) + list(ai_growth.keys()))
    for key in all_growth_keys:
        r = regex_growth.get(key) or regex_growth.get(key.replace("_yoy_pct", "_yoy_pct"))
        a = ai_growth.get(key)
        merged["yoy_growth"][key] = a if a is not None else r
    
    # Credit ratings — merge
    merged["credit_ratings"] = regex_kpis.get("credit_ratings", {})
    for rating_key in ["sp_rating", "moodys_rating", "fitch_rating"]:
        ai_rating = ai_kpis.get(rating_key)
        if ai_rating:
            merged["credit_ratings"][rating_key] = ai_rating
    
    # Emaar Development
    merged["emaar_development"] = regex_kpis.get("emaar_development", {})
    for key in ["emaardev_sales_aed_b", "emaardev_revenue_aed_b", "emaardev_profit_aed_b"]:
        ai_val = ai_kpis.get(key)
        if ai_val is not None:
            merged["emaar_development"][key] = ai_val
    
    # Document info
    merged["document_info"] = ai_kpis.get("document_info") or regex_kpis.get("document_info", {})
    
    # Stats
    extracted = sum(1 for k, v in merged.items() 
                   if v is not None and not isinstance(v, dict) and k not in ["extraction_method"])
    merged["extraction_stats"] = {
        "kpis_extracted": extracted,
        "method": "merged",
        "regex_contribution": regex_kpis.get("extraction_stats", {}).get("kpis_extracted", 0),
        "ai_contribution": ai_kpis.get("extraction_stats", {}).get("kpis_extracted", 0),
        "confidence": "VERY HIGH" if extracted >= 20 else "HIGH",
    }
    
    return merged


if __name__ == "__main__":
    print("AI Extractor — requires ANTHROPIC_API_KEY environment variable")
    print("Run via: python parsers/earnings_processor.py <pdf_path>")
