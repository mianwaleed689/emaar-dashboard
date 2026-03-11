import React, { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc, getDocs, addDoc, deleteDoc, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { auth, storage } from "../../../firebase";
import emailjs from "@emailjs/browser";

let _cachedIP = null;
async function getAdminIP() {
  if (_cachedIP) return _cachedIP;
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const d = await r.json();
    _cachedIP = d.ip;
    return _cachedIP;
  } catch { return "unknown"; }
}

let _webhookUrl = null;
async function logAudit(db, payload) {
  try {
    const ip = await getAdminIP();
    const changedBy = auth.currentUser?.email || "admin";
    const entry = { ...payload, changedBy, changedAt: new Date().toISOString(), ip };
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(doc(db, "auditLog", id), entry);
    if (_webhookUrl) {
      try { fetch(_webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) }); } catch {}
    }
    return entry;
  } catch (e) { console.error("logAudit:", e); }
}

function SupportTab({ T, I, db, notify, adminUser, users, setTab, setPendingOpenUid }) {
  const now = new Date();


const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(10,22,40,0.95)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(12px)" }}>
      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 12, color: p.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
};

/* ─── SAFE FIRESTORE DATA ─── */
function plainify(obj) {
  if (obj === null || obj === undefined) return "";
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") return obj;
  if (typeof obj.toDate === "function") return obj.toDate().toISOString();
  if (Array.isArray(obj)) return obj.map(plainify);
  if (typeof obj === "object") { const o = {}; Object.keys(obj).forEach(k => { o[k] = plainify(obj[k]); }); return o; }
  return String(obj);
}

/* ─── REUSABLE COMPONENTS (outside component to prevent re-mount on state change) ─── */
const KPI = ({ label, value, sub, color, delay = 0 }) => (
  <div className="kpi-card fade-up" style={{ animationDelay: `${delay * 0.05}s` }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 900, color: color || T.gold, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.green, marginTop: 8, fontWeight: 500 }}>{sub}</div>}
  </div>
);

const Section = ({ title, sub, children, action }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
      <div style={{ borderLeft: `3px solid ${T.gold}`, paddingLeft: 14 }}>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.white, lineHeight: 1.2 }}>{title}</h2>
        {sub && <p style={{ fontSize: 12, color: T.textSecondary, marginTop: 3 }}>{sub}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const Chart = ({ title, sub, children }) => (
  <div className="chart-box fade-up" style={{ padding: 20 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: sub ? 2 : 14 }}>{title}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 14 }}>{sub}</div>}
    {children}
  </div>
);

/* ─── HELP TIP — inline ? icon with hover tooltip ─── */
const HelpTip = ({ text }) => {
  const [show, setShow] = React.useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: 5, verticalAlign: "middle" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.3)", color: T.gold, fontSize: 9, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "help", lineHeight: 1, fontFamily: "'Outfit',sans-serif" }}>?</span>
      {show && (
        <span style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "rgba(4,9,15,0.97)", border: "1px solid rgba(212,168,67,0.25)", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: T.textSecondary, whiteSpace: "pre-wrap", minWidth: 200, maxWidth: 280, zIndex: 9999, lineHeight: 1.6, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", pointerEvents: "none" }}>
          {text}
          <span style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: 8, height: 8, background: "rgba(4,9,15,0.97)", border: "1px solid rgba(212,168,67,0.25)", borderTop: "none", borderLeft: "none", transform: "translateX(-50%) rotate(45deg)" }} />
        </span>
      )}
    </span>
  );
};

