/**
 * DXB ANALYTICS — App.js
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
const AdminPanel        = React.lazy(() => import("./AdminPanel"));
const LandingPage       = React.lazy(() => import("./LandingPage"));
const ProjectDetail     = React.lazy(() => import("./ProjectDetail"));
const ProjectManager    = React.lazy(() => import("./ProjectManager"));
const Terms             = React.lazy(() => import("./Terms"));
const Privacy           = React.lazy(() => import("./Privacy"));
const UserGuard         = React.lazy(() => import("./UserGuard"));
const NotFound          = React.lazy(() => import("./NotFound"));

// Full-screen loading fallback
function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#04090F",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#D4A843", letterSpacing: 2, marginBottom: 12 }}>
          DXB ANALYTICS
        </div>
        <div style={{ fontSize: 11, color: "#64748B" }}>Loading...</div>
      </div>
    </div>
  );
}

// HomeRoute — sends logged-in users to dashboard, others to landing
function HomeRoute() {
  const { isLoggedIn, authLoading } = useDXB();
  if (authLoading) return <PageLoader />;
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

// AdminRoute — only admins can access /admin
function AdminRoute() {
  const { adminMode, authLoading, isLoggedIn } = useDXB();
  if (authLoading) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (!adminMode) return <Navigate to="/dashboard" replace />;
  return <AdminPanel />;
}

function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        {/* DXBProvider wraps everything — one data load for the whole app */}
        <DXBProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"            element={<HomeRoute />} />
              <Route path="/dashboard"   element={<UserGuard><EmaarDashboardV2 /></UserGuard>} />
              <Route path="/admin"       element={<AdminRoute />} />
              <Route path="/manage"      element={<UserGuard adminOnly><ProjectManager /></UserGuard>} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/terms"       element={<Terms />} />
              <Route path="/privacy"     element={<Privacy />} />
              <Route path="*"            element={<NotFound />} />
            </Routes>
          </Suspense>
        </DXBProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
