# DXB Analytics — Schema Specification v2 (Hybrid two-collection model)
**Status:** Draft for review (Session 6 schema reopen)
**Last updated:** 8 April 2026
**Replaces:** Schema v1 (Session 4) — the one-record-per-unit-type model

This document defines what a "property record" is in DXB Analytics. It is the source of truth that the database, the admin Data Manager, every dashboard tab, every API integration, and every news feed will follow.

## Why v2 supersedes v1

Schema v1 (Session 4) said "one Firestore record per buyable unit type, linked to siblings via shared developmentId string."

When we audited the real seed data in Session 6, we discovered the existing records already use a parent-with-children shape: each project has a `unitBreakdown` array of bedroom-type variants. Whoever wrote the seed data understood that real estate platforms need both a development view (one card per building on the map) and a unit view (one card per buyable thing for buyers searching by bedroom count and price).

v2 makes this explicit by splitting into two collections that work together:

- `developments` — one record per project/building/community
- `projects` — one record per buyable unit variant within a development

This matches how Property Finder, Bayut, and Dubizzle structure their data internally. It also matches the four explicit requirements from the product owner:

- **Trustworthy:** searches are fast (single-collection queries with indexed fields, no nested-array unrolling)
- **User-friendly for buyers:** each search result is a card the buyer can directly compare, watchlist, and price-alert
- **User-friendly for admins:** development info is entered once per project, variants are added with one click each
- **All the things:** the same shape works for apartments (multiple bedroom variants), warehouses (one variant), land plots (one variant), hotels (room type variants), and every other property type

## How to read this document

- **Section 1** is the locked architectural decisions. Most are unchanged from v1; the granularity decision in 1.1 is the one that changed.
- **Section 2A** is the base fields on a development record.
- **Section 2B** is the base fields on a project record.
- **Section 2C** is the denormalized fields cloud functions maintain on projects so queries do not need to join.
- **Section 3** is the type-specific `details` fields per property type — unchanged from v1, applies to projects.
- **Section 4** is the related collections (developers, communities, fxRates, news, transactions) — unchanged from v1.
- **Section 5** is the security rules — updated to cover the new developments collection.

---

## SECTION 1 — Locked architectural decisions

### 1.1 Record granularity (CHANGED from v1)

**Two collections: developments and projects.**

A `developments` record represents one project/building/community as a whole — Hills Park, Tilal Al Ghaf, ICD Brookfield Place. Holds everything that does not vary by unit type: developer, community, location, regulatory info, escrow, photos, brochure, contracted handover.

A `projects` record represents one buyable unit variant within a development — "Hills Park 2BR Apartment", "Tilal Al Ghaf 5BR Villa", "ICD Brookfield 1200sqft Office". Holds the buyable specifics: bedroom count, size range, price range, yield, available count, type-specific `details`. Each project record links to its parent via `developmentId`.

For property types that have only one variant (a single warehouse, a single land plot, a single full hotel), the migration creates one development AND one child project. The "variant" is the thing itself. This keeps the schema uniform: every project has a parent development.

**Why this and not the v1 design:**

- Buyer searches are direct queries against `projects` with indexed fields (bedrooms, priceFromAed, grossYieldPct). No need to unroll nested arrays. Fast and accurate.
- Map view groups by `developmentId` from the development records — one pin per building, automatically.
- Admins enter regulatory and location info once per development and add variants as they go. No copy-paste. No drift.
- Cloud functions maintain denormalized fields on projects (developerName, community, coordinates, etc.) so queries get the parent display info without a join.
- When a development is updated (e.g. RERA suspends the project, escrow funded percentage changes), one write fans out to all child projects via cloud function. One source of truth.
- Legal disclosure (Decree-Law 25/2025 Article 122) lives on the development record. The development is what was disclosed; the variants are how it was offered. Audit evidence is unambiguous.

### 1.2 Property type coverage — 43 types (UNCHANGED from v1)

