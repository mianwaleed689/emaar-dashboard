/* ─────────────────────────────────────────────────────────────
   DXB ANALYTICS — DEVELOPMENT & PROJECT TYPES (TypeScript)
   src/types/project.ts

   TypeScript interface definitions for the v2 hybrid schema:
   - Development: the parent collection (one per building/community)
   - ProjectVariant: the child collection (one per buyable unit variant)

   This file is documentation-as-code: even if the rest of the
   project is JavaScript, the .ts file gives editor autocomplete
   and lets you incrementally add type-checking later.

   Locked in Session 6 schema reopen (docs/schema-v1.md v2).
   Last updated: 8 April 2026
   ───────────────────────────────────────────────────────────── */

// ── Master enum types ─────────────────────────────────────────

export type MasterCategory = "residential" | "commercial" | "industrial" | "land" | "specialty";

export type DldClass = "land" | "unit" | "villa";

export type Tenure = "freehold" | "leasehold" | "usufruct" | "musataha" | "grant";

export type Visibility = "draft" | "published" | "archived";

export type SaleStatus = "off-plan" | "ready" | "secondary" | "sold-out" | "coming-soon";

export type ConstructionStatus = "pre-launch" | "under-construction" | "completed" | "handover-ready";

export type Emirate = "Dubai" | "Abu Dhabi" | "Sharjah" | "Ajman" | "Umm Al Quwain" | "Ras Al Khaimah" | "Fujairah";

// ── Shared sub-objects ────────────────────────────────────────

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PaymentPlan {
  downPaymentPct: number;
  duringConstructionPct: number;
  onHandoverPct: number;
  postHandoverPct: number;
  postHandoverMonths: number;
  label: string;
}

export interface FractionalOwnership {
  enabled: boolean;
  totalShares: number;
  pricePerShareAed: number;
  minimumShares: number;
  tokenizationProvider: "PRYPCO" | "Stake" | "SmartCrowd" | null;
  availableShares: number;
}

// ═══════════════════════════════════════════════════════════════
// DEVELOPMENT — parent collection (v2)
// ═══════════════════════════════════════════════════════════════

export interface DevelopmentBase {
  // Identification
  id: string;
  slug: string;
  name: string;
  arabicName?: string;

  // Ownership and tenancy
  orgId: string;
  actualOwnerId?: string;
  visibility: Visibility;
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
  disclosedAt?: any;
  sourceVerified: boolean;
  sourceUrl?: string;

  // Type and category (development-level)
  dldClass: DldClass;
  tenure: Tenure;
  foreignOwnershipAllowed: boolean;
  zoningCode?: string;

  // Location
  country: "AE";
  emirate: Emirate;
  community: string;
  subCommunity?: string;
  address?: string;
  coordinates?: Coordinates;
  metroDistanceKm?: number;
  nearestMetroStation?: string;
  beachAccess: boolean;

  // Developer
  developerId: string;
  developerName: string;
  developerOnTimeRate?: number;

  // Status and timeline
  saleStatus: SaleStatus;
  constructionStatus: ConstructionStatus;
  constructionPct?: number;
  launchDate?: any;
  eoiDeadline?: any;
  contractedHandover?: any;
  expectedHandover?: any;
  actualHandover?: any;
  delayMonths?: number;

  // Regulatory (mandatory for published off-plan)
  reraProjectNumber?: string;
  reraDeveloperNumber?: string;
  trakheesiPermit?: string;
  dldRegistered?: boolean;
  escrowAccount?: string;
  escrowBank?: string;
  escrowFundedPct?: number;
  lastReraInspection?: any;
  reraInspectionsPassed?: number;
  reraInspectionsFailed?: number;
  dldStarRating?: number;

  // Media
  coverImageUrl?: string;
  images?: string[];
  floorPlanUrl?: string;
  brochureUrl?: string;
  videoUrl?: string;
  virtualTourUrl?: string;

  // Tags and amenities
  tags?: string[];
  amenities?: string[];
  views?: string[];
  lifestyle?: string[];

  // Aggregates (cloud function maintained)
  unitVariantCount?: number;
  bedroomTypes?: string[];
  priceFromAedMin?: number;
  priceToAedMax?: number;
  pricePerSqftAedMin?: number;
  pricePerSqftAedMax?: number;
  grossYieldPctMax?: number;
  grossYieldPctMin?: number;
  totalUnitsAvailable?: number;
  lastSyncedAt?: any;
}

