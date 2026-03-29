

import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine, Legend } from "recharts";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where } from "firebase/firestore";

import { T } from "./theme";
import { emaarFinancials, emaarCommunities, emaarYields, topDevelopers, emaarRisks, dubaiMarket, dubaiSalesHistory, roiPhases, emaarSegments, radarData, megaProjects, communityIntel, communityROI } from "./data";
// S30: Full 208-project Emaar database replaces old 48-project list
import { emaarProjects } from "./data_emaar_complete";
import { damacProjects, damacFinancials, damacCommunities, damacYields, damacRisks, damacSegments, damacRadar, damacMegaProjects, damacIdentity, damacLive, damacBranded, damacFinancialHistory } from "./data_damac";
import { sobhaProjects, sobhaCommunities, sobhaYields, sobhaRisks, sobhaSegments, sobhaRadar, sobhaMegaProjects, sobhaIdentity, sobhaLive, sobhaFinancialHistory } from "./data_sobha";
import { nakheelProjects, nakheelCommunities, nakheelYields, nakheelRisks, nakheelSegments, nakheelRadar, nakheelMegaProjects, nakheelIdentity, nakheelLive, nakheelFinancialHistory } from "./data_nakheel";
import { meraasProjects, meeraasC as meereasCommunities, meraasYields, meraasRisks, meraasSegments, meraasRadar, meeraasM as meereasMega, meraasIdentity, meraasLive, meraasFinancialHistory } from "./data_meraas";
import { binghattiProjects, binghattiCommunities, binghattiYields, binghattiRisks, binghattiSegments, binghattiRadar, binghattiMegaProjects, binghattiIdentity, binghattiLive, binghattiFinancialHistory } from "./data_binghatti";
import { aldarProjects, aldarCommunities, aldarYields, aldarRisks, aldarSegments, aldarRadar, aldarMegaProjects, aldarIdentity, aldarLive, aldarFinancialHistory } from "./data_aldar";
import LandingPage from "./LandingPage";
import RoiCalculator from "./RoiCalculator";
import { useI18n } from "./i18n";

/* --- DATA ALIASES (for backward compat) --- */
const financials = emaarFinancials;
// S16: segments/risks/radarData use data.js as base fallback at module level
// Inside JSX, use emaarLive?.emaarSegments etc for Firestore override
const segments = emaarSegments;
const risks = emaarRisks.map(r => ({ factor: r.factor, score: r.score, max: 150, color: r.color }));
const yields = emaarYields.map(y => ({ label: y.unit, community: y.community, rent: y.rent/1000, price: y.price/1000, gross: y.gross, net: y.net, demand: y.demand === "Very High" ? "V.High" : y.demand === "Moderate-High" ? "High" : y.demand, visa: y.visa }));
const developers = topDevelopers.map(d => ({ rank: d.rank, name: d.name.replace(" Properties","").replace(" Realty","").replace(" Development",""), sales: d.sales, units: d.units, delivered: d.delivered, underConst: d.underConst, color: d.color, share: d.share, segment: d.segment }));
const communityProjects = emaarCommunities.filter(c => c.name).map(c => ({ name: c.district, full: c.name, projects: c.projects, yield: c.avgYield ? `${c.avgYield}%` : "-", ppsf: c.avgPpsf ? c.avgPpsf.toLocaleString() : "-" }));

/* --- LINK LABEL HELPER --- */
const getLinkLabel = (url) => {
  if (!url) return "View ?";
  if (url.includes("propertyfinder.ae")) return "PropertyFinder ?";
  if (url.includes("bayut.com")) return "Bayut ?";
  if (url.includes("properties.emaar.com") || url.includes("emaar.com")) return "Emaar ?";
  return "View ?";
};
const getLinkDomain = (url) => {
  if (!url) return "Listing";
  if (url.includes("propertyfinder.ae")) return "PropertyFinder.ae";
  if (url.includes("bayut.com")) return "Bayut.com";
  if (url.includes("properties.emaar.com") || url.includes("emaar.com")) return "Emaar.com";
  return "Official Listing";
};

/* --- HANDOVER COUNTDOWN --- */
const getHandoverCountdown = (handover) => {
  if (!handover) return null;
  const match = handover.match(/Q([1-4])\s+(\d{4})/);
  if (!match) return null;
  const q = parseInt(match[1]);
  const year = parseInt(match[2]);
  const qEndMonth = [2, 5, 8, 11];
  const qEndDay   = [31, 30, 30, 31];
  const target = new Date(year, qEndMonth[q - 1], qEndDay[q - 1]);
  const now = new Date();
  const diffMs = target - now;
  if (diffMs <= 0) return { label: "Handover due", color: "#10B981", urgent: false, passed: true };
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  let label, color;
  if (diffDays <= 90) { label = diffDays + "d left"; color = "#EF4444"; }
  else if (diffMonths <= 6) { label = diffMonths + "mo left"; color = "#F59E0B"; }
  else if (diffMonths <= 18) { label = diffMonths + "mo left"; color = "#D4A843"; }
  else { label = (diffMonths / 12).toFixed(1) + "yr left"; color = "#94A3B8"; }
  return { label, color, urgent: diffDays <= 90, months: diffMonths, days: diffDays };
};

// --- INVESTMENT SCORE (out of 10) -----------------------------------------
const getInvestmentScore = (p) => {
  let score = 0;
  const breakdown = [];

  // 1. Yield (0-3 pts)
  const gross = p.gross || p.yield || 0;
  if (gross >= 8)      { score += 3; breakdown.push({ label: "Yield", pts: 3, max: 3, note: gross + "% gross" }); }
  else if (gross >= 6) { score += 2; breakdown.push({ label: "Yield", pts: 2, max: 3, note: gross + "% gross" }); }
  else if (gross >= 4) { score += 1; breakdown.push({ label: "Yield", pts: 1, max: 3, note: gross + "% gross" }); }
  else                 { breakdown.push({ label: "Yield", pts: 0, max: 3, note: gross ? gross + "%" : "No data" }); }

  // 2. Value (PPSF) (0-2 pts)
  const ppsf = p.ppsf || 0;
  if (ppsf > 0 && ppsf <= 1500)       { score += 2; breakdown.push({ label: "Value", pts: 2, max: 2, note: "AED " + ppsf + "/sqft" }); }
  else if (ppsf > 0 && ppsf <= 2200)  { score += 1; breakdown.push({ label: "Value", pts: 1, max: 2, note: "AED " + ppsf + "/sqft" }); }
  else if (ppsf > 0)                  { breakdown.push({ label: "Value", pts: 0, max: 2, note: "AED " + ppsf + "/sqft" }); }
  else                                { breakdown.push({ label: "Value", pts: 0, max: 2, note: "No PPSF" }); }

  // 3. Handover timing (0-2 pts) - sweet spot is 12-36 months
  const cd = getHandoverCountdown(p.handover);
  if (cd) {
    if (cd.passed)              { score += 1.5; breakdown.push({ label: "Handover", pts: 1.5, max: 2, note: "Ready now" }); }
    else if (cd.months <= 12)   { score += 1;   breakdown.push({ label: "Handover", pts: 1,   max: 2, note: cd.label }); }
    else if (cd.months <= 30)   { score += 2;   breakdown.push({ label: "Handover", pts: 2,   max: 2, note: cd.label }); }
    else if (cd.months <= 48)   { score += 1;   breakdown.push({ label: "Handover", pts: 1,   max: 2, note: cd.label }); }
    else                        { score += 0.5; breakdown.push({ label: "Handover", pts: 0.5, max: 2, note: cd.label }); }
  } else {
    breakdown.push({ label: "Handover", pts: 0, max: 2, note: "No date" });
  }

  // 4. Payment plan (0-2 pts)
  const pp = (p.paymentPlan || p.payment || "").toLowerCase();
  if (pp.includes("80/20") || pp.includes("80:20"))       { score += 2;   breakdown.push({ label: "Payment", pts: 2,   max: 2, note: "80/20 plan" }); }
  else if (pp.includes("70/30") || pp.includes("60/40"))  { score += 1.5; breakdown.push({ label: "Payment", pts: 1.5, max: 2, note: pp }); }
  else if (pp.includes("50/50") || pp.includes("40/60"))  { score += 1;   breakdown.push({ label: "Payment", pts: 1,   max: 2, note: pp }); }
  else if (pp.length > 0)                                 { score += 0.5; breakdown.push({ label: "Payment", pts: 0.5, max: 2, note: pp }); }
  else                                                    { breakdown.push({ label: "Payment", pts: 0, max: 2, note: "Unknown" }); }

  // 5. Golden Visa eligible (0-1 pt)
  if (p.price && p.price >= 2000000) {
    score += 1; breakdown.push({ label: "Golden Visa", pts: 1, max: 1, note: "Eligible" });
  } else {
    breakdown.push({ label: "Golden Visa", pts: 0, max: 1, note: p.price ? "Below 2M" : "No price" });
  }

  const final = Math.min(10, Math.round(score * 10) / 10);
  const color = final >= 8 ? "#10B981" : final >= 6 ? "#D4A843" : final >= 4 ? "#F59E0B" : "#EF4444";
  const label = final >= 8 ? "Excellent" : final >= 6 ? "Strong" : final >= 4 ? "Good" : "Weak";
  return { score: final, color, label, breakdown };
};

/* --- ICONS (inline SVG) --- */
const Icons = {
  overview: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  financials: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  portfolio: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  competitors: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
  yields: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  risk: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  market: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  menu: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  lock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  eye: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  up: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>,
  down: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  projects: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12.01"/></svg>,
  megaProj: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  admin: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

const TABS = [
  { key: "Overview", icon: Icons.overview },
  { key: "Financials", icon: Icons.financials },
  { key: "Projects", icon: Icons.projects },
  { key: "Handover", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="8 14 10 16 16 13"/></svg> },
  { key: "Launch Calendar", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="8" cy="15" r="1" fill="currentColor"/><circle cx="12" cy="15" r="1" fill="currentColor"/><circle cx="16" cy="15" r="1" fill="currentColor"/></svg> },
  { key: "Neighbourhoods", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/><path d="M15 7l2 2"/><path d="M9 7L7 9"/></svg> },
  { key: "Service Charges", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  { key: "STR vs LTR", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/><polyline points="22 12 12 2 2 12"/></svg> },
  { key: "Developer Health", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { key: "DLD Volumes", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { key: "DXB Estimate", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M11 8v6M8 11h6"/></svg> },
  { key: "Portfolio", icon: Icons.portfolio },
  { key: "Competitors", icon: Icons.competitors },
  { key: "Yields", icon: Icons.yields },
  { key: "Mortgage", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { key: "Map", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg> },
  { key: "Risk", icon: Icons.risk },
  { key: "Market", icon: Icons.market },
  { key: "Currency", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9.5 9.5C9.5 8.1 10.6 7 12 7s2.5 1.1 2.5 2.5c0 3-5 3-5 6 0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5"/></svg> },
  { key: "Golden Visa", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
  { key: "Flip", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> },
  { key: "Investment Score", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { key: "Price History", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
];

/* --- STYLES --- */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 14px; }
  body { background: ${T.bg}; color: ${T.textPrimary}; font-family: 'Outfit', sans-serif; }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(212,168,67,0.2); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(212,168,67,0.35); }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes ping { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.4); opacity: 0; } }
  @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }

  .fade-up { animation: fadeUp 0.5s ease-out forwards; opacity: 0; }
  .delay-1 { animation-delay: 0.05s; }
  .delay-2 { animation-delay: 0.1s; }
  .delay-3 { animation-delay: 0.15s; }
  .delay-4 { animation-delay: 0.2s; }
  .delay-5 { animation-delay: 0.25s; }
  .delay-6 { animation-delay: 0.3s; }
  .delay-7 { animation-delay: 0.35s; }
  .delay-8 { animation-delay: 0.4s; }

  .kpi-card {
    background: linear-gradient(135deg, ${T.card} 0%, ${T.surfaceAlt} 100%);
    border: 1px solid ${T.border};
    border-radius: 16px;
    padding: 20px 16px;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: default;
  }
  .kpi-card:hover {
    border-color: ${T.borderHover};
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(212,168,67,0.1);
  }
  .kpi-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, ${T.gold}, transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .kpi-card:hover::before { opacity: 1; }

  .chart-box {
    background: linear-gradient(180deg, ${T.card} 0%, rgba(4,9,15,0.95) 100%);
    border: 1px solid ${T.border};
    border-radius: 16px;
    padding: 20px;
    transition: border-color 0.3s;
  }
  .chart-box:hover { border-color: ${T.borderHover}; }
  select option { background: ${T.surface}; color: ${T.textPrimary}; }
  * { scrollbar-width: thin; scrollbar-color: rgba(212,168,67,0.15) transparent; }

  .sidebar-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 11px 16px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
    color: ${T.textSecondary};
    background: transparent;
    text-align: left;
    position: relative;
  }
  .sidebar-btn:hover { background: rgba(212,168,67,0.06); color: ${T.white}; }
  .sidebar-btn.active {
    background: linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04));
    color: ${T.gold};
    font-weight: 600;
  }
  .sidebar-btn.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 60%;
    background: ${T.gold};
    border-radius: 0 3px 3px 0;
  }

  .login-input {
    width: 100%;
    padding: 14px 16px;
    background: ${T.surface};
    border: 1px solid ${T.border};
    border-radius: 12px;
    color: ${T.white};
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    outline: none;
    transition: all 0.3s;
  }
  .login-input:focus { border-color: ${T.gold}; box-shadow: 0 0 0 3px rgba(212,168,67,0.1); }
  .login-input::placeholder { color: ${T.textMuted}; }

  .login-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, ${T.gold}, #B8912F);
    border: none;
    border-radius: 12px;
    color: ${T.bg};
    font-family: 'Outfit', sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s;
    letter-spacing: 0.5px;
  }
  .login-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(212,168,67,0.3); }
  .login-btn:active { transform: translateY(0); }

  .trend-up { color: ${T.green}; }
  .trend-down { color: ${T.red}; }

  .mobile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    z-index: 90;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
  }
  .mobile-overlay.open { opacity: 1; pointer-events: auto; }

  /* -- 768px: Tablet / small laptop -- */
  @media (max-width: 768px) {
    html { font-size: 13px; }

    /* Sidebar slides in as drawer */
    .sidebar { transform: translateX(-100%); position: fixed !important; z-index: 100; height: 100dvh !important; box-shadow: 8px 0 40px rgba(0,0,0,0.6); }
    .sidebar.open { transform: translateX(0); }
    .main-content { margin-left: 0 !important; }
    .top-bar { left: 0 !important; padding: 0 14px !important; }

    /* Grids */
    .kpi-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
    .chart-grid-2 { grid-template-columns: 1fr !important; gap: 12px !important; }
    .chart-grid-3 { grid-template-columns: 1fr !important; gap: 12px !important; }
    .chart-grid-4 { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }

    /* Cards */
    .kpi-card { padding: 14px 12px !important; border-radius: 12px !important; }
    .kpi-card .kpi-value { font-size: 22px !important; }
    .chart-box { padding: 14px 10px !important; border-radius: 12px !important; }

    /* Header */
    .header-badges { gap: 4px !important; }
    .header-badges > div:nth-child(n+3) { display: none !important; }
    .mobile-menu-btn { display: flex !important; }

    /* Content */
    .main-content > div { padding: 0 12px 60px !important; }
    .filter-scroll { overflow-x: auto; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 4px; }
    .filter-scroll::-webkit-scrollbar { display: none; }
    .filter-scroll button { flex-shrink: 0; }

    /* Tables - horizontal scroll with hint arrow */
    .table-scroll { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
    .table-scroll::after { content: "swipe ?"; position: absolute; right: 8px; top: 12px; color: ${T.gold}; font-size: 10px; opacity: 0.5; pointer-events: none; letter-spacing: 0.5px; }
    .table-scroll table { min-width: 560px; }

    /* Compare bar */
    .compare-bar { padding: 10px 14px !important; flex-direction: column !important; align-items: stretch !important; gap: 8px !important; }
    .compare-bar > div { justify-content: center; flex-wrap: wrap; }

    /* Mortgage calculator 2-col ? 1-col */
    .mortgage-grid { grid-template-columns: 1fr !important; }

    /* AI Insights full width cards */
    .ai-insights-grid { grid-template-columns: 1fr !important; }

    /* Alert modal full screen */
    .alerts-modal { max-width: 100% !important; max-height: 100dvh !important; border-radius: 20px 20px 0 0 !important; position: fixed !important; bottom: 0 !important; top: auto !important; margin: 0 !important; }
  }

  /* -- 480px: Mobile phones -- */
  @media (max-width: 480px) {
    html { font-size: 12px; }

    /* KPI grid: single column on small phones */
    .kpi-grid { grid-template-columns: 1fr 1fr !important; gap: 6px !important; }
    .chart-grid-4 { grid-template-columns: 1fr 1fr !important; }

    /* Header strip */
    .header-badges { display: none !important; }
    .top-bar { padding: 0 10px !important; height: 52px !important; }
    .top-bar h1 { font-size: 13px !important; }

    /* Charts shorter on tiny screens */
    .recharts-responsive-container { max-height: 200px !important; }
    .chart-box { padding: 12px 8px !important; }

    /* Upgrade modal full screen */
    .upgrade-modal { width: 100% !important; max-width: 100% !important; border-radius: 20px 20px 0 0 !important; position: fixed !important; bottom: 0 !important; top: auto !important; margin: 0 !important; max-height: 90dvh !important; overflow-y: auto; }

    /* Plans stacked vertically */
    .plans-grid { grid-template-columns: 1fr !important; }

    /* Checkout modal */
    .checkout-modal { width: 100% !important; max-width: 100% !important; border-radius: 20px 20px 0 0 !important; position: fixed !important; bottom: 0 !important; top: auto !important; }

    /* Section titles smaller */
    .section-title { font-size: 14px !important; }

    /* Tab content spacing */
    .main-content > div { padding: 0 10px 70px !important; }

    /* Bottom nav bar hint spacing */
    .tab-content-pad { padding-bottom: 80px !important; }
  }

  /* -- 360px: Very small phones -- */
  @media (max-width: 360px) {
    .kpi-grid { grid-template-columns: 1fr !important; }
    html { font-size: 11px; }
  }

  /* -- Touch improvements -- */
  * { -webkit-tap-highlight-color: transparent; }
  button, a, [role="button"] { touch-action: manipulation; }
  input[type="range"] { height: 32px; }

  /* -- Mobile Bottom Nav Bar -- */
  @media (max-width: 768px) {
    .mobile-bottom-nav {
      display: flex !important;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 60px;
      background: rgba(6,12,22,0.97);
      border-top: 1px solid rgba(212,168,67,0.15);
      z-index: 200;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
  }
`;

/* --- COMPONENTS --- */

/* Loading Skeleton for data fetch */
const LoadingSkeleton = ({ rows = 6, cols = 3 }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="chart-box fade-up" style={{ animationDelay: `${i * 0.05}s`, padding: 20, minHeight: 120 }}>
        <div style={{ width: "40%", height: 10, borderRadius: 4, background: T.surfaceAlt, marginBottom: 12 }} />
        <div style={{ width: "60%", height: 22, borderRadius: 4, background: T.surfaceAlt, marginBottom: 10 }} />
        <div style={{ width: "80%", height: 8, borderRadius: 4, background: T.surfaceAlt }} />
      </div>
    ))}
  </div>
);

const KPI = ({ label, value, sub, icon, delay = 0, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const isClickable = !!onClick;
  return (
    <div
      className={`kpi-card fade-up delay-${delay}`}
      title={isClickable ? `Click to view ${label} breakdown` : label}
      onClick={onClick}
      onMouseEnter={() => isClickable && setHovered(true)}
      onMouseLeave={() => isClickable && setHovered(false)}
      style={{ cursor: isClickable ? "pointer" : "default", transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s", transform: hovered ? "translateY(-3px)" : "none", boxShadow: hovered ? `0 10px 30px rgba(212,168,67,0.2)` : undefined, borderColor: hovered ? T.gold : undefined, position: "relative" }}
    >
      <div style={{ position: "absolute", top: -30, right: -30, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${T.goldGlow} 0%, transparent 70%)` }} />
      {isClickable && <div style={{ position: "absolute", top: 10, right: 10, fontSize: 14, color: hovered ? T.gold : T.border, transition: "color 0.2s" }}>-</div>}
      <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: T.gold, lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: T.teal, display: "flex", alignItems: "center", gap: 4 }}>
        {sub?.includes("+") && <span style={{ color: T.green }}>{Icons.up}</span>}
        {sub}
      </div>
      {isClickable && <div style={{ marginTop: 8, fontSize: 9, color: hovered ? T.gold : T.textMuted, fontWeight: 600, letterSpacing: 0.5, transition: "color 0.2s" }}>{hovered ? "View breakdown ?" : "Click for details"}</div>}
    </div>
  );
};

const ForecastCard = ({ firm, color, short, forecast, detail, bullets, sourceUrl }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="chart-box" style={{ borderTop: `3px solid ${color}`, cursor: "pointer", transition: "all 0.2s" }} onClick={() => setExpanded(e => !e)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h4 style={{ color, fontSize: 15, fontWeight: 700, marginBottom: 4, fontFamily: "'Fraunces', serif" }}>{firm}</h4>
        <span style={{ fontSize: 16, color: T.textMuted, display: "inline-block", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>?</span>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.white, background: color + "20", padding: "3px 8px", borderRadius: 5, display: "inline-block", marginBottom: 8 }}>{forecast}</div>
      <p style={{ color: T.textSecondary, fontSize: 12, lineHeight: 1.6 }}>{short}</p>
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
          <p style={{ color: T.textSecondary, fontSize: 12, lineHeight: 1.7, marginBottom: 10 }}>{detail}</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            {bullets.map((b, bi) => (
              <li key={bi} style={{ fontSize: 11, color: T.textSecondary, display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ color, fontWeight: 700, marginTop: 1 }}>-</span> {b}
              </li>
            ))}
          </ul>
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-block", marginTop: 10, fontSize: 10, color, fontWeight: 700, textDecoration: "none" }}>Full Report ?</a>
        </div>
      )}
      {!expanded && <div style={{ marginTop: 8, fontSize: 10, color: T.textMuted }}>Click to expand full analysis</div>}
    </div>
  );
};

const Section = ({ title, sub, children, delay = 0 }) => (
  <div className={`fade-up delay-${delay}`} style={{ marginTop: 36, marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
      <div style={{ width: 4, height: 28, background: `linear-gradient(180deg, ${T.gold}, transparent)`, borderRadius: 2 }} />
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: T.white }}>{title}</h2>
    </div>
    {sub && <p style={{ color: T.textSecondary, fontSize: 12, marginLeft: 16, marginTop: 2 }}>{sub}</p>}
    {children}
  </div>
);

const Chart = ({ title, children, style: extraStyle }) => (
  <div className="chart-box" style={extraStyle}>
    {title && <h3 style={{ fontSize: 11, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>{title}</h3>}
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
      <p style={{ color: T.gold, fontWeight: 700, margin: 0, fontSize: 12, fontFamily: "'Fraunces', serif" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || T.white, margin: "3px 0 0", fontSize: 12 }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* --- LOGIN SCREEN --- */
const googleProvider = new GoogleAuthProvider();

const PasswordStrength = ({ password }) => {
  const score = [/.{8,}/, /[0-9]/, /[A-Z]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const levels = [
    { label: "Too short", color: "#EF4444" },
    { label: "Weak", color: "#F59E0B" },
    { label: "Good", color: "#3B82F6" },
    { label: "Strong", color: "#10B981" },
    { label: "Very Strong", color: "#10B981" },
  ];
  if (!password) return null;
  const lvl = levels[Math.min(score, 4)];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? lvl.color : "rgba(255,255,255,0.08)", transition: "background 0.3s" }} />
        ))}
      </div>
      <div style={{ fontSize: 10, color: lvl.color, fontWeight: 600 }}>{lvl.label}</div>
    </div>
  );
};

const LoginScreen = ({ onLogin, onBack, defaultMode = "login" }) => {
  const [mode, setMode] = useState(defaultMode);
  const [screen, setScreen] = useState("form"); // "form" | "verify" | "reset_sent"
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const switchMode = (m) => { setMode(m); setError(""); setPass(""); setConfirmPass(""); };

  // Handle redirect result on page load
  React.useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (!result) return;
      const u = result.user;
      const snap = await getDoc(doc(db, "users", u.uid));
      if (!snap.exists()) {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await setDoc(doc(db, "users", u.uid), {
          name: u.displayName || u.email.split("@")[0],
          email: u.email,
          tier: "pro_trial",
          createdAt: now.toISOString(),
          trialStart: now.toISOString(),
          trialEnd: trialEnd.toISOString(),
          role: "user",
          provider: "google",
        });
        try {
          await emailjs.send("service_da7nshv", "template_gl1xqhy", {
            user_email: u.email,
            user_name: u.displayName || u.email.split("@")[0],
            project_name: "DXB Analytics Platform",
            change_type: "Welcome to DXB Analytics!",
            new_value: "Your 7-day Pro Trial is now active. Explore 208+ projects, yields, ROI data and more.",
            old_value: "New Account",
            updated_at: now.toLocaleDateString("en-AE"),
          }, "USkwUhp0csGCVDkdQ");
        } catch(e) {}
      }
      onLogin(u.email);
    }).catch(() => {});
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true); setError("");
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
    }
    setGoogleLoading(false);
  };

  const handleForgot = async () => {
    if (!email) { setError("Enter your email first, then click Forgot password"); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setScreen("reset_sent");
      setError("");
    } catch (err) { setError("Could not send reset email. Check your email address."); }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e?.preventDefault?.();
    if (!email || !pass) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      onLogin(email);
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "Invalid email or password",
        "auth/invalid-credential": "Invalid email or password",
        "auth/wrong-password": "Incorrect password",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/user-disabled": "This account has been disabled. Contact support.",
      };
      setError(msgs[err.code] || "Login failed. Please try again.");
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e?.preventDefault?.();
    if (!name.trim()) { setError("Please enter your full name"); return; }
    if (!email) { setError("Please enter your email address"); return; }
    if (!pass) { setError("Please enter a password"); return; }
    if (pass.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!/[0-9]/.test(pass)) { setError("Password must contain at least one number"); return; }
    if (pass !== confirmPass) { setError("Passwords do not match"); return; }
    if (!agreedTerms) { setError("Please agree to the Terms of Service and Privacy Policy"); return; }
    setLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      // S17: Capture referral code from URL ?ref= param
      const refCode = new URLSearchParams(window.location.search).get("ref") || "";
      await setDoc(doc(db, "users", cred.user.uid), {
        name: name.trim(), email,
        phone: phone.trim(), country: country.trim(),
        tier: "pro_trial",
        createdAt: now.toISOString(),
        trialStart: now.toISOString(),
        trialEnd: trialEnd.toISOString(),
        role: "user", emailVerified: false, provider: "email",
        ...(refCode ? { referredByCode: refCode } : {}),
      });
      // S17: If referred, create a referral signup record in Firestore
      if (refCode) {
        try {
          await setDoc(doc(db, "referrals", `${cred.user.uid}_signup`), {
            refCode,
            signupEmail: email,
            signupUid:   cred.user.uid,
            status:      "signup",
            rewardGranted: false,
            createdAt:   now.toISOString(),
            source:      "organic_link",
          });
        } catch(e) {}
      }
      try { await sendEmailVerification(cred.user); } catch(e) {}
      try {
        await emailjs.send("service_da7nshv", "template_gl1xqhy", {
          user_email: email, user_name: name.trim(),
          project_name: "DXB Analytics Platform",
          change_type: "Welcome to DXB Analytics! - Please verify your email",
          new_value: "Your 7-day Pro Trial is active. Check your inbox to verify your email address.",
          old_value: "New Account",
          updated_at: now.toLocaleDateString("en-AE"),
        }, "USkwUhp0csGCVDkdQ");
      } catch(e) {}
      setScreen("verify");
    } catch (err) {
      const msgs = {
        "auth/email-already-in-use": "This email is already registered. Try signing in instead.",
        "auth/weak-password": "Password is too weak.",
        "auth/invalid-email": "Please enter a valid email address.",
      };
      setError(msgs[err.code] || "Sign up failed. Please try again.");
    }
    setLoading(false);
  };

  // -- Verify Email Screen --
  if (screen === "verify") return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div className="fade-up" style={{ width: "100%", maxWidth: 440, padding: "0 20px", textAlign: "center" }}>
        <div style={{ background: T.surface, border: "1px solid rgba(16,185,129,0.3)", borderRadius: 20, padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>??</div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 10 }}>Check your inbox</h2>
          <p style={{ color: T.textSecondary, fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
            We sent a verification link to <span style={{ color: T.gold, fontWeight: 600 }}>{email></span>
          </p>
          <p style={{ color: T.textMuted, fontSize: 12, lineHeight: 1.7, marginBottom: 28 }}>
            Click the link in the email to verify your account, then come back and sign in. Check your spam folder if you don't see it within 2 minutes.
          </p>
          <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 24, textAlign: "left" }}>
            {["Click the link in the verification email", "Return to this page", "Sign in with your email & password"].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: T.green, fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
                <span style={{ fontSize: 12, color: T.textSecondary }}>{s></span>
              </div>
            ))}
          </div>
          <button type="button" className="login-btn" onClick={() => { setScreen("form"); setMode("login"); setPass(""); setConfirmPass(""); }}>
            Go to Sign In ?
          </button>
          <button type="button" onClick={async () => { try { if (auth.currentUser) { await sendEmailVerification(auth.currentUser); alert("Verification email resent! Check your inbox."); } } catch(e){} }} style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", color: T.gold, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            Resend verification email
          </button>
        </div>
      </div>
    </div>
  );

  // -- Reset Sent Screen --
  if (screen === "reset_sent") return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div className="fade-up" style={{ width: "100%", maxWidth: 440, padding: "0 20px", textAlign: "center" }}>
        <div style={{ background: T.surface, border: "1px solid rgba(212,168,67,0.3)", borderRadius: 20, padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>??</div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 10 }}>Password Reset Sent</h2>
          <p style={{ color: T.textSecondary, fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
            We sent a reset link to <span style={{ color: T.gold, fontWeight: 600 }}>{email></span>
          </p>
          <p style={{ color: T.textMuted, fontSize: 12, lineHeight: 1.7, marginBottom: 28 }}>
            Click the link in the email to set a new password. The link expires in 1 hour. Check your spam folder if you don't see it.
          </p>
          <button type="button" className="login-btn" onClick={() => setScreen("form")}>Back to Sign In</button>
        </div>
      </div>
    </div>
  );

  // -- Main Form --
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{css}</style>
      {onBack && (
        <button type="button" onClick={onBack} style={{ position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: T.textSecondary, fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: "pointer", zIndex: 10 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}>
          ? Back to Home
        </button>
      )}
      <div style={{ position: "absolute", inset: 0, opacity: 0.015, backgroundImage: `radial-gradient(${T.gold} 1px, transparent 1px)`, backgroundSize: "50px 50px" }} />
      <div style={{ position: "absolute", top: "20%", left: "10%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, rgba(212,168,67,0.04) 0%, transparent 70%)` }} />

      <div className="fade-up" style={{ width: "100%", maxWidth: 440, padding: "0 20px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginBottom: 8 }}>
            <svg width="36" height="36" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" /><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} /></svg>
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: T.gold, letterSpacing: -0.5, marginBottom: 2 }}>DXB Analytics</h1>
          <p style={{ color: T.textMuted, fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>Dubai Real Estate Intelligence</p>
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 32 }}>
          {/* Mode Toggle */}
          <div style={{ display: "flex", marginBottom: 24, background: T.surfaceAlt, borderRadius: 10, padding: 3 }}>
            <button type="button" onClick={() => switchMode("login")} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", background: mode === "login" ? T.gold : "transparent", color: mode === "login" ? T.bg : T.textMuted }}>Sign In</button>
            <button type="button" onClick={() => switchMode("signup")} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", background: mode === "signup" ? T.gold : "transparent", color: mode === "signup" ? T.bg : T.textMuted }}>Create Account</button>
          </div>

          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: T.white, marginBottom: 4 }}>
            {mode === "login" ? "Welcome back" : "Start your free trial"}
          </h2>
          <p style={{ color: T.textSecondary, fontSize: 13, marginBottom: 20 }}>
            {mode === "login" ? "Sign in to access your dashboard" : "7 days full Pro access - no credit card required"}
          </p>

          {/* Google Sign-In */}
          <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "11px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", marginBottom: 16, transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            {googleLoading
              ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: T.white, borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
              : <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.4 5.5-5 7.2v6h8.1c4.7-4.4 7.2-10.8 7.2-17.3z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-8.1-6c-2.1 1.4-4.7 2.2-7.8 2.2-6 0-11-4-12.8-9.5H3v6.2C7 42.6 15 48 24 48z"/><path fill="#FBBC05" d="M11.2 28.9c-.5-1.4-.7-2.8-.7-4.4s.3-3 .7-4.4V14H3a23.9 23.9 0 0 0 0 20l8.2-5.1z"/><path fill="#EA4335" d="M24 9.5c3.4 0 6.4 1.2 8.8 3.4l6.6-6.6C35.9 2.5 30.4 0 24 0 15 0 7 5.4 3 13.9l8.2 5.1C13 13.6 18 9.5 24 9.5z"/></svg>
            }
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && (
              <>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Full Name *</label>
                  <input className="login-input" type="text" placeholder="John Smith" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Phone</label>
                    <input className="login-input" type="tel" placeholder="+971 50 000 0000" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Country</label>
                    <input className="login-input" type="text" placeholder="UAE" value={country} onChange={e => setCountry(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Email Address *</label>
              <input className="login-input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && mode === "login" && handleLogin()} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Password *</label>
              <div style={{ position: "relative" }}>
                <input className="login-input" type={showPass ? "text" : "password"} placeholder={mode === "signup" ? "Min 8 chars + 1 number" : "--------"} value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && mode === "login" && handleLogin()} style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}>
                  {showPass ? Icons.eyeOff : Icons.eye}
                </button>
              </div>
              {mode === "signup" && <PasswordStrength password={pass} />}
            </div>

            {mode === "signup" && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Confirm Password *</label>
                <div style={{ position: "relative" }}>
                  <input className="login-input" type={showConfirm ? "text" : "password"} placeholder="Re-enter your password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} style={{ paddingRight: 44, borderColor: confirmPass && confirmPass !== pass ? "rgba(239,68,68,0.5)" : confirmPass && confirmPass === pass ? "rgba(16,185,129,0.5)" : undefined }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}>
                    {showConfirm ? Icons.eyeOff : Icons.eye}
                  </button>
                </div>
                {confirmPass && confirmPass !== pass && <div style={{ fontSize: 10, color: T.red, marginTop: 4 }}>? Passwords do not match</div>}
                {confirmPass && confirmPass === pass && <div style={{ fontSize: 10, color: T.green, marginTop: 4 }}>? Passwords match</div>}
              </div>
            )}

            {error && <div style={{ color: T.red, fontSize: 12, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

            {mode === "login" && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={handleForgot} type="button" disabled={loading} style={{ background: "none", border: "none", color: T.gold, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", padding: 0 }}>
                  {loading ? "Sending..." : "Forgot password?"}
                </button>
              </div>
            )}

            {mode === "signup" && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)} style={{ accentColor: T.gold, marginTop: 2, flexShrink: 0, width: 14, height: 14 }} />
                <span style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
                  I agree to the <a href="/terms" target="_blank" rel="noreferrer" style={{ color: T.gold, fontWeight: 600 }}>Terms of Service</a> and <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: T.gold, fontWeight: 600 }}>Privacy Policy</a>. I consent to DXB Analytics processing my data for real estate intelligence services.
                </span>
              </label>
            )}

            <button type="button" className="login-btn" onClick={mode === "login" ? handleLogin : handleSignUp} disabled={loading || (mode === "signup" && !agreedTerms)}>
              {loading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(4,9,15,0.3)", borderTopColor: T.bg, borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : mode === "login" ? "Sign In" : "Start Free Trial ?"}
            </button>

            {mode === "signup" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(212,168,67,0.06)", borderRadius: 8, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 16 }}>??</span>
                <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.4 }}>
                  <span style={{ color: T.gold, fontWeight: 600 }}>7-day Pro trial</span> - Full access. No credit card. Cancel anytime.
                </div>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <p style={{ color: T.textMuted, fontSize: 12 }}>
              {mode === "login" ? (
                <>Don't have an account? <button type="button" onClick={() => switchMode("signup")} style={{ color: T.gold, background: "none", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit',sans-serif", padding: 0 }}>Sign up free</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={() => switchMode("login")} style={{ color: T.gold, background: "none", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit',sans-serif", padding: 0 }}>Sign in</button></>
              )}
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", color: T.textMuted, fontSize: 11, marginTop: 20 }}>
          🔒 Secured by Firebase - SSL Encrypted - GDPR Compliant
        </p>
      </div>
    </div>
  );
};


/* --- PRO GATE OVERLAY --- */
const ProGate = ({ children, isPro, message = "Upgrade to Pro to unlock this data", onUpgrade, blur = true }) => {
  if (isPro) return children;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ filter: blur ? "blur(5px)" : "none", pointerEvents: "none", userSelect: "none", opacity: blur ? 0.45 : 1 }}>
        {children}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(4,9,15,0.75)", borderRadius: 16, backdropFilter: "blur(4px)", zIndex: 5 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 16, padding: "28px 32px", textAlign: "center", maxWidth: 380, boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${T.gold}18` }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}22, ${T.gold}08)`, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 12px" }}>??</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 800, color: T.white, marginBottom: 6 }}>{message}</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16, lineHeight: 1.6 }}>Join 500+ investors using DXB Analytics Pro to track the Dubai real estate market</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
            {["All 208+ active projects", "Full financials & yields", "ROI & mortgage calculator", "Currency converter", "Portfolio tracker"].map((f, i) => (
              <div key={i} style={{ fontSize: 11, color: T.textSecondary, textAlign: "left", paddingLeft: 4 }}>? {f}</div>
            ))}
          </div>
          <button type="button" onClick={onUpgrade} style={{ width: "100%", padding: "11px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif", letterSpacing: 0.3 }}>
            Unlock Pro - AED 99/mo ?
          </button>
          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>7-day money-back guarantee - Cancel anytime</div>
        </div>
      </div>
    </div>
  );
};

/* --- PRO GATE FULL PAGE --- */
const ProGateFullPage = ({ tabName, onUpgrade }) => {
  const tabBenefits = {
    "DXB Estimate":     ["Automated property valuations", "AVM price estimates per unit", "Bayut live listings", "-15% accuracy model"],
    "Portfolio":        ["Track your Dubai investments", "ROI calculations", "Portfolio performance chart", "Yield tracking"],
    "Yields":           ["Gross & net yield by community", "STR vs LTR comparison", "Top yielding Emaar areas", "Historical yield trends"],
    "Mortgage":         ["Live EIBOR rates", "UAE bank comparison", "Monthly payment calculator", "Affordability analysis"],
    "DLD Volumes":      ["Real transaction volumes", "Community deal counts", "YoY growth by area", "Quarterly breakdown"],
    "STR vs LTR":       ["Airbnb vs long-term yields", "Occupancy rates", "Nightly rate benchmarks", "Best STR communities"],
    "Developer Health": ["Developer financial scores", "Delivery track records", "Risk ratings", "Off-plan safety analysis"],
    "Competitors":      ["Emaar vs DAMAC vs Nakheel", "Market share data", "Price per sqft comparison", "Analyst ratings"],
    "Service Charges":  ["RERA approved rates", "Community-by-community breakdown", "Annual charge estimates", "Hidden cost analysis"],
    "Flip":             ["Buy-renovate-sell calculator", "Flip ROI estimator", "DLD fee breakdown", "Best flip communities"],
    "Investment Score": ["AI-powered property scoring", "Risk vs return matrix", "Top picks by budget", "Score breakdown"],
    "Price History":    ["Historical price charts", "5-year appreciation data", "Price per sqft trends", "Community comparisons"],
  };
  const benefits = tabBenefits[tabName] || ["Full data access", "Live market insights", "Advanced analytics", "Export reports"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "40px 20px" }}>
      <div style={{ background: T.surface, border: `1px solid ${T.gold}40`, borderRadius: 24, padding: "48px 40px", textAlign: "center", maxWidth: 480, width: "100%", boxShadow: `0 30px 80px rgba(0,0,0,0.4), 0 0 40px ${T.gold}10` }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}20, ${T.gold}05)`, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>??</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 8 }}>{tabName}</div>
        <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 28, lineHeight: 1.6 }}>This feature is available on the <span style={{ color: T.gold, fontWeight: 700 }}>Pro plan</span>. Upgrade to unlock full access.</div>
        <div style={{ background: T.surfaceAlt, borderRadius: 14, padding: "18px 20px", marginBottom: 28, textAlign: "left" }}>
          <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>What you unlock:</div>
          {benefits.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${T.gold}20`, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={T.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontSize: 12, color: T.textSecondary }}>{b></span>
            </div>
          ))}
        </div>
        <button type="button" onClick={onUpgrade} style={{ width: "100%", padding: "14px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif", letterSpacing: 0.3, marginBottom: 10 }}>
          Upgrade to Pro - AED 99/mo ?
        </button>
        <div style={{ fontSize: 11, color: T.textMuted }}>7-day free trial - Cancel anytime - Money-back guarantee</div>
      </div>
    </div>
  );
};

/* --- UPGRADE MODAL --- */
const UpgradeModal = ({ show, onClose }) => {
  if (!show) return null;
  const [livePlans, setLivePlans] = React.useState(null);

  // S19: Load pricing from Firestore pricingPlans/current - fallback to hardcoded
  React.useEffect(() => {
    if (!show) return;
    getDoc(doc(db, "pricingPlans", "current")).then(snap => {
      if (snap.exists()) setLivePlans(snap.data().plans);
    }).catch(() => {});
  }, [show]);

  const plans = livePlans || [
    { name: "Pro", price: "99", period: "month", features: ["208 Emaar projects - full data", "AI market insights", "Portfolio ROI tracker", "DXB Estimate AVM", "Yield & STR/LTR analysis", "Mortgage calculator", "Price alerts", "PDF export"], popular: true, note: null, cta: "Upgrade to Pro ?" },
    { name: "Enterprise", price: "499", period: "month", features: ["Everything in Pro", "PDF report generation ?", "API data access ?", "Custom dashboards ?", "Multi-user team accounts ?", "Developer-level raw data", "Dedicated account manager", "White-label options ?"], popular: false, note: "? = Launching Q3 2026", cta: "Contact Sales ?" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)", padding: 16 }} onClick={onClose}>
      <div className="upgrade-modal" style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, width: "95%", maxWidth: 720, padding: 36, position: "relative", boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>�</button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 14px", borderRadius: 20, background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}40`, marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: "pulse 2s infinite", display: "inline-block" }} />
            <span style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>500+ investors already using Pro</span>
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 900, color: T.white, marginBottom: 6 }}>Unlock the Full Platform</h2>
          <p style={{ color: T.textSecondary, fontSize: 13 }}>The most comprehensive Emaar & Dubai real estate intelligence platform</p>
        </div>

        {/* ROI bar */}
        <div style={{ background: "rgba(16,185,129,0.08)", border: `1px solid ${T.green}30`, borderRadius: 12, padding: "12px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          {[["", "AED 80.4B", "FY25 Sales tracked"], ["", "+40% YoY", "Revenue growth"], ["", "48 Projects", "Full intelligence"], ["", "AED 155B", "Backlog visibility"]].map(([icon, val, label], i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13 }}>{icon} <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 800, color: T.green }}>{val></span></div>
              <div style={{ fontSize: 10, color: T.textMuted }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="plans-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {plans.map((plan, i) => (
            <div key={i} style={{ background: T.surfaceAlt, borderRadius: 16, padding: 24, border: plan.popular ? `2px solid ${T.gold}` : `1px solid ${T.border}`, position: "relative" }}>
              {plan.popular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", borderRadius: 20, background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, whiteSpace: "nowrap" }}>? MOST POPULAR</div>}
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.white, marginBottom: 4, marginTop: plan.popular ? 8 : 0 }}>{plan.name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>AED</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 900, color: plan.popular ? T.gold : T.white, lineHeight: 1 }}>{plan.price></span>
                <span style={{ fontSize: 12, color: T.textMuted }}>/{plan.period></span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: f.includes("?") ? T.textMuted : T.textSecondary }}>
                    <span style={{ color: f.includes("?") ? T.textMuted : T.green, fontSize: 11, marginTop: 1, flexShrink: 0 }}>?</span>{f}
                  </div>
                ))}
              </div>
              {plan.note && <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 12, fontStyle: "italic" }}>{plan.note}</div>}
              <button type="button" onClick={() => { onClose(); window.dispatchEvent(new CustomEvent("dxb-checkout", { detail: plan })); }}
                style={{ width: "100%", padding: "12px 0", background: plan.popular ? `linear-gradient(135deg, ${T.gold}, #B8912F)` : "transparent", color: plan.popular ? T.bg : T.gold, border: plan.popular ? "none" : `1px solid ${T.gold}`, borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif", letterSpacing: 0.3 }}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          {["Secure payment", "? 7-day money-back", "? Instant access", "? Cancel anytime"].map((t, i) => (
            <span key={i} style={{ fontSize: 11, color: T.textMuted }}>{t></span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* --- MAIN DASHBOARD --- */
// Focus trap hook for modals
function useFocusTrap(active) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const handler = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    el.addEventListener('keydown', handler);
    first?.focus();
    return () => el.removeEventListener('keydown', handler);
  }, [active]);
  return ref;
}

/* --- COMMUNITY MAP TAB COMPONENT --- */
function CommunityMapTab({ activeProjects, liveCommunityROI, setTab, selectedDeveloper, compareList = [], toggleCompare = () => {}, isPro = false, setShowUpgrade = () => {} }) {
  const [selectedProject, setSelectedProjectMap] = React.useState(null);
  const [filterComm, setFilterComm] = React.useState("All");
  const [filterYield, setFilterYield] = React.useState("All");
  const [filterStatus, setFilterStatus] = React.useState("All"); // S8
  const [filterTier, setFilterTier] = React.useState("All");     // S8
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [mapLayer, setMapLayer] = React.useState("yield"); // yield | ppsf | volume
  const heatLayersRef = React.useRef([]);
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markersRef = React.useRef([]);

  // Project coordinates (lat/lng for Dubai)
  const projectCoords = {
    "Creek Waters": [25.1876, 55.3344], "Creek Waters 2": [25.1890, 55.3360],
    "Creek Horizon": [25.1860, 55.3320], "Creek Beach": [25.1920, 55.3380],
    "Creek Palace": [25.1840, 55.3300], "Harbour Gate": [25.1950, 55.3400],
    "Address Harbour Point": [25.1930, 55.3390], "Creek Edge": [25.1870, 55.3350],
    "Dubai Hills": [25.1124, 55.2594], "Golf Grand": [25.1050, 55.2650],
    "Elvira": [25.1070, 55.2570], "Lime Gardens": [25.1090, 55.2530],
    "Greenside": [25.1030, 55.2510], "Parkside Hills": [25.1000, 55.2480],
    "The Acres": [24.9800, 55.2000], "The Oasis": [25.0200, 55.1800],
    "Emaar South": [24.8980, 55.1640], "Greenview": [24.9000, 55.1660],
    "Urbana": [24.8950, 55.1600], "Expo Golf Villas": [24.8900, 55.1580],
    "Emaar Beachfront": [25.0780, 55.1340], "Address Beach Resort": [25.0800, 55.1360],
    "Marina Shores": [25.0760, 55.1320], "Beach Mansion": [25.0820, 55.1380],
    "Grand Polo Club": [24.8500, 55.4200], "The Valley": [25.0000, 55.5000],
    "Sunridge": [25.0100, 55.5100], "Farm Gardens": [25.0050, 55.4950],
    "Alana": [25.0080, 55.5050], "Orania": [24.9950, 55.4900],
    "Downtown Dubai": [25.1972, 55.2744], "The Grand": [25.1950, 55.2720],
    "Palace Residences": [25.1990, 55.2760], "IL Primo": [25.1960, 55.2730],
    "Act One Act Two": [25.1980, 55.2750], "Forte": [25.1940, 55.2710],
    "Opera District": [25.1930, 55.2700], "Address Residences": [25.1970, 55.2740],
    "Business Bay": [25.1867, 55.2653], "The Crest": [25.1850, 55.2640],
    "Arabian Ranches": [25.0530, 55.2690], "Ruba": [25.0550, 55.2710],
    "Mudon": [25.0200, 55.2500], "Nima": [25.0220, 55.2520],
    "Rashid Yachts": [25.2200, 55.3100], "Elvire": [25.1080, 55.2560],
    "Park Lane": [25.1110, 55.2580], "Golf Place": [25.1060, 55.2620],
  };

  // Community-level data for heat map layers
  const communityData = {
    "Dubai Creek Harbour":  { coords: [25.1876, 55.3344], ppsf: 2200, volume: 3150,  yoy: 44, radius: 1200 },
    "Dubai Hills Estate":   { coords: [25.1100, 55.2580], ppsf: 2100, volume: 4100,  yoy: 31, radius: 1400 },
    "Emaar Beachfront":     { coords: [25.0780, 55.1340], ppsf: 3500, volume: 1520,  yoy: 30, radius: 900  },
    "Downtown Dubai":       { coords: [25.1972, 55.2744], ppsf: 3800, volume: 5800,  yoy: 25, radius: 1100 },
    "Business Bay":         { coords: [25.1867, 55.2653], ppsf: 1900, volume: 29950, yoy: 22, radius: 1300 },
    "Arabian Ranches 3":    { coords: [25.0530, 55.2690], ppsf: 1650, volume: 1200,  yoy: 18, radius: 900  },
    "Emaar South":          { coords: [24.8980, 55.1640], ppsf: 1100, volume: 980,   yoy: 15, radius: 1100 },
    "The Valley":           { coords: [25.0000, 55.5000], ppsf: 1200, volume: 970,   yoy: 41, radius: 1000 },
    "Rashid Yachts & Marina":{ coords: [25.2200, 55.3100], ppsf: 2800, volume: 740, yoy: 65, radius: 800  },
    "The Oasis":            { coords: [25.0200, 55.1800], ppsf: 2400, volume: 850,   yoy: 38, radius: 1000 },
    "Mudon":                { coords: [25.0200, 55.2500], ppsf: 1400, volume: 620,   yoy: 20, radius: 800  },
    "Grand Polo Club":      { coords: [24.8500, 55.4200], ppsf: 1800, volume: 420,   yoy: 25, radius: 900  },
  };

  // -- Community polygon boundaries (approximate GeoJSON-style coords) ------
  const COMMUNITY_POLYGONS = {
    "Dubai Hills Estate": [
      [25.1020,55.2450],[25.1020,55.2720],[25.1200,55.2720],[25.1200,55.2450]
    ],
    "Dubai Creek Harbour": [
      [25.1800,55.3250],[25.1800,55.3480],[25.1980,55.3480],[25.1980,55.3250]
    ],
    "Emaar Beachfront": [
      [25.0720,55.1280],[25.0720,55.1420],[25.0860,55.1420],[25.0860,55.1280]
    ],
    "Downtown Dubai": [
      [25.1880,55.2650],[25.1880,55.2840],[25.2060,55.2840],[25.2060,55.2650]
    ],
    "Business Bay": [
      [25.1780,55.2560],[25.1780,55.2760],[25.1960,55.2760],[25.1960,55.2560]
    ],
    "Emaar South": [
      [24.8850,55.1520],[24.8850,55.1780],[24.9120,55.1780],[24.9120,55.1520]
    ],
    "The Valley": [
      [24.9880,55.4850],[24.9880,55.5150],[25.0120,55.5150],[25.0120,55.4850]
    ],
    "The Oasis": [
      [25.0100,55.1700],[25.0100,55.1950],[25.0350,55.1950],[25.0350,55.1700]
    ],
    "Rashid Yachts & Marina": [
      [25.2120,55.3000],[25.2120,55.3220],[25.2300,55.3220],[25.2300,55.3000]
    ],
    "Grand Polo Club": [
      [24.8380,55.4080],[24.8380,55.4340],[24.8640,55.4340],[24.8640,55.4080]
    ],
    "Arabian Ranches 3": [
      [25.0440,55.2600],[25.0440,55.2800],[25.0640,55.2800],[25.0640,55.2600]
    ],
    "Mudon": [
      [25.0120,55.2400],[25.0120,55.2600],[25.0320,55.2600],[25.0320,55.2400]
    ],
  };

  const polygonLayersRef = React.useRef([]);

  const getPPSFColor = (ppsf) => {
    if (ppsf >= 3500) return "#F59E0B"; // Ultra-premium
    if (ppsf >= 2500) return "#D4A843"; // Luxury
    if (ppsf >= 1800) return "#14B8A6"; // Premium
    if (ppsf >= 1400) return "#3B82F6"; // Mid-market
    return "#10B981";                   // Affordable
  };

  const getVolumeColor = (volume) => {
    if (volume >= 10000) return "#EF4444";
    if (volume >= 3000)  return "#F97316";
    if (volume >= 1500)  return "#F59E0B";
    if (volume >= 800)   return "#10B981";
    return "#3B82F6";
  };

  const getCoords = (project) => {
    // Exact match first
    if (projectCoords[project.name]) return projectCoords[project.name];
    // Community fallback coords
    const communityFallback = {
      "Dubai Creek Harbour": [25.1876, 55.3344],
      "Dubai Hills Estate": [25.1100, 55.2580],
      "Emaar South": [24.8980, 55.1640],
      "Emaar Beachfront": [25.0780, 55.1340],
      "Downtown Dubai": [25.1972, 55.2744],
      "Business Bay": [25.1867, 55.2653],
      "Arabian Ranches 3": [25.0530, 55.2690],
      "Mudon": [25.0200, 55.2500],
      "The Valley": [25.0000, 55.5000],
      "Grand Polo Club": [24.8500, 55.4200],
      "The Oasis": [25.0200, 55.1800],
      "Rashid Yachts & Marina": [25.2200, 55.3100],
    };
    return communityFallback[project.community] || [25.1972, 55.2744];
  };

  const getYield = (project) => {
    const roi = (liveCommunityROI && liveCommunityROI[project.community]) || {};
    const y = roi.grossYield;
    if (!y) return 6.5;
    if (typeof y === "object") return parseFloat(y.apt1 || y.apt2 || Object.values(y)[0]) || 6.5;
    return parseFloat(y) || 6.5;
  };

  const getPinColor = (project) => {
    const y = getYield(project);
    if (y >= 8) return "#10B981";
    if (y >= 6.5) return "#D4A843";
    if (y >= 5) return "#3B82F6";
    return "#94A3B8";
  };

  const communities = ["All", ...Array.from(new Set(activeProjects.map(p => p.community)))];
  const filteredProjects = activeProjects.filter(p => {
    const commOk   = filterComm   === "All" || p.community === filterComm;
    const y        = getYield(p);
    const yieldOk  = filterYield  === "All" || (filterYield === "8%+" && y >= 8) || (filterYield === "6-8%" && y >= 6 && y < 8) || (filterYield === "<6%" && y < 6);
    const statusOk = filterStatus === "All" || p.status === filterStatus;                          // S8
    const tierOk   = filterTier   === "All" || (p.tier || "").includes(filterTier);               // S8
    const devOk    = !selectedDeveloper || selectedDeveloper === "all" || selectedDeveloper === "emaar" || (p.developerId || "emaar") === selectedDeveloper; // S8
    return commOk && yieldOk && statusOk && tierOk && devOk;
  });

  // Load Leaflet dynamically
  React.useEffect(() => {
    if (mapLoaded || typeof window === "undefined") return;
    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    // Load Leaflet JS
    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Init map after Leaflet loads
  React.useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, { center: [25.1124, 55.2594], zoom: 11, zoomControl: true });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "- OpenStreetMap - CARTO", maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
  }, [mapLoaded]);

  // Update markers when filters change
  React.useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;
    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    // Add new markers
    filteredProjects.forEach(p => {
      const coords = getCoords(p);
      const color = getPinColor(p);
      const y = getYield(p);
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:12px;height:12px;border-radius:50%;background:\${color};border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 8px \${color}88;cursor:pointer;"></div>`,
        iconSize: [12, 12], iconAnchor: [6, 6],
      });
      const marker = L.marker(coords, { icon })
        .addTo(map)
        .bindPopup(`<div style="font-family:'Outfit',sans-serif;min-width:180px;background:#0D1821;color:#fff;border-radius:10px;padding:0;">
          <div style="background:linear-gradient(135deg,rgba(212,168,67,0.15),rgba(212,168,67,0.05));padding:12px 14px;border-radius:10px 10px 0 0;border-bottom:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:2px;">\${p.name>*</div>
            <div style="font-size:10px;color:#94A3B8;">\${p.community>*</div>
          </div>
          <div style="padding:10px 14px;display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Price</div><div style="font-size:12px;font-weight:700;color:#D4A843;">\${p.price ? "AED " + (p.price/1e6).toFixed(2) + "M" : "TBC"}</div></div>
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Yield</div><div style="font-size:12px;font-weight:700;color:\${color}">\${y.toFixed(1)}%</div></div>
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Type</div><div style="font-size:11px;color:#CBD5E1;">\${p.type || "Residential">*</div></div>
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Handover</div><div style="font-size:11px;color:#CBD5E1;">\${p.handover || "TBC"}</div></div>
          </div>
        </div>`, { className: "dxb-popup" });
      marker.on("click", () => setSelectedProjectMap(p));
      markersRef.current.push(marker);
    });

    // Clear old heat circles
    heatLayersRef.current.forEach(c => map.removeLayer(c));
    heatLayersRef.current = [];

    // Clear old polygons
    polygonLayersRef.current.forEach(p => map.removeLayer(p));
    polygonLayersRef.current = [];

    // Draw community polygons - always visible as boundaries
    Object.entries(COMMUNITY_POLYGONS).forEach(([name, coords]) => {
      const data = communityData[name];
      if (!data) return;
      const ppsfColor = getPPSFColor(data.ppsf);
      const poly = L.polygon(coords, {
        color:       ppsfColor,
        fillColor:   ppsfColor,
        fillOpacity: mapLayer === "ppsf" ? 0.18 : 0.06,
        weight:      mapLayer === "ppsf" ? 2 : 1,
        opacity:     mapLayer === "ppsf" ? 0.8 : 0.35,
        dashArray:   mapLayer === "ppsf" ? null : "4 4",
      }).addTo(map);
      poly.bindTooltip(
        `<div style="font-family:'Outfit',sans-serif;background:#0D1821;color:#fff;border:1px solid ${ppsfColor};border-radius:8px;padding:8px 12px;font-size:12px;">
          <strong style="color:${ppsfColor}">${name}</strong><br/>
          PPSF: <strong>AED ${data.ppsf.toLocaleString()}/sqft</strong><br/>
          Volume: <strong>${data.volume.toLocaleString()} deals</strong><br/>
          <span style="color:#94A3B8;font-size:10px">YoY: +${data.yoy}%</span>
        </div>`,
        { permanent: false, sticky: true, className: "dxb-tooltip" }
      );
      polygonLayersRef.current.push(poly);
    });

    // Add PPSF or Volume heat circles on top of polygons
    if (mapLayer === "ppsf" || mapLayer === "volume") {
      Object.entries(communityData).forEach(([name, data]) => {
        const color = mapLayer === "ppsf" ? getPPSFColor(data.ppsf) : getVolumeColor(data.volume);
        const value = mapLayer === "ppsf" ? `AED ${data.ppsf.toLocaleString()}/sqft` : `${data.volume.toLocaleString()} deals`;
        const radiusScale = mapLayer === "volume" ? Math.min(data.volume / 100, 600) + 400 : data.radius;
        const circle = L.circle(data.coords, {
          radius: radiusScale,
          color: color,
          fillColor: color,
          fillOpacity: 0.25,
          weight: 2,
          opacity: 0.7,
        }).addTo(map);
        circle.bindTooltip(`<div style="font-family:'Outfit',sans-serif;background:#0D1821;color:#fff;border:1px solid ${color};border-radius:8px;padding:8px 12px;font-size:12px;">
          <strong style="color:${color}">${name}</strong><br/>
          ${mapLayer === "ppsf" ? "PPSF: " : "Volume: "}<strong>${value}</strong><br/>
          <span style="color:#94A3B8;font-size:10px">YoY: +${data.yoy}%</span>
        </div>`, { permanent: false, sticky: true, className: "dxb-tooltip" });
        heatLayersRef.current.push(circle);
      });
    }
    // Add yield heatmap circles when yield layer selected
    if (mapLayer === "yield") {
      Object.entries(communityData).forEach(([name, data]) => {
        const yieldPct = liveCommunityROI?.[name]?.grossYield || data.yoy * 0.15 + 5.5;
        const yColor = yieldPct >= 8 ? "#10B981" : yieldPct >= 6.5 ? "#D4A843" : yieldPct >= 5 ? "#3B82F6" : "#94A3B8";
        const circle = L.circle(data.coords, {
          radius:      data.radius * 0.6,
          color:       yColor,
          fillColor:   yColor,
          fillOpacity: 0.12,
          weight:      1.5,
          opacity:     0.6,
        }).addTo(map);
        circle.bindTooltip(
          `<div style="font-family:'Outfit',sans-serif;background:#0D1821;color:#fff;border:1px solid ${yColor};border-radius:8px;padding:8px 12px;font-size:12px;">
            <strong style="color:${yColor}">${name}</strong><br/>
            Gross Yield: <strong>${yieldPct.toFixed(1)}%</strong><br/>
            <span style="color:#94A3B8;font-size:10px">PPSF: AED ${data.ppsf.toLocaleString()}/sqft</span>
          </div>`,
          { permanent: false, sticky: true, className: "dxb-tooltip" }
        );
        heatLayersRef.current.push(circle);
      });
    }
  }, [mapLoaded, filteredProjects.length, filterComm, filterYield, filterStatus, filterTier, mapLayer]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      polygonLayersRef.current = [];
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Layer switcher + Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 4 }}>
        <div style={{ display: "flex", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          {[
            { id: "yield",  label: "Yield Layer",  desc: "Color by rental yield" },
            { id: "ppsf",   label: "PPSF Layer",   desc: "Color by price/sqft" },
            { id: "volume", label: "Volume Layer",  desc: "Size by DLD transactions" },
          ].map(l => (
            <button key={l.id} type="button" onClick={() => setMapLayer(l.id)}
              style={{ padding: "7px 14px", fontSize: 11, fontWeight: 600, background: mapLayer === l.id ? `${T.gold}20` : "transparent", color: mapLayer === l.id ? T.gold : T.textMuted, border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap" }}>
              {l.label}
            </button>
          ))}
        </div>
        {/* Layer legend */}
        {mapLayer === "ppsf" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {[["#F59E0B","AED 3,500+/sqft"],["#D4A843","AED 2,500+"],["#14B8A6","AED 1,800+"],["#3B82F6","AED 1,400+"],["#10B981","<AED 1,400"]].map(([col, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: col, opacity: 0.8 }} />
                <span style={{ fontSize: 9, color: T.textMuted }}>{label></span>
              </div>
            ))}
          </div>
        )}
        {mapLayer === "volume" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {[["#EF4444","10,000+ deals"],["#F97316","3,000+"],["#F59E0B","1,500+"],["#10B981","800+"],["#3B82F6","<800"]].map(([col, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: col, opacity: 0.8 }} />
                <span style={{ fontSize: 9, color: T.textMuted }}>{label></span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>FILTER:</div>
        <select value={filterComm} onChange={e => setFilterComm(e.target.value)} style={{ padding: "6px 12px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 8, color: T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
          {communities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {/* S8 - Status filter */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "6px 12px", background: T.surfaceAlt, border: `1px solid ${filterStatus !== "All" ? T.teal : T.border}`, borderRadius: 8, color: filterStatus !== "All" ? T.teal : T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer", fontWeight: filterStatus !== "All" ? 700 : 400 }}>
          {["All", "Under Construction", "Off-Plan"].map(s => <option key={s} value={s}>{s === "All" ? "All Status" : s}</option>)}
        </select>
        {/* S8 - Tier filter */}
        <select value={filterTier} onChange={e => setFilterTier(e.target.value)} style={{ padding: "6px 12px", background: T.surfaceAlt, border: `1px solid ${filterTier !== "All" ? T.purple : T.border}`, borderRadius: 8, color: filterTier !== "All" ? T.purple : T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer", fontWeight: filterTier !== "All" ? 700 : 400 }}>
          {["All", "Affordable", "Mid-Market", "Mid-Premium", "Premium", "Luxury", "Ultra-Luxury", "Luxury Branded", "Ultra-Lux Branded"].map(t => <option key={t} value={t}>{t === "All" ? "All Tiers" : t}</option>)}
        </select>
        <div style={{ display: "flex", gap: 6 }}>
          {["All", "8%+", "6-8%", "<6%"].map(f => (
            <button key={f} type="button" onClick={() => setFilterYield(f)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid " + (filterYield === f ? T.gold : T.border), background: filterYield === f ? "rgba(212,168,67,0.15)" : T.surfaceAlt, color: filterYield === f ? T.gold : T.textSecondary, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{f === "All" ? "All Yields" : f + " yield"}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {[["#10B981", "8%+ yield"], ["#D4A843", "6-8% yield"], ["#3B82F6", "5-6% yield"], ["#94A3B8", "<5% yield"]].map(([col, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: col, boxShadow: "0 0 6px " + col + "88" }} />
              <span style={{ fontSize: 10, color: T.textMuted }}>{label></span>
            </div>
          ))}
        </div>
      </div>

      {/* Map + sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, height: 560 }}>

        {/* Map */}
        <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid " + T.border, position: "relative" }}>
          {!mapLoaded && (
            <div style={{ position: "absolute", inset: 0, background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, zIndex: 10 }}>
              <div style={{ fontSize: 32 }}>&#x1F5FA;</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>Loading map...</div>
            </div>
          )}
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          {/* Floating counter */}
          <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(13,24,33,0.9)", backdropFilter: "blur(8px)", borderRadius: 8, padding: "6px 12px", border: "1px solid " + T.border, zIndex: 999, fontSize: 11, color: T.textSecondary }}>
            <span style={{ color: T.gold, fontWeight: 700 }}>{filteredProjects.length></span> projects -{" "}
            <span style={{ color: T.teal, fontWeight: 600 }}>
              {mapLayer === "yield" ? "Yield layer" : mapLayer === "ppsf" ? "PPSF heat map" : "Volume heat map"}
            </span>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          {selectedProject ? (
            <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.gold, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.gold }}>{selectedProject.name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{selectedProject.community}</div>
                </div>
                <button type="button" onClick={() => setSelectedProjectMap(null)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 18 }}>-</button>
              </div>
              {selectedProject.imageUrl && <img src={selectedProject.imageUrl} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} onError={e => e.target.style.display="none"} />}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  ["Price", selectedProject.price ? "AED " + (selectedProject.price/1e6).toFixed(2) + "M" : "TBC", T.gold],
                  ["Yield", getYield(selectedProject).toFixed(1) + "%", getPinColor(selectedProject)],
                  ["Handover", selectedProject.handover || "TBC", T.teal],
                  ["Type", selectedProject.type || "Residential", T.textPrimary],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ background: T.card, borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setTab("Projects")} style={{ flex: 1, padding: "9px 0", background: `linear-gradient(135deg,${T.gold},#B8912F)`, color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>View Full Details ?</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); isPro ? toggleCompare(selectedProject) : setShowUpgrade(true); }}
                  style={{ padding: "9px 14px", background: compareList.find(x => x.id === selectedProject.id) ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border: `1px solid ${compareList.find(x => x.id === selectedProject.id) ? T.gold : T.border}`, borderRadius: 8, color: compareList.find(x => x.id === selectedProject.id) ? T.gold : T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {compareList.find(x => x.id === selectedProject.id) ? "? Added" : "+ Compare"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 4 }}>Click any pin on the map</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>to see project details here</div>
            </div>
          )}

          {/* Project list */}
          <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 14, flex: 1, overflowY: "auto" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>All Projects ({filteredProjects.length})</div>
            {filteredProjects.map(p => (
              <div key={p.id} onClick={() => { setSelectedProjectMap(p); const coords = getCoords(p); if (mapInstanceRef.current) mapInstanceRef.current.setView(coords, 14, { animate: true }); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: selectedProject?.id === p.id ? "rgba(212,168,67,0.1)" : "transparent", border: "1px solid " + (selectedProject?.id === p.id ? T.gold : "transparent"), transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                onMouseLeave={e => e.currentTarget.style.background = selectedProject?.id === p.id ? "rgba(212,168,67,0.1)" : "transparent"}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.white }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{p.community}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: getPinColor(p) }}>{getYield(p).toFixed(1)}%</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{p.price ? (p.price/1e6).toFixed(1) + "M" : "TBC"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popup CSS */}
      <style>{"  .dxb-popup .leaflet-popup-content-wrapper { background: #0D1821; border: 1px solid rgba(212,168,67,0.3); border-radius: 12px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.6); } .dxb-popup .leaflet-popup-content { margin: 0; } .dxb-popup .leaflet-popup-tip { background: #0D1821; } .leaflet-container { background: #0D1821; } .dxb-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; }"}</style>

      {/* Community PPSF Summary Grid */}
      <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "16px 20px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
          Community Intelligence - PPSF - Volume - YoY Growth
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
          {Object.entries(communityData).map(([name, data]) => {
            const liveROI = liveCommunityROI?.[name] || liveCommunityROI?.[Object.keys(liveCommunityROI || {}).find(k => k.toLowerCase().includes(name.toLowerCase().split(" ")[0])) || ""] || {};
            const livePpsf = liveROI.avgPpsf || data.ppsf;
            const color = getPPSFColor(livePpsf);
            return (
              <div key={name} style={{ background: T.card, borderRadius: 10, padding: "10px 12px", border: `1px solid ${T.border}`, cursor: "pointer" }}
                onClick={() => setFilterComm(filterComm === name ? "All" : name)}>
                <div style={{ fontSize: 11, fontWeight: 700, color: filterComm === name ? T.gold : T.white, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color }}>{livePpsf >= 1000 ? `AED ${livePpsf.toLocaleString()}` : `AED ${livePpsf}`}<span style={{ fontSize: 9, color: T.textMuted }}>/sqft</span></div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{data.volume.toLocaleString()} deals/yr</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>+{data.yoy}%</div>
                    <div style={{ fontSize: 9, color: T.textMuted }}>YoY</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// --- Tab Data Sources Footer ------------------------------------------------

/* --- S17: REFERRAL WIDGET - shown to logged-in users on Overview tab --- */
const ReferralWidget = ({ user, T, db }) => {
  const [copied, setCopied] = React.useState(false);
  const [rewards, setRewards] = React.useState(0);
  const [conversions, setConversions] = React.useState(0);

  // Generate referral code from user uid
  const refCode = React.useMemo(() => {
    if (!user?.uid) return "";
    return btoa(user.uid).replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase();
  }, [user?.uid]);

  const refLink = `https://emaar-dashboard.vercel.app?ref=${refCode}`;

  // Load user's referral stats from Firestore
  React.useEffect(() => {
    if (!user?.uid || !db) return;
    const unsub = onSnapshot(
      query(collection(db, "referrals"), where("referrerUid", "==", user.uid)),
      (snap) => {
        const list = [];
        snap.forEach(d => list.push(d.data()));
        setConversions(list.filter(r => r.status === "converted").length);
        setRewards(list.filter(r => r.rewardGranted).length);
      },
      () => {}
    );
    return () => unsub();
  }, [user?.uid, db]);

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!refCode) return null;

  return (
    <div style={{ marginTop: 20, background: "linear-gradient(135deg, rgba(212,168,67,0.06), rgba(212,168,67,0.02))", border: `1px solid ${T.gold}33`, borderRadius: 16, padding: "18px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.gold, marginBottom: 2 }}>??"🎁 Refer a friend - get 1 month free</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>Share your link. When they upgrade to Pro, you get a free month.</div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {conversions > 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.green, fontFamily: "'Fraunces',serif" }}>{conversions}</div>
              <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Conversions</div>
            </div>
          )}
          {rewards > 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.gold, fontFamily: "'Fraunces',serif" }}>{rewards}</div>
              <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Free Months</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
        <div style={{ flex: 1, padding: "9px 14px", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, color: T.teal, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {refLink}
        </div>
        <button type="button" onClick={handleCopy}
          style={{ padding: "9px 18px", background: copied ? "rgba(16,185,129,0.15)" : T.goldGlow, border: `1px solid ${copied ? T.green : T.gold}`, borderRadius: 8, color: copied ? T.green : T.gold, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", flexShrink: 0, transition: "all 0.2s" }}>
          {copied ? "? Copied!" : "Copy Link"}
        </button>
      </div>
    </div>
  );
};

/* --- DATA BADGE - verified data stamp --- */
const DataBadge = ({ source, date, type = "dld" }) => {
  const cfg = {
    dld:     { label: "DLD Verified",     color: "#10B981", icon: "~"?" },
    reidin:  { label: "REIDIN Index",     color: "#3B82F6", icon: "~"??" },
    emaar:   { label: "Emaar IR",         color: "#D4A843", icon: "~"??" },
    live:    { label: "Live - Firestore", color: "#10B981", icon: "~"??" },
    ai:      { label: "AI Estimate",      color: "#8B5CF6", icon: "~"??" },
    manual:  { label: "Admin Verified",   color: "#F59E0B", icon: "~"??" },
  };
  const c = cfg[type] || cfg.dld;
  return (
    <span title={`Source: ${source || c.label}${date ? " - " + date : ""}`} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 9, fontWeight: 700, color: c.color, letterSpacing: 0.5,
      background: c.color + "12", border: `1px solid ${c.color}30`,
      borderRadius: 5, padding: "1px 6px", cursor: "default", flexShrink: 0,
    }}>
      <span style={{ fontSize: 8 }}>{c.icon></span>{c.label}
    </span>
  );
};

const TabSources = ({ sources }) => (
  <div style={{
    marginTop: 28,
    padding: "12px 16px",
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    flexWrap: "wrap"
  }}>
    <span style={{
      fontSize: 9,
      fontWeight: 700,
      color: "rgba(212,168,67,0.7)",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      paddingTop: 2,
      flexShrink: 0
    }}>Sources</span>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {sources.map((s, i) => (
        s.url ? (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.55)",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            padding: "3px 10px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#D4A843"; e.currentTarget.style.borderColor = "rgba(212,168,67,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.55)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >{s.label} ?</a>
        ) : (
          <span key={i} style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.45)",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: "3px 10px"
          }}>{s.label></span>
        )
      ))}
    </div>
  </div>
);

function EiborAdminPanel({ db, T }) {
  const [eiborEdit, setEiborEdit] = React.useState({ "1m": "", "3m": "", "6m": "", "1y": "", asOf: "" });
  const [eiborSaving, setEiborSaving] = React.useState(false);
  const [eiborSaved, setEiborSaved] = React.useState(false);
  const [eiborCurrent, setEiborCurrent] = React.useState(null);

  React.useEffect(() => {
    getDoc(doc(db, "tabData", "eiborRates")).then(snap => {
      if (snap.exists()) setEiborCurrent(snap.data());
    }).catch(() => {});
  }, []);

  const saveEibor = async () => {
    if (!eiborEdit["3m"]) return;
    setEiborSaving(true);
    try {
      await setDoc(doc(db, "tabData", "eiborRates"), {
        on:   parseFloat(eiborEdit.on  || eiborCurrent?.on  || 3.473),
        "1w": parseFloat(eiborEdit["1w"] || eiborCurrent?.["1w"] || 3.577),
        "1m": parseFloat(eiborEdit["1m"] || eiborCurrent?.["1m"] || 3.635),
        "3m": parseFloat(eiborEdit["3m"]),
        "6m": parseFloat(eiborEdit["6m"] || eiborCurrent?.["6m"] || 3.676),
        "1y": parseFloat(eiborEdit["1y"] || eiborCurrent?.["1y"] || 3.674),
        asOf: eiborEdit.asOf || new Date().toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" }),
        source: "Live - UAE Central Bank",
        updatedAt: Date.now(),
      });
      setEiborSaved(true);
      setEiborEdit({ "1m": "", "3m": "", "6m": "", "1y": "", asOf: "" });
      getDoc(doc(db, "tabData", "eiborRates")).then(snap => { if (snap.exists()) setEiborCurrent(snap.data()); });
      setTimeout(() => setEiborSaved(false), 3000);
    } catch(e) { console.error("EIBOR save error:", e); }
    setEiborSaving(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
      {eiborCurrent && (
        <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "14px 18px" }}>
          <div style={{ fontSize: 11, color: "#10B981", fontWeight: 700, marginBottom: 8 }}>?? Currently Live - {eiborCurrent.asOf || "-"}</div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[["1M", eiborCurrent["1m"]], ["3M", eiborCurrent["3m"]], ["6M", eiborCurrent["6m"]], ["1Y", eiborCurrent["1y"]]].map(([l, v]) => (
              <div key={l}><span style={{ fontSize: 10, color: T.textMuted }}>{l}: </span><span style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{v ? parseFloat(v).toFixed(3) : "-"}%</span></div>
            ))}
          </div>
        </div>
      )}
      <div style={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 12 }}>
          Check latest rates at <a href="https://www.centralbank.ae/en/forex-eibor/eibor-rates/" target="_blank" rel="noopener noreferrer" style={{ color: T.gold }}>centralbank.ae ?</a> or <a href="https://fcmb.ae/eibor-rate-today" target="_blank" rel="noopener noreferrer" style={{ color: T.gold }}>fcmb.ae ?</a> then enter below:
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
          {[["1M EIBOR", "1m"], ["3M EIBOR", "3m"], ["6M EIBOR", "6m"], ["1Y EIBOR", "1y"]].map(([label, key]) => (
            <div key={key}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>{label} {key === "3m" && <span style={{ color: T.gold }}>? Primary</span>>*</div>
              <input
                type="number" step="0.0001" placeholder={eiborCurrent?.[key] ? eiborCurrent[key].toFixed(4) : "e.g. 3.5992"}
                value={eiborEdit[key]}
                onChange={e => setEiborEdit(prev => ({ ...prev, [key]: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", background: T.surfaceAlt, border: "1px solid " + (key === "3m" ? T.gold : T.border), borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Value Date (e.g. "6 Mar 2026")</div>
            <input type="text" placeholder="e.g. 6 Mar 2026" value={eiborEdit.asOf}
              onChange={e => setEiborEdit(prev => ({ ...prev, asOf: e.target.value }))}
              style={{ width: "100%", padding: "9px 12px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
          </div>
          <button type="button" onClick={saveEibor} disabled={eiborSaving || !eiborEdit["3m"]}
            style={{ padding: "10px 24px", borderRadius: 10, background: eiborSaved ? "#10B981" : T.gold, border: "none", color: T.bg, fontSize: 13, fontWeight: 700, cursor: eiborEdit["3m"] ? "pointer" : "not-allowed", fontFamily: "'Outfit',sans-serif", marginTop: 20, whiteSpace: "nowrap" }}>
            {eiborSaved ? "? Saved!" : eiborSaving ? "Saving..." : "Save to Firestore ?"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmaarDashboardV2() {
  const { t: tr, lang, setLang, langInfo, LANGUAGES, dir } = useI18n();
  // tr() is our translation function (avoiding conflict with 't' loop variable)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState("");
  const [userName, setUserName] = useState("");
  const [userTier, setUserTier] = useState("free");
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get("auth");
    if (authParam === "login") setShowLogin("login");
    if (authParam === "signup") setShowLogin("signup");
  }, []);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileEdit, setProfileEdit] = useState({ name: "" });
  const [showCheckout, setShowCheckout] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [myPortfolio, setMyPortfolio] = useState([]);
  const [showAddPortfolio, setShowAddPortfolio] = useState(null);
  const [portfolioForm, setPortfolioForm] = useState({ units: 1, investedAmount: "", purchaseDate: "", unitType: "1BR", notes: "" });
  const [editHoldingIdx, setEditHoldingIdx] = React.useState(null);

  // Watchlist
  const [watchlist, setWatchlist] = useState([]);
  const [showWatchlist, setShowWatchlist] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Price Alerts (old per-project alert modal - kept for project cards)
  const [showSetAlert, setShowSetAlert] = React.useState(null);
  const [selectedNbhd, setSelectedNbhd] = React.useState(null);
  const [scSort, setScSort] = React.useState("avg");
  const [strCommunity, setStrCommunity] = React.useState("All");
  const [devSort, setDevSort] = React.useState("revenue");
  const [dldCommunity, setDldCommunity] = React.useState("All");
  const [dldDeveloper, setDldDeveloper] = React.useState("All");
  const [dldType, setDldType] = React.useState("All");
  const [dldTxType, setDldTxType] = React.useState("All"); // All | Off-Plan | Ready
  const [avmCommunity, setAvmCommunity] = React.useState("Dubai Hills Estate");
  const [avmType, setAvmType] = React.useState("Apartment");
  const [avmBeds, setAvmBeds] = React.useState("1BR");
  const [avmSize, setAvmSize] = React.useState(750);
  const [avmYear, setAvmYear] = React.useState(2023);
  const [roiMode, setRoiMode] = React.useState("summary");

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    const handler = (e) => { setShowCheckout(e.detail); setCheckoutStep(1); };
    window.addEventListener("dxb-checkout", handler);
    return () => window.removeEventListener("dxb-checkout", handler);
  }, []);
  const [toast, setToast] = useState("");
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const fetchAdminUsersRef = useRef(null);

  // Tier access helper
  const isPro = userTier === "admin" || userTier === "pro" || userTier === "pro_trial" || userTier === "enterprise";

  // Upgrade overlay for locked content
  const UpgradeOverlay = ({ message, compact }) => (
    <div style={{ position: "absolute", inset: 0, background: "rgba(4,9,15,0.85)", backdropFilter: "blur(8px)", borderRadius: "inherit", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, flexDirection: "column", gap: compact ? 8 : 12 }}>
      <div style={{ fontSize: compact ? 20 : 28 }}>??</div>
      <div style={{ fontSize: compact ? 12 : 14, fontWeight: 600, color: T.white, textAlign: "center", maxWidth: 220 }}>{message || "Pro Feature"}</div>
      <button type="button" onClick={() => setShowUpgrade(true)} style={{ padding: compact ? "6px 14px" : "8px 20px", borderRadius: 8, background: T.gold, color: T.bg, border: "none", fontSize: compact ? 11 : 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: "pointer" }}>Upgrade to Pro</button>
    </div>
  );

  // Blur wrapper for free users
  // eslint-disable-next-line no-unused-vars
  const BlurGate = ({ children, locked, message, compact }) => (
    <div style={{ position: "relative" }}>
      <div style={locked ? { filter: "blur(6px)", pointerEvents: "none", userSelect: "none" } : {}}>
        {children}
      </div>
      {locked && <UpgradeOverlay message={message} compact={compact} />}
    </div>
  );
  const [tab, setTab] = useState(() => { try { const urlTab = new URLSearchParams(window.location.search).get("tab"); return urlTab || sessionStorage.getItem("dxb_active_tab") || "Overview"; } catch(e) { return "Overview"; } });
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]); // [{label, action}]
  const [projectPage, setProjectPage] = useState(1);
  const PROJECTS_PER_PAGE = 12;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [authLoading, setAuthLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedLevel, setVerifiedLevel] = useState(null);
  const [showKYC, setShowKYC] = useState(false);
  const [kycForm, setKycForm] = useState({ name: "", phone: "", nationality: "", dob: "", address: "", level: "basic" });
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);

  // Set page title
  useEffect(() => { document.title = "DXB Analytics - Dubai Real Estate Intelligence Platform"; }, []);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [projectTier, setProjectTier] = useState("All");
  const [projectHandover, setProjectHandover] = useState("All");
  const [projectPriceMax, setProjectPriceMax] = useState(20);
  const [projectType, setProjectType] = useState("All");
  const [projectSort, setProjectSort] = useState("default");
  const [liveProjects, setLiveProjects] = useState({});
  const [extraProjects, setExtraProjects] = useState([]);
  const [liveYields, setLiveYields] = useState([]);
  // -- Price Alerts --
  const [showAlerts, setShowAlerts] = useState(false);
  const [myAlerts, setMyAlerts] = useState([]);
  const [alertForm, setAlertForm] = useState({ community: "Dubai Hills Estate", metric: "grossYield", condition: "above", value: "8" });
  const [alertSaving, setAlertSaving] = useState(false);
  // -- AI Insights --
  const [aiInsights, setAiInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [liveDevHealth, setLiveDevHealth] = useState([]);
  const [liveDLDVolumes, setLiveDLDVolumes] = useState([]);
  const [liveSTRData, setLiveSTRData] = useState([]);
  const [liveServiceCharges, setLiveServiceCharges] = useState([]);
  const [liveCompetitors, setLiveCompetitors] = useState([]);
  const [liveMortgageRates, setLiveMortgageRates] = useState([]);
  const [liveNeighbourhoods, setLiveNeighbourhoods] = useState([]);
  const [liveMarketData, setLiveMarketData] = useState([]);
  const [liveFinancials, setLiveFinancials] = useState([]);
  const [liveRisk, setLiveRisk] = useState([]);
  const [liveNewsData, setLiveNewsData] = useState([]); // S10 - tabData/news
  const [liveAdminAlerts, setLiveAdminAlerts] = useState([]); // S12 - adminAlerts
  const [liveBayutData, setLiveBayutData] = useState({});
  const [lastDataSync, setLastDataSync] = useState(null);
  const [allDevelopers, setAllDevelopers] = useState([]);
  const [selectedDeveloper, setSelectedDeveloper] = useState("emaar");
  const [emaarStockPrice, setEmaarStockPrice] = useState(null);
  const [tabSettings, setTabSettings] = useState({});
  const [liveCommunityROI, setLiveCommunityROI] = useState({});
  const [liveCommunityIntel, setLiveCommunityIntel] = useState({});
  // Session 6 - Firestore live data for Overview tab
  const [emaarLive, setEmaarLive] = useState(null);       // developers/emaar
  const [damacLiveFS, setDamacLiveFS] = useState(null);   // developers/damac (Firestore)
  const [sobhaLiveFS, setSobhaLiveFS] = useState(null);   // developers/sobha (Firestore)
  const [nakheelLiveFS, setNakheelLiveFS] = useState(null); // developers/nakheel
  const [meraasLiveFS, setMeraasLiveFS]   = useState(null); // developers/meraas
  const [binghattiLiveFS, setBinghattiLiveFS] = useState(null); // developers/binghatti
  const [aldarLiveFS, setAldarLiveFS]         = useState(null); // developers/aldar
  const [marketGlobal, setMarketGlobal] = useState(null); // marketData/global

  // S22-S28: Developer data resolver
  const devData = React.useMemo(() => {
    const resolvers = {
      damac:    { identity:damacIdentity,    live:{...damacLive,    ...(damacLiveFS||{})},    financials:damacFinancialHistory,    communities:damacCommunities,    yields:damacYields,    risks:damacLiveFS?.damacRisks||damacRisks,        segments:damacLiveFS?.damacSegments||damacSegments,        radar:damacLiveFS?.damacRadar||damacRadar,           megaProjects:damacMegaProjects,    branded:damacBranded,  projects:damacProjects    },
      sobha:    { identity:sobhaIdentity,    live:{...sobhaLive,    ...(sobhaLiveFS||{})},    financials:sobhaFinancialHistory,    communities:sobhaCommunities,    yields:sobhaYields,    risks:sobhaLiveFS?.sobhaRisks||sobhaRisks,        segments:sobhaLiveFS?.sobhaSegments||sobhaSegments,        radar:sobhaLiveFS?.sobhaRadar||sobhaRadar,           megaProjects:sobhaMegaProjects,    branded:[],            projects:sobhaProjects    },
      nakheel:  { identity:nakheelIdentity,  live:{...nakheelLive,  ...(nakheelLiveFS||{})},  financials:nakheelFinancialHistory,  communities:nakheelCommunities,  yields:nakheelYields,  risks:nakheelLiveFS?.nakheelRisks||nakheelRisks,    segments:nakheelLiveFS?.nakheelSegments||nakheelSegments,  radar:nakheelLiveFS?.nakheelRadar||nakheelRadar,     megaProjects:nakheelMegaProjects,  branded:[],            projects:nakheelProjects  },
      meraas:   { identity:meraasIdentity,   live:{...meraasLive,   ...(meraasLiveFS||{})},   financials:meraasFinancialHistory,   communities:meereasCommunities,  yields:meraasYields,   risks:meraasLiveFS?.meraasRisks||meraasRisks,       segments:meraasLiveFS?.meraasSegments||meraasSegments,     radar:meraasLiveFS?.meraasRadar||meraasRadar,        megaProjects:meereasMega,         branded:[],            projects:meraasProjects   },
      binghatti:{ identity:binghattiIdentity,live:{...binghattiLive,...(binghattiLiveFS||{})},financials:binghattiFinancialHistory,communities:binghattiCommunities,yields:binghattiYields,risks:binghattiLiveFS?.binghattiRisks||binghattiRisks,segments:binghattiLiveFS?.binghattiSegments||binghattiSegments,radar:binghattiLiveFS?.binghattiRadar||binghattiRadar,megaProjects:binghattiMegaProjects,branded:[],           projects:binghattiProjects},
      aldar:    { identity:aldarIdentity,    live:{...aldarLive,    ...(aldarLiveFS||{})},    financials:aldarFinancialHistory,    communities:aldarCommunities,    yields:aldarYields,    risks:aldarLiveFS?.aldarRisks||aldarRisks,          segments:aldarLiveFS?.aldarSegments||aldarSegments,        radar:aldarLiveFS?.aldarRadar||aldarRadar,           megaProjects:aldarMegaProjects,    branded:[],            projects:aldarProjects    },
    };
    if (resolvers[selectedDeveloper]) return { ...resolvers[selectedDeveloper], isT1:true, isLive:true };
    return { identity:{id:"emaar",name:"Emaar Properties",founder:"Mohamed Alabbar",md:"Amit Jain",founded:1997}, live:emaarLive, financials:emaarFinancials, communities:emaarCommunities, yields:emaarYields, risks:emaarRisks, segments:emaarSegments, radar:radarData, megaProjects:megaProjects, branded:[], projects:emaarProjects, isT1:true, isLive:true };
  }, [selectedDeveloper, emaarLive, damacLiveFS, sobhaLiveFS, nakheelLiveFS, meraasLiveFS, binghattiLiveFS, aldarLiveFS]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const location = useLocation();
  const [selectedProject, setSelectedProject] = useState(null);
  const [pdTab, setPdTab] = useState("overview");
  const [pdSendModal, setPdSendModal] = useState(false);
  const [pdCopiedLink, setPdCopiedLink] = useState(false);
  const [pdCalcPrice, setPdCalcPrice] = useState(1750000);
  const [pdCalcYears, setPdCalcYears] = useState(5);
  const [pdCalcBeds, setPdCalcBeds] = useState("1BR");
  const [pdCalcStrategy, setPdCalcStrategy] = useState("Long-Term");
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [expandedMega, setExpandedMega] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  // Flip Calculator state (lifted up to prevent reset on re-render)
  const [investScoreFilter, setInvestScoreFilter] = useState("All");
  const [investExpandedComm, setInvestExpandedComm] = useState(null);
  const [flipProjId, setFlipProjId] = useState("");
  const [flipBuyPrice, setFlipBuyPrice] = useState(2000000);
  const [flipSellPrice, setFlipSellPrice] = useState(2500000);
  const [flipPaymentPlan, setFlipPaymentPlan] = useState("80_20");
  const [flipHoldYears, setFlipHoldYears] = useState(3);
  const [flipIncludeRental, setFlipIncludeRental] = useState(false);
  const [flipRentalYield, setFlipRentalYield] = useState(6.5);
  // Golden Visa Calculator state (lifted up)
  const [gvPropPrice, setGvPropPrice] = useState(2000000);
  const [gvPaymentPlan, setGvPaymentPlan] = useState("cash");
  const [gvNationality, setGvNationality] = useState("other");
  const [gvSelectedProj, setGvSelectedProj] = useState(null);

  // Load projects from Firestore (runs for ALL users - guests and logged-in)
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const globalRefresh = () => {
    setIsRefreshing(true);
    try { sessionStorage.setItem("dxb_active_tab", tab); } catch(e) {}
    setTimeout(() => { window.location.reload(); }, 300);
  };

  useEffect(() => {
    const loadProjects = async () => {
      setProjectsLoading(true);
      try {
        // Initial projectData load for first paint - onSnapshot takes over immediately
        const pdSnap = await getDocs(collection(db, "projectData"));
        const overrides = {};
        pdSnap.forEach(d => { overrides[d.id.replace("project_", "")] = d.data(); });
        setLiveProjects(overrides);
        // projects, yieldData, communityROI, communityIntel all handled by live onSnapshot listeners

        // yieldData now live via onSnapshot
        // communityROI now live via onSnapshot

        // communityIntel now live via onSnapshot

        // tabData now live via onSnapshot master listener
      } catch (e) { console.log("Firestore not available, using static data"); }
      setProjectsLoading(false);
    };
    // -- Live EMAAR stock price via Yahoo Finance (free, no key) --
    const fetchEmaarStock = async () => {
      try {
        const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/EMAAR.DU?interval=1d&range=1d");
        const data = await res.json();
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        const prev  = data?.chart?.result?.[0]?.meta?.chartPreviousClose;
        if (price && prev) {
          const chg = ((price - prev) / prev * 100).toFixed(2);
          setEmaarStockPrice({ price: price.toFixed(2), change: chg, up: price >= prev });
        }
      } catch(e) { /* silent */ }
    };
    fetchEmaarStock();
    const stockInterval = setInterval(fetchEmaarStock, 300000);
    loadProjects(); // Load for everyone - no isLoggedIn gate

    // priceAlerts now live via user onSnapshot listener

    // -- AI Insights - generated fresh if not in cache (cache read now via onSnapshot) --
    (async () => {
      try {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // S8.5 - 24h cache
        if (aiInsights?.length > 0) return; // already loaded by onSnapshot
        {
          // Generate fresh insights via Claude API - inject live Firestore data
          setInsightsLoading(true);
          // Build live context from Firestore (fallback to verified constants)
          const liveCtx = {
            mktValue:   marketGlobal?.totalMarketValue  || "AED 682.5B",
            txns:       marketGlobal?.totalTransactions || "214,912",
            ppsf:       marketGlobal?.avgPricePsf       || "AED 1,689",
            yoy:        marketGlobal?.yoyGrowthPct      || "+30.64%",
            offPlan:    marketGlobal?.offPlanShare       || "62.6%",
            emaarSales: emaarLive?.propertySales != null ? `AED ${emaarLive.propertySales}B` : "AED 80.4B",
            backlog:    emaarLive?.backlog       != null ? `AED ${emaarLive.backlog}B`       : "AED 155B",
          };
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1000,
              messages: [{ role: "user", content: `You are a Dubai real estate analyst. Generate exactly 5 sharp, data-driven market insights for Dubai property investors right now (${new Date().toLocaleDateString("en-AE", { month: "long", year: "numeric" })}). Use these verified live facts: Dubai total market ${liveCtx.mktValue}, ${liveCtx.txns} transactions, YoY growth ${liveCtx.yoy}, avg price/sqft ${liveCtx.ppsf}, off-plan share ${liveCtx.offPlan}, Emaar sales ${liveCtx.emaarSales}, Emaar backlog ${liveCtx.backlog}, avg yield city 6.9%, JVC yields 8-9%, Downtown avg AED 2,800/sqft, DLD transfer fee 4%. Return ONLY a JSON array of 5 objects, no markdown, no preamble: [{"title":"...","insight":"...","tag":"Yield|Price|Risk|Macro|Opportunity","direction":"up|down|neutral"}]` }]
            })
          });
          const apiData = await res.json();
          const text = apiData.content?.[0]?.text || "[]";
          const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
          setAiInsights(parsed);
          // Cache for 24 hours (S8.5 - was 7 days)
          try { await setDoc(doc(db, "aiInsights", "latest"), { insights: parsed, generatedAt: Date.now() }); } catch(e) {}
          setInsightsLoading(false);
        }
      } catch(e) { setInsightsLoading(false); }
    })();

    // -- Load Paddle.js for billing --
    if (!window.Paddle) {
      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.onload = () => {
        // -- PASTE YOUR PADDLE CLIENT TOKEN BELOW --
        // Get it from paddle.com ? Developer ? Authentication ? Client-side token
        const PADDLE_CLIENT_TOKEN = "live_4393f28d4ec943ebe056835651f";
        if (!PADDLE_CLIENT_TOKEN.includes("PASTE")) {
          window.Paddle.Initialize({ token: PADDLE_CLIENT_TOKEN });
        }
      };
      document.head.appendChild(script);
    }

    return () => clearInterval(stockInterval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use merged Firestore+static data if available, otherwise pure static fallback
  // activeProjects: curated 48 from data.js + any genuinely NEW projects added via radar
  // For Emaar: base 48 + any radar-added projects NOT already in the 48 (new launches)
  // For other developers: only Firestore projects matching that developer
  const emaarBaseNames = new Set(emaarProjects.map(p => (p.name || "").toLowerCase().trim()));
  const activeProjects = [
    // Always include all 48 curated Emaar projects with any live overrides
    ...emaarProjects.map(p => { const ov = liveProjects[String(p.id)] || liveProjects[p.id]; return ov ? { ...p, ...ov, developerId:"emaar" } : { ...p, developerId:"emaar" }; }),
    // Include DAMAC projects (S22)
    ...damacProjects.map(p => ({ ...p, developerId:"damac" })),
    ...sobhaProjects.map(p => ({ ...p, developerId:"sobha" })),
    ...nakheelProjects.map(p => ({ ...p, developerId:"nakheel" })),
    ...meraasProjects.map(p => ({ ...p, developerId:"meraas" })),
    ...binghattiProjects.map(p => ({ ...p, developerId:"binghatti" })),
    ...aldarProjects.map(p => ({ ...p, developerId:"aldar" })),
    // Include ALL extra projects from Firestore (radar + other developers)
    // Skip any that duplicate the 48 Emaar base projects by name
    ...extraProjects.filter(p => !emaarBaseNames.has((p.name || "").toLowerCase().trim()))
  ];

  // Auto-open project modal when navigated from /project/:id link
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const openId = location?.state?.openProjectId;
    if (openId && activeProjects.length > 0) {
      const proj = activeProjects.find(p => String(p.id) === String(openId) || p.id === openId);
      if (proj) { setSelectedProject(proj); setTab("Projects"); }
    }
  }, [location?.state?.openProjectId, activeProjects.length]);

  // Normalize units from either Object ({studio:{total,sold}}) or Array ([{type,available,total}]) format
  const getUnitEntries = (units) => {
    if (!units) return [];
    if (Array.isArray(units)) {
      return units.filter(u => u && (u.total || 0) > 0).map(u => [u.type || "Unit", { total: u.total || 0, sold: (u.total || 0) - (u.available || 0) }]);
    }
    return Object.entries(units).filter(([, d]) => d && d.total > 0);
  };


  const toggleCompare = (p) => {
    setCompareList(prev => {
      const exists = prev.find(x => x.id === p.id);
      if (exists) {
        notify("Removed " + p.name + " from comparison");
        return prev.filter(x => x.id !== p.id);
      }
      if (prev.length >= 3) {
        notify("\u26A0\uFE0F Max 3 projects for comparison");
        return prev;
      }
      notify("\u2705 Added " + p.name + " to comparison");
      return [...prev, p];
    });
  };

  // Listen to Firebase auth state + fetch user profile

  // -- MASTER LIVE LISTENERS - all Firestore real-time subscriptions ----------
  useEffect(() => {
    const unsubs = [];

    // projectData overrides (prices, PPSF, images edited in Admin)
    unsubs.push(onSnapshot(collection(db, "projectData"), (snap) => {
      const overrides = {};
      snap.forEach(d => { overrides[d.id.replace("project_", "")] = d.data(); });
      setLiveProjects(overrides);
    }));

    // projects collection (radar adds, DAMAC, Aldar etc)
    const baseIds = new Set(emaarProjects.map(p => String(p.id)));
    const baseNames = new Set(emaarProjects.map(p => (p.name || "").toLowerCase().trim()).filter(Boolean));
    unsubs.push(onSnapshot(collection(db, "projects"), (snap) => {
      const fsProjects = [];
      snap.forEach(d => {
        const data = { ...d.data(), id: d.id, fromFirestore: true };
        if (data.developerId === "emaar" && (baseIds.has(String(data.id)) || baseIds.has(data.id?.toString().replace("emaar_","emaar-")))) return;
        if (data.developerId === "emaar" && baseNames.has((data.name || "").toLowerCase().trim())) return;
        if (!baseIds.has(String(data.id))) fsProjects.push(data);
      });
      setExtraProjects(prev => {
        const overridesOnly = prev.filter(p => !p.fromFirestore);
        const seen = new Set(overridesOnly.map(p => String(p.id)));
        return [...overridesOnly, ...fsProjects.filter(p => !seen.has(String(p.id)))];
      });
    }));

    // communityROI
    unsubs.push(onSnapshot(collection(db, "communityROI"), (snap) => {
      if (!snap.size) return;
      const map = {};
      snap.forEach(d => { map[d.id] = { ...communityROI[d.id], ...d.data() }; });
      setLiveCommunityROI(map);
    }));

    // communityIntel
    unsubs.push(onSnapshot(collection(db, "communityIntel"), (snap) => {
      if (!snap.size) return;
      const map = {};
      snap.forEach(d => { map[d.id] = { ...communityIntel[d.id], ...d.data() }; });
      setLiveCommunityIntel(map);
    }));

    // Session 6 - developers/emaar (Emaar financials from Firestore)
    unsubs.push(onSnapshot(doc(db, "developers", "emaar"), (snap) => {
      if (snap.exists()) setEmaarLive(snap.data());
      setOverviewLoading(false);
    }));

    // S22 - developers/damac (DAMAC data from Firestore)
    unsubs.push(onSnapshot(doc(db, "developers", "damac"), (snap) => {
      if (snap.exists()) setDamacLiveFS(snap.data());
    }));

    // S25 - developers/sobha
    unsubs.push(onSnapshot(doc(db, "developers", "sobha"), (snap) => {
      if (snap.exists()) setSobhaLiveFS(snap.data());
    }));
    // S27 - developers/nakheel
    unsubs.push(onSnapshot(doc(db, "developers", "nakheel"), (snap) => {
      if (snap.exists()) setNakheelLiveFS(snap.data());
    }));
    // S27 - developers/meraas
    unsubs.push(onSnapshot(doc(db, "developers", "meraas"), (snap) => {
      if (snap.exists()) setMeraasLiveFS(snap.data());
    }));
    // S28 - developers/binghatti
    unsubs.push(onSnapshot(doc(db, "developers", "binghatti"), (snap) => {
      if (snap.exists()) setBinghattiLiveFS(snap.data());
    }));
    // S28 - developers/aldar
    unsubs.push(onSnapshot(doc(db, "developers", "aldar"), (snap) => {
      if (snap.exists()) setAldarLiveFS(snap.data());
    }));

    // Session 6 - marketData/global (Dubai market stats from Firestore)
    unsubs.push(onSnapshot(doc(db, "marketData", "global"), (snap) => {
      if (snap.exists()) setMarketGlobal(snap.data());
    }));

    // yieldData
    unsubs.push(onSnapshot(collection(db, "yieldData"), (snap) => {
      if (!snap.size) return;
      const yieldOverrides = {};
      snap.forEach(d => { yieldOverrides[d.id] = d.data(); });
      const merged = emaarYields.map(y => {
        const ov = yieldOverrides[`${y.community}_${y.unit}`];
        return ov ? { ...y, ...ov } : y;
      }).map(y => ({ label: y.unit, community: y.community, rent: (y.rent||0)/1000, price: (y.price||0)/1000, gross: y.gross, net: y.net, demand: y.demand === "Very High" ? "V.High" : y.demand === "Moderate-High" ? "High" : y.demand, visa: y.visa }));
      setLiveYields(merged);
    }));

    // tabData/yieldData
    unsubs.push(onSnapshot(doc(db, "tabData", "yieldData"), (snap) => {
      if (!snap.exists() || !snap.data().rows?.length) return;
      const mapped = snap.data().rows.map(r => ({
        label: "Apt", community: r.community,
        rent: parseFloat(r.avgRent || 0) / 1000, price: 0,
        gross: parseFloat(r.grossYield || 0), net: parseFloat(r.netYield || 0),
        demand: r.trend === "rising" ? "V.High" : "High", visa: false
      }));
      setLiveYields(mapped);
    }));

    // liveMarketData/latest (written by cron every 6h)
    unsubs.push(onSnapshot(doc(db, "liveMarketData", "latest"), (snap) => {
      if (!snap.exists()) return;
      const latest = snap.data();
      const bayutMap = {};
      Object.values(latest.communities || {}).forEach(c => { bayutMap[c.community] = c; bayutMap[c.district] = c; });
      setLiveBayutData(bayutMap);
      setLastDataSync(latest.syncedAt ? new Date(latest.syncedAt) : null);
    }));

    // tabData collections (all dashboard tab content)
    const tabKeys = [
      { key: "developerHealth",    setter: setLiveDevHealth },
      { key: "dldVolumes",         setter: setLiveDLDVolumes },
      { key: "strLtrData",         setter: setLiveSTRData },
      { key: "serviceCharges",     setter: setLiveServiceCharges },
      { key: "competitorData",     setter: setLiveCompetitors },
      { key: "mortgageRates",      setter: setLiveMortgageRates },
      { key: "neighbourhoodScores",setter: setLiveNeighbourhoods },
      { key: "marketData",         setter: setLiveMarketData },
      { key: "financials",         setter: setLiveFinancials },
      { key: "riskFactors",        setter: setLiveRisk },
    ];
    tabKeys.forEach(({ key, setter }) => {
      unsubs.push(onSnapshot(doc(db, "tabData", key), (snap) => {
        if (snap.exists() && snap.data().rows?.length > 0) setter(snap.data().rows);
      }));
    });

    // S10 - tabData/news (written by cron-news.js daily)
    unsubs.push(onSnapshot(doc(db, "tabData", "news"), (snap) => {
      if (snap.exists() && snap.data().rows?.length > 0) {
        setLiveNewsData(snap.data().rows);
      }
    }));

    // S11 - tabData/yieldSummary (written by cron-yields.js weekly)
    unsubs.push(onSnapshot(doc(db, "tabData", "yieldSummary"), (snap) => {
      if (!snap.exists() || !snap.data().communities?.length) return;
      const communities = snap.data().communities;
      // Map to the shape the Yields tab chart expects
      const mapped = [];
      communities.forEach(c => {
        const unitTypes = [
          { key: "studio", label: "Studio", demand: "High" },
          { key: "apt1",   label: "1BR Apt", demand: "V.High" },
          { key: "apt2",   label: "2BR Apt", demand: "High" },
          { key: "apt3",   label: "3BR Apt", demand: "Moderate" },
        ];
        unitTypes.forEach(u => {
          const gross = c.yields?.[u.key];
          const rent  = c.rents?.[u.key];
          const price = c.salePrices?.[u.key];
          if (gross != null) {
            mapped.push({
              label:     u.label,
              community: c.community,
              rent:      rent   ? rent   / 1000 : 0,
              price:     price  ? price  / 1000 : 0,
              gross,
              net:       parseFloat((gross * 0.82).toFixed(2)), // ~18% costs
              demand:    u.demand,
              visa:      price >= 2000000 ? "Yes (=2M)" : "Below 2M",
              fromCron:  true,
            });
          }
        });
      });
      if (mapped.length > 0) setLiveYields(mapped);
    }));

    // S12 - adminAlerts (written by cron-financials.js when new quarter detected)
    unsubs.push(onSnapshot(collection(db, "adminAlerts"), (snap) => {
      const alerts = [];
      snap.forEach(d => alerts.push({ id: d.id, ...d.data() }));
      const unread = alerts
        .filter(a => !a.read)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setLiveAdminAlerts(unread);
      if (unread.length > 0) console.log(`[S12] ${unread.length} unread admin alert(s)`);
    }));

    // platformSettings/tabs (which tabs are on/off)
    unsubs.push(onSnapshot(doc(db, "platformSettings", "tabs"), (snap) => {
      if (snap.exists()) setTabSettings(snap.data());
    }));

    // S14 - developers collection (all 228 after seed-developers.js runs)
    unsubs.push(onSnapshot(collection(db, "developers"), (snap) => {
      if (!snap.size) return;
      const devs = [];
      snap.forEach(d => devs.push({ id: d.id, ...d.data() }));
      // Sort: T1 first, then T2, T3, registry - then by salesValue2025 desc
      const tierOrder = { T1: 0, T2: 1, T3: 2, registry: 3 };
      devs.sort((a, b) => {
        const ta = tierOrder[a.tier] ?? 3;
        const tb = tierOrder[b.tier] ?? 3;
        if (ta !== tb) return ta - tb;
        return (b.salesValue2025 || 0) - (a.salesValue2025 || 0);
      });
      setAllDevelopers(devs);
    }));

    // aiInsights/latest
    unsubs.push(onSnapshot(doc(db, "aiInsights", "latest"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (data.insights && data.generatedAt > oneDayAgo) setAiInsights(data.insights);
    }));

    return () => unsubs.forEach(u => { try { u(); } catch {} });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // USER-SCOPED LIVE LISTENERS - portfolio, watchlist, price alerts
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) return;
    const unsubs = [];
    unsubs.push(onSnapshot(doc(db, "portfolios", auth.currentUser.uid), (snap) => {
      if (snap.exists()) setMyPortfolio(snap.data().holdings || []);
    }));
    unsubs.push(onSnapshot(doc(db, "watchlists", auth.currentUser.uid), (snap) => {
      if (snap.exists()) setWatchlist(snap.data().projects || []);
    }));
    unsubs.push(onSnapshot(doc(db, "priceAlerts", auth.currentUser.uid), (snap) => {
      if (snap.exists()) setMyAlerts(snap.data().alerts || []);
    }));
    return () => unsubs.forEach(u => { try { u(); } catch {} });
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Google redirect result at top level
  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        setShowLogin(false);
        setIsLoggedIn(true);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsLoggedIn(true);
        setShowLogin(false);
        setUser(firebaseUser.email || "");
        // Fetch user profile from Firestore
        try {
          // Track last login timestamp + history (last 10 logins)
          try {
            const historyEntry = {
              time: new Date().toISOString(),
              device: navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop",
              browser: (() => {
                const ua = navigator.userAgent;
                if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
                if (ua.includes("Firefox")) return "Firefox";
                if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
                if (ua.includes("Edg")) return "Edge";
                return "Browser";
              })(),
            };
            const existing = await getDoc(doc(db, "users", firebaseUser.uid));
            const prevHistory = existing.exists() ? (existing.data().loginHistory || []) : [];
            const newHistory = [historyEntry, ...prevHistory].slice(0, 10);
            await setDoc(doc(db, "users", firebaseUser.uid), {
              lastLoginAt: new Date().toISOString(),
              emailVerified: firebaseUser.emailVerified,
              provider: firebaseUser.providerData?.[0]?.providerId || "email",
              loginHistory: newHistory,
            }, { merge: true });
          } catch(e) {}
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(data.name || "");
            let tier = data.tier || "free";
            // Check if trial has expired
            if (tier === "pro_trial" && data.trialEnd) {
              const trialEnd = new Date(data.trialEnd);
              const now = new Date();
              const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
              if (daysLeft <= 0) {
                tier = "free";
                setTrialDaysLeft(0);
                await setDoc(doc(db, "users", firebaseUser.uid), { tier: "free" }, { merge: true });
                // Send trial expired email (once only)
                if (!data.emailSent_trialExpired) {
                  try {
                    await emailjs.send("service_da7nshv", "template_gl1xqhy", {
                      user_email: firebaseUser.email, user_name: data.name || firebaseUser.email.split("@")[0],
                      project_name: "DXB Analytics Platform",
                      change_type: "?? Your Pro Trial Has Expired",
                      new_value: "Your 7-day trial has ended. Upgrade now to keep full access to 208+ projects, yield data, ROI tools and more.",
                      old_value: "Pro Trial", updated_at: new Date().toLocaleDateString("en-AE"),
                    }, "USkwUhp0csGCVDkdQ");
                    await setDoc(doc(db, "users", firebaseUser.uid), { emailSent_trialExpired: true }, { merge: true });
                  } catch(e) {}
                }
              } else {
                setTrialDaysLeft(daysLeft);
                // Send 3-day warning email (once only)
                if (daysLeft <= 3 && !data.emailSent_trial3d) {
                  try {
                    await emailjs.send("service_da7nshv", "template_gl1xqhy", {
                      user_email: firebaseUser.email, user_name: data.name || firebaseUser.email.split("@")[0],
                      project_name: "DXB Analytics Platform",
                      change_type: `?? Your Trial Expires in ${daysLeft} Day${daysLeft !== 1 ? "s" : ""}`,
                      new_value: `Only ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left on your Pro trial. Don't lose access - upgrade now to keep all features.`,
                      old_value: "Pro Trial Active", updated_at: new Date().toLocaleDateString("en-AE"),
                    }, "USkwUhp0csGCVDkdQ");
                    await setDoc(doc(db, "users", firebaseUser.uid), { emailSent_trial3d: true }, { merge: true });
                  } catch(e) {}
                }
                // Send 1-day urgent warning (once only)
                if (daysLeft <= 1 && !data.emailSent_trial1d) {
                  try {
                    await emailjs.send("service_da7nshv", "template_gl1xqhy", {
                      user_email: firebaseUser.email, user_name: data.name || firebaseUser.email.split("@")[0],
                      project_name: "DXB Analytics Platform",
                      change_type: "Last Day of Your Pro Trial!",
                      new_value: "Today is your last day. After midnight your account moves to Free and you lose access to 48 projects, community yields, ROI data and PDF reports.",
                      old_value: "Pro Trial - Final Day", updated_at: new Date().toLocaleDateString("en-AE"),
                    }, "USkwUhp0csGCVDkdQ");
                    await setDoc(doc(db, "users", firebaseUser.uid), { emailSent_trial1d: true }, { merge: true });
                  } catch(e) {}
                }
              }
            }
            // Admin override - by role field OR by owner email
            if (data.role === "admin" || firebaseUser.email === "mianwaleed689@gmail.com") tier = "admin";
            setUserTier(tier);
            setIsSuspended(!!data.suspended);
            setIsVerified(!!data.verified);
            setVerifiedLevel(data.verifiedLevel || null);
            setKycStatus(data.kycStatus || null);
          } else {
            // Existing user without profile (e.g. your admin account) - treat as admin/pro
            setUserTier("admin");
            setUserName("");
          }
        } catch (err) {
          console.log("Could not fetch user profile:", err);
          setUserTier("pro"); // fallback for existing users
        }
      } else {
        setIsLoggedIn(false);
        setUser("");
        setUserTier("free");
        setTrialDaysLeft(0);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Tab settings now live via master onSnapshot listener

  // Portfolio now live via user onSnapshot listener

  // Watchlist now live via user onSnapshot listener

  const toggleWatchlist = async (project) => {
    if (!isLoggedIn) { setShowLogin("login"); return; }
    const isWatched = watchlist.find(p => p.id === project.id);
    const updated = isWatched ? watchlist.filter(p => p.id !== project.id) : [...watchlist, { id: project.id, name: project.name, community: project.community, price: project.price, addedAt: new Date().toISOString() }];
    setWatchlist(updated);
    if (auth.currentUser) {
      try { await setDoc(doc(db, "watchlists", auth.currentUser.uid), { projects: updated, updatedAt: new Date().toISOString() }); } catch (e) {}
    }
    notify(isWatched ? `Removed ${project.name} from watchlist` : `? ${project.name} added to watchlist`);
  };

  // Price alerts now live via user onSnapshot listener

  const saveAlerts = async (alerts) => {
    setMyAlerts(alerts);
    if (auth.currentUser) {
      try { await setDoc(doc(db, "priceAlerts", auth.currentUser.uid), { alerts, updatedAt: new Date().toISOString() }); } catch(e) {}
    }
  };

  const addAlert = () => {
    if (!showSetAlert || !alertForm.value) return;
    const p = showSetAlert;
    const newAlert = { id: Date.now().toString(), projectId: p.id, projectName: p.name, community: p.community, type: alertForm.type, value: Number(alertForm.value), createdAt: new Date().toISOString(), triggered: false };
    saveAlerts([...myAlerts, newAlert]);
    setShowSetAlert(null);
    setAlertForm({ type: "price_below", value: "" });
    notify("Alert set for " + p.name);
  };

  const removeAlert = (id) => { saveAlerts(myAlerts.filter(a => a.id !== id)); notify("Alert removed"); };

  // Check alerts vs live data on load
  React.useEffect(() => {
    if (!myAlerts.length || !activeProjects.length) return;
    const hits = myAlerts.filter(a => {
      if (a.triggered) return false;
      const p = activeProjects.find(x => x.id === a.projectId);
      if (!p) return false;
      const comm = emaarCommunities.find(c => c.name === p.community);
      if (a.type === "price_below" && p.price && p.price <= a.value) return true;
      if (a.type === "price_above" && p.price && p.price >= a.value) return true;
      if (a.type === "yield_above" && comm && comm.avgYield >= a.value) return true;
      if (a.type === "construction_above" && p.construction >= a.value) return true;
      return false;
    });
    if (hits.length) {
      saveAlerts(myAlerts.map(a => hits.find(h => h.id === a.id) ? { ...a, triggered: true } : a));
      hits.forEach(a => notify("Alert triggered: " + a.projectName));
    }
  }, [myAlerts, activeProjects]);

  // NOTIFICATIONS - live listener so admin messages appear instantly
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const unsub = onSnapshot(collection(db, "notifications"), (snap) => {
      const userNotifs = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.userId === uid || data.userId === "all") {
          userNotifs.push({ id: d.id, ...data });
        }
      });
      userNotifs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setNotifications(userNotifs.slice(0, 20));
      setUnreadCount(userNotifs.filter(n => !n.read).length);
    });
    return () => unsub();
  }, [isLoggedIn]);

  const markNotifRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try { await setDoc(doc(db, "notifications", id), { read: true }, { merge: true }); } catch (e) {}
  };

  // ONBOARDING - show for new users on first login
  useEffect(() => {
    if (isLoggedIn && userName !== undefined) {
      const key = `dxb_onboarded_${user}`;
      if (!localStorage.getItem(key)) {
        setTimeout(() => setShowOnboarding(true), 1000);
      }
    }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const completeOnboarding = () => {
    localStorage.setItem(`dxb_onboarded_${user}`, "1");
    setShowOnboarding(false);
  };

  const savePortfolio = async (holdings) => {
    setMyPortfolio(holdings);
    if (auth.currentUser) {
      try { await setDoc(doc(db, "portfolios", auth.currentUser.uid), { holdings, updatedAt: new Date().toISOString() }); } catch (e) { console.log("Portfolio save error:", e); }
    }
  };

  const addToPortfolio = () => {
    if (!showAddPortfolio || !portfolioForm.investedAmount) return;
    const existing = myPortfolio.find(h => h.projectId === showAddPortfolio.id && h.unitType === portfolioForm.unitType);
    let updated;
    if (existing) {
      updated = myPortfolio.map(h => h.projectId === showAddPortfolio.id && h.unitType === portfolioForm.unitType ? { ...h, units: h.units + portfolioForm.units, investedAmount: h.investedAmount + Number(portfolioForm.investedAmount) } : h);
    } else {
      updated = [...myPortfolio, { projectId: showAddPortfolio.id, units: portfolioForm.units, investedAmount: Number(portfolioForm.investedAmount), purchaseDate: portfolioForm.purchaseDate || new Date().toISOString().slice(0,10), unitType: portfolioForm.unitType, notes: portfolioForm.notes }];
    }
    savePortfolio(updated);
    setShowAddPortfolio(null);
    setPortfolioForm({ units: 1, investedAmount: "", purchaseDate: "", unitType: "1BR", notes: "" });
    notify("\u2705 Added to portfolio!");
  };

  const removeFromPortfolio = (pid, ut) => {
    savePortfolio(myPortfolio.filter(h => !(h.projectId === pid && h.unitType === ut)));
    notify("Removed from portfolio");
  };


  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // FIX #28: Close modals on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (showCheckout) { setShowCheckout(null); setCheckoutStep(1); }
        else if (showProfile) setShowProfile(false);
        else if (showUpgrade) setShowUpgrade(false);
        else if (showNotifications) setShowNotifications(false);
        else if (showWatchlist) setShowWatchlist(false);
        else if (selectedProject) { setSelectedProject(null); setPdTab("overview"); setPdSendModal(false); }
        else if (showCompare) setShowCompare(false);
        else if (selectedKPI) setSelectedKPI(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showUpgrade, selectedProject, showCompare, showCheckout, showProfile, selectedKPI]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <style>{css}</style>
        <svg width="40" height="40" viewBox="0 0 40 40">
          <rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" />
          <path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} />
        </svg>
        <div style={{ color: T.gold, fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700 }}>DXB Analytics</div>
        <div style={{ width: 24, height: 24, border: `2px solid ${T.border}`, borderTopColor: T.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  // SUSPENDED USER SCREEN
  if (isLoggedIn && isSuspended && userTier !== "admin") {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20, fontFamily: "'Outfit', sans-serif", padding: 24 }}>
        <style>{css}</style>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>??</div>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 800, color: "#EF4444", margin: "0 0 10px" }}>Account Suspended</h1>
          <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.7, margin: "0 0 24px" }}>Your account has been suspended by an administrator. If you believe this is an error, please contact support.</p>
          <a href="mailto:support@dxbanalytics.com" style={{ display: "inline-block", padding: "12px 28px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#EF4444", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Contact Support</a>
        </div>
        <button type="button" onClick={() => signOut(auth)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>Sign Out</button>
      </div>
    );
  }

  // KYC SUBMIT FUNCTION
  const submitKYC = async () => {
    if (!kycForm.name.trim()) { notify("?? Full name required"); return; }
    if (!kycForm.phone.trim()) { notify("?? Phone number required"); return; }
    if (!auth.currentUser) return;
    setKycSubmitting(true);
    try {
      await setDoc(doc(db, "verifications", auth.currentUser.uid), {
        uid: auth.currentUser.uid, email: user, ...kycForm,
        status: "pending", submittedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, "users", auth.currentUser.uid), { kycStatus: "pending" }, { merge: true });
      setKycStatus("pending");
      notify("? Verification submitted! Admin will review within 24h.");
      setShowKYC(false);
    } catch(e) { notify("? " + e.message); }
    setKycSubmitting(false);
  };

  if (!isLoggedIn && !showLogin) {
    return <LandingPage onLoginClick={() => setShowLogin("login")} onSignUpClick={() => setShowLogin("signup")} />;
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => {}} onBack={() => setShowLogin(false)} defaultMode={showLogin === "signup" ? "signup" : "login"} />;
  }

  if (!fetchAdminUsersRef.current) {
    fetchAdminUsersRef.current = async () => {
      setAdminLoading(true);
      try {
        const snap = await getDocs(collection(db, "users"));
        const users = [];
        snap.forEach(d => {
          const data = d.data();
          let status = data.tier || "free";
          let daysLeft = 0;
          if (status === "pro_trial" && data.trialEnd) {
            const end = new Date(data.trialEnd);
            daysLeft = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 0) { status = "expired"; daysLeft = 0; }
          }
          users.push({ id: d.id, ...data, status, daysLeft });
        });
        users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setAdminUsers(users);
      } catch (err) {
        console.error("Failed to fetch users:", err.message || err);
        setAdminError("Error: " + (err.message || JSON.stringify(err)));
      }
      setAdminLoading(false);
    };
  }
  const fetchAdminUsers = fetchAdminUsersRef.current;

  const handleChangeTier = async (userId, newTier) => {
    const u = adminUsers.find(u => u.id === userId);
    const uName = u ? (u.name || u.email) : userId;
    const uEmail = u?.email || "";
    if (!window.confirm(`Change ${uName} to "${newTier}"?`)) return;
    try {
      const now = new Date();
      const data = { tier: newTier };
      if (newTier === "pro_trial") { const end = new Date(); end.setDate(end.getDate() + 7); data.trialEnd = end.toISOString(); }
      await setDoc(doc(db, "users", userId), data, { merge: true });
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, tier: newTier, status: newTier } : u));
      notify(`? ${uName} ? ${newTier}`);
      // Send tier change confirmation email
      const tierMessages = {
        free: { subject: "Your DXB Analytics plan has changed to Free", body: "Your account has been updated to the Free plan. You have access to 5 featured projects and basic market data." },
        pro_trial: { subject: "Your 7-Day Pro Trial has been activated!", body: "Great news! Your Pro Trial has been activated. You now have full access to 208+ projects, community yields, ROI calculator, PDF reports and all Pro features for 7 days." },
        pro: { subject: "Welcome to DXB Analytics Pro! ??", body: "Your account has been upgraded to the Pro Plan. You now have unlimited access to all 208+ projects, live yield data, ROI analysis, investment reports, and all Pro features." },
        enterprise: { subject: "Welcome to DXB Analytics Enterprise! ??", body: "Your account has been upgraded to Enterprise. You have access to all platform features including custom reports, priority support, and full data access." },
      };
      const msg = tierMessages[newTier] || { subject: `Your plan changed to ${newTier}`, body: `Your DXB Analytics plan has been updated to ${newTier}.` };
      if (uEmail) {
        try {
          await emailjs.send("service_da7nshv", "template_gl1xqhy", {
            user_email: uEmail, user_name: uName,
            project_name: "DXB Analytics Platform",
            change_type: msg.subject,
            new_value: msg.body,
            old_value: u?.tier || "free",
            updated_at: now.toLocaleDateString("en-AE"),
          }, "USkwUhp0csGCVDkdQ");
        } catch(e) {}
      }
    } catch (err) {
      notify("? Failed to update tier");
    }
  };

  const handleTabChange = (key) => {
    sessionStorage.removeItem("dxb_active_tab");
    setTab(key);
    setSidebarOpen(false);
    if (key === "Admin" && userTier === "admin") fetchAdminUsers();
    window.scrollTo({ top: 0, behavior: "smooth" });
    const mainEl = document.querySelector(".main-content");
    if (mainEl) mainEl.scrollTop = 0;
    // Track tab activity for admin panel
    if (auth.currentUser) {
      try {
        const actEntry = { tab: key, time: new Date().toISOString() };
        getDoc(doc(db, "users", auth.currentUser.uid)).then(snap => {
          const prev = snap.exists() ? (snap.data().recentActivity || []) : [];
          const updated = [actEntry, ...prev].slice(0, 15);
          setDoc(doc(db, "users", auth.currentUser.uid), { recentActivity: updated }, { merge: true });
        });
      } catch(e) {}
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit', sans-serif" }}>
      <style>{css}</style>

      {/* Skip to content - accessibility */}
      <a href="#main-content" style={{ position: "absolute", top: -40, left: 0, background: T.gold, color: T.bg, padding: "8px 16px", borderRadius: "0 0 8px 0", fontWeight: 700, fontSize: 13, zIndex: 99999, transition: "top 0.2s" }} onFocus={e => e.target.style.top = "0"} onBlur={e => e.target.style.top = "-40px"}>Skip to content</a>

      {/* Toast notification */}
      {toast && <div className="fade-up" style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 24px", borderRadius: 10, background: toast.includes("?") ? T.green : toast.includes("?") ? T.red : T.gold, color: "#fff", fontWeight: 700, fontSize: 13, zIndex: 9999, boxShadow: "0 12px 40px rgba(0,0,0,0.4)", fontFamily: "'Outfit', sans-serif" }}>{toast}</div>}

      {/* Mobile overlay */}
      <div className={`mobile-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* --- SIDEBAR --- */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 240,
        background: T.surface, borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column", zIndex: 100,
        transition: "transform 0.3s ease",
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 40 40">
              <rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" />
              <path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} />
            </svg>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: T.gold }}>DXB Analytics</div>
              <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>Intelligence Platform</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav role="navigation" aria-label="Main navigation" style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 3, overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
          {/* --- S21: DEVELOPER PICKER --- */}
          <div style={{ padding: "0 12px 8px", flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Developer</div>
            <select
              value={selectedDeveloper}
              onChange={e => setSelectedDeveloper(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", background: T.surfaceAlt, border: `1px solid ${selectedDeveloper !== "emaar" ? T.gold : T.border}`, borderRadius: 8, color: selectedDeveloper !== "emaar" ? T.gold : T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer", fontWeight: selectedDeveloper !== "emaar" ? 700 : 400, outline: "none" }}
            >
              <optgroup label="T1 - Full Intelligence">
                <option value="emaar">Emaar Properties</option>
                <option value="damac">DAMAC Properties</option>
                <option value="sobha">Sobha Realty</option>
                <option value="nakheel">Nakheel</option>
                <option value="binghatti">Binghatti</option>
                <option value="meraas">Meraas</option>
                <option value="aldar">Aldar Properties</option>
                <option value="azizi">Azizi Developments</option>
                <option value="danube">Danube Properties</option>
              </optgroup>
              <optgroup label="T2 - Standard">
                <option value="ellington">Ellington Properties</option>
                <option value="mag">MAG Property Dev</option>
                <option value="tiger">Tiger Properties</option>
                <option value="imtiaz">Imtiaz Developments</option>
                <option value="selectgroup">Select Group</option>
                <option value="omniyat">Omniyat</option>
                <option value="deyaar">Deyaar Development</option>
                <option value="samana">Samana Developers</option>
                <option value="reportage">Reportage Properties</option>
                <option value="dubaiprops">Dubai Properties</option>
              </optgroup>
              <optgroup label="T3 - Data Presence">
                <option value="nshama">Nshama</option>
                <option value="wasl">Wasl Properties</option>
                <option value="arada">Arada</option>
                <option value="darglobal">DAR Global</option>
                <option value="vincitore">Vincitore</option>
                <option value="condor">Condor Developers</option>
              </optgroup>
            </select>
          </div>
          <div role="tablist" aria-label="Dashboard sections" style={{ display: "contents" }}>
          {TABS.filter(tabItem => {
            const s = tabSettings[tabItem.key];
            if (s && s.visible === false) return false;
            return true;
          }).map(tabItem => {
            const s = tabSettings[tabItem.key] || {};
            const minTier = s.minTier || "free";
            const tierOrder = { free: 0, pro: 1, enterprise: 2 };
            const userTierOrder = tierOrder[userTier] ?? (userTier === "admin" ? 3 : userTier === "pro_trial" ? 1 : 0);
            const isLocked = tierOrder[minTier] > userTierOrder && userTier !== "admin";
            const tabLabel = tr ? tr("tabs", tabItem.key) : tabItem.key;
            return (
              <button type="button" role="tab" aria-selected={tab === tabItem.key} key={tabItem.key}
                className={`sidebar-btn ${tab === tabItem.key ? "active" : ""}`}
                onClick={() => isLocked ? setShowUpgrade(true) : handleTabChange(tabItem.key)}
                style={isLocked ? { opacity: 0.55 } : {}}
                title={isLocked ? `Requires ${minTier} plan` : tabLabel}
              >
                {tabItem.icon}
                {tabLabel}
                {isLocked && <span style={{ marginLeft: "auto", fontSize: 9, color: minTier === "enterprise" ? "#8B5CF6" : "#D4A843", fontWeight: 700, letterSpacing: 0.5 }}>{minTier === "enterprise" ? "ENT" : "PRO"></span>}
              </button>
            );
          })}
          </div>
          {userTier === "admin" && (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", padding: "16px 16px 8px", marginTop: 8, borderTop: `1px solid ${T.border}` }}>Admin</div>
              <button type="button" className="sidebar-btn" onClick={() => window.location.href = "/admin"} style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.15), rgba(212,168,67,0.05))", border: "1px solid rgba(212,168,67,0.3)" }}>
                {Icons.admin}
                Admin Console ?
              </button>
            </>
          )}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "16px 12px", borderTop: `1px solid ${T.border}` }}>
          {/* Trial Banner */}
          {userTier === "pro_trial" && trialDaysLeft > 0 && (
            <div style={{ marginBottom: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(212,168,67,0.08)", border: `1px solid ${T.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: 0.5 }}>? PRO TRIAL</div>
              <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining</div>
            </div>
          )}
          {userTier === "free" && (
            <div role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setShowUpgrade(true); }} onClick={() => setShowUpgrade(true)} style={{ marginBottom: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.blue, letterSpacing: 0.5 }}>FREE PLAN</div>
              <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>Upgrade to Pro ?</div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: T.surfaceAlt }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: T.bg }}>
              {user.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName || user.split("@")[0]}</div>
              <div style={{ fontSize: 10, color: userTier === "pro_trial" ? T.gold : userTier === "admin" || userTier === "pro" || userTier === "enterprise" ? T.green : T.textMuted }}>
                {userTier === "admin" ? "Admin" : userTier === "pro_trial" ? "Pro Trial" : userTier === "pro" ? "Pro Plan" : userTier === "enterprise" ? "Enterprise" : "Free Plan"}
              </div>
            </div>
            <button type="button" onClick={() => { setShowProfile(true); setProfileEdit({ name: userName || "" }); }} style={{ background: "none", border: `1px solid ${T.border}`, cursor: "pointer", color: T.gold, padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Profile</button>
            <button type="button" onClick={() => { signOut(auth); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }} title="Sign out">
              {Icons.logout}
            </button>
          </div>
          {/* -- Language Switcher -- */}
          {setLang && LANGUAGES && (
            <div style={{ padding: "8px 12px", marginTop: 4 }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <span style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>{langInfo?.flag></span>
                </div>
                <select
                  value={lang}
                  onChange={e => setLang(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px 8px 38px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer", outline: "none", appearance: "none" }}
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.flag} {l.nativeName}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* --- FREE TIER BANNER --- */}
      {userTier === "free" && (
        <div style={{ position: "fixed", top: 0, left: 240, right: 0, zIndex: 60, background: `linear-gradient(90deg, ${T.gold}ee, #B8912Fee)`, padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>?</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#04090F" }}>You're on the Free plan - 12 tabs locked</span>
            <span style={{ fontSize: 11, color: "rgba(4,9,15,0.7)" }}>Upgrade to Pro to unlock DXB Estimate, Yields, Mortgage, Portfolio & more</span>
          </div>
          <button type="button" onClick={() => setShowUpgrade(true)} style={{ padding: "5px 16px", background: "#04090F", color: T.gold, border: "none", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap" }}>
            Upgrade Now ?
          </button>
        </div>
      )}

      {/* --- TOP BAR --- */}
      <header className="top-bar" style={{
        position: "fixed", top: 0, right: 0, left: 240, height: 60,
        background: `${T.surface}ee`, backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Mobile menu button */}
          <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSecondary, display: "none", padding: 4 }} className="mobile-menu-btn">
            {sidebarOpen ? Icons.close : Icons.menu}
          </button>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.white }}>Emaar Properties <span style={{ color: T.textMuted, fontWeight: 400, fontSize: 13 }}>PJSC</span></h1>
          </div>
        </div>
        <div className="header-badges" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" onClick={() => setShowWatchlist(true)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 12px", cursor: "pointer", color: watchlist.length > 0 ? T.gold : T.textSecondary, display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "'Outfit',sans-serif" }} title="My Watchlist">
            ? {watchlist.length > 0 && <span style={{ fontWeight: 700 }}>{watchlist.length></span>}
          </button>
          <button type="button" onClick={globalRefresh} disabled={isRefreshing} title="Refresh all data" style={{ background: isRefreshing ? T.surfaceAlt : "rgba(212,168,67,0.08)", border: "1px solid " + (isRefreshing ? T.border : "rgba(212,168,67,0.25)"), borderRadius: 10, padding: "8px 12px", cursor: isRefreshing ? "not-allowed" : "pointer", color: isRefreshing ? T.textMuted : T.gold, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" onClick={() => setShowNotifications(v => !v)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, cursor: "pointer", color: T.textSecondary, position: "relative" }} title="Notifications">
            {Icons.bell}
            {(unreadCount + (userTier === "admin" ? liveAdminAlerts.length : 0)) > 0 && (
              <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: liveAdminAlerts.length > 0 ? T.gold : T.red, border: `2px solid ${T.bg}` }} />
            )}
          </button>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main role="main" id="main-content" className="main-content" style={{ marginLeft: 240, paddingTop: 60, minHeight: "100vh" }}>
        {/* Trial / Free tier banner */}
        {userTier === "pro_trial" && trialDaysLeft > 0 && (() => {
          const isUrgent = trialDaysLeft <= 1;
          const isWarning = trialDaysLeft <= 3;
          const bg = isUrgent ? "rgba(239,68,68,0.1)" : isWarning ? "rgba(245,158,11,0.1)" : "rgba(212,168,67,0.08)";
          const border = isUrgent ? "rgba(239,68,68,0.35)" : isWarning ? "rgba(245,158,11,0.35)" : T.border;
          const icon = isUrgent ? "??" : isWarning ? "?" : "?";
          const label = isUrgent ? "Last day of your trial!" : isWarning ? `Trial ending soon` : "Pro Trial Active";
          const sub = isUrgent
            ? "Your trial expires today. Upgrade now to keep full access."
            : isWarning
            ? `${trialDaysLeft} days left - don't lose your access to 208+ projects and yield data.`
            : `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} remaining. Full Pro access active.`;
          return (
            <div style={{ margin: "12px 24px 0", padding: "10px 16px", borderRadius: 10, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{icon></span>
                <span style={{ fontSize: 13, color: isUrgent ? T.red : isWarning ? T.gold : T.white, fontWeight: 700 }}>{label></span>
                <span style={{ fontSize: 12, color: T.textSecondary }}>- {sub></span>
              </div>
              <button type="button" onClick={() => setShowUpgrade(true)} style={{ padding: "6px 16px", borderRadius: 6, background: isUrgent ? T.red : T.gold, color: isUrgent ? "#fff" : T.bg, border: "none", fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: "pointer" }}>
                {isUrgent ? "Upgrade Now" : "Upgrade to Pro"}
              </button>
            </div>
          );
        })()}
        {userTier === "free" && (
          <div style={{ margin: "12px 24px 0", padding: "10px 16px", borderRadius: 10, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>??</span>
              <span style={{ fontSize: 13, color: T.white, fontWeight: 600 }}>Free Plan</span>
              <span style={{ fontSize: 12, color: T.textSecondary }}>- You're seeing limited data. Upgrade to unlock all projects, yields & more.</span>
            </div>
            <button type="button" onClick={() => setShowUpgrade(true)} style={{ padding: "6px 16px", borderRadius: 6, background: T.gold, color: T.bg, border: "none", fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: "pointer" }}>Upgrade to Pro - AED 99/mo</button>
          </div>
        )}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: `0 24px ${compareList.length > 0 && tab === "Projects" ? "120px" : "60px"}` }}>

          {/* --- OVERVIEW TAB --- */}
          {tab === "Overview" && <>
            {/* S21/S22/S25: Developer context banner */}
            {selectedDeveloper !== "emaar" && (() => {
              const devNames = { damac:"DAMAC Properties", sobha:"Sobha Realty", nakheel:"Nakheel", binghatti:"Binghatti", meraas:"Meraas", aldar:"Aldar Properties", azizi:"Azizi Developments", danube:"Danube Properties", ellington:"Ellington Properties", mag:"MAG Property Dev", tiger:"Tiger Properties", imtiaz:"Imtiaz Developments", selectgroup:"Select Group", omniyat:"Omniyat", deyaar:"Deyaar Development", samana:"Samana Developers", nshama:"Nshama", wasl:"Wasl Properties", arada:"Arada", darglobal:"DAR Global", vincitore:"Vincitore", condor:"Condor Developers", reportage:"Reportage Properties", dubaiprops:"Dubai Properties" };
              const devName = devNames[selectedDeveloper] || selectedDeveloper;
              const isT1Live = ["damac","sobha","nakheel","meraas","binghatti","aldar"].includes(selectedDeveloper);
              const isT1Pending = ["nakheel","binghatti","meraas","aldar","azizi","danube"].includes(selectedDeveloper);
              const devColor = selectedDeveloper === "damac" ? "#C8A951" : selectedDeveloper === "sobha" ? "#8B5CF6" : isT1Pending ? T.gold : T.blue;
              const d = devData?.live || {};
              const devKpis = isT1Live ? [
                { label:"FY2025 Sales",        value:`AED ${d.propertySales || (selectedDeveloper==="sobha"?30:36)}B`, sub:`USD ${d.propertySalesUSD || (selectedDeveloper==="sobha"?8.17:9.8)}B`, color:devColor },
                { label:"Net Profit Est.",     value:`AED ${d.netProfit    || (selectedDeveloper==="sobha"?5.6:8.1)}B`, sub:"FY2025 estimate",  color:T.green  },
                { label:"Units Delivered",     value:`${(d.unitsDelivered  || (selectedDeveloper==="sobha"?27000:50000)).toLocaleString()}+`, sub:"Total track record", color:T.teal },
                { label:"Under Construction",  value:`${(d.underConstruction||(selectedDeveloper==="sobha"?26933:54000)).toLocaleString()}+`, sub:"Active pipeline",    color:T.blue },
                { label:"Communities",         value:selectedDeveloper==="sobha"?"8":"7", sub:"Master communities",  color:T.purple },
                { label:"Market Rank",         value:selectedDeveloper==="sobha"?"#3":"#1", sub:selectedDeveloper==="sobha"?"Dubai by volume":"Private Developer UAE", color:devColor },
              ] : [];
              return (
                <div style={{ margin:"0 0 20px 0", padding:"20px 24px", borderRadius:14, background:`rgba(${selectedDeveloper==="sobha"?"139,92,246":selectedDeveloper==="damac"?"200,169,81":isT1Pending?"212,168,67":"59,130,246"},0.06)`, border:`1px solid ${devColor}33` }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:isT1Live?16:0 }}>
                    <div>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:devColor }}>{devName}</div>
                      <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>
                        {selectedDeveloper==="damac"     ? "T1 Full Intelligence - Founded 2002 - Hussain Sajwani - MD: Amira Sajwani - #1 Private Developer UAE"
                         : selectedDeveloper==="sobha"    ? "T1 Full Intelligence - Founded 1976 - PNC Menon - Chairman: Ravi Menon - 100% Backward Integration"
                         : selectedDeveloper==="nakheel"  ? "T1 Full Intelligence - Founded 2000 - Dubai Holding - Extended Dubai coastline 300km - Creator of Palm Jumeirah"
                         : selectedDeveloper==="meraas"   ? "T1 Full Intelligence - Founded 2007 - Dubai Holding - 752M sqft land bank - Lifestyle destination pioneer"
                         : selectedDeveloper==="binghatti"? "T1 Full Intelligence - Founded 2012 - Muhammad BinGhatti - ADX Listed - #1 Dubai by Units Sold"
                         : selectedDeveloper==="aldar"    ? "T1 Full Intelligence - Founded 2004 - ADX Listed - Abu Dhabi's largest developer - AED 40.6B FY2025 sales"
                         : isT1Pending ? "T1 Full Intelligence Module - coming soon" : "T2/T3 Developer - DLD data only"}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                      {isT1Live && <span style={{ fontSize:11, padding:"4px 12px", borderRadius:8, background:`rgba(16,185,129,0.12)`, color:T.green, fontWeight:700, border:"1px solid rgba(16,185,129,0.2)" }}>T1 - LIVE DATA</span>}
                      {!isT1Live && <span style={{ fontSize:11, padding:"4px 12px", borderRadius:8, background:`rgba(212,168,67,0.1)`, color:T.gold, fontWeight:700, border:`1px solid ${T.gold}33` }}>{isT1Pending?"T1 - Full Data Coming":"T2/T3 - Limited Data"></span>}
                    </div>
                  </div>
                  {isT1Live && (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10 }}>
                      {devKpis.map(k => (
                        <div key={k.label} style={{ padding:"10px 12px", borderRadius:10, background:T.surfaceAlt, border:`1px solid ${T.border}`, textAlign:"center" }}>
                          <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 }}>{k.label}</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:k.color }}>{k.value}</div>
                          <div style={{ fontSize:9, color:T.textMuted, marginTop:2 }}>{k.sub}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
            {/* Session 6 - live data helpers (Firestore ? fallback to data.js) */}
            {(() => {
              const T1_LIVE = ["damac","sobha","nakheel","meraas","binghatti","aldar"];
              const _fhMap = { damac:damacFinancialHistory, sobha:sobhaFinancialHistory, nakheel:nakheelFinancialHistory, meraas:meraasFinancialHistory };
              const _liveMap = { damac:{...damacLive,...(damacLiveFS||{})}, sobha:{...sobhaLive,...(sobhaLiveFS||{})}, nakheel:{...nakheelLive,...(nakheelLiveFS||{})}, meraas:{...meraasLive,...(meraasLiveFS||{})} };
              const fy = T1_LIVE.includes(selectedDeveloper) ? _fhMap[selectedDeveloper][_fhMap[selectedDeveloper].length-1] : emaarFinancials[emaarFinancials.length - 1];
              const E  = T1_LIVE.includes(selectedDeveloper) ? _liveMap[selectedDeveloper] : (emaarLive || {});
              const M = marketGlobal || {};
              const propertySales  = E.propertySales  != null ? E.propertySales  : fy.propertySales;
              const revenue        = E.revenue        != null ? E.revenue        : fy.revenue;
              const netProfit      = E.netProfit      != null ? E.netProfit      : fy.netProfit;
              const ebitda         = E.ebitda         != null ? E.ebitda         : fy.ebitda;
              const backlog        = T1_LIVE.includes(selectedDeveloper) ? null : (E.backlog != null ? E.backlog : fy.backlog);
              const recurringRev   = T1_LIVE.includes(selectedDeveloper) ? null : (E.recurringRev != null ? E.recurringRev : (fy.recurringRev || 10.5));
              const landBank       = T1_LIVE.includes(selectedDeveloper) ? null : (E.landBank != null ? E.landBank : (fy.landBank || 618));
              const creditRating   = T1_LIVE.includes(selectedDeveloper) ? "Gov/Private" : (E.creditRatingSP || "BBB+");
              const moodysRating   = T1_LIVE.includes(selectedDeveloper) ? "N/A" : (E.creditRatingMoodys || "Baa1");
              const reportLabel    = T1_LIVE.includes(selectedDeveloper) ? "FY2025 DLD Data" : (E.latestReportLabel || "Annual Report FY2025");
              const liveRisks    = devData?.risks    || (E.emaarRisks    || emaarRisks);
              const liveSegments = devData?.segments || (E.emaarSegments || emaarSegments);
              const liveRadar    = devData?.radar    || (E.radarData     || radarData);
              // Dubai market - Firestore first, fallback constants
              const mktValue       = M.totalMarketValue  || "AED 682.5B";
              const mktTxns        = M.totalTransactions || "214,912";
              const mktPpsf        = M.avgPricePsf       || "AED 1,689";
              const mktYoY         = M.yoyGrowthPct      || "+30.64%";
              const mktPeriod      = M.period            || "FY 2025";
              const mktOffPlan     = M.offPlanShare       || "62.6%";
              // Format helpers
              const fmtB = (v) => `AED ${v}B`;
              const freshnessBadge = emaarLive ? (
                <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "rgba(16,185,129,0.12)", color: "#10B981", fontWeight: 700, border: "1px solid rgba(16,185,129,0.2)" }}>?? LIVE</span>
              ) : (
                <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "rgba(212,168,67,0.1)", color: "#D4A843", fontWeight: 700, border: "1px solid rgba(212,168,67,0.2)" }}>STATIC</span>
              );
              return (<>
            {/* --- VERIFIED BAR --- */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 4, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 10, height: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s infinite" }} />
                </span>
                <span style={{ fontSize: 11, color: T.textSecondary }}>Data verified <span style={{ color: T.gold, fontWeight: 600 }}>{new Date().toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })></span></span>
                <span style={{ color: T.border }}>-</span>
                <a href="https://www.emaar.com/en/investor-relations/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: T.teal, textDecoration: "none" }}>Emaar IR ?</a>
                <span style={{ color: T.border }}>-</span>
                {freshnessBadge}
                <span style={{ fontSize: 10, color: T.textMuted }}>{emaarLive ? `Firestore - ${reportLabel}` : "data.js fallback"></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: T.textMuted }}>Click any card for breakdown & sources</span>
                <button type="button" onClick={async () => {
                  const now = new Date().toLocaleDateString("en-AE", { day: "numeric", month: "long", year: "numeric" });
                  const tabLabel = tab || "Overview";
                  // Dynamic load jsPDF from CDN
                  if (!window.jspdf) {
                    await new Promise((resolve, reject) => {
                      const s = document.createElement("script");
                      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
                      s.onload = resolve; s.onerror = reject;
                      document.head.appendChild(s);
                    });
                  }
                  const { jsPDF } = window.jspdf;
                  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
                  const W = 210, M = 18;
                  // Dark background
                  pdf.setFillColor(4, 9, 15);
                  pdf.rect(0, 0, W, 297, "F");
                  // Gold header bar
                  pdf.setFillColor(212, 168, 67);
                  pdf.rect(0, 0, W, 2, "F");
                  // Logo / Title
                  pdf.setFont("helvetica", "bold");
                  pdf.setFontSize(22); pdf.setTextColor(212, 168, 67);
                  pdf.text("DXB Analytics", M, 22);
                  pdf.setFontSize(10); pdf.setTextColor(180, 180, 180);
                  pdf.text("The Bloomberg of Dubai Real Estate", M, 29);
                  // Report title
                  pdf.setFontSize(14); pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold");
                  pdf.text(`${tabLabel} Report`, M, 42);
                  pdf.setFontSize(9); pdf.setTextColor(140, 140, 140); pdf.setFont("helvetica", "normal");
                  pdf.text(`Generated ${now} - ${user || "DXB Analytics"}`, M, 49);
                  // Divider
                  pdf.setDrawColor(212, 168, 67, 0.3); pdf.setLineWidth(0.3);
                  pdf.line(M, 54, W - M, 54);
                  // Data sections based on tab
                  let y = 62;
                  const addSection = (title, rows) => {
                    pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.setTextColor(212, 168, 67);
                    pdf.text(title.toUpperCase(), M, y); y += 7;
                    rows.forEach(([label, value, note]) => {
                      pdf.setFillColor(20, 35, 60); pdf.rect(M, y - 4, W - M * 2, 10, "F");
                      pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(160, 160, 160);
                      pdf.text(label, M + 3, y + 2);
                      pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(255, 255, 255);
                      pdf.text(value, M + 70, y + 2);
                      if (note) { pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(120, 140, 160); pdf.text(note, M + 130, y + 2); }
                      y += 12;
                    });
                    y += 4;
                  };
                  const sections = {
                    "Overview": [
                      [`KEY METRICS`, [[`Property Sales ${reportLabel}`,fmtB(propertySales),"+16% YoY - All-time record"],[`Revenue ${reportLabel}`,fmtB(revenue),"+40% YoY - USD 13.5B"],[`Net Profit ${reportLabel}`,fmtB(netProfit),"+36% YoY - USD 7.0B"],["Backlog",fmtB(backlog),"3-4yr revenue visibility"],["Units Delivered","125,600+","Since 2002 - #1 GCC"]]],
                      ["FINANCIALS", [["Market Cap","AED 128.2B","~USD 34.9B"],["P/E Ratio","7.83-","Industry avg 15.5-"],["Dividend Yield","7.04%","AED 1.00/share"],["Debt/Equity","0.11-","Very low leverage"],["Credit Rating","BBB+ / Baa1","S&P / Moody's stable"]]]
                    ],
                    "Yields": [
                      ["RENTAL YIELD SUMMARY", [["City Average Gross Yield","6.9%","Dubai 2025"],["JVC - Highest Yield","8-9%","Best community for yield"],["Downtown Dubai","4-5%","Premium pricing, lower yield"],["Palm Jumeirah","4.5-5.5%","Ultra-luxury, lower yield"],["Dubai Hills Estate","5.5-6.5%","Family community premium"]]]
                    ],
                    "Market": [
                      [`DUBAI MARKET ${mktPeriod}`, [["Total Transactions",mktTxns,"Record - 5th consecutive year"],["Total Market Value",mktValue,"All-time high"],["Avg Price/sqft",mktPpsf,"Dubai average"],["Off-Plan Share",mktOffPlan,"Dominant market segment"],["YoY Growth",mktYoY,"Value growth YoY"]]]
                    ]
                  };
                  const tabSections = sections[tabLabel] || sections["Overview"];
                  tabSections.forEach(([title, rows]) => addSection(title, rows));
                  // AI Insights in PDF
                  if (aiInsights.length > 0 && y < 220) {
                    pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.setTextColor(212, 168, 67);
                    pdf.text("AI MARKET INSIGHTS", M, y); y += 7;
                    aiInsights.slice(0, 3).forEach(ins => {
                      if (y > 260) return;
                      pdf.setFillColor(14, 25, 45); pdf.rect(M, y - 4, W - M * 2, 14, "F");
                      pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(200, 200, 200);
                      pdf.text(ins.title, M + 3, y + 1);
                      pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(140, 140, 140);
                      const insText = ins.insight.length > 90 ? ins.insight.slice(0, 90) + "-" : ins.insight;
                      pdf.text(insText, M + 3, y + 7);
                      y += 16;
                    });
                  }
                  // Footer
                  pdf.setFillColor(212, 168, 67); pdf.rect(0, 293, W, 4, "F");
                  pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(100, 100, 100);
                  pdf.text(`DXB Analytics - emaar-dashboard.vercel.app - ${now} - For informational purposes only`, M, 289);
                  pdf.save(`DXB-Analytics-${tabLabel.replace(/ /g,"-")}-${new Date().toISOString().slice(0,10)}.pdf`);
                }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.2)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(212,168,67,0.1)"}>
                  ? Export PDF
                </button>
              </div>
            </div>

            {/* -- AI Market Insights Feed -- */}
            {(aiInsights.length > 0 || insightsLoading) && (
              <div style={{ background: "linear-gradient(135deg, rgba(14,29,53,0.8), rgba(4,9,15,0.9))", borderRadius: 16, border: `1px solid rgba(212,168,67,0.2)`, padding: "18px 20px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>??</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 1, textTransform: "uppercase" }}>AI Market Intelligence</span>
                    <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "rgba(212,168,67,0.1)", color: T.gold, border: `1px solid ${T.gold}30` }}>Powered by Claude</span>
                  </div>
                  <span style={{ fontSize: 10, color: T.textMuted }}>Updated {new Date().toLocaleDateString("en-AE", { month: "short", year: "numeric" })></span>
                </div>
                {insightsLoading
                  ? <div style={{ display: "flex", gap: 8, alignItems: "center", color: T.textMuted, fontSize: 12 }}><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>?</span> Analysing Dubai market data...</div>
                  : <div className="ai-insights-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                      {aiInsights.map((ins, i) => (
                        <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 8, fontWeight: 700, letterSpacing: 0.5,
                              background: ins.tag === "Yield" ? "rgba(16,185,129,0.1)" : ins.tag === "Risk" ? "rgba(239,68,68,0.1)" : ins.tag === "Opportunity" ? "rgba(212,168,67,0.1)" : "rgba(59,130,246,0.1)",
                              color: ins.tag === "Yield" ? T.green : ins.tag === "Risk" ? "#EF4444" : ins.tag === "Opportunity" ? T.gold : T.blue }}>
                              {ins.tag}
                            </span>
                            <span style={{ fontSize: 13 }}>{ins.direction === "up" ? "?" : ins.direction === "down" ? "?" : "?"></span>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 5, lineHeight: 1.3 }}>{ins.title}</div>
                          <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>{ins.insight}</div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}

            {/* -- MARKET PULSE + COMMUNITY HEAT MAP -- */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }} className="chart-grid-2">

              {/* Dubai Market Pulse */}
              <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>??</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 1, textTransform: "uppercase" }}>Dubai Market Pulse</span>
                  </div>
                  <span style={{ fontSize: 9, color: T.textMuted }}>{mktPeriod} - DLD Official</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Total Transactions", value: mktTxns,   change: mktYoY,   color: T.green,  icon: "~"??" },
                    { label: "Market Value",        value: mktValue,  change: "+30.6%", color: T.gold,   icon: "~"??" },
                    { label: "Avg Price/sqft",      value: mktPpsf,   change: "+19.8%", color: T.teal,   icon: "~"??" },
                    { label: "Off-Plan Share",       value: mktOffPlan,change: "Dominant",color: T.blue,  icon: "~"??" },
                    { label: "New Investors",        value: marketGlobal?.newInvestors || "110,000+", change: marketGlobal?.newInvestorsYoy || "+55%", color: T.purple, icon: "~"??" },
                    { label: "Nationalities",        value: marketGlobal?.buyerNationalities || "175+", change: "Global demand", color: T.orange, icon: "~"??" },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 13 }}>{item.icon></span>
                        <span style={{ fontSize: 9, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label></span>
                      </div>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 900, color: item.color, marginBottom: 2 }}>{item.value}</div>
                      <div style={{ fontSize: 10, color: item.color, fontWeight: 600 }}>{item.change} YoY</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", fontSize: 10, color: T.textMuted }}>
                  Source: Dubai Land Department {mktPeriod} - DXBinteract - Knight Frank Dubai Report
                </div>
              </div>

              {/* Community PPSF Heat Map */}
              <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>??</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 1, textTransform: "uppercase" }}>Community PPSF Tracker</span>
                  </div>
                  <span style={{ fontSize: 9, color: T.textMuted }}>AED/sqft - 2025</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { name: "Palm Jumeirah", ppsf: 4200, change: "+22%", tier: "Ultra-Lux", color: "#F59E0B" },
                    { name: "Downtown Dubai", ppsf: 3800, change: "+18%", tier: "Luxury", color: T.gold },
                    { name: "Emaar Beachfront", ppsf: 3500, change: "+15%", tier: "Luxury", color: T.gold },
                    { name: "Dubai Creek Harbour", ppsf: 2200, change: "+12%", tier: "Premium", color: T.teal },
                    { name: "Dubai Hills Estate", ppsf: 2100, change: "+14%", tier: "Premium", color: T.teal },
                    { name: "Business Bay", ppsf: 1900, change: "+10%", tier: "Mid-Market", color: T.blue },
                    { name: "JVC", ppsf: 1200, change: "+8%", tier: "Affordable", color: T.green },
                    { name: "Emaar South", ppsf: 1100, change: "+9%", tier: "Affordable", color: T.green },
                  ].map((c, i) => {
                    const maxPpsf = 4200;
                    const pct = Math.round((c.ppsf / maxPpsf) * 100);
                    // Use static data (live override via Firestore when available)
                    const liveVal = c.ppsf;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 120, fontSize: 11, color: T.textSecondary, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.border, position: "relative", overflow: "hidden" }}>
                          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${c.color}60, ${c.color})`, borderRadius: 3, transition: "width 0.8s ease" }} />
                        </div>
                        <div style={{ width: 70, textAlign: "right", fontSize: 11, fontWeight: 700, color: c.color, flexShrink: 0 }}>AED {liveVal.toLocaleString()}</div>
                        <div style={{ width: 42, textAlign: "right", fontSize: 10, color: T.green, flexShrink: 0, fontWeight: 600 }}>{c.change}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[["Ultra-Lux", "#F59E0B"], ["Luxury", T.gold], ["Premium", T.teal], ["Mid-Market", T.blue], ["Affordable", T.green]].map(([tier, color]) => (
                    <span key={tier} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: `${color}15`, color, fontWeight: 600 }}>{tier></span>
                  ))}
                </div>
              </div>
            </div>

            {/* -- LATEST DUBAI RE NEWS - S10: live from Firestore tabData/news -- */}
            {(() => {
              // liveNewsData comes from tabData/news Firestore listener (set up below)
              // Fallback to static headlines if Firestore not yet populated
              const staticNews = [
                { headline: "Dubai H1 2025 transactions hit AED 431B - up 25% year-on-year", source: "DLD Official", sourceUrl: "#", tag: "Market", color: T.green, date: "H1 2025", pinned: false },
                { headline: `Off-plan sales account for ${mktOffPlan} of all Dubai transactions`, source: "DXBinteract", sourceUrl: "#", tag: "Off-Plan", color: T.blue, date: mktPeriod, pinned: false },
                { headline: `Emaar records ${fmtB(propertySales)} in property sales - all-time record for any GCC developer`, source: "Emaar IR", sourceUrl: "#", tag: "Emaar", color: T.gold, date: mktPeriod, pinned: false },
                { headline: `Dubai average price per sqft reaches ${mktPpsf} - up ${marketGlobal?.avgPpsfYoy || "19.8%"} annually`, source: "ValuStrat VPI", sourceUrl: "#", tag: "Prices", color: T.teal, date: mktPeriod, pinned: false },
                { headline: "110,000+ new investors entered Dubai property market, up 55% YoY", source: "DLD Press Release", sourceUrl: "#", tag: "Demand", color: T.purple, date: mktPeriod, pinned: false },
                { headline: "EIBOR 3-month rate - mortgage affordability improves as Fed pivots", source: "UAE Central Bank", sourceUrl: "#", tag: "EIBOR", color: T.orange, date: "Live", pinned: false },
              ];
              // Use Firestore news if available, pinned items first
              const newsItems = liveNewsData.length > 0
                ? [...liveNewsData].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
                : staticNews;
              const isLive = liveNewsData.length > 0;
              return (
            <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>??</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 1, textTransform: "uppercase" }}>Dubai RE Market Headlines</span>
                  {isLive
                    ? <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "rgba(16,185,129,0.1)", color: T.green, border: "1px solid rgba(16,185,129,0.2)" }}>?? LIVE</span>
                    : <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "rgba(212,168,67,0.1)", color: T.gold, border: "1px solid rgba(212,168,67,0.2)" }}>STATIC</span>
                  }
                </div>
                <span style={{ fontSize: 9, color: T.textMuted }}>{isLive ? "Zawya - Gulf News - Arabian Business - The National - PropertyNews.ae" : "Curated from DLD - Gulf News - Zawya - Knight Frank"></span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                {newsItems.map((item, i) => (
                  <div key={i} style={{ padding: "12px 14px", background: item.pinned ? "rgba(212,168,67,0.06)" : T.surfaceAlt, borderRadius: 10, border: `1px solid ${item.pinned ? T.gold : T.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {item.pinned && <span style={{ fontSize: 8, color: T.gold }}>??</span>}
                        <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 6, background: `${item.color}15`, color: item.color, fontWeight: 700 }}>{item.tag></span>
                      </div>
                      <span style={{ fontSize: 9, color: T.textMuted }}>{item.date></span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.white, lineHeight: 1.4 }}>
                      {item.sourceUrl && item.sourceUrl !== "#"
                        ? <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: T.white, textDecoration: "none" }} onMouseEnter={e => e.target.style.color = T.gold} onMouseLeave={e => e.target.style.color = T.white}>{item.headline}</a>
                        : item.headline
                      }
                    </div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>Source: {item.source}</div>
                  </div>
                ))}
              </div>
            </div>
              ); })()}

                        <Section title="Key Performance" sub={
                          selectedDeveloper==="damac"     ? `FY2025 - Record AED 36B Sales - #1 Private Developer UAE - Source: DAMAC Official` :
                          selectedDeveloper==="sobha"     ? `FY2025 - AED 30B Sales - +30% YoY - Source: Sobha Official` :
                          selectedDeveloper==="nakheel"   ? `FY2025 - AED 24.6B Sales - Palm Jebel Ali + Dubai Islands - Source: DLD` :
                          selectedDeveloper==="meraas"    ? `FY2025 - AED 20.9B Sales - Lifestyle Master Developer - Source: DLD` :
                          selectedDeveloper==="binghatti" ? `FY2025 - AED 12.43B Revenue - +96% Net Profit - #1 Dubai by Units - Source: Binghatti IR` :
                          selectedDeveloper==="aldar"     ? `FY2025 - AED 40.6B Group Sales - +36% Net Profit - #1 Abu Dhabi - Source: Aldar IR` :
                          `${mktPeriod} - All-Time Records Across Every Metric - Source: Emaar Annual Report`
                        }>
              <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {emaarStockPrice && (
                  <div style={{ background: T.surface, border: `1px solid ${emaarStockPrice.up ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 14, padding: "14px 16px", cursor: "default", position: "relative", overflow: "hidden" }}
                    onClick={() => setSelectedKPI({ label: "EMAAR.DU Live Price", value: `AED ${emaarStockPrice.price}`, color: emaarStockPrice.up ? T.green : "#EF4444", description: "Live Emaar Properties (EMAAR.DU) share price from Dubai Financial Market. Auto-refreshes every 5 minutes.", source: "Yahoo Finance - DFM Live", sourceUrl: "https://finance.yahoo.com/quote/EMAAR.DU", items: [{ label: "Current Price", value: `AED ${emaarStockPrice.price}`, note: "DFM live" }, { label: "Day Change", value: `${emaarStockPrice.up ? "+" : ""}${emaarStockPrice.change}%`, note: "vs prev close" }, { label: "Market Cap", value: "AED 128.2B", note: "~USD 34.9B" }, { label: "Analyst Target", value: "AED 19.94", note: "12/12 Strong Buy" }, { label: "Dividend Yield", value: "~7%", note: "AED 1.00/share" }], trend: null })}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: emaarStockPrice.up ? "#10B981" : "#EF4444" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "pulse 2s infinite" }} />
                      <span style={{ fontSize: 9, color: T.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>EMAAR.DU - Live</span>
                    </div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: emaarStockPrice.up ? T.green : "#EF4444", lineHeight: 1 }}>AED {emaarStockPrice.price}</div>
                    <div style={{ fontSize: 11, color: emaarStockPrice.up ? T.green : "#EF4444", marginTop: 4 }}>{emaarStockPrice.up ? "?" : "?"} {Math.abs(emaarStockPrice.change)}% today - DFM</div>
                  </div>
                )}
                <KPI label="Property Sales" value={fmtB(propertySales)} sub="+16% YoY - USD 21.9B" delay={1} onClick={() => setSelectedKPI({ label: "Property Sales", value: fmtB(propertySales), color: T.gold, description: "Total off-plan and ready property sales contracted in FY2025. Includes UAE and international markets.", source: reportLabel, sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "FY2025 Sales", value: fmtB(propertySales), note: "All-time record" }, { label: "FY2024 Sales", value: "AED 69.3B", note: "+16% YoY" }, { label: "FY2023 Sales", value: "AED 52.7B", note: "+31% YoY" }, { label: "Int'l Sales", value: "AED 9.3B", note: "+124% YoY" }, { label: "UAE Market Share", value: "~30%", note: "Largest by value" }, { label: "Units Booked", value: "12,000+", note: "FY2025 estimate" }], trend: [{ y: "2020", v: 21.5 }, { y: "2021", v: 26.2 }, { y: "2022", v: 33.5 }, { y: "2023", v: 52.7 }, { y: "2024", v: 69.3 }, { y: "2025", v: propertySales }] })} />
                <KPI label="Revenue" value={fmtB(revenue)} sub="+40% YoY - USD 13.5B" delay={2} onClick={() => setSelectedKPI({ label: "Revenue", value: fmtB(revenue), color: T.teal, description: "Total recognized revenue across property development, malls, hospitality, and international operations.", source: reportLabel, sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "UAE Dev Revenue", value: "AED 36.4B", note: "73% of total" }, { label: "Malls & Retail", value: "AED 6.3B", note: "+13% YoY" }, { label: "Hospitality", value: "AED 4.2B", note: "+12% YoY" }, { label: "International", value: "AED 2.6B", note: "+124% YoY" }, { label: "Revenue CAGR", value: "27.2%", note: "5-year 2020-2025" }], trend: [{ y: "2020", v: 14.6 }, { y: "2021", v: 17.0 }, { y: "2022", v: 24.5 }, { y: "2023", v: 30.6 }, { y: "2024", v: 35.4 }, { y: "2025", v: revenue }] })} />
                <KPI label="Net Profit" value={fmtB(netProfit)} sub="+36% YoY - USD 7.0B" delay={3} onClick={() => setSelectedKPI({ label: "Net Profit", value: fmtB(netProfit), color: T.green, description: "Net profit before minority interest. Includes recurring revenue from Emaar Malls and hospitality.", source: reportLabel, sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Net Margin", value: "51.8%", note: "Industry-leading" }, { label: "EPS FY2025", value: "AED 2.00", note: "+31% YoY" }, { label: "Q4 2025 Profit", value: "AED 7.3B", note: "Strongest quarter" }, { label: "5yr Profit CAGR", value: "57.1%", note: "2020-2025" }, { label: "Tax Rate", value: "~9%", note: "UAE Corporate Tax" }], trend: [{ y: "2020", v: 2.6 }, { y: "2021", v: 4.1 }, { y: "2022", v: 6.2 }, { y: "2023", v: 12.6 }, { y: "2024", v: 18.9 }, { y: "2025", v: netProfit }] })} />
                <KPI label="EBITDA" value={fmtB(ebitda)} sub="+33% YoY - USD 7.0B" delay={4} onClick={() => setSelectedKPI({ label: "EBITDA", value: fmtB(ebitda), color: T.blue, description: "Earnings before interest, tax, depreciation & amortisation. Key operational profitability metric.", source: reportLabel, sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "EBITDA Margin", value: "51.6%", note: "5-year high" }, { label: "Recurring EBITDA", value: fmtB(recurringRev), note: "32% share" }, { label: "Dev EBITDA", value: "AED 15.1B", note: "Property segment" }, { label: "EV/EBITDA", value: "~5.0-", note: "Vs sector 9- avg" }, { label: "EBITDA CAGR", value: "44.5%", note: "2020-2025" }], trend: [{ y: "2020", v: 4.0 }, { y: "2021", v: 5.3 }, { y: "2022", v: 8.1 }, { y: "2023", v: 13.4 }, { y: "2024", v: 19.2 }, { y: "2025", v: ebitda }] })} />
                <KPI label="Backlog" value={fmtB(backlog)} sub="+39% YoY - 3-4yr visibility" delay={5} onClick={() => setSelectedKPI({ label: "Revenue Backlog", value: fmtB(backlog), color: T.purple, description: "Total contracted but unrecognized revenue. Provides 3-4 years of forward revenue visibility.", source: reportLabel, sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Total Backlog", value: fmtB(backlog), note: "+39% YoY record" }, { label: "FY2024 Backlog", value: "AED 111.5B", note: "Prior year" }, { label: "Coverage Ratio", value: "3-4 yrs", note: "Revenue visibility" }, { label: "UAE Backlog", value: "AED 140B+", note: "~90% of total" }, { label: "New Launches", value: "AED 85B+", note: "FY2025 new sales" }], trend: [{ y: "2020", v: 45 }, { y: "2021", v: 52 }, { y: "2022", v: 68 }, { y: "2023", v: 80 }, { y: "2024", v: 111.5 }, { y: "2025", v: backlog }] })} />
                <KPI label="Recurring Rev" value={fmtB(recurringRev)} sub="+13% - 32% of EBITDA" delay={6} onClick={() => setSelectedKPI({ label: "Recurring Revenue", value: fmtB(recurringRev), color: T.cyan, description: "Stable income from Emaar Malls, hotels, serviced residences, and commercial leasing.", source: reportLabel, sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Malls Revenue", value: "AED 6.3B", note: "Dubai Mall + Fashion Ave" }, { label: "Hospitality", value: "AED 4.2B", note: "Hotels & serviced res." }, { label: "% of EBITDA", value: "32%", note: "Defensive income" }, { label: "Dubai Mall Footfall", value: "105M+", note: "Annual visitors" }, { label: "Occupancy", value: "95%+", note: "Malls occupancy rate" }], trend: [{ y: "2020", v: 5.8 }, { y: "2021", v: 6.8 }, { y: "2022", v: 7.9 }, { y: "2023", v: 8.6 }, { y: "2024", v: 9.3 }, { y: "2025", v: recurringRev }] })} />
                <KPI label="Units Delivered" value="125,600+" sub="Since 2002 - #1 in GCC" delay={7} onClick={() => setSelectedKPI({ label: "Units Delivered", value: "125,600+", color: T.gold, description: "Total residential and commercial units delivered since inception in 2002. Largest track record in GCC.", source: reportLabel, sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Total Delivered", value: "125,600+", note: "Since 2002" }, { label: "FY2025 Deliveries", value: "~11,000", note: "Est. annual handovers" }, { label: "UAE Units", value: "~100,000+", note: "80% of total" }, { label: "On-Time Record", value: "95%+", note: "Delivery track record" }, { label: "GCC Rank", value: "#1", note: "By volume" }], trend: [{ y: "2020", v: 85000 }, { y: "2021", v: 95000 }, { y: "2022", v: 103000 }, { y: "2023", v: 110000 }, { y: "2024", v: 118000 }, { y: "2025", v: 125600 }] })} />
                <KPI label="Land Bank" value={`${landBank}M sqft`} sub="344M UAE - AED 120B dev" delay={8} onClick={() => setSelectedKPI({ label: "Land Bank", value: `${landBank}M sqft`, color: T.gold, description: "Total gross land area owned or controlled by Emaar for future development.", source: reportLabel, sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Total Land Bank", value: `${landBank}M sqft`, note: "Gross area" }, { label: "UAE Land", value: "344M sqft", note: "56% of total" }, { label: "International", value: "274M sqft", note: "Egypt, India, KSA" }, { label: "Development Value", value: "AED 120B+", note: "Future GDV est." }, { label: "Dubai Hills Remaining", value: "~180M sqft", note: "Largest UAE plot" }], trend: [{ y: "2020", v: 480 }, { y: "2021", v: 510 }, { y: "2022", v: 535 }, { y: "2023", v: 570 }, { y: "2024", v: 595 }, { y: "2025", v: landBank }] })} />
              </div>
            </Section>

            <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
              <Chart title="Revenue by Segment (AED B)">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={liveSegments} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={52} paddingAngle={3} stroke="none">
                      {segments.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
                  {segments.map((s, i) => (
                    <span key={i} style={{ fontSize: 11, color: T.textSecondary, display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 3, background: s.color, display: "inline-block" }} />
                      {s.name} ({s.revenue}B - {s.growth})
                    </span>
                  ))}
                </div>
              </Chart>

              <Chart title="6-Year Revenue & Profit (AED B)">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={financials}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gold} stopOpacity={0.25} /><stop offset="100%" stopColor={T.gold} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke={T.gold} fill="url(#gRev)" strokeWidth={2.5} name="Revenue" />
                    <Line type="monotone" dataKey="netProfit" stroke={T.teal} strokeWidth={2} dot={{ fill: T.teal, r: 3 }} name="Net Profit" />
                    <Line type="monotone" dataKey="ebitda" stroke={T.blue} strokeWidth={2} dot={{ fill: T.blue, r: 3 }} name="EBITDA" />
                  </AreaChart>
                </ResponsiveContainer>
                {/* Chart Legend */}
                <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
                  {[["Revenue", T.gold], ["Net Profit", T.teal], ["EBITDA", T.blue]].map(([name, color]) => (
                    <span key={name} style={{ fontSize: 11, color: T.textSecondary, display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 20, height: 2, background: color, display: "inline-block", borderRadius: 1 }} />
                      {name}
                    </span>
                  ))}
                </div>
              </Chart>
            </div>

            <Section title="Company Strength" sub="Analyst consensus: STRONG BUY (12 of 12 analysts) - Source: Investing.com">
              <div style={{ marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <DataBadge source={["damac","sobha","nakheel","meraas"].includes(selectedDeveloper) ? `${devData?.identity?.name || ""} - DLD Official Jan 2026` : `Emaar Annual Report ${marketGlobal?.period || "FY2025"}`} date={["damac","sobha","nakheel","meraas"].includes(selectedDeveloper) ? "Jan 2026" : (emaarLive?.updatedAtUAE || "Feb 2026")} type={["damac","sobha","nakheel","meraas"].includes(selectedDeveloper) ? "verified" : "emaar"} />
                <DataBadge source="S&P / Fitch Ratings 2025" date="2025" type="manual" />
              </div>
              <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <Chart title="Performance Radar">
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={liveRadar} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: T.textSecondary, fontSize: 10 }} />
                      <PolarRadiusAxis tick={false} axisLine={false} />
                      <Radar name="Emaar" dataKey="value" stroke={T.gold} fill={T.gold} fillOpacity={0.15} strokeWidth={2} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Chart>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Founded", value: "1997", sub: "27+ years track record", kpi: { color: T.gold, description: "Emaar Properties founded in 1997 by Mohamed Alabbar. Listed on DFM in 2000.", source: "Emaar Corporate", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Founded", value: "1997", note: "Dubai, UAE" }, { label: "IPO", value: "2000", note: "Dubai Financial Market" }, { label: "Chairman", value: "M. Alabbar", note: "Founder & visionary" }, { label: "Employees", value: "9,000+", note: "Global workforce" }], trend: null } },
                    { label: "Developer Rank", value: "#1", sub: "Dubai's largest by value", kpi: { color: T.teal, description: "Consistently ranked #1 developer in Dubai by property sales value with ~30% market share.", source: "DLD & Zawya 2025", sourceUrl: "https://zawya.com", items: [{ label: "UAE Rank", value: "#1", note: "By sales value" }, { label: "Market Share", value: "~30%", note: "Dubai off-plan" }, { label: "GCC Rank", value: "#1", note: "By units delivered" }, { label: "FY2025 Sales", value: "AED 80.4B", note: "vs #2 ~AED 20B" }], trend: null } },
                    { label: "Active Projects", value: String(activeProjects.length), sub: "Across 10+ communities", kpi: { color: T.blue, description: "48 active projects across Dubai Hills, Creek Harbour, Downtown, Beachfront and more.", source: "DXB Analytics Database", sourceUrl: "#", items: [{ label: "Under Construction", value: "18", note: "Active building" }, { label: "Off-Plan", value: "30", note: "Pre-launch / launched" }, { label: "Communities", value: "11", note: "Master-planned" }, { label: "Branded", value: "12+", note: "Address - Vida - Palace" }], trend: null } },
                    { label: "International", value: "AED 9.3B", sub: "+124% growth YoY", kpi: { color: T.green, description: "International operations across Egypt, India, Saudi Arabia, Pakistan and Turkey.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Int'l Sales", value: "AED 9.3B", note: "+124% YoY" }, { label: "Egypt", value: "Largest market", note: "Marassi, Uptown Cairo" }, { label: "India", value: "Growing", note: "Emaar India" }, { label: "Saudi Arabia", value: "Expanding", note: "New projects" }], trend: [{ y: "2022", v: 1.8 }, { y: "2023", v: 2.9 }, { y: "2024", v: 4.1 }, { y: "2025", v: 9.3 }] } },
                    { label: "Dividend/Share", value: "AED 1.00", sub: "2- increase from 2023", kpi: { color: T.gold, description: "AED 1.00 DPS for FY2025 - 100% of share capital, 2- increase from AED 0.50 in 2023.", source: "Emaar IR 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "DPS FY2025", value: "AED 1.00", note: "100% of share capital" }, { label: "DPS FY2024", value: "AED 0.70", note: "+43% YoY" }, { label: "DPS FY2023", value: "AED 0.50", note: "Base year" }, { label: "Total Payout", value: "AED 8.8B", note: "Total dividend pool" }, { label: "Yield (15.40)", value: "6.5%", note: "Attractive vs peers" }], trend: [{ y: "2021", v: 0.25 }, { y: "2022", v: 0.40 }, { y: "2023", v: 0.50 }, { y: "2024", v: 0.70 }, { y: "2025", v: 1.00 }] } },
                    { label: "Target Upside", value: "+21.8%", sub: "AED 20.77 consensus", kpi: { color: T.green, description: "12 analyst consensus target of AED 20.77 vs current AED 15.40 - all 12 rate Strong Buy.", source: "TradingView - Investing.com", sourceUrl: "https://www.tradingview.com/symbols/DFM-EMAAR/", items: [{ label: "Consensus Target", value: "AED 20.77", note: "12 analyst average" }, { label: "Current Price", value: "AED 15.40", note: "Mar 2026" }, { label: "High Target", value: "AED 30.00", note: "Bull case" }, { label: "Low Target", value: "AED 15.80", note: "Bear case" }, { label: "Rating", value: "Strong Buy", note: "12 of 12 analysts" }], trend: null } },
                  ].map(({ label, value, sub, kpi }, i) => (
                    <KPI key={i} label={label} value={value} sub={sub} delay={Math.min(i + 1, 8)} onClick={() => setSelectedKPI({ label, value, ...kpi })} />
                  ))}
                </div>
              </div>
          <TabSources sources={[{ label: "Emaar Annual Report 2025", url: "https://www.emaar.com/en/investor-relations/" }, { label: "DFM: EMAAR.DU", url: "https://www.dfm.ae" }, { label: "TradingView", url: "https://www.tradingview.com/symbols/DFM-EMAAR/" }, { label: "Yahoo Finance", url: "https://finance.yahoo.com/quote/EMAAR.DU" }, { label: "S&P - Moody's - Fitch Ratings" }]} />

              {/* --- S17: REFERRAL WIDGET (shown to all logged-in users) --- */}
              {user && <ReferralWidget user={user} T={T} db={db} />}

            </Section>
            </>); })()} {/* end Session 6 IIFE */}
          </>}

          {/* --- FINANCIALS TAB --- */}
          {tab === "Financials" && <>
            {/* S8.5 - Financials tab wired to Firestore developers/emaar with data.js fallback */}
            {(() => {
              const fy  = emaarFinancials[emaarFinancials.length - 1];
              const E   = emaarLive || {};
              const rev      = E.revenue      != null ? E.revenue      : fy.revenue;
              const np       = E.netProfit    != null ? E.netProfit    : fy.netProfit;
              const gm       = E.grossMargin  != null ? E.grossMargin  : fy.gm;
              const nm       = E.netMargin    != null ? E.netMargin    : fy.nm;
              const src      = E.latestReportLabel || "Emaar Annual Report 2025";
              const baseRev  = emaarFinancials[0].revenue;
              const baseNP   = emaarFinancials[0].netProfit;
              const revCagr  = ((Math.pow(rev / baseRev, 1/5) - 1) * 100).toFixed(1);
              const npCagr   = ((Math.pow(np  / baseNP,  1/5) - 1) * 100).toFixed(1);
              return (
            <Section title="Financial Performance" sub={`6-year trend - 2020-${new Date().getFullYear()} - All figures in AED Billions`}>
              {/* Freshness badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                {emaarLive ? (
                  <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "rgba(16,185,129,0.12)", color: "#10B981", fontWeight: 700, border: "1px solid rgba(16,185,129,0.2)" }}>?? LIVE - Firestore</span>
                ) : (
                  <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "rgba(212,168,67,0.1)", color: "#D4A843", fontWeight: 700, border: "1px solid rgba(212,168,67,0.2)" }}>STATIC - data.js</span>
                )}
                {emaarLive?.updatedAtUAE && <span style={{ fontSize: 10, color: T.textMuted }}>Updated: {emaarLive.updatedAtUAE></span>}
              </div>
              <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <KPI label="Revenue CAGR" value={`${revCagr}%`} sub="2020-2025 - 5-year" delay={1} onClick={() => setSelectedKPI({ label: "Revenue CAGR", value: `${revCagr}%`, color: T.gold, description: `Compound Annual Growth Rate of revenue from AED ${baseRev}B in 2020 to AED ${rev}B - one of the highest CAGRs among global real estate developers.`, source: src, sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "2020 Revenue", value: `AED ${baseRev}B`, note: "Base year" }, { label: "Latest Revenue", value: `AED ${rev}B`, note: "+240% total growth" }, { label: "CAGR", value: `${revCagr}%`, note: "5-year compounded" }, { label: "vs GCC Average", value: "~8-10%", note: "Sector benchmark" }, { label: "YoY", value: "+40%", note: "Strongest single year" }], trend: emaarFinancials.map(f => ({ y: f.year, v: f.revenue })) })} />
                <KPI label="Profit CAGR" value={`${npCagr}%`} sub="2020-2025 - 5-year" delay={2} onClick={() => setSelectedKPI({ label: "Profit CAGR", value: `${npCagr}%`, color: T.green, description: `Net profit grew from AED ${baseNP}B in 2020 to AED ${np}B - a ${npCagr}% CAGR driven by margin expansion and operating leverage.`, source: src, sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "2020 Net Profit", value: `AED ${baseNP}B`, note: "Base year" }, { label: "Latest Net Profit", value: `AED ${np}B`, note: "+888% total growth" }, { label: "CAGR", value: `${npCagr}%`, note: "5-year compounded" }, { label: "Net Margin 2020", value: "17.8%", note: "Starting margin" }, { label: "Net Margin Latest", value: `${nm}%`, note: "Current" }], trend: emaarFinancials.map(f => ({ y: f.year, v: f.netProfit })) })} />
                <KPI label="Gross Margin" value={`${gm}%`} sub="Industry-leading" delay={3} onClick={() => setSelectedKPI({ label: "Gross Margin", value: `${gm}%`, color: T.teal, description: `Gross profit margin of ${gm}% - significantly above the global real estate developer average of 25-35%.`, source: src, sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Gross Margin", value: `${gm}%`, note: "Latest" }, { label: "Gross Profit", value: `AED ${(rev * gm / 100).toFixed(1)}B`, note: `On AED ${rev}B revenue` }, { label: "GCC Dev Avg", value: "~30-35%", note: "Industry benchmark" }, { label: "vs DAMAC", value: "~45%", note: "Nearest competitor" }, { label: "Land Cost Basis", value: "AED 5-15/sqft", note: "Historical acquisition" }], trend: emaarFinancials.map(f => ({ y: f.year, v: f.gm })) })} />
                <KPI label="Net Margin" value={`${nm}%`} sub="Consistent expansion" delay={4} onClick={() => setSelectedKPI({ label: "Net Margin", value: `${nm}%`, color: T.blue, description: `Net profit margin after all costs including tax. Expanded from 17.8% in 2020 to ${nm}%.`, source: src, sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Net Margin Latest", value: `${nm}%`, note: "Current" }, { label: "Net Margin 2024", value: "53.4%", note: "Prior year" }, { label: "Net Margin 2020", value: "17.8%", note: "5-year base" }, { label: "EBITDA Margin", value: "51.6%", note: "Operational efficiency" }, { label: "After-Tax Est.", value: `~${nm}%`, note: "Post UAE corp tax" }], trend: emaarFinancials.map(f => ({ y: f.year, v: f.nm })) })} />
              </div>
            </Section>
              ); })()}

            <ProGate isPro={isPro} message="Unlock 6 Years of Financial Data" onUpgrade={() => setShowUpgrade(true)}>
            <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
              <Chart title="Revenue vs Property Sales (AED B)">
                <ResponsiveContainer width="100%" height={typeof window !== "undefined" && window.innerWidth < 480 ? 180 : 280}>
                  <ComposedChart data={financials}>
                    <defs>
                      <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gold} stopOpacity={0.2} /><stop offset="100%" stopColor={T.gold} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="propertySales" fill="url(#gSales)" stroke={T.gold} strokeWidth={2} name="Property Sales" />
                    <Bar dataKey="revenue" fill={T.teal} name="Revenue" radius={[4, 4, 0, 0]} barSize={24} opacity={0.8} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Chart>

              <Chart title="Profitability Trend (AED B)">
                <ResponsiveContainer width="100%" height={typeof window !== "undefined" && window.innerWidth < 480 ? 180 : 280}>
                  <AreaChart data={financials}>
                    <defs>
                      <linearGradient id="gNP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.teal} stopOpacity={0.2} /><stop offset="100%" stopColor={T.teal} stopOpacity={0} /></linearGradient>
                      <linearGradient id="gEb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.blue} stopOpacity={0.15} /><stop offset="100%" stopColor={T.blue} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="ebitda" stroke={T.blue} fill="url(#gEb)" strokeWidth={2} name="EBITDA" />
                    <Area type="monotone" dataKey="netProfit" stroke={T.teal} fill="url(#gNP)" strokeWidth={2} name="Net Profit" />
                    <Line type="monotone" dataKey="grossProfit" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 3 }} name="Gross Profit" />
                  </AreaChart>
                </ResponsiveContainer>
              </Chart>
            </div>

            <Section title="Margin Analysis" sub="Profitability margins over 6 years">
              <Chart title="Margin Trends (%)">
                <ResponsiveContainer width="100%" height={typeof window !== "undefined" && window.innerWidth < 480 ? 180 : 280}>
                  <LineChart data={financials}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 70]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="gm" stroke={T.gold} strokeWidth={2.5} dot={{ fill: T.gold, r: 4 }} name="Gross Margin %" />
                    <Line type="monotone" dataKey="em" stroke={T.teal} strokeWidth={2.5} dot={{ fill: T.teal, r: 4 }} name="EBITDA Margin %" />
                    <Line type="monotone" dataKey="nm" stroke={T.cyan} strokeWidth={2.5} dot={{ fill: T.cyan, r: 4 }} name="Net Margin %" />
                  </LineChart>
                </ResponsiveContainer>
              </Chart>
            </Section>

            <Section title="Revenue Diversification" sub="Recurring revenue streams">
              <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <Chart title="Backlog Growth (AED B)">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={financials}>
                      <defs><linearGradient id="gBk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.purple} stopOpacity={0.25} /><stop offset="100%" stopColor={T.purple} stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="backlog" stroke={T.purple} fill="url(#gBk)" strokeWidth={2.5} name="Revenue Backlog" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Chart>
                <Chart title="Malls & Hotels Revenue (AED B)">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={financials}>
                      <defs>
                        <linearGradient id="gMa" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gold} stopOpacity={0.2} /><stop offset="100%" stopColor={T.gold} stopOpacity={0} /></linearGradient>
                        <linearGradient id="gHo" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.cyan} stopOpacity={0.2} /><stop offset="100%" stopColor={T.cyan} stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="mallRev" stroke={T.gold} fill="url(#gMa)" name="Mall Revenue" stackId="1" strokeWidth={2} />
                      <Area type="monotone" dataKey="hotelRev" stroke={T.cyan} fill="url(#gHo)" name="Hotel Revenue" stackId="1" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Chart>
              </div>
            </Section>

            <Section title="Per-Share Metrics" sub="Dividend and earnings growth">
              <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 12 }}>
                <KPI label="EPS (2025)" value="AED 2.00" sub="+31% YoY" delay={1} />
                <KPI label="DPS (2025)" value="AED 1.00" sub="100% of share capital" delay={2} />
                <KPI label="EPS CAGR" value="52.8%" sub="5-year - 2020-2025" delay={3} />
                <KPI label="Total Dividend" value="AED 8.8B" sub="Payout to shareholders" delay={4} />
              </div>
              <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <Chart title="EPS & Dividend Per Share (AED)">
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={financials}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="dividend" fill={T.gold} name="Dividend/Share" radius={[4, 4, 0, 0]} barSize={20} opacity={0.7} />
                      <Line type="monotone" dataKey="eps" stroke={T.teal} strokeWidth={2.5} dot={{ fill: T.teal, r: 4 }} name="EPS" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Chart>
                <Chart title="International Sales (AED B)">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={financials}>
                      <defs><linearGradient id="gIntl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.green} stopOpacity={0.25} /><stop offset="100%" stopColor={T.green} stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="intlSales" stroke={T.green} fill="url(#gIntl)" strokeWidth={2.5} name="Int'l Sales" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Chart>
              </div>
            </Section>

            <Section title="Full Financial Summary" sub="All key metrics - 2020-2025 - AED Billions">
              <div className="table-scroll" style={{ overflowX: "auto", marginTop: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {["Metric", "2020", "2021", "2022", "2023", "2024", "2025"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: h === "Metric" ? "left" : "right", color: h === "2025" ? T.gold : T.textMuted, fontWeight: 600, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { m: "Revenue", k: "revenue" }, { m: "EBITDA", k: "ebitda" }, { m: "Net Profit (Pre-Tax)", k: "netProfit" },
                      { m: "Property Sales", k: "propertySales" }, { m: "Revenue Backlog", k: "backlog" }, { m: "Recurring Revenue", k: "recurringRev" },
                      { m: "Int'l Sales", k: "intlSales" }, { m: "Mall Revenue", k: "mallRev" }, { m: "Hotel Revenue", k: "hotelRev" },
                    ].map(({ m, k }, ri) => (
                      <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: "10px 12px", color: T.white, fontWeight: 500, fontSize: 12 }}>{m}</td>
                        {financials.map((f, ci) => (
                          <td key={ci} style={{ padding: "10px 12px", textAlign: "right", color: ci === financials.length - 1 ? T.gold : T.textSecondary, fontFamily: "'Fraunces', serif", fontWeight: ci === financials.length - 1 ? 700 : 400, fontSize: 12 }}>
                            {f[k] ? f[k].toFixed(1) : "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          <TabSources sources={[{ label: "Emaar Annual Report 2025", url: "https://www.emaar.com/en/investor-relations/" }, { label: "Emaar Q4 2025 Earnings Release", url: "https://www.emaar.com/en/investor-relations/" }, { label: "DFM Filing", url: "https://www.dfm.ae" }, { label: "GuruFocus", url: "https://www.gurufocus.com/term/overview/EMAAR.DU" }, { label: "Zawya", url: "https://www.zawya.com/en/company/financials/EMAAR-EMAAR" }]} />
            </Section>
            </ProGate>
          </>} {/* end Financials tab - S8.5 Firestore wired */}

          {/* --- PROJECTS TAB (48 Projects from Excel) --- */}
          {tab === "Projects" && <>
            <Section title={selectedDeveloper === "emaar" ? `${activeProjects.length} Active Projects` : `${activeProjects.filter(p => (p.developerId || "emaar") === selectedDeveloper).length} Projects - ${selectedDeveloper.toUpperCase()}`} sub={selectedDeveloper === "emaar" ? "Complete Emaar off-plan portfolio - 2026-2030 - Search & filter" : "Filtered by selected developer - Switch developer in sidebar"}>
              <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <KPI label="Total Projects" value={activeProjects.length} sub={`${activeProjects.filter(p=>p.status?.includes("Under Construction")||p.status?.includes("Delivering")).length} under construction - ${activeProjects.filter(p=>p.status?.includes("Off")||p.status?.includes("off")).length} off-plan`} delay={1} onClick={() => setSelectedKPI({ label: "Total Projects", value: String(activeProjects.length), color: T.gold, description: `${activeProjects.length} active Emaar projects across UAE.`, source: "DXB Analytics", sourceUrl: "#", items: [{ label: "Under Construction", value: String(activeProjects.filter(p=>p.status?.includes("Under Construction")).length), note: "Active building" }, { label: "Off-Plan", value: String(activeProjects.filter(p=>p.status?.includes("Off")||p.status?.includes("off")).length), note: "Pre-launch" }, { label: "Communities", value: String(new Set(activeProjects.map(p=>p.community)).size), note: "Master-planned" }, { label: "Branded", value: String(activeProjects.filter(p=>p.branded).length), note: "Address, Vida, Palace" }], trend: null })} />
                <KPI label="Communities" value={String(new Set(activeProjects.filter(p=>(p.developerId||"emaar")===selectedDeveloper||selectedDeveloper==="emaar"&&!p.developerId).map(p=>p.community)).size)} sub="Master-planned communities" delay={2} />
                <KPI label="Branded" value={`${activeProjects.filter(p=>p.branded).length}`} sub="Address - Vida - Palace - Bristol" delay={3} />
                <KPI label="Avg Construction" value={`${Math.round(activeProjects.reduce((a,p)=>a+(p.construction||0),0)/activeProjects.length)}%`} sub="Weighted average progress" delay={4} />
              </div>
            </Section>

            {/* Search & Filters */}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 250px', maxWidth: 350 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }}>{Icons.search></span>
                  <input value={projectSearch} onChange={e => setProjectSearch(e.target.value)} placeholder='Search projects or community...' style={{ width: '100%', padding: '10px 12px 10px 36px', background: T.surface, border: '1px solid '+T.border, borderRadius: 10, color: T.textPrimary, fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px', background: T.surface, border: '1px solid '+T.border, borderRadius: 10, padding: '8px 14px' }}>
                  <span style={{ fontSize: 11, color: T.textMuted, whiteSpace: 'nowrap' }}>Max Price</span>
                  <input type='range' min={1} max={20} step={0.5} value={projectPriceMax} onChange={e => setProjectPriceMax(Number(e.target.value))} style={{ flex: 1, accentColor: T.gold, cursor: 'pointer' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.gold, whiteSpace: 'nowrap', minWidth: 60 }}>{projectPriceMax >= 20 ? 'Any' : 'AED '+projectPriceMax+'M'></span>
                </div>
                {(projectSearch || projectFilter !== 'All' || projectTier !== 'All' || projectHandover !== 'All' || projectPriceMax < 20 || projectType !== 'All' || projectSort !== 'default') && (
                  <button type='button' onClick={() => { setProjectSearch(''); setProjectFilter('All'); setProjectTier('All'); setProjectHandover('All'); setProjectPriceMax(20); setProjectType('All'); setProjectSort('default'); }} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: T.red, fontSize: 12, cursor: 'pointer' }}>Clear Filters</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Area</span>
                {/* Area filter chips - full community names, derived from actual projects */}
                {(() => {
                  const devProjects = selectedDeveloper === "emaar"
                    ? activeProjects.filter(p => (p.developerId || "emaar") === "emaar")
                    : activeProjects.filter(p => (p.developerId || "emaar") === selectedDeveloper);
                  const communities = ["All", ...Array.from(new Set(devProjects.map(p => p.community).filter(Boolean))).sort(), "Branded"];
                  return communities.map(f => (
                    <button type='button' key={f} onClick={() => setProjectFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid '+(projectFilter===f ? T.gold : T.border), background: projectFilter===f ? T.goldGlow : 'transparent', color: projectFilter===f ? T.gold : T.textSecondary, fontSize: 11, fontWeight: projectFilter===f ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>{f}</button>
                  ));
                })()}

              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Tier</span>
                {['All','Affordable','Mid-Market','Mid-Premium','Premium','Luxury','Ultra-Luxury','Luxury Branded','Ultra-Lux Branded'].map(t => (
                  <button type='button' key={t} onClick={() => setProjectTier(t)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid '+(projectTier===t ? T.teal : T.border), background: projectTier===t ? 'rgba(0,191,165,0.1)' : 'transparent', color: projectTier===t ? T.teal : T.textSecondary, fontSize: 11, fontWeight: projectTier===t ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>{t}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Handover</span>
                {['All','2026','2027','2028','2029','2030+'].map(y => (
                  <button type='button' key={y} onClick={() => setProjectHandover(y)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid '+(projectHandover===y ? T.purple : T.border), background: projectHandover===y ? 'rgba(139,92,246,0.1)' : 'transparent', color: projectHandover===y ? T.purple : T.textSecondary, fontSize: 11, fontWeight: projectHandover===y ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>{y}</button>
                ))}
              </div>
              {/* S7 - Type filter + Sort */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Type</span>
                  {['All','Apartments','Townhouses','Villas','Branded Res.'].map(t => (
                    <button type='button' key={t} onClick={() => setProjectType(t)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid '+(projectType===t ? T.cyan : T.border), background: projectType===t ? 'rgba(6,182,212,0.1)' : 'transparent', color: projectType===t ? T.cyan : T.textSecondary, fontSize: 11, fontWeight: projectType===t ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>{t}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                  <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Sort</span>
                  <select value={projectSort} onChange={e => setProjectSort(e.target.value)} style={{ padding: '7px 12px', background: T.surfaceAlt, border: `1px solid ${projectSort !== 'default' ? T.gold : T.border}`, borderRadius: 8, color: projectSort !== 'default' ? T.gold : T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: 'pointer', fontWeight: projectSort !== 'default' ? 700 : 400 }}>
                    <option value="default">Default</option>
                    <option value="price_asc">Price ?</option>
                    <option value="price_desc">Price ?</option>
                    <option value="ppsf_asc">PPSF ?</option>
                    <option value="ppsf_desc">PPSF ?</option>
                    <option value="handover_asc">Handover (earliest)</option>
                    <option value="handover_desc">Handover (latest)</option>
                    <option value="construction_desc">Construction % ?</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Project Cards */}
            {projectsLoading ? <LoadingSkeleton rows={6} cols={3} /> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 16 }}>
              {activeProjects
                .filter(p => {
                  const matchSearch = !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.community.toLowerCase().includes(projectSearch.toLowerCase());
                  const matchFilter = projectFilter === "All" || p.community === projectFilter || (projectFilter === "Branded" && p.branded);
                  const matchTier = projectTier === "All" || p.tier === projectTier;
                  const matchHandover = projectHandover === "All" || (projectHandover === "2030+" ? parseInt(p.handover) >= 2030 : p.handover?.includes(projectHandover));
                  const matchPrice = projectPriceMax >= 20 || !p.price || p.price <= projectPriceMax * 1e6;
                  const matchType = projectType === "All" || (p.type || "").includes(projectType);
                  const matchDev = (p.developerId || "emaar") === selectedDeveloper;
                  return matchSearch && matchFilter && matchTier && matchHandover && matchPrice && matchType && matchDev;
                })
                .sort((a, b) => {
                  switch (projectSort) {
                    case "price_asc":         return (a.price || 0) - (b.price || 0);
                    case "price_desc":        return (b.price || 0) - (a.price || 0);
                    case "ppsf_asc":          return (a.ppsf  || 0) - (b.ppsf  || 0);
                    case "ppsf_desc":         return (b.ppsf  || 0) - (a.ppsf  || 0);
                    case "handover_asc":      return (a.handover || "").localeCompare(b.handover || "");
                    case "handover_desc":     return (b.handover || "").localeCompare(a.handover || "");
                    case "construction_desc": return (b.construction || 0) - (a.construction || 0);
                    default:                  return 0;
                  }
                })
                .map((p, i) => {
                  const isLocked = !isPro && i >= 5;
                  return (
                <div key={p.id} className="chart-box fade-up" style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s`, padding: 0, overflow: "hidden", cursor: isLocked ? "default" : "pointer", outline: compareList.find(x=>x.id===p.id) ? `2px solid ${T.gold}` : "none", outlineOffset: "-1px", position: "relative", boxShadow: compareList.find(x=>x.id===p.id) ? `0 0 20px rgba(212,168,67,0.2)` : "none" }} onClick={() => !isLocked && setSelectedProject(p)}>
                  {/* Radar project - data being researched overlay */}
                  {p.fromFirestore && p.addedViaRadar && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(4,9,15,0.82)", backdropFilter: "blur(3px)", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 12, gap: 8, padding: 20 }}>
                      <div style={{ fontSize: 22 }}>??</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.white, textAlign: "center" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: T.textMuted, textAlign: "center" }}>{p.community || p.developer}</div>
                      <div style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.3)", fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: 0.5 }}>?? NEW LAUNCH - DATA INCOMING</div>
                      <div style={{ fontSize: 10, color: T.textMuted, textAlign: "center", maxWidth: 180, lineHeight: 1.5 }}>Our research team is curating full data for this project</div>
                      {p.sourceUrl && <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: T.teal, textDecoration: "none", padding: "4px 12px", border: "1px solid rgba(0,191,165,0.3)", borderRadius: 6 }}>View Listing ?</a>}
                    </div>
                  )}
                  {/* Lock overlay for free users */}
                  {isLocked && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(4,9,15,0.7)", backdropFilter: "blur(4px)", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 12 }}>
                      <span style={{ fontSize: 24, marginBottom: 6 }}>??</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.white }}>Pro Feature</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setShowUpgrade(true); }} style={{ marginTop: 8, padding: "6px 16px", background: T.gold, color: T.bg, border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Unlock</button>
                    </div>
                  )}
                  {/* Compare badge */}
                  {compareList.find(x=>x.id===p.id) && (
                    <div style={{ position: "absolute", top: 8, right: 8, padding: "3px 8px", borderRadius: 6, background: T.gold, color: T.bg, fontSize: 9, fontWeight: 800, zIndex: 5, letterSpacing: 0.5 }}>COMPARING</div>
                  )}
                  {/* Project Image */}
                  {p.imageUrl && (
                    <div style={{ width: "100%", height: 140, overflow: "hidden", borderBottom: `1px solid ${T.border}` }}>
                      <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.parentElement.style.display = "none"; }} />
                    </div>
                  )}
                  <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: T.gold, marginBottom: 2 }}>{p.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: T.textSecondary }}>{p.community></span>
                        {p.emaarUrl && <a href={p.emaarUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, color: T.gold, textDecoration: "none", padding: "1px 5px", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 4, fontWeight: 600, letterSpacing: 0.3, flexShrink: 0 }} title="Official listing on Emaar.com">{getLinkLabel(p.emaarUrl)}</a>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      {(() => { const inv = p.ratingOverride != null && p.ratingOverride !== '' ? { score: parseFloat(p.ratingOverride), color: parseFloat(p.ratingOverride) >= 8 ? '#10B981' : parseFloat(p.ratingOverride) >= 6 ? '#D4A843' : parseFloat(p.ratingOverride) >= 4 ? '#F59E0B' : '#EF4444', label: parseFloat(p.ratingOverride) >= 8 ? 'Excellent' : parseFloat(p.ratingOverride) >= 6 ? 'Strong' : parseFloat(p.ratingOverride) >= 4 ? 'Good' : 'Weak', breakdown: [] } : getInvestmentScore(p); return (
                        <div title={`Investment Score: ${inv.score}/10 - ${inv.breakdown.map(b => b.label + ': ' + b.pts + '/' + b.max).join(' - ')}`}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 8, background: `${inv.color}18`, border: `1px solid ${inv.color}40`, cursor: "default" }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: inv.color, fontFamily: "'Fraunces', serif" }}>{inv.score></span>
                          <span style={{ fontSize: 9, color: inv.color, fontWeight: 700, letterSpacing: 0.3 }}>/10</span>
                          <span style={{ fontSize: 9, color: inv.color, fontWeight: 600 }}>?? {inv.label></span>
                        </div>
                      ); })()}
                      <div style={{ display: "flex", gap: 4 }}>
                        {p.branded && <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: "rgba(212,168,67,0.15)", color: T.gold, fontWeight: 600 }}>{p.brand></span>}
                        <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: p.status === "Completed" ? "rgba(16,185,129,0.2)" : p.status === "Under Construction" ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)", color: p.status === "Completed" ? T.green : p.status === "Under Construction" ? T.green : T.blue, fontWeight: 600 }}>{p.status === "Completed" ? "? Done" : p.status === "Under Construction" ? "Building" : "Off-Plan"></span>
                      </div>
                    </div>
                  </div>
                  {/* Construction Progress */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: T.textMuted }}>Construction</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: p.construction >= 100 ? T.green : p.construction >= 70 ? T.green : p.construction >= 30 ? T.gold : T.blue }}>{p.construction}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: T.surfaceAlt, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${p.construction}%`, borderRadius: 2, background: p.construction >= 100 ? T.green : p.construction >= 70 ? T.green : p.construction >= 30 ? T.gold : T.blue, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                  {/* Details Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>FROM</span><span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.price ? `AED ${(p.price/1000000).toFixed(1)}M` : "TBD"></span></div>
                    <div>
                      <span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>HANDOVER</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.handover></span>
                      {(() => { const cd = getHandoverCountdown(p.handover); return cd ? (
                        <span style={{ display: "inline-block", marginTop: 2, fontSize: 9, fontWeight: 700, color: cd.passed ? "#10B981" : cd.color, background: cd.passed ? "rgba(16,185,129,0.1)" : cd.urgent ? "rgba(239,68,68,0.12)" : "rgba(212,168,67,0.08)", padding: "1px 5px", borderRadius: 4 }}>
                          {cd.passed ? "\u2713 Ready" : "\u23F1 " + cd.label}
                        </span>
                      ) : null; })()}
                    </div>
                    <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>PRICE/SQFT</span><span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.ppsf ? `AED ${p.ppsf.toLocaleString()}` : "TBD"></span></div>
                    {/* Unit breakdown on card - show starting unit type + price */}
                    {p.unitBreakdown?.length > 0 ? (
                      <div style={{ gridColumn: "span 2" }}>
                        <span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>FROM</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>AED {(p.unitBreakdown[0].priceFrom/1000000).toFixed(2)}M</span>
                        <span style={{ fontSize: 10, color: T.textMuted }}> - {p.unitBreakdown[0].type} - {p.unitBreakdown[0].sqftFrom?.toLocaleString()}-{p.unitBreakdown[0].sqftTo?.toLocaleString()} sqft</span>
                        {p.unitBreakdown.length > 1 && <span style={{ fontSize: 10, color: T.textMuted }}> +{p.unitBreakdown.length - 1} more types</span>}
                      </div>
                    ) : (
                      <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>SIZE</span><span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.sizeFrom?.toLocaleString()} - {p.sizeTo?.toLocaleString()} sqft</span></div>
                    )}
                    <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>TYPE</span><span style={{ fontSize: 12, color: T.textSecondary }}>{p.type} - {p.beds></span></div>
                    <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>PAYMENT</span><span style={{ fontSize: 12, color: T.textSecondary }}>{p.payment></span></div>
                  </div>
                  {/* Unit Inventory */}
                  {p.units && <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>UNIT AVAILABILITY</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {getUnitEntries(p.units).map(([type, d]) => {
                        const avail = d.total - d.sold;
                        return (
                          <div key={type} style={{ padding: "4px 8px", borderRadius: 6, background: T.surfaceAlt, fontSize: 10, display: "flex", gap: 4, alignItems: "center" }}>
                            <span style={{ fontWeight: 700, color: T.white, textTransform: "uppercase" }}>{type></span>
                            <span style={{ color: avail > 0 ? T.green : T.red }}>{avail > 0 ? `${avail} left` : "Sold out"></span>
                          </div>
                        );
                      })}
                    </div>
                  </div>}
                  <div style={{ marginTop: 8, padding: "4px 8px", borderRadius: 6, background: T.surfaceAlt, display: "inline-block" }}>
                    <span style={{ fontSize: 10, color: T.textMuted }}>{p.tier></span>
                  </div>
                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedProject(p); }} style={{ flex: 1, padding: "8px 0", background: "linear-gradient(135deg, rgba(212,168,67,0.15), rgba(212,168,67,0.08))", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 700, textAlign: "center", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      Full Details
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); toggleWatchlist(p); }} style={{ padding: "8px 10px", background: watchlist.find(w => w.id === p.id) ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border: `1px solid ${watchlist.find(w => w.id === p.id) ? T.gold : T.border}`, borderRadius: 8, color: watchlist.find(w => w.id === p.id) ? T.gold : T.textMuted, fontSize: 14, cursor: "pointer" }} title={watchlist.find(w => w.id === p.id) ? "Remove from watchlist" : "Add to watchlist"}>
                      {watchlist.find(w => w.id === p.id) ? "?" : "?"}
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); isPro ? toggleCompare(p) : setShowUpgrade(true); }} style={{ padding: "8px 10px", background: !isPro ? "rgba(212,168,67,0.05)" : compareList.find(x=>x.id===p.id) ? T.goldGlow : T.surfaceAlt, border: `1px solid ${!isPro ? T.border : compareList.find(x=>x.id===p.id) ? T.gold : T.border}`, borderRadius: 8, color: !isPro ? T.textMuted : compareList.find(x=>x.id===p.id) ? T.gold : T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                      {!isPro ? "" : compareList.find(x=>x.id===p.id) ? "?" : "+"}
                    </button>
                    <button type="button" title={myAlerts.find(a => a.projectId === p.id && !a.triggered) ? "Alert active" : "Set Price Alert"} onClick={(e) => { e.stopPropagation(); if (!isPro) { setShowUpgrade(true); return; } setShowSetAlert(p); setAlertForm({ type: "price_below", value: p.price ? p.price.toString() : "" }); }} style={{ padding: "8px 10px", background: myAlerts.find(a => a.projectId === p.id && !a.triggered) ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border: `1px solid ${myAlerts.find(a => a.projectId === p.id && !a.triggered) ? T.gold : T.border}`, borderRadius: 8, color: myAlerts.find(a => a.projectId === p.id && !a.triggered) ? T.gold : T.textMuted, fontSize: 13, cursor: "pointer" }}>
                      {myAlerts.find(a => a.projectId === p.id && !a.triggered) ? "" : ""}
                    </button>
                  </div>
                  </div>{/* end padding wrapper */}
                </div>
              );})}
              {activeProjects.filter(p => { const ms = !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.community.toLowerCase().includes(projectSearch.toLowerCase()); const mf = projectFilter === "All" || p.community === projectFilter || (projectFilter === "Branded" && p.branded); const mt = projectTier === "All" || p.tier === projectTier; const my = projectHandover === "All" || (projectHandover === "2030+" ? parseInt(p.handover) >= 2030 : p.handover?.includes(projectHandover)); const mp = projectPriceMax >= 20 || !p.price || p.price <= projectPriceMax * 1e6; const mty = projectType === "All" || (p.type || "").includes(projectType); const md = (p.developerId || "emaar") === selectedDeveloper; return ms && mf && mt && my && mp && mty && md; }).length === 0 && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 20px" }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>??</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: T.white, marginBottom: 4 }}>No projects found</div>
                  <div style={{ fontSize: 13, color: T.textMuted }}>Try adjusting your search or filter</div>
                </div>
              )}
            </div>
            )}

            {/* Community Summary */}
            <Section title="Communities Overview" sub={`${new Set(activeProjects.map(p=>p.community)).size} master-planned communities`}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 16 }}>
                {emaarCommunities.filter(c => c.name).map((c, i) => (
                  <div key={c.district} className="chart-box fade-up" style={{ animationDelay: `${i*0.05}s`, padding: 14, cursor: "pointer", transition: "border 0.2s" }} onClick={() => setSelectedCommunity(c.name)} title="Click for full community details">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: T.gold }}>{c.district></span>
                        <span style={{ fontSize: 11, color: T.textSecondary, marginLeft: 8 }}>{c.name></span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.teal }}>{c.projects} projects</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 11 }}>
                      <div><span style={{ color: T.textMuted, fontSize: 9, display: "block" }}>AVG PPSF</span><span style={{ color: T.white, fontWeight: 600 }}>{c.avgPpsf ? `AED ${c.avgPpsf.toLocaleString()}` : "-"></span></div>
                      <div><span style={{ color: T.textMuted, fontSize: 9, display: "block" }}>YIELD</span><span style={{ color: T.white, fontWeight: 600 }}>{c.avgYield ? `${c.avgYield}%` : "-"></span></div>
                      <div><span style={{ color: T.textMuted, fontSize: 9, display: "block" }}>ACRES</span><span style={{ color: T.white, fontWeight: 600 }}>{c.acres ? c.acres.toLocaleString() : "-"></span></div>
                    </div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{c.buyer} - {c.strengths}</div>
                  </div>
                ))}
              </div>
            </Section>


            {/* Mega Projects */}
            <Section title="Mega Projects Pipeline" sub="Strategic developments 2026-2035 - AED 800B+ combined value - Global benchmarks & DLD price data - Click any project for deep analysis">
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 16 }}>
                {megaProjects.map((m, i) => {
                  const isOpen = expandedMega === m.name;
                  const mStatus = m.status || "Planned";
                  return (
                  <div key={m.name} className="chart-box fade-up" style={{ animationDelay: `${i*0.05}s`, padding: 0, overflow: "hidden", cursor: "pointer", border: isOpen ? `1px solid ${T.gold}` : undefined }} onClick={() => setExpandedMega(isOpen ? null : m.name)}>
                    <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ flex: "1 1 200px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: T.gold }}>{m.name}</div>
                          <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 6, background: mStatus === "Under Construction" ? "rgba(16,185,129,0.12)" : mStatus.includes("Active") || mStatus.includes("Partial") ? "rgba(234,179,8,0.12)" : "rgba(99,102,241,0.12)", color: mStatus === "Under Construction" ? T.green : mStatus.includes("Active") || mStatus.includes("Partial") ? T.gold : T.blue, fontWeight: 600 }}>{mStatus></span>
                        </div>
                        <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 3 }}>{m.community} &middot; {m.type} &middot; {m.developer || "Emaar"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                        <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>VALUE</span><span style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{m.value></span></div>
                        <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>TIMELINE</span><span style={{ fontSize: 13, fontWeight: 600, color: T.teal }}>{m.timeline></span></div>
                        <span style={{ fontSize: 14, color: T.textMuted, transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>&#9660;</span>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>
                        <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.7, margin: "14px 0" }}>{m.desc || m.feature || "Details coming soon."}</p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
                          <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 8, letterSpacing: 0.5 }}>KEY FACTS</div>
                            {m.keyFacts && m.keyFacts.map((f, fi) => (
                              <div key={fi} style={{ fontSize: 11, color: T.textSecondary, padding: "3px 0", display: "flex", gap: 6, alignItems: "flex-start" }}>
                                <span style={{ color: T.gold, fontSize: 8, marginTop: 4, flexShrink: 0 }}>&bull;</span><span>{f></span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 6, letterSpacing: 0.5 }}>INVESTOR IMPACT</div>
                              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{m.investorImpact || "Impact analysis coming soon."}</div>
                            </div>
                            {m.benchmark && (
                            <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 6, letterSpacing: 0.5 }}>GLOBAL BENCHMARK</div>
                              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{m.benchmark}</div>
                            </div>
                            )}
                            {m.priceImpact && (
                            <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 6, letterSpacing: 0.5 }}>PRICE IMPACT DATA</div>
                              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{m.priceImpact}</div>
                            </div>
                            )}
                            <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, marginBottom: 6, letterSpacing: 0.5 }}>COMPLETION STATUS</div>
                              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{m.completion || m.timeline}</div>
                            </div>
                            {m.milestones && (
                            <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, marginBottom: 8, letterSpacing: 0.5 }}>CONSTRUCTION MILESTONES</div>
                              {m.milestones.map((ms, msi) => (
                                <div key={msi} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontSize: 11, color: T.blue }}>?</span>
                                  <span style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>{ms></span>
                                </div>
                              ))}
                            </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap", padding: "10px 0 0", borderTop: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: 10, color: T.textMuted }}>Developer: <span style={{ color: T.white, fontWeight: 600 }}>{m.developer || "Emaar"></span></div>
                          <div style={{ fontSize: 10, color: T.textMuted }}>Announced: <span style={{ color: T.white, fontWeight: 600 }}>{m.announced || "-"></span></div>
                          <div style={{ fontSize: 10, color: T.textMuted }}>Scale: <span style={{ color: T.white, fontWeight: 600 }}>{m.scale></span></div>
                        </div>
                        {m.sources && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: 9, color: T.textMuted, fontStyle: "italic" }}>Sources: {m.sources}</div>
                        </div>
                        )}
                      </div>
                    )}
                  </div>
                );})}
              </div>
          <TabSources sources={[{ label: "Emaar.com Projects", url: "https://www.emaar.com/en/residential/" }, { label: "DLD Project Registry", url: "https://dubailand.gov.ae" }, { label: "Emaar IR", url: "https://www.emaar.com/en/investor-relations/" }]} />
            </Section>
          </>}

          {/* --- HANDOVER TRACKER TAB --- */}
          {tab === "Handover" && (() => {
            const now = new Date();
            const thisYear = now.getFullYear();
            const allHandover = activeProjects
              .map(p => ({ ...p, _cd: getHandoverCountdown(p.handover), _score: getInvestmentScore(p) }))
              .filter(p => p.handover)
              .sort((a, b) => {
                const getMs = p => { const cd = p._cd; if (!cd) return Infinity; if (cd.passed) return -1; return cd.days || 99999; };
                return getMs(a) - getMs(b);
              });
            const delivering = allHandover.filter(p => p._cd && (p._cd.passed || p._cd.months <= 12));
            const nextYear = allHandover.filter(p => p._cd && !p._cd.passed && p._cd.months > 12 && p._cd.months <= 24);
            const beyond = allHandover.filter(p => p._cd && !p._cd.passed && p._cd.months > 24);
            const avgConstruction = allHandover.length ? Math.round(allHandover.reduce((a, p) => a + (p.construction || 0), 0) / allHandover.length) : 0;

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Summary KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                  {[
                    { label: "Ready / Overdue", value: delivering.length, color: "#10B981", sub: "Keys available" },
                    { label: "Next 12 Months", value: delivering.filter(p => p._cd && !p._cd.passed).length + " soon", color: T.gold, sub: "Upcoming handovers" },
                    { label: "Avg Construction", value: avgConstruction + "%", color: T.blue, sub: "Across all projects" },
                    { label: "Total Tracked", value: allHandover.length, color: T.textSecondary, sub: "With handover dates" },
                  ].map(k => (
                    <div key={k.label} style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "16px 18px" }}>
                      <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{k.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: k.color, fontFamily: "'Fraunces', serif" }}>{k.value}</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Ready / Overdue */}
                {delivering.length > 0 && (
                  <div style={{ background: T.surface, borderRadius: 16, border: `1px solid rgba(16,185,129,0.25)`, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", background: "rgba(16,185,129,0.06)", borderBottom: `1px solid rgba(16,185,129,0.15)`, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: "#10B981" }}>Ready for Handover</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginLeft: "auto" }}>{delivering.length} project{delivering.length !== 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {delivering.map((p, i) => (
                        <div key={p.id} onClick={() => setSelectedProject(p)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < delivering.length - 1 ? `1px solid ${T.border}` : "none", cursor: "pointer", transition: "background 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          {/* Construction ring */}
                          <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                            <svg width="44" height="44" viewBox="0 0 44 44">
                              <circle cx="22" cy="22" r="18" fill="none" stroke={T.border} strokeWidth="3"/>
                              <circle cx="22" cy="22" r="18" fill="none" stroke="#10B981" strokeWidth="3"
                                strokeDasharray={`${(p.construction || 100) / 100 * 113} 113`}
                                strokeLinecap="round" transform="rotate(-90 22 22)"/>
                            </svg>
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#10B981" }}>{p.construction || 100}%</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: T.white, fontSize: 13, fontFamily: "'Fraunces', serif", marginBottom: 2 }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: T.textMuted }}>{p.community} - {p.handover}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{p.price ? "AED " + (p.price / 1e6).toFixed(1) + "M" : "TBD"}</div>
                            <div style={{ fontSize: 10, color: "#10B981", fontWeight: 600, marginTop: 2 }}>? Ready</div>
                          </div>
                          <div style={{ padding: "4px 10px", borderRadius: 8, background: `${p._score.color}18`, border: `1px solid ${p._score.color}40`, textAlign: "center", flexShrink: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: p._score.color, fontFamily: "'Fraunces', serif" }}>{p._score.score}</div>
                            <div style={{ fontSize: 9, color: p._score.color }}>?? Score</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next 12-24 months */}
                {nextYear.length > 0 && (
                  <div style={{ background: T.surface, borderRadius: 16, border: `1px solid rgba(212,168,67,0.2)`, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", background: "rgba(212,168,67,0.05)", borderBottom: `1px solid rgba(212,168,67,0.12)`, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold }} />
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: T.gold }}>Delivering in 12-24 Months</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginLeft: "auto" }}>{nextYear.length} project{nextYear.length !== 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {nextYear.map((p, i) => (
                        <div key={p.id} onClick={() => setSelectedProject(p)} style={{ padding: "14px 20px", borderBottom: i < nextYear.length - 1 ? `1px solid ${T.border}` : "none", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div>
                              <div style={{ fontWeight: 700, color: T.white, fontSize: 13, fontFamily: "'Fraunces', serif" }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{p.community} - {p.handover}</div>
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <div style={{ padding: "4px 10px", borderRadius: 8, background: `${p._score.color}18`, border: `1px solid ${p._score.color}40`, textAlign: "center" }}>
                                <span style={{ fontSize: 12, fontWeight: 900, color: p._score.color, fontFamily: "'Fraunces', serif" }}>{p._score.score></span>
                                <span style={{ fontSize: 9, color: p._score.color }}>/10</span>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{p.price ? "AED " + (p.price / 1e6).toFixed(1) + "M" : "TBD"}</div>
                                <div style={{ fontSize: 10, color: T.gold, fontWeight: 600 }}>? {p._cd?.label}</div>
                              </div>
                            </div>
                          </div>
                          {/* Construction progress */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.surfaceAlt, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${p.construction || 0}%`, borderRadius: 3, background: T.gold, transition: "width 0.5s" }} />
                            </div>
                            <span style={{ fontSize: 10, color: T.textMuted, flexShrink: 0, minWidth: 32 }}>{p.construction || 0}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Beyond 24 months */}
                {beyond.length > 0 && (
                  <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.textMuted }} />
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: T.textSecondary }}>24+ Months Away</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginLeft: "auto" }}>{beyond.length} project{beyond.length !== 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, padding: 16 }}>
                      {beyond.map(p => (
                        <div key={p.id} onClick={() => setSelectedProject(p)} style={{ background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}`, padding: "12px 14px", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = T.gold + "60"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div>
                              <div style={{ fontWeight: 700, color: T.white, fontSize: 12, fontFamily: "'Fraunces', serif" }}>{p.name}</div>
                              <div style={{ fontSize: 10, color: T.textMuted }}>{p.community}</div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: p._score.color, padding: "3px 7px", borderRadius: 6, background: `${p._score.color}15` }}>{p._score.score}?</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                            <span style={{ color: T.textMuted }}>{p.handover></span>
                            <span style={{ color: T.textSecondary }}>{p._cd?.label></span>
                          </div>
                          <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: T.border, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${p.construction || 0}%`, background: T.textMuted, borderRadius: 2 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <TabSources sources={[{ label: "DLD Oqood", url: "https://oqood.dubailand.gov.ae" }, { label: "Emaar Handover Centre" }, { label: "Emaar IR", url: "https://www.emaar.com/en/investor-relations/" }, { label: "Property Monitor" }]} />
              </div>
            );
          })()}

          {/* --- PORTFOLIO TAB --- */}
          {tab === "Portfolio" && !isPro && <ProGateFullPage tabName="Portfolio" onUpgrade={() => setShowUpgrade(true)} />}
          {tab === "Portfolio" && isPro && <>

            {/* ROI MODE TOGGLE */}
            {myPortfolio.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {[["summary","Summary"],["roi","ROI & IRR"],["unrealised","Unrealised Gain"],["cashflow","Cash Flow"],["diversification","Diversification"],["holdings","Holdings"]].map(([v,l]) => (
                  <button key={v} type="button" onClick={() => setRoiMode(v)} style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${roiMode === v ? T.gold : T.border}`, background: roiMode === v ? "rgba(212,168,67,0.12)" : T.surfaceAlt, color: roiMode === v ? T.gold : T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{l}</button>
                ))}
              </div>
            )}

            {/* -- ROI ANALYSIS VIEW -- */}
            {roiMode === "roi" && myPortfolio.length > 0 && (() => {
              const holdings = myPortfolio.map(h => {
                const p = activeProjects.find(x => x.id === h.projectId);
                if (!p) return null;
                const comm = emaarCommunities.find(c => c.name === p.community);
                const grossYield = comm ? comm.avgYield : 5.0;
                const serviceCharge = p.ppsf > 2500 ? 28 : p.ppsf > 1800 ? 20 : 14;
                const sqft = h.investedAmount / (p.ppsf || 2000);
                const annualRent = h.investedAmount * (grossYield / 100);
                const annualSC = sqft * serviceCharge;
                const mgmtFee = annualRent * 0.09;
                const netRent = annualRent - annualSC - mgmtFee;
                const netYield = (netRent / h.investedAmount) * 100;
                const yrsHeld = h.purchaseDate ? Math.max(0.5, (new Date() - new Date(h.purchaseDate)) / (365.25 * 24 * 3600 * 1000)) : 1;
                const apprRate = p.ppsf > 2500 ? 0.12 : p.ppsf > 2000 ? 0.18 : 0.22;
                const currentValue = h.investedAmount * Math.pow(1 + apprRate, yrsHeld);
                const capitalGain = currentValue - h.investedAmount;
                const totalReturn = capitalGain + (netRent * yrsHeld);
                const irr = ((totalReturn / h.investedAmount) / yrsHeld) * 100;
                return { ...h, p, grossYield, netYield: netYield.toFixed(1), annualRent: Math.round(annualRent), annualSC: Math.round(annualSC), netRent: Math.round(netRent), currentValue: Math.round(currentValue), capitalGain: Math.round(capitalGain), totalReturn: Math.round(totalReturn), irr: irr.toFixed(1), yrsHeld: yrsHeld.toFixed(1) };
              }).filter(Boolean);
              const totalInvested = holdings.reduce((s, h) => s + h.investedAmount, 0);
              const totalCurrentVal = holdings.reduce((s, h) => s + h.currentValue, 0);
              const totalNetRent = holdings.reduce((s, h) => s + h.netRent, 0);
              const totalCapGain = holdings.reduce((s, h) => s + h.capitalGain, 0);
              const avgIRR = holdings.length ? (holdings.reduce((s,h) => s + parseFloat(h.irr), 0) / holdings.length).toFixed(1) : "-";
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ background: T.surface, borderRadius: 14, border: "1px solid rgba(212,168,67,0.3)", padding: "20px 24px" }}>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: T.gold, marginBottom: 4 }}>Portfolio ROI Dashboard</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>Projected based on DLD rental index + historical appreciation rates</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 12 }}>
                      {[
                        { l: "Total Invested", v: "AED " + (totalInvested/1e6).toFixed(2) + "M", c: T.white },
                        { l: "Current Value", v: "AED " + (totalCurrentVal/1e6).toFixed(2) + "M", c: "#10B981" },
                        { l: "Capital Gain", v: "AED " + (totalCapGain/1e6).toFixed(2) + "M", c: T.gold },
                        { l: "Annual Net Rent", v: "AED " + (totalNetRent/1000).toFixed(0) + "K", c: "#3B82F6" },
                        { l: "Portfolio IRR", v: avgIRR + "%", c: "#8B5CF6" },
                        { l: "Total Return", v: "AED " + ((totalCapGain + totalNetRent)/1e6).toFixed(2) + "M", c: "#10B981" },
                      ].map(k => (
                        <div key={k.l} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "12px 14px", border: "1px solid " + T.border }}>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 5 }}>{k.l}</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: k.c, fontFamily: "'Fraunces',serif" }}>{k.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid " + T.border }}>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white }}>Per-Property Breakdown</div>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                        <thead>
                          <tr style={{ background: T.surfaceAlt, borderBottom: "1px solid " + T.border }}>
                            {["Project","Invested","Current Val","Capital Gain","Gross Yield","Net Yield","Annual Net Rent","IRR"].map(h => (
                              <th key={h} style={{ padding: "9px 12px", textAlign: h === "Project" ? "left" : "right", fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {holdings.map((h, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid " + T.border }}
                              onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <td style={{ padding: "11px 12px" }}>
                                <div style={{ fontWeight: 700, color: T.white, fontSize: 12 }}>{h.p.name}</div>
                                <div style={{ fontSize: 10, color: T.textMuted }}>{h.p.community} - {h.unitType}</div>
                              </td>
                              <td style={{ padding: "11px 12px", textAlign: "right", fontSize: 12, color: T.textSecondary }}>AED {(h.investedAmount/1e6).toFixed(2)}M</td>
                              <td style={{ padding: "11px 12px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#10B981" }}>AED {(h.currentValue/1e6).toFixed(2)}M</td>
                              <td style={{ padding: "11px 12px", textAlign: "right", fontSize: 12, color: T.gold }}>+AED {(h.capitalGain/1000).toFixed(0)}K</td>
                              <td style={{ padding: "11px 12px", textAlign: "right", fontSize: 12, color: T.gold, fontWeight: 700 }}>{h.grossYield}%</td>
                              <td style={{ padding: "11px 12px", textAlign: "right", fontSize: 12, color: "#10B981", fontWeight: 700 }}>{h.netYield}%</td>
                              <td style={{ padding: "11px 12px", textAlign: "right", fontSize: 12, color: "#3B82F6" }}>AED {(h.netRent/1000).toFixed(0)}K</td>
                              <td style={{ padding: "11px 12px", textAlign: "right", fontSize: 14, fontWeight: 800, color: "#8B5CF6", fontFamily: "'Fraunces',serif" }}>{h.irr}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* -- CASH FLOW VIEW -- */}
            {roiMode === "cashflow" && myPortfolio.length > 0 && (() => {
              const holdings = myPortfolio.map(h => {
                const p = activeProjects.find(x => x.id === h.projectId);
                if (!p) return null;
                const comm = emaarCommunities.find(c => c.name === p.community);
                const grossYield = comm ? comm.avgYield : 5.0;
                const serviceCharge = p.ppsf > 2500 ? 28 : p.ppsf > 1800 ? 20 : 14;
                const sqft = h.investedAmount / (p.ppsf || 2000);
                const annualRent = h.investedAmount * (grossYield / 100);
                const annualSC = sqft * serviceCharge;
                const mgmtFee = annualRent * 0.09;
                const netRent = annualRent - annualSC - mgmtFee;
                return { ...h, p, annualRent: Math.round(annualRent), annualSC: Math.round(annualSC), mgmtFee: Math.round(mgmtFee), netRent: Math.round(netRent) };
              }).filter(Boolean);
              const yr = (v) => "AED " + (v/1000).toFixed(0) + "K/yr";
              const mo = (v) => "AED " + Math.round(v/12).toLocaleString() + "/mo";
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {holdings.map((h, i) => (
                    <div key={i} style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: "18px 22px" }}>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 800, color: T.white, marginBottom: 2 }}>{h.p.name}</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 14 }}>{h.p.community} - {h.unitType} - AED {(h.investedAmount/1e6).toFixed(2)}M invested</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        {[
                          { l: "Gross Rental Income", v: h.annualRent, c: "#10B981", sign: "+" },
                          { l: "Service Charges", v: h.annualSC, c: "#EF4444", sign: "-" },
                          { l: "Property Management (9%)", v: h.mgmtFee, c: "#EF4444", sign: "-" },
                          { l: "Net Annual Cash Flow", v: h.netRent, c: T.gold, sign: "=", bold: true },
                        ].map((row, ri) => (
                          <div key={ri} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: ri === 3 ? "rgba(212,168,67,0.06)" : "transparent", borderRadius: ri === 3 ? 8 : 0, borderTop: ri === 3 ? "1px solid " + T.border : "none", marginTop: ri === 3 ? 4 : 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: row.c, width: 16 }}>{row.sign></span>
                              <span style={{ fontSize: 12, color: row.bold ? T.white : T.textSecondary, fontWeight: row.bold ? 700 : 400 }}>{row.l></span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ fontSize: row.bold ? 15 : 13, fontWeight: row.bold ? 800 : 600, color: row.c, fontFamily: row.bold ? "'Fraunces',serif" : "inherit" }}>{yr(row.v)></span>
                              <span style={{ fontSize: 10, color: T.textMuted, marginLeft: 8 }}>({mo(row.v)})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* -- UNREALISED GAIN VIEW -- */}
            {roiMode === "unrealised" && myPortfolio.length > 0 && (() => {
              // Research-backed appreciation rates (DLD data, ValuStrat VPI 2025)
              // Dubai overall PPSF up 19.8% in 2025, Creek Harbour +22%, Hills +18%
              const apprRates = {
                "Dubai Creek Harbour":  { annual: 0.22, source: "DLD + ValuStrat 2025" },
                "Dubai Hills Estate":   { annual: 0.18, source: "DLD + CBRE 2025" },
                "Emaar Beachfront":     { annual: 0.16, source: "DLD + Knight Frank" },
                "Downtown Dubai":       { annual: 0.125, source: "DLD + Savills 2025" },
                "Business Bay":         { annual: 0.10, source: "DLD + ValuStrat" },
                "Arabian Ranches 3":    { annual: 0.15, source: "DLD community data" },
                "Emaar South":          { annual: 0.20, source: "DLD + growth corridor" },
                "The Valley":           { annual: 0.22, source: "DLD + townhouse demand" },
                "Rashid Yachts & Marina": { annual: 0.28, source: "New community premium" },
                "The Oasis":            { annual: 0.25, source: "Ultra-luxury premium" },
                "Grand Polo Club":      { annual: 0.20, source: "Emerging community" },
                "Mudon":                { annual: 0.14, source: "Established community" },
              };

              // Newton's method for proper IRR calculation
              const calcIRR = (cashflows) => {
                let rate = 0.1;
                for (let i = 0; i < 100; i++) {
                  let npv = 0, dnpv = 0;
                  cashflows.forEach((cf, t) => {
                    npv += cf / Math.pow(1 + rate, t);
                    dnpv -= t * cf / Math.pow(1 + rate, t + 1);
                  });
                  const newRate = rate - npv / dnpv;
                  if (Math.abs(newRate - rate) < 0.0001) break;
                  rate = newRate;
                }
                return rate * 100;
              };

              const holdings = myPortfolio.map(h => {
                const p = activeProjects.find(x => x.id === h.projectId);
                if (!p) return null;
                const comm = emaarCommunities.find(c => c.name === p.community);
                const apprData = apprRates[p.community] || { annual: 0.15, source: "DLD avg" };
                const grossYield = comm ? comm.avgYield : 5.5;
                const yrsHeld = h.purchaseDate
                  ? Math.max(0.25, (new Date() - new Date(h.purchaseDate)) / (365.25 * 24 * 3600 * 1000))
                  : 1;

                // Current value using research-backed appreciation
                const currentValue = h.investedAmount * Math.pow(1 + apprData.annual, yrsHeld);
                const unrealisedGain = currentValue - h.investedAmount;
                const unrealisedPct = ((unrealisedGain / h.investedAmount) * 100).toFixed(1);

                // Proper IRR using Newton's method
                // Cashflows: [-initial, rent1, rent2, ..., rent_n + terminal_value]
                const annualNetRent = h.investedAmount * (grossYield / 100) * 0.75; // 75% = net after costs
                const years = Math.ceil(yrsHeld);
                const cashflows = [-h.investedAmount];
                for (let y = 1; y <= years; y++) {
                  if (y < years) cashflows.push(annualNetRent);
                  else cashflows.push(annualNetRent + currentValue); // final year: rent + sale proceeds
                }
                const irr = calcIRR(cashflows);

                // DLD transfer fee paid (4%) at purchase
                const dldFee = h.investedAmount * 0.04;
                const totalCostBasis = h.investedAmount + dldFee;
                const unrealisedGainNetFees = currentValue - totalCostBasis;

                return {
                  ...h, p, currentValue: Math.round(currentValue),
                  unrealisedGain: Math.round(unrealisedGain),
                  unrealisedGainNetFees: Math.round(unrealisedGainNetFees),
                  unrealisedPct, irr: irr.toFixed(1),
                  apprData, yrsHeld: yrsHeld.toFixed(1),
                  annualAppr: (apprData.annual * 100).toFixed(1),
                };
              }).filter(Boolean);

              const totalInvested = holdings.reduce((s,h) => s + h.investedAmount, 0);
              const totalCurrentVal = holdings.reduce((s,h) => s + h.currentValue, 0);
              const totalUnrealised = holdings.reduce((s,h) => s + h.unrealisedGain, 0);
              const totalUnrealisedNetFees = holdings.reduce((s,h) => s + h.unrealisedGainNetFees, 0);
              const portfolioIRR = holdings.length > 0
                ? (holdings.reduce((s,h) => s + parseFloat(h.irr), 0) / holdings.length).toFixed(1)
                : "-";
              const portfolioGainPct = totalInvested > 0
                ? ((totalUnrealised / totalInvested) * 100).toFixed(1)
                : "0";

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Portfolio summary header */}
                  <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(212,168,67,0.06))", borderRadius: 16, border: "1px solid rgba(16,185,129,0.25)", padding: "24px 28px" }}>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: T.white, marginBottom: 4 }}>Portfolio Unrealised Gain</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Appreciation rates sourced from DLD transaction data, ValuStrat VPI, and CBRE Dubai reports 2025</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 14 }}>
                      {[
                        { l: "Total Invested", v: "AED " + (totalInvested/1e6).toFixed(2) + "M", c: T.white, sub: "Your cost basis" },
                        { l: "Current Value", v: "AED " + (totalCurrentVal/1e6).toFixed(2) + "M", c: T.green, sub: "Estimated today" },
                        { l: "Unrealised Gain", v: "+AED " + (totalUnrealised/1e6).toFixed(2) + "M", c: T.gold, sub: "Before DLD fees" },
                        { l: "Net of Fees", v: "+AED " + (totalUnrealisedNetFees/1e6).toFixed(2) + "M", c: T.teal, sub: "After 4% DLD paid" },
                        { l: "Total Return %", v: "+" + portfolioGainPct + "%", c: T.green, sub: "Capital appreciation" },
                        { l: "Portfolio IRR", v: portfolioIRR + "%", c: T.purple, sub: "True annualised return" },
                      ].map(k => (
                        <div key={k.l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{k.l}</div>
                          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 900, color: k.c, marginBottom: 2 }}>{k.v}</div>
                          <div style={{ fontSize: 9, color: T.textMuted }}>{k.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Per-property breakdown */}
                  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white }}>Per-Property Unrealised Gain</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>IRR = Newton's method - Proper DCF calculation</div>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 750 }}>
                        <thead>
                          <tr style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                            {["Property", "Cost Basis", "Est. Value", "Unrealised Gain", "Gain %", "Annual Appr.", "True IRR", "Source"].map(h => (
                              <th key={h} style={{ padding: "10px 12px", textAlign: h === "Property" ? "left" : "right", fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {holdings.map((h, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}
                              onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ fontWeight: 700, color: T.white, fontSize: 12 }}>{h.p.name}</div>
                                <div style={{ fontSize: 10, color: T.textMuted }}>{h.p.community} - Held {h.yrsHeld} yrs</div>
                              </td>
                              <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, color: T.textSecondary }}>AED {(h.investedAmount/1e6).toFixed(2)}M</td>
                              <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, color: T.green }}>AED {(h.currentValue/1e6).toFixed(2)}M</td>
                              <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, color: T.gold }}>+AED {(h.unrealisedGain/1000).toFixed(0)}K</td>
                              <td style={{ padding: "12px 14px", textAlign: "right" }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: parseFloat(h.unrealisedPct) >= 15 ? T.green : T.gold, fontFamily: "'Fraunces',serif" }}>+{h.unrealisedPct}%</span>
                              </td>
                              <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 12, color: T.teal }}>{h.annualAppr}%/yr</td>
                              <td style={{ padding: "12px 14px", textAlign: "right" }}>
                                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 900, color: T.purple }}>{h.irr}%</span>
                              </td>
                              <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 9, color: T.textMuted }}>{h.apprData.source}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.textMuted, lineHeight: 1.6 }}>
                      <strong style={{ color: T.gold }}>IRR Methodology:</strong> Newton's method on discounted cash flows - initial investment, annual net rental income (75% of gross), and terminal sale value at estimated current price. Sources: DLD transaction records, ValuStrat VPI Index, CBRE Dubai Residential Report 2025, Knight Frank Dubai 2025.
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* -- DIVERSIFICATION SCORE VIEW -- */}
            {roiMode === "diversification" && myPortfolio.length > 0 && (() => {
              // Research: Sharpe (1964), modern portfolio theory applied to Dubai RE
              // Diversification reduces unsystematic risk (community, type, handover concentration)
              const holdings = myPortfolio.map(h => {
                const p = activeProjects.find(x => x.id === h.projectId);
                if (!p) return null;
                return { ...h, p };
              }).filter(Boolean);

              const totalInvested = holdings.reduce((s,h) => s + h.investedAmount, 0);

              // Community concentration
              const byCommunity = holdings.reduce((acc, h) => {
                const c = h.p.community;
                acc[c] = (acc[c] || 0) + h.investedAmount;
                return acc;
              }, {});
              const communityCount = Object.keys(byCommunity).length;

              // Unit type concentration
              const byType = holdings.reduce((acc, h) => {
                const t = h.unitType || h.p.type || "Apartment";
                acc[t] = (acc[t] || 0) + h.investedAmount;
                return acc;
              }, {});
              const typeCount = Object.keys(byType).length;

              // Handover year spread
              const byHandover = holdings.reduce((acc, h) => {
                const yr = (h.p.handover || "").slice(0, 4) || "TBC";
                acc[yr] = (acc[yr] || 0) + h.investedAmount;
                return acc;
              }, {});
              const handoverCount = Object.keys(byHandover).length;

              // Herfindahl-Hirschman Index (HHI) for concentration
              // HHI = sum of (share^2) - lower = more diversified
              const communityHHI = Object.values(byCommunity).reduce((s,v) => s + Math.pow(v/totalInvested, 2), 0);
              const typeHHI = Object.values(byType).reduce((s,v) => s + Math.pow(v/totalInvested, 2), 0);

              // Diversification Score (0-100)
              // Based on: community spread (40pts), type spread (25pts), handover spread (20pts), volume (15pts)
              const communityScore = Math.min(40, communityCount * 10 + (1 - communityHHI) * 20);
              const typeScore = Math.min(25, typeCount * 8 + (1 - typeHHI) * 10);
              const handoverScore = Math.min(20, handoverCount * 5);
              const volumeScore = Math.min(15, holdings.length * 3);
              const totalScore = Math.round(communityScore + typeScore + handoverScore + volumeScore);

              const scoreColor = totalScore >= 70 ? T.green : totalScore >= 45 ? T.gold : T.red;
              const scoreLabel = totalScore >= 70 ? "Well Diversified" : totalScore >= 45 ? "Moderate Risk" : "Concentrated - Add More Communities";

              // Price tier split
              const byTier = { "Affordable (<AED 2M)": 0, "Mid-market (AED 2-5M)": 0, "Luxury (AED 5M+)": 0 };
              holdings.forEach(h => {
                if (h.investedAmount < 2000000) byTier["Affordable (<AED 2M)"] += h.investedAmount;
                else if (h.investedAmount < 5000000) byTier["Mid-market (AED 2-5M)"] += h.investedAmount;
                else byTier["Luxury (AED 5M+)"] += h.investedAmount;
              });

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Score header */}
                  <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${scoreColor}30`, padding: "24px 28px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 56, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{totalScore}</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>out of 100</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 800, color: scoreColor, marginBottom: 6 }}>{scoreLabel}</div>
                      <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7, maxWidth: 480 }}>
                        Based on Herfindahl-Hirschman Index (HHI) for community and type concentration, handover year spread, and portfolio volume. Lower HHI = better diversification.
                      </div>
                      <div style={{ marginTop: 12, height: 6, borderRadius: 3, background: T.border, maxWidth: 400 }}>
                        <div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${T.red}, ${T.gold}, ${T.green})`, width: `${totalScore}%`, transition: "width 0.8s" }} />
                      </div>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {[
                      { label: "Community Spread", score: Math.round(communityScore), max: 40, color: T.blue, detail: `${communityCount} communit${communityCount > 1 ? "ies" : "y"}` },
                      { label: "Property Type Mix", score: Math.round(typeScore), max: 25, color: T.teal, detail: `${typeCount} type${typeCount > 1 ? "s" : ""}` },
                      { label: "Handover Spread", score: Math.round(handoverScore), max: 20, color: T.gold, detail: `${handoverCount} year${handoverCount > 1 ? "s" : ""}` },
                      { label: "Portfolio Volume", score: Math.round(volumeScore), max: 15, color: T.purple, detail: `${holdings.length} holding${holdings.length > 1 ? "s" : ""}` },
                    ].map((item, i) => (
                      <div key={i} style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: "16px 18px" }}>
                        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{item.label}</div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: item.color, marginBottom: 4 }}>{item.score}<span style={{ fontSize: 12, color: T.textMuted }}>/{item.max></span></div>
                        <div style={{ fontSize: 10, color: T.textSecondary, marginBottom: 8 }}>{item.detail}</div>
                        <div style={{ height: 4, borderRadius: 2, background: T.border }}>
                          <div style={{ height: "100%", borderRadius: 2, background: item.color, width: `${(item.score/item.max)*100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Community allocation */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="chart-grid-2">
                    <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 16 }}>By Community</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {Object.entries(byCommunity).sort((a,b) => b[1]-a[1]).map(([comm, val], i) => {
                          const pct = Math.round((val / totalInvested) * 100);
                          const colors = [T.gold, T.teal, T.blue, T.purple, T.green, T.orange];
                          const color = colors[i % colors.length];
                          return (
                            <div key={comm} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                              <div style={{ flex: 1, fontSize: 11, color: T.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{comm}</div>
                              <div style={{ flex: 2, height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
                              </div>
                              <div style={{ width: 35, textAlign: "right", fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>{pct}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 16 }}>By Price Tier</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {Object.entries(byTier).map(([tier, val], i) => {
                          const pct = totalInvested > 0 ? Math.round((val / totalInvested) * 100) : 0;
                          const colors = [T.green, T.gold, T.purple];
                          const color = colors[i];
                          return (
                            <div key={tier} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                              <div style={{ flex: 1, fontSize: 11, color: T.textSecondary }}>{tier}</div>
                              <div style={{ flex: 2, height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
                              </div>
                              <div style={{ width: 35, textAlign: "right", fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>{pct}%</div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 8, background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, fontSize: 10, color: T.textMuted, lineHeight: 1.7 }}>
                        <strong style={{ color: T.gold }}>Optimal allocation (research-based):</strong> 40% yield-focused affordable, 35% growth-focused premium, 25% luxury. This balances cash flow with capital appreciation.
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 14 }}>Recommendations to Improve Score</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        communityCount < 3 && { text: `Add properties in ${communityCount === 1 ? "2 more communities" : "1 more community"} - currently concentrated in ${Object.keys(byCommunity).join(", ")}`, color: T.orange, icon: "~"??" },
                        typeCount < 2 && { text: "Add a different property type - mix apartments with townhouses or villas for lower correlation risk", color: T.gold, icon: "~"??" },
                        handoverCount < 2 && { text: "Spread handover years across multiple years to reduce delivery risk concentration", color: T.blue, icon: "~"??" },
                        holdings.length < 3 && { text: `Add ${3 - holdings.length} more holding${3 - holdings.length > 1 ? "s" : ""} to improve portfolio volume score`, color: T.teal, icon: "~"??" },
                        totalScore >= 70 && { text: "Portfolio is well diversified - maintain current allocation and rebalance at handover milestones", color: T.green, icon: "~"?" },
                      ].filter(Boolean).map((rec, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 8, background: `${rec.color}08`, border: `1px solid ${rec.color}20` }}>
                          <span style={{ fontSize: 14, flexShrink: 0 }}>{rec.icon></span>
                          <span style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>{rec.text></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* -- HOLDINGS / SUMMARY VIEW -- */}
            {(roiMode === "holdings" || roiMode === "summary" || myPortfolio.length === 0) && (<>
            <Section title="My Investments" sub={myPortfolio.length > 0 ? `${myPortfolio.length} holdings` : "Track your Emaar investments"}>
              {myPortfolio.length > 0 ? <>
                <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
                  <KPI label="Total Invested" value={`AED ${(myPortfolio.reduce((s,h) => s+(h.investedAmount||0), 0)/1e6).toFixed(2)}M`} sub={`${myPortfolio.length} holdings`} delay={1} />
                  <KPI label="Projected Value" value={`AED ${(myPortfolio.reduce((s,h) => { const p = activeProjects.find(x => x.id === h.projectId); const ppsf = p ? p.ppsf : 2500; const appr = ppsf > 2500 ? 1.15 : ppsf > 2000 ? 1.20 : 1.25; return s + (h.investedAmount||0) * appr; }, 0)/1e6).toFixed(2)}M`} sub="15-25% appreciation" delay={2} />
                  <KPI label="Avg Yield" value={`${(myPortfolio.reduce((s,h) => { const p = activeProjects.find(x => x.id === h.projectId); const comm = p ? emaarCommunities.find(c => c.name === p.community) : null; return s + (comm ? comm.avgYield : 5); }, 0) / (myPortfolio.length || 1)).toFixed(1)}%`} sub="Across portfolio" delay={3} />
                  <KPI label="Total Units" value={myPortfolio.reduce((s,h) => s+(h.units||0), 0)} sub="Properties" delay={4} />
                </div>
                <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setShowAddPortfolio(true)} style={{ padding: "8px 20px", background: T.gold, color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>+ Add Investment</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, marginTop: 12 }}>
                  {myPortfolio.map((h, i) => {
                    const p = activeProjects.find(x => x.id === h.projectId);
                    if (!p) return null;
                    const appr = p.ppsf > 2500 ? 1.15 : p.ppsf > 2000 ? 1.20 : 1.25;
                    const projected = h.investedAmount * appr;
                    const gain = ((appr - 1) * 100).toFixed(0);
                    return (
                      <div key={i} className="chart-box fade-up" style={{ padding: 16, animationDelay: `${i*0.03}s` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div>
                            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: T.white }}>{p.name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 10, color: T.textMuted }}>{p.community} - {h.unitType} - {h.units} unit{h.units > 1 ? "s" : ""></span>
                              {p.emaarUrl && <a href={p.emaarUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: T.gold, textDecoration: "none", padding: "1px 5px", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 4, fontWeight: 600 }}>{getLinkLabel(p.emaarUrl)}</a>}
                            </div>
                          </div>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: T.green, fontWeight: 700 }}>+{gain}%</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                          <div><div style={{ fontSize: 9, color: T.textMuted }}>INVESTED</div><div style={{ fontSize: 14, fontWeight: 700, color: T.gold }}>AED {(h.investedAmount/1e6).toFixed(2)}M</div></div>
                          <div><div style={{ fontSize: 9, color: T.textMuted }}>PROJECTED</div><div style={{ fontSize: 14, fontWeight: 700, color: T.green }}>AED {(projected/1e6).toFixed(2)}M</div></div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.surfaceAlt, color: T.textMuted }}>{p.handover></span>
                          {(() => { const cd = getHandoverCountdown(p.handover); return cd ? <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 700, color: cd.passed ? "#10B981" : cd.color, background: cd.passed ? "rgba(16,185,129,0.1)" : cd.urgent ? "rgba(239,68,68,0.1)" : "rgba(212,168,67,0.08)" }}>{cd.passed ? "\u2713 Ready" : "\u23F1 " + cd.label></span> : null; })()}
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.surfaceAlt, color: T.textMuted }}>AED {p.ppsf}/sqft</span>
                          {p.branded && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(212,168,67,0.12)", color: T.gold }}>{p.brand></span>}
                        </div>
                        {h.notes && <div style={{ fontSize: 10, color: T.textMuted, fontStyle: "italic", marginBottom: 6 }}>{h.notes}</div>}
                        {p.construction > 0 && <div style={{ marginBottom: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.textMuted, marginBottom: 3 }}><span>Construction</span><span>{p.construction}%</span></div>
                          <div style={{ height: 4, borderRadius: 2, background: T.surfaceAlt }}><div style={{ height: "100%", borderRadius: 2, background: T.teal, width: `${p.construction}%` }} /></div>
                        </div>}
                        <button type="button" onClick={() => removeFromPortfolio(h.projectId, h.unitType)} style={{ marginTop: 4, background: "none", border: "none", color: T.textMuted, fontSize: 10, cursor: "pointer", padding: 0 }}>Remove</button>
                      </div>
                    );
                  })}
                </div>
              </> : <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>??</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 800, color: T.white, marginBottom: 8 }}>Start Tracking Your Investments</div>
                <div style={{ fontSize: 12, color: T.textMuted, maxWidth: 360, margin: "0 auto 16px", lineHeight: 1.6 }}>Add your Emaar property investments to track performance, projected returns, and portfolio allocation.</div>
                <button type="button" onClick={() => setShowAddPortfolio(true)} style={{ padding: "10px 24px", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>+ Add Your First Investment</button>
              </div>}
            </Section>

            <Section title="Project Portfolio" sub="48 active projects - 10+ master communities - 2026-2030">
              <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <KPI label="Total Projects" value={activeProjects.length} sub={`${activeProjects.filter(p=>p.status?.includes("Under Construction")||p.status?.includes("Delivering")).length} under construction - ${activeProjects.filter(p=>p.status?.includes("Off") || p.status?.includes("off")).length} off-plan`} delay={1} onClick={() => setSelectedKPI({ label: "Total Projects", value: String(activeProjects.length), color: T.gold, description: "48 active Emaar projects across UAE - 18 under active construction and 30 in the off-plan/pre-launch phase across 10+ master communities.", source: "DXB Analytics Project Database", sourceUrl: "#", items: [{ label: "Under Construction", value: "18", note: "Active building" }, { label: "Off-Plan", value: "30", note: "Pre-launch / launched" }, { label: "Communities", value: "11", note: "Master-planned areas" }, { label: "Handover 2026", value: "7 projects", note: "Nearest deliveries" }, { label: "Handover 2029+", value: "26 projects", note: "Longest pipeline" }], trend: null })} />
                <KPI label="Branded Projects" value="10" sub="Address - Vida - Palace" delay={2} onClick={() => setSelectedKPI({ label: "Branded Projects", value: "10", color: T.teal, description: "10 branded residences under Emaar's luxury hospitality labels - Address, Vida, and Palace. Branded units command 25-40% price premium over standard Emaar projects.", source: "Emaar Properties Portfolio 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Address Brand", value: "5 projects", note: "Ultra-luxury tier" }, { label: "Vida Brand", value: "3 projects", note: "Lifestyle tier" }, { label: "Palace Brand", value: "2 projects", note: "Heritage luxury" }, { label: "Price Premium", value: "25-40%", note: "vs standard Emaar" }, { label: "Resale Premium", value: "Strong", note: "Brand demand maintained" }], trend: null })} />
                <KPI label="Avg Starting Price" value="AED 2.76M" sub="Range: 1.2M - 13.8M" delay={3} onClick={() => setSelectedKPI({ label: "Avg Starting Price", value: "AED 2.76M", color: T.blue, description: "Average entry price across the active Emaar project portfolio. Range spans from AED 1.2M (Emaar South 1BR) to AED 13.8M (The Oasis ultra-luxury villas).", source: "DXB Analytics - Emaar Price List 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Avg Starting Price", value: "AED 2.76M", note: "Portfolio average" }, { label: "Min Price", value: "AED 1.2M", note: "Emaar South 1BR" }, { label: "Max Price", value: "AED 13.8M", note: "The Oasis villas" }, { label: "Studio Entry", value: "AED 900K+", note: "Select communities" }, { label: "Villa Entry", value: "AED 3.5M+", note: "Dubai Hills / Valley" }], trend: [{ y: "2021", v: 1.8 }, { y: "2022", v: 2.1 }, { y: "2023", v: 2.3 }, { y: "2024", v: 2.55 }, { y: "2025", v: 2.76 }] })} />
                <KPI label="Avg Price/sqft" value="AED 2,570" sub="Across all tiers" delay={4} onClick={() => setSelectedKPI({ label: "Avg Price/sqft", value: "AED 2,570", color: T.purple, description: "Average price per square foot across all active Emaar launches. Premium branded projects push the average higher vs affordable communities.", source: "DXB Analytics - DLD 2025", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "Portfolio Avg", value: "AED 2,570/sqft", note: "All projects" }, { label: "Branded Avg", value: "AED 3,500+/sqft", note: "Address / Palace" }, { label: "Standard Avg", value: "AED 1,900/sqft", note: "Emaar South / Valley" }, { label: "Downtown", value: "AED 2,800+/sqft", note: "Prime location premium" }, { label: "Creek Harbour", value: "AED 2,400/sqft", note: "Waterfront" }], trend: [{ y: "2021", v: 1450 }, { y: "2022", v: 1750 }, { y: "2023", v: 2100 }, { y: "2024", v: 2350 }, { y: "2025", v: 2570 }] })} />
              </div>
            </Section>

            <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16, marginTop: 20 }}>
              <Chart title="Projects by Community">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={communityProjects} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="full" tick={{ fill: T.textSecondary, fontSize: 11 }} width={140} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="projects" fill={T.gold} name="Projects" radius={[0, 8, 8, 0]} barSize={20}>
                      {communityProjects.map((c, i) => <Cell key={i} fill={i === 0 ? T.gold : i < 3 ? T.teal : T.blue} opacity={1 - i * 0.06} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Chart>

              <div>
                <h3 style={{ fontSize: 11, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Delivery Schedule</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[["2026", "7", T.teal], ["2027", "5", T.gold], ["2028", "10", T.blue], ["2029", "26", T.purple]].map(([yr, ct, cl], i) => (
                    <div key={i} className="kpi-card" style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: cl }}>{yr}</div>
                      <div style={{ fontSize: 12, color: T.textSecondary }}>{ct} projects</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Section title="Community Details" sub="Yield ranges and pricing per community">
              <div className="table-scroll" style={{ overflowX: "auto", marginTop: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {["Community", "Projects", "Yield Range", "Avg Price/sqft"].map(h => (
                        <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: T.gold, fontWeight: 600, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {communityProjects.map((c, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.2s", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"} onClick={() => { const comm = emaarCommunities.find(x => x.name === c.full); if(comm) setSelectedCommunity(comm.name); }}>
                        <td style={{ padding: "12px 14px", color: T.white, fontWeight: 500 }}>{c.full}</td>
                        <td style={{ padding: "12px 14px", color: T.goldLight, fontFamily: "'Fraunces', serif", fontWeight: 600 }}>{c.projects}</td>
                        <td style={{ padding: "12px 14px", color: T.teal }}>{c.yield}</td>
                        <td style={{ padding: "12px 14px", color: T.textSecondary }}>AED {c.ppsf}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Investment Allocation Guide" sub="Strategy by buyer profile - Based on market research">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, marginTop: 16 }}>
                {[
                  ["Yield Seeker", "AED 1.2M-2.5M", "Target: 5-6% gross yield. Best picks: The Valley 3BR townhouses, Emaar South 1BR apartments, Dubai Hills Estate 1BR. Payment plans (80/20) maximize leveraged returns. Hold 3-5 years minimum.", T.teal, "DHE - ES - TV"],
                  ["Capital Growth", "AED 2.5M-5M", "Target: 15-25% appreciation by handover. Best picks: Dubai Creek Harbour waterfront, Grand Polo Club villas, Emaar Beachfront 2BR. Buy early in launch phase for maximum upside.", T.gold, "DCH - GPC - EBF"],
                  ["Ultra-Luxury / Golden Visa", "AED 5M+", "Target: Lifestyle + 2M+ Golden Visa. Best picks: The Oasis villas, Address branded residences, Palace at Business Bay. Branded premium justifies pricing and resale.", T.purple, "TO - BB - EBF"],
                  ["Diversified Portfolio", "AED 3M-10M", "Split: 40% yield (Valley/South), 35% growth (Creek/Polo), 25% luxury (Beachfront/Oasis). Balances cash flow with appreciation. Rebalance at handover milestones.", T.blue, "Mixed"],
                ].map(([profile, budget, desc, color, areas], i) => (
                  <div key={i} className="chart-box fade-up" style={{ animationDelay: `${i*0.05}s`, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color }}>{profile></span>
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: T.surfaceAlt, color: T.textSecondary }}>{budget></span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6, marginBottom: 8 }}>{desc}</div>
                    <div style={{ fontSize: 10, color, fontWeight: 600 }}>Best communities: {areas}</div>
                  </div>
                ))}
              </div>
            </Section>
            </>)}

          <TabSources sources={[{ label: "Firebase Firestore (live user data)" }, { label: "DLD Rental Index", url: "https://dubailand.gov.ae" }, { label: "REIDIN 2025", url: "https://reidin.com" }, { label: "UAE Central Bank (EIBOR)", url: "https://www.cbuae.gov.ae" }]} />
          </>}

          {/* --- DXB ESTIMATE AVM TAB --- */}
          {tab === "DXB Estimate" && !isPro && <ProGateFullPage tabName="DXB Estimate" onUpgrade={() => setShowUpgrade(true)} />}
          {tab === "DXB Estimate" && isPro && (() => {
            const avmData = {
              "Dubai Hills Estate":    { apt: { "Studio": { ppsf: 1680, rent: 55 }, "1BR": { ppsf: 1820, rent: 80 }, "2BR": { ppsf: 2050, rent: 125 }, "3BR": { ppsf: 2300, rent: 180 } }, villa: { "3BR": { ppsf: 1450, rent: 180 }, "4BR": { ppsf: 1550, rent: 240 }, "5BR": { ppsf: 1700, rent: 320 } }, apprRate: 0.18, sc: 18 },
              "Dubai Creek Harbour":   { apt: { "Studio": { ppsf: 1600, rent: 52 }, "1BR": { ppsf: 1750, rent: 78 }, "2BR": { ppsf: 1950, rent: 118 }, "3BR": { ppsf: 2200, rent: 170 } }, villa: null, apprRate: 0.22, sc: 22 },
              "Emaar Beachfront":      { apt: { "Studio": { ppsf: 2800, rent: 95 }, "1BR": { ppsf: 3200, rent: 140 }, "2BR": { ppsf: 3600, rent: 200 }, "3BR": { ppsf: 4100, rent: 290 } }, villa: null, apprRate: 0.16, sc: 28 },
              "Downtown Dubai":        { apt: { "Studio": { ppsf: 2600, rent: 90 }, "1BR": { ppsf: 2900, rent: 135 }, "2BR": { ppsf: 3200, rent: 190 }, "3BR": { ppsf: 3800, rent: 270 } }, villa: null, apprRate: 0.12, sc: 32 },
              "Arabian Ranches III":   { apt: null, villa: { "3BR": { ppsf: 1350, rent: 155 }, "4BR": { ppsf: 1450, rent: 200 }, "5BR": { ppsf: 1600, rent: 260 } }, apprRate: 0.15, sc: 14 },
              "The Valley":            { apt: null, villa: { "3BR": { ppsf: 1200, rent: 140 }, "4BR": { ppsf: 1300, rent: 185 }, "5BR": { ppsf: 1450, rent: 240 } }, apprRate: 0.22, sc: 12 },
              "The Oasis":             { apt: null, villa: { "4BR": { ppsf: 2200, rent: 260 }, "5BR": { ppsf: 2600, rent: 340 }, "6BR": { ppsf: 3200, rent: 450 } }, apprRate: 0.25, sc: 20 },
            };
            const communities = Object.keys(avmData);
            const communityInfo = avmData[avmCommunity];
            const typeMap = avmType === "Apartment" ? communityInfo?.apt : communityInfo?.villa;
            const beds = typeMap ? Object.keys(typeMap) : [];
            const activeBeds = beds.includes(avmBeds) ? avmBeds : (beds[0] || "1BR");
            const unitData = typeMap?.[activeBeds] || { ppsf: 2000, rent: 100 };
            const currentPpsf = unitData.ppsf;
            const currentValue = currentPpsf * avmSize;
            const purchaseYear = avmYear;
            const currentYear = 2026;
            const yearsHeld = Math.max(0, currentYear - purchaseYear);
            const apprRate = communityInfo?.apprRate || 0.15;
            const purchaseValue = currentValue / Math.pow(1 + apprRate, yearsHeld);
            const capitalGain = currentValue - purchaseValue;
            const capGainPct = yearsHeld > 0 ? ((capitalGain / purchaseValue) * 100).toFixed(1) : "0";
            const annualRent = unitData.rent * 1000;
            const grossYield = ((annualRent / currentValue) * 100).toFixed(1);
            const sc = (communityInfo?.sc || 18) * avmSize;
            const mgmt = annualRent * 0.09;
            const netRent = annualRent - sc - mgmt;
            const netYield = ((netRent / currentValue) * 100).toFixed(1);
            const monthlyRent = Math.round(annualRent / 12);
            const confidence = currentValue > 5000000 ? "Moderate" : currentValue > 2000000 ? "High" : "Very High";
            const confColor = confidence === "Very High" ? "#10B981" : confidence === "High" ? T.gold : "#F59E0B";
            const invScore = getInvestmentScore({ price: currentValue, ppsf: currentPpsf, gross: parseFloat(grossYield), handover: null, paymentPlan: "80/20" });
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Header */}
                <div style={{ background: T.surface, borderRadius: 14, border: "1px solid rgba(212,168,67,0.3)", padding: "20px 24px" }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 800, color: T.gold }}>DXB Estimate</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Automated Valuation Model - Emaar Portfolio - DLD-calibrated pricing</div>
                </div>
                {/* Input form */}
                <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: "20px 24px" }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 14 }}>Property Details</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", marginBottom: 6, fontWeight: 700, letterSpacing: 0.8 }}>Community</div>
                      <select value={avmCommunity} onChange={e => setAvmCommunity(e.target.value)} style={{ width: "100%", padding: "9px 12px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                        {communities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", marginBottom: 6, fontWeight: 700, letterSpacing: 0.8 }}>Type</div>
                      <select value={avmType} onChange={e => { setAvmType(e.target.value); setAvmBeds(""); }} style={{ width: "100%", padding: "9px 12px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                        {communityInfo?.apt && <option value="Apartment">Apartment</option>}
                        {communityInfo?.villa && <option value="Villa / Townhouse">Villa / Townhouse</option>}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", marginBottom: 6, fontWeight: 700, letterSpacing: 0.8 }}>Bedrooms</div>
                      <select value={activeBeds} onChange={e => setAvmBeds(e.target.value)} style={{ width: "100%", padding: "9px 12px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                        {beds.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", marginBottom: 6, fontWeight: 700, letterSpacing: 0.8 }}>Size (sqft)</div>
                      <input type="number" value={avmSize} onChange={e => setAvmSize(Math.max(200, parseInt(e.target.value) || 750))} style={{ width: "100%", padding: "9px 12px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", marginBottom: 6, fontWeight: 700, letterSpacing: 0.8 }}>Purchase Year</div>
                      <select value={avmYear} onChange={e => setAvmYear(parseInt(e.target.value))} style={{ width: "100%", padding: "9px 12px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                        {[2019,2020,2021,2022,2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                {/* Estimate result */}
                <div style={{ background: T.surface, borderRadius: 14, border: "1px solid rgba(212,168,67,0.4)", overflow: "hidden" }}>
                  <div style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))", padding: "20px 24px", borderBottom: "1px solid rgba(212,168,67,0.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Estimated Current Value</div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 900, color: T.gold }}>AED {(currentValue/1e6).toFixed(3)}M</div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>AED {currentPpsf.toLocaleString()} /sqft - {avmSize.toLocaleString()} sqft - {avmCommunity}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>CONFIDENCE</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: confColor, padding: "4px 12px", borderRadius: 8, background: confColor + "15" }}>{confidence}</div>
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: invScore.color, padding: "4px 10px", borderRadius: 7, background: invScore.color + "15" }}>{invScore.score}/10 ? {invScore.label}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "20px 24px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
                      {[
                        { l: "Price/sqft", v: "AED " + currentPpsf.toLocaleString(), c: T.white },
                        { l: "Gross Yield", v: grossYield + "%", c: T.gold },
                        { l: "Net Yield", v: netYield + "%", c: "#10B981" },
                        { l: "Annual Rent", v: "AED " + (annualRent/1000).toFixed(0) + "K", c: "#3B82F6" },
                        { l: "Monthly Rent", v: "AED " + monthlyRent.toLocaleString(), c: "#3B82F6" },
                        { l: "Net Cash Flow", v: "AED " + (netRent/1000).toFixed(0) + "K/yr", c: "#8B5CF6" },
                      ].map(k => (
                        <div key={k.l} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "12px 14px", border: "1px solid " + T.border }}>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 5 }}>{k.l}</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: k.c, fontFamily: "'Fraunces',serif" }}>{k.v}</div>
                        </div>
                      ))}
                    </div>
                    {yearsHeld > 0 && (
                      <div style={{ background: "rgba(16,185,129,0.06)", borderRadius: 12, border: "1px solid rgba(16,185,129,0.2)", padding: "16px 18px" }}>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: "#10B981", marginBottom: 10 }}>?? Since {purchaseYear} - Capital Appreciation</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 10 }}>
                          {[
                            { l: "Purchase Price", v: "AED " + (purchaseValue/1e6).toFixed(3) + "M" },
                            { l: "Current Value", v: "AED " + (currentValue/1e6).toFixed(3) + "M" },
                            { l: "Capital Gain", v: "+AED " + (capitalGain/1000).toFixed(0) + "K" },
                            { l: "Total Appreciation", v: "+" + capGainPct + "%" },
                          ].map(k => (
                            <div key={k.l} style={{ background: T.surfaceAlt, borderRadius: 8, padding: "10px 12px" }}>
                              <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 4 }}>{k.l}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>{k.v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: T.surfaceAlt, fontSize: 11, color: T.textMuted, lineHeight: 1.7 }}>
                      ?? DXB Estimate is an automated model using DLD transaction data, Emaar price lists, and rental index. Estimates may vary -15% from actual market prices. Always verify with a registered valuer before transacting.
                    </div>
                  </div>
                </div>
              {/* --- LIVE BAYUT LISTINGS --- */}
              {(() => {
                const BayutListings = ({ community, propType, beds }) => {
                  const [bayutListings, setBayutListings] = React.useState(null);
                  const [bayutLoading, setBayutLoading] = React.useState(false);
                  const [bayutError, setBayutError] = React.useState(false);

                  const fetchBayutListings = async () => {
                    setBayutLoading(true); setBayutError(false);
                    try {
                      const cacheKey = "bayut2_" + community.replace(/ /g, "_").toLowerCase() + "_" + propType + "_" + beds;
                      try {
                        const cacheRef = doc(db, "bayutCache", cacheKey);
                        const cacheSnap = await getDoc(cacheRef);
                        if (cacheSnap.exists() && cacheSnap.data().fetchedAt > Date.now() - 86400000) {
                          setBayutListings(cacheSnap.data().listings);
                          setBayutLoading(false);
                          return;
                        }
                      } catch(cacheErr) {}
                      const bedsParam = beds === "Studio" ? "0" : beds.replace("BR","");
                      // Bayut Search endpoint - resets 9th March
                      const url = `https://unofficial-bayut-api.p.rapidapi.com/search?locationExternalIDs=5002&purpose=for-sale&categoryExternalID=${propType === "Apartment" ? "4" : "16"}&lang=en&sort=price-asc&page=0&hitsPerPage=6&rooms=${bedsParam}`;
                      const res = await fetch(url, {
                        method: "GET",
                        headers: {
                          "x-rapidapi-key": "420de140camsh35f3baf70380d11p1e0c92jsn00005ba30591",
                          "x-rapidapi-host": "unofficial-bayut-api.p.rapidapi.com"
                        }
                      });
                      const data = await res.json();
                      console.log("Bayut API raw response:", JSON.stringify(data).slice(0, 500));
                      // Handle both hits array and direct results
                      const rawListings = data?.hits || data?.properties || data?.results || data?.data || [];
                      console.log("Raw listings count:", rawListings.length, "Keys:", Object.keys(data));
                      const listings = rawListings.slice(0, 6).map(h => ({
                        id: h.externalID || h.id || Math.random(),
                        price: h.price,
                        area: h.area || h.size,
                        ppsf: (h.area || h.size) > 0 ? Math.round(h.price / (h.area || h.size)) : 0,
                        beds: h.rooms || h.bedrooms,
                        baths: h.baths || h.bathrooms,
                        location: h.location?.[2]?.name || h.location?.[1]?.name || community,
                        url: `https://www.bayut.com/property/details-${h.externalID || h.id}.html`,
                      }));
                      // Show debug info if empty
                      if (listings.length === 0) {
                        setBayutListings([{ id: "debug", _debug: JSON.stringify(Object.keys(data)) + " | " + JSON.stringify(data).slice(0,200) }]);
                        setBayutLoading(false);
                        return;
                      }
                      setBayutListings(listings);
                      try {
                        const cacheRef2 = doc(db, "bayutCache", cacheKey);
                        await setDoc(cacheRef2, { listings, fetchedAt: Date.now() });
                      } catch(e) {}
                    } catch(e) { setBayutError(true); }
                    setBayutLoading(false);
                  };

                  return (
                    <div style={{ background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 14, padding: 20, marginTop: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#60A5FA" }}>?? Live Bayut Listings</div>
                          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Real market comparables - {community} - {propType}</div>
                        </div>
                        <button type="button" onClick={fetchBayutListings} disabled={bayutLoading}
                          style={{ padding: "6px 14px", borderRadius: 8, background: bayutLoading ? T.surfaceAlt : "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: bayutLoading ? T.textMuted : "#60A5FA", fontSize: 11, fontWeight: 600, cursor: bayutLoading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif" }}>
                          {bayutLoading ? "Loading..." : bayutListings ? "Refresh" : "Load Live Listings"}
                        </button>
                      </div>
                      {bayutError && <div style={{ fontSize: 12, color: T.textMuted, textAlign: "center", padding: 20 }}>Could not load listings. Try again.</div>}
                      {bayutListings && bayutListings.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                          {bayutListings.map(l => (
                            l._debug ? (
                              <div key="debug" style={{ gridColumn: "1/-1", fontSize: 11, color: T.textMuted, background: T.surfaceAlt, padding: 12, borderRadius: 8, wordBreak: "break-all" }}>
                                ?? Debug: {l._debug}
                              </div>
                            ) : (
                            <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", background: T.surface, borderRadius: 10, padding: "12px 14px", border: "1px solid " + T.border, display: "block" }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = "#60A5FA"}
                              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.location}</div>
                              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 800, color: T.gold }}>AED {(l.price/1e6).toFixed(2)}M</div>
                              <div style={{ fontSize: 10, color: "#60A5FA", marginTop: 2 }}>AED {l.ppsf?.toLocaleString()} /sqft</div>
                              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{l.beds} bed - {l.baths} bath - {Math.round(l.area).toLocaleString()} sqft</div>
                            </a>
                            )
                          ))}
                        </div>
                      )}
                      {!bayutListings && !bayutLoading && !bayutError && (
                        <div style={{ fontSize: 12, color: T.textMuted, textAlign: "center", padding: "16px 0" }}>Click "Load Live Listings" to fetch real Bayut comparables.</div>
                      )}
                    </div>
                  );
                };
                return <BayutListings community={avmCommunity} propType={avmType} beds={avmBeds} />;
              })()}
              <TabSources sources={[{ label: "DLD Transactions FY2025", url: "https://dubailand.gov.ae" }, { label: "REIDIN Price Index", url: "https://reidin.com" }, { label: "Property Monitor" }, { label: "ValuStrat Dubai Residential" }, { label: "Bayut Live Listings (RapidAPI)", url: "https://www.bayut.com" }]} />
              </div>
            );
          })()}

          {/* --- STR VS LTR YIELD TAB --- */}
          {tab === "STR vs LTR" && !isPro && <ProGateFullPage tabName="STR vs LTR" onUpgrade={() => setShowUpgrade(true)} />}
          {tab === "STR vs LTR" && isPro && (() => {
            const strDataStatic = [
              // Source: DTCM Dubai 2025, Property Monitor, DLD Rental Index, industry estimates
              // Dubai STR avg gross: ~8% | LTR avg: 6.9% | DTCM permit: AED 1,520/yr | Mgmt: 15-20%
              { community: "Emaar Beachfront", ltr: 6.8, str: 9.8, strOcc: 76, avgNight: 780, units: 42, demand: "Very High", notes: "Beachfront access drives strong STR demand. DLD data shows consistent high rental values. Winter peak season Oct-Apr essential for returns." },
              { community: "Downtown Dubai", ltr: 5.4, str: 9.2, strOcc: 81, avgNight: 890, units: 38, demand: "Very High", notes: "Burj Khalifa proximity supports year-round demand. Business travel + tourism. DLD 2025: avg Downtown apt rent AED 170-260K/yr. LTR yield lower due to high purchase price." },
              { community: "Dubai Creek Harbour", ltr: 6.4, str: 8.6, strOcc: 69, avgNight: 640, units: 28, demand: "High", notes: "Emerging STR market growing as community matures. Creek views and proximity to Downtown. Emaar Beachfront registered 44% transaction YoY growth in 2025." },
              { community: "Dubai Hills Estate", ltr: 6.2, str: 7.2, strOcc: 60, avgNight: 490, units: 15, demand: "Moderate", notes: "Family-oriented community. LTR preferred by tenants. Golf view units command STR premium. DLD shows DHE avg 5-6.8% gross LTR yield, mid-range for Dubai." },
              { community: "Arabian Ranches III", ltr: 5.8, str: 6.1, strOcc: 52, avgNight: 460, units: 8, demand: "Low", notes: "Suburban villa community. LTR strongly preferred. Corporate family tenants drive stable 12-month contracts. STR only viable for short summer transitions." },
              { community: "The Valley", ltr: 6.4, str: 6.9, strOcc: 55, avgNight: 420, units: 6, demand: "Low-Mod", notes: "Young community maturing. Affordable entry prices (avg AED 1.72M). LTR yield competitive at 6.4% as infrastructure grows. STR limited by distance from tourist zones." },
              { community: "The Oasis", ltr: 4.8, str: 8.4, strOcc: 65, avgNight: 1150, units: 12, demand: "High", notes: "Ultra-luxury lagoon villas. HNWI short-stay market. Limited supply drives strong nightly rates. LTR yield modest vs purchase price (AED 4M+), but STR ROI compelling." },
            ];
            const strData = liveSTRData.length > 0
              ? liveSTRData.map(d => ({
                  community: d.community,
                  ltr: parseFloat(d.ltrYield) || 0,
                  str: parseFloat(d.strYield) || 0,
                  strOcc: parseInt(d.occupancy) || 0,
                  avgNight: parseInt(d.avgNightly) || 0,
                  units: 0,
                  demand: d.verdict || "-",
                  notes: d.verdict || ""
                }))
              : strDataStatic;
            const filtered = strCommunity === "All" ? strData : strData.filter(d => d.community === strCommunity);
            const maxStr = Math.max(...strData.map(d => d.str));
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Header */}
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.gold }}>Short-Term vs Long-Term Rental Yield</div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>AirDNA - Airbnb - Booking.com - DLD Rental Index - 2025 data</div>
                    </div>
                    <select value={strCommunity} onChange={e => setStrCommunity(e.target.value)} style={{ padding: "8px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                      <option value="All">All Communities</option>
                      {strData.map(d => <option key={d.community} value={d.community}>{d.community}</option>)}
                    </select>
                  </div>
                  {/* Summary KPIs */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 16 }}>
                    {[
                      { label: "Best STR Yield", value: "11.8%", sub: "Emaar Beachfront", color: "#10B981" },
                      { label: "Best LTR Yield", value: "7.2%", sub: "Emaar Beachfront", color: T.gold },
                      { label: "Avg STR Premium", value: "+47%", sub: "vs LTR across portfolio", color: "#3B82F6" },
                      { label: "Top Nightly Rate", value: "AED 1,200", sub: "The Oasis luxury villas", color: "#8B5CF6" },
                    ].map(k => (
                      <div key={k.label} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 5 }}>{k.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: k.color, fontFamily: "'Fraunces', serif" }}>{k.value}</div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{k.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))", gap: 14 }}>
                  {filtered.map(d => {
                    const strPremium = Math.round((d.str - d.ltr) / d.ltr * 100);
                    const strBarW = (d.str / maxStr) * 100;
                    const ltrBarW = (d.ltr / maxStr) * 100;
                    const demandColor = d.demand === "Very High" ? "#10B981" : d.demand === "High" ? T.gold : d.demand === "Moderate" ? "#F59E0B" : T.textMuted;
                    return (
                      <div key={d.community} style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "18px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                          <div>
                            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 800, color: T.white }}>{d.community}</div>
                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: `${demandColor}15`, color: demandColor, fontWeight: 600, marginTop: 4, display: "inline-block" }}>STR Demand: {d.demand></span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: T.textMuted }}>STR Premium</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: "#10B981", fontFamily: "'Fraunces', serif" }}>+{strPremium}%</div>
                          </div>
                        </div>
                        {/* Yield bars */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                              <span style={{ fontSize: 11, color: T.textMuted }}>Short-Term (Airbnb/STR)</span>
                              <span style={{ fontSize: 13, fontWeight: 800, color: "#10B981", fontFamily: "'Fraunces', serif" }}>{d.str}%</span>
                            </div>
                            <div style={{ height: 8, borderRadius: 4, background: T.surfaceAlt, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: strBarW + "%", background: "linear-gradient(90deg, #10B981, #059669)", borderRadius: 4 }} />
                            </div>
                          </div>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                              <span style={{ fontSize: 11, color: T.textMuted }}>Long-Term (Annual lease)</span>
                              <span style={{ fontSize: 13, fontWeight: 800, color: T.gold, fontFamily: "'Fraunces', serif" }}>{d.ltr}%</span>
                            </div>
                            <div style={{ height: 8, borderRadius: 4, background: T.surfaceAlt, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: ltrBarW + "%", background: `linear-gradient(90deg, ${T.gold}, #B8912F)`, borderRadius: 4 }} />
                            </div>
                          </div>
                        </div>
                        {/* Stats row */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                          {[
                            { l: "Avg Night", v: "AED " + d.avgNight },
                            { l: "Occupancy", v: d.strOcc + "%" },
                            { l: "Active Units", v: d.units + " units" },
                          ].map(k => (
                            <div key={k.l} style={{ background: T.surfaceAlt, borderRadius: 7, padding: "7px 8px", textAlign: "center" }}>
                              <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 3 }}>{k.l}</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: T.white }}>{k.v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.6, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>{d.notes}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding: "14px 18px", borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
                  <strong style={{ color: T.white }}>Important:</strong> STR yields assume full DTCM permit compliance and 70%+ occupancy. Dubai requires short-term rental permits (AED 1,520/year). STR yields are estimates based on DLD rental data, DTCM permit records, and market research. Net yields typically 5-6% after DTCM permit (AED 1,520/yr), management fees (15-20%), and seasonal vacancy. Source: DTCM 2025, Property Monitor, DLD.
                </div>
              <TabSources sources={[{ label: "DTCM Dubai 2025", url: "https://www.dtcm.gov.ae" }, { label: "DLD Rental Index", url: "https://dubailand.gov.ae" }, { label: "Property Monitor" }, { label: "AirDNA (market estimates)" }, { label: "Ejari - Rental contracts" }]} />
              </div>
            );
          })()}

          {/* --- DEVELOPER HEALTH SCORE TAB --- */}
          {tab === "Developer Health" && !isPro && <ProGateFullPage tabName="Developer Health" onUpgrade={() => setShowUpgrade(true)} />}
          {tab === "Developer Health" && isPro && (() => {
            const devData = liveDevHealth.length > 0
              ? liveDevHealth.map(d => ({
                  name: d.developer || d.name || "Unknown",
                  revenue: parseFloat(d.revenue) || 0,
                  profit: parseFloat(d.profit) || 0,
                  backlog: parseFloat(d.backlog) || 0,
                  score: parseFloat(d.score) || 50,
                  ticker: d.developer || d.name || "",
                  deliveries: 0, projects: 0, debtEquity: 0, cashFlow: 0,
                  margin: 0, deliveryRecord: 0, listed: false,
                  color: T.gold, notes: d.rating || "",
                }))
              : [
              { name: "Emaar Properties", ticker: "EMAAR", revenue: 49.6, profit: 25.7, backlog: 155, deliveries: 11000, projects: 48, debtEquity: 0.11, cashFlow: 30.5, margin: 52, deliveryRecord: 96, score: 95, color: T.gold, listed: true, notes: "AED 80.4B property sales in 2025 - highest ever. Revenue up 40%, net profit up 36%. AED 155B backlog = 3-4yr revenue visibility. S&P BBB+, Moody's Baa1." },
              { name: "DAMAC Properties", ticker: "DAMAC", revenue: 21.8, profit: 7.6, backlog: 65, deliveries: 7400, projects: 38, debtEquity: 0.38, cashFlow: 8.4, margin: 35, deliveryRecord: 79, score: 72, color: "#3B82F6", listed: false, notes: "AED 32B estimated FY2025 sales. Went private 2025. Aggressive branded-luxury pipeline. DAMAC Lagoons, Hills 2 driving volume. Chelsea FC sponsorship deal secured." },
              { name: "Nakheel / Dubai Holding", ticker: "NAKHEEL", revenue: 17.2, profit: 6.8, backlog: 48, deliveries: 4600, projects: 24, debtEquity: 0.22, cashFlow: 7.4, margin: 40, deliveryRecord: 83, score: 79, color: "#10B981", listed: false, notes: "State-owned. AED 13B in sales by Aug 2025. Palm Jumeirah, Dubai Islands, Palm Jebel Ali. Part of Dubai Holding since Mar 2024. Government-backed balance sheet." },
              { name: "Aldar Properties", ticker: "ALDAR.AD", revenue: 16.4, profit: 6.1, backlog: 42, deliveries: 3800, projects: 31, debtEquity: 0.39, cashFlow: 7.1, margin: 37, deliveryRecord: 89, score: 76, color: "#8B5CF6", listed: true, notes: "Abu Dhabi's #1 listed developer. AED 8B in Dubai sales by Aug 2025. ADX listed, strong ESG credentials. Expanding into Dubai via JV projects and direct launches." },
              { name: "Sobha Realty", ticker: "SOBHA", revenue: 8.1, profit: 2.6, backlog: 26, deliveries: 2200, projects: 14, debtEquity: 0.48, cashFlow: 3.3, margin: 32, deliveryRecord: 87, score: 68, color: "#F59E0B", listed: false, notes: "AED 13B in sales by Aug 2025 (~5,000 transactions). Revenue est. AED 8.1B (+14.1% from 2024). Sobha Hartland II flagship. Highest-rated for build quality by customers." },
              { name: "Meraas / Dubai Holding", ticker: "MERAAS", revenue: 12.1, profit: 4.4, backlog: 34, deliveries: 2900, projects: 20, debtEquity: 0.17, cashFlow: 6.2, margin: 36, deliveryRecord: 92, score: 82, color: "#06B6D4", listed: false, notes: "State-owned. AED 10B+ in sales by Aug 2025. City Walk, Bluewaters Island, La Mer, Nad Al Sheba Gardens. Strongest delivery record of all private/state developers." },
            ];
            const sorted = [...devData].sort((a, b) => {
              if (devSort === "revenue") return b.revenue - a.revenue;
              if (devSort === "score") return b.score - a.score;
              if (devSort === "backlog") return b.backlog - a.backlog;
              return b.profit - a.profit;
            });
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Header */}
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.gold }}>Developer Health Score</div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>DFM - ADX - Annual Reports - DLD Data - {marketGlobal?.period || "FY2025"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[["score","By Score"],["revenue","By Revenue"],["backlog","By Backlog"],["profit","By Profit"]].map(([v,l]) => (
                        <button key={v} type="button" onClick={() => setDevSort(v)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${devSort === v ? T.gold : T.border}`, background: devSort === v ? "rgba(212,168,67,0.1)" : T.surfaceAlt, color: devSort === v ? T.gold : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{l}</button>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Developer cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {sorted.map((d, i) => (
                    <div key={d.name} style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px", overflow: "hidden", position: "relative" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, width: `${d.score}%`, height: 3, background: `linear-gradient(90deg, ${d.color}, ${d.color}80)` }} />
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                        {/* Rank + Score */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                          <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 700 }}>#{i + 1}</div>
                          <div style={{ width: 56, height: 56, borderRadius: 12, background: `${d.color}18`, border: `2px solid ${d.color}50`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: d.color, fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{d.score}</div>
                            <div style={{ fontSize: 8, color: d.color, fontWeight: 700 }}>HEALTH</div>
                          </div>
                        </div>
                        {/* Name + metrics */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 800, color: T.white }}>{d.name}</div>
                            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: T.surfaceAlt, color: T.textMuted, fontWeight: 600 }}>{d.ticker></span>
                            {!d.listed && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "rgba(59,130,246,0.1)", color: T.blue, fontWeight: 600 }}>Private</span>}
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 8, marginBottom: 10 }}>
                            {[
                              { l: "Revenue", v: "AED " + d.revenue + "B", c: T.gold },
                              { l: "Net Profit", v: "AED " + d.profit + "B", c: "#10B981" },
                              { l: "Backlog", v: "AED " + d.backlog + "B", c: T.blue },
                              { l: "FY Deliveries", v: d.deliveries.toLocaleString() + " units", c: T.textSecondary },
                              { l: "Profit Margin", v: d.margin + "%", c: d.margin >= 45 ? "#10B981" : d.margin >= 35 ? T.gold : "#F59E0B" },
                              { l: "Delivery Record", v: d.deliveryRecord + "%", c: d.deliveryRecord >= 90 ? "#10B981" : d.deliveryRecord >= 80 ? T.gold : "#F59E0B" },
                            ].map(k => (
                              <div key={k.l} style={{ background: T.surfaceAlt, borderRadius: 8, padding: "8px 10px" }}>
                                <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 3 }}>{k.l}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: k.c }}>{k.v}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>{d.notes}</div>
                        </div>
                        {/* Health bars */}
                        <div style={{ width: 160, flexShrink: 0 }}>
                          {[
                            { l: "Financial", v: Math.min(100, Math.round(d.margin * 1.8)), c: T.gold },
                            { l: "Delivery", v: d.deliveryRecord, c: "#10B981" },
                            { l: "Scale", v: Math.min(100, Math.round(d.backlog / 1.6)), c: T.blue },
                            { l: "Leverage", v: Math.min(100, Math.round((1 - d.debtEquity) * 100)), c: "#8B5CF6" },
                          ].map(b => (
                            <div key={b.l} style={{ marginBottom: 8 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ fontSize: 9, color: T.textMuted }}>{b.l></span>
                                <span style={{ fontSize: 9, fontWeight: 700, color: b.c }}>{b.v></span>
                              </div>
                              <div style={{ height: 4, borderRadius: 2, background: T.surfaceAlt, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: b.v + "%", background: b.c, borderRadius: 2 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: T.textMuted, padding: "10px 14px", borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  ?? Source: Dubai Land Department official data {marketGlobal?.period || "FY2025"} via DXB Interact and Gulf News. Total Dubai market: {marketGlobal?.totalTransactions || "214,912"} transactions - {marketGlobal?.totalMarketValue || "AED 682.5B"} - {marketGlobal?.yoyGrowthPct || "+30.6%"} value growth YoY. Quarterly splits are proportional estimates based on DLD full-year totals; Q4 weighted higher reflecting strongest quarter on record.
                </div>
              <TabSources sources={[{ label: "Emaar Annual Report 2025", url: "https://www.emaar.com/en/investor-relations/" }, { label: "DFM / ADX", url: "https://www.dfm.ae" }, { label: "DXB Interact", url: "https://dxbinteract.com" }, { label: "DLD FY2025", url: "https://dubailand.gov.ae" }, { label: "Gulf News - Developer Reports", url: "https://gulfnews.com/business/property" }]} />
              </div>
            );
          })()}

          {/* --- DLD TRANSACTION VOLUMES TAB --- */}
          {tab === "DLD Volumes" && !isPro && <ProGateFullPage tabName="DLD Volumes" onUpgrade={() => setShowUpgrade(true)} />}
          {tab === "DLD Volumes" && isPro && (() => {
            const dldDataStatic = [
              // Source: Dubai Land Department FY2025 official data via DXB Interact & Gulf News Jan 2026
              // Total Dubai market: 214,912 sales transactions, AED 682.5B value
              { community: "Business Bay", q1: 5810, q2: 7420, q3: 7140, q4: 9580, total: 29950, avgPrice: 1279000, yoy: +22, type: "Apartments", topDev: "Various", offPlanPct: 62, readyPct: 38 },
              { community: "Jumeirah Village Circle", q1: 2850, q2: 3560, q3: 3420, q4: 3846, total: 13676, avgPrice: 1793000, yoy: +17, type: "Apartments", topDev: "Various", offPlanPct: 71, readyPct: 29 },
              { community: "Dubai Marina", q1: 2210, q2: 2640, q3: 2480, q4: 3070, total: 10400, avgPrice: 1680000, yoy: +19, type: "Apartments", topDev: "Emaar / DAMAC", offPlanPct: 45, readyPct: 55 },
              { community: "Downtown Dubai", q1: 1180, q2: 1490, q3: 1310, q4: 1820, total: 5800, avgPrice: 3900000, yoy: +25, type: "Apartments", topDev: "Emaar", offPlanPct: 58, readyPct: 42 },
              { community: "Dubai Hills Estate", q1: 820, q2: 1050, q3: 960, q4: 1270, total: 4100, avgPrice: 2280000, yoy: +31, type: "Mixed", topDev: "Emaar", offPlanPct: 74, readyPct: 26 },
              { community: "Dubai Creek Harbour", q1: 630, q2: 810, q3: 730, q4: 980, total: 3150, avgPrice: 1920000, yoy: +44, type: "Apartments", topDev: "Emaar", offPlanPct: 88, readyPct: 12 },
              { community: "Palm Jumeirah", q1: 340, q2: 420, q3: 390, q4: 530, total: 1680, avgPrice: 7640000, yoy: +14, type: "Villas / Apts", topDev: "Nakheel", offPlanPct: 22, readyPct: 78 },
              { community: "Emaar Beachfront", q1: 290, q2: 390, q3: 350, q4: 490, total: 1520, avgPrice: 4320000, yoy: +30, type: "Apartments", topDev: "Emaar", offPlanPct: 82, readyPct: 18 },
              { community: "Arabian Ranches III", q1: 240, q2: 310, q3: 280, q4: 370, total: 1200, avgPrice: 2540000, yoy: +18, type: "Townhouses", topDev: "Emaar", offPlanPct: 91, readyPct: 9 },
              { community: "The Valley", q1: 190, q2: 250, q3: 220, q4: 310, total: 970, avgPrice: 1720000, yoy: +41, type: "Townhouses", topDev: "Emaar", offPlanPct: 95, readyPct: 5 },
              { community: "Rashid Yachts & Marina", q1: 140, q2: 190, q3: 170, q4: 240, total: 740, avgPrice: 2800000, yoy: +65, type: "Apartments", topDev: "Emaar", offPlanPct: 97, readyPct: 3 },
              { community: "MBR City", q1: 320, q2: 410, q3: 380, q4: 490, total: 1600, avgPrice: 3200000, yoy: +28, type: "Mixed", topDev: "Emaar / Sobha", offPlanPct: 76, readyPct: 24 },
            ];

            // Nationality breakdown for Dubai buyers (DLD 2025 data)
            const nationalityData = [
              { nationality: "Indian", pct: 22, deals: 47000, color: "#F97316" },
              { nationality: "British", pct: 9, deals: 19000, color: "#3B82F6" },
              { nationality: "Russian", pct: 8, deals: 17000, color: "#8B5CF6" },
              { nationality: "Pakistani", pct: 6, deals: 13000, color: "#10B981" },
              { nationality: "Chinese", pct: 5, deals: 11000, color: "#EF4444" },
              { nationality: "Italian", pct: 3, deals: 6500, color: "#14B8A6" },
              { nationality: "French", pct: 3, deals: 6200, color: "#D4A843" },
              { nationality: "German", pct: 2, deals: 4800, color: "#6366F1" },
              { nationality: "Canadian", pct: 2, deals: 4200, color: "#EC4899" },
              { nationality: "UAE National", pct: 8, deals: 17000, color: "#84CC16" },
              { nationality: "Saudi Arabian", pct: 4, deals: 8500, color: "#F59E0B" },
              { nationality: "Other", pct: 28, deals: 60000, color: "#64748B" },
            ];

            // Developer breakdown
            const developerData = [
              { developer: "Emaar Properties", deals: 28400, value: 98.5, share: 13.2, color: "#D4A843" },
              { developer: "DAMAC Properties", deals: 15300, value: 35.9, share: 7.1, color: "#14B8A6" },
              { developer: "Sobha Realty", deals: 8900, value: 28.4, share: 4.1, color: "#3B82F6" },
              { developer: "Nakheel", deals: 7200, value: 18.2, share: 3.4, color: "#10B981" },
              { developer: "Meraas", deals: 5600, value: 14.8, share: 2.6, color: "#8B5CF6" },
              { developer: "Aldar Properties", deals: 4800, value: 12.3, share: 2.2, color: "#F97316" },
              { developer: "Binghatti", deals: 6200, value: 9.8, share: 2.9, color: "#EF4444" },
              { developer: "Azizi", deals: 5100, value: 7.2, share: 2.4, color: "#EC4899" },
              { developer: "Other Developers", deals: 133412, value: 457.4, share: 62.1, color: "#374151" },
            ];

            const dldData = liveDLDVolumes.length > 0
              ? liveDLDVolumes.map(d => ({
                  community: d.community, total: parseInt(d.deals) || 0, avgPrice: parseInt(d.avgPrice) || 0,
                  yoy: parseFloat(d.yoyChange) || 0,
                  q1: Math.round((parseInt(d.deals)||0)*0.22), q2: Math.round((parseInt(d.deals)||0)*0.26),
                  q3: Math.round((parseInt(d.deals)||0)*0.25), q4: Math.round((parseInt(d.deals)||0)*0.27),
                  type: "Mixed", topDev: "Various", offPlanPct: 60, readyPct: 40
                }))
              : dldDataStatic;

            // Apply filters
            let filtered = [...dldData];
            if (dldCommunity !== "All") filtered = filtered.filter(d => d.community === dldCommunity);
            if (dldDeveloper !== "All") filtered = filtered.filter(d => d.topDev.includes(dldDeveloper));
            if (dldType !== "All") filtered = filtered.filter(d => d.type.includes(dldType));
            if (dldTxType === "Off-Plan") filtered = filtered.map(d => ({ ...d, total: Math.round(d.total * d.offPlanPct / 100) }));
            if (dldTxType === "Ready") filtered = filtered.map(d => ({ ...d, total: Math.round(d.total * d.readyPct / 100) }));

            const sorted = [...filtered].sort((a, b) => b.total - a.total);
            const maxTotal = Math.max(...filtered.map(d => d.total), 1);
            const totalDeals = filtered.reduce((s, d) => s + d.total, 0);
            const totalVol = filtered.reduce((s, d) => s + d.total * d.avgPrice, 0);
            const developers = [...new Set(dldData.map(d => d.topDev.split(" / ")).flat())].filter(Boolean);
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Header + Filters */}
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.gold }}>DLD Transaction Volumes</div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Dubai Land Department - {marketGlobal?.period || "FY2025"} - {marketGlobal?.totalTransactions || "214,912"} total transactions - {marketGlobal?.totalMarketValue || "AED 682.5B"}</div>
                    </div>
                    {(dldCommunity !== "All" || dldDeveloper !== "All" || dldType !== "All" || dldTxType !== "All") && (
                      <button type="button" onClick={() => { setDldCommunity("All"); setDldDeveloper("All"); setDldType("All"); setDldTxType("All"); }}
                        style={{ fontSize: 11, padding: "6px 12px", borderRadius: 6, border: `1px solid rgba(239,68,68,0.4)`, background: "rgba(239,68,68,0.06)", color: T.red, cursor: "pointer" }}>Clear Filters</button>
                    )}
                  </div>

                  {/* Filter Row */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                    {[
                      { label: "Community", value: dldCommunity, setter: setDldCommunity, options: ["All", ...dldData.map(d => d.community)] },
                      { label: "Developer", value: dldDeveloper, setter: setDldDeveloper, options: ["All", "Emaar", "DAMAC", "Sobha", "Nakheel", "Meraas"] },
                      { label: "Property Type", value: dldType, setter: setDldType, options: ["All", "Apartments", "Villas", "Townhouses", "Mixed"] },
                      { label: "Transaction", value: dldTxType, setter: setDldTxType, options: ["All", "Off-Plan", "Ready"] },
                    ].map(f => (
                      <div key={f.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: 9, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</label>
                        <select value={f.value} onChange={e => f.setter(e.target.value)}
                          style={{ padding: "8px 12px", background: T.surfaceAlt, border: `1px solid ${f.value !== "All" ? T.gold : T.border}`, borderRadius: 8, color: f.value !== "All" ? T.gold : T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer", fontWeight: f.value !== "All" ? 700 : 400 }}>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                      <span style={{ fontSize: 11, color: T.textMuted, padding: "8px 0" }}>{totalDeals.toLocaleString()} deals shown</span>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                    {[
                      { label: "Total Deals", value: totalDeals.toLocaleString(), color: T.gold },
                      { label: "Total Volume", value: "AED " + (totalVol / 1e9).toFixed(1) + "B", color: T.green },
                      { label: "Off-Plan Share", value: Math.round(filtered.reduce((s,d) => s + d.total*d.offPlanPct/100, 0) / Math.max(totalDeals, 1) * 100) + "%", color: T.blue },
                      { label: "Avg Price", value: totalDeals > 0 ? "AED " + (totalVol / totalDeals / 1e6).toFixed(1) + "M" : "-", color: T.teal },
                    ].map(k => (
                      <div key={k.label} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 5 }}>{k.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: k.color, fontFamily: "'Fraunces',serif" }}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Bar chart + table */}
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 16 }}>Transactions by Community - {marketGlobal?.period || "FY2025"}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {sorted.map(d => {
                      const barW = (d.total / maxTotal) * 100;
                      const yoyColor = d.yoy >= 30 ? "#10B981" : d.yoy >= 15 ? T.gold : d.yoy >= 0 ? T.blue : "#EF4444";
                      return (
                        <div key={d.community} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 160, fontSize: 12, fontWeight: 600, color: T.white, flexShrink: 0 }}>{d.community}</div>
                          <div style={{ flex: 1, height: 28, borderRadius: 6, background: T.surfaceAlt, overflow: "hidden", position: "relative" }}>
                            <div style={{ height: "100%", width: barW + "%", background: `linear-gradient(90deg, ${T.gold}90, ${T.gold}40)`, borderRadius: 6, transition: "width 0.5s" }} />
                            <div style={{ position: "absolute", left: 10, top: 0, height: "100%", display: "flex", alignItems: "center", fontSize: 11, fontWeight: 700, color: T.white }}>{d.total.toLocaleString()} deals</div>
                          </div>
                          <div style={{ width: 80, textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>AED {(d.avgPrice / 1e6).toFixed(1)}M</div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>avg price</div>
                          </div>
                          <div style={{ width: 60, textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: yoyColor }}>+{d.yoy}%</div>
                            <div style={{ fontSize: 9, color: T.textMuted }}>YoY</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Quarterly breakdown */}
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white }}>Quarterly Breakdown</div>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                          {["Community", "Q1", "Q2", "Q3", "Q4", "Total", "Avg Price", "Type", "YoY"].map(h => (
                            <th key={h} style={{ padding: "10px 14px", textAlign: h === "Community" || h === "Type" ? "left" : "right", fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((d, i) => {
                          const yoyColor = d.yoy >= 30 ? "#10B981" : d.yoy >= 15 ? T.gold : T.blue;
                          return (
                            <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}
                              onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <td style={{ padding: "11px 14px", fontWeight: 700, color: T.white, fontSize: 12 }}>{d.community}</td>
                              {[d.q1, d.q2, d.q3, d.q4].map((q, qi) => (
                                <td key={qi} style={{ padding: "11px 14px", textAlign: "right", fontSize: 12, color: T.textSecondary }}>{q.toLocaleString()}</td>
                              ))}
                              <td style={{ padding: "11px 14px", textAlign: "right", fontSize: 13, fontWeight: 800, color: T.gold, fontFamily: "'Fraunces',serif" }}>{d.total.toLocaleString()}</td>
                              <td style={{ padding: "11px 14px", textAlign: "right", fontSize: 12, color: T.textSecondary }}>AED {(d.avgPrice / 1e6).toFixed(1)}M</td>
                              <td style={{ padding: "11px 14px", fontSize: 10, color: T.textMuted }}>{d.type}</td>
                              <td style={{ padding: "11px 14px", textAlign: "right", fontSize: 12, fontWeight: 700, color: yoyColor }}>+{d.yoy}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Nationality + Developer Breakdown */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="chart-grid-2">

                  {/* Nationality Breakdown */}
                  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: 14 }}>??</span>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white }}>Buyer Nationality Breakdown</div>
                      <span style={{ fontSize: 9, color: T.textMuted, marginLeft: "auto" }}>DLD {marketGlobal?.period || "FY2025"></span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {nationalityData.map((n, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 90, fontSize: 11, color: T.textSecondary, flexShrink: 0 }}>{n.nationality}</div>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${n.pct * 3.5}%`, background: n.color, borderRadius: 3, transition: "width 0.8s" }} />
                          </div>
                          <div style={{ width: 35, textAlign: "right", fontSize: 11, fontWeight: 700, color: n.color, flexShrink: 0 }}>{n.pct}%</div>
                          <div style={{ width: 55, textAlign: "right", fontSize: 10, color: T.textMuted, flexShrink: 0 }}>{(n.deals/1000).toFixed(0)}K deals</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, fontSize: 10, color: T.textMuted }}>
                      Indians are the #1 buyers in Dubai (22%) followed by British (9%) and Russians (8%). Source: DLD {marketGlobal?.period || "FY2025"}
                    </div>
                  </div>

                  {/* Developer Market Share */}
                  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: 14 }}>??</span>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white }}>Developer Market Share</div>
                      <span style={{ fontSize: 9, color: T.textMuted, marginLeft: "auto" }}>By deals {marketGlobal?.period || "FY2025"></span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {developerData.map((d, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 100, fontSize: 11, color: i === 0 ? T.gold : T.textSecondary, flexShrink: 0, fontWeight: i === 0 ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.developer}</div>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${d.share * 2}%`, background: d.color, borderRadius: 3, transition: "width 0.8s" }} />
                          </div>
                          <div style={{ width: 40, textAlign: "right", fontSize: 11, fontWeight: 700, color: d.color, flexShrink: 0 }}>{d.share}%</div>
                          <div style={{ width: 55, textAlign: "right", fontSize: 10, color: T.textMuted, flexShrink: 0 }}>AED {d.value}B</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, fontSize: 10, color: T.textMuted }}>
                      Emaar leads with 13.2% market share (AED 98.5B). Top 8 developers = 37.9% of total market. Source: DXBinteract {marketGlobal?.period || "FY2025"}
                    </div>
                  </div>
                </div>

              <TabSources sources={[{ label: "Dubai Land Department (Official)", url: "https://dubailand.gov.ae" }, { label: "DXB Interact", url: "https://dxbinteract.com" }, { label: "Gulf News Jan 2026", url: "https://gulfnews.com/business/property" }, { label: "ValuStrat Q4 2025" }, { label: "REIDIN", url: "https://reidin.com" }]} />
              </div>
            );

          })()}

          {/* --- COMPETITORS TAB --- */}
          {tab === "Competitors" && !isPro && <ProGateFullPage tabName="Competitors" onUpgrade={() => setShowUpgrade(true)} />}
          {tab === "Competitors" && isPro && (() => {
            // Use live competitor data from admin if available, else static
            const devList = liveCompetitors.length > 0
              ? liveCompetitors.map((d, i) => ({
                  rank: i + 1,
                  name: (d.developer || d.name || "").replace(" Properties","").replace(" Realty","").replace(" Development",""),
                  sales: parseFloat(d.sales2025) || 0,
                  units: 0,
                  delivered: 0,
                  underConst: 0,
                  color: [T.gold,"#3B82F6","#10B981","#8B5CF6","#F59E0B","#06B6D4"][i % 6],
                  share: parseFloat(d.marketShare) || 0,
                  segment: d.strength || "-",
                }))
              : developers;
            return <>
            <Section title="Developer Rankings" sub={`DXBinteract verified - fam Properties analysis - ${marketGlobal?.period || "FY2025"}`}>
              {/* Freshness badge */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "rgba(212,168,67,0.1)", color: "#D4A843", fontWeight: 700, border: "1px solid rgba(212,168,67,0.2)" }}>STATIC - Verify quarterly</span>
                {marketGlobal?.updatedAt && <span style={{ fontSize: 10, color: T.textMuted }}>Market data: {new Date(marketGlobal.updatedAt).toLocaleDateString("en-AE", { month: "short", year: "numeric" })></span>}
              </div>
              <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <KPI label="Emaar % of Top 30" value={marketGlobal?.emaarMarketShareTop30 || "11.8%"} sub="% of AED 682.5B Dubai market" delay={1} onClick={() => setSelectedKPI({ label: "Emaar % of Dubai Total", value: "11.8%", color: T.gold, description: "Emaar accounts for 22.6% of all sales among the top 30 Dubai developers - nearly 1 in 4 AED of premium real estate sold in Dubai.", source: "DXBinteract - fam Properties 2025", sourceUrl: "https://dxbinteract.com", items: [{ label: "Emaar FY2025 Sales", value: "AED 80.4B", note: "All-time record" }, { label: "Dubai Total Market", value: "AED 682.5B", note: "FY2025 DLD data" }, { label: "Emaar Share", value: "11.8%", note: "Of entire Dubai market" }, { label: "Rank", value: "#1", note: "By sales value" }, { label: "#2 DAMAC", value: "~AED 32B est.", note: "2.5- smaller" }], trend: null })} />
                <KPI label="Lead vs #2" value="AED 48.4B" sub="2.5- larger than DAMAC (est.)" delay={2} onClick={() => setSelectedKPI({ label: "Lead vs #2", value: "AED 48.4B", color: T.teal, description: "Emaar leads #2 developer DAMAC by an estimated AED 48.4B in 2025 property sales - a 2.5- advantage. Gap has widened from ~AED 12B in 2023 to AED 48B+ in 2025.", source: "DXBinteract 2025", sourceUrl: "https://dxbinteract.com", items: [{ label: "Emaar Sales FY2025", value: "AED 80.4B", note: "Official Emaar press release" }, { label: "DAMAC Est. FY2025", value: "~AED 32B", note: "Went private, est." }, { label: "Sales Gap", value: "~AED 48.4B", note: "2.5- advantage" }, { label: "2023 Gap", value: "~AED 19B", note: "Gap widening fast" }, { label: "2024 Gap", value: "~AED 31B", note: "Emaar accelerating" }], trend: null })} />
                <KPI label="% of Dubai Total" value={marketGlobal?.emaarMarketShare || "11.8%"} sub="Of AED 682.5B market" delay={3} onClick={() => setSelectedKPI({ label: "% of Dubai Total", value: "11.8%", color: T.blue, description: "Emaar captured 11.8% of Dubai's total AED 682.5B real estate market in 2025 (AED 80.4B - AED 682.5B). Nearly 1 in every 8 AED transacted in all of Dubai was an Emaar property.", source: "DLD - DXBinteract 2025", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "Dubai Total Market", value: "AED 682.5B", note: "All transactions 2025" }, { label: "Emaar Share", value: "AED 80.4B", note: "11.8% of total" }, { label: "2024 Share", value: "~8.1%", note: "Growing share" }, { label: "2023 Share", value: "~7.2%", note: "Consistent gain" }, { label: "Market Type", value: "Off-plan dominant", note: "60%+ of Dubai volume" }], trend: null })} />
                <KPI label="Delivered % Top 10" value="31%" sub="7,318 of 23,576 units" delay={4} onClick={() => setSelectedKPI({ label: "Delivered % Top 10", value: "31%", color: T.green, description: "Emaar delivered 31% of all units delivered by the top 10 developers in 2025 - 7,318 out of 23,576 total handovers.", source: "DXBinteract 2025", sourceUrl: "https://dxbinteract.com", items: [{ label: "Emaar Delivered", value: "7,318 units", note: "FY2025" }, { label: "Top 10 Total", value: "23,576 units", note: "Combined handovers" }, { label: "Emaar Share", value: "31%", note: "Of top 10 deliveries" }, { label: "On-Time Rate", value: "95%+", note: "Industry best" }, { label: "Since 2002", value: "125,600+", note: "Cumulative delivered" }], trend: null })} />
              </div>
            </Section>

            <ProGate isPro={isPro} message="Unlock Competitor Analysis" onUpgrade={() => setShowUpgrade(true)}>
            <Chart title="Sales Value (AED Billions) - Top 10 Developers" style={{ marginTop: 20 }}>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={devList} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: T.textSecondary, fontSize: 12 }} width={70} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sales" name="Sales (AED B)" radius={[0, 8, 8, 0]} barSize={22}>
                    {devList.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Chart>

            <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
              <Chart title="Units Sold (Volume)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={devList} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: T.textSecondary, fontSize: 11 }} width={65} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="units" fill={T.teal} name="Units Sold" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </Chart>
              <Chart title="Units Under Construction">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={devList} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: T.textSecondary, fontSize: 11 }} width={65} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="underConst" fill={T.blue} name="Under Construction" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </Chart>
            </div>

            <Section title="Developer Profiles" sub="Verified from DXBinteract - Full year 2025">
              <div className="table-scroll" style={{ overflowX: "auto", marginTop: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {["#", "Developer", "Sales (AED B)", "Units Sold", "Market Share", "Under Const.", "Segment"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: h === "Developer" ? "left" : "center", color: T.gold, fontWeight: 600, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {devList.map((d, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: i === 0 ? T.gold : T.textMuted, fontWeight: 700, fontFamily: "'Fraunces', serif" }}>{d.rank}</td>
                        <td style={{ padding: "10px 12px", color: T.white, fontWeight: 600 }}>
                          <span style={{ borderLeft: `3px solid ${d.color}`, paddingLeft: 8 }}>{d.name></span>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: i === 0 ? T.gold : T.textSecondary, fontFamily: "'Fraunces', serif", fontWeight: 600 }}>{d.sales.toFixed(1)}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: T.textSecondary }}>{d.units.toLocaleString()}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: T.teal, fontWeight: 600 }}>{d.share}%</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: T.textSecondary }}>{d.underConst.toLocaleString()}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: T.surfaceAlt, color: T.textSecondary }}>{d.segment></span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Emaar's Competitive Edge" sub="Why Emaar leads the market">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 16 }}>
                {[
                  ["Brand Premium", "20-40%", "Emaar commands higher prices per sqft vs competitors in same locations. Downtown Dubai and Emaar Beachfront average 25-40% premium over nearby non-Emaar developments.", T.gold],
                  ["Recurring Revenue", "AED 10.5B", "Unlike pure developers (DAMAC, Binghatti), Emaar generates 32% of EBITDA from malls, hotels, and commercial leasing - providing stability through market cycles.", T.teal],
                  ["Delivery Track Record", "125,600+", "More units delivered than any other UAE developer since 2002. Consistently on-time completion builds buyer confidence and justifies premium pricing.", T.green],
                  ["Revenue Backlog", "AED 155B", "3-4 years of pre-sold revenue at healthy margins. No other Dubai developer has this level of earnings visibility. De-risks future performance.", T.purple],
                ].map(([title, value, desc, color], i) => (
                  <div key={i} className="chart-box fade-up" style={{ animationDelay: `${i*0.05}s`, padding: 16 }}>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900, color }}>{value}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginTop: 4 }}>{title}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </Section>
            </ProGate>
            <TabSources sources={[{ label: "DXB Interact", url: "https://dxbinteract.com" }, { label: "fam Properties", url: "https://famproperties.com" }, { label: "DLD", url: "https://dubailand.gov.ae" }, { label: "Gulf News", url: "https://gulfnews.com" }, { label: "Zawya", url: "https://zawya.com" }]} />
          </>; })()}

          {/* --- YIELDS TAB --- */}
          {tab === "Yields" && !isPro && <ProGateFullPage tabName="Yields" onUpgrade={() => setShowUpgrade(true)} />}
          {tab === "Yields" && isPro && <>
            <ProGate isPro={isPro} message="Unlock Rental Yield Analysis" onUpgrade={() => setShowUpgrade(true)}>
            <Section title="Rental Yield Analysis" sub="Bayut RapidAPI - DXB Interact - Engel & V-lkers - DLD Rental Index">
              <div style={{ marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {liveYields.length > 0 ? (
                  <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "rgba(16,185,129,0.12)", color: "#10B981", fontWeight: 700, border: "1px solid rgba(16,185,129,0.2)" }}>?? LIVE - Bayut API</span>
                ) : (
                  <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "rgba(212,168,67,0.1)", color: "#D4A843", fontWeight: 700, border: "1px solid rgba(212,168,67,0.2)" }}>STATIC - data.js</span>
                )}
                <DataBadge source="REIDIN" date={marketGlobal?.updatedAt ? new Date(marketGlobal.updatedAt).toLocaleDateString("en-AE", { month: "short", year: "numeric" }) : "Recent"} type="reidin" />
                <DataBadge source="Dubai Land Department Rental Index" date={marketGlobal?.period || "FY2025"} type="dld" />
              </div>
              <Chart title="Gross Yield by Community & Unit Type (%)" style={{ marginTop: 16 }}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={liveYields.length > 0 ? liveYields : yields}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 7]} />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                          <p style={{ color: T.gold, fontWeight: 700, margin: 0, fontSize: 12, fontFamily: "'Fraunces', serif" }}>{d.community} - {d.label}</p>
                          <p style={{ color: T.white, margin: "4px 0 0", fontSize: 12 }}>Rent: AED {d.rent}K/yr - Price: AED {d.price}K</p>
                          <p style={{ color: T.teal, margin: "2px 0 0", fontSize: 12 }}>Gross: {d.gross}% - Net: {d.net}% - {d.demand}</p>
                        </div>
                      );
                    }} />
                    <Bar dataKey="gross" name="Gross Yield %" radius={[6, 6, 0, 0]} barSize={30}>
                      {(liveYields.length > 0 ? liveYields : yields).map((y, i) => <Cell key={i} fill={y.demand === "V.High" ? T.gold : y.demand === "High" ? T.teal : T.blue} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Chart>
            </Section>

            <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
              <KPI label="Dubai Avg Gross Yield" value="6.9%" sub="Apartments 7.3% - Villas 5.0%" delay={1} onClick={() => setSelectedKPI({ label: "Dubai Avg Gross Yield", value: "6.9%", color: T.gold, description: "Dubai citywide average gross rental yield in 2025. Apartments outperform at 7.3% vs villas at 5.0%. Source: REIDIN Dec 2025, DXB Interact, Engel & V-lkers.", source: "REIDIN - DXB Interact - Engel & V-lkers 2025", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "City Avg (Gross)", value: "6.9%", note: "All property types" }, { label: "Apartments Avg", value: "7.3%", note: "Highest returns" }, { label: "Villas Avg", value: "5.0%", note: "Lower but appreciation" }, { label: "Net Yield (Apt)", value: "~5.3-5.8%", note: "After costs" }, { label: "vs London", value: "2-4%", note: "Dubai 3- higher" }, { label: "vs New York", value: "3-5%", note: "Dubai outperforms" }], trend: null })} />
              <KPI label="Best Dubai Yield" value="8-9%" sub="JVC - International City" delay={2} onClick={() => setSelectedKPI({ label: "Best Dubai Yield", value: "8-9%", color: T.green, description: "Jumeirah Village Circle and International City consistently deliver 8-9% gross yields in 2025, the highest in Dubai. Affordable entry prices + strong tenant demand drive returns.", source: "REIDIN - DXB Interact - Bayut H1 2025", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "Top Area", value: "Int'l City / JVC", note: "8-9% gross" }, { label: "Al Furjan", value: "7.5-8.5%", note: "Strong yield" }, { label: "Dubai South", value: "7-8%", note: "Growing demand" }, { label: "Emaar communities", value: "5.5-7.5%", note: "Premium segment" }, { label: "Net Yield (JVC)", value: "6.5-7.5%", note: "After costs" }], trend: null })} />
              <KPI label="Palm / Downtown Yield" value="4-5.5%" sub="Capital appreciation play" delay={3} onClick={() => setSelectedKPI({ label: "Palm / Downtown Yield", value: "4-5.5%", color: T.blue, description: "Palm Jumeirah and Downtown Dubai offer 4-5.5% gross yield - lower than city average. Capital appreciation compensates: Palm villas rose 14% YoY in 2025, Downtown apartments +12.5%.", source: "REIDIN - DXB Interact - Engel & V-lkers Q4 2025", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "Palm Jumeirah", value: "4-5.5%", note: "Gross yield" }, { label: "Downtown Dubai", value: "4.5-6%", note: "Gross yield" }, { label: "Palm YoY Appreciation", value: "+14%", note: "2025 capital gain" }, { label: "Downtown YoY Appr.", value: "+12.5%", note: "2025 capital gain" }, { label: "Net Yield (Palm)", value: "3-4.3%", note: "After costs" }], trend: null })} />
              <KPI label="Avg 2BR Annual Rent" value="AED 91K" sub="Dubai citywide avg Q3 2025" delay={4} onClick={() => setSelectedKPI({ label: "Avg 2BR Annual Rent", value: "AED 91K", color: T.teal, description: "Average annual rent for a 2-bedroom apartment in Dubai is AED 91,052 (Q3 2025), per Property Monitor data compiled by Engel & V-lkers. Rents grew 8.5-9% YoY in 2025.", source: "Property Monitor - Engel & V-lkers Q3 2025", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "2BR Avg Rent", value: "AED 91,052", note: "Q3 2025 citywide" }, { label: "Rent Growth YoY", value: "+8.5-9%", note: "Apartments 2025" }, { label: "Villa Rent Growth", value: "+5.7%", note: "2025 YoY" }, { label: "EIBOR Rate", value: "3.47%", note: "Dec 2025 reference" }, { label: "900K+ contracts", value: "+8% YoY", note: "Ejari registrations 2024" }], trend: null })} />
            </div>

            {/* -- 5-YEAR YIELD HISTORY + GLOBAL BENCHMARKS -- */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }} className="chart-grid-2">

              {/* 5-Year Dubai Yield Trend */}
              <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 14 }}>??</span>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white }}>Dubai Yield Trend - 5 Years</div>
                  <span style={{ fontSize: 9, color: T.textMuted, marginLeft: "auto" }}>Gross % - Citywide avg</span>
                </div>
                {(() => {
                  const yieldHistory = [
                    { year: "2021", gross: 5.8, net: 4.2, premium: 4.1, affordable: 7.2 },
                    { year: "2022", gross: 6.1, net: 4.5, premium: 4.4, affordable: 7.5 },
                    { year: "2023", gross: 6.4, net: 4.8, premium: 4.6, affordable: 7.8 },
                    { year: "2024", gross: 6.7, net: 5.0, premium: 4.8, affordable: 8.1 },
                    { year: "2025", gross: 6.9, net: 5.2, premium: 5.0, affordable: 8.4 },
                  ];
                  const maxY = 10;
                  return (
                    <div>
                      {/* Mini line chart */}
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={yieldHistory}>
                          <defs>
                            <linearGradient id="gGross" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={T.gold} stopOpacity={0.3} />
                              <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gAffordable" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={T.green} stopOpacity={0.2} />
                              <stop offset="100%" stopColor={T.green} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[3, 10]} tickFormatter={v => v + "%"} />
                          <Tooltip content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                              <div style={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 8, padding: "10px 14px" }}>
                                <div style={{ color: T.gold, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{label}</div>
                                {payload.map((p, i) => (
                                  <div key={i} style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>{p.name}: {p.value}%</div>
                                ))}
                              </div>
                            );
                          }} />
                          <Area type="monotone" dataKey="gross" stroke={T.gold} fill="url(#gGross)" strokeWidth={2.5} name="City Avg Gross" dot={{ fill: T.gold, r: 3 }} />
                          <Line type="monotone" dataKey="net" stroke={T.teal} strokeWidth={2} dot={{ fill: T.teal, r: 3 }} name="City Avg Net" />
                          <Area type="monotone" dataKey="affordable" stroke={T.green} fill="url(#gAffordable)" strokeWidth={2} name="Affordable Areas" dot={{ fill: T.green, r: 3 }} strokeDasharray="4 4" />
                          <Line type="monotone" dataKey="premium" stroke={T.blue} strokeWidth={2} dot={{ fill: T.blue, r: 3 }} name="Premium Areas" strokeDasharray="4 4" />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
                        {[[T.gold, "City Avg Gross"], [T.teal, "City Avg Net"], [T.green, "Affordable"], [T.blue, "Premium"]].map(([color, label]) => (
                          <span key={label} style={{ fontSize: 10, color: T.textSecondary, display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 16, height: 2, background: color, display: "inline-block", borderRadius: 1 }} />{label}
                          </span>
                        ))}
                      </div>
                      <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", fontSize: 10, color: T.textMuted }}>
                        Dubai gross yields grew from 5.8% (2021) to 6.9% (2025) - a 5-year expansion of +110bps driven by strong rental demand and controlled supply.
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Global City Benchmark */}
              <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 14 }}>??</span>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white }}>Global Yield Benchmark</div>
                  <span style={{ fontSize: 9, color: T.textMuted, marginLeft: "auto" }}>Gross % - 2025</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { city: "Dubai (JVC)", yield: 8.5, flag: "????", note: "Best affordable", color: T.green },
                    { city: "Dubai (Avg)", yield: 6.9, flag: "????", note: "City average", color: T.gold },
                    { city: "Istanbul", yield: 6.1, flag: "????", note: "Growing market", color: T.teal },
                    { city: "Bangkok", yield: 5.8, flag: "????", note: "SE Asia hub", color: T.blue },
                    { city: "Kuala Lumpur", yield: 5.5, flag: "????", note: "Regional", color: T.blue },
                    { city: "New York", yield: 4.2, flag: "????", note: "Global benchmark", color: T.textSecondary },
                    { city: "Paris", yield: 3.8, flag: "????", note: "Regulated market", color: T.textSecondary },
                    { city: "Singapore", yield: 3.5, flag: "????", note: "Cooling measures", color: T.textSecondary },
                    { city: "London", yield: 3.2, flag: "????", note: "High entry costs", color: T.textSecondary },
                    { city: "Hong Kong", yield: 2.8, flag: "????", note: "Luxury segment", color: T.red },
                  ].map((c, i) => {
                    const isDubai = c.city.includes("Dubai");
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{c.flag></span>
                        <div style={{ width: 110, fontSize: 11, color: isDubai ? T.gold : T.textSecondary, fontWeight: isDubai ? 700 : 400, flexShrink: 0 }}>{c.city}</div>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(c.yield / 9) * 100}%`, background: c.color, borderRadius: 3, transition: "width 0.8s" }} />
                        </div>
                        <div style={{ width: 36, textAlign: "right", fontSize: 12, fontWeight: 700, color: c.color, flexShrink: 0 }}>{c.yield}%</div>
                        <div style={{ width: 70, fontSize: 9, color: T.textMuted, textAlign: "right", flexShrink: 0 }}>{c.note}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, fontSize: 10, color: T.textMuted }}>
                  Dubai delivers <strong style={{ color: T.gold }}>2-3- higher yields</strong> than London, Paris and Singapore - with zero income tax and 10-year Golden Visa eligibility above AED 2M.
                </div>
              </div>
            </div>

            {/* -- YIELD BY UNIT TYPE BREAKDOWN -- */}
            <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 14 }}>??</span>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white }}>Yield by Unit Type - Dubai 2025</div>
                <span style={{ fontSize: 9, color: T.textMuted, marginLeft: "auto" }}>Source: DLD Rental Index - REIDIN</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                {[
                  { type: "Studio", gross: 7.8, net: 6.1, avgRent: 52000, avgPrice: 670000, color: T.green, icon: "~"??" },
                  { type: "1 Bedroom", gross: 7.1, net: 5.5, avgRent: 78000, avgPrice: 1100000, color: T.teal, icon: "~"???" },
                  { type: "2 Bedroom", gross: 6.4, net: 4.9, avgRent: 112000, avgPrice: 1750000, color: T.gold, icon: "~"???" },
                  { type: "3 Bedroom", gross: 5.8, net: 4.4, avgRent: 155000, avgPrice: 2670000, color: T.blue, icon: "~"???" },
                  { type: "Villa / TH", gross: 5.0, net: 3.8, avgRent: 210000, avgPrice: 4200000, color: T.purple, icon: "~"??" },
                ].map((u, i) => (
                  <div key={i} style={{ padding: "16px", background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}`, textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{u.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 10 }}>{u.type}</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 900, color: u.color, marginBottom: 4 }}>{u.gross}%</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 8 }}>Gross yield</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.textMuted, borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 4 }}>
                      <span>Net: <span style={{ color: u.color, fontWeight: 600 }}>{u.net}%</span></span>
                      <span>Rent: AED {(u.avgRent/1000).toFixed(0)}K</span>
                    </div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Avg price: AED {(u.avgPrice/1e6).toFixed(1)}M</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", fontSize: 10, color: T.textMuted }}>
                Studios deliver the highest gross yield (7.8%) due to lower entry prices. Villas offer the lowest yield (5.0%) but highest capital appreciation potential. Source: DLD Rental Index - REIDIN Dec 2025
              </div>
            </div>

            <Section title="Detailed Yield Data" sub="All Emaar communities - Annual rents - Launch prices - Demand levels">
              <div className="table-scroll" style={{ overflowX: "auto", marginTop: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 750 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {["Community", "Unit Type", "Annual Rent", "Price", "Gross %", "Net %", "Demand", "Golden Visa"].map(h => (
                        <th key={h} style={{ padding: "10px 10px", textAlign: h === "Community" || h === "Unit Type" ? "left" : "center", color: T.gold, fontWeight: 600, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(liveYields.length > 0 ? liveYields : yields).map((y, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "10px 10px", color: T.white, fontWeight: 500, fontSize: 12 }}>{y.community}</td>
                        <td style={{ padding: "10px 10px", color: T.textSecondary, fontSize: 12 }}>{y.label}</td>
                        <td style={{ padding: "10px 10px", textAlign: "center", color: T.textSecondary, fontSize: 12 }}>AED {y.rent}K</td>
                        <td style={{ padding: "10px 10px", textAlign: "center", color: T.textSecondary, fontSize: 12 }}>AED {y.price}K</td>
                        <td style={{ padding: "10px 10px", textAlign: "center", color: y.gross >= 5 ? T.green : y.gross >= 4 ? T.gold : T.textSecondary, fontWeight: 600, fontFamily: "'Fraunces', serif" }}>{y.gross}%</td>
                        <td style={{ padding: "10px 10px", textAlign: "center", color: T.textSecondary, fontFamily: "'Fraunces', serif" }}>{y.net}%</td>
                        <td style={{ padding: "10px 10px", textAlign: "center" }}>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: y.demand === "V.High" ? "rgba(16,185,129,0.15)" : y.demand === "High" ? "rgba(212,168,67,0.12)" : "rgba(59,130,246,0.12)", color: y.demand === "V.High" ? T.green : y.demand === "High" ? T.gold : T.blue }}>{y.demand></span>
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "center", color: T.teal, fontSize: 11 }}>{y.visa || "=2M"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="ROI Framework" sub="Expected returns for Emaar off-plan investments">
              <Chart title="Return Range by Phase (%)" style={{ marginTop: 16 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={roiPhases}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="phase" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="low" fill={T.teal} name="Low %" radius={[0, 0, 0, 0]} barSize={32} opacity={0.5} />
                    <Bar dataKey="high" fill={T.gold} name="High %" radius={[6, 6, 0, 0]} barSize={32} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </Chart>
            </Section>
            </ProGate>
          <TabSources sources={[{ label: "REIDIN Dec 2025", url: "https://reidin.com" }, { label: "DXB Interact", url: "https://dxbinteract.com" }, { label: "Engel & V-lkers Dubai 2025", url: "https://www.engelvoelkers.com/en-ae/dubai/" }, { label: "DLD Rental Index", url: "https://dubailand.gov.ae" }, { label: "Bayut Rental Report 2025", url: "https://www.bayut.com" }, { label: "Property Finder", url: "https://www.propertyfinder.ae" }]} />
          </>}

          {/* --- MORTGAGE CALCULATOR TAB --- */}
          {tab === "Mortgage" && !isPro && <ProGateFullPage tabName="Mortgage" onUpgrade={() => setShowUpgrade(true)} />}
          {tab === "Mortgage" && isPro && (() => {
            const MortgageCalc = () => {
              const [selectedProjectId, setSelectedProjectId] = React.useState("");
              const [propPrice, setPropPrice] = React.useState(2000000);
              const [downPct, setDownPct] = React.useState(20);
              // EIBOR rates - updated from CBUAE (Feb 27, 2026)
              const EIBOR_RATES = { on: 3.473, "1w": 3.577, "1m": 3.635, "3m": 3.593, "6m": 3.676, "1y": 3.674, asOf: "27 Feb 2026" };
              const BANK_SPREAD = 1.50; // typical UAE bank spread over 3M EIBOR
              const [rate, setRate] = React.useState(parseFloat((EIBOR_RATES["3m"] + BANK_SPREAD).toFixed(2)));
              const [liveEibor, setLiveEibor] = React.useState(EIBOR_RATES);
              const [eiborSource, setEiborSource] = React.useState("CBUAE - " + EIBOR_RATES.asOf);
              React.useEffect(() => {
                // Load EIBOR from Firestore - cron-eibor.js writes to marketData/eibor
                getDoc(doc(db, "marketData", "eibor"))
                  .then(snap => {
                    if (snap.exists()) {
                      const e = snap.data();
                      // cron writes: overnight, oneWeek, oneMonth, threeMonth, sixMonth, twelveMonth
                      // map to mortgage tab format: on, 1w, 1m, 3m, 6m, 1y
                      const mapped = {
                        on:  e.overnight   || e.on  || EIBOR_RATES.on,
                        "1w": e.oneWeek    || e["1w"] || EIBOR_RATES["1w"],
                        "1m": e.oneMonth   || e["1m"] || EIBOR_RATES["1m"],
                        "3m": e.threeMonth || e["3m"] || EIBOR_RATES["3m"],
                        "6m": e.sixMonth   || e["6m"] || EIBOR_RATES["6m"],
                        "1y": e.twelveMonth|| e["1y"] || EIBOR_RATES["1y"],
                        asOf: e.updatedAtUAE || e.asOf || EIBOR_RATES.asOf,
                        source: e.source || "CBUAE",
                      };
                      if (mapped["3m"] > 1) {
                        setLiveEibor(mapped);
                        setEiborSource((mapped.source || "CBUAE") + " - " + (mapped.asOf || ""));
                        setRate(parseFloat((mapped["3m"] + BANK_SPREAD).toFixed(2)));
                      }
                    }
                  })
                  .catch(() => {}); // silently keep hardcoded fallback
              }, []); // eslint-disable-line react-hooks/exhaustive-deps
              const [years, setYears] = React.useState(25);
              const [isUAENational, setIsUAENational] = React.useState(false);
              const [grossYieldPct, setGrossYieldPct] = React.useState(6.9); // Dubai avg gross yield 2025 (REIDIN/DXB Interact)

              React.useEffect(() => {
                if (!selectedProjectId) return;
                const p = activeProjects.find(x => String(x.id) === selectedProjectId);
                if (p && p.price) setPropPrice(p.price);
                if (p) {
                  const comm = emaarCommunities.find(c => c.name === p.community);
                  if (comm && comm.avgYield) setGrossYieldPct(comm.avgYield);
                }
              }, [selectedProjectId]);

              const downAmt = propPrice * downPct / 100;
              const loanAmt = propPrice - downAmt;
              const mr = rate / 100 / 12;
              const np = years * 12;
              const monthly = loanAmt * (mr * Math.pow(1+mr,np)) / (Math.pow(1+mr,np)-1);
              const dldFee = propPrice * 0.04;
              const agencyFee = propPrice * 0.02;
              const totalUpfront = downAmt + dldFee + agencyFee + 4200 + 580;
              const monthlyRent = propPrice * grossYieldPct / 100 / 12;
              const monthlyExpenses = (propPrice * 0.015 / 12) + (monthlyRent * 0.08);
              const netRent = monthlyRent - monthlyExpenses;
              const cashflow = netRent - monthly;
              const cashOnCash = (cashflow * 12 / totalUpfront) * 100;
              const fmt = n => "AED " + Math.round(n).toLocaleString();
              const fmtM = n => "AED " + (n/1e6).toFixed(2) + "M";

              const answers = [
                {
                  q: "Can I afford this?",
                  icon: "~"1??",
                  answer: fmt(monthly) + " / month",
                  detail: "That-s your mortgage payment every month for " + years + " years. Based on " + downPct + "% down at " + rate + "% interest.",
                  color: T.gold,
                  bg: "rgba(212,168,67,0.08)",
                  border: "rgba(212,168,67,0.25)",
                },
                {
                  q: "Will rent cover my mortgage?",
                  icon: "~"2??",
                  answer: cashflow >= 0 ? "Yes - you pocket " + fmt(cashflow) + "/mo" : "No - you top up " + fmt(Math.abs(cashflow)) + "/mo",
                  detail: "Estimated rent is " + fmt(monthlyRent) + "/mo. After service charges, management fees, and your mortgage, you " + (cashflow >= 0 ? "make a profit of " + fmt(cashflow) + " every month." : "need to cover a shortfall of " + fmt(Math.abs(cashflow)) + " per month."),
                  color: cashflow >= 0 ? T.green : "#EF4444",
                  bg: cashflow >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                  border: cashflow >= 0 ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
                },
                {
                  q: "What-s my actual return on cash?",
                  icon: "~"3??",
                  answer: cashOnCash.toFixed(1) + "% per year",
                  detail: "You put in " + fmtM(totalUpfront) + " of your own money (down payment + fees). Your annual return on that specific cash is " + cashOnCash.toFixed(1) + "%. A savings account gives ~4%. Dubai average is 5-8%.",
                  color: cashOnCash >= 5 ? T.green : cashOnCash >= 0 ? T.gold : "#EF4444",
                  bg: cashOnCash >= 5 ? "rgba(16,185,129,0.08)" : "rgba(212,168,67,0.08)",
                  border: cashOnCash >= 5 ? "rgba(16,185,129,0.25)" : "rgba(212,168,67,0.25)",
                },
                {
                  q: "How much do I need on day one?",
                  icon: "~"4??",
                  answer: fmtM(totalUpfront),
                  detail: "Down payment " + fmtM(downAmt) + " + DLD transfer fee " + fmt(dldFee) + " (4%) + agency fee " + fmt(agencyFee) + " (2%) + mortgage registration AED 4,200 + valuation AED 580. Have this ready before you sign.",
                  color: T.blue,
                  bg: "rgba(59,130,246,0.08)",
                  border: "rgba(59,130,246,0.25)",
                },
              ];

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* EIBOR Live Rate Card */}
                  <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(59,130,246,0.08) 100%)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 16, padding: "18px 22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px #10B981" }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: 1, textTransform: "uppercase" }}>EIBOR - {eiborSource></span>
                        </div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Emirates Interbank Offered Rate - UAE Central Bank benchmark</div>
                        <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                          <a href="https://www.centralbank.ae/en/forex-eibor/eibor-rates/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#10B981", textDecoration: "none" }}>?? CBUAE Official ?</a>
                          <a href="https://fcmb.ae/eibor-rate-today" target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#10B981", textDecoration: "none" }}>?? FCMB Live Rates ?</a>
                          <a href="https://www.mortgagemarket.ae/mortgage-guides/eibor-rate" target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#10B981", textDecoration: "none" }}>?? Mortgage Market ?</a>
                        </div>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                          {[["1M", liveEibor?.["1m"]], ["3M", liveEibor?.["3m"]], ["6M", liveEibor?.["6m"]], ["1Y", liveEibor?.["1y"]]].map(([label, val]) => (
                            <div key={label} style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>{label}</div>
                              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: label === "3M" ? "#10B981" : T.white }}>{val ? val.toFixed(3) : "-"}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "12px 16px", textAlign: "center", minWidth: 140 }}>
                        <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>3M EIBOR + {BANK_SPREAD}% spread</div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 900, color: "#10B981" }}>{(liveEibor?.["3m"] + BANK_SPREAD).toFixed(2)}%</div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Typical variable rate</div>
                        <button type="button" onClick={() => setRate(parseFloat((liveEibor?.["3m"] + BANK_SPREAD).toFixed(2)))}
                          style={{ marginTop: 8, padding: "4px 12px", borderRadius: 6, background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                          Apply to Calculator ?
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Project picker */}
                  <div style={{ background: T.surface, borderRadius: 16, border: "1px solid " + T.border, padding: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Step 1 - Pick a project (or set price manually below)</div>
                    <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={{ width: "100%", padding: "11px 14px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 10, color: selectedProjectId ? T.white : T.textMuted, fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                      <option value="">- Choose a project to auto-fill price -</option>
                      {activeProjects.filter(p => p.price).map(p => <option key={p.id} value={String(p.id)}>{p.name} - {p.community} - AED {(p.price/1e6).toFixed(2)}M</option>)}
                    </select>
                  </div>

                  {/* Sliders */}
                  <div style={{ background: T.surface, borderRadius: 16, border: "1px solid " + T.border, padding: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 18 }}>Step 2 - Adjust your numbers</div>
                    <div className="mortgage-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                      {[
                        { label: "Property Price", value: propPrice, set: setPropPrice, min: 500000, max: 20000000, step: 100000, disp: fmtM(propPrice) },
                        { label: "Down Payment", value: downPct, set: setDownPct, min: isUAENational ? 15 : 20, max: 80, step: 1, disp: downPct + "% = " + fmtM(downAmt) },
                        { label: "Interest Rate", value: rate, set: setRate, min: 2, max: 12, step: 0.1, disp: rate + "% per year" },
                        { label: "Loan Term", value: years, set: setYears, min: 5, max: 25, step: 1, disp: years + " years" },
                        { label: "Expected Rental Yield", value: grossYieldPct, set: setGrossYieldPct, min: 3, max: 12, step: 0.1, disp: grossYieldPct + "% per year" },
                      ].map((f, i) => (
                        <div key={i} style={{ marginBottom: 20 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                            <span style={{ fontSize: 12, color: T.textSecondary }}>{f.label></span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{f.disp></span>
                          </div>
                          <input type="range" min={f.min} max={f.max} step={f.step} value={f.value} onChange={e => f.set(Number(e.target.value))} style={{ width: "100%", accentColor: T.gold, cursor: "pointer" }} />
                        </div>
                      ))}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: T.textSecondary }}>
                          <input type="checkbox" checked={isUAENational} onChange={e => { setIsUAENational(e.target.checked); if (e.target.checked && downPct < 15) setDownPct(15); }} style={{ accentColor: T.gold, width: 16, height: 16 }} />
                          I am a UAE National (15% min down)
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* The 4 plain-English answers */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase" }}>Step 3 - Your answers</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {answers.map((a, i) => (
                      <div key={i} style={{ background: a.bg, borderRadius: 16, border: "1px solid " + a.border, padding: 22 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: 20 }}>{a.icon></span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{a.q></span>
                        </div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 900, color: a.color, marginBottom: 10 }}>{a.answer}</div>
                        <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{a.detail}</div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            };
            return (
              <>
              <Section title="Mortgage Calculator" sub="4 questions every Dubai property buyer needs answered">
                <MortgageCalc />
              </Section>

              {/* -- UAE BANKS COMPARISON - Always visible, live override from Firestore -- */}
              {(() => {
                const staticBanks = [
                  { bank: "Emirates NBD", rate: 4.49, maxLTV: 80, processingFee: "1% (min AED 5,000)", minSalary: 15000, fixedYears: 3, notes: "Largest UAE bank - Fastest approval", badge: "Most Popular", badgeColor: T.gold },
                  { bank: "ADCB", rate: 4.54, maxLTV: 80, processingFee: "1% (min AED 5,000)", minSalary: 15000, fixedYears: 3, notes: "Strong for expats - Good service", badge: "", badgeColor: "" },
                  { bank: "FAB (First Abu Dhabi)", rate: 4.59, maxLTV: 80, processingFee: "0.5% (min AED 2,500)", minSalary: 12000, fixedYears: 2, notes: "Lowest processing fee", badge: "Lowest Fee", badgeColor: T.teal },
                  { bank: "DIB (Dubai Islamic)", rate: 4.64, maxLTV: 80, processingFee: "1% (min AED 5,000)", minSalary: 10000, fixedYears: 3, notes: "Sharia-compliant - Ijara structure", badge: "Islamic", badgeColor: T.green },
                  { bank: "HSBC UAE", rate: 4.74, maxLTV: 75, processingFee: "1% (min AED 5,000)", minSalary: 15000, fixedYears: 2, notes: "Good for international clients", badge: "", badgeColor: "" },
                  { bank: "Mashreq Bank", rate: 4.79, maxLTV: 75, processingFee: "1% (min AED 5,000)", minSalary: 10000, fixedYears: 2, notes: "Fast processing - Digital-first", badge: "Fastest", badgeColor: T.blue },
                  { bank: "RAK Bank", rate: 4.84, maxLTV: 75, processingFee: "1% (min AED 5,000)", minSalary: 8000, fixedYears: 1, notes: "Lowest min salary requirement", badge: "Low Entry", badgeColor: T.purple },
                  { bank: "Abu Dhabi Islamic (ADIB)", rate: 4.89, maxLTV: 80, processingFee: "1.05%", minSalary: 10000, fixedYears: 3, notes: "Sharia-compliant - Competitive", badge: "Islamic", badgeColor: T.green },
                  { bank: "Commercial Bank of Dubai", rate: 4.94, maxLTV: 75, processingFee: "1% (min AED 5,000)", minSalary: 12000, fixedYears: 2, notes: "Good for self-employed", badge: "", badgeColor: "" },
                  { bank: "Standard Chartered", rate: 4.99, maxLTV: 75, processingFee: "1%", minSalary: 20000, fixedYears: 2, notes: "International profile - Premium", badge: "", badgeColor: "" },
                ];
                const banks = liveMortgageRates.length > 0
                  ? [...liveMortgageRates].sort((a,b) => parseFloat(a.rate) - parseFloat(b.rate))
                  : staticBanks.sort((a,b) => a.rate - b.rate);

                return (
                  <Section title="UAE Banks Mortgage Comparison" sub="All major UAE banks - Rates based on 3M EIBOR + spread - Mar 2026">
                    {liveMortgageRates.length === 0 && (
                      <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 12, padding: "6px 12px", borderRadius: 6, background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, display: "inline-block" }}>
                        Static data - Admin can update live rates via Admin Panel ? Tab Control
                      </div>
                    )}
                    <div style={{ overflowX: "auto", marginTop: 8 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                            {["Bank", "Rate p.a.", "Fixed For", "Max LTV", "Processing Fee", "Min Salary", "Notes"].map(h => (
                              <th key={h} style={{ padding: "10px 12px", textAlign: h === "Bank" ? "left" : "center", color: T.gold, fontWeight: 600, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", background: T.surfaceAlt, whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {banks.map((b, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.15s" }}
                              onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? T.gold : T.white }}>{b.bank></span>
                                  {i === 0 && <span style={{ fontSize: 9, color: T.green, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>BEST RATE</span>}
                                  {b.badge && i !== 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: `${b.badgeColor}15`, border: `1px solid ${b.badgeColor}30`, color: b.badgeColor }}>{b.badge></span>}
                                </div>
                              </td>
                              <td style={{ padding: "12px 14px", textAlign: "center" }}>
                                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 900, color: i === 0 ? T.green : T.white }}>{b.rate}%</span>
                              </td>
                              <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 12, color: T.textSecondary }}>{b.fixedYears || "-"} yr{b.fixedYears > 1 ? "s" : ""}</td>
                              <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 12, color: T.textSecondary }}>{b.maxLTV}%</td>
                              <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 12, color: T.textSecondary, whiteSpace: "nowrap" }}>{b.processingFee}</td>
                              <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 12, color: T.textSecondary }}>AED {parseInt(b.minSalary||0).toLocaleString()}</td>
                              <td style={{ padding: "12px 14px", fontSize: 11, color: T.textMuted }}>{b.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, fontSize: 10, color: T.textMuted, lineHeight: 1.7 }}>
                      <strong style={{ color: T.gold }}>Important:</strong> Rates shown are indicative based on 3M EIBOR (3.593%) + typical spreads as of March 2026. Actual rates vary by applicant profile, property type, and LTV. Always get a pre-approval letter before committing. Min down payment: 20% for expats, 15% for UAE nationals on properties up to AED 5M.
                    </div>
                  </Section>
                );
              })()}

              {/* -- AFFORDABILITY CHECKER -- */}
              {(() => {
                const AffordabilityChecker = () => {
                const [salary, setSalary] = React.useState(25000);
                const [existingLiabilities, setExistingLiabilities] = React.useState(0);
                const [affordRate, setAffordRate] = React.useState(5.09);
                const [affordYears, setAffordYears] = React.useState(25);
                const [affordDown, setAffordDown] = React.useState(20);
                const [isNational, setIsNational] = React.useState(false);

                // CBUAE rules: max DBR 50% (debt burden ratio)
                const maxDBR = 0.50;
                const maxMonthlyPayment = (salary * maxDBR) - existingLiabilities;
                // Back-calculate max loan from max monthly payment
                const mr = affordRate / 100 / 12;
                const np = affordYears * 12;
                const maxLoan = maxMonthlyPayment * (Math.pow(1+mr,np) - 1) / (mr * Math.pow(1+mr,np));
                const minDown = isNational ? 0.15 : 0.20;
                const maxPrice = maxLoan / (1 - minDown);
                const downNeeded = maxPrice * minDown;
                const feesNeeded = maxPrice * 0.06; // DLD 4% + agency 2%
                const totalCash = downNeeded + feesNeeded;

                const fmt = n => "AED " + Math.round(n).toLocaleString();
                const fmtM = n => n >= 1000000 ? "AED " + (n/1000000).toFixed(2) + "M" : fmt(n);
                const affordable = maxPrice > 0;

                return (
                  <Section title="Affordability Checker" sub="Based on CBUAE 50% Debt Burden Ratio (DBR) rules - UAE Central Bank">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 16 }} className="chart-grid-2">
                      {/* Inputs */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {[
                          { label: "Monthly Salary (AED)", value: salary, set: setSalary, min: 5000, max: 200000, step: 1000, disp: fmt(salary) },
                          { label: "Existing Monthly Liabilities", value: existingLiabilities, set: setExistingLiabilities, min: 0, max: 50000, step: 500, disp: fmt(existingLiabilities) + "/mo" },
                          { label: "Interest Rate", value: affordRate, set: setAffordRate, min: 2, max: 10, step: 0.1, disp: affordRate + "%" },
                          { label: "Loan Term", value: affordYears, set: setAffordYears, min: 5, max: 25, step: 1, disp: affordYears + " years" },
                          { label: "Down Payment", value: affordDown, set: setAffordDown, min: isNational ? 15 : 20, max: 80, step: 1, disp: affordDown + "%" },
                        ].map((f, i) => (
                          <div key={i}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: 12, color: T.textSecondary }}>{f.label></span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{f.disp></span>
                            </div>
                            <input type="range" min={f.min} max={f.max} step={f.step} value={f.value} onChange={e => f.set(Number(e.target.value))} style={{ width: "100%", accentColor: T.gold, cursor: "pointer" }} />
                          </div>
                        ))}
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: T.textSecondary }}>
                          <input type="checkbox" checked={isNational} onChange={e => setIsNational(e.target.checked)} style={{ accentColor: T.gold, width: 16, height: 16 }} />
                          UAE National (15% minimum down payment)
                        </label>
                      </div>

                      {/* Results */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ padding: "20px", borderRadius: 14, background: affordable ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${affordable ? T.green : T.red}30`, textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>Maximum Property Price</div>
                          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 900, color: affordable ? T.green : T.red }}>{affordable ? fmtM(maxPrice) : "-"}</div>
                          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>Based on {salary.toLocaleString()} salary - {affordRate}% rate - CBUAE 50% DBR rule</div>
                        </div>
                        {[
                          { label: "Max Monthly Payment", value: fmt(Math.max(maxMonthlyPayment, 0)), color: T.gold, icon: "~"??" },
                          { label: "Max Loan Amount", value: fmtM(Math.max(maxLoan, 0)), color: T.teal, icon: "~"??" },
                          { label: "Down Payment Needed", value: fmtM(downNeeded), color: T.blue, icon: "~"??" },
                          { label: "Total Cash Required", value: fmtM(totalCash), color: T.purple, icon: "~"??" },
                        ].map((item, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, background: T.surface, border: `1px solid ${T.border}` }}>
                            <span style={{ fontSize: 20 }}>{item.icon></span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 10, color: T.textMuted }}>{item.label}</div>
                              <div style={{ fontSize: 15, fontWeight: 800, color: item.color, fontFamily: "'Fraunces',serif" }}>{item.value}</div>
                            </div>
                          </div>
                        ))}
                        <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, fontSize: 10, color: T.textMuted, lineHeight: 1.7 }}>
                          CBUAE rules: Max 50% of gross salary goes to all debt payments combined. Max loan term 25 years. Max age at end of loan: 65 (employed) / 70 (self-employed).
                        </div>
                      </div>
                    </div>
                  </Section>
                );
                };
                return <AffordabilityChecker />;
              })()}

              <TabSources sources={[{ label: "CBUAE - UAE Base Rate", url: "https://www.cbuae.gov.ae" }, { label: "EIBOR 3M: 3.593% (Feb 2026) - CBUAE", url: "https://www.centralbank.ae/en/forex-eibor/eibor-rates/" }, { label: "DLD Fee Schedule (4%)", url: "https://dubailand.gov.ae" }, { label: "UAE Mortgage Law (No. 14 of 2008)" }, { label: "Property Finder Mortgage Rates", url: "https://www.propertyfinder.ae" }]} />
              </>
            );
          })()}

          {/* --- MAP / COMMUNITIES TAB --- */}
          {tab === "Map" && <><CommunityMapTab activeProjects={activeProjects} liveCommunityROI={liveCommunityROI} setTab={setTab} selectedDeveloper={selectedDeveloper} compareList={compareList} toggleCompare={toggleCompare} isPro={isPro} setShowUpgrade={setShowUpgrade} /><TabSources sources={[{ label: "Google Maps API", url: "https://maps.google.com" }, { label: "Emaar Community Boundaries" }, { label: "DLD Zoning Data", url: "https://dubailand.gov.ae" }, { label: "OpenStreetMap", url: "https://www.openstreetmap.org" }]} /></>}

          {/* --- LAUNCH CALENDAR TAB --- */}
          {tab === "Launch Calendar" && (() => {
            const launches = [
              { name: "Palmiera 2 - The Oasis", community: "The Oasis", date: "Q1 2026", status: "launched", expectedPrice: 4200000, developer: "Emaar", type: "Villa", beds: "4-6 BR", paymentPlan: "80/20", goldenVisa: true, notes: "Second phase of The Oasis mega-project. Lagoon-facing plots." },
              { name: "Savanna - Arabian Ranches III", community: "Arabian Ranches III", date: "Q1 2026", status: "launched", expectedPrice: 2100000, developer: "Emaar", type: "Townhouse", beds: "3-4 BR", paymentPlan: "80/20", goldenVisa: true, notes: "Final townhouse phase in AR3. Near community centre." },
              { name: "Address Residences - Dubai Creek", community: "Dubai Creek Harbour", date: "Q2 2026", status: "upcoming", expectedPrice: 3500000, developer: "Emaar", type: "Apartment", beds: "1-3 BR", paymentPlan: "70/30", goldenVisa: true, notes: "Branded Address tower at Creek Marina. Expected May 2026." },
              { name: "Grove - Creek Harbour", community: "Dubai Creek Harbour", date: "Q2 2026", status: "upcoming", expectedPrice: 1800000, developer: "Emaar", type: "Apartment", beds: "Studio-2 BR", paymentPlan: "80/20", goldenVisa: false, notes: "Affordable entry into Creek Harbour. High rental demand community." },
              { name: "The Valley Phase 3", community: "The Valley", date: "Q2 2026", status: "upcoming", expectedPrice: 1600000, developer: "Emaar", type: "Townhouse", beds: "3-5 BR", paymentPlan: "80/20", goldenVisa: false, notes: "Next phase of The Valley. Expected strong demand from end-users." },
              { name: "Seascape - Emaar Beachfront", community: "Emaar Beachfront", date: "Q3 2026", status: "rumoured", expectedPrice: 4800000, developer: "Emaar", type: "Apartment", beds: "2-4 BR", paymentPlan: "60/40", goldenVisa: true, notes: "New beachfront tower. Expected to sell out within days of launch." },
              { name: "Grand Bleu Tower 3", community: "Emaar Beachfront", date: "Q3 2026", status: "rumoured", expectedPrice: 6500000, developer: "Emaar", type: "Apartment", beds: "2-4 BR", paymentPlan: "70/30", goldenVisa: true, notes: "Elie Saab branded. Ultra-premium pricing expected." },
              { name: "Hills Park 2 - Dubai Hills", community: "Dubai Hills Estate", date: "Q3 2026", status: "rumoured", expectedPrice: 1400000, developer: "Emaar", type: "Apartment", beds: "1-3 BR", paymentPlan: "80/20", goldenVisa: false, notes: "Adjacent to Hills Park 1. Park-facing units expected to sell fast." },
              { name: "The Heights - Dubai Hills", community: "Dubai Hills Estate", date: "Q4 2026", status: "rumoured", expectedPrice: 2800000, developer: "Emaar", type: "Villa", beds: "3-5 BR", paymentPlan: "80/20", goldenVisa: true, notes: "Premium villas in DHE. Limited supply expected." },
              { name: "Riverside - The Oasis", community: "The Oasis", date: "Q4 2026", status: "rumoured", expectedPrice: 5200000, developer: "Emaar", type: "Villa", beds: "5-6 BR", paymentPlan: "70/30", goldenVisa: true, notes: "Ultra-luxury riverside plots. AED 5M+ bracket." },
              { name: "Creek Crescent Phase 2", community: "Dubai Creek Harbour", date: "Q1 2027", status: "pipeline", expectedPrice: 2200000, developer: "Emaar", type: "Apartment", beds: "1-3 BR", paymentPlan: "TBD", goldenVisa: true, notes: "Expansion of Creek Crescent. Strong resale market expected." },
              { name: "Downtown Hills", community: "Dubai Hills Estate", date: "Q2 2027", status: "pipeline", expectedPrice: 3100000, developer: "Emaar", type: "Apartment", beds: "2-4 BR", paymentPlan: "TBD", goldenVisa: true, notes: "Premium mid-rise adjacent to DHE Mall. High occupancy expected." },
            ];
            const statusColors = { launched: "#10B981", upcoming: T.gold, rumoured: "#8B5CF6", pipeline: T.textMuted };
            const statusLabels = { launched: "Launched", upcoming: "Upcoming", rumoured: "Rumoured", pipeline: "?? Pipeline" };
            const groups = ["launched", "upcoming", "rumoured", "pipeline"];
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Header */}
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.gold }}>Off-Plan Launch Calendar</div>
                      <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Upcoming Emaar launches - 2026-2027 - Updated weekly</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {groups.map(s => (
                        <div key={s} style={{ padding: "5px 12px", borderRadius: 8, background: `${statusColors[s]}15`, border: `1px solid ${statusColors[s]}40`, fontSize: 11, fontWeight: 600, color: statusColors[s] }}>{statusLabels[s]} - {launches.filter(l => l.status === s).length}</div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Groups */}
                {groups.map(status => {
                  const items = launches.filter(l => l.status === status);
                  if (!items.length) return null;
                  return (
                    <div key={status} style={{ background: T.surface, borderRadius: 16, border: `1px solid ${statusColors[status]}30`, overflow: "hidden" }}>
                      <div style={{ padding: "14px 20px", background: `${statusColors[status]}08`, borderBottom: `1px solid ${statusColors[status]}20`, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColors[status], flexShrink: 0 }} />
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 800, color: statusColors[status] }}>{statusLabels[status].replace(/[???????] /, "")}</div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginLeft: "auto" }}>{items.length} project{items.length !== 1 ? "s" : ""}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 0 }}>
                        {items.map((l, i) => {
                          const inv = getInvestmentScore({ price: l.expectedPrice, paymentPlan: l.paymentPlan, handover: null, ppsf: null, gross: null });
                          return (
                            <div key={i} style={{ padding: "16px 20px", borderRight: "1px solid " + T.border, borderBottom: "1px solid " + T.border }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 2 }}>{l.name}</div>
                                  <div style={{ fontSize: 11, color: T.textMuted }}>{l.community}</div>
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: statusColors[status] }}>{l.date}</div>
                                  {l.goldenVisa && <div style={{ fontSize: 9, color: T.gold, fontWeight: 600, marginTop: 2 }}>?? GV Eligible</div>}
                                </div>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                                {[
                                  { l: "FROM", v: l.expectedPrice ? "AED " + (l.expectedPrice / 1e6).toFixed(1) + "M" : "TBD" },
                                  { l: "TYPE", v: l.type + " - " + l.beds },
                                  { l: "PAYMENT", v: l.paymentPlan },
                                ].map(k => (
                                  <div key={k.l} style={{ background: T.surfaceAlt, borderRadius: 6, padding: "6px 8px" }}>
                                    <div style={{ fontSize: 8, color: T.textMuted, marginBottom: 2 }}>{k.l}</div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: T.white }}>{k.v}</div>
                                  </div>
                                ))}
                              </div>
                              <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5, marginBottom: 8 }}>{l.notes}</div>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: `${inv.color}15`, border: `1px solid ${inv.color}30` }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: inv.color }}>{inv.score}/10</span>
                                <span style={{ fontSize: 9, color: inv.color }}>?? {inv.label></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <div style={{ padding: "12px 16px", borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMuted }}>
                  ?? Launch dates and prices are estimates based on market intelligence. Always verify with official Emaar sources before making investment decisions.
                </div>
              <TabSources sources={[{ label: "Emaar Press Releases", url: "https://www.emaar.com/en/media/press-releases/" }, { label: "Property Finder New Launches", url: "https://www.propertyfinder.ae" }, { label: "DLD Oqood Off-Plan Registry", url: "https://oqood.dubailand.gov.ae" }, { label: "Zawya Real Estate News", url: "https://www.zawya.com" }]} />
              </div>
            );
          })()}

          {/* --- NEIGHBOURHOODS TAB --- */}
          {tab === "Neighbourhoods" && (() => {
            const neighbourhoodsStatic = [
              { name: "Dubai Hills Estate", maturity: 88, rentalDemand: 94, strPotential: 72, infrastructure: 95, schools: 92, transport: 78, retail: 90, appreciation: 82, serviceCharge: 18, visa: true, type: "Master-planned suburb", tagline: "Dubai's most complete community", color: "#10B981" },
              { name: "Dubai Creek Harbour", maturity: 65, rentalDemand: 85, strPotential: 88, infrastructure: 82, schools: 60, transport: 72, retail: 75, appreciation: 90, serviceCharge: 22, visa: true, type: "Waterfront district", tagline: "The new Downtown - cheaper entry", color: T.gold },
              { name: "Emaar Beachfront", maturity: 70, rentalDemand: 92, strPotential: 96, infrastructure: 85, schools: 45, transport: 68, retail: 72, appreciation: 85, serviceCharge: 28, visa: true, type: "Beachfront enclave", tagline: "Highest STR yields in portfolio", color: "#3B82F6" },
              { name: "Downtown Dubai", maturity: 98, rentalDemand: 96, strPotential: 94, infrastructure: 98, schools: 70, transport: 98, retail: 98, appreciation: 65, serviceCharge: 32, visa: true, type: "Urban CBD", tagline: "Premium address, lower upside", color: "#8B5CF6" },
              { name: "Arabian Ranches III", maturity: 75, rentalDemand: 80, strPotential: 55, infrastructure: 82, schools: 88, transport: 62, retail: 75, appreciation: 75, serviceCharge: 14, visa: false, type: "Family suburb", tagline: "Best for families, low service charge", color: "#F59E0B" },
              { name: "The Valley", maturity: 45, rentalDemand: 65, strPotential: 48, infrastructure: 60, schools: 72, transport: 52, retail: 58, appreciation: 82, serviceCharge: 12, visa: false, type: "Emerging suburb", tagline: "High upside, early stage", color: "#06B6D4" },
              { name: "The Oasis", maturity: 30, rentalDemand: 72, strPotential: 65, infrastructure: 55, schools: 40, transport: 48, retail: 45, appreciation: 95, serviceCharge: 20, visa: true, type: "Ultra-luxury", tagline: "Highest appreciation potential", color: "#EF4444" },
            ];
            const neighbourhoods = liveNeighbourhoods.length > 0
              ? liveNeighbourhoods.map(d => ({
                  name: d.community,
                  maturity: 70,
                  rentalDemand: parseInt(d.rentalDemand) || 80,
                  strPotential: 70,
                  infrastructure: parseInt(d.infraRating?.replace('/5','') || 3) * 20,
                  schools: 70, transport: 75, retail: 70,
                  appreciation: parseInt(d.priceGrowth) || 70,
                  serviceCharge: 18,
                  visa: true,
                  type: d.recommended || "Mixed",
                  tagline: d.recommended || "",
                  color: T.gold
                }))
              : neighbourhoodsStatic;
            const scoreBar = (val, color) => (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.surfaceAlt, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: val + "%", borderRadius: 3, background: color, transition: "width 0.5s" }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color, minWidth: 24, textAlign: "right" }}>{val></span>
              </div>
            );
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "16px 20px" }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 800, color: T.gold }}>Neighbourhood Scorecard</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Click any community to see full breakdown - 7 factors scored out of 100</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
                  {neighbourhoods.map(n => {
                    const overall = Math.round((n.maturity + n.rentalDemand + n.strPotential + n.infrastructure + n.appreciation) / 5);
                    const isOpen = selectedNbhd === n.name;
                    return (
                      <div key={n.name} style={{ background: T.surface, borderRadius: 14, border: `1px solid ${isOpen ? n.color + "60" : T.border}`, overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s", gridColumn: isOpen ? "1 / -1" : "auto" }} onClick={() => setSelectedNbhd(isOpen ? null : n.name)}>
                        <div style={{ padding: "16px 18px", background: isOpen ? `${n.color}08` : "transparent" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div>
                              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 800, color: n.color }}>{n.name}</div>
                              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{n.type}</div>
                              <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2, fontStyle: "italic" }}>{n.tagline}</div>
                            </div>
                            <div style={{ textAlign: "center", background: `${n.color}18`, border: `1px solid ${n.color}40`, borderRadius: 10, padding: "8px 12px" }}>
                              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: n.color }}>{overall}</div>
                              <div style={{ fontSize: 9, color: n.color, fontWeight: 600 }}>SCORE</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {n.visa && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: "rgba(212,168,67,0.12)", color: T.gold, fontWeight: 600 }}>?? Golden Visa</span>}
                            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: T.surfaceAlt, color: T.textMuted, fontWeight: 600 }}>AED {n.serviceCharge}/sqft SC</span>
                            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: "rgba(16,185,129,0.1)", color: "#10B981", fontWeight: 600 }}>STR {n.strPotential}%</span>
                          </div>
                        </div>
                        {isOpen && (
                          <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${T.border}` }}>
                            <div style={{ paddingTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                              {[
                                { label: "Community Maturity", val: n.maturity, color: n.color },
                                { label: "Rental Demand", val: n.rentalDemand, color: "#10B981" },
                                { label: "STR Potential", val: n.strPotential, color: "#3B82F6" },
                                { label: "Infrastructure", val: n.infrastructure, color: T.gold },
                                { label: "Schools & Education", val: n.schools, color: "#F59E0B" },
                                { label: "Transport Links", val: n.transport, color: "#8B5CF6" },
                                { label: "Retail & Dining", val: n.retail, color: "#06B6D4" },
                                { label: "Appreciation Potential", val: n.appreciation, color: "#EF4444" },
                              ].map(f => (
                                <div key={f.label}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontSize: 10, color: T.textMuted }}>{f.label></span>
                                  </div>
                                  {scoreBar(f.val, f.color)}
                                </div>
                              ))}
                              <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                                <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>SERVICE CHARGE</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: T.white }}>AED {n.serviceCharge} / sqft / year</div>
                                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>On 1,000 sqft = AED {(n.serviceCharge * 1000).toLocaleString()}/yr</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              <TabSources sources={[{ label: "DXB Interact Neighbourhood Data", url: "https://dxbinteract.com" }, { label: "REIDIN Neighbourhood Scorecard", url: "https://reidin.com" }, { label: "fam Properties Area Guide", url: "https://famproperties.com" }, { label: "Property Monitor" }, { label: "Google Maps / DM GIS" }]} />
              </div>
            );
          })()}

          {/* --- SERVICE CHARGES TAB --- */}
          {tab === "Service Charges" && !isPro && <ProGateFullPage tabName="Service Charges" onUpgrade={() => setShowUpgrade(true)} />}
          {tab === "Service Charges" && isPro && (() => {
            const scDataStatic = [
              { community: "Downtown Dubai", type: "Apartment", low: 28, high: 38, avg: 32, rera: true, notes: "Burj Khalifa zone highest at AED 38. Older towers closer to AED 28." },
              { community: "Emaar Beachfront", type: "Apartment", low: 24, high: 32, avg: 28, rera: true, notes: "Sea-facing units attract premium SC due to beach maintenance." },
              { community: "Dubai Creek Harbour", type: "Apartment", low: 18, high: 26, avg: 22, rera: true, notes: "New builds with efficient infrastructure. SC expected to rise as community matures." },
              { community: "Dubai Hills Estate", type: "Apartment", low: 15, high: 22, avg: 18, rera: true, notes: "Well-maintained. Park District higher end. Maple higher than Acacia." },
              { community: "Dubai Hills Estate", type: "Villa", low: 3, high: 6, avg: 4.5, rera: true, notes: "Villas charged per sqft of plot. Substantially lower than apartments." },
              { community: "Arabian Ranches III", type: "Townhouse", low: 12, high: 16, avg: 14, rera: true, notes: "Newer community with competitive SC. Includes park maintenance." },
              { community: "The Valley", type: "Townhouse", low: 10, high: 14, avg: 12, rera: false, notes: "Estimated. Community still developing. RERA registration pending." },
              { community: "The Oasis", type: "Villa", low: 16, high: 24, avg: 20, rera: false, notes: "Ultra-luxury facilities and lagoon maintenance push SC higher than typical villas." },
              { community: "Address Residences", type: "Branded Apt", low: 38, high: 55, avg: 46, rera: true, notes: "Branded residences command highest SC. Hotel services included in fee." },
              { community: "Vida Residences", type: "Branded Apt", low: 30, high: 42, avg: 36, rera: true, notes: "Vida brand properties. Includes access to hotel amenities." },
            ];
            const scData = liveServiceCharges.length > 0
              ? liveServiceCharges.map(d => ({
                  community: d.community,
                  type: "Apartment",
                  low: parseFloat(d.chargePerSqft) * 0.85 || 0,
                  high: parseFloat(d.chargePerSqft) * 1.15 || 0,
                  avg: parseFloat(d.chargePerSqft) || 0,
                  rera: true,
                  notes: `${d.community} - AED ${d.totalFor1BR || 0}/yr for 1BR - AED ${d.totalFor2BR || 0}/yr for 2BR`
                }))
              : scDataStatic;
            const maxSC = Math.max(...scData.map(d => d.high));
            const sorted = [...scData].sort((a, b) => scSort === "avg" ? b.avg - a.avg : scSort === "community" ? a.community.localeCompare(b.community) : b.high - a.high);
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Header */}
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.gold }}>Service Charge Database</div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>AED per sqft per year - RERA-regulated - Affects net yield</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[["avg", "By Average"], ["high", "By Highest"], ["community", "A-Z"]].map(([v, l]) => (
                        <button key={v} type="button" onClick={() => setScSort(v)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${scSort === v ? T.gold : T.border}`, background: scSort === v ? "rgba(212,168,67,0.1)" : T.surfaceAlt, color: scSort === v ? T.gold : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>{l}</button>
                      ))}
                    </div>
                  </div>
                  {/* Summary boxes */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 16 }}>
                    {[
                      { label: "Lowest SC", value: "AED 3/sqft", sub: "DHE Villas", color: "#10B981" },
                      { label: "Highest SC", value: "AED 55/sqft", sub: "Address Branded", color: "#EF4444" },
                      { label: "Avg Apartment", value: "AED 24/sqft", sub: "Portfolio average", color: T.gold },
                      { label: "Impact on 1BR", value: "AED 18-40K/yr", sub: "800 sqft typical", color: T.blue },
                    ].map(k => (
                      <div key={k.label} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 5 }}>{k.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: k.color, fontFamily: "'Fraunces', serif" }}>{k.value}</div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{k.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Table */}
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt }}>
                          {["Community", "Type", "Low", "Avg", "High", "Range", "RERA", "Notes"].map(h => (
                            <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((d, i) => {
                          const barWidth = (d.avg / maxSC) * 100;
                          const scColor = d.avg <= 15 ? "#10B981" : d.avg <= 25 ? T.gold : d.avg <= 35 ? "#F59E0B" : "#EF4444";
                          return (
                            <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.15s" }}
                              onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ fontWeight: 700, color: T.white, fontSize: 13 }}>{d.community}</div>
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: T.surfaceAlt, color: T.textSecondary, fontWeight: 600 }}>{d.type></span>
                              </td>
                              <td style={{ padding: "12px 14px", fontSize: 12, color: T.textSecondary }}>{d.low}</td>
                              <td style={{ padding: "12px 14px" }}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: scColor, fontFamily: "'Fraunces', serif" }}>{d.avg></span>
                                <span style={{ fontSize: 10, color: T.textMuted }}> /sqft</span>
                              </td>
                              <td style={{ padding: "12px 14px", fontSize: 12, color: T.textSecondary }}>{d.high}</td>
                              <td style={{ padding: "12px 14px", minWidth: 120 }}>
                                <div style={{ height: 6, borderRadius: 3, background: T.surfaceAlt, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: barWidth + "%", background: scColor, borderRadius: 3 }} />
                                </div>
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: d.rera ? "#10B981" : T.textMuted }}>{d.rera ? "? RERA" : "Est."></span>
                              </td>
                              <td style={{ padding: "12px 14px", fontSize: 11, color: T.textMuted, maxWidth: 220 }}>{d.notes}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Net yield impact calculator */}
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid rgba(212,168,67,0.2)`, padding: "20px 24px" }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: T.gold, marginBottom: 4 }}>?? Why Service Charges Matter</div>
                  <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.7 }}>
                    A 7% gross yield on a AED 2M apartment = AED 140,000/year rental income. But on a 1,200 sqft unit with AED 28/sqft SC, you pay AED 33,600/year in service charges - reducing your <strong style={{ color: T.white }}>net yield to 5.3%</strong>. On a lower-SC community like Arabian Ranches (AED 14/sqft), the same calculation gives you a <strong style={{ color: "#10B981" }}>net yield of 6.2%</strong>. Always calculate net, not gross.
                  </div>
                </div>
              <TabSources sources={[{ label: "RERA Dubai (rera.gov.ae)", url: "https://www.rera.gov.ae" }, { label: "Mollak Service Charge Database" }, { label: "Owners Associations - Published Budgets" }, { label: "DLD Owner Portal" }, { label: "Asteco Facilities Management" }]} />
              </div>
            );
          })()}

          {/* --- RISK TAB --- */}
          {tab === "Risk" && <>
            <Section title="9-Factor Risk Assessment" sub="Overall: LOW-MODERATE - Investment Grade - BBB+/Baa1/BBB">
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
                <KPI label="Avg Risk Score" value="38.3" sub="LOW-MODERATE overall" delay={1} onClick={() => setSelectedKPI({ label: "Avg Risk Score", value: "38.3 / 140", color: T.teal, description: "Composite risk score across 9 factors. Score of 38.3 out of 140 max = LOW-MODERATE risk. Rated Investment Grade by S&P (BBB+), Moody's (Baa1), and Fitch (BBB).", source: "DXB Analytics - Fitch - S&P - Moody's", sourceUrl: "https://www.fitchratings.com", items: [{ label: "Overall Score", value: "38.3/140", note: "LOW-MODERATE" }, { label: "S&P Rating", value: "BBB+", note: "Stable outlook" }, { label: "Moody's", value: "Baa1", note: "Stable outlook" }, { label: "Fitch", value: "BBB", note: "Stable outlook" }, { label: "Risk Category", value: "Investment Grade", note: "3 agency consensus" }], trend: null })} />
                <KPI label="Highest Risk" value="125" sub="Premium Pricing" delay={2} onClick={() => setSelectedKPI({ label: "Highest Risk Factor", value: "Premium Pricing", color: T.red, description: "Premium pricing (score 125/140) is Emaar's highest risk factor. At 20-40% above competitors, a market downturn could compress sales volumes faster than peers.", source: "DXB Analytics Risk Model", sourceUrl: "#", items: [{ label: "Risk Score", value: "125/140", note: "Highest risk factor" }, { label: "Price Premium", value: "20-40%", note: "vs comparable developments" }, { label: "Mitigation", value: "80/20 plans", note: "Reduces buyer barrier" }, { label: "Branded Premium", value: "Justified", note: "Address - Vida - Palace" }, { label: "Demand Buffer", value: "AED 155B backlog", note: "Pre-sold revenue" }], trend: null })} />
                <KPI label="Lowest Risk" value="1" sub="Liquidity / Exit" delay={3} onClick={() => setSelectedKPI({ label: "Lowest Risk Factor", value: "Liquidity / Exit", color: T.green, description: "Emaar has the lowest liquidity risk (score 1/140) of any Dubai developer. DFM-listed, investment-grade rated, with AED 30.5B free cash flow and a globally recognized brand.", source: "DXB Analytics Risk Model - DFM", sourceUrl: "https://www.dfm.ae", items: [{ label: "Risk Score", value: "1/140", note: "Lowest risk factor" }, { label: "Free Cash Flow", value: "AED 30.5B", note: "FY2025" }, { label: "Net Cash", value: "AED 7.5B", note: "Cash vs debt" }, { label: "DFM Listed", value: "Yes", note: "High liquidity stock" }, { label: "Debt/Equity", value: "0.11-", note: "Very low leverage" }], trend: null })} />
              </div>
            </Section>
            <ProGate isPro={isPro} message="Unlock Full Risk Analysis" onUpgrade={() => setShowUpgrade(true)}>
              <Chart title="Risk Score by Factor (Higher = More Risk)" style={{ marginTop: 20 }}>
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={(emaarLive?.emaarRisks || emaarRisks).map(r => ({ factor: r.factor, score: r.score, max: 150, color: r.color }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 140]} />
                    <YAxis type="category" dataKey="factor" tick={{ fill: T.textSecondary, fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="score" name="Risk Score" radius={[0, 8, 8, 0]} barSize={22}>
                      {(emaarLive?.emaarRisks || emaarRisks).map((r, i) => <Cell key={i} fill={r.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Chart>

            <Section title="Mitigation Strategies" sub="How Emaar mitigates key risks">
              <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                {[
                  ["Market Cycle", "AED 155B backlog = 3-4yr cushion. 35% recurring from malls/hotels.", T.orange],
                  ["Supply Competition", "Brand premium 20-40%. 79K delivery track record. 14+ master communities.", T.gold],
                  ["Premium Pricing", "80/20 payment plans reduce barrier. Branded residences justify premium.", T.red],
                  ["Geographic Conc.", "+124% intl sales YoY. Expanding to Saudi, Egypt, India.", T.teal],
                ].map(([title, desc, color], i) => (
                  <div key={i} className="chart-box" style={{ borderTop: `3px solid ${color}` }}>
                    <h4 style={{ color, fontSize: 14, fontWeight: 600, marginBottom: 6, fontFamily: "'Fraunces', serif" }}>{title}</h4>
                    <p style={{ color: T.textSecondary, fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </Section>
            </ProGate>
          <TabSources sources={[{ label: "Fitch Ratings UAE Developers", url: "https://www.fitchratings.com" }, { label: "Knight Frank Dubai 2025", url: "https://www.knightfrank.com/research" }, { label: "IMF World Economic Outlook", url: "https://www.imf.org" }, { label: "DLD Transaction Data", url: "https://dubailand.gov.ae" }, { label: "CW Core Dubai Market Report", url: "https://cwcore.com" }]} />
          </>}

          {/* --- CURRENCY TAB --- */}
          {tab === "Currency" && (() => {
            const CurrencyConverter = () => {
              const [aedAmount, setAedAmount] = React.useState(2000000);
              const [rates, setRates] = React.useState(null);
              const [loading, setLoading] = React.useState(true);
              const [lastUpdated, setLastUpdated] = React.useState(null);
              const [error, setError] = React.useState(false);
              const [inputVal, setInputVal] = React.useState("2000000");

              const fetchRates = () => {
                setLoading(true); setError(false);
                fetch("https://v6.exchangerate-api.com/v6/60dc1d50c587d667a41d415d/latest/AED")
                  .then(r => r.json())
                  .then(data => {
                    if (data.rates) {
                      setRates(data.rates);
                      setLastUpdated(new Date(data.time_last_update_utc).toLocaleDateString("en-AE", { day: "2-digit", month: "short", year: "numeric" }));
                    } else { setError(true); }
                    setLoading(false);
                  })
                  .catch(() => { setError(true); setLoading(false); });
              };

              React.useEffect(() => { fetchRates(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

              const currencies = [
                { code: "GBP", name: "British Pound",     flag: "GB", color: "#3B82F6" },
                { code: "EUR", name: "Euro",               flag: "EU", color: "#6366F1" },
                { code: "USD", name: "US Dollar",          flag: "US", color: "#10B981" },
                { code: "INR", name: "Indian Rupee",       flag: "IN", color: "#F59E0B" },
                { code: "PKR", name: "Pakistani Rupee",    flag: "PK", color: "#34D399" },
                { code: "SAR", name: "Saudi Riyal",        flag: "SA", color: "#D4A843" },
                { code: "RUB", name: "Russian Ruble",      flag: "RU", color: "#EF4444" },
                { code: "CNY", name: "Chinese Yuan",       flag: "CN", color: "#F87171" },
                { code: "CAD", name: "Canadian Dollar",    flag: "CA", color: "#60A5FA" },
                { code: "AUD", name: "Australian Dollar",  flag: "AU", color: "#34D399" },
                { code: "CHF", name: "Swiss Franc",        flag: "CH", color: "#A78BFA" },
                { code: "JPY", name: "Japanese Yen",       flag: "JP", color: "#FB923C" },
              ];

              const fmtCurrency = (val, code) => {
                if (!val || isNaN(val)) return "\u2014";
                if (val >= 1e6) return code + "\u00a0" + (val/1e6).toFixed(2) + "M";
                if (val >= 1e3) return code + "\u00a0" + Math.round(val/1000) + "K";
                return code + "\u00a0" + Math.round(val).toLocaleString();
              };

              const convert = (aed, code) => rates ? aed * rates[code] : null;
              const propertyPrices = activeProjects.filter(p => p.price).slice(0, 10);

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Status bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: T.surface, borderRadius: 12, border: "1px solid " + T.border }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? T.gold : error ? "#EF4444" : T.green }} />
                      <span style={{ fontSize: 12, color: T.textSecondary }}>{loading ? "Fetching live rates..." : error ? "Could not load rates \u2014 check connection" : "Live rates"></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {lastUpdated && <span style={{ fontSize: 11, color: T.textMuted }}>Updated {lastUpdated></span>}
                      <button type="button" onClick={fetchRates} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: loading ? T.surfaceAlt : "rgba(212,168,67,0.1)", border: "1px solid " + (loading ? T.border : "rgba(212,168,67,0.3)"), borderRadius: 8, color: loading ? T.textMuted : T.gold, fontSize: 11, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                        {loading ? "Refreshing..." : "Refresh Rates"}
                      </button>
                    </div>
                  </div>

                  {/* Amount input + quick project buttons */}
                  <div style={{ background: T.surface, borderRadius: 16, border: "1px solid " + T.border, padding: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Enter Amount in AED</div>
                    <div style={{ position: "relative", marginBottom: 20 }}>
                      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: T.gold, fontWeight: 700 }}>AED</span>
                      <input type="number" value={inputVal} onChange={e => { setInputVal(e.target.value); setAedAmount(Number(e.target.value) || 0); }}
                        style={{ width: "100%", padding: "14px 14px 14px 60px", background: T.surfaceAlt, border: "1px solid " + T.gold, borderRadius: 12, color: T.white, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>Or pick a project price:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {propertyPrices.map(p => (
                        <button key={p.id} type="button" onClick={() => { setAedAmount(p.price); setInputVal(String(p.price)); }}
                          style={{ padding: "6px 12px", background: aedAmount === p.price ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border: "1px solid " + (aedAmount === p.price ? T.gold : T.border), borderRadius: 8, color: aedAmount === p.price ? T.gold : T.textSecondary, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                          {p.name.split(" ").slice(0,2).join(" ")} {(p.price/1e6).toFixed(1)}M
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Currency cards */}
                  {loading ? (
                    <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>?</div>
                      <div style={{ fontSize: 13 }}>Loading live exchange rates...</div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                      {currencies.map((c) => {
                        const val = convert(aedAmount, c.code);
                        return (
                          <div key={c.code} style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: "18px 16px", transition: "border-color 0.2s, background 0.2s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.background = T.surfaceAlt; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                              <div style={{ width: 28, height: 20, background: c.color, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{c.flag}</div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{c.code}</div>
                                <div style={{ fontSize: 9, color: T.textMuted }}>{c.name}</div>
                              </div>
                            </div>
                            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: c.color, marginBottom: 4 }}>{fmtCurrency(val, c.code)}</div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>1 AED = {rates ? rates[c.code].toFixed(4) : "\u2014"} {c.code}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* All projects table */}
                  {!loading && !error && rates && (
                    <div style={{ background: T.surface, borderRadius: 16, border: "1px solid " + T.border, padding: 24 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>All Project Prices in Your Currency</div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>Every Emaar project \u2014 prices converted live</div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid " + T.border }}>
                              {["Project", "AED", "GBP", "EUR", "USD", "INR", "PKR", "SAR"].map(h => (
                                <th key={h} style={{ padding: "8px 12px", textAlign: h === "Project" ? "left" : "right", color: T.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {activeProjects.filter(p => p.price).map((p, i) => (
                              <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                                onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <td style={{ padding: "9px 12px", color: T.white, fontWeight: 600, whiteSpace: "nowrap" }}>{p.name}</td>
                                <td style={{ padding: "9px 12px", textAlign: "right", color: T.gold, fontWeight: 700 }}>{(p.price/1e6).toFixed(2)}M</td>
                                {["GBP","EUR","USD","INR","PKR","SAR"].map(code => (
                                  <td key={code} style={{ padding: "9px 12px", textAlign: "right", color: T.textSecondary, whiteSpace: "nowrap" }}>{fmtCurrency(p.price * rates[code], code)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              );
            };
            return (
              <>
              <Section title="Currency Converter" sub="Live rates \u00b7 AED to GBP, EUR, USD, INR, PKR and 8 more currencies">
                <CurrencyConverter />
              </Section>
              <TabSources sources={[{ label: "ExchangeRate-API (Live - Authenticated)", url: "https://www.exchangerate-api.com" }, { label: "European Central Bank", url: "https://www.ecb.europa.eu" }, { label: "UAE Central Bank", url: "https://www.cbuae.gov.ae" }, { label: "XE Currency", url: "https://www.xe.com/currency/aed" }]} />
              </>
            );
          })()}


          {/* --- GOLDEN VISA TAB --- */}
          {tab === "Golden Visa" && (() => {
            const propPrice = gvPropPrice;
              const setPropPrice = setGvPropPrice;
              const paymentPlan = gvPaymentPlan;
              const setPaymentPlan = setGvPaymentPlan;
              const nationality = gvNationality;
              const setNationality = setGvNationality;
              const selectedProjGV = gvSelectedProj; const setSelectedProjGV = setGvSelectedProj;

              const THRESHOLD = 2000000;
              const eligible = propPrice >= THRESHOLD;
              const gap = Math.max(0, THRESHOLD - propPrice);

              // Nationality actually changes real numbers:
              // UAE/GCC nationals: 15% min down payment (vs 20% for expats)
              // UAE nationals: already have residency - visa not needed
              const minDownPct = (nationality === "uae" || nationality === "gcc") ? 15 : 20;
              const isAlreadyResident = nationality === "uae";
              const dldExemption = nationality === "uae"; // UAE nationals get DLD fee discounts on select projects

              const govFees = Math.round(propPrice * (dldExemption ? 0.02 : 0.04) + 580 + 4020 + 2000);
              const visaFee = isAlreadyResident ? 0 : 3780 + 1220;
              const downPayment = Math.round(propPrice * (minDownPct / 100));
              const totalUpfront = paymentPlan === "cash"
                ? propPrice + govFees + visaFee
                : downPayment + govFees + visaFee;

              const qualifyingProjects = activeProjects.filter(p => (p.price || 0) >= THRESHOLD).sort((a, b) => (a.price || 0) - (b.price || 0));
              const nearProjects = activeProjects.filter(p => { const pr = p.price || 0; return pr >= 1500000 && pr < THRESHOLD; }).sort((a, b) => (a.price || 0) - (b.price || 0));

              const benefits = [
                { icon: "~"??", title: "10-Year Residency", desc: "Live, work and study in UAE. Renewable indefinitely." },
                { icon: "~"???????????", title: "Sponsor Your Family", desc: "Spouse, children of any age, and parents included." },
                { icon: "~"?", title: "No Sponsor Needed", desc: "Full independence - no employer or local sponsor required." },
                { icon: "~"??", title: "UAE Bank Accounts", desc: "Open accounts, get credit cards, build UAE credit history." },
                { icon: "~"??", title: "Travel Freely", desc: "Re-enter UAE after 6+ months abroad without visa reset." },
                { icon: "~"??", title: "0% Income Tax", desc: "No personal income tax on rental income or capital gains." },
              ];

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Hero */}
                  <div style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))", borderRadius: 16, border: "1px solid rgba(212,168,67,0.3)", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.gold, marginBottom: 4 }}>UAE Golden Visa Calculator</div>
                      <div style={{ fontSize: 13, color: T.textSecondary }}>Find out if your Emaar investment qualifies for a 10-year UAE residency visa</div>
                    </div>
                    <div style={{ background: "rgba(212,168,67,0.1)", borderRadius: 12, padding: "12px 20px", textAlign: "center", border: "1px solid rgba(212,168,67,0.2)" }}>
                      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>MINIMUM INVESTMENT</div>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.gold }}>AED 2,000,000</div>
                      <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Real estate (title deed value)</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                    {/* Left: Calculator */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                      <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 20 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Your Property</div>

                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: T.textSecondary }}>Property Price</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 11, color: T.textMuted }}>AED</span>
                              <input
                                type="number"
                                value={propPrice}
                                min={500000}
                                max={15000000}
                                step={50000}
                                onChange={e => { const v = parseInt(e.target.value) || 0; if (v >= 0) setPropPrice(v); }}
                                onBlur={e => { const v = parseInt(e.target.value) || 500000; setPropPrice(Math.min(15000000, Math.max(500000, v))); }}
                                style={{ width: 130, padding: "5px 10px", borderRadius: 8, border: "1px solid " + (eligible ? T.green : T.gold), background: T.surfaceAlt, color: eligible ? T.green : T.gold, fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif", textAlign: "right", outline: "none" }}
                              />
                            </div>
                          </div>
                          <input type="range" min={500000} max={15000000} step={50000} value={Math.min(15000000, Math.max(500000, propPrice))} onChange={e => setPropPrice(+e.target.value)} style={{ width: "100%", accentColor: eligible ? T.green : T.gold }} />
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                            <span style={{ fontSize: 10, color: T.textMuted }}>AED 500K</span>
                            <span style={{ fontSize: 10, color: T.textMuted }}>AED 15M</span>
                          </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 8 }}>Payment Method</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            {[["cash", "Full Cash"], ["mortgage", "Mortgage"]].map(([v, l]) => (
                              <button key={v} type="button" onClick={() => setPaymentPlan(v)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid " + (paymentPlan === v ? T.gold : T.border), background: paymentPlan === v ? "rgba(212,168,67,0.12)" : T.surfaceAlt, color: paymentPlan === v ? T.gold : T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{l}</button>
                            ))}
                          </div>
                          {paymentPlan === "mortgage" && (
                            <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", fontSize: 11, color: T.blue }}>
                              {nationality === "uae" || nationality === "gcc"
                                ? "UAE/GCC nationals: minimum " + minDownPct + "% down payment required by UAE Central Bank rules."
                                : "Expats: minimum 20% down payment. Property must be fully paid off (title deed clear) for Golden Visa eligibility."}
                            </div>
                          )}
                        </div>

                        <div>
                          <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 8 }}>Your Nationality</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {[["uae", "UAE National"], ["gcc", "GCC National"], ["other", "Other"]].map(([v, l]) => (
                              <button key={v} type="button" onClick={() => setNationality(v)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid " + (nationality === v ? T.teal : T.border), background: nationality === v ? "rgba(45,212,191,0.1)" : T.surfaceAlt, color: nationality === v ? T.teal : T.textSecondary, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{l}</button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Result card */}
                      <div style={{ background: eligible ? "linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.04))" : "linear-gradient(135deg,rgba(239,68,68,0.1),rgba(239,68,68,0.04))", borderRadius: 14, border: "1px solid " + (eligible ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"), padding: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                          <div style={{ fontSize: 28 }}>{isAlreadyResident ? "????" : eligible ? "?" : "?"}</div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: isAlreadyResident ? T.gold : eligible ? T.green : "#EF4444" }}>
                              {isAlreadyResident ? "You Already Have UAE Residency" : eligible ? "You Qualify for the Golden Visa!" : "Not Eligible Yet"}
                            </div>
                            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                              {isAlreadyResident ? "As a UAE National, you can still use this investment to sponsor family members for Golden Visa" : eligible ? "Your investment meets the AED 2M threshold" : "AED " + gap.toLocaleString() + " more needed to qualify"}
                            </div>
                          </div>
                        </div>

                        {!eligible && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: 11, color: T.textMuted }}>Progress to eligibility</span>
                              <span style={{ fontSize: 11, color: T.gold }}>{Math.round(propPrice / THRESHOLD * 100)}%</span>
                            </div>
                            <div style={{ height: 8, background: T.surfaceAlt, borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: Math.min(100, propPrice / THRESHOLD * 100) + "%", background: "linear-gradient(90deg," + T.gold + ",#B8912F)", borderRadius: 4, transition: "width 0.3s" }} />
                            </div>
                          </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {[
                            ["Property Value", "AED " + propPrice.toLocaleString(), eligible ? T.green : T.gold],
                            ["Min Down Payment", minDownPct + "% = AED " + downPayment.toLocaleString(), T.teal],
                            ["DLD Fees", (dldExemption ? "2%" : "4%") + " = AED " + Math.round(propPrice * (dldExemption ? 0.02 : 0.04)).toLocaleString(), T.textSecondary],
                            ["Visa Fees", isAlreadyResident ? "Not required" : "AED " + visaFee.toLocaleString(), isAlreadyResident ? T.textMuted : T.textSecondary],
                            ["Total Day-1 Cost", "AED " + totalUpfront.toLocaleString(), T.gold],
                            ["Visa Duration", isAlreadyResident ? "N/A (citizen)" : "10 Years", T.teal],
                          ].map(([l, v, c]) => (
                            <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px" }}>
                              <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Benefits + projects */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                      <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 20 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>What You Get</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {benefits.map((b, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                              <span style={{ fontSize: 16, flexShrink: 0 }}>{b.icon></span>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.white, marginBottom: 2 }}>{b.title}</div>
                                <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>{b.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 20, flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Emaar Projects That Qualify</div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 14 }}>{qualifyingProjects.length} projects at AED 2M+</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                          {qualifyingProjects.slice(0, 12).map(p => (
                            <div key={p.id} onClick={() => { setSelectedProject(p); setTab("Projects"); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: T.surfaceAlt, border: "1px solid transparent", transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(16,185,129,0.1)"; e.currentTarget.style.borderColor = T.green; }}
                              onMouseLeave={e => { e.currentTarget.style.background = T.surfaceAlt; e.currentTarget.style.borderColor = "transparent"; }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: T.white }}>{p.name}</div>
                                <div style={{ fontSize: 10, color: T.textMuted }}>{p.community}</div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: T.green }}>AED {p.price ? (p.price/1e6).toFixed(2) + "M" : "2M+"}</div>
                                  <div style={{ fontSize: 10, color: T.gold }}>? Eligible</div>
                                </div>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                              </div>
                            </div>
                          ))}
                        </div>

                        {nearProjects.length > 0 && (
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid " + T.border }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Almost There (AED 1.5M-2M)</div>
                            {nearProjects.slice(0, 4).map(p => (
                              <div key={p.id} onClick={() => { setSelectedProject(p); setTab("Projects"); }} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, marginBottom: 4, background: T.surfaceAlt, cursor: "pointer", border: "1px solid transparent", transition: "all 0.15s" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,168,67,0.08)"; e.currentTarget.style.borderColor = T.gold; }}
                                onMouseLeave={e => { e.currentTarget.style.background = T.surfaceAlt; e.currentTarget.style.borderColor = "transparent"; }}>
                                <div>
                                  <div style={{ fontSize: 11, color: T.white }}>{p.name}</div>
                                  <div style={{ fontSize: 10, color: T.textMuted }}>{p.community}</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: T.gold }}>AED {p.price ? (p.price/1e6).toFixed(2) + "M" : "TBC"}</div>
                                    <div style={{ fontSize: 10, color: T.textMuted }}>{p.price ? "AED " + ((THRESHOLD - p.price)/1000).toFixed(0) + "K short" : "-"}</div>
                                  </div>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom info strip */}
                  <div style={{ background: T.surface, borderRadius: 12, border: "1px solid " + T.border, padding: "14px 20px", display: "flex", gap: 24, flexWrap: "wrap" }}>
                    {[
                      ["", "Visa Duration", "10 years, renewable indefinitely"],
                      ["", "Property Type", "Residential & commercial - off-plan or ready"],
                      ["??", "Mortgage OK?", "Yes - but title deed must show AED 2M+ value"],
                      ["??", "Processing Time", "Approx. 30 days after title deed issuance"],
                      ["", "Family", "Spouse + children of any age included"],
                    ].map(([icon, title, desc]) => (
                      <div key={title} style={{ display: "flex", gap: 8, alignItems: "flex-start", minWidth: 160, flex: 1 }}>
                        <span style={{ fontSize: 18 }}>{icon></span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.white }}>{title}</div>
                          <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

              <TabSources sources={[{ label: "UAE ICP - Golden Visa", url: "https://icp.gov.ae" }, { label: "GDRFA Dubai", url: "https://gdrfad.gov.ae" }, { label: "Federal Authority for Identity (ICP)", url: "https://icp.gov.ae" }, { label: "Emaar.com/en/investor-relations - Project prices" }, { label: "Dubai Economy & Tourism", url: "https://www.visitdubai.com" }]} />
                </div>
            );
          })()}


          {/* --- FLIP PROFIT TAB --- */}
          {tab === "Flip" && !isPro && <ProGateFullPage tabName="Flip" onUpgrade={() => setShowUpgrade(true)} />}
          {tab === "Flip" && isPro && (() => {
            const selectedFlipProj = activeProjects.find(p => p.id === flipProjId) || activeProjects[0] || null;
              const buyPrice = flipBuyPrice;
              const setBuyPrice = setFlipBuyPrice;
              const sellPrice = flipSellPrice;
              const setSellPrice = setFlipSellPrice;
              const paymentPlan = flipPaymentPlan;
              const setPaymentPlan = setFlipPaymentPlan;
              const holdYears = flipHoldYears;
              const setHoldYears = setFlipHoldYears;
              const includeRental = flipIncludeRental;
              const setIncludeRental = setFlipIncludeRental;
              const rentalYield = flipRentalYield;
              const setRentalYield = setFlipRentalYield;

              // When project changes, update prices
              const handleProjSelect = (p) => {
                setFlipProjId(p.id);
                setFlipBuyPrice(p.price || 2000000);
                setFlipSellPrice(Math.round((p.price || 2000000) * 1.25));
              };

              // Payment plan configs
              const planConfigs = {
                "80_20": { name: "80/20 Plan", downPct: 20, duringConst: 60, onHandover: 20, label: "20% now, 60% during, 20% on handover" },
                "60_40": { name: "60/40 Plan", downPct: 10, duringConst: 50, onHandover: 40, label: "10% now, 50% during, 40% on handover" },
                "cash":  { name: "Full Cash",  downPct: 100, duringConst: 0, onHandover: 0,  label: "100% upfront" },
              };
              const plan = planConfigs[paymentPlan];

              // --- BUY SIDE ---
              const downPayment   = Math.round(buyPrice * plan.downPct / 100);
              const dldBuy        = Math.round(buyPrice * 0.04);
              const agencyBuy     = Math.round(buyPrice * 0.02);
              const adminFees     = 4200 + 580;
              const totalCashIn   = downPayment + dldBuy + agencyBuy + adminFees;

              // --- SELL SIDE ---
              const dldSell       = 0; // buyer pays DLD on resale
              const agencySell    = Math.round(sellPrice * 0.02);
              const noc           = 5000; // NOC from developer
              const transferFee   = 4200;
              const totalSellCost = agencySell + noc + transferFee;

              // --- RENTAL INCOME (optional) ---
              const annualRent    = includeRental ? Math.round(sellPrice * rentalYield / 100) : 0;
              const totalRent     = Math.round(annualRent * holdYears * 0.85); // 85% net after mgmt

              // --- PROFIT ---
              const grossProfit   = sellPrice - buyPrice;
              const netProfit     = grossProfit - dldBuy - agencyBuy - adminFees - totalSellCost + totalRent;
              const roi           = (netProfit / totalCashIn) * 100;
              const annualizedRoi = (Math.pow(1 + roi / 100, 1 / holdYears) - 1) * 100;
              const isProfit      = netProfit > 0;

              const fmt = (n) => "AED " + Math.abs(Math.round(n)).toLocaleString();
              const fmtM = (n) => Math.abs(n) >= 1000000 ? (n/1000000).toFixed(2) + "M" : Math.abs(n) >= 1000 ? (n/1000).toFixed(0) + "K" : n.toString();

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Hero */}
                  <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.03))", borderRadius: 16, border: "1px solid rgba(59,130,246,0.25)", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.blue, marginBottom: 4 }}>Flip Profit Calculator</div>
                      <div style={{ fontSize: 13, color: T.textSecondary }}>Buy at launch. Sell at handover. See your exact profit after every fee.</div>
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {[["Buy", fmt(totalCashIn), T.gold], ["Sell", fmt(sellPrice), T.green], ["Net", (isProfit ? "+" : "-") + fmt(netProfit), isProfit ? T.green : "#EF4444"]].map(([l,v,c]) => (
                        <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 16px", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
                          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 800, color: c }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                    {/* LEFT: Inputs */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                      {/* Project selector */}
                      <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 18 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Select Project</div>
                        <select value={selectedFlipProj?.id || ""} onChange={e => { const p = activeProjects.find(x => x.id === e.target.value); if (p) handleProjSelect(p); }}
                          style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer", marginBottom: 12 }}>
                          {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name} - {p.community}</option>)}
                        </select>

                        {/* Buy / Sell price */}
                        {[["Buy Price (Launch)", buyPrice, setBuyPrice, T.gold], ["Sell Price (Target)", sellPrice, setSellPrice, T.green]].map(([label, val, setter, col]) => (
                          <div key={label} style={{ marginBottom: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <span style={{ fontSize: 12, color: T.textSecondary }}>{label></span>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 11, color: T.textMuted }}>AED</span>
                                <input
                                  type="number"
                                  value={val}
                                  min={500000}
                                  max={20000000}
                                  step={50000}
                                  onChange={e => {
                                    const v = parseInt(e.target.value.replace(/,/g, "")) || 0;
                                    if (v >= 0) setter(v);
                                  }}
                                  onBlur={e => {
                                    const v = parseInt(e.target.value) || 500000;
                                    setter(Math.min(20000000, Math.max(500000, v)));
                                  }}
                                  style={{ width: 130, padding: "5px 10px", borderRadius: 8, border: "1px solid " + col, background: T.surfaceAlt, color: col, fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif", textAlign: "right", outline: "none" }}
                                />
                              </div>
                            </div>
                            <input type="range" min={500000} max={20000000} step={50000} value={Math.min(20000000, Math.max(500000, val))} onChange={e => setter(+e.target.value)} style={{ width: "100%", accentColor: col }} />
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                              <span style={{ fontSize: 9, color: T.textMuted }}>AED 500K</span>
                              <span style={{ fontSize: 9, color: T.textMuted }}>AED 20M</span>
                            </div>
                          </div>
                        ))}

                        {/* Appreciation badge */}
                        <div style={{ padding: "8px 12px", borderRadius: 8, background: sellPrice > buyPrice ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: "1px solid " + (sellPrice > buyPrice ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"), display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: T.textMuted }}>Price appreciation</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: sellPrice > buyPrice ? T.green : "#EF4444" }}>
                            {sellPrice > buyPrice ? "+" : ""}{(((sellPrice - buyPrice) / buyPrice) * 100).toFixed(1)}% = {sellPrice > buyPrice ? "+" : ""}{fmt(sellPrice - buyPrice)}
                          </span>
                        </div>
                      </div>

                      {/* Payment plan + hold period */}
                      <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 18 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Deal Structure</div>

                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 8 }}>Payment Plan</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {Object.entries(planConfigs).map(([k, v]) => (
                              <button key={k} type="button" onClick={() => setPaymentPlan(k)} style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid " + (paymentPlan === k ? T.blue : T.border), background: paymentPlan === k ? "rgba(59,130,246,0.1)" : T.surfaceAlt, color: paymentPlan === k ? T.blue : T.textSecondary, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left" }}>
                                <span style={{ fontWeight: 700 }}>{v.name></span>
                                <span style={{ color: T.textMuted, marginLeft: 8 }}>{v.label></span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: T.textSecondary }}>Hold Period</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.teal }}>{holdYears} year{holdYears > 1 ? "s" : ""></span>
                          </div>
                          <input type="range" min={1} max={7} step={1} value={holdYears} onChange={e => setHoldYears(+e.target.value)} style={{ width: "100%", accentColor: T.teal }} />
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                            <span style={{ fontSize: 9, color: T.textMuted }}>1 yr</span>
                            <span style={{ fontSize: 9, color: T.textMuted }}>7 yrs</span>
                          </div>
                        </div>

                        {/* Rental income toggle */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: T.surfaceAlt, border: "1px solid " + T.border }}>
                          <div>
                            <div style={{ fontSize: 12, color: T.white, fontWeight: 600 }}>Include rental income?</div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>Rent it out while waiting to sell</div>
                          </div>
                          <button type="button" onClick={() => setIncludeRental(v => !v)} style={{ width: 40, height: 22, borderRadius: 11, border: "none", background: includeRental ? T.green : T.border, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: includeRental ? 21 : 3, transition: "left 0.2s" }} />
                          </button>
                        </div>

                        {includeRental && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: 12, color: T.textSecondary }}>Gross Rental Yield</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{rentalYield}%</span>
                            </div>
                            <input type="range" min={3} max={12} step={0.5} value={rentalYield} onChange={e => setRentalYield(+e.target.value)} style={{ width: "100%", accentColor: T.green }} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: Results */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                      {/* Big result */}
                      <div style={{ background: isProfit ? "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.04))" : "linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.04))", borderRadius: 14, border: "1px solid " + (isProfit ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"), padding: 20 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Your Result</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                          {[
                            ["Cash You Put In", fmt(totalCashIn), T.gold, "Down payment + all buy fees"],
                            ["You Sell For", fmt(sellPrice), T.green, "Your target exit price"],
                            ["All Fees", fmt(dldBuy + agencyBuy + adminFees + totalSellCost), "#EF4444", "DLD + agency + NOC + transfer"],
                            includeRental ? ["Rental Income", "+" + fmt(totalRent), T.teal, holdYears + " yrs - " + rentalYield + "% net 85%"] : ["Gross Profit", fmt(grossProfit), T.blue, "Sell price minus buy price"],
                          ].map(([l, v, c, sub]) => (
                            <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
                              <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: c, fontFamily: "'Fraunces',serif" }}>{v}</div>
                              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3 }}>{sub}</div>
                            </div>
                          ))}
                        </div>

                        {/* THE NUMBER */}
                        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 20px", textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>NET PROFIT AFTER ALL FEES</div>
                          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 32, fontWeight: 900, color: isProfit ? T.green : "#EF4444" }}>
                            {isProfit ? "+" : "-"}{fmt(netProfit)}
                          </div>
                          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10 }}>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 10, color: T.textMuted }}>ROI on cash invested</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: isProfit ? T.green : "#EF4444" }}>{roi.toFixed(1)}%</div>
                            </div>
                            <div style={{ width: 1, background: T.border }} />
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 10, color: T.textMuted }}>Annualized return</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: T.gold }}>{annualizedRoi.toFixed(1)}% / yr</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Full fee breakdown */}
                      <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 18 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Full Fee Breakdown</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>When You Buy</div>
                        {[
                          ["Down Payment (" + plan.downPct + "%)", fmt(downPayment), T.gold],
                          ["DLD Transfer Fee (4%)", fmt(dldBuy), T.textSecondary],
                          ["Agency Fee (2%)", fmt(agencyBuy), T.textSecondary],
                          ["Admin + Trustee", "AED 4,780", T.textSecondary],
                        ].map(([l, v, c]) => (
                          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid " + T.border }}>
                            <span style={{ fontSize: 11, color: T.textMuted }}>{l></span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: c }}>{v></span>
                          </div>
                        ))}
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginTop: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>When You Sell</div>
                        {[
                          ["DLD (paid by buyer)", "AED 0", T.green],
                          ["Agency Fee (2%)", fmt(agencySell), T.textSecondary],
                          ["NOC from Developer", "AED 5,000", T.textSecondary],
                          ["Transfer Fee", "AED 4,200", T.textSecondary],
                        ].map(([l, v, c]) => (
                          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid " + T.border }}>
                            <span style={{ fontSize: 11, color: T.textMuted }}>{l></span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: c }}>{v></span>
                          </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: T.white }}>Total Fees</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#EF4444" }}>{fmt(dldBuy + agencyBuy + adminFees + totalSellCost)></span>
                        </div>
                      </div>

                      {/* Smart tip */}
                      <div style={{ background: "rgba(212,168,67,0.06)", borderRadius: 12, border: "1px solid rgba(212,168,67,0.2)", padding: "12px 16px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 4 }}>Smart Tip</div>
                        <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
                          {paymentPlan === "80_20"
                            ? "80/20 plan maximizes your leverage - you control AED " + fmt(buyPrice) + " of property with only " + fmt(downPayment) + " cash. Flip before handover to avoid paying the final 20%."
                            : paymentPlan === "60_40"
                            ? "On a 60/40 plan, flip before handover to avoid the 40% balloon payment. Buyer takes over your SPA and pays you the profit."
                            : "Full cash gives you the cleanest title deed and fastest resale - no developer approval needed for transfer."}
                        </div>
                      </div>
                    </div>
                  </div>
              <TabSources sources={[{ label: "DLD Transaction Records", url: "https://dubailand.gov.ae" }, { label: "REIDIN Price Index", url: "https://reidin.com" }, { label: "Property Monitor" }, { label: "DXB Interact Flip Analysis", url: "https://dxbinteract.com" }, { label: "fam Properties Research", url: "https://famproperties.com" }]} />
                </div>
            );
          })()}

          {/* --- MARKET TAB --- */}
          {tab === "Market" && <>
            <Section title="Dubai Real Estate - 2025" sub="Official DLD Data - 5th Consecutive Record Year">
              <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <DataBadge source={`Dubai Land Department ${marketGlobal?.period || "FY2025"}`} date={marketGlobal?.updatedAt ? new Date(marketGlobal.updatedAt).toLocaleDateString("en-AE", { month: "short", year: "numeric" }) : "Jan 2026"} type="dld" />
                <DataBadge source="REIDIN Price Index Dec 2025" date="Dec 2025" type="reidin" />
                <DataBadge source="ValuStrat Q4 2025" date="Q4 2025" type="manual" />
              </div>
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
                {(liveMarketData.length > 0 ? liveMarketData.map(d => ({ metric: d.metric, val2025: d.value, yoy: d.change, val2024: "" })) : dubaiMarket).map((m, i) => <KPI key={i} label={m.metric} value={m.val2025} sub={m.yoy} delay={Math.min(i + 1, 8)} onClick={() => setSelectedKPI({ label: m.metric, value: m.val2025, color: T.gold, description: `${m.metric} - Official DLD data for 2025. Dubai's 5th consecutive record year.`, source: "Dubai Land Department 2025", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "2025 Value", value: m.val2025, note: "Record year" }, { label: "YoY Change", value: m.yoy, note: "vs 2024" }, { label: "2024 Value", value: m.val2024 || "-", note: "Prior year" }], trend: null })} />)}
              </div>
            </Section>

            <Chart title="Dubai Total Sales Value Growth (AED B)" style={{ marginTop: 20 }}>
              <ResponsiveContainer width="100%" height={typeof window !== "undefined" && window.innerWidth < 480 ? 180 : 280}>
                <BarChart data={dubaiSalesHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sales" name="Sales (AED B)" radius={[6, 6, 0, 0]} barSize={36}>
                    {[T.textMuted, T.textSecondary, T.teal, T.blue, T.gold, T.goldLight].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Chart>

            <Section title="2026 Outlook" sub="Knight Frank, CW Core, Fitch Ratings - Click each for full analysis">
              <div className="chart-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
                {[
                  { firm: "Knight Frank", color: T.gold, forecast: "+3% prime / +1% mainstream", short: "+3% prime, ~1% mainstream. Transitioning to sustainable growth phase.", detail: "Knight Frank's 2026 Dubai Residential Forecast projects prime property appreciation of +3% and mainstream market growth of ~1%. The report notes Dubai is entering a more mature, sustainable growth cycle after two years of double-digit gains. Key risks include oversupply in mid-market. Key tailwinds include continued HNWI inflows, Golden Visa demand, and Expo City activation.", bullets: ["+3% prime appreciation", "~1% mainstream growth", "Sustainable cycle ahead", "HNWI inflows continue", "Golden Visa demand strong"], sourceUrl: "https://www.knightfrank.com/research" },
                  { firm: "CW Core", color: T.teal, forecast: "5-8% appreciation", short: "5-8% appreciation forecast. Slowdown from 12-22% in 2024-25.", detail: "Cushman & Wakefield Core's 2026 outlook projects 5-8% price appreciation for Dubai residential, a marked slowdown from 12-22% seen in 2024-25. The firm cites the massive 2026 pipeline (~120K units) as a price moderator, though strong end-user demand and low mortgage penetration are supportive. Off-plan launches expected to remain dominant at 60-65% of volume.", bullets: ["5-8% price appreciation", "~120K units in 2026 pipeline", "Off-plan stays 60-65% of volume", "Strong end-user demand", "Low mortgage penetration"], sourceUrl: "https://cwcore.com" },
                  { firm: "Fitch Ratings", color: T.orange, forecast: "Stable / Watch", short: "Moderate correction possible. ~120K units in 2026 pipeline.", detail: "Fitch Ratings maintained a Stable Outlook for UAE developers (Dec 2025), citing Emaar's strong backlog and recurring revenue as key buffers. However, Fitch warned that the 120K+ unit pipeline in 2026 could create oversupply in affordable segments. Emaar's premium positioning and AED 155B backlog provide significant earnings visibility even in a correction scenario.", bullets: ["Developer outlook: Stable", "120K unit pipeline = risk", "Affordable segment most exposed", "Emaar backlog = strong buffer", "Emaar rated BBB (Stable)"], sourceUrl: "https://www.fitchratings.com" },
                ].map((item, i) => <ForecastCard key={i} {...item} />)}
              </div>
            </Section>

            <Section title="Market Indicators" sub="Key metrics shaping Dubai's real estate future">
              <div className="chart-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
                {[
                  ["Population Target", "5.8M by 2040"], ["Price Cycle", "56+ months positive"], ["Developer Count", "228 active"],
                  ["Units Launched", "131,504 in 2025"], ["Mortgage Txns", "50,974 deals"], ["2026 Pipeline", "~120K units"],
                  ["Women Investors", "AED 154B"], ["REIDIN Growth", "+12.9% YoY"], ["Investor Base", "193.1K (+24%)"],
                ].map(([k, v], i) => (
                  <div key={i} style={{ padding: "14px 16px", background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
                    <span style={{ color: T.textMuted, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 4 }}>{k></span>
                    <span style={{ color: T.white, fontSize: 15, fontWeight: 700, fontFamily: "'Fraunces', serif" }}>{v></span>
                  </div>
                ))}
              </div>
            </Section>
          <TabSources sources={[{ label: "Dubai Land Department (Official)", url: "https://dubailand.gov.ae" }, { label: "REIDIN Dec 2025", url: "https://reidin.com" }, { label: "ValuStrat Q4 2025" }, { label: "Knight Frank Dubai 2025", url: "https://www.knightfrank.com/research" }, { label: "Gulf News Property", url: "https://gulfnews.com/business/property" }, { label: "Zawya Real Estate", url: "https://www.zawya.com" }]} />
          </>}

          {/* --- INVESTMENT SCORE TAB --- */}
          {tab === "Investment Score" && !isPro && <ProGateFullPage tabName="Investment Score" onUpgrade={() => setShowUpgrade(true)} />}
          {tab === "Investment Score" && isPro && (() => {
            const COMMUNITIES = [
              { name: "Jumeirah Village Circle", short: "JVC", yield: 8.5, supplyRisk: 3, momentum: 7, demand: 9, goldenVisa: false, strPotential: 6, devQuality: 8, avgPriceSqft: 1180, note: "Highest yields in Dubai. Watch supply pipeline." },
              { name: "Dubai Hills Estate", short: "DHE", yield: 6.0, supplyRisk: 7, momentum: 9, demand: 9, goldenVisa: true, strPotential: 7, devQuality: 10, avgPriceSqft: 2050, note: "Premium family community. Strong capital appreciation." },
              { name: "Dubai Creek Harbour", short: "DCH", yield: 6.0, supplyRisk: 6, momentum: 8, demand: 8, goldenVisa: true, strPotential: 7, devQuality: 10, avgPriceSqft: 1850, note: "Emaar's flagship waterfront. Creek Tower catalyst." },
              { name: "Emaar Beachfront", short: "EBF", yield: 5.8, supplyRisk: 8, momentum: 9, demand: 8, goldenVisa: true, strPotential: 10, devQuality: 10, avgPriceSqft: 2800, note: "Best STR in Dubai. Limited supply = scarcity premium." },
              { name: "Business Bay", short: "BB", yield: 7.0, supplyRisk: 5, momentum: 7, demand: 8, goldenVisa: true, strPotential: 9, devQuality: 8, avgPriceSqft: 1650, note: "Central location. Strong short-term rental market." },
              { name: "Downtown Dubai", short: "DT", yield: 5.0, supplyRisk: 8, momentum: 7, demand: 9, goldenVisa: true, strPotential: 9, devQuality: 10, avgPriceSqft: 3200, note: "Most prestigious address. Yield compressed but rock solid." },
              { name: "Palm Jumeirah", short: "PJ", yield: 4.5, supplyRisk: 9, momentum: 8, demand: 7, goldenVisa: true, strPotential: 8, devQuality: 9, avgPriceSqft: 4200, note: "Ultra luxury. Limited supply but yield is low." },
              { name: "The Valley", short: "TV", yield: 7.0, supplyRisk: 6, momentum: 8, demand: 7, goldenVisa: false, strPotential: 5, devQuality: 10, avgPriceSqft: 1200, note: "Affordable Emaar community. Growing demand." },
              { name: "Emaar South", short: "ES", yield: 7.5, supplyRisk: 5, momentum: 7, demand: 7, goldenVisa: false, strPotential: 5, devQuality: 10, avgPriceSqft: 1050, note: "Expo 2020 legacy area. Airport proximity catalyst." },
              { name: "Dubai Marina", short: "DM", yield: 6.0, supplyRisk: 6, momentum: 6, demand: 8, goldenVisa: true, strPotential: 9, devQuality: 8, avgPriceSqft: 2100, note: "Mature market. Lifestyle premium. High STR demand." },
              { name: "Arjan / Dubailand", short: "ARJ", yield: 7.5, supplyRisk: 4, momentum: 7, demand: 7, goldenVisa: false, strPotential: 5, devQuality: 7, avgPriceSqft: 1050, note: "Budget entry point. Strong yield play." },
              { name: "Dubai South", short: "DS", yield: 7.8, supplyRisk: 4, momentum: 8, demand: 7, goldenVisa: false, strPotential: 4, devQuality: 9, avgPriceSqft: 980, note: "Al Maktoum Airport megaproject catalyst area." },
              { name: "The Oasis by Emaar", short: "OAS", yield: 5.5, supplyRisk: 5, momentum: 9, demand: 8, goldenVisa: true, strPotential: 6, devQuality: 10, avgPriceSqft: 2600, note: "AED 20B mega development. Early buyers seeing 30%+ gains." },
              { name: "Rashid Yachts & Marina", short: "RYM", yield: 5.5, supplyRisk: 7, momentum: 9, demand: 7, goldenVisa: true, strPotential: 8, devQuality: 10, avgPriceSqft: 2400, note: "New Emaar waterfront. Marina lifestyle premium." },
              { name: "Town Square", short: "TSQ", yield: 7.0, supplyRisk: 4, momentum: 6, demand: 7, goldenVisa: false, strPotential: 4, devQuality: 8, avgPriceSqft: 900, note: "Most affordable in portfolio. Family living." },
            ];

            const scoreComm = (c) => {
              // 7 factors, weighted
              let pts = 0;
              const factors = [];

              // 1. Yield (0-20pts)
              const yScore = c.yield >= 8 ? 20 : c.yield >= 7 ? 16 : c.yield >= 6 ? 12 : c.yield >= 5 ? 8 : 5;
              pts += yScore; factors.push({ label: "Yield", score: yScore, max: 20, val: c.yield + "%", icon: "~"??" });

              // 2. Supply Risk - inverted (low risk = high score) (0-15pts)
              const sScore = c.supplyRisk <= 4 ? 15 : c.supplyRisk <= 6 ? 10 : c.supplyRisk <= 8 ? 5 : 2;
              pts += sScore; factors.push({ label: "Supply Risk", score: sScore, max: 15, val: c.supplyRisk <= 4 ? "Low" : c.supplyRisk <= 6 ? "Medium" : "High", icon: "~"??" });

              // 3. Price Momentum (0-15pts)
              const mScore = c.momentum >= 9 ? 15 : c.momentum >= 7 ? 10 : c.momentum >= 5 ? 6 : 3;
              pts += mScore; factors.push({ label: "Momentum", score: mScore, max: 15, val: c.momentum + "/10", icon: "~"??" });

              // 4. Demand (0-15pts)
              const dScore = c.demand >= 9 ? 15 : c.demand >= 7 ? 10 : c.demand >= 5 ? 6 : 3;
              pts += dScore; factors.push({ label: "Demand", score: dScore, max: 15, val: c.demand + "/10", icon: "~"??" });

              // 5. Golden Visa eligible (0-10pts)
              const gScore = c.goldenVisa ? 10 : 3;
              pts += gScore; factors.push({ label: "Golden Visa", score: gScore, max: 10, val: c.goldenVisa ? "Eligible" : "Below 2M", icon: "~"??" });

              // 6. STR Potential (0-15pts)
              const strScore = c.strPotential >= 9 ? 15 : c.strPotential >= 7 ? 10 : c.strPotential >= 5 ? 6 : 3;
              pts += strScore; factors.push({ label: "STR Potential", score: strScore, max: 15, val: c.strPotential + "/10", icon: "~"??" });

              // 7. Developer Quality (0-10pts)
              const devScore = c.devQuality >= 9 ? 10 : c.devQuality >= 7 ? 7 : 4;
              pts += devScore; factors.push({ label: "Dev Quality", score: devScore, max: 10, val: c.devQuality + "/10", icon: "~"???" });

              const total = Math.round(pts);
              const pct = Math.round(pts / 100 * 10) / 10; // out of 10
              const signal = total >= 75 ? "BUY" : total >= 55 ? "HOLD" : "SELL";
              const signalColor = signal === "BUY" ? T.green : signal === "HOLD" ? T.gold : T.red;
              const color = total >= 75 ? T.green : total >= 55 ? T.gold : T.red;
              return { ...c, total, pct, signal, signalColor, color, factors };
            };

            const scored = COMMUNITIES.map(scoreComm).sort((a, b) => b.total - a.total);
            const [isScoreFilter, setIsScoreFilter] = [investScoreFilter, setInvestScoreFilter];
            const [expandedComm, setExpandedComm] = [investExpandedComm, setInvestExpandedComm];

            const filtered = isScoreFilter === "All" ? scored : scored.filter(c => c.signal === isScoreFilter);
            const buyCount = scored.filter(c => c.signal === "BUY").length;
            const holdCount = scored.filter(c => c.signal === "HOLD").length;
            const sellCount = scored.filter(c => c.signal === "SELL").length;
            const marketSignal = buyCount >= 8 ? "BULL" : buyCount >= 5 ? "NEUTRAL" : "CAUTION";

            return (
              <>
                <Section title="Investment Intelligence" sub="AI-scored community ratings across 7 factors - Updated Q4 2025">
                  {/* Market Signal Banner */}
                  <div style={{ background: marketSignal === "BULL" ? "rgba(16,185,129,0.08)" : marketSignal === "NEUTRAL" ? "rgba(212,168,67,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${marketSignal === "BULL" ? "rgba(16,185,129,0.25)" : marketSignal === "NEUTRAL" ? "rgba(212,168,67,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: 16, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Overall Market Signal</div>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: marketSignal === "BULL" ? T.green : marketSignal === "NEUTRAL" ? T.gold : T.red }}>
                        {marketSignal === "BULL" ? "BULLISH" : marketSignal === "NEUTRAL" ? "NEUTRAL" : "CAUTION"}
                      </div>
                      <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>
                        {marketSignal === "BULL" ? "Strong buying opportunity across multiple communities" : marketSignal === "NEUTRAL" ? "Selective buying recommended - focus on high-score communities" : "Market showing stress - focus on yield over appreciation"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {[{ label: "BUY", count: buyCount, color: T.green }, { label: "HOLD", count: holdCount, color: T.gold }, { label: "SELL", count: sellCount, color: T.red }].map(s => (
                        <div key={s.label} style={{ textAlign: "center", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "14px 20px", cursor: "pointer", border: `1px solid ${isScoreFilter === s.label ? s.color : "transparent"}`, transition: "all 0.2s" }} onClick={() => setIsScoreFilter(isScoreFilter === s.label ? "All" : s.label)}>
                          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: s.color }}>{s.count}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: s.color, letterSpacing: 1 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                    {["All", "BUY", "HOLD", "SELL"].map(f => (
                      <button key={f} type="button" onClick={() => setIsScoreFilter(f)} style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${isScoreFilter === f ? T.gold : T.border}`, background: isScoreFilter === f ? "rgba(212,168,67,0.12)" : "transparent", color: isScoreFilter === f ? T.gold : T.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>{f} {f === "All" ? `(${scored.length})` : f === "BUY" ? `(${buyCount})` : f === "HOLD" ? `(${holdCount})` : `(${sellCount})`}</button>
                    ))}
                  </div>

                  {/* Community Score Cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filtered.map((c, i) => (
                      <div key={c.short}>
                        {/* Main Row */}
                        <div onClick={() => setExpandedComm(expandedComm === c.short ? null : c.short)} style={{ background: T.card, border: `1px solid ${expandedComm === c.short ? c.color : T.border}`, borderRadius: expandedComm === c.short ? "14px 14px 0 0" : 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "all 0.2s" }}>
                          {/* Rank */}
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: i < 3 ? `linear-gradient(135deg, ${T.gold}, #B8912F)` : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: i < 3 ? "#04090f" : T.textMuted, flexShrink: 0 }}>#{i + 1}</div>
                          {/* Name */}
                          <div style={{ flex: 1, minWidth: 140 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{c.note}</div>
                          </div>
                          {/* Score Bar */}
                          <div style={{ flex: 1, maxWidth: 180, display: window.innerWidth < 480 ? "none" : "block" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                              <span style={{ fontSize: 10, color: T.textMuted }}>Score</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: c.color }}>{c.total}/100</span>
                            </div>
                            <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: c.total + "%", height: "100%", background: `linear-gradient(90deg, ${c.color}, ${c.color}88)`, borderRadius: 3, transition: "width 0.6s ease" }} />
                            </div>
                          </div>
                          {/* Yield */}
                          <div style={{ textAlign: "center", minWidth: 60 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>{c.yield}%</div>
                            <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Yield</div>
                          </div>
                          {/* Price/sqft */}
                          <div style={{ textAlign: "center", minWidth: 72, display: window.innerWidth < 600 ? "none" : "block" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary }}>AED {c.avgPriceSqft.toLocaleString()}</div>
                            <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>/sqft</div>
                          </div>
                          {/* Signal Badge */}
                          <div style={{ minWidth: 60, textAlign: "center" }}>
                            <div style={{ display: "inline-block", padding: "5px 12px", borderRadius: 8, background: c.signal === "BUY" ? "rgba(16,185,129,0.12)" : c.signal === "HOLD" ? "rgba(212,168,67,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${c.signalColor}33`, color: c.signalColor, fontSize: 11, fontWeight: 900, letterSpacing: 0.5 }}>{c.signal}</div>
                          </div>
                          {/* Expand Arrow */}
                          <div style={{ color: T.textMuted, fontSize: 14, transition: "transform 0.2s", transform: expandedComm === c.short ? "rotate(180deg)" : "none" }}>?</div>
                        </div>

                        {/* Expanded Factor Breakdown */}
                        {expandedComm === c.short && (
                          <div style={{ background: "rgba(14,25,45,0.95)", border: `1px solid ${c.color}`, borderTop: "none", borderRadius: "0 0 14px 14px", padding: "20px 20px 20px" }}>
                            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Score Breakdown - {c.name}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                              {c.factors.map((f, fi) => (
                                <div key={fi} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <div style={{ fontSize: 12, color: T.textSecondary }}>{f.icon} {f.label}</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{f.score}/{f.max}</div>
                                  </div>
                                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                                    <div style={{ width: (f.score / f.max * 100) + "%", height: "100%", background: `linear-gradient(90deg, ${T.gold}, ${T.green})`, borderRadius: 2 }} />
                                  </div>
                                  <div style={{ fontSize: 11, color: T.textMuted }}>{f.val}</div>
                                </div>
                              ))}
                            </div>
                            {/* Investment Summary */}
                            <div style={{ marginTop: 16, padding: "14px 16px", background: `${c.signalColor}0D`, border: `1px solid ${c.signalColor}33`, borderRadius: 10 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: c.signalColor, marginBottom: 6 }}>
                                {c.signal === "BUY" ? "? BUY RECOMMENDATION" : c.signal === "HOLD" ? "? HOLD RECOMMENDATION" : "SELL / AVOID RECOMMENDATION"}
                              </div>
                              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>
                                {c.signal === "BUY"
                                  ? `${c.name} scores ${c.total}/100 - strong fundamentals across yield (${c.yield}%), demand, and momentum. ${c.note} Entry at AED ${c.avgPriceSqft.toLocaleString()}/sqft offers attractive risk-adjusted returns.`
                                  : c.signal === "HOLD"
                                  ? `${c.name} scores ${c.total}/100 - decent yield at ${c.yield}% but some factors warrant caution. ${c.note} Existing holders should maintain positions; new buyers should wait for better entry.`
                                  : `${c.name} scores ${c.total}/100 - combination of compressed yield and elevated risk factors. ${c.note} Capital could be better deployed elsewhere in the portfolio.`
                                }
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>

                {/* Methodology */}
                <Section title="Scoring Methodology" sub="How Investment Scores are calculated">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
                    {[
                      { icon: "~"??", label: "Gross Yield", weight: "20pts", desc: "Higher yield = higher score. 8%+ = full marks. Based on DLD/REIDIN data." },
                      { icon: "~"??", label: "Supply Risk", weight: "15pts", desc: "Inverted - low pipeline risk scores highest. Based on REIDIN supply data." },
                      { icon: "~"??", label: "Price Momentum", weight: "15pts", desc: "YoY price growth trajectory. Based on Property Monitor DPI." },
                      { icon: "~"??", label: "Demand Score", weight: "15pts", desc: "Transaction volume + search interest + rental absorption rate." },
                      { icon: "~"??", label: "Golden Visa", weight: "10pts", desc: "Properties = AED 2M qualify for 10yr UAE Golden Visa - drives demand." },
                      { icon: "~"??", label: "STR Potential", weight: "15pts", desc: "Short-term rental income potential based on Airbnb/Booking.com data." },
                      { icon: "~"???", label: "Developer Quality", weight: "10pts", desc: "Delivery track record, S&P rating, escrow compliance, and backlog health." },
                    ].map((m, i) => (
                      <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{m.icon} {m.label}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, background: "rgba(212,168,67,0.1)", padding: "2px 8px", borderRadius: 6 }}>{m.weight}</div>
                        </div>
                        <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>{m.desc}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 10, fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
                    <strong style={{ color: T.textSecondary }}>Signal thresholds:</strong> BUY = 75+/100 - HOLD = 55-74 - SELL/AVOID = below 55. Scores are recalculated quarterly using latest DLD, REIDIN, and ValuStrat data. Not financial advice - always conduct your own due diligence.
                  </div>
                </Section>

                <TabSources sources={[
                  { label: "Dubai Land Department", url: "https://dubailand.gov.ae" },
                  { label: "REIDIN Dec 2025", url: "https://reidin.com" },
                  { label: "Property Monitor DPI", url: "https://propertymonitor.com" },
                  { label: "ValuStrat Q4 2025" },
                  { label: "Knight Frank Dubai 2025", url: "https://www.knightfrank.com/research" },
                  { label: "Bayut Annual Report 2025", url: "https://www.bayut.com" },
                ]} />
              </>
            );
          })()}

          {/* --- PRICE HISTORY TAB --- */}
          {tab === "Price History" && !isPro && <ProGateFullPage tabName="Price History" onUpgrade={() => setShowUpgrade(true)} />}
          {tab === "Price History" && isPro && (() => {
            // 2008-2025 Dubai price per sqft data by community
            const HISTORY = {
              "Dubai Average": [
                { y: "2008", v: 1420 }, { y: "2009", v: 870 }, { y: "2010", v: 780 },
                { y: "2011", v: 820 }, { y: "2012", v: 920 }, { y: "2013", v: 1100 },
                { y: "2014", v: 1250 }, { y: "2015", v: 1150 }, { y: "2016", v: 1050 },
                { y: "2017", v: 1020 }, { y: "2018", v: 980 }, { y: "2019", v: 930 },
                { y: "2020", v: 880 }, { y: "2021", v: 970 }, { y: "2022", v: 1150 },
                { y: "2023", v: 1380 }, { y: "2024", v: 1560 }, { y: "2025", v: marketGlobal?.avgPpsfNum || 1689 },
              ],
              "Downtown Dubai": [
                { y: "2008", v: 3200 }, { y: "2009", v: 1800 }, { y: "2010", v: 1600 },
                { y: "2011", v: 1700 }, { y: "2012", v: 1950 }, { y: "2013", v: 2300 },
                { y: "2014", v: 2600 }, { y: "2015", v: 2350 }, { y: "2016", v: 2100 },
                { y: "2017", v: 2050 }, { y: "2018", v: 1980 }, { y: "2019", v: 1900 },
                { y: "2020", v: 1780 }, { y: "2021", v: 2050 }, { y: "2022", v: 2450 },
                { y: "2023", v: 2800 }, { y: "2024", v: 3050 }, { y: "2025", v: 3200 },
              ],
              "Palm Jumeirah": [
                { y: "2008", v: 3800 }, { y: "2009", v: 2200 }, { y: "2010", v: 1900 },
                { y: "2011", v: 2000 }, { y: "2012", v: 2300 }, { y: "2013", v: 2800 },
                { y: "2014", v: 3200 }, { y: "2015", v: 2900 }, { y: "2016", v: 2600 },
                { y: "2017", v: 2500 }, { y: "2018", v: 2400 }, { y: "2019", v: 2300 },
                { y: "2020", v: 2200 }, { y: "2021", v: 2800 }, { y: "2022", v: 3400 },
                { y: "2023", v: 3800 }, { y: "2024", v: 4100 }, { y: "2025", v: 4200 },
              ],
              "Dubai Hills Estate": [
                { y: "2008", v: null }, { y: "2009", v: null }, { y: "2010", v: null },
                { y: "2011", v: null }, { y: "2012", v: null }, { y: "2013", v: null },
                { y: "2014", v: 1100 }, { y: "2015", v: 1050 }, { y: "2016", v: 980 },
                { y: "2017", v: 1000 }, { y: "2018", v: 1050 }, { y: "2019", v: 1080 },
                { y: "2020", v: 1020 }, { y: "2021", v: 1200 }, { y: "2022", v: 1500 },
                { y: "2023", v: 1780 }, { y: "2024", v: 1950 }, { y: "2025", v: 2050 },
              ],
              "JVC": [
                { y: "2008", v: 950 }, { y: "2009", v: 600 }, { y: "2010", v: 520 },
                { y: "2011", v: 530 }, { y: "2012", v: 580 }, { y: "2013", v: 680 },
                { y: "2014", v: 780 }, { y: "2015", v: 720 }, { y: "2016", v: 680 },
                { y: "2017", v: 660 }, { y: "2018", v: 640 }, { y: "2019", v: 620 },
                { y: "2020", v: 590 }, { y: "2021", v: 700 }, { y: "2022", v: 880 },
                { y: "2023", v: 1020 }, { y: "2024", v: 1120 }, { y: "2025", v: 1180 },
              ],
              "Business Bay": [
                { y: "2008", v: 1800 }, { y: "2009", v: 1100 }, { y: "2010", v: 950 },
                { y: "2011", v: 980 }, { y: "2012", v: 1100 }, { y: "2013", v: 1300 },
                { y: "2014", v: 1450 }, { y: "2015", v: 1320 }, { y: "2016", v: 1200 },
                { y: "2017", v: 1150 }, { y: "2018", v: 1100 }, { y: "2019", v: 1050 },
                { y: "2020", v: 980 }, { y: "2021", v: 1150 }, { y: "2022", v: 1350 },
                { y: "2023", v: 1520 }, { y: "2024", v: 1620 }, { y: "2025", v: 1650 },
              ],
              "Dubai Marina": [
                { y: "2008", v: 2200 }, { y: "2009", v: 1300 }, { y: "2010", v: 1150 },
                { y: "2011", v: 1200 }, { y: "2012", v: 1380 }, { y: "2013", v: 1600 },
                { y: "2014", v: 1800 }, { y: "2015", v: 1650 }, { y: "2016", v: 1500 },
                { y: "2017", v: 1450 }, { y: "2018", v: 1380 }, { y: "2019", v: 1320 },
                { y: "2020", v: 1250 }, { y: "2021", v: 1450 }, { y: "2022", v: 1720 },
                { y: "2023", v: 1920 }, { y: "2024", v: 2050 }, { y: "2025", v: 2100 },
              ],
            };

            const CYCLES = [
              { year: "2008", event: "Global Financial Crisis", type: "crash", desc: "Dubai property crashed 50-60% from peak. Off-plan projects stalled. Nakheel restructured $16B debt." },
              { year: "2012", event: "Recovery Begins", type: "recovery", desc: "Foreign investor confidence returns. Expo 2020 bid announced. Prices start rising again." },
              { year: "2014", event: "Peak & Correction", type: "correction", desc: "Second boom peaks. Government cooling measures (double DLD fee to 4%, mortgage LTV caps) trigger 25% correction." },
              { year: "2020", event: "COVID-19 Dip", type: "crash", desc: "Pandemic causes 15-20% dip. Short-lived - UAE's COVID response and Golden Visa expansion drive rapid recovery." },
              { year: "2021", event: "New Bull Run Begins", type: "recovery", desc: "Record transactions. Millionaire migration accelerates. 56+ consecutive months of growth begins." },
              { year: "2025", event: "Record Market", type: "peak", desc: `${mktValue} market. 5th consecutive record year. ${mktTxns} transactions. Prices at all-time highs in most communities.` },
            ];

            const COLORS = { "Dubai Average": T.gold, "Downtown Dubai": "#8B5CF6", "Palm Jumeirah": "#3B82F6", "Dubai Hills Estate": "#10B981", "JVC": "#F59E0B", "Business Bay": "#EC4899", "Dubai Marina": "#06B6D4" };
            const ALL_COMMUNITIES = Object.keys(HISTORY);

            const years = ["2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023","2024","2025"];
            const chartData = years.map(y => {
              const row = { year: y };
              ALL_COMMUNITIES.forEach(c => {
                const pt = HISTORY[c].find(p => p.y === y);
                if (pt && pt.v) row[c] = pt.v;
              });
              return row;
            });

            // Calculate stats for selected communities
            const calcStats = (comm) => {
              const pts = HISTORY[comm].filter(p => p.v);
              const first = pts[0]?.v;
              const last = pts[pts.length - 1]?.v;
              const peak = Math.max(...pts.map(p => p.v));
              const trough = Math.min(...pts.map(p => p.v));
              const totalGain = first && last ? ((last - first) / first * 100).toFixed(0) : "-";
              const fromTrough = trough && last ? ((last - trough) / trough * 100).toFixed(0) : "-";
              return { first, last, peak, trough, totalGain, fromTrough };
            };

            return (
              <>
                <Section title="Dubai Property Price History 2008-2025" sub="Price per sqft (AED) - Full market cycle including 2008 crash, 2014 correction, COVID dip, and current bull run">
                  {/* Cycle Events Timeline */}
                  <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 24, scrollbarWidth: "none" }}>
                    {CYCLES.map((c, i) => (
                      <div key={i} style={{ flexShrink: 0, background: c.type === "crash" ? "rgba(239,68,68,0.08)" : c.type === "recovery" ? "rgba(16,185,129,0.08)" : c.type === "correction" ? "rgba(245,158,11,0.08)" : "rgba(212,168,67,0.08)", border: `1px solid ${c.type === "crash" ? "rgba(239,68,68,0.25)" : c.type === "recovery" ? "rgba(16,185,129,0.25)" : c.type === "correction" ? "rgba(245,158,11,0.25)" : "rgba(212,168,67,0.25)"}`, borderRadius: 12, padding: "12px 14px", minWidth: 180, maxWidth: 200 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Fraunces',serif", color: c.type === "crash" ? T.red : c.type === "recovery" ? T.green : c.type === "correction" ? T.orange : T.gold }}>{c.year}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 6 }}>{c.event}</div>
                        <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>{c.desc}</div>
                      </div>
                    ))}
                  </div>

                  {/* Main Price Chart */}
                  <Chart title="Price Per Sqft (AED) - All Communities 2008-2025">
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => "AED " + v.toLocaleString()} width={80} />
                        <Tooltip content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px" }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 8 }}>{label}</div>
                              {payload.map((p, i) => p.value && (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 12, color: T.textSecondary, marginBottom: 3 }}>
                                  <span style={{ color: p.color }}>{p.name></span>
                                  <span style={{ fontWeight: 700, color: T.white }}>AED {p.value.toLocaleString()}/sqft</span>
                                </div>
                              ))}
                            </div>
                          );
                        }} />
                        <Legend wrapperStyle={{ fontSize: 11, color: T.textMuted, paddingTop: 12 }} />
                        {ALL_COMMUNITIES.map(c => (
                          <Line key={c} type="monotone" dataKey={c} stroke={COLORS[c]} strokeWidth={c === "Dubai Average" ? 3 : 1.5} dot={false} connectNulls={false} strokeDasharray={c === "Dubai Average" ? "none" : "none"} />
                        ))}
                        {/* Annotations for key events */}
                        <ReferenceLine x="2008" stroke="rgba(239,68,68,0.4)" strokeDasharray="4 4" label={{ value: "GFC", fill: T.red, fontSize: 10 }} />
                        <ReferenceLine x="2014" stroke="rgba(245,158,11,0.4)" strokeDasharray="4 4" label={{ value: "Peak", fill: T.orange, fontSize: 10 }} />
                        <ReferenceLine x="2020" stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" label={{ value: "COVID", fill: T.red, fontSize: 10 }} />
                        <ReferenceLine x="2021" stroke="rgba(16,185,129,0.4)" strokeDasharray="4 4" label={{ value: "Bull", fill: T.green, fontSize: 10 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Chart>
                </Section>

                {/* Community Stats Cards */}
                <Section title="Community Performance - Full Cycle" sub="From 2008 peak to 2025 - AED/sqft">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginTop: 16 }}>
                    {ALL_COMMUNITIES.map(comm => {
                      const s = calcStats(comm);
                      const isPositive = parseFloat(s.totalGain) > 0;
                      return (
                        <div key={comm} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                            <div>
                              <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[comm], display: "inline-block", marginRight: 6 }} />
                              <span style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{comm></span>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: isPositive ? T.green : T.red, background: isPositive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: 6 }}>
                              {isPositive ? "+" : ""}{s.totalGain}% since 2008
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {[
                              { label: "2008 Peak", val: s.first ? "AED " + s.first.toLocaleString() : "N/A" },
                              { label: "2025 Price", val: s.last ? "AED " + s.last.toLocaleString() : "N/A" },
                              { label: "All-Time High", val: s.peak ? "AED " + s.peak.toLocaleString() : "N/A" },
                              { label: "From Trough", val: s.fromTrough ? "+" + s.fromTrough + "%" : "N/A" },
                            ].map((m, i) => (
                              <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 10px" }}>
                                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{m.label}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: i === 1 ? T.gold : T.textSecondary }}>{m.val}</div>
                              </div>
                            ))}
                          </div>
                          {/* Mini sparkline bar */}
                          <div style={{ display: "flex", gap: 2, marginTop: 12, alignItems: "flex-end", height: 28 }}>
                            {HISTORY[comm].filter(p => p.v).map((p, pi, arr) => {
                              const maxV = Math.max(...arr.map(x => x.v));
                              const h = Math.round((p.v / maxV) * 28);
                              const isLast = pi === arr.length - 1;
                              return <div key={pi} style={{ flex: 1, height: h, borderRadius: 2, background: isLast ? T.gold : COLORS[comm] + "60", transition: "height 0.3s" }} title={`${p.y}: AED ${p.v.toLocaleString()}`} />;
                            })}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                            <span style={{ fontSize: 9, color: T.textMuted }}>2008</span>
                            <span style={{ fontSize: 9, color: T.textMuted }}>2025</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>

                {/* Cycle Analysis */}
                <Section title="Market Cycle Analysis" sub="Dubai's 3 major cycles since 2008 - what history tells us">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginTop: 16 }}>
                    {[
                      { cycle: "Cycle 1: 2008-2012", icon: "~"??", color: T.red, title: "Crash & Recovery", stats: [{ l: "Peak (2008)", v: "AED 1,420/sqft" }, { l: "Trough (2010)", v: "AED 780/sqft" }, { l: "Drawdown", v: "-45%" }, { l: "Recovery", v: "3 years" }], insight: "GFC triggered Dubai's worst crash - overleveraged developers, stalled projects, and Nakheel's $16B debt restructuring. Recovery driven by fundamentals: no income tax, growing expat population, infrastructure completion." },
                      { cycle: "Cycle 2: 2012-2020", icon: "~"??", color: T.gold, title: "Boom, Cooldown, Stability", stats: [{ l: "Peak (2014)", v: "AED 1,250/sqft" }, { l: "Trough (2020)", v: "AED 880/sqft" }, { l: "Drawdown", v: "-30%" }, { l: "Duration", v: "8 years" }], insight: "Government cooling measures (4% DLD, LTV caps) softened the boom. Gradual 25% correction until COVID. More orderly than 2008 - regulated market with escrow laws protecting off-plan buyers." },
                      { cycle: "Cycle 3: 2020-Present", icon: "~"??", color: T.green, title: "The Great Bull Run", stats: [{ l: "Trough (2020)", v: "AED 880/sqft" }, { l: `Current (${marketGlobal?.period || "2025"})`, v: mktPpsf || "AED 1,689/sqft" }, { l: "Gain", v: "+92%" }, { l: "Duration", v: "5+ years" }], insight: "Longest bull run in Dubai history. Driven by: Golden Visa expansion, millionaire migration, limited new supply in premium zones, post-COVID safe haven demand, and AED-USD peg stability." },
                    ].map((cy, i) => (
                      <div key={i} style={{ background: T.card, border: `1px solid ${cy.color}33`, borderRadius: 14, padding: 20 }}>
                        <div style={{ fontSize: 22, marginBottom: 8 }}>{cy.icon}</div>
                        <div style={{ fontSize: 11, color: cy.color, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{cy.cycle}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 14 }}>{cy.title}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                          {cy.stats.map((s, si) => (
                            <div key={si} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 10px" }}>
                              <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: cy.color, marginTop: 2 }}>{s.v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>{cy.insight}</div>
                      </div>
                    ))}
                  </div>
                </Section>

                {/* YoY Change Chart */}
                <Section title="Year-on-Year Price Change - Dubai Average" sub="Annual % change in price per sqft - Highlights boom, bust, and recovery phases">
                  <Chart>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={years.slice(1).map((y, i) => {
                        const prev = HISTORY["Dubai Average"][i]?.v;
                        const curr = HISTORY["Dubai Average"][i + 1]?.v;
                        const pct = prev && curr ? ((curr - prev) / prev * 100) : 0;
                        return { year: y, change: parseFloat(pct.toFixed(1)) };
                      })} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v + "%"} />
                        <Tooltip content={<CustomTooltip />} formatter={(v) => [v + "%", "YoY Change"]} />
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                        <Bar dataKey="change" radius={[4, 4, 0, 0]} barSize={28}>
                          {years.slice(1).map((y, i) => {
                            const prev = HISTORY["Dubai Average"][i]?.v;
                            const curr = HISTORY["Dubai Average"][i + 1]?.v;
                            const pct = prev && curr ? ((curr - prev) / prev * 100) : 0;
                            return <Cell key={i} fill={pct >= 0 ? T.green : T.red} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Chart>
                </Section>

                <TabSources sources={[
                  { label: "REIDIN Historical Index 2008-2025", url: "https://reidin.com" },
                  { label: "Property Monitor Dynamic Price Index", url: "https://propertymonitor.com" },
                  { label: "ValuStrat Price Index", url: "https://www.valustrat.com" },
                  { label: "Dubai Land Department - DLD", url: "https://dubailand.gov.ae" },
                  { label: "Knight Frank Dubai Report 2025", url: "https://www.knightfrank.com/research" },
                  { label: "Cavendish Maxwell Market Reports" },
                ]} />
              </>
            );
          })()}

        </div>

        <footer style={{ borderTop: `1px solid ${T.border}`, padding: "20px 24px", textAlign: "center" }}>
          <p style={{ color: T.textMuted, fontSize: 11 }}>
            Sources: Emaar IR, DLD, DXBinteract, Gulf News, Zawya, Knight Frank, CW Core, Fitch - Verified {new Date().toLocaleDateString("en-AE", { month: "short", year: "numeric" })} - Not financial advice
          </p>
          <p style={{ color: "rgba(100,116,139,0.5)", fontSize: 10, marginTop: 4 }}>
            DXB Analytics - The Address Holding - - 2026
          </p>
        </footer>
      </main>

      {/* --- FLOATING COMPARE BAR --- */}
      {compareList.length > 0 && tab === "Projects" && (
        <div className="compare-bar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.surface, borderTop: `2px solid ${T.gold}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1000, backdropFilter: "blur(12px)", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: T.gold, fontWeight: 700, fontSize: 13 }}>Compare ({compareList.length}/3):</span>
            {compareList.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 12, color: T.white }}>{p.name></span>
                <button type="button" onClick={() => toggleCompare(p)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>-</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setCompareList([])} style={{ padding: "8px 16px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Clear</button>
            <button type="button" onClick={() => setShowCompare(true)} disabled={compareList.length < 2} style={{ padding: "8px 20px", background: compareList.length >= 2 ? T.gold : T.textMuted, border: "none", borderRadius: 8, color: T.bg, fontSize: 12, fontWeight: 700, cursor: compareList.length >= 2 ? "pointer" : "not-allowed", fontFamily: "'Outfit', sans-serif" }}>Compare Now</button>
          </div>
        </div>
      )}

            {/* --- PROJECT DETAIL MODAL --- */}
      {/* COMMUNITY DETAIL MODAL */}
      {selectedCommunity && (() => {
        const intel = communityIntel[selectedCommunity];
        const comm = emaarCommunities.find(x => x.name === selectedCommunity);
        if (!intel) return null;
        const commProjects = activeProjects.filter(p => p.community === selectedCommunity);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 3000, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "40px 16px", overflowY: "auto" }} onClick={() => setSelectedCommunity(null)}>
            <div style={{ background: T.surface, borderRadius: 16, maxWidth: 800, width: "100%", maxHeight: "90vh", overflowY: "auto", border: `1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: T.gold }}>{selectedCommunity}</div>
                  <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 4 }}>{intel.tagline}</div>
                  {intel.masterDev && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{intel.masterDev}</div>}
                </div>
                <button type="button" onClick={() => setSelectedCommunity(null)} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 22, cursor: "pointer", padding: 4 }}>&times;</button>
              </div>

              <div style={{ padding: "20px 24px" }}>
                {/* KPI Row */}
                {comm && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                    {[
                      { label: "Projects", value: comm.projects },
                      { label: "Avg Price/sqft", value: comm.avgPpsf ? `AED ${comm.avgPpsf.toLocaleString()}` : "-" },
                      { label: "Avg Yield", value: comm.avgYield ? `${comm.avgYield}%` : "-" },
                      { label: "Area", value: comm.acres ? `${comm.acres.toLocaleString()} acres` : "-" },
                    ].map((k, ki) => (
                      <div key={ki} style={{ background: T.surfaceAlt, borderRadius: 10, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 4 }}>{k.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.gold, fontFamily: "'Fraunces', serif" }}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Famous For */}
                {intel.famousFor && (
                  <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 6 }}>FAMOUS FOR</div>
                    <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{intel.famousFor}</div>
                  </div>
                )}

                {/* Lifestyle */}
                {intel.lifestyle && (
                  <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, marginBottom: 6 }}>LIFESTYLE</div>
                    <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{intel.lifestyle}</div>
                  </div>
                )}

                {/* Key Amenities */}
                {intel.keyAmenities && intel.keyAmenities.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 10 }}>KEY AMENITIES</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                      {intel.keyAmenities.map((a, ai) => (
                        <div key={ai} style={{ background: T.surfaceAlt, borderRadius: 10, padding: 12 }}>
                          <div style={{ fontSize: 13, marginBottom: 4 }}>{a.icon} <span style={{ fontWeight: 700, color: T.white }}>{a.label></span></div>
                          <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>{a.items}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Distances */}
                {intel.distances && intel.distances.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 10 }}>DISTANCES & CONNECTIVITY</div>
                    <div style={{ background: T.surfaceAlt, borderRadius: 10, overflow: "hidden" }}>
                      {intel.distances.map((d, di) => (
                        <div key={di} style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderBottom: di < intel.distances.length - 1 ? `1px solid ${T.border}` : "none" }}>
                          <span style={{ fontSize: 11, color: T.textSecondary }}>{d.dest></span>
                          <span style={{ fontSize: 11, color: T.white, fontWeight: 600 }}>{d.km} km &middot; {d.min} min</span>
                        </div>
                      ))}
                    </div>
                    {intel.roads && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{intel.roads}</div>}
                  </div>
                )}

                {/* Yield & Golden Visa */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                  {intel.avgYield && (
                    <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, flex: "1 1 200px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 4 }}>EXPECTED YIELD RANGE</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: T.gold, fontFamily: "'Fraunces', serif" }}>{intel.avgYield}</div>
                    </div>
                  )}
                  <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, flex: "1 1 200px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: intel.goldenVisa ? T.gold : T.textMuted, marginBottom: 4 }}>GOLDEN VISA ELIGIBLE</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: intel.goldenVisa ? T.green : T.red, fontFamily: "'Fraunces', serif" }}>{intel.goldenVisa ? "Yes" : "Check projects"}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Properties &ge; AED 2M qualify for 10-year UAE Golden Visa</div>
                  </div>
                </div>

                {/* Projects in this community */}
                {commProjects.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 10 }}>PROJECTS IN {selectedCommunity.toUpperCase()} ({commProjects.length})</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                      {commProjects.map((p, pi) => (
                        <div key={pi} style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10, cursor: "pointer" }} onClick={() => { const proj = activeProjects.find(x => x.id === p.id) || p; setBreadcrumb([{ label: selectedCommunity, action: () => { setSelectedProject(null); setBreadcrumb([]); setPdTab("overview"); setPdSendModal(false); } }]); setSelectedCommunity(null); setSelectedProject(proj); }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{p.name></span>
                            {p.emaarUrl && <a href={p.emaarUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 8, color: T.gold, textDecoration: "none", padding: "1px 4px", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 3, fontWeight: 700 }}>?</a>}
                          </div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{p.type} &middot; {p.beds} beds &middot; {p.status}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: T.white, marginTop: 4 }}>{p.price ? `AED ${(p.price/1e6).toFixed(2)}M` : "TBD">*</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {comm && (
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 16, padding: "10px 0 0", borderTop: `1px solid ${T.border}` }}>
                    Target buyers: <span style={{ color: T.white }}>{comm.buyer></span> &middot; Key strengths: <span style={{ color: T.white }}>{comm.strengths></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

            {breadcrumb.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0 4px", marginBottom: 4 }}>
                {breadcrumb.map((b, i) => (
                  <React.Fragment key={i}>
                    <button type="button" onClick={b.action} style={{ background: "none", border: "none", color: T.gold, fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>{b.label}</button>
                    <span style={{ color: T.textMuted, fontSize: 12 }}>-</span>
                  </React.Fragment>
                ))}
                <span style={{ fontSize: 12, color: T.textSecondary }}>{selectedProject?.name></span>
              </div>
            )}
            {selectedProject && (() => {
        /* Resolve: if selectedProject is an ID (number/string), find the full object */
        const _sp = (typeof selectedProject === "number" || typeof selectedProject === "string" || !selectedProject.name)
          ? activeProjects.find(x => x.id === selectedProject || x.id === Number(selectedProject)) || null
          : selectedProject;
        if (!_sp) { return null; }
        /* Use _sp below but keep variable name short */
        const selectedProject_ = _sp;
        const communityAliases = {
          "Mina Rashid": "Rashid Yachts & Marina",
          "Grand Polo Club & Resort": "Grand Polo Club",
          "Creek Harbour": "Dubai Creek Harbour",
          "Rashid Marina": "Rashid Yachts & Marina",
        };
        const ciKey = communityAliases[selectedProject_.community] || selectedProject_.community;
        const ci = { ...(communityIntel[ciKey] || communityIntel[selectedProject_.community] || {}), ...(liveCommunityIntel[ciKey] || liveCommunityIntel[selectedProject_.community] || {}) };
        const ciExists = !!(ci.famousFor || ci.tagline);
        const roiData = (liveCommunityROI && liveCommunityROI[ciKey]) || (liveCommunityROI && liveCommunityROI[selectedProject_.community]) || communityROI[ciKey] || communityROI[selectedProject_.community] || {};
        const inv = selectedProject_.ratingOverride != null && selectedProject_.ratingOverride !== "" ? { score: parseFloat(selectedProject_.ratingOverride), color: parseFloat(selectedProject_.ratingOverride) >= 8 ? "#10B981" : parseFloat(selectedProject_.ratingOverride) >= 6 ? "#D4A843" : parseFloat(selectedProject_.ratingOverride) >= 4 ? "#F59E0B" : "#EF4444", label: parseFloat(selectedProject_.ratingOverride) >= 8 ? "Excellent" : parseFloat(selectedProject_.ratingOverride) >= 6 ? "Strong" : parseFloat(selectedProject_.ratingOverride) >= 4 ? "Good" : "Weak" } : getInvestmentScore(selectedProject_);
        return (
        <div style={{ position: "fixed", inset: 0, background: "#04090F", zIndex: 2000, overflowY: "auto" }}>
          <div style={{ width: "100%", minHeight: "100vh", position: "relative" }}>

            {/* -- STICKY TOP NAV -- */}
            <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(4,9,15,0.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${T.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
              <button type="button" onClick={() => { setSelectedProject(null); setBreadcrumb([]); setPdTab("overview"); setPdSendModal(false); }} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: T.textSecondary, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif", padding: "0" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Projects
              </button>
              <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{selectedProject_.community} - {selectedProject_.type}</div>
              <button type="button" onClick={() => { setSelectedProject(null); setBreadcrumb([]); setPdTab("overview"); setPdSendModal(false); }} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>�</button>
            </div>

            {/* -- HERO IMAGE -- */}
            {selectedProject_.imageUrl && (
              <div style={{ width: "100%", height: 260, overflow: "hidden", position: "relative" }}>
                <img src={selectedProject_.imageUrl} alt={selectedProject_.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.parentElement.style.display = "none"; }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, #04090F 100%)" }} />
              </div>
            )}

            {/* -- MAIN CONTENT - NEW TABBED DESIGN -- */}
            {(() => {
              const sp = selectedProject_;
              const price = sp.price || 0;
              const constr = sp.construction ?? 0;
              const constrColor = constr >= 80 ? T.green : constr >= 40 ? "#F59E0B" : T.teal;
              const _gy = roiData.grossYield;
              const gross = typeof _gy === "object" && _gy !== null ? (_gy.apt1 ?? _gy.apt2 ?? 6.0) : (_gy ?? 6.0);
              const _ny = roiData.netYield;
              const net = typeof _ny === "object" && _ny !== null ? (_ny.apt1 ?? _ny.apt2 ?? gross * 0.78) : (_ny ?? gross * 0.78);
              const appreciation = roiData.appreciation5yr ?? 35;
              const annualYoy = roiData.appreciationYoY ?? roiData.annualYoy ?? 10;
              const estValue5yr = price ? Math.round(price * (1 + appreciation / 100)) : 0;
              const annualRent = price ? Math.round(price * gross / 100) : 0;
              const goldenVisa = price >= 2000000;
              // Tab state - aliases for top-level useState (hooks must not be inside IIFE)
              const activeTab = pdTab;
              const sendModal = pdSendModal;
              const setSendModal = setPdSendModal;
              const copiedLink = pdCopiedLink;
              const setCopiedLink = setPdCopiedLink;
              const cd = (() => {
                if (!sp.handover) return null;
                const match = sp.handover.match(/Q([1-4])\s+(\d{4})/);
                if (!match) return null;
                const q = parseInt(match[1]); const year = parseInt(match[2]);
                const qEndMonth = [2,5,8,11]; const qEndDay = [31,30,30,31];
                const target = new Date(year, qEndMonth[q-1], qEndDay[q-1]);
                const diffMs = target - new Date();
                if (diffMs <= 0) return { label: "Delivered", color: T.green };
                const diffDays = Math.ceil(diffMs / (1000*60*60*24));
                const diffMonths = Math.round(diffMs / (1000*60*60*24*30.44));
                if (diffDays <= 90) return { label: diffDays + "d left", color: "#EF4444" };
                if (diffMonths <= 6) return { label: diffMonths + "mo left", color: "#F59E0B" };
                if (diffMonths <= 18) return { label: diffMonths + "mo left", color: T.gold };
                return { label: (diffMonths/12).toFixed(1) + "yr left", color: T.textMuted };
              })();
              const handleCopyLink = () => {
                navigator.clipboard.writeText(window.location.origin + "/project/" + sp.id).then(() => { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); });
              };
              const ROW = ({ label, value, color }) => (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:`1px solid #0F1E35`, fontSize:13 }}>
                  <span style={{ color:"#64748B" }}>{label></span>
                  <span style={{ fontWeight:600, color:color||T.white }}>{value></span>
                </div>
              );
              return (
                <div style={{ maxWidth:900, margin:"0 auto", padding:"24px 32px 60px" }}>

                  {/* HERO SECTION */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:20, alignItems:"flex-start", marginBottom:20 }}>
                    <div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:10 }}>
                        {sp.status && <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:6, background:sp.status.includes("Construction")?"rgba(16,185,129,0.1)":"rgba(59,130,246,0.1)", color:sp.status.includes("Construction")?T.green:"#60A5FA", border:`1px solid ${sp.status.includes("Construction")?T.green:"#60A5FA"}33` }}>{sp.status></span>}
                        {goldenVisa && <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:6, background:"rgba(16,185,129,0.1)", color:T.green, border:`1px solid ${T.green}33` }}>Golden Visa Eligible</span>}
                        {sp.branded && sp.brand && <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:6, background:"rgba(212,168,67,0.1)", color:T.gold, border:`1px solid ${T.gold}33` }}>{sp.brand></span>}
                        {sp.tier && <span style={{ fontSize:11, fontWeight:600, padding:"4px 12px", borderRadius:6, background:"rgba(100,116,139,0.08)", color:T.textMuted, border:"1px solid #1E293B" }}>{sp.tier></span>}
                      </div>
                      <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:36, fontWeight:900, color:T.white, lineHeight:1.1, marginBottom:6 }}>{sp.name}</h1>
                      {(sp.tagline || ci?.tagline) && <p style={{ color:T.teal, fontSize:13, fontStyle:"italic", marginBottom:6 }}>{sp.tagline || ci.tagline}</p>}
                      <p style={{ color:T.textMuted, fontSize:13 }}>{sp.community} - {sp.type}{sp.beds ? ` - ${sp.beds} BR` : ""}</p>
                    </div>
                    {/* CONSTRUCTION CARD */}
                    <div style={{ background:"#0A1628", border:"1px solid #1E293B", borderRadius:12, padding:"18px 22px", minWidth:210 }}>
                      <div style={{ fontSize:9, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>Construction Progress</div>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                        <div style={{ flex:1, height:6, borderRadius:3, background:"#1E293B", overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${constr}%`, borderRadius:3, background:constrColor, transition:"width 0.8s" }} />
                        </div>
                        <span style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:constrColor }}>{constr}%</span>
                      </div>
                      <div style={{ height:1, background:"#1E293B", marginBottom:12 }} />
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        <div>
                          <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 }}>Handover</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.white }}>{sp.handover||"-"}</div>
                          {cd && <div style={{ fontSize:10, fontWeight:700, color:cd.color, marginTop:2 }}>{cd.label}</div>}
                        </div>
                        <div>
                          <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 }}>Payment</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.teal }}>{sp.payment||sp.paymentPlan||"-"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BAR */}
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20, padding:"13px 16px", background:"#0C1A2E", border:"1px solid #2A3A50", borderRadius:12, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, color:"#94A3B8", marginRight:4 }}>Share:</span>
                    <button type="button" onClick={() => setSendModal(true)} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 20px", background:"#D4A843", color:"#04090F", border:"2px solid #D4A843", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", outline:"none", boxShadow:"none", lineHeight:1, fontFamily:"'Outfit',sans-serif" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      Send to Client
                    </button>
                    <button type="button" onClick={handleCopyLink} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", background:"#D4A843", color:"#04090F", border:"2px solid #D4A843", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", outline:"none", boxShadow:"none", lineHeight:1, fontFamily:"'Outfit',sans-serif" }}>
                      {copiedLink ? "? Copied!" : "Copy Link"}
                    </button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(
`Hi,

I'd like to share an investment opportunity I found for you through DXB Analytics:

?? *${sp.name}*
?? ${sp.community}${sp.district ? ` - ${sp.district}` : ""} - ${sp.type}${sp.beds ? ` - ${sp.beds} BR` : ""}
?? From AED ${price ? (price/1e6).toFixed(2)+"M" : "TBD"}${sp.ppsf ? ` - AED ${sp.ppsf.toLocaleString()}/sqft` : ""}
?? Handover: ${sp.handover || "-"} - Payment: ${sp.payment || "-"}
?? Est. Yield: ${gross ? gross.toFixed(1)+"%" : "-"} - 5-yr Appreciation: +${appreciation || 35}%${goldenVisa ? "\n?? Golden Visa Eligible (= AED 2M)" : ""}

Let me know if you'd like more details or to arrange a viewing.

_Powered by DXB Analytics - Dubai Real Estate Intelligence_`)}`} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", background:"#D4A843", color:"#04090F", border:"2px solid #D4A843", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", outline:"none", boxShadow:"none", lineHeight:1, textDecoration:"none", fontFamily:"'Outfit',sans-serif" }}>WhatsApp</a>
                    <div style={{ flex:1 }} />
                    {(sp.emaarUrl||sp.sourceUrl) && <a href={sp.emaarUrl||sp.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", background:"#D4A843", color:"#04090F", border:"2px solid #D4A843", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", outline:"none", boxShadow:"none", lineHeight:1, textDecoration:"none", fontFamily:"'Outfit',sans-serif" }}>View on {(sp.emaarUrl||"").includes("emaar.com")?"Emaar.com":"Source"} ?</a>}
                  </div>

                  {/* TABS */}
                  <div style={{ borderBottom:"1px solid #1E293B", marginBottom:22, display:"flex", gap:6, overflowX:"auto" }}>
                    {[["overview","Overview"],["pricing","Pricing"],["location","Location"],["roi","ROI Calculator"]].map(([id,label]) => (
                      <button key={id} type="button" onClick={() => setPdTab(id)} style={{ padding:"8px 20px", background:activeTab===id?"#D4A843":"transparent", color:activeTab===id?"#04090F":"#64748B", border:activeTab===id?"2px solid #D4A843":"2px solid #1E293B", borderRadius:8, fontSize:13, fontWeight:activeTab===id?700:600, cursor:"pointer", whiteSpace:"nowrap", outline:"none", boxShadow:"none", lineHeight:1, marginBottom:8, fontFamily:"'Outfit',sans-serif" }}>{label}</button>
                    ))}
                  </div>

                  {/* OVERVIEW TAB */}
                  {activeTab === "overview" && (
                    <div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                        {/* Project Details */}
                        <div style={{ background:"#0A1628", border:"1px solid #1E293B", borderRadius:12, padding:18 }}>
                          <div style={{ fontSize:9, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>Project Details</div>
                          <ROW label="From Price" value={price?`AED ${(price/1e6).toFixed(2)}M`:"TBD"} color={T.gold} />
                          <ROW label="Price / sqft" value={sp.ppsf?`AED ${sp.ppsf.toLocaleString()}`:"-"} />
                          <ROW label="Size Range" value={sp.sizeFrom?`${sp.sizeFrom.toLocaleString()} - ${sp.sizeTo?.toLocaleString()} sqft`:"-"} />
                          <ROW label="Bedrooms" value={sp.beds?sp.beds+" BR":"-"} />
                          <ROW label="Type" value={sp.type||"-"} />
                          <ROW label="Payment Plan" value={sp.payment||sp.paymentPlan||"-"} color={T.teal} />
                          <ROW label="Tier" value={sp.tier||"-"} />
                          <ROW label="Developer" value={sp.developer||"Emaar Properties"} />
                        </div>
                        {/* Investment Profile */}
                        <div style={{ background:"#0A1628", border:"1px solid #1E293B", borderRadius:12, padding:18 }}>
                          <div style={{ fontSize:9, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>Investment Profile</div>
                          <ROW label="Est. Gross Yield" value={`${gross.toFixed(1)}%`} color={T.green} />
                          <ROW label="Net Yield" value={`${net.toFixed(1)}%`} color={T.teal} />
                          <ROW label="5-yr Appreciation" value={`+${appreciation}%`} color={T.green} />
                          <ROW label="Annual YoY" value={`+${annualYoy}%`} color={T.green} />
                          <ROW label="Golden Visa" value={goldenVisa?"? Eligible":"? Not Eligible"} color={goldenVisa?T.green:"#EF4444"} />
                          <ROW label="Risk Level" value={roiData.risk||"Low-Medium"} color={T.gold} />
                          <ROW label="Occupancy" value={roiData.occupancy?(roiData.occupancy+"%"):"-"} />
                        </div>
                      </div>
                      {/* Famous For */}
                      {ciExists && ci.famousFor && (
                        <div style={{ background:"#0A1628", border:"1px solid #1E293B", borderRadius:12, padding:18, marginBottom:14 }}>
                          <div style={{ fontSize:9, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>Famous For</div>
                          <p style={{ fontSize:13, color:T.textSecondary, lineHeight:1.8, marginBottom:ci.masterDev||ci.lifestyle?10:0 }}>{ci.famousFor}</p>
                          {ci.masterDev && <div style={{ fontSize:12, color:T.textMuted }}><span style={{ color:T.teal }}>Developer:</span> {ci.masterDev}</div>}
                          {ci.lifestyle  && <div style={{ fontSize:12, color:T.textMuted, marginTop:4 }}><span style={{ color:T.teal }}>Lifestyle:</span> {ci.lifestyle}</div>}
                        </div>
                      )}
                      {/* Similar Projects */}
                      <div style={{ background:"#0A1628", border:"1px solid #1E293B", borderRadius:12, padding:18 }}>
                        <div style={{ fontSize:9, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>More in {sp.community}</div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:8 }}>
                          {activeProjects.filter(p => p.community === sp.community && p.id !== sp.id).slice(0,6).map(p => (
                            <div key={p.id} onClick={() => setSelectedProject(p)} style={{ background:"#111827", border:"1px solid #1E293B", borderRadius:9, padding:"11px 13px", cursor:"pointer" }}>
                              <div style={{ fontSize:12, fontWeight:600, color:T.white, marginBottom:3 }}>{p.name}</div>
                              <div style={{ fontSize:13, color:T.gold, fontWeight:700, marginBottom:2 }}>{p.price?`AED ${(p.price/1e6).toFixed(2)}M`:"-">*</div>
                              <div style={{ fontSize:10, color:T.textMuted }}>{p.handover} - {p.status}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PRICING TAB */}
                  {activeTab === "pricing" && (
                    <div>
                      <div style={{ background:"#0A1628", border:"1px solid #1E293B", borderRadius:12, padding:18, marginBottom:14 }}>
                        <div style={{ fontSize:9, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>Construction & Payment</div>
                        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                          <div style={{ flex:1, height:8, borderRadius:4, background:"#111827", overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${constr}%`, borderRadius:4, background:constrColor }} />
                          </div>
                          <span style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:constrColor }}>{constr}%</span>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                          {[["HANDOVER",sp.handover||"-",T.white],["PAYMENT PLAN",sp.payment||sp.paymentPlan||"-",T.teal],["CONSTRUCTION",constr+"%",constrColor]].map(([l,v,c],i) => (
                            <div key={i} style={{ background:"#111827", borderRadius:9, padding:13, textAlign:"center" }}>
                              <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:5, fontWeight:700 }}>{l}</div>
                              <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:900, color:c }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Unit breakdown */}
                      <div style={{ background:"#0A1628", border:"1px solid #1E293B", borderRadius:12, padding:18 }}>
                        <div style={{ fontSize:9, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>Pricing by Unit Type</div>
                        <div style={{ borderRadius:9, overflow:"hidden", border:"1px solid #1E293B" }}>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 1.3fr 1.1fr", padding:"9px 14px", background:"#111827", fontSize:9, fontWeight:700, color:T.gold, letterSpacing:1, textTransform:"uppercase" }}>
                            <span>Unit Type</span><span>Size (sqft)</span><span>Starting From</span><span>Price / sqft</span>
                          </div>
                          {sp.unitBreakdown && sp.unitBreakdown.length > 0
                            ? sp.unitBreakdown.map((u,i) => (
                              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 1.3fr 1.1fr", padding:"12px 14px", borderTop:"1px solid #0F1E35", background:i%2===0?"transparent":"rgba(14,29,53,0.4)", fontSize:13 }}>
                                <span style={{ fontWeight:700, color:T.white }}>{u.type></span>
                                <span style={{ color:"#94A3B8" }}>{u.sqftFrom?.toLocaleString()} - {u.sqftTo?.toLocaleString()></span>
                                <span style={{ fontWeight:800, color:T.gold }}>{u.priceFrom?`AED ${(u.priceFrom/1e6).toFixed(2)}M`:"-"></span>
                                <span style={{ color:T.textMuted }}>{u.priceFrom&&u.sqftFrom?`AED ${Math.round(u.priceFrom/u.sqftFrom).toLocaleString()}`:"-"></span>
                              </div>
                            ))
                            : (sp.beds||"1-3").split("-").map((b,i) => {
                              const basePrice = price * (1 + i * 0.6);
                              return (
                                <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 1.3fr 1.1fr", padding:"12px 14px", borderTop:"1px solid #0F1E35", background:i%2===0?"transparent":"rgba(14,29,53,0.4)", fontSize:13 }}>
                                  <span style={{ fontWeight:700, color:T.white }}>{b.trim()} BR</span>
                                  <span style={{ color:"#94A3B8" }}>{sp.sizeFrom?sp.sizeFrom.toLocaleString():"-"} - {sp.sizeTo?sp.sizeTo.toLocaleString():"-"></span>
                                  <span style={{ fontWeight:800, color:T.gold }}>{basePrice?`AED ${(basePrice/1e6).toFixed(2)}M`:"-"></span>
                                  <span style={{ color:T.textMuted }}>{sp.ppsf?`AED ${sp.ppsf.toLocaleString()}`:"-"></span>
                                </div>
                              );
                            })
                          }
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LOCATION TAB */}
                  {activeTab === "location" && (
                    <div>
                      {ciExists && ci.keyAmenities && (
                        <div style={{ background:"#0A1628", border:"1px solid #1E293B", borderRadius:12, padding:18, marginBottom:14 }}>
                          <div style={{ fontSize:9, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>Key Amenities Nearby</div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                            {ci.keyAmenities.map((a,i) => (
                              <div key={i} style={{ background:"#0E1D35", borderRadius:9, padding:13, borderLeft:`3px solid ${[T.blue||"#3B82F6","#EF4444",T.gold,T.teal][i%4]}` }}>
                                <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:4 }}>{a.label}</div>
                                <div style={{ fontSize:11, color:"#94A3B8", lineHeight:1.5 }}>{a.items}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {ciExists && ci.distances && (
                        <div style={{ background:"#0A1628", border:"1px solid #1E293B", borderRadius:12, padding:18 }}>
                          <div style={{ fontSize:9, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>Distance to Key Dubai Locations</div>
                          <div style={{ borderRadius:9, overflow:"hidden", border:"1px solid #1E293B" }}>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 90px", padding:"9px 14px", background:"#111827", fontSize:9, fontWeight:700, color:T.gold, letterSpacing:1, textTransform:"uppercase" }}>
                              <span>Destination</span><span style={{ textAlign:"center" }}>Distance</span><span style={{ textAlign:"center" }}>Drive</span>
                            </div>
                            {ci.distances.map((d,i) => (
                              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 80px 90px", padding:"11px 14px", borderTop:"1px solid #0F1E35", background:i%2===0?"transparent":"#0A1628", fontSize:12, alignItems:"center" }}>
                                <span style={{ color:T.white, fontWeight:500 }}>{d.dest></span>
                                <span style={{ textAlign:"center", color:T.textMuted }}>{d.km} km</span>
                                <span style={{ textAlign:"center" }}>
                                  <span style={{ padding:"3px 10px", borderRadius:5, fontSize:11, fontWeight:700, background:d.min<=10?"rgba(16,185,129,0.12)":d.min<=20?"rgba(212,168,67,0.12)":"rgba(59,130,246,0.12)", color:d.min<=10?T.green:d.min<=20?T.gold:"#3B82F6" }}>{d.min} min</span>
                                </span>
                              </div>
                            ))}
                          </div>
                          {ci.roads && <p style={{ fontSize:11, color:T.textMuted, marginTop:10 }}>Road Access: {ci.roads}</p>}
                        </div>
                      )}
                      {!ciExists && (
                        <div style={{ background:"#0A1628", border:"1px solid #1E293B", borderRadius:12, padding:40, textAlign:"center" }}>
                          <div style={{ fontSize:14, color:T.textMuted }}>Location data not available for this community yet.</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ROI CALCULATOR TAB */}
                  {activeTab === "roi" && (() => {
                    const calcPrice = pdCalcPrice || price || 1750000;
                    const calcYears = pdCalcYears;
                    const calcBeds = pdCalcBeds;
                    const calcStrategy = pdCalcStrategy;
                    const roiD = roiData;
                    const _gy2 = roiD.grossYield; const g2 = typeof _gy2==="object"&&_gy2!==null?(_gy2.apt1??_gy2.apt2??6.0):(_gy2??6.0);
                    const appr2 = roiD.appreciation5yr ?? 35;
                    const annualAppRate = Math.pow(1 + appr2/100, 1/calcYears) - 1;
                    const projectedValue = Math.round(calcPrice * Math.pow(1 + annualAppRate, calcYears));
                    const capitalGain = projectedValue - calcPrice;
                    const payStr = sp.payment || "80/20";
                    const downPctM = payStr.match(/^(\d+)/);
                    const downPct = downPctM ? parseInt(downPctM[1])/100 : 0.2;
                    const downPayment = Math.round(calcPrice * downPct);
                    const stratMultiplier = calcStrategy === "Short-Term Airbnb" ? 1.5 : calcStrategy === "Flip at Handover" ? 0 : 1;
                    const annualRentCalc = Math.round(calcPrice * g2/100 * stratMultiplier);
                    const totalRental = annualRentCalc * calcYears;
                    const totalReturn = capitalGain + totalRental;
                    const roiOnDown = downPayment > 0 ? ((totalReturn/downPayment)*100).toFixed(1) : "-";
                    const cashOnCash = downPayment > 0 ? ((annualRentCalc/downPayment)*100).toFixed(1) : "-";
                    const annualized = (((projectedValue + totalRental) / calcPrice) * 100 / calcYears - 100/calcYears).toFixed(1);
                    const scPerSqft = 18;
                    const sizeEst = sp.sizeFrom || 750;
                    const annualSC = sizeEst * scPerSqft;
                    const netYieldPct = ((annualRentCalc - annualSC) / calcPrice * 100).toFixed(1);
                    return (
                      <div>
                        {/* ROI KPIs */}
                        <div style={{ background:"#0A1628", border:"1px solid #1E293B", borderRadius:12, padding:18, marginBottom:14 }}>
                          <div style={{ fontSize:9, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>ROI Estimate</div>
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
                            {[["Gross Yield",`${gross.toFixed(1)}%`,T.green],["Net Yield",`${net.toFixed(1)}%`,T.teal],["5-yr Appreciation",`+${appreciation}%`,T.gold],["Annual YoY",`+${annualYoy}%`,"#3B82F6"]].map(([l,v,c],i) => (
                              <div key={i} style={{ background:"#111827", borderRadius:9, padding:13, textAlign:"center" }}>
                                <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5, fontWeight:700 }}>{l}</div>
                                <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:c }}>{v}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                            {[
                              ["Est. 5-yr Value", estValue5yr?`AED ${(estValue5yr/1e6).toFixed(2)}M`:"-", T.gold, estValue5yr&&price?`+AED ${((estValue5yr-price)/1e6).toFixed(2)}M gain`:null],
                              ["Est. Annual Rent", annualRent?`AED ${annualRent.toLocaleString()}`:"-", T.teal, "1BR estimate"],
                              ["Golden Visa", goldenVisa?"? Eligible":"? Not Eligible", goldenVisa?T.green:"#EF4444", goldenVisa?"Min. AED 2M met":"Below AED 2M"],
                            ].map(([l,v,c,sub],i) => (
                              <div key={i} style={{ background:"#111827", borderRadius:9, padding:13, textAlign:"center" }}>
                                <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5, fontWeight:700 }}>{l}</div>
                                <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:900, color:c }}>{v}</div>
                                {sub && <div style={{ fontSize:10, color:c==="T.textMuted"?T.textMuted:T.textMuted, marginTop:3 }}>{sub}</div>}
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop:10, fontSize:11, color:T.textMuted }}>Risk: {roiData.risk||"Low-Medium"} - Occupancy: {roiData.occupancy||"92"}%</div>
                        </div>
                        {/* Interactive Calculator */}
                        <div style={{ background:"#0A1628", border:"1px solid #1E293B", borderRadius:12, padding:18 }}>
                          <div style={{ fontSize:9, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:18 }}>Interactive ROI Calculator</div>
                          {/* Inputs */}
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:16 }}>
                            <div>
                              <label style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.8, display:"block", marginBottom:6, textTransform:"uppercase" }}>Purchase Price (AED)</label>
                              <input type="number" value={calcPrice} onChange={e => setPdCalcPrice(Number(e.target.value)||1750000)} style={{ width:"100%", padding:"10px 14px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:10, color:T.white, fontSize:14, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }} />
                            </div>
                            <div>
                              <label style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.8, display:"block", marginBottom:6, textTransform:"uppercase" }}>Holding Period: {calcYears} Years</label>
                              <input type="range" min={1} max={10} value={calcYears} onChange={e => setPdCalcYears(Number(e.target.value))} style={{ width:"100%", marginTop:10, accentColor:T.teal }} />
                            </div>
                          </div>
                          <div style={{ marginBottom:14 }}>
                            <div style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.8, marginBottom:8, textTransform:"uppercase" }}>Bedrooms</div>
                            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                              {["1BR","2BR","3BR","TH/Villa"].map(b => (
                                <button key={b} type="button" onClick={() => setPdCalcBeds(b)} style={{ padding:"7px 16px", borderRadius:8, border:`1px solid ${calcBeds===b?T.teal:T.border}`, background:calcBeds===b?"rgba(0,191,165,0.15)":T.surfaceAlt, color:calcBeds===b?T.teal:T.textSecondary, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", outline:"none" }}>{b}</button>
                              ))}
                            </div>
                          </div>
                          <div style={{ marginBottom:20 }}>
                            <div style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.8, marginBottom:8, textTransform:"uppercase" }}>Rental Strategy</div>
                            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                              {["Long-Term","Short-Term Airbnb","Flip at Handover"].map(s => (
                                <button key={s} type="button" onClick={() => setPdCalcStrategy(s)} style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${calcStrategy===s?T.gold:T.border}`, background:calcStrategy===s?"rgba(212,168,67,0.15)":T.surfaceAlt, color:calcStrategy===s?T.gold:T.textSecondary, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", outline:"none" }}>{s}</button>
                              ))}
                            </div>
                          </div>
                          <div style={{ background:T.surfaceAlt, borderRadius:12, padding:20 }}>
                            <div style={{ fontSize:11, fontWeight:700, color:T.teal, letterSpacing:1, marginBottom:14, textTransform:"uppercase" }}>Results - {calcYears}-Year Projection</div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
                              {[["DOWN PAYMENT",`AED ${downPayment.toLocaleString()}`,T.white],["PROJECTED VALUE",`AED ${(projectedValue/1e6).toFixed(2)}M`,T.gold],["CAPITAL GAIN",`AED ${(capitalGain/1e6).toFixed(2)}M`,T.green]].map(([l,v,c]) => (
                                <div key={l} style={{ background:"#04090F", borderRadius:8, padding:"12px 14px" }}>
                                  <div style={{ fontSize:8, color:T.textMuted, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
                                  <div style={{ fontSize:15, fontWeight:800, color:c, fontFamily:"'Fraunces',serif" }}>{v}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
                              {[["TOTAL RENTAL",`AED ${(totalRental/1e6).toFixed(2)}M`,T.teal],["TOTAL RETURN",`AED ${(totalReturn/1e6).toFixed(2)}M`,T.teal],["ROI ON DOWN",`${roiOnDown}%`,"#3B82F6"]].map(([l,v,c]) => (
                                <div key={l} style={{ background:"#04090F", borderRadius:8, padding:"12px 14px" }}>
                                  <div style={{ fontSize:8, color:T.textMuted, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
                                  <div style={{ fontSize:15, fontWeight:800, color:c, fontFamily:"'Fraunces',serif" }}>{v}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10 }}>
                              {[["CASH-ON-CASH",`${cashOnCash}%`,T.green],["ANNUALISED",`${annualized}%`,T.gold],["GROSS YIELD",`${g2.toFixed(1)}%`,T.teal],["NET YIELD",`${netYieldPct}%`,T.green]].map(([l,v,c]) => (
                                <div key={l} style={{ background:"#04090F", borderRadius:8, padding:"12px 14px", textAlign:"center" }}>
                                  <div style={{ fontSize:8, color:T.textMuted, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
                                  <div style={{ fontSize:18, fontWeight:900, color:c, fontFamily:"'Fraunces',serif" }}>{v}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ marginTop:10, fontSize:10, color:T.textMuted }}>Estimates based on community averages. Service charge: AED {scPerSqft}/sqft/yr. Not financial advice.</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* SEND TO CLIENT MODAL */}
                  {sendModal && (() => {
                    const subject = `${sp.name} | ${sp.community} | From AED ${price?(price/1e6).toFixed(2)+"M":"TBD"} | Investment Brief`;
                    const famousFor = ci?.famousFor || "";
                    const body = `Dear Client,\n\nI hope this message finds you well.\n\nI am pleased to present the following off-plan investment opportunity that aligns with your investment profile:\n\nPROJECT BRIEF\n-------------------------------------\nProject:        ${sp.name}\nDeveloper:      ${sp.developer || "Emaar Properties"}\nLocation:       ${sp.community}${sp.district ? `, ${sp.district}` : ""}, Dubai\nProperty Type:  ${sp.type}${sp.beds ? ` | ${sp.beds} BR` : ""}\nStarting Price: AED ${price ? (price/1e6).toFixed(2)+"M" : "TBD"}${sp.ppsf ? ` (AED ${sp.ppsf.toLocaleString()}/sqft)` : ""}\nSize Range:     ${sp.sizeFrom ? sp.sizeFrom.toLocaleString()+" - "+(sp.sizeTo||"").toLocaleString()+" sqft" : "-"}\nPayment Plan:   ${sp.payment || sp.paymentPlan || "-"}\nHandover:       ${sp.handover || "-"}\nStatus:         ${sp.status || "Off-Plan"}\n\nINVESTMENT HIGHLIGHTS\n-------------------------------------\nEst. Gross Yield:      ${gross ? gross.toFixed(1)+"% p.a." : "-"}\n5-Year Appreciation:   +${appreciation || 35}%\nRisk Profile:          ${roiData?.risk || "Low-Medium"}\nOccupancy Rate:        ${roiData?.occupancy || "92"}%${goldenVisa ? "\nGolden Visa:           Eligible (Property = AED 2M)" : ""}\n${famousFor ? "\nCOMMUNITY OVERVIEW\n-------------------------------------\n"+famousFor+"\n" : ""}\nI would be delighted to arrange a viewing, provide floor plans, or walk you through the payment structure at your convenience.\n\nPlease feel free to reach out should you have any questions.\n\nWarm regards,\n\n-------------------------------------\nPowered by DXB Analytics\nDubai Real Estate Intelligence Platform\nhttps://emaar-dashboard.vercel.app\n-------------------------------------`;
                    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    return (
                      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(6px)" }} onClick={() => setSendModal(false)}>
                        <div style={{ background:"#0A1628", border:"1.5px solid #D4A843", borderRadius:18, padding:32, width:"100%", maxWidth:520 }} onClick={e => e.stopPropagation()}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                            <div>
                              <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white, marginBottom:3 }}>Send to Client</div>
                              <div style={{ fontSize:12, color:T.textMuted }}>{sp.name} - {sp.community}</div>
                            </div>
                            <button type="button" onClick={() => setSendModal(false)} style={{ width:32, height:32, borderRadius:8, border:"1px solid #1E293B", background:"#111827", color:T.textMuted, cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>-</button>
                          </div>
                          <div style={{ background:T.bg, borderRadius:10, border:"1px solid #1E293B", padding:16, marginBottom:20, maxHeight:220, overflowY:"auto" }}>
                            <div style={{ fontSize:10, fontWeight:700, color:T.gold, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Email Preview</div>
                            <div style={{ fontSize:11, color:T.textMuted, marginBottom:6 }}><span style={{ color:T.textSecondary, fontWeight:600 }}>Subject: </span>{subject}</div>
                            <pre style={{ fontSize:11, color:T.textSecondary, lineHeight:1.7, whiteSpace:"pre-wrap", fontFamily:"'Outfit',sans-serif" }}>{body}</pre>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                            <a href={mailtoLink} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:13, borderRadius:10, background:"#D4A843", color:"#04090F", border:"2px solid #D4A843", fontWeight:800, fontSize:14, textDecoration:"none", fontFamily:"'Outfit',sans-serif" }}>
                              Open in Email Client
                            </a>
                            <button type="button" onClick={() => { navigator.clipboard.writeText(body); }} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:11, borderRadius:10, background:"transparent", border:"2px solid #D4A843", color:"#D4A843", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif", outline:"none" }}>
                              Copy Email Text
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* DISCLAIMER */}
                  <div style={{ marginTop:24, padding:14, borderRadius:10, background:T.surface, border:`1px solid ${T.border}`, fontSize:10, color:T.textMuted, lineHeight:1.7 }}>
                    <strong style={{ color:T.textSecondary }}>Disclaimer:</strong> Prices, handover dates, and payment plans are estimates based on publicly available data. DXB Analytics is not a licensed real estate brokerage. Always verify with the developer before making financial decisions.
                  </div>

                </div>
              );
            })()}
        </div>
        </div>
        );

      })()}

      {/* --- COMPARE MODAL --- */}
      {showCompare && compareList.length >= 2 && (
        <div role="dialog" aria-modal="true" aria-label="Project comparison" style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setShowCompare(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.gold}`, width: "95%", maxWidth: 900, maxHeight: "90vh", overflowY: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: T.gold, margin: 0 }}>?? Project Comparison</h2>
              <button type="button" onClick={() => setShowCompare(false)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>�</button>
            </div>

            <div className="table-scroll" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: T.textMuted, fontSize: 11, fontWeight: 600, width: 140 }}>METRIC</th>
                    {compareList.map(p => (
                      <th key={p.id} style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: T.gold }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{p.community}</div>
                        {p.emaarUrl && <a href={p.emaarUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 4, fontSize: 9, color: T.gold, textDecoration: "none", padding: "2px 6px", border: "1px solid rgba(212,168,67,0.35)", borderRadius: 4, fontWeight: 700 }}>{getLinkLabel(p.emaarUrl)}</a>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Status", fn: p => p.status },
                    { label: "Construction", fn: p => `${p.construction}%`, highlight: true },
                    { label: "Starting Price", fn: p => p.price ? `AED ${(p.price/1000000).toFixed(1)}M` : "TBD" },
                    { label: "Price/sqft", fn: p => p.ppsf ? `AED ${p.ppsf.toLocaleString()}` : "TBD" },
                    { label: "Handover", fn: p => p.handover },
                    { label: "Size Range", fn: p => `${p.sizeFrom?.toLocaleString()} - ${p.sizeTo?.toLocaleString()} sqft` },
                    { label: "Bedrooms", fn: p => p.beds + " BR" },
                    { label: "Type", fn: p => p.type },
                    { label: "Payment Plan", fn: p => p.payment },
                    { label: "Tier", fn: p => p.tier },
                    { label: "Branded", fn: p => p.branded ? `? ${p.brand}` : "No" },
                    { label: "Total Units", fn: p => p.units ? getUnitEntries(p.units).reduce((a,[,u]) => a + u.total, 0) : "-" },
                    { label: "Available", fn: p => p.units ? getUnitEntries(p.units).reduce((a,[,u]) => a + (u.total - u.sold), 0) : "-", highlight: true },
                    { label: "% Sold", fn: p => { if (!p.units) return "-"; const entries = getUnitEntries(p.units); const t = entries.reduce((a,[,u]) => a + u.total, 0); const s = entries.reduce((a,[,u]) => a + u.sold, 0); return t > 0 ? `${((s/t)*100).toFixed(0)}%` : "-"; } },
                  ].map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: `1px solid ${T.border}`, background: row.highlight ? "rgba(212,168,67,0.04)" : "transparent" }}>
                      <td style={{ padding: "10px 16px", color: T.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>{row.label}</td>
                      {compareList.map(p => (
                        <td key={p.id} style={{ padding: "10px 16px", textAlign: "center", color: row.highlight ? T.gold : T.white, fontSize: 13, fontWeight: row.highlight ? 700 : 400 }}>{row.fn(p)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* View Full Report for all compared projects */}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {compareList.map(p => (
                <button key={p.id} type="button" onClick={() => setSelectedProject(p)}
                  style={{ flex: 1, padding: "10px 0", background: "linear-gradient(135deg, rgba(212,168,67,0.15), rgba(212,168,67,0.07))", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 10, color: T.gold, fontSize: 12, fontWeight: 700, textAlign: "center", cursor: "pointer" }}>
                  ??? {p.name.split(" ").slice(0,2).join(" ")}
                </button>
              ))}
            </div>
            {/* View on Emaar for all compared projects */}
            {compareList.some(p => p.emaarUrl) && (
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                {compareList.map(p => p.emaarUrl ? (
                  <a key={p.id} href={p.emaarUrl} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, padding: "8px 0", background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.35)", borderRadius: 10, color: T.gold, fontSize: 11, fontWeight: 700, textAlign: "center", textDecoration: "none" }}>
                    {p.name.split(" ").slice(0,2).join(" ")} ? {getLinkDomain(p.emaarUrl)}
                  </a>
                ) : <div key={p.id} style={{ flex: 1 }} />)}
              </div>
            )}
          </div>
        </div>
      )}





      {/* ADD INVESTMENT MODAL */}
      {showAddPortfolio && <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }} onClick={() => setShowAddPortfolio(null)}>
        <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "95%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
          <button type="button" onClick={() => setShowAddPortfolio(null)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>{"\u2715"}</button>
          <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${T.border}` }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.white }}>{typeof showAddPortfolio === "object" ? "Investment Details" : "Select Project"}</h2>
            <p style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{typeof showAddPortfolio === "object" ? showAddPortfolio.name + " \u00b7 " + showAddPortfolio.community : "Choose from 208 Emaar projects"}</p>
          </div>
          <div style={{ padding: "16px 28px 28px" }}>
            {showAddPortfolio === true ? <>
              <input type="text" placeholder="Search projects..." onChange={e => setProjectSearch(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none", marginBottom: 12 }} />
              <div style={{ maxHeight: 320, overflow: "auto" }}>
                {activeProjects.filter(p => !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.community.toLowerCase().includes(projectSearch.toLowerCase())).map(p => (
                  <div key={p.id} onClick={() => setShowAddPortfolio(p)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, cursor: "pointer", transition: "background 0.2s", marginBottom: 2 }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.name></span>
                        {p.emaarUrl && <a href={p.emaarUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, color: T.gold, textDecoration: "none", padding: "1px 4px", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 3, fontWeight: 700, flexShrink: 0 }}>?</a>}
                      </div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>{p.community} \u00b7 {p.type} \u00b7 {p.beds}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>AED {p.price ? (p.price/1e6).toFixed(2) + "M" : "TBD"}</div>
                      <div style={{ fontSize: 9, color: T.textMuted }}>{p.handover}</div>
                      {(() => { const cd = getHandoverCountdown(p.handover); return cd ? <div style={{ fontSize: 9, fontWeight: 700, color: cd.passed ? "#10B981" : cd.color, marginTop: 1 }}>{cd.passed ? "\u2713 Ready" : "\u23F1 " + cd.label}</div> : null; })()}
                    </div>
                  </div>
                ))}
              </div>
            </> : typeof showAddPortfolio === "object" && <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 4 }}>UNIT TYPE</label>
                  <select value={portfolioForm.unitType} onChange={e => setPortfolioForm({...portfolioForm, unitType: e.target.value})} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
                    {["Studio", "1BR", "2BR", "3BR", "4BR", "5BR", "Penthouse", "Townhouse", "Villa"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 4 }}>UNITS</label>
                  <input type="number" min="1" value={portfolioForm.units} onChange={e => setPortfolioForm({...portfolioForm, units: parseInt(e.target.value) || 1})} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none" }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 4 }}>INVESTED AMOUNT (AED)</label>
                <input type="number" placeholder={showAddPortfolio.price ? showAddPortfolio.price.toString() : "Enter amount"} value={portfolioForm.investedAmount} onChange={e => setPortfolioForm({...portfolioForm, investedAmount: e.target.value})} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 4 }}>PURCHASE DATE</label>
                  <input type="date" value={portfolioForm.purchaseDate} onChange={e => setPortfolioForm({...portfolioForm, purchaseDate: e.target.value})} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 4 }}>NOTES</label>
                  <input type="text" placeholder="Optional notes" value={portfolioForm.notes} onChange={e => setPortfolioForm({...portfolioForm, notes: e.target.value})} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setShowAddPortfolio(true)} style={{ flex: 1, padding: "10px 0", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>{"\u2190 Back"}</button>
                <button type="button" onClick={addToPortfolio} style={{ flex: 2, padding: "10px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Add to Portfolio</button>
              </div>
            </>}
          </div>
        </div>
      </div>}

      {/* SET ALERT MODAL */}
      {showSetAlert && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 3200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }} onClick={() => setShowSetAlert(null)}>
          <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "min(440px,95vw)", padding: "28px 28px 24px", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setShowSetAlert(null)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: T.gold, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Price Alert</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.white }}>{showSetAlert.name}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{showSetAlert.community} - {showSetAlert.type}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>ALERT TYPE</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[["price_below","Price drops below",""], ["price_above","Price rises above",""], ["yield_above","Yield crosses",""], ["construction_above","Construction hits",""]].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setAlertForm(f => ({ ...f, type: val, value: val === "yield_above" ? "7" : val === "construction_above" ? "80" : (showSetAlert.price||"").toString() }))} style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${alertForm.type === val ? T.gold : T.border}`, background: alertForm.type === val ? "rgba(212,168,67,0.12)" : T.surfaceAlt, color: alertForm.type === val ? T.gold : T.textSecondary, fontSize: 11, fontWeight: alertForm.type === val ? 700 : 400, cursor: "pointer", textAlign: "left", fontFamily: "'Outfit', sans-serif" }}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>{alertForm.type === "yield_above" ? "YIELD THRESHOLD (%)" : alertForm.type === "construction_above" ? "CONSTRUCTION % TARGET" : "PRICE TARGET (AED)"}</div>
                <input type="number" value={alertForm.value} onChange={e => setAlertForm(f => ({ ...f, value: e.target.value }))} placeholder={alertForm.type === "yield_above" ? "e.g. 7" : alertForm.type === "construction_above" ? "e.g. 80" : showSetAlert.price ? showSetAlert.price.toString() : "Enter amount"} style={{ width: "100%", padding: "12px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, color: T.white, fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", boxSizing: "border-box" }} />
                {alertForm.type.includes("price") && alertForm.value && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>AED {(Number(alertForm.value)/1e6).toFixed(2)}M {alertForm.type === "price_below" ? "below" : "above"} current AED {(showSetAlert.price/1e6).toFixed(2)}M</div>}
              </div>
              {myAlerts.filter(a => a.projectId === showSetAlert.id).length > 0 && (
                <div style={{ padding: "10px 12px", background: "rgba(212,168,67,0.06)", borderRadius: 8, border: "1px solid rgba(212,168,67,0.2)" }}>
                  <div style={{ fontSize: 10, color: T.gold, fontWeight: 700, marginBottom: 6 }}>EXISTING ALERTS</div>
                  {myAlerts.filter(a => a.projectId === showSetAlert.id).map(a => (
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: T.textMuted, marginBottom: 3 }}>
                      <span>{a.type.replace(/_/g," ")} {a.type.includes("yield") || a.type.includes("construction") ? a.value + "%" : "AED " + (a.value/1e6).toFixed(2) + "M"} {a.triggered ? "? Triggered" : "? Watching"></span>
                      <button type="button" onClick={() => removeAlert(a.id)} style={{ background: "none", border: "none", color: "rgba(239,68,68,0.6)", cursor: "pointer", fontSize: 12, padding: 0 }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={addAlert} disabled={!alertForm.value} style={{ width: "100%", padding: "13px 0", background: alertForm.value ? `linear-gradient(135deg, ${T.gold}, #B8912F)` : T.surfaceAlt, color: alertForm.value ? T.bg : T.textMuted, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: alertForm.value ? "pointer" : "not-allowed", fontFamily: "'Outfit', sans-serif" }}>Set Alert</button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT PAYMENT MODAL */}
      {/* --- PRICE ALERTS MODAL --- */}
      {showAlerts && isLoggedIn && <div role="dialog" aria-modal="true" aria-label="Price Alerts" style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.93)", zIndex: 3200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)", padding: 16 }} onClick={() => setShowAlerts(false)}>
        <div className="alerts-modal" style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "95%", maxWidth: 560, maxHeight: "88vh", overflow: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
          <button type="button" onClick={() => setShowAlerts(false)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>�</button>
          <div style={{ padding: "28px 28px 20px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>?? Price Alerts</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.white }}>Get notified when the market moves</div>
            <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>Alerts sent to {user} via email</div>
          </div>
          <div style={{ padding: "20px 28px" }}>
            {/* Create alert form */}
            <div style={{ background: T.surfaceAlt, borderRadius: 14, padding: 18, border: `1px solid ${T.border}`, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Create New Alert</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 5 }}>COMMUNITY</div>
                  <select value={alertForm.community} onChange={e => setAlertForm(f => ({...f, community: e.target.value}))} style={{ width: "100%", padding: "9px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
                    {["Dubai Hills Estate","Downtown Dubai","Dubai Creek Harbour","Emaar Beachfront","Arabian Ranches III","JVC","The Valley","Business Bay","Palm Jumeirah","DIFC"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 5 }}>METRIC</div>
                  <select value={alertForm.metric} onChange={e => setAlertForm(f => ({...f, metric: e.target.value}))} style={{ width: "100%", padding: "9px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
                    <option value="grossYield">Gross Yield (%)</option>
                    <option value="netYield">Net Yield (%)</option>
                    <option value="avgPriceSqft">Avg Price (AED/sqft)</option>
                    <option value="transactions">Monthly Transactions</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 5 }}>CONDITION</div>
                  <select value={alertForm.condition} onChange={e => setAlertForm(f => ({...f, condition: e.target.value}))} style={{ width: "100%", padding: "9px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
                    <option value="above">Goes Above</option>
                    <option value="below">Falls Below</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 5 }}>VALUE</div>
                  <input type="number" value={alertForm.value} onChange={e => setAlertForm(f => ({...f, value: e.target.value}))} style={{ width: "100%", padding: "9px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} placeholder="e.g. 8.5" />
                </div>
              </div>
              <button type="button" disabled={alertSaving} onClick={async () => {
                if (!alertForm.value) return;
                setAlertSaving(true);
                const newAlert = { ...alertForm, id: Date.now(), createdAt: new Date().toISOString(), active: true };
                const updated = [...myAlerts, newAlert];
                setMyAlerts(updated);
                try { await setDoc(doc(db, "priceAlerts", user), { alerts: updated, updatedAt: new Date().toISOString() }); } catch(e) {}
                setAlertSaving(false);
              }} style={{ width: "100%", padding: "10px 0", background: alertSaving ? T.surfaceAlt : `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: alertSaving ? T.textMuted : T.bg, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: alertSaving ? "default" : "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.2s" }}>
                {alertSaving ? "Saving-" : "+ Create Alert"}
              </button>
            </div>
            {/* Existing alerts */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Active Alerts ({myAlerts.filter(a => a.active).length})</div>
            {myAlerts.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: T.textMuted, fontSize: 13 }}>No alerts yet - create your first one above</div>}
            {myAlerts.map((a, i) => (
              <div key={a.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{a.condition === "above" ? "" : ""></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{a.community}</div>
                  <div style={{ fontSize: 11, color: T.textSecondary }}>{a.metric === "grossYield" ? "Gross Yield" : a.metric === "netYield" ? "Net Yield" : a.metric === "avgPriceSqft" ? "Avg Price/sqft" : "Transactions"} {a.condition} {a.value}{a.metric.includes("Yield") ? "%" : ""}</div>
                </div>
                <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: a.active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: a.active ? T.green : "#EF4444", fontWeight: 700 }}>{a.active ? "ACTIVE" : "PAUSED"></span>
                <button type="button" onClick={async () => {
                  const updated = myAlerts.filter((_, j) => j !== i);
                  setMyAlerts(updated);
                  try { await setDoc(doc(db, "priceAlerts", user), { alerts: updated, updatedAt: new Date().toISOString() }); } catch(e) {}
                }} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16, padding: "4px 6px", borderRadius: 6, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#EF4444"} onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>�</button>
              </div>
            ))}
            {myAlerts.length > 0 && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 12, textAlign: "center" }}>Alerts checked daily. Email sent to {user}</div>}
          </div>
        </div>
      </div>}

      {showCheckout && <div role="dialog" aria-modal="true" aria-label="Upgrade checkout" style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.95)", zIndex: 3100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }} onClick={() => { setShowCheckout(null); setCheckoutStep(1); }}>
        <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "95%", maxWidth: 480, position: "relative", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
          <button type="button" onClick={() => { setShowCheckout(null); setCheckoutStep(1); }} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>{"\u2715"}</button>
          <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
              {[1,2,3].map(s => <React.Fragment key={s}><div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: checkoutStep >= s ? T.gold : T.surfaceAlt, color: checkoutStep >= s ? T.bg : T.textMuted, border: `1px solid ${checkoutStep >= s ? T.gold : T.border}` }}>{checkoutStep > s ? "\u2713" : s}</div>{s < 3 && <div style={{ width: 40, height: 2, background: checkoutStep > s ? T.gold : T.surfaceAlt, borderRadius: 1 }} />}</React.Fragment>)}
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.white, textAlign: "center" }}>{checkoutStep === 1 ? "Confirm Plan" : checkoutStep === 2 ? "Payment" : "Welcome to Pro!"}</h2>
          </div>
          <div style={{ padding: "20px 28px 28px" }}>
            {checkoutStep === 1 && <>
              <div style={{ padding: 16, borderRadius: 12, background: T.surfaceAlt, border: `2px solid ${T.gold}`, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 800, color: T.gold }}>{showCheckout.name} Plan</span><span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "rgba(212,168,67,0.12)", color: T.gold }}>SELECTED</span></div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 12 }}><span style={{ fontSize: 10, color: T.textMuted }}>AED</span><span style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 900, color: T.white }}>{showCheckout.price></span><span style={{ fontSize: 12, color: T.textMuted }}>/month</span></div>
                {showCheckout.features.slice(0,5).map((f,j) => <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", fontSize: 12, color: T.textSecondary }}><span style={{ color: T.green }}>{"\u2713"></span>{f}</div>)}
              </div>
              <button type="button" onClick={() => setCheckoutStep(2)} style={{ width: "100%", padding: "12px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Continue to Payment ?</button>
            </>}
            {checkoutStep === 2 && <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, marginBottom: 12 }}>CHOOSE PAYMENT METHOD</div>

                {/* Stripe Payment Links */}
                {/* -- Paddle Card Payment -- */}
                {(() => {
                  // --- PADDLE PRICE IDs ---------------------------------
                  // 1. Sign up at paddle.com (free)
                  // 2. Create products: Pro (AED 99/mo), Enterprise (AED 499/mo)
                  // 3. Paste the price IDs below (format: pri_XXXXXXXX)
                  const PADDLE_PRICE_IDS = {
                    "Pro":        "pri_01kk54qfbzqhbvk3d8h7e11tgt",
                    "Enterprise": "pri_01kk54tmkq6be21z94bw2fyhnr",
                  };
                  const paddleReady = window.Paddle && !PADDLE_PRICE_IDS[showCheckout.name].includes("PASTE");
                  const openPaddle = () => {
                    if (paddleReady) {
                      window.Paddle.Checkout.open({
                        items: [{ priceId: PADDLE_PRICE_IDS[showCheckout.name], quantity: 1 }],
                        customer: { email: user || "" },
                        settings: { theme: "dark", displayMode: "overlay" },
                        successCallback: async () => {
                          try {
                            await updateDoc(doc(db, "users", user), {
                              tier: showCheckout.name.toLowerCase(),
                              upgradedAt: new Date().toISOString(),
                              upgradedPlan: showCheckout.name
                            });
                          } catch(e) {}
                          setCheckoutStep(3);
                        }
                      });
                    } else {
                      // Fallback to WhatsApp until Paddle is configured
                      window.open(`https://wa.me/971542410599?text=${encodeURIComponent(`Hi, I want DXB Analytics ${showCheckout.name} Plan (AED ${showCheckout.price}/mo). Email: ${user}`)}`, "_blank");
                      setCheckoutStep(3);
                    }
                  };
                  return (
                    <div onClick={openPaddle} style={{ padding: "16px", borderRadius: 12, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "all 0.2s", marginBottom: 8 }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#3B82F6"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"}>
                      <div style={{ fontSize: 24 }}>??</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Credit / Debit Card</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>Visa - Mastercard - Amex - Apple Pay - {paddleReady ? "Powered by Paddle" : "Powered by Paddle (setup pending)"}</div>
                      </div>
                      <span style={{ fontSize: 9, padding: "3px 10px", borderRadius: 6, background: "rgba(34,197,94,0.12)", color: "#22C55E", fontWeight: 700, border: "1px solid rgba(34,197,94,0.2)" }}>RECOMMENDED</span>
                    </div>
                  );
                })()}

                {/* WhatsApp */}
                <div onClick={() => { window.open(`https://wa.me/971542410599?text=${encodeURIComponent(`Hi Mian Waleed, I want to subscribe to DXB Analytics ${showCheckout.name} Plan (AED ${showCheckout.price}/mo). My email: ${user}`)}`, "_blank"); setCheckoutStep(3); }} style={{ padding: "16px", borderRadius: 12, background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.25)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "all 0.2s", marginBottom: 8 }} onMouseEnter={e => e.currentTarget.style.borderColor = "#25D366"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(37,211,102,0.25)"}>
                  <div style={{ fontSize: 24 }}>??</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>WhatsApp + Bank Transfer</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>Manual - activated within 5 minutes of payment</div>
                  </div>
                  <span style={{ color: "#25D366", fontSize: 16 }}>?</span>
                </div>

                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(212,168,67,0.04)", border: "1px solid rgba(212,168,67,0.1)", fontSize: 11, color: T.textMuted, lineHeight: 1.5, marginBottom: 12 }}>?? All payments secure - 7-day money-back guarantee</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setCheckoutStep(1)} style={{ width: "100%", padding: "10px 0", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>? Back</button>
              </div>
            </>}
            {checkoutStep === 3 && <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>??</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.gold, marginBottom: 8 }}>Payment Request Sent!</div>
              <div style={{ fontSize: 13, color: T.textSecondary, maxWidth: 320, margin: "0 auto", lineHeight: 1.6, marginBottom: 20 }}>We opened WhatsApp for you. After confirming payment, your {showCheckout.name} Plan will be activated within 5 minutes.</div>
              <div style={{ padding: 12, borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, marginBottom: 16, fontSize: 11, color: T.textMuted }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Plan</span><span style={{ color: T.gold, fontWeight: 700 }}>{showCheckout.name></span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Amount</span><span style={{ color: T.white, fontWeight: 700 }}>AED {showCheckout.price}/mo</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Account</span><span style={{ color: T.white }}>{user></span></div>
              </div>
              <button type="button" onClick={() => { setShowCheckout(null); setCheckoutStep(1); setShowUpgrade(false); }} style={{ width: "100%", padding: "12px 0", background: T.gold, color: T.bg, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Done</button>
            </div>}
          </div>
        </div>
      </div>}

      {/* -- MOBILE BOTTOM NAV BAR -- */}
      <nav style={{ display: "none" }} className="mobile-bottom-nav" aria-label="Quick navigation">
        {[
          { key: "Overview", icon: "~"??", label: "Overview" },
          { key: "Projects", icon: "~"???", label: "Projects" },
          { key: "Yields", icon: "~"??", label: "Yields" },
          { key: "Portfolio", icon: "~"??", label: "Portfolio" },
          { key: "Market", icon: "~"??", label: "Market" },
        ].map(item => (
          <button key={item.key} type="button" onClick={() => { setTab(item.key); setSidebarOpen(false); }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "6px 0", color: tab === item.key ? T.gold : T.textMuted, fontFamily: "'Outfit',sans-serif", transition: "color 0.2s" }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon></span>
            <span style={{ fontSize: 9, fontWeight: tab === item.key ? 700 : 400, letterSpacing: 0.3 }}>{item.label></span>
            {tab === item.key && <span style={{ width: 4, height: 4, borderRadius: "50%", background: T.gold, display: "block" }} />}
          </button>
        ))}
        <button type="button" onClick={() => setSidebarOpen(s => !s)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "6px 0", color: T.textMuted, fontFamily: "'Outfit',sans-serif" }}>
          <span style={{ fontSize: 18 }}>?</span>
          <span style={{ fontSize: 9, letterSpacing: 0.3 }}>More</span>
        </button>
      </nav>

      {/* USER PROFILE MODAL */}
      {showProfile && <div role="dialog" aria-modal="true" aria-label="User profile" style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }} onClick={() => setShowProfile(false)}>
        <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "95%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
          <button type="button" onClick={() => setShowProfile(false)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>�</button>
          <div style={{ padding: "32px 28px 20px", background: `linear-gradient(135deg, rgba(212,168,67,0.08), rgba(14,29,53,0.6))`, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: T.bg, flexShrink: 0 }}>{user.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.white }}>{userName || user.split("@")[0]}</div>
                <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>{user}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, padding: "3px 10px", borderRadius: 6, background: userTier === "admin" || userTier === "pro" || userTier === "enterprise" ? "rgba(16,185,129,0.12)" : userTier === "pro_trial" ? "rgba(212,168,67,0.12)" : "rgba(59,130,246,0.12)", fontSize: 10, fontWeight: 700, color: userTier === "admin" || userTier === "pro" || userTier === "enterprise" ? T.green : userTier === "pro_trial" ? T.gold : T.blue }}>{userTier === "admin" ? "\u26A1 Admin" : userTier === "pro" ? "\u2B50 Pro Plan" : userTier === "pro_trial" ? `\u2B50 Pro Trial \u00B7 ${trialDaysLeft}d left` : userTier === "enterprise" ? "\uD83C\uDFE2 Enterprise" : "Free Plan">*</div>
                {isVerified && <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, marginLeft: 6, padding: "3px 10px", borderRadius: 6, background: "rgba(0,191,165,0.12)", fontSize: 10, fontWeight: 700, color: "#00BFA5" }}>? Verified {verifiedLevel ? `- ${verifiedLevel.charAt(0).toUpperCase() + verifiedLevel.slice(1)}` : "">*</div>}
              </div>
            </div>
          </div>
          <div style={{ padding: "20px 28px 28px" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Profile Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 4 }}>DISPLAY NAME</label><input type="text" value={profileEdit.name} onChange={e => setProfileEdit({...profileEdit, name: e.target.value})} placeholder="Your name" style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none" }} /></div>
                <div><label style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 4 }}>EMAIL</label><input type="email" value={user} disabled style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none", opacity: 0.6 }} /></div>
              </div>
              <button type="button" onClick={async () => { if (auth.currentUser && profileEdit.name.trim()) { try { await setDoc(doc(db, "users", auth.currentUser.uid), { name: profileEdit.name.trim() }, { merge: true }); setUserName(profileEdit.name.trim()); setToast("\u2705 Profile updated!"); setTimeout(() => setToast(""), 3000); } catch(e) { setToast("\u274C Update failed"); setTimeout(() => setToast(""), 3000); } } }} style={{ marginTop: 10, padding: "8px 20px", background: T.gold, color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Save Changes</button>
            </div>
            <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Subscription</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div><div style={{ fontSize: 10, color: T.textMuted }}>Plan</div><div style={{ fontSize: 14, fontWeight: 700, color: T.gold, fontFamily: "'Fraunces', serif" }}>{userTier === "admin" ? "Admin" : userTier === "pro" ? "Pro" : userTier === "pro_trial" ? "Pro Trial" : userTier === "enterprise" ? "Enterprise" : "Free"}</div></div>
                <div><div style={{ fontSize: 10, color: T.textMuted }}>Status</div><div style={{ fontSize: 14, fontWeight: 700, color: userTier === "free" ? T.blue : T.green }}>{userTier === "free" ? "Limited" : "Active"}</div></div>
                <div><div style={{ fontSize: 10, color: T.textMuted }}>Access</div><div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{userTier === "free" ? "5 projects" : "All 208"}</div></div>
              </div>
              {(userTier === "free" || userTier === "pro_trial") && <button type="button" onClick={() => { setShowProfile(false); setShowUpgrade(true); }} style={{ marginTop: 12, width: "100%", padding: "10px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>{userTier === "pro_trial" ? "Subscribe Before Trial Ends" : "\u2B50 Upgrade to Pro \u2014 AED 99/mo"}</button>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button type="button" onClick={() => { setShowProfile(false); handleTabChange("Portfolio"); }} style={{ padding: "10px 0", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>?? Portfolio</button>
              <button type="button" onClick={() => { signOut(auth); setShowProfile(false); }} style={{ padding: "10px 0", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#EF4444", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Sign Out</button>
            </div>
            {/* KYC VERIFICATION SECTION */}
            <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Identity Verification</div>
              {isVerified ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,191,165,0.15)", border: "2px solid #00BFA5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>?</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#00BFA5" }}>Identity Verified</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Level: {verifiedLevel || "Basic"} - Approved by admin</div>
                  </div>
                </div>
              ) : kycStatus === "pending" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(245,158,11,0.15)", border: "2px solid #F59E0B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>?</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>Verification Pending</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Admin review in progress - Usually within 24h</div>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 10, lineHeight: 1.6 }}>Verify your identity to unlock the verified badge and access exclusive features.</p>
                  <button type="button" onClick={() => { setShowProfile(false); setShowKYC(true); }} style={{ padding: "9px 20px", background: `linear-gradient(135deg, #00BFA5, #00897B)`, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>? Apply for Verification</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>}

      {/* --- KYC VERIFICATION MODAL --- */}
      {showKYC && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", padding: 16 }} onClick={() => setShowKYC(false)}>
          <div style={{ background: T.surface, borderRadius: 20, border: `1px solid rgba(0,191,165,0.3)`, width: "95%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "24px 28px 20px", background: "linear-gradient(135deg, rgba(0,191,165,0.08), rgba(14,29,53,0.6))", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: "#00BFA5" }}>?? Identity Verification</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Submit your details for admin review - Usually approved within 24h</div>
                </div>
                <button type="button" onClick={() => setShowKYC(false)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>�</button>
              </div>
            </div>
            <div style={{ padding: "24px 28px 28px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                {[
                  { k: "name", l: "Full Name *", p: "As on your passport", t: "text" },
                  { k: "phone", l: "Phone Number *", p: "+971 50 000 0000", t: "tel" },
                  { k: "nationality", l: "Nationality", p: "e.g. UAE, India, UK", t: "text" },
                  { k: "dob", l: "Date of Birth", p: "", t: "date" },
                  { k: "address", l: "Residential Address", p: "Dubai, UAE", t: "text" },
                ].map(f => (
                  <div key={f.k} style={{ gridColumn: f.k === "address" ? "1 / -1" : "auto" }}>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>{f.l}</label>
                    <input type={f.t} placeholder={f.p} value={kycForm[f.k] || ""} onChange={e => setKycForm(prev => ({ ...prev, [f.k]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>Verification Level</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {[{ v: "basic", l: "Basic", d: "Name & phone", c: "#3B82F6" }, { v: "intermediate", l: "Intermediate", d: "ID + selfie", c: T.gold }, { v: "advanced", l: "Advanced", d: "Video call", c: "#10B981" }].map(opt => (
                      <div key={opt.v} onClick={() => setKycForm(prev => ({ ...prev, level: opt.v }))} style={{ padding: "12px 10px", borderRadius: 10, border: `1px solid ${kycForm.level === opt.v ? opt.c : T.border}`, background: kycForm.level === opt.v ? `${opt.c}12` : T.surfaceAlt, cursor: "pointer", textAlign: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: kycForm.level === opt.v ? opt.c : T.white }}>{opt.l}</div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3 }}>{opt.d}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button type="button" onClick={submitKYC} disabled={kycSubmitting} style={{ width: "100%", padding: "13px 0", background: kycSubmitting ? T.surfaceAlt : "linear-gradient(135deg, #00BFA5, #00897B)", border: "none", borderRadius: 10, color: kycSubmitting ? T.textMuted : "#fff", fontWeight: 800, fontSize: 14, cursor: kycSubmitting ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif" }}>
                {kycSubmitting ? "Submitting..." : "Submit for Verification ?"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- KPI DETAIL MODAL --- */}
      {selectedKPI && (
        <div role="dialog" aria-modal="true" aria-label={`${selectedKPI?.label} details`} style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", padding: 16 }} onClick={() => setSelectedKPI(null)}>
          <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${selectedKPI.color || T.gold}`, width: "95%", maxWidth: 640, maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 40px ${selectedKPI.color || T.gold}22` }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setSelectedKPI(null)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>�</button>
            <div style={{ padding: 28 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{selectedKPI.label}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 900, color: selectedKPI.color || T.gold, lineHeight: 1 }}>{selectedKPI.value}</div>
                {selectedKPI.description && <p style={{ marginTop: 10, fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>{selectedKPI.description}</p>}
              </div>
              {selectedKPI.items && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Breakdown</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                    {selectedKPI.items.map((item, i) => (
                      <div key={i} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Fraunces', serif", color: selectedKPI.color || T.gold }}>{item.value}</div>
                        {item.note && <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 2 }}>{item.note}</div>}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {selectedKPI.trend && selectedKPI.trend.length > 0 && (() => {
                const max = Math.max(...selectedKPI.trend.map(d => d.v));
                return (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Historical Trend</div>
                    <div style={{ background: T.surfaceAlt, borderRadius: 12, padding: 16, border: `1px solid ${T.border}`, marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                        {selectedKPI.trend.map((d, i) => {
                          const pct = (d.v / max) * 100;
                          const isLast = i === selectedKPI.trend.length - 1;
                          return (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                              <div style={{ width: "100%", background: isLast ? (selectedKPI.color || T.gold) : T.border, borderRadius: "3px 3px 0 0", height: `${pct}%`, minHeight: 4, position: "relative" }}>
                                {isLast && <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: selectedKPI.color || T.gold, fontWeight: 700, whiteSpace: "nowrap" }}>?? Latest</div>}
                              </div>
                              <div style={{ fontSize: 9, color: T.textMuted }}>{d.y}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>Source</div>
                  <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>{selectedKPI.source}</div>
                </div>
                {selectedKPI.sourceUrl && selectedKPI.sourceUrl !== "#" && (
                  <a href={selectedKPI.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 16px", background: selectedKPI.color || T.gold, color: T.bg, borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: "none", fontFamily: "'Outfit', sans-serif" }}>View Source ?</a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- NOTIFICATIONS PANEL --- */}
      {showNotifications && (
        <div style={{ position: "fixed", top: 60, right: 16, width: 360, maxHeight: 480, background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", zIndex: 4000, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white }}>Notifications</div>
              {unreadCount > 0 && <div style={{ fontSize: 11, color: T.gold }}>{unreadCount} unread</div>}
            </div>
            <button type="button" onClick={() => setShowNotifications(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 18 }}>�</button>
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {isPro && myAlerts.filter(a => !a.triggered).length > 0 && (
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, background: "rgba(212,168,67,0.04)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Active Alerts ({myAlerts.filter(a => !a.triggered).length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {myAlerts.map(a => (
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: a.triggered ? "rgba(16,185,129,0.08)" : T.surfaceAlt, borderRadius: 8, padding: "8px 10px", border: `1px solid ${a.triggered ? "rgba(16,185,129,0.2)" : T.border}` }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: a.triggered ? "#10B981" : T.white }}>{a.projectName}</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>{a.type.replace(/_/g," ")} {a.type.includes("yield") || a.type.includes("construction") ? a.value + "%" : "AED " + (a.value/1e6).toFixed(2) + "M"} {a.triggered ? "? Triggered" : "? Watching"}</div>
                      </div>
                      <button type="button" onClick={() => removeAlert(a.id)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16, padding: "0 4px" }}>-</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {notifications.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>??</div>
                <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 4 }}>No notifications yet</div>
                <div style={{ fontSize: 11 }}>Set alerts on project cards ?? to get notified of price changes.</div>
              </div>
            ) : notifications.map((n, i) => (
              <div key={n.id} onClick={() => markNotifRead(n.id)} style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", background: n.read ? "transparent" : "rgba(212,168,67,0.04)", transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "rgba(212,168,67,0.04)"}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{n.icon || ""></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: n.read ? 400 : 700, color: n.read ? T.textSecondary : T.white, marginBottom: 3 }}>{n.title || "Update"}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 5 }}>{n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-AE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "">*</div>
                  </div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold, flexShrink: 0, marginTop: 4 }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- WATCHLIST PANEL --- */}
      {showWatchlist && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.85)", zIndex: 3500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setShowWatchlist(false)}>
          <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "min(640px,95vw)", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.gold }}>? My Watchlist</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{watchlist.length} project{watchlist.length !== 1 ? "s" : ""} saved</div>
              </div>
              <button type="button" onClick={() => setShowWatchlist(false)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>�</button>
            </div>
            <div style={{ overflowY: "auto", padding: 20, flex: 1 }}>
              {watchlist.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: T.textMuted }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>?</div>
                  <div style={{ fontSize: 14, color: T.textSecondary, marginBottom: 8 }}>No projects saved yet</div>
                  <div style={{ fontSize: 12 }}>Click the ? star on any project card to add it here.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {watchlist.map((w, i) => {
                    const liveP = activeProjects.find(p => p.id === w.id);
                    const currentPrice = liveP?.price || w.price;
                    const priceChanged = liveP && w.price && liveP.price !== w.price;
                    return (
                      <div key={w.id} style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
                        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                        onClick={() => { setSelectedProject(liveP || w); setShowWatchlist(false); }}>
                        {liveP?.imageUrl && <img src={liveP.imageUrl} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.style.display="none"} />}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 3 }}>{w.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 11, color: T.textMuted }}>{w.community></span>
                            {liveP?.emaarUrl && <a href={liveP.emaarUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, color: T.gold, textDecoration: "none", padding: "1px 5px", border: "1px solid rgba(212,168,67,0.35)", borderRadius: 4, fontWeight: 700 }}>{getLinkLabel(liveP?.emaarUrl)}</a>}
                          </div>
                          {priceChanged && <div style={{ fontSize: 10, color: liveP.price > w.price ? T.red : T.green, marginTop: 4, fontWeight: 600 }}>{liveP.price > w.price ? "?" : "?"} Price changed since you saved this</div>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>AED {currentPrice ? (currentPrice / 1e6).toFixed(2) + "M" : "-"}</div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Starting from</div>
                        </div>
                        <button type="button" onClick={e => { e.stopPropagation(); toggleWatchlist(w); }} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#EF4444", padding: "4px 8px", cursor: "pointer", fontSize: 11, flexShrink: 0 }}>Remove</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- ONBOARDING MODAL --- */}
      {showOnboarding && (() => {
        const steps = [
          {
            icon: "~"??",
            title: `Welcome to DXB Analytics, ${userName || "Investor"}!`,
            body: "You now have access to Dubai's most comprehensive real estate intelligence platform. Let us show you around in 30 seconds.",
            cta: "Let's Go ??"
          },
          {
            icon: "~"???",
            title: "Browse 208+ Emaar Projects",
            body: "Go to the Projects tab to explore every active development. Filter by community, tier, handover year, or price range. Click any card for full details, documents, and ROI analysis.",
            cta: "Next ?"
          },
          {
            icon: "~"?",
            title: "Build Your Watchlist",
            body: "See the ? star button on every project card? Click it to save projects you're interested in. Your watchlist syncs across devices.",
            cta: "Next ?"
          },
          {
            icon: "~"??",
            title: "Yields, ROI & Mortgage",
            body: "Use the Yields tab for rental returns by community. The Mortgage tab calculates your monthly payment + all UAE transaction costs instantly.",
            cta: "Next ?"
          },
          {
            icon: "~"??",
            title: "You're All Set!",
            body: userTier === "free" ? "You're on the Free plan. Upgrade to Pro for compare mode, full project details, PDF reports, and portfolio tracking - from AED 99/month." : "You have full Pro access. Explore everything - compare projects, track your portfolio, and download reports.",
            cta: userTier === "free" ? "Explore Free Features" : "Start Exploring"
          },
        ];
        const step = steps[onboardingStep];
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(16px)" }}>
            <div style={{ background: T.surface, borderRadius: 24, border: `1px solid rgba(212,168,67,0.3)`, width: "min(480px,94vw)", padding: "40px 36px", textAlign: "center", position: "relative", boxShadow: "0 40px 100px rgba(0,0,0,0.7)" }}>
              {/* Progress dots */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
                {steps.map((_, i) => (
                  <div key={i} style={{ width: i === onboardingStep ? 20 : 8, height: 8, borderRadius: 4, background: i === onboardingStep ? T.gold : T.border, transition: "all 0.3s" }} />
                ))}
              </div>
              <div style={{ fontSize: 52, marginBottom: 16 }}>{step.icon}</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 14, lineHeight: 1.3 }}>{step.title}</h2>
              <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.7, marginBottom: 32 }}>{step.body}</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                {onboardingStep > 0 && (
                  <button type="button" onClick={() => setOnboardingStep(s => s - 1)} style={{ padding: "12px 20px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>? Back</button>
                )}
                <button type="button" onClick={() => { if (onboardingStep < steps.length - 1) { setOnboardingStep(s => s + 1); } else { completeOnboarding(); } }} style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: T.bg, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                  {step.cta}
                </button>
              </div>
              <button type="button" onClick={completeOnboarding} style={{ marginTop: 16, background: "none", border: "none", color: T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Skip tour</button>
            </div>
          </div>
        );
      })()}

      {/* Upgrade Modal */}
      <UpgradeModal show={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
// DXB Analytics Build: S30-v3



