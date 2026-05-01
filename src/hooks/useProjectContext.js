/**
 * DXB ANALYTICS — useProjectContext HOOK
 * ========================================
 * File: src/hooks/useProjectContext.js
 *
 * Every tab calls this hook at the top to read the active project context.
 * When user navigates from a project card, this hook returns the pre-fill data
 * so the tab knows what to show immediately.
 *
 * USAGE in any tab component:
 *
 *   import { useProjectContext } from '../hooks/useProjectContext';
 *
 *   function HandoverTab({ projectContext, handleTabChange, ...props }) {
 *     const { project, prefill, hasContext, clearContext } = useProjectContext(projectContext, 'handover');
 *
 *     // hasContext = true if user navigated from a project card
 *     // project = the full project object (Golf Grand Phase 2)
 *     // prefill = the pre-fill data for this specific tab
 *     //   e.g. { filter: { projectId: 'golf-grand-phase-2', community: 'Dubai Hills Estate' } }
 *
 *     useEffect(() => {
 *       if (hasContext && prefill?.filter?.community) {
 *         // Auto-apply the community filter
 *         setSelectedCommunity(prefill.filter.community);
 *       }
 *     }, [hasContext]);
 *
 *     return (
 *       <div>
 *         {hasContext && (
 *           <div style={contextBannerStyle}>
 *             Showing data for: {project.name}
 *             <button onClick={clearContext}>✕ Clear</button>
 *           </div>
 *         )}
 *         ...rest of tab...
 *       </div>
 *     );
 *   }
 */

import { useState, useEffect } from 'react';
import { BASE_PROJECT } from '../data/dubai_complete_foundation';

/**
 * @param {object|null} projectContext - The active project passed as prop from EmaarDashboardV2
 * @param {string} tabKey - Which tab this is (e.g. 'handover', 'mortgage', 'yields')
 * @returns {{ project, prefill, hasContext, clearContext }}
 */
export function useProjectContext(projectContext, tabKey) {
  const [localContext, setLocalContext] = useState(null);

  // Sync with parent-provided context
  useEffect(() => {
    if (projectContext) {
      setLocalContext(projectContext);
    }
  }, [projectContext]);

  const hasContext = !!localContext;
  const project = localContext || null;

  // Get the tab-specific prefill data
  const prefill = hasContext
    ? (project.tabConnections?.[tabKey] || null)
    : null;

  // Clear context (user manually clears the filter)
  const clearContext = () => setLocalContext(null);

  return { project, prefill, hasContext, clearContext };
}

/**
 * Context banner component — shown at top of tab when project context is active
 * Matches DXB Analytics gold theme exactly
 *
 * USAGE:
 *   import { ProjectContextBanner } from '../hooks/useProjectContext';
 *
 *   {hasContext && (
 *     <ProjectContextBanner project={project} tabKey="handover" onClear={clearContext} />
 *   )}
 */
export function ProjectContextBanner({ project, tabKey, onClear }) {
  if (!project) return null;
  const connection = project.tabConnections?.[tabKey];

  return (
    <div style={{
      display:'flex',
      alignItems:'center',
      justifyContent:'space-between',
      padding:'10px 16px',
      borderRadius:10,
      background:'rgba(212,168,67,0.08)',
      border:'1px solid rgba(212,168,67,0.25)',
      marginBottom:16,
      gap:12,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {/* Pulse dot */}
        <span style={{
          width:7, height:7, borderRadius:'50%',
          background:'#D4A843', display:'inline-block',
          animation:'pulse 2s infinite',
          flexShrink:0,
        }} />
        <div>
          <span style={{ fontSize:12, fontWeight:700, color:'#D4A843' }}>
            {project.name}
          </span>
          <span style={{ fontSize:11, color:'#94A3B8', marginLeft:8 }}>
            {project.masterCommunity} · {project.community}
          </span>
          {connection?.description && (
            <span style={{ fontSize:11, color:'#64748B', marginLeft:8 }}>
              — {connection.description}
            </span>
          )}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{
          fontSize:10, padding:'2px 8px', borderRadius:20,
          background:'rgba(212,168,67,0.12)', color:'#D4A843',
          border:'1px solid rgba(212,168,67,0.2)',
          fontWeight:600, letterSpacing:0.5,
        }}>
          PROJECT CONTEXT
        </span>
        <button
          onClick={onClear}
          style={{
            background:'none', border:'none',
            color:'#64748B', cursor:'pointer',
            fontSize:14, padding:'2px 6px',
            borderRadius:4, transition:'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
          title="Clear project context"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * State declarations to add to EmaarDashboardV2.jsx
 * at the TOP LEVEL (with all other useState calls)
 *
 * Copy this into your EmaarDashboardV2.jsx:
 */
export const STATE_DECLARATIONS = `
  // Project context — set when user clicks action button on a project card
  // All destination tabs read from this to know what project to show
  const [projectContext, setProjectContext] = useState(null);
`;

/**
 * Props to add to each tab component in EmaarDashboardV2.jsx JSX
 * Add these to every tab that needs project context:
 */
export const TAB_PROPS_TO_ADD = `
  // Add to ProjectsTab:
  projectContext={projectContext}
  setProjectContext={setProjectContext}
  
  // Add to every destination tab:
  projectContext={projectContext}
`;

