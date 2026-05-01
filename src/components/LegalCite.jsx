// src/components/LegalCite.jsx
//
// Renders a legal citation by ID. Auto-switches when laws change
// (e.g., the UAE Civil Code transition on 2026-06-01).
//
// Usage:
//   <LegalCite id="civil-code-1985-art-295" />               -> short form
//   <LegalCite id="law-8-2007-escrow" variant="full" />      -> full citation
//   <LegalCite id="..." showSource />                         -> with "(source)" link
//   <LegalCite id="..." withTooltip />                        -> hover for summary

import React from 'react';
import { useLegalCitation } from '../hooks/useLegalCitation';

const TRANSITION_NOTICE_THRESHOLD_DAYS = 60; // warn if a citation expires within 60 days

function daysUntil(isoDate) {
  if (!isoDate) return Infinity;
  const target = new Date(isoDate + 'T00:00:00Z').getTime();
  const today = new Date().setUTCHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

export default function LegalCite({
  id,
  variant = 'short',           // 'short' | 'full' | 'inline'
  showSource = false,
  withTooltip = false,
  className = '',
}) {
  const { citation, loading, error } = useLegalCitation(id);

  if (loading) {
    return <span className={`legal-cite legal-cite--loading ${className}`}>…</span>;
  }

  if (error || !citation) {
    return (
      <span className={`legal-cite legal-cite--error ${className}`} title={error?.message || 'Citation not found'}>
        [legal ref unavailable: {id}]
      </span>
    );
  }

  const expiringSoon =
    citation.effectiveUntil &&
    daysUntil(citation.effectiveUntil) <= TRANSITION_NOTICE_THRESHOLD_DAYS &&
    daysUntil(citation.effectiveUntil) >= 0;

  const label =
    variant === 'full'
      ? citation.fullCitation
      : variant === 'inline'
      ? citation.shortName
      : citation.shortName;

  const tooltipText = withTooltip
    ? `${citation.fullCitation}${citation.summary ? '\n\n' + citation.summary : ''}${
        expiringSoon ? `\n\n⚠ Effective until ${citation.effectiveUntil}.` : ''
      }`
    : undefined;

  return (
    <span
      className={`legal-cite ${expiringSoon ? 'legal-cite--expiring' : ''} ${className}`}
      title={tooltipText}
      style={{
        textDecoration: expiringSoon ? 'underline dotted' : 'none',
        cursor: tooltipText || showSource ? 'help' : 'default',
      }}
    >
      {label}
      {showSource && citation.sourceUrl && (
        <>
          {' '}
          <a
            href={citation.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.85em' }}
          >
            (source)
          </a>
        </>
      )}
      {expiringSoon && variant === 'full' && (
        <em style={{ marginLeft: 6, color: '#b58800', fontSize: '0.85em' }}>
          (effective until {citation.effectiveUntil})
        </em>
      )}
    </span>
  );
}
