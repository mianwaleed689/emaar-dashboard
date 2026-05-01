/* �”€�”€�”€ DXB ANALYTICS �€” UTILITY FORMATTERS �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
   Standardised formatting functions used across the entire platform.
   Import: import { formatCurrency, formatDate, formatPercentage } from './utils/formatters';
   �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€ */

/**
 * Format a number as AED currency.
 * Automatically abbreviates millions (M) and thousands (K).
 * @param {number} value
 * @param {string} currency - defaults to 'AED'
 * @returns {string} e.g. "AED 2.50M" | "AED 500K" | "AED 12,500" | "�€”"
 */
export const formatCurrency = (value, currency = "AED") => {
  if (value === null || value === undefined || value === "") return "�€”";
  const n = Number(value);
  if (isNaN(n)) return "�€”";
  if (n >= 1_000_000_000) return `${currency} ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `${currency} ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)         return `${currency} ${(n / 1_000).toFixed(0)}K`;
  return `${currency} ${n.toLocaleString()}`;
};

/**
 * Format a number as AED currency �€” full value, no abbreviation.
 * @param {number} value
 * @returns {string} e.g. "AED 1,250,000"
 */
export const formatCurrencyFull = (value, currency = "AED") => {
  if (value === null || value === undefined || value === "") return "�€”";
  const n = Number(value);
  if (isNaN(n)) return "�€”";
  return `${currency} ${n.toLocaleString()}`;
};

/**
 * Format a date value.
 * @param {Date|string|number} date
 * @param {'short'|'long'|'iso'} format - defaults to 'short'
 * @returns {string} e.g. "9 Mar 2026" | "9 March 2026" | "2026-03-09"
 */
export const formatDate = (date, format = "short") => {
  if (!date) return "�€”";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "�€”";

  if (format === "short") {
    return d.toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" });
  }
  if (format === "long") {
    return d.toLocaleDateString("en-AE", { day: "numeric", month: "long", year: "numeric" });
  }
  if (format === "iso") {
    return d.toISOString().split("T")[0];
  }
  return d.toLocaleDateString();
};

/**
 * Format a number as a percentage.
 * @param {number} value
 * @param {number} decimals - decimal places, defaults to 1
 * @returns {string} e.g. "6.5%"
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || value === "") return "�€”";
  const n = Number(value);
  if (isNaN(n)) return "�€”";
  return `${n.toFixed(decimals)}%`;
};

/**
 * Format a plain number with thousand separators.
 * @param {number} value
 * @param {number} decimals - decimal places, defaults to 0
 * @returns {string} e.g. "22,514"
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || value === "") return "�€”";
  const n = Number(value);
  if (isNaN(n)) return "�€”";
  return n.toLocaleString("en-AE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format a date as relative time from now.
 * @param {Date|string|number} date
 * @returns {string} e.g. "2 hours ago" | "3 days ago" | "just now"
 */
export const formatRelativeTime = (date) => {
  if (!date) return "�€”";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "�€”";

  const diffMs   = Date.now() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHrs  = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  const diffWks  = Math.floor(diffDays / 7);
  const diffMths = Math.floor(diffDays / 30);

  if (diffSecs < 60)  return "just now";
  if (diffMins < 60)  return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHrs < 24)   return `${diffHrs} hour${diffHrs > 1 ? "s" : ""} ago`;
  if (diffDays < 7)   return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffWks < 5)    return `${diffWks} week${diffWks > 1 ? "s" : ""} ago`;
  if (diffMths < 12)  return `${diffMths} month${diffMths > 1 ? "s" : ""} ago`;
  return formatDate(d, "short");
};

/**
 * Format sqft value.
 * @param {number} value
 * @returns {string} e.g. "1,250 sqft"
 */
export const formatSqft = (value) => {
  if (!value) return "�€”";
  return `${Number(value).toLocaleString()} sqft`;
};
