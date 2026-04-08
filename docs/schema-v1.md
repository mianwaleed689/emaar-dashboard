# DXB Analytics — Schema Specification v1
**Status:** Draft for review (Session 4)
**Last updated:** 8 April 2026
**Author:** Drafted with research from DLD, RERA, Trakheesi, Bayut, Property Finder, Dubizzle, JLL, Knight Frank, CBRE, BSA Law, Lexology (Federal Decree-Law 25/2025 analysis), and Wikipedia (UAE agriculture).

This document defines what a "property record" is in DXB Analytics. It is the source of truth that the database, the admin Data Manager, every dashboard tab, every API integration, and every news feed will follow.

The spec is written in plain English. Once you approve it, we translate it into Firestore rules and TypeScript types in Session 5.

## How to read this document
- **Section 1** is the locked architectural decisions. Everything that is expensive to change later.
- **Section 2** is the base fields every record has, regardless of property type.
- **Section 3** is the type-specific `details` fields for each of the 43 property types, grouped by master category.
- **Section 4** is the related collections (developers, communities, fxRates, news, transactions).
- **Section 5** is the security rules and validation.

---

## SECTION 1 — Locked architectural decisions

### 1.1 Record granularity
**One record per buyable unit type.** "Hills Park 2BR Apartment" is one record. "Hills Park 3BR Apartment" is a separate record. They share a `developmentId` so map views and developer reports can group them.

Rationale: Buyers, agents, banks, brokers all search by exact unit specs. Property Finder, Bayut, and DLD's own listing systems use this structure. One-record-per-development would force every search to dig inside nested unit lists, which is slow in Firestore.

### 1.2 Property type coverage — 43 types in 5 master categories
The complete master list. Every type has a `details` shape in Section 3.

**RESIDENTIAL (12):** Apartment, Villa, Townhouse, Penthouse, Duplex, Loft, Hotel Apartment, Branded Residence, Residential Building, Residential Floor, Villa Compound, Compound Villa.

**COMMERCIAL (15):** Office, Retail Shop, Showroom, Business Centre, Co-working Space, Mall Anchor Space, Restaurant / F&B Space, Clinic / Medical Centre, Education Facility, Commercial Villa, Commercial Floor, Commercial Building, Mixed-Use Building, Bulk Sale Unit, Hotel.

**INDUSTRIAL & LOGISTICS (6):** Warehouse, Cold Storage Warehouse, Light Industrial Building, Factory, Labour Camp / Staff Accommodation, Logistics Centre.

**LAND & PLOTS (6):** Residential Plot, Commercial Plot, Industrial Land, Mixed-Use Plot, Farm / Agricultural Land, Hospitality Plot.

**SPECIALTY (4):** Parking Space, Storage Unit, Marina Berth, Land Lease / Long-term Leasehold.

### 1.3 Multi-currency
**All prices stored in AED (source of truth), converted on read.** A `fxRates` collection holds a daily snapshot of conversion rates. A scheduled cloud function refreshes it once per day from the UAE Central Bank rate.

**Initial currencies:** AED, USD, EUR, GBP, INR, CNY, RUB, SAR, JPY, CHF.

Adding more later (KRW, AUD, CAD, etc.) is a one-line config change. Never store converted prices on the record itself — that creates stale data.

### 1.4 Multi-tenancy (orgId)
Every record has an `orgId`. v1 default: `"dxb-analytics"` (the platform-owned dataset). v2 will let agencies write to their own `orgId` and queries will filter by it. Adding this field now costs nothing and prevents a painful migration later.

### 1.5 Visibility / publishing state
Three states: `draft`, `published`, `archived`. Records are never deleted, only archived. Deletion is only allowed via an admin "hard delete" that requires a reason and creates an audit log entry.

This is important for legal compliance under Federal Decree-Law 25/2025 Article 122 (effective 1 June 2026), which makes pre-contractual disclosure a binding legal obligation. The archived record becomes evidence in any future dispute.

