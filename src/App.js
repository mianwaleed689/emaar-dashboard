import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import EmaarDashboardV2 from "./EmaarDashboardV2";
import AdminPanel from "./AdminPanel";
import ProjectManager from "./ProjectManager";
import LandingPage from "./LandingPage";
import ErrorBoundary from "./ErrorBoundary";
import NotFound from "./NotFound";
import { I18nProvider } from "./i18n";

const Spinner = () => (
  <div style={{ minHeight: "100vh", background: "#04090F", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 24, height: 24, border: "2px solid rgba(212,168,67,0.3)", borderTopColor: "#D4A843", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Smart home route: shows landing page to guests, dashboard to signed-in users
function HomeRoute() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setStatus(user ? "auth" : "guest");
    });
    return () => unsub();
  }, []);

  if (status === "loading") return <Spinner />;

  if (status === "guest") return (
    <LandingPage
      onLoginClick={() => window.location.href = "/dashboard"}
      onSignUpClick={(plan) =>
        window.location.href = plan && plan !== "free"
          ? `/dashboard?plan=${plan}`
          : "/dashboard"
      }
    />
  );

  return <EmaarDashboardV2 />;
}

function AuthGuard({ children, requireAdmin = false }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { setStatus("denied"); return; }
      if (!requireAdmin) { setStatus("allowed"); return; }
      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const data = snap.exists() ? snap.data() : {};
        // FIX SEC-2: removed hardcoded admin email bypass — role check only
        const isAdmin = data.role === "admin";
        setStatus(isAdmin ? "allowed" : "denied");
      } catch {
        setStatus("denied");
      }
    });
    return () => unsub();
  }, [requireAdmin]);

  if (status === "loading") return <Spinner />;
  if (status === "denied") return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <BrowserRouter>
          <Routes>
            {/* FIX C-3: home route is now smart — landing for guests, dashboard for authed users */}
            <Route path="/" element={<HomeRoute />} />
            {/* Dedicated dashboard route for post-login redirects */}
            <Route path="/dashboard" element={
              <AuthGuard>
                <EmaarDashboardV2 />
              </AuthGuard>
            } />
            <Route path="/admin" element={
              <AuthGuard requireAdmin>
                <AdminPanel />
              </AuthGuard>
            } />
            <Route path="/manage" element={
              <AuthGuard requireAdmin>
                <ProjectManager />
              </AuthGuard>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
