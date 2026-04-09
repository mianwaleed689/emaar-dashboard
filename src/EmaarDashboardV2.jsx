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
import emailjs from "@emailjs/browser";
import { safeAsyncWithToast } from "./utils/safeAsync";
import { T } from "./data";
import LandingPage from "./LandingPage";
import RoiCalculator from "./RoiCalculator";

/* ─── EXTRACTED TAB COMPONENTS ─── */
import CurrencyTab from './tabs/CurrencyTab';
import LaunchCalendarTab from './tabs/LaunchCalendarTab';
import CommunityMapTab from './tabs/CommunityMapTab';
import DLDVolumesTab from './tabs/DLDVolumesTab';
import PriceHistoryTab from './tabs/PriceHistoryTab';
import NeighbourhoodsTab from './tabs/NeighbourhoodsTab';
import YieldsTab from './tabs/YieldsTab';
import MortgageTab from './tabs/MortgageTab';
import DXBEstimateTab from './tabs/DXBEstimateTab';
import FlipTab from './tabs/FlipTab';
import ServiceChargesTab from './tabs/ServiceChargesTab';
import STRvsLTRTab from './tabs/STRvsLTRTab';
import GoldenVisaTab from './tabs/GoldenVisaTab';
import RiskTab from './tabs/RiskTab';
import PortfolioTab from './tabs/PortfolioTab';
import InvestmentScoreTab from './tabs/InvestmentScoreTab';
import ComplianceTab from './tabs/ComplianceTab';
import TeamTab from './tabs/TeamTab';
import HandoverTab from './tabs/HandoverTab';
import MarketTab from './tabs/MarketTab';
import OverviewTab from './tabs/OverviewTab';
import DeveloperHealthTab from './tabs/DeveloperHealthTab';
import CompetitorsTab from './tabs/CompetitorsTab';
import ListingsTab from './tabs/ListingsTab';
import IntelligenceTab from './tabs/IntelligenceTab';
import AgencyTab from './tabs/AgencyTab';
import ProjectsTab from './tabs/ProjectsTab';
import MyLeadsTab from './tabs/MyLeadsTab';
import MarketingTab from './tabs/MarketingTab';
import FinancialsTab from './tabs/FinancialsTab';
import BankingTab from './tabs/BankingTab';
import PipelineTab from './tabs/PipelineTab';
import DevPortalTab from './tabs/DevPortalTab';

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
  { label: "Any Price", min: 0, max: 0 },
  { label: "< 500K", min: 0, max: 500000 },
  { label: "500K–1M", min: 500000, max: 1000000 },
  { label: "1M–2M", min: 1000000, max: 2000000 },
  { label: "2M–5M", min: 2000000, max: 5000000 },
  { label: "5M–10M", min: 5000000, max: 10000000 },
  { label: "10M+", min: 10000000, max: 0 },
];

const PRICE_PRESETS_VILLA = [
  { label: "Any Price", min: 0, max: 0 },
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
  DollarSign: ({ width=16, height=16, strokeWidth=2, style={} } = {}) => SvgIcons.CreditCard({ width, height, strokeWidth, style }),
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
  // ─── cleanPhone: strips non-digits — NEVER use regex inside JSX ───
  const cleanPhone = (p) => {
    if (!p) return "";
    let out = "";
    for (let i = 0; i < p.length; i++) {
      const c = p.charCodeAt(i);
      if (c >= 48 && c <= 57) out += p[i];
    }
    return out;
  };

  // ─── csvEsc: CSV-safe quoting — defined here, NOT inside JSX ───
  const csvEsc = (v) => {
    const s = v == null ? "" : String(v);
    let out = "";
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '"') out += '"';
      out += s[i];
    }
    return '"' + out + '"';
  };

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


/* ════════════════════════════════════════════════════════════════
   DXB ANALYTICS — RESEARCH-BASED SEED DATA
   All figures sourced from official publications — listed per dataset
   Seed data displays until real Firestore data is imported from Admin
   isSeedData: true flag marks all seed entries for easy identification
   ════════════════════════════════════════════════════════════════ */

const SEED_DATA = {

  /* ─── MARKET TAB ───────────────────────────────────────────────
     Sources: DLD Annual Report 2025, DXB Interact Jan 2026,
     Property Monitor DPI Dec 2025, REIDIN Residential Index Dec 2025
     URL: dubailand.gov.ae/en/open-data/research/annual-report-real-estate-sector-performance-2024
  ─────────────────────────────────────────────────────────────── */
  market: [
    { metric: "Total Market Value",       value: "AED 682.6B",  change: "+21% YoY",  numericValue: 682.6, isSeedData: true, source: "DLD / DXB Interact Jan 2026" },
    { metric: "Total Transactions",       value: "215,060",     change: "+19% YoY",  numericValue: 215060, isSeedData: true, source: "DLD Annual Report 2025" },
    { metric: "Off-Plan Share",           value: "63%",         change: "+3pp YoY",  numericValue: 63, isSeedData: true, source: "DLD / Property Monitor 2025" },
    { metric: "Units Launched",           value: "131,504",     change: "532 projects", isSeedData: true, source: "DLD Oct 2025" },
    { metric: "Mortgage Transactions",    value: "50,974",      change: "+22.5% YoY", isSeedData: true, source: "DLD 2025" },
    { metric: "Investor Base",            value: "94,700",      change: "+26% YoY",  isSeedData: true, source: "DLD H1 2025" },
    { metric: "Price Growth",             value: "+19.8%",      change: "REIDIN Index Dec 2025", isSeedData: true, source: "REIDIN Residential Sales Price Index" },
    { metric: "Women Investors",          value: "AED 73.2B",   change: "34,792 transactions", isSeedData: true, source: "DLD H1 2025" },
    { metric: "Population Target",        value: "5.8M by 2040", isSeedData: true, source: "Dubai 2040 Urban Master Plan" },
    { metric: "Price Cycle",              value: "56+ months",  isSeedData: true, source: "Property Monitor DPI Dec 2025" },
    { metric: "2026 Pipeline",            value: "~120K units", isSeedData: true, source: "Knight Frank / CW Core 2025" },
    { metric: "Nationalities",            value: "193+",        isSeedData: true, source: "DLD Investor Base Report 2025" },
    { metric: "Off-Plan Share",           numericValue: 63,     isSeedData: true },
    { metric: "Cash Share",               numericValue: 55,     isSeedData: true, source: "DLD Mortgage Report 2025" },
    { metric: "Active Developers", value: "50+", change: "RERA registered · DLD approved", isSeedData: true, source: "RERA Registry 2026" },
    { metric: "REIDIN Growth",      value: "+19.8%", change: "Residential Sales Price Index Dec 2025", isSeedData: true, source: "REIDIN Dec 2025" },
    { metric: "Price Growth YoY",   value: "+19.8%", change: "Dec 2025", isSeedData: true, source: "REIDIN 2025" },
    { metric: "Mortgage Share",           numericValue: 45,     isSeedData: true },
    /* Historical sales chart data */
    { year: "2020", value: 175,  type: "annual", isSeedData: true, source: "DLD Annual Report" },
    { year: "2021", value: 270,  type: "annual", isSeedData: true, source: "DLD Annual Report" },
    { year: "2022", value: 407,  type: "annual", isSeedData: true, source: "DLD Annual Report" },
    { year: "2023", value: 520,  type: "annual", isSeedData: true, source: "DLD Annual Report" },
    { year: "2024", value: 761,  type: "annual", isSeedData: true, source: "DLD Annual Report 2024" },
    { year: "2025", value: 919,  type: "annual", isSeedData: true, source: "DLD / DXB Interact Jan 2026" },
  ],

  /* ─── DLD VOLUMES TAB ──────────────────────────────────────────
     Sources: DXBAnalytics.com Community Volume Report Feb 2026,
     DLD Direct Database Query, Property Monitor 2025
     URL: dxbanalytics.com/blog/dubai-property-transaction-volume-2026
  ─────────────────────────────────────────────────────────────── */
  dldVolumes: [
    { community: "Jumeirah Village Circle",   type: "Apartment", transactions: 18782, avgPpsf: 1180, volume: 9800000000,  change: 17,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Business Bay",              type: "Apartment", transactions: 12450, avgPpsf: 2050, volume: 14200000000, change: 8,   isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Dubai Marina",              type: "Apartment", transactions: 11200, avgPpsf: 2280, volume: 15800000000, change: 6,   isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Downtown Dubai",            type: "Apartment", transactions: 8900,  avgPpsf: 3100, volume: 18200000000, change: 12,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Dubai Hills Estate",        type: "Mixed",     transactions: 8200,  avgPpsf: 1850, volume: 12400000000, change: 22,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Sobha Hartland",            type: "Mixed",     transactions: 6800,  avgPpsf: 2100, volume: 9800000000,  change: 31,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Dubai Creek Harbour",       type: "Apartment", transactions: 6400,  avgPpsf: 1620, volume: 7200000000,  change: 45,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Palm Jumeirah",             type: "Villa",     transactions: 5200,  avgPpsf: 4800, volume: 28600000000, change: 15,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Mohammed Bin Rashid City",  type: "Mixed",     transactions: 5100,  avgPpsf: 1950, volume: 8900000000,  change: 28,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Arabian Ranches",           type: "Villa",     transactions: 4800,  avgPpsf: 1380, volume: 6200000000,  change: 20,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Jumeirah Lake Towers",      type: "Apartment", transactions: 4600,  avgPpsf: 1420, volume: 4800000000,  change: 5,   isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Al Furjan",                 type: "Mixed",     transactions: 4200,  avgPpsf: 1080, volume: 3200000000,  change: 14,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Dubai South",               type: "Mixed",     transactions: 4100,  avgPpsf: 850,  volume: 2900000000,  change: 38,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "International City",        type: "Apartment", transactions: 3800,  avgPpsf: 580,  volume: 1200000000,  change: 9,   isSeedData: true, source: "DXBAnalytics / DLD 2025" },
    { community: "Tilal Al Ghaf",             type: "Villa",     transactions: 3600,  avgPpsf: 1650, volume: 5800000000,  change: 52,  isSeedData: true, source: "DXBAnalytics / DLD 2025" },
  ],

  /* ─── PRICE HISTORY TAB ────────────────────────────────────────
     Sources: ValuStrat VPI Q4 2025, REIDIN Residential Index Dec 2025,
     Property Monitor DPI 2025, Knight Frank Dubai Residential Q1 2025
     URL: reidin.com | valustrat.com/vpi
  ─────────────────────────────────────────────────────────────── */
  priceHistory: [
    /* 5-year PPSF trend — Dubai overall apartment average */
    { period: "2020", ppsf: 1050, offPlanPpsf: 980,  secondaryPpsf: 1100, type: "priceHistory", isSeedData: true, source: "ValuStrat VPI / REIDIN" },
    { period: "2021", ppsf: 1080, offPlanPpsf: 1020, secondaryPpsf: 1140, type: "priceHistory", isSeedData: true, source: "ValuStrat VPI / REIDIN" },
    { period: "2022", ppsf: 1250, offPlanPpsf: 1180, secondaryPpsf: 1310, type: "priceHistory", isSeedData: true, source: "ValuStrat VPI / REIDIN" },
    { period: "2023", ppsf: 1380, offPlanPpsf: 1290, secondaryPpsf: 1460, type: "priceHistory", isSeedData: true, source: "ValuStrat VPI / REIDIN" },
    { period: "2024", ppsf: 1600, offPlanPpsf: 1520, secondaryPpsf: 1680, type: "priceHistory", isSeedData: true, source: "ValuStrat VPI / REIDIN" },
    { period: "2025", ppsf: 1840, offPlanPpsf: 1760, secondaryPpsf: 1920, type: "priceHistory", isSeedData: true, source: "ValuStrat VPI / REIDIN" },
    /* Community-level momentum */
    { community: "Dubai Hills Estate",   ppsf: 1850, change6m: 8.2,  change1y: 22.1, change3y: 58.4, change5y: 89.2, type: "priceHistory", isSeedData: true, source: "Knight Frank / REIDIN 2025" },
    { community: "Downtown Dubai",       ppsf: 3100, change6m: 4.1,  change1y: 12.3, change3y: 38.6, change5y: 71.4, type: "priceHistory", isSeedData: true, source: "Property Monitor DPI" },
    { community: "Dubai Marina",         ppsf: 2280, change6m: 3.8,  change1y: 9.8,  change3y: 31.2, change5y: 64.8, type: "priceHistory", isSeedData: true, source: "REIDIN Dec 2025" },
    { community: "JVC",                  ppsf: 1180, change6m: 6.4,  change1y: 17.2, change3y: 48.9, change5y: 82.1, type: "priceHistory", isSeedData: true, source: "Property Monitor / Bayut 2025" },
    { community: "Palm Jumeirah",        ppsf: 4800, change6m: 5.2,  change1y: 14.8, change3y: 42.3, change5y: 94.6, type: "priceHistory", isSeedData: true, source: "Knight Frank Q1 2025" },
    { community: "Business Bay",         ppsf: 2050, change6m: 3.1,  change1y: 8.4,  change3y: 29.7, change5y: 58.9, type: "priceHistory", isSeedData: true, source: "REIDIN Dec 2025" },
  ],

  /* ─── NEIGHBOURHOODS TAB ───────────────────────────────────────
     Sources: Bayut H1 2025 Sales Report, Knight Frank Dubai 2025,
     RERA Service Charge Index 2025, uaeexperthub.com Dubai Yields 2026,
     Alkira Dubai Investment Guide Feb 2026, RTA Metro Blue Line plans
     URL: bayut.com/mybayut/bayut-h1-2025-dubai-rental-market-report
  ─────────────────────────────────────────────────────────────── */
  communities: [
    { community: "Jumeirah Village Circle", avgPpsf: 1180, grossYield: 7.8,  netYield: 6.2, serviceCharge: 14,  metroDistance: 1800, supplyRisk: "Medium", investmentScore: 82, tenantProfile: "Professionals", hasSchool: true,  hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 8200,  type: "community", isSeedData: true, source: "Bayut H1 2025 / uaeexperthub.com Jan 2026" },
    { community: "Dubai Marina",            avgPpsf: 2280, grossYield: 6.5,  netYield: 5.0, serviceCharge: 22,  metroDistance: 400,  supplyRisk: "Low",    investmentScore: 78, tenantProfile: "Professionals", hasSchool: false, hasMall: true,  hasBeach: true,  hasHospital: false, pipeline2026: 2800,  type: "community", isSeedData: true, source: "Bayut H1 2025 / Knight Frank Q1 2025" },
    { community: "Business Bay",            avgPpsf: 2050, grossYield: 7.1,  netYield: 5.6, serviceCharge: 18,  metroDistance: 600,  supplyRisk: "High",   investmentScore: 72, tenantProfile: "Professionals", hasSchool: false, hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 12400, type: "community", isSeedData: true, source: "Middle East Insider Apr 2026 / DLD 2025" },
    { community: "Downtown Dubai",          avgPpsf: 3100, grossYield: 5.8,  netYield: 4.2, serviceCharge: 35,  metroDistance: 300,  supplyRisk: "Low",    investmentScore: 74, tenantProfile: "Luxury / HNWI", hasSchool: false, hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 1800,  type: "community", isSeedData: true, source: "Knight Frank Dubai 2025 / REIDIN" },
    { community: "Dubai Hills Estate",      avgPpsf: 1850, grossYield: 6.2,  netYield: 5.0, serviceCharge: 16,  metroDistance: 3500, supplyRisk: "Medium", investmentScore: 85, tenantProfile: "Families",      hasSchool: true,  hasMall: true,  hasBeach: false, hasHospital: true,  pipeline2026: 6800,  type: "community", isSeedData: true, source: "Knight Frank / Bayut H1 2025" },
    { community: "Palm Jumeirah",           avgPpsf: 4800, grossYield: 5.2,  netYield: 3.8, serviceCharge: 28,  metroDistance: 2200, supplyRisk: "Low",    investmentScore: 76, tenantProfile: "Luxury / HNWI", hasSchool: false, hasMall: true,  hasBeach: true,  hasHospital: false, pipeline2026: 800,   type: "community", isSeedData: true, source: "Knight Frank Dubai 2025" },
    { community: "Jumeirah Lake Towers",    avgPpsf: 1420, grossYield: 8.1,  netYield: 6.4, serviceCharge: 16,  metroDistance: 350,  supplyRisk: "Low",    investmentScore: 84, tenantProfile: "Professionals", hasSchool: false, hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 1200,  type: "community", isSeedData: true, source: "Middle East Insider Apr 2026 — ranked #1 yield+quality" },
    { community: "Arabian Ranches",         avgPpsf: 1380, grossYield: 5.5,  netYield: 4.4, serviceCharge: 8,   metroDistance: 8000, supplyRisk: "Low",    investmentScore: 79, tenantProfile: "Families",      hasSchool: true,  hasMall: false, hasBeach: false, hasHospital: false, pipeline2026: 1400,  type: "community", isSeedData: true, source: "uaeexperthub.com / Bayut 2025" },
    { community: "International City",      avgPpsf: 580,  grossYield: 9.2,  netYield: 7.8, serviceCharge: 8,   metroDistance: 5500, supplyRisk: "Low",    investmentScore: 71, tenantProfile: "Mixed",         hasSchool: false, hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 600,   type: "community", isSeedData: true, source: "Middle East Insider Apr 2026 — 9.2% yield leader" },
    { community: "Dubai Creek Harbour",     avgPpsf: 1620, grossYield: 6.4,  netYield: 5.1, serviceCharge: 14,  metroDistance: 1200, supplyRisk: "Medium", investmentScore: 80, tenantProfile: "Mixed",         hasSchool: false, hasMall: true,  hasBeach: true,  hasHospital: false, pipeline2026: 9200,  type: "community", isSeedData: true, source: "Alkira Dubai Investment Guide Feb 2026" },
    { community: "Al Furjan",               avgPpsf: 1080, grossYield: 8.2,  netYield: 6.8, serviceCharge: 12,  metroDistance: 700,  supplyRisk: "Medium", investmentScore: 77, tenantProfile: "Families",      hasSchool: true,  hasMall: false, hasBeach: false, hasHospital: false, pipeline2026: 3200,  type: "community", isSeedData: true, source: "GuestReady Feb 2026 / Bayut H1 2025" },
    { community: "Dubai South",             avgPpsf: 850,  grossYield: 8.8,  netYield: 7.2, serviceCharge: 10,  metroDistance: 4000, supplyRisk: "Medium", investmentScore: 73, tenantProfile: "Mixed",         hasSchool: true,  hasMall: false, hasBeach: false, hasHospital: false, pipeline2026: 14000, type: "community", isSeedData: true, source: "uaeexperthub.com Jan 2026 — 7.5-9.5% yield range" },
    { community: "Mohammed Bin Rashid City",avgPpsf: 1950, grossYield: 6.1,  netYield: 4.9, serviceCharge: 16,  metroDistance: 2800, supplyRisk: "Medium", investmentScore: 81, tenantProfile: "Families",      hasSchool: true,  hasMall: true,  hasBeach: false, hasHospital: true,  pipeline2026: 8800,  type: "community", isSeedData: true, source: "Knight Frank / Sands of Wealth Jan 2026" },
    { community: "Sobha Hartland",          avgPpsf: 2100, grossYield: 6.0,  netYield: 4.8, serviceCharge: 18,  metroDistance: 2400, supplyRisk: "Low",    investmentScore: 82, tenantProfile: "Luxury / HNWI", hasSchool: true,  hasMall: false, hasBeach: false, hasHospital: false, pipeline2026: 2200,  type: "community", isSeedData: true, source: "Knight Frank Q1 2025 / REIDIN" },
    { community: "Tilal Al Ghaf",           avgPpsf: 1650, grossYield: 6.8,  netYield: 5.5, serviceCharge: 12,  metroDistance: 5000, supplyRisk: "Low",    investmentScore: 80, tenantProfile: "Families",      hasSchool: true,  hasMall: false, hasBeach: false, hasHospital: false, pipeline2026: 1800,  type: "community", isSeedData: true, source: "DLD 2025 — 52% YoY growth" },
    { community: "Discovery Gardens",       avgPpsf: 680,  grossYield: 8.5,  netYield: 7.1, serviceCharge: 9,   metroDistance: 600,  supplyRisk: "Low",    investmentScore: 75, tenantProfile: "Professionals", hasSchool: false, hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 400,   type: "community", isSeedData: true, source: "Middle East Insider Apr 2026 — 8.5% yield" },
    { community: "Dubai Silicon Oasis",     avgPpsf: 820,  grossYield: 7.5,  netYield: 6.0, serviceCharge: 12,  metroDistance: 4500, supplyRisk: "Low",    investmentScore: 74, tenantProfile: "Professionals", hasSchool: true,  hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 2400,  type: "community", isSeedData: true, source: "uaeexperthub.com Jan 2026" },
    { community: "Arjan",                   avgPpsf: 1020, grossYield: 8.0,  netYield: 6.5, serviceCharge: 13,  metroDistance: 1500, supplyRisk: "Medium", investmentScore: 76, tenantProfile: "Professionals", hasSchool: false, hasMall: false, hasBeach: false, hasHospital: false, pipeline2026: 4200,  type: "community", isSeedData: true, source: "GuestReady Feb 2026 / Keyone Q1 2026" },
    { community: "DAMAC Hills 2",           avgPpsf: 780,  grossYield: 7.2,  netYield: 6.0, serviceCharge: 10,  metroDistance: 6000, supplyRisk: "High",   investmentScore: 69, tenantProfile: "Families",      hasSchool: true,  hasMall: true,  hasBeach: false, hasHospital: false, pipeline2026: 16000, type: "community", isSeedData: true, source: "uaeexperthub.com Jan 2026" },
    { community: "Emaar Beachfront",        avgPpsf: 2800, grossYield: 5.8,  netYield: 4.6, serviceCharge: 20,  metroDistance: 800,  supplyRisk: "Low",    investmentScore: 79, tenantProfile: "Luxury / HNWI", hasSchool: false, hasMall: false, hasBeach: true,  hasHospital: false, pipeline2026: 1600,  type: "community", isSeedData: true, source: "Bayut H1 2025 / Driven Properties 2025" },
  ],

  /* ─── LAUNCH CALENDAR TAB ──────────────────────────────────────
     Sources: Developer official portals, Bayut Launch Radar 2026,
     Property Finder New Projects, Reelly.ai Launch Calendar
     URL: reelly.ai | bayut.com | propertyfinder.ae
  ─────────────────────────────────────────────────────────────── */
  launches: [
    { projectName: "Emaar Grand Polo Club & Resort — Phase 2", developer: "Emaar", community: "Dubai Investment South", propertyType: "Villa", status: "EOI Open", launchDate: "2026-04-20", startingPrice: 5700000, totalUnits: 420, paymentPlan: "80/20", eoiAmount: 50000, eoiRefundable: true, launchPrice: 4800, currentPrice: 5200, notes: "Emaar's 60M sqft master plan. Polo fields, 7 clubhouses, equestrian estates. Strong appreciation history on Emaar launches.", type: "launch", isSeedData: true, source: "Alkira Dubai Investment Guide Feb 2026" },
    { projectName: "Dubai Islands — Island B Phase 1", developer: "Nakheel", community: "Dubai Islands", propertyType: "Apartment", status: "EOI Open", launchDate: "2026-04-28", startingPrice: 1200000, totalUnits: 680, paymentPlan: "60/40", eoiAmount: 30000, eoiRefundable: true, notes: "Island B offers more controlled planning vs Island A. 24% price growth in 2025. Beachfront value.", type: "launch", isSeedData: true, source: "Alkira Feb 2026 — Dubai Islands 24% growth 2025" },
    { projectName: "Sobha Hartland II — The Waterfront", developer: "Sobha Realty", community: "Sobha Hartland", propertyType: "Apartment", status: "Upcoming", launchDate: "2026-05-15", startingPrice: 1800000, totalUnits: 520, paymentPlan: "70/30", eoiAmount: 40000, eoiRefundable: true, notes: "High-rise community with green living concept. Sobha known for quality finishes and delivery track record.", type: "launch", isSeedData: true, source: "Arthur Mackenzy Q3 2025 Report" },
    { projectName: "The Oasis by Emaar — Phase 11", developer: "Emaar", community: "The Oasis", propertyType: "Villa", status: "Launched", launchDate: "2026-03-10", startingPrice: 6150000, totalUnits: 280, paymentPlan: "80/20 post-handover", eoiAmount: 50000, eoiRefundable: true, launchPrice: 5800, currentPrice: 6300, notes: "10-to-1 scarcity vs Dubai Hills (2,700 units vs 30,000). Lagoon pools, wave pools. Handover Jun 2029.", type: "launch", isSeedData: true, source: "Alkira Feb 2026 — 'Blue Lagoon' exclusivity" },
    { projectName: "DAMAC Lagoons — Santorini Phase 3", developer: "DAMAC Properties", community: "DAMAC Lagoons", propertyType: "Villa", status: "EOI Closed", launchDate: "2026-03-22", startingPrice: 2200000, totalUnits: 380, paymentPlan: "60/40", eoiAmount: 25000, eoiRefundable: true, notes: "Mediterranean-inspired villas. DAMAC sold out previous phases within hours.", type: "launch", isSeedData: true, source: "Property Finder Launch Radar 2026" },
    { projectName: "Binghatti Skyrise — Business Bay", developer: "Binghatti", community: "Business Bay", propertyType: "Apartment", status: "Upcoming", launchDate: "2026-05-08", startingPrice: 850000, totalUnits: 720, paymentPlan: "70/30", eoiAmount: 20000, eoiRefundable: true, notes: "Binghatti's signature bold architecture. Business Bay canal views. Target professional renters — strong yield community.", type: "launch", isSeedData: true, source: "Bayut Launch Radar Apr 2026" },
    { projectName: "Tilal Al Ghaf — Serenity Mansions", developer: "Majid Al Futtaim", community: "Tilal Al Ghaf", propertyType: "Villa", status: "Sold Out", launchDate: "2026-02-18", startingPrice: 8500000, totalUnits: 85, paymentPlan: "50/50", eoiAmount: 100000, eoiRefundable: false, notes: "Ultra-luxury mansions sold out within 48 hours. DLD 2025 shows 52% YoY transaction growth in Tilal Al Ghaf.", type: "launch", isSeedData: true, source: "DLD 2025 / Bayut 2026" },
    { projectName: "Ellington Ocean House — Dubai Islands", developer: "Ellington Properties", community: "Dubai Islands", propertyType: "Apartment", status: "Upcoming", launchDate: "2026-06-01", startingPrice: 2400000, totalUnits: 180, paymentPlan: "70/30", eoiAmount: 50000, eoiRefundable: true, notes: "Design-forward beachfront living. Ellington known for curated interiors. Limited units.", type: "launch", isSeedData: true, source: "Reelly.ai Launch Calendar Apr 2026" },
  ],

  /* ─── OVERVIEW TAB KPIs ────────────────────────────────────────
     Sources: Same as Market tab
  ─────────────────────────────────────────────────────────────── */
  overviewKpis: [
    { metric: "Total Market Value",  value: "AED 682.6B",  change: "+21% YoY — Full year 2025",   isSeedData: true, source: "DLD / DXB Interact Jan 2026" },
    { metric: "Total Transactions",  value: "215,060",      change: "+19% YoY — Sales only",        isSeedData: true, source: "DLD Annual Report 2025" },
    { metric: "Off-Plan Share",      value: "63%",          change: "+3pp — Off-plan dominated 2025", isSeedData: true, source: "DLD / Property Monitor 2025" },
    { metric: "Units Launched",      value: "131,504",      change: "532 projects by Oct 2025",     isSeedData: true, source: "DLD Oct 2025" },
  ],
};

