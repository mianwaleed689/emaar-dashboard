const fs = require('fs');
let c = fs.readFileSync('src/pages/EmaarDashboardV2.jsx', 'utf8');
const lines = c.split('\n');

// Find exact line numbers
const superAdminLine = lines.findIndex(l => l.includes('SuperAdmin sees all leads'));
console.log('SuperAdmin line:', superAdminLine + 1);

// Find the end - line with "Regular platform user"
const regularUserLine = lines.findIndex((l, i) => i > superAdminLine && l.includes('Regular platform user'));
console.log('Regular user line:', regularUserLine + 1);

// Find the closing brace after return
let endLine = regularUserLine + 2; // return; and }
console.log('End line:', endLine + 1);
console.log('Content at end:', lines[endLine]);

// Replace lines from superAdminLine-1 to endLine
const newLines = [
'    if (isSuperAdmin) {',
'      // SuperAdmin CANNOT see agency leads — privacy rule',
'      setMyLeadsLoading(false);',
'      return;',
'    } else if (isOwner && orgId) {',
'      // Owner sees ALL leads in their org',
'      leadsQuery = query(collection(db, "leads"), where("orgId", "==", orgId), orderBy("createdAt", "desc"), limit(1000));',
'    } else if (isDirector && orgId) {',
'      // Director sees leads assigned to their managers/agents',
'      leadsQuery = query(collection(db, "leads"), where("directorId", "==", uid), orderBy("createdAt", "desc"), limit(500));',
'    } else if (isManager && orgId) {',
'      // Manager sees ONLY their own team leads',
'      leadsQuery = query(collection(db, "leads"), where("managerId", "==", uid), orderBy("createdAt", "desc"), limit(500));',
'    } else if (isAgent) {',
'      // Agent sees only assigned leads',
'      leadsQuery = query(collection(db, "leads"), where("assignedTo", "==", uid), orderBy("createdAt", "desc"), limit(200));',
'    } else {',
'      // Regular platform user — no CRM access',
'      setMyLeadsLoading(false);',
'      return;',
'    }',
];

// Replace from (superAdminLine - 1) to endLine
lines.splice(superAdminLine - 1, endLine - superAdminLine + 2, ...newLines);

fs.writeFileSync('src/pages/EmaarDashboardV2.jsx', lines.join('\n'), 'utf8');
console.log('Done. Has privacy rule:', lines.join('\n').includes('SuperAdmin CANNOT see agency leads'));
console.log('Has manager filter:', lines.join('\n').includes('"managerId", "==", uid'));
