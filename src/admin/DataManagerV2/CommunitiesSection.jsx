import React, { useState, useEffect, useMemo } from "react";
import {
  collection, doc, setDoc, onSnapshot, serverTimestamp, addDoc, deleteField
} from "firebase/firestore";
import { db } from "../../firebase";
import { C, cardStyle, btnStyles, inputStyle } from "./tokens";
import BulkToolbar from "./BulkToolbar";
import Papa from "papaparse";

// ============================================================================
// CONSTANTS
// ============================================================================

// AREAS dropdown is now derived dynamically from community data via dynamicAreas useMemo
// Old hardcoded list kept here as fallback only if data is empty
const FALLBACK_AREAS = [
  "Bur Dubai", "Deira", "New Dubai", "Dubai South", "Dubailand",
  "Hatta", "Jebel Ali", "MBR City", "Trade Center", "Dubai Marina",
];

const TYPES = [
  "Master Community", "Waterfront", "Beachfront", "Golf", "Family Villas",
  "High-rise Towers", "Mid-rise Mixed", "Luxury Villas", "Affordable",
  "Commercial District", "Mixed-Use", "Ultra-Luxury",
];

const VISIBILITY = ["draft", "published", "archived"];

const DISPLAY_CATEGORIES = {
  "consumer-community": { label: "Consumer", color: C.green, icon: "ввЂ™ё" },
  "master-community":   { label: "Master",   color: C.purple, icon: "ввЂњвЂљ" },
  "sub-community":      { label: "Sub",      color: C.cyan,   icon: "ввЂњ€" },
  "cadastral-district": { label: "Cadastral", color: C.amber, icon: "ввЂ™№" },
  "duplicate-merge":    { label: "Duplicate", color: C.red,   icon: "вљ " },
};

// Filter category options (combined visibility + classification)
const CATEGORY_FILTERS = [
  { value: "all-active",        label: "All active" },
  { value: "consumer-community", label: "Consumer communities" },
  { value: "master-community",   label: "Master communities" },
  { value: "sub-community",      label: "Sub-communities" },
  { value: "cadastral-district", label: "Cadastral districts" },
  { value: "duplicate-merge",    label: "Duplicates pending merge" },
  { value: "draft",              label: "Drafts" },
  { value: "archived",           label: "Archived" },
];

// ============================================================================
// HELPERS
// ============================================================================

