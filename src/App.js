import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EmaarDashboardV2 from "./EmaarDashboardV2";
import AdminPanel from "./AdminPanel";
import ProjectManager from "./ProjectManager";
import FixPrices from "./FixPrices";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmaarDashboardV2 />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/manage" element={<ProjectManager />} />
        <Route path="/fix-prices" element={<FixPrices />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
