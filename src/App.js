import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EmaarDashboardV2 from "./EmaarDashboardV2";
import AdminPanel from "./AdminPanel";
import ProjectManager from "./ProjectManager";
import LandingPage from "./LandingPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmaarDashboardV2 />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/manage" element={<ProjectManager />} />
        <Route path="/landing" element={<LandingPage onLoginClick={() => window.location.href = "/"} onSignUpClick={() => window.location.href = "/"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