export type DevelopmentCreate = Omit
  DevelopmentBase,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "disclosedAt"
  | "unitVariantCount"
  | "bedroomTypes"
  | "priceFromAedMin"
  | "priceToAedMax"
  | "pricePerSqftAedMin"
  | "pricePerSqftAedMax"
  | "grossYieldPctMax"
  | "grossYieldPctMin"
  | "totalUnitsAvailable"
  | "lastSyncedAt"
>;

export type DevelopmentUpdate = Partial<Omit<DevelopmentBase, "id" | "createdAt" | "createdBy" | "disclosedAt">>;

// ═══════════════════════════════════════════════════════════════
// PROJECT VARIANT — child collection (v2)
// ═══════════════════════════════════════════════════════════════

export interface ProjectVariantBase {
  // Identification and parent linkage
  id: string;
  developmentId: string;
  slug: string;
  name: string;
  variantLabel: string;

  // Ownership
  orgId: string;
  visibility: Visibility;
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
  disclosedAt?: any;

  // Property type
  type: string;
  category: MasterCategory;
  dldClass: DldClass;

  // Pricing
  priceFromAed: number;
  priceToAed?: number;
  pricePerSqftAed?: number;
  currency: "AED";
  vatApplicable: boolean;
  vatRate: number;
  transferFeesPct: number;

  // Size
  sizeSqftMin?: number;
  sizeSqftMax?: number;
  sizeSqmMin?: number;
  sizeSqmMax?: number;
  plotSizeSqftMin?: number;
  plotSizeSqftMax?: number;
  builtUpAreaSqftMin?: number;
  builtUpAreaSqftMax?: number;

  // Bedroom and unit info (residential variants)
  bedrooms?: number | null;
  bedroomLabel?: string;
  bathrooms?: number;
  availableUnits?: number;
  totalUnits?: number;
  soldUnits?: number;

  // Yield and investment
  grossYieldPct?: number;
  netYieldPct?: number;
  serviceChargePerSqft?: number;
  goldenVisaEligible?: boolean;
  mortgageEligible?: boolean;
  maxLtv?: number;

  // Payment plan
  paymentPlan?: PaymentPlan;

  // Fractional ownership
  fractionalOwnership?: FractionalOwnership;

  // Computed (cloud function maintained)
  investmentScore?: number;
  priceUsd?: number;
  priceEur?: number;
  priceGbp?: number;
  popularityScore?: number;
  lastSyncedAt?: any;

  // Denormalized from parent (cloud function maintained — DO NOT write directly)
  developmentName?: string;
  developerName?: string;
  developerId?: string;
  community?: string;
  subCommunity?: string;
  coordinates?: Coordinates;
  metroDistanceKm?: number;
  beachAccess?: boolean;
  tenure?: Tenure;
  foreignOwnershipAllowed?: boolean;
  reraProjectNumber?: string;
  escrowBank?: string;
  dldStarRating?: number;
  coverImageUrl?: string;
  expectedHandover?: any;
  saleStatus?: SaleStatus;
  constructionStatus?: ConstructionStatus;
  constructionPct?: number;

  // Type-specific fields go here (polymorphic by `type`)
  details?: Record<string, any>;
}

export type ProjectVariantCreate = Omit
  ProjectVariantBase,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "disclosedAt"
  | "investmentScore"
  | "priceUsd"
  | "priceEur"
  | "priceGbp"
  | "popularityScore"
  | "lastSyncedAt"
  | "developmentName"
  | "developerName"
  | "developerId"
  | "community"
  | "subCommunity"
  | "coordinates"
  | "metroDistanceKm"
  | "beachAccess"
  | "tenure"
  | "foreignOwnershipAllowed"
  | "reraProjectNumber"
  | "escrowBank"
  | "dldStarRating"
  | "coverImageUrl"
  | "expectedHandover"
  | "saleStatus"
  | "constructionStatus"
  | "constructionPct"
>;

export type ProjectVariantUpdate = Partial<Omit<ProjectVariantBase, "id" | "createdAt" | "createdBy" | "disclosedAt" | "developmentId">>;

// ═══════════════════════════════════════════════════════════════
// v1 backward-compatibility aliases (deprecated)
// ═══════════════════════════════════════════════════════════════
// Session 5B used the name `ProjectBase` for the one-collection design.
// v2 renames this to `ProjectVariantBase`. These aliases keep any existing
// imports from breaking during the transition. Remove after Sessions 8-10
// wire the admin form to the new names.

export type ProjectBase = ProjectVariantBase;
export type ProjectCreate = ProjectVariantCreate;
export type ProjectUpdate = ProjectVariantUpdate;