/* Seed data source reference — shown in UI */
const SEED_SOURCE_URL = {
  DLD: "https://dubailand.gov.ae/en/open-data/research/",
  Bayut: "https://www.bayut.com/mybayut/bayut-h1-2025-dubai-rental-market-report/",
  REIDIN: "https://reidin.com",
  ValuStrat: "https://valustrat.com/vpi",
  KnightFrank: "https://www.knightfrank.ae/research",
  PropertyMonitor: "https://propertymonitor.com",
  DXBAnalytics: "https://www.dxbanalytics.com/blog/dubai-property-transaction-volume-2026",
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
      { key: "Banking",           icon: SvgIcons.CreditCard },
    ]
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: SvgIcons.TrendingUp,
    tabs: [
      { key: "Marketing", icon: SvgIcons.Activity },
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
          <div style={{ fontSize: 56, marginBottom: 16 }}>\uD83D\uDCE7</div>
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
          <div style={{ fontSize: 56, marginBottom: 16 }}>\uD83D\uDD11</div>
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
          \uD83D\uDD12 Secured by Firebase · SSL Encrypted · GDPR Compliant
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
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}22, ${T.gold}08)`, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 12px" }}>\uD83D\uDD12</div>
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
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}20, ${T.gold}05)`, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>\uD83D\uDD12</div>
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
          {[["\uD83D\uDCCA", "AED 80.4B", "FY25 Sales tracked"], ["\uD83D\uDCC8", "+40% YoY", "Revenue growth"], ["\uD83C\uDFE0", "48 Projects", "Full intelligence"], ["\uD83D\uDCB0", "AED 155B", "Backlog visibility"]].map(([icon, val, label], i) => (
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
          {["\uD83D\uDD12 Secure payment", "↩ 7-day money-back", "⚡ Instant access", "❌ Cancel anytime"].map((t, i) => (
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


/* ─── COMMUNITY MAP TAB — moved to tabs/CommunityMapTab.jsx ─── */



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
    icon: "\uD83D\uDCCA",
    description: "Your Bloomberg-style command centre. Live market ticker, KPI cards, developer intelligence panel, and real-time DLD feed — all connected to your data sources.",
    adminHint: "Connect data sources from Admin → Data Manager → Market Data"
  },
  "Financials": {
    icon: "\uD83D\uDCB9",
    description: "Developer financial intelligence — revenue, net profit, EBITDA, backlog, EPS, DPS — 6-year history charts. Auto-updated from developer IR reports.",
    adminHint: "Add developer financials from Admin → Data Manager → Developers"
  },
  "Projects": {
    icon: "\uD83C\uDFD7️",
    description: "Browse all projects across all property types — Off-Plan, Residential, Commercial, Secondary Market, Hotel Apartments, Villas, Balcony View Units. Filter, compare, and score every property.",
    adminHint: "Import projects from Admin → Data Manager → Projects"
  },
  "Handover": {
    icon: "\uD83D\uDCC5",
    description: "Construction timeline tracker. Monitor handover dates, construction progress, and delivery risk for all off-plan projects. Automated countdown alerts.",
    adminHint: "Add project handover data from Admin → Data Manager → Projects"
  },
  "Launch Calendar": {
    icon: "\uD83D\uDE80",
    description: "Never miss a launch. Upcoming project launches by developer, EOI status, expected pricing, and past launch performance vs actual prices.",
    adminHint: "Launch data auto-populates from Bayut API scanner — check Admin → Data Health"
  },
  "Neighbourhoods": {
    icon: "\uD83C\uDFD8️",
    description: "Community intelligence — average PPSF, yields, schools, hospitals, metro access, lifestyle ratings, supply risk, and demand strength for every Dubai community.",
    adminHint: "Add community data from Admin → Data Manager → Communities"
  },
  "Service Charges": {
    icon: "\uD83D\uDCCB",
    description: "RERA registered service charge rates per community in AED/sqft/year. Historical trends, net yield impact calculator, and community comparisons.",
    adminHint: "Add service charge data from Admin → Data Manager → Communities"
  },
  "STR vs LTR": {
    icon: "\uD83C\uDFE0",
    description: "Short-term Airbnb vs long-term tenancy comparison per community per unit type. Occupancy rates, daily rates, platform fees, management costs, and net income.",
    adminHint: "STR data connects to Bayut API — configure from Admin → Data Health"
  },
  "Developer Health": {
    icon: "\uD83E\uDE7A",
    description: "Developer health scores — delivery track record, financial strength, project pipeline risk, RERA status, and complaint ratios. 9-factor radar chart.",
    adminHint: "Add developer profiles from Admin → Data Manager → Developers"
  },
  "DLD Volumes": {
    icon: "\uD83D\uDCC8",
    description: "Live DLD transaction data — volume by community, developer, property type, nationality, cash vs mortgage. Monthly trends, price anomaly alerts.",
    adminHint: "DLD data auto-syncs daily — check Admin → Data Health → DLD Cron"
  },
  "DXB Estimate": {
    icon: "\uD83D\uDD0D",
    description: "The Zestimate for Dubai. Enter any unit details and get an estimated market value backed by actual DLD transaction comparables.",
    adminHint: "AVM requires DLD data — check Admin → Data Health → DLD Cron"
  },
  "Portfolio": {
    icon: "\uD83D\uDCBC",
    description: "Personal investment portfolio tracker. Add your properties, track current market value, unrealised gains, rental income, IRR, and Golden Visa eligibility.",
    adminHint: "Portfolio reads from live market data — connect DLD and Bayut first"
  },
  "Competitors": {
    icon: "⚔️",
    description: "Developer vs developer intelligence — sales volume, delivery record, PPSF comparison, market share, community presence, and branded residence count.",
    adminHint: "Add developer data from Admin → Data Manager → Developers"
  },
  "Yields": {
    icon: "\uD83D\uDCCA",
    description: "Gross and net rental yields by community and unit type. 5-year historical trend, best yielding communities ranked, and yield vs appreciation tradeoff.",
    adminHint: "Yield data auto-syncs weekly from Bayut API — check Admin → Data Health"
  },
  "Mortgage": {
    icon: "\uD83C\uDFE6",
    description: "Live EIBOR mortgage calculator. Monthly payment, total cost of acquisition (DLD 4%, agency 2%, trustee fees), amortisation schedule, and 5 bank rate comparison.",
    adminHint: "EIBOR updates daily — check Admin → EIBOR Rates"
  },
  "Map": {
    icon: "\uD83D\uDDFA️",
    description: "Interactive property map with yield heatmap, PPSF heatmap, transaction volume layer, project pins, and community boundaries. Distance rings from key landmarks.",
    adminHint: "Map renders from project data — import projects first"
  },
  "Risk": {
    icon: "⚠️",
    description: "9-factor investment risk scoring per community and project. Supply risk, demand strength, price trajectory, developer quality, regulatory environment.",
    adminHint: "Risk scores calculate automatically from project and market data"
  },
  "Market": {
    icon: "\uD83C\uDF0D",
    description: "Dubai real estate macro view — total market size, transaction count, off-plan vs secondary split, top developers, international buyer breakdown, and analyst forecasts.",
    adminHint: "Market data updates from Admin → Market Intelligence → Update Stats"
  },
  "Currency": {
    icon: "\uD83D\uDCB1",
    description: "Live AED exchange rates for international buyers — GBP, USD, EUR, RUB, INR, CNY, and more. Property price converter and historical rate chart.",
    adminHint: "Currency rates update automatically via ExchangeRate API"
  },
  "Golden Visa": {
    icon: "\uD83E\uDD47",
    description: "Golden Visa eligibility calculator. Enter property value to check AED 2M minimum, requirements, process steps, and timeline. Auto-checks portfolio eligibility.",
    adminHint: "Golden Visa rules update from Admin → Data Manager → Regulations"
  },
  "Flip": {
    icon: "\uD83D\uDD04",
    description: "Property flip ROI calculator — purchase price, renovation cost, holding period, selling price. Returns net profit, ROI, annualised return, and optimal hold period.",
    adminHint: "Flip calculator works with market data — connect DLD and Bayut first"
  },
  "Investment Score": {
    icon: "⭐",
    description: "AI investment scoring for any property — yield potential, location quality, developer health, price vs market, liquidity, handover risk, supply risk. 0-100 score with breakdown.",
    adminHint: "Investment Score requires project data — import projects first"
  },
  "Price History": {
    icon: "\uD83D\uDCC9",
    description: "5-year PPSF trend per community per unit type. Off-plan vs secondary price divergence, correction alerts, and momentum indicators.",
    adminHint: "Price history syncs from DLD data — check Admin → Data Health → DLD Cron"
  },
};


/* ══ TAB ERROR BOUNDARY ══ */
class TabErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError:false, error:null }; }
  static getDerivedStateFromError(e) { return { hasError:true, error:e }; }
  componentDidCatch(e,i) { console.error("DXB Tab Error:",e); }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding:"60px 24px", textAlign:"center" }}>
        <div style={{ fontSize:28, marginBottom:12 }}>⚠️</div>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:700, color:"#EF4444", marginBottom:8 }}>Tab Error</div>
        <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:16 }}>{this.state.error?.message || "Something went wrong in this tab"}</div>
        <button onClick={()=>this.setState({hasError:false,error:null})}
          style={{ padding:"7px 20px", background:"rgba(212,168,67,0.15)", border:"1px solid rgba(212,168,67,0.4)", borderRadius:8, color:"#D4A843", fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
          Try Again
        </button>
        <div style={{ fontSize:11, color:"#6B7280", marginTop:10 }}>All other tabs remain accessible — use the sidebar to navigate</div>
      </div>
    );
    return this.props.children;
  }
}

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

  /* ─── Tab persistence: restore on load + back/forward ─── */
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dxb_active_tab');
      if (stored && stored !== 'Overview') setTab(stored);
    } catch(e) {}
    const handlePop = (e) => {
      if (e.state?.tab) setTab(e.state.tab);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

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
      <div style={{ fontSize: compact ? 20 : 28 }}>\uD83D\uDD12</div>
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

  /* ─── MARKET TAB STATE ─── */
  const [expandedForecast, setExpandedForecast] = useState(null);

  /* ─── DLD VOLUMES TAB STATE ─── */
  const [dldFilter, setDldFilter] = useState({ community: "All", type: "All", txType: "All", developer: "All", nationality: "All" });
  const [dldSort, setDldSort] = useState("transactions");
  const [dldSearch, setDldSearch] = useState("");
  const [dldView, setDldView] = useState("table");

  /* ─── PRICE HISTORY TAB STATE ─── */
  const [phCommunity, setPhCommunity] = useState("All");
  const [phType, setPhType] = useState("Apartment");
  const [phBeds, setPhBeds] = useState("All");
  const [phView, setPhView] = useState("chart");
  const [phCompare, setPhCompare] = useState(false);
  const [phCommunity2, setPhCommunity2] = useState("All");


  /* ─── HANDOVER STATUS + RISK CONFIG — top level (used by tab + overlay) ─── */
  const statusCfg = {
    "On Track": { color: T.green,   bg: "rgba(16,185,129,0.12)",  label: "On Track"  },
    "Delayed":  { color: "#F97316", bg: "rgba(249,115,22,0.12)",  label: "Delayed"   },
    "At Risk":  { color: T.red,     bg: "rgba(239,68,68,0.12)",   label: "At Risk"   },
    "Ready":    { color: T.teal,    bg: "rgba(20,184,166,0.12)",  label: "Ready"     },
  };
  const riskCfg = {
    "Low":          { color: T.green,   dot: T.green,   bg: "rgba(16,185,129,0.12)", label: "Low Risk"     },
    "Medium":       { color: "#F97316", dot: "#F97316", bg: "rgba(249,115,22,0.12)",  label: "Medium Risk"  },
    "High":         { color: T.red,     dot: T.red,     bg: "rgba(239,68,68,0.12)",   label: "High Risk"    },
    "On Track":     { color: T.green,   dot: T.green,   bg: "rgba(16,185,129,0.12)", label: "On Track"     },
    "Delayed":      { color: "#F97316", dot: "#F97316", bg: "rgba(249,115,22,0.12)",  label: "Delayed"      },
    "At Risk":      { color: T.red,     dot: T.red,     bg: "rgba(239,68,68,0.12)",   label: "At Risk"      },
    "Ready":        { color: T.teal,    dot: T.teal,    bg: "rgba(20,184,166,0.12)", label: "Ready"        },
    "Near Handover":{ color: T.teal,    dot: T.teal,    bg: "rgba(20,184,166,0.12)", label: "Near Handover"},
    "Minor Delay":  { color: "#F97316", dot: "#F97316", bg: "rgba(249,115,22,0.12)",  label: "Minor Delay"  },
    "Major Delay":  { color: T.red,     dot: T.red,     bg: "rgba(239,68,68,0.12)",   label: "Major Delay"  },
    "Early Stage":  { color: "#8B5CF6", dot: "#8B5CF6", bg: "rgba(139,92,246,0.12)", label: "Early Stage"  },
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

  /* ─── MY LEADS STATE (Session 4) ─── */
  const [myLeads, setMyLeads] = useState([]);
  const [myLeadsLoading, setMyLeadsLoading] = useState(false);

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
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [leadSourceFilter, setLeadSourceFilter] = useState("all");
  const [leadSortBy, setLeadSortBy] = useState("score"); // score | date | budget
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadDrawerTab, setLeadDrawerTab] = useState("details");
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [expandedMega, setExpandedMega] = useState(null);
  const [compareList, setCompareList] = useState([]);
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

  /* ─── MY LEADS MISSING STATE (V11) ─── */

  /* ─── V12 NEW STATE ─── */
  const [leadTagFilter, setLeadTagFilter] = useState("all");
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [showBrochure, setShowBrochure] = useState(false);
  const [brochureLoading, setBrochureLoading] = useState(false);


  const [leadBudgetFilter, setLeadBudgetFilter] = useState("all");
  const [leadTypeFilter, setLeadTypeFilter] = useState("all");
  const [leadNatFilter, setLeadNatFilter] = useState("all");


  /* ─── MY LEADS ADDITIONAL STATE ─── */
  const [liveLeads, setLiveLeads] = useState([]);
  const [leadShowAdd, setLeadShowAdd] = useState(false);
  const [leadAddName, setLeadAddName] = useState("");
  const [leadAddPhone, setLeadAddPhone] = useState("");
  const [leadAddEmail, setLeadAddEmail] = useState("");
  const [leadAddBudget, setLeadAddBudget] = useState("");
  const [leadAddSource, setLeadAddSource] = useState("Manual");
  const [showMLTemplates, setShowMLTemplates] = useState(false);
  const [showMLAnalytics, setShowMLAnalytics] = useState("");
  const [leadAddRef, setLeadAddRef] = useState("");
  const [leadAddFollowUp, setLeadAddFollowUp] = useState("");
  const [leadAddBedrooms, setLeadAddBedrooms] = useState("");
  const [leadAddNat, setLeadAddNat] = useState("");
  const [leadAddLang, setLeadAddLang] = useState("");
  const [leadAddTimeline, setLeadAddTimeline] = useState("");
  const [leadAddPurpose, setLeadAddPurpose] = useState("");
  const [leadAddStatus, setLeadAddStatus] = useState("New");
  const [leadAddType, setLeadAddType] = useState("Buy");
  const [leadAddComm, setLeadAddComm] = useState("");
  const [leadAddSaving, setLeadAddSaving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("Call");
  const [noteLoading, setNoteLoading] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [taskDue, setTaskDue] = useState("");


  /* ─── COMPETITORS TAB STATE ─── */
  const [cptView, setCptView] = useState("matrix");
  const [cptDevA, setCptDevA] = useState("Emaar Properties");
  const [cptDevB, setCptDevB] = useState("DAMAC Properties");
  const [cptMetric, setCptMetric] = useState("overall");
  const [cptSearch, setCptSearch] = useState("");


  /* ─── MARKETING INTELLIGENCE TAB STATE ─── */
  const [mktView, setMktView] = useState("channels");
  const [mktPropType, setMktPropType] = useState("all");
  const [mktBudget, setMktBudget] = useState(10000);
  const [mktNationality, setMktNationality] = useState("Indian");
  const [mktListingComm, setMktListingComm] = useState("");
  const [mktListingType, setMktListingType] = useState("apartment");
  const [mktListingBeds, setMktListingBeds] = useState("2");
  const [mktListingPrice, setMktListingPrice] = useState(1500000);
  const [mktListingFeatures, setMktListingFeatures] = useState("");
  const [mktAiResult, setMktAiResult] = useState("");
  const [mktAiLoading, setMktAiLoading] = useState(false);


  /* ─── MORTGAGE LEAD CAPTURE STATE ─── */
  const [mortLeadName, setMortLeadName] = useState("");
  const [mortLeadPhone, setMortLeadPhone] = useState("");
  const [mortLeadEmail, setMortLeadEmail] = useState("");
  const [mortLeadSubmitted, setMortLeadSubmitted] = useState(false);
  const [mortLeadSubmitting, setMortLeadSubmitting] = useState(false);


  /* ─── BANKING INTELLIGENCE TAB STATE ─── */
  const [bankView, setBankView] = useState("compare");
  const [bankType, setBankType] = useState("resident");
  const [bankFinType, setBankFinType] = useState("conventional");
  const [bankPropValue, setBankPropValue] = useState(2000000);
  const [bankSalary, setBankSalary] = useState(25000);
  const [bankTerm, setBankTerm] = useState(25);
  const [bankLTV, setBankLTV] = useState(80);
  const [bankPurpose, setBankPurpose] = useState("firstHome");
  const [bankSelected, setBankSelected] = useState("Emirates NBD");
  const [bankFixedYrs, setBankFixedYrs] = useState(3);


  /* ─── DEVELOPER HEALTH TAB STATE ─── */
  const [dhView, setDhView] = useState("leaderboard");
  const [dhTier, setDhTier] = useState("All");
  const [dhSort, setDhSort] = useState("score");
  const [dhSelected, setDhSelected] = useState(null);
  const [dhSearch, setDhSearch] = useState("");


  /* ─── FINANCIALS TAB STATE ─── */
  const [finDeveloper, setFinDeveloper] = useState("Emaar Properties");
  const [finView, setFinView] = useState("overview");
  const [finPeriod, setFinPeriod] = useState("annual");
  const [finMetric, setFinMetric] = useState("revenue");
  const [finCompare, setFinCompare] = useState(false);
  const [finCompareDev, setFinCompareDev] = useState("Aldar Properties");


  /* ─── RISK TAB STATE ─── */
  const [riskTabView, setRiskTabView] = useState("radar");
  const [riskCommunity2, setRiskCommunity2] = useState("Jumeirah Village Circle");
  const [riskType2, setRiskType2] = useState("Apartment");
  const [riskHorizon, setRiskHorizon] = useState("medium");
  const [riskProfile, setRiskProfile] = useState("investor");

  const [liveInvestScores, setLiveInvestScores] = useState([]);
  const [liveLaunches, setLiveLaunches] = useState([]);

  /* ─── GOLDEN VISA TAB STATE ─── */
  const [gvView, setGvView] = useState("checker");
  const [gvMortgage, setGvMortgage] = useState(false);
  const [gvMortgagePaid, setGvMortgagePaid] = useState(2000000);
  const [gvOffplan, setGvOffplan] = useState(false);
  const [gvOffplanPaid, setGvOffplanPaid] = useState(2000000);
  const [gvNumProps, setGvNumProps] = useState(1);
  const [gvCategory, setGvCategory] = useState("property");

  const [livePortfolio, setLivePortfolio] = useState([]);

  /* ─── DXB ESTIMATE (AVM) STATE ─── */
  const [avmView, setAvmView] = useState("estimate");
  const [avmFloor, setAvmFloor] = useState("mid");
  const [avmView2, setAvmView2] = useState("pool");
  const [avmCondition, setAvmCondition] = useState("good");
  const [avmFurnished, setAvmFurnished] = useState(false);
  const [avmRenovated, setAvmRenovated] = useState(false);
  const [avmParking, setAvmParking] = useState(1);

  /* ─── PORTFOLIO STATE ─── */
  const [portView, setPortView] = useState("overview");
  const [portShowAdd, setPortShowAdd] = useState(false);
  const [portBuyPrice, setPortBuyPrice] = useState(1200000);
  const [portCurrVal, setPortCurrVal] = useState(1500000);
  const [portRent, setPortRent] = useState(90000);
  const [portSC, setPortSC] = useState(12000);
  const [portMortgage, setPortMortgage] = useState(0);
  const [portCommunity2, setPortCommunity2] = useState("Dubai Marina");
  const [portType2, setPortType2] = useState("Apartment");
  const [portBeds2, setPortBeds2] = useState("1BR");
  const [portYear2, setPortYear2] = useState(2022);


  /* ─── FLIP CALCULATOR ADDITIONAL STATE ─── */
  const [flpRenovCost, setFlpRenovCost] = useState(80000);
  const [flpAgentBuy, setFlpAgentBuy] = useState(2);
  const [flpAgentSell, setFlpAgentSell] = useState(2);
  const [flpMortgage, setFlpMortgage] = useState(false);
  const [flpMortgageRate, setFlpMortgageRate] = useState(4.25);
  const [flpLTV, setFlpLTV] = useState(70);
  const [flpView, setFlpView] = useState("calculator");
  const [flpScenario, setFlpScenario] = useState("base");


  /* ─── INVESTMENT SCORE TAB STATE ─── */
  const [invScView, setInvScView] = useState("community");
  const [invScSort, setInvScSort] = useState("total");
  const [invScFilter, setInvScFilter] = useState("All");
  const [invScSelected, setInvScSelected] = useState(null);
  const [invScSearch, setInvScSearch] = useState("");


  /* ─── MORTGAGE TAB STATE ─── */
  const [mortPrice, setMortPrice] = useState(1500000);
  const [mortDown, setMortDown] = useState(20);
  const [mortRate, setMortRate] = useState(4.25);
  const [mortYears, setMortYears] = useState(25);
  const [mortType, setMortType] = useState("fixed");
  const [mortProfile, setMortProfile] = useState("expat");
  const [mortView, setMortView] = useState("calculator");
  const [mortIncome, setMortIncome] = useState(30000);


  /* ─── STR vs LTR TAB STATE ─── */
  const [strView, setStrView] = useState("comparison");
  const [strCommunity, setStrCommunity] = useState("All");
  const [strBeds, setStrBeds] = useState("1BR");
  const [strCalcPrice, setStrCalcPrice] = useState(1200000);
  const [strCalcSize, setStrCalcSize] = useState(800);
  const [strCalcNightly, setStrCalcNightly] = useState(450);
  const [strCalcOccupancy, setStrCalcOccupancy] = useState(72);
  const [strCalcMgmt, setStrCalcMgmt] = useState(20);
  const [strCalcLTR, setStrCalcLTR] = useState(90000);


  /* ─── YIELDS TAB STATE ─── */
  const [yldView, setYldView] = useState("table");
  const [yldType, setYldType] = useState("Apartment");
  const [yldSort, setYldSort] = useState("gross");
  const [yldSearch, setYldSearch] = useState("");
  const [yldBeds, setYldBeds] = useState("All");
  const [yldCalcPrice, setYldCalcPrice] = useState(1200000);
  const [yldCalcRent, setYldCalcRent] = useState(90000);
  const [yldCalcSC, setYldCalcSC] = useState(15);
  const [yldCalcSize, setYldCalcSize] = useState(800);
  const [yldCalcMgmt, setYldCalcMgmt] = useState(5);
  const [yldCalcVacancy, setYldCalcVacancy] = useState(5);
  const [liveYieldsData, setLiveYieldsData] = useState([]);


  /* ─── LAUNCH CALENDAR STATE ─── */
  const [lcSearch, setLcSearch] = useState("");
  const [lcDev, setLcDev] = useState("All");
  const [lcStatus, setLcStatus] = useState("All");
  const [lcType, setLcType] = useState("All");
  const [lcView, setLcView] = useState("newspaper");

  /* ─── NEIGHBOURHOODS STATE ─── */
  const [nbhSearch, setNbhSearch] = useState("");
  const [nbhTypeFilter, setNbhTypeFilter] = useState("All");
  const [nbhYieldFilter, setNbhYieldFilter] = useState("All");
  const [nbhRiskFilter, setNbhRiskFilter] = useState("All");
  const [nbhSort, setNbhSort] = useState("yield");
  const [nbhView, setNbhView] = useState("grid");
  const [nbhCompare, setNbhCompare] = useState([]);

  /* ─── CURRENCY STATE ─── */
  const [selectedCcy, setSelectedCcy] = useState("USD");
  const [aedAmount, setAedAmount] = useState(100000);
  const [searchCcy, setSearchCcy] = useState("");


  /* ─── PROJECTS TAB FILTER STATE ─── */
  const [projMode, setProjMode] = useState("Apartment");
  const [projView, setProjView] = useState("grid");
  const [projSearch, setProjSearch] = useState("");
  const [projDev, setProjDev] = useState("All");
  const [projCommunity, setProjCommunity] = useState("All");
  const [projStatus, setProjStatus] = useState("All");
  const [projBeds, setProjBeds] = useState("All");
  const [projPriceMin, setProjPriceMin] = useState(0);
  const [projPriceMax, setProjPriceMax] = useState(999999999);
  const [projHandover, setProjHandover] = useState("All");
  const [projSort, setProjSort] = useState("score");
  const [projGrade, setProjGrade] = useState("All");
  const [projIntelFilter, setProjIntelFilter] = useState("all"); // all | tier1 | gv | branded
  const [projFurnished, setProjFurnished] = useState(false);


  /* ─── PROJECT MODAL STATE ─── */
  const [selectedProject, setSelectedProject] = useState(null);
  const [projDetailTab, setProjDetailTab] = useState("Overview");
  const [projCompare, setProjCompare] = useState([]);
  // Sync projCompare -> compareList so the comparison modal sees selections from Projects tab
  useEffect(() => { setCompareList(projCompare); }, [projCompare]);
  const [showCompare, setShowCompare] = useState(false);


  /* ─── SERVICE CHARGES TAB STATE ─── */
  const [scView, setScView] = useState("table");
  const [scType, setScType] = useState("All");
  const [scSort, setScSort] = useState("rate");
  const [scSearch, setScSearch] = useState("");
  const [scCalcSize, setScCalcSize] = useState(1000);
  const [scCalcRate, setScCalcRate] = useState(15);
  const [scCalcRent, setScCalcRent] = useState(90000);
  /* ─── HANDOVER TAB STATE ─── */
  /* ─── HANDOVER DETAIL VIEW STATE ─── */
  const [hdvFilter, setHdvFilter] = useState("All");
  const [hdvDev, setHdvDev] = useState("All");
  const [hdvCommunity, setHdvCommunity] = useState("All");
  const [hdvRisk, setHdvRisk] = useState("All");
  const [hdvView, setHdvView] = useState("cards");
  const [hdvSearch, setHdvSearch] = useState("");
  const [hdvSelected, setHdvSelected] = useState(null);
  /* ─── HANDOVER TAB STATE ─── */
  const [hvFilter, setHvFilter] = useState("All");
  const [hvSort, setHvSort] = useState("handover");
  const [hvDev, setHvDev] = useState("All");
  const [hvSearch, setHvSearch] = useState("");
  const [hvView, setHvView] = useState("cards");
  const [hvSelected, setHvSelected] = useState(null);
  const [liveHandover, setLiveHandover] = useState([]);

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
        const res = await fetch("/api/proxy?service=stock&symbol=EMAAR.DU&range=1d&interval=1d");
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
          const res = await fetch("/api/proxy?service=claude", {
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
          const parsed = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
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


  const SEED_PROJECTS = [
    { id:"p001", tier:1, goldenVisa:true, appreciationToHandover:32, branded:false, velocityScore:86, commission:2.0, type:"Apartment", developer:"Emaar", project:"Golf Grand — Phase 2", community:"Dubai Hills Estate", status:"Off-Plan", handover:"Q4 2027", beds:["1BR","2BR","3BR"], sizeMin:748, sizeMax:1842, priceMin:1200000, priceMax:3800000, ppsf:1850,
      unitBreakdown:[
        { type:"1BR", sizeMin:748,  sizeMax:900,  priceMin:1200000, priceMax:1650000, ppsf:1850, grossYield:7.2, available:42 },
        { type:"2BR", sizeMin:1100, sizeMax:1380, priceMin:1980000, priceMax:2550000, ppsf:1800, grossYield:6.8, available:28 },
        { type:"3BR", sizeMin:1600, sizeMax:1842, priceMin:2900000, priceMax:3800000, ppsf:1780, grossYield:6.2, available:14 },
      ], paymentPlan:"80/20", postHandover:false, grossYield:6.8, netYield:5.4, serviceCharge:16, investmentScore:84, distMetro:3.5, distDIFC:12, distAirport:28, distBeach:18, distMall:2.2, distSchool:0.8, distHospital:4, amenities:["Pool","Gym","Golf Course","Kids Area","BBQ","Retail","Cycling Track"], view:["Golf View","Garden View"], reraNo:"0991234567", escrowBank:"Emirates NBD", constructionPct:15, developerScore:92, notes:"Overlooking 18-hole championship golf course. Emaar proven delivery. Strong resale liquidity in Dubai Hills.", isSeedData:true, source:"Emaar Official / Bayut Apr 2026" },
    { id:"p002", tier:2, goldenVisa:true, appreciationToHandover:22, branded:false, velocityScore:72, commission:3.0, type:"Apartment", developer:"DAMAC Properties", project:"Lagoons — Azure Beach", community:"DAMAC Lagoons", status:"Off-Plan", handover:"Q2 2027", beds:["Studio","1BR","2BR"], sizeMin:420, sizeMax:1240, priceMin:680000, priceMax:2100000, ppsf:1420,
      unitBreakdown:[
        { type:"Studio", sizeMin:420, sizeMax:520,  priceMin:680000,  priceMax:820000,  ppsf:1480, grossYield:8.2, available:60 },
        { type:"1BR",    sizeMin:650, sizeMax:820,  priceMin:950000,  priceMax:1200000, ppsf:1420, grossYield:7.4, available:45 },
        { type:"2BR",    sizeMin:980, sizeMax:1240, priceMin:1550000, priceMax:2100000, ppsf:1380, grossYield:6.8, available:22 },
      ], paymentPlan:"70/30", postHandover:true, grossYield:7.4, netYield:5.9, serviceCharge:14, investmentScore:76, distMetro:5.5, distDIFC:22, distAirport:35, distBeach:25, distMall:3.8, distSchool:1.2, distHospital:6, amenities:["Lagoon Pool","Beach Access","Gym","Waterpark","Restaurants","Kids Club"], view:["Lagoon View","Pool View"], reraNo:"0882345678", escrowBank:"Dubai Islamic Bank", constructionPct:35, developerScore:78, notes:"Mediterranean-inspired community. Private lagoon access. High demand from European buyers.", isSeedData:true, source:"DAMAC Official / PropertyFinder Apr 2026" },
    { id:"p003", tier:1, goldenVisa:true, appreciationToHandover:33, branded:false, velocityScore:89, commission:2.0, type:"Apartment", developer:"Sobha Realty", project:"Hartland II — Skyvista", community:"Sobha Hartland", status:"Off-Plan", handover:"Q3 2027", beds:["1BR","2BR","3BR","4BR"], sizeMin:780, sizeMax:2800, priceMin:1800000, priceMax:6500000, ppsf:2100,
      unitBreakdown:[
        { type:"1BR", sizeMin:780,  sizeMax:950,  priceMin:1800000, priceMax:2200000, ppsf:2180, grossYield:6.8, available:38 },
        { type:"2BR", sizeMin:1200, sizeMax:1450, priceMin:2600000, priceMax:3200000, ppsf:2100, grossYield:6.2, available:30 },
        { type:"3BR", sizeMin:1800, sizeMax:2100, priceMin:3800000, priceMax:4600000, ppsf:2050, grossYield:5.8, available:18 },
        { type:"4BR", sizeMin:2400, sizeMax:2800, priceMin:5200000, priceMax:6500000, ppsf:2020, grossYield:5.2, available:8  },
      ], paymentPlan:"70/30", postHandover:false, grossYield:6.2, netYield:4.9, serviceCharge:18, investmentScore:82, distMetro:2.8, distDIFC:8, distAirport:18, distBeach:22, distMall:6, distSchool:0.5, distHospital:3, amenities:["Infinity Pool","Gym","Spa","Concierge","Kids Pool","Retail","Co-working"], view:["Creek View","Burj Khalifa View","City View"], reraNo:"0773456789", escrowBank:"Mashreq Bank", constructionPct:28, developerScore:88, notes:"Sobha known for quality finishes and on-time delivery. Creek views. Walking distance to top schools.", isSeedData:true, source:"Sobha Official / Bayut Apr 2026" },
    { id:"p004", tier:2, goldenVisa:false, appreciationToHandover:25, branded:false, velocityScore:72, commission:4.0, type:"Apartment", developer:"Binghatti", project:"Skyrise — Business Bay", community:"Business Bay", status:"Off-Plan", handover:"Q1 2027", beds:["Studio","1BR","2BR"], sizeMin:380, sizeMax:1050, priceMin:750000, priceMax:2200000, ppsf:1980,
      unitBreakdown:[
        { type:"Studio", sizeMin:380, sizeMax:480,  priceMin:750000,  priceMax:920000,  ppsf:2050, grossYield:8.8, available:80 },
        { type:"1BR",    sizeMin:620, sizeMax:780,  priceMin:1200000, priceMax:1550000, ppsf:1980, grossYield:7.8, available:55 },
        { type:"2BR",    sizeMin:950, sizeMax:1050, priceMin:1850000, priceMax:2200000, ppsf:1940, grossYield:7.0, available:30 },
      ], paymentPlan:"60/40", postHandover:false, grossYield:7.8, netYield:6.1, serviceCharge:18, investmentScore:74, distMetro:0.4, distDIFC:2.5, distAirport:14, distBeach:20, distMall:4, distSchool:3, distHospital:2, amenities:["Rooftop Pool","Gym","Sky Lounge","Retail","Canal Views"], view:["Canal View","Burj Khalifa View","City View"], reraNo:"0664567890", escrowBank:"ADCB", constructionPct:55, developerScore:81, notes:"Binghatti signature bold architecture. Steps from metro. Canal views attract high-yield tenants.", isSeedData:true, source:"Binghatti Official / Bayut Apr 2026" },
    { id:"p005", tier:1, goldenVisa:true, appreciationToHandover:30, branded:false, velocityScore:81, commission:2.0, type:"Apartment", developer:"Ellington Properties", project:"Ocean House", community:"Dubai Islands", status:"Off-Plan", handover:"Q2 2026", beds:["1BR","2BR","3BR","4BR"], sizeMin:920, sizeMax:4200, priceMin:2400000, priceMax:18000000, ppsf:2800,
      unitBreakdown:[
        { type:"1BR", sizeMin:920,  sizeMax:1100, priceMin:2400000,  priceMax:3200000,  ppsf:2950, grossYield:6.8, available:12 },
        { type:"2BR", sizeMin:1400, sizeMax:1800, priceMin:4200000,  priceMax:5500000,  ppsf:2850, grossYield:6.2, available:8  },
        { type:"3BR", sizeMin:2200, sizeMax:2800, priceMin:6800000,  priceMax:9000000,  ppsf:2780, grossYield:5.8, available:5  },
        { type:"4BR", sizeMin:3400, sizeMax:4200, priceMin:12000000, priceMax:18000000, ppsf:2700, grossYield:5.2, available:3  },
      ], paymentPlan:"70/30", postHandover:false, grossYield:6.0, netYield:4.6, serviceCharge:20, investmentScore:79, distMetro:1.2, distDIFC:16, distAirport:20, distBeach:0.1, distMall:8, distSchool:4, distHospital:5, amenities:["Beach Access","Infinity Pool","Spa","Gym","Concierge","Yacht Jetty"], view:["Sea View","Beach View","Marina View"], reraNo:"0555678901", escrowBank:"Emirates NBD", constructionPct:78, developerScore:86, notes:"Ellington curated design. Beachfront. Dubai Islands 24% price growth 2025. Near ready.", isSeedData:true, source:"Ellington Official / Alkira Feb 2026" },
    { id:"p006", tier:1, goldenVisa:true, appreciationToHandover:38, branded:false, velocityScore:88, commission:2.0, type:"Villa", developer:"Emaar", project:"The Oasis — Phase 11", community:"The Oasis", status:"Off-Plan", handover:"Q2 2029", beds:["4BR","5BR","6BR"], sizeMin:5800, sizeMax:14000, priceMin:6150000, priceMax:32000000, ppsf:1480,
      unitBreakdown:[
        { type:"4BR Villa",    sizeMin:5800,  sizeMax:7200,  plotMin:7500,  plotMax:10000, priceMin:6150000,  priceMax:9500000,  ppsf:1520, grossYield:5.2, available:28 },
        { type:"5BR Villa",    sizeMin:7800,  sizeMax:9500,  plotMin:10000, plotMax:14000, priceMin:10500000, priceMax:16000000, ppsf:1490, grossYield:4.8, available:18 },
        { type:"6BR Mansion",  sizeMin:11000, sizeMax:14000, plotMin:16000, plotMax:22000, priceMin:20000000, priceMax:32000000, ppsf:1450, grossYield:4.2, available:8  },
      ], paymentPlan:"80/20", postHandover:false, grossYield:4.8, netYield:3.8, serviceCharge:6, investmentScore:86, plotMin:7500, plotMax:22000, privatePool:true, garage:2, maidRoom:true, distMetro:8, distDIFC:25, distAirport:32, distBeach:28, distMall:6, distSchool:3, distHospital:8, amenities:["Lagoon Pool","Wave Pool","Polo Fields","Equestrian","Golf","Clubhouse","Cycling Tracks"], view:["Lagoon View","Garden View","Golf View"], reraNo:"0446789012", escrowBank:"Emirates NBD", constructionPct:8, developerScore:92, notes:"10:1 scarcity vs Dubai Hills. Emaar ultra-luxury 60M sqft master plan.", isSeedData:true, source:"Emaar Official / Alkira Feb 2026" },
    { id:"p007", tier:1, goldenVisa:true, appreciationToHandover:28, branded:false, velocityScore:100, commission:2.0, type:"Villa", developer:"Majid Al Futtaim", project:"Serenity Mansions", community:"Tilal Al Ghaf", status:"Sold Out", handover:"Q4 2027", beds:["5BR","6BR","7BR"], sizeMin:9500, sizeMax:18000, priceMin:8500000, priceMax:45000000, ppsf:1650, paymentPlan:"50/50", postHandover:false, grossYield:4.2, netYield:3.3, serviceCharge:8, investmentScore:80, privatePool:true, garage:3, maidRoom:true, distMetro:5, distDIFC:20, distAirport:30, distBeach:24, distMall:4, distSchool:1.5, distHospital:6, amenities:["Private Beach","Crystal Lagoon","Tennis","Padel","Golf","Stables"], view:["Lake View","Garden View","Lagoon View"], reraNo:"0337890123", escrowBank:"FAB", constructionPct:62, developerScore:89, notes:"Sold out in 48 hours. Tilal Al Ghaf 52% YoY growth DLD 2025.", isSeedData:true, source:"DLD 2025 / Majid Al Futtaim" },
    { id:"p008", tier:1, goldenVisa:true, appreciationToHandover:32, branded:false, velocityScore:84, commission:2.0, type:"Townhouse", developer:"Nakheel", project:"Dubai Islands — Cluster B", community:"Dubai Islands", status:"Off-Plan", handover:"Q4 2027", beds:["3BR","4BR"], sizeMin:2200, sizeMax:3800, priceMin:3200000, priceMax:6500000, ppsf:1620,
      unitBreakdown:[
        { type:"3BR TH", sizeMin:2200, sizeMax:2600, plotMin:2800, plotMax:3500, priceMin:3200000, priceMax:4200000, ppsf:1680, grossYield:6.8, available:35 },
        { type:"4BR TH", sizeMin:3000, sizeMax:3800, plotMin:3800, plotMax:5000, priceMin:4800000, priceMax:6500000, ppsf:1580, grossYield:6.1, available:20 },
      ], paymentPlan:"60/40", postHandover:false, grossYield:6.4, netYield:5.1, serviceCharge:12, investmentScore:81, plotMin:2800, plotMax:5000, privatePool:false, garage:2, maidRoom:true, distMetro:1.5, distDIFC:18, distAirport:22, distBeach:0.3, distMall:8, distSchool:3, distHospital:5, amenities:["Community Pool","Beach Club","Gym","Kids Area","Cycling Track","Retail Strip"], view:["Sea View","Garden View"], reraNo:"0228901234", escrowBank:"Nakheel Escrow / DIB", constructionPct:22, developerScore:85, notes:"Beachfront townhouses. Dubai Islands 24% price growth 2025.", isSeedData:true, source:"Nakheel Official / Alkira Feb 2026" },
    { id:"p009", tier:1, goldenVisa:true, appreciationToHandover:25, branded:true, brandPartner:"Dorchester Collection", velocityScore:78, commission:2.0, type:"Hotel Apartment", developer:"Omniyat", project:"Orla Infinity", community:"Palm Jumeirah", status:"Off-Plan", handover:"Q4 2027", beds:["Studio","1BR","2BR","3BR"], sizeMin:800, sizeMax:6500, priceMin:4500000, priceMax:65000000, ppsf:4800,
      unitBreakdown:[
        { type:"Studio",     sizeMin:800,  sizeMax:1000, priceMin:4500000,  priceMax:6000000,  ppsf:5200, grossYield:8.2, available:20 },
        { type:"1BR Suite",  sizeMin:1200, sizeMax:1600, priceMin:7500000,  priceMax:10000000, ppsf:5000, grossYield:7.6, available:15 },
        { type:"2BR Suite",  sizeMin:2200, sizeMax:3000, priceMin:14000000, priceMax:20000000, ppsf:4800, grossYield:7.0, available:10 },
        { type:"3BR Suite",  sizeMin:4000, sizeMax:6500, priceMin:35000000, priceMax:65000000, ppsf:4600, grossYield:6.2, available:5  },
      ], paymentPlan:"50/50", postHandover:false, grossYield:7.2, netYield:5.5, serviceCharge:28, investmentScore:77, hotelOperator:"Dorchester Collection", starRating:5, dtcmLicense:true, revenueShare:65, managementFee:15, avgDailyRate:3200, occupancyRate:82, distMetro:2.2, distDIFC:20, distAirport:32, distBeach:0.05, distMall:18, distSchool:8, distHospital:12, amenities:["Private Beach","5-Star Spa","Infinity Pool","Fine Dining","Butler Service","Yacht Jetty"], view:["Sea View","Palm View","Burj Al Arab View"], reraNo:"0119012345", escrowBank:"Emirates NBD", constructionPct:45, developerScore:88, notes:"Managed by Dorchester Collection. 65% revenue to owner. 4 weeks personal use.", isSeedData:true, source:"Omniyat Official / Bayut Apr 2026" },
    { id:"p010", tier:1, goldenVisa:true, appreciationToHandover:0, branded:false, velocityScore:0, commission:5.0, type:"Office", developer:"Brookfield Properties", project:"ICD Brookfield Place", community:"DIFC", status:"Ready", handover:"Available Now", beds:[], sizeMin:1200, sizeMax:45000, priceMin:3500000, priceMax:280000000, ppsf:3200, paymentPlan:"Cash / Mortgage", postHandover:false, grossYield:7.2, netYield:5.8, serviceCharge:38, investmentScore:85, officeGrade:"A", fitOut:"Shell & Core", parking:4, freeZone:true, licenseTypes:["Financial","Professional","Tech"], leedCertified:true, wault:4.2, vacancyRate:0.3, distMetro:0.3, distDIFC:0, distAirport:16, distBeach:18, distMall:8, distSchool:6, distHospital:4, amenities:["Concierge","F&B Ground Floor","Conference Rooms","Gym","EV Charging","24h Security"], reraNo:"0000123456", escrowBank:"N/A", constructionPct:100, developerScore:95, notes:"Grade A DIFC. Near-zero vacancy. Institutional tenant base. LEED Platinum. 30% DIFC growth 2025.", isSeedData:true, source:"DIFC Official / Chestertons Mar 2026" },
    { id:"p011", tier:1, goldenVisa:true, appreciationToHandover:0, branded:false, velocityScore:0, commission:5.0, type:"Retail", developer:"Meraas", project:"City Walk — Retail Units", community:"City Walk", status:"Ready", handover:"Available Now", beds:[], sizeMin:800, sizeMax:8000, priceMin:2800000, priceMax:42000000, ppsf:3800, paymentPlan:"Cash / Mortgage", postHandover:false, grossYield:8.4, netYield:6.8, serviceCharge:32, investmentScore:82, shopType:"Inline / Corner", frontageMin:8, frontageMax:24, ceilingHeight:4.5, greaseTrap:true, loadingBay:true, signageRights:true, groundFloor:true, dailyFootfall:45000, distMetro:1.8, distDIFC:4, distAirport:18, distBeach:3, distMall:0, distSchool:5, distHospital:4, amenities:["High Footfall","Tourist Zone","Ample Parking","F&B Ready","Flex Fit-Out"], reraNo:"0000234567", escrowBank:"N/A", constructionPct:100, developerScore:90, notes:"City Walk 45K daily visitors. Tourism zone. Strong F&B and lifestyle tenant mix.", isSeedData:true, source:"Meraas Official / Chestertons 2026" },
    { id:"p012", tier:2, goldenVisa:true, appreciationToHandover:0, branded:false, velocityScore:0, commission:5.0, type:"Warehouse", developer:"DIC Authority", project:"Dubai Industrial City — Unit W7", community:"Dubai Industrial City", status:"Ready", handover:"Available Now", beds:[], sizeMin:10000, sizeMax:80000, priceMin:4500000, priceMax:48000000, ppsf:580, paymentPlan:"Cash / Mortgage", postHandover:false, grossYield:9.8, netYield:8.2, serviceCharge:8, investmentScore:78, warehouseType:"Dry Storage / Light Industrial", clearHeight:12, loadingDocks:8, officeComponent:1800, yardSpace:15000, rollerShutters:6, fireSuppression:true, freeZone:true, occupancyRate:96, distPort:28, distMetro:8, distDIFC:40, distAirport:18, amenities:["24h Access","Security","Heavy Vehicle Access","On-site Management","CCTV"], reraNo:"0000345678", escrowBank:"N/A", constructionPct:100, developerScore:87, notes:"DIC 96% occupancy. E-commerce demand driving rents up 15% YoY. Near Al Maktoum Airport.", isSeedData:true, source:"Dubai Industrial City / Chestertons 2026" },
    { id:"p013", tier:2, goldenVisa:true, appreciationToHandover:0, branded:false, velocityScore:0, commission:2.0, type:"Land", developer:"Dubai South", project:"Residential Plot — Phase 3", community:"Dubai South", status:"Ready", handover:"Available Now", beds:[], sizeMin:15000, sizeMax:120000, priceMin:2800000, priceMax:18000000, ppsf:200, paymentPlan:"Cash", postHandover:false, grossYield:0, netYield:0, serviceCharge:0, investmentScore:72, plotType:"Residential", zoning:"R1", permittedFAR:2.5, maxFloors:8, utilitiesConnected:true, roadFrontage:45, titleDeedStatus:"Freehold", gdvEstimate:45000000, distMetro:4, distDIFC:38, distAirport:12, distBeach:35, distMall:6, distSchool:2, distHospital:5, amenities:["Road Access","DEWA Connected","Sewage Connected","Master Plan Community"], reraNo:"0000456789", escrowBank:"N/A", constructionPct:0, developerScore:82, notes:"Dubai South Expo 2020 legacy. Near Al Maktoum Airport expansion. FAR 2.5 allows G+8.", isSeedData:true, source:"Dubai South Official / DLD 2025" },
  ];


  const MODES = [
    { key:"Apartment" }, { key:"Villa" }, { key:"Townhouse" },
    { key:"Hotel Apartment" }, { key:"Office" }, { key:"Retail" },
    { key:"Warehouse" }, { key:"Land" },
  ];


  const toggleCompare = (p) => {
    setCompareList(prev => {
      const exists = prev.find(x => x.id === p.id);
      if (exists) {
        notify("Removed " + p.name + " from comparison");
        return prev.filter(x => x.id !== p.id);
      }
      if (prev.length >= 3) {
        notify("⚠️ Max 3 projects for comparison");
        return prev;
      }
      notify("✅ Added " + p.name + " to comparison");
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
      /* marketData handled by collection listener, not tabData doc */
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

    
    /* ─── MARKET DATA ─── */
    unsubs.push(onSnapshot(collection(db, "marketData"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }))
                         .filter(x => x.metric && x.value);
      if (d.length > 0) setLiveMarketData(d);
    }, () => {}));

    /* ─── HANDOVER ─── */
    unsubs.push(onSnapshot(collection(db, "handover"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLiveHandover(d);
    }, () => {}));

    /* ─── SERVICE CHARGES ─── */
    unsubs.push(onSnapshot(collection(db, "serviceCharges"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLiveServiceCharges(d);
    }, () => {}));

    /* ─── DLD VOLUMES ─── */
    unsubs.push(onSnapshot(collection(db, "dldVolumes"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLiveDLDVolumes(d);
    }, () => {}));

    /* ─── NEIGHBOURHOODS ─── */
    unsubs.push(onSnapshot(collection(db, "neighbourhoods"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLiveNeighbourhoods(d);
    }, () => {}));

    /* ─── STR DATA ─── */
    unsubs.push(onSnapshot(collection(db, "strData"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLiveSTRData(d);
    }, () => {}));

    /* ─── YIELDS DATA ─── */
    unsubs.push(onSnapshot(collection(db, "yieldsData"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLiveYieldsData(d);
    }, () => {}));

    /* ─── MORTGAGE RATES ─── */
    unsubs.push(onSnapshot(collection(db, "mortgageRates"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLiveMortgageRates(d);
    }, () => {}));

    /* ─── PORTFOLIO (user-specific) ─── */
    if (auth.currentUser?.uid) {
      unsubs.push(onSnapshot(
        query(collection(db, "portfolios"), where("userId", "==", auth.currentUser.uid)),
        snap => {
          const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
          setLivePortfolio(d);
        }, () => {}
      ));
    }

    /* ─── ALL LEADS (admin/general view) ─── */
    if (auth.currentUser?.uid) {
      unsubs.push(onSnapshot(
        query(collection(db, "leads"), orderBy("createdAt", "desc"), limit(500)),
        snap => {
          const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
          setLiveLeads(d);
        }, () => {}
      ));
    }

    /* ─── INVEST SCORES ─── */
    unsubs.push(onSnapshot(collection(db, "investScores"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLiveInvestScores(d);
    }, () => {}));

    /* ─── RISK DATA ─── */
    unsubs.push(onSnapshot(collection(db, "riskData"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLiveRisk(d);
    }, () => {}));

    /* ─── FINANCIALS ─── */
    unsubs.push(onSnapshot(collection(db, "financials"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLiveFinancials(d);
    }, () => {}));

    /* ─── DEV HEALTH ─── */
    unsubs.push(onSnapshot(collection(db, "devHealth"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLiveDevHealth(d);
    }, () => {}));

    /* ─── COMPETITORS ─── */
    unsubs.push(onSnapshot(collection(db, "competitors"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLiveCompetitors(d);
    }, () => {}));

    /* ─── LAUNCH CALENDAR ─── */
    unsubs.push(onSnapshot(collection(db, "launches"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLiveLaunches(d);
    }, () => {}));

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
                      change_type: "\uD83D\uDEA8 Last Day of Your Pro Trial!",
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
      await safeAsyncWithToast(() => setDoc(doc(db, "watchlists", auth.currentUser.uid), { projects: updated, updatedAt: new Date().toISOString() }), "watchlist-save", notify, "Couldn't save your watchlist — try again");
    }
    notify(isWatched ? `Removed ${project.name} from watchlist` : `⭐ ${project.name} added to watchlist`);
  };

  // Price alerts now live via user onSnapshot listener

  const saveAlerts = async (alerts) => {
    setMyAlerts(alerts);
    if (auth.currentUser) {
      await safeAsyncWithToast(() => setDoc(doc(db, "priceAlerts", auth.currentUser.uid), { alerts, updatedAt: new Date().toISOString() }), "price-alerts-save", notify, "Couldn't save your price alerts — try again");
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
    notify("✅ Added to portfolio!");
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
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>\uD83D\uDEAB</div>
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
        enterprise: { subject: "Welcome to DXB Analytics Enterprise! \uD83C\uDFE2", body: "Your account has been upgraded to Enterprise. You have access to all platform features including custom reports, priority support, and full data access." },
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
    try { localStorage.setItem('dxb_active_tab', key); } catch(e) {}
    try { window.history.pushState({ tab: key }, '', '#' + key.replace(/ /g, '-').toLowerCase()); } catch(e) {}
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
                    {typeof group.icon === "function" ? group.icon({ width: 12, height: 12, strokeWidth: 2, style: { flexShrink: 0 } }) : null}
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
                          {typeof t.icon === "function" ? t.icon({ width: 15, height: 15, strokeWidth: isActive ? 2 : 1.5, style: { flexShrink: 0, color: isActive ? T.gold : "inherit" } }) : null}
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
            <span style={{ fontSize: 14 }}>\uD83D\uDD12</span>
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
            ★ {watchlist.length > 0 && <span style={{ fontWeight: 700 }}>{watchlist.length}</span>}
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
          const icon = isUrgent ? "\uD83D\uDEA8" : isWarning ? "⚠️" : "⭐";
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
                {isUrgent ? "\uD83D\uDD25 Upgrade Now" : "Upgrade to Pro"}
              </button>
            </div>
          );
        })()}
        {userTier === "free" && (
          <div style={{ margin: "12px 24px 0", padding: "10px 16px", borderRadius: 10, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>\uD83D\uDD12</span>
              <span style={{ fontSize: 13, color: T.white, fontWeight: 600 }}>Free Plan</span>
              <span style={{ fontSize: 12, color: T.textSecondary }}>— You're seeing limited data. Upgrade to unlock all projects, yields & more.</span>
            </div>
            <button type="button" onClick={() => setShowUpgrade(true)} style={{ padding: "6px 16px", borderRadius: 6, background: T.gold, color: T.bg, border: "none", fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: "pointer" }}>Upgrade to Pro — AED 99/mo</button>
          </div>
        )}
        <div style={{ padding: `0 24px ${compareList.length > 0 && tab === "Projects" ? "120px" : "60px"}` }}>
          <TabErrorBoundary key={tab}>

          {/* ─── OVERVIEW TAB ─── */}
          {/* OVERVIEW TAB (extracted) */}
          {tab === "Overview" && (
            <OverviewTab
              liveMarketData={liveMarketData} liveDLDVolumes={liveDLDVolumes}
              liveDevHealth={liveDevHealth} liveMortgageRates={liveMortgageRates}
              liveYields={liveYields}
              allDevelopers={allDevelopers} deals={deals} listings={listings}
              myLeads={myLeads} myPortfolio={myPortfolio} watchlist={watchlist}
              aiInsights={aiInsights} gDeveloper={gDeveloper} lastDataSync={lastDataSync}
              handleTabChange={handleTabChange}
            />
          )}

          {/* ─── MARKET TAB ─── */}
          {/* ─── MARKET TAB (extracted) ─── */}
          {tab === "Market" && (
            <MarketTab
              liveMarketData={liveMarketData} allDevelopers={allDevelopers}
              expandedForecast={expandedForecast} setExpandedForecast={setExpandedForecast}
              handleTabChange={handleTabChange}
            />
          )}

          {/* ─── DLD VOLUMES TAB ─── */}
          {/* ─── DLD VOLUMES TAB (extracted) ─── */}
          {tab === "DLD Volumes" && (
            <DLDVolumesTab
              dldFilter={dldFilter} setDldFilter={setDldFilter}
              dldSearch={dldSearch} setDldSearch={setDldSearch}
              dldSort={dldSort} setDldSort={setDldSort}
              dldView={dldView} setDldView={setDldView}
              liveDLDVolumes={liveDLDVolumes}
              handleTabChange={handleTabChange}
            />
          )}

          {/* ─── PRICE HISTORY TAB ─── */}
          {/* ─── PRICE HISTORY TAB (extracted) ─── */}
          {tab === "Price History" && (
            <PriceHistoryTab
              phCommunity={phCommunity} setPhCommunity={setPhCommunity}
              phType={phType} setPhType={setPhType}
              phBeds={phBeds} setPhBeds={setPhBeds}
              phView={phView} setPhView={setPhView}
              phCompare={phCompare} setPhCompare={setPhCompare}
              phCommunity2={phCommunity2} setPhCommunity2={setPhCommunity2}
              liveMarketData={liveMarketData}
              handleTabChange={handleTabChange}
            />
          )}

          {/* ─── NEIGHBOURHOODS TAB ─── */}
          {/* ─── NEIGHBOURHOODS TAB (extracted) ─── */}
          {tab === "Neighbourhoods" && (
            <NeighbourhoodsTab
              nbhSearch={nbhSearch} setNbhSearch={setNbhSearch}
              nbhTypeFilter={nbhTypeFilter} setNbhTypeFilter={setNbhTypeFilter}
              nbhYieldFilter={nbhYieldFilter} setNbhYieldFilter={setNbhYieldFilter}
              nbhRiskFilter={nbhRiskFilter} setNbhRiskFilter={setNbhRiskFilter}
              nbhSort={nbhSort} setNbhSort={setNbhSort}
              nbhView={nbhView} setNbhView={setNbhView}
              nbhCompare={nbhCompare} setNbhCompare={setNbhCompare}
              liveNeighbourhoods={liveNeighbourhoods}
              liveCommunityROI={liveCommunityROI}
              liveMarketData={liveMarketData}
              handleTabChange={handleTabChange}
              selectedNbhd={selectedNbhd} setSelectedNbhd={setSelectedNbhd}
            />
          )}

          {/* ─── LAUNCH CALENDAR TAB ─── */}
          {/* ─── LAUNCH CALENDAR TAB (extracted) ─── */}
          {tab === "Launch Calendar" && (
            <LaunchCalendarTab
              lcSearch={lcSearch} setLcSearch={setLcSearch}
              lcDev={lcDev} setLcDev={setLcDev}
              lcStatus={lcStatus} setLcStatus={setLcStatus}
              lcType={lcType} setLcType={setLcType}
              lcView={lcView} setLcView={setLcView}
              liveMarketData={liveMarketData}
              liveLaunches={liveLaunches}
              handleTabChange={handleTabChange}
            />
          )}

          {/* ─── CURRENCY TAB ─── */}
          {/* ─── CURRENCY TAB (extracted) ─── */}
          {tab === "Currency" && (
            <CurrencyTab
              selectedCcy={selectedCcy} setSelectedCcy={setSelectedCcy}
              aedAmount={aedAmount} setAedAmount={setAedAmount}
              searchCcy={searchCcy} setSearchCcy={setSearchCcy}
            />
          )}

          {/* ─── PROJECTS TAB ─── */}
          {/* PROJECTS TAB (extracted, includes detail modal) */}
          {tab === "Projects" && (
            <ProjectsTab
              SEED_PROJECTS={SEED_PROJECTS} liveProjects={liveProjects} extraProjects={extraProjects}
              projSearch={projSearch} setProjSearch={setProjSearch}
              projDev={projDev} setProjDev={setProjDev}
              projCommunity={projCommunity} setProjCommunity={setProjCommunity}
              projStatus={projStatus} setProjStatus={setProjStatus}
              projBeds={projBeds} setProjBeds={setProjBeds}
              projHandover={projHandover} setProjHandover={setProjHandover}
              projSort={projSort} setProjSort={setProjSort}
              projGrade={projGrade} setProjGrade={setProjGrade}
              projMode={projMode} setProjMode={setProjMode}
              projView={projView} setProjView={setProjView}
              projPriceMin={projPriceMin} projPriceMax={projPriceMax}
              projCompare={projCompare} setProjCompare={setProjCompare}
              projIntelFilter={projIntelFilter} setProjIntelFilter={setProjIntelFilter}
              selectedProject={selectedProject} setSelectedProject={setSelectedProject}
              projDetailTab={projDetailTab} setProjDetailTab={setProjDetailTab}
              showCompare={showCompare} setShowCompare={setShowCompare}
              handleTabChange={handleTabChange}
            />
          )}


          {/* ─── MAP TAB ─── */}
          {tab === "Map" && (
            <CommunityMapTab
              activeProjects={liveProjects?.length > 0 ? liveProjects : SEED_PROJECTS}
              liveCommunityROI={liveCommunityROI}
              setTab={handleTabChange}
              seedCommunities={SEED_DATA.communities}
            />
          )}




          {/* ═══ HANDOVER DETAIL OVERLAY ═══ */}
          {hvSelected && (
            <div role="dialog" aria-modal="true" style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.97)", zIndex:2000, display:"flex", flexDirection:"column", backdropFilter:"blur(8px)" }}>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 24px", borderBottom:`1px solid ${T.border}`, background:T.surface, flexShrink:0 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:3 }}>{hvSelected.developer}{"·"}{hvSelected.community}</div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:T.white }}>{hvSelected.project}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:11, color:T.textMuted }}>Construction Progress</div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, color:hvSelected.status==="On Track"?T.green:hvSelected.status==="Delayed"?"#F97316":T.red }}>{hvSelected.constructionPct}%</div>
                  </div>
                  <button type="button" onClick={() => setHvSelected(null)} style={{ width:36, height:36, borderRadius:"50%", background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontFamily:"'Outfit',sans-serif" }}>×</button>
                </div>
              </div>

              {/* Content */}
              <div style={{ flex:1, overflowY:"auto", padding:24 }}>
                {/* KPIs */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12, marginBottom:24 }}>
                  {[
                    { label:"Status",            value:hvSelected.status,        color:hvSelected.status==="On Track"?T.green:hvSelected.status==="Delayed"?"#F97316":T.red },
                    { label:"Delay Risk",         value:hvSelected.delayRisk,     color:hvSelected.delayRisk==="Low"?T.green:hvSelected.delayRisk==="Medium"?"#F97316":T.red },
                    { label:"Delay",              value:hvSelected.delayMonths>0?"+"+hvSelected.delayMonths+" months":"None", color:hvSelected.delayMonths>0?"#F97316":T.green },
                    { label:"Grace Period",       value:hvSelected.gracePeriodMonths+" months", color:T.white },
                    { label:"Escrow Funded",      value:hvSelected.escrowPct+"%", color:hvSelected.escrowPct>=70?T.green:hvSelected.escrowPct>=40?T.gold:"#F97316" },
                    { label:"RERA Inspections",   value:hvSelected.inspectionsPassed+"✓ "+hvSelected.inspectionsFailed+"✗", color:hvSelected.inspectionsFailed>0?"#F97316":T.green },
                    { label:"Developer On-Time",  value:hvSelected.developerOnTimeRate+"%", color:hvSelected.developerOnTimeRate>=85?T.green:hvSelected.developerOnTimeRate>=75?T.gold:T.red },
                    { label:"Total Units",        value:hvSelected.totalUnits.toLocaleString(), color:T.white },
                  ].map((k,i) => (
                    <div key={i} className="kpi-card">
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{k.label}</div>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:k.color }}>{k.value}</div>
                    </div>
                  ))}
                </div>

                {/* Milestone Gantt Timeline */}
                <div className="chart-box" style={{ padding:20, marginBottom:20 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Construction Milestone Timeline</div>
                  <div style={{ fontSize:11, color:T.textMuted, marginBottom:20 }}>RERA-verified progress · Each milestone unlocks escrow disbursement</div>
                  
                  {/* Timeline */}
                  <div style={{ position:"relative" }}>
                    {(hvSelected.milestones||[]).map((m, i) => {
                      const isLast = i === (hvSelected.milestones.length - 1);
                      const isPast = m.done;
                      const isCurrent = !m.done && i > 0 && hvSelected.milestones[i-1]?.done;
                      const isNext = !m.done && !isCurrent;
                      const dotColor = isPast ? T.green : isCurrent ? T.gold : T.border;
                      const lineColor = isPast ? T.green : T.border;
                      return (
                        <div key={i} style={{ display:"flex", gap:16, marginBottom:isLast?0:0 }}>
                          {/* Timeline line + dot */}
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, width:20 }}>
                            <div style={{ width:14, height:14, borderRadius:"50%", background:dotColor, border:`2px solid ${dotColor}`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:1 }}>
                              {isPast && <span style={{ fontSize:8, color:"#000", fontWeight:700 }}>✓</span>}
                              {isCurrent && <span style={{ width:4, height:4, borderRadius:"50%", background:T.gold, display:"block" }} />}
                            </div>
                            {!isLast && <div style={{ width:2, flex:1, minHeight:32, background:lineColor, marginTop:2 }} />}
                          </div>
                          {/* Milestone content */}
                          <div style={{ flex:1, paddingBottom:isLast?0:20 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                              <div>
                                <div style={{ fontSize:13, fontWeight:700, color:isPast?T.white:isCurrent?T.gold:T.textMuted }}>{m.name}</div>
                                {isCurrent && <div style={{ fontSize:10, color:T.gold, fontWeight:700 }}>← CURRENT STAGE</div>}
                              </div>
                              <div style={{ textAlign:"right" }}>
                                <div style={{ fontSize:11, fontWeight:600, color:isPast?T.green:isCurrent?T.gold:T.textMuted }}>{new Date(m.date).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
                                {m.pct > 0 && <div style={{ fontSize:10, color:T.textMuted }}>at {m.pct}% completion</div>}
                              </div>
                            </div>
                            {/* Escrow release indicator */}
                            {m.pct > 0 && (
                              <div style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:6, background:isPast?"rgba(16,185,129,0.1)":"rgba(212,168,67,0.06)", border:`1px solid ${isPast?"rgba(16,185,129,0.3)":"rgba(212,168,67,0.15)"}` }}>
                                <span style={{ fontSize:9, color:isPast?T.green:T.textMuted }}>Escrow release at {m.pct}% · {isPast?"✓ Released":"Pending"}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RERA + Legal Info */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                  <div className="chart-box" style={{ padding:18 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Regulatory Details</div>
                    {[
                      { label:"RERA Number",     value:hvSelected.reraNo },
                      { label:"Escrow Bank",      value:hvSelected.escrowBank },
                      { label:"RERA Status",      value:hvSelected.reraStatus },
                      { label:"Last Site Visit",  value:hvSelected.lastSiteVisit ? new Date(hvSelected.lastSiteVisit).toLocaleDateString("en-GB") : "—" },
                    ].map((r,i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:i<3?`1px solid ${T.border}`:"none" }}>
                        <span style={{ fontSize:11, color:T.textMuted }}>{r.label}</span>
                        <span style={{ fontSize:11, fontWeight:600, color:T.white }}>{r.value||"—"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="chart-box" style={{ padding:18 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Buyer Protection Summary</div>
                    <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.8 }}>
                      <div>Grace period: <strong style={{ color:T.white }}>{hvSelected.gracePeriodMonths} months</strong> after contracted date</div>
                      <div>Contracted: <strong style={{ color:T.white }}>{new Date(hvSelected.contractedHandover).toLocaleDateString("en-GB",{month:"long",year:"numeric"})}</strong></div>
                      <div>Expected: <strong style={{ color:hvSelected.delayMonths>0?"#F97316":T.white }}>{new Date(hvSelected.expectedHandover).toLocaleDateString("en-GB",{month:"long",year:"numeric"})}</strong></div>
                      <div style={{ marginTop:8, padding:"8px 10px", background:"rgba(20,184,166,0.08)", borderRadius:8, fontSize:11, color:T.teal }}>
                        {hvSelected.delayMonths > 0 
                          ? `Delayed ${hvSelected.delayMonths} months. Legal action possible after ${hvSelected.gracePeriodMonths}-month grace period.`
                          : "Project on track. No action needed."}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <button type="button" onClick={() => { setHvSelected(null); handleTabChange("Projects"); }} style={{ padding:"9px 18px", background:`linear-gradient(135deg,${T.gold},#B8922A)`, border:"none", borderRadius:8, color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>View Full Project →</button>
                  <button type="button" onClick={() => { setHvSelected(null); handleTabChange("My Leads"); }} style={{ padding:"9px 18px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textSecondary, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Add to Lead</button>
                  <button type="button" onClick={() => {
                    const txt = `\uD83C\uDFD7️ HANDOVER UPDATE — ${hvSelected.project}\n━━━━━━━━━━━━━━━━━━━━━━\n\uD83C\uDFE2 Developer: ${hvSelected.developer}\n\uD83D\uDCCD Community: ${hvSelected.community}\n\n\uD83D\uDCCA CONSTRUCTION STATUS\n   Progress: ${hvSelected.constructionPct}% complete\n   Status: ${hvSelected.status}\n   Current Stage: ${hvSelected.milestonesCurrent}\n   Next Milestone: ${hvSelected.milestonesNext}\n\n\uD83D\uDCC5 HANDOVER DATES\n   Contracted: ${new Date(hvSelected.contractedHandover).toLocaleDateString("en-GB",{month:"long",year:"numeric"})}\n   Expected: ${new Date(hvSelected.expectedHandover).toLocaleDateString("en-GB",{month:"long",year:"numeric"})}\n   Delay: ${hvSelected.delayMonths>0?"+"+hvSelected.delayMonths+" months":"None"}\n\n\uD83D\uDD10 REGULATORY\n   RERA: ${hvSelected.reraNo}\n   Escrow Bank: ${hvSelected.escrowBank}\n   Status: ${hvSelected.reraStatus}\n\nPowered by DXB Analytics Intelligence Platform\nemaar-dashboard.vercel.app`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank");
                  }} style={{ padding:"9px 18px", background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.3)", borderRadius:8, color:"#25D366", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                    Share Update
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── HANDOVER TAB ─── */}
          {/* ─── HANDOVER TAB (extracted to tabs/HandoverTab.jsx) ─── */}
          {tab === "Handover" && (
            <HandoverTab
              liveHandover={liveHandover}
              handleTabChange={handleTabChange}
            />
          )}

          {/* ═══ HANDOVER DETAIL OVERLAY ═══ */}
          {hdvSelected && (
            <div role="dialog" aria-modal="true" style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.97)", zIndex:2000, display:"flex", flexDirection:"column", backdropFilter:"blur(8px)" }}>
              {/* Overlay header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 24px", borderBottom:`1px solid ${T.border}`, background:T.surface, flexShrink:0 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:3 }}>{hdvSelected.developer}{"·"}{hdvSelected.community}</div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:T.white }}>{hdvSelected.project}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:22, fontWeight:800, color:(riskCfg[hdvSelected.status]||riskCfg["On Track"]).color, fontFamily:"'Fraunces',serif" }}>{hdvSelected.constructionPct}%</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>complete</div>
                  </div>
                  <button type="button" onClick={() => setHdvSelected(null)}
                    style={{ width:36, height:36, borderRadius:"50%", background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontFamily:"'Outfit',sans-serif" }}>×</button>
                </div>
              </div>
              {/* Overlay content */}
              <div style={{ flex:1, overflowY:"auto", padding:24 }}>
                {/* KPIs */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                  {[
                    { label:"Status", value:hdvSelected.status, color:(riskCfg[hdvSelected.status]||riskCfg["On Track"]).color },
                    { label:"Delay Risk", value:(riskCfg[hdvSelected.delayRisk]||riskCfg["Low"]).label, color:(riskCfg[hdvSelected.delayRisk]||riskCfg["Low"]).color },
                    { label:"Expected Handover", value:new Date(hdvSelected.expectedDate).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}), color:T.white },
                    { label:"Lost Rental/Month", value:"AED " + (hdvSelected.lostRentalPerMonth||0).toLocaleString(), color:hdvSelected.delayImpactPct > 0 ? T.red : T.textMuted },
                  ].map((kpi,i) => (
                    <div key={i} className="kpi-card">
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>{kpi.label}</div>
                      <div style={{ fontSize:16, fontWeight:700, color:kpi.color, lineHeight:1.3 }}>{kpi.value}</div>
                    </div>
                  ))}
                </div>
                {/* Milestone Gantt */}
                <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:16 }}>Construction Milestones — RERA Verified</div>
                  {(hdvSelected.milestones||[]).map((m,i) => {
                    const isNext = !m.done && (hdvSelected.milestones[i-1]?.done || i===0);
                    return (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                        {/* Status dot */}
                        <div style={{ width:14, height:14, borderRadius:"50%", background:m.done?T.green:isNext?"rgba(212,168,67,0.3)":T.border, border:`2px solid ${m.done?T.green:isNext?T.gold:T.border}`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {m.done && <div style={{ width:6, height:6, borderRadius:"50%", background:T.green }} />}
                          {isNext && <div style={{ width:6, height:6, borderRadius:"50%", background:T.gold }} />}
                        </div>
                        {/* Label */}
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                            <span style={{ fontSize:12, color:m.done?T.white:isNext?T.gold:T.textMuted, fontWeight:m.done||isNext?600:400 }}>{m.label}</span>
                            <span style={{ fontSize:11, color:T.textMuted }}>{new Date(m.date).toLocaleDateString("en-GB",{month:"short",year:"numeric"})}</span>
                          </div>
                          <div style={{ height:4, borderRadius:2, background:T.border }}>
                            <div style={{ height:"100%", width:`${m.pct}%`, borderRadius:2, background:m.done?T.green:isNext?T.gold:T.border+"44" }} />
                          </div>
                        </div>
                        {/* Done badge */}
                        <span style={{ fontSize:10, padding:"2px 7px", borderRadius:6, background:m.done?"rgba(16,185,129,0.15)":isNext?"rgba(212,168,67,0.1)":"transparent", color:m.done?T.green:isNext?T.gold:T.textMuted, fontWeight:700, flexShrink:0, width:60, textAlign:"center" }}>
                          {m.done?"✓ Done":isNext?"Next →":"Pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Legal + actions */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                  <div className="chart-box" style={{ padding:18 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Legal Protection</div>
                    {[
                      { label:"RERA No.", value:hdvSelected.reraNo },
                      { label:"Escrow Bank", value:hdvSelected.escrowBank },
                      { label:"Grace Period", value:hdvSelected.gracePeriod },
                      { label:"Delay Penalty", value:hdvSelected.delayPenalty },
                      { label:"Developer Record", value:hdvSelected.onTimeHistory },
                    ].map((r,i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:i<4?`1px solid ${T.border}`:"none" }}>
                        <span style={{ fontSize:11, color:T.textMuted }}>{r.label}</span>
                        <span style={{ fontSize:11, color:T.white, fontWeight:600, textAlign:"right" }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="chart-box" style={{ padding:18 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Analyst Notes</div>
                    <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.8 }}>{hdvSelected.notes}</div>
                    <div style={{ marginTop:14, fontSize:10, color:T.textMuted }}>{hdvSelected.source}</div>
                  </div>
                </div>
                {/* Quick actions */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <button type="button" onClick={() => { setHdvSelected(null); handleTabChange("Projects"); }}
                    style={{ padding:"9px 18px", background:`linear-gradient(135deg,${T.gold},#B8922A)`, border:"none", borderRadius:8, color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>View Project Details →</button>
                  <button type="button" onClick={() => { setHdvSelected(null); handleTabChange("Risk"); }}
                    style={{ padding:"9px 18px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textSecondary, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Risk Analysis</button>
                  <button type="button" onClick={() => { setHdvSelected(null); handleTabChange("My Leads"); }}
                    style={{ padding:"9px 18px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textSecondary, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Add to Lead</button>
                  <button type="button" onClick={() => {
                    const txt = `\uD83C\uDFD7️ DXB ANALYTICS — HANDOVER UPDATE\n━━━━━━━━━━━━━━━━━━\n\uD83D\uDCCC ${hdvSelected.project}\n\uD83C\uDFE2 ${hdvSelected.developer} · ${hdvSelected.community}\n\n\uD83D\uDCCA STATUS: ${hdvSelected.status}\n\uD83D\uDD27 Construction: ${hdvSelected.constructionPct}% complete\n\uD83D\uDCC5 Expected Handover: ${new Date(hdvSelected.expectedDate).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}\n⚠️ Delay Risk: ${hdvSelected.delayRisk}\n\n\uD83D\uDD10 RERA: ${hdvSelected.reraNo}\n\uD83C\uDFE6 Escrow: ${hdvSelected.escrowBank}\n\uD83D\uDCCB Developer Record: ${hdvSelected.onTimeHistory}\n\n━━━━━━━━━━━━━━━━━━\nPowered by DXB Analytics\nemaar-dashboard.vercel.app`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank");
                  }} style={{ padding:"9px 18px", background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.3)", borderRadius:8, color:"#25D366", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                    Share Handover Update
                  </button>
                </div>
              </div>
            </div>
          )}



          {/* ─── SERVICE CHARGES TAB ─── */}
          {/* ─── SERVICE CHARGES TAB (extracted) ─── */}
          {tab === "Service Charges" && (
            <ServiceChargesTab
              liveServiceCharges={liveServiceCharges}
              scSearch={scSearch} setScSearch={setScSearch}
              scSort={scSort} setScSort={setScSort}
              scType={scType} setScType={setScType}
              scView={scView} setScView={setScView}
              scCalcSize={scCalcSize} setScCalcSize={setScCalcSize}
              scCalcRate={scCalcRate} setScCalcRate={setScCalcRate}
              scCalcRent={scCalcRent} setScCalcRent={setScCalcRent}
            />
          )}


          {/* ─── YIELDS TAB ─── */}
          {/* ─── YIELDS TAB (extracted) ─── */}
          {tab === "Yields" && (
            <YieldsTab
              liveYieldsData={liveYieldsData}
              yldSearch={yldSearch} setYldSearch={setYldSearch}
              yldSort={yldSort} setYldSort={setYldSort}
              yldType={yldType} setYldType={setYldType}
              yldView={yldView} setYldView={setYldView}
              yldCalcPrice={yldCalcPrice} setYldCalcPrice={setYldCalcPrice}
              yldCalcRent={yldCalcRent} setYldCalcRent={setYldCalcRent}
              yldCalcSC={yldCalcSC} setYldCalcSC={setYldCalcSC}
              yldCalcSize={yldCalcSize} setYldCalcSize={setYldCalcSize}
              yldCalcVacancy={yldCalcVacancy} setYldCalcVacancy={setYldCalcVacancy}
              yldCalcMgmt={yldCalcMgmt} setYldCalcMgmt={setYldCalcMgmt}
            />
          )}


          {/* ─── STR vs LTR TAB ─── */}
          {/* ─── STR vs LTR TAB (extracted) ─── */}
          {tab === "STR vs LTR" && (
            <STRvsLTRTab
              liveSTRData={liveSTRData}
              strCommunity={strCommunity} setStrCommunity={setStrCommunity}
              strBeds={strBeds} setStrBeds={setStrBeds}
              strView={strView} setStrView={setStrView}
              strCalcPrice={strCalcPrice} setStrCalcPrice={setStrCalcPrice}
              strCalcSize={strCalcSize} setStrCalcSize={setStrCalcSize}
              strCalcNightly={strCalcNightly} setStrCalcNightly={setStrCalcNightly}
              strCalcOccupancy={strCalcOccupancy} setStrCalcOccupancy={setStrCalcOccupancy}
              strCalcMgmt={strCalcMgmt} setStrCalcMgmt={setStrCalcMgmt}
              strCalcLTR={strCalcLTR} setStrCalcLTR={setStrCalcLTR}
            />
          )}


          {/* ─── MORTGAGE TAB ─── */}
          {/* ─── MORTGAGE TAB (extracted) ─── */}
          {tab === "Mortgage" && (
            <MortgageTab
              liveMortgageRates={liveMortgageRates} liveInvestScores={liveInvestScores}
              handleTabChange={handleTabChange}
              mortPrice={mortPrice} setMortPrice={setMortPrice}
              mortDown={mortDown} setMortDown={setMortDown}
              mortRate={mortRate} setMortRate={setMortRate}
              mortYears={mortYears} setMortYears={setMortYears}
              mortType={mortType} setMortType={setMortType}
              mortProfile={mortProfile} setMortProfile={setMortProfile}
              mortView={mortView} setMortView={setMortView}
              mortIncome={mortIncome} setMortIncome={setMortIncome}
              invScSearch={invScSearch} setInvScSearch={setInvScSearch}
              invScSort={invScSort} setInvScSort={setInvScSort}
              invScFilter={invScFilter} setInvScFilter={setInvScFilter}
              invScView={invScView} setInvScView={setInvScView}
              invScSelected={invScSelected} setInvScSelected={setInvScSelected}
            />
          )}


          {/* ─── INVESTMENT SCORE TAB ─── */}
          {/* ─── INVESTMENT SCORE TAB (extracted) ─── */}
          {tab === "Investment Score" && (
            <InvestmentScoreTab
              invScSearch={invScSearch} setInvScSearch={setInvScSearch}
              invScSort={invScSort} setInvScSort={setInvScSort}
              invScFilter={invScFilter} setInvScFilter={setInvScFilter}
              invScView={invScView} setInvScView={setInvScView}
              invScSelected={invScSelected} setInvScSelected={setInvScSelected}
              liveInvestScores={liveInvestScores}
              handleTabChange={handleTabChange}
            />
          )}


          {/* ─── FLIP CALCULATOR TAB ─── */}
          {/* ─── FLIP TAB (extracted) ─── */}
          {tab === "Flip" && (
            <FlipTab
              flipBuyPrice={flipBuyPrice} setFlipBuyPrice={setFlipBuyPrice}
              flipSellPrice={flipSellPrice} setFlipSellPrice={setFlipSellPrice}
              flipHoldYears={flipHoldYears} setFlipHoldYears={setFlipHoldYears}
              flipIncludeRental={flipIncludeRental} setFlipIncludeRental={setFlipIncludeRental}
              flipRentalYield={flipRentalYield} setFlipRentalYield={setFlipRentalYield}
              flpRenovCost={flpRenovCost} setFlpRenovCost={setFlpRenovCost}
              flpAgentBuy={flpAgentBuy} setFlpAgentBuy={setFlpAgentBuy}
              flpAgentSell={flpAgentSell} setFlpAgentSell={setFlpAgentSell}
              flpMortgage={flpMortgage} setFlpMortgage={setFlpMortgage}
              flpMortgageRate={flpMortgageRate} setFlpMortgageRate={setFlpMortgageRate}
              flpLTV={flpLTV} setFlpLTV={setFlpLTV}
              flpView={flpView} setFlpView={setFlpView}
              flpScenario={flpScenario} setFlpScenario={setFlpScenario}
            />
          )}


          {/* ─── DXB ESTIMATE TAB ─── */}
          {/* ─── DXB ESTIMATE TAB (extracted) ─── */}
          {tab === "DXB Estimate" && (
            <DXBEstimateTab
              avmCommunity={avmCommunity} setAvmCommunity={setAvmCommunity}
              avmType={avmType} setAvmType={setAvmType}
              avmBeds={avmBeds} setAvmBeds={setAvmBeds}
              avmSize={avmSize} setAvmSize={setAvmSize}
              avmFloor={avmFloor} setAvmFloor={setAvmFloor}
              avmView={avmView} setAvmView={setAvmView}
              avmView2={avmView2} setAvmView2={setAvmView2}
              avmCondition={avmCondition} setAvmCondition={setAvmCondition}
              avmRenovated={avmRenovated} setAvmRenovated={setAvmRenovated}
              avmFurnished={avmFurnished} setAvmFurnished={setAvmFurnished}
              avmParking={avmParking} setAvmParking={setAvmParking}
            />
          )}


          {/* ─── PORTFOLIO TAB ─── */}
          {/* ─── PORTFOLIO TAB (extracted) ─── */}
          {tab === "Portfolio" && (
            <PortfolioTab
              portView={portView} setPortView={setPortView}
              portShowAdd={portShowAdd} setPortShowAdd={setPortShowAdd}
              livePortfolio={livePortfolio} user={user}
            />
          )}


          {/* ─── GOLDEN VISA TAB ─── */}
          {/* ─── GOLDEN VISA TAB (extracted) ─── */}
          {tab === "Golden Visa" && (
            <GoldenVisaTab
              gvView={gvView} setGvView={setGvView}
              gvCategory={gvCategory} setGvCategory={setGvCategory}
              gvNumProps={gvNumProps} setGvNumProps={setGvNumProps}
              gvPropPrice={gvPropPrice} setGvPropPrice={setGvPropPrice}
              gvMortgage={gvMortgage} setGvMortgage={setGvMortgage}
              gvOffplan={gvOffplan} setGvOffplan={setGvOffplan}
              gvOffplanPaid={gvOffplanPaid} setGvOffplanPaid={setGvOffplanPaid}
              gvMortgagePaid={gvMortgagePaid}
              liveProjects={liveProjects} SEED_PROJECTS={SEED_PROJECTS}
              handleTabChange={handleTabChange}
            />
          )}


          {/* ─── RISK TAB ─── */}
          {/* ─── RISK TAB (extracted) ─── */}
          {tab === "Risk" && (
            <RiskTab
              riskTabView={riskTabView} setRiskTabView={setRiskTabView}
              riskCommunity2={riskCommunity2} setRiskCommunity2={setRiskCommunity2}
              riskHorizon={riskHorizon} setRiskHorizon={setRiskHorizon}
              handleTabChange={handleTabChange}
            />
          )}


          {/* ─── FINANCIALS TAB ─── */}
          {/* FINANCIALS TAB (extracted) */}
          {tab === "Financials" && (
            <FinancialsTab
              allDevelopers={allDevelopers}
              finDeveloper={finDeveloper} setFinDeveloper={setFinDeveloper}
              finView={finView} setFinView={setFinView}
              finPeriod={finPeriod} setFinPeriod={setFinPeriod}
              finMetric={finMetric} setFinMetric={setFinMetric}
              finCompare={finCompare} setFinCompare={setFinCompare}
              finCompareDev={finCompareDev} setFinCompareDev={setFinCompareDev}
            />
          )}


          {/* ─── DEVELOPER HEALTH TAB ─── */}
          {/* DEVELOPER HEALTH TAB (extracted) */}
          {tab === "Developer Health" && (
            <DeveloperHealthTab
              liveDevHealth={liveDevHealth}
              dhSearch={dhSearch} setDhSearch={setDhSearch}
              dhTier={dhTier} setDhTier={setDhTier}
              dhSort={dhSort} setDhSort={setDhSort}
              dhView={dhView} setDhView={setDhView}
              dhSelected={dhSelected} setDhSelected={setDhSelected}
              setFinDeveloper={setFinDeveloper}
              handleTabChange={handleTabChange}
            />
          )}


          {/* ─── BANKING INTELLIGENCE TAB ─── */}
          {/* BANKING TAB (extracted) */}
          {tab === "Banking" && (
            <BankingTab
              bankView={bankView} setBankView={setBankView}
              bankSelected={bankSelected} setBankSelected={setBankSelected}
              bankPropValue={bankPropValue} setBankPropValue={setBankPropValue}
              bankSalary={bankSalary} setBankSalary={setBankSalary}
              bankTerm={bankTerm} setBankTerm={setBankTerm}
              bankLTV={bankLTV} setBankLTV={setBankLTV}
              bankType={bankType} setBankType={setBankType}
              bankFinType={bankFinType} setBankFinType={setBankFinType}
              bankPurpose={bankPurpose} setBankPurpose={setBankPurpose}
              bankFixedYrs={bankFixedYrs} setBankFixedYrs={setBankFixedYrs}
              mortLeadName={mortLeadName} setMortLeadName={setMortLeadName}
              mortLeadPhone={mortLeadPhone} setMortLeadPhone={setMortLeadPhone}
              mortLeadEmail={mortLeadEmail} setMortLeadEmail={setMortLeadEmail}
              mortLeadSubmitting={mortLeadSubmitting} setMortLeadSubmitting={setMortLeadSubmitting}
              mortLeadSubmitted={mortLeadSubmitted} setMortLeadSubmitted={setMortLeadSubmitted}
              orgId={orgId} userId={user?.uid}
            />
          )}


          {/* ─── MARKETING INTELLIGENCE TAB ─── */}
          {/* MARKETING TAB (extracted) */}
          {tab === "Marketing" && (
            <MarketingTab
              deals={deals} listings={listings}
              mktView={mktView} setMktView={setMktView}
              mktPropType={mktPropType} setMktPropType={setMktPropType}
              mktBudget={mktBudget} setMktBudget={setMktBudget}
              mktNationality={mktNationality} setMktNationality={setMktNationality}
              mktListingType={mktListingType} setMktListingType={setMktListingType}
              mktListingPrice={mktListingPrice} setMktListingPrice={setMktListingPrice}
              mktListingBeds={mktListingBeds} setMktListingBeds={setMktListingBeds}
              mktListingFeatures={mktListingFeatures} setMktListingFeatures={setMktListingFeatures}
              mktListingComm={mktListingComm} setMktListingComm={setMktListingComm}
              mktAiLoading={mktAiLoading} setMktAiLoading={setMktAiLoading}
              mktAiResult={mktAiResult} setMktAiResult={setMktAiResult}
            />
          )}


          {/* ─── COMPETITORS TAB ─── */}
          {/* COMPETITORS TAB (extracted) */}
          {tab === "Competitors" && (
            <CompetitorsTab
              cptSearch={cptSearch} setCptSearch={setCptSearch}
              cptDevA={cptDevA} setCptDevA={setCptDevA}
              cptDevB={cptDevB} setCptDevB={setCptDevB}
              cptMetric={cptMetric} setCptMetric={setCptMetric}
              cptView={cptView} setCptView={setCptView}
            />
          )}

          {/* ══════════════════════════════════════════════════════════
              INTELLIGENCE TABS — Awaiting Data Import
              Each tab shows a beautiful empty state with instructions
              Data connects via Firestore — Admin → Data Manager
          ══════════════════════════════════════════════════════════ */}

          {Object.entries(INTELLIGENCE_TABS).map(([tabKey, config]) => (
            tab === tabKey && tabKey !== "Overview" && tabKey !== "Market" && tabKey !== "DLD Volumes" && tabKey !== "Price History" && tabKey !== "Neighbourhoods" && tabKey !== "Launch Calendar" && tabKey !== "Currency" && tabKey !== "Projects" && tabKey !== "Map" && tabKey !== "Handover" && tabKey !== "Service Charges" && tabKey !== "Yields" && tabKey !== "STR vs LTR" && tabKey !== "Mortgage" && tabKey !== "Investment Score" && tabKey !== "Flip" && tabKey !== "DXB Estimate" && tabKey !== "Portfolio" && tabKey !== "Golden Visa" && tabKey !== "Risk" && tabKey !== "Financials" && tabKey !== "Developer Health" && tabKey !== "Banking" && tabKey !== "Marketing" && tabKey !== "Competitors" && (
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
                      {" "}{"·"}{tabKey}
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
          {/* MY LEADS TAB (extracted) */}
          {tab === "My Leads" && (
            <MyLeadsTab
              myLeads={myLeads} liveLeads={liveLeads}
              orgRole={orgRole} userRole={userRole} orgId={orgId} orgName={orgProfile?.name} listings={listings}
              leadSearch={leadSearch} setLeadSearch={setLeadSearch}
              leadStatusFilter={leadStatusFilter} setLeadStatusFilter={setLeadStatusFilter}
              leadTypeFilter={leadTypeFilter} setLeadTypeFilter={setLeadTypeFilter}
              leadSourceFilter={leadSourceFilter} setLeadSourceFilter={setLeadSourceFilter}
              leadBudgetFilter={leadBudgetFilter} setLeadBudgetFilter={setLeadBudgetFilter}
              leadNatFilter={leadNatFilter} setLeadNatFilter={setLeadNatFilter}
              leadTagFilter={leadTagFilter} setLeadTagFilter={setLeadTagFilter}
              leadSortBy={leadSortBy} setLeadSortBy={setLeadSortBy}
              selectedLead={selectedLead} setSelectedLead={setSelectedLead}
              leadDrawerTab={leadDrawerTab} setLeadDrawerTab={setLeadDrawerTab}
              leadShowAdd={leadShowAdd} setLeadShowAdd={setLeadShowAdd}
              leadAddName={leadAddName} setLeadAddName={setLeadAddName}
              leadAddPhone={leadAddPhone} setLeadAddPhone={setLeadAddPhone}
              leadAddEmail={leadAddEmail} setLeadAddEmail={setLeadAddEmail}
              leadAddNat={leadAddNat} setLeadAddNat={setLeadAddNat}
              leadAddLang={leadAddLang} setLeadAddLang={setLeadAddLang}
              leadAddSource={leadAddSource} setLeadAddSource={setLeadAddSource}
              leadAddType={leadAddType} setLeadAddType={setLeadAddType}
              leadAddBudget={leadAddBudget} setLeadAddBudget={setLeadAddBudget}
              leadAddBedrooms={leadAddBedrooms} setLeadAddBedrooms={setLeadAddBedrooms}
              leadAddPurpose={leadAddPurpose} setLeadAddPurpose={setLeadAddPurpose}
              leadAddTimeline={leadAddTimeline} setLeadAddTimeline={setLeadAddTimeline}
              leadAddStatus={leadAddStatus} setLeadAddStatus={setLeadAddStatus}
              leadAddComm={leadAddComm} setLeadAddComm={setLeadAddComm}
              leadAddRef={leadAddRef} setLeadAddRef={setLeadAddRef}
              leadAddFollowUp={leadAddFollowUp} setLeadAddFollowUp={setLeadAddFollowUp}
              leadAddSaving={leadAddSaving} setLeadAddSaving={setLeadAddSaving}
              noteText={noteText} setNoteText={setNoteText}
              noteType={noteType} setNoteType={setNoteType}
              noteLoading={noteLoading} setNoteLoading={setNoteLoading}
              taskText={taskText} setTaskText={setTaskText}
              taskDue={taskDue} setTaskDue={setTaskDue}
              showMLAnalytics={showMLAnalytics} setShowMLAnalytics={setShowMLAnalytics}
              showMLTemplates={showMLTemplates} setShowMLTemplates={setShowMLTemplates}
              showQuickCapture={showQuickCapture} setShowQuickCapture={setShowQuickCapture}
            />
          )}
          {/* ─── PIPELINE TAB (extracted) ─── */}
          {tab === "Pipeline" && (
            <PipelineTab
              deals={deals} dealsLoading={dealsLoading}
              dealForm={dealForm} setDealForm={setDealForm}
              dealFormLoading={dealFormLoading} setDealFormLoading={setDealFormLoading}
              showNewDeal={showNewDeal} setShowNewDeal={setShowNewDeal}
              selectedDeal={selectedDeal} setSelectedDeal={setSelectedDeal}
              pipelineType={pipelineType} setPipelineType={setPipelineType}
              firebaseUser={firebaseUser} orgId={orgId} orgName={orgProfile?.name} orgRole={orgRole} userName={userName}
            />
          )}



          {/* ══════════════════════════════════════════════
              COMPLIANCE TAB — Session 6
              RERA card tracker + WhatsApp templates
          ══════════════════════════════════════════════ */}
          {/* ─── COMPLIANCE TAB (extracted) ─── */}
          {tab === "Compliance" && (
            <ComplianceTab
              reraCard={reraCard} setReraCard={setReraCard}
              reraCardLoading={reraCardLoading} setReraCardLoading={setReraCardLoading}
              reraCardSaved={reraCardSaved} setReraCardSaved={setReraCardSaved}
              waTemplate={waTemplate} setWaTemplate={setWaTemplate}
              firebaseUser={firebaseUser} orgRole={orgRole}
              userName={userName}
            />
          )}



          {/* ══════════════════════════════════════════════
              TEAM TAB — Session 7 — Agency Manager Dashboard
              Agent leaderboard · Source ROI · Pipeline funnel
              Overdue follow-ups · Team KPIs
          ══════════════════════════════════════════════ */}
          {/* ─── TEAM TAB (extracted) ─── */}
          {tab === "Team" && (
            <TeamTab
              teamMembers={teamMembers} teamMembersLoading={teamMembersLoading}
              myLeads={myLeads} deals={deals} orgRole={orgRole}
            />
          )}



          {/* ══════════════════════════════════════════════
              AGENCY TAB — Session 8 — Agency Management Hub
              Profile · Agent Roster · RERA Tracker · Commission
          ══════════════════════════════════════════════ */}
          {/* AGENCY TAB (extracted) */}
          {tab === "Agency" && (
            <AgencyTab
              orgId={orgId} orgRole={orgRole} orgProfile={orgProfile}
              orgProfileForm={orgProfileForm} setOrgProfileForm={setOrgProfileForm}
              orgProfileSaving={orgProfileSaving} setOrgProfileSaving={setOrgProfileSaving}
              orgProfileSaved={orgProfileSaved} setOrgProfileSaved={setOrgProfileSaved}
              reraCard={reraCard}
              teamMembers={teamMembers} deals={deals} myLeads={myLeads}
              showInviteAgent={showInviteAgent} setShowInviteAgent={setShowInviteAgent}
              inviteEmail={inviteEmail} setInviteEmail={setInviteEmail}
              inviteLoading={inviteLoading} setInviteLoading={setInviteLoading}
              inviteSent={inviteSent} setInviteSent={setInviteSent}
              agentRoleChanging={agentRoleChanging} setAgentRoleChanging={setAgentRoleChanging}
              commSplits={commSplits} setCommSplits={setCommSplits}
              commSaving={commSaving} setCommSaving={setCommSaving}
            />
          )}



          {/* ══════════════════════════════════════════════
              LISTINGS TAB — Session 9
              Create · Trakheesi · Portal Syndication · Track
          ══════════════════════════════════════════════ */}
          {/* LISTINGS TAB (extracted) */}
          {tab === "Listings" && (
            <ListingsTab
              listings={listings} listingsLoading={listingsLoading}
              listingForm={listingForm} setListingForm={setListingForm}
              listingFormLoading={listingFormLoading} setListingFormLoading={setListingFormLoading}
              showNewListing={showNewListing} setShowNewListing={setShowNewListing}
              selectedListing={selectedListing} setSelectedListing={setSelectedListing}
              listingFilter={listingFilter} setListingFilter={setListingFilter}
              listingSearch={listingSearch} setListingSearch={setListingSearch}
              publishingId={publishingId} setPublishingId={setPublishingId}
              firebaseUser={firebaseUser} orgId={orgId} orgRole={orgRole} userName={userName}
            />
          )}



          {/* ══════════════════════════════════════════════
              DEV PORTAL TAB — Session 10
              Unit Inventory · EOI Pipeline · Commission · Assets
          ══════════════════════════════════════════════ */}
          {/* ─── DEV PORTAL TAB (extracted) ─── */}
          {tab === "Dev Portal" && (
            <DevPortalTab
              devId={devId} devProjects={devProjects} selectedDevProject={selectedDevProject}
              devUnits={devUnits} devUnitsLoading={devUnitsLoading}
              devUnitFilter={devUnitFilter} setDevUnitFilter={setDevUnitFilter}
              unitForm={unitForm} setUnitForm={setUnitForm}
              unitFormLoading={unitFormLoading} setUnitFormLoading={setUnitFormLoading}
              showAddUnit={showAddUnit} setShowAddUnit={setShowAddUnit}
              devCommForm={devCommForm} setDevCommForm={setDevCommForm}
              devCommSaving={devCommSaving} setDevCommSaving={setDevCommSaving}
              devEOIs={devEOIs} allDevelopers={allDevelopers} userRole={userRole}
            />
          )}



          {/* ══════════════════════════════════════════════
              INTELLIGENCE TAB — Session 12
              Comparable Sales · IRR Calculator · Supply Pipeline
          ══════════════════════════════════════════════ */}
          {/* INTELLIGENCE TAB (extracted) */}
          {tab === "Intelligence" && (
            <IntelligenceTab
              compType={compType} setCompType={setCompType}
              compCommunity={compCommunity} setCompCommunity={setCompCommunity}
              compBeds={compBeds} setCompBeds={setCompBeds}
              dldActiveCommunity={dldActiveCommunity} setDldActiveCommunity={setDldActiveCommunity}
              dldLastRefresh={dldLastRefresh} setDldLastRefresh={setDldLastRefresh}
              setDldRefreshTick={setDldRefreshTick}
              irrPrice={irrPrice} setIrrPrice={setIrrPrice}
              irrRent={irrRent} setIrrRent={setIrrRent}
              irrServiceCharge={irrServiceCharge} setIrrServiceCharge={setIrrServiceCharge}
              irrMgmtFee={irrMgmtFee} setIrrMgmtFee={setIrrMgmtFee}
              irrAppreciation={irrAppreciation} setIrrAppreciation={setIrrAppreciation}
              irrHoldYears={irrHoldYears} setIrrHoldYears={setIrrHoldYears}
            />
          )}



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
                    { label: "Construction", fn: p => `${p.construction ?? p.constructionPct ?? 0}%`, highlight: true },
                    { label: "Starting Price", fn: p => { const price = p.price ?? p.priceMin ?? p.priceFromAed ?? 0; return price ? `AED ${(price/1000000).toFixed(1)}M` : "TBD"; } },
                    { label: "Price/sqft", fn: p => p.ppsf ? `AED ${p.ppsf.toLocaleString()}` : "TBD" },
                    { label: "Handover", fn: p => p.handover },
                    { label: "Size Range", fn: p => { const from = p.sizeFrom ?? p.sizeMin ?? 0; const to = p.sizeTo ?? p.sizeMax ?? 0; return from && to ? `${from.toLocaleString()} - ${to.toLocaleString()} sqft` : "TBD"; } },
                    { label: "Bedrooms", fn: p => Array.isArray(p.beds) ? p.beds.join(" / ") : (p.beds || "") },
                    { label: "Type", fn: p => p.type },
                    { label: "Payment Plan", fn: p => p.payment || p.paymentPlan || "" },
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
                  \uD83D\uDCC4 {(p.name || p.project || "").split(" ").slice(0,2).join(" ")}
                </a>
              ))}
            </div>
            {/* View on Emaar for all compared projects */}
            {compareList.some(p => p.emaarUrl) && (
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                {compareList.map(p => p.emaarUrl ? (
                  <a key={p.id} href={p.emaarUrl} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, padding: "8px 0", background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.35)", borderRadius: 10, color: T.gold, fontSize: 11, fontWeight: 700, textAlign: "center", textDecoration: "none" }}>
                    {(p.name || p.project || "").split(" ").slice(0,2).join(" ")} ↗ {getLinkDomain(p.emaarUrl)}
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
          <button type="button" onClick={() => setShowAddPortfolio(null)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>{"✕"}</button>
          <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${T.border}` }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.white }}>{typeof showAddPortfolio === "object" ? "Investment Details" : "Select Project"}</h2>
            <p style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{typeof showAddPortfolio === "object" ? showAddPortfolio.name + " · " + showAddPortfolio.community : "Select a project from your portfolio"}</p>
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
                      <div style={{ fontSize: 10, color: T.textMuted }}>{p.community} · {p.type} · {p.beds}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>AED {p.price ? (p.price/1e6).toFixed(2) + "M" : "TBD"}</div>
                      <div style={{ fontSize: 9, color: T.textMuted }}>{p.handover}</div>
                      {(() => { const cd = getHandoverCountdown(p.handover); return cd ? <div style={{ fontSize: 9, fontWeight: 700, color: cd.passed ? "#10B981" : cd.color, marginTop: 1 }}>{cd.passed ? "✓ Ready" : "⏱ " + cd.label}</div> : null; })()}
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
                <button type="button" onClick={() => setShowAddPortfolio(true)} style={{ flex: 1, padding: "10px 0", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>{"← Back"}</button>
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
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{showSetAlert.community}{"·"}{showSetAlert.type}</div>
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
            <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>\uD83D\uDD14 Price Alerts</div>
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
                await safeAsyncWithToast(() => setDoc(doc(db, "priceAlerts", user), { alerts: updated, updatedAt: new Date().toISOString() }), "price-alert-add", notify, "Couldn't save your new price alert — try again");
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
                <span style={{ fontSize: 18 }}>{a.condition === "above" ? "\uD83D\uDCC8" : "\uD83D\uDCC9"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{a.community}</div>
                  <div style={{ fontSize: 11, color: T.textSecondary }}>{a.metric === "grossYield" ? "Gross Yield" : a.metric === "netYield" ? "Net Yield" : a.metric === "avgPriceSqft" ? "Avg Price/sqft" : "Transactions"} {a.condition} {a.value}{a.metric.includes("Yield") ? "%" : ""}</div>
                </div>
                <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: a.active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: a.active ? T.green : "#EF4444", fontWeight: 700 }}>{a.active ? "ACTIVE" : "PAUSED"}</span>
                <button type="button" onClick={async () => {
                  const updated = myAlerts.filter((_, j) => j !== i);
                  setMyAlerts(updated);
                  await safeAsyncWithToast(() => setDoc(doc(db, "priceAlerts", user), { alerts: updated, updatedAt: new Date().toISOString() }), "price-alert-delete", notify, "Couldn't remove the price alert — try again");
                }} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16, padding: "4px 6px", borderRadius: 6, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#EF4444"} onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>✕</button>
              </div>
            ))}
            {myAlerts.length > 0 && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 12, textAlign: "center" }}>Alerts checked daily. Email sent to {user}</div>}
          </div>
        </div>
      </div>}

      {showCheckout && <div role="dialog" aria-modal="true" aria-label="Upgrade checkout" style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.95)", zIndex: 3100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }} onClick={() => { setShowCheckout(null); setCheckoutStep(1); }}>
        <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "95%", maxWidth: 480, position: "relative", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
          <button type="button" onClick={() => { setShowCheckout(null); setCheckoutStep(1); }} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>{"✕"}</button>
          <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
              {[1,2,3].map(s => <React.Fragment key={s}><div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: checkoutStep >= s ? T.gold : T.surfaceAlt, color: checkoutStep >= s ? T.bg : T.textMuted, border: `1px solid ${checkoutStep >= s ? T.gold : T.border}` }}>{checkoutStep > s ? "✓" : s}</div>{s < 3 && <div style={{ width: 40, height: 2, background: checkoutStep > s ? T.gold : T.surfaceAlt, borderRadius: 1 }} />}</React.Fragment>)}
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.white, textAlign: "center" }}>{checkoutStep === 1 ? "Confirm Plan" : checkoutStep === 2 ? "Payment" : "Welcome to Pro!"}</h2>
          </div>
          <div style={{ padding: "20px 28px 28px" }}>
            {checkoutStep === 1 && <>
              <div style={{ padding: 16, borderRadius: 12, background: T.surfaceAlt, border: `2px solid ${T.gold}`, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 800, color: T.gold }}>{showCheckout.name} Plan</span><span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "rgba(212,168,67,0.12)", color: T.gold }}>SELECTED</span></div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 12 }}><span style={{ fontSize: 10, color: T.textMuted }}>AED</span><span style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 900, color: T.white }}>{showCheckout.price}</span><span style={{ fontSize: 12, color: T.textMuted }}>/month</span></div>
                {showCheckout.features.slice(0,5).map((f,j) => <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", fontSize: 12, color: T.textSecondary }}><span style={{ color: T.green }}>{"✓"}</span>{f}</div>)}
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
                      <div style={{ fontSize: 24 }}>\uD83D\uDCB3</div>
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
                  <div style={{ fontSize: 24 }}>\uD83D\uDCAC</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>WhatsApp + Bank Transfer</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>Manual — activated within 5 minutes of payment</div>
                  </div>
                  <span style={{ color: "#25D366", fontSize: 16 }}>→</span>
                </div>

                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(212,168,67,0.04)", border: "1px solid rgba(212,168,67,0.1)", fontSize: 11, color: T.textMuted, lineHeight: 1.5, marginBottom: 12 }}>\uD83D\uDD12 All payments secure · 7-day money-back guarantee</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setCheckoutStep(1)} style={{ width: "100%", padding: "10px 0", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>← Back</button>
              </div>
            </>}
            {checkoutStep === 3 && <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>\uD83C\uDF89</div>
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
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, padding: "3px 10px", borderRadius: 6, background: userTier === "admin" || userTier === "pro" || userTier === "enterprise" ? "rgba(16,185,129,0.12)" : userTier === "pro_trial" ? "rgba(212,168,67,0.12)" : "rgba(59,130,246,0.12)", fontSize: 10, fontWeight: 700, color: userTier === "admin" || userTier === "pro" || userTier === "enterprise" ? T.green : userTier === "pro_trial" ? T.gold : T.blue }}>{userTier === "admin" ? "⚡ Admin" : userTier === "pro" ? "⭐ Pro Plan" : userTier === "pro_trial" ? `⭐ Pro Trial · ${trialDaysLeft}d left` : userTier === "enterprise" ? "\uD83C\uDFE2 Enterprise" : "Free Plan"}</div>
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
              <button type="button" onClick={async () => { if (auth.currentUser && profileEdit.name.trim()) { try { await setDoc(doc(db, "users", auth.currentUser.uid), { name: profileEdit.name.trim() }, { merge: true }); setUserName(profileEdit.name.trim()); setToast("✅ Profile updated!"); setTimeout(() => setToast(""), 3000); } catch(e) { setToast("❌ Update failed"); setTimeout(() => setToast(""), 3000); } } }} style={{ marginTop: 10, padding: "8px 20px", background: T.gold, color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Save Changes</button>
            </div>
            <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Subscription</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div><div style={{ fontSize: 10, color: T.textMuted }}>Plan</div><div style={{ fontSize: 14, fontWeight: 700, color: T.gold, fontFamily: "'Fraunces', serif" }}>{userTier === "admin" ? "Admin" : userTier === "pro" ? "Pro" : userTier === "pro_trial" ? "Pro Trial" : userTier === "enterprise" ? "Enterprise" : "Free"}</div></div>
                <div><div style={{ fontSize: 10, color: T.textMuted }}>Status</div><div style={{ fontSize: 14, fontWeight: 700, color: userTier === "free" ? T.blue : T.green }}>{userTier === "free" ? "Limited" : "Active"}</div></div>
                <div><div style={{ fontSize: 10, color: T.textMuted }}>Access</div><div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{userTier === "free" ? "5 projects" : "All 48"}</div></div>
              </div>
              {(userTier === "free" || userTier === "pro_trial") && <button type="button" onClick={() => { setShowProfile(false); setShowUpgrade(true); }} style={{ marginTop: 12, width: "100%", padding: "10px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>{userTier === "pro_trial" ? "Subscribe Before Trial Ends" : "⭐ Upgrade to Pro — AED 99/mo"}</button>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button type="button" onClick={() => { setShowProfile(false); handleTabChange("Portfolio"); }} style={{ padding: "10px 0", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>\uD83D\uDCCA Portfolio</button>
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
                  <button type="button" onClick={() => { setShowProfile(false); setShowKYC(true); }} style={{ padding: "9px 20px", background: `linear-gradient(135deg, #00BFA5, #00897B)`, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>\uD83D\uDEE1 Apply for Verification</button>
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
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: "#00BFA5" }}>\uD83D\uDEE1 Identity Verification</div>
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
                <div style={{ fontSize: 32, marginBottom: 8 }}>\uD83D\uDD14</div>
                <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 4 }}>No notifications yet</div>
                <div style={{ fontSize: 11 }}>Set alerts on project cards \uD83D\uDD15 to get notified of price changes.</div>
              </div>
            ) : notifications.map((n, i) => (
              <div key={n.id} onClick={() => markNotifRead(n.id)} style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", background: n.read ? "transparent" : "rgba(212,168,67,0.04)", transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "rgba(212,168,67,0.04)"}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{n.icon || "\uD83D\uDCE2"}</span>
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
                  <div style={{ fontSize: 40, marginBottom: 12 }}>★</div>
                  <div style={{ fontSize: 14, color: T.textSecondary, marginBottom: 8 }}>No projects saved yet</div>
                  <div style={{ fontSize: 12 }}>Click the ★ star on any project card to add it here.</div>
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
            icon: "\uD83C\uDFD9️",
            title: `Welcome to DXB Analytics, ${userName || "Investor"}!`,
            body: "You now have access to Dubai's most comprehensive real estate intelligence platform. Let us show you around in 30 seconds.",
            cta: "Let's Go →"
          },
          {
            icon: "\uD83D\uDD0D",
            title: "Browse All Projects",
            body: "Go to the Projects tab to explore every active development. Filter by community, tier, handover year, or price range. Click any card for full details, documents, and ROI analysis.",
            cta: "Next →"
          },
          {
            icon: "⭐",
            title: "Build Your Watchlist",
            body: "See the ★ star button on every project card? Click it to save projects you're interested in. Your watchlist syncs across devices.",
            cta: "Next →"
          },
          {
            icon: "\uD83D\uDCCA",
            title: "Yields, ROI & Mortgage",
            body: "Use the Yields tab for rental returns by community. The Mortgage tab calculates your monthly payment + all UAE transaction costs instantly.",
            cta: "Next →"
          },
          {
            icon: "\uD83D\uDE80",
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

          </TabErrorBoundary>
        </div>
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal show={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}


// cache-bust-2026-04-05
