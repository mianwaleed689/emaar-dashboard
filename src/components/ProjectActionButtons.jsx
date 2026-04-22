/**
 * DXB ANALYTICS — ONE PROJECT FLOW
 * ==================================
 * File: src/components/ProjectActionButtons.jsx
 *
 * THE NUCLEUS COMPONENT
 * This renders on every project card.
 * Every button connects to the right tab with the right pre-filled data.
 *
 * USAGE in ProjectsTab.jsx:
 *
 *   import ProjectActionButtons from '../components/ProjectActionButtons';
 *
 *   // Inside your project card render:
 *   <ProjectActionButtons
 *     project={project}
 *     handleTabChange={handleTabChange}
 *     setProjectContext={setProjectContext}
 *   />
 *
 * USAGE in EmaarDashboardV2.jsx (add this state at top level):
 *
 *   const [projectContext, setProjectContext] = useState(null);
 *
 * Then pass projectContext as a prop to every tab that needs it.
 *
 * ARCHITECTURE (matches your existing IIFE tab pattern):
 *   - EmaarDashboardV2 holds `projectContext` state at top level
 *   - ProjectsTab receives handleTabChange + setProjectContext as props
 *   - Each destination tab receives projectContext as a prop
 *   - Each tab reads from projectContext on mount (useEffect)
 */

import React, { useState } from 'react';
import { T } from '../data';

// ─── EXACT TAB NAMES used in EmaarDashboardV2 tab routing ───────────────────
// These must match exactly what handleTabChange expects
const TAB_ROUTES = {
  handover:        'Handover',
  banking:         'Banking',
  investment_score:'Investment Score',
  yields:          'Yields',
  map:             'Map',
  developer:       'Developer Health',
  risk:            'Risk',
  leads:           'My Leads',
  flip:            'Flip',
  dld_volumes:     'DLD Volumes',
  service_charges: 'Service Charges',
  str_ltr:         'STR vs LTR',
  portfolio:       'Portfolio',
  financials:      'Financials',
  price_history:   'Price History',
  pipeline:        'Pipeline',
  launch_calendar: 'Launch Calendar',
};

