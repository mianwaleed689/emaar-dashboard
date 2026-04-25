import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import EmaarDashboardV2 from "./pages/EmaarDashboardV2";
import AdminPanel from "./AdminPanel";
import ProjectManager from "./ProjectManager";
import LandingPage from "./pages/LandingPage";
import AgencySignup from "./pages/AgencySignup";
import DeveloperPortal from "./DeveloperPortal";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ErrorBoundary from "./pages/ErrorBoundary";
import UserGuard from "./pages/UserGuard";
import NotFound from "./pages/NotFound";
import { I18nProvider } from "./i18n";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { FilterSchemaProvider } from "./contexts/FilterSchemaContext";
const Spinner = () => (
  <div style={{ minHeight: "100vh", background: "#04090F", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 24, height: 24, border: "2px solid rgba(212,168,67,0.3)", borderTopColor: "#D4A843", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);
function AuthGuard({ children }) {
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { setStatus("denied"); return; }
      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const data = snap.exists() ? snap.data() : {};
        setStatus(data.role === "admin" || data.role === "superAdmin" || data.superAdmin === true ? "allowed" : "denied");
      } catch {
        setStatus("denied");
      }
    });
    return () => unsub();
  }, []);
  if (status === "loading") return <Spinner />;
  if (status === "denied") return <Navigate to="/" replace />;
  return children;
}
function HomeRoute() {
  const [status, setStatus] = useState("loading");
  const navigate = useNavigate();
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setStatus(firebaseUser ? "loggedin" : "guest");
    });
    return () => unsub();
  }, []);
  if (status === "loading") return <Spinner />;
  if (status === "loggedin") return <Navigate to="/dashboard" replace />;
  return (
    <LandingPage
      onLoginClick={() => navigate("/dashboard?auth=login")}
      onSignUpClick={() => navigate("/dashboard?auth=signup")}
    />
  );
}
function ProjectRedirect() {
  const navigate = useNavigate();
  const { id } = useParams();
  useEffect(() => {
    navigate("/dashboard", { state: { openProjectId: id }, replace: true });
  }, [id, navigate]);
  return <Spinner />;
}
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
      <I18nProvider>
          <FilterSchemaProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/dashboard" element={<UserGuard><EmaarDashboardV2 /></UserGuard>} />
            <Route path="/admin" element={<AuthGuard><AdminPanel /></AuthGuard>} />
            <Route path="/manage" element={<AuthGuard><ProjectManager /></AuthGuard>} />
            <Route path="/project/:id" element={<ProjectRedirect />} />
            <Route path="/agency/signup" element={<AgencySignup />} />
          <Route path="/developer" element={<UserGuard><DeveloperPortal /></UserGuard>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
                </FilterSchemaProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
export default App;

