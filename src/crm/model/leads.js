/**
 * LEADS — the stages, what they mean, and where enquiries come from.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS FILE EXISTS
 *
 * This list used to live inside MyLeadsTab.jsx, which is a React component and
 * therefore unreadable to a plain Node script. So the demo seed wrote its own
 * list instead — and the two drifted, exactly as the deal stages did before
 * journeys.js was imported rather than restated:
 *
 *     the product : Hot Case · New Lead · Potential · No Answer · Low Budget ·
 *                   Non Potential · Whats app · Resale/buy/Rent · EOI ·
 *                   Closed Deal · Closed Outside
 *     the seed    : New Lead · Contacted · Qualified · Viewing Scheduled ·
 *                   Offer Made · Negotiating · Won · Lost
 *
 * One name in common out of eleven. Every consequence followed from that:
 * the stage filter offered eleven stages all reading zero; "Closed Deal"
 * counted nothing, so the conversion rate was 0% and the leaderboard ranked
 * 125 agents equally; and 117 finished leads — 36 won, 81 lost — were still
 * counted open, because OPEN() excludes three stage names that did not exist
 * in the data.
 *
 * Sources drifted the same way, by case alone: the seed wrote "dubizzle",
 * "Walk-in" and "Cold call" where the product reads "Dubizzle", "Walk In" and
 * "Cold Call", so the "Came from" filter matched nothing on three of its
 * fifteen options.
 *
 * Anything that needs to know a lead's vocabulary imports it from here.
 */

/**
 * The eleven stages, in the order they appear in the product.
 *
 * These are one agency's own stages rather than an industry standard, and the
 * tab never said what any of them meant — a new agent had to guess whether a
 * buyer belonged in "Potential" or "Resale/buy/Rent". `means` is written as an
 * instruction for when to use each one, so two agents on the same desk agree.
 */
export const LEAD_STAGES = [
  { key: "Hot Case",        open: true,
    means: "Ready now — viewing booked, offer being drafted, or asking to sign." },
  { key: "New Lead",        open: true,
    means: "Just arrived. Nobody has spoken to them yet." },
  { key: "Potential",       open: true,
    means: "You have spoken and they are genuinely looking. Keep working it." },
  { key: "No Answer",       open: true,
    means: "You tried to reach them and could not. Try again before this goes quiet." },
  { key: "Low Budget",      open: true,
    means: "Real buyer, but their budget does not reach what they asked for." },
  { key: "Non Potential",   open: false,
    means: "Not a buyer — wrong market, testing prices, or a wrong number." },
  { key: "Whats app",       open: true,
    means: "Only ever messaged you. No call has connected yet." },
  { key: "Resale/buy/Rent", open: true,
    means: "Wants the resale market or a rental rather than a new launch." },
  { key: "EOI",             open: true,
    means: "Expression of Interest lodged on a launch. Money or paperwork is in." },
  { key: "Closed Deal",     open: false,
    means: "Signed with you. This is the only stage that counts as a sale." },
  { key: "Closed Outside",  open: false,
    means: "Bought or rented, but not through you. Kept so the loss is visible." },
];

export const STAGE_KEYS = LEAD_STAGES.map(s => s.key);
export const STAGE_MEANING = Object.fromEntries(LEAD_STAGES.map(s => [s.key, s.means]));

/** Stages that are still work. OPEN() in the tab is derived from this. */
export const OPEN_STAGES   = LEAD_STAGES.filter(s => s.open).map(s => s.key);
export const CLOSED_STAGES = LEAD_STAGES.filter(s => !s.open).map(s => s.key);
export const isOpenStage = s => !CLOSED_STAGES.includes(s);

/** The only stage that counts as a sale. Quoted in three places; defined once. */
export const WON_STAGE = "Closed Deal";

/** Where an enquiry can come from. Spelling here is the spelling everywhere. */
export const LEAD_SOURCES = [
  "Property Finder", "Bayut", "Dubizzle", "Meta/Facebook", "Instagram",
  "WhatsApp", "Google Ads", "Referral", "Website", "Cold Call", "TikTok",
  "LinkedIn", "Email Campaign", "Walk In", "Manual",
];

/**
 * The note types that count as having made contact.
 *
 * `contacted()` in the tab reads notes_log for these. A lead is not contacted
 * because a field called lastContactedAt has a date in it — the seed wrote
 * exactly that field, which nothing in the product reads, and so all 418
 * demo leads reported "never contacted" however long ago somebody had rung
 * them.
 */
export const CONTACT_NOTE_TYPES = ["Call", "WhatsApp", "Email", "Viewing", "Offer"];
export const NOTE_TYPES = ["Note", ...CONTACT_NOTE_TYPES, "Follow Up", "Status Update"];

export const madeContact = lead =>
  (lead?.notes_log || []).some(n => CONTACT_NOTE_TYPES.includes(n.type));