The 43-type list from v1 stays exactly the same. Each project record `type` field is one of these. The full list is in `src/utils/propertyTypes.js` and grouped under five master categories: residential (12), commercial (15), industrial & logistics (6), land & plots (6), specialty (4).

### 1.3 Multi-currency (UNCHANGED from v1)

All prices stored in AED. Daily fxRates collection. Conversion happens at read time. Initial currencies: AED, USD, EUR, GBP, INR, CNY, RUB, SAR, JPY, CHF.

### 1.4 Multi-tenancy (UNCHANGED from v1)

Both developments and projects have an `orgId`. v1 default: `dxb-analytics`. v2 will let agencies write to their own orgs.

### 1.5 Visibility states (UNCHANGED from v1)

Three states: draft, published, archived. Records never deleted from client code, only archived. Hard delete is admin-only Cloud Function with audit reason. Applies to both developments and projects.

### 1.6 Fractional ownership (UNCHANGED from v1)

Lives on the project record (the buyable variant), not on the development. A development might have one variant offered as fractional and another offered as whole-only.

### 1.7 Cascade rules (NEW for v2)

When a development is archived, its child projects do NOT get auto-archived. Cloud function shows a warning if an archived development still has published children. Reason: a development might be archived because the developer branding changed, not because the units stopped existing — the children might still be sellable.

When a development denormalized fields change (developerName, community, escrowBank, etc.), a cloud function re-denormalizes those fields onto every child project. This keeps the children display info in sync without requiring a join at read time.

When a development is hard-deleted (via admin Cloud Function), its child projects are also hard-deleted in the same transaction. This requires an admin reason that gets audit-logged for both.

---

## SECTION 2A — Base fields on a development record

A `developments` record holds everything that does not vary by buyable variant.

### 2A.1 Identification

- `id` — Firestore document ID
- `slug` — URL-friendly (e.g. "hills-park-emaar-dubai-hills-estate")
- `name` — human-readable development name (e.g. "Hills Park")
- `arabicName` — Arabic translation (optional)

### 2A.2 Ownership and tenancy

