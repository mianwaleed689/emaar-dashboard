import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EmaarDashboardV2 from "./EmaarDashboardV2";
import AdminPanel from "./AdminPanel";
import SeedData from "./SeedData";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmaarDashboardV2 />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/manage" element={<SeedData />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
