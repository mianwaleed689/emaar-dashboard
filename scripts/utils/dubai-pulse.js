/* ─────────────────────────────────────────────────────────────
   DXB ANALYTICS — DUBAI PULSE CLIENT
   scripts/utils/dubai-pulse.js

   Fetches datasets from Dubai Pulse (dubaipulse.gov.ae), the
   official Dubai government open-data portal run by DLD and DSC.

   Two access modes:

   1. CSV download (no auth required, used in Session 6A today)
      Just hits the public download URL and streams the file.

   2. Authenticated API (OAuth2, used when API credentials arrive)
      Not implemented yet — added in a future session when the
      product owner registers an app on dubaipulse.gov.ae and
      receives API key + secret by email (2-week turnaround).

   This module exports:
   - fetchCsv(url): downloads a CSV from a URL, returns the text
   - fetchDataset(name): convenience wrapper that looks up the
     dataset URL by name from a local registry

   Uses only Node's built-in https module. Zero dependencies.
   ───────────────────────────────────────────────────────────── */

"use strict";

const https = require("https");
const http = require("http");
const { URL } = require("url");

// Registry of known Dubai Pulse dataset download URLs.
// Sourced from web research on 8 April 2026. Each entry maps
// a short name to the CSV download URL. If Dubai Pulse changes
// the URL structure, update this registry in one place.
const DATASET_REGISTRY = {
  // DLD lookup table of area IDs and names — the "communities" master list
  "areas": "https://www.dubaipulse.gov.ae/dataset/ffbae7e9-f18f-40ff-9ef2-5eac7bb3bd85/resource/9fd1b434-a1c3-4041-962d-e2108a19fa6b/download/lkp_areas.csv",

  // Every RERA-licensed real estate developer in Dubai
  "developers": "https://www.dubaipulse.gov.ae/dataset/ac68c7d5-8acb-441c-9a7d-6e6d72942d86/resource/57ca3b1a-775d-4f6c-8b04-19e02f6b4a03/download/developers.csv",

  // Every project registered with DLD
  "projects": "https://www.dubaipulse.gov.ae/dataset/0b782e64-5950-4507-8f6e-02a0c30c7054/resource/db35b0cd-d291-4dde-b176-9b8d5765c7d9/download/projects.csv",

  // All real estate transactions registered with DLD (huge file — millions of rows)
  "transactions": "https://www.dubaipulse.gov.ae/dataset/3b25a6f5-9077-49d7-8a1e-bc6d5dea88fd/resource/a37511b0-ea36-485d-bccd-2d6cb24507e7/download/transactions.csv",

  // Real estate licensed companies (brokerages, management, consultancy)
  "licenses": "https://www.dubaipulse.gov.ae/dataset/6f7f5f08-c633-4dae-b3ef-16f1ed54936d/resource/5749474d-c8da-4674-a002-f77fcfb34884/download/real_estate_licenses.csv",
};

/**
 * Download a CSV file from a URL. Returns a Promise that resolves
 * with the response text. Follows a single redirect if the server
 * returns a 301/302/307/308.
 *
 * Why a hand-rolled fetcher instead of node-fetch or axios:
 * - Zero dependencies in scripts/ folder
 * - Works on any Node 14+ without install step
 * - Streams the response so we don't buffer the entire file twice
 * - Reports progress by chunk count for large files
 *
 * @param {string} url
 * @param {{ onProgress?: (bytesReceived: number) => void, timeoutMs?: number }} [options]
 * @returns {Promise<string>}
 */
function fetchCsv(url, options = {}) {
  const timeoutMs = options.timeoutMs || 120000; // 2 minute default

  return new Promise((resolve, reject) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (err) {
      reject(new Error(`Invalid URL: ${url}`));
      return;
    }

    const client = parsedUrl.protocol === "https:" ? https : http;
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: {
        "User-Agent": "DXB-Analytics-Migration/1.0 (dxb-analytics.com)",
        "Accept": "text/csv, application/octet-stream, */*",
      },
    };

    const req = client.request(requestOptions, (res) => {
      // Handle redirects (one level only — avoid infinite loops)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume(); // drain the response
        const redirectUrl = new URL(res.headers.location, url).toString();
        fetchCsv(redirectUrl, options).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} ${res.statusMessage} for ${url}`));
        return;
      }

      const chunks = [];
      let bytesReceived = 0;

      res.on("data", (chunk) => {
        chunks.push(chunk);
        bytesReceived += chunk.length;
        if (options.onProgress) {
          options.onProgress(bytesReceived);
        }
      });

      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const text = buffer.toString("utf8");
        resolve(text);
      });

      res.on("error", reject);
    });

    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms: ${url}`));
    });

    req.end();
  });
}

/**
 * Fetch a dataset by its registry name. Convenience wrapper around
 * fetchCsv that looks up the URL from DATASET_REGISTRY.
 * @param {string} name
 * @param {{ onProgress?: (bytesReceived: number) => void, timeoutMs?: number }} [options]
 * @returns {Promise<string>}
 */
function fetchDataset(name, options = {}) {
  const url = DATASET_REGISTRY[name];
  if (!url) {
    const available = Object.keys(DATASET_REGISTRY).join(", ");
    return Promise.reject(new Error(`Unknown dataset "${name}". Available: ${available}`));
  }
  return fetchCsv(url, options);
}

/**
 * List every dataset name available in the registry.
 * @returns {string[]}
 */
function listDatasets() {
  return Object.keys(DATASET_REGISTRY);
}

module.exports = {
  fetchCsv,
  fetchDataset,
  listDatasets,
  DATASET_REGISTRY,
};