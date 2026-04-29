# DLD Mashrooi API — Free Scraping Method
## Discovered: April 2026 | Cost: AED 0

---

## The API

```
GET https://b2c.dubailand.gov.ae/mashrooi/projects/searchlite?keywords={PROJECT_NUMBER}&
```

Returns: Real project name (English + Arabic), actual developer, construction %, GPS coordinates, status.

---

## Required Headers

| Header | Value |
|--------|-------|
| `consumer-id` | `gkb3WvEG0rY9eilwXC0P2pTz8UzvLj9F` |
| `Token` | Session token (get from browser — see below) |
| `Origin` | `https://dubailand.gov.ae` |
| `Referer` | `https://dubailand.gov.ae/en/eservices/real-estate-project-status-landing/real-estate-project-status/` |

---

## How to Get a Fresh Token (when it expires)

1. Open: `https://dubailand.gov.ae/en/eservices/real-estate-project-status-landing/real-estate-project-status/`
2. Press **F12** → **Network** tab → click **Fetch/XHR** filter
3. Search for any project number (e.g. `2599`) in the DLD search box and click Search
4. Click the `searchlite?keywords=2599&` request that appears
5. Click **Headers** tab → scroll to **Request Headers**
6. Copy the `token` value

Token lasts several hours per browser session.

---

## How We Found the consumer-id

The `consumer-id` is hardcoded in DLD's JavaScript. To verify/update it:

1. Open the DLD Mashrooi page in Chrome
2. Press F12 → Console tab
3. Run: `console.log(apiConfig.consumerId)`
4. Current value: `gkb3WvEG0rY9eilwXC0P2pTz8UzvLj9F`

Or get the full config:
```javascript
console.log(JSON.stringify(apiConfig))
```

---

## Sample Response

```json
{
  "responseCode": "Success",
  "response": {
    "projects": [{
      "number": "2499",
      "name": { "englishName": "Vincitore Volare", "arabicName": "فينسيتور فولاري" },
      "status": { "englishName": "Active" },
      "completionRatio": 63.38,
      "developer": {
        "number": "1234",
        "name": { "englishName": "Vincitore Premium Real Estate Development L.L.C" },
        "contact": { "url": "https://vincitore.ae" }
      },
      "location": {
        "googleCoordinates": { "latitude": 25.05, "longitude": 55.21 },
        "area": { "englishName": "Al Barshaa South Third" },
        "street": { "englishName": "Arjan" }
      }
    }]
  }
}
```

---

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/scrape-mashrooi.js` | Scrapes all project numbers → saves to `data/mashrooi-names.json` |
| `scripts/apply-mashrooi-names.js` | Reads JSON → updates Firestore with real names + developers |

### Run scraper:
```powershell
node scripts/scrape-mashrooi.js --token "YOUR_TOKEN_HERE"
node scripts/scrape-mashrooi.js --token "YOUR_TOKEN_HERE" --limit 10   # test
```

### Apply to Firestore:
```powershell
node scripts/apply-mashrooi-names.js --dry   # preview
node scripts/apply-mashrooi-names.js          # live
```

---

## Notes

- Token expires after a few hours — get a new one from browser
- consumer-id is stable (hardcoded in DLD JS, rarely changes)
- Rate limit: 1.2 seconds between requests is safe
- Resume support: script skips already-fetched project numbers
- ~1,546 projects takes ~31 minutes to scrape
- Saves progress every 100 projects to `data/mashrooi-names.json`

---

## Why This Works (Technical)

The DLD Mashrooi website (`dubailand.gov.ae`) is a frontend that calls
`b2c.dubailand.gov.ae` as its backend API. The consumer-id is a public
client identifier (not a secret) embedded in the page's JavaScript config.
The Token is a short-lived session token issued by the same API.

Both are publicly accessible from any browser visiting the DLD website.
No authentication, no payment, no registration required.

**This is the same data Dubai Pulse sells for AED 30,000/year.**