- `orgId` — owning org. v1 default: "dxb-analytics".
- `actualOwnerId` — optional, the title-deed owner if known
- `visibility` — draft / published / archived
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy` — server timestamps and user IDs
- `disclosedAt` — server timestamp when first published. Immutable. Legal protection per Decree-Law 25/2025.
- `sourceVerified` — boolean. True if admin confirmed against an official source.
- `sourceUrl` — URL of the source

### 2A.3 Type and category (development-level)

- `dldClass` — DLD legal title-deed class: "land" / "unit" / "villa". Computed from the dominant child variant type.
- `tenure` — freehold / leasehold / usufruct / musataha / grant
- `foreignOwnershipAllowed` — boolean
- `zoningCode` — Dubai zoning designation per Local Order No. 2 of 1999 (R5, R9, C1, C2, etc.)

### 2A.4 Location

- `country` — "AE" (always for v1)
- `emirate` — Dubai / Abu Dhabi / Sharjah / etc. (v1 launches Dubai-only)
- `community` — Dubai community name. Must reference `communities` collection.
- `subCommunity` — sub-area within community
- `address` — street address (often empty for off-plan)
- `coordinates` — { lat, lng } object. Required for published.
- `metroDistanceKm` — denormalized, computed from coordinates
- `nearestMetroStation`
- `beachAccess` — boolean

### 2A.5 Developer

- `developerId` — links to `developers` collection
- `developerName` — denormalized for fast display
- `developerOnTimeRate` — denormalized snapshot, updated by cloud function

### 2A.6 Status and timeline (development-level)

- `saleStatus` — off-plan / ready / secondary / sold-out / coming-soon
- `constructionStatus` — pre-launch / under-construction / completed / handover-ready
- `constructionPct` — 0-100 percent complete (off-plan only)
- `launchDate` — when sales opened
- `eoiDeadline` — Expression of Interest deadline
- `contractedHandover` — original handover date
- `expectedHandover` — current expected handover (may differ if delayed)
- `actualHandover` — for completed projects
- `delayMonths` — computed: months between contracted and expected

### 2A.7 Regulatory (mandatory for published off-plan)

- `reraProjectNumber` — Oqood number under Law 13/2008
- `reraDeveloperNumber` — RERA developer license
- `trakheesiPermit` — Trakheesi marketing permit
- `dldRegistered` — boolean
- `escrowAccount` — escrow account number
- `escrowBank` — name of escrow bank
- `escrowFundedPct` — 0-100 percent funded
- `lastReraInspection` — date
- `reraInspectionsPassed` — count
- `reraInspectionsFailed` — count
- `dldStarRating` — DLD Building Classification (1-4 stars, plus 4+ for green)

### 2A.8 Media (development-level)

- `coverImageUrl` — main hero image
- `images` — array of URLs, max 20
- `floorPlanUrl` — overall site/floor plan
- `brochureUrl` — PDF
- `videoUrl` — YouTube/Vimeo
- `virtualTourUrl` — Matterport / 360

### 2A.9 Tags and amenities (development-level)

- `tags` — admin labels
- `amenities` — standard codes (gym, pool, parking, etc.)
- `views` — sea, marina, burj, golf, park, city, garden, lagoon
- `lifestyle` — family, investor, luxury, branded, beachfront, golf, eco, smart-home

### 2A.10 Aggregates (cloud function maintained)

NEVER edit these directly. Cloud function refreshes when child projects change.

- `unitVariantCount` — number of child projects
- `bedroomTypes` — array of bedroom counts across all variants (e.g. Studio, 1BR, 2BR, 3BR)
- `priceFromAedMin` — cheapest variant
- `priceToAedMax` — most expensive variant
- `pricePerSqftAedMin`, `pricePerSqftAedMax` — range across variants
- `grossYieldPctMax`, `grossYieldPctMin` — yield range
- `totalUnitsAvailable` — sum of available counts across variants
- `lastSyncedAt` — when last refreshed

---

## SECTION 2B — Base fields on a project record

A `projects` record holds the buyable specifics for one variant within a development.

### 2B.1 Identification and parent linkage

- `id` — Firestore document ID
- `developmentId` — required. References parent development.
- `slug` — URL-friendly, includes variant info (e.g. "hills-park-emaar-2br-apartment")
- `name` — human-readable variant name (e.g. "Hills Park — 2BR Apartment")
- `variantLabel` — short label (e.g. "2BR", "Studio", "5BR Villa", "1200sqft Office")

### 2B.2 Ownership (mostly inherited from parent via denormalization)

- `orgId` — must equal parent orgId (cloud function enforces)
- `visibility` — independent from parent. A development can be published with some variants in draft.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`
- `disclosedAt` — set when this specific variant first becomes published

### 2B.3 Property type

- `type` — one of the 43 from `src/utils/propertyTypes.js`. Determines the `details` shape.
- `category` — residential / commercial / industrial / land / specialty
- `dldClass` — land / unit / villa (usually inherited from parent but can override)

### 2B.4 Pricing

- `priceFromAed` — starting price for this variant
- `priceToAed` — top of range
- `pricePerSqftAed` — stored, not computed
- `currency` — always "AED"
- `vatApplicable` — boolean
- `vatRate` — number (default 5 if applicable)
- `transferFeesPct` — DLD transfer fee (default 4)

### 2B.5 Size

- `sizeSqftMin`, `sizeSqftMax` — for variants with a size range
- `sizeSqmMin`, `sizeSqmMax` — computed from sqft
- `plotSizeSqftMin`, `plotSizeSqftMax` — for villas/townhouses/land
- `builtUpAreaSqftMin`, `builtUpAreaSqftMax` — for villas/townhouses

### 2B.6 Bedroom and unit info (for residential variants)

