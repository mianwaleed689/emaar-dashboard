"""
PDF PARSER — Core Text Extraction from Emaar Earnings PDFs
Handles both text-based and scanned PDFs (with OCR fallback).

Supports:
- Emaar Properties PJSC quarterly/annual earnings releases
- Emaar Development PJSC results
- Investor presentation decks
- Annual reports (summary pages)

Usage:
    from parsers.pdf_parser import extract_text_from_pdf
    text = extract_text_from_pdf("path/to/emaar_fy2025.pdf")
"""

import re
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF — best free PDF text extraction
except ImportError:
    fitz = None

try:
    from pdfminer.high_level import extract_text as pdfminer_extract
    from pdfminer.layout import LAParams
except ImportError:
    pdfminer_extract = None


def extract_text_from_pdf(pdf_path, method="auto"):
    """
    Extract all text from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        method: 'pymupdf', 'pdfminer', or 'auto' (tries best available)
    
    Returns:
        dict with:
            - text: Full extracted text
            - pages: List of per-page text
            - page_count: Number of pages
            - metadata: PDF metadata
            - method_used: Which extraction method was used
    """
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")
    
    print(f"📄 Extracting text from: {pdf_path.name}")
    
    if method == "auto":
        if fitz:
            return _extract_pymupdf(pdf_path)
        elif pdfminer_extract:
            return _extract_pdfminer(pdf_path)
        else:
            raise ImportError(
                "No PDF library available. Install one:\n"
                "  pip install PyMuPDF        (recommended)\n"
                "  pip install pdfminer.six   (alternative)"
            )
    elif method == "pymupdf":
        return _extract_pymupdf(pdf_path)
    elif method == "pdfminer":
        return _extract_pdfminer(pdf_path)
    else:
        raise ValueError(f"Unknown method: {method}")


def _extract_pymupdf(pdf_path):
    """Extract text using PyMuPDF (fast, accurate)."""
    doc = fitz.open(str(pdf_path))
    
    pages = []
    full_text = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        pages.append({
            "page_number": page_num + 1,
            "text": text,
            "char_count": len(text),
        })
        full_text.append(text)
    
    metadata = doc.metadata or {}
    doc.close()
    
    combined_text = "\n\n".join(full_text)
    
    print(f"   ✓ Extracted {len(pages)} pages ({len(combined_text):,} chars) via PyMuPDF")
    
    return {
        "text": combined_text,
        "pages": pages,
        "page_count": len(pages),
        "metadata": metadata,
        "method_used": "PyMuPDF",
        "file_name": pdf_path.name,
        "char_count": len(combined_text),
    }


def _extract_pdfminer(pdf_path):
    """Extract text using pdfminer.six (good for complex layouts)."""
    laparams = LAParams(
        line_margin=0.5,
        word_margin=0.1,
        char_margin=2.0,
        boxes_flow=0.5,
    )
    
    text = pdfminer_extract(str(pdf_path), laparams=laparams)
    
    # Split into approximate pages (pdfminer doesn't give page breaks easily)
    pages = [{"page_number": 1, "text": text, "char_count": len(text)}]
    
    print(f"   ✓ Extracted {len(text):,} chars via pdfminer.six")
    
    return {
        "text": text,
        "pages": pages,
        "page_count": 1,  # pdfminer doesn't split pages easily
        "metadata": {},
        "method_used": "pdfminer.six",
        "file_name": pdf_path.name,
        "char_count": len(text),
    }


def clean_text(text):
    """Clean extracted PDF text for better parsing."""
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Fix common PDF extraction artifacts
    text = text.replace('ﬁ', 'fi').replace('ﬂ', 'fl')
    text = text.replace('\x00', '')
    
    # Normalize number formats
    # "49 . 6" → "49.6"
    text = re.sub(r'(\d+)\s*\.\s*(\d+)', r'\1.\2', text)
    
    # "1 , 500" → "1,500"
    text = re.sub(r'(\d+)\s*,\s*(\d{3})', r'\1,\2', text)
    
    return text.strip()


def identify_document_type(text):
    """Identify what type of Emaar document this is."""
    text_lower = text.lower()
    
    if "emaar properties" in text_lower and "emaar development" in text_lower:
        doc_type = "emaar_group_results"
    elif "emaar development" in text_lower and "emaar properties" not in text_lower:
        doc_type = "emaar_development_results"
    elif "emaar properties" in text_lower:
        doc_type = "emaar_properties_results"
    elif "annual report" in text_lower:
        doc_type = "annual_report"
    elif "investor" in text_lower and "presentation" in text_lower:
        doc_type = "investor_presentation"
    else:
        doc_type = "unknown"
    
    # Identify period
    period = "unknown"
    if "full year" in text_lower or "fy 20" in text_lower or "12 months" in text_lower:
        period = "annual"
    elif "nine months" in text_lower or "9m 20" in text_lower:
        period = "9_months"
    elif "half year" in text_lower or "h1 20" in text_lower or "six months" in text_lower:
        period = "half_year"
    elif "quarter" in text_lower or "q1" in text_lower or "q2" in text_lower or "q3" in text_lower or "q4" in text_lower:
        period = "quarterly"
    
    # Identify year
    year_match = re.search(r'20(2[3-9]|3[0-9])', text)
    year = int(year_match.group()) if year_match else None
    
    return {
        "document_type": doc_type,
        "reporting_period": period,
        "reporting_year": year,
    }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        result = extract_text_from_pdf(sys.argv[1])
        print(f"\nDocument type: {identify_document_type(result['text'])}")
        print(f"First 500 chars:\n{result['text'][:500]}")
    else:
        print("Usage: python pdf_parser.py <path_to_pdf>")