### 1.6 Fractional ownership / tokenization
DLD launched tokenized real estate via PRYPCO in 2025 (the MENA region's first tokenized property platform). Every record has a `fractionalOwnership` object so a property can be sold whole or in fractions:
- `enabled` — boolean. True if the property is offered as fractional.
- `totalShares` — number of shares the property is divided into
- `pricePerShareAed` — AED per share
- `minimumShares` — minimum purchase
- `tokenizationProvider` — "PRYPCO" / "Stake" / "SmartCrowd" / null
- `availableShares` — current count of unsold shares (denormalized, updated by cloud function)

Adding this in v1 means we never have to migrate.

### 1.7 Decision: status of "data ownership"
The schema separates "who owns the data" from "who owns the property":
- `orgId` — which DXB Analytics tenant created and maintains this record
- `actualOwnerId` (optional) — the actual title-deed owner (a person or company), only set if known
- `listingAgentId` — the broker / agent currently marketing this property (required for "for sale" / "for rent")

This three-way separation is what lets one platform serve multiple agencies without conflicts and lets a property change agents without changing records.

---

## SECTION 2 — Base fields (every record, every property type)

These fields exist on every record regardless of property type. The `details` object (Section 3) holds the type-specific fields.

### 2.1 Identification
- `id` — Firestore document ID (auto-generated). Used in URLs and as the unique key.
- `slug` — URL-friendly (e.g. "hills-park-2br-apartment-emaar"), generated from name + developer + bedrooms when the record is created.
- `name` — human-readable project + unit description (e.g. "Hills Park — 2BR Apartment")
- `developmentId` — links to other records in the same building/community (e.g. "hills-park-emaar"). Multiple unit types in the same development share the same developmentId.
- `developmentName` — denormalized for fast display (e.g. "Hills Park"). Updated by cloud function.

### 2.2 Ownership and tenancy
- `orgId` — owning organization. v1 default: "dxb-analytics".
- `actualOwnerId` — optional, the title-deed owner if known
- `listingAgentId` — required for sale/rent listings, links to brokers collection
- `visibility` — "draft" / "published" / "archived"
- `createdAt` — server timestamp
- `createdBy` — user ID of the admin who first created it
- `updatedAt` — server timestamp, refreshed on every write
- `updatedBy` — user ID of the last editor
- `disclosedAt` — server timestamp when first set to "published". Cannot be unset. Legal-disclosure timestamp under Decree-Law 25/2025 Article 122.
- `sourceVerified` — boolean. True only if admin has confirmed against an official source.
- `sourceUrl` — URL of the source (developer portal, brochure, RERA listing, DLD record)

### 2.3 Type and category
- `type` — one of the 43 from Section 1.2. Determines which `details` shape applies.
- `category` — "residential" / "commercial" / "industrial" / "land" / "specialty". Computed from type but stored for fast filtering.
- `dldClass` — DLD's three legal categories: "land" / "unit" / "villa". This is what appears on the actual title deed. Critical for AML and verification.
- `tenure` — "freehold" / "leasehold" / "usufruct" / "musataha" / "grant" — the legal ownership type
- `foreignOwnershipAllowed` — boolean. True if non-UAE/GCC nationals can own this property. Critical for international buyers. False for properties outside designated freehold areas.
- `zoningCode` — Dubai zoning designation (R5, R9, C1, C2, etc. per Local Order No. 2 of 1999). Determines what's legally allowed on the property.

### 2.4 Location
- `country` — "AE" (always for v1)
- `emirate` — "Dubai" / "Abu Dhabi" / "Sharjah" / "Ajman" / "Umm Al Quwain" / "Ras Al Khaimah" / "Fujairah". v1 launches Dubai-only but field exists for expansion.
- `community` — Dubai community name. Must match a record in the `communities` collection.
- `subCommunity` — sub-area within community (optional)
- `address` — full street address (optional, often empty for off-plan)
- `coordinates` — { lat, lng } object. Required for published records.
- `metroDistanceKm` — denormalized, computed by cloud function when coordinates change
- `nearestMetroStation` — name of nearest station
- `beachAccess` — boolean

### 2.5 Pricing (all stored in AED)
- `priceFromAed` — starting price in AED
- `priceToAed` — top of range (optional)
- `pricePerSqftAed` — AED per sqft (stored, not computed)
- `currency` — always "AED" in v1, field exists for future override
- `vatApplicable` — boolean. True for commercial / land. False for residential resale.
- `vatRate` — number (default 5 for VAT-applicable properties)
- `transferFeesPct` — DLD transfer fee (default 4% of sale price, paid at registration)

### 2.6 Size
- `sizeSqft` — total area in sqft
- `sizeSqm` — total area in sqm (computed from sqft)
- `plotSizeSqft` — for villas/townhouses/land — plot area
- `builtUpAreaSqft` — for villas/townhouses — actual interior area

### 2.7 Status and timeline
- `saleStatus` — "off-plan" / "ready" / "secondary" / "sold-out" / "coming-soon"
- `constructionStatus` — "pre-launch" / "under-construction" / "completed" / "handover-ready"
- `constructionPct` — number 0-100, percent complete (off-plan only)
- `launchDate` — date sales opened
- `eoiDeadline` — Expression of Interest deadline (off-plan)
- `contractedHandover` — original handover date
- `expectedHandover` — current expected handover (may differ if delayed)
- `actualHandover` — handover date for completed projects
- `delayMonths` — computed: months between contracted and expected

### 2.8 Developer
- `developerId` — links to `developers` collection
- `developerName` — denormalized
- `developerOnTimeRate` — denormalized (0-100), updated by cloud function

### 2.9 Regulatory (mandatory for published off-plan records)
- `reraProjectNumber` — Oqood number under Law 13/2008. Required to legally market.
- `reraDeveloperNumber` — RERA developer license number
- `trakheesiPermit` — Trakheesi marketing permit ID (the permit that allows advertising in Dubai)
- `dldRegistered` — boolean
- `escrowAccount` — escrow account number where buyer funds are held
- `escrowBank` — name of the escrow bank
- `escrowFundedPct` — percentage of construction cost currently funded in escrow
- `lastReraInspection` — date of last RERA inspection
- `reraInspectionsPassed` — count
- `reraInspectionsFailed` — count
- `dldStarRating` — DLD Building Classification System rating (1-4 stars, plus 4+ for green sustainability). Real DLD data when available.

### 2.10 Yield and investment
- `grossYieldPct` — gross rental yield percent
- `netYieldPct` — net rental yield (after service charges, fees, vacancy)
- `serviceChargePerSqft` — annual service charge in AED per sqft
- `expectedAppreciationPct` — developer's stated appreciation expectation to handover
- `goldenVisaEligible` — boolean. True if priceFromAed >= 2,000,000 (current Golden Visa threshold)
- `mortgageEligible` — boolean. True if banks finance this property type
- `maxLtv` — max loan-to-value bank will lend on this property (e.g. 80 for first-time UAE resident, 75 for non-resident)

### 2.11 Payment plan
- `paymentPlan` — object:
  - `downPaymentPct` — number
  - `duringConstructionPct` — number
  - `onHandoverPct` — number
  - `postHandoverPct` — number
  - `postHandoverMonths` — number
  - `label` — human-readable summary, e.g. "20/50/30" or "10/40/50 + 24m PHP"

### 2.12 Media
- `coverImageUrl` — main hero image (Firebase Storage)
- `images` — array of image URLs, max 20
- `floorPlanUrl` — floor plan
- `brochureUrl` — PDF brochure
- `videoUrl` — YouTube/Vimeo URL
- `virtualTourUrl` — Matterport / 360 tour

### 2.13 Tags and search aids
- `tags` — array of free-form admin labels
- `amenities` — array of standard amenity codes (gym, pool, parking, etc.)
- `views` — array (sea, marina, burj-khalifa, golf, park, city, garden, lagoon)
- `lifestyle` — array of lifestyle codes (family, investor, luxury, branded, beachfront, golf, eco, smart-home)

### 2.14 Fractional ownership (Section 1.6)
- `fractionalOwnership` — object as defined in 1.6

### 2.15 Computed / denormalized fields (cloud function maintained)
NEVER edit directly. A cloud function updates these:
- `investmentScore` — 0-100, from `src/utils/scoring.js`
- `priceUsd`, `priceEur`, `priceGbp`, etc. — current converted prices (snapshot)
- `popularityScore` — derived from search and watchlist activity
- `lastSyncedAt` — when cloud function last touched this record

### 2.16 The `details` object
Type-specific fields. Section 3 defines the shape per type.

---

## SECTION 3 — Type-specific `details` shapes

For each of the 43 property types, here are the fields that go inside the `details` object on top of the base fields. The Data Manager form will dynamically show these fields when the admin picks the type.

### RESIDENTIAL

**3.1 Apartment**
- `bedrooms` — number (0 for studio, 1, 2, 3, 4, 5, 6+)
- `bathrooms` — number
- `floor` — number (which floor)
- `totalFloors` — number (height of building)
- `balcony` — boolean
- `balconySize` — sqft (optional)
- `furnished` — "unfurnished" / "semi-furnished" / "fully-furnished"
- `kitchenType` — "open" / "closed" / "semi-open"
- `parkingSpaces` — number (allocated parking)
- `maidsRoom` — boolean
- `studyRoom` — boolean
- `storageRoom` — boolean
- `viewType` — array (sea, marina, burj, park, city, golf, lagoon)

**3.2 Villa**
- `bedrooms` — number
- `bathrooms` — number
- `floors` — number (single-storey, two-storey, etc.)
- `garage` — number (covered car spaces)
- `outdoorParking` — number
- `garden` — boolean
- `gardenSize` — sqft
- `privatePool` — boolean
- `poolType` — "swimming" / "plunge" / "infinity" / null
- `maidsRoom` — boolean
- `driverRoom` — boolean
- `studyRoom` — boolean
- `majlis` — boolean (formal Arab guest reception room)
- `barbecueArea` — boolean
- `furnished` — same enum as Apartment

**3.3 Townhouse**
- Same as Villa, plus:
- `clusterPosition` — "end" / "middle" / "corner"

**3.4 Penthouse**
- Same as Apartment, plus:
- `privateTerrace` — boolean
- `terraceSize` — sqft
- `privatePool` — boolean
- `privateElevator` — boolean
- `dualLevel` — boolean

**3.5 Duplex**
- Same as Apartment, plus:
- `internalStaircase` — boolean
- `levels` — number (always 2, but field exists)

**3.6 Loft**
- Same as Apartment, plus:
- `ceilingHeightM` — meters
- `openPlan` — boolean

**3.7 Hotel Apartment**
- Same as Apartment, plus:
- `hotelOperator` — string (e.g. "Address", "Marriott", "Rotana")
- `dailyRateAed` — short-term rate
- `monthlyRateAed`
- `housekeepingIncluded` — boolean
- `restaurantOnSite` — boolean
- `gymOnSite` — boolean
- `concierge` — boolean
- `roomService` — boolean

**3.8 Branded Residence**
- Same as Apartment/Penthouse, plus:
- `brandName` — string (Armani, Bvlgari, Cavalli, Versace, Bentley, Six Senses, Mandarin Oriental, etc.)
- `brandedFeatures` — array (e.g. ["custom-furniture", "branded-amenities", "concierge"])
- `brandLicensingActive` — boolean

**3.9 Residential Building (whole building sale)**
- `totalUnits` — number
- `totalFloors` — number
- `unitMix` — array of objects: `{ bedrooms, count, sizeSqft }`
- `currentOccupancy` — percent (0-100)
- `currentAnnualRentAed` — total annual rent collected
- `tenancyContractsActive` — number
- `serviceChargeAnnualAed` — total annual service charge
- `escrowFunded` — boolean

**3.10 Residential Floor**
- `floorNumber` — number
- `totalUnitsOnFloor` — number
- `unitsConfiguration` — array of objects: `{ unitNumber, bedrooms, sizeSqft }`
- `commonAreaSize` — sqft

**3.11 Villa Compound**
- `totalVillas` — number
- `villaTypes` — array of objects: `{ bedrooms, count, sizeSqft, plotSqft }`
- `gated` — boolean
- `securityType` — "24/7" / "daytime" / "none"
- `commonAmenities` — array (pool, gym, playground, mosque, clubhouse)

**3.12 Compound Villa (one villa within a compound)**
- Same as Villa, plus:
- `compoundName` — string
- `compoundSecurity` — boolean
- `accessControl` — "card" / "biometric" / "guard" / "open"

### COMMERCIAL

**3.13 Office**
- `officeGrade` — "A+" / "A" / "A-" / "B+" / "B" / "B-" / "C" (DLD ABC classification)
- `fitOut` — "shell-and-core" / "fitted" / "furnished"
- `partitioned` — boolean
- `partitionsCount` — number
- `meetingRooms` — number
- `pantry` — boolean
- `restrooms` — number
- `parkingSpaces` — number
- `floor` — number
- `viewType` — array
- `coreToWindowDistance` — meters (deeper offices = lower light quality)
- `raisedFloor` — boolean (for cabling)
- `acType` — "central-chilled" / "DX" / "VRV" / "split"
- `fitOutAllowanceAed` — landlord contribution if any
- `freeZone` — string (DIFC, DMCC, DAFZA, JAFZA, ADGM) or null

**3.14 Retail Shop**
- `frontageWidthM` — meters of street frontage
- `ceilingHeightM` — meters
- `glassFrontage` — boolean
- `mezzanine` — boolean
- `parkingNearby` — boolean
- `footfallEstimate` — daily pedestrian count (developer-supplied)
- `mallLocation` — boolean
- `mallName` — string or null
- `cornerUnit` — boolean
- `permittedActivities` — array (food, fashion, electronics, services, etc.)
- `kitchenLicensable` — boolean
- `chillerPower` — kW
- `gracePeriod` — months (free fit-out period)

**3.15 Showroom**
- Same as Retail Shop, plus:
- `loadingDoors` — number (for moving large items)
- `truckAccess` — boolean
- `displayWindowSize` — sqft

**3.16 Business Centre / 3.17 Co-working Space**
- `seatingType` — "hot-desk" / "dedicated-desk" / "private-office" / "team-room"
- `capacity` — number of people
- `meetingRoomsIncluded` — number per month
- `internetSpeedMbps` — number
- `printerIncluded` — boolean
- `kitchen` — boolean
- `pricePerDeskMonthlyAed` — number
- `flexibleTerm` — boolean (month-to-month vs annual)

**3.18 Mall Anchor Space**
- `mallName` — string
- `floorLevel` — number
- `frontageM` — meters
- `ceilingHeightM` — meters
- `loadingBays` — number
- `goodsLift` — boolean
- `dedicatedParking` — number of spaces
- `commonAreaContribution` — annual AED
- `marketingFee` — percent of sales
- `tradingHours` — string

**3.19 Restaurant / F&B Space**
- Same as Retail Shop, plus:
- `kitchenInstalled` — boolean
- `extractorInstalled` — boolean
- `gasConnection` — boolean
- `seatingCapacity` — number
- `outdoorSeating` — boolean
- `licensedForAlcohol` — boolean
- `previousRestaurantFitOut` — boolean (saves a new tenant money)

**3.20 Clinic / Medical Centre**
- Same as Office, plus:
- `dohaCertified` — boolean (Dubai Health Authority)
- `medicalLicenseClass` — "general" / "specialist" / "diagnostic" / "dental"
- `consultingRooms` — number
- `treatmentRooms` — number
- `xrayRoom` — boolean
- `pharmacyInside` — boolean

**3.21 Education Facility**
- `educationType` — "nursery" / "primary" / "secondary" / "k-12" / "training" / "language-centre"
- `khdaApproved` — boolean (Knowledge and Human Development Authority)
- `classrooms` — number
- `studentCapacity` — number
- `playground` — boolean
- `outdoorAreaSqft` — number
- `libraries` — number
- `cafeteria` — boolean

**3.22 Commercial Villa**
- Same as Villa, plus:
- `commercialUseApproved` — boolean
- `permittedUses` — array (clinic, office, school, gallery, etc.)
- `parkingForVisitors` — number

**3.23 Commercial Floor**
- Same as Office, plus:
- `floorPlateSqft` — number (one floor's total area)
- `divisible` — boolean (can be split into smaller offices)

**3.24 Commercial Building**
- `totalFloors` — number
- `totalLeasableSqft` — number
- `currentOccupancyPct` — number
- `tenants` — array of objects: `{ name, floor, leaseExpiry }` (anonymized in public listings)
- `currentAnnualRentAed` — total
- `passingYieldPct` — actual current yield
- `mainTenantSector` — "finance" / "tech" / "professional-services" / "mixed"
- `parkingSpaces` — number
- `escalators` — number
- `elevators` — number
- `lobbyGrade` — "premium" / "standard" / "basic"

**3.25 Mixed-Use Building**
- Combines Residential Building + Commercial Building details
- `residentialUnits` — number
- `commercialUnits` — number
- `retailUnits` — number
- `parkingPodium` — boolean
- `mixRatio` — object: `{ residential, commercial, retail }` as percentages

**3.26 Bulk Sale Unit**
- `unitsCount` — number
- `unitMix` — array of objects: `{ bedrooms, count, sizeSqft, priceAedEach }`
- `discountVsRetailPct` — number
- `transferType` — "single-deed" / "multiple-deeds"

**3.27 Hotel**
- `hotelStarRating` — 1-5
- `totalKeys` — number of rooms
- `roomTypes` — array of objects: `{ type, count, sizeSqft }`
- `restaurants` — number
- `meetingSpaceSqft` — number
- `pools` — number
- `spa` — boolean
- `gym` — boolean
- `currentAnnualRevenueAed` — number
- `currentRevPar` — revenue per available room (AED)
- `currentOccupancyPct` — number
- `managementCompany` — string (Hilton, Marriott, etc.)
- `franchiseAgreement` — boolean

### INDUSTRIAL & LOGISTICS

**3.28 Warehouse**
- `ceilingHeightM` — meters
- `clearHeightM` — meters (height to lowest obstruction)
- `loadingDocks` — number
- `loadingDockType` — "ground-level" / "raised" / "both"
- `truckAccess` — boolean
- `truckAccessType` — "container" / "trailer" / "small"
- `floorLoadKgPerSqm` — number
- `power` — kW capacity
- `chiller` — boolean
- `racking` — boolean
- `office` — boolean (warehouse with office attached)
- `officeAreaSqft` — number
- `mezzanine` — boolean
- `mezzanineSqft` — number
- `securityFenced` — boolean
- `freeZone` — string or null

**3.29 Cold Storage Warehouse**
- Same as Warehouse, plus:
- `temperatureRangeC` — object: `{ min, max }`
- `coldZones` — number
- `freezerCapacityCubicM` — number
- `chillerCapacityCubicM` — number
- `temperatureMonitoring` — boolean
- `backupPower` — boolean

**3.30 Light Industrial Building**
- Same as Warehouse, plus:
- `manufacturingPermitted` — boolean
- `permittedActivities` — array
- `noiseLicense` — boolean
- `wasteDisposalConnected` — boolean

**3.31 Factory**
- `totalLandSqm` — number
- `builtUpAreaSqm` — number
- `productionLines` — number
- `cranesCapacity` — array of tonnes
- `chimney` — boolean
- `effluentTreatment` — boolean
- `licensedActivities` — array
- `safetyClass` — "standard" / "high-risk" / "low-risk"

**3.32 Labour Camp / Staff Accommodation**
- `roomCount` — number
- `bedCapacity` — number
- `roomConfiguration` — "shared" / "private" / "mixed"
- `pricePerBedMonthlyAed` — number
- `kitchenFacilities` — "shared" / "in-room"
- `laundry` — boolean
- `recreationRoom` — boolean
- `mosque` — boolean
- `mediCenter` — boolean
- `transportProvided` — boolean
- `complianceClass` — "permanent" / "temporary"
- `r9Approved` — boolean (Dubai zoning)

**3.33 Logistics Centre**
- Same as Warehouse, plus:
- `crossDock` — boolean
- `parcelSortingCapacity` — parcels per hour
- `truckBays` — number
- `vanBays` — number
- `containerYardSqm` — number
- `securityCertification` — array (e.g. ISO, AEO)

### LAND & PLOTS

**3.34 Residential Plot**
- `plotSizeSqft` — number
- `gfa` — sqft (gross floor area allowed by zoning)
- `floorAreaRatio` — number
- `maxHeight` — number of floors allowed
- `setbacks` — object: `{ front, sides, rear }` in meters
- `cornerPlot` — boolean
- `infrastructureReady` — boolean (water, power, sewer connected)
- `requiresFilling` — boolean

**3.35 Commercial Plot**
- Same as Residential Plot, plus:
- `permittedUses` — array
- `parkingRequirementSpaces` — number per sqft

**3.36 Industrial Land**
- Same as Commercial Plot, plus:
- `industrialClass` — "light" / "medium" / "heavy"
- `tradingZone` — string

**3.37 Mixed-Use Plot**
- Same as Commercial Plot, plus:
- `permittedMix` — object: `{ residentialPct, commercialPct, retailPct }`

**3.38 Farm / Agricultural Land**
- `totalAreaSqm` — number
- `cultivatedAreaSqm` — number
- `currentCrops` — array of strings
- `dateTreesCount` — number
- `wellsCount` — number
- `irrigationType` — "drip" / "flood" / "sprinkler" / "none"
- `farmhouseIncluded` — boolean
- `livestockSheds` — number
- `electricityConnected` — boolean
- `waterSource` — "well" / "DEWA" / "tanker" / "none"
- `agricultureLicensed` — boolean

**3.39 Hospitality Plot**
- Same as Commercial Plot, plus:
- `hotelKeysAllowed` — number (max keys per zoning)
- `beachfront` — boolean
- `viewQuality` — "premium" / "good" / "standard"

### SPECIALTY

**3.40 Parking Space**
- `parkingType` — "covered" / "open" / "garage"
- `floor` — number (basement levels: -1, -2, etc.)
- `spaceNumber` — string (e.g. "B2-145")
- `evCharger` — boolean
- `evChargerKw` — number
- `pricePerYearAed` — number (rent)
- `pricePerHourAed` — number (short-term, optional)
- `dimensionsM` — object: `{ length, width, height }`
- `accessibleParking` — boolean
- `linkedToUnit` — string (which apartment it's deeded to, if any)

**3.41 Storage Unit**
- `storageType` — "personal" / "business" / "wine" / "secure"
- `sizeSqft` — number
- `climateControlled` — boolean
- `temperatureC` — number (if controlled)
- `humidityControlled` — boolean
- `accessHours` — "24/7" / "business-hours" / "limited"
- `accessType` — "drive-up" / "elevator" / "stairs"
- `securityLevel` — "basic" / "monitored" / "biometric"

**3.42 Marina Berth**
- `marinaName` — string
- `berthNumber` — string
- `lengthM` — meters (max boat length)
- `beamM` — meters (max boat width)
- `draftM` — meters (max boat draft)
- `powerConnection` — boolean
- `powerAmperage` — number
- `waterConnection` — boolean
- `pumpoutFacility` — boolean
- `wifiIncluded` — boolean
- `securityType` — "24/7" / "patrolled" / "open"
- `transferable` — boolean

**3.43 Land Lease / Long-term Leasehold**
- This is a `tenure` modifier rather than a property type. A record can be `type: "Villa"` with `tenure: "leasehold"` and additional fields:
- `leaseTermYears` — number
- `leaseStartDate` — date
- `leaseExpiryDate` — date
- `groundRentAedAnnual` — number
- `escalationClause` — string
- `renewalRights` — boolean
- `assignmentRights` — boolean

---

## SECTION 4 — Related collections

### 4.1 `developers` collection
Tracks every developer with reliability metrics. Fields:
- `id`, `name`, `arabicName`, `licenseNumber`, `establishedYear`
- `totalProjects`, `completedProjects`, `delayedProjects`, `cancelledProjects`
- `onTimeRatePct`, `avgDelayMonths`
- `reraDeveloperNumber`, `dldRegistered`
- `headquarters`, `phone`, `email`, `website`
- `logoUrl`
- `creditRating` — Moody's / Fitch / S&P if rated
- `legalDisputes` — count of court judgments against the developer
- `parentCompany`
- `signatureProjects` — array of project IDs

### 4.2 `communities` collection
Master list of Dubai communities with metrics. Fields:
- `id`, `name`, `arabicName`, `emirate`
- `coordinates` — { lat, lng } (centroid)
- `boundary` — GeoJSON polygon (for map display)
- `freehold` — boolean
- `foreignOwnershipAllowed` — boolean
- `avgPpsf`, `avgRentAnnualAed`, `avgGrossYieldPct`
- `tenantProfile` — "family" / "young-professional" / "investor" / "expat" / "mixed"
- `metroAccess` — boolean
- `nearestMetroStation`
- `schoolsCount`, `clinicsCount`, `mallsCount`
- `populationEstimate`
- `totalUnits` — total units across all developments in this community

### 4.3 `fxRates` collection
One document per day. Fields:
- `date` — YYYY-MM-DD
- `source` — "UAE Central Bank" / "OANDA" / etc.
- `rates` — object mapping currency code to AED rate (e.g. `{ USD: 3.6725, EUR: 3.95, GBP: 4.62 }`)
- `updatedAt`

### 4.4 `news` collection
Real-time news feed for the 24/7 newspaper view. Fields:
- `id`, `headline`, `summary`, `body`
- `category` — "transactions" / "launches" / "regulation" / "developer-news" / "market-data" / "international"
- `publishedAt`
- `sourceUrl`, `sourceName`
- `relatedProjectIds` — array
- `relatedDeveloperIds` — array
- `relatedCommunityIds` — array
- `verified` — boolean
- `language` — "en" / "ar"

### 4.5 `transactions` collection
DLD transaction records (live data feed). Fields:
- `id` (DLD transaction ID)
- `transactionDate`
- `type` — "sale" / "rent" / "mortgage"
- `priceAed`, `pricePerSqftAed`
- `propertyType`
- `community`, `building`
- `sizeSqft`
- `relatedProjectId` — linked to projects collection if matched
- `verified` — boolean (matched against DLD source)

---

## SECTION 5 — Security and validation rules

### 5.1 Read access
- Any authenticated user can read records where `visibility == "published"` AND `orgId` is in their accessible orgs list.
- Admins of an org can read all records (any visibility) within their org.
- Platform super-admins can read all records.
- Unauthenticated users see only the public landing page snapshot, not raw records.

### 5.2 Write access
- Only authenticated admin users can write to projects.
- A user can only write to records where `orgId` matches one of their assigned orgs.
- The `disclosedAt` field is set automatically by a cloud function when `visibility` first becomes "published". It cannot be modified by client code.
- The `dldStarRating`, `developerOnTimeRate`, `investmentScore`, `priceUsd` etc. fields are write-only by cloud functions, not by client code. Client writes that touch these fields are rejected.
- Hard delete is forbidden via client code. Records can only be set to `visibility == "archived"`. Hard delete is admin-only via Cloud Function with audit log.

### 5.3 Validation
- `priceFromAed` must be > 0
- `coordinates` must have valid lat (22.5 to 26.0 for Dubai range) and lng (54.5 to 56.5)
- `reraProjectNumber` must match the format DLD uses (validated against a regex)
- `community` must reference an existing community in the `communities` collection
- `developerId` must reference an existing developer in the `developers` collection
- `type` must be one of the 43 from Section 1.2
- For published records, all "mandatory for published" fields must be present (Section 2.9)

### 5.4 Audit
Every write to a project record creates an entry in a `projectAuditLog` subcollection with:
- `userId`, `userEmail`, `timestamp`
- `action` — "create" / "update" / "publish" / "archive" / "delete"
- `fieldsChanged` — object showing old and new values
- `ipAddress` (from cloud function context)
- `reason` — required for archive/delete actions

This is what makes us defensible under Decree-Law 25/2025 disclosure obligations.

---

## SECTION 6 — Open questions to confirm

These are the calls I made on your behalf where I want explicit approval before locking:

1. **43 property types is the right number, not 22.** Confirmed through DLD, Bayut, Property Finder, Dubizzle research. Did I miss any specific Dubai niches you know of (e.g. religious endowment Awqaf properties, fuel station plots, billboards, DEWA substation sites)?
2. **Multi-emirate field exists from day one** but only Dubai records will be created in v1. Adding Abu Dhabi/Sharjah/etc. is one config change.
3. **Fractional ownership added in v1** because DLD launched it via PRYPCO in 2025. Adding it now is one field; adding it later is a migration.
4. **Hard deletes are admin-only Cloud Function calls.** Client code can only archive. This is for legal disclosure compliance.
5. **The audit log is mandatory.** This is non-negotiable for the legal protection it gives you.

---

**Next step (Session 5):** Once this spec is approved, we translate it into:
- `firestore.rules` — the actual security rules file
- `src/types/project.ts` — TypeScript interfaces for the schema
- `src/utils/projectValidation.js` — client-side validation matching server-side rules
- A JSON Schema document for use in admin form generation
- Migration script to convert the existing seed data into the new shape