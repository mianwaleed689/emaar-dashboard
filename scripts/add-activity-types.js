const fs = require('fs');
let c = fs.readFileSync('src/crm/crmTokens.js', 'utf8');

const addition = `
export const ACTIVITY_TYPES = [
  { key: "call",    label: "Log Call",         icon: "📞", color: "#3B82F6" },
  { key: "meeting", label: "Schedule Meeting",  icon: "📅", color: "#8B5CF6" },
  { key: "message", label: "Send Message",      icon: "💬", color: "#00BFA5" },
  { key: "note",    label: "Add Note",          icon: "📝", color: "#F59E0B" },
  { key: "email",   label: "Send Email",        icon: "📧", color: "#10B981" },
];
`;

if (!c.includes('ACTIVITY_TYPES')) {
  c = c + addition;
  fs.writeFileSync('src/crm/crmTokens.js', c, 'utf8');
  console.log('ACTIVITY_TYPES added');
} else {
  console.log('Already exists');
}
