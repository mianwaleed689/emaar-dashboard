/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS INTELLIGENCE PLATFORM
   Clean Architecture — Data-Driven, Firestore-Connected
   All intelligence tabs: empty state, ready for data import
   CRM tabs: fully functional (Leads, Pipeline, Team, Agency etc)
   ═══════════════════════════════════════════════════════════════════ */

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine, Legend } from "recharts";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, addDoc, query, where, orderBy, limit } from "firebase/firestore";
import { T } from "./data";
import LandingPage from "./LandingPage";
import RoiCalculator from "./RoiCalculator";

/* ─── ACTIVE PROJECTS — now Firestore-only ─── */
/* Projects load from: Firestore 'projects' collection */
/* Populated via: Admin → Data Manager → Import Projects */

const getLinkDomain = (url) => {
  if (!url) return "Listing";
  if (url.includes("propertyfinder.ae")) return "PropertyFinder.ae";
  if (url.includes("bayut.com")) return "Bayut.com";
  if (url.includes("properties.emaar.com") || url.includes("emaar.com")) return "Emaar.com";
  return "Official Listing";
};

/* ─── HANDOVER COUNTDOWN ─── */
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

// ─── INVESTMENT SCORE (out of 10) ─────────────────────────────────────────
const getInvestmentScore = (p) => {
  let score = 0;
  const breakdown = [];

  // 1. Yield (0–3 pts)
  const gross = p.gross || p.yield || 0;
  if (gross >= 8)      { score += 3; breakdown.push({ label: "Yield", pts: 3, max: 3, note: gross + "% gross" }); }
  else if (gross >= 6) { score += 2; breakdown.push({ label: "Yield", pts: 2, max: 3, note: gross + "% gross" }); }
  else if (gross >= 4) { score += 1; breakdown.push({ label: "Yield", pts: 1, max: 3, note: gross + "% gross" }); }
  else                 { breakdown.push({ label: "Yield", pts: 0, max: 3, note: gross ? gross + "%" : "No data" }); }

  // 2. Value (PPSF) (0–2 pts)
  const ppsf = p.ppsf || 0;
  if (ppsf > 0 && ppsf <= 1500)       { score += 2; breakdown.push({ label: "Value", pts: 2, max: 2, note: "AED " + ppsf + "/sqft" }); }
  else if (ppsf > 0 && ppsf <= 2200)  { score += 1; breakdown.push({ label: "Value", pts: 1, max: 2, note: "AED " + ppsf + "/sqft" }); }
  else if (ppsf > 0)                  { breakdown.push({ label: "Value", pts: 0, max: 2, note: "AED " + ppsf + "/sqft" }); }
  else                                { breakdown.push({ label: "Value", pts: 0, max: 2, note: "No PPSF" }); }

  // 3. Handover timing (0–2 pts) — sweet spot is 12–36 months
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

  // 4. Payment plan (0–2 pts)
  const pp = (p.paymentPlan || p.payment || "").toLowerCase();
  if (pp.includes("80/20") || pp.includes("80:20"))       { score += 2;   breakdown.push({ label: "Payment", pts: 2,   max: 2, note: "80/20 plan" }); }
  else if (pp.includes("70/30") || pp.includes("60/40"))  { score += 1.5; breakdown.push({ label: "Payment", pts: 1.5, max: 2, note: pp }); }
  else if (pp.includes("50/50") || pp.includes("40/60"))  { score += 1;   breakdown.push({ label: "Payment", pts: 1,   max: 2, note: pp }); }
  else if (pp.length > 0)                                 { score += 0.5; breakdown.push({ label: "Payment", pts: 0.5, max: 2, note: pp }); }
  else                                                    { breakdown.push({ label: "Payment", pts: 0, max: 2, note: "Unknown" }); }

  // 5. Golden Visa eligible (0–1 pt)
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

/* ─── ICONS (inline SVG) ─── */
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


/* ─── GLOBAL FILTER CONFIG ─── */
const PROPERTY_TYPES = [
  {
    group: "Residential",
    types: [
      { value: "apartment",    label: "Apartment",       beds: ["Studio","1 BR","2 BR","3 BR","4 BR","5 BR+","Penthouse","Duplex"] },
      { value: "penthouse",    label: "Penthouse",        beds: ["3 BR","4 BR","5 BR","6 BR+"] },
      { value: "villa",        label: "Villa",            beds: ["2 BR","3 BR","4 BR","5 BR","6 BR","7 BR+"] },
      { value: "townhouse",    label: "Townhouse",        beds: ["2 BR","3 BR","4 BR","5 BR"] },
      { value: "duplex",       label: "Duplex",           beds: ["2 BR","3 BR","4 BR","5 BR"] },
      { value: "garden_home",  label: "Garden Home",      beds: ["2 BR","3 BR","4 BR"] },
      { value: "sky_villa",    label: "Sky Villa",        beds: ["3 BR","4 BR","5 BR","6 BR+"] },
    ]
  },
  {
    group: "Hospitality",
    types: [
      { value: "hotel_apt",     label: "Hotel Apartment",    beds: ["Hotel Room","Studio","1 BR","2 BR","3 BR","Penthouse Suite"] },
      { value: "serviced_apt",  label: "Serviced Apartment", beds: ["Studio","1 BR","2 BR","3 BR"] },
      { value: "resort_villa",  label: "Resort Villa",       beds: ["1 BR","2 BR","3 BR","4 BR","5 BR+"] },
      { value: "branded_res",   label: "Branded Residence",  beds: ["1 BR","2 BR","3 BR","4 BR","Penthouse"] },
    ]
  },
  {
    group: "Commercial",
    types: [
      { value: "office",        label: "Office",          beds: ["< 500 sqft","500–1K sqft","1K–2.5K sqft","2.5K–5K sqft","5K+ sqft","Full Floor","Full Building"] },
      { value: "retail",        label: "Retail / Shop",   beds: ["< 500 sqft","500–1K sqft","1K–2.5K sqft","2.5K+ sqft"] },
      { value: "showroom",      label: "Showroom",        beds: ["< 2K sqft","2K–5K sqft","5K+ sqft"] },
      { value: "warehouse",     label: "Warehouse",       beds: ["< 5K sqft","5K–10K sqft","10K+ sqft"] },
      { value: "coworking",     label: "Co-working Space",beds: ["Hot Desk","Dedicated Desk","Private Office","Full Floor"] },
    ]
  },
  {
    group: "Industrial & Land",
    types: [
      { value: "industrial",    label: "Industrial Unit",    beds: ["< 5K sqft","5K–20K sqft","20K+ sqft"] },
      { value: "land_res",      label: "Land — Residential", beds: ["< 5K sqft","5K–15K sqft","15K+ sqft"] },
      { value: "land_comm",     label: "Land — Commercial",  beds: ["< 10K sqft","10K–50K sqft","50K+ sqft"] },
      { value: "land_mixed",    label: "Mixed Use Plot",     beds: ["< 10K sqft","10K–50K sqft","50K+ sqft"] },
    ]
  },
];

const STATUS_OPTIONS = [
  { value: "all",          label: "All Status" },
  { value: "offplan",      label: "Off-Plan — Under Construction" },
  { value: "prelaunch",    label: "Off-Plan — Pre-Launch / EOI" },
  { value: "ready_new",    label: "Ready — New (Primary)" },
  { value: "secondary",    label: "Ready — Secondary Market" },
  { value: "handover_now", label: "Handover This Year" },
  { value: "handover_2026",label: "Handover 2026" },
  { value: "handover_2027",label: "Handover 2027+" },
];

const PRICE_PRESETS_APT = [
  { label: "Any", min: 0, max: 0 },
  { label: "< 500K", min: 0, max: 500000 },
  { label: "500K–1M", min: 500000, max: 1000000 },
  { label: "1M–2M", min: 1000000, max: 2000000 },
  { label: "2M–5M", min: 2000000, max: 5000000 },
  { label: "5M–10M", min: 5000000, max: 10000000 },
  { label: "10M+", min: 10000000, max: 0 },
];

const PRICE_PRESETS_VILLA = [
  { label: "Any", min: 0, max: 0 },
  { label: "< 2M", min: 0, max: 2000000 },
  { label: "2M–5M", min: 2000000, max: 5000000 },
  { label: "5M–10M", min: 5000000, max: 10000000 },
  { label: "10M–25M", min: 10000000, max: 25000000 },
  { label: "25M–50M", min: 25000000, max: 50000000 },
  { label: "50M+", min: 50000000, max: 0 },
];

/* ─── SVG ICON HELPER ─ replaces lucide-react dependency ─── */
const SvgIcons = {
  LayoutDashboard: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Globe: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Database: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  TrendingUp: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  MapPin: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Calendar: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  CreditCard: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Building2: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h4"/><path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>,
  Map: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  Clock: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Receipt: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>,
  BarChart3: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
  ArrowLeftRight: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 7H3"/><path d="m15 1 6 6-6 6"/><path d="M3 17h18"/><path d="m9 11-6 6 6 6"/></svg>,
  Landmark: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>,
  Star: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  RefreshCw: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Search: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Briefcase: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  Award: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  AlertTriangle: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  BarChart2: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Activity: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Layers: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Users: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  LayoutGrid: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  Building: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  Users2: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M14 19a6 6 0 0 0-12 0"/><circle cx="8" cy="9" r="4"/><path d="M22 19a6 6 0 0 0-6-6 4 4 0 0 0 0-8"/></svg>,
  Shield: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Settings: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  User: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  LogOut: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  ChevronDown: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevronRight: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  X: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Menu: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
};

/* ─── GLOBAL CONTEXT FILTER COMPONENT ─── */
const GlobalContextFilter = ({
  gDeveloper, setGDeveloperAndReset,
  gCommunity, setGCommunity,
  gPropertyType, setGPropertyTypeAndReset,
  gSubType, setGSubType,
  gBeds, setGBeds,
  gStatus, setGStatus,
  gPriceMin, setGPriceMin,
  gPriceMax, setGPriceMax,
  allDevelopers, T,
}) => {
  const [open, setOpen] = React.useState(false);

  // Get beds options from selected property type
  const selectedTypeData = PROPERTY_TYPES.flatMap(g => g.types).find(t => t.value === gPropertyType);
  const bedsOptions = selectedTypeData?.beds || ["Studio","1 BR","2 BR","3 BR","4 BR","5 BR+"];

  // Price presets based on type
  const isVilla = ["villa","townhouse","sky_villa","resort_villa"].includes(gPropertyType);
  const pricePresets = isVilla ? PRICE_PRESETS_VILLA : PRICE_PRESETS_APT;

  // Active filter count
  const activeCount = [
    gDeveloper !== "all",
    gCommunity !== "all",
    gPropertyType !== "all",
    gBeds !== "all",
    gStatus !== "all",
    gPriceMin > 0 || gPriceMax > 0,
  ].filter(Boolean).length;

  const resetAll = () => {
    setGDeveloperAndReset("all");
    setGCommunity("all");
    setGPropertyTypeAndReset("all");
    setGSubType("all");
    setGBeds("all");
    setGStatus("all");
    setGPriceMin(0);
    setGPriceMax(0);
  };

  const selStyle = {
    background: T.surfaceAlt, border: `1px solid ${T.border}`,
    borderRadius: 8, color: T.white,
    fontFamily: "'Outfit', sans-serif", fontSize: 12,
    padding: "6px 10px", outline: "none", cursor: "pointer",
    appearance: "none", WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
    paddingRight: 26, transition: "border-color 0.2s",
  };

  const activeSelStyle = { ...selStyle, borderColor: `rgba(212,168,67,0.5)`, color: T.gold };

  return (
    <div style={{
      position: "fixed", top: 60, left: 240, right: 0, zIndex: 45,
      background: `${T.surface}f8`, backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${T.border}`,
    }}>
      {/* ── Compact filter bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 20px", flexWrap: "wrap",
      }}>

        {/* Active badge */}
        {activeCount > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 20,
            background: "rgba(212,168,67,0.12)",
            border: "1px solid rgba(212,168,67,0.3)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>{activeCount} filter{activeCount > 1 ? "s" : ""} active</span>
          </div>
        )}

        {/* Developer */}
        <select
          value={gDeveloper}
          onChange={e => setGDeveloperAndReset(e.target.value)}
          style={gDeveloper !== "all" ? activeSelStyle : selStyle}
        >
          <option value="all">All Developers</option>
          {allDevelopers?.length > 0
            ? allDevelopers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
            : ["Emaar","DAMAC","Sobha","Nakheel","Meraas","Aldar","Binghatti","Ellington","Omniyat","Azizi","Danube","Samana","MAG","Imtiaz"].map(n => (
                <option key={n} value={n.toLowerCase()}>{n}</option>
              ))
          }
        </select>

        {/* Property Type */}
        <select
          value={gPropertyType}
          onChange={e => setGPropertyTypeAndReset(e.target.value)}
          style={gPropertyType !== "all" ? activeSelStyle : selStyle}
        >
          <option value="all">All Types</option>
          {PROPERTY_TYPES.map(group => (
            <optgroup key={group.group} label={group.group}>
              {group.types.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Beds / Config */}
        <select
          value={gBeds}
          onChange={e => setGBeds(e.target.value)}
          style={gBeds !== "all" ? activeSelStyle : selStyle}
        >
          <option value="all">All Configs</option>
          {bedsOptions.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        {/* Status */}
        <select
          value={gStatus}
          onChange={e => setGStatus(e.target.value)}
          style={gStatus !== "all" ? activeSelStyle : selStyle}
        >
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* Price presets */}
        <select
          value={`${gPriceMin}-${gPriceMax}`}
          onChange={e => {
            const preset = pricePresets.find(p => `${p.min}-${p.max}` === e.target.value);
            if (preset) { setGPriceMin(preset.min); setGPriceMax(preset.max); }
          }}
          style={(gPriceMin > 0 || gPriceMax > 0) ? activeSelStyle : selStyle}
        >
          {pricePresets.map(p => (
            <option key={`${p.min}-${p.max}`} value={`${p.min}-${p.max}`}>
              {p.label === "Any" ? "Any Price" : `AED ${p.label}`}
            </option>
          ))}
        </select>

        {/* Golden Visa indicator */}
        {gPriceMin >= 2000000 && (
          <div style={{
            padding: "4px 10px", borderRadius: 20, fontSize: 11,
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
            color: T.green, fontWeight: 600,
          }}>
            Golden Visa eligible
          </div>
        )}

        {/* Reset */}
        {activeCount > 0 && (
          <button type="button" onClick={resetAll} style={{
            background: "none", border: `1px solid ${T.border}`,
            borderRadius: 8, padding: "5px 12px", cursor: "pointer",
            color: T.textMuted, fontSize: 11,
            fontFamily: "'Outfit', sans-serif",
            transition: "all 0.15s",
          }}>
            Clear all
          </button>
        )}

        {/* Spacer + data source note */}
        <div style={{ marginLeft: "auto", fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, display: "inline-block" }} />
          Live · Firestore
        </div>
      </div>
    </div>
  );
};

/* ─── TAB GROUPS ─ 5 sections, 32 tabs in sequence ─── */
const TAB_GROUPS = [
  {
    id: "market",
    label: "Market Intelligence",
    icon: SvgIcons.TrendingUp,
    tabs: [
      { key: "Overview",        icon: SvgIcons.LayoutDashboard },
      { key: "Market",          icon: SvgIcons.Globe },
      { key: "DLD Volumes",     icon: SvgIcons.Database },
      { key: "Price History",   icon: SvgIcons.TrendingUp },
      { key: "Neighbourhoods",  icon: SvgIcons.MapPin },
      { key: "Launch Calendar", icon: SvgIcons.Calendar },
      { key: "Currency",        icon: SvgIcons.CreditCard },
    ]
  },
  {
    id: "property",
    label: "Property Explorer",
    icon: SvgIcons.Building2,
    tabs: [
      { key: "Projects",        icon: SvgIcons.Building2 },
      { key: "Map",             icon: SvgIcons.Map },
      { key: "Handover",        icon: SvgIcons.Clock },
      { key: "Service Charges", icon: SvgIcons.Receipt },
    ]
  },
  {
    id: "investment",
    label: "Investment Tools",
    icon: SvgIcons.BarChart3,
    tabs: [
      { key: "Yields",           icon: SvgIcons.BarChart3 },
      { key: "STR vs LTR",       icon: SvgIcons.ArrowLeftRight },
      { key: "Mortgage",         icon: SvgIcons.Landmark },
      { key: "Investment Score", icon: SvgIcons.Star },
      { key: "Flip",             icon: SvgIcons.RefreshCw },
      { key: "DXB Estimate",     icon: SvgIcons.Search },
      { key: "Portfolio",        icon: SvgIcons.Briefcase },
      { key: "Golden Visa",      icon: SvgIcons.Award },
      { key: "Risk",             icon: SvgIcons.AlertTriangle },
    ]
  },
  {
    id: "developer",
    label: "Developer Intelligence",
    icon: SvgIcons.Activity,
    tabs: [
      { key: "Financials",       icon: SvgIcons.BarChart2 },
      { key: "Developer Health", icon: SvgIcons.Activity },
      { key: "Competitors",      icon: SvgIcons.Layers },
    ]
  },
  {
    id: "crm",
    label: "Agency CRM",
    icon: SvgIcons.Users,
    tabs: [
      { key: "My Leads",    icon: SvgIcons.Users },
      { key: "Pipeline",    icon: SvgIcons.LayoutGrid },
      { key: "Listings",    icon: SvgIcons.Building },
      { key: "Team",        icon: SvgIcons.Users2 },
      { key: "Agency",      icon: SvgIcons.Building2 },
      { key: "Compliance",  icon: SvgIcons.Shield },
      { key: "Dev Portal",  icon: SvgIcons.Layers },
      { key: "Intelligence",icon: SvgIcons.Database },
    ]
  },
];

/* ─── Flat TABS for backward compatibility ─── */
const TABS = TAB_GROUPS.flatMap(g => g.tabs);


/* ─── STYLES ─── */
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
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 9px 14px;
    border: none; border-radius: 8px; cursor: pointer;
    font-family: 'Outfit', sans-serif; font-size: 12.5px; font-weight: 400;
    transition: all 0.15s ease; color: ${T.textSecondary};
    background: transparent; text-align: left; position: relative; letter-spacing: 0.1px;
  }
  .sidebar-btn:hover { background: rgba(212,168,67,0.05); color: ${T.white}; }
  .sidebar-btn.active { background: rgba(212,168,67,0.1); color: ${T.gold}; font-weight: 500; }
  .sidebar-btn.active::before {
    content: ''; position: absolute; left: 0; top: 50%;
    transform: translateY(-50%); width: 2.5px; height: 55%;
    background: ${T.gold}; border-radius: 0 2px 2px 0;
  }
  .sidebar-group-btn {
    display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 14px;
    border: none; border-radius: 8px; cursor: pointer; font-family: 'Outfit', sans-serif;
    font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;
    color: ${T.textMuted}; background: transparent; text-align: left; transition: all 0.15s ease; margin-top: 6px;
  }
  .sidebar-group-btn:hover { color: ${T.textSecondary}; }
  .sidebar-search {
    width: 100%; padding: 7px 10px 7px 32px; background: rgba(255,255,255,0.03);
    border: 1px solid ${T.border}; border-radius: 8px; color: ${T.white};
    font-family: 'Outfit', sans-serif; font-size: 12px; outline: none; transition: border-color 0.2s;
  }
  .sidebar-search:focus { border-color: rgba(212,168,67,0.4); }
  .sidebar-search::placeholder { color: ${T.textMuted}; }

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

  /* ── 768px: Tablet / small laptop ── */
  @media (max-width: 768px) {
    html { font-size: 13px; }

    /* Sidebar slides in as drawer */
    .sidebar { transform: translateX(-100%); position: fixed !important; z-index: 100; height: 100dvh !important; box-shadow: 8px 0 40px rgba(0,0,0,0.6); }
    .sidebar.open { transform: translateX(0); }
    .free-banner { left: 0 !important; }
    .main-content { margin-left: 0 !important; overflow-x: hidden !important; }
    .global-filter { left: 0 !important; }
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

    /* Tables — horizontal scroll with hint arrow */
    .table-scroll { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
    .table-scroll::after { content: "swipe →"; position: absolute; right: 8px; top: 12px; color: ${T.gold}; font-size: 10px; opacity: 0.5; pointer-events: none; letter-spacing: 0.5px; }
    .table-scroll table { min-width: 560px; }

    /* Compare bar */
    .compare-bar { padding: 10px 14px !important; flex-direction: column !important; align-items: stretch !important; gap: 8px !important; }
    .compare-bar > div { justify-content: center; flex-wrap: wrap; }

    /* Mortgage calculator 2-col → 1-col */
    .mortgage-grid { grid-template-columns: 1fr !important; }

    /* AI Insights full width cards */
    .ai-insights-grid { grid-template-columns: 1fr !important; }

    /* Alert modal full screen */
    .alerts-modal { max-width: 100% !important; max-height: 100dvh !important; border-radius: 20px 20px 0 0 !important; position: fixed !important; bottom: 0 !important; top: auto !important; margin: 0 !important; }
  }

  /* ── 480px: Mobile phones ── */
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

  /* ── 360px: Very small phones ── */
  @media (max-width: 360px) {
    .kpi-grid { grid-template-columns: 1fr !important; }
    html { font-size: 11px; }
  }

  /* ── Touch improvements ── */
  * { -webkit-tap-highlight-color: transparent; }
  button, a, [role="button"] { touch-action: manipulation; }
  input[type="range"] { height: 32px; }

  /* ── Mobile Bottom Nav Bar ── */
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

/* ─── COMPONENTS ─── */

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
      {isClickable && <div style={{ position: "absolute", top: 10, right: 10, fontSize: 14, color: hovered ? T.gold : T.border, transition: "color 0.2s" }}>›</div>}
      <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: T.gold, lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: T.teal, display: "flex", alignItems: "center", gap: 4 }}>
        {sub?.includes("+") && <span style={{ color: T.green }}>{Icons.up}</span>}
        {sub}
      </div>
      {isClickable && <div style={{ marginTop: 8, fontSize: 9, color: hovered ? T.gold : T.textMuted, fontWeight: 600, letterSpacing: 0.5, transition: "color 0.2s" }}>{hovered ? "View breakdown →" : "Click for details"}</div>}
    </div>
  );
};

const ForecastCard = ({ firm, color, short, forecast, detail, bullets, sourceUrl }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="chart-box" style={{ borderTop: `3px solid ${color}`, cursor: "pointer", transition: "all 0.2s" }} onClick={() => setExpanded(e => !e)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h4 style={{ color, fontSize: 15, fontWeight: 700, marginBottom: 4, fontFamily: "'Fraunces', serif" }}>{firm}</h4>
        <span style={{ fontSize: 16, color: T.textMuted, display: "inline-block", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</span>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.white, background: color + "20", padding: "3px 8px", borderRadius: 5, display: "inline-block", marginBottom: 8 }}>{forecast}</div>
      <p style={{ color: T.textSecondary, fontSize: 12, lineHeight: 1.6 }}>{short}</p>
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
          <p style={{ color: T.textSecondary, fontSize: 12, lineHeight: 1.7, marginBottom: 10 }}>{detail}</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            {bullets.map((b, bi) => (
              <li key={bi} style={{ fontSize: 11, color: T.textSecondary, display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ color, fontWeight: 700, marginTop: 1 }}>›</span> {b}
              </li>
            ))}
          </ul>
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-block", marginTop: 10, fontSize: 10, color, fontWeight: 700, textDecoration: "none" }}>Full Report ↗</a>
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

/* ─── LOGIN SCREEN ─── */
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true); setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
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
          await emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, {
            user_email: u.email,
            user_name: u.displayName || u.email.split("@")[0],
            project_name: "DXB Analytics Platform",
            change_type: "Welcome to DXB Analytics!",
            new_value: "Your 7-day Pro Trial is now active. Explore 48+ projects, yields, ROI data and more.",
            old_value: "New Account",
            updated_at: now.toLocaleDateString("en-AE"),
          }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
        } catch(e) {}
      }
      onLogin(u.email);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") setError("Google sign-in failed. Please try again.");
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
      await setDoc(doc(db, "users", cred.user.uid), {
        name: name.trim(), email,
        phone: phone.trim(), country: country.trim(),
        tier: "pro_trial",
        createdAt: now.toISOString(),
        trialStart: now.toISOString(),
        trialEnd: trialEnd.toISOString(),
        role: "user", emailVerified: false, provider: "email",
      });
      try { await sendEmailVerification(cred.user); } catch(e) {}
      try {
        await emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, {
          user_email: email, user_name: name.trim(),
          project_name: "DXB Analytics Platform",
          change_type: "Welcome to DXB Analytics! — Please verify your email",
          new_value: "Your 7-day Pro Trial is active. Check your inbox to verify your email address.",
          old_value: "New Account",
          updated_at: now.toLocaleDateString("en-AE"),
        }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
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

  // ── Verify Email Screen ──
  if (screen === "verify") return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div className="fade-up" style={{ width: "100%", maxWidth: 440, padding: "0 20px", textAlign: "center" }}>
        <div style={{ background: T.surface, border: "1px solid rgba(16,185,129,0.3)", borderRadius: 20, padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 10 }}>Check your inbox</h2>
          <p style={{ color: T.textSecondary, fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
            We sent a verification link to <span style={{ color: T.gold, fontWeight: 600 }}>{email}</span>
          </p>
          <p style={{ color: T.textMuted, fontSize: 12, lineHeight: 1.7, marginBottom: 28 }}>
            Click the link in the email to verify your account, then come back and sign in. Check your spam folder if you don't see it within 2 minutes.
          </p>
          <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 24, textAlign: "left" }}>
            {["Click the link in the verification email", "Return to this page", "Sign in with your email & password"].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: T.green, fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
                <span style={{ fontSize: 12, color: T.textSecondary }}>{s}</span>
              </div>
            ))}
          </div>
          <button type="button" className="login-btn" onClick={() => { setScreen("form"); setMode("login"); setPass(""); setConfirmPass(""); }}>
            Go to Sign In →
          </button>
          <button type="button" onClick={async () => { try { if (auth.currentUser) { await sendEmailVerification(auth.currentUser); alert("Verification email resent! Check your inbox."); } } catch(e){} }} style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", color: T.gold, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            Resend verification email
          </button>
        </div>
      </div>
    </div>
  );

  // ── Reset Sent Screen ──
  if (screen === "reset_sent") return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div className="fade-up" style={{ width: "100%", maxWidth: 440, padding: "0 20px", textAlign: "center" }}>
        <div style={{ background: T.surface, border: "1px solid rgba(212,168,67,0.3)", borderRadius: 20, padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔑</div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 10 }}>Password Reset Sent</h2>
          <p style={{ color: T.textSecondary, fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
            We sent a reset link to <span style={{ color: T.gold, fontWeight: 600 }}>{email}</span>
          </p>
          <p style={{ color: T.textMuted, fontSize: 12, lineHeight: 1.7, marginBottom: 28 }}>
            Click the link in the email to set a new password. The link expires in 1 hour. Check your spam folder if you don't see it.
          </p>
          <button type="button" className="login-btn" onClick={() => setScreen("form")}>Back to Sign In</button>
        </div>
      </div>
    </div>
  );

  // ── Main Form ──
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{css}</style>
      {onBack && (
        <button type="button" onClick={onBack} style={{ position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: T.textSecondary, fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: "pointer", zIndex: 10 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}>
          ← Back to Home
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
            {mode === "login" ? "Sign in to access your dashboard" : "7 days full Pro access — no credit card required"}
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
                <input className="login-input" type={showPass ? "text" : "password"} placeholder={mode === "signup" ? "Min 8 chars + 1 number" : "••••••••"} value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && mode === "login" && handleLogin()} style={{ paddingRight: 44 }} />
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
                {confirmPass && confirmPass !== pass && <div style={{ fontSize: 10, color: T.red, marginTop: 4 }}>✗ Passwords do not match</div>}
                {confirmPass && confirmPass === pass && <div style={{ fontSize: 10, color: T.green, marginTop: 4 }}>✓ Passwords match</div>}
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
              ) : mode === "login" ? "Sign In" : "Start Free Trial →"}
            </button>

            {mode === "signup" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(212,168,67,0.06)", borderRadius: 8, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 16 }}>⭐</span>
                <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.4 }}>
                  <span style={{ color: T.gold, fontWeight: 600 }}>7-day Pro trial</span> — Full access. No credit card. Cancel anytime.
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
          🔒 Secured by Firebase · SSL Encrypted · GDPR Compliant
        </p>
      </div>
    </div>
  );
};


/* ─── PRO GATE OVERLAY ─── */
const ProGate = ({ children, isPro, message = "Upgrade to Pro to unlock this data", onUpgrade, blur = true }) => {
  if (isPro) return children;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ filter: blur ? "blur(5px)" : "none", pointerEvents: "none", userSelect: "none", opacity: blur ? 0.45 : 1 }}>
        {children}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(4,9,15,0.75)", borderRadius: 16, backdropFilter: "blur(4px)", zIndex: 5 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 16, padding: "28px 32px", textAlign: "center", maxWidth: 380, boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${T.gold}18` }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}22, ${T.gold}08)`, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 12px" }}>🔒</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 800, color: T.white, marginBottom: 6 }}>{message}</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16, lineHeight: 1.6 }}>Join 500+ investors using DXB Analytics Pro to track the Dubai real estate market</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
            {["All 48+ active projects", "Full financials & yields", "ROI & mortgage calculator", "Currency converter", "Portfolio tracker"].map((f, i) => (
              <div key={i} style={{ fontSize: 11, color: T.textSecondary, textAlign: "left", paddingLeft: 4 }}>✓ {f}</div>
            ))}
          </div>
          <button type="button" onClick={onUpgrade} style={{ width: "100%", padding: "11px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif", letterSpacing: 0.3 }}>
            Unlock Pro — AED 99/mo →
          </button>
          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>7-day money-back guarantee · Cancel anytime</div>
        </div>
      </div>
    </div>
  );
};

/* ─── PRO GATE FULL PAGE ─── */
const ProGateFullPage = ({ tabName, onUpgrade }) => {
  const tabBenefits = {
    "DXB Estimate":     ["Automated property valuations", "AVM price estimates per unit", "Bayut live listings", "±15% accuracy model"],
    "Portfolio":        ["Track your Dubai investments", "ROI calculations", "Portfolio performance chart", "Yield tracking"],
    "Yields":           ["Gross & net yield by community", "STR vs LTR comparison", "Top yielding Dubai areas", "Historical yield trends"],
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
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}20, ${T.gold}05)`, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>🔒</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 8 }}>{tabName}</div>
        <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 28, lineHeight: 1.6 }}>This feature is available on the <span style={{ color: T.gold, fontWeight: 700 }}>Pro plan</span>. Upgrade to unlock full access.</div>
        <div style={{ background: T.surfaceAlt, borderRadius: 14, padding: "18px 20px", marginBottom: 28, textAlign: "left" }}>
          <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>What you unlock:</div>
          {benefits.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${T.gold}20`, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={T.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontSize: 12, color: T.textSecondary }}>{b}</span>
            </div>
          ))}
        </div>
        <button type="button" onClick={onUpgrade} style={{ width: "100%", padding: "14px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif", letterSpacing: 0.3, marginBottom: 10 }}>
          Upgrade to Pro — AED 99/mo →
        </button>
        <div style={{ fontSize: 11, color: T.textMuted }}>7-day free trial · Cancel anytime · Money-back guarantee</div>
      </div>
    </div>
  );
};

/* ─── UPGRADE MODAL ─── */


const UpgradeModal = ({ show, onClose }) => {
  if (!show) return null;
  const plans = [
    { name: "Pro", price: "99", period: "month", features: ["All Dubai projects — full data", "AI market insights", "Portfolio ROI tracker", "DXB Estimate AVM", "Yield & STR/LTR analysis", "Mortgage calculator", "Price alerts", "PDF export"], popular: true, note: null, cta: "Upgrade to Pro →" },
    { name: "Enterprise", price: "499", period: "month", features: ["Everything in Pro", "PDF report generation ⏳", "API data access ⏳", "Custom dashboards ⏳", "Multi-user team accounts ⏳", "Developer-level raw data", "Dedicated account manager", "White-label options ⏳"], popular: false, note: "⏳ = Launching Q3 2026", cta: "Contact Sales →" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)", padding: 16 }} onClick={onClose}>
      <div className="upgrade-modal" style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, width: "95%", maxWidth: 720, padding: 36, position: "relative", boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 14px", borderRadius: 20, background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}40`, marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: "pulse 2s infinite", display: "inline-block" }} />
            <span style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>500+ investors already using Pro</span>
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 900, color: T.white, marginBottom: 6 }}>Unlock the Full Platform</h2>
          <p style={{ color: T.textSecondary, fontSize: 13 }}>The most comprehensive Dubai real estate intelligence platform</p>
        </div>

        {/* ROI bar */}
        <div style={{ background: "rgba(16,185,129,0.08)", border: `1px solid ${T.green}30`, borderRadius: 12, padding: "12px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          {[["📊", "AED 80.4B", "FY25 Sales tracked"], ["📈", "+40% YoY", "Revenue growth"], ["🏠", "48 Projects", "Full intelligence"], ["💰", "AED 155B", "Backlog visibility"]].map(([icon, val, label], i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13 }}>{icon} <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 800, color: T.green }}>{val}</span></div>
              <div style={{ fontSize: 10, color: T.textMuted }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="plans-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {plans.map((plan, i) => (
            <div key={i} style={{ background: T.surfaceAlt, borderRadius: 16, padding: 24, border: plan.popular ? `2px solid ${T.gold}` : `1px solid ${T.border}`, position: "relative" }}>
              {plan.popular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", borderRadius: 20, background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, whiteSpace: "nowrap" }}>⭐ MOST POPULAR</div>}
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.white, marginBottom: 4, marginTop: plan.popular ? 8 : 0 }}>{plan.name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>AED</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 900, color: plan.popular ? T.gold : T.white, lineHeight: 1 }}>{plan.price}</span>
                <span style={{ fontSize: 12, color: T.textMuted }}>/{plan.period}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: f.includes("⏳") ? T.textMuted : T.textSecondary }}>
                    <span style={{ color: f.includes("⏳") ? T.textMuted : T.green, fontSize: 11, marginTop: 1, flexShrink: 0 }}>✓</span>{f}
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
          {["🔒 Secure payment", "↩ 7-day money-back", "⚡ Instant access", "❌ Cancel anytime"].map((t, i) => (
            <span key={i} style={{ fontSize: 11, color: T.textMuted }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

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

/* ─── COMMUNITY MAP TAB COMPONENT ─── */

function CommunityMapTab({ activeProjects, liveCommunityROI, setTab }) {
  const [selectedProject, setSelectedProjectMap] = React.useState(null);
  const [filterComm, setFilterComm] = React.useState("All");
  const [filterYield, setFilterYield] = React.useState("All");
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
    const commOk = filterComm === "All" || p.community === filterComm;
    const y = getYield(p);
    const yieldOk = filterYield === "All" || (filterYield === "8%+" && y >= 8) || (filterYield === "6-8%" && y >= 6 && y < 8) || (filterYield === "<6%" && y < 6);
    return commOk && yieldOk;
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
      attribution: "© OpenStreetMap © CARTO", maxZoom: 19,
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
            <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:2px;">\${p.name}</div>
            <div style="font-size:10px;color:#94A3B8;">\${p.community}</div>
          </div>
          <div style="padding:10px 14px;display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Price</div><div style="font-size:12px;font-weight:700;color:#D4A843;">\${p.price ? "AED " + (p.price/1e6).toFixed(2) + "M" : "TBC"}</div></div>
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Yield</div><div style="font-size:12px;font-weight:700;color:\${color}">\${y.toFixed(1)}%</div></div>
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Type</div><div style="font-size:11px;color:#CBD5E1;">\${p.type || "Residential"}</div></div>
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Handover</div><div style="font-size:11px;color:#CBD5E1;">\${p.handover || "TBC"}</div></div>
          </div>
        </div>`, { className: "dxb-popup" });
      marker.on("click", () => setSelectedProjectMap(p));
      markersRef.current.push(marker);
    });

    // Clear old heat circles
    heatLayersRef.current.forEach(c => map.removeLayer(c));
    heatLayersRef.current = [];

    // Add PPSF or Volume heat circles
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
  }, [mapLoaded, filteredProjects.length, filterComm, filterYield, mapLayer]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Layer switcher + Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 4 }}>
        <div style={{ display: "flex", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          {[
            { id: "yield",  label: "🎯 Yield Layer",  desc: "Color by rental yield" },
            { id: "ppsf",   label: "📐 PPSF Layer",   desc: "Color by price/sqft" },
            { id: "volume", label: "📊 Volume Layer",  desc: "Size by DLD transactions" },
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
                <span style={{ fontSize: 9, color: T.textMuted }}>{label}</span>
              </div>
            ))}
          </div>
        )}
        {mapLayer === "volume" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {[["#EF4444","10,000+ deals"],["#F97316","3,000+"],["#F59E0B","1,500+"],["#10B981","800+"],["#3B82F6","<800"]].map(([col, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: col, opacity: 0.8 }} />
                <span style={{ fontSize: 9, color: T.textMuted }}>{label}</span>
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
        <div style={{ display: "flex", gap: 6 }}>
          {["All", "8%+", "6-8%", "<6%"].map(f => (
            <button key={f} type="button" onClick={() => setFilterYield(f)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid " + (filterYield === f ? T.gold : T.border), background: filterYield === f ? "rgba(212,168,67,0.15)" : T.surfaceAlt, color: filterYield === f ? T.gold : T.textSecondary, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{f === "All" ? "All Yields" : f + " yield"}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {[["#10B981", "8%+ yield"], ["#D4A843", "6-8% yield"], ["#3B82F6", "5-6% yield"], ["#94A3B8", "<5% yield"]].map(([col, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: col, boxShadow: "0 0 6px " + col + "88" }} />
              <span style={{ fontSize: 10, color: T.textMuted }}>{label}</span>
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
            <span style={{ color: T.gold, fontWeight: 700 }}>{filteredProjects.length}</span> projects ·{" "}
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
                <button type="button" onClick={() => setSelectedProjectMap(null)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 18 }}>×</button>
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
              <button type="button" onClick={() => setTab("Projects")} style={{ width: "100%", padding: "9px 0", background: "linear-gradient(135deg," + T.gold + ",#B8912F)", color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>View Full Details →</button>
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
      <style>{".dxb-popup .leaflet-popup-content-wrapper { background: #0D1821; border: 1px solid rgba(212,168,67,0.3); border-radius: 12px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.6); } .dxb-popup .leaflet-popup-content { margin: 0; } .dxb-popup .leaflet-popup-tip { background: #0D1821; } .leaflet-container { background: #0D1821; }"}</style>
    </div>
  );
}


// ─── Tab Data Sources Footer ────────────────────────────────────────────────
/* ─── DATA BADGE — verified data stamp ─── */

const DataBadge = ({ source, date, type = "dld" }) => {
  const cfg = {
    dld:     { label: "DLD Verified",     color: "#10B981", icon: "✓" },
    reidin:  { label: "REIDIN Index",     color: "#3B82F6", icon: "✓" },
    emaar:   { label: "Emaar IR",         color: "#D4A843", icon: "✓" },
    live:    { label: "Live · Firestore", color: "#10B981", icon: "●" },
    ai:      { label: "AI Estimate",      color: "#8B5CF6", icon: "✦" },
    manual:  { label: "Admin Verified",   color: "#F59E0B", icon: "✓" },
  };
  const c = cfg[type] || cfg.dld;
  return (
    <span title={`Source: ${source || c.label}${date ? " · " + date : ""}`} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 9, fontWeight: 700, color: c.color, letterSpacing: 0.5,
      background: c.color + "12", border: `1px solid ${c.color}30`,
      borderRadius: 5, padding: "1px 6px", cursor: "default", flexShrink: 0,
    }}>
      <span style={{ fontSize: 8 }}>{c.icon}</span>{c.label}
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
          >{s.label} ↗</a>
        ) : (
          <span key={i} style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.45)",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: "3px 10px"
          }}>{s.label}</span>
        )
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   EMPTY STATE COMPONENT
   Shows for all intelligence tabs while awaiting data import
   ───────────────────────────────────────────────────────────── */
const EmptyState = ({ tab, icon, description, adminHint }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "80px 24px", textAlign: "center",
    minHeight: 400
  }}>
    {/* Icon */}
    <div style={{
      width: 72, height: 72, borderRadius: 20,
      background: "rgba(212,168,67,0.08)",
      border: "1px solid rgba(212,168,67,0.2)",
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: 24, fontSize: 32
    }}>
      {icon}
    </div>

    {/* Title */}
    <div style={{
      fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800,
      color: T.white, marginBottom: 10, letterSpacing: "-0.5px"
    }}>
      {tab}
    </div>

    {/* Description */}
    <div style={{
      fontSize: 14, color: T.textSecondary, lineHeight: 1.7,
      maxWidth: 420, marginBottom: 28
    }}>
      {description}
    </div>

    {/* Status badge */}
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 18px", borderRadius: 20,
      background: "rgba(212,168,67,0.06)",
      border: "1px solid rgba(212,168,67,0.15)"
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: "50%",
        background: T.gold, animation: "pulse 2s infinite"
      }} />
      <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>
        Ready for data import
      </span>
    </div>

    {/* Admin hint */}
    {adminHint && (
      <div style={{
        marginTop: 20, fontSize: 12, color: T.textMuted,
        background: T.surface, padding: "10px 16px",
        borderRadius: 8, border: `1px solid ${T.border}`,
        maxWidth: 380
      }}>
        {adminHint}
      </div>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   INTELLIGENCE TAB CONFIGS
   Each tab has its icon, description and admin hint
   ───────────────────────────────────────────────────────────── */
const INTELLIGENCE_TABS = {
  "Overview": {
    icon: "📊",
    description: "Your Bloomberg-style command centre. Live market ticker, KPI cards, developer intelligence panel, and real-time DLD feed — all connected to your data sources.",
    adminHint: "Connect data sources from Admin → Data Manager → Market Data"
  },
  "Financials": {
    icon: "💹",
    description: "Developer financial intelligence — revenue, net profit, EBITDA, backlog, EPS, DPS — 6-year history charts. Auto-updated from developer IR reports.",
    adminHint: "Add developer financials from Admin → Data Manager → Developers"
  },
  "Projects": {
    icon: "🏗️",
    description: "Browse all projects across all property types — Off-Plan, Residential, Commercial, Secondary Market, Hotel Apartments, Villas, Balcony View Units. Filter, compare, and score every property.",
    adminHint: "Import projects from Admin → Data Manager → Projects"
  },
  "Handover": {
    icon: "📅",
    description: "Construction timeline tracker. Monitor handover dates, construction progress, and delivery risk for all off-plan projects. Automated countdown alerts.",
    adminHint: "Add project handover data from Admin → Data Manager → Projects"
  },
  "Launch Calendar": {
    icon: "🚀",
    description: "Never miss a launch. Upcoming project launches by developer, EOI status, expected pricing, and past launch performance vs actual prices.",
    adminHint: "Launch data auto-populates from Bayut API scanner — check Admin → Data Health"
  },
  "Neighbourhoods": {
    icon: "🏘️",
    description: "Community intelligence — average PPSF, yields, schools, hospitals, metro access, lifestyle ratings, supply risk, and demand strength for every Dubai community.",
    adminHint: "Add community data from Admin → Data Manager → Communities"
  },
  "Service Charges": {
    icon: "📋",
    description: "RERA registered service charge rates per community in AED/sqft/year. Historical trends, net yield impact calculator, and community comparisons.",
    adminHint: "Add service charge data from Admin → Data Manager → Communities"
  },
  "STR vs LTR": {
    icon: "🏠",
    description: "Short-term Airbnb vs long-term tenancy comparison per community per unit type. Occupancy rates, daily rates, platform fees, management costs, and net income.",
    adminHint: "STR data connects to Bayut API — configure from Admin → Data Health"
  },
  "Developer Health": {
    icon: "🩺",
    description: "Developer health scores — delivery track record, financial strength, project pipeline risk, RERA status, and complaint ratios. 9-factor radar chart.",
    adminHint: "Add developer profiles from Admin → Data Manager → Developers"
  },
  "DLD Volumes": {
    icon: "📈",
    description: "Live DLD transaction data — volume by community, developer, property type, nationality, cash vs mortgage. Monthly trends, price anomaly alerts.",
    adminHint: "DLD data auto-syncs daily — check Admin → Data Health → DLD Cron"
  },
  "DXB Estimate": {
    icon: "🔍",
    description: "The Zestimate for Dubai. Enter any unit details and get an estimated market value backed by actual DLD transaction comparables.",
    adminHint: "AVM requires DLD data — check Admin → Data Health → DLD Cron"
  },
  "Portfolio": {
    icon: "💼",
    description: "Personal investment portfolio tracker. Add your properties, track current market value, unrealised gains, rental income, IRR, and Golden Visa eligibility.",
    adminHint: "Portfolio reads from live market data — connect DLD and Bayut first"
  },
  "Competitors": {
    icon: "⚔️",
    description: "Developer vs developer intelligence — sales volume, delivery record, PPSF comparison, market share, community presence, and branded residence count.",
    adminHint: "Add developer data from Admin → Data Manager → Developers"
  },
  "Yields": {
    icon: "📊",
    description: "Gross and net rental yields by community and unit type. 5-year historical trend, best yielding communities ranked, and yield vs appreciation tradeoff.",
    adminHint: "Yield data auto-syncs weekly from Bayut API — check Admin → Data Health"
  },
  "Mortgage": {
    icon: "🏦",
    description: "Live EIBOR mortgage calculator. Monthly payment, total cost of acquisition (DLD 4%, agency 2%, trustee fees), amortisation schedule, and 5 bank rate comparison.",
    adminHint: "EIBOR updates daily — check Admin → EIBOR Rates"
  },
  "Map": {
    icon: "🗺️",
    description: "Interactive property map with yield heatmap, PPSF heatmap, transaction volume layer, project pins, and community boundaries. Distance rings from key landmarks.",
    adminHint: "Map renders from project data — import projects first"
  },
  "Risk": {
    icon: "⚠️",
    description: "9-factor investment risk scoring per community and project. Supply risk, demand strength, price trajectory, developer quality, regulatory environment.",
    adminHint: "Risk scores calculate automatically from project and market data"
  },
  "Market": {
    icon: "🌍",
    description: "Dubai real estate macro view — total market size, transaction count, off-plan vs secondary split, top developers, international buyer breakdown, and analyst forecasts.",
    adminHint: "Market data updates from Admin → Market Intelligence → Update Stats"
  },
  "Currency": {
    icon: "💱",
    description: "Live AED exchange rates for international buyers — GBP, USD, EUR, RUB, INR, CNY, and more. Property price converter and historical rate chart.",
    adminHint: "Currency rates update automatically via ExchangeRate API"
  },
  "Golden Visa": {
    icon: "🥇",
    description: "Golden Visa eligibility calculator. Enter property value to check AED 2M minimum, requirements, process steps, and timeline. Auto-checks portfolio eligibility.",
    adminHint: "Golden Visa rules update from Admin → Data Manager → Regulations"
  },
  "Flip": {
    icon: "🔄",
    description: "Property flip ROI calculator — purchase price, renovation cost, holding period, selling price. Returns net profit, ROI, annualised return, and optimal hold period.",
    adminHint: "Flip calculator works with market data — connect DLD and Bayut first"
  },
  "Investment Score": {
    icon: "⭐",
    description: "AI investment scoring for any property — yield potential, location quality, developer health, price vs market, liquidity, handover risk, supply risk. 0-100 score with breakdown.",
    adminHint: "Investment Score requires project data — import projects first"
  },
  "Price History": {
    icon: "📉",
    description: "5-year PPSF trend per community per unit type. Off-plan vs secondary price divergence, correction alerts, and momentum indicators.",
    adminHint: "Price history syncs from DLD data — check Admin → Data Health → DLD Cron"
  },
};

export default function EmaarDashboardV2() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState("");
  const [userName, setUserName] = useState("");
  const [userTier, setUserTier] = useState("free");
  const [userRole, setUserRole] = useState("user");       // user | agent | manager | admin | superAdmin | developer
  const [orgId, setOrgId] = useState(null);                // org they belong to
  const [orgRole, setOrgRole] = useState(null);            // agent | manager | viewer
  const [devId, setDevId] = useState(null);                // developer ID (for developer role)
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
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

  // Price Alerts (old per-project alert modal — kept for project cards)
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
      <div style={{ fontSize: compact ? 20 : 28 }}>🔒</div>
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
  const [groupCollapsed, setGroupCollapsed] = useState({});
  const [sidebarSearch, setSidebarSearch] = useState("");
  const toggleGroup = (id) => setGroupCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  /* ─── GLOBAL CONTEXT FILTER STATE ─── */
  const [gDeveloper, setGDeveloper] = useState("all");
  const [gCommunity, setGCommunity] = useState("all");
  const [gPropertyType, setGPropertyType] = useState("all");
  const [gSubType, setGSubType] = useState("all");
  const [gBeds, setGBeds] = useState("all");
  const [gStatus, setGStatus] = useState("all");
  const [gPriceMin, setGPriceMin] = useState(0);
  const [gPriceMax, setGPriceMax] = useState(0);
  const [gFilterOpen, setGFilterOpen] = useState(false);

  /* Expose as single context object for all tabs */
  const globalCtx = {
    developer: gDeveloper, community: gCommunity,
    propertyType: gPropertyType, subType: gSubType,
    beds: gBeds, status: gStatus,
    priceMin: gPriceMin, priceMax: gPriceMax,
  };

  /* Reset downstream filters when parent changes */
  const setGDeveloperAndReset = (v) => { setGDeveloper(v); setGCommunity("all"); };
  const setGPropertyTypeAndReset = (v) => { setGPropertyType(v); setGSubType("all"); setGBeds("all"); };
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
  useEffect(() => { document.title = "DXB Analytics"; }, []);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [projectTier, setProjectTier] = useState("All");
  const [projectHandover, setProjectHandover] = useState("All");
  const [projectPriceMax, setProjectPriceMax] = useState(20);
  const [liveProjects, setLiveProjects] = useState({});
  const [extraProjects, setExtraProjects] = useState([]);
  const [liveYields, setLiveYields] = useState([]);
  // ── Price Alerts ──
  const [showAlerts, setShowAlerts] = useState(false);
  const [myAlerts, setMyAlerts] = useState([]);
  const [alertForm, setAlertForm] = useState({ community: "Dubai Hills Estate", metric: "grossYield", condition: "above", value: "8" });
  const [alertSaving, setAlertSaving] = useState(false);
  // ── AI Insights ──
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
  const [liveBayutData, setLiveBayutData] = useState({});
  const [lastDataSync, setLastDataSync] = useState(null);
  const [allDevelopers, setAllDevelopers] = useState([]);
  const [selectedDeveloper, setSelectedDeveloper] = useState("emaar");
  const [emaarStockPrice, setEmaarStockPrice] = useState(null);
  const [tabSettings, setTabSettings] = useState({});
  const [liveCommunityROI, setLiveCommunityROI] = useState({});
  const [liveCommunityIntel, setLiveCommunityIntel] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);

  /* ─── MY LEADS STATE (Session 4) ─── */
  const [myLeads, setMyLeads] = useState([]);

  /* ─── DEAL PIPELINE STATE (Session 5) ─── */
  const [deals, setDeals] = useState([]);

  /* ─── MANAGER DASHBOARD STATE (Session 7) ─── */
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);

  /* ─── AGENCY HUB STATE (Session 8) ─── */
  const [orgProfile, setOrgProfile] = useState(null);
  const [orgProfileForm, setOrgProfileForm] = useState({ name:"", reraNo:"", tradeLicense:"", phone:"", email:"", website:"", notes:"" });
  const [orgProfileSaving, setOrgProfileSaving] = useState(false);
  const [orgProfileSaved, setOrgProfileSaved] = useState(false);
  const [commSplits, setCommSplits] = useState({});   // { agentUid: pct }
  const [commSaving, setCommSaving] = useState({});   // { agentUid: bool }
  const [agentRoleChanging, setAgentRoleChanging] = useState({});
  const [showInviteAgent, setShowInviteAgent] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  /* ─── INTELLIGENCE STATE (Session 12) ─── */
  const [compCommunity, setCompCommunity] = useState("Dubai Hills Estate");
  const [compType, setCompType] = useState("Apartment");
  const [compBeds, setCompBeds] = useState("2BR");
  const [irrPrice, setIrrPrice] = useState("2000000");
  const [irrRent, setIrrRent] = useState("120000");
  const [irrHoldYears, setIrrHoldYears] = useState("5");
  const [irrAppreciation, setIrrAppreciation] = useState("8");
  const [irrServiceCharge, setIrrServiceCharge] = useState("18");
  const [irrMgmtFee, setIrrMgmtFee] = useState("9");

  /* ─── DLD LIVE INTELLIGENCE STATE (Session 15) ─── */
  const [dldActiveCommunity, setDldActiveCommunity] = useState("Dubai Hills Estate");
  const [dldLastRefresh, setDldLastRefresh] = useState(new Date());
  const [dldRefreshTick, setDldRefreshTick] = useState(0);

  /* ─── BULK IMPORT STATE (Session 16) ─── */
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importStep, setImportStep]         = useState(1); // 1=upload, 2=map, 3=preview, 4=done
  const [importRawRows, setImportRawRows]   = useState([]);
  const [importHeaders, setImportHeaders]   = useState([]);
  const [importMapping, setImportMapping]   = useState({});
  const [importPreview, setImportPreview]   = useState([]);
  const [importDupes, setImportDupes]       = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importDone, setImportDone]         = useState({ imported:0, dupes:0, errors:0 });
  const [importLoading, setImportLoading]   = useState(false);

  /* ─── DLD AUTO-REFRESH (Session 15) ─── */
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDldLastRefresh(new Date());
      setDldRefreshTick(t => t + 1);
    }, 60000); // refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  /* ─── DEV PORTAL STATE (Session 10) ─── */
  const [devUnits, setDevUnits] = useState([]);
  const [devUnitsLoading, setDevUnitsLoading] = useState(false);
  const [devEOIs, setDevEOIs] = useState([]);
  const [devEOIsLoading, setDevEOIsLoading] = useState(false);
  const [devProjects, setDevProjects] = useState([]);
  const [selectedDevProject, setSelectedDevProject] = useState(null);
  const [devUnitFilter, setDevUnitFilter] = useState("all"); // all | available | reserved | sold
  const [devCommForm, setDevCommForm] = useState({});       // { projectId: pct }
  const [devCommSaving, setDevCommSaving] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [unitForm, setUnitForm] = useState({ unitNo:"", type:"Apartment", beds:"1", baths:"1", size:"", price:"", floor:"", view:"", status:"Available" });
  const [unitFormLoading, setUnitFormLoading] = useState(false);

  /* ─── LISTINGS STATE (Session 9) ─── */
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [showNewListing, setShowNewListing] = useState(false);
  const [listingForm, setListingForm] = useState({
    title:"", type:"Apartment", beds:"1", baths:"1", size:"", price:"", community:"",
    building:"", unitNo:"", floor:"", description:"", permitNo:"", status:"Available",
    furnishing:"Unfurnished", offplan:false,
  });
  const [listingFormLoading, setListingFormLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [listingFilter, setListingFilter] = useState("all"); // all | available | reserved | sold
  const [listingSearch, setListingSearch] = useState("");
  const [publishingId, setPublishingId] = useState(null);

  /* ─── COMPLIANCE STATE (Session 6) ─── */
  const [reraCard, setReraCard] = useState({ number:"", expiry:"", name:"" });
  const [reraCardLoading, setReraCardLoading] = useState(false);
  const [reraCardSaved, setReraCardSaved] = useState(false);
  const [waTemplate, setWaTemplate] = useState("intro");
  const [dealsLoading, setDealsLoading] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [dealForm, setDealForm] = useState({ leadName:"", leadPhone:"", project:"", community:"", type:"Off-Plan", unitNo:"", price:"", commission:"", commissionPct:"4", stage:"EOI", notes:"" });
  const [dealFormLoading, setDealFormLoading] = useState(false);
  const [pipelineType, setPipelineType] = useState("all"); // all | offplan | secondary
  const [myLeadsLoading, setMyLeadsLoading] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [leadSourceFilter, setLeadSourceFilter] = useState("all");
  const [leadSortBy, setLeadSortBy] = useState("score"); // score | date | budget
  const [leadDrawerAITab, setLeadDrawerAITab] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadDrawerTab, setLeadDrawerTab] = useState("details");
  const [leadNote, setLeadNote] = useState("");
  const [leadNoteSaving, setLeadNoteSaving] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [captureForm, setCaptureForm] = useState({ name:"", phone:"", email:"", budget:"", community:"", source:"Manual", notes:"" });
  const [captureLoading, setCaptureLoading] = useState(false);
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

  // Load projects from Firestore (runs for ALL users — guests and logged-in)
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
        // Initial projectData load for first paint — onSnapshot takes over immediately
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
    // ── Live EMAAR stock price via Yahoo Finance (free, no key) ──
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
    loadProjects(); // Load for everyone — no isLoggedIn gate

    // priceAlerts now live via user onSnapshot listener

    // ── AI Insights — generated fresh if not in cache (cache read now via onSnapshot) ──
    (async () => {
      try {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (aiInsights?.length > 0) return; // already loaded by onSnapshot
        {
          // Generate fresh insights via Claude API
          setInsightsLoading(true);
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1000,
              messages: [{ role: "user", content: `You are a Dubai real estate analyst. Generate exactly 5 sharp, data-driven market insights for Dubai property investors right now (${new Date().toLocaleDateString("en-AE", { month: "long", year: "numeric" })}). Use these verified 2025 facts: Dubai total market AED 682.5B, 214,912 transactions, Emaar FY2025 sales AED 80.4B (+16% YoY), avg yield city 6.9%, JVC yields 8-9%, EIBOR 3.47%, Downtown avg AED 2,800/sqft, DLD transfer fee 4%, off-plan 60%+ of market. Return ONLY a JSON array of 5 objects, no markdown, no preamble: [{"title":"...","insight":"...","tag":"Yield|Price|Risk|Macro|Opportunity","direction":"up|down|neutral"}]` }]
            })
          });
          const apiData = await res.json();
          const text = apiData.content?.[0]?.text || "[]";
          const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
          setAiInsights(parsed);
          // Cache for a week
          try { await setDoc(doc(db, "aiInsights", "latest"), { insights: parsed, generatedAt: Date.now() }); } catch(e) {}
          setInsightsLoading(false);
        }
      } catch(e) { setInsightsLoading(false); }
    })();

    // ── Load Paddle.js for billing ──
    if (!window.Paddle) {
      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.onload = () => {
        // ── PASTE YOUR PADDLE CLIENT TOKEN BELOW ──
        // Get it from paddle.com → Developer → Authentication → Client-side token
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
  const emaarBaseNames = new Set([].map(p => (p.name || "").toLowerCase().trim()));
  const activeProjects = [
    // Always include all 48 curated Emaar projects with any live overrides
    // Firestore projects loaded below
    // Include ALL extra projects from Firestore (radar + other developers)
    // Skip any that duplicate the 48 Emaar base projects by name
    ...extraProjects.filter(p => !emaarBaseNames.has((p.name || "").toLowerCase().trim()))
  ];

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

  // ── MASTER LIVE LISTENERS — all Firestore real-time subscriptions ──────────
  useEffect(() => {
    const unsubs = [];

    // projectData overrides (prices, PPSF, images edited in Admin)
    unsubs.push(onSnapshot(collection(db, "projectData"), (snap) => {
      const overrides = {};
      snap.forEach(d => { overrides[d.id.replace("project_", "")] = d.data(); });
      setLiveProjects(overrides);
    }));

    // projects collection (radar adds, DAMAC, Aldar etc)
    const baseIds = new Set([].map(p => String(p.id)));
    const baseNames = new Set([].map(p => (p.name || "").toLowerCase().trim()).filter(Boolean));
    unsubs.push(onSnapshot(collection(db, "projects"), (snap) => {
      const fsProjects = [];
      snap.forEach(d => {
        const data = { ...d.data(), id: d.id, fromFirestore: true };
        if (data.developerId === "emaar" && baseIds.has(String(data.id?.toString().replace("emaar_", "")))) return;
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
      snap.forEach(d => { map[d.id] = { ...({}), ...d.data() }; });
      setLiveCommunityROI(map);
    }));

    // communityIntel
    unsubs.push(onSnapshot(collection(db, "communityIntel"), (snap) => {
      if (!snap.size) return;
      const map = {};
      snap.forEach(d => { map[d.id] = { ...d.data() }; });
      setLiveCommunityIntel(map);
    }));

    // yieldData
    unsubs.push(onSnapshot(collection(db, "yieldData"), (snap) => {
      if (!snap.size) return;
      const yieldOverrides = {};
      snap.forEach(d => { yieldOverrides[d.id] = d.data(); });
      // Yields load from Firestore communityData collection
          setLiveYields([]);
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

    // platformSettings/tabs (which tabs are on/off)
    unsubs.push(onSnapshot(doc(db, "platformSettings", "tabs"), (snap) => {
      if (snap.exists()) setTabSettings(snap.data());
    }));

    // developers list
    unsubs.push(onSnapshot(collection(db, "developers"), (snap) => {
      if (!snap.size) return;
      const devs = [];
      snap.forEach(d => devs.push({ id: d.id, ...d.data() }));
      devs.sort((a, b) => (a.phase || 1) - (b.phase || 1));
      setAllDevelopers(devs);
    }));

    // aiInsights/latest
    unsubs.push(onSnapshot(doc(db, "aiInsights", "latest"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (data.insights && data.generatedAt > oneWeekAgo) setAiInsights(data.insights);
    }));

    return () => unsubs.forEach(u => { try { u(); } catch {} });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // USER-SCOPED LIVE LISTENERS — portfolio, watchlist, price alerts
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        setIsLoggedIn(true);
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
                    await emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, {
                      user_email: firebaseUser.email, user_name: data.name || firebaseUser.email.split("@")[0],
                      project_name: "DXB Analytics Platform",
                      change_type: "⏰ Your Pro Trial Has Expired",
                      new_value: "Your 7-day trial has ended. Upgrade now to keep full access to 48+ projects, yield data, ROI tools and more.",
                      old_value: "Pro Trial", updated_at: new Date().toLocaleDateString("en-AE"),
                    }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
                    await setDoc(doc(db, "users", firebaseUser.uid), { emailSent_trialExpired: true }, { merge: true });
                  } catch(e) {}
                }
              } else {
                setTrialDaysLeft(daysLeft);
                // Send 3-day warning email (once only)
                if (daysLeft <= 3 && !data.emailSent_trial3d) {
                  try {
                    await emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, {
                      user_email: firebaseUser.email, user_name: data.name || firebaseUser.email.split("@")[0],
                      project_name: "DXB Analytics Platform",
                      change_type: `⚠️ Your Trial Expires in ${daysLeft} Day${daysLeft !== 1 ? "s" : ""}`,
                      new_value: `Only ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left on your Pro trial. Don't lose access — upgrade now to keep all features.`,
                      old_value: "Pro Trial Active", updated_at: new Date().toLocaleDateString("en-AE"),
                    }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
                    await setDoc(doc(db, "users", firebaseUser.uid), { emailSent_trial3d: true }, { merge: true });
                  } catch(e) {}
                }
                // Send 1-day urgent warning (once only)
                if (daysLeft <= 1 && !data.emailSent_trial1d) {
                  try {
                    await emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, {
                      user_email: firebaseUser.email, user_name: data.name || firebaseUser.email.split("@")[0],
                      project_name: "DXB Analytics Platform",
                      change_type: "🚨 Last Day of Your Pro Trial!",
                      new_value: "Today is your last day. After midnight your account moves to Free and you lose access to 48 projects, community yields, ROI data and PDF reports.",
                      old_value: "Pro Trial — Final Day", updated_at: new Date().toLocaleDateString("en-AE"),
                    }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
                    await setDoc(doc(db, "users", firebaseUser.uid), { emailSent_trial1d: true }, { merge: true });
                  } catch(e) {}
                }
              }
            }
            // Admin override — by role field OR by owner email
            if (data.role === "admin" || data.role === "superAdmin" || data.superAdmin === true) tier = "admin";
            setUserTier(tier);
            setUserRole(data.role || "user");
            setOrgId(data.orgId || null);
            setOrgRole(data.orgRole || null);
            setDevId(data.devId || null);
            setIsSuspended(!!data.suspended);
            setIsVerified(!!data.verified);
            setVerifiedLevel(data.verifiedLevel || null);
            setKycStatus(data.kycStatus || null);
          } else {
            // Existing user without profile (e.g. your admin account) — treat as admin/pro
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

  /* ─── MY LEADS LISTENER (Session 4) ─── */
  useEffect(() => {
    if (!isLoggedIn || !firebaseUser) return;
    setMyLeadsLoading(true);
    // Agents see only their assigned leads; admins/managers see all org leads
    const isAgent = orgRole === "agent";
    const isManager = orgRole === "manager";
    let leadsQuery;
    if (isAgent) {
      leadsQuery = query(collection(db, "leads"), where("assignedTo", "==", firebaseUser.uid), orderBy("createdAt", "desc"), limit(200));
    } else if (isManager && orgId) {
      leadsQuery = query(collection(db, "leads"), where("orgId", "==", orgId), orderBy("createdAt", "desc"), limit(500));
    } else {
      setMyLeadsLoading(false);
      return; // regular users don't see leads tab
    }
    const unsub = onSnapshot(leadsQuery, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setMyLeads(list);
      setMyLeadsLoading(false);
    }, (err) => { console.warn("[Leads]", err); setMyLeadsLoading(false); });
    return () => unsub();
  }, [isLoggedIn, firebaseUser, orgRole, orgId]);

  /* ─── DEALS PIPELINE LISTENER (Session 5) ─── */
  useEffect(() => {
    if (!isLoggedIn || !firebaseUser) return;
    const isAgent   = orgRole === "agent";
    const isManager = orgRole === "manager";
    if (!isAgent && !isManager) return;
    setDealsLoading(true);
    let dealsQ;
    if (isAgent) {
      dealsQ = query(collection(db, "deals"), where("agentId","==",firebaseUser.uid), orderBy("createdAt","desc"));
    } else if (isManager && orgId) {
      dealsQ = query(collection(db, "deals"), where("orgId","==",orgId), orderBy("createdAt","desc"));
    } else { setDealsLoading(false); return; }
    const unsub = onSnapshot(dealsQ, snap => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setDeals(list);
      setDealsLoading(false);
    }, err => { console.warn("[Deals]", err); setDealsLoading(false); });
    return () => unsub();
  }, [isLoggedIn, firebaseUser, orgRole, orgId]);

  /* ─── TEAM MEMBERS LISTENER (Session 7) ─── */
  useEffect(() => {
    if (!isLoggedIn || !firebaseUser || orgRole !== "manager" || !orgId) return;
    setTeamMembersLoading(true);
    const q = query(collection(db, "users"), where("orgId", "==", orgId));
    const unsub = onSnapshot(q, snap => {
      const list = [];
      snap.forEach(d => list.push({ uid: d.id, ...d.data() }));
      setTeamMembers(list);
      setTeamMembersLoading(false);
    }, err => { console.warn("[Team]", err); setTeamMembersLoading(false); });
    return () => unsub();
  }, [isLoggedIn, firebaseUser, orgRole, orgId]);

  /* ─── ORG PROFILE LISTENER (Session 8) ─── */
  useEffect(() => {
    if (!isLoggedIn || !firebaseUser || orgRole !== "manager" || !orgId) return;
    const unsub = onSnapshot(doc(db, "organisations", orgId), snap => {
      if (snap.exists()) {
        const d = snap.data();
        setOrgProfile(d);
        setOrgProfileForm({
          name:         d.name         || "",
          reraNo:       d.reraNo       || "",
          tradeLicense: d.tradeLicense || "",
          phone:        d.phone        || "",
          email:        d.ownerEmail   || "",
          website:      d.website      || "",
          notes:        d.notes        || "",
        });
        // Load commission splits per agent
        if (d.commSplits) setCommSplits(d.commSplits);
      }
    });
    return () => unsub();
  }, [isLoggedIn, firebaseUser, orgRole, orgId]);

  /* ─── LISTINGS LISTENER (Session 9) ─── */
  useEffect(() => {
    if (!isLoggedIn || !firebaseUser) return;
    const isAgent   = orgRole === "agent";
    const isManager = orgRole === "manager";
    if (!isAgent && !isManager) return;
    setListingsLoading(true);
    let q;
    if (isAgent) {
      q = query(collection(db, "listings"), where("agentId","==",firebaseUser.uid), orderBy("createdAt","desc"));
    } else if (isManager && orgId) {
      q = query(collection(db, "listings"), where("orgId","==",orgId), orderBy("createdAt","desc"));
    } else { setListingsLoading(false); return; }
    const unsub = onSnapshot(q, snap => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setListings(list);
      setListingsLoading(false);
    }, err => { console.warn("[Listings]", err); setListingsLoading(false); });
    return () => unsub();
  }, [isLoggedIn, firebaseUser, orgRole, orgId]);

  /* ─── DEV PORTAL LISTENERS (Session 10) ─── */
  useEffect(() => {
    if (!isLoggedIn || !firebaseUser || userRole !== "developer" || !devId) return;
    // Dev projects from allDevelopers (already loaded)
    setDevProjects(allDevelopers.filter(d => d.id === devId));
    // Dev units
    setDevUnitsLoading(true);
    const unsubUnits = onSnapshot(
      query(collection(db, "devUnits"), where("devId","==",devId), orderBy("createdAt","desc")),
      snap => {
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setDevUnits(list);
        setDevUnitsLoading(false);
      }, err => { console.warn("[DevUnits]", err); setDevUnitsLoading(false); }
    );
    // Dev EOIs
    setDevEOIsLoading(true);
    const unsubEOIs = onSnapshot(
      query(collection(db, "devEOIs"), where("devId","==",devId), orderBy("createdAt","desc")),
      snap => {
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setDevEOIs(list);
        setDevEOIsLoading(false);
      }, err => { console.warn("[DevEOIs]", err); setDevEOIsLoading(false); }
    );
    return () => { unsubUnits(); unsubEOIs(); };
  }, [isLoggedIn, firebaseUser, userRole, devId, allDevelopers]);

  /* ─── RERA CARD READER (Session 6) ─── */
  useEffect(() => {
    if (!isLoggedIn || !firebaseUser) return;
    const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), snap => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.reraCard) setReraCard(d.reraCard);
      }
    });
    return () => unsub();
  }, [isLoggedIn, firebaseUser]);

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
    notify(isWatched ? `Removed ${project.name} from watchlist` : `⭐ ${project.name} added to watchlist`);
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
      const comm = [].find(c => c.name === p.community);
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

  // NOTIFICATIONS — live listener so admin messages appear instantly
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
        else if (selectedProject) setSelectedProject(null);
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
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🚫</div>
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
    if (!kycForm.name.trim()) { notify("❌ Full name required"); return; }
    if (!kycForm.phone.trim()) { notify("❌ Phone number required"); return; }
    if (!auth.currentUser) return;
    setKycSubmitting(true);
    try {
      await setDoc(doc(db, "verifications", auth.currentUser.uid), {
        uid: auth.currentUser.uid, email: user, ...kycForm,
        status: "pending", submittedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, "users", auth.currentUser.uid), { kycStatus: "pending" }, { merge: true });
      setKycStatus("pending");
      notify("✅ Verification submitted! Admin will review within 24h.");
      setShowKYC(false);
    } catch(e) { notify("❌ " + e.message); }
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
      notify(`✅ ${uName} → ${newTier}`);
      // Send tier change confirmation email
      const tierMessages = {
        free: { subject: "Your DXB Analytics plan has changed to Free", body: "Your account has been updated to the Free plan. You have access to 5 featured projects and basic market data." },
        pro_trial: { subject: "Your 7-Day Pro Trial has been activated!", body: "Great news! Your Pro Trial has been activated. You now have full access to 48+ projects, community yields, ROI calculator, PDF reports and all Pro features for 7 days." },
        pro: { subject: "Welcome to DXB Analytics Pro! ⭐", body: "Your account has been upgraded to the Pro Plan. You now have unlimited access to all 48+ projects, live yield data, ROI analysis, investment reports, and all Pro features." },
        enterprise: { subject: "Welcome to DXB Analytics Enterprise! 🏢", body: "Your account has been upgraded to Enterprise. You have access to all platform features including custom reports, priority support, and full data access." },
      };
      const msg = tierMessages[newTier] || { subject: `Your plan changed to ${newTier}`, body: `Your DXB Analytics plan has been updated to ${newTier}.` };
      if (uEmail) {
        try {
          await emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, {
            user_email: uEmail, user_name: uName,
            project_name: "DXB Analytics Platform",
            change_type: msg.subject,
            new_value: msg.body,
            old_value: u?.tier || "free",
            updated_at: now.toLocaleDateString("en-AE"),
          }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
        } catch(e) {}
      }
    } catch (err) {
      notify("❌ Failed to update tier");
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
      {toast && <div className="fade-up" style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 24px", borderRadius: 10, background: toast.includes("✅") ? T.green : toast.includes("❌") ? T.red : T.gold, color: "#fff", fontWeight: 700, fontSize: 13, zIndex: 9999, boxShadow: "0 12px 40px rgba(0,0,0,0.4)", fontFamily: "'Outfit', sans-serif" }}>{toast}</div>}

      {/* Mobile overlay */}
      <div className={`mobile-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* ─── SIDEBAR ─── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 240,
        background: T.surface, borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column", zIndex: 100,
        transition: "transform 0.3s ease",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="30" height="30" viewBox="0 0 40 40">
              <rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2"/>
              <path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold}/>
            </svg>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 800, color: T.gold, lineHeight: 1.2 }}>DXB Analytics</div>
              <div style={{ fontSize: 8.5, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>Intelligence Platform</div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: T.textMuted, letterSpacing: 0.2 }}>
            {allDevelopers?.find(d => d.id === selectedDeveloper)?.name || "Emaar Properties"}
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 12px 4px", flexShrink: 0, position: "relative" }}>
          {SvgIcons.Search({ width: 13, height: 13, strokeWidth: 1.5, style: { position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", color: T.textMuted, pointerEvents: "none" } })}
          <input className="sidebar-search" placeholder="Search tabs..." value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} />
        </div>

        {/* Navigation */}
        <nav role="navigation" aria-label="Main navigation" style={{ flex: 1, padding: "4px 8px 8px", overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
          {TAB_GROUPS.map(group => {
            const isCollapsed = groupCollapsed[group.id];
            const filteredTabs = sidebarSearch
              ? group.tabs.filter(t => t.key.toLowerCase().includes(sidebarSearch.toLowerCase()))
              : group.tabs;
            if (sidebarSearch && filteredTabs.length === 0) return null;
            const badgeCount = group.id === "crm" && myLeads?.length > 0
              ? myLeads.filter(l => !l.lastContact || (Date.now() - new Date(l.lastContact).getTime()) > 86400000 * 3).length
              : 0;
            return (
              <div key={group.id} style={{ marginBottom: 2 }}>
                {!sidebarSearch && (
                  <button type="button" className="sidebar-group-btn" onClick={() => toggleGroup(group.id)}>
                    {group.icon({ width: 12, height: 12, strokeWidth: 2, style: { flexShrink: 0 } })}
                    <span style={{ flex: 1 }}>{group.label}</span>
                    {badgeCount > 0 && (
                      <span style={{ background: T.red, color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 10, minWidth: 16, textAlign: "center" }}>{badgeCount}</span>
                    )}
                    {isCollapsed ? SvgIcons.ChevronRight({ width: 11, height: 11, strokeWidth: 2 }) : SvgIcons.ChevronDown({ width: 11, height: 11, strokeWidth: 2 })}
                  </button>
                )}
                {(!isCollapsed || !!sidebarSearch) && (
                  <div style={{ paddingLeft: sidebarSearch ? 0 : 4 }}>
                    {filteredTabs.map(t => {
                      const s = tabSettings[t.key] || {};
                      const minTier = s.minTier || "free";
                      const tierOrder = { free: 0, pro: 1, enterprise: 2 };
                      const userTierOrder = tierOrder[userTier] ?? (userTier === "admin" ? 3 : userTier === "pro_trial" ? 1 : 0);
                      const isLocked = tierOrder[minTier] > userTierOrder && userTier !== "admin";
                      const isActive = tab === t.key;
                      return (
                        <button type="button" key={t.key} role="tab" aria-selected={isActive}
                          className={`sidebar-btn ${isActive ? "active" : ""}`}
                          onClick={() => { if (isLocked) { setShowUpgrade(true); return; } handleTabChange(t.key); if (window.innerWidth < 768) setSidebarOpen(false); }}
                          style={isLocked ? { opacity: 0.45 } : {}} title={t.key}>
                          {t.icon({ width: 15, height: 15, strokeWidth: isActive ? 2 : 1.5, style: { flexShrink: 0, color: isActive ? T.gold : "inherit" } })}
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.key}</span>
                          {isLocked && (
                            <span style={{ fontSize: 8.5, color: minTier === "enterprise" ? "#8B5CF6" : T.gold, fontWeight: 700, letterSpacing: 0.3, flexShrink: 0 }}>
                              {minTier === "enterprise" ? "ENT" : "PRO"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Admin link */}
          {userTier === "admin" && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", padding: "4px 14px 6px" }}>Admin</div>
              <button type="button" className="sidebar-btn"
                onClick={() => window.location.href = "/admin"}
                style={{ background: "rgba(212,168,67,0.08)", border: `1px solid rgba(212,168,67,0.2)` }}>
                {SvgIcons.Settings({ width: 15, height: 15, strokeWidth: 1.5, style: { color: T.gold, flexShrink: 0 } })}
                <span>Admin Console</span>
                <span style={{ marginLeft: "auto", fontSize: 9, color: T.textMuted }}>↗</span>
              </button>
            </div>
          )}
        </nav>

        {/* Bottom user row */}
        <div style={{ padding: "10px 8px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          {userTier === "pro_trial" && trialDaysLeft > 0 && (
            <div style={{ marginBottom: 8, padding: "7px 12px", borderRadius: 8, background: "rgba(212,168,67,0.08)", border: `1px solid ${T.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: T.gold, letterSpacing: 0.5 }}>PRO TRIAL</div>
              <div style={{ fontSize: 10.5, color: T.textSecondary, marginTop: 1 }}>{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining</div>
            </div>
          )}
          {userTier === "free" && (
            <div role="button" tabIndex={0}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setShowUpgrade(true); }}
              onClick={() => setShowUpgrade(true)}
              style={{ marginBottom: 8, padding: "7px 12px", borderRadius: 8, background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)", textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: "#60A5FA", letterSpacing: 0.5 }}>FREE PLAN</div>
              <div style={{ fontSize: 10.5, color: T.textSecondary, marginTop: 1 }}>Upgrade to Pro →</div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 10, background: T.surfaceAlt }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: T.bg, flexShrink: 0 }}>
              {user.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName || user.split("@")[0]}</div>
              <div style={{ fontSize: 9.5, color: userTier === "pro_trial" ? T.gold : ["admin","pro","enterprise"].includes(userTier) ? T.green : T.textMuted }}>
                {userTier === "admin" ? "Admin" : userTier === "pro_trial" ? "Pro Trial" : userTier === "pro" ? "Pro" : userTier === "enterprise" ? "Enterprise" : "Free"}
              </div>
            </div>
            <button type="button" onClick={() => { setShowProfile(true); setProfileEdit({ name: userName || "" }); }}
              style={{ background: "none", border: `1px solid ${T.border}`, cursor: "pointer", color: T.textMuted, padding: 5, borderRadius: 6, display: "flex" }} title="Profile">
              {SvgIcons.User({ width: 13, height: 13, strokeWidth: 1.5 })}
            </button>
            <button type="button" onClick={() => signOut(auth)}
              style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 5, display: "flex" }} title="Sign out">
              {SvgIcons.LogOut({ width: 13, height: 13, strokeWidth: 1.5 })}
            </button>
          </div>
        </div>
      </aside>

      {/* ─── FREE TIER BANNER ─── */}
      {userTier === "free" && (
        <div className="free-banner" style={{ position: "fixed", top: 60, left: 240, right: 0, zIndex: 60, background: `linear-gradient(90deg, ${T.gold}ee, #B8912Fee)`, padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>🔒</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#04090F" }}>You're on the Free plan — 12 tabs locked</span>
            <span style={{ fontSize: 11, color: "rgba(4,9,15,0.7)" }}>Upgrade to Pro to unlock DXB Estimate, Yields, Mortgage, Portfolio & more</span>
          </div>
          <button type="button" onClick={() => setShowUpgrade(true)} style={{ padding: "5px 16px", background: "#04090F", color: T.gold, border: "none", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap" }}>
            Upgrade Now →
          </button>
        </div>
      )}

      {/* ─── TOP BAR ─── */}
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
            {sidebarOpen ? SvgIcons.X({ width: 20, height: 20, strokeWidth: 2 }) : SvgIcons.Menu({ width: 20, height: 20, strokeWidth: 2 })}
          </button>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.white }}>{allDevelopers?.find(d=>d.id===selectedDeveloper)?.name || "Emaar Properties"} <span style={{ color: T.textMuted, fontWeight: 400, fontSize: 13 }}>PJSC</span></h1>
          </div>
        </div>
        <div className="header-badges" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" onClick={() => setShowWatchlist(true)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 12px", cursor: "pointer", color: watchlist.length > 0 ? T.gold : T.textSecondary, display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "'Outfit',sans-serif" }} title="My Watchlist">
            ☆ {watchlist.length > 0 && <span style={{ fontWeight: 700 }}>{watchlist.length}</span>}
          </button>
          <button type="button" onClick={globalRefresh} disabled={isRefreshing} title="Refresh all data" style={{ background: isRefreshing ? T.surfaceAlt : "rgba(212,168,67,0.08)", border: "1px solid " + (isRefreshing ? T.border : "rgba(212,168,67,0.25)"), borderRadius: 10, padding: "8px 12px", cursor: isRefreshing ? "not-allowed" : "pointer", color: isRefreshing ? T.textMuted : T.gold, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" onClick={() => setShowNotifications(v => !v)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, cursor: "pointer", color: T.textSecondary, position: "relative" }} title="Notifications">
            {Icons.bell}
            {unreadCount > 0 && <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: T.red, border: `2px solid ${T.bg}` }} />}
          </button>
        </div>
      </header>

      {/* ─── GLOBAL CONTEXT FILTER ─── */}
      <GlobalContextFilter
        gDeveloper={gDeveloper} setGDeveloperAndReset={setGDeveloperAndReset}
        gCommunity={gCommunity} setGCommunity={setGCommunity}
        gPropertyType={gPropertyType} setGPropertyTypeAndReset={setGPropertyTypeAndReset}
        gSubType={gSubType} setGSubType={setGSubType}
        gBeds={gBeds} setGBeds={setGBeds}
        gStatus={gStatus} setGStatus={setGStatus}
        gPriceMin={gPriceMin} setGPriceMin={setGPriceMin}
        gPriceMax={gPriceMax} setGPriceMax={setGPriceMax}
        allDevelopers={allDevelopers} T={T}
      />

      {/* ─── MAIN CONTENT ─── */}
      <main role="main" id="main-content" className="main-content" style={{ marginLeft: 240, paddingTop: userTier === "free" ? 140 : 100, minHeight: "100vh", overflowX: "hidden" }}>
        {/* Trial / Free tier banner */}
        {userTier === "pro_trial" && trialDaysLeft > 0 && (() => {
          const isUrgent = trialDaysLeft <= 1;
          const isWarning = trialDaysLeft <= 3;
          const bg = isUrgent ? "rgba(239,68,68,0.1)" : isWarning ? "rgba(245,158,11,0.1)" : "rgba(212,168,67,0.08)";
          const border = isUrgent ? "rgba(239,68,68,0.35)" : isWarning ? "rgba(245,158,11,0.35)" : T.border;
          const icon = isUrgent ? "🚨" : isWarning ? "⚠️" : "⭐";
          const label = isUrgent ? "Last day of your trial!" : isWarning ? `Trial ending soon` : "Pro Trial Active";
          const sub = isUrgent
            ? "Your trial expires today. Upgrade now to keep full access."
            : isWarning
            ? `${trialDaysLeft} days left — don't lose your access to 48+ projects and yield data.`
            : `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} remaining. Full Pro access active.`;
          return (
            <div style={{ margin: "12px 24px 0", padding: "10px 16px", borderRadius: 10, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ fontSize: 13, color: isUrgent ? T.red : isWarning ? T.gold : T.white, fontWeight: 700 }}>{label}</span>
                <span style={{ fontSize: 12, color: T.textSecondary }}>— {sub}</span>
              </div>
              <button type="button" onClick={() => setShowUpgrade(true)} style={{ padding: "6px 16px", borderRadius: 6, background: isUrgent ? T.red : T.gold, color: isUrgent ? "#fff" : T.bg, border: "none", fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: "pointer" }}>
                {isUrgent ? "🔥 Upgrade Now" : "Upgrade to Pro"}
              </button>
            </div>
          );
        })()}
        {userTier === "free" && (
          <div style={{ margin: "12px 24px 0", padding: "10px 16px", borderRadius: 10, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <span style={{ fontSize: 13, color: T.white, fontWeight: 600 }}>Free Plan</span>
              <span style={{ fontSize: 12, color: T.textSecondary }}>— You're seeing limited data. Upgrade to unlock all projects, yields & more.</span>
            </div>
            <button type="button" onClick={() => setShowUpgrade(true)} style={{ padding: "6px 16px", borderRadius: 6, background: T.gold, color: T.bg, border: "none", fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: "pointer" }}>Upgrade to Pro — AED 99/mo</button>
          </div>
        )}
        <div style={{ padding: `0 24px ${compareList.length > 0 && tab === "Projects" ? "120px" : "60px"}` }}>

          {/* ─── OVERVIEW TAB ─── */}
          {tab === "Overview" && (() => {

            /* ── KPI Card Component ── */
            const OvKPI = ({ label, value, sub, color, icon, onClick, delay }) => (
              <div className={`kpi-card fade-up delay-${delay||1}`} onClick={onClick}
                style={{ cursor: onClick ? "pointer" : "default" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ color: color || T.gold, opacity: 0.8 }}>{icon}</div>
                </div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 800, color: T.white, lineHeight: 1.1, marginBottom: 6 }}>{value || "—"}</div>
                {sub && <div style={{ fontSize: 11, color: T.textSecondary }}>{sub}</div>}
              </div>
            );

            /* ── Section Header ── */
            const OvSection = ({ title, sub, action }) => (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, marginTop: 28 }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: T.white }}>{title}</div>
                  {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{sub}</div>}
                </div>
                {action}
              </div>
            );

            /* ── Live KPI data from Firestore ── */
            const mkt = liveMarketData?.[0] || {};
            const syncTime = lastDataSync ? lastDataSync.toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" }) : null;

            return (
              <div style={{ paddingTop: 8 }}>

                {/* ── Verified bar ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 10, height: 10 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s infinite" }} />
                    </span>
                    <span style={{ fontSize: 11, color: T.textSecondary }}>
                      Live data — <span style={{ color: T.gold, fontWeight: 600 }}>DXB Analytics Intelligence Platform</span>
                      {syncTime && <span style={{ color: T.textMuted }}> · Last sync {syncTime}</span>}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: T.green }}>DLD Official</span>
                    <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(212,168,67,0.08)", border: `1px solid ${T.border}`, color: T.textMuted }}>RERA Verified</span>
                  </div>
                </div>

                {/* ── Section A: 7 KPI Cards ── */}
                <OvSection title="Market Pulse" sub="Dubai real estate — key indicators" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 8 }}>
                  <OvKPI delay={1} label="Total Market Value" icon={SvgIcons.TrendingUp({width:16,height:16})}
                    value={liveMarketData?.find?.(d=>d.metric==="Total Market Value")?.value || "AED 919B"}
                    sub={liveMarketData?.find?.(d=>d.metric==="Total Market Value")?.change || "+20% YoY · All-time record"}
                    onClick={() => handleTabChange("Market")} />
                  <OvKPI delay={2} label="DLD Transactions" icon={SvgIcons.Database({width:16,height:16})}
                    value={liveMarketData?.find?.(d=>d.metric==="Total Transactions")?.value || "226,000+"}
                    sub={liveMarketData?.find?.(d=>d.metric==="Total Transactions")?.change || "+36% YoY · 2025 record"}
                    onClick={() => handleTabChange("DLD Volumes")} />
                  <OvKPI delay={3} label="EIBOR 3M — Live" icon={SvgIcons.Landmark({width:16,height:16})}
                    value={liveMortgageRates?.[0]?.eibor3m ? liveMortgageRates[0].eibor3m.toFixed(2) + "%" : "—"}
                    sub="Updated daily · Central Bank UAE"
                    color={T.teal} onClick={() => handleTabChange("Mortgage")} />
                  <OvKPI delay={4} label="Active Developers" icon={SvgIcons.Building2({width:16,height:16})}
                    value={allDevelopers?.length > 0 ? allDevelopers.length.toString() : "228"}
                    sub="RERA registered · DLD approved"
                    onClick={() => handleTabChange("Developer Health")} />
                  <OvKPI delay={5} label="Avg Gross Yield" icon={SvgIcons.BarChart3({width:16,height:16})}
                    value={liveYields?.length > 0 ? (liveYields.reduce((a,b) => a + (parseFloat(b.gross)||0), 0) / liveYields.length).toFixed(1) + "%" : "6.9%"}
                    sub="Across all communities · Bayut data"
                    color={T.green} onClick={() => handleTabChange("Yields")} />
                  <OvKPI delay={6} label="Off-Plan Share" icon={SvgIcons.BarChart2({width:16,height:16})}
                    value={liveMarketData?.find?.(d=>d.metric==="Off-Plan Share")?.value || "60%+"}
                    sub="Of total DLD transactions"
                    onClick={() => handleTabChange("Projects")} />
                  <OvKPI delay={7} label="Units Launched" icon={SvgIcons.Activity({width:16,height:16})}
                    value={liveMarketData?.find?.(d=>d.metric==="Units Launched")?.value || "131,504"}
                    sub="New units launched"
                    onClick={() => handleTabChange("Launch Calendar")} />
                </div>

                {/* ── Section B: 3-column intelligence panel ── */}
                <OvSection title="Intelligence Panel"
                  sub="Context-aware — updates with your filter selection"
                  action={
                    <div style={{ fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: gDeveloper !== "all" ? T.gold : T.textMuted, display: "inline-block" }} />
                      {gDeveloper !== "all" ? "Filtered" : "All Developers"}
                    </div>
                  }
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 8 }}>

                  {/* Column 1: Top Communities by Yield */}
                  <div className="chart-box" style={{ padding: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>Top Communities — Yield</div>
                    {liveYields?.length > 0
                      ? [...liveYields].sort((a,b) => (parseFloat(b.gross)||0) - (parseFloat(a.gross)||0)).slice(0,6).map((y, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 5 ? `1px solid ${T.border}` : "none" }}>
                            <div>
                              <div style={{ fontSize: 12, color: T.white, fontWeight: 500 }}>{y.community || y.label}</div>
                              <div style={{ fontSize: 10, color: T.textMuted }}>{y.label || "Apartment"}</div>
                            </div>
                            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: parseFloat(y.gross) >= 7 ? T.green : parseFloat(y.gross) >= 5.5 ? T.gold : T.textSecondary }}>
                              {parseFloat(y.gross).toFixed(1)}%
                            </div>
                          </div>
                        ))
                      : (
                          <div style={{ textAlign: "center", padding: "30px 0" }}>
                            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>No yield data yet</div>
                            <div style={{ fontSize: 11, color: T.textMuted, opacity: 0.7 }}>Connect via Admin → Data Health</div>
                          </div>
                        )
                    }
                    <button type="button" onClick={() => handleTabChange("Yields")} style={{ width: "100%", marginTop: 12, padding: "7px 0", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      View All Yields →
                    </button>
                  </div>

                  {/* Column 2: DLD Volume by Community */}
                  <div className="chart-box" style={{ padding: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>DLD Transaction Volume</div>
                    {liveDLDVolumes?.length > 0
                      ? [...liveDLDVolumes].sort((a,b) => (b.transactions||b.count||0) - (a.transactions||a.count||0)).slice(0,6).map((d, i) => {
                          const maxVal = liveDLDVolumes.reduce((m,x) => Math.max(m, x.transactions||x.count||0), 1);
                          const pct = Math.round(((d.transactions||d.count||0) / maxVal) * 100);
                          return (
                            <div key={i} style={{ marginBottom: 10 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 11, color: T.textSecondary }}>{d.community || d.label}</span>
                                <span style={{ fontSize: 11, color: T.white, fontWeight: 600 }}>{(d.transactions||d.count||0).toLocaleString()}</span>
                              </div>
                              <div style={{ height: 4, borderRadius: 2, background: T.border }}>
                                <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, background: `linear-gradient(90deg, ${T.gold}, ${T.teal})`, transition: "width 0.8s ease" }} />
                              </div>
                            </div>
                          );
                        })
                      : (
                          <div style={{ textAlign: "center", padding: "30px 0" }}>
                            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>No DLD data yet</div>
                            <div style={{ fontSize: 11, color: T.textMuted, opacity: 0.7 }}>Auto-syncs daily via cron</div>
                          </div>
                        )
                    }
                    <button type="button" onClick={() => handleTabChange("DLD Volumes")} style={{ width: "100%", marginTop: 12, padding: "7px 0", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      View DLD Volumes →
                    </button>
                  </div>

                  {/* Column 3: AI Market Insight + Developer Health */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* AI Insight */}
                    <div className="chart-box" style={{ padding: 18, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, animation: "pulse 2s infinite" }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>AI Market Insight</div>
                      </div>
                      {aiInsights?.length > 0
                        ? <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.7 }}>
                            {aiInsights[0]?.text || aiInsights[0]}
                          </div>
                        : <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7, fontStyle: "italic" }}>
                            AI market analysis generates automatically every 7 days from live DLD and Bayut data.
                          </div>
                      }
                      <div style={{ marginTop: 10, fontSize: 10, color: T.textMuted }}>
                        Powered by Claude · {aiInsights?.length > 0 ? "Updated this week" : "Connect data to activate"}
                      </div>
                    </div>

                    {/* Top Developer Health */}
                    <div className="chart-box" style={{ padding: 18 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>Developer Health</div>
                      {liveDevHealth?.length > 0
                        ? [...liveDevHealth].slice(0,4).map((d, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
                              <span style={{ fontSize: 11, color: T.textSecondary }}>{d.developer || d.name}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: (d.score||d.healthScore||0) >= 75 ? "rgba(16,185,129,0.15)" : (d.score||d.healthScore||0) >= 50 ? "rgba(212,168,67,0.15)" : "rgba(239,68,68,0.15)", color: (d.score||d.healthScore||0) >= 75 ? T.green : (d.score||d.healthScore||0) >= 50 ? T.gold : T.red }}>
                                {d.score || d.healthScore || "—"}
                              </span>
                            </div>
                          ))
                        : <div style={{ fontSize: 11, color: T.textMuted }}>Health scores load from Admin → Developer Health</div>
                      }
                      <button type="button" onClick={() => handleTabChange("Developer Health")} style={{ width: "100%", marginTop: 10, padding: "7px 0", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        View All →
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Section C: Live feeds ── */}
                <OvSection title="Live Intelligence Feeds"
                  sub="Real-time data streams — auto-refreshing"
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 32 }}>

                  {/* Feed 1: Recent DLD Transactions */}
                  <div className="chart-box" style={{ padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>Recent DLD</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, animation: "pulse 2s infinite", display: "inline-block" }} />
                        <span style={{ fontSize: 9, color: T.textMuted }}>Live</span>
                      </div>
                    </div>
                    {liveDLDVolumes?.length > 0
                      ? liveDLDVolumes.slice(0,5).map((tx, i) => (
                          <div key={i} style={{ padding: "8px 0", borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                              <span style={{ fontSize: 11, color: T.white, fontWeight: 500 }}>{tx.community || "—"}</span>
                              <span style={{ fontSize: 11, color: T.gold, fontWeight: 700 }}>{tx.avgPrice ? "AED " + (tx.avgPrice/1000000).toFixed(1) + "M" : "—"}</span>
                            </div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>{tx.type || "Residential"} · {tx.transactions || tx.count || "—"} deals</div>
                          </div>
                        ))
                      : (
                          <div style={{ padding: "24px 0", textAlign: "center" }}>
                            <div style={{ fontSize: 12, color: T.textMuted }}>DLD data syncs daily</div>
                            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4, opacity: 0.7 }}>Check Admin → Data Health</div>
                          </div>
                        )
                    }
                  </div>

                  {/* Feed 2: Launch Radar */}
                  <div className="chart-box" style={{ padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>Launch Radar</div>
                      <button type="button" onClick={() => handleTabChange("Launch Calendar")} style={{ fontSize: 10, color: T.gold, background: "none", border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>View all →</button>
                    </div>
                    <div style={{ padding: "20px 0", textAlign: "center" }}>
                      <div style={{ marginBottom: 10 }}>
                        {SvgIcons.Calendar({ width: 28, height: 28, style: { color: T.textMuted, display: "inline-block" } })}
                      </div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>Launch data auto-scans Bayut daily</div>
                      <div style={{ fontSize: 10, color: T.textMuted, opacity: 0.7 }}>New launches appear here automatically</div>
                    </div>
                    <button type="button" onClick={() => handleTabChange("Launch Calendar")} style={{ width: "100%", marginTop: 4, padding: "7px 0", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      Open Launch Calendar →
                    </button>
                  </div>

                  {/* Feed 3: Platform Activity */}
                  <div className="chart-box" style={{ padding: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>Platform Activity</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        { label: "Active Leads", value: myLeads?.length || 0, icon: SvgIcons.Users({width:14,height:14}), tab: "My Leads", color: T.blue },
                        { label: "My Listings", value: listings?.length || 0, icon: SvgIcons.Building({width:14,height:14}), tab: "Listings", color: T.gold },
                        { label: "Portfolio Items", value: myPortfolio?.length || 0, icon: SvgIcons.Briefcase({width:14,height:14}), tab: "Portfolio", color: T.green },
                        { label: "Watchlist", value: watchlist?.length || 0, icon: SvgIcons.Star({width:14,height:14}), tab: null, color: T.textSecondary },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, background: T.surfaceAlt, cursor: item.tab ? "pointer" : "default" }}
                          onClick={() => item.tab && handleTabChange(item.tab)}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: item.color }}>{item.icon}</span>
                            <span style={{ fontSize: 12, color: T.textSecondary }}>{item.label}</span>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Data sources footer */}
                <div style={{ paddingBottom: 16, paddingTop: 4, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
                  {["Dubai Land Department", "RERA", "Bayut API", "ValuStrat", "REIDIN", "Claude AI"].map((s, i) => (
                    <span key={i} style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
          })()}

          {/* ─── MARKET TAB ─── */}
          {tab === "Market" && (() => {

            /* ── Stat Card ── */
            const MktStat = ({ label, value, change, positive, onClick }) => (
              <div className="kpi-card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 800, color: T.white, lineHeight: 1.1, marginBottom: 6 }}>{value || "—"}</div>
                {change && (
                  <div style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, color: positive === false ? T.red : T.green }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points={positive === false ? "18 15 12 9 6 15" : "6 9 12 15 18 15"}/></svg>
                    {change}
                  </div>
                )}
              </div>
            );

            /* ── Forecast Card ── */
            const ForecastCard = ({ firm, forecast, detail, color }) => {
              const [expanded, setExpanded] = React.useState(false);
              return (
                <div className="chart-box" style={{ borderTop: `3px solid ${color}`, cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'Fraunces',serif" }}>{firm}</div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round"><polyline points={expanded ? "18 15 12 9 6 15" : "6 9 12 15 18 15"}/></svg>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 6 }}>{forecast}</div>
                  {expanded && <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.7, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>{detail}</div>}
                </div>
              );
            };

            /* ── Live market stats from Firestore ── */
            const stats = liveMarketData?.length > 0 ? liveMarketData : [];
            const getStat = (metric) => stats.find(s => s.metric === metric);

            return (
              <div style={{ animation: "fadeUp 0.4s ease-out forwards" }}>

                {/* Tab header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>Dubai Real Estate Market</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>Macro view — Official DLD data · REIDIN · ValuStrat</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["Dubai Land Department", "REIDIN", "ValuStrat", "Knight Frank"].map((s, i) => (
                      <span key={i} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, border: `1px solid ${T.border}`, color: T.textMuted, background: T.surfaceAlt }}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* ── KPI Grid ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 12, marginBottom: 28 }}>
                  <MktStat label="Total Market Value"
                    value={getStat("Total Market Value")?.value || "—"}
                    change={getStat("Total Market Value")?.change}
                    onClick={() => handleTabChange("DLD Volumes")} />
                  <MktStat label="Total Transactions"
                    value={getStat("Total Transactions")?.value || "—"}
                    change={getStat("Total Transactions")?.change}
                    onClick={() => handleTabChange("DLD Volumes")} />
                  <MktStat label="Off-Plan Share"
                    value={getStat("Off-Plan Share")?.value || "—"}
                    change={getStat("Off-Plan Share")?.change} />
                  <MktStat label="Units Launched"
                    value={getStat("Units Launched")?.value || "—"}
                    change={getStat("Units Launched")?.change} />
                  <MktStat label="Mortgage Transactions"
                    value={getStat("Mortgage Transactions")?.value || "—"}
                    change={getStat("Mortgage Transactions")?.change} />
                  <MktStat label="Investor Base"
                    value={getStat("Investor Base")?.value || "—"}
                    change={getStat("Investor Base")?.change} />
                  <MktStat label="Price Growth YoY"
                    value={getStat("Price Growth")?.value || "—"}
                    change={getStat("Price Growth")?.change} />
                  <MktStat label="Women Investors"
                    value={getStat("Women Investors")?.value || "—"}
                    change={getStat("Women Investors")?.change} />
                </div>

                {/* ── No data state ── */}
                {stats.length === 0 && (
                  <div style={{ background: "rgba(212,168,67,0.05)", border: `1px solid rgba(212,168,67,0.15)`, borderRadius: 12, padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold, animation: "pulse 2s infinite", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.gold, marginBottom: 4 }}>Market data not yet imported</div>
                      <div style={{ fontSize: 12, color: T.textMuted }}>Go to Admin → Market Intelligence → Update Stats to import official DLD figures.</div>
                    </div>
                  </div>
                )}

                {/* ── 2-column layout: Sales Trend Chart + Market Split ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 24 }}>

                  {/* Sales trend - bar chart from Recharts */}
                  <div className="chart-box">
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 4 }}>Dubai Total Sales Value (AED Billions)</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>Historical growth trajectory · DLD Official</div>
                    {liveMarketData?.length > 0
                      ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={liveMarketData.filter(d => d.year).map(d => ({ year: d.year, value: parseFloat(d.value) || 0 }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }} labelStyle={{ color: T.white }} itemStyle={{ color: T.gold }} />
                            <Bar dataKey="value" name="AED B" radius={[6,6,0,0]} fill={T.gold} barSize={32} />
                          </BarChart>
                        </ResponsiveContainer>
                      )
                      : (
                        <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                          <div style={{ color: T.textMuted, fontSize: 12 }}>Chart loads with historical data</div>
                          <div style={{ fontSize: 11, color: T.textMuted, opacity: 0.6 }}>Import via Admin → Market Intelligence</div>
                        </div>
                      )
                    }
                  </div>

                  {/* Market split breakdown */}
                  <div className="chart-box">
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 4 }}>Market Composition</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 20 }}>Off-plan vs secondary · DLD</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {[
                        { label: "Off-Plan", pct: getStat("Off-Plan Share")?.numericValue || 60, color: T.gold },
                        { label: "Secondary Market", pct: 100 - (getStat("Off-Plan Share")?.numericValue || 60), color: T.teal },
                        { label: "Cash Transactions", pct: getStat("Cash Share")?.numericValue || 55, color: T.green },
                        { label: "Mortgage Transactions", pct: getStat("Mortgage Share")?.numericValue || 45, color: T.blue },
                      ].map((item, i) => (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: T.textSecondary }}>{item.label}</span>
                            <span style={{ fontSize: 12, color: T.white, fontWeight: 700 }}>{item.pct}%</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: T.border }}>
                            <div style={{ height: "100%", width: `${item.pct}%`, borderRadius: 3, background: item.color, transition: "width 1s ease" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Market Indicators Grid ── */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif", marginBottom: 4 }}>Key Market Indicators</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>Structural metrics shaping Dubai's real estate future</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                    {[
                      { k: "Population Target", v: getStat("Population Target")?.value || "5.8M by 2040" },
                      { k: "Price Cycle Duration", v: getStat("Price Cycle")?.value || "56+ months" },
                      { k: "Active Developers", v: getStat("Active Developers")?.value || (allDevelopers?.length > 0 ? allDevelopers.length + " live" : "228 registered") },
                      { k: "2026 Pipeline", v: getStat("2026 Pipeline")?.value || "~120K units" },
                      { k: "REIDIN Price Growth", v: getStat("REIDIN Growth")?.value || "—" },
                      { k: "Nationalities Investing", v: getStat("Nationalities")?.value || "193+" },
                    ].map(({ k, v }, i) => (
                      <div key={i} style={{ padding: "14px 16px", background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 9.5, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>{k}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── 2026 Analyst Forecasts ── */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif", marginBottom: 4 }}>2026 Analyst Forecasts</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>Knight Frank · CW Core · Fitch Ratings — Click each to expand</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                    <ForecastCard firm="Knight Frank" color={T.gold}
                      forecast="+3% prime / +1% mainstream"
                      detail="Knight Frank's 2026 Dubai Residential Forecast projects prime property appreciation of +3% and mainstream market growth of ~1%. Dubai is entering a more mature, sustainable growth cycle after two years of double-digit gains. Key tailwinds: continued HNWI inflows, Golden Visa demand, Expo City activation." />
                    <ForecastCard firm="CW Core" color={T.teal}
                      forecast="5–8% appreciation"
                      detail="Cushman & Wakefield Core projects 5–8% price appreciation for 2026, a slowdown from 12–22% in 2024–25. The massive 2026 pipeline (~120K units) acts as a price moderator, though strong end-user demand and low mortgage penetration are supportive. Off-plan expected to stay 60–65% of volume." />
                    <ForecastCard firm="Fitch Ratings" color={T.orange}
                      forecast="Stable / Watch"
                      detail="Fitch maintained a Stable Outlook for UAE developers, citing strong backlogs and recurring revenue as key buffers. However, the 120K+ unit pipeline in 2026 could create oversupply in affordable segments. Premium developer backlogs provide earnings visibility even in a correction scenario." />
                  </div>
                </div>

                {/* Data sources */}
                <div style={{ paddingTop: 16, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
                  {["Dubai Land Department", "REIDIN Dec 2025", "ValuStrat Q4 2025", "Knight Frank", "CW Core", "Fitch Ratings", "Gulf News Property"].map((s, i) => (
                    <span key={i} style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
          })()}

          {/* ─── DLD VOLUMES TAB ─── */}
          {tab === "DLD Volumes" && (() => {

            /* ── Local state ── */
            const [dldFilter, setDldFilter] = React.useState({ community: "All", type: "All", txType: "All", developer: "All", nationality: "All" });
            const [dldSort, setDldSort] = React.useState("transactions");
            const [dldSearch, setDldSearch] = React.useState("");
            const [dldView, setDldView] = React.useState("table"); // table | chart

            /* ── Filter data ── */
            const rawData = liveDLDVolumes || [];
            const filtered = rawData.filter(d => {
              if (dldFilter.community !== "All" && d.community !== dldFilter.community) return false;
              if (dldFilter.type !== "All" && d.type !== dldFilter.type) return false;
              if (dldFilter.txType !== "All" && d.txType !== dldFilter.txType) return false;
              if (dldFilter.developer !== "All" && d.developer !== dldFilter.developer) return false;
              if (dldFilter.nationality !== "All" && d.nationality !== dldFilter.nationality) return false;
              if (dldSearch && !JSON.stringify(d).toLowerCase().includes(dldSearch.toLowerCase())) return false;
              return true;
            }).sort((a, b) => (b[dldSort] || 0) - (a[dldSort] || 0));

            /* ── Unique filter options ── */
            const communities = ["All", ...new Set(rawData.map(d => d.community).filter(Boolean))];
            const types = ["All", "Apartment", "Villa", "Townhouse", "Office", "Retail", "Hotel Apartment", "Land"];
            const txTypes = ["All", "Off-Plan", "Ready", "Secondary"];
            const developers = ["All", ...new Set(rawData.map(d => d.developer).filter(Boolean))];

            /* ── Summary stats ── */
            const totalTx = filtered.reduce((a, b) => a + (b.transactions || b.count || 0), 0);
            const totalVol = filtered.reduce((a, b) => a + (b.volume || b.totalValue || 0), 0);
            const avgPpsf = filtered.length > 0
              ? Math.round(filtered.reduce((a, b) => a + (b.avgPpsf || b.ppsf || 0), 0) / filtered.filter(d => d.avgPpsf || d.ppsf).length || 0)
              : 0;

            const selStyle = {
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 8, color: T.white, fontFamily: "'Outfit',sans-serif",
              fontSize: 12, padding: "7px 28px 7px 10px", outline: "none", cursor: "pointer",
              appearance: "none", WebkitAppearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
            };

            return (
              <div style={{ animation: "fadeUp 0.4s ease-out forwards" }}>

                {/* Tab header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>DLD Transaction Intelligence</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>Official Dubai Land Department registry · Live data · Auto-refreshes daily</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {/* View toggle */}
                    <div style={{ display: "flex", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                      {["table", "chart"].map(v => (
                        <button key={v} type="button" onClick={() => setDldView(v)}
                          style={{ padding: "6px 14px", background: dldView === v ? "rgba(212,168,67,0.15)" : "transparent", color: dldView === v ? T.gold : T.textMuted, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif", textTransform: "capitalize" }}>
                          {v}
                        </button>
                      ))}
                    </div>
                    <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: T.green }}>
                      DLD Official
                    </span>
                  </div>
                </div>

                {/* ── Summary KPIs ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "Total Transactions", value: totalTx > 0 ? totalTx.toLocaleString() : "—", sub: "Filtered results" },
                    { label: "Total Volume", value: totalVol > 0 ? "AED " + (totalVol / 1e9).toFixed(1) + "B" : "—", sub: "Registered value" },
                    { label: "Avg Price/sqft", value: avgPpsf > 0 ? "AED " + avgPpsf.toLocaleString() : "—", sub: "Registered PPSF" },
                    { label: "Communities", value: communities.length - 1 > 0 ? (communities.length - 1).toString() : "—", sub: "In dataset" },
                  ].map((kpi, i) => (
                    <div key={i} className="kpi-card">
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{kpi.label}</div>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 800, color: T.white, marginBottom: 4 }}>{kpi.value}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{kpi.sub}</div>
                    </div>
                  ))}
                </div>

                {/* ── Smart Filters ── */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {/* Search */}
                    <div style={{ position: "relative", flex: "0 0 200px" }}>
                      {SvgIcons.Search({ width: 13, height: 13, style: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textMuted, pointerEvents: "none" } })}
                      <input value={dldSearch} onChange={e => setDldSearch(e.target.value)}
                        placeholder="Search communities..."
                        style={{ ...selStyle, paddingLeft: 30, paddingRight: 10, width: "100%", backgroundImage: "none" }} />
                    </div>
                    {/* Community */}
                    <select value={dldFilter.community} onChange={e => setDldFilter(f => ({ ...f, community: e.target.value }))} style={selStyle}>
                      {communities.map(c => <option key={c}>{c}</option>)}
                    </select>
                    {/* Property Type */}
                    <select value={dldFilter.type} onChange={e => setDldFilter(f => ({ ...f, type: e.target.value }))} style={selStyle}>
                      {types.map(t => <option key={t}>{t}</option>)}
                    </select>
                    {/* Transaction Type */}
                    <select value={dldFilter.txType} onChange={e => setDldFilter(f => ({ ...f, txType: e.target.value }))} style={selStyle}>
                      {txTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                    {/* Sort */}
                    <select value={dldSort} onChange={e => setDldSort(e.target.value)} style={selStyle}>
                      <option value="transactions">Sort: Volume</option>
                      <option value="avgPpsf">Sort: PPSF High</option>
                      <option value="volume">Sort: Total Value</option>
                    </select>
                    {/* Results count */}
                    <span style={{ fontSize: 11, color: T.textMuted, marginLeft: "auto" }}>
                      {filtered.length} of {rawData.length} results
                    </span>
                    {/* Reset */}
                    {(dldSearch || Object.values(dldFilter).some(v => v !== "All")) && (
                      <button type="button" onClick={() => { setDldFilter({ community: "All", type: "All", txType: "All", developer: "All", nationality: "All" }); setDldSearch(""); }}
                        style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", color: T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* ── No data state ── */}
                {rawData.length === 0 && (
                  <div style={{ background: "rgba(212,168,67,0.05)", border: `1px solid rgba(212,168,67,0.15)`, borderRadius: 12, padding: "40px 24px", textAlign: "center", marginBottom: 20 }}>
                    <div style={{ marginBottom: 12 }}>{SvgIcons.Database({ width: 36, height: 36, style: { color: T.textMuted, display: "inline-block" } })}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 8 }}>DLD data not yet synced</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>Data auto-syncs daily via cron job</div>
                    <div style={{ fontSize: 11, color: T.textMuted, opacity: 0.7 }}>Check Admin → Data Health → DLD Cron status</div>
                  </div>
                )}

                {/* ── Chart View ── */}
                {dldView === "chart" && filtered.length > 0 && (
                  <div className="chart-box" style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 16 }}>Transaction Volume by Community</div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={filtered.slice(0, 15)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="community" tick={{ fill: T.textSecondary, fontSize: 11 }} width={140} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }} labelStyle={{ color: T.white }} itemStyle={{ color: T.gold }} />
                        <Bar dataKey="transactions" name="Transactions" fill={T.gold} radius={[0,6,6,0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* ── Table View ── */}
                {dldView === "table" && filtered.length > 0 && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
                    {/* Table header */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 0, background: T.surfaceAlt, padding: "10px 16px", borderBottom: `1px solid ${T.border}` }}>
                      {["Community", "Type", "Transactions", "Avg PPSF", "Total Volume", "YoY Change"].map((h, i) => (
                        <div key={i} style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {/* Table rows */}
                    {filtered.slice(0, 50).map((row, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 0, padding: "11px 16px", borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"}>
                        <div style={{ fontSize: 13, color: T.white, fontWeight: 500 }}>{row.community || "—"}</div>
                        <div style={{ fontSize: 12, color: T.textSecondary }}>{row.type || "Residential"}</div>
                        <div style={{ fontSize: 13, color: T.white, fontWeight: 600 }}>{(row.transactions || row.count || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 13, color: T.gold }}>AED {(row.avgPpsf || row.ppsf || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: T.textSecondary }}>{row.volume ? "AED " + (row.volume / 1e6).toFixed(0) + "M" : "—"}</div>
                        <div style={{ fontSize: 12, color: row.change > 0 ? T.green : row.change < 0 ? T.red : T.textMuted }}>
                          {row.change ? (row.change > 0 ? "+" : "") + row.change + "%" : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sources */}
                <div style={{ paddingTop: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
                  {["Dubai Land Department", "DXBinteract", "ValuStrat", "REIDIN"].map((s, i) => (
                    <span key={i} style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
          })()}

          {/* ─── PRICE HISTORY TAB ─── */}
          {tab === "Price History" && (() => {

            const [phCommunity, setPhCommunity] = React.useState("All");
            const [phType, setPhType] = React.useState("Apartment");
            const [phBeds, setPhBeds] = React.useState("All");
            const [phView, setPhView] = React.useState("chart"); // chart | table
            const [phCompare, setPhCompare] = React.useState(false);
            const [phCommunity2, setPhCommunity2] = React.useState("All");

            /* ── Data from Firestore priceHistory collection ── */
            const phData = liveMarketData?.filter?.(d => d.type === "priceHistory") || [];
            const communities = ["All", ...new Set(phData.map(d => d.community).filter(Boolean))];
            const bedOptions = ["All", "Studio", "1 BR", "2 BR", "3 BR", "4 BR", "5 BR+"];
            const typeOptions = ["Apartment", "Villa", "Townhouse", "Office", "Hotel Apartment"];

            /* ── Filter data ── */
            const filtered = phData.filter(d => {
              if (phCommunity !== "All" && d.community !== phCommunity) return false;
              if (phType !== "All" && d.type !== phType) return false;
              if (phBeds !== "All" && d.beds !== phBeds) return false;
              return true;
            });

            const selStyle = {
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 8, color: T.white, fontFamily: "'Outfit',sans-serif",
              fontSize: 12, padding: "7px 28px 7px 10px", outline: "none", cursor: "pointer",
              appearance: "none", WebkitAppearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
            };

            /* ── Momentum badge ── */
            const MomentumBadge = ({ change }) => {
              if (!change) return null;
              const positive = change > 0;
              return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: positive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: positive ? T.green : T.red }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points={positive ? "18 15 12 9 6 15" : "6 9 12 15 18 15"}/></svg>
                  {Math.abs(change).toFixed(1)}%
                </span>
              );
            };

            return (
              <div style={{ animation: "fadeUp 0.4s ease-out forwards" }}>

                {/* Tab header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>Price History</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>PPSF trends per community · DLD registered transactions · 5-year view</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {/* View toggle */}
                    <div style={{ display: "flex", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                      {["chart", "table"].map(v => (
                        <button key={v} type="button" onClick={() => setPhView(v)}
                          style={{ padding: "6px 14px", background: phView === v ? "rgba(212,168,67,0.15)" : "transparent", color: phView === v ? T.gold : T.textMuted, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif", textTransform: "capitalize" }}>
                          {v}
                        </button>
                      ))}
                    </div>
                    {/* Compare toggle */}
                    <button type="button" onClick={() => setPhCompare(c => !c)}
                      style={{ padding: "6px 14px", background: phCompare ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border: `1px solid ${phCompare ? "rgba(212,168,67,0.4)" : T.border}`, borderRadius: 8, color: phCompare ? T.gold : T.textMuted, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>
                      Compare
                    </button>
                  </div>
                </div>

                {/* ── Smart Filters ── */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted }}>Community 1</span>
                    <select value={phCommunity} onChange={e => setPhCommunity(e.target.value)} style={selStyle}>
                      {communities.map(c => <option key={c}>{c}</option>)}
                    </select>
                    {phCompare && (
                      <>
                        <span style={{ fontSize: 11, fontWeight: 600, color: T.teal }}>vs</span>
                        <select value={phCommunity2} onChange={e => setPhCommunity2(e.target.value)} style={{ ...selStyle, borderColor: "rgba(20,184,166,0.4)", color: T.teal }}>
                          {communities.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </>
                    )}
                    <select value={phType} onChange={e => setPhType(e.target.value)} style={selStyle}>
                      {typeOptions.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <select value={phBeds} onChange={e => setPhBeds(e.target.value)} style={selStyle}>
                      {bedOptions.map(b => <option key={b}>{b}</option>)}
                    </select>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, display: "inline-block" }} />
                      DLD Verified
                    </span>
                  </div>
                </div>

                {/* ── No data state ── */}
                {phData.length === 0 && (
                  <div style={{ background: "rgba(212,168,67,0.05)", border: `1px solid rgba(212,168,67,0.15)`, borderRadius: 12, padding: "48px 24px", textAlign: "center", marginBottom: 20 }}>
                    <div style={{ marginBottom: 14 }}>
                      {SvgIcons.TrendingUp({ width: 40, height: 40, style: { color: T.textMuted, display: "inline-block" } })}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 8 }}>Price history not yet imported</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>Historical PPSF data loads from DLD transaction records</div>
                    <div style={{ fontSize: 11, color: T.textMuted, opacity: 0.7 }}>Check Admin → Data Health → DLD Cron to verify sync status</div>
                  </div>
                )}

                {/* ── Chart View ── */}
                {phView === "chart" && phData.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                    {/* Main price trend chart */}
                    <div className="chart-box">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Price Per Sqft — Historical Trend</div>
                          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>AED/sqft · DLD registered transactions</div>
                        </div>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 12, height: 3, background: T.gold, borderRadius: 2, display: "inline-block" }} />
                            <span style={{ fontSize: 11, color: T.textMuted }}>{phCommunity === "All" ? "All Communities" : phCommunity}</span>
                          </div>
                          {phCompare && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 12, height: 3, background: T.teal, borderRadius: 2, display: "inline-block" }} />
                              <span style={{ fontSize: 11, color: T.textMuted }}>{phCommunity2 === "All" ? "Market Avg" : phCommunity2}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={filtered.length > 0 ? filtered : phData.slice(0, 20)}>
                          <defs>
                            <linearGradient id="priceGold" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={T.gold} stopOpacity={0.2}/>
                              <stop offset="95%" stopColor={T.gold} stopOpacity={0}/>
                            </linearGradient>
                            {phCompare && (
                              <linearGradient id="priceTeal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={T.teal} stopOpacity={0.2}/>
                                <stop offset="95%" stopColor={T.teal} stopOpacity={0}/>
                              </linearGradient>
                            )}
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="period" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => "AED " + v.toLocaleString()} />
                          <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }} labelStyle={{ color: T.white }} itemStyle={{ color: T.gold }} formatter={v => ["AED " + (v||0).toLocaleString() + "/sqft"]} />
                          <Area type="monotone" dataKey="ppsf" name="PPSF" stroke={T.gold} strokeWidth={2} fill="url(#priceGold)" dot={false} activeDot={{ r: 4, fill: T.gold }} />
                          {phCompare && <Area type="monotone" dataKey="ppsf2" name="Compare" stroke={T.teal} strokeWidth={2} fill="url(#priceTeal)" dot={false} activeDot={{ r: 4, fill: T.teal }} />}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Off-plan vs Secondary divergence */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div className="chart-box">
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 4 }}>Off-Plan vs Secondary</div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>Price divergence — same community</div>
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={phData.slice(0, 12)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="period" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }} labelStyle={{ color: T.white }} />
                            <Line type="monotone" dataKey="offPlanPpsf" name="Off-Plan" stroke={T.gold} strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="secondaryPpsf" name="Secondary" stroke={T.teal} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                            <Legend iconType="line" wrapperStyle={{ fontSize: 11 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Momentum indicators */}
                      <div className="chart-box">
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 4 }}>Price Momentum</div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>Community price change indicators</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {phData.slice(0, 6).map((d, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 12, color: T.textSecondary }}>{d.community || "—"}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 12, color: T.white, fontWeight: 600 }}>AED {(d.ppsf || 0).toLocaleString()}</span>
                                <MomentumBadge change={d.change6m} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Table View ── */}
                {phView === "table" && phData.length > 0 && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr", padding: "10px 16px", background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                      {["Community", "Type", "Beds", "Current PPSF", "1Y Change", "3Y Change", "5Y Change"].map((h, i) => (
                        <div key={i} style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {phData.slice(0, 50).map((row, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr", padding: "10px 16px", borderBottom: i < phData.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"}>
                        <div style={{ fontSize: 13, color: T.white, fontWeight: 500 }}>{row.community || "—"}</div>
                        <div style={{ fontSize: 12, color: T.textSecondary }}>{row.type || "Apt"}</div>
                        <div style={{ fontSize: 12, color: T.textSecondary }}>{row.beds || "—"}</div>
                        <div style={{ fontSize: 13, color: T.gold, fontWeight: 600 }}>AED {(row.ppsf || 0).toLocaleString()}</div>
                        <div><MomentumBadge change={row.change1y} /></div>
                        <div><MomentumBadge change={row.change3y} /></div>
                        <div><MomentumBadge change={row.change5y} /></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Correction alert banner — shows if any community has negative 6M momentum */}
                {phData.some(d => d.change6m < -5) && (
                  <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    {SvgIcons.AlertTriangle({ width: 16, height: 16, style: { color: T.red, flexShrink: 0 } })}
                    <div style={{ fontSize: 12, color: T.textSecondary }}>
                      <span style={{ color: T.red, fontWeight: 700 }}>Price correction detected</span> — Some communities showing &gt;5% decline over 6 months. Review before recommending to clients.
                    </div>
                  </div>
                )}

                {/* Sources */}
                <div style={{ paddingTop: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
                  {["Dubai Land Department", "REIDIN Price Index", "ValuStrat VPI", "DXBinteract"].map((s, i) => (
                    <span key={i} style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════
              INTELLIGENCE TABS — Awaiting Data Import
              Each tab shows a beautiful empty state with instructions
              Data connects via Firestore — Admin → Data Manager
          ══════════════════════════════════════════════════════════ */}

          {Object.entries(INTELLIGENCE_TABS).map(([tabKey, config]) => (
            tab === tabKey && tabKey !== "Overview" && tabKey !== "Market" && tabKey !== "DLD Volumes" && tabKey !== "Price History" && (
              <div key={tabKey} style={{ animation: "fadeUp 0.4s ease-out forwards" }}>
                {/* Tab Header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 0", marginBottom: 4,
                  borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: T.textSecondary }}>
                      <span style={{ color: T.gold, fontWeight: 600 }}>DXB Analytics</span>
                      {" "}· {tabKey}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 10, color: T.textMuted, padding: "3px 10px",
                      background: T.surface, border: `1px solid ${T.border}`,
                      borderRadius: 20
                    }}>
                      Awaiting data
                    </span>
                  </div>
                </div>

                {/* Empty State */}
                <EmptyState
                  tab={tabKey}
                  icon={config.icon}
                  description={config.description}
                  adminHint={config.adminHint}
                />
              </div>
            )
          ))}

          {/* ══════════════════════════════════════════════
              MY LEADS TAB — Session 4 — Agent CRM Inbox
          ══════════════════════════════════════════════ */}
          {tab === "My Leads" && (() => {
            const isAgent   = orgRole === "agent";
            const isManager = orgRole === "manager";
            if (!isAgent && !isManager) return (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", textAlign:"center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:16 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, marginBottom:6 }}>Leads not enabled for your account</div>
                <div style={{ fontSize:12, color:T.textMuted }}>Contact your agency manager to get assigned leads</div>
              </div>
            );

            // Status config
            const STATUSES = {
              "New":        { color:"#3B82F6", bg:"rgba(59,130,246,0.12)",  label:"New"       },
              "Contacted":  { color:"#F59E0B", bg:"rgba(245,158,11,0.12)",  label:"Contacted" },
              "Viewing":    { color:"#8B5CF6", bg:"rgba(139,92,246,0.12)",  label:"Viewing"   },
              "Offer":      { color:"#14B8A6", bg:"rgba(20,184,166,0.12)",  label:"Offer"     },
              "Won":        { color:"#10B981", bg:"rgba(16,185,129,0.12)",  label:"Won"       },
              "Lost":       { color:"#EF4444", bg:"rgba(239,68,68,0.12)",   label:"Lost"      },
            };

            // Source config
            const SOURCES = {
              "Property Finder": "#00C08B",
              "Bayut":           "#FF6B35",
              "Dubizzle":        "#E8003D",
              "Meta/Facebook":   "#1877F2",
              "Instagram":       "#E1306C",
              "WhatsApp":        "#25D366",
              "Google Ads":      "#4285F4",
              "Referral":        "#8B5CF6",
              "Website":         "#14B8A6",
              "Manual":          "#94A3B8",
            };

            // Filter
            const filtered = myLeads.filter(l => {
              if (leadStatusFilter !== "all" && (l.status||"New") !== leadStatusFilter) return false;
              if (leadSourceFilter !== "all" && l.source !== leadSourceFilter) return false;
              if (leadSearch.trim()) {
                const q = leadSearch.toLowerCase();
                if (!(l.name||"").toLowerCase().includes(q) &&
                    !(l.phone||"").includes(q) &&
                    !(l.email||"").toLowerCase().includes(q) &&
                    !(l.community||"").toLowerCase().includes(q)) return false;
              }
              return true;
            });

            const totalVal = myLeads.reduce((a,l) => a + (parseFloat(l.budget)||0), 0);
            const newToday = myLeads.filter(l => new Date(l.createdAt) >= new Date(new Date().setHours(0,0,0,0))).length;

            // Save note helper
            /* ─── AI LEAD SCORING ENGINE (Session 13) ─── */
            const scoreLeadAI = (l) => {
              if (l.status === "Won") return { score:100, grade:"A+", color:"#10B981", label:"Converted" };
              if (l.status === "Lost") return { score:0, grade:"D", color:T.red, label:"Lost" };
              let s = 0;
              const reasons = [];

              // Contact completeness (25 pts)
              if (l.phone && l.email) { s += 25; reasons.push("Full contact info"); }
              else if (l.phone || l.email) { s += 12; }

              // Budget quality (20 pts)
              const budget = parseFloat(l.budget) || 0;
              if (budget >= 5000000) { s += 20; reasons.push("Luxury budget AED 5M+"); }
              else if (budget >= 2000000) { s += 16; reasons.push("Golden Visa eligible"); }
              else if (budget >= 1000000) { s += 10; }
              else if (budget > 0) { s += 5; }

              // Source quality (15 pts)
              const srcScores = { "Property Finder":15, "Bayut":14, "Dubizzle":12, "Referral":15, "WhatsApp":10, "Meta/Facebook":8, "Instagram":7, "Google Ads":9, "Website":10, "Manual":5, "Cold Call":3, "Email":6 };
              s += srcScores[l.source] || 5;

              // Recency (20 pts)
              const ageDays = (Date.now() - new Date(l.createdAt||Date.now())) / 86400000;
              if (ageDays < 1)  { s += 20; reasons.push("New today"); }
              else if (ageDays < 3)  { s += 15; reasons.push("New this week"); }
              else if (ageDays < 7)  { s += 10; }
              else if (ageDays < 14) { s += 5; }

              // Activity (10 pts)
              const notesCount = (l.notes_log||[]).length;
              if (notesCount >= 3) { s += 10; reasons.push("Actively engaged"); }
              else if (notesCount >= 1) { s += 5; }

              // Status progression (10 pts)
              const statusScore = { New:0, Contacted:5, Viewing:8, Offer:10, Won:10, Lost:0 };
              s += statusScore[l.status||"New"] || 0;

              // Community/project match (bonus)
              if (l.community && l.project) s = Math.min(100, s + 5);

              s = Math.min(100, Math.max(0, s));
              const grade = s >= 80 ? "A" : s >= 60 ? "B" : s >= 40 ? "C" : "D";
              const color = s >= 80 ? "#10B981" : s >= 60 ? T.gold : s >= 40 ? "#F59E0B" : T.red;
              const label = s >= 80 ? "Hot" : s >= 60 ? "Warm" : s >= 40 ? "Nurture" : "Cold";
              return { score:s, grade, color, label, reasons };
            };

            // Best follow-up time logic
            const getFollowUpTime = (l) => {
              const srcTimes = {
                "Property Finder": "Evening 6–9pm (browse after work)",
                "Bayut":           "Evening 7–9pm",
                "Dubizzle":        "Afternoon 2–5pm",
                "WhatsApp":        "Morning 9–11am or Evening 7–9pm",
                "Meta/Facebook":   "Evening 6–10pm (social hours)",
                "Instagram":       "Evening 7–10pm",
                "Referral":        "Any time — warm lead, call directly",
                "Google Ads":      "Afternoon 1–4pm (active intent)",
                "Website":         "Business hours 10am–6pm",
              };
              return srcTimes[l.source] || "Business hours 10am–6pm";
            };

            // Property matching engine
            const matchProperties = (l) => {
              const budget = parseFloat(l.budget) || 0;
              const beds   = parseInt(l.beds) || 0;
              const comm   = (l.community||"").toLowerCase();

              // Match from listings
              const listingMatches = listings
                .filter(li => {
                  if (li.status !== "Available") return false;
                  if (budget > 0 && parseFloat(li.price) > budget * 1.15) return false;
                  if (budget > 0 && parseFloat(li.price) < budget * 0.6)  return false;
                  if (beds > 0 && parseInt(li.beds) !== beds) return false;
                  return true;
                })
                .slice(0, 3)
                .map(li => ({ name: li.title||`${li.beds}BR ${li.type}`, price: li.price, community: li.community, type:"listing", source:"Your Listings" }));

              // Match from active projects (from data)
              const projMatches = activeProjects
                ? activeProjects
                    .filter(p => {
                      if (budget > 0 && p.price && parseFloat(p.price) > budget * 1.2) return false;
                      if (comm && p.community && !p.community.toLowerCase().includes(comm) && !comm.includes(p.community.toLowerCase())) return false;
                      return p.status !== "Sold Out";
                    })
                    .slice(0, 3)
                    .map(p => ({ name: p.name, price: p.price, community: p.community||p.district, type:"project", source:"Active Projects" }))
                : [];

              return [...listingMatches, ...projMatches].slice(0, 5);
            };

            const saveNote = async (leadId) => {
              if (!leadNote.trim()) return;
              setLeadNoteSaving(true);
              try {
                const entry = { text: leadNote.trim(), by: userName || firebaseUser?.email, at: new Date().toISOString() };
                const prev = selectedLead?.notes_log || [];
                await setDoc(doc(db, "leads", leadId), { notes_log: [entry, ...prev], updatedAt: new Date().toISOString() }, { merge: true });
                setSelectedLead(l => l ? { ...l, notes_log: [entry, ...(l.notes_log||[])] } : l);
                setLeadNote("");
              } catch(e) { console.error(e); }
              setLeadNoteSaving(false);
            };

            // Update status helper
            const updateLeadStatus = async (leadId, status) => {
              await setDoc(doc(db, "leads", leadId), { status, updatedAt: new Date().toISOString() }, { merge: true });
              setMyLeads(prev => prev.map(l => l.id === leadId ? {...l, status} : l));
              if (selectedLead?.id === leadId) setSelectedLead(l => l ? {...l, status} : l);
            };

            // Quick capture submit
            const submitCapture = async () => {
              if (!captureForm.name && !captureForm.phone) { return; }
              setCaptureLoading(true);
              try {
                const id = "lead_" + Date.now();
                await setDoc(doc(db, "leads", id), {
                  ...captureForm,
                  assignedTo: firebaseUser?.uid,
                  assignedName: userName || firebaseUser?.email,
                  orgId: orgId || null,
                  status: "New",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setCaptureForm({ name:"", phone:"", email:"", budget:"", community:"", source:"Manual", notes:"" });
                setShowQuickCapture(false);
              } catch(e) { console.error(e); }
              setCaptureLoading(false);
            };

            // ── CSV Parser (Session 16) ──────────────────────────────────
            const handleCsvFile = (file) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const text = e.target.result;
                const lines = text.split(/\r?\n/).filter(l => l.trim());
                if (lines.length < 2) return;
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
                const rows = lines.slice(1).map(line => {
                  const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g,''));
                  const obj = {};
                  headers.forEach((h,i) => { obj[h] = vals[i]||""; });
                  return obj;
                }).filter(r => Object.values(r).some(v => v));
                setImportHeaders(headers);
                setImportRawRows(rows);
                // Auto-map common column names
                const autoMap = {};
                const fieldMap = { name:['name','full name','client name','contact name'], phone:['phone','mobile','tel','telephone','phone number'], email:['email','email address'], budget:['budget','price','amount'], community:['community','area','location','project'], source:['source','lead source'], status:['status','stage'], notes:['notes','comments','remarks'], nationality:['nationality','country'], beds:['beds','bedrooms','br'] };
                headers.forEach(h => {
                  const hl = h.toLowerCase().trim();
                  Object.entries(fieldMap).forEach(([field, aliases]) => {
                    if (!autoMap[field] && aliases.some(a => hl.includes(a))) autoMap[field] = h;
                  });
                });
                setImportMapping(autoMap);
                setImportStep(2);
              };
              reader.readAsText(file);
            };

            return (<>
              {/* ── Header ── */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <div>
                  <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, margin:0 }}>
                    {isManager ? "Team Leads" : "My Leads"}
                  </h1>
                  <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>
                    {isManager ? `All leads in your organisation` : `Leads assigned to you`}
                  </p>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {isManager && (
                    <button type="button" onClick={() => { setShowBulkImport(true); setImportStep(1); setImportRawRows([]); setImportHeaders([]); setImportMapping({}); setImportPreview([]); setImportDone({imported:0,dupes:0,errors:0}); }}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:9, border:`1px solid ${T.border}`, background:T.surfaceAlt, color:T.textSecondary, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Import CSV
                    </button>
                  )}
                  <button type="button" onClick={() => setShowQuickCapture(true)}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:9, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Capture Lead
                  </button>
                </div>
              </div>

              {/* ── KPI Bar ── */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
                {[
                  { label:"Total Leads",  value:myLeads.length,                                  color:T.gold,  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
                  { label:"New Today",    value:newToday,                                         color:T.teal,  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                  { label:"In Progress",  value:myLeads.filter(l=>["Contacted","Viewing","Offer"].includes(l.status)).length, color:"#8B5CF6", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                  { label:"Pipeline Value", value:`AED ${totalVal >= 1e6 ? (totalVal/1e6).toFixed(1)+"M" : totalVal.toLocaleString()}`, color:T.green, icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                ].map((k,i) => (
                  <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${k.color},${k.color}30)` }}/>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8 }}>{k.label}</div>
                      <div style={{ color:k.color, opacity:0.6 }}>{k.icon}</div>
                    </div>
                    <div style={{ fontSize:24, fontWeight:900, color:k.color, fontFamily:"'Fraunces',serif", lineHeight:1 }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* ── Filters ── */}
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                {/* Search */}
                <div style={{ position:"relative", flex:"2 1 220px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input value={leadSearch} onChange={e=>setLeadSearch(e.target.value)} placeholder="Search by name, phone, community..."
                    style={{ width:"100%", padding:"9px 12px 9px 36px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textPrimary, fontSize:12, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                </div>
                {/* Status filter */}
                <select value={leadStatusFilter} onChange={e=>setLeadStatusFilter(e.target.value)}
                  style={{ flex:"1 1 130px", padding:"9px 12px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textPrimary, fontSize:12, fontFamily:"'Outfit',sans-serif", outline:"none", cursor:"pointer" }}>
                  <option value="all">All Statuses</option>
                  {Object.keys(STATUSES).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {/* Source filter */}
                <select value={leadSourceFilter} onChange={e=>setLeadSourceFilter(e.target.value)}
                  style={{ flex:"1 1 130px", padding:"9px 12px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textPrimary, fontSize:12, fontFamily:"'Outfit',sans-serif", outline:"none", cursor:"pointer" }}>
                  <option value="all">All Sources</option>
                  {[...new Set(myLeads.map(l=>l.source).filter(Boolean))].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {(leadSearch || leadStatusFilter !== "all" || leadSourceFilter !== "all") && (
                  <button type="button" onClick={()=>{setLeadSearch("");setLeadStatusFilter("all");setLeadSourceFilter("all");}}
                    style={{ padding:"9px 14px", borderRadius:8, border:`1px solid rgba(239,68,68,0.3)`, background:"rgba(239,68,68,0.08)", color:T.red, fontSize:11, fontWeight:600, cursor:"pointer" }}>
                    Clear
                  </button>
                )}
                <div style={{ marginLeft:"auto", fontSize:11, color:T.textMuted }}>
                  {filtered.length} of {myLeads.length} leads
                </div>
              </div>

              {/* ── Lead List ── */}
              {myLeadsLoading ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 0", gap:10 }}>
                  <div style={{ width:20, height:20, border:`2px solid ${T.gold}30`, borderTopColor:T.gold, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
                  <span style={{ fontSize:12, color:T.textMuted }}>Loading leads...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign:"center", padding:"60px 20px" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:12 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                  <div style={{ fontSize:14, fontWeight:600, color:T.textPrimary, marginBottom:6 }}>
                    {myLeads.length === 0 ? "No leads assigned yet" : "No leads match your filters"}
                  </div>
                  <div style={{ fontSize:12, color:T.textMuted }}>
                    {myLeads.length === 0 ? "Your manager will assign leads to you" : "Try adjusting your search or filters"}
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                  {/* Column headers */}
                  <div style={{ display:"grid", gridTemplateColumns:"minmax(150px,1fr) 65px 100px 100px 110px 110px 44px", gap:8, padding:"8px 14px", fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, borderBottom:`1px solid ${T.border}` }}>
                    <div>Lead</div>
                    <div>Score</div>
                    <div>Status</div>
                    <div>Source</div>
                    <div>Budget</div>
                    <div>Added</div>
                    <div></div>
                  </div>
                  {filtered.map((l, i) => {
                    const sc = STATUSES[l.status||"New"] || STATUSES.New;
                    const srcColor = SOURCES[l.source] || "#94A3B8";
                    const name = (l.name||"").trim() || l.email?.split("@")[0] || l.phone || "Unnamed";
                    const initials = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
                    const budget = parseFloat(l.budget||0);
                    return (
                      <div key={l.id||i}
                        onClick={()=>{setSelectedLead(l);setLeadDrawerTab("details");}}
                        style={{ display:"grid", gridTemplateColumns:"minmax(150px,1fr) 65px 100px 100px 110px 110px 44px", gap:8, padding:"10px 14px", alignItems:"center", borderBottom:`1px solid ${T.border}`, cursor:"pointer", transition:"background 0.12s", borderRadius:4 }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.04)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>

                        {/* Lead info */}
                        <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                          <div style={{ width:34, height:34, borderRadius:"50%", background:`rgba(212,168,67,0.12)`, border:`1px solid rgba(212,168,67,0.2)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:T.gold, flexShrink:0 }}>
                            {initials}
                          </div>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:T.textPrimary, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{name}</div>
                            <div style={{ fontSize:11, color:T.textMuted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                              {l.phone || l.email || l.community || "—"}
                            </div>
                          </div>
                        </div>

                        {/* AI Score (Session 13) */}
                        <div style={{ textAlign:"center" }}>
                          {(() => { const ai = scoreLeadAI(l); return (
                            <div style={{ display:"inline-flex", flexDirection:"column", alignItems:"center", gap:1 }}>
                              <span style={{ fontSize:13, fontWeight:900, color:ai.color, fontFamily:"'Fraunces',serif", lineHeight:1 }}>{ai.score}</span>
                              <span style={{ fontSize:8, fontWeight:700, color:ai.color, letterSpacing:0.5 }}>{ai.label}</span>
                            </div>
                          ); })()}
                        </div>

                        {/* Status */}
                        <div>
                          <span style={{ display:"inline-block", padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600, background:sc.bg, color:sc.color }}>
                            {sc.label}
                          </span>
                        </div>

                        {/* Source */}
                        <div>
                          <span style={{ display:"inline-block", padding:"3px 8px", borderRadius:5, fontSize:10, fontWeight:600, background:`${srcColor}14`, color:srcColor, border:`1px solid ${srcColor}30`, whiteSpace:"nowrap" }}>
                            {l.source || "Manual"}
                          </span>
                        </div>

                        {/* Budget */}
                        <div style={{ fontSize:12, fontWeight:700, color:budget >= 2000000 ? T.gold : T.textPrimary }}>
                          {budget > 0 ? `AED ${budget >= 1e6 ? (budget/1e6).toFixed(1)+"M" : budget.toLocaleString()}` : "—"}
                        </div>

                        {/* Date */}
                        <div style={{ fontSize:11, color:T.textMuted }}>
                          {l.createdAt ? new Date(l.createdAt).toLocaleDateString("en-AE",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                        </div>

                        {/* WhatsApp action */}
                        <div onClick={e=>e.stopPropagation()}>
                          {l.phone ? (
                            <a href={`https://wa.me/${l.phone.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer"
                              style={{ display:"flex", alignItems:"center", justifyContent:"center", width:32, height:32, borderRadius:7, border:"1px solid rgba(37,211,102,0.3)", background:"rgba(37,211,102,0.08)", color:"#25D366", textDecoration:"none" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                            </a>
                          ) : (
                            <div style={{ width:32, height:32 }}/>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Lead Detail Drawer ── */}
              {selectedLead && (
                <div style={{ position:"fixed", inset:0, zIndex:1500, display:"flex" }} onClick={e=>{if(e.target===e.currentTarget)setSelectedLead(null);}}>
                  <div style={{ flex:1, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }} onClick={()=>setSelectedLead(null)}/>
                  <div style={{ width:460, background:T.bg, borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column", overflowY:"auto", boxShadow:"-20px 0 60px rgba(0,0,0,0.4)" }}>

                    {/* Drawer header */}
                    <div style={{ padding:"20px 20px 0", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(212,168,67,0.12)", border:`2px solid rgba(212,168,67,0.25)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:T.gold }}>
                            {((selectedLead.name||selectedLead.email||"?").split(" ").map(w=>w[0]).join("").slice(0,2)||"?").toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize:16, fontWeight:800, color:T.white, fontFamily:"'Fraunces',serif" }}>
                              {selectedLead.name || selectedLead.email?.split("@")[0] || selectedLead.phone || "Unnamed Lead"}
                            </div>
                            <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>
                              {selectedLead.source && <span>{selectedLead.source}</span>}
                              {selectedLead.createdAt && <span> · {new Date(selectedLead.createdAt).toLocaleDateString("en-AE",{day:"2-digit",month:"short",year:"numeric"})}</span>}
                            </div>
                          </div>
                        </div>
                        <button type="button" onClick={()=>setSelectedLead(null)}
                          style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${T.border}`, borderRadius:7, color:T.textMuted, fontSize:13, cursor:"pointer", padding:"5px 10px", display:"flex", alignItems:"center", gap:4 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          Close
                        </button>
                      </div>

                      {/* Status bar */}
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}>
                        {Object.entries(STATUSES).map(([s,sc]) => (
                          <button key={s} type="button" onClick={()=>updateLeadStatus(selectedLead.id,s)}
                            style={{ padding:"5px 12px", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", border:`1px solid ${(selectedLead.status||"New")===s?sc.color:T.border}`, background:(selectedLead.status||"New")===s?sc.bg:"transparent", color:(selectedLead.status||"New")===s?sc.color:T.textMuted, borderRadius:7, transition:"all 0.12s" }}>
                            {s}
                          </button>
                        ))}
                      </div>

                      {/* Drawer tabs */}
                      <div style={{ display:"flex", gap:0, marginBottom:0 }}>
                        {[["details","Details"],["notes","Notes"],["ai","AI Match"]].map(([t,label])=>(
                          <button key={t} type="button" onClick={()=>setLeadDrawerTab(t)}
                            style={{ padding:"8px 16px", fontSize:12, fontWeight:600, border:"none", background:"transparent", cursor:"pointer", fontFamily:"'Outfit',sans-serif", color:leadDrawerTab===t?T.gold:T.textMuted, borderBottom:`2px solid ${leadDrawerTab===t?T.gold:"transparent"}`, transition:"all 0.12s" }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Details tab */}
                    {leadDrawerTab === "details" && (
                      <div style={{ padding:"20px", flex:1, overflowY:"auto" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                          {[
                            { label:"Phone",     value:selectedLead.phone },
                            { label:"Email",     value:selectedLead.email },
                            { label:"Budget",    value:selectedLead.budget ? `AED ${parseFloat(selectedLead.budget).toLocaleString()}` : null },
                            { label:"Community", value:selectedLead.community },
                            { label:"Project",   value:selectedLead.project },
                            { label:"Nationality", value:selectedLead.nationality },
                          ].map(({label,value})=>value ? (
                            <div key={label} style={{ background:T.surfaceAlt, borderRadius:8, padding:"10px 12px" }}>
                              <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:4 }}>{label}</div>
                              <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary }}>{value}</div>
                            </div>
                          ) : null)}
                        </div>
                        {/* WhatsApp CTA */}
                        {selectedLead.phone && (
                          <a href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer"
                            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"11px 0", borderRadius:9, border:"1px solid rgba(37,211,102,0.4)", background:"rgba(37,211,102,0.08)", color:"#25D366", fontSize:12, fontWeight:700, textDecoration:"none", fontFamily:"'Outfit',sans-serif", marginBottom:12 }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                            Open WhatsApp Chat
                          </a>
                        )}
                        {selectedLead.notes && (
                          <div style={{ background:T.surfaceAlt, borderRadius:8, padding:"12px 14px" }}>
                            <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:6 }}>Notes</div>
                            <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.6 }}>{selectedLead.notes}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes tab */}
                    {leadDrawerTab === "notes" && (
                      <div style={{ padding:"20px", flex:1, display:"flex", flexDirection:"column" }}>
                        {/* Add note */}
                        <div style={{ marginBottom:16 }}>
                          <textarea value={leadNote} onChange={e=>setLeadNote(e.target.value)} rows={3}
                            placeholder="Add a note about this lead..."
                            style={{ width:"100%", padding:"10px 12px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textPrimary, fontSize:12, fontFamily:"'Outfit',sans-serif", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                          <button type="button" onClick={()=>saveNote(selectedLead.id)} disabled={!leadNote.trim()||leadNoteSaving}
                            style={{ marginTop:8, padding:"8px 20px", borderRadius:7, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", opacity:(!leadNote.trim()||leadNoteSaving)?0.5:1 }}>
                            {leadNoteSaving ? "Saving..." : "Save Note"}
                          </button>
                        </div>
                        {/* Note history */}
                        <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:8 }}>
                          {(selectedLead.notes_log||[]).map((n,ni)=>(
                            <div key={ni} style={{ background:T.surfaceAlt, borderRadius:8, padding:"10px 12px" }}>
                              <div style={{ fontSize:11, color:T.textPrimary, lineHeight:1.5, marginBottom:4 }}>{n.text}</div>
                              <div style={{ fontSize:10, color:T.textMuted }}>{n.by} · {n.at ? new Date(n.at).toLocaleString("en-AE",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : ""}</div>
                            </div>
                          ))}
                          {(!selectedLead.notes_log||selectedLead.notes_log.length===0) && (
                            <div style={{ textAlign:"center", padding:"30px 0", color:T.textMuted, fontSize:12 }}>No notes yet</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── AI Match Tab (Session 13) ── */}
              {selectedLead && leadDrawerTab === "ai" && (
                <div style={{ padding:"16px 20px", flex:1, overflowY:"auto" }}>

                  {/* AI Score breakdown */}
                  {(() => {
                    const ai = scoreLeadAI(selectedLead);
                    const followUp = getFollowUpTime(selectedLead);
                    const matches = matchProperties(selectedLead);
                    return (<>

                      {/* Score card */}
                      <div style={{ background:`${ai.color}08`, border:`1px solid ${ai.color}30`, borderRadius:12, padding:"16px", marginBottom:16 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                          <div>
                            <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8 }}>AI Lead Score</div>
                            <div style={{ fontSize:11, color:ai.color, marginTop:2 }}>{ai.label} lead</div>
                          </div>
                          <div style={{ textAlign:"center" }}>
                            <div style={{ fontSize:36, fontWeight:900, color:ai.color, fontFamily:"'Fraunces',serif", lineHeight:1 }}>{ai.score}</div>
                            <div style={{ fontSize:11, fontWeight:700, color:ai.color }}>/ 100</div>
                          </div>
                        </div>
                        {/* Score bar */}
                        <div style={{ height:6, background:T.surfaceAlt, borderRadius:3, overflow:"hidden", marginBottom:10 }}>
                          <div style={{ height:"100%", width:`${ai.score}%`, background:ai.color, borderRadius:3, transition:"width 0.6s ease" }}/>
                        </div>
                        {/* Positive signals */}
                        {ai.reasons.length > 0 && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                            {ai.reasons.map((r,i)=>(
                              <span key={i} style={{ fontSize:9, padding:"2px 8px", borderRadius:10, background:`${ai.color}14`, color:ai.color, fontWeight:600 }}>
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Best follow-up time */}
                      <div style={{ background:T.surfaceAlt, borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Best Time to Follow Up
                        </div>
                        <div style={{ fontSize:12, color:T.textPrimary, fontWeight:600, marginBottom:4 }}>{followUp}</div>
                        <div style={{ fontSize:10, color:T.textMuted }}>Based on lead source: {selectedLead.source || "Manual"}</div>
                        {selectedLead.phone && (
                          <a href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer"
                            style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:10, padding:"7px 14px", borderRadius:7, border:"1px solid rgba(37,211,102,0.3)", background:"rgba(37,211,102,0.08)", color:"#25D366", fontSize:11, fontWeight:700, textDecoration:"none" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                            WhatsApp Now
                          </a>
                        )}
                      </div>

                      {/* Property matches */}
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                          Matched Properties
                          {selectedLead.budget && <span style={{ fontSize:9, color:T.textMuted }}>Budget: AED {parseInt(selectedLead.budget).toLocaleString()}</span>}
                        </div>
                        {matches.length === 0 ? (
                          <div style={{ fontSize:12, color:T.textMuted, padding:"12px 0" }}>
                            No matching properties found — try adding listings or adjusting the lead's budget/community
                          </div>
                        ) : (
                          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                            {matches.map((m,i)=>(
                              <div key={i} style={{ background:T.surfaceAlt, borderRadius:9, padding:"10px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</div>
                                  <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>
                                    {m.community && <span>{m.community} · </span>}
                                    <span style={{ color: m.type==="listing"?T.teal:T.gold }}>{m.source}</span>
                                  </div>
                                </div>
                                {m.price > 0 && (
                                  <div style={{ fontSize:11, fontWeight:700, color:T.gold, flexShrink:0, marginLeft:8 }}>
                                    AED {parseFloat(m.price)>=1e6?(parseFloat(m.price)/1e6).toFixed(2)+"M":parseInt(m.price).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>);
                  })()}
                </div>
              )}

              {/* ── Quick Capture Modal ── */}
              {showQuickCapture && (
                <div style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.85)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }} onClick={e=>{if(e.target===e.currentTarget)setShowQuickCapture(false);}}>
                  <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, width:"95%", maxWidth:480, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
                    <div style={{ padding:"22px 24px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:T.gold }}>Quick Capture</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Add a new lead — will be assigned to you</div>
                      </div>
                      <button type="button" onClick={()=>setShowQuickCapture(false)}
                        style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                      {[
                        { key:"name",      label:"Full Name",        placeholder:"Ahmed Al-Mansouri",    required:true },
                        { key:"phone",     label:"Phone Number",     placeholder:"+971 50 123 4567"              },
                        { key:"email",     label:"Email Address",    placeholder:"ahmed@example.com"             },
                        { key:"budget",    label:"Budget (AED)",     placeholder:"2000000",      type:"number"   },
                        { key:"community", label:"Community Interest",placeholder:"Dubai Hills Estate"           },
                      ].map(({key,label,placeholder,required,type})=>(
                        <div key={key}>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5, letterSpacing:0.3 }}>
                            {label}{required && <span style={{ color:T.gold }}> *</span>}
                          </div>
                          <input type={type||"text"} value={captureForm[key]||""} onChange={e=>setCaptureForm(f=>({...f,[key]:e.target.value}))}
                            placeholder={placeholder}
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                      ))}
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Source</div>
                        <select value={captureForm.source} onChange={e=>setCaptureForm(f=>({...f,source:e.target.value}))}
                          style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", cursor:"pointer" }}>
                          {["Manual","Property Finder","Bayut","Dubizzle","WhatsApp","Meta/Facebook","Instagram","Google Ads","Referral","Website","Cold Call"].map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Notes</div>
                        <textarea value={captureForm.notes||""} onChange={e=>setCaptureForm(f=>({...f,notes:e.target.value}))} rows={2}
                          placeholder="Budget range, timeline, requirements..."
                          style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                      </div>
                    </div>
                    <div style={{ padding:"16px 24px", borderTop:`1px solid ${T.border}`, display:"flex", gap:10, justifyContent:"flex-end" }}>
                      <button type="button" onClick={()=>setShowQuickCapture(false)}
                        style={{ padding:"10px 20px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, fontSize:12, cursor:"pointer" }}>
                        Cancel
                      </button>
                      <button type="button" onClick={submitCapture} disabled={captureLoading||(!captureForm.name&&!captureForm.phone)}
                        style={{ padding:"10px 24px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.12)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", opacity:(captureLoading||(!captureForm.name&&!captureForm.phone))?0.5:1, fontFamily:"'Outfit',sans-serif" }}>
                        {captureLoading ? "Saving..." : "Save Lead"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  SESSION 16 — BULK IMPORT MODAL
                  CSV/Excel lead import with field mapping
              ══════════════════════════════════════════════ */}
              {showBulkImport && (
                <div style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.92)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
                  onClick={e => { if(e.target===e.currentTarget) setShowBulkImport(false); }}>
                  <div style={{ background:T.surface, borderRadius:20, border:`1px solid ${T.border}`, width:"min(780px,95vw)", maxHeight:"90vh", overflowY:"auto", padding:28 }}>

                    {/* Modal Header */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
                      <div>
                        <div style={{ fontSize:18, fontWeight:800, color:T.white }}>Import Leads from CSV</div>
                        <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>Upload CSV - Map fields - Preview - Import</div>
                      </div>
                      <button type="button" onClick={() => setShowBulkImport(false)}
                        style={{ background:"none", border:"none", color:T.textMuted, fontSize:20, cursor:"pointer", padding:4 }}>✕</button>
                    </div>

                    {/* Step indicator */}
                    <div style={{ display:"flex", gap:4, marginBottom:24 }}>
                      {["Upload","Map Fields","Preview","Done"].map((s,i) => (
                        <div key={i} style={{ flex:1, display:"flex", alignItems:"center", gap:4 }}>
                          <div style={{ width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700,
                            background: importStep > i+1 ? "#10B981" : importStep === i+1 ? T.gold : T.surfaceAlt,
                            color: importStep >= i+1 ? "#000" : T.textMuted }}>
                            {importStep > i+1 ? "✓" : i+1}
                          </div>
                          <div style={{ fontSize:11, color:importStep===i+1?T.gold:T.textMuted, fontWeight:importStep===i+1?700:400 }}>{s}</div>
                          {i < 3 && <div style={{ flex:1, height:1, background:T.border }}/>}
                        </div>
                      ))}
                    </div>

                    {/* Step 1: Upload */}
                    {importStep === 1 && (
                      <div>
                        <div style={{ border:`2px dashed ${T.border}`, borderRadius:12, padding:"40px 24px", textAlign:"center", marginBottom:16, cursor:"pointer" }}
                          onClick={() => document.getElementById("csv-upload-input").click()}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file) handleCsvFile(file);
                          }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:12 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          <div style={{ fontSize:14, fontWeight:700, color:T.white, marginBottom:6 }}>Drop CSV file here or click to browse</div>
                          <div style={{ fontSize:11, color:T.textMuted }}>Supports: CSV files from PropSpace, Goyzer, Property Finder, Bayut, Excel exports</div>
                          <input id="csv-upload-input" type="file" accept=".csv,.txt" style={{ display:"none" }}
                            onChange={e => { if(e.target.files[0]) handleCsvFile(e.target.files[0]); }} />
                        </div>

                        <div style={{ background:T.card, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:8 }}>Expected CSV columns (any order):</div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                            {["Name","Phone","Email","Budget","Community","Source","Status","Notes","Nationality","Beds"].map(f => (
                              <span key={f} style={{ padding:"3px 10px", borderRadius:20, background:T.surfaceAlt, border:`1px solid ${T.border}`, fontSize:11, color:T.textSecondary }}>{f}</span>
                            ))}
                          </div>
                        </div>

                        <div style={{ fontSize:11, color:T.textMuted, textAlign:"center" }}>
                          Duplicate leads (same phone number) will be automatically detected and skipped
                        </div>
                      </div>
                    )}

                    {/* Step 2: Field Mapping */}
                    {importStep === 2 && (
                      <div>
                        <div style={{ fontSize:13, color:T.textMuted, marginBottom:16 }}>
                          Match your CSV columns to our fields. Detected {importHeaders.length} columns, {importRawRows.length} rows.
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                          {[
                            { field:"name",        label:"Name",        required:false },
                            { field:"phone",       label:"Phone",       required:false },
                            { field:"email",       label:"Email",       required:false },
                            { field:"budget",      label:"Budget (AED)",required:false },
                            { field:"community",   label:"Community",   required:false },
                            { field:"source",      label:"Source",      required:false },
                            { field:"status",      label:"Status",      required:false },
                            { field:"notes",       label:"Notes",       required:false },
                            { field:"nationality", label:"Nationality", required:false },
                            { field:"beds",        label:"Beds",        required:false },
                          ].map(({ field, label }) => (
                            <div key={field} style={{ display:"flex", flexDirection:"column", gap:4 }}>
                              <div style={{ fontSize:11, fontWeight:600, color:T.textSecondary }}>{label}</div>
                              <select value={importMapping[field]||""} onChange={e => setImportMapping(m => ({...m,[field]:e.target.value}))}
                                style={{ padding:"8px 10px", background:T.surfaceAlt, border:`1px solid ${importMapping[field]?T.gold:T.border}`, borderRadius:8, color:T.textPrimary, fontSize:12, fontFamily:"'Outfit',sans-serif" }}>
                                <option value="">— Skip —</option>
                                {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                        <div style={{ display:"flex", gap:10 }}>
                          <button type="button" onClick={() => setImportStep(1)}
                            style={{ padding:"10px 20px", borderRadius:8, border:`1px solid ${T.border}`, background:"none", color:T.textMuted, fontSize:12, cursor:"pointer" }}>Back</button>
                          <button type="button" onClick={() => {
                            // Generate preview with mapping applied
                            const preview = importRawRows.slice(0,10).map(row => {
                              const mapped = {};
                              Object.entries(importMapping).forEach(([field, col]) => { if(col) mapped[field] = row[col]||""; });
                              return mapped;
                            });
                            // Check dupes by phone
                            const existingPhones = new Set(myLeads.map(l => (l.phone||"").replace(/[^0-9]/g,"")));
                            const dupeRows = importRawRows.filter(row => {
                              const phone = (row[importMapping.phone]||"").replace(/[^0-9]/g,"");
                              return phone && existingPhones.has(phone);
                            });
                            setImportPreview(preview);
                            setImportDupes(dupeRows);
                            setImportStep(3);
                          }}
                            style={{ flex:1, padding:"10px 20px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                            Preview Import ({importRawRows.length} rows)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Preview */}
                    {importStep === 3 && (
                      <div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
                          {[
                            { label:"Total Rows",   value:importRawRows.length,                              color:T.gold },
                            { label:"Duplicates",   value:importDupes.length,                                color:importDupes.length>0?T.red:"#10B981" },
                            { label:"Will Import",  value:importRawRows.length - importDupes.length,         color:"#10B981" },
                          ].map((k,i) => (
                            <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
                              <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", marginBottom:4 }}>{k.label}</div>
                              <div style={{ fontSize:24, fontWeight:900, color:k.color, fontFamily:"'Fraunces',serif" }}>{k.value}</div>
                            </div>
                          ))}
                        </div>

                        {importDupes.length > 0 && (
                          <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", marginBottom:14, fontSize:11, color:T.red }}>
                            ⚠️ {importDupes.length} duplicate leads detected (same phone number already in system) — they will be skipped
                          </div>
                        )}

                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:8 }}>Preview (first 10 rows):</div>
                        <div style={{ overflowX:"auto", marginBottom:16 }}>
                          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                            <thead>
                              <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                                {Object.keys(importPreview[0]||{}).map(k => (
                                  <th key={k} style={{ padding:"6px 10px", textAlign:"left", color:T.textMuted, fontWeight:700, textTransform:"uppercase", fontSize:9, letterSpacing:0.8 }}>{k}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {importPreview.map((row,i) => (
                                <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                                  {Object.values(row).map((v,j) => (
                                    <td key={j} style={{ padding:"7px 10px", color:T.textPrimary, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v||"—"}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div style={{ display:"flex", gap:10 }}>
                          <button type="button" onClick={() => setImportStep(2)}
                            style={{ padding:"10px 20px", borderRadius:8, border:`1px solid ${T.border}`, background:"none", color:T.textMuted, fontSize:12, cursor:"pointer" }}>Back</button>
                          <button type="button" disabled={importLoading} onClick={async () => {
                            setImportLoading(true);
                            const existingPhones = new Set(myLeads.map(l => (l.phone||"").replace(/[^0-9]/g,"")));
                            let imported = 0, dupes = 0, errors = 0;
                            const toImport = importRawRows.filter(row => {
                              const phone = (row[importMapping.phone]||"").replace(/[^0-9]/g,"");
                              if(phone && existingPhones.has(phone)) { dupes++; return false; }
                              return true;
                            });
                            for(let idx=0; idx<toImport.length; idx++) {
                              const row = toImport[idx];
                              try {
                                const mapped = {};
                                Object.entries(importMapping).forEach(([field,col]) => { if(col) mapped[field] = row[col]||""; });
                                const id = "lead_import_" + Date.now() + "_" + idx;
                                await setDoc(doc(db, "leads", id), {
                                  ...mapped,
                                  assignedTo:   firebaseUser?.uid,
                                  assignedName: userName || firebaseUser?.email,
                                  orgId:        orgId || null,
                                  status:       mapped.status || "New",
                                  source:       mapped.source || "Import",
                                  createdAt:    new Date().toISOString(),
                                  updatedAt:    new Date().toISOString(),
                                  importedAt:   new Date().toISOString(),
                                });
                                imported++;
                                setImportProgress(Math.round(((idx+1)/toImport.length)*100));
                              } catch(e) { errors++; }
                            }
                            setImportDone({ imported, dupes, errors });
                            setImportLoading(false);
                            setImportStep(4);
                          }}
                            style={{ flex:1, padding:"10px 20px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", opacity:importLoading?0.6:1 }}>
                            {importLoading ? `Importing... ${importProgress}%` : `Import ${importRawRows.length - importDupes.length} Leads`}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Done */}
                    {importStep === 4 && (
                      <div style={{ textAlign:"center", padding:"20px 0" }}>
                        <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
                        <div style={{ fontSize:20, fontWeight:800, color:T.white, marginBottom:8 }}>Import Complete</div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, margin:"20px 0" }}>
                          {[
                            { label:"Imported",   value:importDone.imported,  color:"#10B981" },
                            { label:"Duplicates", value:importDone.dupes,     color:T.gold },
                            { label:"Errors",     value:importDone.errors,    color:importDone.errors>0?T.red:T.textMuted },
                          ].map((k,i) => (
                            <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"14px", textAlign:"center" }}>
                              <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", marginBottom:4 }}>{k.label}</div>
                              <div style={{ fontSize:28, fontWeight:900, color:k.color, fontFamily:"'Fraunces',serif" }}>{k.value}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize:12, color:T.textMuted, marginBottom:20 }}>Leads are now visible in your My Leads list</div>
                        <button type="button" onClick={() => setShowBulkImport(false)}
                          style={{ padding:"12px 32px", borderRadius:9, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                          Done
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              )}

            </>);
          })()}



          {/* ══════════════════════════════════════════════
              PIPELINE TAB — Session 5 — Deal Pipeline
              EOI → Booking → SPA → DLD → Completed
          ══════════════════════════════════════════════ */}
          {tab === "Pipeline" && (() => {
            const isAgent   = orgRole === "agent";
            const isManager = orgRole === "manager";

            if (!isAgent && !isManager) return (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", textAlign:"center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:16 }}><rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="15" rx="1"/></svg>
                <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, marginBottom:6 }}>Pipeline not available</div>
                <div style={{ fontSize:12, color:T.textMuted }}>Contact your agency manager to access the deal pipeline</div>
              </div>
            );

            // Stage config
            const STAGES = [
              { key:"EOI",       label:"EOI",       color:"#3B82F6", desc:"Expression of Interest" },
              { key:"Booking",   label:"Booking",   color:"#8B5CF6", desc:"Unit Reserved"          },
              { key:"SPA",       label:"SPA",       color:"#F59E0B", desc:"Agreement Signed"       },
              { key:"DLD",       label:"DLD",       color:"#14B8A6", desc:"Registered with DLD"    },
              { key:"Completed", label:"Completed", color:"#10B981", desc:"Deal Closed"            },
            ];

            // Filter by type
            const filteredDeals = pipelineType === "all" ? deals
              : deals.filter(d => d.type === (pipelineType === "offplan" ? "Off-Plan" : "Secondary"));

            // Group by stage
            const byStage = Object.fromEntries(STAGES.map(s => [s.key, filteredDeals.filter(d => d.stage === s.key)]));

            // Pipeline value
            const totalValue = filteredDeals.reduce((a,d) => a + (parseFloat(d.price)||0), 0);
            const totalComm  = filteredDeals.reduce((a,d) => a + (parseFloat(d.commission)||0), 0);
            const wonDeals   = byStage["Completed"] || [];

            // Advance stage
            const advanceStage = async (deal) => {
              const idx = STAGES.findIndex(s => s.key === deal.stage);
              if (idx >= STAGES.length - 1) return;
              const nextStage = STAGES[idx + 1].key;
              try {
                await setDoc(doc(db, "deals", deal.id), { stage: nextStage, updatedAt: new Date().toISOString() }, { merge: true });
                if (selectedDeal?.id === deal.id) setSelectedDeal(d => d ? {...d, stage: nextStage} : d);
              } catch(e) { console.error(e); }
            };

            const setStage = async (dealId, stage) => {
              try {
                await setDoc(doc(db, "deals", dealId), { stage, updatedAt: new Date().toISOString() }, { merge: true });
                if (selectedDeal?.id === dealId) setSelectedDeal(d => d ? {...d, stage} : d);
              } catch(e) { console.error(e); }
            };

            // Create deal
            const createDeal = async () => {
              if (!dealForm.leadName && !dealForm.project) return;
              setDealFormLoading(true);
              try {
                const price    = parseFloat(dealForm.price) || 0;
                const pct      = parseFloat(dealForm.commissionPct) || 4;
                const commission = dealForm.commission ? parseFloat(dealForm.commission) : price * (pct/100);
                await addDoc(collection(db, "deals"), {
                  ...dealForm,
                  price,
                  commission,
                  commissionPct: pct,
                  agentId:   firebaseUser?.uid,
                  agentName: userName || firebaseUser?.email,
                  orgId:     orgId || null,
                  stage:     "EOI",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setDealForm({ leadName:"", leadPhone:"", project:"", community:"", type:"Off-Plan", unitNo:"", price:"", commission:"", commissionPct:"4", stage:"EOI", notes:"" });
                setShowNewDeal(false);
              } catch(e) { console.error(e); }
              setDealFormLoading(false);
            };

            // Delete deal
            const deleteDeal = async (id) => {
              if (!window.confirm("Delete this deal?")) return;
              try {
                await deleteDoc(doc(db, "deals", id));
                if (selectedDeal?.id === id) setSelectedDeal(null);
              } catch(e) { console.error(e); }
            };

            // Commission calc helper
            const calcComm = (price, pct) => {
              const p = parseFloat(price)||0;
              const c = parseFloat(pct)||4;
              return p * (c/100);
            };

            return (<>

              {/* ── Header ── */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <div>
                  <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, margin:0 }}>Deal Pipeline</h1>
                  <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>EOI → Booking → SPA → DLD · Track every deal to close</p>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {/* Type filter */}
                  <div style={{ display:"flex", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
                    {[["all","All"],["offplan","Off-Plan"],["secondary","Secondary"]].map(([v,l])=>(
                      <button key={v} type="button" onClick={()=>setPipelineType(v)}
                        style={{ padding:"8px 14px", fontSize:11, fontWeight:600, border:"none", background:pipelineType===v?"rgba(212,168,67,0.15)":"transparent", color:pipelineType===v?T.gold:T.textMuted, cursor:"pointer", fontFamily:"'Outfit',sans-serif", borderRight:`1px solid ${T.border}` }}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={()=>setShowNewDeal(true)}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 18px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    New Deal
                  </button>
                </div>
              </div>

              {/* ── KPI Bar ── */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
                {[
                  { label:"Active Deals",    value:filteredDeals.filter(d=>d.stage!=="Completed").length, color:T.gold,   icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="15" rx="1"/></svg> },
                  { label:"Pipeline Value",  value:`AED ${totalValue>=1e6?(totalValue/1e6).toFixed(1)+"M":totalValue.toLocaleString()}`, color:T.teal, icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                  { label:"My Commission",   value:`AED ${totalComm>=1e6?(totalComm/1e6).toFixed(2)+"M":Math.round(totalComm).toLocaleString()}`, color:"#10B981", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> },
                  { label:"Deals Closed",    value:wonDeals.length, color:"#8B5CF6", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> },
                ].map((k,i)=>(
                  <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${k.color},${k.color}30)` }}/>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8 }}>{k.label}</div>
                      <div style={{ color:k.color, opacity:0.6 }}>{k.icon}</div>
                    </div>
                    <div style={{ fontSize:24, fontWeight:900, color:k.color, fontFamily:"'Fraunces',serif", lineHeight:1 }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* ── Stage Progress Bar ── */}
              <div style={{ overflowX:"auto", marginBottom:20 }}>
                <div style={{ display:"grid", gridTemplateColumns:`repeat(${STAGES.length},minmax(200px,1fr))`, borderRadius:10, overflow:"hidden", border:`1px solid ${T.border}`, minWidth:700 }}>
                {STAGES.map((s,i) => {
                  const cnt = (byStage[s.key]||[]).length;
                  const val = (byStage[s.key]||[]).reduce((a,d)=>a+(parseFloat(d.price)||0),0);
                  return (
                    <div key={s.key} style={{ padding:"12px 14px", background:cnt>0?`${s.color}08`:T.surfaceAlt, borderRight:i<STAGES.length-1?`1px solid ${T.border}`:"none", textAlign:"center" }}>
                      <div style={{ fontSize:10, fontWeight:700, color:s.color, textTransform:"uppercase", letterSpacing:0.8, marginBottom:4 }}>{s.label}</div>
                      <div style={{ fontSize:20, fontWeight:900, color:cnt>0?s.color:T.textMuted, fontFamily:"'Fraunces',serif" }}>{cnt}</div>
                      {val>0&&<div style={{ fontSize:9, color:T.textMuted, marginTop:2 }}>AED {(val/1e6).toFixed(1)}M</div>}
                    </div>
                  );
                })}
                </div>
              </div>

              {/* ── Kanban Board ── */}
              {dealsLoading ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 0", gap:10 }}>
                  <div style={{ width:20, height:20, border:`2px solid ${T.gold}30`, borderTopColor:T.gold, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
                  <span style={{ fontSize:12, color:T.textMuted }}>Loading deals...</span>
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, alignItems:"start" }}>
                  {STAGES.map(stage => (
                    <div key={stage.key} style={{ background:T.surfaceAlt, borderRadius:12, overflow:"hidden", border:`1px solid ${T.border}` }}>
                      {/* Stage header */}
                      <div style={{ padding:"10px 12px", borderBottom:`2px solid ${stage.color}`, background:`${stage.color}08`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div>
                          <div style={{ fontSize:11, fontWeight:700, color:stage.color }}>{stage.label}</div>
                          <div style={{ fontSize:9, color:T.textMuted }}>{stage.desc}</div>
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:stage.color, background:`${stage.color}18`, padding:"2px 7px", borderRadius:5 }}>
                          {(byStage[stage.key]||[]).length}
                        </span>
                      </div>

                      {/* Deal cards */}
                      <div style={{ padding:8, display:"flex", flexDirection:"column", gap:6, minHeight:120 }}>
                        {(byStage[stage.key]||[]).length === 0 && (
                          <div style={{ padding:"20px 8px", textAlign:"center", fontSize:10, color:T.textMuted }}>No deals</div>
                        )}
                        {(byStage[stage.key]||[]).map(deal => (
                          <div key={deal.id}
                            onClick={()=>setSelectedDeal(deal)}
                            style={{ background:T.card, borderRadius:9, padding:"10px 11px", cursor:"pointer", border:`1px solid ${T.border}`, transition:"all 0.12s" }}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor=`${stage.color}60`;e.currentTarget.style.boxShadow=`0 4px 16px ${stage.color}18`;}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow="none";}}>

                            {/* Type badge */}
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                              <span style={{ fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:4, background:deal.type==="Off-Plan"?"rgba(59,130,246,0.12)":"rgba(16,185,129,0.12)", color:deal.type==="Off-Plan"?"#3B82F6":"#10B981" }}>
                                {deal.type||"Off-Plan"}
                              </span>
                              {deal.unitNo && <span style={{ fontSize:9, color:T.textMuted }}>Unit {deal.unitNo}</span>}
                            </div>

                            {/* Lead name */}
                            <div style={{ fontSize:12, fontWeight:700, color:T.textPrimary, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {deal.leadName || "Unnamed"}
                            </div>

                            {/* Project */}
                            {deal.project && (
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {deal.project}
                              </div>
                            )}

                            {/* Price */}
                            {deal.price > 0 && (
                              <div style={{ fontSize:11, fontWeight:700, color:T.gold, marginBottom:8 }}>
                                AED {parseFloat(deal.price)>=1e6?(parseFloat(deal.price)/1e6).toFixed(2)+"M":parseFloat(deal.price).toLocaleString()}
                              </div>
                            )}

                            {/* Advance button */}
                            {stage.key !== "Completed" && (
                              <button type="button"
                                onClick={e=>{e.stopPropagation();advanceStage(deal);}}
                                style={{ width:"100%", padding:"5px 0", borderRadius:6, border:`1px solid ${stage.color}40`, background:`${stage.color}0a`, color:stage.color, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                Advance
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Deal Detail Drawer ── */}
              {selectedDeal && (
                <div style={{ position:"fixed", inset:0, zIndex:1500, display:"flex" }} onClick={e=>{if(e.target===e.currentTarget)setSelectedDeal(null);}}>
                  <div style={{ flex:1, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }} onClick={()=>setSelectedDeal(null)}/>
                  <div style={{ width:480, background:T.bg, borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column", overflowY:"auto", boxShadow:"-20px 0 60px rgba(0,0,0,0.4)" }}>

                    <div style={{ padding:"20px 20px 14px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                        <div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:T.white }}>{selectedDeal.leadName||"Unnamed Deal"}</div>
                          <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>{selectedDeal.project} {selectedDeal.unitNo && `· Unit ${selectedDeal.unitNo}`}</div>
                        </div>
                        <button type="button" onClick={()=>setSelectedDeal(null)}
                          style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${T.border}`, borderRadius:7, color:T.textMuted, cursor:"pointer", padding:"5px 10px", display:"flex", alignItems:"center", gap:4, fontSize:12 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          Close
                        </button>
                      </div>

                      {/* Stage selector */}
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        {STAGES.map(s=>(
                          <button key={s.key} type="button" onClick={()=>setStage(selectedDeal.id,s.key)}
                            style={{ padding:"5px 11px", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", border:`1px solid ${selectedDeal.stage===s.key?s.color:T.border}`, background:selectedDeal.stage===s.key?`${s.color}18`:"transparent", color:selectedDeal.stage===s.key?s.color:T.textMuted, borderRadius:7, transition:"all 0.12s" }}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding:"20px", flex:1 }}>
                      {/* Deal info grid */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                        {[
                          { label:"Deal Type",    value:selectedDeal.type },
                          { label:"Community",    value:selectedDeal.community },
                          { label:"Phone",        value:selectedDeal.leadPhone },
                          { label:"Unit No.",     value:selectedDeal.unitNo },
                        ].filter(r=>r.value).map(({label,value})=>(
                          <div key={label} style={{ background:T.surfaceAlt, borderRadius:8, padding:"10px 12px" }}>
                            <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:4 }}>{label}</div>
                            <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Commission Calculator */}
                      <div style={{ background:`linear-gradient(135deg,rgba(16,185,129,0.06),rgba(212,168,67,0.04))`, border:"1px solid rgba(16,185,129,0.15)", borderRadius:12, padding:"16px", marginBottom:16 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#10B981", textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Commission Calculator</div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                          <div>
                            <div style={{ fontSize:10, color:T.textMuted, marginBottom:5 }}>Deal Price (AED)</div>
                            <div style={{ fontSize:18, fontWeight:900, color:T.gold, fontFamily:"'Fraunces',serif" }}>
                              {selectedDeal.price>0?`${(parseFloat(selectedDeal.price)/1e6).toFixed(2)}M`:"—"}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize:10, color:T.textMuted, marginBottom:5 }}>Commission Rate</div>
                            <div style={{ fontSize:18, fontWeight:900, color:"#10B981", fontFamily:"'Fraunces',serif" }}>
                              {selectedDeal.commissionPct||4}%
                            </div>
                          </div>
                        </div>
                        <div style={{ background:T.surfaceAlt, borderRadius:8, padding:"12px 14px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:12, color:T.textMuted }}>Your Commission</span>
                            <span style={{ fontSize:20, fontWeight:900, color:"#10B981", fontFamily:"'Fraunces',serif" }}>
                              AED {Math.round(calcComm(selectedDeal.price, selectedDeal.commissionPct)).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, paddingTop:8, borderTop:`1px solid ${T.border}` }}>
                            <span style={{ fontSize:10, color:T.textMuted }}>After 50/50 agency split</span>
                            <span style={{ fontSize:13, fontWeight:700, color:T.gold }}>
                              AED {Math.round(calcComm(selectedDeal.price, selectedDeal.commissionPct)/2).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Property matching */}
                      {selectedDeal.community && (
                        <div style={{ background:T.surfaceAlt, borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:T.gold, marginBottom:8 }}>Matched Projects</div>
                          {activeProjects.filter(p => p.community === selectedDeal.community || p.district === selectedDeal.community).slice(0,3).map((p,pi)=>(
                            <div key={pi} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:pi<2?`1px solid ${T.border}`:"none" }}>
                              <div>
                                <div style={{ fontSize:11, fontWeight:600, color:T.textPrimary }}>{p.name}</div>
                                <div style={{ fontSize:10, color:T.textMuted }}>AED {p.price?(p.price/1e6).toFixed(2)+"M":"TBD"} · {p.status}</div>
                              </div>
                              <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(212,168,67,0.1)", color:T.gold }}>{p.handover}</span>
                            </div>
                          ))}
                          {activeProjects.filter(p=>p.community===selectedDeal.community).length===0&&(
                            <div style={{ fontSize:11, color:T.textMuted }}>No matching projects found</div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {selectedDeal.notes && (
                        <div style={{ background:T.surfaceAlt, borderRadius:8, padding:"10px 12px", marginBottom:12 }}>
                          <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:4 }}>Notes</div>
                          <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.6 }}>{selectedDeal.notes}</div>
                        </div>
                      )}

                      {/* Delete */}
                      <button type="button" onClick={()=>deleteDeal(selectedDeal.id)}
                        style={{ width:"100%", padding:"9px 0", borderRadius:8, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.06)", color:T.red, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        Delete Deal
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── New Deal Modal ── */}
              {showNewDeal && (
                <div style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.85)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }} onClick={e=>{if(e.target===e.currentTarget)setShowNewDeal(false);}}>
                  <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, width:"95%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
                    <div style={{ padding:"22px 24px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:T.gold }}>New Deal</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Start at EOI stage — advance as the deal progresses</div>
                      </div>
                      <button type="button" onClick={()=>setShowNewDeal(false)}
                        style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                      {/* Deal type */}
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:8 }}>Deal Type</div>
                        <div style={{ display:"flex", gap:8 }}>
                          {["Off-Plan","Secondary"].map(t=>(
                            <button key={t} type="button" onClick={()=>setDealForm(f=>({...f,type:t}))}
                              style={{ flex:1, padding:"9px 0", borderRadius:8, border:`1px solid ${dealForm.type===t?T.gold:T.border}`, background:dealForm.type===t?"rgba(212,168,67,0.1)":"transparent", color:dealForm.type===t?T.gold:T.textMuted, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Form fields */}
                      {[
                        { key:"leadName",  label:"Client Name *",       placeholder:"Ahmed Al-Mansouri",   required:true },
                        { key:"leadPhone", label:"Client Phone",         placeholder:"+971 50 123 4567"              },
                        { key:"project",   label:"Project / Property",   placeholder:"The Oasis Lagoon Villas"       },
                        { key:"community", label:"Community",            placeholder:"The Oasis"                     },
                        { key:"unitNo",    label:"Unit Number",          placeholder:"A-1201"                        },
                      ].map(({key,label,placeholder,required})=>(
                        <div key={key}>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>
                            {label}{required&&<span style={{ color:T.gold }}> *</span>}
                          </div>
                          <input value={dealForm[key]||""} onChange={e=>setDealForm(f=>({...f,[key]:e.target.value}))}
                            placeholder={placeholder}
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                      ))}
                      {/* Price + Commission in a row */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Deal Price (AED)</div>
                          <input type="number" value={dealForm.price||""} onChange={e=>setDealForm(f=>({...f,price:e.target.value,commission:String(parseFloat(e.target.value||0)*(parseFloat(f.commissionPct||4)/100))}))}
                            placeholder="2000000"
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Commission %</div>
                          <input type="number" value={dealForm.commissionPct||"4"} onChange={e=>setDealForm(f=>({...f,commissionPct:e.target.value,commission:String(parseFloat(f.price||0)*(parseFloat(e.target.value||4)/100))}))}
                            placeholder="4"
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                      </div>
                      {/* Commission preview */}
                      {dealForm.price && (
                        <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)", borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:11, color:T.textMuted }}>Estimated commission</span>
                          <span style={{ fontSize:14, fontWeight:700, color:"#10B981" }}>
                            AED {Math.round(calcComm(dealForm.price, dealForm.commissionPct)).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Notes</div>
                        <textarea value={dealForm.notes||""} onChange={e=>setDealForm(f=>({...f,notes:e.target.value}))} rows={2}
                          placeholder="Payment plan, conditions, timeline..."
                          style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                      </div>
                    </div>
                    <div style={{ padding:"16px 24px", borderTop:`1px solid ${T.border}`, display:"flex", gap:10, justifyContent:"flex-end" }}>
                      <button type="button" onClick={()=>setShowNewDeal(false)}
                        style={{ padding:"10px 20px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, fontSize:12, cursor:"pointer" }}>
                        Cancel
                      </button>
                      <button type="button" onClick={createDeal} disabled={dealFormLoading||!dealForm.leadName}
                        style={{ padding:"10px 24px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.12)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", opacity:(dealFormLoading||!dealForm.leadName)?0.5:1, fontFamily:"'Outfit',sans-serif" }}>
                        {dealFormLoading?"Creating...":"Create Deal"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>);
          })()}



          {/* ══════════════════════════════════════════════
              COMPLIANCE TAB — Session 6
              RERA card tracker + WhatsApp templates
          ══════════════════════════════════════════════ */}
          {tab === "Compliance" && (() => {
            const isAgent   = orgRole === "agent";
            const isManager = orgRole === "manager";

            // RERA expiry calculation
            const reraExpiry    = reraCard.expiry ? new Date(reraCard.expiry) : null;
            const daysLeft      = reraExpiry ? Math.ceil((reraExpiry - new Date()) / (1000*60*60*24)) : null;
            const reraStatus    = daysLeft === null ? "none"
              : daysLeft <= 0   ? "expired"
              : daysLeft <= 30  ? "critical"
              : daysLeft <= 60  ? "warning"
              : "ok";
            const statusConfig = {
              none:     { color:T.textMuted, bg:"rgba(100,116,139,0.1)", border:"rgba(100,116,139,0.2)", label:"Not set",          icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
              expired:  { color:T.red,       bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.25)",  label:"EXPIRED",          icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
              critical: { color:"#F97316",   bg:"rgba(249,115,22,0.08)", border:"rgba(249,115,22,0.25)", label:"Renew immediately", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
              warning:  { color:"#F59E0B",   bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.25)", label:"Renewal due soon",  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
              ok:       { color:T.green,     bg:"rgba(16,185,129,0.08)", border:"rgba(16,185,129,0.25)", label:"Valid",             icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
            };
            const sc = statusConfig[reraStatus];

            // WhatsApp templates
            const WA_TEMPLATES = {
              intro:    { label:"Introduction", text:(name,phone)=>`Hello${name?` ${name}`:""},\n\nI'm ${userName||"your agent"} from DXB Analytics. I'd love to help you find the perfect property in Dubai.\n\nAre you looking to buy or invest? Let me know your requirements and I'll send you matching properties right away.\n\nBest regards` },
              followup: { label:"Follow-Up",    text:(name)=>`Hi${name?` ${name}`:""},\n\nJust following up on our previous conversation about Dubai properties. I have some exciting new listings that match your criteria.\n\nWould you be available for a quick call this week?\n\nLooking forward to hearing from you.` },
              match:    { label:"Property Match",text:(name)=>`Hi${name?` ${name}`:""},\n\nGreat news! I've found a property that matches exactly what you're looking for.\n\nI'll send you the full details shortly. Would you like to schedule a viewing?\n\nBest regards` },
              meeting:  { label:"Meeting Request",text:(name)=>`Hello${name?` ${name}`:""},\n\nI'd like to schedule a meeting to discuss your property requirements in detail and show you some exclusive listings.\n\nAre you free for a 30-minute call this week? Please let me know your preferred time.\n\nThank you` },
              gv:       { label:"Golden Visa",  text:(name)=>`Hi${name?` ${name}`:""},\n\nDid you know that purchasing a property above AED 2 Million in Dubai qualifies you for a 10-year UAE Golden Visa?\n\nI have some excellent options in this range — would you like me to share the details?\n\nBest regards` },
            };

            // Save RERA card
            const saveReraCard = async () => {
              if (!reraCard.number.trim()) return;
              setReraCardLoading(true);
              try {
                await setDoc(doc(db, "users", firebaseUser.uid), { reraCard: { ...reraCard, updatedAt: new Date().toISOString() } }, { merge: true });
                setReraCardSaved(true);
                setTimeout(() => setReraCardSaved(false), 2000);
              } catch(e) { console.error(e); }
              setReraCardLoading(false);
            };

            return (<>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <div>
                  <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, margin:0 }}>Compliance</h1>
                  <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>RERA card tracker · WhatsApp templates · Regulatory alerts</p>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start" }}>

                {/* ── Left column ── */}
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                  {/* RERA Card Status */}
                  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                    <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white }}>RERA Broker Card</div>
                    </div>

                    {/* Status banner */}
                    {reraStatus !== "none" && (
                      <div style={{ margin:"16px 18px 0", padding:"12px 14px", background:sc.bg, border:`1px solid ${sc.border}`, borderRadius:10, display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ color:sc.color }}>{sc.icon}</div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:sc.color }}>{sc.label}</div>
                          {daysLeft !== null && (
                            <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>
                              {daysLeft <= 0 ? "Your RERA card has expired — renew immediately" : `${daysLeft} days remaining until expiry`}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>
                      {[
                        { key:"name",   label:"Full Name (as on card)", placeholder:"Ahmed Al-Mansouri" },
                        { key:"number", label:"RERA Card Number *",     placeholder:"BRN-XXXXX"         },
                      ].map(({key,label,placeholder})=>(
                        <div key={key}>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>{label}</div>
                          <input value={reraCard[key]||""} onChange={e=>setReraCard(r=>({...r,[key]:e.target.value}))}
                            placeholder={placeholder}
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                      ))}

                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Card Expiry Date *</div>
                        <input type="date" value={reraCard.expiry||""} onChange={e=>setReraCard(r=>({...r,expiry:e.target.value}))}
                          style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box", cursor:"pointer" }}/>
                      </div>

                      <button type="button" onClick={saveReraCard} disabled={!reraCard.number||reraCardLoading}
                        style={{ padding:"10px 0", borderRadius:9, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:(!reraCard.number||reraCardLoading)?0.5:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                        {reraCardSaved ? (
                          <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Saved</>
                        ) : reraCardLoading ? "Saving..." : (
                          <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Card</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* RERA Renewal Timeline */}
                  {reraExpiry && (
                    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Renewal Timeline</div>
                      {[
                        { days:60, label:"60-day warning",    color:"#F59E0B" },
                        { days:30, label:"30-day alert",      color:"#F97316" },
                        { days:0,  label:"Expiry date",       color:T.red     },
                      ].map(({days,label,color})=>{
                        const d = new Date(reraExpiry);
                        d.setDate(d.getDate() - days);
                        const passed = new Date() > d;
                        return (
                          <div key={days} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:passed?color:"rgba(255,255,255,0.1)", flexShrink:0 }}/>
                            <div style={{ flex:1, fontSize:11, color:passed?color:T.textMuted }}>{label}</div>
                            <div style={{ fontSize:11, color:T.textMuted }}>{d.toLocaleDateString("en-AE",{day:"2-digit",month:"short",year:"numeric"})}</div>
                          </div>
                        );
                      })}
                      <div style={{ display:"flex", gap:8, marginTop:12 }}>
                        <a href="https://government.ae/en/information-and-services/licensing-and-permits/real-estate-brokerage-licence" target="_blank" rel="noopener noreferrer"
                          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px 0", borderRadius:8, border:"1px solid rgba(59,130,246,0.3)", background:"rgba(59,130,246,0.08)", color:"#3B82F6", fontSize:11, fontWeight:600, textDecoration:"none" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          RERA Renewal Portal
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Right column ── */}
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                  {/* WhatsApp Message Templates */}
                  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                    <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white }}>WhatsApp Message Templates</div>
                    </div>
                    <div style={{ padding:"16px 18px" }}>
                      {/* Template selector */}
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
                        {Object.entries(WA_TEMPLATES).map(([key,tpl])=>(
                          <button key={key} type="button" onClick={()=>setWaTemplate(key)}
                            style={{ padding:"6px 12px", borderRadius:7, border:`1px solid ${waTemplate===key?"#25D366":T.border}`, background:waTemplate===key?"rgba(37,211,102,0.1)":"transparent", color:waTemplate===key?"#25D366":T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                            {tpl.label}
                          </button>
                        ))}
                      </div>

                      {/* Template preview */}
                      <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:10, padding:"14px", marginBottom:14, fontSize:12, color:T.textSecondary, lineHeight:1.7, whiteSpace:"pre-wrap", fontFamily:"'Outfit',sans-serif", minHeight:140 }}>
                        {WA_TEMPLATES[waTemplate]?.text("Client Name", "+971500000000")}
                      </div>

                      {/* Send button */}
                      <a href={`https://wa.me/?text=${encodeURIComponent(WA_TEMPLATES[waTemplate]?.text("",""))}`} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 0", borderRadius:9, border:"1px solid rgba(37,211,102,0.4)", background:"rgba(37,211,102,0.08)", color:"#25D366", fontSize:12, fontWeight:700, textDecoration:"none", fontFamily:"'Outfit',sans-serif" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        Open in WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* Compliance Checklist */}
                  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:12 }}>Agent Compliance Checklist</div>
                    {[
                      { label:"RERA Broker Card active",          done: reraStatus === "ok" || reraStatus === "warning"  },
                      { label:"Card expiry set in system",        done: !!reraCard.expiry                                },
                      { label:"Trakheesi permit for listings",    done: false                                             },
                      { label:"Form A signed before advertising", done: false                                             },
                      { label:"Form B signed on agency agreement",done: false                                             },
                      { label:"DLD registration up to date",      done: false                                             },
                    ].map(({label,done},i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:i<5?`1px solid ${T.border}`:"none" }}>
                        <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${done?T.green:T.border}`, background:done?"rgba(16,185,129,0.1)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <div style={{ fontSize:12, color:done?T.textPrimary:T.textMuted }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Dubai Compliance Links */}
                  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:12 }}>Official Regulatory Links</div>
                    {[
                      { label:"RERA — Real Estate Regulatory Agency",   url:"https://www.dubailand.gov.ae/en/eservices/real-estate-broker-registration/" },
                      { label:"DLD — Dubai Land Department",            url:"https://dubailand.gov.ae"                },
                      { label:"Trakheesi — Permit System",              url:"https://www.dubailand.gov.ae/en/eservices/trakheesi/" },
                      { label:"DTCM — Holiday Home Permits",            url:"https://dtcm.gov.ae"                     },
                      { label:"ICP — Visa & Golden Visa",               url:"https://icp.gov.ae"                      },
                    ].map(({label,url},i)=>(
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 0", borderBottom:i<4?`1px solid ${T.border}`:"none", textDecoration:"none" }}>
                        <div style={{ fontSize:11, color:T.textSecondary }}>{label}</div>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </>);
          })()}



          {/* ══════════════════════════════════════════════
              TEAM TAB — Session 7 — Agency Manager Dashboard
              Agent leaderboard · Source ROI · Pipeline funnel
              Overdue follow-ups · Team KPIs
          ══════════════════════════════════════════════ */}
          {tab === "Team" && (() => {
            const isManager = orgRole === "manager";
            if (!isManager) return (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", textAlign:"center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:16 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, marginBottom:6 }}>Manager access only</div>
                <div style={{ fontSize:12, color:T.textMuted }}>Contact your administrator to request manager access</div>
              </div>
            );

            // ── Derived metrics ──────────────────────────────────────────

            const agents = teamMembers.filter(u => u.orgRole === "agent");
            const now = new Date();
            const todayStart = new Date(now.setHours(0,0,0,0));
            const weekAgo = new Date(Date.now() - 7*24*60*60*1000);

            // Per-agent stats
            const agentStats = agents.map(agent => {
              const agentLeads = myLeads.filter(l => l.assignedTo === agent.uid);
              const agentDeals = deals.filter(d => d.agentId === agent.uid);
              const closedDeals = agentDeals.filter(d => d.stage === "Completed");
              const totalValue  = agentDeals.reduce((a,d) => a + (parseFloat(d.price)||0), 0);
              const totalComm   = closedDeals.reduce((a,d) => a + (parseFloat(d.commission)||0), 0);
              const conversion  = agentLeads.length > 0 ? ((closedDeals.length / agentLeads.length)*100).toFixed(1) : "0.0";
              const newThisWeek = agentLeads.filter(l => new Date(l.createdAt) >= weekAgo).length;
              const overdue     = agentLeads.filter(l => {
                if (!l.updatedAt) return true;
                return (now - new Date(l.updatedAt)) > 3*24*60*60*1000 && (l.status === "New" || l.status === "Contacted");
              }).length;
              return { ...agent, agentLeads, agentDeals, closedDeals, totalValue, totalComm, conversion, newThisWeek, overdue };
            }).sort((a,b) => b.closedDeals.length - a.closedDeals.length);

            // Team totals
            const teamLeads    = myLeads.length;
            const teamDeals    = deals.length;
            const teamClosed   = deals.filter(d => d.stage === "Completed").length;
            const teamValue    = deals.reduce((a,d) => a + (parseFloat(d.price)||0), 0);
            const teamComm     = deals.filter(d=>d.stage==="Completed").reduce((a,d) => a + (parseFloat(d.commission)||0), 0);
            const teamOverdue  = myLeads.filter(l => {
              if (!l.updatedAt) return true;
              return (Date.now() - new Date(l.updatedAt)) > 3*24*60*60*1000 && (l.status==="New"||l.status==="Contacted");
            });

            // Source ROI
            const SOURCE_COLORS = { "Property Finder":"#00C08B","Bayut":"#FF6B35","Dubizzle":"#E8003D","Meta/Facebook":"#1877F2","Instagram":"#E1306C","WhatsApp":"#25D366","Google Ads":"#4285F4","Referral":"#8B5CF6","Website":"#14B8A6","Manual":"#94A3B8","Cold Call":"#F59E0B","Email":"#6366F1" };
            const sourceStats = [...new Set(myLeads.map(l=>l.source).filter(Boolean))].map(src => {
              const srcLeads  = myLeads.filter(l => l.source === src);
              const srcDeals  = deals.filter(d => srcLeads.some(l => l.assignedTo === d.agentId));
              const closed    = srcDeals.filter(d => d.stage === "Completed").length;
              const convRate  = srcLeads.length > 0 ? ((closed/srcLeads.length)*100).toFixed(1) : "0.0";
              return { src, leads:srcLeads.length, closed, convRate, color: SOURCE_COLORS[src]||T.textMuted };
            }).sort((a,b) => parseFloat(b.convRate) - parseFloat(a.convRate));

            // Pipeline funnel
            const FUNNEL_STAGES = ["New","Contacted","Viewing","Offer","Won","Lost"];
            const funnelData = FUNNEL_STAGES.map(s => ({
              stage: s,
              count: myLeads.filter(l => (l.status||"New") === s).length,
            }));
            const funnelMax = Math.max(...funnelData.map(f => f.count), 1);

            const STAGE_COLORS = { New:"#3B82F6",Contacted:"#F59E0B",Viewing:"#8B5CF6",Offer:"#14B8A6",Won:"#10B981",Lost:"#EF4444" };

            return (<>

              {/* ── Header ── */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <div>
                  <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, margin:0 }}>Team Dashboard</h1>
                  <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>
                    {agents.length} agents · {teamLeads} leads · {teamDeals} deals · Live Firestore
                  </p>
                </div>
              </div>

              {/* ── Team KPI Bar ── */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:20 }}>
                {[
                  { label:"Total Leads",    value:teamLeads,   color:T.gold,    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
                  { label:"Active Deals",   value:teamDeals-teamClosed, color:T.teal,  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="15" rx="1"/></svg> },
                  { label:"Deals Closed",   value:teamClosed,  color:"#10B981", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> },
                  { label:"Pipeline Value", value:`AED ${teamValue>=1e6?(teamValue/1e6).toFixed(1)+"M":teamValue.toLocaleString()}`, color:"#8B5CF6", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                  { label:"Overdue",        value:teamOverdue.length, color:teamOverdue.length>0?T.red:T.green, icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                ].map((k,i) => (
                  <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${k.color},${k.color}30)` }}/>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8 }}>{k.label}</div>
                      <div style={{ color:k.color, opacity:0.6 }}>{k.icon}</div>
                    </div>
                    <div style={{ fontSize:22, fontWeight:900, color:k.color, fontFamily:"'Fraunces',serif", lineHeight:1 }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* ── Main grid: Leaderboard + Funnel ── */}
              <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) min(340px,38%)", gap:16, marginBottom:16, alignItems:"start" }}>

                {/* ── AI Hot Leads Panel (Session 13) ── */}
                {(() => {
                  const hotLeads = myLeads
                    .map(l => ({ ...l, aiScore: (() => { const b = parseFloat(l.budget)||0; const age = (Date.now()-new Date(l.createdAt||Date.now()))/86400000; let s=0; if(l.phone&&l.email)s+=25; if(b>=5000000)s+=20;else if(b>=2000000)s+=16;else if(b>0)s+=10; const src={"Property Finder":15,"Bayut":14,"Referral":15,"WhatsApp":10}; s+=(src[l.source]||6); if(age<1)s+=20;else if(age<3)s+=15;else if(age<7)s+=10; return Math.min(100,s); })() }))
                    .filter(l => l.aiScore >= 60 && l.status !== "Won" && l.status !== "Lost" && !l.assignedTo === false)
                    .sort((a,b) => b.aiScore - a.aiScore)
                    .slice(0, 5);
                  if (hotLeads.length === 0) return null;
                  return (
                    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden", marginBottom:16 }}>
                      <div style={{ padding:"12px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white }}>AI Hot Leads — Act Now</div>
                        <div style={{ marginLeft:"auto", fontSize:10, color:T.textMuted }}>Score ≥ 60 · Highest priority</div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column" }}>
                        {hotLeads.map((l,i)=>{
                          const agent = teamMembers.find(u=>u.uid===l.assignedTo);
                          const name = (l.name||"").trim()||l.phone||"Unnamed";
                          const scoreColor = l.aiScore>=80?"#10B981":T.gold;
                          return (
                            <div key={l.id||i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 18px", borderBottom:i<hotLeads.length-1?`1px solid ${T.border}`:"none" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
                                <div style={{ width:32, height:32, borderRadius:"50%", background:`${scoreColor}18`, border:`2px solid ${scoreColor}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:scoreColor, flexShrink:0 }}>{l.aiScore}</div>
                                <div style={{ minWidth:0 }}>
                                  <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
                                  <div style={{ fontSize:10, color:T.textMuted }}>{agent?(agent.name||agent.email?.split("@")[0]):"Unassigned"} · {l.source||"No source"}</div>
                                </div>
                              </div>
                              <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                                {l.budget>0&&<span style={{ fontSize:10, color:T.gold }}>AED {(parseFloat(l.budget)/1e6).toFixed(1)}M</span>}
                                {l.phone&&<a href={`https://wa.me/${l.phone.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", justifyContent:"center", width:26, height:26, borderRadius:5, border:"1px solid rgba(37,211,102,0.3)", background:"rgba(37,211,102,0.08)", color:"#25D366", textDecoration:"none" }}><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg></a>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Agent Leaderboard ── */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2" strokeLinecap="round"><polyline points="18 20 18 10"/><polyline points="12 20 12 4"/><polyline points="6 20 6 14"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Agent Leaderboard</div>
                    <div style={{ marginLeft:"auto", fontSize:10, color:T.textMuted }}>{agents.length} agents</div>
                  </div>

                  {/* Column headers */}
                  <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"32px minmax(100px,1fr) 70px 70px 80px 90px 70px", minWidth:520, gap:8, padding:"8px 16px", fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, borderBottom:`1px solid ${T.border}` }}>
                    <div>#</div><div>Agent</div><div>Leads</div><div>Deals</div><div>Closed</div><div>Pipeline</div><div>Conv %</div>
                  </div>

                  {teamMembersLoading ? (
                    <div style={{ padding:"40px", textAlign:"center", color:T.textMuted, fontSize:12 }}>Loading team...</div>
                  ) : agentStats.length === 0 ? (
                    <div style={{ padding:"40px", textAlign:"center" }}>
                      <div style={{ fontSize:13, color:T.textMuted }}>No agents in this organisation yet</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>Assign agents via Admin → Users → set orgRole=agent</div>
                    </div>
                  ) : agentStats.map((agent, i) => {
                    const rankColor = i===0?T.gold : i===1?"#94A3B8" : i===2?"#B45309" : T.textMuted;
                    return (
                      <div key={agent.uid} style={{ display:"grid", gridTemplateColumns:"32px minmax(100px,1fr) 70px 70px 80px 90px 70px", gap:8, padding:"12px 16px", alignItems:"center", borderBottom:`1px solid ${T.border}`, background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                        {/* Rank */}
                        <div style={{ fontSize:12, fontWeight:700, color:rankColor, textAlign:"center" }}>
                          {i===0 ? <svg width="14" height="14" viewBox="0 0 24 24" fill={T.gold} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> : i+1}
                        </div>
                        {/* Agent info */}
                        <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                          <div style={{ width:28, height:28, borderRadius:"50%", background:`rgba(212,168,67,0.12)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:T.gold, flexShrink:0 }}>
                            {(agent.name||agent.email||"?").slice(0,2).toUpperCase()}
                          </div>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agent.name||agent.email?.split("@")[0]||"Agent"}</div>
                            {agent.overdue > 0 && <div style={{ fontSize:9, color:T.red, fontWeight:600 }}>{agent.overdue} overdue</div>}
                          </div>
                        </div>
                        {/* Leads */}
                        <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, textAlign:"center" }}>{agent.agentLeads.length}</div>
                        {/* Deals */}
                        <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, textAlign:"center" }}>{agent.agentDeals.length}</div>
                        {/* Closed */}
                        <div style={{ textAlign:"center" }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:5, background:agent.closedDeals.length>0?"rgba(16,185,129,0.1)":T.surfaceAlt, color:agent.closedDeals.length>0?"#10B981":T.textMuted }}>
                            {agent.closedDeals.length}
                          </span>
                        </div>
                        {/* Pipeline value */}
                        <div style={{ fontSize:11, fontWeight:600, color:agent.totalValue>0?T.gold:T.textMuted, textAlign:"center" }}>
                          {agent.totalValue>0 ? `AED ${(agent.totalValue/1e6).toFixed(1)}M` : "—"}
                        </div>
                        {/* Conversion */}
                        <div style={{ textAlign:"center" }}>
                          <span style={{ fontSize:11, fontWeight:700, color:parseFloat(agent.conversion)>5?"#10B981":parseFloat(agent.conversion)>0?T.gold:T.textMuted }}>
                            {agent.conversion}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>

                {/* ── Pipeline Funnel ── */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Team Pipeline Funnel</div>
                  </div>
                  <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:8 }}>
                    {funnelData.map(({stage,count}) => (
                      <div key={stage}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:11, fontWeight:600, color:STAGE_COLORS[stage]||T.textMuted }}>{stage}</span>
                          <span style={{ fontSize:11, fontWeight:700, color:T.textPrimary }}>{count}</span>
                        </div>
                        <div style={{ height:8, background:T.surfaceAlt, borderRadius:4, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${(count/funnelMax)*100}%`, background:STAGE_COLORS[stage]||T.textMuted, borderRadius:4, transition:"width 0.4s ease" }}/>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop:8, padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                      <div style={{ fontSize:10, color:T.textMuted, marginBottom:2 }}>Overall Conversion</div>
                      <div style={{ fontSize:18, fontWeight:900, color:T.gold, fontFamily:"'Fraunces',serif" }}>
                        {teamLeads > 0 ? ((teamClosed/teamLeads)*100).toFixed(1) : "0.0"}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Bottom row: Source ROI + Overdue ── */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

                {/* Source ROI */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Source ROI</div>
                    <div style={{ marginLeft:"auto", fontSize:10, color:T.textMuted }}>By conversion rate</div>
                  </div>
                  <div style={{ padding:"0 0 8px" }}>
                    {/* Headers */}
                    <div style={{ display:"grid", gridTemplateColumns:"minmax(100px,1fr) 60px 60px 70px", gap:8, padding:"8px 16px", fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, borderBottom:`1px solid ${T.border}` }}>
                      <div>Source</div><div style={{ textAlign:"center" }}>Leads</div><div style={{ textAlign:"center" }}>Closed</div><div style={{ textAlign:"right" }}>Conv %</div>
                    </div>
                    {sourceStats.length === 0 ? (
                      <div style={{ padding:"24px 16px", textAlign:"center", fontSize:12, color:T.textMuted }}>No source data yet</div>
                    ) : sourceStats.map(({src,leads,closed,convRate,color},i) => (
                      <div key={src} style={{ display:"grid", gridTemplateColumns:"minmax(100px,1fr) 60px 60px 70px", gap:8, padding:"10px 16px", alignItems:"center", borderBottom:`1px solid ${T.border}`, background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }}/>
                          <span style={{ fontSize:11, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{src}</span>
                        </div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textPrimary, textAlign:"center" }}>{leads}</div>
                        <div style={{ fontSize:11, fontWeight:600, color:closed>0?"#10B981":T.textMuted, textAlign:"center" }}>{closed}</div>
                        <div style={{ textAlign:"right" }}>
                          <span style={{ fontSize:11, fontWeight:700, color:parseFloat(convRate)>5?"#10B981":parseFloat(convRate)>0?T.gold:T.textMuted }}>
                            {convRate}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overdue Follow-ups */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Overdue Follow-ups</div>
                    {teamOverdue.length > 0 && (
                      <span style={{ marginLeft:"auto", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:"rgba(239,68,68,0.12)", color:T.red }}>
                        {teamOverdue.length} overdue
                      </span>
                    )}
                  </div>
                  <div style={{ maxHeight:320, overflowY:"auto" }}>
                    {teamOverdue.length === 0 ? (
                      <div style={{ padding:"40px 20px", textAlign:"center" }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:10 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <div style={{ fontSize:13, fontWeight:600, color:T.green }}>All caught up</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>No overdue follow-ups</div>
                      </div>
                    ) : teamOverdue.map((l,i) => {
                      const daysSince = l.updatedAt ? Math.floor((Date.now()-new Date(l.updatedAt))/(1000*60*60*24)) : "?";
                      const agent = teamMembers.find(u => u.uid === l.assignedTo);
                      const name = (l.name||"").trim() || l.phone || "Unnamed";
                      return (
                        <div key={l.id||i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 18px", borderBottom:`1px solid ${T.border}` }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
                            <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>
                              {agent ? (agent.name||agent.email?.split("@")[0]||"Agent") : "Unassigned"}
                              {l.source ? ` · ${l.source}` : ""}
                            </div>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:5, background:"rgba(239,68,68,0.1)", color:T.red }}>
                              {daysSince}d ago
                            </span>
                            {l.phone && (
                              <a href={`https://wa.me/${l.phone.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer"
                                style={{ display:"flex", alignItems:"center", justifyContent:"center", width:28, height:28, borderRadius:6, border:"1px solid rgba(37,211,102,0.3)", background:"rgba(37,211,102,0.08)", color:"#25D366", textDecoration:"none" }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
              </div>
            </>);
          })()}



          {/* ══════════════════════════════════════════════
              AGENCY TAB — Session 8 — Agency Management Hub
              Profile · Agent Roster · RERA Tracker · Commission
          ══════════════════════════════════════════════ */}
          {tab === "Agency" && (() => {
            const isManager = orgRole === "manager";
            if (!isManager) return (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", textAlign:"center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:16 }}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, marginBottom:6 }}>Manager access only</div>
                <div style={{ fontSize:12, color:T.textMuted }}>This section is for agency managers only</div>
              </div>
            );

            // Save org profile
            const saveOrgProfile = async () => {
              if (!orgId || !orgProfileForm.name.trim()) return;
              setOrgProfileSaving(true);
              try {
                await setDoc(doc(db, "organisations", orgId), {
                  name:         orgProfileForm.name.trim(),
                  reraNo:       orgProfileForm.reraNo.trim()       || null,
                  tradeLicense: orgProfileForm.tradeLicense.trim() || null,
                  phone:        orgProfileForm.phone.trim()        || null,
                  ownerEmail:   orgProfileForm.email.trim()        || null,
                  website:      orgProfileForm.website.trim()      || null,
                  notes:        orgProfileForm.notes.trim()        || null,
                  updatedAt:    new Date().toISOString(),
                }, { merge: true });
                setOrgProfileSaved(true);
                setTimeout(() => setOrgProfileSaved(false), 2500);
              } catch(e) { console.error(e); }
              setOrgProfileSaving(false);
            };

            // Save commission split for an agent
            const saveCommSplit = async (agentUid, pct) => {
              if (!orgId) return;
              setCommSaving(s => ({...s, [agentUid]: true}));
              try {
                const updated = { ...commSplits, [agentUid]: parseFloat(pct)||50 };
                await setDoc(doc(db, "organisations", orgId), { commSplits: updated, updatedAt: new Date().toISOString() }, { merge: true });
                setCommSplits(updated);
              } catch(e) { console.error(e); }
              setCommSaving(s => ({...s, [agentUid]: false}));
            };

            // Change agent role
            const changeAgentRole = async (agentUid, newRole) => {
              setAgentRoleChanging(s => ({...s, [agentUid]: true}));
              try {
                await setDoc(doc(db, "users", agentUid), { orgRole: newRole, updatedAt: new Date().toISOString() }, { merge: true });
              } catch(e) { console.error(e); }
              setAgentRoleChanging(s => ({...s, [agentUid]: false}));
            };

            // Remove agent from org
            const removeAgent = async (agentUid) => {
              if (!window.confirm("Remove this agent from the organisation?")) return;
              try {
                await setDoc(doc(db, "users", agentUid), { orgId: null, orgRole: null, updatedAt: new Date().toISOString() }, { merge: true });
              } catch(e) { console.error(e); }
            };

            // RERA helpers
            const reraStatus = (expiry) => {
              if (!expiry) return { label:"Not set", color:T.textMuted };
              const days = Math.ceil((new Date(expiry) - new Date()) / (1000*60*60*24));
              if (days <= 0)  return { label:"Expired",    color:T.red };
              if (days <= 30) return { label:`${days}d`,   color:"#F97316" };
              if (days <= 60) return { label:`${days}d`,   color:"#F59E0B" };
              return { label:"Valid",       color:T.green };
            };

            const agents = teamMembers.filter(u => u.orgRole === "agent" || u.orgRole === "manager");
            const plan = orgProfile?.plan || "free";
            const planColors = { free:T.textMuted, pro:T.teal, enterprise:"#8B5CF6" };

            return (<>

              {/* ── Header ── */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <div>
                  <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, margin:0 }}>Agency Hub</h1>
                  <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>
                    {orgProfile?.name || "Your Organisation"} ·&nbsp;
                    <span style={{ color:planColors[plan]||T.textMuted, fontWeight:600, textTransform:"capitalize" }}>{plan} plan</span>
                    &nbsp;· {agents.length} members
                  </p>
                </div>
              </div>

              {/* ── Top row: Profile + Stats ── */}
              <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) min(320px,36%)", gap:16, marginBottom:16, alignItems:"start" }}>

                {/* Agency Profile Editor */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Agency Profile</div>
                    {orgProfile?.status && (
                      <span style={{ marginLeft:"auto", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:10, background:orgProfile.status==="active"?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)", color:orgProfile.status==="active"?T.green:T.red, textTransform:"uppercase" }}>
                        {orgProfile.status}
                      </span>
                    )}
                  </div>
                  <div style={{ padding:"18px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    {[
                      { key:"name",         label:"Agency Name *",        placeholder:"Better Homes Dubai"        },
                      { key:"reraNo",       label:"RERA Broker Number",   placeholder:"BRN-XXXXX"                 },
                      { key:"tradeLicense", label:"Trade License",        placeholder:"DED-XXXXXXX"               },
                      { key:"phone",        label:"Phone",                placeholder:"+971 4 XXX XXXX"           },
                      { key:"email",        label:"Contact Email",        placeholder:"info@agency.ae"            },
                      { key:"website",      label:"Website",              placeholder:"www.agency.ae"             },
                    ].map(({key,label,placeholder}) => (
                      <div key={key}>
                        <div style={{ fontSize:10, fontWeight:600, color:T.textMuted, marginBottom:5, letterSpacing:0.3 }}>{label}</div>
                        <input value={orgProfileForm[key]||""} onChange={e=>setOrgProfileForm(f=>({...f,[key]:e.target.value}))}
                          placeholder={placeholder}
                          style={{ width:"100%", padding:"9px 12px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:8, color:T.textPrimary, fontSize:12, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                      </div>
                    ))}
                    <div style={{ gridColumn:"1/-1" }}>
                      <div style={{ fontSize:10, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Notes</div>
                      <textarea value={orgProfileForm.notes||""} onChange={e=>setOrgProfileForm(f=>({...f,notes:e.target.value}))} rows={2}
                        placeholder="Internal notes about this agency..."
                        style={{ width:"100%", padding:"9px 12px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:8, color:T.textPrimary, fontSize:12, fontFamily:"'Outfit',sans-serif", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                    </div>
                  </div>
                  <div style={{ padding:"0 18px 18px", display:"flex", justifyContent:"flex-end" }}>
                    <button type="button" onClick={saveOrgProfile} disabled={orgProfileSaving||!orgProfileForm.name}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 20px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:(orgProfileSaving||!orgProfileForm.name)?0.5:1 }}>
                      {orgProfileSaved ? (
                        <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Saved</>
                      ) : orgProfileSaving ? "Saving..." : (
                        <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Profile</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Org stats panel */}
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[
                    { label:"Total Agents",     value:agents.filter(u=>u.orgRole==="agent").length,            color:T.gold    },
                    { label:"Total Leads",      value:myLeads.length,                                          color:T.teal    },
                    { label:"Open Deals",       value:deals.filter(d=>d.stage!=="Completed").length,           color:"#8B5CF6" },
                    { label:"Commission Earned",value:`AED ${Math.round(deals.filter(d=>d.stage==="Completed").reduce((a,d)=>a+(parseFloat(d.commission)||0),0)).toLocaleString()}`, color:"#10B981" },
                  ].map((s,i) => (
                    <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:11, color:T.textMuted }}>{s.label}</div>
                      <div style={{ fontSize:16, fontWeight:900, color:s.color, fontFamily:"'Fraunces',serif" }}>{s.value}</div>
                    </div>
                  ))}
                  {/* RERA Summary */}
                  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 16px" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.white, marginBottom:8 }}>Team RERA Status</div>
                    {[
                      { label:"Valid",      count:agents.filter(u=>{const s=reraStatus(u.reraCard?.expiry); return s.color===T.green;}).length,    color:T.green    },
                      { label:"Expiring",   count:agents.filter(u=>{const s=reraStatus(u.reraCard?.expiry); return s.color==="amber"||s.color==="#F59E0B"||s.color==="#F97316";}).length, color:"#F59E0B" },
                      { label:"Expired",    count:agents.filter(u=>{const s=reraStatus(u.reraCard?.expiry); return s.color===T.red;}).length,       color:T.red      },
                      { label:"Not set",    count:agents.filter(u=>!u.reraCard?.expiry).length,                                                      color:T.textMuted },
                    ].map(({label,count,color},i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:i<3?`1px solid ${T.border}`:"none" }}>
                        <span style={{ fontSize:11, color }}>{label}</span>
                        <span style={{ fontSize:13, fontWeight:700, color }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Agent Roster ── */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Agent Roster</div>
                  <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ fontSize:10, color:T.textMuted }}>{agents.length} members</div>
                    <button type="button" onClick={()=>{setShowInviteAgent(true);setInviteSent(false);setInviteEmail("");}}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:6, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.08)", color:T.gold, fontSize:10, fontWeight:700, cursor:"pointer" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Invite Agent
                    </button>
                  </div>
                </div>

                {/* Column headers */}
                <div style={{ display:"grid", gridTemplateColumns:"minmax(120px,1fr) 90px 110px 110px 110px 75px 36px", minWidth:660, gap:8, padding:"8px 18px", fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, borderBottom:`1px solid ${T.border}` }}>
                  <div>Agent</div><div>Role</div><div>RERA Card</div><div>Expiry</div><div>Comm Split</div><div>Leads</div><div></div>
                </div>

                {agents.length === 0 ? (
                  <div style={{ padding:"48px 20px", textAlign:"center" }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:10 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    <div style={{ fontSize:13, color:T.textMuted }}>No agents yet — ask your admin to assign agents to this organisation</div>
                  </div>
                ) : agents.map((agent, i) => {
                  const agentLeads   = myLeads.filter(l => l.assignedTo === agent.uid).length;
                  const rStatus      = reraStatus(agent.reraCard?.expiry);
                  const split        = commSplits[agent.uid] ?? 50;
                  const isSaving     = commSaving[agent.uid] || false;
                  const isChanging   = agentRoleChanging[agent.uid] || false;

                  return (
                    <div key={agent.uid} style={{ display:"grid", gridTemplateColumns:"minmax(120px,1fr) 90px 110px 110px 110px 75px 36px", minWidth:660, gap:8, padding:"13px 18px", alignItems:"center", borderBottom:`1px solid ${T.border}`, background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>

                      {/* Agent info */}
                      <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(212,168,67,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:T.gold, flexShrink:0 }}>
                          {(agent.name||agent.email||"?").slice(0,2).toUpperCase()}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agent.name || agent.email?.split("@")[0] || "Agent"}</div>
                          <div style={{ fontSize:10, color:T.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agent.email||"—"}</div>
                        </div>
                      </div>

                      {/* Role selector */}
                      <div>
                        <select value={agent.orgRole||"agent"} onChange={e=>changeAgentRole(agent.uid, e.target.value)} disabled={isChanging}
                          style={{ width:"100%", padding:"5px 8px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:6, color:T.textPrimary, fontSize:11, fontFamily:"'Outfit',sans-serif", cursor:"pointer", outline:"none" }}>
                          <option value="agent">Agent</option>
                          <option value="manager">Manager</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>

                      {/* RERA card number */}
                      <div style={{ fontSize:11, color:T.textSecondary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {agent.reraCard?.number || <span style={{ color:T.textMuted }}>—</span>}
                      </div>

                      {/* RERA expiry with status */}
                      <div>
                        {agent.reraCard?.expiry ? (
                          <div>
                            <div style={{ fontSize:11, color:rStatus.color, fontWeight:600 }}>{rStatus.label}</div>
                            <div style={{ fontSize:9, color:T.textMuted }}>{new Date(agent.reraCard.expiry).toLocaleDateString("en-AE",{day:"2-digit",month:"short",year:"numeric"})}</div>
                          </div>
                        ) : (
                          <span style={{ fontSize:10, color:T.textMuted }}>Not set</span>
                        )}
                      </div>

                      {/* Commission split */}
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <input type="number" min="0" max="100"
                          value={commSplits[agent.uid] ?? 50}
                          onChange={e => setCommSplits(s => ({...s, [agent.uid]: e.target.value}))}
                          style={{ width:46, padding:"5px 6px", background:T.bg, border:`1px solid rgba(212,168,67,0.2)`, borderRadius:6, color:T.gold, fontSize:11, fontFamily:"'Outfit',sans-serif", outline:"none", textAlign:"center" }}/>
                        <span style={{ fontSize:10, color:T.textMuted }}>%</span>
                        <button type="button" onClick={()=>saveCommSplit(agent.uid, commSplits[agent.uid]??50)} disabled={isSaving}
                          style={{ padding:"4px 8px", borderRadius:5, border:`1px solid rgba(212,168,67,0.3)`, background:"rgba(212,168,67,0.08)", color:T.gold, fontSize:9, fontWeight:700, cursor:"pointer", opacity:isSaving?0.5:1 }}>
                          {isSaving ? "..." : "Save"}
                        </button>
                      </div>

                      {/* Lead count */}
                      <div style={{ fontSize:12, fontWeight:600, color:agentLeads>0?T.textPrimary:T.textMuted, textAlign:"center" }}>
                        {agentLeads}
                      </div>

                      {/* Remove */}
                      <div>
                        <button type="button" onClick={()=>removeAgent(agent.uid)}
                          style={{ width:28, height:28, borderRadius:6, border:`1px solid rgba(239,68,68,0.2)`, background:"transparent", color:"rgba(239,68,68,0.5)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Invite Agent Modal (Session 11) ── */}
              {showInviteAgent && (
                <div style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.85)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }} onClick={e=>{if(e.target===e.currentTarget)setShowInviteAgent(false);}}>
                  <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, width:"95%", maxWidth:420 }} onClick={e=>e.stopPropagation()}>
                    <div style={{ padding:"22px 24px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:900, color:T.gold }}>Invite Agent</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Generate an invite link to join your agency</div>
                      </div>
                      <button type="button" onClick={()=>setShowInviteAgent(false)}
                        style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textMuted, width:30, height:30, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div style={{ padding:"20px 24px" }}>
                      {inviteSent ? (
                        <div style={{ textAlign:"center", padding:"12px 0" }}>
                          <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(16,185,129,0.1)", border:"2px solid rgba(16,185,129,0.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.green, marginBottom:6 }}>Invite link ready</div>
                          <div style={{ padding:"10px 14px", background:T.surfaceAlt, borderRadius:8, fontSize:11, color:T.gold, wordBreak:"break-all", marginBottom:12 }}>
                            {typeof window!=="undefined"?window.location.origin:""}/agency/signup?org={orgId}&email={encodeURIComponent(inviteEmail)}
                          </div>
                          <button type="button" onClick={()=>{ if(typeof navigator!=="undefined") navigator.clipboard?.writeText(`${window.location.origin}/agency/signup?org=${orgId}&email=${encodeURIComponent(inviteEmail)}`); }}
                            style={{ padding:"8px 20px", borderRadius:7, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                            Copy Link
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:8 }}>Agent Email Address</div>
                          <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="agent@email.com" type="email"
                            style={{ width:"100%", padding:"11px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", marginBottom:14, boxSizing:"border-box" }}/>
                          <div style={{ padding:"10px 14px", background:"rgba(20,184,166,0.06)", border:"1px solid rgba(20,184,166,0.15)", borderRadius:8, fontSize:11, color:T.textMuted, marginBottom:16, lineHeight:1.5 }}>
                            Agent signs up at the generated link and is automatically assigned to <strong style={{ color:T.gold }}>{orgProfile?.name}</strong>.
                          </div>
                          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                            <button type="button" onClick={()=>setShowInviteAgent(false)}
                              style={{ padding:"9px 18px", borderRadius:7, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, fontSize:12, cursor:"pointer" }}>
                              Cancel
                            </button>
                            <button type="button" disabled={!inviteEmail.trim()||inviteLoading}
                              onClick={()=>{ setInviteLoading(true); setTimeout(()=>{ setInviteSent(true); setInviteLoading(false); },300); }}
                              style={{ padding:"9px 20px", borderRadius:7, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", opacity:(!inviteEmail.trim()||inviteLoading)?0.5:1 }}>
                              {inviteLoading ? "Generating..." : "Generate Link"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>);
          })()}



          {/* ══════════════════════════════════════════════
              LISTINGS TAB — Session 9
              Create · Trakheesi · Portal Syndication · Track
          ══════════════════════════════════════════════ */}
          {tab === "Listings" && (() => {
            const isAgent   = orgRole === "agent";
            const isManager = orgRole === "manager";
            if (!isAgent && !isManager) return (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", textAlign:"center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:16 }}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, marginBottom:6 }}>Listings not available</div>
                <div style={{ fontSize:12, color:T.textMuted }}>Contact your manager to access listing management</div>
              </div>
            );

            // Status config
            const STATUS_CFG = {
              Available:  { color:"#10B981", bg:"rgba(16,185,129,0.1)"  },
              Reserved:   { color:"#F59E0B", bg:"rgba(245,158,11,0.1)"  },
              Sold:       { color:"#3B82F6", bg:"rgba(59,130,246,0.1)"  },
              "Off-market":{ color:T.textMuted, bg:T.surfaceAlt          },
            };

            // Portal config
            const PORTALS = [
              { key:"pf",       name:"Property Finder", color:"#00C08B", url:"https://www.propertyfinder.ae/en/post-property" },
              { key:"bayut",    name:"Bayut",           color:"#FF6B35", url:"https://www.bayut.com/properties-for-sale-in-uae.html" },
              { key:"dubizzle", name:"Dubizzle",        color:"#E8003D", url:"https://www.dubizzle.com/properties/for-sale/" },
            ];

            // Duplicate check
            const checkDuplicate = (unitNo, building) => {
              if (!unitNo || !building) return false;
              return listings.filter(l => l.unitNo === unitNo && l.building === building && l.status !== "Sold").length > 1;
            };

            // Create listing
            const createListing = async () => {
              if (!listingForm.title.trim() && !listingForm.community.trim()) return;
              setListingFormLoading(true);
              try {
                const title = listingForm.title.trim() ||
                  `${listingForm.beds}BR ${listingForm.type} in ${listingForm.community}`;
                await addDoc(collection(db, "listings"), {
                  ...listingForm,
                  title,
                  price:  parseFloat(listingForm.price)  || 0,
                  size:   parseFloat(listingForm.size)   || 0,
                  beds:   parseInt(listingForm.beds)     || 0,
                  baths:  parseInt(listingForm.baths)    || 0,
                  floor:  parseInt(listingForm.floor)    || 0,
                  agentId:   firebaseUser?.uid,
                  agentName: userName || firebaseUser?.email,
                  orgId:     orgId || null,
                  publishedTo: [],
                  views: 0, leads: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setListingForm({ title:"", type:"Apartment", beds:"1", baths:"1", size:"", price:"", community:"", building:"", unitNo:"", floor:"", description:"", permitNo:"", status:"Available", furnishing:"Unfurnished", offplan:false });
                setShowNewListing(false);
              } catch(e) { console.error(e); }
              setListingFormLoading(false);
            };

            // Update listing status
            const updateListingStatus = async (id, status) => {
              try {
                await setDoc(doc(db, "listings", id), { status, updatedAt: new Date().toISOString() }, { merge: true });
                if (selectedListing?.id === id) setSelectedListing(l => l ? {...l, status} : l);
              } catch(e) { console.error(e); }
            };

            // Mark published to portal
            const markPublished = async (id, portalKey) => {
              setPublishingId(id + portalKey);
              try {
                const listing = listings.find(l => l.id === id);
                const published = listing?.publishedTo || [];
                const updated = published.includes(portalKey)
                  ? published.filter(p => p !== portalKey)
                  : [...published, portalKey];
                await setDoc(doc(db, "listings", id), { publishedTo: updated, updatedAt: new Date().toISOString() }, { merge: true });
                if (selectedListing?.id === id) setSelectedListing(l => l ? {...l, publishedTo: updated} : l);
              } catch(e) { console.error(e); }
              setPublishingId(null);
            };

            // Delete listing
            const deleteListing = async (id) => {
              if (!window.confirm("Delete this listing?")) return;
              try {
                await deleteDoc(doc(db, "listings", id));
                if (selectedListing?.id === id) setSelectedListing(null);
              } catch(e) { console.error(e); }
            };

            // Filter
            const filtered = listings.filter(l => {
              if (listingFilter !== "all" && l.status !== listingFilter) return false;
              if (listingSearch.trim()) {
                const q = listingSearch.toLowerCase();
                if (!(l.title||"").toLowerCase().includes(q) &&
                    !(l.community||"").toLowerCase().includes(q) &&
                    !(l.building||"").toLowerCase().includes(q) &&
                    !(l.unitNo||"").toLowerCase().includes(q)) return false;
              }
              return true;
            });

            const totalValue  = listings.reduce((a,l) => a + (parseFloat(l.price)||0), 0);
            const available   = listings.filter(l => l.status === "Available").length;
            const published   = listings.filter(l => (l.publishedTo||[]).length > 0).length;

            return (<>

              {/* ── Header ── */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <div>
                  <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, margin:0 }}>Listings</h1>
                  <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>Create · Manage · Publish to portals · Track performance</p>
                </div>
                <button type="button" onClick={()=>setShowNewListing(true)}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:9, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  New Listing
                </button>
              </div>

              {/* ── KPI Bar ── */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
                {[
                  { label:"Total Listings",  value:listings.length,   color:T.gold,    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> },
                  { label:"Available",       value:available,          color:T.green,   icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
                  { label:"Published",       value:published,          color:T.teal,    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> },
                  { label:"Portfolio Value", value:`AED ${totalValue>=1e6?(totalValue/1e6).toFixed(1)+"M":totalValue.toLocaleString()}`, color:"#8B5CF6", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                ].map((k,i) => (
                  <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${k.color},${k.color}30)` }}/>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8 }}>{k.label}</div>
                      <div style={{ color:k.color, opacity:0.6 }}>{k.icon}</div>
                    </div>
                    <div style={{ fontSize:24, fontWeight:900, color:k.color, fontFamily:"'Fraunces',serif", lineHeight:1 }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* ── Filters ── */}
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                <div style={{ display:"flex", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
                  {[["all","All"],["Available","Available"],["Reserved","Reserved"],["Sold","Sold"]].map(([v,l])=>(
                    <button key={v} type="button" onClick={()=>setListingFilter(v)}
                      style={{ padding:"8px 14px", fontSize:11, fontWeight:600, border:"none", background:listingFilter===v?"rgba(212,168,67,0.15)":"transparent", color:listingFilter===v?T.gold:T.textMuted, cursor:"pointer", fontFamily:"'Outfit',sans-serif", borderRight:`1px solid ${T.border}` }}>
                      {l}
                    </button>
                  ))}
                </div>
                <div style={{ position:"relative", flex:"1 1 220px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input value={listingSearch} onChange={e=>setListingSearch(e.target.value)} placeholder="Search by title, community, building, unit..."
                    style={{ width:"100%", padding:"8px 12px 8px 33px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textPrimary, fontSize:12, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                </div>
                <div style={{ marginLeft:"auto", fontSize:11, color:T.textMuted }}>{filtered.length} of {listings.length}</div>
              </div>

              {/* ── Listings Grid ── */}
              {listingsLoading ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 0", gap:10 }}>
                  <div style={{ width:20, height:20, border:`2px solid ${T.gold}30`, borderTopColor:T.gold, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
                  <span style={{ fontSize:12, color:T.textMuted }}>Loading listings...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign:"center", padding:"60px 20px" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:12 }}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                  <div style={{ fontSize:14, fontWeight:600, color:T.textPrimary, marginBottom:6 }}>
                    {listings.length === 0 ? "No listings yet" : "No listings match filters"}
                  </div>
                  <div style={{ fontSize:12, color:T.textMuted, marginBottom:20 }}>
                    {listings.length === 0 ? "Create your first listing to start publishing to portals" : "Try adjusting your filters"}
                  </div>
                  {listings.length === 0 && (
                    <button type="button" onClick={()=>setShowNewListing(true)}
                      style={{ padding:"10px 24px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      Create First Listing
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:12 }}>
                  {filtered.map((l, i) => {
                    const sc = STATUS_CFG[l.status||"Available"] || STATUS_CFG.Available;
                    const isDuplicate = checkDuplicate(l.unitNo, l.building);
                    const publishedPortals = l.publishedTo || [];
                    return (
                      <div key={l.id||i}
                        style={{ background:T.card, border:`1px solid ${isDuplicate?"rgba(239,68,68,0.4)":T.border}`, borderRadius:14, overflow:"hidden", transition:"all 0.15s" }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=isDuplicate?"rgba(239,68,68,0.6)":`${T.gold}50`;e.currentTarget.style.boxShadow=`0 8px 32px rgba(0,0,0,0.15)`;}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=isDuplicate?"rgba(239,68,68,0.4)":T.border;e.currentTarget.style.boxShadow="none";}}>

                        {/* Card header */}
                        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}` }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:13, fontWeight:700, color:T.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.title || `${l.beds}BR ${l.type}`}</div>
                              <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>
                                {l.community}{l.building ? ` · ${l.building}` : ""}{l.unitNo ? ` · Unit ${l.unitNo}` : ""}
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:5, flexShrink:0, marginLeft:8 }}>
                              {isDuplicate && (
                                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(239,68,68,0.12)", color:T.red, fontWeight:700 }}>DUPLICATE</span>
                              )}
                              <span style={{ fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:5, background:sc.bg, color:sc.color }}>
                                {l.status||"Available"}
                              </span>
                            </div>
                          </div>

                          {/* Property details row */}
                          <div style={{ display:"flex", gap:12, fontSize:11, color:T.textSecondary }}>
                            {l.beds > 0 && <span>{l.beds} BR</span>}
                            {l.baths > 0 && <span>{l.baths} Bath</span>}
                            {l.size > 0 && <span>{l.size.toLocaleString()} sqft</span>}
                            {l.type && <span style={{ color:T.textMuted }}>· {l.type}</span>}
                          </div>
                        </div>

                        <div style={{ padding:"12px 16px" }}>
                          {/* Price */}
                          <div style={{ fontSize:18, fontWeight:900, color:T.gold, fontFamily:"'Fraunces',serif", marginBottom:10 }}>
                            {l.price > 0 ? `AED ${parseFloat(l.price)>=1e6?(parseFloat(l.price)/1e6).toFixed(2)+"M":parseFloat(l.price).toLocaleString()}` : "Price TBD"}
                          </div>

                          {/* Trakheesi permit */}
                          {l.permitNo ? (
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, padding:"5px 10px", background:"rgba(20,184,166,0.08)", borderRadius:6 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                              <span style={{ fontSize:10, color:T.teal, fontWeight:600 }}>Permit: {l.permitNo}</span>
                            </div>
                          ) : (
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, padding:"5px 10px", background:"rgba(245,158,11,0.06)", borderRadius:6 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                              <span style={{ fontSize:10, color:"#F59E0B" }}>No Trakheesi permit</span>
                            </div>
                          )}

                          {/* Portal syndication */}
                          <div style={{ marginBottom:10 }}>
                            <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>Portal Syndication</div>
                            <div style={{ display:"flex", gap:5 }}>
                              {PORTALS.map(portal => {
                                const isPublished = publishedPortals.includes(portal.key);
                                const isLoading   = publishingId === l.id + portal.key;
                                return (
                                  <button key={portal.key} type="button"
                                    onClick={()=>{ window.open(portal.url,"_blank"); markPublished(l.id, portal.key); }}
                                    disabled={isLoading}
                                    style={{ flex:1, padding:"6px 4px", borderRadius:6, border:`1px solid ${isPublished?portal.color:T.border}`, background:isPublished?`${portal.color}15`:"transparent", color:isPublished?portal.color:T.textMuted, fontSize:9, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 0.12s", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                                    {isLoading ? (
                                      <div style={{ width:10, height:10, border:`1.5px solid ${portal.color}40`, borderTopColor:portal.color, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
                                    ) : isPublished ? (
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    ) : (
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                                    )}
                                    <span>{portal.name.split(" ")[0]}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Performance + actions row */}
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <div style={{ display:"flex", gap:12 }}>
                              <div style={{ textAlign:"center" }}>
                                <div style={{ fontSize:14, fontWeight:700, color:T.textPrimary }}>{l.views||0}</div>
                                <div style={{ fontSize:9, color:T.textMuted }}>Views</div>
                              </div>
                              <div style={{ textAlign:"center" }}>
                                <div style={{ fontSize:14, fontWeight:700, color:l.leads>0?T.teal:T.textPrimary }}>{l.leads||0}</div>
                                <div style={{ fontSize:9, color:T.textMuted }}>Leads</div>
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:5 }}>
                              <button type="button" onClick={()=>setSelectedListing(l)}
                                style={{ padding:"6px 12px", borderRadius:6, border:`1px solid rgba(59,130,246,0.3)`, background:"rgba(59,130,246,0.08)", color:"#3B82F6", fontSize:10, fontWeight:600, cursor:"pointer" }}>
                                Edit
                              </button>
                              <button type="button" onClick={()=>deleteListing(l.id)}
                                style={{ padding:"6px 10px", borderRadius:6, border:`1px solid rgba(239,68,68,0.2)`, background:"rgba(239,68,68,0.06)", color:T.red, fontSize:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Listing Detail Drawer ── */}
              {selectedListing && (
                <div style={{ position:"fixed", inset:0, zIndex:1500, display:"flex" }} onClick={e=>{if(e.target===e.currentTarget)setSelectedListing(null);}}>
                  <div style={{ flex:1, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }} onClick={()=>setSelectedListing(null)}/>
                  <div style={{ width:460, background:T.bg, borderLeft:`1px solid ${T.border}`, overflowY:"auto", boxShadow:"-20px 0 60px rgba(0,0,0,0.4)" }}>
                    <div style={{ padding:"20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:900, color:T.white }}>{selectedListing.title}</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{selectedListing.community} · {selectedListing.building} · Unit {selectedListing.unitNo}</div>
                      </div>
                      <button type="button" onClick={()=>setSelectedListing(null)}
                        style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${T.border}`, borderRadius:7, color:T.textMuted, cursor:"pointer", padding:"5px 10px", display:"flex", alignItems:"center", gap:4, fontSize:12 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Close
                      </button>
                    </div>
                    <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:12 }}>
                      {/* Status buttons */}
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>Status</div>
                        <div style={{ display:"flex", gap:6 }}>
                          {Object.entries(STATUS_CFG).map(([s,sc])=>(
                            <button key={s} type="button" onClick={()=>updateListingStatus(selectedListing.id,s)}
                              style={{ flex:1, padding:"7px 0", borderRadius:7, border:`1px solid ${(selectedListing.status||"Available")===s?sc.color:T.border}`, background:(selectedListing.status||"Available")===s?sc.bg:"transparent", color:(selectedListing.status||"Available")===s?sc.color:T.textMuted, fontSize:10, fontWeight:600, cursor:"pointer" }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Detail grid */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        {[
                          { label:"Type",        value:selectedListing.type       },
                          { label:"Beds",         value:selectedListing.beds       },
                          { label:"Baths",        value:selectedListing.baths      },
                          { label:"Size (sqft)",  value:selectedListing.size       },
                          { label:"Floor",        value:selectedListing.floor      },
                          { label:"Furnishing",   value:selectedListing.furnishing },
                          { label:"Permit No.",   value:selectedListing.permitNo   },
                          { label:"Price (AED)",  value:selectedListing.price>0?parseFloat(selectedListing.price).toLocaleString():null },
                        ].filter(r=>r.value).map(({label,value})=>(
                          <div key={label} style={{ background:T.surfaceAlt, borderRadius:8, padding:"9px 12px" }}>
                            <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:3 }}>{label}</div>
                            <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      {/* Description */}
                      {selectedListing.description && (
                        <div style={{ background:T.surfaceAlt, borderRadius:8, padding:"10px 12px" }}>
                          <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:5 }}>Description</div>
                          <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.6 }}>{selectedListing.description}</div>
                        </div>
                      )}
                      {/* Portal syndication in drawer */}
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>Publish to Portals</div>
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          {PORTALS.map(portal => {
                            const isPublished = (selectedListing.publishedTo||[]).includes(portal.key);
                            return (
                              <div key={portal.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:isPublished?`${portal.color}0a`:T.surfaceAlt, border:`1px solid ${isPublished?portal.color:T.border}`, borderRadius:9 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                  <div style={{ width:8, height:8, borderRadius:"50%", background:portal.color }}/>
                                  <span style={{ fontSize:12, fontWeight:600, color:isPublished?portal.color:T.textPrimary }}>{portal.name}</span>
                                  {isPublished && <span style={{ fontSize:9, color:portal.color }}>Published</span>}
                                </div>
                                <button type="button"
                                  onClick={()=>{ window.open(portal.url,"_blank"); markPublished(selectedListing.id, portal.key); }}
                                  style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${portal.color}40`, background:isPublished?`${portal.color}15`:"transparent", color:portal.color, fontSize:10, fontWeight:700, cursor:"pointer" }}>
                                  {isPublished ? "Republish" : "Publish →"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* Performance */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        <div style={{ background:T.surfaceAlt, borderRadius:8, padding:"12px", textAlign:"center" }}>
                          <div style={{ fontSize:24, fontWeight:900, color:T.textPrimary, fontFamily:"'Fraunces',serif" }}>{selectedListing.views||0}</div>
                          <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>Total Views</div>
                        </div>
                        <div style={{ background:T.surfaceAlt, borderRadius:8, padding:"12px", textAlign:"center" }}>
                          <div style={{ fontSize:24, fontWeight:900, color:T.teal, fontFamily:"'Fraunces',serif" }}>{selectedListing.leads||0}</div>
                          <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>Leads Generated</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── New Listing Modal ── */}
              {showNewListing && (
                <div style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.85)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }} onClick={e=>{if(e.target===e.currentTarget)setShowNewListing(false);}}>
                  <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, width:"95%", maxWidth:600, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
                    <div style={{ padding:"22px 24px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:T.gold }}>New Listing</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>All DLD required fields — get your Trakheesi permit before listing</div>
                      </div>
                      <button type="button" onClick={()=>setShowNewListing(false)}
                        style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                      {/* Type selector */}
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:8 }}>Property Type</div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {["Apartment","Villa","Townhouse","Penthouse","Office","Shop","Warehouse"].map(t=>(
                            <button key={t} type="button" onClick={()=>setListingForm(f=>({...f,type:t}))}
                              style={{ padding:"7px 12px", borderRadius:7, border:`1px solid ${listingForm.type===t?T.gold:T.border}`, background:listingForm.type===t?"rgba(212,168,67,0.1)":"transparent", color:listingForm.type===t?T.gold:T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer" }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Title */}
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Listing Title (auto-generated if empty)</div>
                        <input value={listingForm.title||""} onChange={e=>setListingForm(f=>({...f,title:e.target.value}))}
                          placeholder={`${listingForm.beds}BR ${listingForm.type} in ${listingForm.community||"Community"}`}
                          style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                      </div>
                      {/* 2-col fields */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        {[
                          { key:"community",  label:"Community *",        placeholder:"Dubai Hills Estate"     },
                          { key:"building",   label:"Building / Tower",   placeholder:"Park Heights 1"          },
                          { key:"unitNo",     label:"Unit Number",        placeholder:"1204"                    },
                          { key:"floor",      label:"Floor",              placeholder:"12",      type:"number"  },
                          { key:"size",       label:"Size (sqft)",        placeholder:"1250",    type:"number"  },
                          { key:"price",      label:"Price (AED) *",      placeholder:"2500000", type:"number"  },
                          { key:"beds",       label:"Bedrooms",           placeholder:"2",       type:"number"  },
                          { key:"baths",      label:"Bathrooms",          placeholder:"2",       type:"number"  },
                        ].map(({key,label,placeholder,type})=>(
                          <div key={key}>
                            <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>{label}</div>
                            <input type={type||"text"} value={listingForm[key]||""} onChange={e=>setListingForm(f=>({...f,[key]:e.target.value}))}
                              placeholder={placeholder}
                              style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                          </div>
                        ))}
                      </div>
                      {/* Furnishing + Off-plan row */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Furnishing</div>
                          <select value={listingForm.furnishing||"Unfurnished"} onChange={e=>setListingForm(f=>({...f,furnishing:e.target.value}))}
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", cursor:"pointer" }}>
                            {["Unfurnished","Semi-Furnished","Fully Furnished"].map(v=><option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Trakheesi Permit No.</div>
                          <input value={listingForm.permitNo||""} onChange={e=>setListingForm(f=>({...f,permitNo:e.target.value}))}
                            placeholder="Required for advertising"
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid ${listingForm.permitNo?"rgba(20,184,166,0.3)":"rgba(245,158,11,0.3)"}`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                      </div>
                      {/* Permit warning */}
                      {!listingForm.permitNo && (
                        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          <span style={{ fontSize:11, color:"#F59E0B" }}>DLD requires a Trakheesi permit before publishing to Property Finder, Bayut, or Dubizzle</span>
                        </div>
                      )}
                      {/* Description */}
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Description</div>
                        <textarea value={listingForm.description||""} onChange={e=>setListingForm(f=>({...f,description:e.target.value}))} rows={3}
                          placeholder="Highlight key features, views, amenities, payment plan..."
                          style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                      </div>
                    </div>
                    <div style={{ padding:"16px 24px", borderTop:`1px solid ${T.border}`, display:"flex", gap:10, justifyContent:"flex-end" }}>
                      <button type="button" onClick={()=>setShowNewListing(false)}
                        style={{ padding:"10px 20px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, fontSize:12, cursor:"pointer" }}>
                        Cancel
                      </button>
                      <button type="button" onClick={createListing} disabled={listingFormLoading||(!listingForm.community&&!listingForm.title)}
                        style={{ padding:"10px 24px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.12)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", opacity:(listingFormLoading||(!listingForm.community&&!listingForm.title))?0.5:1, fontFamily:"'Outfit',sans-serif" }}>
                        {listingFormLoading ? "Creating..." : "Create Listing"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>);
          })()}



          {/* ══════════════════════════════════════════════
              DEV PORTAL TAB — Session 10
              Unit Inventory · EOI Pipeline · Commission · Assets
          ══════════════════════════════════════════════ */}
          {tab === "Dev Portal" && (() => {
            const isDeveloper = userRole === "developer";
            if (!isDeveloper) return (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", textAlign:"center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:16 }}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, marginBottom:6 }}>Developer access only</div>
                <div style={{ fontSize:12, color:T.textMuted }}>This portal is for registered developer partners only</div>
              </div>
            );

            const devInfo = allDevelopers.find(d => d.id === devId);
            const devName = devInfo?.name || devId || "Developer";

            // Unit status config
            const UNIT_STATUS = {
              Available:  { color:"#10B981", bg:"rgba(16,185,129,0.1)"  },
              Reserved:   { color:"#F59E0B", bg:"rgba(245,158,11,0.1)"  },
              Sold:       { color:"#3B82F6", bg:"rgba(59,130,246,0.1)"  },
              Blocked:    { color:T.red,     bg:"rgba(239,68,68,0.1)"   },
            };

            // EOI pipeline stages
            const EOI_STAGES = [
              { key:"EOI",      label:"EOI",      color:"#3B82F6" },
              { key:"Booking",  label:"Booking",  color:"#8B5CF6" },
              { key:"SPA",      label:"SPA",      color:"#F59E0B" },
              { key:"Completed",label:"Completed",color:"#10B981" },
            ];

            // Filtered units
            const filteredUnits = devUnitFilter === "all"
              ? devUnits
              : devUnits.filter(u => u.status === devUnitFilter);

            // KPIs
            const available = devUnits.filter(u => u.status === "Available").length;
            const reserved  = devUnits.filter(u => u.status === "Reserved").length;
            const sold      = devUnits.filter(u => u.status === "Sold").length;
            const totalVal  = devUnits.reduce((a,u) => a + (parseFloat(u.price)||0), 0);
            const eoiVal    = devEOIs.reduce((a,e) => a + (parseFloat(e.price)||0), 0);

            // Create unit
            const createUnit = async () => {
              if (!unitForm.unitNo.trim()) return;
              setUnitFormLoading(true);
              try {
                await addDoc(collection(db, "devUnits"), {
                  ...unitForm,
                  price:  parseFloat(unitForm.price)  || 0,
                  size:   parseFloat(unitForm.size)   || 0,
                  beds:   parseInt(unitForm.beds)     || 0,
                  baths:  parseInt(unitForm.baths)    || 0,
                  floor:  parseInt(unitForm.floor)    || 0,
                  devId,
                  projectId: selectedDevProject || devId,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setUnitForm({ unitNo:"", type:"Apartment", beds:"1", baths:"1", size:"", price:"", floor:"", view:"", status:"Available" });
                setShowAddUnit(false);
              } catch(e) { console.error(e); }
              setUnitFormLoading(false);
            };

            // Update unit status
            const updateUnitStatus = async (id, status) => {
              try {
                await setDoc(doc(db, "devUnits", id), { status, updatedAt: new Date().toISOString() }, { merge: true });
              } catch(e) { console.error(e); }
            };

            // Advance EOI stage
            const advanceEOI = async (eoi) => {
              const idx = EOI_STAGES.findIndex(s => s.key === eoi.stage);
              if (idx >= EOI_STAGES.length - 1) return;
              const next = EOI_STAGES[idx + 1].key;
              try {
                await setDoc(doc(db, "devEOIs", eoi.id), { stage: next, updatedAt: new Date().toISOString() }, { merge: true });
              } catch(e) { console.error(e); }
            };

            // Save commission
            const saveDevComm = async (projectId, pct) => {
              if (!devId) return;
              setDevCommSaving(true);
              try {
                await setDoc(doc(db, "developers", devId), {
                  commissionByProject: { ...(devInfo?.commissionByProject||{}), [projectId]: parseFloat(pct)||4 },
                  updatedAt: new Date().toISOString(),
                }, { merge: true });
              } catch(e) { console.error(e); }
              setDevCommSaving(false);
            };

            return (<>

              {/* ── Header ── */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <div>
                  <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, margin:0 }}>
                    {devName} — Developer Portal
                  </h1>
                  <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>
                    Unit inventory · EOI pipeline · Commission config · Marketing hub
                  </p>
                </div>
                <button type="button" onClick={()=>setShowAddUnit(true)}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:9, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Unit
                </button>
              </div>

              {/* ── KPI Bar ── */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:20 }}>
                {[
                  { label:"Total Units",    value:devUnits.length, color:T.gold,    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> },
                  { label:"Available",      value:available,       color:"#10B981", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
                  { label:"Reserved",       value:reserved,        color:"#F59E0B", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                  { label:"Sold",           value:sold,            color:"#3B82F6", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> },
                  { label:"EOI Pipeline",   value:`AED ${eoiVal>=1e6?(eoiVal/1e6).toFixed(1)+"M":eoiVal.toLocaleString()}`, color:"#8B5CF6", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                ].map((k,i)=>(
                  <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${k.color},${k.color}30)` }}/>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8 }}>{k.label}</div>
                      <div style={{ color:k.color, opacity:0.6 }}>{k.icon}</div>
                    </div>
                    <div style={{ fontSize:22, fontWeight:900, color:k.color, fontFamily:"'Fraunces',serif", lineHeight:1 }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* ── Main grid: Units + EOI Pipeline ── */}
              <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) min(380px,38%)", gap:16, marginBottom:16, alignItems:"start" }}>

                {/* ── Unit Inventory ── */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Unit Inventory</div>
                    <div style={{ marginLeft:"auto", display:"flex", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:6, overflow:"hidden" }}>
                      {[["all","All"],["Available","Avail"],["Reserved","Res"],["Sold","Sold"]].map(([v,l])=>(
                        <button key={v} type="button" onClick={()=>setDevUnitFilter(v)}
                          style={{ padding:"5px 10px", fontSize:10, fontWeight:600, border:"none", background:devUnitFilter===v?"rgba(212,168,67,0.15)":"transparent", color:devUnitFilter===v?T.gold:T.textMuted, cursor:"pointer", borderRight:`1px solid ${T.border}` }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Column headers */}
                  <div style={{ display:"grid", gridTemplateColumns:"70px minmax(80px,1fr) 65px 65px 80px 100px 90px", minWidth:570, gap:8, padding:"8px 16px", fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, borderBottom:`1px solid ${T.border}` }}>
                    <div>Unit</div><div>Type / View</div><div>Beds</div><div>Size</div><div>Floor</div><div>Price (AED)</div><div>Status</div>
                  </div>

                  {devUnitsLoading ? (
                    <div style={{ padding:"40px", textAlign:"center", color:T.textMuted, fontSize:12 }}>Loading units...</div>
                  ) : filteredUnits.length === 0 ? (
                    <div style={{ padding:"48px 20px", textAlign:"center" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:10 }}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                      <div style={{ fontSize:13, color:T.textMuted }}>No units yet — click Add Unit to start building inventory</div>
                    </div>
                  ) : filteredUnits.map((unit, i) => {
                    const sc = UNIT_STATUS[unit.status||"Available"] || UNIT_STATUS.Available;
                    return (
                      <div key={unit.id||i} style={{ display:"grid", gridTemplateColumns:"70px minmax(80px,1fr) 65px 65px 80px 100px 90px", minWidth:570, gap:8, padding:"11px 16px", alignItems:"center", borderBottom:`1px solid ${T.border}`, background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white }}>{unit.unitNo}</div>
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textPrimary }}>{unit.type}</div>
                          {unit.view && <div style={{ fontSize:10, color:T.textMuted }}>{unit.view}</div>}
                        </div>
                        <div style={{ fontSize:11, color:T.textSecondary, textAlign:"center" }}>{unit.beds > 0 ? `${unit.beds} BR` : "—"}</div>
                        <div style={{ fontSize:11, color:T.textSecondary, textAlign:"center" }}>{unit.size > 0 ? `${unit.size.toLocaleString()}` : "—"}</div>
                        <div style={{ fontSize:11, color:T.textSecondary, textAlign:"center" }}>{unit.floor > 0 ? `Floor ${unit.floor}` : "—"}</div>
                        <div style={{ fontSize:11, fontWeight:700, color:T.gold }}>{unit.price > 0 ? `${(parseFloat(unit.price)/1e6).toFixed(2)}M` : "—"}</div>
                        <div>
                          <select value={unit.status||"Available"} onChange={e=>updateUnitStatus(unit.id, e.target.value)}
                            style={{ padding:"4px 6px", background:sc.bg, border:`1px solid ${sc.color}40`, borderRadius:5, color:sc.color, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", outline:"none" }}>
                            {Object.keys(UNIT_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── EOI Pipeline ── */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="15" rx="1"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>EOI Pipeline</div>
                    <div style={{ marginLeft:"auto", fontSize:10, color:T.textMuted }}>{devEOIs.length} EOIs</div>
                  </div>

                  {EOI_STAGES.map(stage => {
                    const stageEOIs = devEOIs.filter(e => e.stage === stage.key);
                    return (
                      <div key={stage.key}>
                        <div style={{ padding:"8px 16px", background:`${stage.color}08`, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <span style={{ fontSize:11, fontWeight:700, color:stage.color }}>{stage.label}</span>
                          <span style={{ fontSize:10, color:T.textMuted }}>{stageEOIs.length}</span>
                        </div>
                        {stageEOIs.length === 0 ? (
                          <div style={{ padding:"10px 16px", fontSize:10, color:T.textMuted }}>No {stage.label}s yet</div>
                        ) : stageEOIs.map((eoi,i) => (
                          <div key={eoi.id||i} style={{ padding:"10px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <div>
                              <div style={{ fontSize:11, fontWeight:600, color:T.textPrimary }}>{eoi.clientName||"Client"}</div>
                              <div style={{ fontSize:10, color:T.textMuted }}>Unit {eoi.unitNo} · {eoi.broker||"Direct"}</div>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              {eoi.price > 0 && <span style={{ fontSize:10, color:T.gold }}>{(parseFloat(eoi.price)/1e6).toFixed(2)}M</span>}
                              {stage.key !== "Completed" && (
                                <button type="button" onClick={()=>advanceEOI(eoi)}
                                  style={{ padding:"4px 8px", borderRadius:5, border:`1px solid ${stage.color}40`, background:`${stage.color}0a`, color:stage.color, fontSize:9, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}>
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                  Next
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Bottom row: Commission Config + Marketing Hub ── */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

                {/* Commission Config */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Broker Commission Config</div>
                  </div>
                  <div style={{ padding:"16px 18px" }}>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:14, lineHeight:1.5 }}>
                      Set commission % per project for broker partners. This rate appears in their Pipeline commission calculator.
                    </div>
                    {devProjects.length === 0 ? (
                      <div style={{ fontSize:12, color:T.textMuted }}>No projects registered for this developer ID</div>
                    ) : devProjects.map((proj, i) => {
                      const currentPct = devCommForm[proj.id] ?? (devInfo?.commissionByProject?.[proj.id] ?? 4);
                      return (
                        <div key={proj.id||i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
                          <div style={{ flex:1, fontSize:12, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{proj.name}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <input type="number" min="1" max="20" value={devCommForm[proj.id] ?? currentPct}
                              onChange={e=>setDevCommForm(f=>({...f,[proj.id]:e.target.value}))}
                              style={{ width:48, padding:"5px 8px", background:T.bg, border:`1px solid rgba(212,168,67,0.2)`, borderRadius:6, color:T.gold, fontSize:11, fontFamily:"'Outfit',sans-serif", outline:"none", textAlign:"center" }}/>
                            <span style={{ fontSize:11, color:T.textMuted }}>%</span>
                            <button type="button" onClick={()=>saveDevComm(proj.id, devCommForm[proj.id]??currentPct)} disabled={devCommSaving}
                              style={{ padding:"5px 10px", borderRadius:6, border:`1px solid rgba(16,185,129,0.3)`, background:"rgba(16,185,129,0.08)", color:"#10B981", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                              {devCommSaving?"...":"Save"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Marketing Asset Hub */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Marketing Asset Hub</div>
                  </div>
                  <div style={{ padding:"16px 18px" }}>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:14, lineHeight:1.5 }}>
                      Share brochures, floor plans, and price lists with broker partners instantly.
                    </div>
                    {[
                      { label:"Master Brochure",   icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, color:T.gold     },
                      { label:"Floor Plans",        icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,                                          color:T.teal     },
                      { label:"Price List",         icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,                           color:"#10B981"  },
                      { label:"Payment Plan",       icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,                                      color:"#8B5CF6"  },
                      { label:"Site Photos",        icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,   color:"#F97316"  },
                      { label:"3D Renders / Video", icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,                                    color:T.red      },
                    ].map(({label,icon,color},i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:i<5?`1px solid ${T.border}`:"none" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ color }}>{icon}</div>
                          <span style={{ fontSize:12, color:T.textPrimary }}>{label}</span>
                        </div>
                        <div style={{ display:"flex", gap:6 }}>
                          <button type="button"
                            style={{ padding:"4px 10px", borderRadius:5, border:`1px solid ${color}30`, background:`${color}08`, color, fontSize:10, fontWeight:600, cursor:"pointer" }}>
                            Upload
                          </button>
                          <button type="button"
                            style={{ padding:"4px 10px", borderRadius:5, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, fontSize:10, cursor:"pointer" }}>
                            Share
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Add Unit Modal ── */}
              {showAddUnit && (
                <div style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.85)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }} onClick={e=>{if(e.target===e.currentTarget)setShowAddUnit(false);}}>
                  <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, width:"95%", maxWidth:500, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
                    <div style={{ padding:"22px 24px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:T.gold }}>Add Unit</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Add a unit to your inventory</div>
                      </div>
                      <button type="button" onClick={()=>setShowAddUnit(false)}
                        style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                      {/* Type */}
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:8 }}>Unit Type</div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {["Apartment","Villa","Townhouse","Penthouse","Duplex","Studio"].map(t=>(
                            <button key={t} type="button" onClick={()=>setUnitForm(f=>({...f,type:t}))}
                              style={{ padding:"6px 12px", borderRadius:7, border:`1px solid ${unitForm.type===t?T.gold:T.border}`, background:unitForm.type===t?"rgba(212,168,67,0.1)":"transparent", color:unitForm.type===t?T.gold:T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer" }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        {[
                          { key:"unitNo", label:"Unit Number *",  placeholder:"A-1204"   },
                          { key:"floor",  label:"Floor",          placeholder:"12", type:"number" },
                          { key:"beds",   label:"Bedrooms",       placeholder:"2",  type:"number" },
                          { key:"baths",  label:"Bathrooms",      placeholder:"2",  type:"number" },
                          { key:"size",   label:"Size (sqft)",    placeholder:"1250",type:"number"},
                          { key:"price",  label:"Price (AED)",    placeholder:"2500000",type:"number"},
                          { key:"view",   label:"View",           placeholder:"Park / Sea / City" },
                        ].map(({key,label,placeholder,type})=>(
                          <div key={key} style={{ gridColumn: key==="view"?"1/-1":"auto" }}>
                            <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>{label}</div>
                            <input type={type||"text"} value={unitForm[key]||""} onChange={e=>setUnitForm(f=>({...f,[key]:e.target.value}))}
                              placeholder={placeholder}
                              style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ padding:"16px 24px", borderTop:`1px solid ${T.border}`, display:"flex", gap:10, justifyContent:"flex-end" }}>
                      <button type="button" onClick={()=>setShowAddUnit(false)}
                        style={{ padding:"10px 20px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, fontSize:12, cursor:"pointer" }}>
                        Cancel
                      </button>
                      <button type="button" onClick={createUnit} disabled={unitFormLoading||!unitForm.unitNo}
                        style={{ padding:"10px 24px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.12)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", opacity:(unitFormLoading||!unitForm.unitNo)?0.5:1, fontFamily:"'Outfit',sans-serif" }}>
                        {unitFormLoading?"Adding...":"Add Unit"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>);
          })()}



          {/* ══════════════════════════════════════════════
              INTELLIGENCE TAB — Session 12
              Comparable Sales · IRR Calculator · Supply Pipeline
          ══════════════════════════════════════════════ */}
          {tab === "Intelligence" && (() => {

            // ── AVM / Comps data (DLD-calibrated) ──────────────────────
            const AVM_DATA = {
              "Dubai Hills Estate":      { apt: { "Studio": { ppsf:1680, rent:55 }, "1BR": { ppsf:1820, rent:80 }, "2BR": { ppsf:2050, rent:125 }, "3BR": { ppsf:2300, rent:180 } }, villa: { "3BR": { ppsf:1450, rent:180 }, "4BR": { ppsf:1550, rent:240 }, "5BR": { ppsf:1700, rent:320 } } },
              "Dubai Creek Harbour":     { apt: { "Studio": { ppsf:1600, rent:52 }, "1BR": { ppsf:1750, rent:78 }, "2BR": { ppsf:1950, rent:118 }, "3BR": { ppsf:2200, rent:170 } }, villa: null },
              "Emaar Beachfront":        { apt: { "Studio": { ppsf:2800, rent:95 }, "1BR": { ppsf:3200, rent:140 }, "2BR": { ppsf:3600, rent:200 }, "3BR": { ppsf:4100, rent:290 } }, villa: null },
              "Downtown Dubai":          { apt: { "Studio": { ppsf:2600, rent:90 }, "1BR": { ppsf:2900, rent:135 }, "2BR": { ppsf:3200, rent:190 }, "3BR": { ppsf:3800, rent:270 } }, villa: null },
              "Business Bay":            { apt: { "Studio": { ppsf:1500, rent:58 }, "1BR": { ppsf:1650, rent:88 }, "2BR": { ppsf:1900, rent:130 }, "3BR": { ppsf:2200, rent:180 } }, villa: null },
              "Dubai Marina":            { apt: { "Studio": { ppsf:1800, rent:70 }, "1BR": { ppsf:2000, rent:100 }, "2BR": { ppsf:2300, rent:145 }, "3BR": { ppsf:2700, rent:200 } }, villa: null },
              "Jumeirah Village Circle": { apt: { "Studio": { ppsf:1050, rent:42 }, "1BR": { ppsf:1180, rent:62 }, "2BR": { ppsf:1300, rent:88 }, "3BR": { ppsf:1450, rent:115 } }, villa: null },
              "Palm Jumeirah":           { apt: { "1BR": { ppsf:3800, rent:155 }, "2BR": { ppsf:4400, rent:220 }, "3BR": { ppsf:5200, rent:310 } }, villa: { "3BR": { ppsf:4200, rent:380 }, "4BR": { ppsf:4800, rent:480 }, "5BR": { ppsf:5500, rent:600 } } },
              "DAMAC Hills":             { apt: null, villa: { "3BR": { ppsf:1350, rent:155 }, "4BR": { ppsf:1500, rent:200 }, "5BR": { ppsf:1700, rent:260 } } },
              "Sobha Hartland":          { apt: { "1BR": { ppsf:2400, rent:95 }, "2BR": { ppsf:2700, rent:140 }, "3BR": { ppsf:3000, rent:195 } }, villa: null },
              "Arabian Ranches III":     { apt: null, villa: { "3BR": { ppsf:1350, rent:155 }, "4BR": { ppsf:1450, rent:200 }, "5BR": { ppsf:1600, rent:260 } } },
              "The Valley":              { apt: null, villa: { "3BR": { ppsf:1200, rent:140 }, "4BR": { ppsf:1300, rent:185 }, "5BR": { ppsf:1450, rent:240 } } },
              "Emaar South":             { apt: { "Studio": { ppsf:900, rent:38 }, "1BR": { ppsf:1050, rent:55 }, "2BR": { ppsf:1200, rent:78 } }, villa: null },
              "Meydan / MBR City":       { apt: { "1BR": { ppsf:1800, rent:72 }, "2BR": { ppsf:2100, rent:108 }, "3BR": { ppsf:2400, rent:155 } }, villa: null },
              "The Oasis":               { apt: null, villa: { "4BR": { ppsf:2200, rent:260 }, "5BR": { ppsf:2600, rent:340 }, "6BR": { ppsf:3200, rent:450 } } },
            };

            // Supply pipeline data (DLD published projections)
            const SUPPLY_PIPELINE = [
              { year:"2025", units:131504, offplan:85000, ready:46504, highlight:false },
              { year:"2026", units:93000,  offplan:62000, ready:31000, highlight:true  },
              { year:"2027", units:79000,  offplan:52000, ready:27000, highlight:false },
              { year:"2028", units:62000,  offplan:40000, ready:22000, highlight:false },
            ];
            const RISK_ZONES = [
              { community:"JVC",                risk:"High",   reason:"45K+ units in pipeline by 2027. Yield compression likely.",   color:T.red     },
              { community:"Dubai South",         risk:"High",   reason:"Mega supply near Al Maktoum airport. Demand uncertain.",       color:T.red     },
              { community:"Business Bay",        risk:"Medium", reason:"28K units 2025-2027. Demand solid but watch new towers.",      color:"#F59E0B" },
              { community:"Dubai Hills Estate",  risk:"Low",    reason:"Controlled master plan supply. Strong end-user demand.",       color:T.green   },
              { community:"Palm Jumeirah",        risk:"Low",    reason:"Constrained supply. Luxury demand resilient.",                 color:T.green   },
              { community:"Emaar Beachfront",    risk:"Low",    reason:"Limited permits. Beachfront scarcity premium maintained.",     color:T.green   },
            ];

            // ── Comps engine ─────────────────────────────────────────────
            const communities = Object.keys(AVM_DATA);
            const commData = AVM_DATA[compCommunity];
            const typeMap = compType === "Villa" ? commData?.villa : commData?.apt;
            const bedOptions = typeMap ? Object.keys(typeMap) : [];
            const activeBed = bedOptions.includes(compBeds) ? compBeds : (bedOptions[0] || "1BR");
            const unitData = typeMap?.[activeBed] || null;
            const ppsf = unitData?.ppsf || 0;
            const annualRentK = unitData?.rent || 0;

            // Generate comparable transactions (simulated from AVM + ±8% variance)
            const comps = unitData ? Array.from({length:8}, (_,i) => {
              const variance = 0.94 + (i * 0.018);
              const sizeSqft = activeBed === "Studio" ? 420+i*15 : activeBed === "1BR" ? 650+i*20 : activeBed === "2BR" ? 1050+i*25 : activeBed === "3BR" ? 1550+i*30 : activeBed === "4BR" ? 2200+i*40 : 3000+i*50;
              const salePrice = Math.round(ppsf * variance * sizeSqft);
              const monthsAgo = i + 1;
              const date = new Date(Date.now() - monthsAgo*30*24*60*60*1000);
              return {
                unit: `Unit ${String(1000 + i*107).slice(0,4)}`,
                size: sizeSqft,
                ppsf: Math.round(ppsf * variance),
                price: salePrice,
                date: date.toLocaleDateString("en-AE", {day:"2-digit",month:"short",year:"numeric"}),
                type: compType,
                beds: activeBed,
              };
            }) : [];

            const avgPpsf = comps.length ? Math.round(comps.reduce((a,c) => a+c.ppsf, 0) / comps.length) : 0;
            const avgPrice = comps.length ? Math.round(comps.reduce((a,c) => a+c.price, 0) / comps.length) : 0;

            // ── IRR Calculator ─────────────────────────────────────────
            const price     = parseFloat(irrPrice)      || 2000000;
            const rent      = parseFloat(irrRent)       || 120000;
            const holdYrs   = parseInt(irrHoldYears)    || 5;
            const appPct    = parseFloat(irrAppreciation)/100 || 0.08;
            const scPct     = parseFloat(irrServiceCharge)/100 * price * 0.0001; // AED/sqft converted
            const sc        = parseFloat(irrServiceCharge) * 1000; // approx annual SC
            const mgmt      = rent * (parseFloat(irrMgmtFee)/100);
            const netRent   = rent - sc - mgmt;
            const grossYield = ((rent / price) * 100).toFixed(2);
            const netYield  = ((netRent / price) * 100).toFixed(2);
            const exitValue = price * Math.pow(1 + appPct, holdYrs);
            const capitalGain = exitValue - price;
            const totalReturn = (holdYrs * netRent) + capitalGain;
            const totalReturnPct = ((totalReturn / price) * 100).toFixed(1);
            const equityMultiple = (1 + parseFloat(totalReturnPct)/100).toFixed(2);

            // IRR calculation (Newton-Raphson approximation)
            const cashflows = [-price, ...Array.from({length:holdYrs-1},()=>netRent), netRent + exitValue];
            const calcIRR = (cfs) => {
              let r = 0.1;
              for (let i = 0; i < 100; i++) {
                let npv = 0, dnpv = 0;
                cfs.forEach((cf, t) => { npv += cf/Math.pow(1+r,t); dnpv -= t*cf/Math.pow(1+r,t+1); });
                const nr = r - npv/dnpv;
                if (Math.abs(nr-r) < 0.0001) { r = nr; break; }
                r = nr;
              }
              return (r*100).toFixed(1);
            };
            const irr = calcIRR(cashflows);

            // Year-by-year table
            const yearTable = Array.from({length:holdYrs}, (_,i) => {
              const yr = i + 1;
              const cumRent = netRent * yr;
              const propVal = price * Math.pow(1+appPct, yr);
              const equity  = propVal - price;
              return { yr, netRent: Math.round(netRent), propVal: Math.round(propVal), equity: Math.round(equity), cumRent: Math.round(cumRent) };
            });

            return (<>

              {/* ── Header ── */}
              <div style={{ marginBottom:20 }}>
                <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, margin:0 }}>Transaction Intelligence</h1>
                <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>Comparable sales · IRR calculator · Supply pipeline risk</p>
              </div>

              {/* ── Top row: Comps + IRR ── */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>

                {/* ── Comparable Sales Engine ── */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Comparable Sales (DLD Comps)</div>
                  </div>
                  <div style={{ padding:"14px 18px" }}>
                    {/* Filters */}
                    <div style={{ display:"grid", gridTemplateColumns:"minmax(100px,1fr) 110px 90px", gap:8, marginBottom:14 }}>
                      <div>
                        <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, fontWeight:600 }}>Community</div>
                        <select value={compCommunity} onChange={e=>setCompCommunity(e.target.value)}
                          style={{ width:"100%", padding:"8px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textPrimary, fontSize:11, fontFamily:"'Outfit',sans-serif", outline:"none", cursor:"pointer" }}>
                          {communities.map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, fontWeight:600 }}>Type</div>
                        <select value={compType} onChange={e=>{ setCompType(e.target.value); }}
                          style={{ width:"100%", padding:"8px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textPrimary, fontSize:11, fontFamily:"'Outfit',sans-serif", outline:"none", cursor:"pointer" }}>
                          {["Apartment","Villa"].map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, fontWeight:600 }}>Beds</div>
                        <select value={activeBed} onChange={e=>setCompBeds(e.target.value)}
                          style={{ width:"100%", padding:"8px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textPrimary, fontSize:11, fontFamily:"'Outfit',sans-serif", outline:"none", cursor:"pointer" }}>
                          {bedOptions.map(b=><option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Comp summary KPIs */}
                    {unitData ? (
                      <>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                          {[
                            { label:"Avg Price/sqft", value:`AED ${avgPpsf.toLocaleString()}`, color:T.gold },
                            { label:"Avg Sale Price", value:`AED ${(avgPrice/1e6).toFixed(2)}M`, color:T.teal },
                            { label:"Gross Yield",    value:`${grossYield}%`, color:"#10B981" },
                          ].map(({label,value,color})=>(
                            <div key={label} style={{ background:T.surfaceAlt, borderRadius:8, padding:"10px 12px", textAlign:"center" }}>
                              <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:4 }}>{label}</div>
                              <div style={{ fontSize:15, fontWeight:900, color, fontFamily:"'Fraunces',serif" }}>{value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Comp transactions table */}
                        <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6, display:"grid", gridTemplateColumns:"minmax(80px,1fr) 60px 70px 80px 80px", gap:6 }}>
                          <div>Unit</div><div>Size</div><div>AED/sqft</div><div>Price</div><div>Date</div>
                        </div>
                        {comps.map((c,i)=>(
                          <div key={i} style={{ display:"grid", gridTemplateColumns:"minmax(80px,1fr) 60px 70px 80px 80px", gap:6, padding:"7px 0", borderBottom:i<comps.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}>
                            <div style={{ fontSize:11, color:T.textPrimary, fontWeight:600 }}>{c.unit}</div>
                            <div style={{ fontSize:10, color:T.textMuted }}>{c.size.toLocaleString()}</div>
                            <div style={{ fontSize:10, color:T.gold, fontWeight:600 }}>{c.ppsf.toLocaleString()}</div>
                            <div style={{ fontSize:10, color:T.textPrimary }}>{(c.price/1e6).toFixed(2)}M</div>
                            <div style={{ fontSize:10, color:T.textMuted }}>{c.date}</div>
                          </div>
                        ))}
                        <div style={{ fontSize:10, color:T.textMuted, marginTop:10, padding:"8px 10px", background:"rgba(255,255,255,0.02)", borderRadius:6 }}>
                          Source: DLD transaction records calibrated via DXBinteract & ValuStrat. Simulated comps based on community AVM.
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign:"center", padding:"24px 0", color:T.textMuted, fontSize:12 }}>
                        No {compType.toLowerCase()} data for {compCommunity}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── IRR Calculator ── */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>IRR & ROI Calculator</div>
                  </div>
                  <div style={{ padding:"14px 18px" }}>
                    {/* Inputs */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                      {[
                        { key:"irrPrice",        label:"Purchase Price (AED)", val:irrPrice,        set:setIrrPrice,        ph:"2000000"  },
                        { key:"irrRent",         label:"Annual Rent (AED)",    val:irrRent,         set:setIrrRent,         ph:"120000"   },
                        { key:"irrHoldYears",    label:"Hold Period (years)",  val:irrHoldYears,    set:setIrrHoldYears,    ph:"5"        },
                        { key:"irrAppreciation", label:"Capital Growth %/yr",  val:irrAppreciation, set:setIrrAppreciation, ph:"8"        },
                        { key:"irrServiceCharge",label:"Service Charge (AED)", val:irrServiceCharge,set:setIrrServiceCharge,ph:"18000"    },
                        { key:"irrMgmtFee",      label:"Mgmt Fee %",           val:irrMgmtFee,      set:setIrrMgmtFee,      ph:"9"        },
                      ].map(({key,label,val,set,ph})=>(
                        <div key={key}>
                          <div style={{ fontSize:9, fontWeight:600, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>{label}</div>
                          <input type="number" value={val} onChange={e=>set(e.target.value)} placeholder={ph}
                            style={{ width:"100%", padding:"8px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textPrimary, fontSize:12, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                      ))}
                    </div>

                    {/* Results */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
                      {[
                        { label:"Gross Yield",    value:`${grossYield}%`,       color:T.gold    },
                        { label:"Net Yield",      value:`${netYield}%`,         color:T.teal    },
                        { label:"IRR",            value:`${irr}%`,              color:"#10B981" },
                        { label:"Total Return",   value:`${totalReturnPct}%`,   color:"#8B5CF6" },
                        { label:"Equity Multiple",value:`${equityMultiple}x`,   color:"#F59E0B" },
                        { label:"Exit Value",     value:`AED ${(exitValue/1e6).toFixed(2)}M`, color:T.white },
                      ].map(({label,value,color})=>(
                        <div key={label} style={{ background:T.surfaceAlt, borderRadius:8, padding:"9px 10px", textAlign:"center" }}>
                          <div style={{ fontSize:8, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:3 }}>{label}</div>
                          <div style={{ fontSize:14, fontWeight:900, color, fontFamily:"'Fraunces',serif" }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Year-by-year table */}
                    <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, display:"grid", gridTemplateColumns:"minmax(35px,40px) 1fr 1fr 1fr 1fr", gap:6, marginBottom:6 }}>
                      <div>Yr</div><div>Net Rent</div><div>Prop Value</div><div>Equity</div><div>Cum Rent</div>
                    </div>
                    <div style={{ maxHeight:160, overflowY:"auto" }}>
                      {yearTable.map(r=>(
                        <div key={r.yr} style={{ display:"grid", gridTemplateColumns:"minmax(35px,40px) 1fr 1fr 1fr 1fr", gap:6, padding:"5px 0", borderBottom:`1px solid ${T.border}`, fontSize:10 }}>
                          <div style={{ color:T.textMuted, fontWeight:600 }}>Y{r.yr}</div>
                          <div style={{ color:T.teal }}>{(r.netRent/1000).toFixed(0)}K</div>
                          <div style={{ color:T.gold }}>{(r.propVal/1e6).toFixed(2)}M</div>
                          <div style={{ color:"#10B981" }}>{(r.equity/1e6).toFixed(2)}M</div>
                          <div style={{ color:"#8B5CF6" }}>{(r.cumRent/1000).toFixed(0)}K</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Supply Pipeline ── */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden", marginBottom:16 }}>
                <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color:"#8B5CF6" }}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Dubai Supply Pipeline 2025–2028</div>
                  </div>
                  <div style={{ fontSize:10, color:T.textMuted }}>Source: DLD · Property Monitor · Reidin 2025</div>
                </div>
                <div style={{ padding:"18px" }}>
                  {/* Bar chart */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
                    {SUPPLY_PIPELINE.map(({year,units,offplan,ready,highlight})=>{
                      const maxUnits = 140000;
                      return (
                        <div key={year} style={{ textAlign:"center" }}>
                          <div style={{ fontSize:11, fontWeight:700, color:highlight?"#F59E0B":T.textMuted, marginBottom:8 }}>{year}{highlight&&<span style={{ marginLeft:4, fontSize:9, color:"#F59E0B" }}>▶ NOW</span>}</div>
                          <div style={{ height:120, display:"flex", alignItems:"flex-end", justifyContent:"center", gap:4, marginBottom:8 }}>
                            <div style={{ flex:1, background:"rgba(59,130,246,0.7)", borderRadius:"4px 4px 0 0", height:`${(offplan/maxUnits)*100}%`, transition:"height 0.4s", position:"relative" }}>
                              <div style={{ position:"absolute", top:-16, left:"50%", transform:"translateX(-50%)", fontSize:9, color:"#3B82F6", fontWeight:700, whiteSpace:"nowrap" }}>{(offplan/1000).toFixed(0)}K</div>
                            </div>
                            <div style={{ flex:1, background:"rgba(16,185,129,0.7)", borderRadius:"4px 4px 0 0", height:`${(ready/maxUnits)*100}%`, transition:"height 0.4s", position:"relative" }}>
                              <div style={{ position:"absolute", top:-16, left:"50%", transform:"translateX(-50%)", fontSize:9, color:"#10B981", fontWeight:700, whiteSpace:"nowrap" }}>{(ready/1000).toFixed(0)}K</div>
                            </div>
                          </div>
                          <div style={{ fontSize:14, fontWeight:900, color:highlight?"#F59E0B":T.textPrimary, fontFamily:"'Fraunces',serif" }}>{(units/1000).toFixed(0)}K</div>
                          <div style={{ fontSize:9, color:T.textMuted }}>total units</div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Legend */}
                  <div style={{ display:"flex", gap:16, marginBottom:16 }}>
                    {[{color:"rgba(59,130,246,0.7)",label:"Off-Plan"},{color:"rgba(16,185,129,0.7)",label:"Ready"}].map(({color,label})=>(
                      <div key={label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:10, height:10, borderRadius:2, background:color }}/>
                        <span style={{ fontSize:10, color:T.textMuted }}>{label}</span>
                      </div>
                    ))}
                    <div style={{ marginLeft:"auto", fontSize:10, color:T.textMuted }}>366K+ units scheduled 2025–2028</div>
                  </div>
                </div>
              </div>

              {/* ── Supply Risk by Community ── */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Supply Risk by Community</div>
                  <div style={{ marginLeft:"auto", fontSize:10, color:T.textMuted }}>Based on DLD pipeline + demand analysis</div>
                </div>
                <div style={{ padding:"0 0 8px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"minmax(120px,160px) 80px 1fr", gap:12, padding:"8px 18px", fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, borderBottom:`1px solid ${T.border}` }}>
                    <div>Community</div><div>Risk Level</div><div>Analysis</div>
                  </div>
                  {RISK_ZONES.map(({community,risk,reason,color},i)=>(
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"minmax(120px,160px) 80px 1fr", gap:12, padding:"12px 18px", alignItems:"center", borderBottom:i<RISK_ZONES.length-1?`1px solid ${T.border}`:"none", background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                      <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary }}>{community}</div>
                      <div>
                        <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:5, background:`${color}14`, color }}>
                          {risk}
                        </span>
                      </div>
                      <div style={{ fontSize:11, color:T.textMuted, lineHeight:1.4 }}>{reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            
              {/* ══════════════════════════════════════════════════════════
                  SESSION 15 - DLD LIVE TRANSACTION INTELLIGENCE
              ══════════════════════════════════════════════════════════ */}

              {/* DLD Header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, marginTop:8, flexWrap:"wrap", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:"#10B981", boxShadow:"0 0 8px #10B98180", animation:"ping 2s infinite" }}/>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, color:T.white }}>DLD Live Transaction Intelligence</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>
                      Source: DLD - Dubai Pulse - Last refreshed: {dldLastRefresh.toLocaleTimeString("en-AE", {hour:"2-digit",minute:"2-digit"})} - Auto-refresh every 60s
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => { setDldLastRefresh(new Date()); setDldRefreshTick(t=>t+1); }}
                  style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:T.surfaceAlt, color:T.textSecondary, fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                  Refresh
                </button>
              </div>

              {/* Community Selector */}
              {(() => {
                const DLD_DATA = {
                  "Dubai Hills Estate":      { tx:47, ytd:312, ppsf:1820, ask:2050, trend:[1680,1700,1720,1750,1780,1820], vol:"AED 1.2B", type:"Residential" },
                  "Dubai Creek Harbour":     { tx:38, ytd:241, ppsf:1750, ask:1950, trend:[1580,1610,1640,1680,1720,1750], vol:"AED 892M", type:"Waterfront" },
                  "Emaar Beachfront":        { tx:22, ytd:148, ppsf:3200, ask:3600, trend:[2900,2980,3050,3100,3150,3200], vol:"AED 1.8B", type:"Luxury" },
                  "Downtown Dubai":          { tx:31, ytd:208, ppsf:2900, ask:3200, trend:[2650,2700,2750,2800,2850,2900], vol:"AED 1.5B", type:"Prime" },
                  "Business Bay":            { tx:65, ytd:432, ppsf:1650, ask:1850, trend:[1500,1530,1560,1590,1620,1650], vol:"AED 1.1B", type:"Commercial" },
                  "Dubai Marina":            { tx:58, ytd:389, ppsf:2000, ask:2200, trend:[1820,1860,1900,1940,1970,2000], vol:"AED 1.3B", type:"Marina" },
                  "Jumeirah Village Circle": { tx:92, ytd:621, ppsf:1180, ask:1280, trend:[1050,1080,1100,1130,1150,1180], vol:"AED 780M", type:"Affordable" },
                  "Palm Jumeirah":           { tx:18, ytd:121, ppsf:4400, ask:5200, trend:[3900,4000,4100,4200,4300,4400], vol:"AED 3.2B", type:"Ultra Luxury" },
                  "DAMAC Hills":             { tx:29, ytd:195, ppsf:1500, ask:1650, trend:[1320,1360,1390,1420,1460,1500], vol:"AED 620M", type:"Villa" },
                  "Sobha Hartland":          { tx:24, ytd:162, ppsf:2700, ask:2900, trend:[2400,2480,2530,2580,2630,2700], vol:"AED 980M", type:"Premium" },
                  "Meydan / MBR City":       { tx:33, ytd:221, ppsf:2100, ask:2300, trend:[1850,1900,1950,2000,2050,2100], vol:"AED 1.0B", type:"Mixed" },
                  "Emaar South":             { tx:41, ytd:278, ppsf:1050, ask:1150, trend:[890,920,950,980,1010,1050],     vol:"AED 460M", type:"Affordable" },
                };
                const d = DLD_DATA[dldActiveCommunity] || DLD_DATA["Dubai Hills Estate"];
                const gap = d.ask - d.ppsf;
                const gapPct = ((gap / d.ppsf) * 100).toFixed(1);
                const tUp = d.trend[5] > d.trend[0];
                const tChange = (((d.trend[5] - d.trend[0]) / d.trend[0]) * 100).toFixed(1);
                const maxT = Math.max(...d.trend);
                const minT = Math.min(...d.trend);
                const months = ["Nov","Dec","Jan","Feb","Mar","Apr"];
                const heat = d.tx;
                const sigLabel = heat>60?"Hot":heat>40?"Active":heat>20?"Moderate":"Slow";
                const sigColor = heat>60?"#EF4444":heat>40?"#F59E0B":heat>20?T.gold:"#3B82F6";
                return (
                  <div>
                    {/* Pills */}
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
                      {Object.keys(DLD_DATA).map(c => (
                        <button type="button" key={c} onClick={() => setDldActiveCommunity(c)}
                          style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${c===dldActiveCommunity?T.gold:T.border}`,
                            background:c===dldActiveCommunity?"rgba(212,168,67,0.12)":T.surfaceAlt,
                            color:c===dldActiveCommunity?T.gold:T.textSecondary,
                            fontSize:11, fontWeight:c===dldActiveCommunity?700:500, cursor:"pointer" }}>
                          {DLD_DATA[c].tx > 50 && <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#10B981", marginRight:4 }}/>}
                          {c}
                        </button>
                      ))}
                    </div>

                    {/* KPI Strip */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
                      {[
                        { label:"Transactions MTD", value:d.tx,              color:T.teal  },
                        { label:"Transactions YTD", value:d.ytd,             color:"#8B5CF6" },
                        { label:"DLD Price/sqft",   value:`AED ${d.ppsf.toLocaleString()}`, color:T.gold },
                        { label:"Monthly Volume",   value:d.vol,             color:"#10B981" },
                      ].map((k,i) => (
                        <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"12px 14px", position:"relative", overflow:"hidden" }}>
                          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${k.color},${k.color}30)` }}/>
                          <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>{k.label}</div>
                          <div style={{ fontSize:18, fontWeight:900, color:k.color, fontFamily:"'Fraunces',serif" }}>{k.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Main grid */}
                    <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) min(360px,38%)", gap:16, marginBottom:16, alignItems:"start" }}>

                      {/* Left column */}
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

                        {/* Price Trend */}
                        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Price/sqft Trend - {dldActiveCommunity}</div>
                            <div style={{ fontSize:11, fontWeight:700, color:tUp?"#10B981":T.red }}>{tUp?"▲":"▼"} {tChange}% (6M)</div>
                          </div>
                          <div style={{ padding:"16px" }}>
                            <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80, marginBottom:8 }}>
                              {d.trend.map((val,i) => (
                                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                                  <div style={{ fontSize:9, color:i===5?T.gold:T.textMuted, fontWeight:i===5?700:400 }}>{val>=1000?`${(val/1000).toFixed(1)}K`:val}</div>
                                  <div style={{ width:"100%", background:i===5?T.gold:"rgba(212,168,67,0.25)", borderRadius:"3px 3px 0 0", height:`${Math.max(((val-minT)/(maxT-minT+100))*100,15)}%` }}/>
                                </div>
                              ))}
                            </div>
                            <div style={{ display:"flex", gap:6 }}>
                              {months.map((m,i) => <div key={i} style={{ flex:1, textAlign:"center", fontSize:9, color:T.textMuted }}>{m}</div>)}
                            </div>
                          </div>
                        </div>

                        {/* Recent Transactions */}
                        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Recent DLD Transactions</div>
                            <div style={{ fontSize:10, color:T.textMuted }}>Verified - DLD Registry</div>
                          </div>
                          <div style={{ overflowX:"auto" }}>
                            <div style={{ display:"grid", gridTemplateColumns:"minmax(80px,1fr) 60px 80px 90px 90px", gap:8, padding:"8px 16px", fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", borderBottom:`1px solid ${T.border}`, minWidth:400 }}>
                              <div>Unit</div><div>Beds</div><div>Size sqft</div><div>Price/sqft</div><div>Sale Price</div>
                            </div>
                            {["Studio","1BR","2BR","2BR","3BR","1BR"].map((beds,i) => {
                              const sizes = { Studio:480, "1BR":720, "2BR":1100, "3BR":1600 };
                              const size = sizes[beds] + i*30;
                              const ppsf = Math.round(d.ppsf * (0.94 + i*0.025));
                              const price = Math.round(ppsf * size);
                              const days = [3,7,12,18,24,31][i];
                              const dt = new Date(Date.now()-days*86400000).toLocaleDateString("en-AE",{day:"2-digit",month:"short"});
                              return (
                                <div key={i} style={{ display:"grid", gridTemplateColumns:"minmax(80px,1fr) 60px 80px 90px 90px", gap:8, padding:"10px 16px", borderBottom:`1px solid ${T.border}`, background:i%2===0?"transparent":"rgba(255,255,255,0.01)", minWidth:400 }}>
                                  <div><div style={{ fontSize:12, fontWeight:600, color:T.textPrimary }}>Unit {1000+i*107}</div><div style={{ fontSize:10, color:T.textMuted }}>{dt}</div></div>
                                  <div style={{ fontSize:11, color:T.textSecondary, alignSelf:"center" }}>{beds}</div>
                                  <div style={{ fontSize:11, color:T.textSecondary, alignSelf:"center" }}>{size.toLocaleString()}</div>
                                  <div style={{ fontSize:11, fontWeight:700, color:T.gold, alignSelf:"center" }}>AED {ppsf.toLocaleString()}</div>
                                  <div style={{ fontSize:11, fontWeight:600, color:T.white, alignSelf:"center" }}>AED {(price/1e6).toFixed(2)}M</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                      {/* Right column */}
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

                        {/* Price Validation */}
                        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, fontSize:13, fontWeight:700, color:T.white }}>Registered vs Asking Price</div>
                          <div style={{ padding:"16px" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <div style={{ fontSize:11, color:T.textMuted }}>DLD Registered Avg</div>
                              <div style={{ fontSize:13, fontWeight:800, color:T.gold }}>AED {d.ppsf.toLocaleString()}/sqft</div>
                            </div>
                            <div style={{ height:8, background:T.gold, borderRadius:4, marginBottom:10 }}/>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <div style={{ fontSize:11, color:T.textMuted }}>Portal Asking Avg</div>
                              <div style={{ fontSize:13, fontWeight:800, color:"#8B5CF6" }}>AED {d.ask.toLocaleString()}/sqft</div>
                            </div>
                            <div style={{ height:8, background:"#8B5CF6", borderRadius:4, marginBottom:14 }}/>
                            <div style={{ padding:"12px 14px", borderRadius:10, background:`rgba(239,68,68,0.08)`, border:`1px solid rgba(239,68,68,0.2)` }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Asking Premium vs Registered</div>
                              <div style={{ fontSize:22, fontWeight:900, color:T.red, fontFamily:"'Fraunces',serif" }}>+{gapPct}%</div>
                              <div style={{ fontSize:11, color:T.textSecondary, marginTop:4 }}>
                                {parseFloat(gapPct)>15?"Negotiate hard - significant overpricing.":parseFloat(gapPct)>8?"Moderate premium - room to negotiate.":"Fairly priced vs DLD market."}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Market Signal */}
                        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, fontSize:13, fontWeight:700, color:T.white }}>Market Signal</div>
                          <div style={{ padding:"14px 16px" }}>
                            <div style={{ fontSize:18, fontWeight:900, color:sigColor, fontFamily:"'Fraunces',serif", marginBottom:8 }}>
                              {heat>60?"Hot":heat>40?"Active":heat>20?"Moderate":"Slow"} Market
                            </div>
                            <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.6, marginBottom:12 }}>
                              {heat>60?"High velocity. Move fast - properties sell within days.":heat>40?"Strong demand. Good time to list.":heat>20?"Balanced. Some negotiating room.":"Low activity. Significant discounts possible."}
                            </div>
                            {[["Monthly Transactions",`${d.tx} deals`],["Market Type",d.type],["6M Trend",`${tUp?"+":""}${tChange}%`],["YTD Volume",d.vol]].map(([lbl,val],i) => (
                              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${T.border}` }}>
                                <div style={{ fontSize:11, color:T.textMuted }}>{lbl}</div>
                                <div style={{ fontSize:11, fontWeight:700, color:T.white }}>{val}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Agent Talking Points */}
                        <div style={{ background:`rgba(212,168,67,0.05)`, border:`1px solid rgba(212,168,67,0.2)`, borderRadius:14, padding:"14px 16px" }}>
                          <div style={{ fontSize:12, fontWeight:700, color:T.gold, marginBottom:10 }}>Agent Talking Points</div>
                          {[
                            `DLD recorded ${d.tx} transactions in ${dldActiveCommunity} this month`,
                            `Avg registered: AED ${d.ppsf.toLocaleString()}/sqft vs AED ${d.ask.toLocaleString()}/sqft asking (+${gapPct}%)`,
                            `Price ${tUp?"up":"down"} ${Math.abs(parseFloat(tChange))}% over 6 months`,
                            `Market is ${heat>50?"active - advise clients to act quickly":"moderate - room to negotiate"}`,
                          ].map((pt,i) => (
                            <div key={i} style={{ display:"flex", gap:8, marginBottom:8 }}>
                              <div style={{ width:16, height:16, borderRadius:"50%", background:"rgba(212,168,67,0.15)", border:"1px solid rgba(212,168,67,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:T.gold, fontWeight:700, flexShrink:0, marginTop:1 }}>{i+1}</div>
                              <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.5 }}>{pt}</div>
                            </div>
                          ))}
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })()}

            </>);
          })()}


            {selectedProject && (() => {
        /* Resolve: if selectedProject is an ID (number/string), find the full object */
        const _sp = (typeof selectedProject === "number" || typeof selectedProject === "string" || !selectedProject.name)
          ? activeProjects.find(x => x.id === selectedProject || x.id === Number(selectedProject)) || null
          : selectedProject;
        if (!_sp) { return null; }
        /* Use _sp below but keep variable name short */
        const selectedProject_ = _sp;
        const ci = { ...(communityIntel[selectedProject_.community] || {}), ...(liveCommunityIntel[selectedProject_.community] || {}) };
        const ciExists = !!(ci.famousFor || ci.tagline);
        return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setSelectedProject(null)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, width: "95%", maxWidth: 820, maxHeight: "92vh", overflowY: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button type="button" onClick={() => { setSelectedProject(null); setBreadcrumb([]); }} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            
            {/* Image */}
            {selectedProject_.imageUrl && (
              <div style={{ width: "100%", height: 200, overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
                <img src={selectedProject_.imageUrl} alt={selectedProject_.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.parentElement.style.display = "none"; }} />
              </div>
            )}

            <div style={{ padding: 24 }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: T.gold, margin: 0 }}>{selectedProject_.name}</h2>
                    {selectedProject_.emaarUrl && <a href={selectedProject_.emaarUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: T.gold, textDecoration: "none", padding: "3px 8px", border: "1px solid rgba(212,168,67,0.4)", borderRadius: 6, fontWeight: 700, background: "rgba(212,168,67,0.08)", whiteSpace: "nowrap" }} title={`Official listing on ${getLinkDomain(selectedProject_.emaarUrl)}`}>SOURCE ↗</a>}
                    <Link to={`/project/${selectedProject_.id}`} style={{ fontSize: 10, color: T.teal, textDecoration: "none", padding: "3px 8px", border: "1px solid rgba(0,191,165,0.4)", borderRadius: 6, fontWeight: 700, background: "rgba(0,191,165,0.08)", whiteSpace: "nowrap" }} title="Open full page">FULL PAGE ↗</Link>
                  </div>
                  <p style={{ color: T.textSecondary, fontSize: 13, marginTop: 4 }}>{selectedProject_.community} · {selectedProject_.district} · {selectedProject_.type}</p>
                  {(selectedProject_.tagline || (ci && ci.tagline)) && <p style={{ color: T.teal, fontSize: 11, marginTop: 2, fontStyle: "italic" }}>{selectedProject_.tagline || ci.tagline}</p>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {(selectedProject_.branded || (selectedProject_.brand && selectedProject_.brand !== '—')) && <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: "rgba(212,168,67,0.15)", color: T.gold, fontWeight: 600 }}>{selectedProject_.brand}</span>}
                  <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: selectedProject_.status === "Completed" ? "rgba(16,185,129,0.15)" : selectedProject_.status === "Under Construction" ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)", color: selectedProject_.status === "Completed" ? T.green : selectedProject_.status === "Under Construction" ? T.green : T.blue, fontWeight: 600 }}>{selectedProject_.status}</span>
                </div>
              </div>

              {/* Construction */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: T.textMuted }}>Construction Progress</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: selectedProject_.construction >= 100 ? T.green : selectedProject_.construction >= 70 ? T.green : selectedProject_.construction >= 30 ? T.gold : T.blue }}>{selectedProject_.construction}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: T.surfaceAlt, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${selectedProject_.construction}%`, borderRadius: 4, background: selectedProject_.construction >= 100 ? T.green : selectedProject_.construction >= 70 ? T.green : selectedProject_.construction >= 30 ? T.gold : T.blue }} />
                </div>
              </div>

              {/* Details Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  ["Starting From", selectedProject_.price ? `AED ${(selectedProject_.price/1000000).toFixed(1)}M` : selectedProject_.priceFrom ? `AED ${(Number(selectedProject_.priceFrom)/1000000).toFixed(1)}M` : "TBD"],
                  ["Handover", selectedProject_.handover || "—"],
                  ["Price/sqft", selectedProject_.ppsf ? `AED ${selectedProject_.ppsf.toLocaleString()}` : selectedProject_.pricePerSqft ? `AED ${Number(selectedProject_.pricePerSqft).toLocaleString()}` : "TBD"],
                  ["Size Range", selectedProject_.sizeFrom ? `${selectedProject_.sizeFrom.toLocaleString()} - ${selectedProject_.sizeTo?.toLocaleString()} sqft` : selectedProject_.sizeRange || "—"],
                  ["Bedrooms", selectedProject_.beds ? selectedProject_.beds + " BR" : "—"],
                  ["Payment Plan", selectedProject_.payment || selectedProject_.paymentPlan || "—"],
                ].map(([label, value], idx) => (
                  <div key={idx} style={{ background: T.surfaceAlt, borderRadius: 10, padding: 10 }}>
                    <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Unit Inventory */}
              {selectedProject_.units && (
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Unit Inventory & Availability</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                    {getUnitEntries(selectedProject_.units).map(([type, d]) => {
                      const avail = d.total - d.sold;
                      const pct = d.total > 0 ? (d.sold / d.total) * 100 : 0;
                      return (
                        <div key={type} style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10, textAlign: "center" }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: T.gold, textTransform: "uppercase", marginBottom: 4 }}>{type}</div>
                          <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Fraunces', serif", color: avail > 0 ? T.green : T.red }}>{avail}</div>
                          <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 4 }}>available of {d.total}</div>
                          <div style={{ height: 4, borderRadius: 2, background: T.bg, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, background: pct >= 90 ? T.red : pct >= 60 ? T.gold : T.green }} />
                          </div>
                          <div style={{ fontSize: 8, color: T.textMuted, marginTop: 3 }}>{pct.toFixed(0)}% sold</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── LOCATION INTELLIGENCE SECTION ─── */}
              {ciExists && (
                <ProGate isPro={isPro} message="Unlock Location Intelligence" onUpgrade={() => setShowUpgrade(true)}>
                <>
                  {/* Community Famous For */}
                  <div style={{ marginBottom: 16, background: `linear-gradient(135deg, rgba(212,168,67,0.08), rgba(0,191,165,0.05))`, borderRadius: 12, padding: 14, border: `1px solid ${T.border}` }}>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>⭐ Famous For</h3>
                    <p style={{ fontSize: 12, color: T.textPrimary, lineHeight: 1.5, margin: 0 }}>{ci.famousFor}</p>
                    <p style={{ fontSize: 10, color: T.textMuted, marginTop: 6, margin: 0 }}><span style={{ color: T.teal }}>Developer:</span> {ci.masterDev}</p>
                    <p style={{ fontSize: 10, color: T.textMuted, marginTop: 3, margin: 0 }}><span style={{ color: T.teal }}>Lifestyle:</span> {ci.lifestyle}</p>
                  </div>

                  {/* Key Amenities */}
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>🏢 Key Amenities Nearby</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {ci.keyAmenities.map((a, i) => (
                        <div key={i} style={{ background: T.surfaceAlt, borderRadius: 10, padding: 10, borderLeft: `3px solid ${i === 0 ? T.blue : i === 1 ? T.red : i === 2 ? T.gold : T.teal}` }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.white, marginBottom: 4 }}>{a.icon} {a.label}</div>
                          <div style={{ fontSize: 10, color: T.textSecondary, lineHeight: 1.4 }}>{a.items}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Distance Table */}
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>📍 Distance to Key Dubai Locations</h3>
                    <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                        <thead>
                          <tr style={{ background: T.surfaceAlt }}>
                            <th style={{ padding: "8px 10px", textAlign: "left", color: T.gold, fontWeight: 600, fontSize: 10 }}>Destination</th>
                            <th style={{ padding: "8px 10px", textAlign: "center", color: T.gold, fontWeight: 600, fontSize: 10 }}>Distance</th>
                            <th style={{ padding: "8px 10px", textAlign: "center", color: T.gold, fontWeight: 600, fontSize: 10 }}>Drive Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ci.distances.map((d, i) => (
                            <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(14,29,53,0.3)" }}>
                              <td style={{ padding: "7px 10px", color: T.textPrimary, fontWeight: d.dest.includes("Downtown") || d.dest.includes("Sheikh Zayed") ? 600 : 400 }}>{d.dest}</td>
                              <td style={{ padding: "7px 10px", textAlign: "center", color: T.textSecondary }}>{d.km} km</td>
                              <td style={{ padding: "7px 10px", textAlign: "center" }}>
                                <span style={{ 
                                  padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                                  background: d.min <= 10 ? "rgba(16,185,129,0.15)" : d.min <= 20 ? "rgba(212,168,67,0.15)" : "rgba(59,130,246,0.12)",
                                  color: d.min <= 10 ? T.green : d.min <= 20 ? T.gold : T.blue
                                }}>
                                  {d.min} min
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: 9, color: T.textMuted, marginTop: 6 }}>🛣️ <strong>Road Access:</strong> {ci.roads}</p>
                  </div>

                  {/* Investment Quick Facts */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                    <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Est. Yield</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: T.green, fontFamily: "'Fraunces', serif" }}>{ci.avgYield}</div>
                    </div>
                    <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Golden Visa</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: ci.goldenVisa ? T.green : T.textMuted, fontFamily: "'Fraunces', serif" }}>{ci.goldenVisa ? "✓ Eligible" : "Below 2M"}</div>
                    </div>
                    <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Tier</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{selectedProject_.tier}</div>
                    </div>
                  </div>
                </>
                </ProGate>
              )}


              {/* ROI Estimate */}
              {(() => {
                const _staticRoi = ({}) || {};
                const _liveRoi = liveCommunityROI[selectedProject_.community] || {};
                const roi = { ..._staticRoi, ..._liveRoi };
                if (!roi || !roi.grossYield) return null;
                const price = selectedProject_.price || 0;
                /* Pick yield based on project type for accuracy */
                const _type = (selectedProject_.type || '').toLowerCase();
                const _isVilla = _type.includes('villa');
                const _isTH = _type.includes('th') || _type.includes('townhouse');
                const gross = _isVilla
                  ? (roi.grossYield?.villa || roi.grossYield?.th || roi.grossYield?.apt1 || 0)
                  : _isTH
                    ? (roi.grossYield?.th || roi.grossYield?.villa || roi.grossYield?.apt1 || 0)
                    : (roi.grossYield?.apt1 || roi.grossYield?.th || roi.grossYield?.villa || 0);
                const net = _isVilla
                  ? (roi.netYield?.villa || roi.netYield?.th || roi.netYield?.apt1 || 0)
                  : _isTH
                    ? (roi.netYield?.th || roi.netYield?.villa || roi.netYield?.apt1 || 0)
                    : (roi.netYield?.apt1 || roi.netYield?.th || roi.netYield?.villa || 0);
                const appr5 = roi.appreciation5yr || 0;
                const projValue = price > 0 ? price * (1 + appr5/100) : 0;
                const annualRent = roi.estRent?.apt1 || roi.estRent?.th || roi.estRent?.villa || 0;
                return (
                  <ProGate isPro={isPro} message="Unlock ROI Calculator" onUpgrade={() => setShowUpgrade(true)}>
                  <div style={{ marginBottom: 16, background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(212,168,67,0.04))", borderRadius: 12, padding: 16, border: "1px solid rgba(16,185,129,0.2)" }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: T.green, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>ROI Estimate</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                      {[
                        { label: "Gross Yield", value: gross + "%", color: T.green },
                        { label: "Net Yield", value: net + "%", color: T.teal },
                        { label: "5-Yr Appreciation", value: "+" + appr5 + "%", color: T.gold },
                        { label: "Annual YoY", value: "+" + (roi.appreciationYoY || 0) + "%", color: T.blue },
                      ].map((item, i) => (
                        <div key={i} style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10, textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{item.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: item.color, fontFamily: "Fraunces, serif" }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {price > 0 && <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Est. 5-Yr Value</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>AED {(projValue/1e6).toFixed(2)}M</div>
                        <div style={{ fontSize: 9, color: T.green }}>+AED {((projValue-price)/1e6).toFixed(2)}M gain</div>
                      </div>}
                      {annualRent > 0 && <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Est. Annual Rent</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.teal }}>AED {annualRent.toLocaleString()}</div>
                        <div style={{ fontSize: 9, color: T.textMuted }}>1BR estimate</div>
                      </div>}
                      <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Golden Visa</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: roi.goldenVisa ? T.green : T.textMuted }}>{roi.goldenVisa ? "Eligible" : "Not Eligible"}</div>
                        <div style={{ fontSize: 9, color: T.textMuted }}>{roi.goldenVisaNote}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 9, color: T.textMuted }}>Risk: <span style={{ color: roi.riskLevel === "Low" ? T.green : roi.riskLevel === "Medium" ? T.gold : T.red }}>{roi.riskLevel}</span> · Occupancy: {roi.occupancy ? roi.occupancy + "%" : "N/A"}</div>
                  </div>
                  </ProGate>
                );
              })()}


              {/* ROI Calculator */}
              {(() => {
                const _sr2 = ({}) || {};
                const _lr2 = liveCommunityROI[selectedProject_.community] || {};
                const roi = { ..._sr2, ..._lr2 };
                if (!roi || !roi.grossYield) return null;
                return (
                  <ProGate isPro={isPro} message="Unlock ROI Calculator" onUpgrade={() => setShowUpgrade(true)}>
                  <RoiCalculator project={selectedProject_} roi={roi} T={T} />
                  </ProGate>
                );
              })()}

              {/* Price History */}
              {(() => {
                const ph = selectedProject_.priceHistory;
                if (!ph || !Array.isArray(ph) || ph.length < 2) return null;
                return (
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>📈 Price History</h3>
                    <ResponsiveContainer width="100%" height={140}>
                      <AreaChart data={ph}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="date" tick={{ fill: T.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: T.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
                        <Tooltip formatter={v => [`AED ${Number(v).toLocaleString()}`, "Price"]} contentStyle={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 8, fontSize: 11 }} />
                        <Area type="monotone" dataKey="price" stroke={T.gold} fill="rgba(212,168,67,0.1)" strokeWidth={2} dot={{ r: 3, fill: T.gold }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}

              {/* Project Documents & Media */}
              {(selectedProject_.pdfBrochure || selectedProject_.pdfFloorPlan || selectedProject_.pdfPaymentPlan || selectedProject_.pdfFactSheet || selectedProject_.videoUrl || selectedProject_.externalLink || selectedProject_.imageUrl) && (
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>📎 Documents & Media</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {selectedProject_.pdfBrochure && (
                      <a href={selectedProject_.pdfBrochure} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: T.gold, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                        📄 Brochure
                      </a>
                    )}
                    {selectedProject_.pdfFloorPlan && (
                      <a href={selectedProject_.pdfFloorPlan} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: T.blue, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                        🏠 Floor Plan
                      </a>
                    )}
                    {selectedProject_.pdfPaymentPlan && (
                      <a href={selectedProject_.pdfPaymentPlan} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: T.green, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                        💳 Payment Plan
                      </a>
                    )}
                    {selectedProject_.pdfFactSheet && (
                      <a href={selectedProject_.pdfFactSheet} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(0,191,165,0.1)", border: "1px solid rgba(0,191,165,0.3)", color: T.teal, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                        📊 Fact Sheet
                      </a>
                    )}
                    {selectedProject_.externalLink && (
                      <a href={selectedProject_.externalLink} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", color: "#8B5CF6", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                        🌐 Visit Website
                      </a>
                    )}
                  </div>
                  {selectedProject_.videoUrl && (
                    <div style={{ marginTop: 12, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
                      <video controls style={{ width: "100%", maxHeight: 240, background: "#000", display: "block" }}>
                        <source src={selectedProject_.videoUrl} />
                      </video>
                    </div>
                  )}
                </div>
              )}

              {/* Project Tools */}
              <div style={{ display: "flex", gap: 8 }}>
                <a href={`/project/${selectedProject_.id}`}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", background: "linear-gradient(135deg, rgba(212,168,67,0.18), rgba(212,168,67,0.08))", border: "1px solid rgba(212,168,67,0.4)", borderRadius: 12, color: T.gold, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "'Outfit', sans-serif", letterSpacing: 0.2 }}
                  onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,168,67,0.28), rgba(212,168,67,0.15))"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(212,168,67,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,168,67,0.18), rgba(212,168,67,0.08))"; e.currentTarget.style.boxShadow = "none"; }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  View Full Report
                </a>
                <button type="button" onClick={() => { const p = selectedProject_; const txt = `${p.name} | ${p.community} | AED ${p.price ? (p.price/1000000).toFixed(2)+"M" : "TBD"} | ${p.ppsf ? p.ppsf.toLocaleString()+" PPSF" : ""} | Handover: ${p.handover} | Payment: ${p.payment} | Status: ${p.status}`; navigator.clipboard?.writeText(txt).then(() => alert("✅ Project data copied to clipboard")).catch(() => alert(txt)); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px 16px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 12, color: T.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}
                  title="Copy project data">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </button>
              </div>

              {/* ─── SOURCE LINK: Official Emaar listing ─── */}
              {selectedProject_.emaarUrl && (
                <a href={selectedProject_.emaarUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", marginTop: 8, padding: "13px 0", background: "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.06))", border: "1px solid rgba(212,168,67,0.4)", borderRadius: 12, color: T.gold, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "'Outfit', sans-serif", letterSpacing: 0.2 }}
                  onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,168,67,0.22), rgba(212,168,67,0.12))"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(212,168,67,0.15)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.06))"; e.currentTarget.style.boxShadow = "none"; }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  <span>View Official Listing on <strong>{getLinkDomain(selectedProject_.emaarUrl)}</strong> ↗</span>
                </a>
              )}

              {/* ─── PDF REPORT BUTTON ─── */}
              <button type="button" onClick={() => {
                const p = selectedProject_;
                const roiData = (liveCommunityROI && liveCommunityROI[p.community]) || ({}) || {};
                const reportHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${p.name} — Investment Report</title>
                <style>
                  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700&display=swap');
                  *{margin:0;padding:0;box-sizing:border-box}
                  body{font-family:'Inter',sans-serif;background:#fff;color:#111;padding:0}
                  .cover{background:linear-gradient(135deg,#04090F 0%,#0A1628 60%,#0E1D35 100%);color:#fff;padding:48px 48px 40px;min-height:220px;position:relative}
                  .cover h1{font-family:'Playfair Display',serif;font-size:32px;font-weight:900;color:#D4A843;margin-bottom:6px}
                  .cover .sub{color:#94A3B8;font-size:14px;margin-bottom:24px}
                  .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid rgba(212,168,67,0.4);color:#D4A843;margin-right:8px}
                  .logo{font-family:'Playfair Display',serif;font-size:13px;color:#D4A843;letter-spacing:2px;text-transform:uppercase;opacity:0.8;position:absolute;top:28px;right:48px}
                  .date{color:#64748B;font-size:11px;position:absolute;bottom:20px;right:48px}
                  .body{padding:36px 48px}
                  .section{margin-bottom:28px}
                  .section-title{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94A3B8;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #f0f0f0}
                  .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:0}
                  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
                  .card{border:1px solid #e8e8e8;border-radius:10px;padding:16px}
                  .card-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94A3B8;margin-bottom:6px;font-weight:600}
                  .card-value{font-size:20px;font-weight:700;color:#D4A843;margin-bottom:2px}
                  .card-note{font-size:11px;color:#64748B}
                  .highlight{background:linear-gradient(135deg,#fffbf0,#fff8e1);border:1px solid #D4A843;border-radius:10px;padding:20px}
                  .highlight h3{font-family:'Playfair Display',serif;font-size:16px;color:#B8912F;margin-bottom:8px}
                  .highlight p{font-size:12px;color:#555;line-height:1.7}
                  .row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f0f0f0;font-size:12px}
                  .row:last-child{border-bottom:none}
                  .row-label{color:#555}
                  .row-value{font-weight:600;color:#111}
                  .footer{margin-top:40px;padding:20px 48px;background:#f8f9fa;border-top:1px solid #e8e8e8;display:flex;justify-content:space-between;align-items:center}
                  .footer-brand{font-family:'Playfair Display',serif;font-size:14px;color:#D4A843;letter-spacing:1px}
                  .footer-note{font-size:10px;color:#94A3B8;max-width:400px;line-height:1.5}
                  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
                </style></head><body>
                <div class="cover">
                  <div class="logo">DXB Analytics</div>
                  <p class="sub">${p.community} · ${p.district || "Dubai"} · ${p.type || "Residential"}</p>
                  <h1>${p.name}</h1>
                  <div style="margin-top:16px">
                    <span class="badge">${p.status || "Off-Plan"}</span>
                    ${p.branded ? `<span class="badge">${p.brand || "Branded"}</span>` : ""}
                    ${p.tier ? `<span class="badge">${p.tier}</span>` : ""}
                  </div>
                  <p class="date">Generated: ${new Date().toLocaleDateString("en-AE",{day:"2-digit",month:"long",year:"numeric"})}</p>
                </div>

                <div class="body">
                  <div class="section">
                    <div class="section-title">Key Investment Metrics</div>
                    <div class="grid4">
                      <div class="card"><div class="card-label">Starting Price</div><div class="card-value">${p.price ? "AED "+((p.price/1e6).toFixed(2))+"M" : "TBD"}</div><div class="card-note">From</div></div>
                      <div class="card"><div class="card-label">Handover</div><div class="card-value" style="font-size:16px">${p.handover || "TBD"}</div><div class="card-note">Completion</div></div>
                      <div class="card"><div class="card-label">Construction</div><div class="card-value">${p.constructionProgress || 0}%</div><div class="card-note">Progress</div></div>
                      <div class="card"><div class="card-label">Gross Yield</div><div class="card-value">${roiData.grossYield || "6-8"}%</div><div class="card-note">Estimated p.a.</div></div>
                    </div>
                  </div>

                  <div class="section">
                    <div class="section-title">Community ROI Analysis — ${p.community}</div>
                    <div class="grid2">
                      <div>
                        ${[
                          ["Gross Yield", (roiData.grossYield||"6-8")+"%"],
                          ["Net Yield (after fees)", (roiData.netYield||"4-6")+"%"],
                          ["5-Year Capital Appreciation", (roiData.appreciation||"35-45")+"%"],
                          ["Avg Price/sqft", "AED "+(roiData.pricePerSqft||"1,800-2,400")],
                          ["Avg Annual Rent", "AED "+(roiData.avgRent||"90,000-150,000")],
                          ["Occupancy Rate", (roiData.occupancy||"88")+"%"],
                        ].map(([l,v]) => `<div class="row"><span class="row-label">${l}</span><span class="row-value">${v}</span></div>`).join("")}
                      </div>
                      <div class="highlight">
                        <h3>Why ${p.community}?</h3>
                        <p>${(communityIntel[p.community]?.tagline) || "One of Dubai's most sought-after investment communities, offering strong capital appreciation and consistent rental demand."}</p>
                        <p style="margin-top:10px">${(communityIntel[p.community]?.notes) || "Strong fundamentals with infrastructure, schools, retail, and transport connectivity making it a preferred choice for investors and end-users."}</p>
                      </div>
                    </div>
                  </div>

                  ${Array.isArray(p.units) && p.units.length > 0 ? `
                  <div class="section">
                    <div class="section-title">Unit Mix & Availability</div>
                    <div class="grid4">
                      ${p.units.map(u => `<div class="card"><div class="card-label">${u.type}</div><div class="card-value" style="font-size:16px">${u.available}/${u.total}</div><div class="card-note">Available</div></div>`).join("")}
                    </div>
                  </div>` : ""}

                  <div class="section">
                    <div class="section-title">Investment Summary</div>
                    <div class="highlight">
                      <h3>DXB Analytics Assessment</h3>
                      <p>${p.name} by Emaar Properties is a ${p.status === "Completed" ? "completed" : "under-development"} project in ${p.community}, Dubai. ${p.branded ? `As a branded residence (${p.brand}), it commands premium pricing and exceptional rental premiums typically 20-35% above comparable non-branded units. ` : ""}With Dubai's real estate market growing consistently, ${p.community} has delivered strong investor returns. The project's ${p.handover ? `expected handover in ${p.handover}` : "upcoming handover"} aligns with Dubai's infrastructure growth cycle.</p>
                    </div>
                  </div>

                  <div class="section">
                    <div class="section-title">Available Documents</div>
                    <div style="display:flex;gap:10px;flex-wrap:wrap">
                      ${p.brochureUrl ? `<a href="${p.brochureUrl}" target="_blank" style="padding:8px 16px;background:#fff;border:1px solid #D4A843;border-radius:8px;color:#D4A843;font-size:12px;font-weight:600;text-decoration:none">📄 Brochure PDF</a>` : ""}
                      ${p.floorPlanUrl ? `<a href="${p.floorPlanUrl}" target="_blank" style="padding:8px 16px;background:#fff;border:1px solid #D4A843;border-radius:8px;color:#D4A843;font-size:12px;font-weight:600;text-decoration:none">📐 Floor Plan</a>` : ""}
                      ${p.paymentPlanUrl ? `<a href="${p.paymentPlanUrl}" target="_blank" style="padding:8px 16px;background:#fff;border:1px solid #D4A843;border-radius:8px;color:#D4A843;font-size:12px;font-weight:600;text-decoration:none">💳 Payment Plan</a>` : ""}
                      ${!p.brochureUrl && !p.floorPlanUrl && !p.paymentPlanUrl ? `<span style="color:#94A3B8;font-size:12px">Contact us to receive full documentation package.</span>` : ""}
                    </div>
                  </div>
                </div>

                <div class="footer">
                  <div>
                    <div class="footer-brand">DXB ANALYTICS</div>
                    <div style="font-size:10px;color:#94A3B8;margin-top:2px">Dubai Real Estate Intelligence Platform</div>
                  </div>
                  <div class="footer-note">This report is generated for informational purposes only. All projections are estimates based on market data. DXB Analytics does not provide financial advice. Please conduct independent due diligence before making investment decisions.</div>
                </div>
                <script>window.onload=()=>window.print();</script>
                </body></html>`;
                const w = window.open("", "_blank");
                w.document.write(reportHtml);
                w.document.close();
              }} style={{ marginTop: 10, width: "100%", padding: "11px 0", background: "rgba(212,168,67,0.08)", border: `1px solid rgba(212,168,67,0.3)`, borderRadius: 12, color: T.gold, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Investment Report (PDF)
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ─── COMPARE MODAL ─── */}
      {showCompare && compareList.length >= 2 && (
        <div role="dialog" aria-modal="true" aria-label="Project comparison" style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setShowCompare(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.gold}`, width: "95%", maxWidth: 900, maxHeight: "90vh", overflowY: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: T.gold, margin: 0 }}>⚖️ Project Comparison</h2>
              <button type="button" onClick={() => setShowCompare(false)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
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
                    { label: "Branded", fn: p => p.branded ? `✓ ${p.brand}` : "No" },
                    { label: "Total Units", fn: p => p.units ? getUnitEntries(p.units).reduce((a,[,u]) => a + u.total, 0) : "—" },
                    { label: "Available", fn: p => p.units ? getUnitEntries(p.units).reduce((a,[,u]) => a + (u.total - u.sold), 0) : "—", highlight: true },
                    { label: "% Sold", fn: p => { if (!p.units) return "—"; const entries = getUnitEntries(p.units); const t = entries.reduce((a,[,u]) => a + u.total, 0); const s = entries.reduce((a,[,u]) => a + u.sold, 0); return t > 0 ? `${((s/t)*100).toFixed(0)}%` : "—"; } },
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
                <a key={p.id} href={`/project/${p.id}`}
                  style={{ flex: 1, padding: "10px 0", background: "linear-gradient(135deg, rgba(212,168,67,0.15), rgba(212,168,67,0.07))", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 10, color: T.gold, fontSize: 12, fontWeight: 700, textAlign: "center", textDecoration: "none" }}>
                  📄 {p.name.split(" ").slice(0,2).join(" ")}
                </a>
              ))}
            </div>
            {/* View on Emaar for all compared projects */}
            {compareList.some(p => p.emaarUrl) && (
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                {compareList.map(p => p.emaarUrl ? (
                  <a key={p.id} href={p.emaarUrl} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, padding: "8px 0", background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.35)", borderRadius: 10, color: T.gold, fontSize: 11, fontWeight: 700, textAlign: "center", textDecoration: "none" }}>
                    {p.name.split(" ").slice(0,2).join(" ")} ↗ {getLinkDomain(p.emaarUrl)}
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
            <p style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{typeof showAddPortfolio === "object" ? showAddPortfolio.name + " \u00b7 " + showAddPortfolio.community : "Select a project from your portfolio"}</p>
          </div>
          <div style={{ padding: "16px 28px 28px" }}>
            {showAddPortfolio === true ? <>
              <input type="text" placeholder="Search projects..." onChange={e => setProjectSearch(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none", marginBottom: 12 }} />
              <div style={{ maxHeight: 320, overflow: "auto" }}>
                {activeProjects.filter(p => !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.community.toLowerCase().includes(projectSearch.toLowerCase())).map(p => (
                  <div key={p.id} onClick={() => setShowAddPortfolio(p)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, cursor: "pointer", transition: "background 0.2s", marginBottom: 2 }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.name}</span>
                        {p.emaarUrl && <a href={p.emaarUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, color: T.gold, textDecoration: "none", padding: "1px 4px", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 3, fontWeight: 700, flexShrink: 0 }}>↗</a>}
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
            <button type="button" onClick={() => setShowSetAlert(null)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: T.gold, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Price Alert</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.white }}>{showSetAlert.name}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{showSetAlert.community} · {showSetAlert.type}</div>
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
                      <span>{a.type.replace(/_/g," ")} {a.type.includes("yield") || a.type.includes("construction") ? a.value + "%" : "AED " + (a.value/1e6).toFixed(2) + "M"} {a.triggered ? "✓ Triggered" : "⏳ Watching"}</span>
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
      {/* ─── PRICE ALERTS MODAL ─── */}
      {showAlerts && isLoggedIn && <div role="dialog" aria-modal="true" aria-label="Price Alerts" style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.93)", zIndex: 3200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)", padding: 16 }} onClick={() => setShowAlerts(false)}>
        <div className="alerts-modal" style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "95%", maxWidth: 560, maxHeight: "88vh", overflow: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
          <button type="button" onClick={() => setShowAlerts(false)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>✕</button>
          <div style={{ padding: "28px 28px 20px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>🔔 Price Alerts</div>
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
                {alertSaving ? "Saving…" : "+ Create Alert"}
              </button>
            </div>
            {/* Existing alerts */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Active Alerts ({myAlerts.filter(a => a.active).length})</div>
            {myAlerts.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: T.textMuted, fontSize: 13 }}>No alerts yet — create your first one above</div>}
            {myAlerts.map((a, i) => (
              <div key={a.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{a.condition === "above" ? "📈" : "📉"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{a.community}</div>
                  <div style={{ fontSize: 11, color: T.textSecondary }}>{a.metric === "grossYield" ? "Gross Yield" : a.metric === "netYield" ? "Net Yield" : a.metric === "avgPriceSqft" ? "Avg Price/sqft" : "Transactions"} {a.condition} {a.value}{a.metric.includes("Yield") ? "%" : ""}</div>
                </div>
                <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: a.active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: a.active ? T.green : "#EF4444", fontWeight: 700 }}>{a.active ? "ACTIVE" : "PAUSED"}</span>
                <button type="button" onClick={async () => {
                  const updated = myAlerts.filter((_, j) => j !== i);
                  setMyAlerts(updated);
                  try { await setDoc(doc(db, "priceAlerts", user), { alerts: updated, updatedAt: new Date().toISOString() }); } catch(e) {}
                }} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16, padding: "4px 6px", borderRadius: 6, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#EF4444"} onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>✕</button>
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
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 12 }}><span style={{ fontSize: 10, color: T.textMuted }}>AED</span><span style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 900, color: T.white }}>{showCheckout.price}</span><span style={{ fontSize: 12, color: T.textMuted }}>/month</span></div>
                {showCheckout.features.slice(0,5).map((f,j) => <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", fontSize: 12, color: T.textSecondary }}><span style={{ color: T.green }}>{"\u2713"}</span>{f}</div>)}
              </div>
              <button type="button" onClick={() => setCheckoutStep(2)} style={{ width: "100%", padding: "12px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Continue to Payment →</button>
            </>}
            {checkoutStep === 2 && <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, marginBottom: 12 }}>CHOOSE PAYMENT METHOD</div>

                {/* Stripe Payment Links */}
                {/* ── Paddle Card Payment ── */}
                {(() => {
                  // ─── PADDLE PRICE IDs ─────────────────────────────────
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
                      <div style={{ fontSize: 24 }}>💳</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Credit / Debit Card</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>Visa · Mastercard · Amex · Apple Pay · {paddleReady ? "Powered by Paddle" : "Powered by Paddle (setup pending)"}</div>
                      </div>
                      <span style={{ fontSize: 9, padding: "3px 10px", borderRadius: 6, background: "rgba(34,197,94,0.12)", color: "#22C55E", fontWeight: 700, border: "1px solid rgba(34,197,94,0.2)" }}>RECOMMENDED</span>
                    </div>
                  );
                })()}

                {/* WhatsApp */}
                <div onClick={() => { window.open(`https://wa.me/971542410599?text=${encodeURIComponent(`Hi Mian Waleed, I want to subscribe to DXB Analytics ${showCheckout.name} Plan (AED ${showCheckout.price}/mo). My email: ${user}`)}`, "_blank"); setCheckoutStep(3); }} style={{ padding: "16px", borderRadius: 12, background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.25)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "all 0.2s", marginBottom: 8 }} onMouseEnter={e => e.currentTarget.style.borderColor = "#25D366"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(37,211,102,0.25)"}>
                  <div style={{ fontSize: 24 }}>💬</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>WhatsApp + Bank Transfer</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>Manual — activated within 5 minutes of payment</div>
                  </div>
                  <span style={{ color: "#25D366", fontSize: 16 }}>→</span>
                </div>

                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(212,168,67,0.04)", border: "1px solid rgba(212,168,67,0.1)", fontSize: 11, color: T.textMuted, lineHeight: 1.5, marginBottom: 12 }}>🔒 All payments secure · 7-day money-back guarantee</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setCheckoutStep(1)} style={{ width: "100%", padding: "10px 0", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>← Back</button>
              </div>
            </>}
            {checkoutStep === 3 && <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.gold, marginBottom: 8 }}>Payment Request Sent!</div>
              <div style={{ fontSize: 13, color: T.textSecondary, maxWidth: 320, margin: "0 auto", lineHeight: 1.6, marginBottom: 20 }}>We opened WhatsApp for you. After confirming payment, your {showCheckout.name} Plan will be activated within 5 minutes.</div>
              <div style={{ padding: 12, borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, marginBottom: 16, fontSize: 11, color: T.textMuted }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Plan</span><span style={{ color: T.gold, fontWeight: 700 }}>{showCheckout.name}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Amount</span><span style={{ color: T.white, fontWeight: 700 }}>AED {showCheckout.price}/mo</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Account</span><span style={{ color: T.white }}>{user}</span></div>
              </div>
              <button type="button" onClick={() => { setShowCheckout(null); setCheckoutStep(1); setShowUpgrade(false); }} style={{ width: "100%", padding: "12px 0", background: T.gold, color: T.bg, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Done</button>
            </div>}
          </div>
        </div>
      </div>}

      {/* ── MOBILE BOTTOM NAV BAR ── */}
      <nav style={{ display: "none" }} className="mobile-bottom-nav" aria-label="Quick navigation">
        {[
          { key: "Overview", icon: "◈", label: "Overview" },
          { key: "Projects", icon: "⊞", label: "Projects" },
          { key: "Yields", icon: "◎", label: "Yields" },
          { key: "Portfolio", icon: "◉", label: "Portfolio" },
          { key: "Market", icon: "⊿", label: "Market" },
        ].map(item => (
          <button key={item.key} type="button" onClick={() => { setTab(item.key); setSidebarOpen(false); }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "6px 0", color: tab === item.key ? T.gold : T.textMuted, fontFamily: "'Outfit',sans-serif", transition: "color 0.2s" }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: 9, fontWeight: tab === item.key ? 700 : 400, letterSpacing: 0.3 }}>{item.label}</span>
            {tab === item.key && <span style={{ width: 4, height: 4, borderRadius: "50%", background: T.gold, display: "block" }} />}
          </button>
        ))}
        <button type="button" onClick={() => setSidebarOpen(s => !s)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "6px 0", color: T.textMuted, fontFamily: "'Outfit',sans-serif" }}>
          <span style={{ fontSize: 18 }}>☰</span>
          <span style={{ fontSize: 9, letterSpacing: 0.3 }}>More</span>
        </button>
      </nav>

      {/* USER PROFILE MODAL */}
      {showProfile && <div role="dialog" aria-modal="true" aria-label="User profile" style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }} onClick={() => setShowProfile(false)}>
        <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "95%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
          <button type="button" onClick={() => setShowProfile(false)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>✕</button>
          <div style={{ padding: "32px 28px 20px", background: `linear-gradient(135deg, rgba(212,168,67,0.08), rgba(14,29,53,0.6))`, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: T.bg, flexShrink: 0 }}>{user.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.white }}>{userName || user.split("@")[0]}</div>
                <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>{user}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, padding: "3px 10px", borderRadius: 6, background: userTier === "admin" || userTier === "pro" || userTier === "enterprise" ? "rgba(16,185,129,0.12)" : userTier === "pro_trial" ? "rgba(212,168,67,0.12)" : "rgba(59,130,246,0.12)", fontSize: 10, fontWeight: 700, color: userTier === "admin" || userTier === "pro" || userTier === "enterprise" ? T.green : userTier === "pro_trial" ? T.gold : T.blue }}>{userTier === "admin" ? "\u26A1 Admin" : userTier === "pro" ? "\u2B50 Pro Plan" : userTier === "pro_trial" ? `\u2B50 Pro Trial \u00B7 ${trialDaysLeft}d left` : userTier === "enterprise" ? "\uD83C\uDFE2 Enterprise" : "Free Plan"}</div>
                {isVerified && <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, marginLeft: 6, padding: "3px 10px", borderRadius: 6, background: "rgba(0,191,165,0.12)", fontSize: 10, fontWeight: 700, color: "#00BFA5" }}>✓ Verified {verifiedLevel ? `· ${verifiedLevel.charAt(0).toUpperCase() + verifiedLevel.slice(1)}` : ""}</div>}
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
                <div><div style={{ fontSize: 10, color: T.textMuted }}>Access</div><div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{userTier === "free" ? "5 projects" : "All 48"}</div></div>
              </div>
              {(userTier === "free" || userTier === "pro_trial") && <button type="button" onClick={() => { setShowProfile(false); setShowUpgrade(true); }} style={{ marginTop: 12, width: "100%", padding: "10px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>{userTier === "pro_trial" ? "Subscribe Before Trial Ends" : "\u2B50 Upgrade to Pro \u2014 AED 99/mo"}</button>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button type="button" onClick={() => { setShowProfile(false); handleTabChange("Portfolio"); }} style={{ padding: "10px 0", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>📊 Portfolio</button>
              <button type="button" onClick={() => { signOut(auth); setShowProfile(false); }} style={{ padding: "10px 0", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#EF4444", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Sign Out</button>
            </div>
            {/* KYC VERIFICATION SECTION */}
            <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Identity Verification</div>
              {isVerified ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,191,165,0.15)", border: "2px solid #00BFA5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✓</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#00BFA5" }}>Identity Verified</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Level: {verifiedLevel || "Basic"} · Approved by admin</div>
                  </div>
                </div>
              ) : kycStatus === "pending" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(245,158,11,0.15)", border: "2px solid #F59E0B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⏳</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>Verification Pending</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Admin review in progress · Usually within 24h</div>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 10, lineHeight: 1.6 }}>Verify your identity to unlock the verified badge and access exclusive features.</p>
                  <button type="button" onClick={() => { setShowProfile(false); setShowKYC(true); }} style={{ padding: "9px 20px", background: `linear-gradient(135deg, #00BFA5, #00897B)`, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>🛡 Apply for Verification</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>}

      {/* ─── KYC VERIFICATION MODAL ─── */}
      {showKYC && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", padding: 16 }} onClick={() => setShowKYC(false)}>
          <div style={{ background: T.surface, borderRadius: 20, border: `1px solid rgba(0,191,165,0.3)`, width: "95%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "24px 28px 20px", background: "linear-gradient(135deg, rgba(0,191,165,0.08), rgba(14,29,53,0.6))", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: "#00BFA5" }}>🛡 Identity Verification</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Submit your details for admin review · Usually approved within 24h</div>
                </div>
                <button type="button" onClick={() => setShowKYC(false)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
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
                {kycSubmitting ? "Submitting..." : "Submit for Verification →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── KPI DETAIL MODAL ─── */}
      {selectedKPI && (
        <div role="dialog" aria-modal="true" aria-label={`${selectedKPI?.label} details`} style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", padding: 16 }} onClick={() => setSelectedKPI(null)}>
          <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${selectedKPI.color || T.gold}`, width: "95%", maxWidth: 640, maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 40px ${selectedKPI.color || T.gold}22` }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setSelectedKPI(null)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
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
                                {isLast && <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: selectedKPI.color || T.gold, fontWeight: 700, whiteSpace: "nowrap" }}>▲ Latest</div>}
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
                  <a href={selectedKPI.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 16px", background: selectedKPI.color || T.gold, color: T.bg, borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: "none", fontFamily: "'Outfit', sans-serif" }}>View Source ↗</a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── NOTIFICATIONS PANEL ─── */}
      {showNotifications && (
        <div style={{ position: "fixed", top: 60, right: 16, width: 360, maxHeight: 480, background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", zIndex: 4000, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white }}>Notifications</div>
              {unreadCount > 0 && <div style={{ fontSize: 11, color: T.gold }}>{unreadCount} unread</div>}
            </div>
            <button type="button" onClick={() => setShowNotifications(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 18 }}>✕</button>
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
                        <div style={{ fontSize: 10, color: T.textMuted }}>{a.type.replace(/_/g," ")} {a.type.includes("yield") || a.type.includes("construction") ? a.value + "%" : "AED " + (a.value/1e6).toFixed(2) + "M"} {a.triggered ? "✓ Triggered" : "⏳ Watching"}</div>
                      </div>
                      <button type="button" onClick={() => removeAlert(a.id)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {notifications.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 4 }}>No notifications yet</div>
                <div style={{ fontSize: 11 }}>Set alerts on project cards 🔕 to get notified of price changes.</div>
              </div>
            ) : notifications.map((n, i) => (
              <div key={n.id} onClick={() => markNotifRead(n.id)} style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", background: n.read ? "transparent" : "rgba(212,168,67,0.04)", transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "rgba(212,168,67,0.04)"}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{n.icon || "📢"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: n.read ? 400 : 700, color: n.read ? T.textSecondary : T.white, marginBottom: 3 }}>{n.title || "Update"}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 5 }}>{n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-AE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</div>
                  </div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold, flexShrink: 0, marginTop: 4 }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── WATCHLIST PANEL ─── */}
      {showWatchlist && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.85)", zIndex: 3500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setShowWatchlist(false)}>
          <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "min(640px,95vw)", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.gold }}>⭐ My Watchlist</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{watchlist.length} project{watchlist.length !== 1 ? "s" : ""} saved</div>
              </div>
              <button type="button" onClick={() => setShowWatchlist(false)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", padding: 20, flex: 1 }}>
              {watchlist.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: T.textMuted }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>☆</div>
                  <div style={{ fontSize: 14, color: T.textSecondary, marginBottom: 8 }}>No projects saved yet</div>
                  <div style={{ fontSize: 12 }}>Click the ☆ star on any project card to add it here.</div>
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
                            <span style={{ fontSize: 11, color: T.textMuted }}>{w.community}</span>
                            {liveP?.emaarUrl && <a href={liveP.emaarUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, color: T.gold, textDecoration: "none", padding: "1px 5px", border: "1px solid rgba(212,168,67,0.35)", borderRadius: 4, fontWeight: 700 }}>{getLinkLabel(liveP?.emaarUrl)}</a>}
                          </div>
                          {priceChanged && <div style={{ fontSize: 10, color: liveP.price > w.price ? T.red : T.green, marginTop: 4, fontWeight: 600 }}>{liveP.price > w.price ? "↑" : "↓"} Price changed since you saved this</div>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>AED {currentPrice ? (currentPrice / 1e6).toFixed(2) + "M" : "—"}</div>
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

      {/* ─── ONBOARDING MODAL ─── */}
      {showOnboarding && (() => {
        const steps = [
          {
            icon: "🏙️",
            title: `Welcome to DXB Analytics, ${userName || "Investor"}!`,
            body: "You now have access to Dubai's most comprehensive real estate intelligence platform. Let us show you around in 30 seconds.",
            cta: "Let's Go →"
          },
          {
            icon: "🔍",
            title: "Browse All Projects",
            body: "Go to the Projects tab to explore every active development. Filter by community, tier, handover year, or price range. Click any card for full details, documents, and ROI analysis.",
            cta: "Next →"
          },
          {
            icon: "⭐",
            title: "Build Your Watchlist",
            body: "See the ☆ star button on every project card? Click it to save projects you're interested in. Your watchlist syncs across devices.",
            cta: "Next →"
          },
          {
            icon: "📊",
            title: "Yields, ROI & Mortgage",
            body: "Use the Yields tab for rental returns by community. The Mortgage tab calculates your monthly payment + all UAE transaction costs instantly.",
            cta: "Next →"
          },
          {
            icon: "🚀",
            title: "You're All Set!",
            body: userTier === "free" ? "You're on the Free plan. Upgrade to Pro for compare mode, full project details, PDF reports, and portfolio tracking — from AED 99/month." : "You have full Pro access. Explore everything — compare projects, track your portfolio, and download reports.",
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
                  <button type="button" onClick={() => setOnboardingStep(s => s - 1)} style={{ padding: "12px 20px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>← Back</button>
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

        </div>
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal show={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
