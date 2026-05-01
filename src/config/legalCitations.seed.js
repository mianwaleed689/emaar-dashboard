// src/config/legalCitations.seed.js
//
// Seed data for the `legal_citations/` Firestore collection.
//
// CRITICAL: Federal Decree-Law 25/2025 takes effect 1 June 2026.
// All current Civil Code (Federal Law 5/1985) citations are pre-seeded with
// effectiveUntil: '2026-05-31', and their replacements are pre-seeded with
// effectiveFrom: '2026-06-01'. The <LegalCite> component will auto-switch.
//
// Sources verified per /research/phase2_legal_regulatory.md (research-validated 2026-04-25)

export const LEGAL_CITATIONS_SEED = [
  // ─────────────────────────────────────────────────────────────────
  // ACTIVE LAWS (no replacement scheduled)
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'law-8-2007-escrow',
    shortName: 'Law 8/2007',
    fullCitation: 'Dubai Law No. (8) of 2007 Concerning Escrow Accounts for Real Estate Development',
    summary: 'Mandates separate escrow account per off-plan project; 5% retention released 1 year after handover; AED 100K + jail penalties for violations.',
    jurisdiction: 'Dubai Emirate',
    issuingAuthority: 'Government of Dubai',
    effectiveFrom: '2007-01-01',
    effectiveUntil: null,
    replacedById: null,
    sourceUrl: 'https://dlp.dubai.gov.ae/Legislation%20Reference/2007/Law%20No.%20(8)%20of%202007.html',
    tags: ['escrow', 'off-plan', 'developer-compliance'],
  },
  {
    id: 'law-9-2007-developer-deposit',
    shortName: 'Law 9/2007',
    fullCitation: 'Dubai Law No. (9) of 2007 — Developer Upfront Deposit Requirement',
    summary: 'Requires developers to deposit 20% of construction cost upfront (cash or bank guarantee) before launching off-plan sales.',
    jurisdiction: 'Dubai Emirate',
    issuingAuthority: 'Government of Dubai',
    effectiveFrom: '2007-01-01',
    effectiveUntil: null,
    replacedById: null,
    sourceUrl: 'https://dubailand.gov.ae/media/zrrd4qw4/en-legislation.pdf',
    tags: ['off-plan', 'developer-compliance'],
  },
  {
    id: 'law-13-2008-interim-register',
    shortName: 'Law 13/2008',
    fullCitation: 'Dubai Law No. (13) of 2008 Regulating the Interim Real Property Register (Oqood)',
    summary: 'Establishes the Interim Real Property Register (Oqood) for off-plan unit registration before title deed issuance.',
    jurisdiction: 'Dubai Emirate',
    issuingAuthority: 'Government of Dubai',
    effectiveFrom: '2008-01-01',
    effectiveUntil: null,
    replacedById: null,
    sourceUrl: 'https://dubailand.gov.ae/media/zrrd4qw4/en-legislation.pdf',
    tags: ['off-plan', 'oqood', 'registration'],
  },
  {
    id: 'law-19-2020-cancellation',
    shortName: 'Law 19/2020',
    fullCitation: 'Dubai Law No. (19) of 2020 — Off-Plan Project Cancellation Procedures',
    summary: 'Updated procedures for off-plan contract termination, buyer default thresholds, and developer retention caps based on completion percentage.',
    jurisdiction: 'Dubai Emirate',
    issuingAuthority: 'Government of Dubai',
    effectiveFrom: '2020-01-01',
    effectiveUntil: null,
    replacedById: null,
    sourceUrl: 'https://dubailand.gov.ae/',
    tags: ['cancellation', 'termination', 'off-plan'],
  },
  {
    id: 'decree-43-2013-rent-index',
    shortName: 'Decree 43/2013',
    fullCitation: 'Dubai Government Decree No. (43) of 2013 — Rent Increase Caps',
    summary: 'Sets maximum permissible rent increases on lease renewals based on how far below market average the current rent sits (0%, 5%, 10%, 15%, or 20% caps). Implemented via the DLD Rent Index / Rental Increase Calculator on the Dubai REST app.',
    jurisdiction: 'Dubai Emirate',
    issuingAuthority: 'Government of Dubai',
    effectiveFrom: '2013-01-01',
    effectiveUntil: null,
    replacedById: null,
    sourceUrl: 'https://dubailand.gov.ae/',
    tags: ['rent', 'tenancy', 'rent-index'],
  },
  {
    id: 'decree-41-2013-holiday-homes',
    shortName: 'Decree 41/2013',
    fullCitation: 'Dubai Decree No. (41) of 2013 — Holiday Homes Framework',
    summary: 'Established the Holiday Homes regime for short-term rentals. Currently administered by DET (Department of Economy & Tourism, formerly DTCM) under the Holiday Homes 2.0 system. Permit AED 1,520-3,720/year; Tourism Dirham AED 10-15 per bedroom per night for first 30 consecutive nights.',
    jurisdiction: 'Dubai Emirate',
    issuingAuthority: 'Government of Dubai',
    effectiveFrom: '2013-01-01',
    effectiveUntil: null,
    replacedById: null,
    sourceUrl: 'https://www.visitdubai.com/en/business-in-dubai/why-dubai/holiday-homes',
    tags: ['short-term-rental', 'str', 'holiday-home', 'det'],
  },
  {
    id: 'decree-33-2020-tribunal',
    shortName: 'Decree 33/2020',
    fullCitation: 'Dubai Decree No. (33) of 2020 — Special Tribunal for Cancelled Real Estate Projects',
    summary: 'Established the Special Tribunal with exclusive jurisdiction over cancelled and unfinished real estate projects, ensuring orderly liquidation and refund processes.',
    jurisdiction: 'Dubai Emirate',
    issuingAuthority: 'Government of Dubai',
    effectiveFrom: '2020-01-01',
    effectiveUntil: null,
    replacedById: null,
    sourceUrl: 'https://dubailand.gov.ae/',
    tags: ['cancellation', 'tribunal', 'refund'],
  },
  {
    id: 'cbuae-circular-31-2013-mortgage',
    shortName: 'CBUAE Circular 31/2013',
    fullCitation: 'UAE Central Bank Circular No. 31/2013 — Regulations Regarding Mortgage Loans (as amended by Board Resolution 31/2/2020)',
    summary: 'LTV caps: UAE Nationals 85%/75% (≤/>AED 5M); Expats 80%/70% (≤/>AED 5M); off-plan 50% all categories; second property: UAE national 65%, expat 60%; DBR cap 50%; max tenor 25 years.',
    jurisdiction: 'United Arab Emirates',
    issuingAuthority: 'Central Bank of the UAE',
    effectiveFrom: '2013-12-01',
    effectiveUntil: null,
    replacedById: null,
    sourceUrl: 'https://rulebook.centralbank.ae/en/rulebook/regulations-regarding-mortgage-loans',
    tags: ['mortgage', 'ltv', 'dbr', 'central-bank'],
  },

  // ─────────────────────────────────────────────────────────────────
  // CIVIL CODE — CURRENT (Federal Law 5/1985) — EXPIRES 2026-05-31
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'civil-code-1985-art-295',
    shortName: 'UAE Civil Code Art. 295',
    fullCitation: 'Federal Law No. (5) of 1985 — UAE Civil Transactions Law, Article 295 (Damages)',
    summary: '"Damages will consist of a money payment." Provides the statutory basis for buyer compensation claims for off-plan delivery delays — including foregone rental income, additional mortgage payments, and ongoing accommodation costs.',
    jurisdiction: 'United Arab Emirates',
    issuingAuthority: 'UAE Federal Government',
    effectiveFrom: '1985-12-15',
    effectiveUntil: '2026-05-31',
    replacedById: 'civil-code-2025-damages',
    sourceUrl: 'https://elaws.moj.gov.ae/UAE-MOJ_LC-En/00_CIVIL%20TRANSACTIONS%20AND%20PROCEDURES/UAE-LC-En_1985-12-15_00005_Kait.html?val=EL1',
    tags: ['civil-code', 'damages', 'delay-compensation', 'expiring-2026-06-01'],
  },
  {
    id: 'civil-code-1985-art-273',
    shortName: 'UAE Civil Code Art. 273',
    fullCitation: 'Federal Law No. (5) of 1985 — UAE Civil Transactions Law, Article 273 (Force Majeure)',
    summary: 'Force majeure: in bilateral contracts, if a force majeure event makes performance impossible, the corresponding obligation ceases and the contract is automatically terminated. Strictly interpreted — event must render performance absolutely impossible, not merely more difficult.',
    jurisdiction: 'United Arab Emirates',
    issuingAuthority: 'UAE Federal Government',
    effectiveFrom: '1985-12-15',
    effectiveUntil: '2026-05-31',
    replacedById: 'civil-code-2025-art-236',
    sourceUrl: 'https://elaws.moj.gov.ae/UAE-MOJ_LC-En/00_CIVIL%20TRANSACTIONS%20AND%20PROCEDURES/UAE-LC-En_1985-12-15_00005_Kait.html?val=EL1',
    tags: ['civil-code', 'force-majeure', 'expiring-2026-06-01'],
  },
  {
    id: 'civil-code-1985-art-249',
    shortName: 'UAE Civil Code Art. 249',
    fullCitation: 'Federal Law No. (5) of 1985 — UAE Civil Transactions Law, Article 249 (Hardship / Exceptional Circumstances)',
    summary: 'Hardship doctrine: where performance is not impossible but has become excessively onerous due to exceptional, unforeseeable, public-nature circumstances, courts have discretionary power to adjust obligations to a reasonable level.',
    jurisdiction: 'United Arab Emirates',
    issuingAuthority: 'UAE Federal Government',
    effectiveFrom: '1985-12-15',
    effectiveUntil: '2026-05-31',
    replacedById: 'civil-code-2025-art-224',
    sourceUrl: 'https://elaws.moj.gov.ae/UAE-MOJ_LC-En/00_CIVIL%20TRANSACTIONS%20AND%20PROCEDURES/UAE-LC-En_1985-12-15_00005_Kait.html?val=EL1',
    tags: ['civil-code', 'hardship', 'expiring-2026-06-01'],
  },
  {
    id: 'civil-code-1985-art-246',
    shortName: 'UAE Civil Code Art. 246',
    fullCitation: 'Federal Law No. (5) of 1985 — UAE Civil Transactions Law, Article 246(1) (Good Faith)',
    summary: '"The contract shall be implemented according to the provisions contained therein and in a manner consistent with the requirements of good faith." Foundational duty applying to both parties.',
    jurisdiction: 'United Arab Emirates',
    issuingAuthority: 'UAE Federal Government',
    effectiveFrom: '1985-12-15',
    effectiveUntil: '2026-05-31',
    replacedById: 'civil-code-2025-good-faith',
    sourceUrl: 'https://elaws.moj.gov.ae/UAE-MOJ_LC-En/00_CIVIL%20TRANSACTIONS%20AND%20PROCEDURES/UAE-LC-En_1985-12-15_00005_Kait.html?val=EL1',
    tags: ['civil-code', 'good-faith', 'expiring-2026-06-01'],
  },

  // ─────────────────────────────────────────────────────────────────
  // CIVIL CODE — REPLACEMENT (Federal Decree-Law 25/2025) — ACTIVATES 2026-06-01
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'civil-code-2025-damages',
    shortName: 'New UAE Civil Code (Damages)',
    fullCitation: 'Federal Decree-Law No. (25) of 2025 — Civil Transactions Law (Damages provision, replaces former Art. 295)',
    summary: 'Damages provision under the new Civil Transactions Law. Replaces Federal Law 5/1985 Article 295 from 1 June 2026. Continues to permit monetary compensation for breach of contract including foregone rental income, mortgage costs, and accommodation costs caused by delivery delay. Final article number to be confirmed against official gazette text.',
    jurisdiction: 'United Arab Emirates',
    issuingAuthority: 'UAE Federal Government',
    effectiveFrom: '2026-06-01',
    effectiveUntil: null,
    replacedById: null,
    sourceUrl: 'https://uaelegislation.gov.ae/en/news/the-uae-government-issues-a-federal-decree-law-promulgating-the-civil-transactions-law',
    tags: ['civil-code', 'damages', 'delay-compensation', 'new-law'],
  },
  {
    id: 'civil-code-2025-art-236',
    shortName: 'New UAE Civil Code Art. 236',
    fullCitation: 'Federal Decree-Law No. (25) of 2025 — Civil Transactions Law, Article 236 (Force Majeure, replaces former Art. 273)',
    summary: 'Force majeure provision under the new Civil Transactions Law. Replaces Federal Law 5/1985 Article 273 from 1 June 2026. Maintains the impossibility-of-performance threshold. Article number per Al Tamimi & Co. analysis (Jan 2026).',
    jurisdiction: 'United Arab Emirates',
    issuingAuthority: 'UAE Federal Government',
    effectiveFrom: '2026-06-01',
    effectiveUntil: null,
    replacedById: null,
    sourceUrl: 'https://uaelegislation.gov.ae/en/news/the-uae-government-issues-a-federal-decree-law-promulgating-the-civil-transactions-law',
    tags: ['civil-code', 'force-majeure', 'new-law'],
  },
  {
    id: 'civil-code-2025-art-224',
    shortName: 'New UAE Civil Code Art. 224',
    fullCitation: 'Federal Decree-Law No. (25) of 2025 — Civil Transactions Law, Article 224 (Hardship, replaces former Art. 249)',
    summary: 'Hardship / exceptional circumstances provision under the new Civil Transactions Law. Replaces Federal Law 5/1985 Article 249 from 1 June 2026. Expressly empowers courts to restore contractual equilibrium through extension, adjustment, or other measures. Article number per Al Tamimi & Co. analysis.',
    jurisdiction: 'United Arab Emirates',
    issuingAuthority: 'UAE Federal Government',
    effectiveFrom: '2026-06-01',
    effectiveUntil: null,
    replacedById: null,
    sourceUrl: 'https://uaelegislation.gov.ae/en/news/the-uae-government-issues-a-federal-decree-law-promulgating-the-civil-transactions-law',
    tags: ['civil-code', 'hardship', 'new-law'],
  },
  {
    id: 'civil-code-2025-good-faith',
    shortName: 'New UAE Civil Code (Good Faith)',
    fullCitation: 'Federal Decree-Law No. (25) of 2025 — Civil Transactions Law (Good Faith, replaces former Art. 246)',
    summary: 'Good faith doctrine under the new Civil Transactions Law. Replaces Federal Law 5/1985 Article 246(1) from 1 June 2026. Articles 119-122 of the new law codify comprehensive rules on contractual interpretation and expressly embed the doctrine of good faith as a central contractual principle.',
    jurisdiction: 'United Arab Emirates',
    issuingAuthority: 'UAE Federal Government',
    effectiveFrom: '2026-06-01',
    effectiveUntil: null,
    replacedById: null,
    sourceUrl: 'https://uaelegislation.gov.ae/en/news/the-uae-government-issues-a-federal-decree-law-promulgating-the-civil-transactions-law',
    tags: ['civil-code', 'good-faith', 'new-law'],
  },
];

