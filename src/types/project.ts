/* ─────────────────────────────────────────────────────────────
   DXB ANALYTICS — PROJECT TYPES (TypeScript)
   src/types/project.ts

   TypeScript interface definitions for the project schema.
   This file is documentation-as-code: even if the rest of the
   project is JavaScript, the .ts file gives editor autocomplete
   and lets you incrementally add type-checking later.

   Locked in Session 4 schema spec (docs/schema-v1.md).
   Last updated: 8 April 2026
   ───────────────────────────────────────────────────────────── */

// ── Master types ──────────────────────────────────────────────

export type MasterCategory = "residential" | "commercial" | "industrial" | "land" | "specialty";

export type DldClass = "land" | "unit" | "villa";

export type Tenure = "freehold" | "leasehold" | "usufruct" | "musataha" | "grant";

export type Visibility = "draft" | "published" | "archived";

export type SaleStatus = "off-plan" | "ready" | "secondary" | "sold-out" | "coming-soon";

export type ConstructionStatus = "pre-launch" | "under-construction" | "completed" | "handover-ready";

export type Emirate = "Dubai" | "Abu Dhabi" | "Sharjah" | "Ajman" | "Umm Al Quwain" | "Ras Al Khaimah" | "Fujairah";

// ── Sub-objects ───────────────────────────────────────────────

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

// ── The base project record ───────────────────────────────────
// This is what every project looks like, regardless of property type.
// The `details` object holds the type-specific fields.

export interface ProjectBase {
  // Identification
  id: string;
  slug: string;
  name: string;
  developmentId: string;
  developmentName: string;

  // Ownership and tenancy
  orgId: string;
  actualOwnerId?: string;
  listingAgentId?: string;
  visibility: Visibility;
  createdAt: any; // Firestore Timestamp
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
  disclosedAt?: any; // set on first publish, immutable
  sourceVerified: boolean;
  sourceUrl?: string;

  // Type and category
  type: string; // one of PROPERTY_TYPE_IDS
  category: MasterCategory;
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

  // Pricing (all in AED)
  priceFromAed: number;
  priceToAed?: number;
  pricePerSqftAed?: number;
  currency: "AED";
  vatApplicable: boolean;
  vatRate: number;
  transferFeesPct: number;

  // Size
  sizeSqft: number;
  sizeSqm?: number;
  plotSizeSqft?: number;
  builtUpAreaSqft?: number;

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

  // Developer
  developerId: string;
  developerName: string;
  developerOnTimeRate?: number;

  // Regulatory
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

  // Yield and investment
  grossYieldPct?: number;
  netYieldPct?: number;
  serviceChargePerSqft?: number;
  expectedAppreciationPct?: number;
  goldenVisaEligible?: boolean;
  mortgageEligible?: boolean;
  maxLtv?: number;

  // Payment plan
  paymentPlan?: PaymentPlan;

  // Media
  coverImageUrl?: string;
  images?: string[];
  floorPlanUrl?: string;
  brochureUrl?: string;
  videoUrl?: string;
  virtualTourUrl?: string;

  // Tags and search aids
  tags?: string[];
  amenities?: string[];
  views?: string[];
  lifestyle?: string[];

  // Fractional ownership
  fractionalOwnership?: FractionalOwnership;

  // Computed (cloud function maintained — never write directly)
  investmentScore?: number;
  priceUsd?: number;
  priceEur?: number;
  priceGbp?: number;
  popularityScore?: number;
  lastSyncedAt?: any;

  // Type-specific fields go here
  details?: Record<string, any>;
}

// ── Convenience type for create payloads ──────────────────────
// When creating a new record, server-managed fields are absent.

export type ProjectCreate = Omit
  ProjectBase,
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
>;

// ── Convenience type for update payloads ──────────────────────
// All fields optional, but disclosedAt cannot be changed once set.

export type ProjectUpdate = Partial<Omit<ProjectBase, "id" | "createdAt" | "createdBy" | "disclosedAt">>;