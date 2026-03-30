/**
 * DXB ANALYTICS — App.jsx
 *
 * DXBProvider wraps the entire app — Dashboard, Admin, Landing all share
 * the same live Firestore state. No data is fetched twice.
 *
 * Iron Rule: NEVER run npx vercel --prod — use git push only
 */

import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DXBProvider, useDXB } from "./context/DXBContext";
import { I18nProvider } from "./i18n";

// Lazy-load heavy pages for faster initial paint
const EmaarDashboardV2 = React.lazy(() => import("./EmaarDashboardV2"));
const LandingPage       = React.lazy(() => import("./LandingPage"));
const AdminPanel        = React.lazy(() => import("./AdminPanel"));
const Terms             = React.lazy(() => import("./Terms"));
const Privacy           = React.lazy(() => import("./Privacy"));

// Full-screen loading fallback — original DXB Analytics logo
function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#04090F",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width="48" height="48" viewBox="0 0 40 40">
            <rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke="#D4A843" strokeWidth="2" />
            <path d="M12 28V12h10l-6 8h8l-12 8z" fill="#D4A843" />
          </svg>
        </div>
        <div style={{ fontFamily: "serif", fontSize: 22, fontWeight: 900, color: "#D4A843", letterSpacing: -0.5, marginBottom: 4 }}>
          DXB Analytics
        </div>
        <div style={{ fontSize: 11, color: "#64748B", letterSpacing: 2, textTransform: "uppercase" }}>
          Dubai Real Estate Intelligence
        </div>
      </div>
    </div>
  );
}

// AdminRoute — only superAdmin/admin can access /admin
function AdminRoute() {
  const { adminMode, authLoading, isLoggedIn } = useDXB();
  if (authLoading) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (!adminMode) return <Navigate to="/dashboard" replace />;
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminPanel />
    </Suspense>
  );
}
function HomeRoute() {
  const { isLoggedIn, authLoading } = useDXB();
  if (authLoading) return <PageLoader />;
  return isLoggedIn
    ? <Navigate to="/dashboard" replace />
    : (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    );
}

function App() {
  return (
    <BrowserRouter>
      {/* DXBProvider wraps everything — one data load for the whole app */}
      <I18nProvider>
      <DXBProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"          element={<HomeRoute />} />
            <Route path="/dashboard" element={<EmaarDashboardV2 />} />
            <Route path="/admin"     element={<AdminRoute />} />
            <Route path="/terms"     element={<Terms />} />
            <Route path="/privacy"   element={<Privacy />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </DXBProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