// ─── ACTION DEFINITIONS ──────────────────────────────────────────────────────
const ACTIONS = [
  // PRIMARY — always visible on card
  { key:'handover',        label:'Handover',        tabKey:'handover',        color:'#10B981', primary:true  },
  { key:'mortgage',        label:'Mortgage',        tabKey:'banking',         color:'#3B82F6', primary:true  },
  { key:'roi',             label:'ROI Score',       tabKey:'investment_score',color:'#D4A843', primary:true  },
  { key:'add_lead',        label:'Add Lead',        tabKey:'leads',           color:'#14B8A6', primary:true  },
  // SECONDARY — shown in "More ▾" dropdown
  { key:'yields',          label:'Yields',          tabKey:'yields',          color:'#8B5CF6', primary:false },
  { key:'map',             label:'Map View',        tabKey:'map',             color:'#0EA5E9', primary:false },
  { key:'developer',       label:'Developer',       tabKey:'developer',       color:'#F59E0B', primary:false },
  { key:'risk',            label:'Risk',            tabKey:'risk',            color:'#EF4444', primary:false },
  { key:'flip',            label:'Flip Calc',       tabKey:'flip',            color:'#EC4899', primary:false },
  { key:'dld',             label:'DLD Data',        tabKey:'dld_volumes',     color:'#6366F1', primary:false },
  { key:'service_charges', label:'Service Charges', tabKey:'service_charges', color:'#92400E', primary:false },
  { key:'str_ltr',         label:'STR vs LTR',      tabKey:'str_ltr',         color:'#7C3AED', primary:false },
  { key:'portfolio',       label:'+ Portfolio',     tabKey:'portfolio',       color:'#D4A843', primary:false },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function ProjectActionButtons({ project, handleTabChange, setProjectContext, compact = false }) {
  const [showMore, setShowMore] = useState(false);

  const navigate = (action) => {
    const tabName = TAB_ROUTES[action.tabKey];
    if (!tabName) return;
    // 1. Set project context so destination tab reads it
    if (setProjectContext) setProjectContext(project);
    // 2. Navigate to tab
    if (handleTabChange) handleTabChange(tabName);
    // 3. Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowMore(false);
  };

  const primary = ACTIONS.filter(a => a.primary);
  const secondary = ACTIONS.filter(a => !a.primary);

  if (compact) {
    // Compact version for project list rows
    return (
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {primary.map(action => (
          <button
            key={action.key}
            onClick={(e) => { e.stopPropagation(); navigate(action); }}
            style={{
              padding:'4px 10px',
              borderRadius:6,
              border:`1px solid ${action.color}33`,
              background:`${action.color}12`,
              color:action.color,
              fontSize:11,
              fontWeight:600,
              cursor:'pointer',
              fontFamily:"'Outfit', sans-serif",
              transition:'all 0.15s',
              whiteSpace:'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${action.color}22`; e.currentTarget.style.borderColor = `${action.color}55`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${action.color}12`; e.currentTarget.style.borderColor = `${action.color}33`; }}
          >
            {action.label} →
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ position:'relative' }}>
      {/* Primary action buttons */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom: secondary.length ? 6 : 0 }}>
        {primary.map(action => (
          <button
            key={action.key}
            onClick={(e) => { e.stopPropagation(); navigate(action); }}
            style={{
              flex:1,
              minWidth:90,
              padding:'8px 12px',
              borderRadius:8,
              border:`1px solid ${action.color}40`,
              background:`linear-gradient(135deg, ${action.color}15, ${action.color}08)`,
              color:action.color,
              fontSize:12,
              fontWeight:600,
              cursor:'pointer',
              fontFamily:"'Outfit', sans-serif",
              transition:'all 0.2s',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              gap:4,
              position:'relative',
              overflow:'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${action.color}28, ${action.color}15)`;
              e.currentTarget.style.borderColor = `${action.color}70`;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${action.color}15, ${action.color}08)`;
              e.currentTarget.style.borderColor = `${action.color}40`;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>{action.label}</span>
            <span style={{ fontSize:10, opacity:0.7 }}>→</span>
          </button>
        ))}

        {/* More button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowMore(v => !v); }}
          style={{
            padding:'8px 12px',
            borderRadius:8,
            border:`1px solid rgba(212,168,67,0.2)`,
            background:`rgba(212,168,67,0.06)`,
            color:'#D4A843',
            fontSize:12,
            fontWeight:600,
            cursor:'pointer',
            fontFamily:"'Outfit', sans-serif",
            transition:'all 0.2s',
          }}
        >
          More {showMore ? '▲' : '▼'}
        </button>
      </div>

      {/* Secondary actions dropdown */}
      {showMore && (
        <div style={{
          position:'absolute',
          bottom:'100%',
          left:0,
          right:0,
          background:'#0A1628',
          border:'1px solid rgba(212,168,67,0.15)',
          borderRadius:10,
          padding:8,
          display:'grid',
          gridTemplateColumns:'1fr 1fr',
          gap:4,
          zIndex:50,
          marginBottom:4,
          boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
          backdropFilter:'blur(12px)',
        }}>
          {secondary.map(action => (
            <button
              key={action.key}
              onClick={(e) => { e.stopPropagation(); navigate(action); }}
              style={{
                padding:'6px 10px',
                borderRadius:6,
                border:`1px solid ${action.color}25`,
                background:`${action.color}10`,
                color:action.color,
                fontSize:11,
                fontWeight:500,
                cursor:'pointer',
                fontFamily:"'Outfit', sans-serif",
                textAlign:'left',
                transition:'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${action.color}20`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${action.color}10`; }}
            >
              {action.label} →
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
