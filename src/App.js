import React, { useState, useEffect } from "react";
import EmaarDashboardV2 from "./EmaarDashboardV2";
import AdminPanel from "./AdminPanel";
import SeedData from "./SeedData";

function App() {
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "admin") setPage("admin");
      else if (hash === "seed") setPage("seed");
      else setPage("dashboard");
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  if (page === "admin") return <AdminPanel />;
  if (page === "seed") return <SeedData />;
  return <EmaarDashboardV2 />;
}

export default App;
