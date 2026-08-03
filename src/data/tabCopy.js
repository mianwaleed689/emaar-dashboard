/**
 * TAB COPY — the explanation and provenance for every tab, in one file.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * The clarity check across all 29 shipped tabs (2026-08-02) found:
 *
 *     14 tabs   no plain-English explanation before the controls
 *      7 tabs   no source stated anywhere
 *      1 tab    passed clean (Yields)
 *
 * Writing 14 separate intros guarantees they drift. They live here instead, and
 * <TabIntro> / <TabProvenance> render them.
 *
 * ── THE RULES ───────────────────────────────────────────────────────────────
 *
 *   · `what` is one sentence in plain words. Not a method. What IS this.
 *   · state coverage — what is included AND what is not
 *   · every source is named; `kind: "own"` for the customer's own records
 *   · `asOf` is a real date. If it is old, the component says so on screen
 *   · no jargon — see the banned list in TAB_CLARITY.md
 *
 * Every figure quoted below was read off the running app on 2026-08-02.
 */

export const TAB_COPY = {

  /* ── FIND A PROPERTY ─────────────────────────────────────────────────── */

  "Projects": {
    title: "Projects",
    what: "Every residential project registered in Dubai that we hold a record for, " +
          "with its price, its escrow bank, how far construction has progressed and " +
          "when it is due to hand over.",
    detail: "Use it to shortlist. Start with the category, then narrow by developer, " +
            "community and build stage.",
    includes: "1,552 projects across all Dubai developers",
    excludes: "Projects with no registered sale activity",
    provenance: {
      kind: "market",
      sources: [{ name: "Dubai Land Department", detail: "project registry" },
                { name: "Developer sources", detail: "pricing and handover" }],
      method: "Project records held in the platform, matched to Land Department " +
              "registrations where a project number exists.",
      caveat: "Where a project has no recorded property type it is shown as " +
              "\"Type not specified\" rather than guessed.",
    },
  },

  "Neighbourhoods": {
    title: "Neighbourhoods",
    what: "Every Dubai community we hold figures for, side by side — what a square " +
          "foot costs, what it rents for, and how close it is to a metro station, " +
          "a school or the beach.",
    detail: "Price per square foot is the sale price divided by the floor area. It " +
            "is how Dubai compares one community against another, because it strips " +
            "out unit size. Gross return is a year's rent as a percentage of the " +
            "purchase price, before any costs. Across Dubai the middle community " +
            "sits at AED 1,735 per square foot and a 5.7% gross return — use those " +
            "to judge whether a community is dear or cheap.",
    includes: "193 communities. 93 carry a price measured from Land Department " +
              "sales and 72 a return measured against registered tenancy contracts.",
    excludes: "Service charge and net return are not measured — no per-community " +
              "rate is published, so those two remain estimates and are marked as such.",
    warning: "Each figure carries a badge showing how it was arrived at and how many " +
             "sales sit behind it. Where a community has no measured figure the card " +
             "says so rather than showing a filler number. Check the badge before " +
             "you quote anything to a client.",
    provenance: {
      kind: "market",
      sources: [{ name: "Dubai Land Department", detail: "registered sale transactions" },
                { name: "Ejari", detail: "registered tenancy contracts" },
                { name: "Platform records", detail: "distances, amenities and scores" }],
      method: "Price per square foot is the middle sale price in that community in " +
              "the most recent year on record — currently 2026, which is still " +
              "running, so samples are smaller than a full year. Each card names " +
              "the year and the number of sales it used. Gross return is the middle " +
              "figure across unit types, from sale prices and registered rents in " +
              "the same community.",
      caveat: "Where the market name differs from the Land Department's, the card " +
              "names the record actually read — Jumeirah Lake Towers is filed as Al " +
              "Thanyah Fifth, for instance. A figure drawn from fewer than 30 sales " +
              "is flagged, because one unusual deal can still move it.",
    },
  },

  "Map": {
    title: "Map",
    /* Was ten lines of prose. An agent scrolled straight past it to reach the
       map, which is the opposite of explaining anything. Say the job in one
       sentence; the controls carry their own labels and tooltips. */
    what: "Where in Dubai your client should be looking, for what they want to spend.",
    detail: "Colour the map by price or by return, click any pin for that " +
            "community's figures, or type a name to fly straight to it.",
    includes: "193 communities · solid pin = counted from Land Department sales " +
              "(94) · dashed ring = estimate (99)",
    warning: "A dashed ring was never measured. Click the pin before quoting it.",
    provenance: {
      kind: "market",
      sources: [{ name: "Dubai Land Department", detail: "sale transactions" },
                { name: "Ejari", detail: "registered tenancy contracts" }],
      method: "The same community figures as the Neighbourhoods tab, plotted by " +
              "location. Price per square foot and gross return come from counted " +
              "records; net return and service charge remain estimates.",
      caveat: "Communities with no coordinates on record cannot be plotted.",
    },
  },

  "Launch Calendar": {
    title: "Launch Calendar",
    what: "New projects coming to market, so you know what is launching before " +
          "your client asks about it.",
    detail: "Filter by developer, community or expected launch period.",
    includes: "Announced and recently launched projects",
    excludes: "Unannounced or off-market releases",
    provenance: {
      kind: "market",
      sources: [{ name: "Dubai Land Department", detail: "project registrations" },
                { name: "Developer announcements" }],
      method: "New project registrations and public launch announcements, refreshed daily.",
    },
  },

  "Handover": {
    title: "Handover Tracker",
    what: "When projects are due to complete, and how far construction has actually " +
          "progressed — the difference between a promised date and a real one.",
    detail: "Use it to judge whether an off-plan handover date is credible before " +
            "a client commits to it.",
    includes: "1,193 projects carrying a handover date · 355,408 units",
    excludes: "Projects with no registered completion date",
    provenance: {
      kind: "market",
      sources: [{ name: "Dubai Land Department", detail: "project register" },
                { name: "Escrow and construction filings" }],
      method: "Construction percentage and expected completion as filed with the " +
              "Land Department. Average completion across tracked projects is 29%.",
      caveat: "A filed completion date is the developer's stated intention, not a " +
              "guarantee. Compare it against the construction percentage.",
    },
  },

  /* ── ADVISE A CLIENT ─────────────────────────────────────────────────── */

  "DXB Estimate": {
    title: "DXB Estimate",
    what: "An estimated value for a specific property, based on what similar " +
          "properties in the same community have actually sold for.",
    detail: "Enter the community, size and condition. The estimate adjusts for " +
            "floor level and condition using standard valuer rules of thumb.",
    includes: "193 communities with recorded sale prices",
    excludes: "Any property in a community with no recorded sales",
    warning: "This is an estimate, not a valuation. It cannot see the specific unit, " +
             "its view, its finish or its layout. Use it to frame a conversation, " +
             "not to set a price.",
    provenance: {
      kind: "estimate",
      sources: [{ name: "Dubai Land Department", detail: "recorded sale prices" }],
      method: "Community price per square foot multiplied by the property size, " +
              "then adjusted for floor level and condition.",
      caveat: "A range is shown rather than a single figure because that is what " +
              "the evidence supports.",
    },
  },

  /* ── MODEL A DEAL ────────────────────────────────────────────────────── */

  "Flip": {
    title: "Flip Calculator",
    what: "What you would actually keep after buying a property, improving it and " +
          "selling it — with every Dubai transaction cost included.",
    detail: "Dubai charges 4% Land Department fee on the purchase and again on the " +
            "sale. There is no capital gains tax. Both are built into the result.",
    includes: "Purchase costs, renovation, holding costs, sale costs, mortgage leverage",
    excludes: "Your own time, and any service charge arrears attached to the unit",
    provenance: {
      kind: "estimate",
      sources: [{ name: "Dubai Land Department", detail: "fee schedule" },
                { name: "UAE Central Bank", detail: "mortgage rates" }],
      method: "A model, not a record. It applies the fees and rates you enter to " +
              "the numbers you enter.",
      caveat: "The output is only as good as the resale price you assume. Check it " +
              "against the Price History tab for that community.",
    },
  },

  "Golden Visa": {
    title: "Golden Visa",
    what: "Which properties qualify a buyer for a 10-year UAE residency visa, and " +
          "what the rules actually require.",
    detail: "The threshold is AED 2 million in property value. Since 2026 there is " +
            "no minimum upfront payment, and off-plan and mortgaged properties both " +
            "qualify.",
    includes: "Projects priced at or above the AED 2M threshold",
    excludes: "Visa routes not based on property — investment funds, talent, retirement",
    provenance: {
      kind: "market",
      sources: [{ name: "UAE Federal Authority for Identity and Citizenship" },
                { name: "Dubai Land Department", detail: "project prices" }],
      method: "Projects filtered against the published AED 2M property threshold.",
      caveat: "Eligibility is confirmed by the authorities, not by this platform. " +
              "Treat this as a shortlist, not a decision.",
    },
  },

  /* ── FINANCE THE DEAL ────────────────────────────────────────────────── */

  "Mortgage": {
    title: "Mortgage",
    what: "What a mortgage would actually cost each month, using the current " +
          "interbank rate that UAE banks price from.",
    detail: "EIBOR is the rate banks lend to each other at. Your client's rate is " +
            "EIBOR plus the bank's margin, so the margin matters as much as the rate.",
    includes: "Monthly payment, total interest, Land Department fees, loan-to-value limits",
    excludes: "Bank arrangement fees and life insurance, which vary by lender",
    provenance: {
      kind: "market",
      sources: [{ name: "UAE Central Bank", detail: "EIBOR benchmark rates" },
                { name: "Central Bank Circular 31/2013", detail: "loan-to-value caps" }],
      method: "Live EIBOR rates with bank margins applied. Loan-to-value limits " +
              "follow the Central Bank circular: 80% for expatriates on a first " +
              "property under AED 5M, 50% on off-plan.",
      caveat: "Bank margins shown are indicative. Confirm the exact rate with the " +
              "lender before quoting a monthly payment.",
    },
  },

  /* ── RESEARCH THE MARKET ─────────────────────────────────────────────── */

  "DLD Volumes": {
    title: "Transaction Volumes",
    what: "How much property actually changed hands in each community — the number " +
          "of sales and their combined value.",
    detail: "Volume tells you how easily a property will resell. A community with " +
            "very few transactions is harder to exit, whatever the price does.",
    includes: "Tracked communities, full year 2025",
    excludes: "Land and whole-building sales",
    provenance: {
      kind: "market",
      sources: [{ name: "Dubai Land Department", detail: "registered transactions" }],
      method: "Counted from registered Land Department sale transactions.",
      caveat: "This covers the communities the platform tracks, which is a subset " +
              "of the whole Dubai market. The Land Department reported more than " +
              "270,000 transactions worth AED 917 billion across all of Dubai in " +
              "2025 — the figures here will be lower and are not a city total.",
    },
  },

  /* ── RUN THE AGENCY — the customer's own records, not market data ─────── */

  "Team": {
    title: "Team",
    what: "Everyone in your agency, what each of them is working on, how many " +
          "leads they are holding and how their pipeline is moving. Invite an " +
          "agent and they appear here with their own login.",
    includes: "Agents you have invited to your agency account",
    provenance: {
      kind: "own",
      sources: [{ name: "Your agency account" }],
      method: "Your own records. Nothing here is market data and nothing is shared " +
              "outside your agency.",
    },
  },

  "Agency": {
    title: "Agency",
    what: "Your agency's overall performance — seats in use, leads in progress and " +
          "deals closed across the whole team.",
    includes: "Your agency's own activity",
    provenance: {
      kind: "own",
      sources: [{ name: "Your agency account" }],
      method: "Your own records, visible only to agency managers.",
    },
  },

  "Pipeline": {
    title: "Pipeline",
    what: "Deals your team is working on, and what stage each one has reached.",
    includes: "Deals you and your agents have created",
    provenance: {
      kind: "own",
      sources: [{ name: "Your agency account" }],
      method: "Your own records. Access is set by your agency manager.",
    },
  },

  /* This claimed the product publishes listings to the portals and that
     "publishing sends them to the portals you connect". Neither is true: there
     is no portal integration and nothing is connected. The buttons open the
     portal in a new tab and record that you posted it yourself. Corrected here
     because a customer reads this before they read anything else on the tab. */
  "Listings": {
    title: "Listings",
    what: "The properties you are marketing, and whether each one may lawfully " +
          "be advertised yet.",
    detail: "Before a Dubai property can be advertised anywhere — a portal, your " +
            "own website, social media or a billboard — the owner must have signed " +
            "a Form A, a Trakheesi permit must have been issued against it and still " +
            "be valid, and the broker holding it must have a current broker card. " +
            "Each listing shows which of those four are in place.",
    includes: "Listings you have created",
    excludes: "Automatic posting to Property Finder, Bayut or dubizzle. There is no " +
              "portal integration — the portal buttons open the site and record that " +
              "you posted it.",
    provenance: {
      kind: "own",
      sources: [{ name: "Your own listings" }],
      method: "Your own records. Nothing here is sent to a portal by us; " +
              "marking a portal records that you posted it yourself.",
    },
  },

  "Data Quality": {
    title: "Data Quality",
    what: "How complete and how trustworthy the platform's own project records are, " +
          "field by field — so you know what to double-check before quoting it.",
    detail: "Every project is scored against the Land Department register and " +
            "public developer sources.",
    includes: "1,728 project records",
    provenance: {
      kind: "market",
      sources: [{ name: "Dubai Land Department" }, { name: "Developer sources" },
                { name: "Property Finder" }, { name: "Bayut" }],
      method: "Each project is compared field by field against its source. The " +
              "average completeness score across all projects is 93%.",
      caveat: "A high score means the record is complete, not that the market has " +
              "not moved since it was captured.",
    },
  },
};

export function tabCopy(name) {
  return TAB_COPY[name] || null;
}
