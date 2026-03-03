import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EmaarDashboardV2 from "./EmaarDashboardV2";
import AdminPanel from "./AdminPanel";
import ProjectManager from "./ProjectManager";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmaarDashboardV2 />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/manage" element={<ProjectManager />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
