import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EmaarDashboardV2 from "./EmaarDashboardV2";
import AdminPanel from "./AdminPanel";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmaarDashboardV2 />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
