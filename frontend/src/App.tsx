import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/layouts/AppShell";
import { AgentsPage } from "@/pages/Agents";
import { Dashboard } from "@/pages/Dashboard";
import { EnvironmentsPage } from "@/pages/Environments";
import { HowItWorksPage } from "@/pages/HowItWorks";
import { KnowledgePage } from "@/pages/Knowledge";
import { RunDetailPage } from "@/pages/RunDetail";
import { RunsPage } from "@/pages/Runs";
import { SettingsPage } from "@/pages/Settings";
import { TicketsPage } from "@/pages/Tickets";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/runs" element={<RunsPage />} />
        <Route path="/runs/:id" element={<RunDetailPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/environments" element={<EnvironmentsPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