/**
 * Returns the citation that is currently effective for a given citationId.
 * If the seed has both a current version and a future replacement, this picks
 * the one whose effective range contains today's date.
 *
 * @param {string} requestedId - The citation ID to look up
 * @param {Date} [now=new Date()] - The reference date (default: now)
 * @param {Array} [pool=LEGAL_CITATIONS_SEED] - The pool to search (default: full seed)
 * @returns {object|null} The effective citation or null if none match
 */
export function getEffectiveCitation(requestedId, now = new Date(), pool = LEGAL_CITATIONS_SEED) {
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

  // Direct match
  let citation = pool.find((c) => c.id === requestedId);
  if (!citation) return null;

  // If current citation is still effective, return it
  const isStillEffective =
    citation.effectiveFrom <= today &&
    (citation.effectiveUntil === null || citation.effectiveUntil >= today);

  if (isStillEffective) return citation;

  // Otherwise follow the replacement chain
  while (citation && citation.replacedById) {
    const replacement = pool.find((c) => c.id === citation.replacedById);
    if (!replacement) break;
    if (
      replacement.effectiveFrom <= today &&
      (replacement.effectiveUntil === null || replacement.effectiveUntil >= today)
    ) {
      return replacement;
    }
    citation = replacement;
  }

  // No effective citation found — return the original (caller should handle)
  return pool.find((c) => c.id === requestedId);
}
