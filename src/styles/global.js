/* ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê
   DXB ANALYTICS ‚‚Ç¨‚Äù GLOBAL STYLES
   Extracted from EmaarDashboardV2.jsx
   CSS string builder ‚‚Ç¨‚Äù takes theme object T as parameter
   Includes: base, components, sidebar, login, responsive, touch, mobile nav
   ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê */

export const buildGlobalCSS = (T) => `
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

  /* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ 768px: Tablet / small laptop ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
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

    /* Tables ‚‚Ç¨‚Äù horizontal scroll with hint arrow */
    .table-scroll { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
    .table-scroll::after { content: "swipe ‚Ü‚Äô"; position: absolute; right: 8px; top: 12px; color: ${T.gold}; font-size: 10px; opacity: 0.5; pointer-events: none; letter-spacing: 0.5px; }
    .table-scroll table { min-width: 560px; }

    /* Compare bar */
    .compare-bar { padding: 10px 14px !important; flex-direction: column !important; align-items: stretch !important; gap: 8px !important; }
    .compare-bar > div { justify-content: center; flex-wrap: wrap; }

    /* Mortgage calculator 2-col ‚Ü‚Äô 1-col */
    .mortgage-grid { grid-template-columns: 1fr !important; }

    /* AI Insights full width cards */
    .ai-insights-grid { grid-template-columns: 1fr !important; }

    /* Alert modal full screen */
    .alerts-modal { max-width: 100% !important; max-height: 100dvh !important; border-radius: 20px 20px 0 0 !important; position: fixed !important; bottom: 0 !important; top: auto !important; margin: 0 !important; }
  }

  /* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ 480px: Mobile phones ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
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

  /* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ 360px: Very small phones ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
  @media (max-width: 360px) {
    .kpi-grid { grid-template-columns: 1fr !important; }
    html { font-size: 11px; }
  }

  /* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Touch improvements ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
  * { -webkit-tap-highlight-color: transparent; }
  button, a, [role="button"] { touch-action: manipulation; }
  input[type="range"] { height: 32px; }

  /* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Mobile Bottom Nav Bar ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
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
