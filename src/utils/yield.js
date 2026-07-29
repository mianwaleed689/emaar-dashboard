/**
 * Single source of truth for yield mathematics.
 *
 * Why this exists: net yield used to be `gross * 0.78` — a flat multiple applied
 * to every community. That made "Net Yield" indistinguishable from "Gross Yield"
 * as a ranking, and ignored the single biggest cost difference between Dubai
 * communities: service charges.
 *
 * Worked example of what the flat multiple hid:
 *   Al Barsha 1 — gross 6.5%, service charge AED 15/sqft, PPSF 1,740 -> drag 0.86%
 *   Al Barsha 3 — gross 6.5%, service charge AED 15/sqft, PPSF   602 -> drag 2.49%
 * Same gross yield, nearly 3x the service-charge burden. The old formula reported
 * identical net yields (5.3%) for both.
 */

/** Default operating assumptions. Exported so the UI can disclose them. */
export const YIELD_ASSUMPTIONS = {
  vacancyRate: 0.05,     // 5% of gross rent — typical Dubai void allowance
  managementRate: 0.05,  // 5% of gross rent — letting/management fee
};

/**
 * Annual service charge expressed as a percentage of property value.
 *
 * serviceCharge is AED per sqft per year; ppsf is AED per sqft of value.
 *   (serviceCharge * sqft) / (ppsf * sqft) === serviceCharge / ppsf
 * so the unknown floor area cancels out entirely.
 *
 * @returns {number|null} percentage points, or null if not computable
 */
export function serviceChargeDrag(serviceCharge, ppsf) {
  const sc = parseFloat(serviceCharge);
  const p = parseFloat(ppsf);
  if (!(sc > 0) || !(p > 0)) return null;
  return (sc / p) * 100;
}

/**
 * Net rental yield after service charges, vacancy and management.
 *
 * netYield = gross * (1 - vacancy - management) - serviceChargeDrag
 *
 * Returns null when the inputs don't support a real answer. Callers must render
 * an em dash rather than substitute a guess — a missing number is honest, an
 * invented one is not.
 *
 * @returns {number|null} percentage, one decimal place
 */
export function computeNetYield(grossYield, serviceCharge, ppsf, opts = {}) {
  const gross = parseFloat(grossYield);
  if (!(gross > 0)) return null;

  const {
    vacancyRate = YIELD_ASSUMPTIONS.vacancyRate,
    managementRate = YIELD_ASSUMPTIONS.managementRate,
  } = opts;

  const drag = serviceChargeDrag(serviceCharge, ppsf);
  if (drag === null) return null;

  const net = gross * (1 - vacancyRate - managementRate) - drag;
  return Math.max(0, parseFloat(net.toFixed(1)));
}

/**
 * Attach a computed net yield to a community record.
 *
 * Adds:
 *   netYield        — computed value, or null when not computable
 *   netYieldBasis   — 'computed' | 'unavailable', so the UI can be honest
 *   serviceChargePct— the service-charge drag, for display/tooltips
 *
 * Any pre-existing netYield is preserved as `netYieldReported` rather than
 * silently overwritten, so the two can be compared.
 */
export function withComputedNetYield(row, opts = {}) {
  const ppsf = row.avgPpsf ?? row.medianPPSF ?? row.ppsf;
  const net = computeNetYield(row.grossYield, row.serviceCharge, ppsf, opts);
  const drag = serviceChargeDrag(row.serviceCharge, ppsf);
  return {
    ...row,
    netYieldReported: row.netYield ?? null,
    netYield: net,
    netYieldBasis: net === null ? "unavailable" : "computed",
    serviceChargePct: drag === null ? null : parseFloat(drag.toFixed(2)),
  };
}