function slugify(str) {
  return String(str || "").toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function formatAed(n) {
  if (!n || isNaN(n)) return "-";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
}

// Compute data quality indicators for a community
function computeQuality(c) {
  return {
    coords: !!(c.coordinates?.lat && c.coordinates?.lng),
    arabic: !!(c.arabicName && c.arabicName.trim().length > 0),
    intel:  !!((c.description && c.description.trim().length > 20) ||
               (c.aliases && c.aliases.length > 0) ||
               c.tagline),
  };
}

// Status badge config вв‚¬вЂќ color + icon + text (accessibility)
function statusConfig(c) {
  if (c.displayCategory === "cadastral-district") {
    return { color: C.amber, bg: C.amberD, icon: "рџЏ›", label: "CADASTRAL" };
  }
  if (c.displayCategory === "duplicate-merge") {
    return { color: C.red, bg: C.redD, icon: "вљ ", label: "DUPLICATE" };
  }
  if (c.visibility === "archived") {
    return { color: C.m, bg: "rgba(71,85,105,0.15)", icon: "рџвЂњ¦", label: "ARCHIVED" };
  }
  if (c.visibility === "draft") {
    return { color: C.amber, bg: C.amberD, icon: "рџвЂњќ", label: "DRAFT" };
  }
  return { color: C.green, bg: C.greenD, icon: "вњвЂњ", label: "PUBLISHED" };
}

// Fuzzy similarity check for duplicate prevention
function fuzzyMatch(a, b) {
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  // Check edit distance for short strings
  if (Math.abs(na.length - nb.length) <= 2) {
    let diff = 0;
    const len = Math.max(na.length, nb.length);
    for (let i = 0; i < len; i++) if (na[i] !== nb[i]) diff++;
    if (diff <= 2) return true;
  }
  return false;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CommunitiesSection({ currentUserId, currentUserEmail }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fCategory, setFCategory] = useState("all-active");
  const [fArea, setFArea] = useState("All");
  const [showCadastral, setShowCadastral] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedParents, setExpandedParents] = useState(new Set());
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Subscribe to communities
  useEffect(() => {
    const u = onSnapshot(collection(db, "communities"), snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setItems(arr);
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });
    return () => u();
  }, []);

  function notify(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  // CATEGORY COUNTS вв‚¬вЂќ for header display
  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  const counts = useMemo(() => {
    const c = { consumer: 0, master: 0, sub: 0, cadastral: 0, duplicates: 0,
                drafts: 0, archived: 0, total: items.length };
    items.forEach(it => {
      if (it.displayCategory === "consumer-community") c.consumer++;
      else if (it.displayCategory === "master-community") c.master++;
      else if (it.displayCategory === "sub-community") c.sub++;
      else if (it.displayCategory === "cadastral-district") c.cadastral++;
      else if (it.displayCategory === "duplicate-merge") c.duplicates++;
      if (it.visibility === "draft") c.drafts++;
      if (it.visibility === "archived") c.archived++;
    });
    return c;
  }, [items]);

  // Distinct area values derived from data (no more hardcoded list)
  const dynamicAreas = useMemo(() => {
    const set = new Set();
    items.forEach(c => {
      if (c.area && c.area.trim()) set.add(c.area.trim());
    });
    const arr = [...set].sort();
    return arr.length > 0 ? arr : FALLBACK_AREAS;
  }, [items]);

  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  // FILTERING вв‚¬вЂќ applies search, category filter, area, cadastral toggle
  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  const filtered = useMemo(() => {
    let r = [...items];

    // Search across name + arabicName + aliases
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(c => {
        if ((c.name || "").toLowerCase().includes(s)) return true;
        if ((c.arabicName || "").toLowerCase().includes(s)) return true;
        if ((c.area || "").toLowerCase().includes(s)) return true;
        if (Array.isArray(c.aliases)) {
          for (const alias of c.aliases) {
            if (String(alias).toLowerCase().includes(s)) return true;
          }
        }
        return false;
      });
    }

    // Category filter
    if (fCategory === "all-active") {
      r = r.filter(c => {
        // Hide cadastral unless toggle on
        if (c.displayCategory === "cadastral-district" && !showCadastral) return false;
        // Hide duplicates from default view
        if (c.displayCategory === "duplicate-merge") return false;
        // Hide archived from default
        if (c.visibility === "archived") return false;
        return true;
      });
    } else if (fCategory === "draft") {
      r = r.filter(c => c.visibility === "draft");
    } else if (fCategory === "archived") {
      r = r.filter(c => c.visibility === "archived");
    } else {
      // Specific displayCategory filter
      r = r.filter(c => c.displayCategory === fCategory);
    }

    // Area filter
    if (fArea !== "All") r = r.filter(c => c.area === fArea);

    // Sort
    if (sortBy === "name") r.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sortBy === "ppsf") r.sort((a, b) => (b.avgPpsf || 0) - (a.avgPpsf || 0));
    else if (sortBy === "yield") r.sort((a, b) => (b.grossYieldPct || 0) - (a.grossYieldPct || 0));
    else if (sortBy === "projects") r.sort((a, b) => (b.totalProjects || 0) - (a.totalProjects || 0));
    else if (sortBy === "quality") {
      r.sort((a, b) => {
        const qa = computeQuality(a), qb = computeQuality(b);
        const sa = (qa.coords ? 1 : 0) + (qa.arabic ? 1 : 0) + (qa.intel ? 1 : 0);
        const sb = (qb.coords ? 1 : 0) + (qb.arabic ? 1 : 0) + (qb.intel ? 1 : 0);
        return sb - sa;
      });
    }

    return r;
  }, [items, search, fCategory, fArea, showCadastral, sortBy]);

  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  // HIERARCHY вв‚¬вЂќ group sub-communities under their parents
  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  const hierarchical = useMemo(() => {
    const filteredIds = new Set(filtered.map(c => c.id));
    const childrenByParent = {};
    items.forEach(c => {
      if (c.displayCategory === "sub-community" && c.parentCommunity) {
        if (!childrenByParent[c.parentCommunity]) childrenByParent[c.parentCommunity] = [];
        childrenByParent[c.parentCommunity].push(c);
      }
    });

    // If searching, flatten вв‚¬вЂќ show all matching items at top level
    if (search) {
      return { topLevel: filtered, children: childrenByParent, flatten: true };
    }

    // Otherwise, hide sub-communities from top level (they appear under parents)
    const topLevel = filtered.filter(c => c.displayCategory !== "sub-community");
    return { topLevel, children: childrenByParent, flatten: false };
  }, [filtered, items, search]);

  // Auto-expand parents when filter matches their children
  useEffect(() => {
    if (search) {
      const newExpanded = new Set(expandedParents);
      filtered.forEach(c => {
        if (c.parentCommunity) newExpanded.add(c.parentCommunity);
      });
      setExpandedParents(newExpanded);
    }
  }, [search, filtered]);

  function toggleExpand(parentId) {
    setExpandedParents(p => {
      const n = new Set(p);
      if (n.has(parentId)) n.delete(parentId);
      else n.add(parentId);
      return n;
    });
  }

  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  // SAVE / ARCHIVE
  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  async function save(form) {
    setSaving(true);
    try {
      if (!form.name || form.name.trim().length < 2) {
        notify("Name is required", "error");
        setSaving(false);
        return;
      }

      const isNew = !editing.id;
      const id = editing.id || slugify(form.name);

      // Fuzzy duplicate check on create
      if (isNew) {
        const similar = items.find(c => fuzzyMatch(c.name, form.name) || c.id === id);
        if (similar) {
          if (!window.confirm(
            "A community with a similar name already exists:\n\n" +
            "  \"" + similar.name + "\" (id: " + similar.id + ")\n\n" +
            "Continue creating new one anyway?"
          )) {
            setSaving(false);
            return;
          }
        }
      }

      const payload = {
        ...form,
        slug: id,
        orgId: form.orgId || "dxb-analytics",
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId || "unknown",
      };
      if (isNew) {
        payload.createdAt = serverTimestamp();
        payload.createdBy = currentUserId || "unknown";
        payload.displayCategory = form.displayCategory || "consumer-community";
      }
      if (form.visibility === "published" && !editing.disclosedAt) {
        payload.disclosedAt = serverTimestamp();
      }

      await setDoc(doc(db, "communities", id), payload, { merge: true });
      await addDoc(collection(db, "communities", id, "auditLog"), {
        action: isNew ? "create" : "update",
        userId: currentUserId || "unknown",
        userEmail: currentUserEmail || "unknown",
        timestamp: serverTimestamp(),
        fieldsChanged: Object.keys(form),
      });

      notify(isNew ? "Community created" : "Community updated");
      setEditing(null);
    } catch (e) {
      console.error(e);
      notify("Save failed: " + e.message, "error");
    }
    setSaving(false);
  }

  async function archive(item) {
    setConfirmDialog({
      title: "Archive community?",
      message: "Archive \"" + item.name + "\"? It will be hidden from users.",
      confirmLabel: "Archive",
      confirmStyle: "red",
      onConfirm: async () => {
        try {
          await setDoc(doc(db, "communities", item.id), {
            visibility: "archived",
            updatedAt: serverTimestamp(),
            updatedBy: currentUserId || "unknown",
          }, { merge: true });
          await addDoc(collection(db, "communities", item.id, "auditLog"), {
            action: "archive",
            userId: currentUserId || "unknown",
            timestamp: serverTimestamp(),
          });
          notify("Community archived");
        } catch (e) {
          notify("Archive failed: " + e.message, "error");
        }
      }
    });
  }

  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  // SELECTION
  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  function toggleSelection(id) {
    setSelectedIds(p => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function selectAll() { setSelectedIds(new Set(filtered.map(c => c.id))); }
  function clearSelection() { setSelectedIds(new Set()); }

  // Mixed-state checkbox (header)
  const headerSelectionState = useMemo(() => {
    if (selectedIds.size === 0) return "none";
    if (selectedIds.size === filtered.length && filtered.length > 0) return "all";
    return "some";
  }, [selectedIds, filtered]);

  function handleHeaderCheckbox() {
    if (headerSelectionState === "all") clearSelection();
    else selectAll();
  }

  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  // BULK ACTIONS
  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  async function bulkArchive() {
    setConfirmDialog({
      title: "Archive " + selectedIds.size + " communities?",
      message: "These communities will be hidden from users. You can unarchive later.",
      confirmLabel: "Archive " + selectedIds.size,
      confirmStyle: "red",
      onConfirm: async () => {
        try {
          for (const id of selectedIds) {
            await setDoc(doc(db, "communities", id), {
              visibility: "archived",
              updatedAt: serverTimestamp(),
              updatedBy: currentUserId || "unknown"
            }, { merge: true });
            await addDoc(collection(db, "communities", id, "auditLog"), {
              action: "bulk-archive",
              userId: currentUserId || "unknown",
              timestamp: serverTimestamp()
            });
          }
          notify("Archived " + selectedIds.size + " communities");
          setSelectedIds(new Set());
        } catch (e) {
          notify("Bulk archive failed: " + e.message, "error");
        }
      }
    });
  }

  async function bulkChangeVisibility(newVis) {
    setConfirmDialog({
      title: "Change " + selectedIds.size + " communities to " + newVis + "?",
      message: newVis === "published"
        ? "These communities will become visible to all users."
        : "These communities will be hidden from users.",
      confirmLabel: "Change to " + newVis,
      confirmStyle: newVis === "published" ? "teal" : "ghost",
      onConfirm: async () => {
        try {
          for (const id of selectedIds) {
            const payload = {
              visibility: newVis,
              updatedAt: serverTimestamp(),
              updatedBy: currentUserId || "unknown"
            };
            if (newVis === "published") payload.disclosedAt = serverTimestamp();
            await setDoc(doc(db, "communities", id), payload, { merge: true });
            await addDoc(collection(db, "communities", id, "auditLog"), {
              action: "bulk-visibility-change",
              newVisibility: newVis,
              userId: currentUserId || "unknown",
              timestamp: serverTimestamp()
            });
          }
          notify("Changed " + selectedIds.size + " communities to " + newVis);
          setSelectedIds(new Set());
        } catch (e) {
          notify("Bulk change failed: " + e.message, "error");
        }
      }
    });
  }

  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  // CSV EXPORT/IMPORT
  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  function exportCsv() {
    const rows = filtered.map(c => ({
      id: c.id,
      name: c.name || "",
      arabicName: c.arabicName || "",
      displayCategory: c.displayCategory || "",
      parentCommunity: c.parentCommunity || "",
      area: c.area || "",
      type: c.type || "",
      visibility: c.visibility || "",
      latitude: c.coordinates?.lat || "",
      longitude: c.coordinates?.lng || "",
      aliases: Array.isArray(c.aliases) ? c.aliases.join("; ") : "",
      totalProjects: c.totalProjects || 0,
      developersActive: c.developersActive || 0,
      avgPpsf: c.avgPpsf || 0,
      avgRentPerSqftYr: c.avgRentPerSqftYr || 0,
      grossYieldPct: c.grossYieldPct || 0,
      netYieldPct: c.netYieldPct || 0,
      metroDistanceKm: c.metroDistanceKm || 0,
      nearestMetroStation: c.nearestMetroStation || "",
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "communities-" + new Date().toISOString().slice(0,10) + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    notify("Exported " + rows.length + " communities");
  }

  function importCsv(file) {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (!rows.length) { notify("CSV is empty", "error"); return; }
        if (!window.confirm("Import " + rows.length + " communities?")) return;
        let created = 0, updated = 0, failed = 0;
        for (const r of rows) {
          try {
            const id = r.id || (r.name || "").toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
            const payload = {
              name: r.name || "",
              arabicName: r.arabicName || "",
              displayCategory: r.displayCategory || "consumer-community",
              parentCommunity: r.parentCommunity || "",
              area: r.area || "",
              type: r.type || "Master Community",
              visibility: r.visibility || "draft",
              coordinates: { lat: parseFloat(r.latitude) || null, lng: parseFloat(r.longitude) || null },
              aliases: r.aliases ? r.aliases.split(";").map(a => a.trim()).filter(Boolean) : [],
              totalProjects: parseInt(r.totalProjects) || 0,
              developersActive: parseInt(r.developersActive) || 0,
              avgPpsf: parseFloat(r.avgPpsf) || 0,
              avgRentPerSqftYr: parseFloat(r.avgRentPerSqftYr) || 0,
              grossYieldPct: parseFloat(r.grossYieldPct) || 0,
              netYieldPct: parseFloat(r.netYieldPct) || 0,
              metroDistanceKm: parseFloat(r.metroDistanceKm) || 0,
              nearestMetroStation: r.nearestMetroStation || "",
              orgId: "dxb-analytics",
              updatedAt: serverTimestamp(),
              updatedBy: currentUserId || "unknown",
            };
            const isNew = !r.id;
            if (isNew) {
              payload.createdAt = serverTimestamp();
              payload.createdBy = currentUserId || "unknown";
            }
            await setDoc(doc(db, "communities", id), payload, { merge: true });
            await addDoc(collection(db, "communities", id, "auditLog"), {
              action: isNew ? "csv-import-create" : "csv-import-update",
              userId: currentUserId || "unknown",
              timestamp: serverTimestamp(),
              source: "csv-import"
            });
            if (isNew) created++; else updated++;
          } catch (e) { failed++; console.error(r, e); }
        }
        notify("Import: " + created + " created, " + updated + " updated" + (failed ? ", " + failed + " failed" : ""));
      },
      error: (e) => notify("CSV parse error: " + e.message, "error"),
    });
  }

  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  // RENDER
  // ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
  if (loading) {
    return <div style={{ padding: 40, color: C.t2 }}>Loading communities...</div>;
  }

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: C.w, fontFamily: C.ffH, fontWeight: 600 }}>
            Communities
          </h2>
          <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>
            <span style={{ color: C.green }}>{counts.consumer} Consumer</span>
            <span style={{ margin: "0 6px", color: C.m }}>В·</span>
            <span style={{ color: C.purple }}>{counts.master} Master</span>
            <span style={{ margin: "0 6px", color: C.m }}>В·</span>
            <span style={{ color: C.cyan }}>{counts.sub} Sub</span>
            <span style={{ margin: "0 6px", color: C.m }}>В·</span>
            <span style={{ color: C.amber }}>{counts.cadastral} Cadastral</span>
            <span style={{ margin: "0 6px", color: C.m }}>В·</span>
            <span style={{ color: C.red }}>{counts.duplicates} Duplicates</span>
          </div>
        </div>
        <button style={btnStyles("primary")} onClick={() => setEditing({})}>+ Add New Community</button>
      </div>

      {/* FILTER BAR */}
      <div style={{ ...cardStyle, marginBottom: 16, padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <input
            type="text"
            placeholder="Search by name, alias, or area..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={inputStyle}
          />
          <select value={fCategory} onChange={e => setFCategory(e.target.value)} style={inputStyle}>
            {CATEGORY_FILTERS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select value={fArea} onChange={e => setFArea(e.target.value)} style={inputStyle}>
            <option value="All">All Areas</option>
            {dynamicAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={inputStyle}>
            <option value="name">Sort: Name</option>
            <option value="projects">Sort: Projects</option>
            <option value="ppsf">Sort: Price/sqft</option>
            <option value="yield">Sort: Yield</option>
            <option value="quality">Sort: Data quality</option>
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.t2, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showCadastral}
            onChange={e => setShowCadastral(e.target.checked)}
            style={{ accentColor: C.gold }}
          />
          Show cadastral districts
          {!showCadastral && <span style={{ color: C.amber, fontSize: 10 }}>({counts.cadastral} hidden)</span>}
        </label>
      </div>

      {/* BULK TOOLBAR */}
      <BulkToolbar
        selectedCount={selectedIds.size}
        totalCount={filtered.length}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onBulkArchive={bulkArchive}
        onBulkPublish={() => bulkChangeVisibility("published")}
        onBulkDraft={() => bulkChangeVisibility("draft")}
        onExportCsv={exportCsv}
        onImportCsv={importCsv}
        collectionName="communities"
      />

      {/* DUPLICATES SPECIAL VIEW */}
      {fCategory === "duplicate-merge" && (
        <DuplicatesView
          duplicates={items.filter(c => c.displayCategory === "duplicate-merge")}
          allItems={items}
        />
      )}

      {/* HEADER ROW (for table-like layout) */}
      {fCategory !== "duplicate-merge" && filtered.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "8px 14px", marginBottom: 6,
          fontSize: 10, color: C.t2, fontWeight: 600,
          textTransform: "uppercase", letterSpacing: 0.5,
        }}>
          <input
            type="checkbox"
            checked={headerSelectionState === "all"}
            ref={el => { if (el) el.indeterminate = headerSelectionState === "some"; }}
            onChange={handleHeaderCheckbox}
            style={{ width: 16, height: 16, accentColor: C.gold, cursor: "pointer" }}
          />
          <span style={{ flex: 1 }}>Community {filtered.length} of {items.length}</span>
        </div>
      )}

      {/* LIST (tree view with expandable masters) */}
      {fCategory !== "duplicate-merge" && (
        <div style={{ display: "grid", gap: 8 }}>
          {hierarchical.topLevel.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", padding: 40, color: C.t2 }}>
              {items.length === 0
                ? "No communities yet. Click + Add New Community to create one."
                : "No results match your filters."}
              {items.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <button
                    style={{ ...btnStyles("ghost"), padding: "6px 12px", fontSize: 11 }}
                    onClick={() => { setSearch(""); setFCategory("all-active"); setFArea("All"); }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            hierarchical.topLevel.map(c => (
              <CommunityRow
                key={c.id}
                community={c}
                children={hierarchical.children[c.id] || []}
                isExpanded={expandedParents.has(c.id)}
                onToggleExpand={() => toggleExpand(c.id)}
                isSelected={selectedIds.has(c.id)}
                onToggleSelect={() => toggleSelection(c.id)}
                onEdit={() => setEditing(c)}
                onArchive={() => archive(c)}
                selectedIds={selectedIds}
                onChildSelect={toggleSelection}
                onChildEdit={(child) => setEditing(child)}
                onChildArchive={(child) => archive(child)}
                flatten={hierarchical.flatten}
                allItems={items}
              />
            ))
          )}
        </div>
      )}

      {/* EDIT MODAL */}
      {editing !== null && (
        <CommEditModal
          initial={editing}
          allItems={items}
          availableAreas={dynamicAreas}
          onClose={() => setEditing(null)}
          onSave={save}
          saving={saving}
        />
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onClose={() => setConfirmDialog(null)}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 20, right: 20,
          padding: "12px 20px",
          background: toast.type === "error" ? C.redD : C.greenD,
          border: "1px solid " + (toast.type === "error" ? C.red : C.green),
          borderRadius: 8,
          color: toast.type === "error" ? C.red : C.green,
          fontSize: 12, fontWeight: 600, zIndex: 10000
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMMUNITY ROW (with optional expandable children)
// ============================================================================

function CommunityRow({
  community: c, children, isExpanded, onToggleExpand,
  isSelected, onToggleSelect, onEdit, onArchive,
  selectedIds, onChildSelect, onChildEdit, onChildArchive,
  flatten, allItems,
}) {
  const status = statusConfig(c);
  const quality = computeQuality(c);
  const cat = DISPLAY_CATEGORIES[c.displayCategory] || DISPLAY_CATEGORIES["consumer-community"];
  const hasChildren = children && children.length > 0;
  const isCadastral = c.displayCategory === "cadastral-district";
  const isDuplicate = c.displayCategory === "duplicate-merge";
  const isSubCommunity = c.displayCategory === "sub-community";
  const parentName = isSubCommunity ?
    (allItems.find(i => i.id === c.parentCommunity)?.name || c.parentCommunity) : null;

  return (
    <>
      <div
        style={{
          ...cardStyle,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          borderLeft: "3px solid " + cat.color,
        }}
        onClick={onEdit}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onClick={e => e.stopPropagation()}
          onChange={onToggleSelect}
          style={{ cursor: "pointer", width: 16, height: 16, accentColor: C.gold }}
        />

        {/* Expand chevron (if has children and not flattened) */}
        {hasChildren && !flatten && (
          <button
            onClick={e => { e.stopPropagation(); onToggleExpand(); }}
            style={{
              background: "transparent",
              border: "none",
              color: C.t2,
              cursor: "pointer",
              padding: 0,
              fontSize: 12,
              width: 16,
            }}
          >
            {isExpanded ? "ввЂ“ј" : "ввЂ“¶"}
          </button>
        )}
        {!hasChildren && !flatten && <div style={{ width: 16 }} />}

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, color: C.w, fontWeight: 600 }}>
              {c.name || "(unnamed)"}
            </span>
            {c.arabicName && (
              <span style={{ fontSize: 11, color: C.t2, fontFamily: "Tahoma, Arial, sans-serif" }}>
                {c.arabicName}
              </span>
            )}

            {/* Category badge */}
            <span style={{
              fontSize: 9, padding: "2px 6px",
              background: cat.color + "20", color: cat.color,
              borderRadius: 4, fontWeight: 600,
            }}>
              {cat.label}
            </span>

            {/* Status badge */}
            <span style={{
              fontSize: 9, padding: "2px 8px",
              background: status.bg, color: status.color,
              borderRadius: 4, fontWeight: 600, letterSpacing: 0.5,
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              <span>{status.icon}</span>
              <span>{status.label}</span>
            </span>

            {/* Sub-children count badge */}
            {hasChildren && !flatten && (
              <span style={{
                fontSize: 9, padding: "2px 6px",
                background: C.cyanD, color: C.cyan,
                borderRadius: 4,
              }}>
                {children.length} sub
              </span>
            )}

            {/* Parent badge for sub-communities */}
            {isSubCommunity && parentName && (
              <span style={{
                fontSize: 9, padding: "2px 6px",
                background: C.purpleD, color: C.purple,
                borderRadius: 4,
              }}>
                в†і {parentName}
              </span>
            )}

            {/* Duplicate target badge */}
            {isDuplicate && c.mergedInto && (
              <span style={{
                fontSize: 9, padding: "2px 6px",
                background: C.redD, color: C.red,
                borderRadius: 4,
              }}>
                в†вЂ™ {c.mergedInto}
              </span>
            )}
          </div>

          <div style={{ fontSize: 11, color: C.t2, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {c.area && <span>{c.area}</span>}
            <span>В· {c.totalProjects || 0} projects</span>
            {c.avgPpsf > 0 && <span>В· AED {formatAed(c.avgPpsf)}/sqft</span>}
            {c.grossYieldPct > 0 && <span>В· {c.grossYieldPct}% yield</span>}

            {/* Data quality dots */}
            <span style={{ display: "inline-flex", gap: 4, marginLeft: "auto" }}>
              <QualityDot label="coords" ok={quality.coords} />
              <QualityDot label="ar" ok={quality.arabic} />
              <QualityDot label="intel" ok={quality.intel} />
            </span>
          </div>
        </div>

        {/* Action buttons (always visible вв‚¬вЂќ research showed hover-only is unreliable on mobile) */}
        <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
          <button style={{ ...btnStyles("ghost"), padding: "6px 12px" }} onClick={onEdit}>Edit</button>
          {!isCadastral && c.visibility !== "archived" && (
            <button style={{ ...btnStyles("red"), padding: "6px 12px" }} onClick={onArchive}>Archive</button>
          )}
        </div>
      </div>

      {/* Render children if expanded */}
      {hasChildren && !flatten && isExpanded && (
        <div style={{ marginLeft: 32, display: "grid", gap: 8 }}>
          {children.map(child => (
            <CommunityRow
              key={child.id}
              community={child}
              children={[]}
              isExpanded={false}
              onToggleExpand={() => {}}
              isSelected={selectedIds.has(child.id)}
              onToggleSelect={() => onChildSelect(child.id)}
              onEdit={() => onChildEdit(child)}
              onArchive={() => onChildArchive(child)}
              selectedIds={selectedIds}
              onChildSelect={onChildSelect}
              onChildEdit={onChildEdit}
              onChildArchive={onChildArchive}
              flatten={false}
              allItems={allItems}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ============================================================================
// QUALITY DOT
// ============================================================================

function QualityDot({ label, ok }) {
  return (
    <span style={{
      fontSize: 9,
      color: ok ? C.green : C.m,
      display: "inline-flex", alignItems: "center", gap: 2,
    }} title={label + ": " + (ok ? "complete" : "missing")}>
      <span style={{
        display: "inline-block", width: 6, height: 6, borderRadius: "50%",
        background: ok ? C.green : C.m,
      }} />
      {label}
    </span>
  );
}

// ============================================================================
// DUPLICATES VIEW
// ============================================================================

function DuplicatesView({ duplicates, allItems }) {
  if (duplicates.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: "center", padding: 40, color: C.t2 }}>
        No duplicates pending merge. вњвЂњ
      </div>
    );
  }

  return (
    <div>
      <div style={{
        ...cardStyle, padding: 14, marginBottom: 12,
        background: C.amberD, border: "1px solid " + C.amber + "40"
      }}>
        <div style={{ fontSize: 13, color: C.amber, fontWeight: 600, marginBottom: 4 }}>
          вљ  {duplicates.length} duplicates pending merge
        </div>
        <div style={{ fontSize: 11, color: C.t2 }}>
          These were identified during the taxonomy migration. Each duplicate doc points to its canonical version via the <code style={{ color: C.gold }}>mergedInto</code> field.
          Session 4 will execute the merges. For now, you can review them here.
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {duplicates.map(dup => {
          const canonical = allItems.find(i => i.id === dup.mergedInto);
          return (
            <div key={dup.id} style={{
              ...cardStyle, padding: 14,
              display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 14, alignItems: "center"
            }}>
              {/* Duplicate (will be removed) */}
              <div style={{ opacity: 0.6 }}>
                <div style={{ fontSize: 10, color: C.red, fontWeight: 600, marginBottom: 2 }}>
                  DUPLICATE (will be removed)
                </div>
                <div style={{ fontSize: 13, color: C.w, fontWeight: 600 }}>{dup.name}</div>
                <div style={{ fontSize: 10, color: C.t2 }}>id: {dup.id}</div>
                <div style={{ fontSize: 10, color: C.t2 }}>
                  {dup.totalProjects || 0} projects В· {dup.area || "no area"}
                </div>
              </div>

              {/* Arrow */}
              <div style={{ fontSize: 20, color: C.gold }}>в†вЂ™</div>

              {/* Canonical (will be kept) */}
              <div>
                <div style={{ fontSize: 10, color: C.green, fontWeight: 600, marginBottom: 2 }}>
                  CANONICAL (will be kept)
                </div>
                <div style={{ fontSize: 13, color: C.w, fontWeight: 600 }}>
                  {canonical?.name || dup.mergedInto}
                </div>
                <div style={{ fontSize: 10, color: C.t2 }}>id: {dup.mergedInto}</div>
                <div style={{ fontSize: 10, color: C.t2 }}>
                  {canonical ? (canonical.totalProjects || 0) + " projects" : "(canonical not found in DB)"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, padding: 12, background: C.s2, borderRadius: 8, fontSize: 11, color: C.t2 }}>
        <strong style={{ color: C.gold }}>Note:</strong> Bulk merge will be performed in Session 4 via a backend script.
        This view is read-only for safety. The merge will preserve all unique fields and update any references in projects/transactions.
      </div>
    </div>
  );
}

// ============================================================================
// CONFIRM DIALOG
// ============================================================================

function ConfirmDialog({ title, message, confirmLabel, confirmStyle, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } catch (e) { console.error(e); }
    setBusy(false);
    onClose();
  }
  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10001, padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.s1, border: "1px solid " + C.borderG,
          borderRadius: 12, padding: 24, maxWidth: 480, width: "100%"
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 12px 0", fontSize: 15, color: C.w, fontFamily: C.ffH }}>
          {title}
        </h3>
        <p style={{ margin: "0 0 20px 0", fontSize: 12, color: C.t2, lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button style={btnStyles("ghost", busy)} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button style={btnStyles(confirmStyle || "red", busy)} onClick={handleConfirm} disabled={busy}>
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EDIT MODAL
// ============================================================================

function CommEditModal({ initial, allItems, availableAreas, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    name: "", arabicName: "",
    displayCategory: "consumer-community",
    parentCommunity: "",
    aliases: [],
    cadastralCode: "",
    area: "", type: "Master Community",
    visibility: "draft",
    description: "",
    coordinates: { lat: "", lng: "" },
    totalProjects: 0, developersActive: 0,
    avgPpsf: 0, avgRentPerSqftYr: 0,
    grossYieldPct: 0, netYieldPct: 0,
    metroDistanceKm: 0, nearestMetroStation: "",
    beachAccess: false, golfAccess: false, parkAccess: false,
    schoolRating: 0, restaurantCount: 0,
    populationEstimate: 0,
    coverImageUrl: "",
    ...initial,
    aliases: Array.isArray(initial.aliases) ? initial.aliases : [],
  });
  const [aliasInput, setAliasInput] = useState("");

  function update(field, value) { setForm(f => ({ ...f, [field]: value })); }
  function updateCoord(key, value) { setForm(f => ({ ...f, coordinates: { ...f.coordinates, [key]: value } })); }
  function addAlias() {
    const v = aliasInput.trim();
    if (!v) return;
    if (form.aliases.includes(v)) { setAliasInput(""); return; }
    update("aliases", [...form.aliases, v]);
    setAliasInput("");
  }
  function removeAlias(a) {
    update("aliases", form.aliases.filter(x => x !== a));
  }

  // Master communities for parent dropdown
  const masterOptions = useMemo(() =>
    allItems
      .filter(i => i.displayCategory === "master-community" || i.displayCategory === "consumer-community")
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
  , [allItems]);

  // Cadastral districts for cadastralCode dropdown
  const cadastralOptions = useMemo(() =>
    allItems
      .filter(i => i.displayCategory === "cadastral-district")
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
  , [allItems]);

  const isSubCommunity = form.displayCategory === "sub-community";
  const isCadastral = form.displayCategory === "cadastral-district";

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.s1, border: "1px solid " + C.borderG,
          borderRadius: 12, padding: 28,
          maxWidth: 880, width: "100%", maxHeight: "92vh", overflow: "auto"
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 20px 0", fontSize: 16, color: C.gold, fontFamily: C.ffH }}>
          {initial.id ? "Edit Community" : "New Community"}
        </h3>

        <div style={{ display: "grid", gap: 14 }}>

          {/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ BASICS ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
            <div>
              <label style={lblStyle}>Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => update("name", e.target.value)} />
            </div>
            <div>
              <label style={lblStyle}>Arabic Name</label>
              <input style={inputStyle} value={form.arabicName} onChange={e => update("arabicName", e.target.value)} />
            </div>
          </div>

          {/* Aliases */}
          <div>
            <label style={lblStyle}>Aliases (alternative names searchable)</label>
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              {form.aliases.map(a => (
                <span key={a} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", background: C.tealD, color: C.teal,
                  borderRadius: 4, fontSize: 11
                }}>
                  {a}
                  <button onClick={() => removeAlias(a)} style={{
                    background: "transparent", border: "none", color: C.teal,
                    cursor: "pointer", padding: 0, fontSize: 12, lineHeight: 1
                  }}>ГвЂ”</button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                style={inputStyle}
                value={aliasInput}
                onChange={e => setAliasInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAlias(); } }}
                placeholder="Type alias and press Enter (e.g. JLT, TECOM, JBR)"
              />
              <button style={{ ...btnStyles("ghost"), padding: "8px 14px" }} onClick={addAlias}>Add</button>
            </div>
          </div>

          {/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ CLASSIFICATION (NEW) ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */}
          <div style={{ padding: 14, background: C.s2, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Classification
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={lblStyle}>Category *</label>
                <select
                  style={inputStyle}
                  value={form.displayCategory}
                  onChange={e => update("displayCategory", e.target.value)}
                >
                  <option value="consumer-community">Consumer community (user-searchable)</option>
                  <option value="master-community">Master community (district)</option>
                  <option value="sub-community">Sub-community (under a master)</option>
                  <option value="cadastral-district">Cadastral district (DLD admin code)</option>
                </select>
              </div>
              {isSubCommunity && (
                <div>
                  <label style={lblStyle}>Parent Community *</label>
                  <select
                    style={inputStyle}
                    value={form.parentCommunity}
                    onChange={e => update("parentCommunity", e.target.value)}
                  >
                    <option value="">-- Select parent --</option>
                    {masterOptions.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {!isSubCommunity && !isCadastral && (
                <div>
                  <label style={lblStyle}>Cadastral Code (DLD area)</label>
                  <select
                    style={inputStyle}
                    value={form.cadastralCode || ""}
                    onChange={e => update("cadastralCode", e.target.value)}
                  >
                    <option value="">-- None --</option>
                    {cadastralOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {isCadastral && (
              <div style={{ marginTop: 10, padding: 10, background: C.amberD, borderRadius: 6, fontSize: 11, color: C.amber }}>
                вљ  Cadastral districts are DLD admin codes (e.g. "Wadi Al Safa 7"). They are hidden from user-facing dashboards.
                Mark as cadastral only if this is purely an administrative DLD code.
              </div>
            )}
          </div>

          {/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ LOCATION ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={lblStyle}>Area</label>
              <select style={inputStyle} value={form.area} onChange={e => update("area", e.target.value)}>
                <option value="">-- Select area --</option>
                {(availableAreas || FALLBACK_AREAS).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={lblStyle}>Type</label>
              <select style={inputStyle} value={form.type} onChange={e => update("type", e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lblStyle}>Visibility</label>
              <select style={inputStyle} value={form.visibility} onChange={e => update("visibility", e.target.value)}>
                {VISIBILITY.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lblStyle}>Latitude</label>
              <input style={inputStyle} type="number" step="0.0001"
                value={form.coordinates?.lat || ""}
                onChange={e => updateCoord("lat", parseFloat(e.target.value) || "")} />
            </div>
            <div>
              <label style={lblStyle}>Longitude</label>
              <input style={inputStyle} type="number" step="0.0001"
                value={form.coordinates?.lng || ""}
                onChange={e => updateCoord("lng", parseFloat(e.target.value) || "")} />
            </div>
          </div>

          {/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ DESCRIPTION ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */}
          <div>
            <label style={lblStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
              value={form.description}
              onChange={e => update("description", e.target.value)}
            />
          </div>

          {/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ MARKET STATS ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */}
          <div style={{ padding: 14, background: C.s2, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Market Stats
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={lblStyle}>Avg Price/sqft AED</label>
                <input style={inputStyle} type="number" min="0" value={form.avgPpsf}
                  onChange={e => update("avgPpsf", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label style={lblStyle}>Rent/sqft/yr AED</label>
                <input style={inputStyle} type="number" min="0" value={form.avgRentPerSqftYr}
                  onChange={e => update("avgRentPerSqftYr", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label style={lblStyle}>Gross Yield %</label>
                <input style={inputStyle} type="number" step="0.1" min="0" max="30" value={form.grossYieldPct}
                  onChange={e => update("grossYieldPct", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label style={lblStyle}>Net Yield %</label>
                <input style={inputStyle} type="number" step="0.1" min="0" max="30" value={form.netYieldPct}
                  onChange={e => update("netYieldPct", parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>

          {/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ COUNTS ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={lblStyle}>Total Projects</label>
              <input style={inputStyle} type="number" min="0" value={form.totalProjects}
                onChange={e => update("totalProjects", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label style={lblStyle}>Active Developers</label>
              <input style={inputStyle} type="number" min="0" value={form.developersActive}
                onChange={e => update("developersActive", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label style={lblStyle}>Population Est</label>
              <input style={inputStyle} type="number" min="0" value={form.populationEstimate}
                onChange={e => update("populationEstimate", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label style={lblStyle}>Restaurants</label>
              <input style={inputStyle} type="number" min="0" value={form.restaurantCount}
                onChange={e => update("restaurantCount", parseInt(e.target.value) || 0)} />
            </div>
          </div>

          {/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ TRANSIT ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 10 }}>
            <div>
              <label style={lblStyle}>Metro Dist (km)</label>
              <input style={inputStyle} type="number" step="0.1" min="0" value={form.metroDistanceKm}
                onChange={e => update("metroDistanceKm", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label style={lblStyle}>Nearest Metro Station</label>
              <input style={inputStyle} value={form.nearestMetroStation}
                onChange={e => update("nearestMetroStation", e.target.value)} />
            </div>
            <div>
              <label style={lblStyle}>School Rating 0-10</label>
              <input style={inputStyle} type="number" step="0.1" min="0" max="10" value={form.schoolRating}
                onChange={e => update("schoolRating", parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          {/* Amenities */}
          <div style={{ display: "flex", gap: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.t2 }}>
              <input type="checkbox" checked={!!form.beachAccess}
                onChange={e => update("beachAccess", e.target.checked)} /> Beach Access
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.t2 }}>
              <input type="checkbox" checked={!!form.golfAccess}
                onChange={e => update("golfAccess", e.target.checked)} /> Golf Access
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.t2 }}>
              <input type="checkbox" checked={!!form.parkAccess}
                onChange={e => update("parkAccess", e.target.checked)} /> Park Access
            </label>
          </div>

          <div>
            <label style={lblStyle}>Cover Image URL</label>
            <input style={inputStyle} value={form.coverImageUrl}
              onChange={e => update("coverImageUrl", e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div style={{
          display: "flex", gap: 10, justifyContent: "flex-end",
          marginTop: 24, paddingTop: 20, borderTop: "1px solid " + C.border
        }}>
          <button style={btnStyles("ghost", saving)} onClick={onClose} disabled={saving}>Cancel</button>
          <button style={btnStyles("primary", saving)} onClick={() => onSave(form)} disabled={saving}>
            {saving ? "Saving..." : initial.id ? "Save Changes" : "Create Community"}
          </button>
        </div>
      </div>
    </div>
  );
}

const lblStyle = {
  display: "block",
  fontSize: 10,
  color: C.t2,
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: 0.3,
};
