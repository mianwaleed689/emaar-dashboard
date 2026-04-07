/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — LAUNCH CALENDAR TAB (PERFECT EDITION)

   Newspaper-style launch intelligence platform
   3 modes: Newspaper (default) · Calendar grid · Comparison table
   + Full project detail modal

   Research-based: prelaunch.ae, AIQYA Q1 2026, Springfield Properties,
   BSA Law, Moody's Mar 2026, Property Finder, DLD pipeline data

   v2 additions:
   • Bed-level inventory breakdown (per-bed price/yield/availability)
   • Net + gross yield, service charge per sqft
   • 7-distance amenities grid
   • Amenities + view tags
   • RERA number + escrow bank
   • Commission % for CRM users
   • Plot size for villas
   • Numeric Investment Score + Verdict combo
   • Project detail modal
   • Avg yield/PPSF computed across filtered set
   ═══════════════════════════════════════════════════════════════════ */

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { T } from "../data";

/* ═══════════════════════════════════════════════════════════════════
   SEED DATA — Curated launches Q1 2026 → Q4 2027
   Sources: Property Finder, prelaunch.ae, developer official portals
   ═══════════════════════════════════════════════════════════════════ */
const SEED_LAUNCHES = [
  {
    id: "lc001",
    project: "Tilal Al Ghaf — Serenity Mansions",
    developer: "Majid Al Futtaim",
    community: "Tilal Al Ghaf",
    type: "Villa",
    tier: 1,
    branded: false,
    launchDate: "2026-02-18",
    eoiDeadline: "2026-02-15",
    status: "Sold Out",
    units: 85,
    soldUnits: 85,
    startingPrice: 8500000,
    pricePerSqft: 2400,
    avgUnitSize: 5500,
    eoiAmount: 100000,
    eoiRefundable: false,
    paymentPlan: { dp: 20, construction: 50, handover: 30, postHandover: 0, label: "20/50/30" },
    handover: "Q4 2028",
    developerOnTimeRate: 87,
    communityAvgPpsf: 2350,
    appreciationToHandover: 28,
    goldenVisa: true,
    metroDistanceKm: 8.5,
    beachAccess: false,
    insight: "Ultra-luxury mansions sold out within 48 hours. DLD 2025 shows 52% YoY transaction growth in Tilal Al Ghaf.",
    velocityScore: 100,
    tags: ["luxury", "villa", "soldOut"],
    /* NEW v2 fields */
    grossYield: 4.2,
    netYield: 3.4,
    serviceCharge: 8,
    commission: 2.0,
    investmentScore: 80,
    developerScore: 89,
    reraNo: "0337890123",
    escrowBank: "FAB",
    plotMin: 9500,
    plotMax: 18000,
    distances: { metro: 8.5, difc: 20, airport: 30, beach: 24, mall: 4, school: 1.5, hospital: 6 },
    amenities: ["Private Beach", "Crystal Lagoon", "Tennis", "Padel", "Golf", "Stables", "Concierge"],
    views: ["Lake View", "Garden View", "Lagoon View"],
    unitBreakdown: [
      { type: "5BR Villa", sizeMin: 9500, sizeMax: 11500, plotMin: 9500, plotMax: 13000, priceMin: 8500000, priceMax: 14000000, ppsf: 1450, grossYield: 4.5, available: 0 },
      { type: "6BR Villa", sizeMin: 12000, sizeMax: 14500, plotMin: 13500, plotMax: 16000, priceMin: 18000000, priceMax: 26000000, ppsf: 1620, grossYield: 4.2, available: 0 },
      { type: "7BR Mansion", sizeMin: 15000, sizeMax: 18000, plotMin: 16500, plotMax: 18000, priceMin: 32000000, priceMax: 45000000, ppsf: 2400, grossYield: 3.8, available: 0 },
    ],
  },
  {
    id: "lc002",
    project: "The Oasis by Emaar — Phase 11",
    developer: "Emaar",
    community: "The Oasis",
    type: "Villa",
    tier: 1,
    branded: false,
    launchDate: "2026-03-10",
    eoiDeadline: "2026-03-08",
    status: "Launched",
    units: 280,
    soldUnits: 230,
    startingPrice: 6200000,
    pricePerSqft: 1850,
    avgUnitSize: 4500,
    eoiAmount: 50000,
    eoiRefundable: true,
    paymentPlan: { dp: 20, construction: 60, handover: 20, postHandover: 24, label: "80/20 + 24mo PHP" },
    handover: "Q2 2029",
    developerOnTimeRate: 88,
    communityAvgPpsf: 1800,
    appreciationToHandover: 35,
    goldenVisa: true,
    metroDistanceKm: 12,
    beachAccess: false,
    insight: "10-to-1 scarcity vs Dubai Hills (2,700 units vs 30,000). Lagoon pools, wave pools. Emaar's 100M sqft master plan.",
    velocityScore: 82,
    tags: ["luxury", "villa", "masterplan", "lagoon"],
    grossYield: 4.8,
    netYield: 3.8,
    serviceCharge: 6,
    commission: 2.0,
    investmentScore: 86,
    developerScore: 92,
    reraNo: "0446789012",
    escrowBank: "Emirates NBD",
    plotMin: 7500,
    plotMax: 22000,
    distances: { metro: 12, difc: 25, airport: 32, beach: 28, mall: 6, school: 3, hospital: 8 },
    amenities: ["Lagoon Pool", "Wave Pool", "Polo Fields", "Equestrian", "Golf", "Clubhouse", "Cycling Tracks"],
    views: ["Lagoon View", "Garden View", "Golf View"],
    unitBreakdown: [
      { type: "4BR Villa", sizeMin: 5800, sizeMax: 7200, plotMin: 7500, plotMax: 10000, priceMin: 6200000, priceMax: 9500000, ppsf: 1520, grossYield: 5.2, available: 28 },
      { type: "5BR Villa", sizeMin: 7800, sizeMax: 9500, plotMin: 10000, plotMax: 14000, priceMin: 10500000, priceMax: 16000000, ppsf: 1490, grossYield: 4.8, available: 18 },
      { type: "6BR Mansion", sizeMin: 11000, sizeMax: 14000, plotMin: 16000, plotMax: 22000, priceMin: 20000000, priceMax: 32000000, ppsf: 1450, grossYield: 4.2, available: 4 },
    ],
  },
  {
    id: "lc003",
    project: "DAMAC Lagoons — Santorini Phase 3",
    developer: "DAMAC Properties",
    community: "DAMAC Lagoons",
    type: "Villa",
    tier: 2,
    branded: false,
    launchDate: "2026-03-22",
    eoiDeadline: "2026-03-20",
    status: "EOI Closed",
    units: 380,
    soldUnits: 300,
    startingPrice: 2200000,
    pricePerSqft: 1450,
    avgUnitSize: 1850,
    eoiAmount: 25000,
    eoiRefundable: true,
    paymentPlan: { dp: 20, construction: 40, handover: 40, postHandover: 0, label: "60/40" },
    handover: "Q3 2028",
    developerOnTimeRate: 71,
    communityAvgPpsf: 1380,
    appreciationToHandover: 22,
    goldenVisa: true,
    metroDistanceKm: 15,
    beachAccess: false,
    insight: "Mediterranean-inspired villas. DAMAC sold out previous phases within hours. Lower developer on-time rate flagged.",
    velocityScore: 79,
    tags: ["lifestyle", "villa", "midmarket"],
    grossYield: 7.4,
    netYield: 5.9,
    serviceCharge: 14,
    commission: 3.0,
    investmentScore: 76,
    developerScore: 78,
    reraNo: "0882345678",
    escrowBank: "Dubai Islamic Bank",
    plotMin: 1800,
    plotMax: 3200,
    distances: { metro: 15, difc: 22, airport: 35, beach: 25, mall: 3.8, school: 1.2, hospital: 6 },
    amenities: ["Lagoon Pool", "Beach Access", "Gym", "Waterpark", "Restaurants", "Kids Club"],
    views: ["Lagoon View", "Pool View"],
    unitBreakdown: [
      { type: "3BR TH", sizeMin: 1850, sizeMax: 2100, plotMin: 1800, plotMax: 2200, priceMin: 2200000, priceMax: 2800000, ppsf: 1400, grossYield: 7.8, available: 60 },
      { type: "4BR TH", sizeMin: 2400, sizeMax: 2800, plotMin: 2400, plotMax: 2900, priceMin: 3200000, priceMax: 4100000, ppsf: 1450, grossYield: 7.4, available: 15 },
      { type: "5BR Villa", sizeMin: 3200, sizeMax: 3800, plotMin: 2900, plotMax: 3200, priceMin: 5200000, priceMax: 6800000, ppsf: 1700, grossYield: 6.8, available: 5 },
    ],
  },
  {
    id: "lc004",
    project: "Emaar Grand Polo Club & Resort — Phase 2",
    developer: "Emaar",
    community: "Dubai Investment South",
    type: "Villa",
    tier: 1,
    branded: false,
    launchDate: "2026-04-20",
    eoiDeadline: "2026-04-18",
    status: "EOI Open",
    units: 420,
    soldUnits: 0,
    startingPrice: 5700000,
    pricePerSqft: 1750,
    avgUnitSize: 4200,
    eoiAmount: 50000,
    eoiRefundable: true,
    paymentPlan: { dp: 20, construction: 60, handover: 20, postHandover: 0, label: "80/20" },
    handover: "Q4 2029",
    developerOnTimeRate: 88,
    communityAvgPpsf: 1700,
    appreciationToHandover: 38,
    goldenVisa: true,
    metroDistanceKm: 18,
    beachAccess: false,
    insight: "Emaar's 60M sqft master plan. Polo fields, 7 clubhouses, equestrian estates. Strong appreciation history on Emaar launches.",
    velocityScore: 88,
    tags: ["luxury", "villa", "masterplan", "equestrian"],
    grossYield: 5.4,
    netYield: 4.2,
    serviceCharge: 8,
    commission: 2.0,
    investmentScore: 89,
    developerScore: 92,
    reraNo: "0998765432",
    escrowBank: "Emirates NBD",
    plotMin: 5200,
    plotMax: 12000,
    distances: { metro: 18, difc: 28, airport: 14, beach: 32, mall: 8, school: 2.5, hospital: 7 },
    amenities: ["Polo Fields", "7 Clubhouses", "Equestrian Center", "Golf", "Lagoon Pool", "Tennis", "Spa", "Wellness Center"],
    views: ["Polo View", "Garden View", "Equestrian View"],
    unitBreakdown: [
      { type: "4BR Villa", sizeMin: 4200, sizeMax: 5400, plotMin: 5200, plotMax: 7000, priceMin: 5700000, priceMax: 8500000, ppsf: 1700, grossYield: 5.8, available: 220 },
      { type: "5BR Villa", sizeMin: 5800, sizeMax: 7500, plotMin: 7000, plotMax: 9500, priceMin: 9000000, priceMax: 14500000, ppsf: 1750, grossYield: 5.4, available: 140 },
      { type: "6BR Mansion", sizeMin: 8500, sizeMax: 11000, plotMin: 9500, plotMax: 12000, priceMin: 17000000, priceMax: 26000000, ppsf: 1900, grossYield: 4.8, available: 60 },
    ],
  },
  {
    id: "lc005",
    project: "Dubai Islands — Island B Phase 1",
    developer: "Nakheel",
    community: "Dubai Islands",
    type: "Apartment",
    tier: 1,
    branded: false,
    launchDate: "2026-04-28",
    eoiDeadline: "2026-04-26",
    status: "EOI Open",
    units: 680,
    soldUnits: 0,
    startingPrice: 1200000,
    pricePerSqft: 1620,
    avgUnitSize: 750,
    eoiAmount: 30000,
    eoiRefundable: true,
    paymentPlan: { dp: 20, construction: 40, handover: 40, postHandover: 0, label: "60/40" },
    handover: "Q1 2029",
    developerOnTimeRate: 80,
    communityAvgPpsf: 1580,
    appreciationToHandover: 32,
    goldenVisa: false,
    metroDistanceKm: 6.5,
    beachAccess: true,
    insight: "Island B offers more controlled planning vs Island A. 24% price growth in 2025. Beachfront value entry point.",
    velocityScore: 84,
    tags: ["beachfront", "apartment", "value"],
    grossYield: 7.2,
    netYield: 5.8,
    serviceCharge: 14,
    commission: 2.5,
    investmentScore: 83,
    developerScore: 85,
    reraNo: "0228901234",
    escrowBank: "Nakheel Escrow / DIB",
    distances: { metro: 6.5, difc: 18, airport: 22, beach: 0.3, mall: 8, school: 3, hospital: 5 },
    amenities: ["Beach Access", "Beach Club", "Infinity Pool", "Gym", "Kids Area", "Cycling Track", "Retail Strip"],
    views: ["Sea View", "Beach View", "Marina View"],
    unitBreakdown: [
      { type: "Studio", sizeMin: 480, sizeMax: 580, priceMin: 1200000, priceMax: 1450000, ppsf: 2500, grossYield: 8.2, available: 280 },
      { type: "1BR", sizeMin: 720, sizeMax: 880, priceMin: 1650000, priceMax: 2100000, ppsf: 2280, grossYield: 7.4, available: 240 },
      { type: "2BR", sizeMin: 1100, sizeMax: 1380, priceMin: 2400000, priceMax: 3100000, ppsf: 2180, grossYield: 6.8, available: 120 },
      { type: "3BR", sizeMin: 1600, sizeMax: 1950, priceMin: 3500000, priceMax: 4500000, ppsf: 2180, grossYield: 6.2, available: 40 },
    ],
  },
  {
    id: "lc006",
    project: "Binghatti Skyrise — Business Bay",
    developer: "Binghatti",
    community: "Business Bay",
    type: "Apartment",
    tier: 2,
    branded: false,
    launchDate: "2026-05-08",
    eoiDeadline: "2026-05-05",
    status: "Upcoming",
    units: 720,
    soldUnits: 0,
    startingPrice: 800000,
    pricePerSqft: 1850,
    avgUnitSize: 480,
    eoiAmount: 20000,
    eoiRefundable: true,
    paymentPlan: { dp: 20, construction: 50, handover: 30, postHandover: 0, label: "70/30" },
    handover: "Q4 2028",
    developerOnTimeRate: 74,
    communityAvgPpsf: 2050,
    appreciationToHandover: 25,
    goldenVisa: false,
    metroDistanceKm: 0.8,
    beachAccess: false,
    insight: "Binghatti's signature bold architecture. Business Bay canal views. Target professional renters — strong yield community.",
    velocityScore: 72,
    tags: ["yield", "apartment", "metro"],
    grossYield: 7.8,
    netYield: 6.1,
    serviceCharge: 18,
    commission: 4.0,
    investmentScore: 74,
    developerScore: 81,
    reraNo: "0664567890",
    escrowBank: "ADCB",
    distances: { metro: 0.4, difc: 2.5, airport: 14, beach: 20, mall: 4, school: 3, hospital: 2 },
    amenities: ["Rooftop Pool", "Sky Lounge", "Gym", "Retail", "Canal Views", "Co-working", "Concierge"],
    views: ["Canal View", "Burj Khalifa View", "City View"],
    unitBreakdown: [
      { type: "Studio", sizeMin: 380, sizeMax: 480, priceMin: 800000, priceMax: 980000, ppsf: 2050, grossYield: 8.8, available: 320 },
      { type: "1BR", sizeMin: 620, sizeMax: 780, priceMin: 1280000, priceMax: 1620000, ppsf: 1980, grossYield: 7.8, available: 280 },
      { type: "2BR", sizeMin: 950, sizeMax: 1120, priceMin: 1900000, priceMax: 2350000, ppsf: 1940, grossYield: 7.0, available: 120 },
    ],
  },
  {
    id: "lc007",
    project: "Sobha Hartland II — The Waterfront",
    developer: "Sobha Realty",
    community: "Sobha Hartland",
    type: "Apartment",
    tier: 1,
    branded: false,
    launchDate: "2026-05-15",
    eoiDeadline: "2026-05-12",
    status: "Upcoming",
    units: 520,
    soldUnits: 0,
    startingPrice: 1800000,
    pricePerSqft: 2100,
    avgUnitSize: 850,
    eoiAmount: 40000,
    eoiRefundable: true,
    paymentPlan: { dp: 20, construction: 50, handover: 30, postHandover: 0, label: "70/30" },
    handover: "Q3 2028",
    developerOnTimeRate: 91,
    communityAvgPpsf: 2050,
    appreciationToHandover: 33,
    goldenVisa: false,
    metroDistanceKm: 4.2,
    beachAccess: false,
    insight: "Sobha's vertical-integration zero-defect policy. Highest on-time rate in market (91%). Premium finish, proven delivery.",
    velocityScore: 89,
    tags: ["quality", "apartment", "premium"],
    grossYield: 6.2,
    netYield: 4.9,
    serviceCharge: 18,
    commission: 2.0,
    investmentScore: 87,
    developerScore: 91,
    reraNo: "0773456789",
    escrowBank: "Mashreq Bank",
    distances: { metro: 4.2, difc: 8, airport: 18, beach: 22, mall: 6, school: 0.5, hospital: 3 },
    amenities: ["Infinity Pool", "Spa", "Gym", "Concierge", "Kids Pool", "Retail", "Co-working", "Waterfront Promenade"],
    views: ["Creek View", "Burj Khalifa View", "City View", "Park View"],
    unitBreakdown: [
      { type: "1BR", sizeMin: 780, sizeMax: 950, priceMin: 1800000, priceMax: 2200000, ppsf: 2180, grossYield: 6.8, available: 220 },
      { type: "2BR", sizeMin: 1200, sizeMax: 1450, priceMin: 2600000, priceMax: 3200000, ppsf: 2100, grossYield: 6.2, available: 180 },
      { type: "3BR", sizeMin: 1800, sizeMax: 2100, priceMin: 3800000, priceMax: 4600000, ppsf: 2050, grossYield: 5.8, available: 90 },
      { type: "4BR", sizeMin: 2400, sizeMax: 2800, priceMin: 5200000, priceMax: 6500000, ppsf: 2020, grossYield: 5.2, available: 30 },
    ],
  },
  {
    id: "lc008",
    project: "Ellington Ocean House — Dubai Islands",
    developer: "Ellington Properties",
    community: "Dubai Islands",
    type: "Apartment",
    tier: 2,
    branded: false,
    launchDate: "2026-06-01",
    eoiDeadline: "2026-05-28",
    status: "Upcoming",
    units: 180,
    soldUnits: 0,
    startingPrice: 2400000,
    pricePerSqft: 2100,
    avgUnitSize: 1140,
    eoiAmount: 50000,
    eoiRefundable: true,
    paymentPlan: { dp: 20, construction: 50, handover: 30, postHandover: 0, label: "70/30" },
    handover: "Q4 2028",
    developerOnTimeRate: 88,
    communityAvgPpsf: 1580,
    appreciationToHandover: 30,
    goldenVisa: true,
    metroDistanceKm: 7,
    beachAccess: true,
    insight: "Design-forward beachfront living. Ellington known for curated interiors. Limited 180 units = scarcity premium.",
    velocityScore: 81,
    tags: ["design", "beachfront", "boutique"],
    grossYield: 6.0,
    netYield: 4.6,
    serviceCharge: 20,
    commission: 2.0,
    investmentScore: 79,
    developerScore: 86,
    reraNo: "0555678901",
    escrowBank: "Emirates NBD",
    distances: { metro: 1.2, difc: 16, airport: 20, beach: 0.1, mall: 8, school: 4, hospital: 5 },
    amenities: ["Beach Access", "Infinity Pool", "Spa", "Gym", "Concierge", "Yacht Jetty", "Curated Interiors", "Lobby Café"],
    views: ["Sea View", "Beach View", "Marina View"],
    unitBreakdown: [
      { type: "1BR", sizeMin: 920, sizeMax: 1100, priceMin: 2400000, priceMax: 3200000, ppsf: 2950, grossYield: 6.8, available: 80 },
      { type: "2BR", sizeMin: 1400, sizeMax: 1800, priceMin: 4200000, priceMax: 5500000, ppsf: 2850, grossYield: 6.2, available: 60 },
      { type: "3BR", sizeMin: 2200, sizeMax: 2800, priceMin: 6800000, priceMax: 9000000, ppsf: 2780, grossYield: 5.8, available: 30 },
      { type: "4BR", sizeMin: 3400, sizeMax: 4200, priceMin: 12000000, priceMax: 18000000, ppsf: 2700, grossYield: 5.2, available: 10 },
    ],
  },
  {
    id: "lc009",
    project: "Aurea — Mina Rashid",
    developer: "Emaar",
    community: "Mina Rashid",
    type: "Apartment",
    tier: 1,
    branded: false,
    launchDate: "2026-06-15",
    eoiDeadline: "2026-06-12",
    status: "Upcoming",
    units: 340,
    soldUnits: 0,
    startingPrice: 2310000,
    pricePerSqft: 2400,
    avgUnitSize: 960,
    eoiAmount: 50000,
    eoiRefundable: true,
    paymentPlan: { dp: 10, construction: 60, handover: 30, postHandover: 0, label: "70/30" },
    handover: "Q4 2026",
    developerOnTimeRate: 88,
    communityAvgPpsf: 2300,
    appreciationToHandover: 18,
    goldenVisa: true,
    metroDistanceKm: 2.5,
    beachAccess: true,
    insight: "Marina district revival. Q4 2026 handover means rapid post-handover rental income. Premium PPSF zone.",
    velocityScore: 86,
    tags: ["beachfront", "apartment", "fastHandover"],
    grossYield: 6.5,
    netYield: 5.2,
    serviceCharge: 16,
    commission: 2.0,
    investmentScore: 85,
    developerScore: 92,
    reraNo: "0778889999",
    escrowBank: "Emirates NBD",
    distances: { metro: 2.5, difc: 8, airport: 18, beach: 0.5, mall: 3, school: 1.8, hospital: 4 },
    amenities: ["Marina Promenade", "Infinity Pool", "Beach Club", "Yacht Berths", "Gym", "Concierge", "Retail"],
    views: ["Marina View", "Sea View", "Sunset View"],
    unitBreakdown: [
      { type: "1BR", sizeMin: 720, sizeMax: 880, priceMin: 2310000, priceMax: 2750000, ppsf: 3200, grossYield: 7.0, available: 140 },
      { type: "2BR", sizeMin: 1080, sizeMax: 1280, priceMin: 3200000, priceMax: 3950000, ppsf: 2960, grossYield: 6.5, available: 120 },
      { type: "3BR", sizeMin: 1600, sizeMax: 1850, priceMin: 4800000, priceMax: 5800000, ppsf: 3000, grossYield: 6.0, available: 60 },
      { type: "4BR Penthouse", sizeMin: 2400, sizeMax: 2900, priceMin: 8500000, priceMax: 11500000, ppsf: 3550, grossYield: 5.5, available: 20 },
    ],
  },
  {
    id: "lc010",
    project: "Sobha Seahaven Sky Edition",
    developer: "Sobha Realty",
    community: "Dubai Marina",
    type: "Apartment",
    tier: 1,
    branded: false,
    launchDate: "2026-07-10",
    eoiDeadline: "2026-07-05",
    status: "Upcoming",
    units: 95,
    soldUnits: 0,
    startingPrice: 21132340,
    pricePerSqft: 5800,
    avgUnitSize: 3640,
    eoiAmount: 250000,
    eoiRefundable: false,
    paymentPlan: { dp: 20, construction: 60, handover: 20, postHandover: 0, label: "20/60/20" },
    handover: "Q1 2027",
    developerOnTimeRate: 91,
    communityAvgPpsf: 5500,
    appreciationToHandover: 22,
    goldenVisa: true,
    metroDistanceKm: 1.8,
    beachAccess: true,
    insight: "Ultra-luxury Marina address. Sobha's flagship sky residences. AED 21M+ entry — HNW only. Limited 95 units.",
    velocityScore: 78,
    tags: ["ultraluxury", "apartment", "marina"],
    grossYield: 5.4,
    netYield: 4.0,
    serviceCharge: 28,
    commission: 1.5,
    investmentScore: 84,
    developerScore: 91,
    reraNo: "0664445555",
    escrowBank: "Mashreq Bank",
    distances: { metro: 1.8, difc: 14, airport: 28, beach: 0.2, mall: 2, school: 4, hospital: 6 },
    amenities: ["Private Beach Access", "Sky Lounge", "Infinity Pool", "Spa", "Concierge", "Chauffeur", "Yacht Charter", "Wellness Center"],
    views: ["Marina View", "Sea View", "Palm View", "Skyline View"],
    unitBreakdown: [
      { type: "3BR Sky", sizeMin: 2800, sizeMax: 3400, priceMin: 21132340, priceMax: 28500000, ppsf: 6500, grossYield: 5.6, available: 55 },
      { type: "4BR Sky", sizeMin: 3800, sizeMax: 4500, priceMin: 32000000, priceMax: 42000000, ppsf: 7100, grossYield: 5.2, available: 28 },
      { type: "Penthouse", sizeMin: 5200, sizeMax: 6800, priceMin: 55000000, priceMax: 85000000, ppsf: 9500, grossYield: 4.8, available: 12 },
    ],
  },
  {
    id: "lc011",
    project: "Burj Binghatti Jacob & Co Residences",
    developer: "Binghatti",
    community: "Business Bay",
    type: "Penthouse",
    tier: 2,
    branded: true,
    brandPartner: "Jacob & Co",
    launchDate: "2026-07-25",
    eoiDeadline: "2026-07-20",
    status: "Upcoming",
    units: 60,
    soldUnits: 0,
    startingPrice: 18000000,
    pricePerSqft: 8500,
    avgUnitSize: 2120,
    eoiAmount: 500000,
    eoiRefundable: false,
    paymentPlan: { dp: 30, construction: 50, handover: 20, postHandover: 0, label: "30/50/20" },
    handover: "Q4 2028",
    developerOnTimeRate: 74,
    communityAvgPpsf: 2050,
    appreciationToHandover: 40,
    goldenVisa: true,
    metroDistanceKm: 0.5,
    beachAccess: false,
    insight: "World's tallest residential tower. Jacob & Co watchmaker-inspired design. Branded residence = 25-30% premium.",
    velocityScore: 76,
    tags: ["branded", "ultraluxury", "iconic"],
    grossYield: 5.8,
    netYield: 4.2,
    serviceCharge: 32,
    commission: 4.0,
    investmentScore: 88,
    developerScore: 81,
    reraNo: "0991112222",
    escrowBank: "ADCB",
    distances: { metro: 0.5, difc: 2, airport: 14, beach: 18, mall: 3, school: 5, hospital: 2.5 },
    amenities: ["Sky Lobby", "Helipad", "Private Lift", "Jacob & Co Concierge", "Sky Pool", "Cigar Lounge", "Whiskey Bar", "Watchmaker Atelier"],
    views: ["Burj Khalifa View", "City Skyline View", "Canal View", "360° Panoramic"],
    unitBreakdown: [
      { type: "3BR Sky Suite", sizeMin: 1800, sizeMax: 2200, priceMin: 18000000, priceMax: 24000000, ppsf: 9500, grossYield: 6.0, available: 35 },
      { type: "Sky Penthouse", sizeMin: 3200, sizeMax: 4000, priceMin: 38000000, priceMax: 52000000, ppsf: 11200, grossYield: 5.5, available: 18 },
      { type: "Burj Penthouse", sizeMin: 5800, sizeMax: 7500, priceMin: 85000000, priceMax: 140000000, ppsf: 14500, grossYield: 4.8, available: 7 },
    ],
  },
  {
    id: "lc012",
    project: "Mercedes-Benz Places by Binghatti",
    developer: "Binghatti",
    community: "Downtown Dubai",
    type: "Apartment",
    tier: 2,
    branded: true,
    brandPartner: "Mercedes-Benz",
    launchDate: "2026-08-15",
    eoiDeadline: "2026-08-10",
    status: "Upcoming",
    units: 225,
    soldUnits: 0,
    startingPrice: 4800000,
    pricePerSqft: 4200,
    avgUnitSize: 1140,
    eoiAmount: 100000,
    eoiRefundable: true,
    paymentPlan: { dp: 20, construction: 60, handover: 20, postHandover: 0, label: "80/20" },
    handover: "Q1 2029",
    developerOnTimeRate: 74,
    communityAvgPpsf: 3100,
    appreciationToHandover: 35,
    goldenVisa: true,
    metroDistanceKm: 0.3,
    beachAccess: false,
    insight: "First Mercedes-Benz branded residence in Dubai. Auto-luxury crossover = strong international appeal. Downtown premium.",
    velocityScore: 85,
    tags: ["branded", "luxury", "downtown", "metro"],
    grossYield: 6.4,
    netYield: 4.8,
    serviceCharge: 26,
    commission: 4.0,
    investmentScore: 86,
    developerScore: 81,
    reraNo: "0883334444",
    escrowBank: "Emirates NBD",
    distances: { metro: 0.3, difc: 1.5, airport: 16, beach: 14, mall: 0.4, school: 4, hospital: 3 },
    amenities: ["Mercedes-Benz Lounge", "Private Showroom", "Sky Pool", "Gym", "Concierge", "Valet", "Chauffeur Service", "Cigar Room"],
    views: ["Burj Khalifa View", "Fountain View", "City View", "Downtown View"],
    unitBreakdown: [
      { type: "1BR", sizeMin: 880, sizeMax: 1100, priceMin: 4800000, priceMax: 6200000, ppsf: 5300, grossYield: 6.8, available: 90 },
      { type: "2BR", sizeMin: 1450, sizeMax: 1750, priceMin: 7800000, priceMax: 10500000, ppsf: 5800, grossYield: 6.4, available: 75 },
      { type: "3BR", sizeMin: 2200, sizeMax: 2700, priceMin: 13500000, priceMax: 18500000, ppsf: 6500, grossYield: 6.0, available: 45 },
      { type: "Penthouse", sizeMin: 4500, sizeMax: 6000, priceMin: 32000000, priceMax: 48000000, ppsf: 7600, grossYield: 5.4, available: 15 },
    ],
  },
  {
    id: "lc013",
    project: "Lyvia by Palace — Dubai Creek Harbour",
    developer: "Emaar",
    community: "Dubai Creek Harbour",
    type: "Apartment",
    tier: 1,
    branded: true,
    brandPartner: "Palace Hotels",
    launchDate: "2026-09-05",
    eoiDeadline: "2026-09-01",
    status: "Upcoming",
    units: 380,
    soldUnits: 0,
    startingPrice: 2684888,
    pricePerSqft: 2950,
    avgUnitSize: 910,
    eoiAmount: 75000,
    eoiRefundable: true,
    paymentPlan: { dp: 10, construction: 60, handover: 20, postHandover: 12, label: "10/70/20 + 12mo PHP" },
    handover: "Q3 2028",
    developerOnTimeRate: 88,
    communityAvgPpsf: 2800,
    appreciationToHandover: 32,
    goldenVisa: true,
    metroDistanceKm: 1.2,
    beachAccess: true,
    insight: "Hotel-branded residence with Palace Hotels hospitality services. Dubai Creek Tower nearby. Tier 1 + branded = strong appreciation.",
    velocityScore: 90,
    tags: ["branded", "waterfront", "metro", "hospitality"],
    grossYield: 6.6,
    netYield: 5.0,
    serviceCharge: 22,
    commission: 2.5,
    investmentScore: 91,
    developerScore: 92,
    reraNo: "0772223333",
    escrowBank: "Emirates NBD",
    distances: { metro: 1.2, difc: 6, airport: 16, beach: 0.8, mall: 2, school: 1.5, hospital: 3 },
    amenities: ["Palace Spa", "5-Star Concierge", "Hotel Room Service", "Infinity Pool", "Beach Club", "Marina Berths", "Fine Dining", "Butler Service"],
    views: ["Creek View", "Dubai Creek Tower View", "Skyline View", "Marina View"],
    unitBreakdown: [
      { type: "1BR", sizeMin: 720, sizeMax: 880, priceMin: 2684888, priceMax: 3400000, ppsf: 3700, grossYield: 7.2, available: 150 },
      { type: "2BR", sizeMin: 1100, sizeMax: 1380, priceMin: 4200000, priceMax: 5500000, ppsf: 3800, grossYield: 6.6, available: 130 },
      { type: "3BR", sizeMin: 1750, sizeMax: 2100, priceMin: 6800000, priceMax: 9000000, ppsf: 3850, grossYield: 6.2, available: 75 },
      { type: "4BR Sky", sizeMin: 2800, sizeMax: 3500, priceMin: 12500000, priceMax: 17000000, ppsf: 4500, grossYield: 5.6, available: 25 },
    ],
  },
  {
    id: "lc014",
    project: "Binghatti Tilal — Master Community",
    developer: "Binghatti",
    community: "Al Rowaiyah",
    type: "Villa",
    tier: 2,
    branded: false,
    launchDate: "2026-10-12",
    eoiDeadline: "2026-10-08",
    status: "Upcoming",
    units: 480,
    soldUnits: 0,
    startingPrice: 3990000,
    pricePerSqft: 1620,
    avgUnitSize: 2460,
    eoiAmount: 100000,
    eoiRefundable: true,
    paymentPlan: { dp: 10, construction: 50, handover: 40, postHandover: 0, label: "60/40" },
    handover: "Q2 2029",
    developerOnTimeRate: 74,
    communityAvgPpsf: 1500,
    appreciationToHandover: 30,
    goldenVisa: true,
    metroDistanceKm: 14,
    beachAccess: false,
    insight: "Binghatti's first master-planned villa community. 250K sqft amenities. Strategic shift from high-rise focus.",
    velocityScore: 73,
    tags: ["villa", "masterplan", "newCategory"],
    grossYield: 6.4,
    netYield: 5.0,
    serviceCharge: 10,
    commission: 4.0,
    investmentScore: 78,
    developerScore: 81,
    reraNo: "0995556666",
    escrowBank: "ADCB",
    plotMin: 1751,
    plotMax: 7193,
    distances: { metro: 14, difc: 22, airport: 25, beach: 28, mall: 5, school: 2, hospital: 6 },
    amenities: ["250K sqft Open Spaces", "Outdoor Gym", "Jogging Tracks", "Mini Golf", "Cricket Enclosure", "Lap Pool", "Kids Pool", "Built-in Mall"],
    views: ["Garden View", "Park View", "Pool View"],
    unitBreakdown: [
      { type: "3BR TH", sizeMin: 2459, sizeMax: 2800, plotMin: 1751, plotMax: 2200, priceMin: 3990000, priceMax: 5200000, ppsf: 1620, grossYield: 6.8, available: 280 },
      { type: "4BR Villa", sizeMin: 4968, sizeMax: 5600, plotMin: 4200, plotMax: 5500, priceMin: 9930000, priceMax: 13500000, ppsf: 2000, grossYield: 6.0, available: 130 },
      { type: "5BR Villa", sizeMin: 5819, sizeMax: 6400, plotMin: 5500, plotMax: 6500, priceMin: 14500000, priceMax: 18500000, ppsf: 2500, grossYield: 5.4, available: 50 },
      { type: "6BR Villa", sizeMin: 7193, sizeMax: 8000, plotMin: 6500, plotMax: 7193, priceMin: 21000000, priceMax: 27000000, ppsf: 2900, grossYield: 4.8, available: 20 },
    ],
  },
  {
    id: "lc015",
    project: "ELA Residences — Palm Jumeirah",
    developer: "Omniyat",
    community: "Palm Jumeirah",
    type: "Penthouse",
    tier: 1,
    branded: true,
    brandPartner: "ELA",
    launchDate: "2026-11-20",
    eoiDeadline: "2026-11-15",
    status: "Upcoming",
    units: 80,
    soldUnits: 0,
    startingPrice: 44000000,
    pricePerSqft: 9500,
    avgUnitSize: 4630,
    eoiAmount: 1000000,
    eoiRefundable: false,
    paymentPlan: { dp: 5, construction: 55, handover: 40, postHandover: 0, label: "5/55/40" },
    handover: "Q1 2029",
    developerOnTimeRate: 85,
    communityAvgPpsf: 9200,
    appreciationToHandover: 25,
    goldenVisa: true,
    metroDistanceKm: 4.5,
    beachAccess: true,
    insight: "Ultra-prime Palm Jumeirah penthouses. AED 44M+ entry. Limited 80 residences. UHNW investor segment only.",
    velocityScore: 70,
    tags: ["ultraluxury", "penthouse", "palm", "branded"],
    grossYield: 5.8,
    netYield: 4.2,
    serviceCharge: 38,
    commission: 1.5,
    investmentScore: 89,
    developerScore: 88,
    reraNo: "0119012345",
    escrowBank: "Emirates NBD",
    distances: { metro: 4.5, difc: 20, airport: 32, beach: 0.05, mall: 18, school: 8, hospital: 12 },
    amenities: ["Private Beach", "5-Star Spa", "Infinity Pool", "Fine Dining", "Butler Service", "Yacht Jetty", "Helipad Access", "Wellness Center"],
    views: ["Sea View", "Palm View", "Burj Al Arab View", "Dubai Skyline"],
    unitBreakdown: [
      { type: "3BR Penthouse", sizeMin: 4200, sizeMax: 5000, priceMin: 44000000, priceMax: 58000000, ppsf: 10500, grossYield: 6.0, available: 45 },
      { type: "4BR Penthouse", sizeMin: 5800, sizeMax: 7000, priceMin: 72000000, priceMax: 95000000, ppsf: 12500, grossYield: 5.6, available: 25 },
      { type: "Sky Mansion", sizeMin: 9500, sizeMax: 12000, priceMin: 145000000, priceMax: 220000000, ppsf: 16500, grossYield: 5.0, available: 10 },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   MARKET CONTEXT — Q1 2026 Dubai launches & transactions
   ═══════════════════════════════════════════════════════════════════ */
const MARKET_Q1_2026 = {
  totalTransactions: "44,150",
  totalValue: "AED 138.7B",
  yoyValueGrowth: "+21.2%",
  offPlanShare: "65%",
  topAbsorption: "60-70% in first weeks",
  preLaunchToHandoverGain: "30-40%",
};

const DEVELOPER_PROFILES = {
  "Sobha Realty":         { tier: 1, onTime: 91, traits: "Backward-integrated, zero-defect, fastest delivery", color: "#10B981" },
  "Emaar":                { tier: 1, onTime: 88, traits: "Largest developer, most liquid resale market", color: "#10B981" },
  "Ellington Properties": { tier: 1, onTime: 88, traits: "Boutique design-forward, curated finishes", color: "#10B981" },
  "Majid Al Futtaim":     { tier: 1, onTime: 87, traits: "Master community specialist, lifestyle focus", color: "#10B981" },
  "Omniyat":              { tier: 1, onTime: 85, traits: "Ultra-luxury Palm/Marina specialist", color: "#10B981" },
  "Nakheel":              { tier: 1, onTime: 80, traits: "Government-backed, infrastructure-led", color: "#10B981" },
  "Binghatti":            { tier: 2, onTime: 74, traits: "Bold architecture, fast construction, branded partnerships", color: "#F59E0B" },
  "DAMAC Properties":     { tier: 2, onTime: 71, traits: "Lifestyle luxury, branded residences, golf communities", color: "#F59E0B" },
};

const COMMUNITY_SUPPLY = {
  "Jumeirah Village Circle": { risk: "high",   units2028: 27082, label: "Oversupplied" },
  "Business Bay":            { risk: "medium", units2028: 10127, label: "Watch closely" },
  "Azizi Venice":            { risk: "high",   units2028: 7860,  label: "Oversupplied" },
  "DAMAC Lagoons":           { risk: "medium", units2028: 8500,  label: "Watch closely" },
  "Arjan":                   { risk: "medium", units2028: 6200,  label: "Watch closely" },
  "Dubai Hills Estate":      { risk: "low",    units2028: 4500,  label: "Tier 1 dev concentration" },
  "Dubai Creek Harbour":     { risk: "low",    units2028: 3800,  label: "Healthy absorption" },
  "Dubai South":             { risk: "low",    units2028: 3200,  label: "Govt-priority infrastructure" },
  "Palm Jumeirah":           { risk: "low",    units2028: 800,   label: "Land-constrained, scarcity premium" },
  "The Oasis":               { risk: "low",    units2028: 2700,  label: "10:1 vs Hills, scarcity" },
  "Tilal Al Ghaf":           { risk: "low",    units2028: 1500,  label: "Premium positioning" },
};

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
function LaunchCalendarTab({
  lcSearch, setLcSearch,
  lcDev, setLcDev,
  lcStatus, setLcStatus,
  lcType, setLcType,
  lcView, setLcView,
  liveMarketData,
  liveLaunches,
  handleTabChange,
}) {
  const [calcBudget, setCalcBudget] = useState(2000000);
  const [compareIds, setCompareIds] = useState([]);
  const [filterChip, setFilterChip] = useState("all");
  const [sortBy, setSortBy] = useState("launchDate");
  const [expandedId, setExpandedId] = useState(null); // for inline bed breakdown
  const [detailModalProject, setDetailModalProject] = useState(null); // for full detail modal

  /* Normalize view: legacy values like "list" should fall back to newspaper */
  const view = (lcView === "newspaper" || lcView === "calendar" || lcView === "compare") ? lcView : "newspaper";

  const launches = useMemo(() => {
    return (liveLaunches && liveLaunches.length > 0) ? liveLaunches : SEED_LAUNCHES;
  }, [liveLaunches]);
  const isSeed = !liveLaunches || liveLaunches.length === 0;

  const filtered = useMemo(() => {
    let result = [...launches];

    if (lcSearch) {
      const q = lcSearch.toLowerCase();
      result = result.filter(p =>
        (p.project || "").toLowerCase().includes(q) ||
        (p.developer || "").toLowerCase().includes(q) ||
        (p.community || "").toLowerCase().includes(q)
      );
    }
    if (lcDev && lcDev !== "All") result = result.filter(p => p.developer === lcDev);
    if (lcStatus && lcStatus !== "All") result = result.filter(p => p.status === lcStatus);
    if (lcType && lcType !== "All") result = result.filter(p => p.type === lcType);

    if (filterChip === "tier1") result = result.filter(p => p.tier === 1);
    if (filterChip === "gv") result = result.filter(p => p.goldenVisa);
    if (filterChip === "lt2m") result = result.filter(p => p.startingPrice < 2000000);
    if (filterChip === "gt5m") result = result.filter(p => p.startingPrice >= 5000000);
    if (filterChip === "branded") result = result.filter(p => p.branded);
    if (filterChip === "beachfront") result = result.filter(p => p.beachAccess);
    if (filterChip === "metro") result = result.filter(p => p.metroDistanceKm <= 1.5);
    if (filterChip === "highYield") result = result.filter(p => (p.grossYield || 0) >= 7);
    if (filterChip === "thisMonth") {
      const now = new Date();
      result = result.filter(p => {
        const d = new Date(p.launchDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }
    if (filterChip === "affordable") result = result.filter(p => p.startingPrice <= calcBudget);

    if (sortBy === "launchDate") result.sort((a, b) => new Date(a.launchDate) - new Date(b.launchDate));
    if (sortBy === "velocity") result.sort((a, b) => b.velocityScore - a.velocityScore);
    if (sortBy === "price") result.sort((a, b) => a.startingPrice - b.startingPrice);
    if (sortBy === "appreciation") result.sort((a, b) => b.appreciationToHandover - a.appreciationToHandover);
    if (sortBy === "yield") result.sort((a, b) => (b.grossYield || 0) - (a.grossYield || 0));
    if (sortBy === "score") result.sort((a, b) => (b.investmentScore || 0) - (a.investmentScore || 0));

    return result;
  }, [launches, lcSearch, lcDev, lcStatus, lcType, filterChip, sortBy, calcBudget]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const eoiOpen = filtered.filter(p => p.status === "EOI Open").length;
    const upcoming = filtered.filter(p => p.status === "Upcoming").length;
    const launched = filtered.filter(p => p.status === "Launched").length;
    const soldOut = filtered.filter(p => p.status === "Sold Out").length;
    const goldenVisa = filtered.filter(p => p.goldenVisa).length;
    const yields = filtered.filter(p => p.grossYield > 0);
    const avgGrossYield = yields.length > 0 ? (yields.reduce((s, p) => s + p.grossYield, 0) / yields.length).toFixed(1) : "—";
    const ppsfs = filtered.filter(p => p.pricePerSqft > 0);
    const avgPpsf = ppsfs.length > 0 ? Math.round(ppsfs.reduce((s, p) => s + p.pricePerSqft, 0) / ppsfs.length) : 0;
    return { total, eoiOpen, upcoming, launched, soldOut, goldenVisa, avgGrossYield, avgPpsf };
  }, [filtered]);

  const heroLaunch = useMemo(() => {
    const eoiOpen = filtered.filter(p => p.status === "EOI Open");
    if (eoiOpen.length > 0) return eoiOpen.sort((a, b) => new Date(a.eoiDeadline) - new Date(b.eoiDeadline))[0];
    const upcoming = filtered.filter(p => p.status === "Upcoming");
    if (upcoming.length > 0) return upcoming.sort((a, b) => new Date(a.launchDate) - new Date(b.launchDate))[0];
    return filtered[0] || null;
  }, [filtered]);

  const daysUntil = (dateStr) => {
    const target = new Date(dateStr);
    const now = new Date();
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  };

  const statusColor = (s) => {
    if (s === "EOI Open") return "#10B981";
    if (s === "Upcoming") return "#3B82F6";
    if (s === "Launched") return T.gold;
    if (s === "EOI Closed") return "#F59E0B";
    if (s === "Sold Out") return "#EF4444";
    return T.textMuted;
  };

  const intelligenceBadge = (p) => {
    const dev = DEVELOPER_PROFILES[p.developer];
    const supply = COMMUNITY_SUPPLY[p.community];
    const score = (dev?.onTime || 70) + (p.tier === 1 ? 15 : 0) + (p.appreciationToHandover || 20) +
                  (supply?.risk === "low" ? 10 : supply?.risk === "high" ? -15 : 0) +
                  (p.branded ? 8 : 0);
    if (score >= 130) return { label: "Strong Buy", color: "#10B981" };
    if (score >= 110) return { label: "Buy", color: "#10B981" };
    if (score >= 90) return { label: "Hold", color: T.gold };
    if (score >= 75) return { label: "Watch", color: "#F59E0B" };
    return { label: "Caution", color: "#EF4444" };
  };

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(p => {
      const d = new Date(p.launchDate);
      const key = d.toLocaleDateString("en-AE", { month: "long", year: "numeric" });
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [filtered]);

  const supplyChartData = useMemo(() => {
    const counts = {};
    filtered.forEach(p => {
      counts[p.community] = (counts[p.community] || 0) + 1;
    });
    return Object.entries(counts).map(([community, count]) => ({
      community: community.length > 18 ? community.slice(0, 16) + "…" : community,
      count,
      risk: COMMUNITY_SUPPLY[community]?.risk || "unknown",
    })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [filtered]);

  const toggleCompare = (id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const toggleExpanded = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const allDevs = useMemo(() => ["All", ...Array.from(new Set(launches.map(l => l.developer)))], [launches]);

  /* Score color helper */
  const scoreColor = (s) => {
    if (s >= 85) return "#10B981";
    if (s >= 75) return T.gold;
    if (s >= 65) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out forwards" }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 16, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 800, color: T.white }}>Launch Calendar — DXB Daily</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
            {kpis.total} launches · {kpis.eoiOpen} EOI open · Avg gross yield {kpis.avgGrossYield}% · Avg PPSF AED {kpis.avgPpsf} · Bed-level inventory · Full project details
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { key: "newspaper", label: "Newspaper" },
            { key: "calendar", label: "Calendar" },
            { key: "compare", label: "Compare" },
          ].map(v => (
            <button key={v.key} type="button" onClick={() => setLcView(v.key)}
              style={{
                padding: "6px 14px",
                background: view === v.key ? "rgba(212,168,67,0.16)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${view === v.key ? T.gold : T.border}`,
                borderRadius: 8,
                color: view === v.key ? T.gold : T.textMuted,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
              }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Q1 2026 MARKET BANNER */}
      <div style={{ marginBottom: 16, padding: "12px 16px", background: "linear-gradient(135deg, rgba(212,168,67,0.06), rgba(212,168,67,0.02))", border: `1px solid ${T.gold}33`, borderRadius: 12, display: "flex", flexWrap: "wrap", gap: 22, alignItems: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.gold, letterSpacing: 0.6, textTransform: "uppercase", flexShrink: 0 }}>Q1 2026 Dubai Market</div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", flex: 1 }}>
          {[
            { label: "Transactions", val: MARKET_Q1_2026.totalTransactions, color: T.white },
            { label: "Total Value", val: MARKET_Q1_2026.totalValue, color: "#10B981" },
            { label: "YoY Value", val: MARKET_Q1_2026.yoyValueGrowth, color: "#10B981" },
            { label: "Off-Plan Share", val: MARKET_Q1_2026.offPlanShare, color: T.white },
            { label: "Pre→Handover", val: MARKET_Q1_2026.preLaunchToHandoverGain, color: T.gold },
            { label: "Healthy Absorption", val: MARKET_Q1_2026.topAbsorption, color: T.white },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: T.textMuted }}>Source: zawya.com · AIQYA Q1 2026</div>
      </div>

      {/* KPI ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Tracked", value: kpis.total, color: T.gold, sub: "Curated launches" },
          { label: "EOI Open", value: kpis.eoiOpen, color: "#10B981", sub: "Reserve now" },
          { label: "Upcoming", value: kpis.upcoming, color: "#3B82F6", sub: "Within 90 days" },
          { label: "Launched", value: kpis.launched, color: T.gold, sub: "Selling now" },
          { label: "Sold Out", value: kpis.soldOut, color: "#EF4444", sub: "Reference only" },
          { label: "Golden Visa", value: kpis.goldenVisa, color: T.gold, sub: "AED 2M+ eligible" },
          { label: "Avg Yield", value: kpis.avgGrossYield + "%", color: "#10B981", sub: "Gross, filtered" },
          { label: "Avg PPSF", value: "AED " + kpis.avgPpsf, color: T.white, sub: "Filtered set" },
        ].map((kpi, i) => (
          <div key={i} style={{ padding: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
            <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 9, color: T.textMuted, marginTop: 4 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* HERO CARD */}
      {heroLaunch && view === "newspaper" && (
        <div style={{ marginBottom: 18, padding: 20, background: `linear-gradient(135deg, ${T.surface}, rgba(212,168,67,0.05))`, border: `2px solid ${T.gold}`, borderRadius: 14, boxShadow: `0 0 30px ${T.gold}22` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold, display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: T.gold, textTransform: "uppercase", letterSpacing: 0.8 }}>
              {heroLaunch.status === "EOI Open" ? "⚡ EOI Closes In " + Math.max(0, daysUntil(heroLaunch.eoiDeadline)) + " Days" : "Next Launch — " + Math.max(0, daysUntil(heroLaunch.launchDate)) + " Days Away"}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 16, marginBottom: 14, alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{heroLaunch.developer} · {heroLaunch.community}</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 800, color: T.white, marginTop: 4 }}>{heroLaunch.project}</div>
              <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 6, lineHeight: 1.5 }}>{heroLaunch.insight}</div>
            </div>
            <div style={{ width: 70, height: 70, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `3px solid ${scoreColor(heroLaunch.investmentScore)}`, background: `${scoreColor(heroLaunch.investmentScore)}22`, flexShrink: 0 }}>
              <span style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: scoreColor(heroLaunch.investmentScore), lineHeight: 1 }}>{heroLaunch.investmentScore}</span>
              <span style={{ fontSize: 8, color: scoreColor(heroLaunch.investmentScore), fontWeight: 700, marginTop: 2 }}>SCORE</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Starting</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 800, color: T.gold, lineHeight: 1, marginTop: 4 }}>
                AED {(heroLaunch.startingPrice / 1000000).toFixed(2)}M
              </div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{heroLaunch.pricePerSqft} AED/sqft</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginBottom: 14 }}>
            {[
              { l: "Units", v: heroLaunch.units },
              { l: "Plan", v: heroLaunch.paymentPlan.label },
              { l: "EOI", v: "AED " + (heroLaunch.eoiAmount / 1000).toFixed(0) + "K", sub: heroLaunch.eoiRefundable ? "Refundable" : "Non-refund", subColor: heroLaunch.eoiRefundable ? "#10B981" : "#EF4444" },
              { l: "Dev On-Time", v: heroLaunch.developerOnTimeRate + "%", color: heroLaunch.developerOnTimeRate >= 85 ? "#10B981" : "#F59E0B" },
              { l: "Pre→Handover", v: "+" + heroLaunch.appreciationToHandover + "%", color: T.gold },
              { l: "Gross Yield", v: heroLaunch.grossYield + "%", color: "#10B981" },
              { l: "Net Yield", v: heroLaunch.netYield + "%", color: "#10B981" },
              { l: "Service Charge", v: "AED " + heroLaunch.serviceCharge + "/sqft" },
            ].map((s, i) => (
              <div key={i} style={{ padding: 10, background: T.surfaceAlt, borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>{s.l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color || T.white }}>{s.v}</div>
                {s.sub && <div style={{ fontSize: 9, color: s.subColor || T.textMuted }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: `1px solid ${T.border}`, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(() => {
                const badge = intelligenceBadge(heroLaunch);
                return <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 6, background: `${badge.color}22`, color: badge.color, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>{badge.label}</span>;
              })()}
              {heroLaunch.tags?.slice(0, 4).map(t => (
                <span key={t} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: T.surfaceAlt, color: T.textMuted, textTransform: "capitalize" }}>{t}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setDetailModalProject(heroLaunch)}
                style={{ padding: "8px 16px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                Full Details
              </button>
              <button type="button" onClick={() => toggleCompare(heroLaunch.id)}
                style={{ padding: "8px 16px", background: compareIds.includes(heroLaunch.id) ? T.gold : "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: compareIds.includes(heroLaunch.id) ? T.dark : T.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                {compareIds.includes(heroLaunch.id) ? "✓ Comparing" : "+ Compare"}
              </button>
              <button type="button" onClick={() => handleTabChange && handleTabChange("Mortgage")}
                style={{ padding: "8px 16px", background: T.gold, border: `1px solid ${T.gold}`, borderRadius: 8, color: T.dark, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                Run Mortgage →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER CHIPS */}
      <div style={{ marginBottom: 12, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginRight: 4 }}>Filter:</span>
        {[
          { key: "all", label: "All" },
          { key: "tier1", label: "Tier 1 Devs" },
          { key: "gv", label: "Golden Visa" },
          { key: "lt2m", label: "< AED 2M" },
          { key: "gt5m", label: "> AED 5M" },
          { key: "branded", label: "Branded" },
          { key: "beachfront", label: "Beachfront" },
          { key: "metro", label: "Metro < 1.5km" },
          { key: "highYield", label: "Yield ≥ 7%" },
          { key: "thisMonth", label: "This Month" },
          { key: "affordable", label: "≤ AED " + (calcBudget / 1000000).toFixed(1) + "M" },
        ].map(f => (
          <button key={f.key} type="button" onClick={() => setFilterChip(f.key)}
            style={{
              padding: "5px 12px",
              background: filterChip === f.key ? T.gold : "rgba(255,255,255,0.04)",
              border: `1px solid ${filterChip === f.key ? T.gold : T.border}`,
              borderRadius: 16,
              color: filterChip === f.key ? T.dark : T.textPrimary,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* SEARCH + DROPDOWNS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input type="text" value={lcSearch || ""} onChange={(e) => setLcSearch(e.target.value)}
          placeholder="Search project, developer, community..."
          style={{ flex: "1 1 240px", padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", outline: "none" }} />
        <select value={lcDev || "All"} onChange={(e) => setLcDev(e.target.value)}
          style={{ padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer", outline: "none" }}>
          {allDevs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={lcStatus || "All"} onChange={(e) => setLcStatus(e.target.value)}
          style={{ padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer", outline: "none" }}>
          <option value="All">All Status</option>
          <option value="EOI Open">EOI Open</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Launched">Launched</option>
          <option value="EOI Closed">EOI Closed</option>
          <option value="Sold Out">Sold Out</option>
        </select>
        <select value={lcType || "All"} onChange={(e) => setLcType(e.target.value)}
          style={{ padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer", outline: "none" }}>
          <option value="All">All Types</option>
          <option value="Apartment">Apartment</option>
          <option value="Villa">Villa</option>
          <option value="Townhouse">Townhouse</option>
          <option value="Penthouse">Penthouse</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer", outline: "none" }}>
          <option value="launchDate">Sort: Launch Date</option>
          <option value="velocity">Sort: Velocity Score</option>
          <option value="price">Sort: Price (Low → High)</option>
          <option value="appreciation">Sort: Appreciation</option>
          <option value="yield">Sort: Gross Yield</option>
          <option value="score">Sort: Investment Score</option>
        </select>
      </div>

      {/* AFFORDABILITY CALCULATOR */}
      <div style={{ marginBottom: 16, padding: "12px 16px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, textTransform: "uppercase", letterSpacing: 0.5 }}>Affordability Filter</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 280 }}>
          <span style={{ fontSize: 11, color: T.textMuted }}>My budget:</span>
          <input type="range" min="500000" max="20000000" step="100000" value={calcBudget} onChange={(e) => setCalcBudget(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: T.gold }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: T.gold, minWidth: 90, textAlign: "right" }}>AED {(calcBudget / 1000000).toFixed(1)}M</span>
        </div>
        <div style={{ fontSize: 11, color: T.textMuted }}>
          <span style={{ color: T.gold, fontWeight: 700 }}>{filtered.filter(p => p.startingPrice <= calcBudget).length}</span> launches within budget
        </div>
      </div>

      {/* DATA SOURCE BADGE */}
      <div style={{ marginBottom: 16, padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: isSeed ? T.gold : "#10B981", display: "inline-block" }} />
        <span style={{ fontSize: 11, color: T.textMuted }}>
          {isSeed ? "Curated launch data — Property Finder, prelaunch.ae, developer portals · Add via Admin → Data Manager → Launches" : "Live launch feed from your data source"}
        </span>
      </div>

      {/* MODE 1: NEWSPAPER VIEW */}
      {view === "newspaper" && (
        <>
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ height: 1, flex: 1, background: T.border }} />
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.gold }}>{month}</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>{items.length} {items.length === 1 ? "launch" : "launches"}</div>
                <div style={{ height: 1, flex: 1, background: T.border }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 14 }}>
                {items.map(p => {
                  const badge = intelligenceBadge(p);
                  const isCompared = compareIds.includes(p.id);
                  const isExpanded = expandedId === p.id;
                  const isAffordable = p.startingPrice <= calcBudget;
                  return (
                    <div key={p.id} style={{
                      padding: 16,
                      background: T.surface,
                      border: `1px solid ${isCompared ? T.gold : T.border}`,
                      borderRadius: 12,
                      borderLeft: `4px solid ${statusColor(p.status)}`,
                      opacity: isAffordable ? 1 : 0.55,
                    }}>
                      {/* Header with score circle */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{p.developer.toUpperCase()}</div>
                          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: T.white, marginTop: 2, lineHeight: 1.25 }}>{p.project}</div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{p.community} · {p.type}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <div style={{ width: 48, height: 48, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `2px solid ${scoreColor(p.investmentScore)}`, background: `${scoreColor(p.investmentScore)}22` }}>
                            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 900, color: scoreColor(p.investmentScore), lineHeight: 1 }}>{p.investmentScore}</span>
                          </div>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${badge.color}22`, color: badge.color, fontWeight: 800, textTransform: "uppercase" }}>{badge.label}</span>
                          {p.commission && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(16,185,129,0.12)", color: "#10B981", fontWeight: 700 }}>{p.commission}% comm</span>}
                        </div>
                      </div>

                      {/* Status + tags */}
                      <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: `${statusColor(p.status)}22`, color: statusColor(p.status), fontWeight: 700 }}>● {p.status}</span>
                        {p.goldenVisa && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(212,168,67,0.15)", color: T.gold, fontWeight: 700 }}>★ Golden Visa</span>}
                        {p.branded && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(139,92,246,0.15)", color: "#A78BFA", fontWeight: 700 }}>◆ {p.brandPartner}</span>}
                        {p.tier === 1 && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: "#10B981", fontWeight: 700 }}>Tier 1</span>}
                      </div>

                      {/* Price */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: T.gold, lineHeight: 1 }}>AED {(p.startingPrice / 1000000).toFixed(2)}M</div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>starting · {p.pricePerSqft} AED/sqft</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#10B981" }}>+{p.appreciationToHandover}%</div>
                          <div style={{ fontSize: 9, color: T.textMuted }}>pre→handover</div>
                        </div>
                      </div>

                      {/* Yield strip */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10, padding: "8px 10px", background: T.surfaceAlt, borderRadius: 8 }}>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Gross Yield</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>{p.grossYield}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Net Yield</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>{p.netYield}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Service</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{p.serviceCharge}/sqft</div>
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10, padding: "10px 0", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Units</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{p.units}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Plan</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.white }}>{p.paymentPlan.label}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Handover</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.white }}>{p.handover}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>EOI</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.white }}>AED {(p.eoiAmount / 1000).toFixed(0)}K</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Dev On-Time</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: p.developerOnTimeRate >= 85 ? "#10B981" : "#F59E0B" }}>{p.developerOnTimeRate}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Velocity</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: p.velocityScore >= 80 ? "#10B981" : p.velocityScore >= 60 ? T.gold : "#F59E0B" }}>{p.velocityScore}/100</div>
                        </div>
                      </div>

                      {/* Distance icons row */}
                      {p.distances && (
                        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", padding: "8px 0", fontSize: 10, color: T.textMuted }}>
                          <span>🚇 {p.distances.metro}km</span>
                          <span>🏖️ {p.distances.beach}km</span>
                          <span>🏫 {p.distances.school}km</span>
                          <span>🏥 {p.distances.hospital}km</span>
                          <span>🛍️ {p.distances.mall}km</span>
                          <span>✈️ {p.distances.airport}km</span>
                        </div>
                      )}

                      {/* Insight */}
                      <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5, marginBottom: 10 }}>{p.insight}</div>

                      {/* Expandable bed breakdown */}
                      {isExpanded && p.unitBreakdown && (
                        <div style={{ marginBottom: 10, padding: 10, background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.gold}33` }}>
                          <div style={{ fontSize: 10, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Unit Inventory by Bed Type</div>
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                              <thead>
                                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                  <th style={{ padding: "4px 6px", textAlign: "left", color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Type</th>
                                  <th style={{ padding: "4px 6px", textAlign: "right", color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Size</th>
                                  <th style={{ padding: "4px 6px", textAlign: "right", color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Price</th>
                                  <th style={{ padding: "4px 6px", textAlign: "right", color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>PPSF</th>
                                  <th style={{ padding: "4px 6px", textAlign: "right", color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Yield</th>
                                  <th style={{ padding: "4px 6px", textAlign: "right", color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Avail</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.unitBreakdown.map((u, i) => (
                                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                                    <td style={{ padding: "5px 6px", color: T.white, fontWeight: 600 }}>{u.type}</td>
                                    <td style={{ padding: "5px 6px", textAlign: "right", color: T.textPrimary }}>{u.sizeMin}-{u.sizeMax}</td>
                                    <td style={{ padding: "5px 6px", textAlign: "right", color: T.gold, fontWeight: 700 }}>{(u.priceMin / 1000000).toFixed(2)}-{(u.priceMax / 1000000).toFixed(2)}M</td>
                                    <td style={{ padding: "5px 6px", textAlign: "right", color: T.textPrimary }}>{u.ppsf}</td>
                                    <td style={{ padding: "5px 6px", textAlign: "right", color: "#10B981", fontWeight: 700 }}>{u.grossYield}%</td>
                                    <td style={{ padding: "5px 6px", textAlign: "right", color: u.available > 0 ? T.white : "#EF4444", fontWeight: 700 }}>{u.available}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* RERA + Escrow */}
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${T.border}`, marginBottom: 8, fontSize: 9, color: T.textMuted }}>
                        <span>RERA: {p.reraNo}</span>
                        <span>Escrow: {p.escrowBank}</span>
                      </div>

                      {/* Footer actions */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${T.border}`, gap: 6 }}>
                        <div style={{ fontSize: 10, color: T.textMuted }}>
                          {p.status === "EOI Open" || p.status === "Upcoming"
                            ? `${Math.max(0, daysUntil(p.launchDate))} days to launch`
                            : `Launched ${new Date(p.launchDate).toLocaleDateString("en-AE", { day: "numeric", month: "short" })}`}
                        </div>
                        <div style={{ display: "flex", gap: 5 }}>
                          {p.unitBreakdown && (
                            <button type="button" onClick={() => toggleExpanded(p.id)}
                              style={{ padding: "4px 10px", background: isExpanded ? T.gold : "rgba(212,168,67,0.08)", border: `1px solid ${T.gold}`, borderRadius: 6, color: isExpanded ? T.dark : T.gold, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                              {isExpanded ? "▲ Hide Beds" : "▼ Beds"}
                            </button>
                          )}
                          <button type="button" onClick={() => setDetailModalProject(p)}
                            style={{ padding: "4px 10px", background: "rgba(212,168,67,0.08)", border: `1px solid ${T.gold}`, borderRadius: 6, color: T.gold, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                            Details
                          </button>
                          <button type="button" onClick={() => toggleCompare(p.id)}
                            style={{ padding: "4px 10px", background: isCompared ? T.gold : "rgba(212,168,67,0.08)", border: `1px solid ${T.gold}`, borderRadius: 6, color: isCompared ? T.dark : T.gold, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                            {isCompared ? "✓" : "+"} Cmp
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* COMMUNITY SUPPLY HEAT MAP */}
          {supplyChartData.length > 0 && (
            <div style={{ marginBottom: 20, padding: 18, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.white }}>Community Supply Heat Map</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Launches per community in current filter — color-coded by oversupply risk (Source: prelaunch.ae 2026-2028 supply analysis)</div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={supplyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="community" tick={{ fill: T.textMuted, fontSize: 10 }} angle={-15} textAnchor="end" height={70} />
                  <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {supplyChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.risk === "high" ? "#EF4444" : entry.risk === "medium" ? "#F59E0B" : "#10B981"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
                <span style={{ fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: "#10B981", borderRadius: 2 }}></span> Low risk</span>
                <span style={{ fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: "#F59E0B", borderRadius: 2 }}></span> Watch closely</span>
                <span style={{ fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: "#EF4444", borderRadius: 2 }}></span> Oversupplied</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODE 2: CALENDAR VIEW */}
      {view === "calendar" && (
        <div style={{ marginBottom: 20 }}>
          {Object.entries(grouped).map(([month, items]) => {
            const firstLaunch = new Date(items[0].launchDate);
            const year = firstLaunch.getFullYear();
            const monthIdx = firstLaunch.getMonth();
            const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
            const firstDayOfWeek = new Date(year, monthIdx, 1).getDay();
            const launchesByDay = {};
            items.forEach(p => {
              const day = new Date(p.launchDate).getDate();
              if (!launchesByDay[day]) launchesByDay[day] = [];
              launchesByDay[day].push(p);
            });
            return (
              <div key={month} style={{ marginBottom: 24, padding: 18, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: T.gold, marginBottom: 14, textAlign: "center" }}>{month}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} style={{ fontSize: 10, color: T.textMuted, textAlign: "center", padding: "6px 0", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`pad-${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const dayLaunches = launchesByDay[day] || [];
                    const hasLaunch = dayLaunches.length > 0;
                    return (
                      <div key={day} style={{
                        minHeight: 70,
                        padding: 6,
                        background: hasLaunch ? `${T.gold}10` : T.surfaceAlt,
                        border: `1px solid ${hasLaunch ? T.gold : T.border}`,
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        cursor: hasLaunch ? "pointer" : "default",
                      }}
                        onClick={() => hasLaunch && setDetailModalProject(dayLaunches[0])}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: hasLaunch ? T.gold : T.textMuted }}>{day}</div>
                        {dayLaunches.map(p => (
                          <div key={p.id} title={p.project} style={{
                            fontSize: 9,
                            padding: "2px 4px",
                            background: `${statusColor(p.status)}22`,
                            color: statusColor(p.status),
                            borderRadius: 3,
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {p.project.length > 12 ? p.project.slice(0, 11) + "…" : p.project}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 3: COMPARISON TABLE */}
      {view === "compare" && (
        <div style={{ marginBottom: 20 }}>
          {compareIds.length === 0 ? (
            <div style={{ padding: 30, background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 12, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 6 }}>No launches selected for comparison</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>Switch to Newspaper view, click "+ Cmp" on up to 3 launches, then come back here.</div>
            </div>
          ) : (
            <div style={{ padding: 18, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
              <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.white }}>Side-by-Side Comparison</div>
                <button type="button" onClick={() => setCompareIds([])}
                  style={{ padding: "5px 12px", background: "rgba(239,68,68,0.1)", border: `1px solid #EF4444`, borderRadius: 6, color: "#EF4444", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                  Clear All
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", color: T.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Metric</th>
                      {compareIds.map(id => {
                        const p = filtered.find(x => x.id === id) || launches.find(x => x.id === id);
                        if (!p) return null;
                        return (
                          <th key={id} style={{ padding: "10px 12px", textAlign: "left", minWidth: 200 }}>
                            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: T.gold }}>{p.project}</div>
                            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{p.developer}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Investment Score", get: p => `${p.investmentScore}/100` },
                      { label: "Verdict", get: p => intelligenceBadge(p).label },
                      { label: "Community", get: p => p.community },
                      { label: "Type", get: p => p.type },
                      { label: "Tier", get: p => p.tier === 1 ? "Tier 1 (Premium)" : "Tier 2" },
                      { label: "Status", get: p => p.status },
                      { label: "Launch Date", get: p => new Date(p.launchDate).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" }) },
                      { label: "Starting Price", get: p => `AED ${(p.startingPrice / 1000000).toFixed(2)}M` },
                      { label: "Price per sqft", get: p => `AED ${p.pricePerSqft}` },
                      { label: "Avg unit size", get: p => `${p.avgUnitSize} sqft` },
                      { label: "Total Units", get: p => p.units },
                      { label: "Payment Plan", get: p => p.paymentPlan.label },
                      { label: "EOI Amount", get: p => `AED ${(p.eoiAmount / 1000).toFixed(0)}K` },
                      { label: "EOI Refundable", get: p => p.eoiRefundable ? "Yes ✓" : "No" },
                      { label: "Handover", get: p => p.handover },
                      { label: "Dev On-Time Rate", get: p => `${p.developerOnTimeRate}%` },
                      { label: "Developer Score", get: p => `${p.developerScore || "—"}/100` },
                      { label: "Gross Yield", get: p => `${p.grossYield}%` },
                      { label: "Net Yield", get: p => `${p.netYield}%` },
                      { label: "Service Charge", get: p => `AED ${p.serviceCharge}/sqft` },
                      { label: "Commission", get: p => `${p.commission}%` },
                      { label: "Community Avg PPSF", get: p => `AED ${p.communityAvgPpsf}` },
                      { label: "Pre→Handover Gain", get: p => `+${p.appreciationToHandover}%` },
                      { label: "Velocity Score", get: p => `${p.velocityScore}/100` },
                      { label: "Golden Visa", get: p => p.goldenVisa ? "✓ Eligible" : "Below threshold" },
                      { label: "Branded", get: p => p.branded ? p.brandPartner : "—" },
                      { label: "Beachfront", get: p => p.beachAccess ? "Yes ✓" : "No" },
                      { label: "Distance to Metro", get: p => `${p.distances?.metro || p.metroDistanceKm} km` },
                      { label: "Distance to Beach", get: p => `${p.distances?.beach || "—"} km` },
                      { label: "Distance to School", get: p => `${p.distances?.school || "—"} km` },
                      { label: "RERA Number", get: p => p.reraNo || "—" },
                      { label: "Escrow Bank", get: p => p.escrowBank || "—" },
                    ].map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: "10px 12px", color: T.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>{row.label}</td>
                        {compareIds.map(id => {
                          const p = filtered.find(x => x.id === id) || launches.find(x => x.id === id);
                          if (!p) return null;
                          return <td key={id} style={{ padding: "10px 12px", color: T.white, fontWeight: 600 }}>{row.get(p)}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DEVELOPER PROFILES PANEL */}
      <div style={{ marginBottom: 20, padding: 18, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.white }}>Developer Track Records (Q1 2026)</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Same data as Handover tab — consistent across the platform · Source: prelaunch.ae, BSA Law</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
          {Object.entries(DEVELOPER_PROFILES).map(([name, dev]) => (
            <div key={name} style={{ padding: 12, background: T.surfaceAlt, borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: T.white, fontWeight: 700 }}>{name}</span>
                <span style={{ fontSize: 13, color: dev.color, fontWeight: 800 }}>{dev.onTime}%</span>
              </div>
              <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ height: "100%", width: `${dev.onTime}%`, background: dev.color }} />
              </div>
              <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.4 }}>{dev.traits}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KEY INSIGHTS PANEL */}
      <div style={{ marginBottom: 20, padding: 18, background: "rgba(212,168,67,0.04)", border: `1px solid ${T.gold}33`, borderRadius: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, display: "inline-block" }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, textTransform: "uppercase", letterSpacing: 0.5 }}>Pre-Launch Investment Intelligence</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {[
            { icon: "📈", title: "Sales Velocity Rule", desc: "Healthy launches sell 60-70% in first weeks. Below 40% = warning sign of soft demand." },
            { icon: "💰", title: "Pre-Launch Discount", desc: "Pre-launch prices typically 15-25% below launch day. Pre→handover gains average 30-40%." },
            { icon: "⚡", title: "Tier 1 Premium", desc: "Sobha (91%), Emaar (88%), Ellington (88%) deliver on time. Industry average: only 48% for 2026." },
            { icon: "★", title: "Golden Visa", desc: "AED 2M+ purchase qualifies for 10-year UAE Golden Visa. Filter chip auto-flags eligible launches." },
            { icon: "◆", title: "Branded Premium", desc: "Mercedes-Benz, Jacob & Co, Palace Hotels branded residences command 15-30% price premium." },
            { icon: "⚠️", title: "Oversupply Watch", desc: "JVC, Azizi Venice, Business Bay face supply pressure. Tier 1 communities (Hills, Creek, Oasis) more resilient." },
          ].map((insight, i) => (
            <div key={i} style={{ padding: "12px 14px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{insight.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 4 }}>{insight.title}</div>
              <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>{insight.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CROSS-LINKS */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { label: "Browse Master Catalog →", tab: "Projects" },
          { label: "Mortgage Calculator →", tab: "Mortgage" },
          { label: "Yields Forecast →", tab: "Yields" },
          { label: "Risk Assessment →", tab: "Risk" },
          { label: "Investment Score →", tab: "Investment Score" },
          { label: "Handover Tracking →", tab: "Handover" },
          { label: "DLD Volumes →", tab: "DLD Volumes" },
          { label: "Golden Visa →", tab: "Golden Visa" },
        ].map((n, i) => (
          <button key={i} type="button" onClick={() => handleTabChange && handleTabChange(n.tab)}
            style={{ padding: "6px 14px", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            {n.label}
          </button>
        ))}
      </div>

      {/* SOURCES FOOTER */}
      <div style={{ paddingTop: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
        {[
          "Property Finder",
          "prelaunch.ae 2026",
          "AIQYA Q1 2026 report",
          "Springfield Properties",
          "Zawya / Reuters",
          "DLD Open Data",
          "BSA Law",
          "Moody's Mar 2026",
          "Developer IR Reports",
          "Capstone UAE",
        ].map((s, i) => (
          <span key={i} style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{s}</span>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
         PROJECT DETAIL MODAL
         ═══════════════════════════════════════════════════════════ */}
      {detailModalProject && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.85)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          overflowY: "auto",
        }}
          onClick={() => setDetailModalProject(null)}>
          <div style={{
            background: T.surface,
            border: `1px solid ${T.gold}`,
            borderRadius: 16,
            maxWidth: 1100,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: 28,
            boxShadow: `0 0 60px ${T.gold}33`,
          }}
            onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, paddingBottom: 18, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: T.gold, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>{detailModalProject.developer} · {detailModalProject.community}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 800, color: T.white, marginTop: 4 }}>{detailModalProject.project}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: `${statusColor(detailModalProject.status)}22`, color: statusColor(detailModalProject.status), fontWeight: 700 }}>● {detailModalProject.status}</span>
                  {detailModalProject.tier === 1 && <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: "#10B981", fontWeight: 700 }}>Tier 1</span>}
                  {detailModalProject.goldenVisa && <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "rgba(212,168,67,0.15)", color: T.gold, fontWeight: 700 }}>★ Golden Visa</span>}
                  {detailModalProject.branded && <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "rgba(139,92,246,0.15)", color: "#A78BFA", fontWeight: 700 }}>◆ {detailModalProject.brandPartner}</span>}
                  {(() => { const b = intelligenceBadge(detailModalProject); return <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: `${b.color}22`, color: b.color, fontWeight: 800 }}>{b.label}</span>; })()}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `3px solid ${scoreColor(detailModalProject.investmentScore)}`, background: `${scoreColor(detailModalProject.investmentScore)}22` }}>
                  <span style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 900, color: scoreColor(detailModalProject.investmentScore), lineHeight: 1 }}>{detailModalProject.investmentScore}</span>
                </div>
                <button type="button" onClick={() => setDetailModalProject(null)}
                  style={{ width: 36, height: 36, background: "rgba(239,68,68,0.1)", border: `1px solid #EF4444`, borderRadius: 8, color: "#EF4444", fontSize: 18, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                  ×
                </button>
              </div>
            </div>

            {/* Insight */}
            <div style={{ marginBottom: 18, padding: 14, background: T.surfaceAlt, borderRadius: 10, fontSize: 13, color: T.textPrimary, lineHeight: 1.6 }}>
              {detailModalProject.insight}
            </div>

            {/* Pricing & Yield */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
              <div style={{ padding: 14, background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.gold}33` }}>
                <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase" }}>Starting Price</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: T.gold }}>AED {(detailModalProject.startingPrice / 1000000).toFixed(2)}M</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{detailModalProject.pricePerSqft} AED/sqft</div>
              </div>
              <div style={{ padding: 14, background: T.surfaceAlt, borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase" }}>Gross Yield</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: "#10B981" }}>{detailModalProject.grossYield}%</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Net: {detailModalProject.netYield}%</div>
              </div>
              <div style={{ padding: 14, background: T.surfaceAlt, borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase" }}>Pre→Handover</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: T.gold }}>+{detailModalProject.appreciationToHandover}%</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Capital appreciation</div>
              </div>
              <div style={{ padding: 14, background: T.surfaceAlt, borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase" }}>Velocity Score</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: detailModalProject.velocityScore >= 80 ? "#10B981" : T.gold }}>{detailModalProject.velocityScore}/100</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Sales momentum</div>
              </div>
            </div>

            {/* Bed Breakdown */}
            {detailModalProject.unitBreakdown && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Unit Inventory</div>
                <div style={{ overflowX: "auto", background: T.surfaceAlt, borderRadius: 10, padding: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                        <th style={{ padding: "8px 12px", textAlign: "left", color: T.textMuted, fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Type</th>
                        <th style={{ padding: "8px 12px", textAlign: "right", color: T.textMuted, fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Size (sqft)</th>
                        {detailModalProject.unitBreakdown.some(u => u.plotMin) && <th style={{ padding: "8px 12px", textAlign: "right", color: T.textMuted, fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Plot</th>}
                        <th style={{ padding: "8px 12px", textAlign: "right", color: T.textMuted, fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Price (AED M)</th>
                        <th style={{ padding: "8px 12px", textAlign: "right", color: T.textMuted, fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>PPSF</th>
                        <th style={{ padding: "8px 12px", textAlign: "right", color: T.textMuted, fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Yield</th>
                        <th style={{ padding: "8px 12px", textAlign: "right", color: T.textMuted, fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailModalProject.unitBreakdown.map((u, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: "10px 12px", color: T.white, fontWeight: 700 }}>{u.type}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: T.textPrimary }}>{u.sizeMin}-{u.sizeMax}</td>
                          {detailModalProject.unitBreakdown.some(x => x.plotMin) && <td style={{ padding: "10px 12px", textAlign: "right", color: T.textPrimary }}>{u.plotMin ? `${u.plotMin}-${u.plotMax}` : "—"}</td>}
                          <td style={{ padding: "10px 12px", textAlign: "right", color: T.gold, fontWeight: 700 }}>{(u.priceMin / 1000000).toFixed(2)}-{(u.priceMax / 1000000).toFixed(2)}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: T.textPrimary }}>{u.ppsf}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "#10B981", fontWeight: 700 }}>{u.grossYield}%</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: u.available > 0 ? T.white : "#EF4444", fontWeight: 700 }}>{u.available}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Distances Grid */}
            {detailModalProject.distances && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Location & Connectivity</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                  {[
                    { icon: "🚇", label: "Metro", val: detailModalProject.distances.metro },
                    { icon: "🏖️", label: "Beach", val: detailModalProject.distances.beach },
                    { icon: "🏫", label: "School", val: detailModalProject.distances.school },
                    { icon: "🏥", label: "Hospital", val: detailModalProject.distances.hospital },
                    { icon: "🛍️", label: "Mall", val: detailModalProject.distances.mall },
                    { icon: "✈️", label: "Airport", val: detailModalProject.distances.airport },
                    { icon: "🏢", label: "DIFC", val: detailModalProject.distances.difc },
                  ].map((d, i) => (
                    <div key={i} style={{ padding: 10, background: T.surfaceAlt, borderRadius: 8 }}>
                      <div style={{ fontSize: 16, marginBottom: 4 }}>{d.icon}</div>
                      <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>{d.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{d.val} km</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {detailModalProject.amenities && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Amenities</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {detailModalProject.amenities.map((a, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "5px 12px", borderRadius: 16, background: T.surfaceAlt, color: T.textPrimary, border: `1px solid ${T.border}` }}>{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Views */}
            {detailModalProject.views && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Views Available</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {detailModalProject.views.map((v, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "5px 12px", borderRadius: 16, background: "rgba(212,168,67,0.08)", color: T.gold, border: `1px solid ${T.gold}33`, fontWeight: 600 }}>{v}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Plan Visual */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Payment Plan ({detailModalProject.paymentPlan.label})</div>
              <div style={{ display: "flex", height: 40, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
                <div style={{ width: `${detailModalProject.paymentPlan.dp}%`, background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", color: T.white, fontSize: 11, fontWeight: 700 }}>
                  {detailModalProject.paymentPlan.dp}% DP
                </div>
                <div style={{ width: `${detailModalProject.paymentPlan.construction}%`, background: T.gold, display: "flex", alignItems: "center", justifyContent: "center", color: T.dark, fontSize: 11, fontWeight: 700 }}>
                  {detailModalProject.paymentPlan.construction}% During
                </div>
                <div style={{ width: `${detailModalProject.paymentPlan.handover}%`, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", color: T.white, fontSize: 11, fontWeight: 700 }}>
                  {detailModalProject.paymentPlan.handover}% Handover
                </div>
              </div>
              {detailModalProject.paymentPlan.postHandover > 0 && (
                <div style={{ marginTop: 6, fontSize: 11, color: T.textMuted }}>+ {detailModalProject.paymentPlan.postHandover} months post-handover plan available</div>
              )}
            </div>

            {/* Legal & Financial */}
            <div style={{ marginBottom: 18, padding: 14, background: T.surfaceAlt, borderRadius: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>RERA Number</div>
                <div style={{ fontSize: 12, color: T.white, fontWeight: 700, marginTop: 2 }}>{detailModalProject.reraNo}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Escrow Bank</div>
                <div style={{ fontSize: 12, color: T.white, fontWeight: 700, marginTop: 2 }}>{detailModalProject.escrowBank}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>EOI Amount</div>
                <div style={{ fontSize: 12, color: T.white, fontWeight: 700, marginTop: 2 }}>AED {(detailModalProject.eoiAmount / 1000).toFixed(0)}K {detailModalProject.eoiRefundable ? "(refundable)" : "(non-refund)"}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Service Charge</div>
                <div style={{ fontSize: 12, color: T.white, fontWeight: 700, marginTop: 2 }}>AED {detailModalProject.serviceCharge}/sqft/year</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Commission</div>
                <div style={{ fontSize: 12, color: "#10B981", fontWeight: 700, marginTop: 2 }}>{detailModalProject.commission}%</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Handover</div>
                <div style={{ fontSize: 12, color: T.white, fontWeight: 700, marginTop: 2 }}>{detailModalProject.handover}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 18, borderTop: `1px solid ${T.border}`, flexWrap: "wrap" }}>
              <button type="button" onClick={() => { handleTabChange && handleTabChange("Mortgage"); setDetailModalProject(null); }}
                style={{ padding: "10px 18px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: T.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                Run Mortgage →
              </button>
              <button type="button" onClick={() => { handleTabChange && handleTabChange("Yields"); setDetailModalProject(null); }}
                style={{ padding: "10px 18px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: T.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                Yields Forecast →
              </button>
              <button type="button" onClick={() => { handleTabChange && handleTabChange("Projects"); setDetailModalProject(null); }}
                style={{ padding: "10px 18px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: T.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                Browse Catalog →
              </button>
              <button type="button" onClick={() => { toggleCompare(detailModalProject.id); }}
                style={{ padding: "10px 18px", background: T.gold, border: `1px solid ${T.gold}`, borderRadius: 8, color: T.dark, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                {compareIds.includes(detailModalProject.id) ? "✓ In Compare" : "+ Add to Compare"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LaunchCalendarTab;
