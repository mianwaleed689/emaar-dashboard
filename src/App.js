import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import EmaarDashboardV2 from "./EmaarDashboardV2";
import AdminPanel from "./AdminPanel";
import ProjectManager from "./ProjectManager";
import Terms from "./Terms";
import Privacy from "./Privacy";
import ErrorBoundary from "./ErrorBoundary";
import NotFound from "./NotFound";
import { I18nProvider } from "./i18n";

function AuthGuard({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { setStatus("denied"); return; }
      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const data = snap.exists() ? snap.data() : {};
        setStatus(data.role === "admin" ? "allowed" : "denied");
      } catch {
        setStatus("denied");
      }
    });
    return () => unsub();
  }, []);

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", background: "#04090F", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 24, height: 24, border: "2px solid rgba(212,168,67,0.3)", borderTopColor: "#D4A843", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (status === "denied") return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<EmaarDashboardV2 />} />
            <Route path="/dashboard" element={<EmaarDashboardV2 />} />
            <Route path="/admin" element={<AuthGuard><AdminPanel /></AuthGuard>} />
            <Route path="/manage" element={<AuthGuard><ProjectManager /></AuthGuard>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
