import React, { useRef } from "react";
import { C, btnStyles } from "./tokens";

/**
 * Shared bulk operations toolbar
 * Appears when user has selected one or more items in a list
 * Provides: bulk archive, bulk publish, export CSV, import CSV
 */
export default function BulkToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkArchive,
  onBulkPublish,
  onBulkDraft,
  onExportCsv,
  onImportCsv,
  collectionName,
}) {
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      alert("Please select a .csv file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const rows = parseCsv(text);
      onImportCsv(rows);
    };
    reader.onerror = () => alert("Failed to read file");
    reader.readAsText(file);
    e.target.value = ""; // reset so same file can be re-selected
  }

  if (selectedCount === 0) {
    // Show toolbar with Import/Export only
    return (
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        marginBottom: 12,
        padding: "8px 14px",
        background: "transparent",
      }}>
        <button style={{ ...btnStyles("ghost"), padding: "6px 12px", fontSize: 11 }} onClick={() => onExportCsv && onExportCsv()}>
          ⇩ Export CSV
        </button>
        <button style={{ ...btnStyles("ghost"), padding: "6px 12px", fontSize: 11 }} onClick={() => fileInputRef.current?.click()}>
          ⇧ Import CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    );
  }

  // Selection mode - show bulk actions
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 14,
      marginBottom: 12,
      padding: "12px 18px",
      background: C.goldD,
      border: "1px solid " + C.gold + "40",
      borderRadius: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, color: C.gold, fontWeight: 600 }}>
          {selectedCount} of {totalCount} selected
        </span>
        <button style={{ ...btnStyles("ghost"), padding: "4px 10px", fontSize: 10 }} onClick={onSelectAll}>
          Select all {totalCount}
        </button>
        <button style={{ ...btnStyles("ghost"), padding: "4px 10px", fontSize: 10 }} onClick={onClearSelection}>
          Clear
        </button>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {onBulkPublish && (
          <button style={{ ...btnStyles("teal"), padding: "6px 12px", fontSize: 11 }} onClick={onBulkPublish}>
            ✓ Publish {selectedCount}
          </button>
        )}
        {onBulkDraft && (
          <button style={{ ...btnStyles("ghost"), padding: "6px 12px", fontSize: 11 }} onClick={onBulkDraft}>
            ◷ Move to Draft
          </button>
        )}
        {onBulkArchive && (
          <button style={{ ...btnStyles("red"), padding: "6px 12px", fontSize: 11 }} onClick={onBulkArchive}>
            ✕ Archive {selectedCount}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── CSV parser (simple, handles quotes and commas in values) ───────────────
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  const parseLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i+1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx] : "";
    });
    rows.push(row);
  }
  return rows;
}

// ─── CSV builder (escapes values with commas/quotes/newlines) ───────────────
export function toCsv(rows, columns) {
  if (!rows || rows.length === 0) return "";

  const escape = (val) => {
    if (val === null || val === undefined) return "";
    let s = String(val);
    // If it contains comma, quote, or newline — wrap in quotes and escape internal quotes
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      s = '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const header = columns.join(",");
  const body = rows.map(row =>
    columns.map(col => {
      let val = row[col];
      // Flatten nested objects like coordinates
      if (val && typeof val === "object" && !Array.isArray(val)) {
        if (val.lat != null && val.lng != null) {
          val = val.lat + "," + val.lng;
        } else {
          val = JSON.stringify(val);
        }
      }
      if (Array.isArray(val)) {
        val = val.join("; ");
      }
      return escape(val);
    }).join(",")
  ).join("\n");

  return header + "\n" + body;
}

export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}