- `bedrooms` — number (0 for studio, 1, 2, 3, 4, 5, 6+) or null for non-residential
- `bedroomLabel` — display string ("Studio", "1BR", "2BR", "5BR Villa")
- `bathrooms` — number
- `availableUnits` — count of unsold/unrented units of this variant
- `totalUnits` — total count of this variant in the development
- `soldUnits` — totalUnits - availableUnits (can be computed but stored for fast queries)

### 2B.7 Yield and investment (variant-level)

- `grossYieldPct` — gross rental yield for this variant
- `netYieldPct` — net rental yield
- `serviceChargePerSqft` — annual service charge in AED per sqft
- `goldenVisaEligible` — boolean. True if priceFromAed >= 2,000,000.
- `mortgageEligible` — boolean
- `maxLtv` — max loan-to-value bank will lend

### 2B.8 Payment plan

- `paymentPlan` — same object shape as v1 with fields: downPaymentPct, duringConstructionPct, onHandoverPct, postHandoverPct, postHandoverMonths, label

### 2B.9 Fractional ownership

- `fractionalOwnership` — same object shape as v1 with fields: enabled, totalShares, pricePerShareAed, minimumShares, tokenizationProvider, availableShares

### 2B.10 Computed (cloud function maintained)

- `investmentScore` — 0-100 from `src/utils/scoring.js`
- `priceUsd`, `priceEur`, `priceGbp`, etc. — current converted prices
- `popularityScore` — derived from search and watchlist activity
- `lastSyncedAt`

### 2B.11 The `details` object (type-specific)

Same as v1 Section 3. Polymorphic by `type`. An apartment variant has floor, balcony, kitchenType, parkingSpaces, etc. A warehouse variant has ceilingHeightM, loadingDocks, floorLoadKgPerSqm, etc. The full list of 43 type-specific shapes is unchanged from Section 3 of the v1 spec — applies to project variants now instead of standalone records.

---

## SECTION 2C — Denormalized fields on projects (cloud function maintained)

These fields are copied from the parent development onto every child project so search queries against `projects` get the display info without a join. NEVER edit directly. The `onDevelopmentWrite` cloud function refreshes them whenever the parent changes.

- `developmentName` — from parent
- `developerName` — from parent
- `developerId` — from parent
- `community` — from parent
- `subCommunity` — from parent
- `coordinates` — from parent
- `metroDistanceKm` — from parent
- `beachAccess` — from parent
- `tenure` — from parent
- `foreignOwnershipAllowed` — from parent
- `reraProjectNumber` — from parent
- `escrowBank` — from parent
- `dldStarRating` — from parent
- `coverImageUrl` — from parent (variant cards in search use the parent hero image by default, can be overridden per variant)
- `expectedHandover` — from parent
- `saleStatus` — from parent (variants do not have independent sale status)
- `constructionStatus` — from parent
- `constructionPct` — from parent

A buyer search like "2BR apartments in Marina under 2M with 7 percent plus yield" runs as a single Firestore query:

    where("type", "==", "apartment")
    .where("bedrooms", "==", 2)
    .where("community", "==", "Dubai Marina")
    .where("priceFromAed", "<=", 2000000)
    .where("grossYieldPct", ">=", 7)

Single collection. Indexed fields. Fast. The `community` field is denormalized from the parent development so the query does not need to join.

---

## SECTION 3 — Type-specific `details` shapes

Unchanged from v1 spec. The 43 property types each have a `details` shape that captures the fields specific to that type (e.g. apartment has bedrooms/bathrooms/floor, warehouse has ceilingHeight/loadingDocks). The full Section 3 from v1 applies to project records in v2 — every project record `details` object follows the type-specific shape for its `type` value.

Reference: the previous schema-v1.md Section 3 for the full 43-type detail shapes. When Session 8-10 build the Data Manager, the polymorphic form reads the 43 shapes from there.

---

## SECTION 4 — Related collections

Unchanged from v1 spec.

