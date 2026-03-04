import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EmaarDashboardV2 from "./EmaarDashboardV2";
import AdminPanel from "./AdminPanel";
import ProjectManager from "./ProjectManager";
import LandingPage from "./LandingPage";
import ErrorBoundary from "./ErrorBoundary";
import NotFound from "./NotFound";
import { I18nProvider } from "./i18n";

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<EmaarDashboardV2 />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/manage" element={<ProjectManager />} />
            <Route path="/landing" element={<LandingPage onLoginClick={() => window.location.href = "/"} onSignUpClick={() => window.location.href = "/"} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
