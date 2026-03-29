import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const Spinner = () => (
  <div style={{ minHeight: "100vh", background: "#04090F", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 24, height: 24, border: "2px solid rgba(212,168,67,0.3)", borderTopColor: "#D4A843", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function UserGuard({ children }) {
  const [status, setStatus] = useState("loading");
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const authParam = params.get("auth");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setStatus("denied");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const data = snap.exists() ? snap.data() : {};
        if (data.suspended) {
          setStatus("denied");
        } else {
          setStatus("allowed");
        }
      } catch {
        setStatus("allowed");
      }
    });
    return () => unsub();
  }, []);

  if (status === "loading") return <Spinner />;
  if (status === "denied" && authParam) return children;
  if (status === "denied") {
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/dashboard?auth=login&next=${encodeURIComponent(returnTo)}`} replace />;
  }
  return children;
}