- **`developers`** — every developer with reliability metrics
- **`communities`** — master list of Dubai communities
- **`fxRates`** — daily currency conversion snapshots
- **`news`** — 24/7 news feed
- **`transactions`** — DLD transaction records

Reference: the previous schema-v1.md Section 4 for full field lists.

---

## SECTION 5 — Security and validation rules (UPDATED for v2)

### 5.1 Read access

- Any authenticated user can read records where `visibility == "published"` AND `orgId` is in their accessible orgs list.
- Applies to both `developments` and `projects` collections.
- Admins of an org can read all records (any visibility) within their org.

### 5.2 Write access

- Only authenticated admin users can write to developments or projects.
- A user can only write to records where `orgId` matches one of their assigned orgs.
- The `disclosedAt` field is set automatically by a cloud function when `visibility` first becomes "published". Cannot be modified by client code. Applies to both collections.
- Hard delete is forbidden via client code on both collections. Records can only be set to `archived`. Hard delete is admin-only via Cloud Function with audit reason.
- Denormalized fields on projects (community, developerName, coordinates, etc.) are write-only by cloud functions, not by client code.

### 5.3 Validation

- A project record must reference an existing development via `developmentId`. The cloud function rejects orphan project writes.
- A development with `visibility == "published"` must have at least one child project (the cloud function flags developments with no children).
- For published off-plan records, all "mandatory for published" fields (Section 2A.7) must be present on the development.
- `priceFromAed` must be > 0 on every project.
- `coordinates` must be within Dubai bounds on the development.
- `type` must be one of the 43 from the canonical list.
- `community` must reference an existing community.
- `developerId` must reference an existing developer.

### 5.4 Audit

Every write to a development or project creates an entry in a per-record `auditLog` subcollection with userId, timestamp, action, fieldsChanged, ipAddress, and reason (required for archive/delete actions). This is the legal protection under Decree-Law 25/2025 Article 122.

---

## What changes from v1 to v2 — summary

| Aspect | v1 (Session 4) | v2 (Session 6 reopen) |
|---|---|---|
| Collections | One: `projects` | Two: `developments` + `projects` |
| Granularity | One record per buyable unit type | One development per project, one project per buyable variant within |
| Regulatory info storage | On every project record | Once on the development, denormalized to children |
| Map grouping | Required client-side logic by developmentId string | Automatic: one pin per development |
| Buyer search | Single-collection query | Single-collection query (still!) — denormalized fields make joins unnecessary |
| Admin form | One form per buyable unit | One development form + variant sub-forms |
| Migration complexity | Explode each parent into children | Parent + children naturally |
| Storage cost | Slightly less duplicated data | Slightly more duplicated data (denormalized fields on each child) |
| Schema spec sections affected | N/A (this is the original) | Section 1.1, Section 2 split into 2A/2B/2C, new Section 1.7 cascade rules, Section 5 minor updates |

The 43 property types, multi-currency, multi-tenancy, visibility states, fractional ownership, related collections, and Section 3 type-specific details are all UNCHANGED.

---

## Open questions to confirm before Session 6 implementation

1. **Variant slug generation:** for a development like "Hills Park" with 3 bedroom variants, the project slugs become "hills-park-1br-apartment", "hills-park-2br-apartment", "hills-park-3br-apartment". Confirm slug format includes the bedroom label.
2. **Photo override per variant:** the spec says variants inherit `coverImageUrl` from the parent but can override. Confirm this is the intended behavior — some developers do publish a different render for the 1BR vs the 3BR.
3. **Independent disclosedAt per variant:** the spec says each variant has its own `disclosedAt` set when that specific variant first publishes. Confirm this matches the legal requirement.
4. **availableUnits source of truth:** the spec stores `availableUnits` on each project variant. Confirm: when a unit is sold, is the admin updating this field directly, or is there a separate `transactions` collection that decrements it via cloud function?

These can all be answered after Session 6 implementation if you want — none of them block the migration script. But flagging them so they do not get forgotten.