/* ─── TAB HELP — collapsible how-to banner ─── */
const TabHelp = ({ items }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ marginBottom: 20, borderRadius: 12, border: `1px solid rgba(212,168,67,0.2)`, background: "rgba(212,168,67,0.04)", overflow: "hidden" }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 15 }}>[i]</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>How to use this section</span>
        </div>
        <span style={{ fontSize: 12, color: T.textMuted, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s", display: "inline-block" }}>v</span>
      </button>
      {open && (
        <div style={{ padding: "4px 18px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SUPPORT TAB COMPONENT — TAB 14
   Ticket system, conversation threads, SLA tracking, response templates
   Collections: supportTickets, ticketPresence
   Benchmark: Intercom + Zendesk + Freshdesk
   PHASE 1: Internal Notes, Tags, Assignment
   PHASE 1B: Collision Detection, Attachments, @Mentions
   PHASE 2: Merge Tickets, Link Related, Custom Fields
   */
  // State
  const [supportSubTab, setSupportSubTab] = useState("open");
  const [tickets, setTickets] = useState([]);
  const [ticketDrawer, setTicketDrawer] = useState(null);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketReplying, setTicketReplying] = useState(false);
  const [ticketFilter, setTicketFilter] = useState("all");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("all");
  const [ticketSearch, setTicketSearch] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  
  // Phase 1: New state for internal notes, tags, assignment
  const [internalNote, setInternalNote] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [replyMode, setReplyMode] = useState("reply"); // reply | note

  // Phase 1B: Collision detection, attachments, mentions
  const [viewingAdmins, setViewingAdmins] = useState([]); // Who's viewing this ticket
  const [uploading, setUploading] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const fileInputRef = React.useRef(null);
  const noteInputRef = React.useRef(null);

  // Phase 2: Merge tickets, link related
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [merging, setMerging] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTargetId, setLinkTargetId] = useState("");
  const [linking, setLinking] = useState(false);

  // Phase 2B: Custom Fields
  const [customFields, setCustomFields] = useState([]);
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [newFieldForm, setNewFieldForm] = useState({ name: "", type: "text", options: "", required: false });
  const [customFieldFilter, setCustomFieldFilter] = useState({ fieldId: "", value: "" });

  // Phase 3A: Auto-Assign Rules & SLA Escalation
  const [autoAssignRules, setAutoAssignRules] = useState([]);
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [newRuleForm, setNewRuleForm] = useState({ name: "", condition: "category", conditionValue: "", assignTo: "", enabled: true });
  const [slaSettings, setSlaSettings] = useState({ defaultHours: 24, warningPercent: 75, escalateOnBreach: true, escalateTo: "", notifyAgent: true, notifyManager: true });
  const [showSlaModal, setShowSlaModal] = useState(false);

  // Phase 3B: Workflow Triggers
  const [workflowTriggers, setWorkflowTriggers] = useState([]);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [newWorkflowForm, setNewWorkflowForm] = useState({ 
    name: "", 
    trigger: "status_change", 
    triggerValue: "", 
    actions: [{ type: "add_tag", value: "" }],
    enabled: true 
  });

  // Phase 4: Analytics & Reporting
  const [analyticsRange, setAnalyticsRange] = useState("7d"); // 7d | 30d | 90d

  // Phase 5A: CSAT (Customer Satisfaction)
  const [csatRatings, setCsatRatings] = useState([]);
  const [showCsatModal, setShowCsatModal] = useState(false);
  const [csatForm, setCsatForm] = useState({ ticketId: "", rating: 5, comment: "" });

  // Phase 5B: Knowledge Base & Quick Responses
  const [kbArticles, setKbArticles] = useState([]);
  const [quickResponses, setQuickResponses] = useState([]);
  const [showKbModal, setShowKbModal] = useState(false);
  const [showQuickResponseModal, setShowQuickResponseModal] = useState(false);
  const [kbSearch, setKbSearch] = useState("");
  const [kbCategory, setKbCategory] = useState("all");
  const [editingArticle, setEditingArticle] = useState(null);
  const [editingQuickResponse, setEditingQuickResponse] = useState(null);
  const [articleForm, setArticleForm] = useState({ title: "", content: "", category: "getting-started", tags: "" });
  const [quickResponseForm, setQuickResponseForm] = useState({ name: "", shortcut: "", content: "", category: "general" });
  const [expandedKbCategory, setExpandedKbCategory] = useState(null);
  const [viewingArticle, setViewingArticle] = useState(null);

  // Phase 6A: AI Features (Sentiment + Summarization)
  const [ticketSummary, setTicketSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(true);

  // Phase 6B: Smart Replies + Similar Tickets
  const [suggestedReplies, setSuggestedReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [similarTickets, setSimilarTickets] = useState([]);
  const [showSimilarTickets, setShowSimilarTickets] = useState(false);

  // Phase 7A: Live Chat + Queue Management
  const [liveChats, setLiveChats] = useState([]);
  const [chatQueue, setChatQueue] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [agentOnline, setAgentOnline] = useState(true);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [chatSettings, setChatSettings] = useState({
    enabled: true,
    autoAccept: false,
    maxConcurrent: 3,
    welcomeMessage: "Hi! ≡ƒæï How can we help you today?",
    offlineMessage: "We're currently offline. Leave a message and we'll get back to you!",
    widgetColor: "#D4A843",
    widgetPosition: "right"
  });
  const [showWidgetPreview, setShowWidgetPreview] = useState(false);

  // Phase 7B: WhatsApp + Unified Inbox
  const [whatsappConversations, setWhatsappConversations] = useState([]);
  const [activeWhatsappId, setActiveWhatsappId] = useState(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [showWhatsappTemplates, setShowWhatsappTemplates] = useState(false);
  const [whatsappTemplates] = useState([
    { id: "welcome", name: "Welcome", content: "Hello {{name}}! Thank you for contacting DXB Analytics. How can we assist you today?" },
    { id: "followup", name: "Follow Up", content: "Hi {{name}}, just following up on our previous conversation. Is there anything else we can help you with?" },
    { id: "resolved", name: "Issue Resolved", content: "Hi {{name}}, we're pleased to inform you that your issue has been resolved. Please let us know if you need any further assistance." },
    { id: "payment", name: "Payment Received", content: "Hi {{name}}, we've received your payment. Thank you! Your account has been updated." },
    { id: "offline", name: "Offline Notice", content: "Hi {{name}}, our support team is currently offline. We'll respond within 24 hours. For urgent matters, please email support@dxbanalytics.com" },
  ]);

  // Phase 8A: Time Tracking + Audit Logs
  const [timeEntries, setTimeEntries] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null); // { ticketId, startedAt, agentId, agentName }
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false);
  const [timeEntryForm, setTimeEntryForm] = useState({ ticketId: "", duration: 15, notes: "", billable: true });
  const [ticketAuditLogs, setTicketAuditLogs] = useState([]);
  const [auditLogFilter, setAuditLogFilter] = useState("all"); // all | status | assignment | reply | tag | merge | time
  const [auditLogTicketFilter, setAuditLogTicketFilter] = useState("");
  const [showAuditDetails, setShowAuditDetails] = useState(null);

  // Phase 8B: Webhooks, Export, Permissions
  const [webhooks, setWebhooks] = useState([]);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookForm, setWebhookForm] = useState({ name: "", url: "", events: ["ticket_created"], enabled: true, secret: "" });
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [testingWebhook, setTestingWebhook] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({ format: "csv", dateRange: "all", status: "all", includeMessages: true, includeNotes: false, includeTime: true });
  const [exporting, setExporting] = useState(false);
  const [agentPermissions, setAgentPermissions] = useState([]);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [permissionForm, setPermissionForm] = useState({ agentId: "", role: "agent" });

  // Predefined tags
  const availableTags = [
    { id: "urgent", label: "Urgent", color: T.red },
    { id: "vip", label: "VIP", color: T.gold },
    { id: "bug-confirmed", label: "Bug Confirmed", color: T.purple },
    { id: "waiting-user", label: "Waiting on User", color: T.orange },
    { id: "escalated", label: "Escalated", color: T.red },
    { id: "follow-up", label: "Follow Up", color: T.blue },
    { id: "resolved", label: "Resolved", color: T.green },
    { id: "duplicate", label: "Duplicate", color: T.textMuted },
  ];

  // Get admin users for assignment
  const adminUsers = users.filter(u => u.role === "admin" || u.tier === "enterprise" || u.email?.includes("admin"));
  const assignableAgents = [
    { id: "unassigned", name: "Unassigned", email: "" },
    { id: adminUser?.uid || "current", name: adminUser?.displayName || adminUser?.email?.split("@")[0] || "Me", email: adminUser?.email || "" },
    ...adminUsers.slice(0, 5).map(u => ({ id: u.uid || u.id, name: u.name || u.email?.split("@")[0], email: u.email }))
  ].filter((v, i, a) => a.findIndex(t => t.email === v.email) === i); // dedupe

  // Response templates
  const responseTemplates = [
    { id: 1, name: "Acknowledge", text: "Thank you for reaching out! I've received your request and will look into it right away. I'll get back to you within 24 hours with an update." },
    { id: 2, name: "Need More Info", text: "Thanks for contacting us. To help resolve this faster, could you please provide more details? Specifically: [what exactly you were trying to do, any error messages you saw, and which browser/device you're using]." },
    { id: 3, name: "Bug Confirmed", text: "Thank you for reporting this issue. I've confirmed the bug and our team is working on a fix. I'll update you as soon as it's resolved." },
    { id: 4, name: "Feature Noted", text: "Great suggestion! I've added this to our feature request list and shared it with the product team. We'll consider it for future updates." },
    { id: 5, name: "Data Updated", text: "The data has been updated as requested. Please refresh your dashboard to see the changes. Let me know if you need anything else!" },
    { id: 6, name: "Billing Help", text: "I'd be happy to help with your billing question. [Insert specific response]. If you need further assistance, just let me know." },
    { id: 7, name: "Issue Resolved", text: "Great news! The issue has been resolved. Please try again and let me know if everything is working correctly now." },
  ];

  // Internal note templates
  const noteTemplates = [
    { id: 1, name: "Escalate", text: "Escalating to engineering team. @dev please review." },
    { id: 2, name: "Waiting", text: "Waiting for customer response. Follow up in 48h if no reply." },
    { id: 3, name: "VIP", text: "VIP customer - prioritize and handle with extra care." },
    { id: 4, name: "Bug Found", text: "Confirmed bug. Created ticket in backlog. ETA: TBD" },
  ];

  // Categories and statuses
  const categories = [
    { id: "bug", label: "Bug Report", color: T.red, icon: "≡ƒÉ¢" },
    { id: "data", label: "Data Question", color: T.orange, icon: "≡ƒôè" },
    { id: "feature", label: "Feature Request", color: T.purple, icon: "Γ£¿" },
   { id: "billing", label: "Billing Query", color: T.green, icon: "≡ƒÆ│" },
    { id: "account", label: "Account Issue", color: T.blue, icon: "≡ƒæñ" },
    { id: "other", label: "Other", color: T.textMuted, icon: "≡ƒô¥" },
  ];

  const statuses = {
    open: { label: "Open", color: T.orange, bg: `${T.orange}20` },
    in_progress: { label: "In Progress", color: T.blue, bg: `${T.blue}20` },
    resolved: { label: "Resolved", color: T.green, bg: `${T.green}20` },
    closed: { label: "Closed", color: T.textMuted, bg: `${T.textMuted}20` },
  };

  const priorities = {
    urgent: { label: "Urgent", color: T.red, bg: `${T.red}20` },
    high: { label: "High", color: T.orange, bg: `${T.orange}20` },
    normal: { label: "Normal", color: T.textMuted, bg: `${T.textMuted}20` },
  };

  // Fetch tickets
  useEffect(() => {
    const fetchTickets = async () => {
      setTicketsLoading(true);
      try {
        const snap = await getDocs(query(collection(db, "supportTickets"), orderBy("createdAt", "desc"), limit(100)));
        setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Fetch tickets:", e);
        setTickets([
          { id: "ticket_1", userId: "user1", userEmail: "ahmed@example.com", userName: "Ahmed", userTier: "pro", subject: "Yield calculation seems incorrect", category: "data", priority: "high", status: "open", tags: ["urgent"], assignedTo: null, messages: [{ from: "user", text: "The yield for Creek Waters shows 6.2% but my calculation gives 5.8%. Can you check?", at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }], internalNotes: [{ text: "Need to verify with data team", by: "admin@dxb.com", at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }], createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
          { id: "ticket_2", userId: "user2", userEmail: "sarah@realty.ae", userName: "Sarah", userTier: "enterprise", subject: "Can't access EIBOR calculator", category: "bug", priority: "urgent", status: "in_progress", tags: ["vip", "bug-confirmed"], assignedTo: "admin", messages: [{ from: "user", text: "Getting error when trying to open EIBOR calculator. Screen goes blank.", at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() }, { from: "admin", text: "Thanks for reporting. We're looking into this now.", at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() }], internalNotes: [{ text: "VIP customer - enterprise plan. Escalated to dev.", by: "support@dxb.com", at: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString() }], createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), respondedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
          { id: "ticket_3", userId: "user3", userEmail: "mike@invest.com", userName: "Mike", userTier: "pro", subject: "Request: Add ROI projections", category: "feature", priority: "normal", status: "open", tags: [], assignedTo: null, messages: [{ from: "user", text: "Would be great to have ROI projections based on historical data. Is this planned?", at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() }], internalNotes: [], createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
          { id: "ticket_4", userId: "user4", userEmail: "lisa@properties.ae", userName: "Lisa", userTier: "pro_trial", subject: "How to upgrade to Pro?", category: "billing", priority: "normal", status: "resolved", tags: ["resolved"], assignedTo: "admin", messages: [{ from: "user", text: "My trial ends in 2 days. How do I upgrade?", at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() }, { from: "admin", text: "Click on 'Upgrade' in the top right corner. You can pay via card. Let me know if you need help!", at: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString() }, { from: "user", text: "Got it, thanks!", at: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString() }], internalNotes: [], createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), respondedAt: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(), resolvedAt: new Date(Date.now() - 45 * 60 * 60 * 1000).toISOString() },
        ]);
      }
      setTicketsLoading(false);
    };
    fetchTickets();
  }, [db]);

  // Fetch custom field definitions
  useEffect(() => {
    const fetchCustomFields = async () => {
      try {
        const snap = await getDocs(collection(db, "supportCustomFields"));
        setCustomFields(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Fetch custom fields:", e);
        // Default sample fields
        setCustomFields([
          { id: "field_1", name: "Browser", type: "dropdown", options: ["Chrome", "Firefox", "Safari", "Edge", "Other"], required: false, createdAt: new Date().toISOString() },
          { id: "field_2", name: "Device", type: "dropdown", options: ["Desktop", "Mobile", "Tablet"], required: false, createdAt: new Date().toISOString() },
          { id: "field_3", name: "Version", type: "text", required: false, createdAt: new Date().toISOString() },
          { id: "field_4", name: "Due Date", type: "date", required: false, createdAt: new Date().toISOString() },
        ]);
      }
    };
    fetchCustomFields();
  }, [db]);

  // Fetch auto-assign rules and SLA settings
  useEffect(() => {
    const fetchAutomation = async () => {
      try {
        // Fetch auto-assign rules
        const rulesSnap = await getDocs(collection(db, "supportAutoAssignRules"));
        setAutoAssignRules(rulesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        // Fetch SLA settings
        const slaDoc = await getDoc(doc(db, "supportSettings", "sla"));
        if (slaDoc.exists()) {
          setSlaSettings(prev => ({ ...prev, ...slaDoc.data() }));
        }
        
        // Fetch workflow triggers
        const workflowSnap = await getDocs(collection(db, "supportWorkflowTriggers"));
        setWorkflowTriggers(workflowSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        // Fetch CSAT ratings
        const csatSnap = await getDocs(collection(db, "supportCSAT"));
        setCsatRatings(csatSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        // Fetch Knowledge Base articles
        const kbSnap = await getDocs(collection(db, "supportKnowledgeBase"));
        setKbArticles(kbSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        // Fetch Quick Responses
        const qrSnap = await getDocs(collection(db, "supportQuickResponses"));
        setQuickResponses(qrSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Fetch automation settings:", e);
        // Default sample rules
        setAutoAssignRules([
          { id: "rule_1", name: "Bugs to Dev Team", condition: "category", conditionValue: "bug", assignTo: "dev_team", assignToName: "Dev Team", enabled: true },
          { id: "rule_2", name: "VIP Customers", condition: "tier", conditionValue: "enterprise", assignTo: "vip_support", assignToName: "VIP Support", enabled: true },
          { id: "rule_3", name: "Urgent Priority", condition: "priority", conditionValue: "urgent", assignTo: "senior_agent", assignToName: "Senior Agent", enabled: false },
        ]);
        // Default sample workflows
        setWorkflowTriggers([
          { id: "wf_1", name: "Resolved ΓåÆ Add Tag", trigger: "status_change", triggerValue: "resolved", actions: [{ type: "add_tag", value: "resolved" }], enabled: true },
          { id: "wf_2", name: "VIP Auto-Priority", trigger: "tier_is", triggerValue: "enterprise", actions: [{ type: "set_priority", value: "high" }, { type: "add_tag", value: "vip" }], enabled: true },
        ]);
        // Default sample CSAT
        setCsatRatings([
          { id: "csat_1", ticketId: "ticket_1", rating: 5, comment: "Ahmed was incredibly helpful and resolved my issue quickly!", agentId: "agent_1", agentName: "Ahmed", userName: "John Smith", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "csat_2", ticketId: "ticket_2", rating: 4, comment: "Good support but took a bit longer than expected", agentId: "agent_2", agentName: "Sarah", userName: "Emma Wilson", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "csat_3", ticketId: "ticket_3", rating: 5, comment: "Excellent service!", agentId: "agent_1", agentName: "Ahmed", userName: "Mike Johnson", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "csat_4", ticketId: "ticket_4", rating: 3, comment: "Issue was resolved but communication could be better", agentId: "agent_3", agentName: "Dev Team", userName: "Lisa Brown", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "csat_5", ticketId: "ticket_5", rating: 5, comment: "", agentId: "agent_2", agentName: "Sarah", userName: "Tom Davis", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "csat_6", ticketId: "ticket_6", rating: 2, comment: "Not fully resolved, had to follow up multiple times", agentId: "agent_3", agentName: "Dev Team", userName: "Anna Lee", createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "csat_7", ticketId: "ticket_7", rating: 4, comment: "Quick response time", agentId: "agent_1", agentName: "Ahmed", userName: "Chris Martin", createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        ]);
        // Default sample KB articles
        setKbArticles([
          { id: "kb_1", title: "How to reset your password", content: "To reset your password:\n\n1. Click on your profile icon in the top right corner\n2. Select 'Settings' from the dropdown menu\n3. Navigate to 'Security' tab\n4. Click 'Reset Password'\n5. Enter your current password and new password\n6. Click 'Save Changes'\n\nIf you've forgotten your password, click 'Forgot Password' on the login page and follow the email instructions.", category: "getting-started", tags: ["password", "login", "security"], views: 142, helpful: 89, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "kb_2", title: "Setting up two-factor authentication", content: "Two-factor authentication (2FA) adds an extra layer of security:\n\n1. Go to Settings > Security\n2. Click 'Enable 2FA'\n3. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)\n4. Enter the 6-digit code from your app\n5. Save backup codes in a secure location\n\n**Important:** Keep your backup codes safe - they're the only way to recover your account if you lose access to your authenticator.", category: "getting-started", tags: ["security", "2fa", "authentication"], views: 98, helpful: 76, createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "kb_3", title: "Understanding your dashboard", content: "Your DXB Analytics dashboard provides real-time insights into Dubai's real estate market.\n\n**Key Sections:**\n- **Overview**: Market summary with key metrics\n- **Transactions**: Recent sales and rental data\n- **Trends**: Price movements and forecasts\n- **Areas**: Neighborhood-level analysis\n- **Developers**: Builder performance metrics\n\n**Tips:**\n- Use filters to narrow down data by area, property type, or time period\n- Export reports for offline analysis\n- Set up alerts for price changes in specific areas", category: "getting-started", tags: ["dashboard", "overview", "navigation"], views: 234, helpful: 198, createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "kb_4", title: "How to update payment method", content: "To update your payment method:\n\n1. Navigate to Settings > Billing\n2. Under 'Payment Methods', click 'Add New' or 'Edit' on existing card\n3. Enter your new card details\n4. Click 'Save Payment Method'\n\nYour next invoice will automatically charge the new payment method.", category: "billing", tags: ["billing", "payment", "credit card"], views: 67, helpful: 54, createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "kb_5", title: "Understanding your invoice", content: "Your invoice includes:\n\n- **Subscription fee**: Monthly/annual plan charge\n- **Add-ons**: Any additional features purchased\n- **Usage charges**: API calls beyond your plan limit (if applicable)\n- **Tax**: VAT as per UAE regulations\n\n**Download invoices:**\nGo to Settings > Billing > Invoice History to download PDF copies.", category: "billing", tags: ["billing", "invoice", "charges"], views: 45, helpful: 38, createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "kb_6", title: "Data not loading troubleshooting", content: "If your data isn't loading:\n\n**Quick fixes:**\n1. Refresh the page (Ctrl+R or Cmd+R)\n2. Clear browser cache\n3. Try a different browser\n4. Check your internet connection\n\n**Still having issues?**\n- Check our status page for any ongoing incidents\n- Ensure your subscription is active\n- Contact support with your browser/device details", category: "technical", tags: ["troubleshooting", "loading", "errors"], views: 156, helpful: 112, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "kb_7", title: "Browser compatibility", content: "DXB Analytics works best on:\n\n**Fully Supported:**\n- Chrome 90+\n- Firefox 88+\n- Safari 14+\n- Edge 90+\n\n**Limited Support:**\n- Internet Explorer (not recommended)\n- Mobile browsers (responsive design)\n\n**For best experience:**\n- Enable JavaScript\n- Allow cookies\n- Use a screen resolution of 1280x720 or higher", category: "technical", tags: ["browser", "compatibility", "requirements"], views: 89, helpful: 71, createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "kb_8", title: "Refund policy", content: "Our refund policy:\n\n**Monthly subscriptions:**\n- Cancel anytime, no refund for partial months\n- Access continues until end of billing period\n\n**Annual subscriptions:**\n- Full refund within 14 days of purchase\n- Pro-rated refund within 30 days\n- No refunds after 30 days\n\n**To request a refund:**\nContact support with your account email and reason for refund.", category: "billing", tags: ["refund", "cancellation", "policy"], views: 34, helpful: 28, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        ]);
        // Default sample Quick Responses
        setQuickResponses([
          { id: "qr_1", name: "Greeting", shortcut: "/greet", content: "Hi {{name}},\n\nThank you for contacting DXB Analytics support! I'm happy to help you today.\n\nCould you please provide more details about your issue so I can assist you better?", category: "general", usageCount: 156, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "qr_2", name: "Password Reset", shortcut: "/password", content: "Hi {{name}},\n\nTo reset your password, please follow these steps:\n\n1. Click 'Forgot Password' on the login page\n2. Enter your email address\n3. Check your inbox for the reset link\n4. Follow the link to create a new password\n\nIf you don't receive the email within 5 minutes, please check your spam folder.\n\nLet me know if you need any further assistance!", category: "technical", usageCount: 89, createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "qr_3", name: "Billing Question", shortcut: "/billing", content: "Hi {{name}},\n\nI've reviewed your billing inquiry for ticket #{{ticket_id}}.\n\nYour current plan is [PLAN] at [PRICE]/month. Your next billing date is [DATE].\n\nIf you'd like to upgrade, downgrade, or have questions about charges, please let me know and I'll be happy to help!", category: "billing", usageCount: 67, createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "qr_4", name: "Issue Resolved", shortcut: "/resolved", content: "Hi {{name}},\n\nGreat news! Your issue has been resolved. Here's a summary of what was done:\n\n[SUMMARY]\n\nIf you have any other questions or if the issue reoccurs, please don't hesitate to reach out.\n\nThank you for using DXB Analytics!", category: "general", usageCount: 234, createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "qr_5", name: "Escalation Notice", shortcut: "/escalate", content: "Hi {{name}},\n\nI'm escalating your ticket to our senior support team for further investigation. This ensures you receive the specialized attention your issue requires.\n\nA senior agent will review your case and respond within 24 hours.\n\nThank you for your patience!", category: "general", usageCount: 45, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "qr_6", name: "Need More Info", shortcut: "/info", content: "Hi {{name}},\n\nThank you for reaching out. To help resolve your issue faster, could you please provide:\n\n1. Browser and version you're using\n2. Screenshots of any error messages\n3. Steps to reproduce the issue\n\nThis information will help us identify and fix the problem quickly.", category: "technical", usageCount: 112, createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "qr_7", name: "Feature Request Noted", shortcut: "/feature", content: "Hi {{name}},\n\nThank you for your feature suggestion! I've logged this with our product team for consideration.\n\nWhile I can't guarantee a timeline, we value customer feedback and use it to prioritize our roadmap.\n\nIs there anything else I can help you with today?", category: "general", usageCount: 38, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        ]);
      }
    };
    fetchAutomation();
  }, [db]);

  // SLA Check & Auto-Escalation (runs on ticket load and periodically)
  useEffect(() => {
    if (!slaSettings.escalateOnBreach || tickets.length === 0) return;
    
    const checkSlaEscalation = async () => {
      const slaMs = slaSettings.defaultHours * 60 * 60 * 1000;
      
      for (const ticket of tickets) {
        if (ticket.status === "resolved" || ticket.status === "closed" || ticket.escalatedAt) continue;
        
        const created = new Date(ticket.createdAt);
        const elapsed = now.getTime() - created.getTime();
        const percentUsed = (elapsed / slaMs) * 100;
        
        // Auto-escalate at 100% SLA breach
        if (percentUsed >= 100 && !ticket.autoEscalated) {
          try {
            const escalationUpdate = {
              autoEscalated: true,
              escalatedAt: now.toISOString(),
              tags: [...new Set([...(ticket.tags || []), "escalated"])],
              internalNotes: [
                ...(ticket.internalNotes || []),
   { text: `ΓÜá∩╕Å AUTO-ESCALATED: SLA breached (>${slaSettings.defaultHours}h without resolution)`, by: "System", at: now.toISOString(), isSystem: true }
              ],
              updatedAt: now.toISOString()
            };
            
            // Assign to escalation manager if set
            if (slaSettings.escalateTo) {
              escalationUpdate.assignedTo = slaSettings.escalateTo;
              escalationUpdate.assignedToName = slaSettings.escalateToName || "Manager";
            }
            
            await setDoc(doc(db, "supportTickets", ticket.id), escalationUpdate, { merge: true });
            
            // Update local state
            setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, ...escalationUpdate } : t));
            
            console.log(`Auto-escalated ticket: ${ticket.id}`);
          } catch (e) {
            console.error("Auto-escalation failed:", e);
          }
        }
      }
    };
    
    checkSlaEscalation();
    const interval = setInterval(checkSlaEscalation, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [tickets, slaSettings, db]);

  // Phase 8A: Timer tick effect
  useEffect(() => {
    if (!activeTimer) {
      setTimerElapsed(0);
      return;
    }
    const tick = () => {
      const started = new Date(activeTimer.startedAt).getTime();
      setTimerElapsed(Math.floor((Date.now() - started) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  // Phase 8A: Fetch time entries and audit logs
  useEffect(() => {
    const fetchTimeData = async () => {
      try {
        const timeSnap = await getDocs(collection(db, "supportTimeEntries"));
        setTimeEntries(timeSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const auditSnap = await getDocs(query(collection(db, "supportTicketAudit"), orderBy("timestamp", "desc"), limit(500)));
        setTicketAuditLogs(auditSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Fetch time data:", e);
        // Demo data for time entries
        setTimeEntries([
          { id: "time_1", ticketId: "ticket_1", agentId: "agent_1", agentName: "Ahmed", duration: 25, notes: "Initial investigation", billable: true, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
          { id: "time_2", ticketId: "ticket_2", agentId: "agent_2", agentName: "Sarah", duration: 45, notes: "Debugging EIBOR calculator", billable: true, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
          { id: "time_3", ticketId: "ticket_2", agentId: "agent_1", agentName: "Ahmed", duration: 30, notes: "Follow-up with user", billable: false, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
          { id: "time_4", ticketId: "ticket_4", agentId: "agent_2", agentName: "Sarah", duration: 10, notes: "Quick response", billable: true, createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
        ]);
        // Demo data for audit logs
        setTicketAuditLogs([
          { id: "audit_1", ticketId: "ticket_1", action: "created", actor: "user", actorName: "Ahmed (Customer)", details: { subject: "Yield calculation seems incorrect" }, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
          { id: "audit_2", ticketId: "ticket_1", action: "tag_added", actor: "agent", actorName: "Support Admin", details: { tag: "urgent" }, timestamp: new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString() },
          { id: "audit_3", ticketId: "ticket_1", action: "note_added", actor: "agent", actorName: "Support Admin", details: { preview: "Need to verify with data team" }, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
          { id: "audit_4", ticketId: "ticket_2", action: "created", actor: "user", actorName: "Sarah (Customer)", details: { subject: "Can't access EIBOR calculator" }, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
          { id: "audit_5", ticketId: "ticket_2", action: "status_change", actor: "agent", actorName: "Support Admin", details: { from: "open", to: "in_progress" }, timestamp: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString() },
          { id: "audit_6", ticketId: "ticket_2", action: "assigned", actor: "agent", actorName: "Support Admin", details: { to: "admin" }, timestamp: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString() },
          { id: "audit_7", ticketId: "ticket_2", action: "reply_sent", actor: "agent", actorName: "Support Admin", details: { preview: "Thanks for reporting..." }, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
          { id: "audit_8", ticketId: "ticket_2", action: "tag_added", actor: "agent", actorName: "Support Admin", details: { tag: "vip" }, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
          { id: "audit_9", ticketId: "ticket_2", action: "tag_added", actor: "agent", actorName: "Support Admin", details: { tag: "bug-confirmed" }, timestamp: new Date(Date.now() - 3.9 * 60 * 60 * 1000).toISOString() },
          { id: "audit_10", ticketId: "ticket_2", action: "time_logged", actor: "agent", actorName: "Sarah", details: { duration: 45, billable: true }, timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString() },
          { id: "audit_11", ticketId: "ticket_4", action: "created", actor: "user", actorName: "Lisa (Customer)", details: { subject: "How to upgrade to Pro?" }, timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
          { id: "audit_12", ticketId: "ticket_4", action: "reply_sent", actor: "agent", actorName: "Support Admin", details: { preview: "Click on Upgrade..." }, timestamp: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString() },
          { id: "audit_13", ticketId: "ticket_4", action: "status_change", actor: "agent", actorName: "Support Admin", details: { from: "in_progress", to: "resolved" }, timestamp: new Date(Date.now() - 45 * 60 * 60 * 1000).toISOString() },
        ]);
      }
    };
    fetchTimeData();
  }, [db]);

  // Phase 8B: Fetch webhooks and permissions
  useEffect(() => {
    const fetchWebhooksAndPermissions = async () => {
      try {
        // Fetch webhooks
        const webhooksSnap = await getDocs(collection(db, "supportWebhooks"));
        setWebhooks(webhooksSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        // Fetch webhook logs
        const logsSnap = await getDocs(query(collection(db, "supportWebhookLogs"), orderBy("timestamp", "desc"), limit(100)));
        setWebhookLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        // Fetch agent permissions
        const permSnap = await getDocs(collection(db, "supportAgentPermissions"));
        setAgentPermissions(permSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Fetch webhooks/permissions:", e);
        // Demo webhooks
        setWebhooks([
          { id: "wh_1", name: "Slack Notifications", url: "https://hooks.slack.com/services/xxx", events: ["ticket_created", "ticket_resolved"], enabled: true, secret: "whsec_demo123", createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "wh_2", name: "Zapier Integration", url: "https://hooks.zapier.com/hooks/catch/xxx", events: ["ticket_created"], enabled: false, secret: "", createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
        ]);
        // Demo webhook logs
        setWebhookLogs([
          { id: "log_1", webhookId: "wh_1", webhookName: "Slack Notifications", event: "ticket_created", status: "success", statusCode: 200, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
          { id: "log_2", webhookId: "wh_1", webhookName: "Slack Notifications", event: "ticket_resolved", status: "success", statusCode: 200, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
          { id: "log_3", webhookId: "wh_2", webhookName: "Zapier Integration", event: "ticket_created", status: "failed", statusCode: 500, error: "Connection timeout", timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
        ]);
        // Demo permissions
        setAgentPermissions([
          { id: "perm_1", agentId: "admin", agentEmail: "admin@dxbanalytics.com", agentName: "Admin", role: "admin" },
          { id: "perm_2", agentId: "agent_1", agentEmail: "ahmed@dxbanalytics.com", agentName: "Ahmed", role: "agent" },
          { id: "perm_3", agentId: "agent_2", agentEmail: "sarah@dxbanalytics.com", agentName: "Sarah", role: "agent" },
          { id: "perm_4", agentId: "viewer_1", agentEmail: "viewer@dxbanalytics.com", agentName: "Viewer", role: "viewer" },
        ]);
      }
    };
    fetchWebhooksAndPermissions();
  }, [db]);

  // Computed stats
  // now already defined above
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress");
  const resolvedToday = tickets.filter(t => t.resolvedAt && new Date(t.resolvedAt) >= todayStart).length;
  const slaBreached = tickets.filter(t => {
    if (t.status === "resolved" || t.status === "closed") return false;
    const created = new Date(t.createdAt);
    return (now.getTime() - created.getTime()) > 24 * 60 * 60 * 1000;
  });
  const unassignedCount = tickets.filter(t => !t.assignedTo && (t.status === "open" || t.status === "in_progress")).length;

  const respondedTickets = tickets.filter(t => t.respondedAt && t.createdAt);
  const avgResponseHrs = respondedTickets.length > 0
    ? Math.round(respondedTickets.reduce((sum, t) => sum + (new Date(t.respondedAt) - new Date(t.createdAt)), 0) / respondedTickets.length / 1000 / 60 / 60 * 10) / 10
    : null;

  // Get all unique tags from tickets
  const allUsedTags = [...new Set(tickets.flatMap(t => t.tags || []))];

  // Phase 4: Analytics Calculations
  const getAnalyticsData = () => {
    const rangeDays = analyticsRange === "7d" ? 7 : analyticsRange === "30d" ? 30 : 90;
    const rangeStart = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    
    // Filter tickets in range
    const rangeTickets = tickets.filter(t => new Date(t.createdAt) >= rangeStart);
    const prevRangeStart = new Date(rangeStart.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    const prevRangeTickets = tickets.filter(t => {
      const created = new Date(t.createdAt);
      return created >= prevRangeStart && created < rangeStart;
    });
    
    // Daily volume data for chart
    const dailyVolume = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayTickets = tickets.filter(t => {
        const created = new Date(t.createdAt);
        return created >= dayStart && created < dayEnd;
      });
      const resolved = tickets.filter(t => {
        if (!t.resolvedAt) return false;
        const resolvedDate = new Date(t.resolvedAt);
        return resolvedDate >= dayStart && resolvedDate < dayEnd;
      });
      dailyVolume.push({
        date: dayStart.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        shortDate: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        created: dayTickets.length,
        resolved: resolved.length,
      });
    }
    
    // Category breakdown
    const categoryBreakdown = categories.map(cat => ({
      ...cat,
      count: rangeTickets.filter(t => t.category === cat.id).length,
      percent: rangeTickets.length > 0 ? Math.round(rangeTickets.filter(t => t.category === cat.id).length / rangeTickets.length * 100) : 0
    })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);
    
    // Priority breakdown
    const priorityBreakdown = [
      { id: "urgent", label: "Urgent", color: T.red, count: rangeTickets.filter(t => t.priority === "urgent").length },
      { id: "high", label: "High", color: T.orange, count: rangeTickets.filter(t => t.priority === "high").length },
      { id: "normal", label: "Normal", color: T.textSecondary, count: rangeTickets.filter(t => !t.priority || t.priority === "normal").length },
    ];
    
    // Status breakdown
    const statusBreakdown = [
      { id: "open", label: "Open", color: T.blue, count: rangeTickets.filter(t => t.status === "open").length },
      { id: "in_progress", label: "In Progress", color: T.orange, count: rangeTickets.filter(t => t.status === "in_progress").length },
      { id: "resolved", label: "Resolved", color: T.green, count: rangeTickets.filter(t => t.status === "resolved").length },
      { id: "closed", label: "Closed", color: T.textMuted, count: rangeTickets.filter(t => t.status === "closed").length },
    ];
    
    // Resolution time buckets
    const resolvedInRange = rangeTickets.filter(t => t.resolvedAt && t.createdAt);
    const resolutionBuckets = [
      { label: "< 4h", color: T.green, count: 0, percent: 0 },
      { label: "4-12h", color: T.teal, count: 0, percent: 0 },
      { label: "12-24h", color: T.orange, count: 0, percent: 0 },
      { label: "> 24h", color: T.red, count: 0, percent: 0 },
    ];
    resolvedInRange.forEach(t => {
      const hours = (new Date(t.resolvedAt) - new Date(t.createdAt)) / 1000 / 60 / 60;
      if (hours < 4) resolutionBuckets[0].count++;
      else if (hours < 12) resolutionBuckets[1].count++;
      else if (hours < 24) resolutionBuckets[2].count++;
      else resolutionBuckets[3].count++;
    });
    resolutionBuckets.forEach(b => {
      b.percent = resolvedInRange.length > 0 ? Math.round(b.count / resolvedInRange.length * 100) : 0;
    });
    
    // SLA compliance
    const slaCompliant = rangeTickets.filter(t => {
      if (!t.resolvedAt) return false;
      const hours = (new Date(t.resolvedAt) - new Date(t.createdAt)) / 1000 / 60 / 60;
      return hours <= slaSettings.defaultHours;
    }).length;
    const slaBreachedCount = rangeTickets.filter(t => {
      if (t.status === "resolved" || t.status === "closed") {
        if (!t.resolvedAt) return false;
        const hours = (new Date(t.resolvedAt) - new Date(t.createdAt)) / 1000 / 60 / 60;
        return hours > slaSettings.defaultHours;
      }
      const hours = (now - new Date(t.createdAt)) / 1000 / 60 / 60;
      return hours > slaSettings.defaultHours;
    }).length;
    const slaPercent = (slaCompliant + slaBreachedCount) > 0 ? Math.round(slaCompliant / (slaCompliant + slaBreachedCount) * 100) : 100;
    
    // Previous period SLA for comparison
    const prevSlaCompliant = prevRangeTickets.filter(t => {
      if (!t.resolvedAt) return false;
      const hours = (new Date(t.resolvedAt) - new Date(t.createdAt)) / 1000 / 60 / 60;
      return hours <= slaSettings.defaultHours;
    }).length;
    const prevSlaBr = prevRangeTickets.filter(t => {
      if (!t.resolvedAt) return false;
      const hours = (new Date(t.resolvedAt) - new Date(t.createdAt)) / 1000 / 60 / 60;
      return hours > slaSettings.defaultHours;
    }).length;
    const prevSlaPercent = (prevSlaCompliant + prevSlaBr) > 0 ? Math.round(prevSlaCompliant / (prevSlaCompliant + prevSlaBr) * 100) : 100;
    
    // Volume change
    const volumeChange = prevRangeTickets.length > 0 
      ? Math.round((rangeTickets.length - prevRangeTickets.length) / prevRangeTickets.length * 100) 
      : 0;
    
    // Avg resolution time
    const avgResolutionHrs = resolvedInRange.length > 0
      ? Math.round(resolvedInRange.reduce((sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0) / resolvedInRange.length / 1000 / 60 / 60 * 10) / 10
      : null;
    
    // Phase 4B: Agent Performance
    const agentMap = {};
    rangeTickets.forEach(t => {
      if (t.assignedTo) {
        if (!agentMap[t.assignedTo]) {
          agentMap[t.assignedTo] = {
            id: t.assignedTo,
            name: t.assignedToName || t.assignedTo,
            assigned: 0,
            resolved: 0,
            totalResolutionTime: 0,
            slaCompliant: 0,
            slaBreach: 0,
          };
        }
        agentMap[t.assignedTo].assigned++;
        
        if (t.resolvedAt) {
          agentMap[t.assignedTo].resolved++;
          const hours = (new Date(t.resolvedAt) - new Date(t.createdAt)) / 1000 / 60 / 60;
          agentMap[t.assignedTo].totalResolutionTime += hours;
          if (hours <= slaSettings.defaultHours) {
            agentMap[t.assignedTo].slaCompliant++;
          } else {
            agentMap[t.assignedTo].slaBreach++;
          }
        }
      }
    });
    
    const agentPerformance = Object.values(agentMap).map(agent => ({
      ...agent,
      avgResolution: agent.resolved > 0 ? Math.round(agent.totalResolutionTime / agent.resolved * 10) / 10 : null,
      slaPercent: (agent.slaCompliant + agent.slaBreach) > 0 
        ? Math.round(agent.slaCompliant / (agent.slaCompliant + agent.slaBreach) * 100) 
        : 100,
      resolutionRate: agent.assigned > 0 ? Math.round(agent.resolved / agent.assigned * 100) : 0,
    })).sort((a, b) => b.resolved - a.resolved);
    
    // SLA Trend (daily compliance %)
    const slaTrend = [];
    for (let i = Math.min(rangeDays, 14) - 1; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayResolved = tickets.filter(t => {
        if (!t.resolvedAt) return false;
        const resolved = new Date(t.resolvedAt);
        return resolved >= dayStart && resolved < dayEnd;
      });
      const dayCompliant = dayResolved.filter(t => {
        const hours = (new Date(t.resolvedAt) - new Date(t.createdAt)) / 1000 / 60 / 60;
        return hours <= slaSettings.defaultHours;
      }).length;
      slaTrend.push({
        date: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        compliance: dayResolved.length > 0 ? Math.round(dayCompliant / dayResolved.length * 100) : 100,
        resolved: dayResolved.length,
      });
    }
    
    // Workload distribution (current open tickets per agent)
    const workloadMap = {};
    tickets.filter(t => t.status === "open" || t.status === "in_progress").forEach(t => {
      const agentId = t.assignedTo || "unassigned";
      const agentName = t.assignedToName || (agentId === "unassigned" ? "Unassigned" : agentId);
      if (!workloadMap[agentId]) {
        workloadMap[agentId] = { id: agentId, name: agentName, count: 0 };
      }
      workloadMap[agentId].count++;
    });
    const workloadDistribution = Object.values(workloadMap).sort((a, b) => b.count - a.count);
    
    // Phase 5A: CSAT Analytics
    const rangeCSAT = csatRatings.filter(c => new Date(c.createdAt) >= rangeStart);
    const prevRangeCSAT = csatRatings.filter(c => {
      const created = new Date(c.createdAt);
      return created >= prevRangeStart && created < rangeStart;
    });
    
    // Average CSAT score
    const avgCsat = rangeCSAT.length > 0 
      ? Math.round(rangeCSAT.reduce((sum, c) => sum + c.rating, 0) / rangeCSAT.length * 10) / 10 
      : null;
    const prevAvgCsat = prevRangeCSAT.length > 0 
      ? Math.round(prevRangeCSAT.reduce((sum, c) => sum + c.rating, 0) / prevRangeCSAT.length * 10) / 10 
      : null;
    const csatChange = avgCsat && prevAvgCsat ? Math.round((avgCsat - prevAvgCsat) * 10) / 10 : 0;
    
    // CSAT response rate (ratings received / resolved tickets)
    const csatResponseRate = resolvedInRange.length > 0 
      ? Math.round(rangeCSAT.length / resolvedInRange.length * 100) 
      : 0;
    
    // Rating distribution
    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: rangeCSAT.filter(c => c.rating === rating).length,
      percent: rangeCSAT.length > 0 ? Math.round(rangeCSAT.filter(c => c.rating === rating).length / rangeCSAT.length * 100) : 0,
      color: rating >= 4 ? T.green : rating === 3 ? T.orange : T.red,
    }));
    
    // Agent CSAT scores
    const agentCsatMap = {};
    rangeCSAT.forEach(c => {
      if (c.agentId) {
        if (!agentCsatMap[c.agentId]) {
          agentCsatMap[c.agentId] = { id: c.agentId, name: c.agentName || c.agentId, ratings: [], comments: [] };
        }
        agentCsatMap[c.agentId].ratings.push(c.rating);
        if (c.comment) agentCsatMap[c.agentId].comments.push({ text: c.comment, rating: c.rating, date: c.createdAt });
      }
    });
    const agentCsat = Object.values(agentCsatMap).map(agent => ({
      ...agent,
      avgRating: Math.round(agent.ratings.reduce((sum, r) => sum + r, 0) / agent.ratings.length * 10) / 10,
      totalRatings: agent.ratings.length,
      recentComment: agent.comments.sort((a, b) => new Date(b.date) - new Date(a.date))[0],
    })).sort((a, b) => b.avgRating - a.avgRating);
    
    // CSAT trend (daily average)
    const csatTrend = [];
    for (let i = Math.min(rangeDays, 14) - 1; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayRatings = csatRatings.filter(c => {
        const created = new Date(c.createdAt);
        return created >= dayStart && created < dayEnd;
      });
      const dayAvg = dayRatings.length > 0 
        ? Math.round(dayRatings.reduce((sum, c) => sum + c.rating, 0) / dayRatings.length * 10) / 10 
        : null;
      csatTrend.push({
        date: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        avgRating: dayAvg,
        count: dayRatings.length,
      });
    }
    
    // Recent feedback (with comments)
    const recentFeedback = rangeCSAT
      .filter(c => c.comment)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
    
    return {
      total: rangeTickets.length,
      volumeChange,
      dailyVolume,
      categoryBreakdown,
      priorityBreakdown,
      statusBreakdown,
      resolutionBuckets,
      slaPercent,
      slaChange: slaPercent - prevSlaPercent,
      avgResolutionHrs,
      resolvedCount: resolvedInRange.length,
      agentPerformance,
      slaTrend,
      workloadDistribution,
      // CSAT data
      avgCsat,
      csatChange,
      csatResponseRate,
      totalRatings: rangeCSAT.length,
      ratingDistribution,
      agentCsat,
      csatTrend,
      recentFeedback,
    };
  };
  
  const analytics = getAnalyticsData();
  // Filter tickets (including custom field filter)
  const filteredTickets = tickets.filter(t => {
    if (supportSubTab === "open" && t.status !== "open" && t.status !== "in_progress") return false;
    if (supportSubTab === "resolved" && t.status !== "resolved" && t.status !== "closed") return false;
    if (ticketFilter !== "all" && t.category !== ticketFilter) return false;
    if (ticketPriorityFilter !== "all" && t.priority !== ticketPriorityFilter) return false;
    if (tagFilter !== "all" && !(t.tags || []).includes(tagFilter)) return false;
    // Channel filter
    if (channelFilter !== "all") {
      const ticketChannel = t.channel || "email";
      if (ticketChannel !== channelFilter) return false;
    }
    if (assignmentFilter !== "all") {
      if (assignmentFilter === "unassigned" && t.assignedTo) return false;
      if (assignmentFilter !== "unassigned" && t.assignedTo !== assignmentFilter) return false;
    }
    // Custom field filter
    if (customFieldFilter.fieldId && customFieldFilter.value) {
      const ticketFieldValue = (t.customFields || {})[customFieldFilter.fieldId];
      if (!ticketFieldValue || !ticketFieldValue.toLowerCase().includes(customFieldFilter.value.toLowerCase())) return false;
    }
    if (ticketSearch) {
      const s = ticketSearch.toLowerCase();
      if (!((t.subject || "").toLowerCase().includes(s) || (t.userEmail || "").toLowerCase().includes(s) || (t.userName || "").toLowerCase().includes(s))) return false;
    }
    return true;
  });

  // Update ticket status
  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const update = { status: newStatus, updatedAt: new Date().toISOString() };
      if (newStatus === "resolved") update.resolvedAt = new Date().toISOString();
      await setDoc(doc(db, "supportTickets", ticketId), update, { merge: true });
      const updatedTicket = { ...(tickets.find(t => t.id === ticketId) || ticketDrawer), ...update };
      setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
      if (ticketDrawer?.id === ticketId) setTicketDrawer(updatedTicket);
      notify(`Ticket marked as ${newStatus}`);
      
      // Execute workflow triggers for status change
      executeWorkflowActions(updatedTicket, "status_change", newStatus);
      
      if (newStatus === "resolved" && ticketDrawer) {
        try {
          await emailjs.send("service_da7nshv", "template_gl1xqhy", {
            to_email: ticketDrawer.userEmail,
            to_name: ticketDrawer.userName || ticketDrawer.userEmail,
            subject: `Your support ticket has been resolved: ${ticketDrawer.subject}`,
            message: `Hi ${ticketDrawer.userName || "there"},\n\nYour support ticket "${ticketDrawer.subject}" has been marked as resolved.\n\nIf you have any further questions, feel free to reply to this email or open a new ticket.\n\nBest regards,\nDXB Analytics Support`,
            project_name: "DXB Analytics",
          }, "USkwUhp0csGCVDkdQ");
        } catch (e) { console.error("Email failed:", e); }
      }
    } catch (e) { notify("Error: " + e.message); }
  };

  // Update ticket priority
  const updateTicketPriority = async (ticketId, newPriority) => {
    try {
      await setDoc(doc(db, "supportTickets", ticketId), { priority: newPriority, updatedAt: new Date().toISOString() }, { merge: true });
      const updatedTicket = { ...(tickets.find(t => t.id === ticketId) || ticketDrawer), priority: newPriority };
      setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
      if (ticketDrawer?.id === ticketId) setTicketDrawer(updatedTicket);
      notify(`Priority set to ${newPriority}`);
      
      // Execute workflow triggers for priority change
      executeWorkflowActions(updatedTicket, "priority_change", newPriority);
    } catch (e) { notify("Error: " + e.message); }
  };

  // Assign ticket
  const assignTicket = async (ticketId, agentId, agentName) => {
    try {
      const update = { assignedTo: agentId === "unassigned" ? null : agentId, assignedToName: agentId === "unassigned" ? null : agentName, updatedAt: new Date().toISOString() };
      await setDoc(doc(db, "supportTickets", ticketId), update, { merge: true });
      const updatedTicket = { ...(tickets.find(t => t.id === ticketId) || ticketDrawer), ...update };
      setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
      if (ticketDrawer?.id === ticketId) setTicketDrawer(updatedTicket);
      notify(agentId === "unassigned" ? "Ticket unassigned" : `Assigned to ${agentName}`);
      
      // Execute workflow triggers for assignment
      if (agentId !== "unassigned") {
        executeWorkflowActions(updatedTicket, "assigned", agentId);
      }
    } catch (e) { notify("Error: " + e.message); }
  };

  // Add tag
  const addTag = async (ticketId, tagId) => {
    const ticket = tickets.find(t => t.id === ticketId) || ticketDrawer;
    if (!ticket) return;
    const currentTags = ticket.tags || [];
    if (currentTags.includes(tagId)) return;
    const newTags = [...currentTags, tagId];
    try {
      await setDoc(doc(db, "supportTickets", ticketId), { tags: newTags, updatedAt: new Date().toISOString() }, { merge: true });
      const updatedTicket = { ...ticket, tags: newTags };
      setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
      if (ticketDrawer?.id === ticketId) setTicketDrawer(updatedTicket);
      notify(`Tag added: ${tagId}`);
      
      // Execute workflow triggers for tag added
      executeWorkflowActions(updatedTicket, "tag_added", tagId);
    } catch (e) { notify("Error: " + e.message); }
  };

  // Remove tag
  const removeTag = async (ticketId, tagId) => {
    const ticket = tickets.find(t => t.id === ticketId) || ticketDrawer;
    if (!ticket) return;
    const newTags = (ticket.tags || []).filter(t => t !== tagId);
    try {
      await setDoc(doc(db, "supportTickets", ticketId), { tags: newTags, updatedAt: new Date().toISOString() }, { merge: true });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, tags: newTags } : t));
      if (ticketDrawer?.id === ticketId) setTicketDrawer(prev => ({ ...prev, tags: newTags }));
      notify(`Tag removed`);
    } catch (e) { notify("Error: " + e.message); }
  };

  // Send internal note with @mentions
  const sendInternalNote = async () => {
    if (!internalNote.trim() || !ticketDrawer) return;
    setSendingNote(true);
    try {
      // Parse @mentions
      const mentionRegex = /@(\w+)/g;
      const mentions = [...internalNote.matchAll(mentionRegex)].map(m => m[1]);
      const newNote = { 
        text: internalNote, 
        by: adminUser?.email || "admin", 
        at: new Date().toISOString(),
        mentions: mentions.length > 0 ? mentions : undefined
      };
      const internalNotes = [...(ticketDrawer.internalNotes || []), newNote];
      await setDoc(doc(db, "supportTickets", ticketDrawer.id), { internalNotes, updatedAt: new Date().toISOString() }, { merge: true });
      setTickets(prev => prev.map(t => t.id === ticketDrawer.id ? { ...t, internalNotes } : t));
      setTicketDrawer(prev => ({ ...prev, internalNotes }));
      setInternalNote("");
      setShowMentionDropdown(false);
      // Notify mentioned users (would integrate with notification system)
      if (mentions.length > 0) {
        notify(`Internal note added, mentioned: ${mentions.join(", ")}`);
      } else {
        notify("Internal note added");
      }
    } catch (e) { notify("Error: " + e.message); }
    setSendingNote(false);
  };

  // Phase 1B: Collision Detection - Track who's viewing a ticket
  useEffect(() => {
    if (!ticketDrawer || !adminUser) return;
    
    const presenceRef = doc(db, "ticketPresence", ticketDrawer.id);
    const myId = adminUser.uid || adminUser.email;
    const myName = adminUser.displayName || adminUser.email?.split("@")[0] || "Admin";
    
    // Add self to viewing list
    const updatePresence = async () => {
      try {
        const snap = await getDoc(presenceRef);
        const current = snap.exists() ? snap.data().viewers || [] : [];
        const filtered = current.filter(v => v.id !== myId && (Date.now() - new Date(v.at).getTime()) < 60000); // Remove stale (>60s)
        const updated = [...filtered, { id: myId, name: myName, at: new Date().toISOString() }];
        await setDoc(presenceRef, { viewers: updated, ticketId: ticketDrawer.id }, { merge: true });
      } catch (e) { console.error("Presence update failed:", e); }
    };
    
    updatePresence();
    const interval = setInterval(updatePresence, 30000); // Heartbeat every 30s
    
    // Listen for other viewers
    const unsubscribe = onSnapshot(presenceRef, (snap) => {
      if (snap.exists()) {
        const viewers = snap.data().viewers || [];
        const others = viewers.filter(v => v.id !== myId && (Date.now() - new Date(v.at).getTime()) < 60000);
        setViewingAdmins(others);
      }
    });
    
    // Cleanup on drawer close
    return () => {
      clearInterval(interval);
      unsubscribe();
      // Remove self from viewing list
      (async () => {
        try {
          const snap = await getDoc(presenceRef);
          if (snap.exists()) {
            const current = snap.data().viewers || [];
            const filtered = current.filter(v => v.id !== myId);
            await setDoc(presenceRef, { viewers: filtered }, { merge: true });
          }
        } catch (e) { console.error("Presence cleanup failed:", e); }
      })();
    };
  }, [ticketDrawer?.id, adminUser, db]);

  // Phase 1B: File Upload Handler
  const handleFileUpload = async (e, isInternalNote = false) => {
    const file = e.target.files?.[0];
    if (!file || !ticketDrawer) return;
    
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    
    if (file.size > maxSize) {
      notify("File too large (max 10MB)");
      return;
    }
    
    if (!allowedTypes.includes(file.type) && !file.type.startsWith("image/")) {
      notify("File type not supported");
      return;
    }
    
    setUploading(true);
    try {
      // Upload to Firebase Storage
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = `support-attachments/${ticketDrawer.id}/${timestamp}_${safeName}`;
      const storageRef = ref(storage, path);
      
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      const attachment = {
        name: file.name,
        url: downloadUrl,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: adminUser?.email || "admin"
      };
      
      if (isInternalNote) {
        // Add to internal notes as attachment
        const newNote = {
          text: `≡ƒôÄ Attached file: ${file.name}`,
          by: adminUser?.email || "admin",
          at: new Date().toISOString(),
          attachment
        };
        const internalNotes = [...(ticketDrawer.internalNotes || []), newNote];
        await setDoc(doc(db, "supportTickets", ticketDrawer.id), { internalNotes, updatedAt: new Date().toISOString() }, { merge: true });
        setTickets(prev => prev.map(t => t.id === ticketDrawer.id ? { ...t, internalNotes } : t));
        setTicketDrawer(prev => ({ ...prev, internalNotes }));
      } else {
        // Add to public messages
        const newMessage = {
          from: "admin",
          text: `≡ƒôÄ Attached file: ${file.name}`,
          at: new Date().toISOString(),
          by: adminUser?.email || "admin",
          attachment
        };
        const messages = [...(ticketDrawer.messages || []), newMessage];
        const update = { messages, updatedAt: new Date().toISOString() };
        await setDoc(doc(db, "supportTickets", ticketDrawer.id), update, { merge: true });
        setTickets(prev => prev.map(t => t.id === ticketDrawer.id ? { ...t, ...update } : t));
        setTicketDrawer(prev => ({ ...prev, ...update }));
      }
      
      notify(`File uploaded: ${file.name}`);
    } catch (e) {
      console.error("Upload failed:", e);
      notify("Upload failed: " + e.message);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Phase 1B: @Mention handlers
  const handleNoteKeyDown = (e) => {
    if (e.key === "@") {
      setShowMentionDropdown(true);
      setMentionSearch("");
    } else if (showMentionDropdown) {
      if (e.key === "Escape") {
        setShowMentionDropdown(false);
      }
    }
  };

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setInternalNote(val);
    
    // Check if we're in a mention
    const lastAtIndex = val.lastIndexOf("@");
    if (lastAtIndex !== -1 && lastAtIndex >= val.length - 20) {
      const afterAt = val.slice(lastAtIndex + 1);
      if (!afterAt.includes(" ")) {
        setShowMentionDropdown(true);
        setMentionSearch(afterAt.toLowerCase());
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  const insertMention = (name) => {
    const lastAtIndex = internalNote.lastIndexOf("@");
    const newText = internalNote.slice(0, lastAtIndex) + `@${name} `;
    setInternalNote(newText);
    setShowMentionDropdown(false);
    noteInputRef.current?.focus();
  };

  // Get mentionable team members
  const mentionableUsers = [
    { id: "dev", name: "dev", label: "Development Team" },
    { id: "support", name: "support", label: "Support Team" },
    { id: "billing", name: "billing", label: "Billing Team" },
    ...assignableAgents.filter(a => a.id !== "unassigned").map(a => ({ id: a.id, name: a.name.toLowerCase().replace(/\s+/g, ""), label: a.name }))
  ].filter(u => !mentionSearch || u.name.includes(mentionSearch) || u.label.toLowerCase().includes(mentionSearch));

  // Render text with @mentions highlighted
  const renderTextWithMentions = (text) => {
    if (!text) return null;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} style={{ color: T.teal, fontWeight: 600 }}>{part}</span>;
      }
      return part;
    });
  };

  // Send reply
  const sendReply = async () => {
    if (!ticketReply.trim() || !ticketDrawer) return;
    setTicketReplying(true);
    try {
      const newMessage = { from: "admin", text: ticketReply, at: new Date().toISOString(), by: adminUser?.email || "admin" };
      const messages = [...(ticketDrawer.messages || []), newMessage];
      const update = {
        messages,
        status: ticketDrawer.status === "open" ? "in_progress" : ticketDrawer.status,
        updatedAt: new Date().toISOString(),
        respondedAt: ticketDrawer.respondedAt || new Date().toISOString(),
      };
      await setDoc(doc(db, "supportTickets", ticketDrawer.id), update, { merge: true });
      setTickets(prev => prev.map(t => t.id === ticketDrawer.id ? { ...t, ...update } : t));
      setTicketDrawer(prev => ({ ...prev, ...update }));
      try {
        await emailjs.send("service_da7nshv", "template_gl1xqhy", {
          to_email: ticketDrawer.userEmail,
          to_name: ticketDrawer.userName || ticketDrawer.userEmail,
          subject: `Re: ${ticketDrawer.subject}`,
          message: `Hi ${ticketDrawer.userName || "there"},\n\n${ticketReply}\n\n---\nDXB Analytics Support`,
          project_name: "DXB Analytics",
        }, "USkwUhp0csGCVDkdQ");
      } catch (e) { console.error("Email failed:", e); }
      await logAudit(db, { action: "ticket_replied", ticketId: ticketDrawer.id, userId: ticketDrawer.userId });
      setTicketReply("");
      notify("Reply sent!");
    } catch (e) { notify("Error: " + e.message); }
    setTicketReplying(false);
  };

  const insertTemplate = (text) => { setTicketReply(text); setShowTemplates(false); };
  const insertNoteTemplate = (text) => { setInternalNote(text); };
  const timeAgo = (date) => {
    if (!date) return "—";
    const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };
  const isSlaBreached = (ticket) => {
    if (ticket.status === "resolved" || ticket.status === "closed") return false;
    return (now.getTime() - new Date(ticket.createdAt).getTime()) > 24 * 60 * 60 * 1000;
  };

  // Phase 8A: Time Tracking Functions
  const formatTimerDisplay = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startTimer = (ticketId) => {
    if (activeTimer) {
      notify("Stop current timer first");
      return;
    }
    const agentName = adminUser?.displayName || adminUser?.email?.split("@")[0] || "Admin";
    setActiveTimer({
      ticketId,
      startedAt: new Date().toISOString(),
      agentId: adminUser?.uid || "admin",
      agentName
    });
    notify("Timer started");
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    const started = new Date(activeTimer.startedAt).getTime();
    const durationMins = Math.max(1, Math.round((Date.now() - started) / 60000));
    
    try {
      const entryId = `time_${Date.now()}`;
      const entry = {
        ticketId: activeTimer.ticketId,
        agentId: activeTimer.agentId,
        agentName: activeTimer.agentName,
        duration: durationMins,
        notes: "Timer session",
        billable: true,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "supportTimeEntries", entryId), entry);
      setTimeEntries(prev => [{ id: entryId, ...entry }, ...prev]);
      
      // Log to audit
      const auditId = `audit_${Date.now()}`;
      const auditEntry = {
        ticketId: activeTimer.ticketId,
        action: "time_logged",
        actor: "agent",
        actorName: activeTimer.agentName,
        details: { duration: durationMins, billable: true, method: "timer" },
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, "supportTicketAudit", auditId), auditEntry);
      setTicketAuditLogs(prev => [{ id: auditId, ...auditEntry }, ...prev]);
      
      notify(`Logged ${durationMins} minutes`);
    } catch (e) {
      console.error("Stop timer error:", e);
      notify("Error logging time");
    }
    setActiveTimer(null);
  };

  const addManualTimeEntry = async () => {
    if (!timeEntryForm.ticketId || timeEntryForm.duration <= 0) {
      notify("Select a ticket and enter duration");
      return;
    }
    
    try {
      const agentName = adminUser?.displayName || adminUser?.email?.split("@")[0] || "Admin";
      const entryId = `time_${Date.now()}`;
      const entry = {
        ticketId: timeEntryForm.ticketId,
        agentId: adminUser?.uid || "admin",
        agentName,
        duration: timeEntryForm.duration,
        notes: timeEntryForm.notes || "Manual entry",
        billable: timeEntryForm.billable,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "supportTimeEntries", entryId), entry);
      setTimeEntries(prev => [{ id: entryId, ...entry }, ...prev]);
      
      // Log to audit
      const auditId = `audit_${Date.now()}`;
      const auditEntry = {
        ticketId: timeEntryForm.ticketId,
        action: "time_logged",
        actor: "agent",
        actorName: agentName,
        details: { duration: timeEntryForm.duration, billable: timeEntryForm.billable, method: "manual" },
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, "supportTicketAudit", auditId), auditEntry);
      setTicketAuditLogs(prev => [{ id: auditId, ...auditEntry }, ...prev]);
      
      setShowTimeEntryModal(false);
      setTimeEntryForm({ ticketId: "", duration: 15, notes: "", billable: true });
      notify("Time entry added");
    } catch (e) {
      console.error("Manual time entry error:", e);
      notify("Error adding time entry");
    }
  };

  const logTicketAudit = async (ticketId, action, details) => {
    try {
      const agentName = adminUser?.displayName || adminUser?.email?.split("@")[0] || "Admin";
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const auditEntry = {
        ticketId,
        action,
        actor: "agent",
        actorName: agentName,
        details,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, "supportTicketAudit", auditId), auditEntry);
      setTicketAuditLogs(prev => [{ id: auditId, ...auditEntry }, ...prev]);
    } catch (e) {
      console.error("Audit log error:", e);
    }
  };

  const getTicketTimeTotal = (ticketId) => {
    return timeEntries.filter(e => e.ticketId === ticketId).reduce((sum, e) => sum + (e.duration || 0), 0);
  };

  const getAgentTimeStats = () => {
    const stats = {};
    timeEntries.forEach(e => {
      if (!stats[e.agentName]) {
        stats[e.agentName] = { total: 0, billable: 0, entries: 0 };
      }
      stats[e.agentName].total += e.duration || 0;
      stats[e.agentName].entries += 1;
      if (e.billable) stats[e.agentName].billable += e.duration || 0;
    });
    return Object.entries(stats).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.total - a.total);
  };

  const getAuditActionLabel = (action) => {
    const labels = {
      created: "Ticket Created",
      status_change: "Status Changed",
      assigned: "Assigned",
      unassigned: "Unassigned",
      reply_sent: "Reply Sent",
      note_added: "Note Added",
      tag_added: "Tag Added",
      tag_removed: "Tag Removed",
      priority_change: "Priority Changed",
      merged: "Merged",
      linked: "Linked",
      time_logged: "Time Logged",
      escalated: "Escalated",
      sla_breach: "SLA Breached",
      attachment_added: "Attachment Added",
      custom_field_updated: "Field Updated"
    };
    return labels[action] || action;
  };

  const getAuditActionColor = (action) => {
    const colors = {
      created: T.green,
      status_change: T.blue,
      assigned: T.purple,
      unassigned: T.textMuted,
      reply_sent: T.teal,
      note_added: T.orange,
      tag_added: T.cyan,
      tag_removed: T.textMuted,
      priority_change: T.orange,
      merged: T.purple,
      linked: T.blue,
      time_logged: T.gold,
      escalated: T.red,
      sla_breach: T.red,
      attachment_added: T.blue,
      custom_field_updated: T.cyan
    };
    return colors[action] || T.textMuted;
  };

  // Phase 8B: Webhook Functions
  const webhookEvents = [
    { id: "ticket_created", label: "Ticket Created", icon: "≡ƒô¥" },
    { id: "ticket_resolved", label: "Ticket Resolved", icon: "Γ£à" },
    { id: "ticket_assigned", label: "Ticket Assigned", icon: "≡ƒæñ" },
    { id: "sla_breach", label: "SLA Breached", icon: "ΓÅ░" },
    { id: "reply_sent", label: "Reply Sent", icon: "≡ƒÆ¼" },
   { id: "priority_changed", label: "Priority Changed", icon: "≡ƒö┤" },
  ];

  const saveWebhook = async () => {
    if (!webhookForm.name || !webhookForm.url) {
      notify("Name and URL are required");
      return;
    }
    try {
      const webhookId = editingWebhook?.id || `wh_${Date.now()}`;
      const webhookData = {
        ...webhookForm,
        updatedAt: new Date().toISOString(),
        createdAt: editingWebhook?.createdAt || new Date().toISOString()
      };
      await setDoc(doc(db, "supportWebhooks", webhookId), webhookData);
      
      if (editingWebhook) {
        setWebhooks(prev => prev.map(w => w.id === webhookId ? { id: webhookId, ...webhookData } : w));
      } else {
        setWebhooks(prev => [...prev, { id: webhookId, ...webhookData }]);
      }
      
      setShowWebhookModal(false);
      setEditingWebhook(null);
      setWebhookForm({ name: "", url: "", events: ["ticket_created"], enabled: true, secret: "" });
      notify(editingWebhook ? "Webhook updated" : "Webhook created");
    } catch (e) {
      console.error("Save webhook error:", e);
      notify("Error saving webhook");
    }
  };

  const deleteWebhook = async (webhookId) => {
    if (!window.confirm("Delete this webhook?")) return;
    try {
      await deleteDoc(doc(db, "supportWebhooks", webhookId));
      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
      notify("Webhook deleted");
    } catch (e) {
      console.error("Delete webhook error:", e);
      notify("Error deleting webhook");
    }
  };

  const testWebhook = async (webhook) => {
    setTestingWebhook(webhook.id);
    try {
      // Simulate webhook test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const logEntry = {
        webhookId: webhook.id,
        webhookName: webhook.name,
        event: "test",
        status: Math.random() > 0.2 ? "success" : "failed",
        statusCode: Math.random() > 0.2 ? 200 : 500,
        timestamp: new Date().toISOString()
      };
      
      const logId = `log_${Date.now()}`;
      await setDoc(doc(db, "supportWebhookLogs", logId), logEntry);
      setWebhookLogs(prev => [{ id: logId, ...logEntry }, ...prev]);
      
      notify(logEntry.status === "success" ? "Webhook test successful!" : "Webhook test failed");
    } catch (e) {
      console.error("Test webhook error:", e);
      notify("Error testing webhook");
    }
    setTestingWebhook(null);
  };

  const triggerWebhook = async (event, data) => {
    const activeWebhooks = webhooks.filter(w => w.enabled && w.events.includes(event));
    for (const webhook of activeWebhooks) {
      try {
        // In production, this would call the actual webhook URL
        const logEntry = {
          webhookId: webhook.id,
          webhookName: webhook.name,
          event,
          status: "success",
          statusCode: 200,
          payload: JSON.stringify(data).slice(0, 500),
          timestamp: new Date().toISOString()
        };
        const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        await setDoc(doc(db, "supportWebhookLogs", logId), logEntry);
        setWebhookLogs(prev => [{ id: logId, ...logEntry }, ...prev.slice(0, 99)]);
      } catch (e) {
        console.error("Webhook trigger error:", e);
      }
    }
  };

  // Phase 8B: Export Functions
  const exportTickets = async () => {
    setExporting(true);
    try {
      let ticketsToExport = [...tickets];
      
      // Apply filters
      if (exportConfig.dateRange !== "all") {
        const days = exportConfig.dateRange === "7d" ? 7 : exportConfig.dateRange === "30d" ? 30 : 90;
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        ticketsToExport = ticketsToExport.filter(t => new Date(t.createdAt) >= cutoff);
      }
      
      if (exportConfig.status !== "all") {
        ticketsToExport = ticketsToExport.filter(t => t.status === exportConfig.status);
      }
      
      if (exportConfig.format === "csv") {
        // Build CSV
        const headers = ["ID", "Subject", "Status", "Priority", "Category", "User", "Email", "Assigned To", "Created", "Resolved"];
        if (exportConfig.includeMessages) headers.push("Messages");
        if (exportConfig.includeNotes) headers.push("Internal Notes");
        if (exportConfig.includeTime) headers.push("Time Logged (min)");
        
        const rows = ticketsToExport.map(t => {
          const row = [
            t.id,
            `"${(t.subject || "").replace(/"/g, '""')}"`,
            t.status,
            t.priority || "normal",
            t.category || "",
            t.userName || "",
            t.userEmail || "",
            t.assignedToName || "Unassigned",
            t.createdAt || "",
            t.resolvedAt || ""
          ];
          if (exportConfig.includeMessages) {
            row.push(`"${(t.messages || []).map(m => `${m.from}: ${m.text}`).join(" | ").replace(/"/g, '""')}"`);
          }
          if (exportConfig.includeNotes) {
            row.push(`"${(t.internalNotes || []).map(n => n.text).join(" | ").replace(/"/g, '""')}"`);
          }
          if (exportConfig.includeTime) {
            row.push(getTicketTimeTotal(t.id));
          }
          return row.join(",");
        });
        
        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tickets_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // JSON export
        const exportData = ticketsToExport.map(t => {
          const data = { ...t };
          if (!exportConfig.includeMessages) delete data.messages;
          if (!exportConfig.includeNotes) delete data.internalNotes;
          if (exportConfig.includeTime) {
            data.timeLogged = getTicketTimeTotal(t.id);
            data.timeEntries = timeEntries.filter(e => e.ticketId === t.id);
          }
          return data;
        });
        
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tickets_export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      await logTicketAudit("export", "tickets_exported", { count: ticketsToExport.length, format: exportConfig.format });
      setShowExportModal(false);
      notify(`Exported ${ticketsToExport.length} tickets`);
    } catch (e) {
      console.error("Export error:", e);
      notify("Error exporting tickets");
    }
    setExporting(false);
  };

  const exportTimeEntries = () => {
    const csv = [
      ["Ticket ID", "Agent", "Duration (min)", "Billable", "Notes", "Date"].join(","),
      ...timeEntries.map(e => [
        e.ticketId,
        e.agentName,
        e.duration,
        e.billable ? "Yes" : "No",
        `"${(e.notes || "").replace(/"/g, '""')}"`,
        e.createdAt
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `time_entries_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${timeEntries.length} time entries`);
  };

  const exportAuditLogs = () => {
    const json = JSON.stringify(ticketAuditLogs, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${ticketAuditLogs.length} audit logs`);
  };

  // Phase 8B: Permissions Functions
  const permissionRoles = [
    { id: "admin", label: "Admin", color: T.gold, desc: "Full access: delete, assign, manage settings" },
    { id: "agent", label: "Agent", color: T.teal, desc: "Reply, assign to self, change status" },
    { id: "viewer", label: "Viewer", color: T.textMuted, desc: "Read-only access to tickets" },
  ];

  const savePermission = async () => {
    if (!permissionForm.agentId) {
      notify("Select an agent");
      return;
    }
    try {
      const agent = assignableAgents.find(a => a.id === permissionForm.agentId);
      const permId = editingPermission?.id || `perm_${Date.now()}`;
      const permData = {
        agentId: permissionForm.agentId,
        agentEmail: agent?.email || "",
        agentName: agent?.name || "",
        role: permissionForm.role,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, "supportAgentPermissions", permId), permData);
      
      if (editingPermission) {
        setAgentPermissions(prev => prev.map(p => p.id === permId ? { id: permId, ...permData } : p));
      } else {
        setAgentPermissions(prev => [...prev, { id: permId, ...permData }]);
      }
      
      setShowPermissionsModal(false);
      setEditingPermission(null);
      setPermissionForm({ agentId: "", role: "agent" });
      notify("Permission saved");
    } catch (e) {
      console.error("Save permission error:", e);
      notify("Error saving permission");
    }
  };

  const deletePermission = async (permId) => {
    if (!window.confirm("Remove this permission?")) return;
    try {
      await deleteDoc(doc(db, "supportAgentPermissions", permId));
      setAgentPermissions(prev => prev.filter(p => p.id !== permId));
      notify("Permission removed");
    } catch (e) {
      console.error("Delete permission error:", e);
      notify("Error removing permission");
    }
  };

  const getAgentRole = (agentId) => {
    const perm = agentPermissions.find(p => p.agentId === agentId);
    return perm?.role || "agent";
  };

  const canPerformAction = (action) => {
    const myRole = getAgentRole(adminUser?.uid || "admin");
    const permissions = {
      admin: ["view", "reply", "assign", "delete", "settings", "export", "webhooks", "permissions"],
      agent: ["view", "reply", "assign_self", "status"],
      viewer: ["view"]
    };
    return permissions[myRole]?.includes(action) || myRole === "admin";
  };

  // Phase 2: Merge Tickets - Combine duplicate tickets
  const mergeTickets = async () => {
    if (!ticketDrawer || !mergeTargetId || mergeTargetId === ticketDrawer.id) {
      notify("Please select a different ticket to merge into");
      return;
    }
    
    setMerging(true);
    try {
      const targetTicket = tickets.find(t => t.id === mergeTargetId);
      if (!targetTicket) {
        notify("Target ticket not found");
        setMerging(false);
        return;
      }
      
      // Combine messages from both tickets
      const combinedMessages = [
        ...(targetTicket.messages || []),
        { from: "system", text: `--- Merged from ticket: ${ticketDrawer.subject} ---`, at: new Date().toISOString() },
        ...(ticketDrawer.messages || [])
      ].sort((a, b) => new Date(a.at) - new Date(b.at));
      
      // Combine internal notes
      const combinedNotes = [
        ...(targetTicket.internalNotes || []),
        { text: `Merged ticket "${ticketDrawer.subject}" (${ticketDrawer.id}) into this ticket`, by: adminUser?.email || "admin", at: new Date().toISOString() },
        ...(ticketDrawer.internalNotes || [])
      ];
      
      // Combine tags (unique)
      const combinedTags = [...new Set([...(targetTicket.tags || []), ...(ticketDrawer.tags || [])])];
      
      // Add link to merged ticket
      const linkedTickets = [...(targetTicket.linkedTickets || []), { id: ticketDrawer.id, type: "merged", subject: ticketDrawer.subject }];
      
      // Update target ticket
      const targetUpdate = {
        messages: combinedMessages,
        internalNotes: combinedNotes,
        tags: combinedTags,
        linkedTickets,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, "supportTickets", mergeTargetId), targetUpdate, { merge: true });
      
      // Mark source ticket as merged (closed)
      const sourceUpdate = {
        status: "closed",
        mergedInto: mergeTargetId,
        mergedAt: new Date().toISOString(),
        tags: [...(ticketDrawer.tags || []), "duplicate"],
        internalNotes: [
          ...(ticketDrawer.internalNotes || []),
          { text: `This ticket was merged into ticket ${mergeTargetId}`, by: adminUser?.email || "admin", at: new Date().toISOString() }
        ],
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, "supportTickets", ticketDrawer.id), sourceUpdate, { merge: true });
      
      // Update local state
      setTickets(prev => prev.map(t => {
        if (t.id === mergeTargetId) return { ...t, ...targetUpdate };
        if (t.id === ticketDrawer.id) return { ...t, ...sourceUpdate };
        return t;
      }));
      
      await logAudit(db, { action: "tickets_merged", sourceId: ticketDrawer.id, targetId: mergeTargetId });
      
      notify(`Ticket merged into "${targetTicket.subject}"`);
      setShowMergeModal(false);
      setMergeTargetId("");
      setTicketDrawer(null);
    } catch (e) {
      notify("Merge failed: " + e.message);
    }
    setMerging(false);
  };

  // Phase 2: Link Related Tickets
  const linkTicket = async () => {
    if (!ticketDrawer || !linkTargetId || linkTargetId === ticketDrawer.id) {
      notify("Please select a different ticket to link");
      return;
    }
    
    setLinking(true);
    try {
      const targetTicket = tickets.find(t => t.id === linkTargetId);
      if (!targetTicket) {
        notify("Target ticket not found");
        setLinking(false);
        return;
      }
      
      // Add link to current ticket
      const currentLinks = ticketDrawer.linkedTickets || [];
      if (currentLinks.some(l => l.id === linkTargetId)) {
        notify("Tickets already linked");
        setLinking(false);
        return;
      }
      
      const newCurrentLinks = [...currentLinks, { id: linkTargetId, type: "related", subject: targetTicket.subject, linkedAt: new Date().toISOString() }];
      
      // Add reciprocal link to target ticket
      const targetLinks = targetTicket.linkedTickets || [];
      const newTargetLinks = [...targetLinks, { id: ticketDrawer.id, type: "related", subject: ticketDrawer.subject, linkedAt: new Date().toISOString() }];
      
      // Update both tickets
      await setDoc(doc(db, "supportTickets", ticketDrawer.id), { linkedTickets: newCurrentLinks, updatedAt: new Date().toISOString() }, { merge: true });
      await setDoc(doc(db, "supportTickets", linkTargetId), { linkedTickets: newTargetLinks, updatedAt: new Date().toISOString() }, { merge: true });
      
      // Update local state
      setTickets(prev => prev.map(t => {
        if (t.id === ticketDrawer.id) return { ...t, linkedTickets: newCurrentLinks };
        if (t.id === linkTargetId) return { ...t, linkedTickets: newTargetLinks };
        return t;
      }));
      setTicketDrawer(prev => ({ ...prev, linkedTickets: newCurrentLinks }));
      
      await logAudit(db, { action: "tickets_linked", ticketId: ticketDrawer.id, linkedTo: linkTargetId });
      
      notify(`Linked to "${targetTicket.subject}"`);
      setShowLinkModal(false);
      setLinkTargetId("");
    } catch (e) {
      notify("Link failed: " + e.message);
    }
    setLinking(false);
  };

  // Unlink tickets
  const unlinkTicket = async (linkedId) => {
    if (!ticketDrawer) return;
    
    try {
      // Remove from current ticket
      const newCurrentLinks = (ticketDrawer.linkedTickets || []).filter(l => l.id !== linkedId);
      
      // Remove reciprocal link from target
      const targetTicket = tickets.find(t => t.id === linkedId);
      const newTargetLinks = targetTicket ? (targetTicket.linkedTickets || []).filter(l => l.id !== ticketDrawer.id) : [];
      
      await setDoc(doc(db, "supportTickets", ticketDrawer.id), { linkedTickets: newCurrentLinks, updatedAt: new Date().toISOString() }, { merge: true });
      if (targetTicket) {
        await setDoc(doc(db, "supportTickets", linkedId), { linkedTickets: newTargetLinks, updatedAt: new Date().toISOString() }, { merge: true });
      }
      
      setTickets(prev => prev.map(t => {
        if (t.id === ticketDrawer.id) return { ...t, linkedTickets: newCurrentLinks };
        if (t.id === linkedId) return { ...t, linkedTickets: newTargetLinks };
        return t;
      }));
      setTicketDrawer(prev => ({ ...prev, linkedTickets: newCurrentLinks }));
      
      notify("Ticket unlinked");
    } catch (e) {
      notify("Unlink failed: " + e.message);
    }
  };

  // Get mergeable/linkable tickets (exclude current, already linked, and merged)
  const getAvailableTickets = (excludeId) => {
    return tickets.filter(t => 
      t.id !== excludeId && 
      t.status !== "closed" && 
      !t.mergedInto &&
      !(ticketDrawer?.linkedTickets || []).some(l => l.id === t.id)
    );
  };

  // Phase 2B: Custom Field Management
  const saveCustomField = async () => {
    if (!newFieldForm.name.trim()) {
      notify("Field name is required");
      return;
    }
    
    try {
      const fieldData = {
        name: newFieldForm.name.trim(),
        type: newFieldForm.type,
        options: newFieldForm.type === "dropdown" ? newFieldForm.options.split(",").map(o => o.trim()).filter(o => o) : [],
        required: newFieldForm.required,
        updatedAt: new Date().toISOString()
      };
      
      if (editingField) {
        // Update existing
        await setDoc(doc(db, "supportCustomFields", editingField.id), fieldData, { merge: true });
        setCustomFields(prev => prev.map(f => f.id === editingField.id ? { ...f, ...fieldData } : f));
        notify("Field updated");
      } else {
        // Create new
        fieldData.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, "supportCustomFields"), fieldData);
        setCustomFields(prev => [...prev, { id: docRef.id, ...fieldData }]);
        notify("Field created");
      }
      
      setNewFieldForm({ name: "", type: "text", options: "", required: false });
      setEditingField(null);
    } catch (e) {
      notify("Error: " + e.message);
    }
  };

  const deleteCustomField = async (fieldId) => {
    if (!window.confirm("Delete this custom field? This won't remove data from existing tickets.")) return;
    
    try {
      await deleteDoc(doc(db, "supportCustomFields", fieldId));
      setCustomFields(prev => prev.filter(f => f.id !== fieldId));
      notify("Field deleted");
    } catch (e) {
      notify("Error: " + e.message);
    }
  };

  const editCustomField = (field) => {
    setEditingField(field);
    setNewFieldForm({
      name: field.name,
      type: field.type,
      options: (field.options || []).join(", "),
      required: field.required || false
    });
  };

  // Update ticket custom field value
  const updateTicketCustomField = async (ticketId, fieldId, value) => {
    try {
      const ticket = tickets.find(t => t.id === ticketId) || ticketDrawer;
      const currentFields = ticket?.customFields || {};
      const updatedFields = { ...currentFields, [fieldId]: value };
      
      await setDoc(doc(db, "supportTickets", ticketId), { customFields: updatedFields, updatedAt: new Date().toISOString() }, { merge: true });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, customFields: updatedFields } : t));
      if (ticketDrawer?.id === ticketId) setTicketDrawer(prev => ({ ...prev, customFields: updatedFields }));
    } catch (e) {
      notify("Error: " + e.message);
    }
  };

  // Phase 3A: Auto-Assign Rules Management
  const saveAutoAssignRule = async () => {
    if (!newRuleForm.name.trim() || !newRuleForm.conditionValue || !newRuleForm.assignTo) {
      notify("Please fill all required fields");
      return;
    }
    
    try {
      const ruleData = {
        name: newRuleForm.name.trim(),
        condition: newRuleForm.condition,
        conditionValue: newRuleForm.conditionValue,
        assignTo: newRuleForm.assignTo,
        assignToName: assignableAgents.find(a => a.id === newRuleForm.assignTo)?.name || newRuleForm.assignTo,
        enabled: newRuleForm.enabled,
        updatedAt: new Date().toISOString()
      };
      
      if (editingRule) {
        await setDoc(doc(db, "supportAutoAssignRules", editingRule.id), ruleData, { merge: true });
        setAutoAssignRules(prev => prev.map(r => r.id === editingRule.id ? { ...r, ...ruleData } : r));
        notify("Rule updated");
      } else {
        ruleData.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, "supportAutoAssignRules"), ruleData);
        setAutoAssignRules(prev => [...prev, { id: docRef.id, ...ruleData }]);
        notify("Rule created");
      }
      
      setNewRuleForm({ name: "", condition: "category", conditionValue: "", assignTo: "", enabled: true });
      setEditingRule(null);
    } catch (e) {
      notify("Error: " + e.message);
    }
  };

  const deleteAutoAssignRule = async (ruleId) => {
    if (!window.confirm("Delete this auto-assign rule?")) return;
    
    try {
      await deleteDoc(doc(db, "supportAutoAssignRules", ruleId));
      setAutoAssignRules(prev => prev.filter(r => r.id !== ruleId));
      notify("Rule deleted");
    } catch (e) {
      notify("Error: " + e.message);
    }
  };

  const toggleRuleEnabled = async (ruleId, enabled) => {
    try {
      await setDoc(doc(db, "supportAutoAssignRules", ruleId), { enabled, updatedAt: new Date().toISOString() }, { merge: true });
      setAutoAssignRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled } : r));
      notify(enabled ? "Rule enabled" : "Rule disabled");
    } catch (e) {
      notify("Error: " + e.message);
    }
  };

  const editAutoAssignRule = (rule) => {
    setEditingRule(rule);
    setNewRuleForm({
      name: rule.name,
      condition: rule.condition,
      conditionValue: rule.conditionValue,
      assignTo: rule.assignTo,
      enabled: rule.enabled
    });
  };

  // Apply auto-assign rules to a ticket
  const applyAutoAssignRules = async (ticket) => {
    const enabledRules = autoAssignRules.filter(r => r.enabled);
    
    for (const rule of enabledRules) {
      let matches = false;
      
      switch (rule.condition) {
        case "category":
          matches = ticket.category === rule.conditionValue;
          break;
        case "priority":
          matches = ticket.priority === rule.conditionValue;
          break;
        case "tier":
          matches = ticket.userTier === rule.conditionValue;
          break;
        case "keyword":
          matches = (ticket.subject || "").toLowerCase().includes(rule.conditionValue.toLowerCase());
          break;
        default:
          break;
      }
      
      if (matches) {
        try {
          const assignUpdate = {
            assignedTo: rule.assignTo,
            assignedToName: rule.assignToName,
            autoAssignedBy: rule.name,
            internalNotes: [
              ...(ticket.internalNotes || []),
              { text: `≡ƒñû Auto-assigned to ${rule.assignToName} by rule: "${rule.name}"`, by: "System", at: new Date().toISOString(), isSystem: true }
            ],
            updatedAt: new Date().toISOString()
          };
          
          await setDoc(doc(db, "supportTickets", ticket.id), assignUpdate, { merge: true });
          setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, ...assignUpdate } : t));
          
          notify(`Auto-assigned to ${rule.assignToName}`);
          return true; // Stop after first matching rule
        } catch (e) {
          console.error("Auto-assign failed:", e);
        }
      }
    }
    return false;
  };

  // Save SLA Settings
  const saveSlaSettings = async () => {
    try {
      await setDoc(doc(db, "supportSettings", "sla"), {
        ...slaSettings,
        updatedAt: new Date().toISOString()
      });
      notify("SLA settings saved");
      setShowSlaModal(false);
    } catch (e) {
      notify("Error: " + e.message);
    }
  };

  // Get SLA status for a ticket
  const getSlaStatus = (ticket) => {
    if (ticket.status === "resolved" || ticket.status === "closed") return { status: "resolved", percent: 0 };
    
    const created = new Date(ticket.createdAt);
  // now already defined above
    const elapsed = now.getTime() - created.getTime();
    const slaMs = slaSettings.defaultHours * 60 * 60 * 1000;
    const percent = Math.round((elapsed / slaMs) * 100);
    
    if (percent >= 100) return { status: "breached", percent, color: T.red };
    if (percent >= slaSettings.warningPercent) return { status: "warning", percent, color: T.orange };
    return { status: "ok", percent, color: T.green };
  };

  // Condition options for rules
  const conditionOptions = [
    { id: "category", label: "Category", values: categories.map(c => ({ id: c.id, label: c.label })) },
    { id: "priority", label: "Priority", values: [{ id: "urgent", label: "Urgent" }, { id: "high", label: "High" }, { id: "normal", label: "Normal" }] },
    { id: "tier", label: "User Tier", values: [{ id: "enterprise", label: "Enterprise" }, { id: "pro", label: "Pro" }, { id: "pro_trial", label: "Pro Trial" }, { id: "free", label: "Free" }] },
    { id: "keyword", label: "Subject Contains", values: [] },
  ];

  // Phase 3B: Workflow Trigger Options
  const triggerOptions = [
    { id: "status_change", label: "Status Changes To", values: [{ id: "open", label: "Open" }, { id: "in_progress", label: "In Progress" }, { id: "resolved", label: "Resolved" }, { id: "closed", label: "Closed" }] },
    { id: "priority_change", label: "Priority Changes To", values: [{ id: "urgent", label: "Urgent" }, { id: "high", label: "High" }, { id: "normal", label: "Normal" }] },
    { id: "tier_is", label: "User Tier Is", values: [{ id: "enterprise", label: "Enterprise" }, { id: "pro", label: "Pro" }, { id: "pro_trial", label: "Pro Trial" }, { id: "free", label: "Free" }] },
    { id: "category_is", label: "Category Is", values: categories.map(c => ({ id: c.id, label: c.label })) },
    { id: "tag_added", label: "Tag Added", values: availableTags.map(t => ({ id: t.id, label: t.label })) },
    { id: "assigned", label: "Ticket Assigned", values: [] },
    { id: "new_ticket", label: "New Ticket Created", values: [] },
  ];

  const actionOptions = [
    { id: "add_tag", label: "Add Tag", needsValue: true, valueType: "tag" },
    { id: "remove_tag", label: "Remove Tag", needsValue: true, valueType: "tag" },
    { id: "set_priority", label: "Set Priority", needsValue: true, valueType: "priority" },
    { id: "set_status", label: "Set Status", needsValue: true, valueType: "status" },
    { id: "add_note", label: "Add Internal Note", needsValue: true, valueType: "text" },
    { id: "send_notification", label: "Send Notification", needsValue: true, valueType: "text" },
  ];

  // Save workflow trigger
  const saveWorkflowTrigger = async () => {
    if (!newWorkflowForm.name.trim() || newWorkflowForm.actions.length === 0) {
      notify("Please fill all required fields");
      return;
    }
    
    try {
      const workflowData = {
        name: newWorkflowForm.name.trim(),
        trigger: newWorkflowForm.trigger,
        triggerValue: newWorkflowForm.triggerValue,
        actions: newWorkflowForm.actions.filter(a => a.type && (a.value || !actionOptions.find(o => o.id === a.type)?.needsValue)),
        enabled: newWorkflowForm.enabled,
        updatedAt: new Date().toISOString()
      };
      
      if (editingWorkflow) {
        await setDoc(doc(db, "supportWorkflowTriggers", editingWorkflow.id), workflowData, { merge: true });
        setWorkflowTriggers(prev => prev.map(w => w.id === editingWorkflow.id ? { ...w, ...workflowData } : w));
        notify("Workflow updated");
      } else {
        workflowData.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, "supportWorkflowTriggers"), workflowData);
        setWorkflowTriggers(prev => [...prev, { id: docRef.id, ...workflowData }]);
        notify("Workflow created");
      }
      
      setNewWorkflowForm({ name: "", trigger: "status_change", triggerValue: "", actions: [{ type: "add_tag", value: "" }], enabled: true });
      setEditingWorkflow(null);
    } catch (e) {
      notify("Error: " + e.message);
    }
  };

  const deleteWorkflowTrigger = async (wfId) => {
    if (!window.confirm("Delete this workflow trigger?")) return;
    
    try {
      await deleteDoc(doc(db, "supportWorkflowTriggers", wfId));
      setWorkflowTriggers(prev => prev.filter(w => w.id !== wfId));
      notify("Workflow deleted");
    } catch (e) {
      notify("Error: " + e.message);
    }
  };

  const toggleWorkflowEnabled = async (wfId, enabled) => {
    try {
      await setDoc(doc(db, "supportWorkflowTriggers", wfId), { enabled, updatedAt: new Date().toISOString() }, { merge: true });
      setWorkflowTriggers(prev => prev.map(w => w.id === wfId ? { ...w, enabled } : w));
      notify(enabled ? "Workflow enabled" : "Workflow disabled");
    } catch (e) {
      notify("Error: " + e.message);
    }
  };

  const editWorkflowTrigger = (wf) => {
    setEditingWorkflow(wf);
    setNewWorkflowForm({
      name: wf.name,
      trigger: wf.trigger,
      triggerValue: wf.triggerValue || "",
      actions: wf.actions?.length > 0 ? wf.actions : [{ type: "add_tag", value: "" }],
      enabled: wf.enabled
    });
  };

  // Execute workflow actions on a ticket
  const executeWorkflowActions = async (ticket, triggeredBy, triggerValue) => {
    const enabledWorkflows = workflowTriggers.filter(w => w.enabled && w.trigger === triggeredBy && (!w.triggerValue || w.triggerValue === triggerValue));
    
    for (const workflow of enabledWorkflows) {
      const updates = {};
      const newTags = [...(ticket.tags || [])];
      const newNotes = [...(ticket.internalNotes || [])];
      
      for (const action of workflow.actions) {
        switch (action.type) {
          case "add_tag":
            if (action.value && !newTags.includes(action.value)) newTags.push(action.value);
            break;
          case "remove_tag":
            const tagIdx = newTags.indexOf(action.value);
            if (tagIdx > -1) newTags.splice(tagIdx, 1);
            break;
          case "set_priority":
            updates.priority = action.value;
            break;
          case "set_status":
            updates.status = action.value;
            if (action.value === "resolved") updates.resolvedAt = new Date().toISOString();
            break;
          case "add_note":
            newNotes.push({ text: `≡ƒñû ${action.value}`, by: "System", at: new Date().toISOString(), isSystem: true });
            break;
          case "send_notification":
            // Would integrate with notification system
            console.log(`Workflow notification: ${action.value}`);
            break;
          default:
            break;
        }
      }
      
      updates.tags = newTags;
      updates.internalNotes = newNotes;
      updates.updatedAt = new Date().toISOString();
      updates.lastWorkflowRun = { name: workflow.name, at: new Date().toISOString() };
      
      try {
        await setDoc(doc(db, "supportTickets", ticket.id), updates, { merge: true });
        setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, ...updates } : t));
        if (ticketDrawer?.id === ticket.id) setTicketDrawer(prev => ({ ...prev, ...updates }));
        console.log(`Workflow "${workflow.name}" executed on ticket ${ticket.id}`);
      } catch (e) {
        console.error("Workflow execution failed:", e);
      }
    }
  };

  // Add workflow action
  const addWorkflowAction = () => {
    setNewWorkflowForm(prev => ({
      ...prev,
      actions: [...prev.actions, { type: "add_tag", value: "" }]
    }));
  };

  // Remove workflow action
  const removeWorkflowAction = (idx) => {
    setNewWorkflowForm(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== idx)
    }));
  };

  // Update workflow action
  const updateWorkflowAction = (idx, field, value) => {
    setNewWorkflowForm(prev => ({
      ...prev,
      actions: prev.actions.map((a, i) => i === idx ? { ...a, [field]: value } : a)
    }));
  };

  // Phase 5B: KB Categories
  const kbCategories = [
    { id: "getting-started", label: "Getting Started", icon: "≡ƒÜÇ" },
   { id: "billing", label: "Billing & Payments", icon: "≡ƒÆ│" },
    { id: "technical", label: "Technical Issues", icon: "≡ƒöº" },
    { id: "features", label: "Features & Usage", icon: "Γ£¿" },
    { id: "account", label: "Account & Security", icon: "≡ƒöÉ" },
  ];

  const qrCategories = [
    { id: "general", label: "General" },
    { id: "technical", label: "Technical" },
    { id: "billing", label: "Billing" },
    { id: "escalation", label: "Escalation" },
  ];

  // Save KB article
  const saveKbArticle = async () => {
    if (!articleForm.title.trim() || !articleForm.content.trim()) {
      notify("Please fill in title and content");
      return;
    }
    
    try {
      const articleData = {
        title: articleForm.title.trim(),
        content: articleForm.content.trim(),
        category: articleForm.category,
        tags: articleForm.tags.split(",").map(t => t.trim()).filter(Boolean),
        updatedAt: new Date().toISOString()
      };
      
      if (editingArticle) {
        await setDoc(doc(db, "supportKnowledgeBase", editingArticle.id), articleData, { merge: true });
        setKbArticles(prev => prev.map(a => a.id === editingArticle.id ? { ...a, ...articleData } : a));
        notify("Article updated");
      } else {
        articleData.views = 0;
        articleData.helpful = 0;
        articleData.createdAt = new Date().toISOString();
        articleData.createdBy = adminUser?.displayName || adminUser?.email || "Admin";
        const docRef = await addDoc(collection(db, "supportKnowledgeBase"), articleData);
        setKbArticles(prev => [...prev, { id: docRef.id, ...articleData }]);
        notify("Article created");
      }
      
      setArticleForm({ title: "", content: "", category: "getting-started", tags: "" });
      setEditingArticle(null);
      setShowKbModal(false);
    } catch (e) {
      notify("Error: " + e.message);
    }
  };

  const deleteKbArticle = async (articleId) => {
    if (!window.confirm("Delete this article?")) return;
    
    try {
      await deleteDoc(doc(db, "supportKnowledgeBase", articleId));
      setKbArticles(prev => prev.filter(a => a.id !== articleId));
      notify("Article deleted");
    } catch (e) {
      notify("Error: " + e.message);
    }
  };

  const editKbArticle = (article) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: (article.tags || []).join(", ")
    });
    setShowKbModal(true);
  };

  // Save Quick Response
  const saveQuickResponse = async () => {
    if (!quickResponseForm.name.trim() || !quickResponseForm.content.trim()) {
      notify("Please fill in name and content");
      return;
    }
    
    try {
      const qrData = {
        name: quickResponseForm.name.trim(),
        shortcut: quickResponseForm.shortcut.trim() || `/${quickResponseForm.name.toLowerCase().replace(/\s+/g, "")}`,
        content: quickResponseForm.content.trim(),
        category: quickResponseForm.category,
        updatedAt: new Date().toISOString()
      };
      
      if (editingQuickResponse) {
        await setDoc(doc(db, "supportQuickResponses", editingQuickResponse.id), qrData, { merge: true });
        setQuickResponses(prev => prev.map(q => q.id === editingQuickResponse.id ? { ...q, ...qrData } : q));
        notify("Quick response updated");
      } else {
        qrData.usageCount = 0;
        qrData.createdAt = new Date().toISOString();
        qrData.createdBy = adminUser?.displayName || adminUser?.email || "Admin";
        const docRef = await addDoc(collection(db, "supportQuickResponses"), qrData);
        setQuickResponses(prev => [...prev, { id: docRef.id, ...qrData }]);
        notify("Quick response created");
      }
      
      setQuickResponseForm({ name: "", shortcut: "", content: "", category: "general" });
      setEditingQuickResponse(null);
      setShowQuickResponseModal(false);
    } catch (e) {
      notify("Error: " + e.message);
    }
  };

  const deleteQuickResponse = async (qrId) => {
    if (!window.confirm("Delete this quick response?")) return;
    
    try {
      await deleteDoc(doc(db, "supportQuickResponses", qrId));
      setQuickResponses(prev => prev.filter(q => q.id !== qrId));
      notify("Quick response deleted");
    } catch (e) {
      notify("Error: " + e.message);
    }
  };

  const editQuickResponse = (qr) => {
    setEditingQuickResponse(qr);
    setQuickResponseForm({
      name: qr.name,
      shortcut: qr.shortcut,
      content: qr.content,
      category: qr.category
    });
    setShowQuickResponseModal(true);
  };

  // Apply Quick Response with variable substitution
  const applyQuickResponse = (qr) => {
    let content = qr.content;
    if (ticketDrawer) {
      content = content
        .replace(/\{\{name\}\}/g, ticketDrawer.userName || ticketDrawer.userEmail?.split("@")[0] || "there")
        .replace(/\{\{ticket_id\}\}/g, ticketDrawer.id)
        .replace(/\{\{category\}\}/g, ticketDrawer.category || "general")
        .replace(/\{\{tier\}\}/g, ticketDrawer.userTier || "free")
        .replace(/\{\{agent_name\}\}/g, adminUser?.displayName || adminUser?.email?.split("@")[0] || "Support");
    }
    setTicketReply(content);
    
    // Increment usage count
    setDoc(doc(db, "supportQuickResponses", qr.id), { usageCount: (qr.usageCount || 0) + 1 }, { merge: true }).catch(() => {});
    setQuickResponses(prev => prev.map(q => q.id === qr.id ? { ...q, usageCount: (q.usageCount || 0) + 1 } : q));
  };

  // Filter KB articles
  const filteredKbArticles = kbArticles.filter(a => {
    if (kbCategory !== "all" && a.category !== kbCategory) return false;
    if (kbSearch) {
      const s = kbSearch.toLowerCase();
      if (!a.title.toLowerCase().includes(s) && !a.content.toLowerCase().includes(s) && !(a.tags || []).some(t => t.toLowerCase().includes(s))) return false;
    }
    return true;
  });

  // Group KB articles by category
  const groupedKbArticles = kbCategories.map(cat => ({
    ...cat,
    articles: filteredKbArticles.filter(a => a.category === cat.id)
  })).filter(g => g.articles.length > 0);

  // Phase 6A: Sentiment Analysis (rule-based)
  const analyzeSentiment = (ticket) => {
    if (!ticket) return { sentiment: "neutral", emoji: "≡ƒÿÉ", color: T.textMuted, label: "Neutral" };
    
    const allText = [
      ticket.subject || "",
      ...(ticket.messages || []).filter(m => m.from === "user").map(m => m.text || "")
    ].join(" ").toLowerCase();
    
    // Check for urgency indicators
    const urgentWords = ["asap", "urgent", "emergency", "critical", "deadline", "immediately", "right now", "can't wait"];
    const frustratedWords = ["frustrated", "angry", "furious", "unacceptable", "ridiculous", "terrible", "worst", "hate", "useless", "waste"];
    const concernedWords = ["worried", "confused", "unsure", "not sure", "don't understand", "help me", "stuck", "problem"];
    const positiveWords = ["thank you", "thanks", "great", "amazing", "awesome", "love", "excellent", "perfect", "wonderful", "appreciate"];
    
    // Check for ALL CAPS (frustration indicator)
    const capsRatio = (allText.match(/[A-Z]{3,}/g) || []).length;
    const hasExcessiveCaps = capsRatio > 2;
    
    // Check for multiple exclamation/question marks
    const hasExcessivePunctuation = (allText.match(/[!?]{2,}/g) || []).length > 0;
    
    // Score each sentiment
    let scores = {
      urgent: urgentWords.filter(w => allText.includes(w)).length * 3,
      frustrated: frustratedWords.filter(w => allText.includes(w)).length * 2 + (hasExcessiveCaps ? 2 : 0) + (hasExcessivePunctuation ? 1 : 0),
      concerned: concernedWords.filter(w => allText.includes(w)).length,
      positive: positiveWords.filter(w => allText.includes(w)).length,
    };
    
    // Determine sentiment
    if (scores.urgent >= 3) return { sentiment: "urgent", emoji: "≡ƒåÿ", color: T.red, label: "Urgent", pulse: true };
    if (scores.frustrated >= 3) return { sentiment: "frustrated", emoji: "≡ƒÿá", color: T.red, label: "Frustrated" };
    if (scores.concerned >= 2) return { sentiment: "concerned", emoji: "≡ƒÿƒ", color: T.orange, label: "Concerned" };
    if (scores.positive >= 2) return { sentiment: "positive", emoji: "≡ƒÿè", color: T.green, label: "Positive" };
    
    return { sentiment: "neutral", emoji: "≡ƒÿÉ", color: T.textMuted, label: "Neutral" };
  };

  // Phase 6A: AI Priority Recommendation
  const getAiPriorityRecommendation = (ticket) => {
    if (!ticket) return null;
    
    const sentiment = analyzeSentiment(ticket);
    const allText = [ticket.subject || "", ...(ticket.messages || []).map(m => m.text || "")].join(" ").toLowerCase();
    
    let score = 0;
    let reasons = [];
    
    // Check user tier
    if (ticket.userTier === "enterprise") { score += 3; reasons.push("Enterprise customer"); }
    else if (ticket.userTier === "pro") { score += 1; reasons.push("Pro customer"); }
    
    // Check sentiment
    if (sentiment.sentiment === "urgent") { score += 3; reasons.push("Urgent language detected"); }
    else if (sentiment.sentiment === "frustrated") { score += 2; reasons.push("Customer frustration detected"); }
    
    // Check for payment/billing issues
    if (allText.includes("payment") || allText.includes("billing") || allText.includes("charge") || allText.includes("refund")) {
      score += 2; reasons.push("Payment-related issue");
    }
    
    // Check for access/login issues
    if (allText.includes("can't access") || allText.includes("login") || allText.includes("locked out") || allText.includes("password")) {
      score += 1; reasons.push("Access issue");
    }
    
    // Check for deadline mentions
    if (allText.includes("deadline") || allText.includes("presentation") || allText.includes("meeting") || allText.includes("tomorrow")) {
      score += 2; reasons.push("Time-sensitive");
    }
    
    // Determine recommended priority
    let recommended;
    if (score >= 5) recommended = "urgent";
    else if (score >= 3) recommended = "high";
    else recommended = "normal";
    
    return { recommended, score, reasons, currentPriority: ticket.priority || "normal" };
  };

  // Phase 6A: Generate AI Summary
  const generateAiSummary = async (ticket) => {
    if (!ticket) return;
    
    setSummaryLoading(true);
    setTicketSummary(null);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const messages = ticket.messages || [];
    const userMessages = messages.filter(m => m.from === "user");
    const adminMessages = messages.filter(m => m.from === "admin");
    const sentiment = analyzeSentiment(ticket);
    const allUserText = userMessages.map(m => m.text || "").join(" ");
    
    // Extract key information
    const keyPoints = [];
    
    // Check for specific patterns
    if (allUserText.toLowerCase().includes("upgrade") || allUserText.toLowerCase().includes("subscription")) {
      keyPoints.push("Subscription/upgrade related issue");
    }
    if (allUserText.toLowerCase().includes("payment") || allUserText.toLowerCase().includes("charge")) {
      keyPoints.push("Payment or billing concern mentioned");
    }
    if (allUserText.toLowerCase().includes("error") || allUserText.toLowerCase().includes("bug")) {
      keyPoints.push("Technical error reported");
    }
    if (allUserText.toLowerCase().includes("feature") || allUserText.toLowerCase().includes("how to")) {
      keyPoints.push("Feature or how-to question");
    }
    if (allUserText.toLowerCase().includes("deadline") || allUserText.toLowerCase().includes("urgent")) {
      keyPoints.push("Time pressure mentioned");
    }
    
    // Extract any mentioned browsers/devices
    const browsers = ["chrome", "firefox", "safari", "edge"].filter(b => allUserText.toLowerCase().includes(b));
    if (browsers.length > 0) {
      keyPoints.push(`Browsers tried: ${browsers.join(", ")}`);
    }
    
    // Check for troubleshooting steps already attempted
    if (allUserText.toLowerCase().includes("tried") || allUserText.toLowerCase().includes("already")) {
      keyPoints.push("Customer has attempted troubleshooting");
    }
    
    // Build summary
    const category = categories.find(c => c.id === ticket.category);
    const summary = {
      overview: `${ticket.userName || "Customer"} reported a ${category?.label?.toLowerCase() || "support"} issue: "${ticket.subject}". ${userMessages.length > 1 ? `Thread contains ${messages.length} messages over ${timeAgo(ticket.createdAt)}.` : "Initial report."}`,
      sentiment: sentiment,
      keyPoints: keyPoints.length > 0 ? keyPoints : ["General inquiry - no specific technical details extracted"],
      messageCount: { total: messages.length, user: userMessages.length, admin: adminMessages.length },
      timeline: {
        created: ticket.createdAt,
        lastActivity: messages.length > 0 ? messages[messages.length - 1].at : ticket.createdAt,
        responded: ticket.respondedAt ? true : false,
      },
      aiRecommendation: userMessages.length > 2 && !ticket.resolvedAt 
        ? "Consider escalating - multiple follow-ups from customer" 
        : userMessages.length === 1 && !adminMessages.length 
          ? "Awaiting initial response" 
          : ticket.status === "resolved" 
            ? "Ticket resolved" 
            : "Continue investigation",
    };
    
    setTicketSummary(summary);
    setSummaryLoading(false);
  };

  // Phase 6B: Generate Smart Reply Suggestions
  const generateSmartReplies = async (ticket) => {
    if (!ticket) return;
    
    setRepliesLoading(true);
    setSuggestedReplies([]);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const sentiment = analyzeSentiment(ticket);
    const category = ticket.category;
    const allText = [ticket.subject || "", ...(ticket.messages || []).map(m => m.text || "")].join(" ").toLowerCase();
    const userName = ticket.userName?.split(" ")[0] || "there";
    const hasResponded = (ticket.messages || []).some(m => m.from === "admin");
    
    const replies = [];
    
    // Opening based on sentiment and context
    if (sentiment.sentiment === "frustrated" || sentiment.sentiment === "urgent") {
      replies.push({
        id: "empathy",
        title: "Empathize & Reassure",
        tone: "empathetic",
        preview: `Hi ${userName}, I completely understand how frustrating this must be, and I sincerely apologize for the inconvenience. Let me personally ensure this gets resolved for you right away.`,
        full: `Hi ${userName},\n\nI completely understand how frustrating this must be, and I sincerely apologize for the inconvenience you've experienced. Please know that I'm treating this as a priority.\n\nLet me personally ensure this gets resolved for you right away. I'm looking into this now and will update you within the next hour.\n\nThank you for your patience.\n\nBest regards,\n${adminUser?.displayName || "Support Team"}`
      });
    }
    
    // Category-specific replies
    if (category === "bug" || allText.includes("error") || allText.includes("not working")) {
      replies.push({
        id: "troubleshoot",
        title: "Troubleshooting Steps",
        tone: "technical",
        preview: `Hi ${userName}, thanks for reporting this. To help me investigate, could you try these quick steps: 1) Clear your browser cache...`,
        full: `Hi ${userName},\n\nThank you for bringing this to our attention. I'd like to help you resolve this as quickly as possible.\n\nCould you please try the following steps:\n\n1. Clear your browser cache and cookies\n2. Try using an incognito/private window\n3. If possible, test on a different browser\n\nIf the issue persists after these steps, could you let me know:\n- What browser and version you're using?\n- Any error messages you see?\n- When did this issue start?\n\nThis information will help me investigate further.\n\nBest regards,\n${adminUser?.displayName || "Support Team"}`
      });
    }
    
    if (category === "billing" || allText.includes("payment") || allText.includes("charge") || allText.includes("refund")) {
      replies.push({
        id: "billing",
        title: "Billing Assistance",
        tone: "professional",
        preview: `Hi ${userName}, I've reviewed your account and can help with your billing inquiry. Let me check the details...`,
        full: `Hi ${userName},\n\nThank you for reaching out about your billing concern. I've pulled up your account and I'm reviewing the details now.\n\nTo ensure I can assist you fully, could you please confirm:\n- The date of the transaction in question\n- The amount you're inquiring about\n- Your preferred resolution\n\nRest assured, we take billing matters very seriously and I'll make sure this is resolved to your satisfaction.\n\nBest regards,\n${adminUser?.displayName || "Support Team"}`
      });
    }
    
    if (category === "feature" || allText.includes("how to") || allText.includes("how do i")) {
      replies.push({
        id: "howto",
        title: "How-To Guide",
        tone: "helpful",
        preview: `Hi ${userName}, great question! Let me walk you through how to do this step by step...`,
        full: `Hi ${userName},\n\nGreat question! I'd be happy to help you with this.\n\nHere's how you can do it:\n\n1. [Step 1 - Navigate to...]\n2. [Step 2 - Click on...]\n3. [Step 3 - Configure...]\n\nI've also attached a link to our help article that covers this in more detail: [KB Article Link]\n\nIf you run into any issues or have questions along the way, just let me know!\n\nBest regards,\n${adminUser?.displayName || "Support Team"}`
      });
    }
    
    // Generic acknowledgment if first response
    if (!hasResponded) {
      replies.push({
        id: "acknowledge",
        title: "Acknowledge & Investigate",
        tone: "professional",
        preview: `Hi ${userName}, thank you for contacting us. I've received your request and am looking into it now...`,
        full: `Hi ${userName},\n\nThank you for contacting DXB Analytics support. I've received your request regarding "${ticket.subject}" and am looking into it now.\n\nI'll review the details and get back to you with a solution or update within the next 24 hours.\n\nIf you have any additional information that might help, please feel free to share it.\n\nBest regards,\n${adminUser?.displayName || "Support Team"}`
      });
    }
    
    // Escalation option
    if (sentiment.sentiment === "frustrated" || sentiment.sentiment === "urgent" || (ticket.messages || []).filter(m => m.from === "user").length > 3) {
      replies.push({
        id: "escalate",
        title: "Escalate to Specialist",
        tone: "reassuring",
        preview: `Hi ${userName}, I'm escalating this to our senior team to ensure you get the fastest resolution...`,
        full: `Hi ${userName},\n\nI understand the importance of getting this resolved quickly for you. To ensure you receive the best possible assistance, I'm escalating this to our senior technical team.\n\nThey will review your case with priority and reach out to you directly within the next few hours.\n\nIn the meantime, please don't hesitate to reply here if you have any additional information to share.\n\nThank you for your patience.\n\nBest regards,\n${adminUser?.displayName || "Support Team"}`
      });
    }
    
    // Resolution reply
    replies.push({
      id: "resolved",
      title: "Mark as Resolved",
      tone: "positive",
      preview: `Hi ${userName}, great news! I've resolved the issue. Here's what was done...`,
      full: `Hi ${userName},\n\nGreat news! I've investigated and resolved the issue you reported.\n\n**What was the problem:**\n[Brief explanation]\n\n**What we did:**\n[Solution applied]\n\n**Next steps:**\nYou should now be able to [expected outcome]. Please try it out and let me know if everything is working as expected.\n\nIf you have any other questions or need further assistance, I'm here to help!\n\nBest regards,\n${adminUser?.displayName || "Support Team"}`
    });
    
    setSuggestedReplies(replies.slice(0, 4)); // Limit to 4 suggestions
    setRepliesLoading(false);
  };

  // Phase 6B: Find Similar Tickets
  const findSimilarTickets = (ticket) => {
    if (!ticket) return [];
    
    const subject = (ticket.subject || "").toLowerCase();
    const category = ticket.category;
    const allText = [ticket.subject || "", ...(ticket.messages || []).map(m => m.text || "")].join(" ").toLowerCase();
    
    // Extract keywords
    const stopWords = ["the", "a", "an", "is", "are", "was", "were", "i", "my", "me", "we", "you", "your", "it", "this", "that", "to", "of", "in", "on", "for", "with", "and", "or", "but", "not", "can", "cant", "cannot", "dont", "doesnt", "have", "has", "had"];
    const words = subject.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
    
    // Find similar tickets (excluding current)
    const similar = tickets
      .filter(t => t.id !== ticket.id && (t.status === "resolved" || t.status === "closed"))
      .map(t => {
        let score = 0;
        const tSubject = (t.subject || "").toLowerCase();
        const tText = [t.subject || "", ...(t.messages || []).map(m => m.text || "")].join(" ").toLowerCase();
        
        // Category match
        if (t.category === category) score += 3;
        
        // Keyword matches in subject
        words.forEach(word => {
          if (tSubject.includes(word)) score += 2;
          if (tText.includes(word)) score += 1;
        });
        
        // Common issue patterns
        const patterns = [
          { keywords: ["login", "password", "access", "sign in"], weight: 2 },
          { keywords: ["payment", "billing", "charge", "refund"], weight: 2 },
          { keywords: ["upgrade", "subscription", "pro", "tier"], weight: 2 },
          { keywords: ["error", "bug", "crash", "not working"], weight: 2 },
          { keywords: ["slow", "loading", "performance"], weight: 2 },
          { keywords: ["data", "export", "import", "csv"], weight: 2 },
        ];
        
        patterns.forEach(pattern => {
          const currentHas = pattern.keywords.some(k => allText.includes(k));
          const ticketHas = pattern.keywords.some(k => tText.includes(k));
          if (currentHas && ticketHas) score += pattern.weight;
        });
        
        // Extract solution if resolved
        let solution = null;
        if (t.status === "resolved" || t.status === "closed") {
          const adminMsgs = (t.messages || []).filter(m => m.from === "admin");
          if (adminMsgs.length > 0) {
            const lastAdminMsg = adminMsgs[adminMsgs.length - 1].text || "";
            solution = lastAdminMsg.length > 100 ? lastAdminMsg.slice(0, 100) + "..." : lastAdminMsg;
          }
        }
        
        return { ...t, similarityScore: score, solution };
      })
      .filter(t => t.similarityScore >= 3)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5);
    
    return similar;
  };

  // Update similar tickets when drawer opens
  const updateSimilarTickets = (ticket) => {
    if (ticket) {
      const similar = findSimilarTickets(ticket);
      setSimilarTickets(similar);
    }
  };

  // Reset summary when ticket changes
  const prevTicketId = ticketDrawer?.id;
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI TOPBAR */}
      <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        <button type="button" onClick={() => { setTicketsLoading(true); setTimeout(() => setTicketsLoading(false), 500); notify("Tickets refreshed"); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "14px 16px", background: T.goldGlow, border: "none", borderRight: `1px solid ${T.border}`, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, flexShrink: 0 }}>{I.refresh}</button>
        {[
          { label: "Open Tickets", value: openTickets.length, color: openTickets.length > 0 ? T.orange : T.green },
          { label: "Avg Response", value: avgResponseHrs !== null ? `${avgResponseHrs}h` : "—", color: avgResponseHrs !== null && avgResponseHrs > 24 ? T.red : T.green },
          { label: "Resolved Today", value: resolvedToday, color: T.green },
          { label: "SLA Breached", value: slaBreached.length, color: slaBreached.length > 0 ? T.red : T.green },
          { label: "Unassigned", value: unassignedCount, color: unassignedCount > 0 ? T.orange : T.green },
          { label: "Total", value: tickets.length, color: T.textSecondary },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", padding: "10px 18px", borderRight: `1px solid ${T.border}`, flexShrink: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: item.color, fontFamily: "'Fraunces',serif", lineHeight: 1.2 }}>{item.value}</span>
          </div>
        ))}
        {/* Channel indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", marginLeft: "auto" }}>
          <span style={{ fontSize: 9, color: T.textMuted }}>Channels:</span>
          <span style={{ fontSize: 10, padding: "3px 6px", borderRadius: 4, background: `${T.blue}20`, color: T.blue }}>≡ƒôº {tickets.filter(t => !t.channel || t.channel === "email").length}</span>
          <span style={{ fontSize: 10, padding: "3px 6px", borderRadius: 4, background: `${T.green}20`, color: T.green }}>≡ƒÆ¼ {liveChats.filter(c => c.status === "active").length + tickets.filter(t => t.channel === "chat").length}</span>
          <span style={{ fontSize: 10, padding: "3px 6px", borderRadius: 4, background: "#25D36620", color: "#25D366" }}>≡ƒô▒ {whatsappConversations.filter(c => c.status === "active").length + tickets.filter(t => t.channel === "whatsapp").length}</span>
        </div>
      </div>

      {/* SUB-TABS + FILTERS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { id: "open", label: `Open (${tickets.filter(t => t.status === "open" || t.status === "in_progress").length})` },
            { id: "resolved", label: `Resolved (${tickets.filter(t => t.status === "resolved" || t.status === "closed").length})` },
            { id: "all", label: `All (${tickets.length})` },
            { id: "livechat", label: `≡ƒÆ¼ Live Chat${liveChats.filter(c => c.status === "active").length > 0 ? ` (${liveChats.filter(c => c.status === "active").length})` : ""}` },
            { id: "whatsapp", label: `≡ƒô▒ WhatsApp${whatsappConversations.filter(c => c.status === "active").length > 0 ? ` (${whatsappConversations.filter(c => c.status === "active").length})` : ""}` },
            { id: "analytics", label: "≡ƒôè Analytics" },
            { id: "kb", label: "≡ƒôÜ KB & Tools" },
   { id: "timetrack", label: `ΓÅ▒∩╕Å Time${activeTimer ? " ≡ƒö┤" : ""}` },
            { id: "auditlog", label: "≡ƒôï Audit" },
   { id: "settings", label: "ΓÜÖ∩╕Å Settings" },
          ].map(t => (
            <button key={t.id} type="button" onClick={() => setSupportSubTab(t.id)}
              style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${supportSubTab === t.id ? T.gold : T.border}`, background: supportSubTab === t.id ? T.goldGlow : "transparent", color: supportSubTab === t.id ? T.gold : T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", position: "relative" }}>
              {t.label}
              {t.id === "livechat" && chatQueue.length > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: T.red, color: T.white, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{chatQueue.length}</span>
              )}
              {t.id === "whatsapp" && whatsappConversations.filter(c => !c.responded && c.status === "active").length > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#25D366", color: T.white, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{whatsappConversations.filter(c => !c.responded && c.status === "active").length}</span>
              )}
            </button>
          ))}
        </div>
        {supportSubTab !== "analytics" && supportSubTab !== "kb" && supportSubTab !== "livechat" && supportSubTab !== "whatsapp" && supportSubTab !== "timetrack" && supportSubTab !== "auditlog" && supportSubTab !== "settings" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={ticketSearch} onChange={e => setTicketSearch(e.target.value)} placeholder="Search tickets..."
            style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 12, width: 160, fontFamily: "'Outfit',sans-serif" }} />
          {/* Channel Filter */}
          <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${channelFilter !== "all" ? "#25D366" : T.border}`, background: T.surfaceAlt, color: channelFilter !== "all" ? "#25D366" : T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
            <option value="all">All Channels</option>
            <option value="email">≡ƒôº Email</option>
            <option value="chat">≡ƒÆ¼ Live Chat</option>
            <option value="whatsapp">≡ƒô▒ WhatsApp</option>
            <option value="phone">≡ƒô₧ Phone</option>
          </select>
          <select value={ticketFilter} onChange={e => setTicketFilter(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
          <select value={ticketPriorityFilter} onChange={e => setTicketPriorityFilter(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
            <option value="all">All Priorities</option>
   <option value="urgent">≡ƒö┤ Urgent</option>
            <option value="high">≡ƒƒá High</option>
            <option value="normal">ΓÜ¬ Normal</option>
          </select>
          <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${tagFilter !== "all" ? T.teal : T.border}`, background: T.surfaceAlt, color: tagFilter !== "all" ? T.teal : T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
            <option value="all">All Tags</option>
   {availableTags.map(t => <option key={t.id} value={t.id}>≡ƒÅ╖∩╕Å {t.label}</option>)}
          </select>
          <select value={assignmentFilter} onChange={e => setAssignmentFilter(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${assignmentFilter !== "all" ? T.purple : T.border}`, background: T.surfaceAlt, color: assignmentFilter !== "all" ? T.purple : T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
            <option value="all">All Agents</option>
            <option value="unassigned">≡ƒæñ Unassigned</option>
            {assignableAgents.filter(a => a.id !== "unassigned").map(a => <option key={a.id} value={a.id}>≡ƒæñ {a.name}</option>)}
          </select>
          {/* Custom Field Filter */}
          {customFields.length > 0 && (
            <select value={customFieldFilter.fieldId} onChange={e => setCustomFieldFilter({ fieldId: e.target.value, value: "" })}
              style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${customFieldFilter.fieldId ? T.cyan : T.border}`, background: T.surfaceAlt, color: customFieldFilter.fieldId ? T.cyan : T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
              <option value="">Custom Field...</option>
              {customFields.map(f => <option key={f.id} value={f.id}>≡ƒôï {f.name}</option>)}
            </select>
          )}
          {customFieldFilter.fieldId && (
            <input value={customFieldFilter.value} onChange={e => setCustomFieldFilter(prev => ({ ...prev, value: e.target.value }))} placeholder="Filter value..."
              style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.cyan}`, background: T.surfaceAlt, color: T.white, fontSize: 11, width: 100, fontFamily: "'Outfit',sans-serif" }} />
          )}
          <button type="button" onClick={() => setShowFieldsModal(true)}
            style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            title="Custom Fields">
   ΓÜÖ∩╕Å
          </button>
          <button type="button" onClick={() => setShowAutoAssignModal(true)}
            style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${autoAssignRules.filter(r => r.enabled).length > 0 ? T.green : T.border}`, background: autoAssignRules.filter(r => r.enabled).length > 0 ? `${T.green}15` : "transparent", color: autoAssignRules.filter(r => r.enabled).length > 0 ? T.green : T.textMuted, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            title="Auto-Assign Rules">
            ≡ƒñû {autoAssignRules.filter(r => r.enabled).length > 0 && <span style={{ fontSize: 9 }}>{autoAssignRules.filter(r => r.enabled).length}</span>}
          </button>
          <button type="button" onClick={() => setShowSlaModal(true)}
            style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            title="SLA Settings">
   ΓÅ▒∩╕Å
          </button>
          <button type="button" onClick={() => setShowWorkflowModal(true)}
            style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${workflowTriggers.filter(w => w.enabled).length > 0 ? T.purple : T.border}`, background: workflowTriggers.filter(w => w.enabled).length > 0 ? `${T.purple}15` : "transparent", color: workflowTriggers.filter(w => w.enabled).length > 0 ? T.purple : T.textMuted, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            title="Workflow Triggers">
            ΓÜí {workflowTriggers.filter(w => w.enabled).length > 0 && <span style={{ fontSize: 9 }}>{workflowTriggers.filter(w => w.enabled).length}</span>}
          </button>
        </div>
        )}
        {supportSubTab === "analytics" && (
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "90d", label: "90 Days" },
            ].map(r => (
              <button key={r.id} type="button" onClick={() => setAnalyticsRange(r.id)}
                style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${analyticsRange === r.id ? T.teal : T.border}`, background: analyticsRange === r.id ? `${T.teal}20` : "transparent", color: analyticsRange === r.id ? T.teal : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ANALYTICS VIEW */}
      {supportSubTab === "analytics" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* KPI Cards Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Total Tickets</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: T.white, fontFamily: "'Fraunces',serif" }}>{analytics.total}</span>
                {analytics.volumeChange !== 0 && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: analytics.volumeChange > 0 ? T.red : T.green }}>
                    {analytics.volumeChange > 0 ? "↑" : "↓"} {Math.abs(analytics.volumeChange)}%
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: T.textMuted }}>vs previous {analyticsRange}</div>
            </div>
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Avg Resolution</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: analytics.avgResolutionHrs && analytics.avgResolutionHrs > slaSettings.defaultHours ? T.red : T.green, fontFamily: "'Fraunces',serif" }}>
                  {analytics.avgResolutionHrs ? `${analytics.avgResolutionHrs}h` : "—"}
                </span>
              </div>
              <div style={{ fontSize: 10, color: T.textMuted }}>SLA target: {slaSettings.defaultHours}h</div>
            </div>
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>SLA Compliance</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: analytics.slaPercent >= 85 ? T.green : analytics.slaPercent >= 70 ? T.orange : T.red, fontFamily: "'Fraunces',serif" }}>
                  {analytics.slaPercent}%
                </span>
                {analytics.slaChange !== 0 && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: analytics.slaChange > 0 ? T.green : T.red }}>
                    {analytics.slaChange > 0 ? "↑" : "↓"} {Math.abs(analytics.slaChange)}%
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: T.textMuted }}>tickets resolved within SLA</div>
            </div>
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Resolved</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: T.green, fontFamily: "'Fraunces',serif" }}>{analytics.resolvedCount}</span>
              </div>
              <div style={{ fontSize: 10, color: T.textMuted }}>tickets closed in period</div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            {/* Ticket Volume Chart */}
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 16 }}>≡ƒôê Ticket Volume</div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.dailyVolume.slice(-14)} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.gold} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={T.gold} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.green} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="shortDate" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={{ stroke: T.border }} tickLine={false} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={{ stroke: T.border }} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: T.white, fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="created" name="Created" stroke={T.gold} fillOpacity={1} fill="url(#colorCreated)" strokeWidth={2} />
                    <Area type="monotone" dataKey="resolved" name="Resolved" stroke={T.green} fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 12, height: 3, background: T.gold, borderRadius: 2 }} />
                  <span style={{ fontSize: 10, color: T.textMuted }}>Created</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 12, height: 3, background: T.green, borderRadius: 2 }} />
                  <span style={{ fontSize: 10, color: T.textMuted }}>Resolved</span>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 16 }}>≡ƒôè By Category</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {analytics.categoryBreakdown.slice(0, 6).map(cat => (
                  <div key={cat.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: T.textSecondary }}>{cat.icon} {cat.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.white }}>{cat.count} ({cat.percent}%)</span>
                    </div>
                    <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${cat.percent}%`, background: cat.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
                {analytics.categoryBreakdown.length === 0 && (
                  <div style={{ padding: 20, textAlign: "center", color: T.textMuted, fontSize: 12 }}>No data</div>
                )}
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {/* Priority Breakdown */}
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 16 }}>≡ƒÄ» By Priority</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {analytics.priorityBreakdown.map(p => (
                  <div key={p.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: T.textSecondary }}>{p.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: p.color }}>{p.count}</span>
                    </div>
                    <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${analytics.total > 0 ? (p.count / analytics.total * 100) : 0}%`, background: p.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Breakdown */}
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 16 }}>≡ƒôï By Status</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {analytics.statusBreakdown.map(s => (
                  <div key={s.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: T.textSecondary }}>{s.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.count}</span>
                    </div>
                    <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${analytics.total > 0 ? (s.count / analytics.total * 100) : 0}%`, background: s.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution Time Buckets */}
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
   <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 16 }}>ΓÅ▒∩╕Å Resolution Time</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {analytics.resolutionBuckets.map((b, idx) => (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: T.textSecondary }}>{b.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: b.color }}>{b.count} ({b.percent}%)</span>
                    </div>
                    <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${b.percent}%`, background: b.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Agent Performance Table */}
          <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>≡ƒæÑ Agent Performance</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>Last {analyticsRange === "7d" ? "7 days" : analyticsRange === "30d" ? "30 days" : "90 days"}</div>
            </div>
            {analytics.agentPerformance.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: T.textMuted, fontSize: 12 }}>No agent data available</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      <th style={{ textAlign: "left", padding: "10px 12px", color: T.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Agent</th>
                      <th style={{ textAlign: "center", padding: "10px 12px", color: T.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Assigned</th>
                      <th style={{ textAlign: "center", padding: "10px 12px", color: T.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Resolved</th>
                      <th style={{ textAlign: "center", padding: "10px 12px", color: T.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Resolution Rate</th>
                      <th style={{ textAlign: "center", padding: "10px 12px", color: T.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Avg Time</th>
                      <th style={{ textAlign: "center", padding: "10px 12px", color: T.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>SLA %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.agentPerformance.slice(0, 10).map((agent, idx) => (
                      <tr key={agent.id} style={{ borderBottom: `1px solid ${T.border}20` }}>
                        <td style={{ padding: "12px", display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${T.purple}20`, display: "flex", alignItems: "center", justifyContent: "center", color: T.purple, fontWeight: 700, fontSize: 12 }}>
                            {agent.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: T.white }}>{agent.name}</div>
                            {idx === 0 && analytics.agentPerformance.length > 1 && (
                              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.gold}20`, color: T.gold }}>≡ƒÅå Top Performer</span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: "center", padding: "12px", color: T.textSecondary }}>{agent.assigned}</td>
                        <td style={{ textAlign: "center", padding: "12px", color: T.green, fontWeight: 600 }}>{agent.resolved}</td>
                        <td style={{ textAlign: "center", padding: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            <div style={{ width: 40, height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${agent.resolutionRate}%`, background: agent.resolutionRate >= 80 ? T.green : agent.resolutionRate >= 50 ? T.orange : T.red, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, color: agent.resolutionRate >= 80 ? T.green : agent.resolutionRate >= 50 ? T.orange : T.red, fontWeight: 600 }}>{agent.resolutionRate}%</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "center", padding: "12px", color: agent.avgResolution && agent.avgResolution > slaSettings.defaultHours ? T.red : T.textSecondary }}>
                          {agent.avgResolution ? `${agent.avgResolution}h` : "—"}
                        </td>
                        <td style={{ textAlign: "center", padding: "12px" }}>
                          <span style={{ padding: "4px 10px", borderRadius: 6, background: agent.slaPercent >= 85 ? `${T.green}20` : agent.slaPercent >= 70 ? `${T.orange}20` : `${T.red}20`, color: agent.slaPercent >= 85 ? T.green : agent.slaPercent >= 70 ? T.orange : T.red, fontWeight: 700, fontSize: 11 }}>
                            {agent.slaPercent}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SLA Compliance Trend + Workload */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            {/* SLA Trend Chart */}
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 16 }}>≡ƒôê SLA Compliance Trend</div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.slaTrend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="colorSla" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.teal} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={T.teal} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="date" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={{ stroke: T.border }} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={{ stroke: T.border }} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip 
                      contentStyle={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: T.white, fontWeight: 600 }}
                      formatter={(value, name) => [name === "compliance" ? `${value}%` : value, name === "compliance" ? "SLA %" : "Resolved"]}
                    />
                    <Area type="monotone" dataKey="compliance" name="SLA %" stroke={T.teal} fillOpacity={1} fill="url(#colorSla)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 12, height: 3, background: T.teal, borderRadius: 2 }} />
                  <span style={{ fontSize: 10, color: T.textMuted }}>SLA Compliance %</span>
                </div>
                <div style={{ padding: "4px 10px", borderRadius: 6, background: analytics.slaPercent >= 85 ? `${T.green}20` : analytics.slaPercent >= 70 ? `${T.orange}20` : `${T.red}20`, color: analytics.slaPercent >= 85 ? T.green : analytics.slaPercent >= 70 ? T.orange : T.red, fontSize: 11, fontWeight: 700 }}>
                  Current: {analytics.slaPercent}%
                </div>
              </div>
            </div>

            {/* Workload Distribution */}
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
   <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 16 }}>ΓÜû∩╕Å Current Workload</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {analytics.workloadDistribution.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: T.textMuted, fontSize: 12 }}>No open tickets</div>
                ) : (
                  analytics.workloadDistribution.slice(0, 6).map(agent => {
                    const maxCount = Math.max(...analytics.workloadDistribution.map(a => a.count));
                    const isOverloaded = agent.count > 10;
                    return (
                      <div key={agent.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: T.textSecondary, display: "flex", alignItems: "center", gap: 6 }}>
                            {agent.name}
   {isOverloaded && <span style={{ fontSize: 9, padding: "1px 4px", borderRadius: 3, background: `${T.red}20`, color: T.red }}>ΓÜá∩╕Å</span>}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: isOverloaded ? T.red : agent.id === "unassigned" ? T.orange : T.white }}>{agent.count}</span>
                        </div>
                        <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(agent.count / maxCount) * 100}%`, background: isOverloaded ? T.red : agent.id === "unassigned" ? T.orange : T.purple, borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {analytics.workloadDistribution.length > 0 && (
                <div style={{ marginTop: 16, padding: 12, background: T.surfaceAlt, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: T.textMuted }}>Total Open</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>{analytics.workloadDistribution.reduce((sum, a) => sum + a.count, 0)}</span>
                </div>
              )}
            </div>
          </div>

          {/* CSAT Section Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>≡ƒÿè Customer Satisfaction</div>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          {/* CSAT KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Avg CSAT Score</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: analytics.avgCsat && analytics.avgCsat >= 4 ? T.green : analytics.avgCsat && analytics.avgCsat >= 3 ? T.orange : T.red, fontFamily: "'Fraunces',serif" }}>
                  {analytics.avgCsat ? `${analytics.avgCsat}Γÿà` : "—"}
                </span>
                {analytics.csatChange !== 0 && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: analytics.csatChange > 0 ? T.green : T.red }}>
                    {analytics.csatChange > 0 ? "↑" : "↓"} {Math.abs(analytics.csatChange)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: T.textMuted }}>out of 5 stars</div>
            </div>
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Response Rate</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: analytics.csatResponseRate >= 50 ? T.green : analytics.csatResponseRate >= 25 ? T.orange : T.textSecondary, fontFamily: "'Fraunces',serif" }}>
                  {analytics.csatResponseRate}%
                </span>
              </div>
              <div style={{ fontSize: 10, color: T.textMuted }}>of resolved tickets rated</div>
            </div>
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Total Ratings</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: T.white, fontFamily: "'Fraunces',serif" }}>
                  {analytics.totalRatings}
                </span>
              </div>
              <div style={{ fontSize: 10, color: T.textMuted }}>feedback received</div>
            </div>
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Promoters</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: T.green, fontFamily: "'Fraunces',serif" }}>
                  {analytics.totalRatings > 0 ? Math.round((analytics.ratingDistribution.filter(r => r.rating >= 4).reduce((s, r) => s + r.count, 0) / analytics.totalRatings) * 100) : 0}%
                </span>
              </div>
              <div style={{ fontSize: 10, color: T.textMuted }}>rated 4-5 stars</div>
            </div>
          </div>

          {/* CSAT Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            {/* CSAT Trend */}
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 16 }}>≡ƒôê CSAT Trend</div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.csatTrend.filter(d => d.avgRating !== null)} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="colorCsat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.gold} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={T.gold} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="date" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={{ stroke: T.border }} tickLine={false} />
                    <YAxis domain={[1, 5]} tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={{ stroke: T.border }} tickLine={false} ticks={[1, 2, 3, 4, 5]} />
                    <Tooltip 
                      contentStyle={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: T.white, fontWeight: 600 }}
                      formatter={(value) => [`${value} Γÿà`, "Avg Rating"]}
                    />
                    <Area type="monotone" dataKey="avgRating" name="Avg Rating" stroke={T.gold} fillOpacity={1} fill="url(#colorCsat)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 12, height: 3, background: T.gold, borderRadius: 2 }} />
                  <span style={{ fontSize: 10, color: T.textMuted }}>Daily Average</span>
                </div>
                {analytics.avgCsat && (
                  <div style={{ padding: "4px 10px", borderRadius: 6, background: analytics.avgCsat >= 4 ? `${T.green}20` : analytics.avgCsat >= 3 ? `${T.orange}20` : `${T.red}20`, color: analytics.avgCsat >= 4 ? T.green : analytics.avgCsat >= 3 ? T.orange : T.red, fontSize: 11, fontWeight: 700 }}>
                    Period Avg: {analytics.avgCsat}Γÿà
                  </div>
                )}
              </div>
            </div>

            {/* Rating Distribution */}
            <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 16 }}>Γ¡É Rating Distribution</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {analytics.ratingDistribution.map(r => (
                  <div key={r.rating}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: T.textSecondary }}>{"Γ¡É".repeat(r.rating)}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: r.color }}>{r.count} ({r.percent}%)</span>
                    </div>
                    <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${r.percent}%`, background: r.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Agent CSAT Scores */}
          <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>≡ƒæÑ Agent CSAT Scores</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>Based on customer feedback</div>
            </div>
            {analytics.agentCsat.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: T.textMuted, fontSize: 12 }}>No CSAT data available</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      <th style={{ textAlign: "left", padding: "10px 12px", color: T.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Agent</th>
                      <th style={{ textAlign: "center", padding: "10px 12px", color: T.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Avg Score</th>
                      <th style={{ textAlign: "center", padding: "10px 12px", color: T.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Ratings</th>
                      <th style={{ textAlign: "left", padding: "10px 12px", color: T.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Recent Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.agentCsat.slice(0, 8).map((agent, idx) => (
                      <tr key={agent.id} style={{ borderBottom: `1px solid ${T.border}20` }}>
                        <td style={{ padding: "12px", display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${T.gold}20`, display: "flex", alignItems: "center", justifyContent: "center", color: T.gold, fontWeight: 700, fontSize: 12 }}>
                            {agent.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: T.white }}>{agent.name}</div>
                            {idx === 0 && analytics.agentCsat.length > 1 && (
                              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.gold}20`, color: T.gold }}>Γ¡É Highest Rated</span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: "center", padding: "12px" }}>
                          <span style={{ padding: "6px 12px", borderRadius: 8, background: agent.avgRating >= 4 ? `${T.green}20` : agent.avgRating >= 3 ? `${T.orange}20` : `${T.red}20`, color: agent.avgRating >= 4 ? T.green : agent.avgRating >= 3 ? T.orange : T.red, fontWeight: 700, fontSize: 14 }}>
                            {agent.avgRating}Γÿà
                          </span>
                        </td>
                        <td style={{ textAlign: "center", padding: "12px", color: T.textSecondary }}>{agent.totalRatings}</td>
                        <td style={{ padding: "12px", maxWidth: 250 }}>
                          {agent.recentComment ? (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                              <span style={{ fontSize: 10, color: agent.recentComment.rating >= 4 ? T.green : agent.recentComment.rating >= 3 ? T.orange : T.red }}>
                                {"Γÿà".repeat(agent.recentComment.rating)}
                              </span>
                              <span style={{ fontSize: 11, color: T.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                "{agent.recentComment.text.length > 40 ? agent.recentComment.text.slice(0, 40) + "..." : agent.recentComment.text}"
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: T.textMuted, fontStyle: "italic" }}>No comments</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Feedback */}
          <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 16 }}>≡ƒÆ¼ Recent Feedback</div>
            {analytics.recentFeedback.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: T.textMuted, fontSize: 12 }}>No feedback with comments yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {analytics.recentFeedback.slice(0, 5).map(feedback => (
                  <div key={feedback.id} style={{ padding: 14, background: T.surfaceAlt, borderRadius: 10, borderLeft: `3px solid ${feedback.rating >= 4 ? T.green : feedback.rating >= 3 ? T.orange : T.red}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, color: feedback.rating >= 4 ? T.green : feedback.rating >= 3 ? T.orange : T.red }}>
                          {"Γÿà".repeat(feedback.rating)}{"Γÿå".repeat(5 - feedback.rating)}
                        </span>
                        <span style={{ fontSize: 11, color: T.textMuted }}>by {feedback.userName || "Customer"}</span>
                      </div>
                      <span style={{ fontSize: 10, color: T.textMuted }}>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>"{feedback.comment}"</p>
                    <div style={{ marginTop: 8, fontSize: 10, color: T.textMuted }}>
                      Agent: <span style={{ color: T.purple }}>{feedback.agentName || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : supportSubTab === "livechat" ? (
        /* LIVE CHAT MANAGEMENT */
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Live Chat Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: agentOnline ? T.green : T.red, animation: agentOnline ? "pulse 2s infinite" : "none" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{agentOnline ? "Online" : "Offline"}</span>
              </div>
              <button type="button" onClick={() => setAgentOnline(!agentOnline)}
                style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${agentOnline ? T.red : T.green}40`, background: agentOnline ? `${T.red}10` : `${T.green}10`, color: agentOnline ? T.red : T.green, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                {agentOnline ? "Go Offline" : "Go Online"}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" onClick={() => setShowWidgetPreview(true)}
                style={{ padding: "8px 14px", borderRadius: 6, border: `1px solid ${T.teal}40`, background: `${T.teal}10`, color: T.teal, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
   ≡ƒæü∩╕Å Widget Preview
              </button>
              <button type="button" onClick={() => setShowChatSettings(true)}
                style={{ padding: "8px 14px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textSecondary, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
   ΓÜÖ∩╕Å Settings
              </button>
            </div>
          </div>

          {/* Chat Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {[
              { label: "Active Chats", value: liveChats.filter(c => c.status === "active").length, color: T.green, icon: "≡ƒÆ¼" },
   { label: "In Queue", value: chatQueue.length, color: chatQueue.length > 0 ? T.orange : T.textMuted, icon: "ΓÅ│" },
              { label: "Handled Today", value: liveChats.filter(c => c.status === "ended").length, color: T.teal, icon: "Γ£ô" },
   { label: "Avg Wait", value: chatQueue.length > 0 ? `${Math.round(chatQueue.reduce((a, c) => a + (Date.now() - new Date(c.queuedAt).getTime()) / 1000, 0) / chatQueue.length / 60)}m` : "—", color: T.textSecondary, icon: "ΓÅ▒∩╕Å" },
              { label: "Avg Duration", value: liveChats.filter(c => c.duration).length > 0 ? `${Math.round(liveChats.filter(c => c.duration).reduce((a, c) => a + c.duration, 0) / liveChats.filter(c => c.duration).length / 60)}m` : "—", color: T.textSecondary, icon: "≡ƒôè" },
            ].map((stat, i) => (
              <div key={i} style={{ padding: 16, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: stat.color, fontFamily: "'Fraunces',serif" }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: activeChatId ? "300px 1fr" : "1fr 1fr", gap: 16 }}>
            {/* Queue Section */}
            <div style={{ padding: 16, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
   <span style={{ fontSize: 14, fontWeight: 700, color: T.white }}>ΓÅ│ Queue</span>
                  {chatQueue.length > 0 && (
                    <span style={{ padding: "2px 8px", borderRadius: 10, background: `${T.orange}20`, color: T.orange, fontSize: 11, fontWeight: 600 }}>{chatQueue.length} waiting</span>
                  )}
                </div>
                {chatQueue.length > 0 && (
                  <button type="button" onClick={() => {
                    const next = chatQueue[0];
                    setChatQueue(prev => prev.slice(1));
                    setLiveChats(prev => [...prev, { ...next, status: "active", assignedTo: adminUser?.uid, assignedToName: adminUser?.displayName || adminUser?.email?.split("@")[0], startedAt: new Date().toISOString() }]);
                    setActiveChatId(next.id);
                    notify("Chat accepted");
                  }}
                    style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: T.green, color: T.white, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    Accept Next
                  </button>
                )}
              </div>
              
              {chatQueue.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", color: T.textMuted }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>≡ƒÄë</div>
                  <div style={{ fontSize: 12 }}>No visitors waiting</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {chatQueue.map((visitor, idx) => {
                    const waitTime = Math.round((Date.now() - new Date(visitor.queuedAt).getTime()) / 1000);
                    const waitMins = Math.floor(waitTime / 60);
                    const waitSecs = waitTime % 60;
                    return (
                      <div key={visitor.id} style={{ padding: 12, background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${waitMins >= 3 ? T.red : waitMins >= 1 ? T.orange : T.border}30` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{visitor.visitorName || "Visitor"}</div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>{visitor.visitorEmail || "No email"}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.gold}20`, color: T.gold, textTransform: "uppercase" }}>{visitor.visitorTier || "free"}</span>
                            <span style={{ fontSize: 10, padding: "3px 6px", borderRadius: 4, background: waitMins >= 3 ? `${T.red}20` : waitMins >= 1 ? `${T.orange}20` : T.surface, color: waitMins >= 3 ? T.red : waitMins >= 1 ? T.orange : T.textMuted, fontWeight: 600, fontFamily: "'Fraunces',serif" }}>
                              {waitMins}:{waitSecs.toString().padStart(2, "0")}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          "{visitor.initialMessage || "Started chat..."}"
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" onClick={() => {
                            setChatQueue(prev => prev.filter(c => c.id !== visitor.id));
                            setLiveChats(prev => [...prev, { ...visitor, status: "active", assignedTo: adminUser?.uid, assignedToName: adminUser?.displayName || adminUser?.email?.split("@")[0], startedAt: new Date().toISOString() }]);
                            setActiveChatId(visitor.id);
                            notify("Chat accepted");
                          }}
                            style={{ flex: 1, padding: "6px 10px", borderRadius: 5, border: "none", background: T.green, color: T.white, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                            Accept
                          </button>
                          <button type="button" onClick={() => { setChatQueue(prev => prev.filter(c => c.id !== visitor.id)); notify("Visitor dismissed"); }}
                            style={{ padding: "6px 10px", borderRadius: 5, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, cursor: "pointer" }}>
                            Dismiss
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Demo: Add to Queue */}
              <button type="button" onClick={() => {
                const demoVisitors = [
                  { name: "Sarah M.", email: "sarah@example.com", tier: "pro", msg: "How do I export my data?" },
                  { name: "Ahmed K.", email: "ahmed@business.ae", tier: "enterprise", msg: "Urgent: Dashboard not loading!" },
                  { name: "Mike T.", email: "mike@gmail.com", tier: "free", msg: "Billing question about upgrade" },
                  { name: "Lisa R.", email: "lisa@startup.io", tier: "pro", msg: "Feature request for reports" },
                ];
                const demo = demoVisitors[Math.floor(Math.random() * demoVisitors.length)];
                const newChat = {
                  id: `chat_${Date.now()}`,
                  visitorName: demo.name,
                  visitorEmail: demo.email,
                  visitorTier: demo.tier,
                  initialMessage: demo.msg,
                  messages: [{ from: "visitor", text: demo.msg, at: new Date().toISOString() }],
                  queuedAt: new Date().toISOString(),
                  status: "queued",
                  channel: "chat"
                };
                setChatQueue(prev => [...prev, newChat]);
                notify("New visitor in queue!");
              }}
                style={{ marginTop: 12, width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px dashed ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, cursor: "pointer" }}>
                + Simulate Visitor (Demo)
              </button>
            </div>

            {/* Active Chats / Chat Window */}
            {activeChatId ? (
              /* Active Chat Window */
              (() => {
                const chat = liveChats.find(c => c.id === activeChatId);
                if (!chat) return null;
                const chatDuration = chat.startedAt ? Math.round((Date.now() - new Date(chat.startedAt).getTime()) / 1000) : 0;
                const durMins = Math.floor(chatDuration / 60);
                const durSecs = chatDuration % 60;
                return (
                  <div style={{ display: "flex", flexDirection: "column", background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                    {/* Chat Header */}
                    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${T.green}20`, display: "flex", alignItems: "center", justifyContent: "center", color: T.green, fontWeight: 700, fontSize: 14 }}>
                          {(chat.visitorName || "V")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: T.white }}>{chat.visitorName || "Visitor"}</div>
                          <div style={{ fontSize: 11, color: T.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                            <span>{chat.visitorEmail}</span>
                            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.gold}20`, color: T.gold, textTransform: "uppercase" }}>{chat.visitorTier}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 12, color: T.textMuted, fontFamily: "'Fraunces',serif" }}>
                          ≡ƒòÉ {durMins}:{durSecs.toString().padStart(2, "0")}
                        </div>
                        <button type="button" onClick={() => setActiveChatId(null)}
                          style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, cursor: "pointer" }}>
                          ΓåÉ Back
                        </button>
                        <button type="button" onClick={async () => {
                          // Convert to ticket
                          const ticketData = {
                            userId: chat.visitorId || "guest",
                            userEmail: chat.visitorEmail || "guest@chat",
                            userName: chat.visitorName || "Chat Visitor",
                            userTier: chat.visitorTier || "free",
                            subject: chat.initialMessage || "Live Chat Conversation",
                            category: "general",
                            priority: "normal",
                            status: "open",
                            channel: "chat",
                            chatId: chat.id,
                            messages: chat.messages.map(m => ({ from: m.from === "visitor" ? "user" : "admin", text: m.text, at: m.at, by: m.from === "admin" ? adminUser?.email : chat.visitorEmail })),
                            createdAt: new Date().toISOString()
                          };
                          try {
                            const docRef = await addDoc(collection(db, "supportTickets"), ticketData);
                            setTickets(prev => [{ id: docRef.id, ...ticketData }, ...prev]);
                            setLiveChats(prev => prev.map(c => c.id === chat.id ? { ...c, status: "ended", convertedToTicket: docRef.id, endedAt: new Date().toISOString(), duration: chatDuration } : c));
                            setActiveChatId(null);
                            notify("Converted to ticket #" + docRef.id.slice(0, 6));
                          } catch (e) { notify("Error: " + e.message); }
                        }}
                          style={{ padding: "6px 10px", borderRadius: 5, border: `1px solid ${T.teal}40`, background: `${T.teal}10`, color: T.teal, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                          ≡ƒôº Convert to Ticket
                        </button>
                        <button type="button" onClick={() => {
                          setLiveChats(prev => prev.map(c => c.id === chat.id ? { ...c, status: "ended", endedAt: new Date().toISOString(), duration: chatDuration } : c));
                          setActiveChatId(null);
                          notify("Chat ended");
                        }}
                          style={{ padding: "6px 10px", borderRadius: 5, border: `1px solid ${T.red}40`, background: `${T.red}10`, color: T.red, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                          End Chat
                        </button>
                      </div>
                    </div>
                    
                    {/* Messages */}
                    <div style={{ flex: 1, padding: 16, overflowY: "auto", maxHeight: 350, display: "flex", flexDirection: "column", gap: 10 }}>
                      {(chat.messages || []).map((msg, i) => (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.from === "admin" ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: 12, background: msg.from === "admin" ? T.gold : T.surfaceAlt, color: msg.from === "admin" ? T.bg : T.white, fontSize: 13, lineHeight: 1.5, borderBottomRightRadius: msg.from === "admin" ? 4 : 12, borderBottomLeftRadius: msg.from === "admin" ? 12 : 4 }}>
                            {msg.text}
                          </div>
                          <div style={{ fontSize: 9, color: T.textMuted, marginTop: 4 }}>
                            {new Date(msg.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Message Input */}
                    <div style={{ padding: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 10 }}>
                      <input value={chatMessage} onChange={e => setChatMessage(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && chatMessage.trim()) {
                            setLiveChats(prev => prev.map(c => c.id === chat.id ? { ...c, messages: [...(c.messages || []), { from: "admin", text: chatMessage, at: new Date().toISOString() }] } : c));
                            setChatMessage("");
                          }
                        }}
                        placeholder="Type a message... Press Enter to send"
                        style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }} />
                      <button type="button" onClick={() => {
                        if (!chatMessage.trim()) return;
                        setLiveChats(prev => prev.map(c => c.id === chat.id ? { ...c, messages: [...(c.messages || []), { from: "admin", text: chatMessage, at: new Date().toISOString() }] } : c));
                        setChatMessage("");
                      }}
                        style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: chatMessage.trim() ? T.gold : T.border, color: T.bg, fontSize: 13, fontWeight: 700, cursor: chatMessage.trim() ? "pointer" : "not-allowed" }}>
                        Send
                      </button>
                    </div>
                    
                    {/* Simulate visitor reply */}
                    <div style={{ padding: "8px 12px", borderTop: `1px solid ${T.border}`, background: T.surfaceAlt }}>
                      <button type="button" onClick={() => {
                        const replies = ["Thanks, that helps!", "Can you explain more?", "I'm still having issues", "Perfect, that worked!", "How long will this take?"];
                        const reply = replies[Math.floor(Math.random() * replies.length)];
                        setLiveChats(prev => prev.map(c => c.id === chat.id ? { ...c, messages: [...(c.messages || []), { from: "visitor", text: reply, at: new Date().toISOString() }] } : c));
                      }}
                        style={{ width: "100%", padding: "6px 12px", borderRadius: 5, border: `1px dashed ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, cursor: "pointer" }}>
                        ≡ƒÆ¼ Simulate Visitor Reply (Demo)
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* Active Chats List */
              <div style={{ padding: 16, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.white }}>≡ƒƒó Active Chats</span>
                    {liveChats.filter(c => c.status === "active").length > 0 && (
                      <span style={{ padding: "2px 8px", borderRadius: 10, background: `${T.green}20`, color: T.green, fontSize: 11, fontWeight: 600 }}>{liveChats.filter(c => c.status === "active").length} live</span>
                    )}
                  </div>
                </div>
                
                {liveChats.filter(c => c.status === "active").length === 0 ? (
                  <div style={{ padding: 30, textAlign: "center", color: T.textMuted }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>≡ƒÆ¼</div>
                    <div style={{ fontSize: 12 }}>No active chats</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Accept a visitor from the queue to start</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {liveChats.filter(c => c.status === "active").map(chat => {
                      const duration = chat.startedAt ? Math.round((Date.now() - new Date(chat.startedAt).getTime()) / 1000) : 0;
                      const mins = Math.floor(duration / 60);
                      const secs = duration % 60;
                      const lastMsg = chat.messages?.length > 0 ? chat.messages[chat.messages.length - 1] : null;
                      return (
                        <div key={chat.id} onClick={() => setActiveChatId(chat.id)}
                          style={{ padding: 14, background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.green}30`, cursor: "pointer", transition: "all 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = T.green}
                          onMouseLeave={e => e.currentTarget.style.borderColor = `${T.green}30`}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${T.green}20`, display: "flex", alignItems: "center", justifyContent: "center", color: T.green, fontWeight: 700, fontSize: 12 }}>
                                {(chat.visitorName || "V")[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{chat.visitorName}</div>
                                <div style={{ fontSize: 10, color: T.textMuted }}>{chat.visitorEmail}</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.gold}20`, color: T.gold, textTransform: "uppercase" }}>{chat.visitorTier}</span>
                              <span style={{ fontSize: 10, color: T.green, fontFamily: "'Fraunces',serif" }}>{mins}:{secs.toString().padStart(2, "0")}</span>
                            </div>
                          </div>
                          {lastMsg && (
                            <div style={{ fontSize: 11, color: lastMsg.from === "visitor" ? T.textSecondary : T.textMuted, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {lastMsg.from === "admin" ? "You: " : ""}{lastMsg.text}
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 10, color: T.textMuted }}>{chat.messages?.length || 0} messages</span>
                            <span style={{ fontSize: 10, color: T.green }}>Click to open ΓåÆ</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Ended Chats Today */}
                {liveChats.filter(c => c.status === "ended").length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Ended Today ({liveChats.filter(c => c.status === "ended").length})</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {liveChats.filter(c => c.status === "ended").slice(0, 5).map(chat => (
                        <div key={chat.id} style={{ padding: 10, background: T.surfaceAlt, borderRadius: 8, opacity: 0.7 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 500, color: T.textSecondary }}>{chat.visitorName}</span>
                              <span style={{ fontSize: 10, color: T.textMuted }}>{chat.messages?.length || 0} msgs</span>
                              {chat.convertedToTicket && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.teal}20`, color: T.teal }}>ΓåÆ Ticket</span>}
                            </div>
                            <span style={{ fontSize: 10, color: T.textMuted }}>{chat.duration ? `${Math.floor(chat.duration / 60)}m ${chat.duration % 60}s` : "—"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Embed Code Section */}
          <div style={{ padding: 16, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 12 }}>≡ƒöù Widget Embed Code</div>
            <div style={{ padding: 12, background: T.bg, borderRadius: 8, fontFamily: "monospace", fontSize: 11, color: T.teal, lineHeight: 1.6, overflow: "auto" }}>
              {`<script src="https://chat.dxbanalytics.com/widget.js"></script>\n<script>\n  DXBChat.init({\n    apiKey: "your_api_key",\n    color: "${chatSettings.widgetColor}",\n    position: "${chatSettings.widgetPosition}",\n    welcomeMessage: "${chatSettings.welcomeMessage}"\n  });\n</script>`}
            </div>
            <button type="button" onClick={() => { navigator.clipboard.writeText(`<script src="https://chat.dxbanalytics.com/widget.js"></script>\n<script>\n  DXBChat.init({\n    apiKey: "your_api_key",\n    color: "${chatSettings.widgetColor}",\n    position: "${chatSettings.widgetPosition}"\n  });\n</script>`); notify("Embed code copied!"); }}
              style={{ marginTop: 10, padding: "8px 16px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textSecondary, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              ≡ƒôï Copy Code
            </button>
          </div>
        </div>
      ) : supportSubTab === "whatsapp" ? (
        /* WHATSAPP MANAGEMENT */
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* WhatsApp Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 18 }}>≡ƒô▒</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>WhatsApp Business</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>+971 4 XXX XXXX</div>
                </div>
              </div>
              <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: "#25D36620", color: "#25D366", fontWeight: 600 }}>Γ£ô Connected</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" onClick={() => setShowWhatsappTemplates(true)}
                style={{ padding: "8px 14px", borderRadius: 6, border: `1px solid #25D36640`, background: "#25D36610", color: "#25D366", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                ≡ƒô¥ Message Templates
              </button>
            </div>
          </div>

          {/* WhatsApp Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {[
              { label: "Active", value: whatsappConversations.filter(c => c.status === "active").length, color: "#25D366", icon: "≡ƒÆ¼" },
              { label: "Unread", value: whatsappConversations.filter(c => !c.responded && c.status === "active").length, color: T.orange, icon: "≡ƒöö" },
              { label: "Today", value: whatsappConversations.filter(c => new Date(c.createdAt) > new Date(Date.now() - 86400000)).length, color: T.teal, icon: "≡ƒôè" },
              { label: "Converted", value: whatsappConversations.filter(c => c.convertedToTicket).length, color: T.purple, icon: "≡ƒÄ½" },
   { label: "Avg Response", value: "~5m", color: T.textSecondary, icon: "ΓÅ▒∩╕Å" },
            ].map((stat, i) => (
              <div key={i} style={{ padding: 16, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: stat.color, fontFamily: "'Fraunces',serif" }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: activeWhatsappId ? "300px 1fr" : "1fr", gap: 16 }}>
            {/* Conversations List */}
            <div style={{ padding: 16, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.white }}>≡ƒô▒ Conversations</span>
                  {whatsappConversations.filter(c => c.status === "active").length > 0 && (
                    <span style={{ padding: "2px 8px", borderRadius: 10, background: "#25D36620", color: "#25D366", fontSize: 11, fontWeight: 600 }}>{whatsappConversations.filter(c => c.status === "active").length}</span>
                  )}
                </div>
              </div>
              
              {whatsappConversations.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", color: T.textMuted }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>≡ƒô▒</div>
                  <div style={{ fontSize: 12 }}>No WhatsApp conversations</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Messages will appear here when customers contact you</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {whatsappConversations.map(conv => {
                    const lastMsg = conv.messages?.length > 0 ? conv.messages[conv.messages.length - 1] : null;
                    const windowRemaining = conv.lastCustomerMessage ? Math.max(0, 24 - (Date.now() - new Date(conv.lastCustomerMessage).getTime()) / 3600000) : 0;
                    return (
                      <div key={conv.id} onClick={() => setActiveWhatsappId(conv.id)}
                        style={{ padding: 12, background: activeWhatsappId === conv.id ? `#25D36615` : T.surfaceAlt, borderRadius: 10, border: `1px solid ${activeWhatsappId === conv.id ? "#25D366" : conv.responded ? T.border : "#25D36640"}`, cursor: "pointer", transition: "all 0.15s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `#25D36620`, display: "flex", alignItems: "center", justifyContent: "center", color: "#25D366", fontWeight: 700, fontSize: 12 }}>
                              {(conv.customerName || "W")[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{conv.customerName || "Unknown"}</div>
                              <div style={{ fontSize: 10, color: T.textMuted }}>{conv.phoneNumber}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                            <span style={{ fontSize: 9, color: T.textMuted }}>{timeAgo(lastMsg?.at || conv.createdAt)}</span>
                            {!conv.responded && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#25D366" }} />}
                          </div>
                        </div>
                        {lastMsg && (
                          <div style={{ fontSize: 11, color: lastMsg.from === "customer" ? T.textSecondary : T.textMuted, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {lastMsg.from === "agent" ? "You: " : ""}{lastMsg.text}
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.gold}20`, color: T.gold, textTransform: "uppercase" }}>{conv.customerTier || "free"}</span>
                          {windowRemaining > 0 ? (
   <span style={{ fontSize: 9, color: windowRemaining < 4 ? T.orange : T.textMuted }}>ΓÅ▒∩╕Å {Math.round(windowRemaining)}h window</span>
                          ) : (
   <span style={{ fontSize: 9, color: T.red }}>ΓÜá∩╕Å Window expired</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Demo: Add WhatsApp Conversation */}
              <button type="button" onClick={() => {
                const demoCustomers = [
                  { name: "Sarah M.", phone: "+971 50 123 4567", tier: "pro", msg: "Hi, I need help with my subscription" },
                  { name: "Ahmed K.", phone: "+971 55 987 6543", tier: "enterprise", msg: "Urgent: Can't access my dashboard" },
                  { name: "Mike T.", phone: "+971 52 456 7890", tier: "free", msg: "How do I upgrade my account?" },
                  { name: "Fatima R.", phone: "+971 54 321 0987", tier: "pro", msg: "Question about the API limits" },
                ];
                const demo = demoCustomers[Math.floor(Math.random() * demoCustomers.length)];
                const newConv = {
                  id: `wa_${Date.now()}`,
                  customerName: demo.name,
                  phoneNumber: demo.phone,
                  customerTier: demo.tier,
                  messages: [{ from: "customer", text: demo.msg, at: new Date().toISOString() }],
                  lastCustomerMessage: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                  status: "active",
                  responded: false,
                  channel: "whatsapp"
                };
                setWhatsappConversations(prev => [newConv, ...prev]);
                notify("New WhatsApp message!");
              }}
                style={{ marginTop: 12, width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px dashed ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, cursor: "pointer" }}>
                + Simulate WhatsApp Message (Demo)
              </button>
            </div>

            {/* Active Conversation Window */}
            {activeWhatsappId && (() => {
              const conv = whatsappConversations.find(c => c.id === activeWhatsappId);
              if (!conv) return null;
              const windowRemaining = conv.lastCustomerMessage ? Math.max(0, 24 - (Date.now() - new Date(conv.lastCustomerMessage).getTime()) / 3600000) : 0;
              const canSendFreeform = windowRemaining > 0;
              
              return (
                <div style={{ display: "flex", flexDirection: "column", background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                  {/* Conversation Header */}
                  <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#25D36608" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#25D36620", display: "flex", alignItems: "center", justifyContent: "center", color: "#25D366", fontWeight: 700, fontSize: 16 }}>
                        {(conv.customerName || "W")[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T.white }}>{conv.customerName}</div>
                        <div style={{ fontSize: 11, color: T.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{conv.phoneNumber}</span>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.gold}20`, color: T.gold, textTransform: "uppercase" }}>{conv.customerTier}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {/* 24hr Window Indicator */}
                      <div style={{ padding: "6px 10px", borderRadius: 6, background: canSendFreeform ? `${T.green}15` : `${T.red}15`, border: `1px solid ${canSendFreeform ? T.green : T.red}30` }}>
                        <div style={{ fontSize: 9, color: T.textMuted }}>24hr Window</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: canSendFreeform ? T.green : T.red, fontFamily: "'Fraunces',serif" }}>
                          {canSendFreeform ? `${Math.floor(windowRemaining)}h ${Math.round((windowRemaining % 1) * 60)}m left` : "Expired"}
                        </div>
                      </div>
                      <button type="button" onClick={() => setActiveWhatsappId(null)}
                        style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, cursor: "pointer" }}>
                        ΓåÉ Back
                      </button>
                      <button type="button" onClick={async () => {
                        // Convert to ticket
                        const ticketData = {
                          userId: conv.customerId || "guest",
                          userEmail: conv.customerEmail || `${conv.phoneNumber.replace(/\s/g, "")}@whatsapp`,
                          userName: conv.customerName || "WhatsApp User",
                          userTier: conv.customerTier || "free",
                          subject: conv.messages?.[0]?.text || "WhatsApp Conversation",
                          category: "general",
                          priority: "normal",
                          status: "open",
                          channel: "whatsapp",
                          phoneNumber: conv.phoneNumber,
                          whatsappId: conv.id,
                          messages: conv.messages.map(m => ({ from: m.from === "customer" ? "user" : "admin", text: m.text, at: m.at, by: m.from === "agent" ? adminUser?.email : conv.customerEmail })),
                          createdAt: new Date().toISOString()
                        };
                        try {
                          const docRef = await addDoc(collection(db, "supportTickets"), ticketData);
                          setTickets(prev => [{ id: docRef.id, ...ticketData }, ...prev]);
                          setWhatsappConversations(prev => prev.map(c => c.id === conv.id ? { ...c, convertedToTicket: docRef.id } : c));
                          notify("Converted to ticket #" + docRef.id.slice(0, 6));
                        } catch (e) { notify("Error: " + e.message); }
                      }}
                        style={{ padding: "6px 10px", borderRadius: 5, border: `1px solid ${T.teal}40`, background: `${T.teal}10`, color: T.teal, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                        ≡ƒÄ½ Convert to Ticket
                      </button>
                    </div>
                  </div>
                  
                  {/* Messages */}
                  <div style={{ flex: 1, padding: 16, overflowY: "auto", maxHeight: 350, display: "flex", flexDirection: "column", gap: 10, background: "#f0f2f5" }}>
                    {(conv.messages || []).map((msg, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.from === "agent" ? "flex-end" : "flex-start" }}>
                        <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: 8, background: msg.from === "agent" ? "#DCF8C6" : "#fff", color: "#111", fontSize: 13, lineHeight: 1.5, boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
                          {msg.text}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                          <span style={{ fontSize: 9, color: "#667781" }}>
                            {new Date(msg.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {msg.from === "agent" && <span style={{ fontSize: 9, color: "#53BDEB" }}>Γ£ôΓ£ô</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Message Input */}
                  <div style={{ padding: 12, borderTop: `1px solid ${T.border}`, background: T.surface }}>
                    {!canSendFreeform && (
                      <div style={{ padding: 10, background: `${T.orange}10`, borderRadius: 8, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
   <span style={{ fontSize: 16 }}>ΓÜá∩╕Å</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: T.orange }}>24-hour window expired</div>
                          <div style={{ fontSize: 10, color: T.textMuted }}>You can only send pre-approved template messages. Click "Templates" below.</div>
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button type="button" onClick={() => setShowWhatsappTemplates(true)}
                        style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid #25D36640`, background: "#25D36610", color: "#25D366", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        ≡ƒô¥ Templates
                      </button>
                      <input value={whatsappMessage} onChange={e => setWhatsappMessage(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && whatsappMessage.trim() && canSendFreeform) {
                            setWhatsappConversations(prev => prev.map(c => c.id === conv.id ? { ...c, messages: [...(c.messages || []), { from: "agent", text: whatsappMessage, at: new Date().toISOString() }], responded: true } : c));
                            setWhatsappMessage("");
                          }
                        }}
                        placeholder={canSendFreeform ? "Type a message..." : "Use a template message"}
                        disabled={!canSendFreeform}
                        style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: canSendFreeform ? T.bg : T.surfaceAlt, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", opacity: canSendFreeform ? 1 : 0.5 }} />
                      <button type="button" onClick={() => {
                        if (!whatsappMessage.trim() || !canSendFreeform) return;
                        setWhatsappConversations(prev => prev.map(c => c.id === conv.id ? { ...c, messages: [...(c.messages || []), { from: "agent", text: whatsappMessage, at: new Date().toISOString() }], responded: true } : c));
                        setWhatsappMessage("");
                      }}
                        disabled={!whatsappMessage.trim() || !canSendFreeform}
                        style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: whatsappMessage.trim() && canSendFreeform ? "#25D366" : T.border, color: "#fff", fontSize: 13, fontWeight: 700, cursor: whatsappMessage.trim() && canSendFreeform ? "pointer" : "not-allowed" }}>
                        Send
                      </button>
                    </div>
                  </div>
                  
                  {/* Simulate customer reply */}
                  <div style={{ padding: "8px 12px", borderTop: `1px solid ${T.border}`, background: T.surfaceAlt }}>
                    <button type="button" onClick={() => {
                      const replies = ["Thanks for the quick response!", "Can you help me with something else?", "That worked, thank you!", "I'm still having the same issue", "When will this be fixed?"];
                      const reply = replies[Math.floor(Math.random() * replies.length)];
                      setWhatsappConversations(prev => prev.map(c => c.id === conv.id ? { ...c, messages: [...(c.messages || []), { from: "customer", text: reply, at: new Date().toISOString() }], lastCustomerMessage: new Date().toISOString(), responded: false } : c));
                    }}
                      style={{ width: "100%", padding: "6px 12px", borderRadius: 5, border: `1px dashed ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, cursor: "pointer" }}>
                      ≡ƒô▒ Simulate Customer Reply (Demo)
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* WhatsApp API Info */}
          <div style={{ padding: 16, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 8 }}>≡ƒô▒ WhatsApp Business API</div>
                <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>
                  Connected via Meta Business API. Messages from customers open a 24-hour free-form messaging window.<br />
                  Outside this window, you must use pre-approved message templates.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" style={{ padding: "8px 14px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textSecondary, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
   ΓÜÖ∩╕Å API Settings
                </button>
                <button type="button" style={{ padding: "8px 14px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textSecondary, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  ≡ƒôè Delivery Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : supportSubTab === "kb" ? (
        /* KNOWLEDGE BASE & TOOLS */
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* KB Categories */}
          {(() => {
            const kbCategories = [
              { id: "getting-started", label: "Getting Started", icon: "≡ƒÜÇ" },
   { id: "billing", label: "Billing & Payments", icon: "≡ƒÆ│" },
              { id: "technical", label: "Technical Issues", icon: "≡ƒöº" },
              { id: "features", label: "Features & How-To", icon: "Γ¡É" },
              { id: "account", label: "Account Management", icon: "≡ƒæñ" },
            ];
            
            const qrCategories = [
              { id: "general", label: "General", icon: "≡ƒÆ¼" },
              { id: "technical", label: "Technical", icon: "≡ƒöº" },
   { id: "billing", label: "Billing", icon: "≡ƒÆ│" },
            ];
            
            const filteredArticles = kbArticles.filter(a => {
              if (kbCategory !== "all" && a.category !== kbCategory) return false;
              if (kbSearch) {
                const s = kbSearch.toLowerCase();
                return a.title.toLowerCase().includes(s) || a.content.toLowerCase().includes(s) || (a.tags || []).some(t => t.toLowerCase().includes(s));
              }
              return true;
            });
            
            const articlesByCategory = kbCategories.map(cat => ({
              ...cat,
              articles: filteredArticles.filter(a => a.category === cat.id)
            })).filter(cat => cat.articles.length > 0 || kbCategory === "all");
            
            return (
              <>
                {/* Knowledge Base Section */}
                <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.white, display: "flex", alignItems: "center", gap: 8 }}>
                      ≡ƒôÜ Knowledge Base
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: `${T.teal}20`, color: T.teal }}>{kbArticles.length} articles</span>
                    </div>
                    <button type="button" onClick={() => { setEditingArticle(null); setArticleForm({ title: "", content: "", category: "getting-started", tags: "" }); setShowKbModal(true); }}
                      style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: T.teal, color: T.white, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      + New Article
                    </button>
                  </div>
                  
                  {/* Search & Filter */}
                  <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                    <input value={kbSearch} onChange={e => setKbSearch(e.target.value)} placeholder="Search articles..."
                      style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif" }} />
                    <select value={kbCategory} onChange={e => setKbCategory(e.target.value)}
                      style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                      <option value="all">All Categories</option>
                      {kbCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                  </div>
                  
                  {/* Article View */}
                  {viewingArticle ? (
                    <div style={{ padding: 20, background: T.surfaceAlt, borderRadius: 10 }}>
                      <button type="button" onClick={() => setViewingArticle(null)}
                        style={{ marginBottom: 16, padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 11, cursor: "pointer" }}>
                        ΓåÉ Back to articles
                      </button>
                      <h3 style={{ margin: "0 0 12px 0", fontSize: 18, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>{viewingArticle.title}</h3>
                      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: `${T.teal}20`, color: T.teal }}>
                          {kbCategories.find(c => c.id === viewingArticle.category)?.icon} {kbCategories.find(c => c.id === viewingArticle.category)?.label}
                        </span>
                        <span style={{ fontSize: 10, color: T.textMuted }}>≡ƒæü {viewingArticle.views || 0} views</span>
                        <span style={{ fontSize: 10, color: T.textMuted }}>≡ƒæì {viewingArticle.helpful || 0} helpful</span>
                      </div>
                      <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{viewingArticle.content}</div>
                      {viewingArticle.tags?.length > 0 && (
                        <div style={{ marginTop: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {viewingArticle.tags.map(tag => (
                            <span key={tag} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: T.surface, color: T.textMuted }}>#{tag}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                        <button type="button" onClick={() => { setEditingArticle(viewingArticle); setArticleForm({ title: viewingArticle.title, content: viewingArticle.content, category: viewingArticle.category, tags: (viewingArticle.tags || []).join(", ") }); setShowKbModal(true); }}
                          style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 11, cursor: "pointer" }}>
   Γ£Å∩╕Å Edit
                        </button>
                        <button type="button" onClick={async () => {
                          if (!window.confirm("Delete this article?")) return;
                          try {
                            await deleteDoc(doc(db, "supportKnowledgeBase", viewingArticle.id));
                            setKbArticles(prev => prev.filter(a => a.id !== viewingArticle.id));
                            setViewingArticle(null);
                            notify("Article deleted");
                          } catch (e) { notify("Error: " + e.message); }
                        }}
                          style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${T.red}40`, background: `${T.red}10`, color: T.red, fontSize: 11, cursor: "pointer" }}>
   ≡ƒùæ∩╕Å Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Categories Accordion */
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {articlesByCategory.length === 0 ? (
                        <div style={{ padding: 30, textAlign: "center", color: T.textMuted }}>
                          <div style={{ fontSize: 24, marginBottom: 8 }}>≡ƒôÜ</div>
                          <div style={{ fontSize: 12 }}>No articles found. Create your first article!</div>
                        </div>
                      ) : (
                        articlesByCategory.map(cat => (
                          <div key={cat.id} style={{ background: T.surfaceAlt, borderRadius: 10, overflow: "hidden" }}>
                            <button type="button" onClick={() => setExpandedKbCategory(expandedKbCategory === cat.id ? null : cat.id)}
                              style={{ width: "100%", padding: "14px 16px", background: "transparent", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>
                                {cat.icon} {cat.label} <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 400 }}>({cat.articles.length})</span>
                              </span>
   <span style={{ color: T.textMuted, fontSize: 12 }}>{expandedKbCategory === cat.id ? "Γû╝" : "Γû╢"}</span>
                            </button>
                            {expandedKbCategory === cat.id && (
                              <div style={{ padding: "0 16px 16px" }}>
                                {cat.articles.map(article => (
                                  <div key={article.id} onClick={() => setViewingArticle(article)}
                                    style={{ padding: "12px 14px", marginTop: 8, background: T.surface, borderRadius: 8, cursor: "pointer", border: `1px solid ${T.border}`, transition: "border-color 0.15s" }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = T.teal}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: T.white, marginBottom: 4 }}>{article.title}</div>
                                    <div style={{ display: "flex", gap: 12, fontSize: 10, color: T.textMuted }}>
                                      <span>≡ƒæü {article.views || 0}</span>
                                      <span>≡ƒæì {article.helpful || 0}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                
                {/* Quick Responses Section */}
                <div style={{ padding: 20, background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.white, display: "flex", alignItems: "center", gap: 8 }}>
                      ΓÜí Quick Responses
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: `${T.purple}20`, color: T.purple }}>{quickResponses.length} templates</span>
                    </div>
                    <button type="button" onClick={() => { setEditingQuickResponse(null); setQuickResponseForm({ name: "", shortcut: "", content: "", category: "general" }); setShowQuickResponseModal(true); }}
                      style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: T.purple, color: T.white, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      + New Response
                    </button>
                  </div>
                  
                  <div style={{ padding: 12, background: `${T.purple}10`, borderRadius: 8, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: T.textSecondary }}>
                      ≡ƒÆí Use shortcuts like <code style={{ background: T.surface, padding: "2px 6px", borderRadius: 4 }}>/greet</code> in ticket replies to quickly insert templates. Variables: <code style={{ background: T.surface, padding: "2px 6px", borderRadius: 4 }}>{"{{name}}"}</code>, <code style={{ background: T.surface, padding: "2px 6px", borderRadius: 4 }}>{"{{ticket_id}}"}</code>
                    </div>
                  </div>
                  
                  {quickResponses.length === 0 ? (
                    <div style={{ padding: 30, textAlign: "center", color: T.textMuted }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>ΓÜí</div>
                      <div style={{ fontSize: 12 }}>No quick responses yet. Create your first template!</div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                      {quickResponses.map(qr => (
                        <div key={qr.id} style={{ padding: 14, background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{qr.name}</div>
                              <code style={{ fontSize: 10, color: T.purple, background: `${T.purple}20`, padding: "2px 6px", borderRadius: 4 }}>{qr.shortcut}</code>
                            </div>
                            <span style={{ fontSize: 9, padding: "3px 6px", borderRadius: 4, background: T.surface, color: T.textMuted }}>
                              {qrCategories.find(c => c.id === qr.category)?.icon} {qr.category}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10, maxHeight: 60, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {qr.content.length > 100 ? qr.content.slice(0, 100) + "..." : qr.content}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 10, color: T.textMuted }}>Used {qr.usageCount || 0}x</span>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button type="button" onClick={() => { setEditingQuickResponse(qr); setQuickResponseForm({ name: qr.name, shortcut: qr.shortcut, content: qr.content, category: qr.category }); setShowQuickResponseModal(true); }}
                                style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, cursor: "pointer" }}>
                                Edit
                              </button>
                              <button type="button" onClick={async () => {
                                if (!window.confirm("Delete this quick response?")) return;
                                try {
                                  await deleteDoc(doc(db, "supportQuickResponses", qr.id));
                                  setQuickResponses(prev => prev.filter(q => q.id !== qr.id));
                                  notify("Quick response deleted");
                                } catch (e) { notify("Error: " + e.message); }
                              }}
                                style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.red}40`, background: `${T.red}10`, color: T.red, fontSize: 10, cursor: "pointer" }}>
                                Del
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      ) : supportSubTab === "timetrack" ? (
        /* TIME TRACKING SUB-TAB */
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Active Timer Banner */}
          {activeTimer && (
            <div style={{ background: `linear-gradient(135deg, ${T.gold}20, ${T.orange}10)`, borderRadius: 12, border: `1px solid ${T.gold}40`, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: T.red, animation: "pulse 1s infinite" }} />
                <div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>Timer Running</div>
                  <div style={{ fontSize: 11, color: T.textSecondary }}>
                    Ticket: {tickets.find(t => t.id === activeTimer.ticketId)?.subject?.slice(0, 40) || activeTimer.ticketId}...
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: T.gold, fontFamily: "'Fraunces',serif", minWidth: 120 }}>
                  {formatTimerDisplay(timerElapsed)}
                </div>
              </div>
              <button type="button" onClick={stopTimer}
                style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: T.red, color: T.white, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
   ΓÅ╣∩╕Å Stop & Log
              </button>
            </div>
          )}

          {/* KPIs Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Total Time Logged</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: T.gold, fontFamily: "'Fraunces',serif" }}>
                {Math.round(timeEntries.reduce((s, e) => s + (e.duration || 0), 0) / 60 * 10) / 10}h
              </div>
              <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 4 }}>{timeEntries.length} entries</div>
            </div>
            <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Billable Time</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: T.green, fontFamily: "'Fraunces',serif" }}>
                {Math.round(timeEntries.filter(e => e.billable).reduce((s, e) => s + (e.duration || 0), 0) / 60 * 10) / 10}h
              </div>
              <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 4 }}>
                {timeEntries.filter(e => e.billable).length} billable entries
              </div>
            </div>
            <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Today's Time</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: T.teal, fontFamily: "'Fraunces',serif" }}>
                {(() => {
                  const today = new Date(); today.setHours(0,0,0,0);
                  return Math.round(timeEntries.filter(e => new Date(e.createdAt) >= today).reduce((s, e) => s + (e.duration || 0), 0));
                })()}m
              </div>
              <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 4 }}>
                {(() => {
                  const today = new Date(); today.setHours(0,0,0,0);
                  return timeEntries.filter(e => new Date(e.createdAt) >= today).length;
                })()} entries today
              </div>
            </div>
            <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Avg Per Ticket</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: T.purple, fontFamily: "'Fraunces',serif" }}>
                {(() => {
                  const ticketIds = [...new Set(timeEntries.map(e => e.ticketId))];
                  if (ticketIds.length === 0) return "0";
                  return Math.round(timeEntries.reduce((s, e) => s + (e.duration || 0), 0) / ticketIds.length);
                })()}m
              </div>
              <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 4 }}>
                across {[...new Set(timeEntries.map(e => e.ticketId))].length} tickets
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button type="button" onClick={() => setShowTimeEntryModal(true)}
              style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: T.gold, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              Γ₧ò Manual Entry
            </button>
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 11, color: T.textMuted }}>
              ≡ƒÆí Start timer from any ticket drawer, or add manual entries here
            </div>
          </div>

          {/* Agent Time Breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
            <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 16 }}>≡ƒæÑ Agent Breakdown</div>
              {getAgentTimeStats().length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: T.textMuted, fontSize: 12 }}>No time logged yet</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {getAgentTimeStats().map((agent, idx) => (
                    <div key={agent.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: idx === 0 ? T.gold : T.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: idx === 0 ? T.bg : T.textMuted }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{agent.name}</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>{agent.entries} entries</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.gold }}>{Math.round(agent.total / 60 * 10) / 10}h</div>
                        <div style={{ fontSize: 9, color: T.green }}>{Math.round(agent.billable / 60 * 10) / 10}h billable</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Time Entries */}
            <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <div style={{ padding: 16, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>≡ƒô¥ Recent Time Entries</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>{timeEntries.length} total</div>
              </div>
              <div style={{ maxHeight: 350, overflowY: "auto" }}>
                {timeEntries.slice(0, 20).map(entry => {
                  const ticket = tickets.find(t => t.id === entry.ticketId);
                  return (
                    <div key={entry.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: entry.billable ? `${T.green}20` : `${T.textMuted}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: entry.billable ? T.green : T.textMuted }}>{entry.duration}m</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ticket?.subject || entry.ticketId}
                        </div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                          {entry.agentName} ΓÇó {entry.notes} ΓÇó {timeAgo(entry.createdAt)}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {entry.billable && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.green}20`, color: T.green }}>Billable</span>}
                      </div>
                    </div>
                  );
                })}
                {timeEntries.length === 0 && (
                  <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>
   <div style={{ fontSize: 24, marginBottom: 8 }}>ΓÅ▒∩╕Å</div>
                    <div style={{ fontSize: 12 }}>No time entries yet</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : supportSubTab === "auditlog" ? (
        /* AUDIT LOG SUB-TAB */
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Audit KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Total Events</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: T.gold, fontFamily: "'Fraunces',serif" }}>{ticketAuditLogs.length}</div>
              <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 4 }}>all actions logged</div>
            </div>
            <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Today</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: T.teal, fontFamily: "'Fraunces',serif" }}>
                {(() => {
                  const today = new Date(); today.setHours(0,0,0,0);
                  return ticketAuditLogs.filter(l => new Date(l.timestamp) >= today).length;
                })()}
              </div>
              <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 4 }}>events today</div>
            </div>
            <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Tickets Tracked</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: T.purple, fontFamily: "'Fraunces',serif" }}>
                {[...new Set(ticketAuditLogs.map(l => l.ticketId))].length}
              </div>
              <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 4 }}>unique tickets</div>
            </div>
            <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Active Agents</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: T.blue, fontFamily: "'Fraunces',serif" }}>
                {[...new Set(ticketAuditLogs.filter(l => l.actor === "agent").map(l => l.actorName))].length}
              </div>
              <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 4 }}>unique agents</div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <select value={auditLogFilter} onChange={e => setAuditLogFilter(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${auditLogFilter !== "all" ? T.gold : T.border}`, background: T.surfaceAlt, color: auditLogFilter !== "all" ? T.gold : T.white, fontSize: 11, cursor: "pointer" }}>
              <option value="all">All Actions</option>
              <option value="status_change">Status Changes</option>
              <option value="assigned">Assignments</option>
              <option value="reply_sent">Replies</option>
              <option value="note_added">Notes</option>
              <option value="tag_added">Tags</option>
              <option value="time_logged">Time Logged</option>
              <option value="escalated">Escalations</option>
              <option value="created">Created</option>
            </select>
            <input value={auditLogTicketFilter} onChange={e => setAuditLogTicketFilter(e.target.value)} placeholder="Filter by ticket ID..."
              style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 11, width: 180 }} />
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 10, color: T.textMuted }}>
              Showing {ticketAuditLogs.filter(l => {
                if (auditLogFilter !== "all" && l.action !== auditLogFilter) return false;
                if (auditLogTicketFilter && !l.ticketId?.includes(auditLogTicketFilter)) return false;
                return true;
              }).length} of {ticketAuditLogs.length} events
            </div>
          </div>

          {/* Audit Log Table */}
          <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            <div style={{ padding: 16, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>≡ƒôï Ticket Audit Trail</div>
            </div>
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              {ticketAuditLogs.filter(l => {
                if (auditLogFilter !== "all" && l.action !== auditLogFilter) return false;
                if (auditLogTicketFilter && !l.ticketId?.includes(auditLogTicketFilter)) return false;
                return true;
              }).slice(0, 100).map(log => {
                const ticket = tickets.find(t => t.id === log.ticketId);
                return (
                  <div key={log.id} style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "flex-start", gap: 12 }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {/* Action Icon */}
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${getAuditActionColor(log.action)}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 12 }}>
                        {log.action === "created" ? "≡ƒô¥" :
                         log.action === "status_change" ? "≡ƒöä" :
                         log.action === "assigned" ? "≡ƒæñ" :
                         log.action === "reply_sent" ? "≡ƒÆ¼" :
                         log.action === "note_added" ? "≡ƒôî" :
   log.action === "tag_added" ? "≡ƒÅ╖∩╕Å" :
   log.action === "tag_removed" ? "≡ƒÅ╖∩╕Å" :
   log.action === "time_logged" ? "ΓÅ▒∩╕Å" :
                         log.action === "escalated" ? "≡ƒÜ¿" :
                         log.action === "merged" ? "≡ƒöù" : "≡ƒôï"}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: `${getAuditActionColor(log.action)}20`, color: getAuditActionColor(log.action) }}>
                          {getAuditActionLabel(log.action)}
                        </span>
                        <span style={{ fontSize: 11, color: T.textSecondary }}>by {log.actorName}</span>
                        <span style={{ fontSize: 10, color: T.textMuted }}>{timeAgo(log.timestamp)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: T.white, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ticket?.subject || log.ticketId}
                      </div>
                      {/* Details */}
                      {log.details && (
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>
                          {log.action === "status_change" && log.details.from && log.details.to && (
                            <span>{log.details.from} ΓåÆ {log.details.to}</span>
                          )}
                          {log.action === "assigned" && log.details.to && (
                            <span>Assigned to: {log.details.to}</span>
                          )}
                          {log.action === "tag_added" && log.details.tag && (
                            <span>Tag: {log.details.tag}</span>
                          )}
                          {log.action === "time_logged" && (
                            <span>{log.details.duration}m {log.details.billable ? "(billable)" : "(non-billable)"} - {log.details.method}</span>
                          )}
                          {log.action === "reply_sent" && log.details.preview && (
                            <span>"{log.details.preview.slice(0, 60)}..."</span>
                          )}
                          {log.action === "note_added" && log.details.preview && (
                            <span>"{log.details.preview.slice(0, 60)}..."</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* View Ticket Button */}
                    <button type="button" onClick={() => {
                      const t = tickets.find(x => x.id === log.ticketId);
                      if (t) { setTicketDrawer(t); setSupportSubTab("all"); }
                    }}
                      style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, cursor: "pointer" }}>
                      View ΓåÆ
                    </button>
                  </div>
                );
              })}
              {ticketAuditLogs.length === 0 && (
                <div style={{ padding: 60, textAlign: "center", color: T.textMuted }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>≡ƒôï</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary }}>No audit logs yet</div>
                  <div style={{ fontSize: 12 }}>Actions will be logged as you work on tickets</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : supportSubTab === "settings" ? (
        /* SETTINGS SUB-TAB - Webhooks, Export, Permissions */
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Settings Header */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button type="button" onClick={() => setShowExportModal(true)}
              style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: T.teal, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              ≡ƒôñ Export Tickets
            </button>
            <button type="button" onClick={exportTimeEntries}
              style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${T.gold}`, background: "transparent", color: T.gold, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
   ΓÅ▒∩╕Å Export Time
            </button>
            <button type="button" onClick={exportAuditLogs}
              style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${T.purple}`, background: "transparent", color: T.purple, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              ≡ƒôï Export Audit Logs
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Webhooks Panel */}
            <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <div style={{ padding: 16, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>≡ƒöù Webhooks</div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Send events to external services</div>
                </div>
                <button type="button" onClick={() => { setEditingWebhook(null); setWebhookForm({ name: "", url: "", events: ["ticket_created"], enabled: true, secret: "" }); setShowWebhookModal(true); }}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: T.gold, color: T.bg, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  + Add
                </button>
              </div>
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {webhooks.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>≡ƒöù</div>
                    <div style={{ fontSize: 12 }}>No webhooks configured</div>
                  </div>
                ) : (
                  webhooks.map(webhook => (
                    <div key={webhook.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: webhook.enabled ? T.green : T.textMuted }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{webhook.name}</div>
                        <div style={{ fontSize: 10, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{webhook.url}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                          {webhook.events?.map(e => (
                            <span key={e} style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: `${T.teal}20`, color: T.teal }}>{e}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" onClick={() => testWebhook(webhook)} disabled={testingWebhook === webhook.id}
                          style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 9, cursor: "pointer" }}>
                          {testingWebhook === webhook.id ? "..." : "Test"}
                        </button>
                        <button type="button" onClick={() => { setEditingWebhook(webhook); setWebhookForm({ name: webhook.name, url: webhook.url, events: webhook.events || [], enabled: webhook.enabled, secret: webhook.secret || "" }); setShowWebhookModal(true); }}
                          style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 9, cursor: "pointer" }}>
                          Edit
                        </button>
                        <button type="button" onClick={() => deleteWebhook(webhook.id)}
                          style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.red}30`, background: "transparent", color: T.red, fontSize: 9, cursor: "pointer" }}>
   ├ù
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Permissions Panel */}
            <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <div style={{ padding: 16, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>≡ƒöÉ Agent Permissions</div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Role-based access control</div>
                </div>
                <button type="button" onClick={() => { setEditingPermission(null); setPermissionForm({ agentId: "", role: "agent" }); setShowPermissionsModal(true); }}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: T.purple, color: T.white, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  + Add
                </button>
              </div>
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {agentPermissions.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>≡ƒöÉ</div>
                    <div style={{ fontSize: 12 }}>No permissions configured</div>
                  </div>
                ) : (
                  agentPermissions.map(perm => {
                    const role = permissionRoles.find(r => r.id === perm.role) || permissionRoles[1];
                    return (
                      <div key={perm.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${role.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: role.color }}>
                          {perm.agentName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{perm.agentName}</div>
                          <div style={{ fontSize: 10, color: T.textMuted }}>{perm.agentEmail}</div>
                        </div>
                        <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: `${role.color}20`, color: role.color, fontWeight: 600 }}>
                          {role.label}
                        </span>
                        <button type="button" onClick={() => { setEditingPermission(perm); setPermissionForm({ agentId: perm.agentId, role: perm.role }); setShowPermissionsModal(true); }}
                          style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 9, cursor: "pointer" }}>
                          Edit
                        </button>
                        <button type="button" onClick={() => deletePermission(perm.id)}
                          style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.red}30`, background: "transparent", color: T.red, fontSize: 9, cursor: "pointer" }}>
   ├ù
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Webhook Logs */}
          <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            <div style={{ padding: 16, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>≡ƒô£ Webhook Logs</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Recent webhook delivery attempts</div>
            </div>
            <div style={{ maxHeight: 250, overflowY: "auto" }}>
              {webhookLogs.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>
                  <div style={{ fontSize: 12 }}>No webhook logs yet</div>
                </div>
              ) : (
                webhookLogs.slice(0, 20).map(log => (
                  <div key={log.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: log.status === "success" ? T.green : T.red }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: T.white }}>{log.webhookName}</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>{log.event} ΓÇó {log.statusCode}</div>
                    </div>
                    <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: log.status === "success" ? `${T.green}20` : `${T.red}20`, color: log.status === "success" ? T.green : T.red }}>
                      {log.status}
                    </span>
                    <span style={{ fontSize: 9, color: T.textMuted }}>{timeAgo(log.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Role Descriptions */}
          <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 12 }}>≡ƒôû Role Permissions</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {permissionRoles.map(role => (
                <div key={role.id} style={{ padding: 12, background: `${role.color}10`, borderRadius: 8, border: `1px solid ${role.color}30` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: role.color, marginBottom: 4 }}>{role.label}</div>
                  <div style={{ fontSize: 10, color: T.textSecondary, lineHeight: 1.4 }}>{role.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
      /* TICKETS LIST */
      <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        {ticketsLoading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: T.textMuted }}>Loading tickets...</div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: T.textMuted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>≡ƒô¡</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary }}>No tickets found</div>
            <div style={{ fontSize: 12 }}>{supportSubTab === "open" ? "All caught up!" : "Try adjusting your filters"}</div>
          </div>
        ) : (
          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            {filteredTickets.map((ticket) => {
              const cat = categories.find(c => c.id === ticket.category) || categories[5];
              const status = statuses[ticket.status] || statuses.open;
              const priority = priorities[ticket.priority] || priorities.normal;
              const breached = isSlaBreached(ticket);
              const ticketTags = ticket.tags || [];
              const slaInfo = getSlaStatus(ticket);
              const sentiment = analyzeSentiment(ticket);
              return (
                <div key={ticket.id} onClick={() => { setTicketDrawer(ticket); setTicketSummary(null); setSuggestedReplies([]); setSimilarTickets([]); setShowSimilarTickets(false); }}
                  style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, borderLeft: breached ? `3px solid ${T.red}` : "3px solid transparent", transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: priority.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.subject}</span>
                      {sentiment.sentiment !== "neutral" && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${sentiment.color}20`, color: sentiment.color, fontWeight: 600 }}>{sentiment.emoji}</span>}
                      {ticket.channel && ticket.channel !== "email" && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: ticket.channel === "chat" ? `${T.green}20` : ticket.channel === "whatsapp" ? "#25D36620" : `${T.purple}20`, color: ticket.channel === "chat" ? T.green : ticket.channel === "whatsapp" ? "#25D366" : T.purple, fontWeight: 600 }}>{ticket.channel === "chat" ? "≡ƒÆ¼ CHAT" : ticket.channel === "whatsapp" ? "≡ƒô▒ WA" : "≡ƒô₧ CALL"}</span>}
                      {slaInfo.status === "breached" && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.red}20`, color: T.red, fontWeight: 600 }}>ΓÅ░ SLA {slaInfo.percent}%</span>}
   {slaInfo.status === "warning" && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.orange}20`, color: T.orange, fontWeight: 600 }}>ΓÜá∩╕Å {slaInfo.percent}%</span>}
                      {ticket.autoAssignedBy && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: `${T.green}20`, color: T.green, fontWeight: 600 }}>≡ƒñû Auto</span>}
                      {ticket.autoEscalated && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: `${T.red}20`, color: T.red, fontWeight: 600 }}>ΓÜí Escalated</span>}
   {ticket.mergedInto && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: `${T.textMuted}20`, color: T.textMuted, fontWeight: 600 }}>Γå¬∩╕Å MERGED</span>}
                      {(ticket.linkedTickets || []).length > 0 && !ticket.mergedInto && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: `${T.teal}20`, color: T.teal, fontWeight: 600 }}>≡ƒöù {ticket.linkedTickets.length}</span>}
                      {ticketTags.slice(0, 2).map(tagId => {
                        const tag = availableTags.find(t => t.id === tagId);
                        return tag ? <span key={tagId} style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: `${tag.color}20`, color: tag.color, fontWeight: 600 }}>{tag.label}</span> : null;
                      })}
                      {ticketTags.length > 2 && <span style={{ fontSize: 8, color: T.textMuted }}>+{ticketTags.length - 2}</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.textMuted }}>
                      <span>{ticket.userName || ticket.userEmail}</span>
   <span>·</span>
                      <span style={{ padding: "2px 6px", borderRadius: 4, background: `${cat.color}20`, color: cat.color, fontSize: 10 }}>{cat.icon} {cat.label}</span>
   <span>·</span>
                      <span>{timeAgo(ticket.createdAt)}</span>
   {ticket.assignedTo && <><span>·</span><span style={{ color: T.purple }}>≡ƒæñ {ticket.assignedToName || "Assigned"}</span></>}
                      {/* SLA Progress Bar */}
                      {slaInfo.status !== "resolved" && (
                        <>
   <span>·</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <div style={{ width: 40, height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ width: `${Math.min(slaInfo.percent, 100)}%`, height: "100%", background: slaInfo.color, borderRadius: 2 }} />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4, background: `${T.gold}20`, color: T.gold, fontWeight: 600, textTransform: "uppercase" }}>{ticket.userTier}</span>
                    <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: status.bg, color: status.color, fontWeight: 600 }}>{status.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* TICKET DRAWER */}
      {ticketDrawer && (
        <div style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(4,9,15,0.85)", backdropFilter: "blur(4px)" }} onClick={() => setTicketDrawer(null)}>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "100%", maxWidth: 620, background: T.surface, borderLeft: `1px solid ${T.gold}30`, display: "flex", flexDirection: "column", animation: "slideIn 0.2s ease-out" }} onClick={e => e.stopPropagation()}>
            
            {/* Collision Detection Banner */}
            {viewingAdmins.length > 0 && (
              <div style={{ padding: "10px 24px", background: `${T.purple}15`, borderBottom: `1px solid ${T.purple}30`, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {viewingAdmins.slice(0, 3).map((admin, i) => (
                    <div key={admin.id} style={{ width: 24, height: 24, borderRadius: "50%", background: T.purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.white, marginLeft: i > 0 ? -8 : 0, border: `2px solid ${T.surface}`, zIndex: 3 - i }}>
                      {admin.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 11, color: T.purple, fontWeight: 500 }}>
                  ≡ƒæÇ {viewingAdmins.map(a => a.name).join(", ")} {viewingAdmins.length === 1 ? "is" : "are"} also viewing this ticket
                </span>
              </div>
            )}
            
            {/* Drawer Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: `${(categories.find(c => c.id === ticketDrawer.category) || categories[5]).color}20`, color: (categories.find(c => c.id === ticketDrawer.category) || categories[5]).color }}>{(categories.find(c => c.id === ticketDrawer.category) || categories[5]).icon} {(categories.find(c => c.id === ticketDrawer.category) || categories[5]).label}</span>
                    {isSlaBreached(ticketDrawer) && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.red}20`, color: T.red, fontWeight: 600 }}>ΓÅ░ SLA Breached</span>}
                    {/* Sentiment Badge */}
                    {(() => {
                      const sentiment = analyzeSentiment(ticketDrawer);
                      return sentiment.sentiment !== "neutral" && (
                        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${sentiment.color}20`, color: sentiment.color, fontWeight: 600, animation: sentiment.pulse ? "pulse 1.5s infinite" : "none" }}>
                          {sentiment.emoji} {sentiment.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.white }}>{ticketDrawer.subject}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button type="button" onClick={() => setShowAiPanel(!showAiPanel)}
                    style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${showAiPanel ? T.teal : T.border}`, background: showAiPanel ? `${T.teal}15` : "transparent", color: showAiPanel ? T.teal : T.textMuted, fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    ≡ƒñû AI
                  </button>
   <button type="button" onClick={() => setTicketDrawer(null)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 24, lineHeight: 1 }}>├ù</button>
                </div>
              </div>
              
              {/* Status, Priority, Assignment Row */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <select value={ticketDrawer.status} onChange={e => updateTicketStatus(ticketDrawer.id, e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${(statuses[ticketDrawer.status] || statuses.open).color}40`, background: (statuses[ticketDrawer.status] || statuses.open).bg, color: (statuses[ticketDrawer.status] || statuses.open).color, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select value={ticketDrawer.priority || "normal"} onChange={e => updateTicketPriority(ticketDrawer.id, e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${(priorities[ticketDrawer.priority] || priorities.normal).color}40`, background: (priorities[ticketDrawer.priority] || priorities.normal).bg, color: (priorities[ticketDrawer.priority] || priorities.normal).color, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select value={ticketDrawer.assignedTo || "unassigned"} onChange={e => { const agent = assignableAgents.find(a => a.id === e.target.value); assignTicket(ticketDrawer.id, e.target.value, agent?.name || ""); }}
                  style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${ticketDrawer.assignedTo ? T.purple : T.border}40`, background: ticketDrawer.assignedTo ? `${T.purple}20` : T.surfaceAlt, color: ticketDrawer.assignedTo ? T.purple : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                  <option value="unassigned">≡ƒæñ Unassigned</option>
                  {assignableAgents.filter(a => a.id !== "unassigned").map(a => <option key={a.id} value={a.id}>≡ƒæñ {a.name}</option>)}
                </select>
              </div>

              {/* Tags Row */}
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, color: T.textMuted }}>Tags:</span>
                {(ticketDrawer.tags || []).map(tagId => {
                  const tag = availableTags.find(t => t.id === tagId);
                  return tag ? (
                    <span key={tagId} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, padding: "3px 8px", borderRadius: 4, background: `${tag.color}20`, color: tag.color, fontWeight: 600 }}>
                      {tag.label}
   <button type="button" onClick={() => removeTag(ticketDrawer.id, tagId)} style={{ background: "none", border: "none", color: tag.color, cursor: "pointer", fontSize: 12, lineHeight: 1, padding: 0 }}>├ù</button>
                    </span>
                  ) : null;
                })}
                <select value="" onChange={e => { if (e.target.value) addTag(ticketDrawer.id, e.target.value); }}
                  style={{ padding: "4px 8px", borderRadius: 4, border: `1px dashed ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                  <option value="">+ Add tag</option>
                  {availableTags.filter(t => !(ticketDrawer.tags || []).includes(t.id)).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              {/* Merge & Link Actions Row */}
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setShowMergeModal(true)}
                  style={{ padding: "5px 10px", borderRadius: 5, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  ≡ƒöÇ Merge Ticket
                </button>
                <button type="button" onClick={() => setShowLinkModal(true)}
                  style={{ padding: "5px 10px", borderRadius: 5, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  ≡ƒöù Link Related
                </button>
                {ticketDrawer.mergedInto && (
                  <span style={{ fontSize: 10, color: T.textMuted, fontStyle: "italic" }}>
   Γå¬∩╕Å Merged into ticket {ticketDrawer.mergedInto}
                  </span>
                )}
              </div>

              {/* Linked Tickets Section */}
              {(ticketDrawer.linkedTickets || []).length > 0 && (
                <div style={{ marginTop: 12, padding: "10px 12px", background: `${T.teal}08`, borderRadius: 8, border: `1px solid ${T.teal}20` }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.teal, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    ≡ƒöù Linked Tickets ({ticketDrawer.linkedTickets.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {ticketDrawer.linkedTickets.map((link, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: T.surface, borderRadius: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: link.type === "merged" ? `${T.orange}20` : `${T.teal}20`, color: link.type === "merged" ? T.orange : T.teal, fontWeight: 600 }}>
                            {link.type === "merged" ? "MERGED" : "RELATED"}
                          </span>
                          <button type="button" onClick={() => { 
                            const linkedTicket = tickets.find(t => t.id === link.id);
                            if (linkedTicket) setTicketDrawer(linkedTicket);
                          }}
                            style={{ fontSize: 11, color: T.white, background: "none", border: "none", cursor: "pointer", textAlign: "left", textDecoration: "underline", textDecorationColor: `${T.teal}50` }}>
                            {link.subject || link.id}
                          </button>
                        </div>
                        {link.type !== "merged" && (
                          <button type="button" onClick={() => unlinkTicket(link.id)}
                            style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 12, padding: 2 }}>
   ├ù
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phase 8A: Time Tracking Section */}
              <div style={{ marginTop: 12, padding: "10px 12px", background: `${T.gold}08`, borderRadius: 8, border: `1px solid ${T.gold}20` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.gold, display: "flex", alignItems: "center", gap: 4 }}>
   ΓÅ▒∩╕Å Time Tracking
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.white }}>
                    Total: {getTicketTimeTotal(ticketDrawer.id)}m
                  </div>
                </div>
                
                {/* Active Timer or Start Button */}
                {activeTimer && activeTimer.ticketId === ticketDrawer.id ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: `${T.red}15`, borderRadius: 6, border: `1px solid ${T.red}30` }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.red, animation: "pulse 1s infinite" }} />
                    <span style={{ fontSize: 18, fontWeight: 900, color: T.gold, fontFamily: "'Fraunces',serif", flex: 1 }}>{formatTimerDisplay(timerElapsed)}</span>
                    <button type="button" onClick={stopTimer}
                      style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: T.red, color: T.white, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
   ΓÅ╣∩╕Å Stop
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => startTimer(ticketDrawer.id)} disabled={activeTimer !== null}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${activeTimer ? T.border : T.gold}`, background: activeTimer ? "transparent" : `${T.gold}15`, color: activeTimer ? T.textMuted : T.gold, fontSize: 11, fontWeight: 600, cursor: activeTimer ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
   Γû╢∩╕Å {activeTimer ? "Timer running on another ticket" : "Start Timer"}
                  </button>
                )}
                
                {/* Recent Time Entries for this ticket */}
                {timeEntries.filter(e => e.ticketId === ticketDrawer.id).length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    {timeEntries.filter(e => e.ticketId === ticketDrawer.id).slice(0, 5).map(entry => (
                      <div key={entry.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: T.surface, borderRadius: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: entry.billable ? T.green : T.textMuted }}>{entry.duration}m</span>
                          <span style={{ fontSize: 10, color: T.textSecondary }}>{entry.agentName}</span>
                          {entry.notes && <span style={{ fontSize: 9, color: T.textMuted }}>ΓÇó {entry.notes.slice(0, 20)}</span>}
                        </div>
                        <span style={{ fontSize: 9, color: T.textMuted }}>{timeAgo(entry.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Fields Section */}
              {customFields.length > 0 && (
                <div style={{ marginTop: 12, padding: "10px 12px", background: `${T.cyan}08`, borderRadius: 8, border: `1px solid ${T.cyan}20` }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.cyan, marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
                    ≡ƒôï Custom Fields
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {customFields.map(field => {
                      const value = (ticketDrawer.customFields || {})[field.id] || "";
                      return (
                        <div key={field.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <label style={{ fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                            {field.name}
                            {field.required && <span style={{ color: T.red }}>*</span>}
                          </label>
                          {field.type === "dropdown" ? (
                            <select value={value} onChange={e => updateTicketCustomField(ticketDrawer.id, field.id, e.target.value)}
                              style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>
                              <option value="">Select...</option>
                              {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : field.type === "date" ? (
                            <input type="date" value={value} onChange={e => updateTicketCustomField(ticketDrawer.id, field.id, e.target.value)}
                              style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif" }} />
                          ) : field.type === "number" ? (
                            <input type="number" value={value} onChange={e => updateTicketCustomField(ticketDrawer.id, field.id, e.target.value)} placeholder="Enter number..."
                              style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif" }} />
                          ) : field.type === "checkbox" ? (
                            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                              <input type="checkbox" checked={value === "true"} onChange={e => updateTicketCustomField(ticketDrawer.id, field.id, e.target.checked ? "true" : "false")}
                                style={{ width: 14, height: 14 }} />
                              <span style={{ fontSize: 11, color: T.textSecondary }}>Yes</span>
                            </label>
                          ) : (
                            <input type="text" value={value} onChange={e => updateTicketCustomField(ticketDrawer.id, field.id, e.target.value)} placeholder="Enter value..."
                              style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* User Context Panel */}
            <div style={{ padding: "12px 24px", background: T.surfaceAlt, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${T.gold}20`, display: "flex", alignItems: "center", justifyContent: "center", color: T.gold, fontWeight: 700, fontSize: 14 }}>
                  {(ticketDrawer.userName || ticketDrawer.userEmail || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{ticketDrawer.userName || "Unknown"}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{ticketDrawer.userEmail}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: T.textMuted }}>Tier</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.gold, textTransform: "uppercase" }}>{ticketDrawer.userTier}</div>
                </div>
                <button type="button" onClick={() => { setTab("users"); setPendingOpenUid(ticketDrawer.userId); setTicketDrawer(null); }}
                  style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, cursor: "pointer" }}>View User</button>
              </div>
            </div>
            
            {/* CSAT Section - for resolved tickets */}
            {(ticketDrawer.status === "resolved" || ticketDrawer.status === "closed") && (() => {
              const ticketCsat = csatRatings.find(c => c.ticketId === ticketDrawer.id);
              return (
                <div style={{ padding: "12px 24px", background: `${T.gold}08`, borderBottom: `1px solid ${T.gold}20` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.gold }}>≡ƒÿè Customer Satisfaction</span>
                      {ticketCsat ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 14, color: ticketCsat.rating >= 4 ? T.green : ticketCsat.rating >= 3 ? T.orange : T.red }}>
                            {"Γÿà".repeat(ticketCsat.rating)}{"Γÿå".repeat(5 - ticketCsat.rating)}
                          </span>
                          <span style={{ fontSize: 11, color: T.textMuted }}>({ticketCsat.rating}/5)</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: T.surfaceAlt, color: T.textMuted }}>Awaiting feedback</span>
                      )}
                    </div>
                    {!ticketCsat && (
                      <button type="button" onClick={() => { setCsatForm({ ticketId: ticketDrawer.id, rating: 5, comment: "" }); setShowCsatModal(true); }}
                        style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.gold}40`, background: `${T.gold}10`, color: T.gold, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                        + Add Rating
                      </button>
                    )}
                  </div>
                  {ticketCsat?.comment && (
                    <div style={{ marginTop: 8, padding: 10, background: T.surface, borderRadius: 6, borderLeft: `2px solid ${ticketCsat.rating >= 4 ? T.green : ticketCsat.rating >= 3 ? T.orange : T.red}` }}>
                      <p style={{ margin: 0, fontSize: 11, color: T.textSecondary, fontStyle: "italic" }}>"{ticketCsat.comment}"</p>
                    </div>
                  )}
                </div>
              );
            })()}
            
            {/* AI Summary Panel */}
            {showAiPanel && (
              <div style={{ padding: "16px 24px", background: `${T.teal}08`, borderBottom: `1px solid ${T.teal}20` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.teal }}>≡ƒñû AI Insights</span>
                    {summaryLoading && <span style={{ fontSize: 10, color: T.textMuted }}>Analyzing...</span>}
                  </div>
                  <button type="button" onClick={() => generateAiSummary(ticketDrawer)} disabled={summaryLoading}
                    style={{ padding: "5px 10px", borderRadius: 5, border: `1px solid ${T.teal}40`, background: `${T.teal}10`, color: T.teal, fontSize: 10, fontWeight: 600, cursor: summaryLoading ? "not-allowed" : "pointer", opacity: summaryLoading ? 0.5 : 1 }}>
   {summaryLoading ? "..." : ticketSummary ? "Γå╗ Refresh" : "Generate Summary"}
                  </button>
                </div>
                
                {/* Sentiment + Priority Row */}
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  {/* Sentiment Card */}
                  {(() => {
                    const sentiment = analyzeSentiment(ticketDrawer);
                    return (
                      <div style={{ flex: 1, padding: 12, background: T.surface, borderRadius: 8, border: `1px solid ${sentiment.color}30` }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Sentiment</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 24 }}>{sentiment.emoji}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: sentiment.color }}>{sentiment.label}</div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>Based on message analysis</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* AI Priority Recommendation */}
                  {(() => {
                    const aiPriority = getAiPriorityRecommendation(ticketDrawer);
                    if (!aiPriority) return null;
                    const needsChange = aiPriority.recommended !== aiPriority.currentPriority;
                    const priorityColors = { urgent: T.red, high: T.orange, normal: T.textMuted };
                    return (
                      <div style={{ flex: 1, padding: 12, background: T.surface, borderRadius: 8, border: `1px solid ${needsChange ? T.gold : T.border}30` }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>AI Priority</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: priorityColors[aiPriority.recommended] || T.textMuted, textTransform: "capitalize" }}>
                              {aiPriority.recommended}
                            </div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>
                              {aiPriority.reasons.slice(0, 2).join(" ΓÇó ")}
                            </div>
                          </div>
                          {needsChange && aiPriority.recommended !== "normal" && (
                            <button type="button" onClick={() => updateTicketPriority(ticketDrawer.id, aiPriority.recommended)}
                              style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.gold}40`, background: `${T.gold}10`, color: T.gold, fontSize: 9, fontWeight: 600, cursor: "pointer" }}>
                              Apply
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                {/* AI Summary */}
                {ticketSummary ? (
                  <div style={{ padding: 14, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6, marginBottom: 12 }}>
                      {ticketSummary.overview}
                    </div>
                    
                    {ticketSummary.keyPoints.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, marginBottom: 6 }}>KEY POINTS</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {ticketSummary.keyPoints.map((point, i) => (
                            <div key={i} style={{ fontSize: 11, color: T.textSecondary, display: "flex", alignItems: "flex-start", gap: 6 }}>
                              <span style={{ color: T.teal }}>ΓÇó</span> {point}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ fontSize: 10, color: T.textMuted }}>
                          <span style={{ color: T.textSecondary }}>{ticketSummary.messageCount.total}</span> messages
                        </div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>
                          <span style={{ color: T.textSecondary }}>{ticketSummary.messageCount.user}</span> from user
                        </div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>
                          <span style={{ color: T.textSecondary }}>{ticketSummary.messageCount.admin}</span> from support
                        </div>
                      </div>
                      <div style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: `${T.teal}20`, color: T.teal, fontWeight: 600 }}>
                        ≡ƒÆí {ticketSummary.aiRecommendation}
                      </div>
                    </div>
                  </div>
                ) : !summaryLoading ? (
                  <div style={{ padding: 16, background: T.surface, borderRadius: 8, border: `1px dashed ${T.border}`, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Click "Generate Summary" to analyze this ticket</div>
                  </div>
                ) : (
                  <div style={{ padding: 16, background: T.surface, borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: T.teal }}>≡ƒöä Analyzing ticket content...</div>
                  </div>
                )}
                
                {/* Similar Tickets Section */}
                <div style={{ marginTop: 12 }}>
                  <button type="button" onClick={() => { if (!showSimilarTickets) updateSimilarTickets(ticketDrawer); setShowSimilarTickets(!showSimilarTickets); }}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: showSimilarTickets ? T.surface : "transparent", color: T.textSecondary, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>≡ƒöù Similar Resolved Tickets {similarTickets.length > 0 && `(${similarTickets.length})`}</span>
   <span style={{ fontSize: 10, color: T.textMuted }}>{showSimilarTickets ? "Γû▓" : "Γû╝"}</span>
                  </button>
                  
                  {showSimilarTickets && (
                    <div style={{ marginTop: 8 }}>
                      {similarTickets.length === 0 ? (
                        <div style={{ padding: 16, background: T.surface, borderRadius: 8, textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: T.textMuted }}>No similar resolved tickets found</div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {similarTickets.map(sim => (
                            <div key={sim.id} style={{ padding: 12, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, cursor: "pointer" }}
                              onClick={() => { setTicketDrawer(sim); setTicketSummary(null); setSuggestedReplies([]); setShowSimilarTickets(false); }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: T.white, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {sim.subject}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.green}20`, color: T.green }}>Γ£ô Resolved</span>
                                  <span style={{ fontSize: 9, color: T.textMuted }}>{timeAgo(sim.resolvedAt || sim.updatedAt)}</span>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: `${(categories.find(c => c.id === sim.category) || categories[5]).color}20`, color: (categories.find(c => c.id === sim.category) || categories[5]).color }}>
                                  {(categories.find(c => c.id === sim.category) || categories[5]).icon} {(categories.find(c => c.id === sim.category) || categories[5]).label}
                                </span>
                                <span style={{ fontSize: 9, color: T.textMuted }}>Match score: {sim.similarityScore}</span>
                              </div>
                              {sim.solution && (
                                <div style={{ padding: 8, background: `${T.green}08`, borderRadius: 6, borderLeft: `2px solid ${T.green}` }}>
                                  <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 4 }}>≡ƒÆí Resolution:</div>
                                  <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.4 }}>{sim.solution}</div>
                                </div>
                              )}
                              <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                                <span style={{ fontSize: 9, color: T.teal }}>Click to view full ticket ΓåÆ</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Conversation Thread + Internal Notes */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {/* Public Messages */}
              <div style={{ padding: "16px 24px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Conversation</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(ticketDrawer.messages || []).map((msg, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.from === "admin" ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "85%", padding: "12px 16px", borderRadius: 12, background: msg.from === "admin" ? T.gold : T.surfaceAlt, color: msg.from === "admin" ? T.bg : T.white, fontSize: 13, lineHeight: 1.5, borderBottomRightRadius: msg.from === "admin" ? 4 : 12, borderBottomLeftRadius: msg.from === "admin" ? 12 : 4 }}>
                        {msg.text}
                        {/* Attachment Display */}
                        {msg.attachment && (
                          <div style={{ marginTop: 8, padding: 8, background: msg.from === "admin" ? "rgba(0,0,0,0.15)" : T.surface, borderRadius: 8 }}>
                            {msg.attachment.type?.startsWith("image/") ? (
                              <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer">
                                <img src={msg.attachment.url} alt={msg.attachment.name} style={{ maxWidth: "100%", maxHeight: 150, borderRadius: 6 }} />
                              </a>
                            ) : (
                              <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: msg.from === "admin" ? T.bg : T.teal, textDecoration: "none" }}>
                                <span style={{ fontSize: 20 }}>≡ƒôä</span>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 600 }}>{msg.attachment.name}</div>
                                  <div style={{ fontSize: 10, opacity: 0.7 }}>{(msg.attachment.size / 1024).toFixed(1)} KB</div>
                                </div>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{msg.from === "admin" ? (msg.by || "Admin") : ticketDrawer.userName}</span>
   <span>·</span>
                        <span>{timeAgo(msg.at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Internal Notes Section */}
              {(ticketDrawer.internalNotes?.length > 0 || true) && (
                <div style={{ padding: "16px 24px", background: `${T.orange}08`, borderTop: `1px dashed ${T.orange}30` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.orange, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    ≡ƒöÆ Internal Notes <span style={{ fontWeight: 400, color: T.textMuted }}>(hidden from customer)</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {(ticketDrawer.internalNotes || []).map((note, i) => (
                      <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: T.surface, border: `1px solid ${T.orange}30` }}>
                        <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>{renderTextWithMentions(note.text)}</div>
                        {/* Note Attachment Display */}
                        {note.attachment && (
                          <div style={{ marginTop: 8, padding: 8, background: T.surfaceAlt, borderRadius: 6 }}>
                            {note.attachment.type?.startsWith("image/") ? (
                              <a href={note.attachment.url} target="_blank" rel="noopener noreferrer">
                                <img src={note.attachment.url} alt={note.attachment.name} style={{ maxWidth: "100%", maxHeight: 120, borderRadius: 4 }} />
                              </a>
                            ) : (
                              <a href={note.attachment.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: T.teal, textDecoration: "none" }}>
                                <span style={{ fontSize: 18 }}>≡ƒôä</span>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 600 }}>{note.attachment.name}</div>
                                  <div style={{ fontSize: 9, color: T.textMuted }}>{(note.attachment.size / 1024).toFixed(1)} KB</div>
                                </div>
                              </a>
                            )}
                          </div>
                        )}
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{note.by}</span>
   <span>·</span>
                          <span>{timeAgo(note.at)}</span>
   {note.mentions?.length > 0 && <><span>·</span><span style={{ color: T.teal }}>@{note.mentions.join(", @")}</span></>}
                        </div>
                      </div>
                    ))}
                    {(ticketDrawer.internalNotes || []).length === 0 && (
                      <div style={{ fontSize: 11, color: T.textMuted, fontStyle: "italic" }}>No internal notes yet.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Reply / Note Input */}
            {ticketDrawer.status !== "closed" && (
              <div style={{ padding: "16px 24px", borderTop: `1px solid ${T.border}`, background: T.surfaceAlt }}>
                {/* Hidden File Input */}
                <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={(e) => handleFileUpload(e, replyMode === "note")} accept="image/*,.pdf,.doc,.docx,.txt" />
                
                {/* Toggle Reply vs Note */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                  <button type="button" onClick={() => setReplyMode("reply")}
                    style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${replyMode === "reply" ? T.gold : T.border}`, background: replyMode === "reply" ? T.goldGlow : "transparent", color: replyMode === "reply" ? T.gold : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    ≡ƒÆ¼ Reply to Customer
                  </button>
                  <button type="button" onClick={() => setReplyMode("note")}
                    style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${replyMode === "note" ? T.orange : T.border}`, background: replyMode === "note" ? `${T.orange}15` : "transparent", color: replyMode === "note" ? T.orange : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    ≡ƒöÆ Internal Note
                  </button>
                  <div style={{ flex: 1 }} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: uploading ? T.textMuted : T.teal, fontSize: 11, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 4 }}>
   {uploading ? "ΓÅ│ Uploading..." : "≡ƒôÄ Attach File"}
                  </button>
                </div>

                {replyMode === "reply" ? (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                        <button type="button" onClick={() => setShowTemplates(!showTemplates)}
                          style={{ fontSize: 10, color: T.teal, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                          {showTemplates ? "Hide Templates" : "≡ƒô¥ Quick Templates"}
                        </button>
                        <button type="button" onClick={() => { if (suggestedReplies.length === 0) generateSmartReplies(ticketDrawer); }}
                          style={{ fontSize: 10, color: T.purple, background: "none", border: "none", cursor: "pointer", textDecoration: suggestedReplies.length > 0 ? "none" : "underline", display: "flex", alignItems: "center", gap: 4 }}>
   {repliesLoading ? "ΓÅ│ Generating..." : suggestedReplies.length > 0 ? `≡ƒÆí ${suggestedReplies.length} AI Suggestions` : "≡ƒÆí Generate Smart Replies"}
                        </button>
                        {quickResponses.length > 0 && (
                          <span style={{ fontSize: 10, color: T.textMuted }}>
                            ΓÜí {quickResponses.length} quick responses
                          </span>
                        )}
                      </div>
                      
                      {/* AI Smart Replies Section */}
                      {suggestedReplies.length > 0 && (
                        <div style={{ marginBottom: 12, padding: 12, background: `${T.purple}08`, borderRadius: 10, border: `1px solid ${T.purple}20` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: T.purple }}>≡ƒÆí AI-Suggested Replies</span>
                            <button type="button" onClick={() => generateSmartReplies(ticketDrawer)} disabled={repliesLoading}
                              style={{ fontSize: 9, color: T.textMuted, background: "none", border: "none", cursor: "pointer" }}>
   Γå╗ Regenerate
                            </button>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {suggestedReplies.map(reply => (
                              <div key={reply.id} style={{ padding: 10, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, cursor: "pointer", transition: "all 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = T.purple}
                                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                                onClick={() => setTicketReply(reply.full)}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: T.white }}>{reply.title}</span>
                                  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: 
                                    reply.tone === "empathetic" ? `${T.red}20` : 
                                    reply.tone === "technical" ? `${T.teal}20` : 
                                    reply.tone === "reassuring" ? `${T.orange}20` : 
                                    `${T.blue}20`, 
                                    color: reply.tone === "empathetic" ? T.red : 
                                    reply.tone === "technical" ? T.teal : 
                                    reply.tone === "reassuring" ? T.orange : 
                                    T.blue }}>{reply.tone}</span>
                                </div>
                                <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                  {reply.preview}
                                </div>
                                <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
                                  <span style={{ fontSize: 9, color: T.purple }}>Click to use ΓåÆ</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {showTemplates && (
                        <div style={{ marginTop: 8 }}>
                          {/* Static Templates */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                            {responseTemplates.map(t => (
                              <button key={t.id} type="button" onClick={() => insertTemplate(t.text)}
                                style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.textSecondary, fontSize: 10, cursor: "pointer" }}>
                                {t.name}
                              </button>
                            ))}
                          </div>
                          {/* Quick Responses from DB */}
                          {quickResponses.length > 0 && (
                            <>
                              <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>ΓÜí Quick Responses</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {quickResponses.map(qr => (
                                  <button key={qr.id} type="button" onClick={() => {
                                    let content = qr.content;
                                    content = content
                                      .replace(/\{\{name\}\}/g, ticketDrawer?.userName || ticketDrawer?.userEmail?.split("@")[0] || "there")
                                      .replace(/\{\{ticket_id\}\}/g, ticketDrawer?.id || "")
                                      .replace(/\{\{category\}\}/g, ticketDrawer?.category || "general")
                                      .replace(/\{\{tier\}\}/g, ticketDrawer?.userTier || "free")
                                      .replace(/\{\{agent_name\}\}/g, adminUser?.displayName || adminUser?.email?.split("@")[0] || "Support");
                                    setTicketReply(content);
                                    setDoc(doc(db, "supportQuickResponses", qr.id), { usageCount: (qr.usageCount || 0) + 1 }, { merge: true }).catch(() => {});
                                    setQuickResponses(prev => prev.map(q => q.id === qr.id ? { ...q, usageCount: (q.usageCount || 0) + 1 } : q));
                                  }}
                                    style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.purple}40`, background: `${T.purple}10`, color: T.purple, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                    <span>{qr.name}</span>
                                    <code style={{ fontSize: 8, opacity: 0.7 }}>{qr.shortcut}</code>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <textarea value={ticketReply} onChange={e => {
                        setTicketReply(e.target.value);
                        // Check for shortcut commands
                        const words = e.target.value.split(/\s/);
                        const lastWord = words[words.length - 1];
                        if (lastWord.startsWith("/") && lastWord.length > 1) {
                          const qr = quickResponses.find(q => q.shortcut === lastWord);
                          if (qr) {
                            let content = qr.content;
                            content = content
                              .replace(/\{\{name\}\}/g, ticketDrawer?.userName || ticketDrawer?.userEmail?.split("@")[0] || "there")
                              .replace(/\{\{ticket_id\}\}/g, ticketDrawer?.id || "")
                              .replace(/\{\{category\}\}/g, ticketDrawer?.category || "general")
                              .replace(/\{\{tier\}\}/g, ticketDrawer?.userTier || "free")
                              .replace(/\{\{agent_name\}\}/g, adminUser?.displayName || adminUser?.email?.split("@")[0] || "Support");
                            setTicketReply(words.slice(0, -1).join(" ") + (words.length > 1 ? " " : "") + content);
                            setDoc(doc(db, "supportQuickResponses", qr.id), { usageCount: (qr.usageCount || 0) + 1 }, { merge: true }).catch(() => {});
                            setQuickResponses(prev => prev.map(q => q.id === qr.id ? { ...q, usageCount: (q.usageCount || 0) + 1 } : q));
                          }
                        }
                      }} placeholder="Type your reply... Use /shortcut for quick responses"
                        rows={3} style={{ flex: 1, padding: "10px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", resize: "none" }} />
                      <button type="button" onClick={sendReply} disabled={ticketReplying || !ticketReply.trim()}
                        style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: ticketReplying || !ticketReply.trim() ? T.border : T.gold, color: T.bg, fontSize: 13, fontWeight: 700, cursor: ticketReplying || !ticketReply.trim() ? "not-allowed" : "pointer", alignSelf: "flex-end" }}>
                        {ticketReplying ? "..." : "Send"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 10, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {noteTemplates.map(t => (
                        <button key={t.id} type="button" onClick={() => insertNoteTemplate(t.text)}
                          style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.orange}40`, background: `${T.orange}10`, color: T.orange, fontSize: 10, cursor: "pointer" }}>
                          {t.name}
                        </button>
                      ))}
                      <span style={{ fontSize: 10, color: T.textMuted, marginLeft: 8 }}>≡ƒÆí Type @ to mention teammates</span>
                    </div>
                    <div style={{ position: "relative" }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <textarea 
                          ref={noteInputRef}
                          value={internalNote} 
                          onChange={handleNoteChange} 
                          onKeyDown={handleNoteKeyDown}
                          placeholder="Add an internal note (hidden from customer)... Use @name to mention"
                          rows={3} style={{ flex: 1, padding: "10px 14px", background: T.bg, border: `1px solid ${T.orange}40`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", resize: "none" }} />
                        <button type="button" onClick={sendInternalNote} disabled={sendingNote || !internalNote.trim()}
                          style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: sendingNote || !internalNote.trim() ? T.border : T.orange, color: T.bg, fontSize: 13, fontWeight: 700, cursor: sendingNote || !internalNote.trim() ? "not-allowed" : "pointer", alignSelf: "flex-end" }}>
                          {sendingNote ? "..." : "Add Note"}
                        </button>
                      </div>
                      
                      {/* @Mention Dropdown */}
                      {showMentionDropdown && mentionableUsers.length > 0 && (
                        <div style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: 4, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.3)", maxHeight: 180, overflowY: "auto", zIndex: 100 }}>
                          {mentionableUsers.slice(0, 6).map(user => (
                            <button key={user.id} type="button" onClick={() => insertMention(user.name)}
                              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, color: T.white, cursor: "pointer", textAlign: "left" }}
                              onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${T.teal}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: T.teal }}>
                                {user.label[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600 }}>@{user.name}</div>
                                <div style={{ fontSize: 10, color: T.textMuted }}>{user.label}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  {ticketDrawer.status !== "resolved" && (
                    <button type="button" onClick={() => updateTicketStatus(ticketDrawer.id, "resolved")}
                      style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.green}`, background: `${T.green}10`, color: T.green, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                      Γ£ô Mark Resolved
                    </button>
                  )}
                  {ticketDrawer.status === "resolved" && (
                    <button type="button" onClick={() => updateTicketStatus(ticketDrawer.id, "closed")}
                      style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.textMuted}`, background: `${T.textMuted}10`, color: T.textMuted, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                      Archive (Close)
                    </button>
                  )}
                </div>
              </div>
            )}
            {ticketDrawer.status === "closed" && (
              <div style={{ padding: "16px 24px", borderTop: `1px solid ${T.border}`, background: T.surfaceAlt, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: T.textMuted }}>This ticket is closed. Reopen to reply.</div>
                <button type="button" onClick={() => updateTicketStatus(ticketDrawer.id, "open")}
                  style={{ marginTop: 8, padding: "6px 16px", borderRadius: 6, border: `1px solid ${T.gold}`, background: "transparent", color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  Reopen Ticket
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MERGE TICKET MODAL */}
      {showMergeModal && ticketDrawer && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(4,9,15,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowMergeModal(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.gold}30`, padding: 24, width: "100%", maxWidth: 480, maxHeight: "80vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>≡ƒöÇ Merge Ticket</h3>
   <button type="button" onClick={() => setShowMergeModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ padding: 12, background: `${T.orange}15`, borderRadius: 8, marginBottom: 16 }}>
   <div style={{ fontSize: 11, color: T.orange, fontWeight: 600, marginBottom: 4 }}>ΓÜá∩╕Å Warning</div>
              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                Merging will close this ticket and move all messages and notes to the target ticket. This action cannot be undone.
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Current Ticket:</div>
              <div style={{ padding: 12, background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginBottom: 4 }}>{ticketDrawer.subject}</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>{ticketDrawer.userEmail} ΓÇó {(ticketDrawer.messages || []).length} messages</div>
              </div>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Merge into:</div>
              <select value={mergeTargetId} onChange={e => setMergeTargetId(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                <option value="">Select a ticket...</option>
                {getAvailableTickets(ticketDrawer.id).map(t => (
                  <option key={t.id} value={t.id}>{t.subject} ({t.userEmail})</option>
                ))}
              </select>
              {mergeTargetId && (
                <div style={{ marginTop: 10, padding: 10, background: `${T.green}10`, borderRadius: 6, border: `1px solid ${T.green}30` }}>
                  <div style={{ fontSize: 11, color: T.green }}>Γ£ô Messages and notes will be combined into this ticket</div>
                </div>
              )}
            </div>
            
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowMergeModal(false)}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={mergeTickets} disabled={!mergeTargetId || merging}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: "none", background: !mergeTargetId || merging ? T.border : T.orange, color: T.bg, fontSize: 13, fontWeight: 700, cursor: !mergeTargetId || merging ? "not-allowed" : "pointer" }}>
                {merging ? "Merging..." : "≡ƒöÇ Merge Tickets"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LINK TICKET MODAL */}
      {showLinkModal && ticketDrawer && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(4,9,15,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowLinkModal(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.gold}30`, padding: 24, width: "100%", maxWidth: 480, maxHeight: "80vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>≡ƒöù Link Related Ticket</h3>
   <button type="button" onClick={() => setShowLinkModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ padding: 12, background: `${T.teal}15`, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                Link related tickets together to track dependencies and similar issues. Both tickets will show the link.
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Current Ticket:</div>
              <div style={{ padding: 12, background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{ticketDrawer.subject}</div>
              </div>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Link to:</div>
              <select value={linkTargetId} onChange={e => setLinkTargetId(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                <option value="">Select a ticket...</option>
                {getAvailableTickets(ticketDrawer.id).map(t => (
                  <option key={t.id} value={t.id}>{t.subject} ({t.userName || t.userEmail})</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowLinkModal(false)}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={linkTicket} disabled={!linkTargetId || linking}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: "none", background: !linkTargetId || linking ? T.border : T.teal, color: T.bg, fontSize: 13, fontWeight: 700, cursor: !linkTargetId || linking ? "not-allowed" : "pointer" }}>
                {linking ? "Linking..." : "≡ƒöù Link Tickets"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM FIELDS MANAGEMENT MODAL */}
      {showFieldsModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(4,9,15,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowFieldsModal(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.gold}30`, padding: 24, width: "100%", maxWidth: 560, maxHeight: "85vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
   <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>ΓÜÖ∩╕Å Manage Custom Fields</h3>
   <button type="button" onClick={() => setShowFieldsModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ padding: 12, background: `${T.cyan}15`, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                Create custom fields to capture additional information on tickets. Fields will appear in the ticket drawer and can be used for filtering.
              </div>
            </div>
            
            {/* Add/Edit Field Form */}
            <div style={{ padding: 16, background: T.surfaceAlt, borderRadius: 10, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.white, marginBottom: 12 }}>
   {editingField ? "Γ£Å∩╕Å Edit Field" : "Γ₧ò Add New Field"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, display: "block" }}>Field Name</label>
                  <input value={newFieldForm.name} onChange={e => setNewFieldForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Browser, Device, Version..."
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, display: "block" }}>Field Type</label>
                  <select value={newFieldForm.type} onChange={e => setNewFieldForm(prev => ({ ...prev, type: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                    <option value="text">Text</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, display: "block" }}>Required</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "10px 0" }}>
                    <input type="checkbox" checked={newFieldForm.required} onChange={e => setNewFieldForm(prev => ({ ...prev, required: e.target.checked }))}
                      style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 12, color: T.textSecondary }}>Required field</span>
                  </label>
                </div>
                {newFieldForm.type === "dropdown" && (
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, display: "block" }}>Options (comma-separated)</label>
                    <input value={newFieldForm.options} onChange={e => setNewFieldForm(prev => ({ ...prev, options: e.target.value }))} placeholder="Option 1, Option 2, Option 3..."
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
                  </div>
                )}
                <div style={{ gridColumn: "span 2", display: "flex", gap: 10, marginTop: 8 }}>
                  {editingField && (
                    <button type="button" onClick={() => { setEditingField(null); setNewFieldForm({ name: "", type: "text", options: "", required: false }); }}
                      style={{ padding: "10px 16px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Cancel
                    </button>
                  )}
                  <button type="button" onClick={saveCustomField}
                    style={{ flex: 1, padding: "10px 16px", borderRadius: 6, border: "none", background: T.cyan, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {editingField ? "Update Field" : "Add Field"}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Existing Fields List */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.white, marginBottom: 12 }}>
                ≡ƒôï Existing Fields ({customFields.length})
              </div>
              {customFields.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: T.textMuted, fontSize: 12 }}>
                  No custom fields yet. Add one above!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {customFields.map(field => (
                    <div key={field.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 18 }}>
   {field.type === "dropdown" ? "≡ƒôï" : field.type === "date" ? "≡ƒôà" : field.type === "number" ? "≡ƒöó" : field.type === "checkbox" ? "Γÿæ∩╕Å" : "≡ƒô¥"}
                        </span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.white, display: "flex", alignItems: "center", gap: 6 }}>
                            {field.name}
                            {field.required && <span style={{ fontSize: 10, color: T.red }}>*</span>}
                          </div>
                          <div style={{ fontSize: 10, color: T.textMuted }}>
                            {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                            {field.type === "dropdown" && field.options?.length > 0 && ` ΓÇó ${field.options.length} options`}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => editCustomField(field)}
                          style={{ padding: "6px 12px", borderRadius: 5, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, cursor: "pointer" }}>
                          Edit
                        </button>
                        <button type="button" onClick={() => deleteCustomField(field.id)}
                          style={{ padding: "6px 12px", borderRadius: 5, border: `1px solid ${T.red}40`, background: `${T.red}10`, color: T.red, fontSize: 10, cursor: "pointer" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AUTO-ASSIGN RULES MODAL */}
      {showAutoAssignModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(4,9,15,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAutoAssignModal(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.gold}30`, padding: 24, width: "100%", maxWidth: 600, maxHeight: "85vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>≡ƒñû Auto-Assign Rules</h3>
   <button type="button" onClick={() => setShowAutoAssignModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ padding: 12, background: `${T.green}15`, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                Create rules to automatically assign tickets based on category, priority, user tier, or keywords. Rules are applied in order — first match wins.
              </div>
            </div>
            
            {/* Add/Edit Rule Form */}
            <div style={{ padding: 16, background: T.surfaceAlt, borderRadius: 10, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.white, marginBottom: 12 }}>
   {editingRule ? "Γ£Å∩╕Å Edit Rule" : "Γ₧ò Add New Rule"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, display: "block" }}>Rule Name</label>
                  <input value={newRuleForm.name} onChange={e => setNewRuleForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Bugs to Dev Team..."
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, display: "block" }}>When</label>
                  <select value={newRuleForm.condition} onChange={e => setNewRuleForm(prev => ({ ...prev, condition: e.target.value, conditionValue: "" }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                    {conditionOptions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, display: "block" }}>Equals / Contains</label>
                  {conditionOptions.find(c => c.id === newRuleForm.condition)?.values.length > 0 ? (
                    <select value={newRuleForm.conditionValue} onChange={e => setNewRuleForm(prev => ({ ...prev, conditionValue: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                      <option value="">Select...</option>
                      {conditionOptions.find(c => c.id === newRuleForm.condition)?.values.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                    </select>
                  ) : (
                    <input value={newRuleForm.conditionValue} onChange={e => setNewRuleForm(prev => ({ ...prev, conditionValue: e.target.value }))} placeholder="Enter keyword..."
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
                  )}
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, display: "block" }}>Assign To</label>
                  <select value={newRuleForm.assignTo} onChange={e => setNewRuleForm(prev => ({ ...prev, assignTo: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                    <option value="">Select agent...</option>
                    {assignableAgents.filter(a => a.id !== "unassigned").map(a => <option key={a.id} value={a.id}>≡ƒæñ {a.name}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input type="checkbox" checked={newRuleForm.enabled} onChange={e => setNewRuleForm(prev => ({ ...prev, enabled: e.target.checked }))}
                      style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 12, color: T.textSecondary }}>Enabled</span>
                  </label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {editingRule && (
                      <button type="button" onClick={() => { setEditingRule(null); setNewRuleForm({ name: "", condition: "category", conditionValue: "", assignTo: "", enabled: true }); }}
                        style={{ padding: "10px 16px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Cancel
                      </button>
                    )}
                    <button type="button" onClick={saveAutoAssignRule}
                      style={{ padding: "10px 20px", borderRadius: 6, border: "none", background: T.green, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      {editingRule ? "Update Rule" : "Add Rule"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Existing Rules List */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.white, marginBottom: 12 }}>
                ≡ƒôï Active Rules ({autoAssignRules.length})
              </div>
              {autoAssignRules.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: T.textMuted, fontSize: 12 }}>
                  No rules yet. Add one above!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {autoAssignRules.map((rule, idx) => (
                    <div key={rule.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${rule.enabled ? T.green : T.border}40`, opacity: rule.enabled ? 1 : 0.6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, minWidth: 20 }}>#{idx + 1}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.white, display: "flex", alignItems: "center", gap: 6 }}>
                            {rule.name}
                            {!rule.enabled && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.textMuted}20`, color: T.textMuted }}>DISABLED</span>}
                          </div>
                          <div style={{ fontSize: 10, color: T.textMuted }}>
                            If <span style={{ color: T.cyan }}>{rule.condition}</span> = <span style={{ color: T.gold }}>{rule.conditionValue}</span> ΓåÆ assign to <span style={{ color: T.purple }}>{rule.assignToName}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => toggleRuleEnabled(rule.id, !rule.enabled)}
                          style={{ padding: "6px 10px", borderRadius: 5, border: `1px solid ${rule.enabled ? T.orange : T.green}40`, background: rule.enabled ? `${T.orange}10` : `${T.green}10`, color: rule.enabled ? T.orange : T.green, fontSize: 10, cursor: "pointer" }}>
                          {rule.enabled ? "Disable" : "Enable"}
                        </button>
                        <button type="button" onClick={() => editAutoAssignRule(rule)}
                          style={{ padding: "6px 10px", borderRadius: 5, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, cursor: "pointer" }}>
                          Edit
                        </button>
                        <button type="button" onClick={() => deleteAutoAssignRule(rule.id)}
                          style={{ padding: "6px 10px", borderRadius: 5, border: `1px solid ${T.red}40`, background: `${T.red}10`, color: T.red, fontSize: 10, cursor: "pointer" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Run Auto-Assign Now Button */}
            <div style={{ marginTop: 20, padding: 16, background: `${T.gold}10`, borderRadius: 10, border: `1px solid ${T.gold}30` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.gold }}>≡ƒÆí Run Auto-Assign on Unassigned Tickets</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{unassignedCount} unassigned tickets</div>
                </div>
                <button type="button" onClick={async () => {
                  const unassigned = tickets.filter(t => !t.assignedTo && (t.status === "open" || t.status === "in_progress"));
                  let assigned = 0;
                  for (const ticket of unassigned) {
                    const result = await applyAutoAssignRules(ticket);
                    if (result) assigned++;
                  }
                  notify(`Auto-assigned ${assigned} tickets`);
                }}
                  style={{ padding: "10px 20px", borderRadius: 6, border: "none", background: T.gold, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Run Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLA SETTINGS MODAL */}
      {showSlaModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(4,9,15,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowSlaModal(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.gold}30`, padding: 24, width: "100%", maxWidth: 500, maxHeight: "85vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
   <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>ΓÅ▒∩╕Å SLA Settings</h3>
   <button type="button" onClick={() => setShowSlaModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ padding: 12, background: `${T.orange}15`, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                Configure Service Level Agreement settings for response times and automatic escalation when SLA is breached.
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Default SLA Hours */}
              <div>
                <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Default SLA (hours)</label>
                <input type="number" value={slaSettings.defaultHours} onChange={e => setSlaSettings(prev => ({ ...prev, defaultHours: parseInt(e.target.value) || 24 }))}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 14, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Tickets must be resolved within this time</div>
              </div>
              
              {/* Warning Threshold */}
              <div>
                <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Warning Threshold (%)</label>
                <input type="number" value={slaSettings.warningPercent} onChange={e => setSlaSettings(prev => ({ ...prev, warningPercent: parseInt(e.target.value) || 75 }))} min="50" max="99"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 14, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Show warning when SLA time is this % used (currently {Math.round(slaSettings.defaultHours * slaSettings.warningPercent / 100)}h)</div>
              </div>
              
              {/* Auto Escalation */}
              <div style={{ padding: 16, background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 12 }}>
                  <input type="checkbox" checked={slaSettings.escalateOnBreach} onChange={e => setSlaSettings(prev => ({ ...prev, escalateOnBreach: e.target.checked }))}
                    style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>Auto-escalate on SLA breach</span>
                </label>
                
                {slaSettings.escalateOnBreach && (
                  <div style={{ marginLeft: 28, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, display: "block" }}>Escalate To (Manager)</label>
                      <select value={slaSettings.escalateTo} onChange={e => {
                        const agent = assignableAgents.find(a => a.id === e.target.value);
                        setSlaSettings(prev => ({ ...prev, escalateTo: e.target.value, escalateToName: agent?.name || "" }));
                      }}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
                        <option value="">Select manager...</option>
                        {assignableAgents.filter(a => a.id !== "unassigned").map(a => <option key={a.id} value={a.id}>≡ƒæñ {a.name}</option>)}
                      </select>
                    </div>
                    
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input type="checkbox" checked={slaSettings.notifyAgent} onChange={e => setSlaSettings(prev => ({ ...prev, notifyAgent: e.target.checked }))}
                        style={{ width: 14, height: 14 }} />
                      <span style={{ fontSize: 11, color: T.textSecondary }}>Notify assigned agent</span>
                    </label>
                    
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input type="checkbox" checked={slaSettings.notifyManager} onChange={e => setSlaSettings(prev => ({ ...prev, notifyManager: e.target.checked }))}
                        style={{ width: 14, height: 14 }} />
                      <span style={{ fontSize: 11, color: T.textSecondary }}>Notify escalation manager</span>
                    </label>
                  </div>
                )}
              </div>
              
              {/* SLA Preview */}
              <div style={{ padding: 16, background: `${T.blue}10`, borderRadius: 10, border: `1px solid ${T.blue}30` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.blue, marginBottom: 8 }}>≡ƒôè SLA Timeline Preview</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 8, background: T.border, borderRadius: 4, overflow: "hidden", position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${slaSettings.warningPercent}%`, background: T.green, borderRadius: 4 }} />
                    <div style={{ position: "absolute", left: `${slaSettings.warningPercent}%`, top: 0, bottom: 0, right: 0, background: T.orange, borderRadius: "0 4px 4px 0" }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: T.textMuted }}>
                  <span>0h</span>
                  <span style={{ color: T.orange }}>{Math.round(slaSettings.defaultHours * slaSettings.warningPercent / 100)}h (Warning)</span>
                  <span style={{ color: T.red }}>{slaSettings.defaultHours}h (Breach)</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => setShowSlaModal(false)}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={saveSlaSettings}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: "none", background: T.gold, color: T.bg, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKFLOW TRIGGERS MODAL */}
      {showWorkflowModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(4,9,15,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowWorkflowModal(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.gold}30`, padding: 24, width: "100%", maxWidth: 650, maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>ΓÜí Workflow Triggers</h3>
   <button type="button" onClick={() => setShowWorkflowModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ padding: 12, background: `${T.purple}15`, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                Create automated workflows that trigger actions when certain conditions are met. Example: When status changes to "resolved" ΓåÆ add "resolved" tag.
              </div>
            </div>
            
            {/* Add/Edit Workflow Form */}
            <div style={{ padding: 16, background: T.surfaceAlt, borderRadius: 10, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.white, marginBottom: 12 }}>
   {editingWorkflow ? "Γ£Å∩╕Å Edit Workflow" : "Γ₧ò Create Workflow"}
              </div>
              
              {/* Workflow Name */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, display: "block" }}>Workflow Name</label>
                <input value={newWorkflowForm.name} onChange={e => setNewWorkflowForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Resolved ΓåÆ Add Tag..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
              </div>
              
              {/* Trigger Condition */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, display: "block" }}>When (Trigger)</label>
                  <select value={newWorkflowForm.trigger} onChange={e => setNewWorkflowForm(prev => ({ ...prev, trigger: e.target.value, triggerValue: "" }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                    {triggerOptions.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, display: "block" }}>Value</label>
                  {triggerOptions.find(t => t.id === newWorkflowForm.trigger)?.values.length > 0 ? (
                    <select value={newWorkflowForm.triggerValue} onChange={e => setNewWorkflowForm(prev => ({ ...prev, triggerValue: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                      <option value="">Any...</option>
                      {triggerOptions.find(t => t.id === newWorkflowForm.trigger)?.values.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                    </select>
                  ) : (
                    <input value={newWorkflowForm.triggerValue || ""} onChange={e => setNewWorkflowForm(prev => ({ ...prev, triggerValue: e.target.value }))} placeholder="(Any)"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} disabled />
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 10, color: T.textMuted }}>Then (Actions)</label>
                  <button type="button" onClick={addWorkflowAction}
                    style={{ padding: "4px 10px", borderRadius: 4, border: `1px dashed ${T.purple}`, background: "transparent", color: T.purple, fontSize: 10, cursor: "pointer" }}>
                    + Add Action
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {newWorkflowForm.actions.map((action, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: T.purple, fontWeight: 600, minWidth: 20 }}>{idx + 1}.</span>
                      <select value={action.type} onChange={e => updateWorkflowAction(idx, "type", e.target.value)}
                        style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
                        {actionOptions.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                      </select>
                      {actionOptions.find(a => a.id === action.type)?.needsValue && (
                        actionOptions.find(a => a.id === action.type)?.valueType === "tag" ? (
                          <select value={action.value} onChange={e => updateWorkflowAction(idx, "value", e.target.value)}
                            style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
                            <option value="">Select tag...</option>
                            {availableTags.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                          </select>
                        ) : actionOptions.find(a => a.id === action.type)?.valueType === "priority" ? (
                          <select value={action.value} onChange={e => updateWorkflowAction(idx, "value", e.target.value)}
                            style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
                            <option value="">Select priority...</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="normal">Normal</option>
                          </select>
                        ) : actionOptions.find(a => a.id === action.type)?.valueType === "status" ? (
                          <select value={action.value} onChange={e => updateWorkflowAction(idx, "value", e.target.value)}
                            style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
                            <option value="">Select status...</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        ) : (
                          <input value={action.value || ""} onChange={e => updateWorkflowAction(idx, "value", e.target.value)} placeholder="Enter value..."
                            style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif" }} />
                        )
                      )}
                      {newWorkflowForm.actions.length > 1 && (
                        <button type="button" onClick={() => removeWorkflowAction(idx)}
                          style={{ padding: "6px 10px", borderRadius: 4, border: `1px solid ${T.red}40`, background: `${T.red}10`, color: T.red, fontSize: 12, cursor: "pointer" }}>
   ├ù
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Enable + Save */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={newWorkflowForm.enabled} onChange={e => setNewWorkflowForm(prev => ({ ...prev, enabled: e.target.checked }))}
                    style={{ width: 16, height: 16 }} />
                  <span style={{ fontSize: 12, color: T.textSecondary }}>Enabled</span>
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  {editingWorkflow && (
                    <button type="button" onClick={() => { setEditingWorkflow(null); setNewWorkflowForm({ name: "", trigger: "status_change", triggerValue: "", actions: [{ type: "add_tag", value: "" }], enabled: true }); }}
                      style={{ padding: "10px 16px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Cancel
                    </button>
                  )}
                  <button type="button" onClick={saveWorkflowTrigger}
                    style={{ padding: "10px 20px", borderRadius: 6, border: "none", background: T.purple, color: T.white, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {editingWorkflow ? "Update Workflow" : "Create Workflow"}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Existing Workflows List */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.white, marginBottom: 12 }}>
                ≡ƒôï Active Workflows ({workflowTriggers.length})
              </div>
              {workflowTriggers.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: T.textMuted, fontSize: 12 }}>
                  No workflows yet. Create one above!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {workflowTriggers.map((wf) => (
                    <div key={wf.id} style={{ padding: "12px 14px", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${wf.enabled ? T.purple : T.border}40`, opacity: wf.enabled ? 1 : 0.6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.white, display: "flex", alignItems: "center", gap: 6 }}>
                            ΓÜí {wf.name}
                            {!wf.enabled && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.textMuted}20`, color: T.textMuted }}>DISABLED</span>}
                          </div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>
                            When <span style={{ color: T.cyan }}>{triggerOptions.find(t => t.id === wf.trigger)?.label || wf.trigger}</span>
                            {wf.triggerValue && <> = <span style={{ color: T.gold }}>{wf.triggerValue}</span></>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" onClick={() => toggleWorkflowEnabled(wf.id, !wf.enabled)}
                            style={{ padding: "5px 8px", borderRadius: 4, border: `1px solid ${wf.enabled ? T.orange : T.green}40`, background: wf.enabled ? `${T.orange}10` : `${T.green}10`, color: wf.enabled ? T.orange : T.green, fontSize: 9, cursor: "pointer" }}>
                            {wf.enabled ? "Disable" : "Enable"}
                          </button>
                          <button type="button" onClick={() => editWorkflowTrigger(wf)}
                            style={{ padding: "5px 8px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 9, cursor: "pointer" }}>
                            Edit
                          </button>
                          <button type="button" onClick={() => deleteWorkflowTrigger(wf.id)}
                            style={{ padding: "5px 8px", borderRadius: 4, border: `1px solid ${T.red}40`, background: `${T.red}10`, color: T.red, fontSize: 9, cursor: "pointer" }}>
                            Del
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(wf.actions || []).map((action, aIdx) => (
                          <span key={aIdx} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 4, background: `${T.purple}20`, color: T.purple }}>
                            {actionOptions.find(a => a.id === action.type)?.label || action.type}: {action.value || "—"}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSAT MODAL - Add Rating */}
      {showCsatModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9100, background: "rgba(4,9,15,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowCsatModal(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.gold}30`, padding: 24, width: "100%", maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>≡ƒÿè Add CSAT Rating</h3>
   <button type="button" onClick={() => setShowCsatModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ padding: 12, background: `${T.gold}10`, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: T.textSecondary }}>
                Add customer satisfaction rating for demo purposes. In production, this would come from customer feedback emails.
              </div>
            </div>
            
            {/* Star Rating */}
            <div style={{ marginBottom: 20, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>Rating</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setCsatForm(prev => ({ ...prev, rating: star }))}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 32, color: star <= csatForm.rating ? T.gold : T.border, transition: "transform 0.1s", transform: star <= csatForm.rating ? "scale(1.1)" : "scale(1)" }}>
                    Γÿà
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: csatForm.rating >= 4 ? T.green : csatForm.rating >= 3 ? T.orange : T.red }}>
                {csatForm.rating === 5 ? "Excellent!" : csatForm.rating === 4 ? "Good" : csatForm.rating === 3 ? "Average" : csatForm.rating === 2 ? "Poor" : "Very Poor"}
              </div>
            </div>
            
            {/* Comment */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Feedback Comment (optional)</label>
              <textarea value={csatForm.comment} onChange={e => setCsatForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Add customer feedback..."
                rows={3}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", resize: "none", boxSizing: "border-box" }} />
            </div>
            
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowCsatModal(false)}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={async () => {
                if (!csatForm.ticketId) return;
                const ticket = tickets.find(t => t.id === csatForm.ticketId);
                if (!ticket) return;
                
                try {
                  const csatData = {
                    ticketId: csatForm.ticketId,
                    rating: csatForm.rating,
                    comment: csatForm.comment.trim(),
                    agentId: ticket.assignedTo || null,
                    agentName: ticket.assignedToName || null,
                    userId: ticket.userId,
                    userName: ticket.userName || ticket.userEmail,
                    createdAt: new Date().toISOString()
                  };
                  
                  const docRef = await addDoc(collection(db, "supportCSAT"), csatData);
                  setCsatRatings(prev => [...prev, { id: docRef.id, ...csatData }]);
                  notify("CSAT rating added");
                  setShowCsatModal(false);
                  setCsatForm({ ticketId: "", rating: 5, comment: "" });
                } catch (e) {
                  notify("Error: " + e.message);
                }
              }}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: "none", background: T.gold, color: T.bg, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Save Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KNOWLEDGE BASE ARTICLE MODAL */}
      {showKbModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9100, background: "rgba(4,9,15,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowKbModal(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.gold}30`, padding: 24, width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>
   {editingArticle ? "Γ£Å∩╕Å Edit Article" : "≡ƒôÜ New Article"}
              </h3>
   <button type="button" onClick={() => setShowKbModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Title</label>
              <input value={articleForm.title} onChange={e => setArticleForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Article title..."
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Category</label>
                <select value={articleForm.category} onChange={e => setArticleForm(prev => ({ ...prev, category: e.target.value }))}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                  <option value="getting-started">≡ƒÜÇ Getting Started</option>
   <option value="billing">≡ƒÆ│ Billing & Payments</option>
                  <option value="technical">≡ƒöº Technical Issues</option>
                  <option value="features">Γ¡É Features & How-To</option>
                  <option value="account">≡ƒæñ Account Management</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Tags (comma-separated)</label>
                <input value={articleForm.tags} onChange={e => setArticleForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="password, login, security"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
              </div>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Content</label>
              <textarea value={articleForm.content} onChange={e => setArticleForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your article content here... You can use markdown-style formatting."
                rows={12}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }} />
            </div>
            
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowKbModal(false)}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={async () => {
                if (!articleForm.title.trim() || !articleForm.content.trim()) {
                  notify("Please fill title and content");
                  return;
                }
                
                try {
                  const articleData = {
                    title: articleForm.title.trim(),
                    content: articleForm.content.trim(),
                    category: articleForm.category,
                    tags: articleForm.tags.split(",").map(t => t.trim()).filter(Boolean),
                    updatedAt: new Date().toISOString()
                  };
                  
                  if (editingArticle) {
                    await setDoc(doc(db, "supportKnowledgeBase", editingArticle.id), articleData, { merge: true });
                    setKbArticles(prev => prev.map(a => a.id === editingArticle.id ? { ...a, ...articleData } : a));
                    if (viewingArticle?.id === editingArticle.id) setViewingArticle(prev => ({ ...prev, ...articleData }));
                    notify("Article updated");
                  } else {
                    articleData.createdAt = new Date().toISOString();
                    articleData.views = 0;
                    articleData.helpful = 0;
                    const docRef = await addDoc(collection(db, "supportKnowledgeBase"), articleData);
                    setKbArticles(prev => [...prev, { id: docRef.id, ...articleData }]);
                    notify("Article created");
                  }
                  
                  setShowKbModal(false);
                  setArticleForm({ title: "", content: "", category: "getting-started", tags: "" });
                  setEditingArticle(null);
                } catch (e) {
                  notify("Error: " + e.message);
                }
              }}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: "none", background: T.teal, color: T.white, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {editingArticle ? "Update Article" : "Create Article"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK RESPONSE MODAL */}
      {showQuickResponseModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9100, background: "rgba(4,9,15,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowQuickResponseModal(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.gold}30`, padding: 24, width: "100%", maxWidth: 550, maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>
   {editingQuickResponse ? "Γ£Å∩╕Å Edit Quick Response" : "ΓÜí New Quick Response"}
              </h3>
   <button type="button" onClick={() => setShowQuickResponseModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ padding: 12, background: `${T.purple}10`, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: T.textSecondary }}>
                ≡ƒÆí Available variables: <code style={{ background: T.surface, padding: "2px 6px", borderRadius: 4 }}>{"{{name}}"}</code> <code style={{ background: T.surface, padding: "2px 6px", borderRadius: 4 }}>{"{{ticket_id}}"}</code> <code style={{ background: T.surface, padding: "2px 6px", borderRadius: 4 }}>{"{{agent_name}}"}</code> <code style={{ background: T.surface, padding: "2px 6px", borderRadius: 4 }}>{"{{category}}"}</code> <code style={{ background: T.surface, padding: "2px 6px", borderRadius: 4 }}>{"{{tier}}"}</code>
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Name</label>
                <input value={quickResponseForm.name} onChange={e => setQuickResponseForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Greeting"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Shortcut</label>
                <input value={quickResponseForm.shortcut} onChange={e => setQuickResponseForm(prev => ({ ...prev, shortcut: e.target.value.startsWith("/") ? e.target.value : "/" + e.target.value }))}
                  placeholder="/greet"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Category</label>
              <select value={quickResponseForm.category} onChange={e => setQuickResponseForm(prev => ({ ...prev, category: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                <option value="general">≡ƒÆ¼ General</option>
                <option value="technical">≡ƒöº Technical</option>
   <option value="billing">≡ƒÆ│ Billing</option>
              </select>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Content</label>
              <textarea value={quickResponseForm.content} onChange={e => setQuickResponseForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Hi {{name}},\n\nThank you for contacting us..."
                rows={8}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }} />
            </div>
            
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowQuickResponseModal(false)}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={async () => {
                if (!quickResponseForm.name.trim() || !quickResponseForm.content.trim() || !quickResponseForm.shortcut.trim()) {
                  notify("Please fill all fields");
                  return;
                }
                
                try {
                  const qrData = {
                    name: quickResponseForm.name.trim(),
                    shortcut: quickResponseForm.shortcut.trim(),
                    content: quickResponseForm.content.trim(),
                    category: quickResponseForm.category,
                    updatedAt: new Date().toISOString()
                  };
                  
                  if (editingQuickResponse) {
                    await setDoc(doc(db, "supportQuickResponses", editingQuickResponse.id), qrData, { merge: true });
                    setQuickResponses(prev => prev.map(q => q.id === editingQuickResponse.id ? { ...q, ...qrData } : q));
                    notify("Quick response updated");
                  } else {
                    qrData.createdAt = new Date().toISOString();
                    qrData.usageCount = 0;
                    const docRef = await addDoc(collection(db, "supportQuickResponses"), qrData);
                    setQuickResponses(prev => [...prev, { id: docRef.id, ...qrData }]);
                    notify("Quick response created");
                  }
                  
                  setShowQuickResponseModal(false);
                  setQuickResponseForm({ name: "", shortcut: "", content: "", category: "general" });
                  setEditingQuickResponse(null);
                } catch (e) {
                  notify("Error: " + e.message);
                }
              }}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: "none", background: T.purple, color: T.white, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {editingQuickResponse ? "Update Response" : "Create Response"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Settings Modal */}
      {showChatSettings && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9100, background: "rgba(4,9,15,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowChatSettings(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.gold}30`, padding: 24, width: "100%", maxWidth: 500, maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>
   ΓÜÖ∩╕Å Live Chat Settings
              </h3>
   <button type="button" onClick={() => setShowChatSettings(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: T.surfaceAlt, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>Enable Live Chat</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>Allow visitors to start live chats</div>
                </div>
                <button type="button" onClick={() => setChatSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                  style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: chatSettings.enabled ? T.green : T.border, cursor: "pointer", position: "relative", transition: "all 0.2s" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: T.white, position: "absolute", top: 3, left: chatSettings.enabled ? 23 : 3, transition: "all 0.2s" }} />
                </button>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: T.surfaceAlt, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>Auto-Accept Chats</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>Automatically accept incoming chats</div>
                </div>
                <button type="button" onClick={() => setChatSettings(prev => ({ ...prev, autoAccept: !prev.autoAccept }))}
                  style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: chatSettings.autoAccept ? T.green : T.border, cursor: "pointer", position: "relative", transition: "all 0.2s" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: T.white, position: "absolute", top: 3, left: chatSettings.autoAccept ? 23 : 3, transition: "all 0.2s" }} />
                </button>
              </div>
              
              <div>
                <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Max Concurrent Chats</label>
                <input type="number" value={chatSettings.maxConcurrent} onChange={e => setChatSettings(prev => ({ ...prev, maxConcurrent: parseInt(e.target.value) || 1 }))}
                  min={1} max={10}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
              </div>
              
              <div>
                <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Welcome Message</label>
                <textarea value={chatSettings.welcomeMessage} onChange={e => setChatSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  rows={2}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              
              <div>
                <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Offline Message</label>
                <textarea value={chatSettings.offlineMessage} onChange={e => setChatSettings(prev => ({ ...prev, offlineMessage: e.target.value }))}
                  rows={2}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Widget Color</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="color" value={chatSettings.widgetColor} onChange={e => setChatSettings(prev => ({ ...prev, widgetColor: e.target.value }))}
                      style={{ width: 40, height: 36, borderRadius: 6, border: `1px solid ${T.border}`, cursor: "pointer" }} />
                    <input type="text" value={chatSettings.widgetColor} onChange={e => setChatSettings(prev => ({ ...prev, widgetColor: e.target.value }))}
                      style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 12, fontFamily: "monospace" }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, display: "block" }}>Widget Position</label>
                  <select value={chatSettings.widgetPosition} onChange={e => setChatSettings(prev => ({ ...prev, widgetPosition: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                    <option value="right">Bottom Right</option>
                    <option value="left">Bottom Left</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setShowChatSettings(false)}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={() => { setShowChatSettings(false); notify("Settings saved"); }}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: "none", background: T.gold, color: T.surface, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Widget Preview Modal */}
      {showWidgetPreview && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9100, background: "rgba(4,9,15,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowWidgetPreview(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.gold}30`, padding: 24, width: "100%", maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>
   ≡ƒæü∩╕Å Widget Preview
              </h3>
   <button type="button" onClick={() => setShowWidgetPreview(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ background: "#f5f5f5", borderRadius: 12, padding: 20, display: "flex", justifyContent: chatSettings.widgetPosition === "right" ? "flex-end" : "flex-start" }}>
              {/* Widget Preview */}
              <div style={{ width: 320 }}>
                {/* Chat Header */}
                <div style={{ background: chatSettings.widgetColor, borderRadius: "12px 12px 0 0", padding: 16, color: T.white }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>≡ƒÆ¼</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>DXB Analytics</div>
                      <div style={{ fontSize: 11, opacity: 0.9, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: agentOnline ? "#4ADE80" : "#EF4444" }} />
                        {agentOnline ? "Online ΓÇó ~2 min" : "Offline"}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Chat Body */}
                <div style={{ background: "#fff", padding: 16, minHeight: 200 }}>
                  <div style={{ background: "#f0f0f0", borderRadius: 12, padding: 12, maxWidth: "80%", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: "#333" }}>{chatSettings.welcomeMessage}</div>
                  </div>
                  {!agentOnline && (
                    <div style={{ background: "#FEF3C7", borderRadius: 8, padding: 10, fontSize: 11, color: "#92400E" }}>
   ΓÜá∩╕Å {chatSettings.offlineMessage}
                    </div>
                  )}
                </div>
                
                {/* Chat Input */}
                <div style={{ background: "#fff", borderRadius: "0 0 12px 12px", padding: 12, borderTop: "1px solid #e5e5e5", display: "flex", gap: 8 }}>
                  <input type="text" placeholder="Type a message..." disabled
                    style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 13 }} />
                  <button type="button" disabled style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: chatSettings.widgetColor, color: "#fff", fontWeight: 600, fontSize: 13 }}>
                    Send
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <span style={{ fontSize: 11, color: T.textMuted }}>This is how the widget will appear on your website</span>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Templates Modal */}
      {showWhatsappTemplates && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9100, background: "rgba(4,9,15,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowWhatsappTemplates(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid #25D36630`, padding: 24, width: "100%", maxWidth: 550, maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>≡ƒô▒</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>
                    WhatsApp Message Templates
                  </h3>
                  <div style={{ fontSize: 11, color: T.textMuted }}>Pre-approved templates for out-of-window messaging</div>
                </div>
              </div>
   <button type="button" onClick={() => setShowWhatsappTemplates(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ padding: 12, background: `${T.teal}10`, borderRadius: 8, marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 16 }}>≡ƒÆí</span>
              <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>
                These templates are pre-approved by Meta for WhatsApp Business API. Use <code style={{ background: T.surface, padding: "1px 4px", borderRadius: 3 }}>{"{{name}}"}</code> for customer's name.
                {activeWhatsappId && " Click a template to send it to the current conversation."}
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {whatsappTemplates.map(template => {
                const activeConv = whatsappConversations.find(c => c.id === activeWhatsappId);
                const previewContent = activeConv ? template.content.replace("{{name}}", activeConv.customerName?.split(" ")[0] || "there") : template.content;
                
                return (
                  <div key={template.id} 
                    onClick={() => {
                      if (activeConv) {
                        const content = template.content.replace("{{name}}", activeConv.customerName?.split(" ")[0] || "there");
                        setWhatsappConversations(prev => prev.map(c => c.id === activeWhatsappId ? { ...c, messages: [...(c.messages || []), { from: "agent", text: content, at: new Date().toISOString() }], responded: true } : c));
                        setShowWhatsappTemplates(false);
                        notify("Template sent!");
                      }
                    }}
                    style={{ padding: 14, background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}`, cursor: activeConv ? "pointer" : "default", transition: "all 0.15s" }}
                    onMouseEnter={e => activeConv && (e.currentTarget.style.borderColor = "#25D366")}
                    onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{template.name}</span>
                      <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "#25D36620", color: "#25D366" }}>Γ£ô Approved</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5, padding: 10, background: T.surface, borderRadius: 6, borderLeft: `3px solid #25D366` }}>
                      {previewContent}
                    </div>
                    {activeConv && (
                      <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 10, color: "#25D366" }}>Click to send ΓåÆ</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div style={{ marginTop: 20, padding: 12, background: T.surfaceAlt, borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 6 }}>≡ƒô¥ Create Custom Template</div>
              <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>
                Custom templates must be submitted to Meta for approval. This process typically takes 24-48 hours.
              </div>
              <button type="button" style={{ marginTop: 10, padding: "8px 14px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 11, cursor: "pointer" }}>
                + Submit New Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 8A: Manual Time Entry Modal */}
      {showTimeEntryModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
          <div style={{ width: 440, background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
   <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>ΓÅ▒∩╕Å Add Manual Time Entry</div>
   <button type="button" onClick={() => setShowTimeEntryModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Select Ticket *</label>
                <select value={timeEntryForm.ticketId} onChange={e => setTimeEntryForm(prev => ({ ...prev, ticketId: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 12, cursor: "pointer" }}>
                  <option value="">Choose a ticket...</option>
                  {tickets.map(t => (
                    <option key={t.id} value={t.id}>{t.subject?.slice(0, 50) || t.id}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Duration (minutes) *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[5, 15, 30, 60].map(mins => (
                    <button key={mins} type="button" onClick={() => setTimeEntryForm(prev => ({ ...prev, duration: mins }))}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 6, border: `1px solid ${timeEntryForm.duration === mins ? T.gold : T.border}`, background: timeEntryForm.duration === mins ? `${T.gold}20` : "transparent", color: timeEntryForm.duration === mins ? T.gold : T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {mins}m
                    </button>
                  ))}
                </div>
                <input type="number" value={timeEntryForm.duration} onChange={e => setTimeEntryForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))} placeholder="Or enter custom..."
                  style={{ width: "100%", marginTop: 8, padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 12, boxSizing: "border-box" }} />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Notes</label>
                <input value={timeEntryForm.notes} onChange={e => setTimeEntryForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="What did you work on?"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 12, boxSizing: "border-box" }} />
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={timeEntryForm.billable} onChange={e => setTimeEntryForm(prev => ({ ...prev, billable: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: T.green }} />
                  <span style={{ fontSize: 12, color: T.textSecondary }}>≡ƒÆ░ Billable time</span>
                </label>
              </div>
              
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setShowTimeEntryModal(false)}
                  style={{ flex: 1, padding: "12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="button" onClick={addManualTimeEntry} disabled={!timeEntryForm.ticketId || timeEntryForm.duration <= 0}
                  style={{ flex: 2, padding: "12px", borderRadius: 8, border: "none", background: timeEntryForm.ticketId && timeEntryForm.duration > 0 ? T.gold : T.border, color: T.bg, fontSize: 12, fontWeight: 700, cursor: timeEntryForm.ticketId && timeEntryForm.duration > 0 ? "pointer" : "not-allowed" }}>
                  Add Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 8B: Webhook Modal */}
      {showWebhookModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
          <div style={{ width: 500, background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>≡ƒöù {editingWebhook ? "Edit Webhook" : "Add Webhook"}</div>
   <button type="button" onClick={() => setShowWebhookModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Webhook Name *</label>
                <input value={webhookForm.name} onChange={e => setWebhookForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Slack Notifications"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 12, boxSizing: "border-box" }} />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Webhook URL *</label>
                <input value={webhookForm.url} onChange={e => setWebhookForm(prev => ({ ...prev, url: e.target.value }))} placeholder="https://hooks.slack.com/..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 12, boxSizing: "border-box" }} />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Secret (Optional)</label>
                <input value={webhookForm.secret} onChange={e => setWebhookForm(prev => ({ ...prev, secret: e.target.value }))} placeholder="For signature verification"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 12, boxSizing: "border-box" }} />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Events to Send</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {webhookEvents.map(event => (
                    <label key={event.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 6, border: `1px solid ${webhookForm.events?.includes(event.id) ? T.teal : T.border}`, background: webhookForm.events?.includes(event.id) ? `${T.teal}15` : "transparent", cursor: "pointer" }}>
                      <input type="checkbox" checked={webhookForm.events?.includes(event.id)} onChange={e => {
                        if (e.target.checked) {
                          setWebhookForm(prev => ({ ...prev, events: [...(prev.events || []), event.id] }));
                        } else {
                          setWebhookForm(prev => ({ ...prev, events: (prev.events || []).filter(x => x !== event.id) }));
                        }
                      }} style={{ display: "none" }} />
                      <span style={{ fontSize: 11, color: webhookForm.events?.includes(event.id) ? T.teal : T.textMuted }}>{event.icon} {event.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={webhookForm.enabled} onChange={e => setWebhookForm(prev => ({ ...prev, enabled: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: T.green }} />
                  <span style={{ fontSize: 12, color: T.textSecondary }}>Webhook enabled</span>
                </label>
              </div>
              
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setShowWebhookModal(false)}
                  style={{ flex: 1, padding: "12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="button" onClick={saveWebhook}
                  style={{ flex: 2, padding: "12px", borderRadius: 8, border: "none", background: T.gold, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {editingWebhook ? "Update Webhook" : "Create Webhook"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 8B: Export Modal */}
      {showExportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
          <div style={{ width: 460, background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>≡ƒôñ Export Tickets</div>
   <button type="button" onClick={() => setShowExportModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Format</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["csv", "json"].map(fmt => (
                    <button key={fmt} type="button" onClick={() => setExportConfig(prev => ({ ...prev, format: fmt }))}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 6, border: `1px solid ${exportConfig.format === fmt ? T.teal : T.border}`, background: exportConfig.format === fmt ? `${T.teal}20` : "transparent", color: exportConfig.format === fmt ? T.teal : T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "uppercase" }}>
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Date Range</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ id: "all", label: "All" }, { id: "7d", label: "7 Days" }, { id: "30d", label: "30 Days" }, { id: "90d", label: "90 Days" }].map(range => (
                    <button key={range.id} type="button" onClick={() => setExportConfig(prev => ({ ...prev, dateRange: range.id }))}
                      style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: `1px solid ${exportConfig.dateRange === range.id ? T.gold : T.border}`, background: exportConfig.dateRange === range.id ? `${T.gold}20` : "transparent", color: exportConfig.dateRange === range.id ? T.gold : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Status Filter</label>
                <select value={exportConfig.status} onChange={e => setExportConfig(prev => ({ ...prev, status: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 12, cursor: "pointer" }}>
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Include</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={exportConfig.includeMessages} onChange={e => setExportConfig(prev => ({ ...prev, includeMessages: e.target.checked }))} style={{ width: 16, height: 16, accentColor: T.teal }} />
                    <span style={{ fontSize: 12, color: T.textSecondary }}>≡ƒÆ¼ Messages</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={exportConfig.includeNotes} onChange={e => setExportConfig(prev => ({ ...prev, includeNotes: e.target.checked }))} style={{ width: 16, height: 16, accentColor: T.orange }} />
                    <span style={{ fontSize: 12, color: T.textSecondary }}>≡ƒôî Internal Notes</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={exportConfig.includeTime} onChange={e => setExportConfig(prev => ({ ...prev, includeTime: e.target.checked }))} style={{ width: 16, height: 16, accentColor: T.gold }} />
   <span style={{ fontSize: 12, color: T.textSecondary }}>ΓÅ▒∩╕Å Time Entries</span>
                  </label>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setShowExportModal(false)}
                  style={{ flex: 1, padding: "12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="button" onClick={exportTickets} disabled={exporting}
                  style={{ flex: 2, padding: "12px", borderRadius: 8, border: "none", background: T.teal, color: T.bg, fontSize: 12, fontWeight: 700, cursor: exporting ? "not-allowed" : "pointer" }}>
                  {exporting ? "Exporting..." : `Export ${exportConfig.format.toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 8B: Permissions Modal */}
      {showPermissionsModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
          <div style={{ width: 420, background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>≡ƒöÉ {editingPermission ? "Edit Permission" : "Add Permission"}</div>
   <button type="button" onClick={() => setShowPermissionsModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>├ù</button>
            </div>
            
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Select Agent *</label>
                <select value={permissionForm.agentId} onChange={e => setPermissionForm(prev => ({ ...prev, agentId: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 12, cursor: "pointer" }}>
                  <option value="">Choose agent...</option>
                  {assignableAgents.filter(a => a.id !== "unassigned").map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name} ({agent.email})</option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Role</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {permissionRoles.map(role => (
                    <label key={role.id} onClick={() => setPermissionForm(prev => ({ ...prev, role: role.id }))}
                      style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: 8, border: `1px solid ${permissionForm.role === role.id ? role.color : T.border}`, background: permissionForm.role === role.id ? `${role.color}15` : "transparent", cursor: "pointer" }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${permissionForm.role === role.id ? role.color : T.textMuted}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                        {permissionForm.role === role.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: role.color }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: permissionForm.role === role.id ? role.color : T.white }}>{role.label}</div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{role.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setShowPermissionsModal(false)}
                  style={{ flex: 1, padding: "12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="button" onClick={savePermission} disabled={!permissionForm.agentId}
                  style={{ flex: 2, padding: "12px", borderRadius: 8, border: "none", background: permissionForm.agentId ? T.purple : T.border, color: T.white, fontSize: 12, fontWeight: 700, cursor: permissionForm.agentId ? "pointer" : "not-allowed" }}>
                  {editingPermission ? "Update Permission" : "Add Permission"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportTab;
